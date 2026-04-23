# ABHIMAT

Real-time, multi-role deliberation platform for moderated speaking sessions.  
Built for interview-grade system design demonstrations: queue orchestration, stage governance, polling, and official scoring.

## What This System Does

- Runs synchronized live sessions for `member`, `moderator`, `judge`, and `display` roles
- Enforces moderator-controlled speaking windows and queue transitions
- Supports stage-driven flow with an 8-stage lifecycle
- Aggregates multi-official grading and updates team leaderboard
- Streams session state across clients via Supabase Realtime

Active scope intentionally excludes chat and power-card modules.

## Architecture Summary

- **Client (React + Zustand):** role dashboards, local state, realtime subscriptions
- **API (Express):** auth, stage governance, queue control, grading, polling
- **Data (Supabase Postgres):** normalized relational schema + constraints + realtime publication
- **Server authority:** moderator actions mutate canonical state; clients react through API responses + broadcasts

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Zustand, Tailwind CSS, Supabase JS
- **Backend:** Node.js, Express 5, JWT auth, Helmet, CORS, express-rate-limit
- **Data:** Supabase PostgreSQL + Realtime
- **Ops:** GitHub Actions CI, Docker support for client/server

## Repository Layout

```text
abhimat/
├── client/
│   ├── src/
│   │   ├── member/
│   │   ├── moderator/
│   │   ├── display/
│   │   ├── store/
│   │   └── shared/services/api/
│   ├── Dockerfile
│   └── nginx.conf
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── state/
│   ├── Dockerfile
│   ├── supabase_schema.sql
│   └── migration_interview_scope.sql
├── DEPLOYMENT.md
├── INTERVIEW_SCOPE.md
└── PROJECT_STRUCTURE.md
```

## Role Model

- **Member:** raise/lower hand, participate in polls, view queue/session status
- **Moderator:** control stage, buzzer access, speaker lifecycle, polls
- **Judge:** submit official speech grading only
- **Display:** projection-only dashboard for live room display

## Core Flow

1. User authenticates (`/auth/login`)
2. Moderator controls stage and opens raise-hand window
3. Members join queue through constrained buzzer window
4. Moderator approves, revokes, or completes speaker turns
5. Officials grade active turn; final score updates team leaderboard
6. Polls run in parallel with role-restricted controls

## API Surface (Current)

- **Auth:** `/auth/login`, `/auth/me`
- **Session:** `/session/active`, `/session/stage`, `/session/bill-data`, `/session/team-selection`, `/session/raise-hand/*`
- **Queue/Hand:** `/queue`, `/hand/raise`, `/hand/lower`
- **Speaker:** `/speaker/approve/:queueId`, `/speaker/revoke`, `/speaker/done`
- **Polling:** `/polls`, `/polls/active`, `/polls/:id/vote`, `/polls/:id/close`
- **Scoring:** `/moderator/grade/status`, `/moderator/grade`
- **Leaderboard:** `/points`
- **Party:** `/party/:party`, `/party`
- **Health:** `/health`

## Local Development

### 1) Configure Environment

Create env files from examples:
- `server/.env.example`
- `client/.env.example`

### 2) Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3) Initialize Database

Fresh environment:
1. `server/supabase_schema.sql`

Existing/older environment upgrade path:
1. `server/migration_add_bill_data.sql`
2. `server/migration_interview_scope.sql`

### 4) Run Services

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

## Build and Checks

```bash
cd client && npm run build
cd ../server && npm run check
```

## Deployment

Use `DEPLOYMENT.md` for production setup (Supabase + backend + frontend + Docker options).

## CI

CI workflow: `.github/workflows/ci.yml`
- Client: install + production build
- Server: install + syntax checks

## Security Notes

- Auth is role-based with JWT middleware on all protected routes.
- Party endpoints are auth-protected and party-scoped (moderator override).
- Current credential model uses event-style static secrets (party/codes). Replace with hashed passwords + reset flow for internet-facing production use.

## Operational Notes

- Raise-hand window/access state is currently in-memory on the API instance.
- For multi-instance horizontal scaling, move this state to a shared store (Redis or DB-backed lock/state table).
