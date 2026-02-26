# Stage Synchronization Fixes - Implementation Summary

## Overview

Fixed critical 500 errors in the stage system by adding proper error handling, socket broadcasting, and defensive null checks to three key endpoints in `server/src/routes/session.js`.

## Issues Addressed

### 1. **POST /session/stage** - Stage Change Handler

**Problems Fixed:**

- ✅ Missing try/catch block around database update
- ✅ No socket broadcast after successful stage change
- ✅ Missing defensive null checks for request parameters
- ✅ Unhandled exceptions causing 500 errors

**Solution:**

- Wrapped entire handler in try/catch
- Added defensive checks for `session_id` and `stage`
- Added socket broadcast via `supabase.channel("stage-updates")`
- Added proper error logging for debugging
- Broadcast includes: sessionId, stage value, and ISO timestamp

**Socket Event Emitted:**

```javascript
{
  type: "broadcast",
  event: "stage:update",
  payload: {
    sessionId: session_id,
    stage: stage,
    timestamp: ISO_timestamp
  }
}
```

### 2. **POST /session/bill-data** - Bill Submission Handler

**Problems Fixed:**

- ✅ Missing socket broadcast after bill save
- ✅ No error logging for failed database operations
- ✅ Missing defensive check for required `session_id`
- ✅ Unhandled database errors

**Solution:**

- Added defensive checks for `session_id` parameter
- Added socket broadcast via `supabase.channel("bill-updates")`
- Added proper error logging at each failure point
- Broadcast won't fail the response if it fails

**Socket Event Emitted:**

```javascript
{
  type: "broadcast",
  event: "bill:update",
  payload: {
    sessionId: session_id,
    billNumber: bill_number,
    billData: { name, summary },
    timestamp: ISO_timestamp
  }
}
```

### 3. **POST /session/team-selection** - 1v1 Team Selection Handler

**Problems Fixed:**

- ✅ Missing socket broadcast after team selection save
- ✅ No error logging for fetch errors
- ✅ Missing defensive check for required `session_id`
- ✅ Unhandled database errors

**Solution:**

- Added defensive checks for `session_id` parameter
- Added explicit error logging for fetch errors
- Added socket broadcast via `supabase.channel("team-selection-updates")`
- Proper error handling for both fetch and update operations

**Socket Event Emitted:**

```javascript
{
  type: "broadcast",
  event: "team-selection:update",
  payload: {
    sessionId: session_id,
    billNumber: bill_number,
    teamSelection: { teamA, teamB },
    timestamp: ISO_timestamp
  }
}
```

## Key Improvements

### Error Handling Pattern

All three endpoints now follow this pattern:

```javascript
try {
  // Validate auth
  // Validate input parameters (defensive checks)
  // Perform database operation
  // Handle database errors
  // Broadcast socket event (wrapped in try/catch to not fail response)
  // Return success response
} catch (err) {
  console.error(err);
  res.status(500).json({ error: err.message });
}
```

### Broadcasting Safety

- Socket broadcasts are wrapped in their own try/catch
- If broadcast fails, it logs the error but doesn't fail the API response
- This prevents cascade failures where UI doesn't update but data was saved

### Defensive Validation

Added null/undefined checks for:

- `session_id` - Required in all three endpoints
- `stage` - Required in stage endpoint
- `bill_name` and `bill_summary` - Already existed, kept for consistency
- `bill_number` - Must be 1 or 2 (existing validation preserved)
- `team_a` and `team_b` - Must be different (existing validation preserved)

## Testing Checklist

After deployment, verify:

- [ ] POST /session/stage accepts all 8 valid stage values without 500 error
- [ ] POST /session/stage rejects invalid stages with 400 error (not 500)
- [ ] POST /session/stage rejects missing session_id with 400 error
- [ ] POST /session/bill-data accepts valid bill data without 500 error
- [ ] POST /session/bill-data rejects missing session_id with 400 error
- [ ] POST /session/team-selection accepts valid team selections without 500 error
- [ ] POST /session/team-selection rejects missing session_id with 400 error
- [ ] Browser console shows "stage:update" events when stage changes
- [ ] Participant portal updates stage without page reload
- [ ] Server logs show proper error messages for failures (no silent errors)

## Related Files

- **Modified:** `server/src/routes/session.js` (lines 54-352)
- **Config Reference:** `server/src/config/stageConfig.js` (unchanged, validated as correct)
- **Client Listener:** Participant portal components should listen for socket events (verify in next step if needed)

## Socket Event Channels Used

1. `"stage-updates"` - For stage transitions
2. `"bill-updates"` - For bill data submissions
3. `"team-selection-updates"` - For 1v1 team selections

These channels can be subscribed to in frontend components via Supabase realtime:

```javascript
supabase
  .channel("stage-updates")
  .on("broadcast", { event: "stage:update" }, (payload) => {
    // Handle stage update
  })
  .subscribe();
```

## Notes

- All changes are minimal and focused on stability (no refactoring)
- No routing structure changes
- No database schema modifications
- Backward compatible with existing API contracts
- Error messages are descriptive for debugging
