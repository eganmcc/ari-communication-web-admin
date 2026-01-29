# Race Condition Fix Required: useAgentSocket.ts

## Problem
Dashboard shows incorrect agent status (e.g., "Available" when agent is on break). Status updates are lost when events arrive out of order.

## Root Cause
**File:** `src/hooks/useAgentSocket.ts`  
**Lines:** 113-147 (`agent:status-changed` handler)

The handler silently ignores status-changed events for agents that don't exist in the Map yet:

```typescript
socket.on('agent:status-changed', (data: StatusChangeEvent) => {
  setAgents(prev => {
    const newMap = new Map(prev);
    const agent = newMap.get(data.extension);
    if (agent) {  // ⚠️ BUG: Silently drops events for unknown agents
      // ... update agent
      newMap.set(data.extension, updatedAgent);
    }
    // If agent doesn't exist, event is lost forever
    return newMap;
  });
});
```

## When This Happens
1. **Initial connection** - Status-changed events arrive before agents:initial
2. **Reconnection** - Events fire during reconnect handshake (65 bridge restarts recorded)
3. **New registration** - Agent registers and immediately goes on break

## Evidence
- Agent 021 status in Redis: `break_short` with full metadata ✅
- Dashboard display: "Available A0" ❌
- Bridge logs show correct event emission ✅
- Dashboard console shows event received but not applied ✅

## Fix Options

### Option 1: Create Placeholder Entry (Recommended)
```typescript
socket.on('agent:status-changed', (data: StatusChangeEvent) => {
  setAgents(prev => {
    const newMap = new Map(prev);
    const agent = newMap.get(data.extension);
    
    if (agent) {
      // Normal update path
      const updatedAgent = { ...agent, status: data.newStatus, ... };
      newMap.set(data.extension, updatedAgent);
    } else {
      // Create placeholder for unknown agent
      console.warn(`⚠️ Status update for unknown agent ${data.extension}, creating placeholder`);
      const placeholderAgent: Agent = {
        extension: data.extension,
        name: `Agent ${data.extension}`,
        status: data.newStatus,
        lastStatusChange: data.timestamp || new Date().toISOString(),
        currentCall: '',
        totalCalls: 0,
        breakType: data.breakType,
        breakEndTime: data.breakEndTime,
        breakDuration: data.breakDuration,
      };
      newMap.set(data.extension, placeholderAgent);
    }
    return newMap;
  });
});
```

### Option 2: Event Queue
Queue status-changed events until initial load completes, then replay them.

### Option 3: API Fetch
Fetch full agent data from `/api/agents/:extension` when receiving event for unknown agent.

## Testing
1. Start dashboard, immediately put agent on break → Should show break status
2. Restart bridge (pm2 restart) while viewing dashboard → Status should persist
3. Register new agent, immediately go on break → Should show break status

## Impact
**Severity:** High - Core functionality broken  
**Frequency:** Every reconnection + new registration + race on initial load  
**Users Affected:** All supervisors viewing agent status

## Related
- Bridge correctly emits events (verified in bridge logs)
- voice-api correctly calls bridge API (verified in commits 88e72da, 4c7a198)
- Redis stores correct status (verified via API)
- Issue is purely dashboard state management
