# Summit

**Summit** is a real-time, multi-role parliamentary session platform: moderated speaking queues, stage-driven debate flow, polls, multi-official scoring, and a dedicated projection view for the hall.

## Resume-ready (SDE) — what to claim

Use these bullets on a resume or in interviews; they match the shipped code:

- Full-stack **React 19 + Vite** SPA with **Zustand**, **Tailwind**, **PWA**, role-based routing (`member`, `moderator`, `judge`, `display`).
- **Express 5** REST API with **JWT** auth, **Helmet**, **CORS**, **rate limiting** (including tighter limits on hand-raise).
- **Supabase Postgres** as source of truth; **RLS** for read; **service role** on server for writes; **Realtime** for `sessions`, queue, polls, votes, team points.
- **Concurrency-sensitive floor**: 5s raise-hand window, server-side validation, queue priority by `speeches_count` and timestamp.
- **8-stage lifecycle** (waiting → two bills × two rounds including 1v1 → winner); bill JSON, team selections, `current_speaker_started_at` on active session for hall timer sync.
- **CI** (GitHub Actions): client lint + build; server syntax check.

## Deployment-ready — what is done vs. left to you

| Done in repo | You still configure on the host |
|--------------|-----------------------------------|
| Dockerfiles for `client` and `server` | Supabase project + run `supabase_schema.sql` and migrations |
| `GET /health` | Env: `SUPABASE_*`, `JWT_SECRET`, `CLIENT_URL` (comma-separated origins) |
| Production client build (`npm run build`) | Client env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` |
| CI workflow | DNS, TLS, SPA fallback to `index.html` on the CDN |
| CORS allows `http://localhost:5173` + `CLIENT_URL` | Optional: hardening, monitoring, backups |

See **`DEPLOYMENT.md`** for step-by-step hosting and Docker (`summit-server` / `summit-client` image names).

## Product documentation

- **`PRD.md`** — product requirements aligned with the current locked implementation (Summit branding).

## Tech stack

| Layer | Stack |
|-------|--------|
| UI | React 19, Vite 7, React Router 7, Tailwind 4, Framer Motion, Zustand, Axios, vite-plugin-pwa |
| API | Node.js, Express 5, jsonwebtoken, bcryptjs, @supabase/supabase-js (service role) |
| Data | Supabase PostgreSQL + Realtime |

## Repository layout

```text
├── client/          # Vite React app (member, moderator, projection)
├── server/          # Express API + SQL migrations
├── PRD.md
├── DEPLOYMENT.md
└── package.json     # root scripts: npm run dev | start → server
```

The checkout folder on disk may still be named `abhimat` if cloned from the original remote; the **product name in the app and docs is Summit**.

## Local development

1. **Supabase:** create a project; run `server/supabase_schema.sql` (then other migrations as needed per `DEPLOYMENT.md`).
2. **Server:** `cd server && cp .env.example .env` — fill `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`. Optional: `CLIENT_URL=http://localhost:5173`.
3. **Client:** `cd client` — `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:3001` (or rely on Vite proxy for API paths in dev).
4. **Run API:** from repo root `npm run dev` (starts server with watch), or `cd server && npm run dev`.
5. **Run UI:** `cd client && npm run dev` (Vite proxies `/auth`, `/session`, `/hand`, `/queue`, `/speaker`, `/polls`, `/points`, `/moderator`, `/party` to `:3001`).

## API surface (summary)

- **Auth:** `POST /auth/login`, `GET /auth/me`
- **Session:** `GET /session/active` (includes `current_speaker_started_at` when someone is on the floor), `POST /session/stage`, `POST /session/bill-data`, `POST /session/team-selection`, raise-hand status and toggle
- **Queue / hand:** `GET /queue`, `POST /hand/raise`, `DELETE /hand/lower`
- **Speaker:** approve, revoke, done
- **Polls / points / moderator grading / party:** see `server/src/routes/`

## License

Private / team use unless you add an explicit license file.
