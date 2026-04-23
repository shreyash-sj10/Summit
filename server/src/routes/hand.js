import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { raiseHandAccessStore, raiseHandWindowStore } from "../state/raiseHandState.js";

const router = express.Router();

// POST /hand/raise  — concurrency-safe via RPC
router.post("/raise", authMiddleware, async (req, res) => {
  const memberId = req.user.id;

  // Get active session
  const { data: session } = await supabase
    .from("sessions")
    .select("id, stage")
    .eq("is_active", true)
    .single();

  if (!session) return res.status(400).json({ error: "No active session" });

  const window = raiseHandWindowStore.get(session.id);

  if (!window) {
    return res.status(403).json({
      error: "Raise hand window is not active",
      reason: "WINDOW_NOT_FOUND",
      sessionId: session.id,
      stage: session.stage
    });
  }

  const now = Date.now();
  if (now > window.windowEnd) {
    // Window expired
    raiseHandWindowStore.delete(session.id);
    return res.status(403).json({
      error: "Raise hand window has expired",
      reason: "WINDOW_EXPIRED",
      now,
      windowEnd: window.windowEnd
    });
  }

  // Strict CONTRACT: team not already in raisedTeams
  if (window.pressedMembers.has(memberId)) {
    return res.status(409).json({
      error: "You have already raised your hand in this window",
    });
  }

  // Check if already in queue
  const { data: existing } = await supabase
    .from("speaker_queue")
    .select("id, status")
    .eq("session_id", session.id)
    .eq("member_id", memberId)
    .in("status", ["waiting", "speaking"])
    .maybeSingle();

  if (existing)
    return res
      .status(409)
      .json({ error: "Already in queue", status: existing.status });

  // Check if user has exhausted speeches (max 2 chances)
  // AUTHORITATIVE: Fetch from DB, don't rely on token which can be stale
  const { data: member } = await supabase
    .from("members")
    .select("speeches_count")
    .eq("id", memberId)
    .single();

  const speechCount = member?.speeches_count || 0;
  if (speechCount >= 2) {
    return res.status(403).json({
      error: "You have no chances left to speak",
      reason: "NO_CHANCES_LEFT",
      speechCount
    });
  }

  // Use precise timestamp for sub-second priority sorting
  const preciseTimestamp = new Date().toISOString();

  const { data, error } = await supabase
    .from("speaker_queue")
    .insert({
      session_id: session.id,
      member_id: memberId,
      status: "waiting",
      priority_score: speechCount * 10,
      raised_at: preciseTimestamp // Explicitly set to ensure server-side consistency
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Strict CONTRACT: Store raisedTeams[teamId] = Date.now()
  window.pressedMembers.add(memberId);

  // Broadcast acknowledgement
  try {
    await supabase.channel("raise-hand-updates").send({
      type: "broadcast",
      event: "raiseHand:acknowledged",
      payload: { sessionId: session.id, memberId },
    });
  } catch (broadcastErr) {
    console.error("Failed to broadcast acknowledgement", broadcastErr);
  }

  res.status(201).json({ entry: data });
});

// DELETE /hand/lower
router.delete("/lower", authMiddleware, async (req, res) => {
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!session) return res.status(400).json({ error: "No active session" });

  const { error } = await supabase
    .from("speaker_queue")
    .update({ status: "skipped" })
    .eq("session_id", session.id)
    .eq("member_id", req.user.id)
    .eq("status", "waiting");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
