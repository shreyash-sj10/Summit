# Project Structure (Interview Scope)

ABHIMAT is organized as a two-tier system:

- `client/` - React application (role-based dashboards + realtime-aware state)
- `server/` - Express API (session governance, queue orchestration, grading, polling)

## Frontend (`client/src`)

- `member/` - participant-facing pages and components
- `moderator/` - moderator and judge controls
- `display/` - projection/dashboard display view
- `store/` - Zustand stores (`session`, `queue`, `user`, `raiseHandWindow`)
- `shared/services/api/` - domain-split API modules:
  - `authApi.js`
  - `sessionApi.js`
  - `queueApi.js`
  - `speakerApi.js`
  - `pollsApi.js`
  - `pointsApi.js`
  - `moderatorApi.js`
  - `partyApi.js`
- `shared/services/api.js` - compatibility barrel export for existing imports

## Backend (`server/src`)

- `routes/` - HTTP endpoints by domain
- `routes/index.js` - centralized route registration
- `middleware/` - auth and role guards
- `state/raiseHandState.js` - in-memory buzzer window/access state
- `config/` - stage behavior configuration

## Active Scope Modules

- Authentication + RBAC
- Session stage governance
- Raise-hand and speaker queue lifecycle
- Polling + leaderboard
- Official grading

Removed from active scope:
- Chat
- Power cards
