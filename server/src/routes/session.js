import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { raiseHandAccessStore, raiseHandWindowStore } from "../state/raiseHandState.js";
import { getValidStages } from "../config/stageConfig.js";

const router = express.Router();

/** Row id for `sessions.is_active = true`, or null if none / error. */
async function resolveActiveSessionId() {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    console.error("[sessions] resolveActiveSessionId:", error.code, error.message);
    return null;
  }
  return data?.id ?? null;
}

// GET /session/active
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, title, is_active, stage, current_speaker_id, team_selections, bill_1_data, bill_2_data, created_at, current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)",
      )
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Session fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    let session = data || null;
    if (session?.current_speaker_id && session?.id) {
      const { data: turn, error: turnErr } = await supabase
        .from("speaker_queue")
        .select("speaking_started_at")
        .eq("session_id", session.id)
        .eq("member_id", session.current_speaker_id)
        .eq("status", "speaking")
        .maybeSingle();

      if (turnErr) {
        console.error("Session active speaker_queue fetch:", turnErr);
      }
      session = {
        ...session,
        current_speaker_started_at: turn?.speaking_started_at ?? null,
      };
    } else if (session) {
      session = { ...session, current_speaker_started_at: null };
    }

    res.json({ session });
  } catch (err) {
    console.error("Session fetch exception:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /session/bill-data
router.post("/bill-data", authMiddleware, async (req, res) => {
  if (req.user?.role !== "moderator") {
    return res.status(403).json({ error: "Moderator access required" });
  }

  const { session_id, bill_number, bill_name, bill_summary } = req.body;
  if (!bill_number) {
    return res.status(400).json({ error: "bill_number is required" });
  }

  const activeId = await resolveActiveSessionId();
  if (!activeId) {
    return res.status(400).json({
      error: "No active session in the database. Set exactly one sessions row to is_active = true in Supabase.",
    });
  }
  const bodySid = session_id ? String(session_id).trim() : "";
  if (bodySid && bodySid !== activeId) {
    console.warn(
      "[session/bill-data] Client session_id does not match active session; using active row",
      { bodySid, activeId },
    );
  }

  const col = bill_number === 1 ? "bill_1_data" : "bill_2_data";
  const { data: updated, error } = await supabase
    .from("sessions")
    .update({ [col]: { name: bill_name, summary: bill_summary } })
    .eq("id", activeId)
    .select("id");

  if (error) return res.status(500).json({ error: error.message });
  if (!updated?.length) {
    return res.status(404).json({ error: "Could not update bill data on the active session." });
  }

  // Broadcast
  try {
    await supabase.channel("bill-updates").send({
      type: "broadcast",
      event: "bill:update",
      payload: { sessionId: activeId, bill_number },
    });
  } catch (err) {
    console.error("Failed to broadcast bill update:", err);
  }

  res.json({ success: true });
});

// POST /session/team-selection
router.post("/team-selection", authMiddleware, async (req, res) => {
  if (req.user?.role !== "moderator") {
    return res.status(403).json({ error: "Moderator access required" });
  }

  const { session_id, bill_number, team_a, team_b, startTime } = req.body;
  if (!bill_number) {
    return res.status(400).json({ error: "bill_number is required" });
  }

  const activeId = await resolveActiveSessionId();
  if (!activeId) {
    return res.status(400).json({
      error: "No active session in the database. Set exactly one sessions row to is_active = true in Supabase.",
    });
  }
  const bodySid = session_id ? String(session_id).trim() : "";
  if (bodySid && bodySid !== activeId) {
    console.warn(
      "[session/team-selection] Client session_id does not match active session; using active row",
      { bodySid, activeId },
    );
  }

  const key = bill_number === 1 ? "bill1Round2" : "bill2Round2";

  // Get existing team_selections
  const { data: session } = await supabase
    .from("sessions")
    .select("team_selections")
    .eq("id", activeId)
    .single();

  const currentSelections = session?.team_selections || {};
  const newVal = {
    ...currentSelections,
    [key]: { teamA: team_a, teamB: team_b, startTime: startTime || null }
  };

  const { data: updated, error } = await supabase
    .from("sessions")
    .update({ team_selections: newVal })
    .eq("id", activeId)
    .select("id");

  if (error) return res.status(500).json({ error: error.message });
  if (!updated?.length) {
    return res.status(404).json({ error: "Could not update team selection on the active session." });
  }

  // Broadcast
  try {
    await supabase.channel("team-selection-updates").send({
      type: "broadcast",
      event: "team-selection:update",
      payload: { sessionId: activeId },
    });
  } catch (err) {
    console.error("Failed to broadcast team selection update:", err);
  }

  res.json({ success: true });
});

// POST /session/stage
router.post("/stage", authMiddleware, async (req, res) => {
  if (req.user?.role !== "moderator") {
    return res.status(403).json({ error: "Moderator access required" });
  }

  const session_id = String(req.body.session_id ?? "").trim();
  const stage = req.body.stage;
  if (!stage) {
    return res.status(400).json({ error: "stage is required" });
  }

  const validStages = getValidStages();
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: "Invalid stage value" });
  }

  const activeId = await resolveActiveSessionId();
  if (!activeId) {
    return res.status(400).json({
      error: "No active session in the database. Set exactly one sessions row to is_active = true in Supabase.",
    });
  }
  if (session_id && session_id !== activeId) {
    console.warn(
      "[session/stage] Client session_id does not match active session; using active row",
      { session_id, activeId },
    );
  }

  const { data: updated, error } = await supabase
    .from("sessions")
    .update({ stage })
    .eq("id", activeId)
    .select("id, stage");

  if (error) return res.status(500).json({ error: error.message });
  if (!updated?.length) {
    console.error("[session/stage] No row updated for activeId=%s", activeId);
    return res.status(404).json({
      error: "Could not update stage on the active session.",
    });
  }

  const row = updated[0];

  // Broadcast
  try {
    // Must match client subscription in useSessionStore (global-session-channel).
    await supabase.channel("global-session-channel").send({
      type: "broadcast",
      event: "stage:update",
      payload: { sessionId: row.id, stage: row.stage },
    });
  } catch (err) {
    console.error("Failed to broadcast stage update:", err);
  }

  res.json({ success: true, stage: row.stage, session_id: row.id });
});

