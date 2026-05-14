-- ============================================================
-- OPTIONAL incremental patch (old DBs only).
-- For a complete, correct schema: run server/supabase_schema.sql ONCE instead.
-- ============================================================
-- Migration: Interview Scope Hardening (Summit)
-- ============================================================

-- 1) Remove old stage constraint and apply canonical constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_stage_check;
ALTER TABLE sessions
  ADD CONSTRAINT sessions_stage_check
  CHECK (stage IN ('WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2', 'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER'));

-- Optional data normalization for legacy rows
UPDATE sessions SET stage = 'WAITING' WHERE stage IN ('waiting_room', 'WAITING_ROOM');
UPDATE sessions SET stage = 'BILL1_R1' WHERE stage IN ('first_bill', 'FIRST_BILL');
UPDATE sessions SET stage = 'BILL1_R2' WHERE stage IN ('one_on_one', 'ONE_ON_ONE');
UPDATE sessions SET stage = 'BILL2_R1' WHERE stage IN ('third_round', 'THIRD_ROUND');

-- 2) Drop deprecated feature tables
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS power_cards CASCADE;

-- 3) Remove from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'power_cards'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.power_cards';
  END IF;
END
$$;
