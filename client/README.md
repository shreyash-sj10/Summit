# ABHIMAT Frontend

React + Vite frontend for the interview-focused ABHIMAT governance platform.

## Scope (Current)

The frontend intentionally focuses on defendable system flows:
- Role-based portals: `member`, `moderator`, `judge`, `display`
- Real-time queue and floor synchronization
- Stage-governed session flow (8-stage model)
- Polling and leaderboard views
- Official grading workflow

The following modules are intentionally removed from active scope:
- Chat
- Power cards

## Architecture

State is centralized in Zustand stores:
- `useSessionStore`: active session, stage, timer, poll, leaderboard, realtime subscriptions
- `useQueueStore`: queue fetch + realtime refresh + speaker actions
- `useUserStore`: authenticated user profile + role state
- `useRaiseHandWindowStore`: buzzer window state and acknowledgement status

Flow:
`Backend/Supabase Realtime -> Zustand Stores -> Role Dashboards`

## Key Directories

- `src/member`: participant views
- `src/moderator`: moderator/judge views
- `src/display`: projection dashboard
- `src/shared`: API client, auth context, shared UI primitives
- `src/store`: centralized runtime state

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
