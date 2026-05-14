-- ============================================================
--  SUMMIT — SINGLE CANONICAL DATABASE SCHEMA (RUN THIS ONCE)
-- ============================================================
--
--  What this file does
--  • FULL RESET for all Summit tables below (data in these tables is deleted).
--  • Creates extensions, tables, indexes, RLS read policies, Realtime publication,
--    and seed data matching the current app (auth, sessions, bills, queue, polls).
--
--  How to use (Supabase)
--  1. Open your project → SQL Editor → New query.
--  2. Paste this ENTIRE file.
--  3. Click Run once.
--  4. You do NOT need to run migration_*.sql after this for a fresh project.
--
--  When to use other files
--  • migration_*.sql — only if you MUST keep existing rows and cannot run this
--    reset (incremental patches). For a clean Summit DB, ignore them.
--
-- ============================================================

-- ─── STEP 0: Remove deprecated prototype tables (if present) ─
drop table if exists chat_messages cascade;
drop table if exists power_cards cascade;

-- ─── STEP 1: Drop Summit tables (order respects FKs) ─────────
drop table if exists speaker_grades cascade;
drop table if exists team_points cascade;
drop table if exists poll_votes cascade;
drop table if exists polls cascade;
drop table if exists speaker_queue cascade;
drop table if exists sessions cascade;
drop table if exists members cascade;
drop table if exists party_details cascade;

-- CASCADE removes dependent objects; tables may leave supabase_realtime — we re-add below.

-- ─── STEP 2: Extensions ──────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── STEP 3: Tables ──────────────────────────────────────────

-- MEMBERS
create table members (
  id              uuid primary key default gen_random_uuid(),
  member_id       text unique not null,
  name            text not null,
  party           text not null,
  constituency    text default '',
  alignment       text,
  role            text not null default 'member'
                  check (role in ('member', 'moderator', 'judge', 'display')),
  speeches_count  int not null default 0,
  password_hash   text,
  created_at      timestamptz default now()
);

-- SESSIONS (exactly one row should have is_active = true at runtime)
create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  is_active           boolean not null default false,
  stage               text not null default 'WAITING'
                      check (stage in (
                        'WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2',
                        'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER'
                      )),
  current_speaker_id  uuid references members(id) on delete set null,
  bill_1_data         jsonb default '{"name": null, "summary": null}'::jsonb,
  bill_2_data         jsonb default '{"name": null, "summary": null}'::jsonb,
  team_selections     jsonb default '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb,
  created_at          timestamptz default now()
);

create unique index sessions_one_active on sessions (is_active) where (is_active = true);

-- SPEAKER QUEUE
create table speaker_queue (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references sessions(id) on delete cascade,
  member_id            uuid not null references members(id) on delete cascade,
  status               text not null default 'waiting'
                       check (status in ('waiting', 'speaking', 'done', 'skipped')),
  priority_score       float not null default 0,
  raised_at            timestamptz default now(),
  speaking_started_at  timestamptz
);
create index sq_session_status on speaker_queue (session_id, status);

-- POLLS
create table polls (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  question    text not null,
  options     jsonb not null default '[]',
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

-- POLL VOTES
create table poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  option_id   int not null,
  unique (poll_id, member_id)
);

-- TEAM POINTS
create table team_points (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  party       text not null,
  points      int not null default 0,
  unique (session_id, party)
);

-- SPEAKER GRADES
create table speaker_grades (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references sessions(id) on delete cascade,
  member_id      uuid not null references members(id) on delete cascade,
  queue_id       uuid not null references speaker_queue(id) on delete cascade,
  grader_id      uuid not null references members(id) on delete cascade,
  speaking       int not null check (speaking between 0 and 10),
  relevance      int not null check (relevance between 0 and 10),
  preparedness   int not null check (preparedness between 0 and 10),
  poll_score     float not null default 0 check (poll_score between 0 and 10),
  total_points   float not null,
  created_at     timestamptz default now(),
  unique (queue_id, grader_id)
);
create index grades_session_member on speaker_grades (session_id, member_id);

-- PARTY DETAILS
create table party_details (
  id             uuid primary key default gen_random_uuid(),
  party          text unique not null,
  total_members  int not null default 0,
  logo_url       text not null,
  members_data   jsonb not null default '[]',
  created_at     timestamptz default now()
);

