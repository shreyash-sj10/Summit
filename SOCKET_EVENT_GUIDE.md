# Socket Event Listener Implementation Guide

## For Participant Portal Components

The backend now emits socket events for stage changes, bill updates, and team selections. Participant portals should listen to these events to update their UI without requiring page reloads.

## Stage Update Event

**Channel:** `"stage-updates"`
**Event:** `"stage:update"`

### Usage in React Component

```javascript
import { useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useSessionStore } from "@/store/useSessionStore";

export function ParticipantDashboard() {
  const { session, setSession } = useSessionStore();

  useEffect(() => {
    // Subscribe to stage updates
    const subscription = supabase
      .channel("stage-updates")
      .on("broadcast", { event: "stage:update" }, (payload) => {
        const { sessionId, stage, timestamp } = payload.payload;

        // Only update if it's for the current session
        if (sessionId === session?.id) {
          setSession({ ...session, stage });
          console.log(`Stage changed to: ${stage}`);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.id]);

  return (
    <div>
      <h1>Current Stage: {session?.stage || "WAITING"}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

## Bill Update Event

**Channel:** `"bill-updates"`
**Event:** `"bill:update"`

### Usage in React Component

```javascript
import { useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useSessionStore } from "@/store/useSessionStore";

export function BillDisplay() {
  const { billData, setBillData } = useSessionStore();
  const { session } = useSessionStore();

  useEffect(() => {
    // Subscribe to bill updates
    const subscription = supabase
      .channel("bill-updates")
      .on("broadcast", { event: "bill:update" }, (payload) => {
        const { sessionId, billNumber, billData, timestamp } = payload.payload;

        if (sessionId === session?.id) {
          setBillData({ bill: billNumber, data: billData });
          console.log(`Bill ${billNumber} updated:`, billData);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.id]);

  return (
    <div>
      {billData && (
        <div>
          <h2>{billData.name}</h2>
          <p>{billData.summary}</p>
        </div>
      )}
    </div>
  );
}
```

## Team Selection Event

**Channel:** `"team-selection-updates"`
**Event:** `"team-selection:update"`

### Usage in React Component

```javascript
import { useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useSessionStore } from "@/store/useSessionStore";

export function TeamSelectionDisplay() {
  const { teamSelections, setTeamSelection } = useSessionStore();
  const { session } = useSessionStore();

  useEffect(() => {
    // Subscribe to team selection updates
    const subscription = supabase
      .channel("team-selection-updates")
      .on("broadcast", { event: "team-selection:update" }, (payload) => {
        const { sessionId, billNumber, teamSelection, timestamp } =
          payload.payload;

        if (sessionId === session?.id) {
          setTeamSelection({ bill: billNumber, teams: teamSelection });
          console.log(`Teams selected for Bill ${billNumber}:`, teamSelection);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.id]);

  return (
    <div>
      {teamSelections && (
        <div>
          <p>Team A: {teamSelections.teamA}</p>
          <p>Team B: {teamSelections.teamB}</p>
        </div>
      )}
    </div>
  );
}
```

## Comprehensive Setup Hook

You can create a custom hook to manage all three subscriptions:

```javascript
// hooks/useStageSubscription.js
import { useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useSessionStore } from "@/store/useSessionStore";

export function useStageSubscription() {
  const store = useSessionStore();
  const { session } = store;

  useEffect(() => {
    if (!session?.id) return;

    // Subscribe to all three channels
    const stageChannel = supabase
      .channel("stage-updates")
      .on("broadcast", { event: "stage:update" }, (payload) => {
        if (payload.payload.sessionId === session.id) {
          store.setSession({ ...session, stage: payload.payload.stage });
        }
      })
      .subscribe();

    const billChannel = supabase
      .channel("bill-updates")
      .on("broadcast", { event: "bill:update" }, (payload) => {
        if (payload.payload.sessionId === session.id) {
          store.setBillData({
            bill: payload.payload.billNumber,
            data: payload.payload.billData,
          });
        }
      })
      .subscribe();

    const teamChannel = supabase
      .channel("team-selection-updates")
      .on("broadcast", { event: "team-selection:update" }, (payload) => {
        if (payload.payload.sessionId === session.id) {
          store.setTeamSelection({
            bill: payload.payload.billNumber,
            teams: payload.payload.teamSelection,
          });
        }
      })
      .subscribe();

    return () => {
      stageChannel.unsubscribe();
      billChannel.unsubscribe();
      teamChannel.unsubscribe();
    };
  }, [session?.id]);
}

// Usage in component
export function Dashboard() {
  useStageSubscription(); // Automatically listens to all events
  const { session, billData, teamSelections } = useSessionStore();

  return <div>{/* render UI */}</div>;
}
```

## Expected Payload Structure

### Stage Update

```json
{
  "type": "broadcast",
  "event": "stage:update",
  "payload": {
    "sessionId": "session-uuid",
    "stage": "BILL1_R1",
    "timestamp": "2024-01-20T10:30:45.123Z"
  }
}
```

### Bill Update

```json
{
  "type": "broadcast",
  "event": "bill:update",
  "payload": {
    "sessionId": "session-uuid",
    "billNumber": 1,
    "billData": {
      "name": "Bill Name",
      "summary": "Bill Summary"
    },
    "timestamp": "2024-01-20T10:30:45.123Z"
  }
}
```

### Team Selection Update

```json
{
  "type": "broadcast",
  "event": "team-selection:update",
  "payload": {
    "sessionId": "session-uuid",
    "billNumber": 1,
    "teamSelection": {
      "teamA": "Red Team",
      "teamB": "Blue Team"
    },
    "timestamp": "2024-01-20T10:30:45.123Z"
  }
}
```

## Best Practices

1. **Always check sessionId** - Only process events for the current session
2. **Unsubscribe on unmount** - Prevent memory leaks by unsubscribing when component unmounts
3. **Use Zustand setters** - Keep state centralized in the Zustand store
4. **Log events** - Add console.logs during development to track event flow
5. **Handle missing session** - Return early if session?.id is not available
6. **Timestamp awareness** - Use timestamp in payload for ordering if needed

## Debugging

To verify events are being received in the browser console:

```javascript
// Add to any component
useEffect(() => {
  const channel = supabase.channel("stage-updates");
  channel.on("broadcast", { event: "stage:update" }, (payload) => {
    console.log("🎯 Stage Update Received:", payload);
  });
  channel.subscribe((status) => {
    console.log("Stage channel status:", status);
  });
}, []);
```

Look for console messages like:

- `"Stage channel status: SUBSCRIBED"` - Connection established
- `"🎯 Stage Update Received: {...}"` - Event received and logged
