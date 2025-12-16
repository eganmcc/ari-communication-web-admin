# Backend Issues - Agent Dashboard Socket Events

## Critical Issues with Socket.IO Events

The backend is not sending required timestamp fields in Socket.IO events, causing the dashboard to malfunction.

---

## Issue 1: Missing `timestamp` Field in All Events

**Problem:**
All socket events are sending **empty strings** or **missing** the `timestamp` field.

**Current Behavior:**
```javascript
// What the backend is currently sending:
{
  extension: '3001',
  timestamp: ''  // ❌ Empty string
}

// Or worse, timestamp is missing entirely:
{
  extension: '3001'
  // No timestamp field at all
}
```

**Required Fix:**
Send valid ISO 8601 timestamp strings for ALL events:

```javascript
// ✅ Correct format:
{
  extension: '3001',
  timestamp: '2025-12-16T14:30:45.123Z'  // ISO 8601 format
}
```

**How to generate in Node.js:**
```javascript
const timestamp = new Date().toISOString();
```

---

## Issue 2: Missing Fields in `agent:call-ended` Event

**Problem:**
The `agent:call-ended` event only sends `{extension: '3001'}` and is missing critical fields.

**Current Behavior:**
```javascript
socket.emit('agent:call-ended', {
  extension: '3001'  // ❌ Only extension
});
```

**Required Fix:**
```javascript
socket.emit('agent:call-ended', {
  extension: '3001',
  channelId: '1765784813.45',        // The call channel ID
  totalCalls: 15,                     // Updated total calls for this agent
  duration: 125,                      // Call duration in seconds
  timestamp: '2025-12-16T14:30:45.123Z'  // ISO 8601 timestamp
});
```

---

## Issue 3: Missing `timestamp` in `agents:initial` Event

**Problem:**
When agents are sent in the initial connection, each agent object has empty `lastStatusChange`.

**Current Behavior:**
```javascript
socket.emit('agents:initial', [
  {
    extension: '3001',
    name: 'Agent Alice',
    status: 'available',
    currentCall: '',
    totalCalls: 15,
    registeredAt: '2025-12-16T12:00:00.000Z',  // ✅ This is correct
    lastStatusChange: ''  // ❌ Empty string
  }
]);
```

**Required Fix:**
```javascript
socket.emit('agents:initial', [
  {
    extension: '3001',
    name: 'Agent Alice',
    status: 'available',
    currentCall: '',
    totalCalls: 15,
    registeredAt: '2025-12-16T12:00:00.000Z',
    lastStatusChange: '2025-12-16T13:30:00.000Z'  // ✅ ISO 8601 timestamp
  }
]);
```

---

## All Events That Need Fixing

### 1. `agents:initial`
```javascript
// Each agent in the array needs:
{
  extension: string,
  name: string,
  status: 'available' | 'busy' | 'break' | 'offline',
  currentCall: string,
  totalCalls: number,
  registeredAt: string,        // ISO 8601
  lastStatusChange: string     // ✅ FIX: Must be ISO 8601, not empty
}
```

### 2. `agent:registered`
```javascript
{
  extension: string,
  name: string,
  status: string,
  totalCalls: number,
  registeredAt: string,        // ISO 8601
  lastStatusChange: string     // ✅ FIX: Must be ISO 8601, not empty
}
```

### 3. `agent:status-changed`
```javascript
{
  extension: string,
  oldStatus: string,
  newStatus: string,
  timestamp: string           // ✅ FIX: Must be ISO 8601, not empty
}
```

### 4. `agent:call-started`
```javascript
{
  extension: string,
  channelId: string,
  timestamp: string           // ✅ FIX: Must be ISO 8601, not empty
}
```

### 5. `agent:call-ended`
```javascript
{
  extension: string,
  channelId: string,          // ✅ FIX: Add this field
  totalCalls: number,         // ✅ FIX: Add this field
  duration: number,           // ✅ FIX: Add this field (in seconds)
  timestamp: string           // ✅ FIX: Must be ISO 8601, not empty
}
```

### 6. `agent:unregistered` (When agent logs out)
```javascript
{
  extension: string,
  timestamp: string           // ✅ FIX: Must be ISO 8601
}
```

---

## Example Backend Fix

**Before (Broken):**
```javascript
// ❌ Wrong
io.emit('agent:call-ended', {
  extension: agent.extension
});
```

**After (Correct):**
```javascript
// ✅ Correct
io.emit('agent:call-ended', {
  extension: agent.extension,
  channelId: call.channelId,
  totalCalls: agent.totalCalls,
  duration: Math.floor((Date.now() - call.startTime) / 1000),
  timestamp: new Date().toISOString()
});
```

---

## Impact of Not Fixing

Without these fixes, the dashboard will:
1. ❌ Show "00:00" for all call timers (can't calculate duration without start time)
2. ❌ Show "--" for "Last Activity" (no timestamp to calculate from)
3. ❌ Not update total calls in real-time (need totalCalls from server)
4. ❌ Display "NaN" errors in the UI

---

## Testing the Fix

After implementing, verify these fields in browser console:

```javascript
// Should see logs like:
📋 Received initial agents: [{
  extension: "3001",
  lastStatusChange: "2025-12-16T14:30:45.123Z"  // ✅ Not empty
}]

📞 Call started: {
  extension: "3001",
  channelId: "1765784813.45",
  timestamp: "2025-12-16T14:30:45.123Z"  // ✅ Valid ISO date
}

✅ Call ended: {
  extension: "3001",
  channelId: "1765784813.45",
  totalCalls: 16,
  duration: 125,
  timestamp: "2025-12-16T14:32:50.456Z"  // ✅ Valid ISO date
}
```

---

## Summary

**Three critical fixes needed:**

1. ✅ Add `timestamp` to all events (use `new Date().toISOString()`)
2. ✅ Add `channelId`, `totalCalls`, `duration` to `agent:call-ended`
3. ✅ Populate `lastStatusChange` in initial agent data

**Priority: HIGH** - Dashboard is currently broken without these fields.