// GET /session/raise-hand/status
router.get("/raise-hand/status", authMiddleware, async (req, res) => {
  try {
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return res.json({
        isEnabled: false,
        isWindowActive: false,
        timeRemaining: 0,
      });
    }

    const isEnabled = raiseHandAccessStore.get(session.id) !== false;
    const window = raiseHandWindowStore.get(session.id);
    const now = Date.now();

    let isWindowActive = false;
    let timeRemaining = 0;

    if (window && now < window.windowEnd) {
      isWindowActive = true;
      timeRemaining = Math.max(0, window.windowEnd - now);
    }

    res.json({
      isEnabled,
      isWindowActive,
      timeRemaining,
    });
  } catch (err) {
    console.error("Raise hand status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /session/raise-hand
router.patch("/raise-hand", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const { raise_hand_enabled } = req.body;
    if (typeof raise_hand_enabled !== "boolean") {
      return res
        .status(400)
        .json({ error: "raise_hand_enabled must be a boolean" });
    }

    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, stage")
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return res.status(400).json({ error: "No active session" });
    }

    // Raise hand allowed ONLY in these stages
    const allowedStages = ["BILL1_R1", "BILL1_R2", "BILL2_R1", "BILL2_R2"];
    if (raise_hand_enabled && !allowedStages.includes(session.stage)) {
      return res
        .status(400)
        .json({ error: "Buzzer not allowed in this stage" });
    }

    // Store in memory access state
    raiseHandAccessStore.set(session.id, raise_hand_enabled);

    if (raise_hand_enabled) {
      const now = Date.now();
      const windowEnd = now + 5000; // 5 seconds
      // Strict CONTRACT: raiseHandWindowOpen = true, raiseHandWindowStart = now, raisedTeams = {}
      raiseHandWindowStore.set(session.id, {
        windowStart: now,
        windowEnd,
        pressedMembers: new Set(), // This is the "raisedTeams" from the contract
      });

      // Broadcast 'raiseHand:enabled'
      try {
        await supabase.channel("raise-hand-updates").send({
          type: "broadcast",
          event: "raiseHand:enabled",
          payload: { sessionId: session.id, timeRemaining: 5000 },
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast raise hand enabled:", broadcastErr);
      }

      // Auto-expire window after 5 seconds
      setTimeout(async () => {
        // If the window still exists for this session, close it
        if (raiseHandWindowStore.has(session.id)) {
          raiseHandWindowStore.delete(session.id);
          raiseHandAccessStore.set(session.id, false);

          // Broadcast 'raiseHand:disabled'
          try {
            await supabase.channel("raise-hand-updates").send({
              type: "broadcast",
              event: "raiseHand:disabled",
              payload: { sessionId: session.id },
            });
          } catch (broadcastErr) {
            console.error(
              "Failed to broadcast raise hand disabled:",
              broadcastErr,
            );
          }
        }
      }, 5000);
    } else {
      // Manual disable: Close the window if open
      raiseHandWindowStore.delete(session.id);
      try {
        await supabase.channel("raise-hand-updates").send({
          type: "broadcast",
          event: "raiseHand:disabled",
          payload: { sessionId: session.id },
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast raise hand disabled:", broadcastErr);
      }
    }

    res.json({ success: true, raise_hand_enabled });
  } catch (err) {
    console.error("Raise hand toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
