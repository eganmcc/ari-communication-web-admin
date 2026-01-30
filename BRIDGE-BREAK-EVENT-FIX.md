# Bridge: Missing Break Fields in agent:status-changed Event

## Issue

The `agent:status-changed` Socket.IO event is missing break metadata fields when emitting break status changes. This causes the dashboard to lose break context when processing subsequent events like `agent:call-ended`.

## Evidence

**Working: agents:initial includes all fields**
```json
{
  "extension": "3021",
  "status": "break_short",
  "breakType": "short",
  "breakEndTime": "2026-01-29T18:03:52.554Z",
  "breakDuration": 15
}
```

**Broken: agent:status-changed missing fields**
```javascript
// Current (WRONG):
io.emit('agent:status-changed', {
  extension: "3021",
  oldStatus: "busy",
  newStatus: "break_short",
  metadata: {},  // Empty or missing break fields
  timestamp: "2026-01-29T17:47:54.095Z"
});

// Dashboard logs show: "🟡 Agent 3021 on undefined break until undefined"
```

## Impact

1. Agent goes on break during call → Dashboard shows break (uses initial data)
2. Call ends → Dashboard checks `agent.breakType` (undefined) → Sets status to "available" ❌
3. Page refresh → Dashboard loads from API → Shows break correctly ✅

## Fix Required

When emitting `agent:status-changed` for break status (`break_short` or `break_long`), include these fields at the **root level** of the event object:

```javascript
io.emit('agent:status-changed', {
  extension: agent.extension,
  oldStatus: agent.previousStatus,
  newStatus: 'break_short',  // or 'break_long'
  timestamp: new Date().toISOString(),
  
  // REQUIRED for break status:
  breakType: 'short',           // 'short' or 'long'
  breakEndTime: breakEndTime,   // ISO 8601 string
  breakDuration: 15              // minutes (number)
});
```

## Code Location

Check the break status event emission in `agent-manager.js` around the `setAgentBreakStatus()` or similar function. The fields exist in the agent data (confirmed by `/api/agents` response) but are not being included in the Socket.IO event.

## Dashboard Contract

The dashboard expects `StatusChangeEvent` interface:
```typescript
interface StatusChangeEvent {
  extension: string;
  oldStatus: AgentStatus;
  newStatus: AgentStatus;
  timestamp: string;
  breakType?: 'short' | 'long';      // Required when newStatus is break_*
  breakEndTime?: string;              // Required when newStatus is break_*
  breakDuration?: number;             // Required when newStatus is break_*
}
```

## Verification

After fix, dashboard console should show:
```
🔄 Agent status changed: { extension: "3021", newStatus: "break_short", ... }
🟡 Agent 3021 on short break until 2026-01-29T18:03:52.554Z
✅ Call ended: { extension: "3021", ... }
☕ Preserved break status: break_short breakType: short
```

Not:
```
🟡 Agent 3021 on undefined break until undefined
```
