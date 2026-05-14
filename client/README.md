# Summit (frontend)

React + Vite SPA for **Summit**: member, moderator/judge, and projection (`/projection`) experiences.

## Scripts

- `npm run dev` — Vite dev server (proxies API routes to `http://localhost:3001` when used with local API).
- `npm run build` — production bundle + PWA assets.

## Environment

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` for production. Local dev can point `VITE_API_URL` at the Express server or rely on the Vite proxy.
