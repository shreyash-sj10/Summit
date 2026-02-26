# 🚀 Quick Start Guide - ABHIMAT Stage System

**Read this first if you need to get up to speed quickly!**

---

## ⚡ 60-Second Overview

A new **8-stage system** has been implemented for ABHIMAT '26:

```
WAITING → BILL1_SETUP → BILL1_R1 → BILL1_R2 → BILL2_SETUP_PREP → BILL2_R1 → BILL2_R2 → WINNER
```

Each stage controls:

- 🔊 Buzzer (enabled/disabled)
- 🎴 Power cards (enabled/disabled)
- 📊 Judge grading (allowed/blocked)
- ⏱️ Speech timers (60s or 90s)
- 📝 Bill setup (modal required)
- 👥 Team selection (modal required)

---

## 🎯 What Changed

### New Files (8)

1. `server/src/config/stageConfig.js` – Stage behavior definitions
2. `client/src/moderator/components/BillSetupModal.jsx` – Bill capture modal
3. `client/src/moderator/components/TeamSelectionModal.jsx` – Team selection modal
4. `client/src/shared/utils/stageBehaviors.js` – Helper utilities
5. `server/migration_add_bill_data.sql` – Database migration
6. `COMPLETION_SUMMARY.md` – Project summary
7. `STAGE_IMPLEMENTATION.md` – Technical guide
8. `STAGE_QUICK_REFERENCE.md` – Quick lookup tables

### Modified Files (8)

- `server/src/routes/session.js` – Updated stage validation
- `client/src/store/useSessionStore.js` – Added bill/team state
- `client/src/moderator/pages/Dashboard.jsx` – Added modals + handlers
- `client/src/moderator/components/SpeakerGrader.jsx` – Made stage-aware
- `client/src/shared/services/api.js` – Added API functions
- `server/supabase_schema.sql` – Updated schema
- And more...

---

## 📦 Key Components

### **Stage Configuration** (Server)

```javascript
// server/src/config/stageConfig.js
STAGE_CONFIG = {
  WAITING: { buzzerEnabled: false, ... },
  BILL1_R1: { buzzerEnabled: true, ... },
  BILL1_R2: { buzzerEnabled: false, is1v1Mode: true, ... },
  // ... 8 stages total
}
```

### **Bill Setup Modal** (Client)

```jsx
// Appears when entering BILL1_SETUP or BILL2_SETUP_PREP
<BillSetupModal
  onSubmit={(data) => {
    // Saves bill_1_data or bill_2_data to database
  }}
/>
```

### **Team Selection Modal** (Client)

```jsx
// Appears when entering BILL1_R2 or BILL2_R2
<TeamSelectionModal
  onSubmit={(data) => {
    // Saves team selections to database
    // Then enables 1v1 mode
  }}
/>
```

---

## 🔄 Stage Flow

### Normal Debate Flow (BILL1_R1)

1. Moderator selects BILL1_R1
2. No modal appears
3. Stage changes immediately
4. ✅ Buzzer enabled
5. ✅ Power cards enabled
6. ✅ Judges can grade

### 1v1 Debate Flow (BILL1_R2)

1. Moderator selects BILL1_R2
2. **TeamSelectionModal opens** 🎯
3. Moderator selects Team A (e.g., BJP) and Team B (e.g., INC)
4. Moderator clicks "Start Debate"
5. Stage changes to BILL1_R2
6. ❌ Buzzer disabled
7. ❌ Power cards disabled
8. ✅ 90-second timer (not 60)
9. ✅ Judges can grade

### Bill Setup Flow (BILL1_SETUP)

1. Moderator selects BILL1_SETUP
2. **BillSetupModal opens** 📝
3. Moderator enters:
   - Bill Name (e.g., "Infrastructure Act")
   - Bill Summary (e.g., "Comprehensive bill addressing...")
4. Moderator clicks "Save & Proceed"
5. Data saved to `bill_1_data` column
6. Stage changes to BILL1_SETUP
7. Moderator then selects BILL1_R1 to start debate

---

## 📊 Stage Behavior Quick Table

| Stage            | Buzzer | Cards | Grade | Timer | Requires |
| ---------------- | ------ | ----- | ----- | ----- | -------- |
| WAITING          | ❌     | ❌    | ❌    | ❌    | -        |
| BILL1_SETUP      | ❌     | ❌    | ❌    | ❌    | 📝 Bill  |
| BILL1_R1         | ✅     | ✅    | ✅    | 60s   | -        |
| BILL1_R2         | ❌     | ❌    | ✅    | 90s   | 👥 Teams |
| BILL2_SETUP_PREP | ❌     | ❌    | ❌    | 5-7m  | 📝 Bill  |
| BILL2_R1         | ✅     | ✅    | ✅    | 60s   | -        |
| BILL2_R2         | ❌     | ❌    | ✅    | 90s   | 👥 Teams |
| WINNER           | ❌     | ❌    | ❌    | 🔒    | -        |

