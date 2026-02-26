# Stage System Architecture & Integration Map

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ABHIMAT STAGE SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   MODERATOR UI       │
│   Dashboard.jsx      │
└──────────────────────┘
          ↓
    [Stage Dropdown]
          ↓
    handleStageChange()
    ├─ Check requirements
    ├─ Open modal if needed
    ├─ Wait for submission
    └─ Call API to persist

┌──────────────────────────────────────────────────────────────────┐
│                        STAGE CONFIG                              │
│  /server/src/config/stageConfig.js (Single Source of Truth)     │
│                                                                  │
│  WAITING → BILL1_SETUP → BILL1_R1 → BILL1_R2 → BILL2_SETUP_PREP │
│             ↓              ↓          ↓          ↓               │
│          Bill Setup    Normal      1v1 Teams   Bill Setup        │
│          Modal        Debate      Modal        + Prep Timer      │
│                                                                  │
│  ↓ BILL2_R1 → BILL2_R2 → WINNER                                │
│  Normal        1v1          Winner                               │
│  Debate        Teams        Locked                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│  BillSetupModal.jsx  │         │ TeamSelectionModal   │
├──────────────────────┤         ├──────────────────────┤
│ - Bill Name Input    │         │ - Team A Dropdown    │
│ - Bill Summary Input │         │ - Team B Dropdown    │
│ - Validation         │         │ - Matchup Preview    │
│ - Save & Proceed     │         │ - Start Debate       │
└──────────────────────┘         └──────────────────────┘
          ↓                               ↓
   handleBillSetupSubmit()        handleTeamSelectionSubmit()
   ├─ setBillData(store)          ├─ setTeamSelection(store)
   ├─ saveBillData(API)           ├─ saveTeamSelection(API)
   └─ updateStage(API)            └─ updateStage(API)

┌──────────────────────────────────────────────────────────────────┐
│                   SESSION STORE STATE                            │
│              useSessionStore.js (Zustand)                        │
├──────────────────────────────────────────────────────────────────┤
│  billData:                                                       │
│  ├─ bill1: { name, summary }    ← Saved by BillSetupModal      │
│  └─ bill2: { name, summary }    ← Saved by BillSetupModal      │
│                                                                  │
│  teamSelections:                                                │
│  ├─ bill1Round2: { teamA, teamB } ← Saved by TeamSelection     │
│  └─ bill2Round2: { teamA, teamB } ← Saved by TeamSelection     │
│                                                                  │
│  stage: "BILL1_R1"  ← Updated by updateStage()                 │
└──────────────────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (Supabase)                           │
├──────────────────────────────────────────────────────────────────┤
│  sessions table:                                                 │
│  ├─ id (PK)                                                     │
│  ├─ title                                                        │
│  ├─ stage (WAITING|BILL1_SETUP|...WINNER)                      │
│  ├─ bill_1_data (JSONB) ← { name, summary }                    │
│  ├─ bill_2_data (JSONB) ← { name, summary }                    │
│  ├─ team_selections (JSONB) ← { bill1Round2, bill2Round2 }     │
│  └─ ...other fields                                             │
│                                                                  │
│  Realtime Subscription:                                         │
│  supabase.channel('global-session-channel')                     │
│  .on('postgres_changes', ..., fetchActiveSession)              │
└──────────────────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────────────────┐
│            JUDGE PORTAL REACTION (Auto-Sync)                    │
├──────────────────────────────────────────────────────────────────┤
│  SpeakerGrader.jsx:                                              │
│  ├─ Subscribe to stage changes (realtime)                       │
│  ├─ Check isGradingAllowed(stage)                              │
│  └─ Show/hide grading UI based on stage                        │
│                                                                  │
│  Enabled for:  BILL1_R1, BILL1_R2, BILL2_R1, BILL2_R2         │
│  Disabled for: WAITING, BILL1_SETUP, BILL2_SETUP_PREP, WINNER  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoint Map

```
MODERATOR ACTIONS
│
├─ POST /session/stage
│  ├─ Input: { session_id, stage }
│  ├─ Validates: stage must be in getValidStages()
│  └─ Output: { success, stage }
│
├─ POST /session/bill-data
│  ├─ Input: { session_id, bill_number, bill_name, bill_summary }
│  ├─ Stores: bill_1_data or bill_2_data (JSONB)
│  └─ Output: { success, bill_data }
│
└─ POST /session/team-selection
   ├─ Input: { session_id, bill_number, team_a, team_b }
   ├─ Stores: team_selections.bill{N}Round2
   └─ Output: { success, team_selection }

JUDGE ACTIONS
│
├─ GET /session/active [realtime]
│  └─ Returns: session with current stage
│
└─ GET /moderator/grade/status
   └─ Returns: can_grade based on stage
```

---

## 🔄 Stage Transition Flow

