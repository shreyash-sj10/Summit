# Quick Reference: Stage System Behavior Map

## ⚡ Stage Behavior Summary Table

| Stage                | Buzzer | Power Cards | Scoring | 1v1 | Bill Setup | Team Select | Grading | Timer     |
| -------------------- | ------ | ----------- | ------- | --- | ---------- | ----------- | ------- | --------- |
| **WAITING**          | ❌     | ❌          | ❌      | ❌  | ❌         | ❌          | ❌      | ❌        |
| **BILL1_SETUP**      | ❌     | ❌          | ❌      | ❌  | ✅ MODAL   | ❌          | ❌      | ❌        |
| **BILL1_R1**         | ✅     | ✅          | ✅      | ❌  | ❌         | ❌          | ✅      | ✅ 60s    |
| **BILL1_R2**         | ❌     | ❌          | ✅      | ✅  | ❌         | ✅ MODAL    | ✅      | ✅ 90s    |
| **BILL2_SETUP_PREP** | ❌     | ❌          | ❌      | ❌  | ✅ MODAL   | ❌          | ❌      | ✅ 5-7m   |
| **BILL2_R1**         | ✅     | ✅          | ✅      | ❌  | ❌         | ❌          | ✅      | ✅ 60s    |
| **BILL2_R2**         | ❌     | ❌          | ✅      | ✅  | ❌         | ✅ MODAL    | ✅      | ✅ 90s    |
| **WINNER**           | ❌     | ❌          | ❌      | ❌  | ❌         | ❌          | ❌      | ❌ LOCKED |

---

## 🔧 Configuration Access Points

### Server-Side

```javascript
// Import in routes/session.js
import { getValidStages, getStageConfig } from "../config/stageConfig.js";

// Usage
const config = getStageConfig("BILL1_R1");
const allStages = getValidStages();
```

### Client-Side

```javascript
// Import in components
import {
  isGradingAllowed,
  is1v1Stage,
  getSpeechDuration,
} from "../../shared/utils/stageBehaviors";

// Usage
if (isGradingAllowed(currentStage)) {
  // Show grading UI
}

const duration = getSpeechDuration(currentStage); // 60 or 90
```

---

## 🎯 Stage Transition Rules

```
WAITING
  ↓
BILL1_SETUP (requires bill name + summary)
  ↓
BILL1_R1 (buzzer + power cards enabled)
  ↓
BILL1_R2 (requires team selection, 90s format)
  ↓
BILL2_SETUP_PREP (requires bill name + summary, prep timer 5-7 min)
  ↓
BILL2_R1 (buzzer + power cards enabled)
  ↓
BILL2_R2 (requires team selection, 90s format)
  ↓
WINNER (system locked, no changes)
```

---

## 📊 Modal Trigger Logic

### Bill Setup Modal

Appears when stage is:

- `BILL1_SETUP` (if bill_1_data is null/empty)
- `BILL2_SETUP_PREP` (if bill_2_data is null/empty)

### Team Selection Modal

Appears when stage is:

- `BILL1_R2` (if team selections not locked)
- `BILL2_R2` (if team selections not locked)

---

## 🗄️ Database Fields

### New Columns in `sessions` Table

**bill_1_data** (JSONB)

```json
{
  "name": "National Infrastructure Development Act",
  "summary": "Comprehensive bill addressing infrastructure..."
}
```

**bill_2_data** (JSONB)

```json
{
  "name": "Digital Privacy Protection Act",
  "summary": "Legislation ensuring data protection and privacy..."
}
```

**team_selections** (JSONB)

```json
{
  "bill1Round2": {
    "teamA": "BJP",
    "teamB": "INC"
  },
  "bill2Round2": {
    "teamA": "AAP",
    "teamB": "TMC"
  }
}
```

---

## 🔌 New API Endpoints

### Save Bill Data

```
POST /session/bill-data
{
  "session_id": "uuid",
  "bill_number": 1 | 2,
  "bill_name": "string",
  "bill_summary": "string"
}
```

### Save Team Selection

```
POST /session/team-selection
{
  "session_id": "uuid",
  "bill_number": 1 | 2,
  "team_a": "BJP",
  "team_b": "INC"
}
```

### Update Stage

```
POST /session/stage
{
  "session_id": "uuid",
  "stage": "WAITING" | "BILL1_SETUP" | ... | "WINNER"
}
```

---

## ✨ Key Component Props

### BillSetupModal

```jsx
<BillSetupModal
  isOpen={boolean}
  onClose={() => {}}
  onSubmit={(data) => {}}
  billNumber={1 | 2}
  isLoading={boolean}
/>
```

### TeamSelectionModal

```jsx
<TeamSelectionModal
  isOpen={boolean}
  onClose={() => {}}
  onSubmit={(data) => {}}
  billNumber={1 | 2}
  isLoading={boolean}
/>
```

---

## 🧪 Testing Checklist

- [ ] Stage dropdown shows all 8 options
- [ ] BILL1_SETUP opens BillSetupModal
- [ ] BILL1_R1 allows buzzer (test power cards)
- [ ] BILL1_R2 requires TeamSelectionModal before proceeding
- [ ] BILL1_R2 shows 90s timer
- [ ] BILL2_SETUP_PREP opens BillSetupModal
- [ ] BILL2_SETUP_PREP starts preparation timer
- [ ] BILL2_R1 allows buzzer
- [ ] BILL2_R2 requires TeamSelectionModal
- [ ] WINNER stage prevents further changes
- [ ] Judge grading only available in R1/R2 stages
- [ ] Database persists bill data and team selections
- [ ] Realtime updates work (no page refresh needed)

---

## 🔐 Security Notes

- All stage changes require `moderator` role
- Bill data and team selection endpoints verify `moderator` role
- JSONB fields are validated before storage
- Team selection prevents same team twice
- Winner stage locks all modifications

---

**Last Updated:** February 25, 2026
