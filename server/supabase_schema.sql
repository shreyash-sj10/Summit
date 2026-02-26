-- ============================================================
--  ABHIMAT '26 – FULL RESET + CLEAN SCHEMA
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ─── STEP 1: Drop everything cleanly ───────────────────────
drop table if exists power_cards    cascade;
drop table if exists speaker_grades cascade;
drop table if exists team_points    cascade;
drop table if exists poll_votes     cascade;
drop table if exists polls          cascade;
drop table if exists chat_messages  cascade;
drop table if exists speaker_queue  cascade;
drop table if exists sessions       cascade;
drop table if exists members        cascade;
drop table if exists party_details  cascade;

-- Note: DROP TABLE CASCADE above automatically removes tables from supabase_realtime publication

-- ─── STEP 2: Enable UUID extension ────────────────────────
create extension if not exists "pgcrypto";

-- ─── STEP 3: Create tables ─────────────────────────────────

-- MEMBERS
create table members (
  id              uuid primary key default gen_random_uuid(),
  member_id       text unique not null,
  name            text not null,
  party           text not null,
  constituency    text default '',
  alignment       text, -- 'government', 'opposition', or null for neutral/mod
  role            text not null default 'member'
                  check (role in ('member', 'moderator', 'judge', 'display')),
  speeches_count  int not null default 0,
  created_at      timestamptz default now()
);

-- SESSIONS (only 1 can be active at a time)
create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  is_active           boolean not null default false,
  stage               text not null default 'WAITING'
                      check (stage in ('WAITING', 'BILL1_SETUP', 'BILL1_R1', 'BILL1_R2', 'BILL2_SETUP_PREP', 'BILL2_R1', 'BILL2_R2', 'WINNER')),
  current_speaker_id  uuid references members(id) on delete set null,
  
  -- Bill data storage (JSONB)
  bill_1_data         jsonb default '{"name": null, "summary": null}'::jsonb,
  bill_2_data         jsonb default '{"name": null, "summary": null}'::jsonb,
  
  -- Team selections for 1v1 rounds (JSONB)
  team_selections     jsonb default '{"bill1Round2": {"teamA": null, "teamB": null}, "bill2Round2": {"teamA": null, "teamB": null}}'::jsonb,
  
  created_at          timestamptz default now()
);
create unique index sessions_one_active on sessions (is_active) where is_active = true;

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

-- CHAT MESSAGES
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  is_golden   boolean not null default false,
  golden_by_id uuid references members(id) on delete set null,
  created_at  timestamptz default now(),
  golden_at   timestamptz
);
create index chat_session_ts on chat_messages (session_id, created_at desc);
create index chat_golden on chat_messages (session_id, is_golden) where is_golden = true;

-- POLLS
create table polls (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  question    text not null,
  options     jsonb not null default '[]',
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

-- POLL VOTES (1 vote per member per poll enforced by unique constraint)
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
  unique(queue_id, grader_id)
);
create index grades_session_member on speaker_grades (session_id, member_id);

-- POWER CARDS
create table power_cards (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  card_type   text not null check (card_type in ('interrupt', 'add_time', 'challenge')),
  is_used     boolean not null default false,
  granted_at  timestamptz default now(),
  used_at     timestamptz
);
create index cards_session_member on power_cards (session_id, member_id, is_used);

-- PARTY DETAILS
create table party_details (
  id             uuid primary key default gen_random_uuid(),
  party          text unique not null,
  total_members  int not null default 0,
  logo_url       text not null,
  members_data   jsonb not null default '[]',
  created_at     timestamptz default now()
);

-- ─── STEP 4: Row Level Security ────────────────────────────
-- RLS enabled but open for anon reads so Realtime works on client
-- All writes go through server (Express + service_role key)

alter table members        enable row level security;
alter table sessions       enable row level security;
alter table speaker_queue  enable row level security;
alter table chat_messages  enable row level security;
alter table polls          enable row level security;
alter table poll_votes     enable row level security;
alter table team_points    enable row level security;
alter table speaker_grades enable row level security;
alter table power_cards    enable row level security;
alter table party_details  enable row level security;

