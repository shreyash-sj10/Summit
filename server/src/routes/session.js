import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { raiseHandAccessStore, raiseHandWindowStore } from "../index.js";
import { getValidStages } from "../config/stageConfig.js";
import {
  getStageConstraintMeta,
  mapAppStageToDbStage,
  isBillStageValidForSubmission,
} from "../utils/stageRuntime.js";

const RAISE_WINDOW_DURATION = 5000;

// Broadcast helper
async function broadcastRaiseHandWindowState(
  sessionId,
  isEnabled,
  isWindowActive,
  timeRemaining,
) {
  try {
    await supabase.channel("raise-hand-updates").send({
      type: "broadcast",
      event: "window_state_changed",
      payload: {
        sessionId,
        isEnabled,
        isWindowActive,
        timeRemaining,
      },
    });
  } catch (err) {
    console.error("Failed to broadcast raise hand state:", err);
  }
}

const router = express.Router();

// GET /session/active
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, title, is_active, stage, created_at, bill_1_data, bill_2_data, team_selections, current_speaker:members!sessions_current_speaker_id_fkey(id, name, party, constituency)",
      )
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Session fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Attach bill data using runtime detection of storage columns
    if (data?.id) {
      try {
        const { fetchBillDataForSession } = await import(
          "../utils/billColumns.js"
        );
        const billPayload = await fetchBillDataForSession(data.id);
        if (billPayload?.bill_data) {
          data.bill_data = billPayload.bill_data;
        }
      } catch (billErr) {
        console.warn("Failed to attach bill data for session:", billErr);
      }
    }

    res.json({ session: data || null });
  } catch (err) {
    console.error("Session fetch exception:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /session/stage
router.post("/stage", authMiddleware, async (req, res) => {
  try {
    // Both moderators and perhaps admins can change stage. But let's restrict to moderator.
    if (req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const { session_id, stage } = req.body;

    // Defensive check for required fields
    if (!session_id || !stage) {
      return res
        .status(400)
        .json({ error: "session_id and stage are required" });
    }

    const localValidStages = getValidStages();
    if (!localValidStages.includes(stage)) {
      return res.status(400).json({
        error: "Invalid stage",
        validStages: localValidStages,
      });
    }

    const meta = await getStageConstraintMeta();
    const dbStage = await mapAppStageToDbStage(stage);

    // Validate against DB-allowed values to avoid constraint violations
    if (!meta.allowedValues.includes(dbStage)) {
      return res.status(400).json({
        error: "Invalid stage for current database schema",
        validStages: meta.allowedValues,
      });
    }

    const { error } = await supabase
      .from("sessions")
      .update({ stage: dbStage })
      .eq("id", session_id);

    if (error) {
      console.error("Stage update error:", error);
      // If we still somehow hit the DB check constraint, surface as 400
      if (error.code === "23514") {
        return res.status(400).json({
          error: "Stage violates database constraint sessions_stage_check",
          validStages: meta.allowedValues,
        });
      }
      return res.status(500).json({ error: error.message });
    }

    // If entering a 1v1 round, clear team selections for that specific round
    if (stage === "BILL1_R2" || stage === "BILL2_R2") {
      try {
        const { data: sessionRow, error: fetchError } = await supabase
          .from("sessions")
          .select("team_selections")
          .eq("id", session_id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.warn(
            "Stage change: team_selections fetch warning:",
            fetchError.message,
          );
        }

        const teamSelections = sessionRow?.team_selections || {};
        const roundKey = stage === "BILL1_R2" ? "bill1Round2" : "bill2Round2";

        teamSelections[roundKey] = { teamA: null, teamB: null };

        const { error: updateError } = await supabase
          .from("sessions")
          .update({ team_selections: teamSelections })
          .eq("id", session_id);

        if (updateError && updateError.code !== "PGRST204") {
          console.warn(
            "Stage change: team_selections reset warning:",
            updateError.message,
          );
        }
      } catch (teamSelErr) {
        console.warn(
          "Stage change: failed to reset team_selections for 1v1 round:",
          teamSelErr.message,
        );
      }
    }

    // Broadcast stage change to all connected clients
    try {
      await supabase.channel("global-session-channel").send({
        type: "broadcast",
        event: "stage:update",
        payload: {
          sessionId: session_id,
          stage: dbStage,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (broadcastErr) {
      console.error("Failed to broadcast stage update:", broadcastErr);
      // Don't fail the response if broadcast fails, just log it
    }

    res.json({ success: true, stage: dbStage });
  } catch (err) {
    console.error("Stage update exception:", err);
    res.status(500).json({ error: err.message });
  }
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

    // Get active session (including stage for validation)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, stage")
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return res.status(400).json({ error: "No active session" });
    }

    // When enabling, enforce that the raise-hand window is only opened
    // during the allowed debate stages.
    if (raise_hand_enabled) {
      const meta = await getStageConstraintMeta();
      const currentStage = session.stage;

      let isAllowedStage = false;

      if (meta.mode === "simplified") {
        // Simplified 4-stage schema: WAITING, BILL1, BILL2, WINNER
        // Only allow during BILL1 / BILL2 (debate phases).
        isAllowedStage =
          currentStage === "BILL1" || currentStage === "BILL2";
      } else {
        // Full 8-stage enum – strictly allow only the 4 debate stages.
        const ALLOWED_DEBATE_STAGES = new Set([
          "BILL1_R1",
          "BILL1_R2",
          "BILL2_R1",
          "BILL2_R2",
        ]);
        isAllowedStage = ALLOWED_DEBATE_STAGES.has(currentStage);
      }

      if (!isAllowedStage) {
        return res.status(400).json({
          error:
            "Raise hand window can only be enabled during debate stages (Bill 1/2 — R1 or R2).",
          currentStage,
        });
      }
    }

    // Store in memory
    raiseHandAccessStore.set(session.id, raise_hand_enabled);

    // If enabling, create a new raise-hand window
    if (raise_hand_enabled) {
      const now = Date.now();
      const windowEnd = now + RAISE_WINDOW_DURATION;
      raiseHandWindowStore.set(session.id, {
        windowStart: now,
        windowEnd,
        pressedMembers: new Set(),
      });

      // Broadcast window activation
      await broadcastRaiseHandWindowState(
        session.id,
        true,
        true,
        RAISE_WINDOW_DURATION,
      );

      // Auto-expire window after configured duration (server-authoritative)
      setTimeout(() => {
        if (raiseHandWindowStore.has(session.id)) {
          raiseHandWindowStore.delete(session.id);
        }
        // Keep access flag as last chosen value but mark window inactive
        broadcastRaiseHandWindowState(session.id, true, false, 0);
      }, RAISE_WINDOW_DURATION);
    } else {
      // If disabling, clear the window
      raiseHandWindowStore.delete(session.id);
      await broadcastRaiseHandWindowState(session.id, false, false, 0);
    }

    res.json({ success: true, raise_hand_enabled });
  } catch (err) {
    console.error("Raise hand toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /session/bill-data (Save bill info)
router.post("/bill-data", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const { session_id, bill_number, bill_name, bill_summary } = req.body;

    // Defensive checks
    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    if (![1, 2].includes(bill_number)) {
      return res.status(400).json({ error: "bill_number must be 1 or 2" });
    }

    if (!bill_name || !bill_summary) {
      return res
        .status(400)
        .json({ error: "bill_name and bill_summary are required" });
    }

    // Get current session to check stage
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("stage")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Debug: log the stage the DB currently sees
    console.log("Bill submit stage:", session.stage);

    // Verify stage is correct for bill setup
    const stageVal = session.stage;
    const expectedStage = bill_number === 1 ? "BILL1_SETUP" : "BILL2_SETUP_PREP";

    let isValidStage = stageVal === expectedStage;

    // Emergency fallback: allow any stage that belongs to the same bill family
    if (!isValidStage) {
      if (bill_number === 1 && stageVal?.startsWith("BILL1")) {
        isValidStage = true;
      } else if (bill_number === 2 && stageVal?.startsWith("BILL2")) {
        isValidStage = true;
      }
    }

    if (!isValidStage) {
      return res.status(400).json({
        error: `Bill setup only allowed during ${expectedStage} (or matching bill family) stages`,
        currentStage: stageVal,
        expectedStage,
      });
    }

    const billData = { name: bill_name, summary: bill_summary };

    // Persist bill data using runtime detection of available columns
    try {
      const { updateBillDataForSession } = await import(
        "../utils/billColumns.js"
      );
      const result = await updateBillDataForSession(
        session_id,
        bill_number,
        billData,
      );
      if (result?.error) {
        console.warn("Bill data update warning:", result.error.message);
      }
    } catch (billErr) {
      console.warn("Bill data update exception (non-fatal):", billErr);
    }

    // Broadcast bill data update (frontend may have local state)
    try {
      await supabase.channel("bill-updates").send({
        type: "broadcast",
        event: "bill:update",
        payload: {
          sessionId: session_id,
          billNumber: bill_number,
          billData: billData,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (broadcastErr) {
      console.error("Failed to broadcast bill data update:", broadcastErr);
      // Don't fail the response if broadcast fails
    }

    // Always return success - bill data is stored client-side in Zustand if DB save fails
    res.json({ success: true, bill_data: billData });
  } catch (err) {
    console.error("Bill data save exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /session/team-selection (Save 1v1 team selections)
router.post("/team-selection", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "moderator") {
      return res.status(403).json({ error: "Moderator access required" });
    }

    const { session_id, bill_number, team_a, team_b } = req.body;

    // Defensive checks
    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    if (![1, 2].includes(bill_number)) {
      return res.status(400).json({ error: "bill_number must be 1 or 2" });
    }

    if (!team_a || !team_b || team_a === team_b) {
      return res
        .status(400)
        .json({ error: "team_a and team_b must be different" });
    }

    // Get current team selections (ignore error if column doesn't exist)
    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("team_selections")
      .eq("id", session_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.warn("Team selection fetch warning:", fetchError.message);
    }

    const teamSelections = session?.team_selections || {};
    const roundKey = bill_number === 1 ? "bill1Round2" : "bill2Round2";

    teamSelections[roundKey] = { teamA: team_a, teamB: team_b };

    // Try to save team selections (may fail if column doesn't exist)
    const { error } = await supabase
      .from("sessions")
      .update({ team_selections: teamSelections })
      .eq("id", session_id);

    if (error && error.code !== "PGRST204") {
      console.warn("Team selection update warning:", error.message);
    }

    // Broadcast team selection update
    try {
      await supabase.channel("team-selection-updates").send({
        type: "broadcast",
        event: "team-selection:update",
        payload: {
          sessionId: session_id,
          billNumber: bill_number,
          teamSelection: teamSelections[roundKey],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (broadcastErr) {
      console.error("Failed to broadcast team selection update:", broadcastErr);
      // Don't fail the response if broadcast fails
    }

    // Always return success - team selection stored client-side if DB save fails
    res.json({ success: true, team_selection: teamSelections[roundKey] });
  } catch (err) {
    console.error("Team selection save exception:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
