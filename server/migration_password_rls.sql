-- ============================================================
-- Migration: Password hashing + tighten RLS writes
-- Run in Supabase SQL Editor AFTER:
--   - server/migration_add_bill_data.sql
--   - server/migration_interview_scope.sql (if applicable)
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) Add password hash column (nullable for backwards compatibility during rollout)
alter table members add column if not exists password_hash text;

-- 2) Backfill bcrypt hashes for known demo accounts (idempotent-ish: only fills NULL)
update members
set password_hash = crypt('mod', gen_salt('bf'))
where member_id = 'MOD00001' and password_hash is null;

update members
set password_hash = crypt('dash', gen_salt('bf'))
where member_id = 'DASHMOD' and password_hash is null;

update members
set password_hash = crypt('jdg', gen_salt('bf'))
where role = 'judge' and password_hash is null;

update members m
set password_hash = crypt(lower(m.party), gen_salt('bf'))
where m.role = 'member' and m.password_hash is null;

-- 3) Remove permissive anon write policies (if they exist from older schema dumps)
drop policy if exists "write_members" on members;
drop policy if exists "write_sessions" on sessions;
drop policy if exists "write_queue" on speaker_queue;
drop policy if exists "write_polls" on polls;
drop policy if exists "write_poll_votes" on poll_votes;
drop policy if exists "write_team_points" on team_points;
drop policy if exists "write_speaker_grades" on speaker_grades;
drop policy if exists "write_party_details" on party_details;
