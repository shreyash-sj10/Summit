# Deployment Guide (Production-Oriented)

This repository is deployment-ready with:
- CI pipeline: `.github/workflows/ci.yml`
- Docker support: `client/Dockerfile`, `server/Dockerfile`
- Runtime validation for required server env vars in `server/src/config/env.js`

## 1) Prerequisites

- Node.js 20+
- Supabase project
- Hosting targets (recommended):
  - Backend: Render / Railway / Fly.io
  - Frontend: Netlify / Vercel

## 2) Database Setup (Supabase)

1. Create a Supabase project.
2. Copy values from Project Settings:
   - Project URL
   - anon key
   - service role key
3. Run SQL in order:
   - `server/supabase_schema.sql`
   - `server/migration_add_bill_data.sql` (for existing environments or safety alignment)
   - `server/migration_interview_scope.sql` (for upgraded environments using prior chat/power-card schema)
   - `server/migration_password_rls.sql` (bcrypt `password_hash` on members + drop anon write RLS policies)

## 3) Backend Deployment

Set Root Directory to `server` and configure:
- Build: `npm ci`
- Start: `npm start`

Required env vars:
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (minimum 32 chars)
- `CLIENT_URL` (comma-separated allowed frontend origins)

Health endpoint:
- `GET /health`

## 4) Frontend Deployment

Set Root Directory to `client` and configure:
- Build: `npm ci && npm run build`
- Publish: `dist`

Required env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (public backend URL)

For SPA routing, keep redirect fallback to `index.html`.

## 5) Docker Option

Backend:
```bash
docker build -t summit-server ./server
docker run --env-file ./server/.env -p 3001:3001 summit-server
```

Frontend:
```bash
docker build -t summit-client ./client
docker run -p 8080:80 summit-client
```

## 6) CI Gate

CI runs on push/PR:
- Client: install + ESLint + production build
- Server: install + syntax check (`npm run check`)

## 7) Production Checklist

- [ ] Schema and migrations applied (including `migration_password_rls.sql` on existing DBs)
- [ ] CORS origins configured via `CLIENT_URL`
- [ ] JWT secret rotated and stored securely
- [ ] `/health` returns `200`
- [ ] Client can authenticate and load `/session/active`
