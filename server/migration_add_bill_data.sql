-- ============================================================
-- Migration: Add bill data and team selections to sessions table
-- Run this against existing Supabase instances to update schema
-- ============================================================

-- Update stage constraint to use new 8-stage system
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_stage_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_stage_check CHECK (stage IN ('WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2', 'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER'));

-- Add new columns for bill data
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS bill_1_data jsonb DEFAULT '{"name": null, "summary": null}'::jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS bill_2_data jsonb DEFAULT '{"name": null, "summary": null}'::jsonb;

-- Add new column for team selections
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS team_selections jsonb DEFAULT '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb;

-- Ensure Realtime picks up member profile updates (client subscribes to members)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  END IF;
END
$$;

-- Update existing sessions to use new stage format (if migrating from old system)
-- Uncomment and modify if needed:
-- UPDATE sessions SET stage = 'WAITING' WHERE stage = 'waiting_room';
-- UPDATE sessions SET stage = 'BILL1_R1' WHERE stage = 'first_bill';
-- UPDATE sessions SET stage = 'BILL1_R2' WHERE stage = 'one_on_one';
-- UPDATE sessions SET stage = 'BILL2_R1' WHERE stage = 'third_round';
