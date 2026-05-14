# Summit — Product Requirements Document (As Built)

This PRD describes **Summit** as implemented and locked in the repository: purpose, roles, behavior, data model, APIs, and boundaries. It reflects the **current codebase**, not a future roadmap.

---

## 1. Purpose and goals

### Problem

Run a **live model parliamentary (Lok Sabha–style) session** with one coordinated “floor”: stages, speaker queue, timed speaking aligned to server time, polls, team scoring, and a **large-screen projection** view.

### Goals

- Single **active session** at a time with a clear **8-stage** lifecycle.
- **Role separation**: members participate; moderators govern; judges grade; display is read-only projection.
- **Authoritative server** for mutations; clients observe via REST + Supabase Realtime.
- **Hall timer** stays consistent after refresh using **`current_speaker_started_at`** on the active session payload.

### Product name

All user-facing surfaces and documentation use **Summit**. Auth persistence uses keys `summit_token` / `summit_user`.

---

## 2. Personas and access

| Role | Route(s) | Capabilities (implemented) |
|------|-----------|----------------------------|
| `member` | `/member` | View session/stage/bills; raise/lower hand in window; vote in polls; party details for own party; speeches capped at **2** for buzzer eligibility. |
| `moderator` | `/moderator` | Full floor control: stage, buzzer, bill setup, team selection, speaker approve/revoke/done, polls, **poll_score** in grading. |
| `judge` | `/moderator` (shared shell) | Rubric grades only (speaking, relevance, preparedness); no stage/poll/queue control via API. |
| `display` | `/projection` | Projection UI only. Account `DASHMOD` is restricted to projection routes in the client router. |

---

## 3. Stage model (canonical)

Database constraint (8 values):  
`WAITING`, `BILL1_SETUP`, `BILL1_R1`, `BILL1_R2`, `BILL2_SETUP_PREP`, `BILL2_R1`, `BILL2_R2`, `WINNER`.

Server `stageConfig.js` defines per-stage flags (buzzer, scoring, 1v1, speech durations **60s / 90s**, bill 2 prep duration, etc.). Client `stageBehaviors.js` mirrors UX rules (e.g. `getSpeechDuration` for timer limits).

---

## 4. Features and acceptance criteria

### 4.1 Authentication

- **POST `/auth/login`**: `member_id` (normalized uppercase) + password; bcrypt against `password_hash` or legacy party-password if hash missing.
- **JWT** (12h) returned; stored client-side as `summit_token`; profile as `summit_user`.
- **GET `/auth/me`**: refresh profile.

### 4.2 Active session

- **GET `/session/active`**: active session row with nested `current_speaker` (member fields), `bill_1_data` / `bill_2_data`, `team_selections`, `stage`, and **`current_speaker_started_at`** when the current speaker has a `speaker_queue` row in `speaking` status.

### 4.3 Stage and content

- **POST `/session/stage`**: moderator only; validates stage enum; updates DB; broadcast optional (Postgres Realtime refetches clients).
- **POST `/session/bill-data`**: moderator; JSON bill name/summary per bill number.
- **POST `/session/team-selection`**: moderator; merges `bill1Round2` / `bill2Round2` with optional **`startTime`** for 1v1 countdown persistence.

### 4.4 Raise hand (“buzzer”)

- Moderator **PATCH `/session/raise-hand`**: enables only in debate stages; opens **5s** in-memory window; broadcasts enable/disable.
- Member **POST `/hand/raise`**: requires active window; dedupes; enforces max **2** speeches via `speeches_count`; queue insert with priority.
- **DELETE `/hand/lower`**: member skips own `waiting` row.

### 4.5 Speaker floor

- **PATCH `/speaker/approve/:queueId`**: sets `current_speaker_id`, queue `speaking`, `speaking_started_at`.
- **PATCH `/speaker/revoke`** / **`done`**: updates queue, increments `speeches_count`, clears `current_speaker_id`.

### 4.6 Timer (locked behavior)

- Client **`timerLimit`** follows **`getSpeechDuration(stage)`** (60 vs 90).
- When **`current_speaker_started_at`** is present, client **`syncTimerWithStartedAt`** aligns elapsed seconds to server time and restarts interval on refetch.

### 4.7 Polls

- Create / active / vote / close; close may add **party points**; one vote per member per poll (DB unique).

### 4.8 Grading and leaderboard

- Judges: rubric 0–10 each; moderator: **poll_score** 0–10 only.
- **Four** grade rows per `queue_id` trigger sum applied to speaker’s party in **`team_points`**.
- **GET `/points`**: leaderboard for session.

### 4.9 Party registry

- **GET `/party/:party`**: moderator any party; member own party only.
- **POST `/party`**: upsert party metadata (logo, roster JSON).

### 4.10 Projection

- **WAITING**: branded waiting layout.
- **Debate stages**: queue, bill, speaker, timer, leaderboard via `UnifiedProjectionLayout`.
- **WINNER**: full-screen results with leading party highlight + `ProjectionLeaderboard`.

---

## 5. Data model (Supabase)

Tables: `members`, `sessions` (at most one `is_active`), `speaker_queue`, `polls`, `poll_votes`, `team_points`, `speaker_grades`, `party_details`.

Realtime publication includes: `sessions`, `speaker_queue`, `polls`, `poll_votes`, `team_points` (see `supabase_schema.sql`).

Legacy **chat** and **power_cards** tables (if any) are dropped inside `supabase_schema.sql`.

---

## 6. Non-goals / constraints

- Raise-hand **window state** is in-process on the API server (single-instance assumption for exact buzzer semantics unless moved to Redis/DB later).
- **GitHub / folder name** may still be `abhimat` on disk or remote; product branding is **Summit**.

---

## 7. Success metrics (operational, not instrumented in-app)

- Session reaches **WINNER** without manual DB repair.
- Poll participation rate; grading completion within a turn; timer drift within one second after reload.

---

## 8. Dependencies

- Supabase (URL, anon key on client; service role on server).
- `JWT_SECRET`, `CLIENT_URL` for production CORS (localhost allowed for dev).

---

## 9. Traceability

| Area | Location |
|------|----------|
| Routes | `server/src/routes/*.js` |
| Stages | `server/src/config/stageConfig.js`, `client/src/shared/utils/stageBehaviors.js` |
| Session + speaker start | `server/src/routes/session.js` |
| Client session store | `client/src/store/useSessionStore.js` |
| Projection | `client/src/display/pages/ProjectionPage.jsx` |
| Schema | `server/supabase_schema.sql` |
