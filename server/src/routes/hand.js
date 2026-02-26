import express from "express";
import { supabase } from "../supabase.js";
import { authMiddleware, moderatorOnly } from "../middleware/auth.js";
import { raiseHandAccessStore, raiseHandWindowStore } from "../index.js";
import { MAX_SPEECHES_PER_BILL } from "../config/constants.js";

const router = express.Router();

// POST /hand/raise  — concurrency-safe via RPC
router.post("/raise", authMiddleware, async (req, res) => {
  const memberId = req.user.id;

  // Get active session
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!session) return res.status(400).json({ error: "No active session" });

  // Check if raise hand is enabled (from in-memory store, default to true)
  const isRaiseHandEnabled = raiseHandAccessStore.get(session.id) !== false;
  if (!isRaiseHandEnabled) {
    return res.status(403).json({
      error: "Moderator has disabled raise hand access for participants",
    });
  }

  // Check if we have an active window and if member already pressed in this window
  const window = raiseHandWindowStore.get(session.id);
  if (!window) {
    return res.status(403).json({
      error: "Raise hand window is not active",
    });
  }

  const now = Date.now();
  if (now > window.windowEnd) {
    // Window expired
    raiseHandWindowStore.delete(session.id);
    return res.status(403).json({
      error: "Raise hand window has expired",
    });
  }

  // Check if this member already pressed in this window
  if (window.pressedMembers.has(memberId)) {
    return res.status(409).json({
      error: "You have already raised your hand in this window",
    });
  }

  // Check if already in queue (existing check)
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

  // Priority score: fewer speeches = lower number = higher priority
  const speechCount = req.user.speeches_count || 0;

  // Check if user has exhausted speeches (max allowed per bill)
  if (speechCount >= MAX_SPEECHES_PER_BILL) {
    return res.status(403).json({ error: "You have no chances left to speak" });
  }

  const priorityScore = speechCount * 10;

  const { data, error } = await supabase
    .from("speaker_queue")
    .insert({
      session_id: session.id,
      member_id: memberId,
      status: "waiting",
      priority_score: priorityScore,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Record that this member pressed in this window
  window.pressedMembers.add(memberId);

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

// GET /hand/cards
// Fetches available power cards for the logged-in user
router.get("/cards", authMiddleware, async (req, res) => {
  const { data: session } = await supabase
    .from("sessions")
    .select("id, stage")
    .eq("is_active", true)
    .single();

  if (!session) return res.json({ cards: [] });

  const { data, error } = await supabase
    .from("power_cards")
    .select("*")
    .eq("session_id", session.id)
    .eq("member_id", req.user.id)
    .eq("is_used", false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ cards: data || [], current_stage: session.stage });
});

// POST /hand/use-power-card
// Activates a power card
router.post("/use-power-card", authMiddleware, async (req, res) => {
  const { card_id, target_member_id } = req.body;

  // 1. Get active session & stage
  const { data: session } = await supabase
    .from("sessions")
    .select("id, stage, current_speaker_id")
    .eq("is_active", true)
    .single();

  if (!session) return res.status(400).json({ error: "No active session" });

  // 2. Verify card ownership and unused status
  const { data: card } = await supabase
    .from("power_cards")
    .select("*")
    .eq("id", card_id)
    .eq("member_id", req.user.id)
    .eq("is_used", false)
    .single();

  if (!card)
    return res.status(400).json({ error: "Invalid or already used card" });

  // 3. Stage constraints
  if (card.card_type === "challenge" && session.stage !== "one_on_one") {
    return res
      .status(400)
      .json({ error: "Challenge card can only be used in One on One stage" });
  }

  // 4. Mark as used
  const { error: updateError } = await supabase
    .from("power_cards")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", card_id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  if (updateError) return res.status(500).json({ error: updateError.message });

  // The actual timer logic (20s interrupt, +60s add time, challenge logic)
  // will be handled by the frontend upon receiving this success response,
  // possibly combined with Realtime broadcasts.
  try {
    await supabase.channel("global-session-channel").send({
      type: "broadcast",
      event: "card_used",
      payload: {
        card_type: card.card_type,
        user_name: req.user.name,
        user_id: req.user.id,
        target_member_id,
      },
    });
  } catch (err) {
    console.error("Failed to broadcast card usage", err);
  }

  res.json({
    success: true,
    card_type: card.card_type,
    user: req.user.id,
    target_member_id,
  });
});

export default router;