-- ─── STEP 4: Row Level Security (read-only for anon/auth) ────
alter table members        enable row level security;
alter table sessions       enable row level security;
alter table speaker_queue  enable row level security;
alter table polls          enable row level security;
alter table poll_votes     enable row level security;
alter table team_points    enable row level security;
alter table speaker_grades enable row level security;
alter table party_details  enable row level security;

create policy "read_members"        on members         for select using (true);
create policy "read_sessions"      on sessions        for select using (true);
create policy "read_queue"        on speaker_queue  for select using (true);
create policy "read_polls"        on polls           for select using (true);
create policy "read_poll_votes"   on poll_votes      for select using (true);
create policy "read_team_points"  on team_points     for select using (true);
create policy "read_speaker_grades" on speaker_grades for select using (true);
create policy "read_party_details" on party_details   for select using (true);

-- Remove legacy anon write policies if a previous DB had them (idempotent)
drop policy if exists "write_members" on members;
drop policy if exists "write_sessions" on sessions;
drop policy if exists "write_queue" on speaker_queue;
drop policy if exists "write_polls" on polls;
drop policy if exists "write_poll_votes" on poll_votes;
drop policy if exists "write_team_points" on team_points;
drop policy if exists "write_speaker_grades" on speaker_grades;
drop policy if exists "write_party_details" on party_details;

-- ─── STEP 5: Supabase Realtime publication ───────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table speaker_queue;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table team_points;

-- ─── STEP 6: Seed data ───────────────────────────────────────

insert into members (member_id, name, party, constituency, alignment, role, password_hash) values
  ('MOD00001', 'Chief Moderator', 'MOD', 'Central Hall', null, 'moderator', crypt('mod', gen_salt('bf')));

insert into members (member_id, name, party, constituency, alignment, role, password_hash) values
  ('DASHMOD', 'Main Display', 'DASH', 'System', null, 'display', crypt('dash', gen_salt('bf')));

insert into members (member_id, name, party, constituency, alignment, role, password_hash) values
  ('JDG10001', 'Judge One', 'JDG', 'Bench A', null, 'judge', crypt('jdg', gen_salt('bf'))),
  ('JDG10002', 'Judge Two', 'JDG', 'Bench B', null, 'judge', crypt('jdg', gen_salt('bf'))),
  ('JDG10003', 'Judge Three', 'JDG', 'Bench C', null, 'judge', crypt('jdg', gen_salt('bf')));

insert into members (member_id, name, party, constituency, alignment, role, password_hash) values
  ('BJP10001', 'Rajesh Kumar Sharma',  'BJP', 'Varanasi',       'government', 'member', crypt('bjp', gen_salt('bf'))),
  ('BJP10002', 'Priya Sharma',         'BJP', 'Gandhinagar',    'government', 'member', crypt('bjp', gen_salt('bf'))),
  ('BJP10003', 'Vikram Malhotra',      'BJP', 'Lucknow',        'government', 'member', crypt('bjp', gen_salt('bf'))),
  ('INC20001', 'Arjun Singh',          'INC', 'Amethi',         'opposition', 'member', crypt('inc', gen_salt('bf'))),
  ('INC20002', 'Priya Mehta',          'INC', 'Raebareli',      'opposition', 'member', crypt('inc', gen_salt('bf'))),
  ('INC20003', 'Fatima Khan',          'INC', 'Saharanpur',     'opposition', 'member', crypt('inc', gen_salt('bf'))),
  ('AAP30001', 'Rahul Verma',          'AAP', 'New Delhi East', 'opposition', 'member', crypt('aap', gen_salt('bf'))),
  ('AAP30002', 'Sunita Yadav',         'AAP', 'Chandni Chowk',  'opposition', 'member', crypt('aap', gen_salt('bf'))),
  ('TMC40001', 'Saurav Bose',          'TMC', 'Kolkata North',  'opposition', 'member', crypt('tmc', gen_salt('bf'))),
  ('TMC40002', 'Ananya Chatterjee',    'TMC', 'Howrah',         'opposition', 'member', crypt('tmc', gen_salt('bf')));

insert into sessions (title, is_active, stage, bill_1_data, bill_2_data, team_selections) values (
  'Budget Debate 2026 – Lok Sabha',
  true,
  'WAITING',
  '{"name": null, "summary": null}'::jsonb,
  '{"name": null, "summary": null}'::jsonb,
  '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb
);

insert into team_points (session_id, party, points)
select s.id, p.party, 0
from sessions s,
     (values ('BJP'), ('INC'), ('AAP'), ('TMC')) as p(party)
where s.is_active = true;

-- Done. Use Member ID MOD00001 / password mod to log in as moderator.