-- Public read policies (anon + authenticated)
create policy "read_members"      on members        for select using (true);
create policy "read_sessions"     on sessions       for select using (true);
create policy "read_queue"        on speaker_queue  for select using (true);
create policy "read_chat"         on chat_messages  for select using (true);
create policy "read_polls"        on polls          for select using (true);
create policy "read_poll_votes"   on poll_votes     for select using (true);
create policy "read_team_points"  on team_points    for select using (true);
create policy "read_speaker_grades" on speaker_grades for select using (true);
create policy "read_power_cards"  on power_cards    for select using (true);
create policy "read_party_details" on party_details  for select using (true);

-- DEV: Full write access for anon (replace with service_role in production)
create policy "write_members"      on members        for all using (true) with check (true);
create policy "write_sessions"     on sessions       for all using (true) with check (true);
create policy "write_queue"        on speaker_queue  for all using (true) with check (true);
create policy "write_chat"         on chat_messages  for all using (true) with check (true);
create policy "write_polls"        on polls          for all using (true) with check (true);
create policy "write_poll_votes"   on poll_votes     for all using (true) with check (true);
create policy "write_team_points"  on team_points    for all using (true) with check (true);
create policy "write_speaker_grades" on speaker_grades for all using (true) with check (true);
create policy "write_power_cards"  on power_cards    for all using (true) with check (true);
create policy "write_party_details" on party_details  for all using (true) with check (true);


-- ─── STEP 5: Enable Realtime ───────────────────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table speaker_queue;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table team_points;
alter publication supabase_realtime add table power_cards;

-- ─── STEP 6: Seed Data ─────────────────────────────────────

-- Moderator (password = "MOD", member_id = "MOD00001")
insert into members (member_id, name, party, constituency, alignment, role) values
  ('MOD00001', 'Chief Moderator', 'MOD', 'Central Hall', null, 'moderator');

-- Display Account (password = "DASH", member_id = "DASHMOD")
insert into members (member_id, name, party, constituency, alignment, role) values
  ('DASHMOD', 'Main Display', 'DASH', 'System', null, 'display');

-- Judges (password = "JDG", member_id = JDG...)
insert into members (member_id, name, party, constituency, alignment, role) values
  ('JDG10001', 'Judge One', 'JDG', 'Bench A', null, 'judge'),
  ('JDG10002', 'Judge Two', 'JDG', 'Bench B', null, 'judge'),
  ('JDG10003', 'Judge Three', 'JDG', 'Bench C', null, 'judge');

-- Sample members from different parties
-- Password for each = their Party name (e.g. BJP, INC, AAP, TMC)
insert into members (member_id, name, party, constituency, alignment, role) values
  ('BJP10001', 'Rajesh Kumar Sharma',  'BJP', 'Varanasi',       'government', 'member'),
  ('BJP10002', 'Priya Sharma',         'BJP', 'Gandhinagar',    'government', 'member'),
  ('BJP10003', 'Vikram Malhotra',      'BJP', 'Lucknow',        'government', 'member'),
  ('INC20001', 'Arjun Singh',          'INC', 'Amethi',         'opposition', 'member'),
  ('INC20002', 'Priya Mehta',          'INC', 'Raebareli',      'opposition', 'member'),
  ('INC20003', 'Fatima Khan',          'INC', 'Saharanpur',     'opposition', 'member'),
  ('AAP30001', 'Rahul Verma',          'AAP', 'New Delhi East', 'opposition', 'member'),
  ('AAP30002', 'Sunita Yadav',         'AAP', 'Chandni Chowk',  'opposition', 'member'),
  ('TMC40001', 'Saurav Bose',          'TMC', 'Kolkata North',  'opposition', 'member'),
  ('TMC40002', 'Ananya Chatterjee',    'TMC', 'Howrah',         'opposition', 'member');

-- Active session
insert into sessions (title, is_active) values
  ('Budget Debate 2026 – Lok Sabha', true);

-- Leaderboard starting points (all zero)
insert into team_points (session_id, party, points)
select s.id, p.party, 0
from sessions s,
     (values ('BJP'), ('INC'), ('AAP'), ('TMC')) as p(party)
where s.is_active = true;
