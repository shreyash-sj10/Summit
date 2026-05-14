-- ============================================================
-- OPTIONAL incremental patch (old DBs only — keeps existing rows).
-- For a complete, correct schema: run server/supabase_schema.sql ONCE instead.
-- ============================================================
-- Migration: Summit sessions columns + stage model (NON-DESTRUCTIVE)
-- Requires: public.sessions and public.members already exist.
-- ============================================================

-- ─── 1) JSONB columns the API reads/writes ───────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS bill_1_data jsonb DEFAULT '{"name": null, "summary": null}'::jsonb;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS bill_2_data jsonb DEFAULT '{"name": null, "summary": null}'::jsonb;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS team_selections jsonb DEFAULT '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb;

-- Backfill nulls (if column existed but was never set)
UPDATE sessions
SET bill_1_data = '{"name": null, "summary": null}'::jsonb
WHERE bill_1_data IS NULL;

UPDATE sessions
SET bill_2_data = '{"name": null, "summary": null}'::jsonb
WHERE bill_2_data IS NULL;

UPDATE sessions
SET team_selections = '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb
WHERE team_selections IS NULL;

-- ─── 2) current_speaker_id (for floor / GET /session/active embed) ─
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS current_speaker_id uuid REFERENCES members(id) ON DELETE SET NULL;

-- ─── 3) One active session at a time (partial unique index) ──
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active ON sessions (is_active) WHERE (is_active = true);

-- ─── 4) Normalize legacy stage labels BEFORE new CHECK ───────
UPDATE sessions SET stage = 'WAITING' WHERE stage IN ('waiting_room', 'WAITING_ROOM');
UPDATE sessions SET stage = 'BILL1_R1' WHERE stage IN ('first_bill', 'FIRST_BILL', 'BILL1');
UPDATE sessions SET stage = 'BILL1_R2' WHERE stage IN ('one_on_one', 'ONE_ON_ONE');
UPDATE sessions SET stage = 'BILL2_R1' WHERE stage IN ('third_round', 'THIRD_ROUND', 'BILL2');
UPDATE sessions SET stage = 'WAITING' WHERE stage IS NULL;

-- Any value still outside the 8-stage set → WAITING (avoids ADD CONSTRAINT failure)
UPDATE sessions
SET stage = 'WAITING'
WHERE stage NOT IN (
  'WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2',
  'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER'
);

-- ─── 5) Replace stage CHECK with Summit 8-stage model ────────
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_stage_check;
ALTER TABLE sessions
  ADD CONSTRAINT sessions_stage_check
  CHECK (stage IN (
    'WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2',
    'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER'
  ));

-- ─── 6) Realtime: ensure sessions is published (idempotent) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