---

## 🔌 New API Endpoints

### Save Bill Data

```
POST /session/bill-data
{
  "session_id": "uuid",
  "bill_number": 1 or 2,
  "bill_name": "string",
  "bill_summary": "string"
}
```

### Save Team Selection

```
POST /session/team-selection
{
  "session_id": "uuid",
  "bill_number": 1 or 2,
  "team_a": "BJP",
  "team_b": "INC"
}
```

### Update Stage

```
POST /session/stage
{
  "session_id": "uuid",
  "stage": "BILL1_R1" (etc.)
}
```

---

## 🧪 Quick Test (5 minutes)

1. **Open Moderator Dashboard**
2. **Stage 0: WAITING** → ✅ No modal
3. **Stage 1: BILL1_SETUP** → 📝 Bill modal appears
   - Enter bill name & summary
   - Click "Save & Proceed"
4. **Stage 2: BILL1_R1** → ✅ No modal, buzzer ready
5. **Stage 3: BILL1_R2** → 👥 Team modal appears
   - Select Team A (BJP) and Team B (INC)
   - Click "Start Debate"
6. **Check Judge Portal** → 🎓 Grading should work
7. **Try other stages** → Follow same pattern

---

## 🐛 If Something's Wrong

### "Modal not appearing"

→ Check: `handleStageChange()` in Dashboard.jsx
→ Verify: Stage value is BILL1_SETUP or BILL1_R2

### "Data not saving"

→ Check: API endpoint is being called
→ Verify: Database migration was run
→ Debug: Browser console for errors

### "Judge can't grade"

→ Check: Current stage allows grading (BILL1_R1, BILL1_R2, etc.)
→ Verify: isGradingAllowed(stage) returns true
→ Reference: STAGE_QUICK_REFERENCE.md

### "Buzzer not working"

→ Check: Current stage (BILL1_R1 or BILL2_R1)
→ Verify: stageConfig.js has buzzerEnabled: true
→ Reference: ARCHITECTURE.md

---

## 📚 Documentation Map

| Need                | Read This                      |
| ------------------- | ------------------------------ |
| Quick overview      | This file (you're reading it!) |
| Stage table         | STAGE_QUICK_REFERENCE.md       |
| How to deploy       | COMPLETION_SUMMARY.md          |
| How it works        | STAGE_IMPLEMENTATION.md        |
| Visual architecture | ARCHITECTURE.md                |
| Everything          | IMPLEMENTATION_INDEX.md        |

---

## ✅ Pre-Deployment Checklist

Before going live:

- [ ] Database migration run? `migration_add_bill_data.sql`
- [ ] Server restarted? (to pick up new routes)
- [ ] Client built? `npm run build`
- [ ] All 8 stages tested?
- [ ] Modals appear at correct stages?
- [ ] Data persists to database?
- [ ] Judge grading works correctly?
- [ ] No console errors?

---

## 🔐 Security Notes

✅ All stage changes require moderator login
✅ All data saves require moderator authorization
✅ Database enforces valid stage values
✅ Team selection prevents duplicates
✅ Invalid input rejected with helpful messages

---

## 🎯 Common Tasks

### "I need to change what's displayed in a stage"

→ Edit: `server/src/config/stageConfig.js`
→ The rest updates automatically

### "I need to add a new stage"

→ Add entry to STAGE_CONFIG
→ Update stage dropdown in Dashboard.jsx
→ Update database constraint
→ Update documentation

### "I need to modify the modal"

→ Edit: BillSetupModal.jsx or TeamSelectionModal.jsx
→ No other changes needed

### "I need to test a specific stage"

→ Use test steps above
→ Check STAGE_QUICK_REFERENCE.md for expected behavior

---

## 💡 Pro Tips

1. **Stage config is central** – All behavior defined in one file
2. **Modals are smart** – Open/close based on stage automatically
3. **Database is persistent** – All data saved across sessions
4. **Realtime is automatic** – No manual sync needed
5. **Judge portal is safe** – Grading locked when inappropriate

---

## 🚀 You're Ready!

You now understand:

- ✅ The 8 new stages
- ✅ What changes between stages
- ✅ How modals work
- ✅ Where to find documentation
- ✅ How to test
- ✅ What to do if something breaks

**Next step:** Pick a documentation file from the map above and dive deeper!

---

## 📞 Need More Help?

1. **See STAGE_QUICK_REFERENCE.md** for quick answers
2. **See STAGE_IMPLEMENTATION.md** for detailed explanations
3. **See ARCHITECTURE.md** for visual understanding
4. **See STATUS_REPORT.md** for project status
5. **See IMPLEMENTATION_INDEX.md** for full navigation

---

**Last Updated:** February 25, 2026
**Status:** ✅ Production Ready
**Next:** Deploy with confidence! 🚀