```
USER JOURNEY: Moderator Guides Event Through Stages

┌─────────────────────────────────────────────────────────────────┐
│  WAITING                                                        │
│  Participants waiting for event to start                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL1_SETUP]
┌─────────────────────────────────────────────────────────────────┐
│  BILL1_SETUP                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [MODAL] Bill Setup                                      │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Bill Name:       [___________________________]      │ │   │
│  │ │ Bill Summary:    [___________________________]      │ │   │
│  │ │                                  [Save & Proceed]   │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │ Saves: bill_1_data = { name, summary }                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL1_R1]
┌─────────────────────────────────────────────────────────────────┐
│  BILL1_R1 - Normal Debate                                       │
│  ✅ Buzzer Enabled                                              │
│  ✅ Power Cards Enabled                                         │
│  ✅ Judges Can Grade                                            │
│  ⏱️  60 Second Speeches                                          │
│  Members speak from floor in order                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL1_R2]
┌─────────────────────────────────────────────────────────────────┐
│  BILL1_R2 - 1v1 Debate                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [MODAL] Team Selection                                  │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Team A: [BJP          ↓]                           │ │   │
│  │ │ Team B: [INC          ↓]                           │ │   │
│  │ │                VS                                  │ │   │
│  │ │                   [Start Debate]                   │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │ Saves: team_selections.bill1Round2 = { teamA, teamB }   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ❌ Buzzer Disabled (preset speakers)                          │
│  ❌ Power Cards Disabled                                       │
│  ✅ Judges Can Grade                                           │
│  ⏱️  90 Seconds Per Team                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL2_SETUP_PREP]
┌─────────────────────────────────────────────────────────────────┐
│  BILL2_SETUP_PREP - Preparation Phase                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [MODAL] Bill Setup                                      │   │
│  │ [Preparation Timer: 5:45 remaining on projection]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Debate interactions locked                                   │
│  Participants preparing                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL2_R1]
┌─────────────────────────────────────────────────────────────────┐
│  BILL2_R1 - Normal Debate (Same as BILL1_R1)                    │
│  ✅ Buzzer Enabled                                              │
│  ✅ Power Cards Enabled                                         │
│  ✅ Judges Can Grade                                            │
│  ⏱️  60 Second Speeches                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select BILL2_R2]
┌─────────────────────────────────────────────────────────────────┐
│  BILL2_R2 - 1v1 Debate (Same as BILL1_R2)                       │
│  [Team Selection Modal Opens]                                   │
│  ❌ Buzzer Disabled                                             │
│  ❌ Power Cards Disabled                                        │
│  ✅ Judges Can Grade                                            │
│  ⏱️  90 Seconds Per Team                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ [Select WINNER]
┌─────────────────────────────────────────────────────────────────┐
│  WINNER - Results Announcement                                  │
│  🔒 SYSTEM LOCKED - NO FURTHER CHANGES                          │
│  ❌ No stage changes allowed                                    │
│  ❌ No scoring updates allowed                                  │
│  ✨ Projection shows winner animation                           │
│  🎉 Final scores frozen                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Component Dependency Graph

```
Dashboard.jsx (Main Hub)
├─ imports BillSetupModal.jsx
├─ imports TeamSelectionModal.jsx
├─ uses useSessionStore.js
│  ├─ setBillData()
│  ├─ setTeamSelection()
│  └─ updateStage()
├─ calls API endpoints
│  ├─ saveBillData()
│  ├─ saveTeamSelection()
│  └─ updateSessionStage()
└─ renders SpeakerGrader.jsx
   └─ uses stageBehaviors.js
      └─ isGradingAllowed(stage)

Database Layer (Supabase)
└─ sessions table
   ├─ bill_1_data (JSONB)
   ├─ bill_2_data (JSONB)
   ├─ team_selections (JSONB)
   └─ realtime events → feeds back to components
```

---

## 🔌 Integration Checklist

- [x] stageConfig.js created ✅
- [x] Database schema updated ✅
- [x] Migration SQL created ✅
- [x] BillSetupModal created ✅
- [x] TeamSelectionModal created ✅
- [x] Dashboard modal handlers added ✅
- [x] useSessionStore extended ✅
- [x] Server routes updated ✅
- [x] API client functions added ✅
- [x] stageBehaviors utility created ✅
- [x] SpeakerGrader optimized ✅
- [x] Documentation created ✅

---

## 🧪 Testing Paths

### Path 1: Bill Setup Flow

```
WAITING → [select BILL1_SETUP] → BillSetupModal opens
→ fill form → submit → bill_1_data saved → stage changes
```

### Path 2: Normal Debate Flow

```
BILL1_SETUP → [select BILL1_R1] → No modal
→ stage changes immediately → buzzer enabled
```

### Path 3: 1v1 Debate Flow

```
BILL1_R1 → [select BILL1_R2] → TeamSelectionModal opens
→ select teams → submit → team_selections saved
→ stage changes → 90s timer active
```

### Path 4: Preparation Phase

```
BILL1_R2 → [select BILL2_SETUP_PREP] → BillSetupModal opens
→ fill form → submit → PREPARATION TIMER STARTS
→ projection shows countdown → stage locked
```

### Path 5: Judge Grading Restrictions

```
WAITING: [judge sees "grading unavailable"] ✅
BILL1_SETUP: [judge sees "grading unavailable"] ✅
BILL1_R1: [judge can grade] ✅
BILL1_R2: [judge can grade] ✅
...
WINNER: [judge sees "grading unavailable"] ✅
```

---

## 📊 Data Persistence

```
Client State (Zustand)          Database (Supabase)        Realtime
┌─────────────────────┐         ┌──────────────────┐       ┌─────────┐
│ billData            │ ──────→ │ bill_1_data      │ ──→  │ notify  │
│ teamSelections      │ ──────→ │ bill_2_data      │ ──→  │ clients │
│ stage               │ ──────→ │ team_selections  │ ──→  │ (auto   │
│                     │ ──────→ │ stage            │ ──→  │ refresh)│
└─────────────────────┘         └──────────────────┘       └─────────┘
   (ephemeral)                   (persistent)                (realtime)
```

---

**Architecture Last Updated:** February 25, 2026
