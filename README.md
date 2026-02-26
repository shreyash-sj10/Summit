# Abhimat '26 – Debate & Parliamentary Simulation Platform

Abhimat '26 is a real-time, interactive, multi-role web application designed for parliamentary debates and political simulations. It features a live speaker queue, multi-tier grading, live chat, interactive polling, and a dynamic "Power Card" system that allows delegates to challenge, add time, or interrupt speakers.

The application is split into two primary environments:
- **Client**: React + Vite + Tailwind CSS frontend.
- **Server**: Node.js + Express backend interacting securely with Supabase.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS v4, Axios, Workbox (PWA support), Supabase JS Client (for real-time subscriptions).
- **Backend**: Express.js, Supabase (PostgreSQL), JSON Web Tokens (JWT), Cors, Helmet, express-rate-limit.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) and Realtime webhooks.

---

## 📂 Project Structure

```text
Abhimat/
├── client/                     # React Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── member/             # Member/Delegate specific views & components
│   │   ├── moderator/          # Moderator & Judge specific views & components
│   │   ├── pages/              # Shared pages (Login/Landing)
│   │   ├── shared/             # Shared components, context (Auth), and API services
│   │   ├── App.jsx             # React Router setup
│   │   └── main.jsx            # React root injection
│   ├── package.json
│   └── vite.config.js          
├── server/                     # Express Backend
│   ├── src/
│   │   ├── middleware/         # Auth & Role guards (authMiddleware, officialOnly)
│   │   ├── routes/             # API Endpoints (auth, queue, session, hand, polls, points, moderator, party)
│   │   ├── index.js            # Server entry point
│   │   └── supabase.js         # Supabase service role client setup
│   ├── .env                    # Environment variables (Supabase URL & Keys, JWT Secret)
│   ├── package.json
│   └── supabase_schema.sql     # Complete database schema, RLS policies, and seed data
└── README.md                   # You are here!
```

---

## 🔐 User Roles & Login Process

The application categorizes users into three distinct roles. All authentication happens at the root path (`/`).

1. **Member (Delegate)**
   - **Login ID**: Assigned `member_id` (e.g., `BJP10001`, `INC20001`).
   - **Password**: Their assigned party name (e.g., `BJP`, `INC`, `AAP`, `TMC`).
   - **Capabilities**: Can raise hand, view live queue, participate in polls, use live chat, view party members, and play "Power Cards" once unlocked.

2. **Moderator**
   - **Login ID**: Assigned `member_id` (e.g., `MOD00001`).
   - **Password**: `MOD`
   - **Capabilities**: Full control over the floor. Can approve/revoke speakers, change event stage, create live polls, and award up to 10 "Poll Score" points to the current speaker.

3. **Judge**
   - **Login ID**: Assigned `member_id` (e.g., `JDG10001`, `JDG10002`).
   - **Password**: `JDG`
   - **Capabilities**: Accesses the Moderator Dashboard but in a highly restricted mode. Judges cannot manage the queue, stage, or polls. Their sole responsibility is to grade the current speaker on 3 parameters (Speaking, Relevance, Preparedness) out of 10 points each.

---

## 🎯 Features & Workflow

### 1. The Floor & Queue System
- Members click "Raise Hand" to join the queue.
- The Moderator approves the next speaker.
- A live timer automatically starts and is synchronized across all clients via Supabase Realtime.
- The Moderator dictates when an ongoing speech is "Done", placing the speaker back into the pool, or "Revokes" their mic (which still counts as a spoken turn).

### 2. Event Stages
Controlled by the Moderator, the event progresses through three stages:
- **First Bill**: Introductory stage. No power cards can be used.
- **One on One**: Mid-stage. `Interrupt` and `Challenge` cards can be used.
- **Third Round**: Final stage. All cards, including `Add Time`, can be used.

### 3. Multi-Judge Grading System
Every speaker turn is strictly bound to a `queue_id`.
- **Judges (3 total)**: Grade on Speaking (0-10), Relevance (0-10), and Preparedness (0-10). Total = 90 pts.
- **Moderator (1 total)**: Grades strictly on Poll Score (0-10). Total = 10 pts.
- **Total Possible Score**: 100 points.
- **Locking Mechanism**: An official can only grade a speaker once per turn.
- **Auto-Resolution**: Once all 4 officials submit their grades, the backend automatically tallies the score, updates the team leaderboard, and calculates power card rewards.

### 4. Power Cards
Granted automatically based on the final grade of a speech:
- **Score >= 250**: Granted `Interrupt` 
- **Score >= 500**: Granted `Add Time` (+60 seconds)
- **Score >= 750**: Granted `Interrupt`

**Team Cap**: Each team can have a maximum of 5 power cards used per session.

When a member plays a card, it is immediately deducted from their inventory, broadcasted via Supabase Realtime to the `FloorStatus` component, and alters the live timer (e.g., pausing it for an interruption, or adding +60 seconds).

---

## 🛠️ Environment Setup & Installation

### 1. Database Setup (Supabase)
1. Create a new Supabase project.
2. Navigate to the **SQL Editor**.
3. Open `server/supabase_schema.sql` from this repository.
4. Copy all contents, paste into the SQL Editor, and click **Run**.
   *This script cleanly wipes existing tables, creates all necessary tables with relationships, enforces RLS policies, turns on Realtime publications, and adds seed data.*

### 2. Server Setup (Express)
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file in the `server/` directory:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_super_secret_jwt_string
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

### 3. Client Setup (React)
1. Open a terminal and navigate to the `client/` directory:
   ```bash
   cd client
   npm install
   ```
2. Create a `.env` file in the `client/` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

---

## 🔌 API Endpoints Reference

All routes (except `/auth/login`) are protected by JWT via `authMiddleware`. Specific routes use `moderatorOnly` or `officialOnly` middlewares to restrict access.

### Auth (`/auth`)
- `POST /auth/login`: Authenticates member ID + Party/Code, returns JWT & user profile.
- `GET /auth/me`: Refreshes the logged-in user's profile.

### Session (`/session`)
- `GET /session/active`: Fetches current session details, stage, and active speaker.
- `POST /session/stage`: Moderator updates the session stage (e.g., `BILL1_R1`, `BILL1_R2`, `BILL2_R1`).
- `GET /session/raise-hand/status`: Gets the current raise-hand window status.
- `PATCH /session/raise-hand`: Moderator enables/disables raise-hand and opens/closes the window.
- `POST /session/bill-data`: Moderator stores bill name/summary for Bill 1 or Bill 2.
- `POST /session/team-selection`: Moderator stores 1v1 team selections for Bill 1 or Bill 2.

### Queue (`/queue`)
- `GET /queue`: Fetches the active speaker queue.

### Speaker Control (`/speaker`)
- `PATCH /speaker/approve/:queueId`: Moderator approves a queued member to speak.
- `PATCH /speaker/done`: Moderator concludes the current speaker's turn.
- `PATCH /speaker/revoke`: Moderator revokes the mic from the current speaker.

### Hand & Cards (`/hand`)
- `POST /hand/raise`: Member requests to speak (adds to queue).
- `DELETE /hand/lower`: Member lowers hand (marks waiting entry as skipped).
- `GET /hand/cards`: Fetches unused power cards for the logged-in member.
- `POST /hand/use-power-card`: Uses a power card and broadcasts the event via Realtime.

### Chat (`/chat`)
- `GET /chat`: Fetches paginated chat for the active session.
- `POST /chat`: Posts a message.
- `DELETE /chat`: Clears chat (moderator only).
- `PATCH /chat/:messageId/golden`: Marks/unmarks a message as golden.

### Moderator (`/moderator`)
- `GET /grade/status`: Checks if the logged-in official has already graded the active speaker.
- `POST /grade`: Submits a grade for the current speaker turn. Auto-triggers point/card calculation upon receiving the 4th vote.

### Polls & Points (`/polls`, `/points`)
- `POST /polls`: Mod creates a new poll.
- `GET /polls/active`: Fetches the currently active poll.
- `POST /polls/:id/vote`: Member casts a vote.
- `GET /points`: Fetches the team points leaderboard.

### Party (`/party`)
- `GET /party/:party`: Retrieves party logo and custom details.
- `POST /party`: Sets or updates custom party details.
