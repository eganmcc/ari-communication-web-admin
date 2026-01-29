# Bridge Status Event Issue

**Date:** 2026-01-28  
**Reporter:** Dashboard Team  
**Severity:** High (Dashboard shows incorrect agent status)

---

## Problem

Dashboard is not receiving `agent:status-changed` Socket.IO events when agents go offline or on break, causing the dashboard to display stale status information.

### Example Cases

1. **Agent 075:**
   - Bridge API shows: `"status":"offline"`
   - Dashboard shows: `Available`
   - Expected: Dashboard should show `Offline`

2. **Agent on Break:**
   - Bridge API shows: `"status":"break_short"` or `"status":"break_long"`
   - Dashboard shows: Previous status (Available/Busy)
   - Expected: Dashboard should show break status with amber indicator

---

## Root Cause

The ARI Bridge is **NOT emitting** `agent:status-changed` Socket.IO events when:
1. Agents go offline (unregister/disconnect)
2. Agents set break status (break_short, break_long)
3. Agents return from break

**Evidence:**
```bash
# No status change events in bridge logs for agent 3075
pm2 logs ari-bridge --lines 100 | grep -E "(3075|status.*changed|offline|break)"
# Result: No output
```

---

## What Works

✅ `agent:call-started` - Dashboard receives and displays correctly  
✅ `agent:call-ended` - Dashboard receives and updates correctly  
✅ `agent:registered` - Dashboard receives when agents log in  
✅ `agents:initial` - Dashboard receives initial agent list on connection

---

## What's Missing

❌ `agent:status-changed` event NOT emitted when:
- Agent status changes to `offline`
- Agent status changes to `break_short`
- Agent status changes to `break_long`
- Agent returns from break to `available`

---

## Expected Event Format

When agent status changes, bridge should emit:

```javascript
io.emit('agent:status-changed', {
  extension: '3075',
  oldStatus: 'available',
  newStatus: 'offline',  // or 'break_short', 'break_long'
  timestamp: '2026-01-28T09:16:13.751Z',
  // For break status:
  breakType: 'short',    // or 'long' (optional, for breaks only)
  breakEndTime: '2026-01-28T09:31:13.751Z',  // (optional)
  breakDuration: 900     // seconds (optional)
});
```

---

## Dashboard Status

✅ Dashboard code is correct and ready to handle these events  
✅ Event handlers properly update agent status in real-time  
✅ Break status displays with amber theme and icons  
✅ Offline status displays correctly when event received

**The dashboard just needs the bridge to emit the events.**

---

## Testing Checklist

After bridge fix, verify:

- [ ] Agent goes offline → Dashboard immediately shows "Offline"
- [ ] Agent sets break_short → Dashboard shows "☕ SHORT BREAK" with amber theme
- [ ] Agent sets break_long → Dashboard shows "🍽️ LUNCH BREAK" with amber theme
- [ ] Agent on break takes call → Dashboard shows "Busy" during call
- [ ] Agent on break call ends → Dashboard returns to showing break status
- [ ] Agent ends break → Dashboard shows "Available"
- [ ] No page refresh needed for any status change

---

## Bridge API Verification

Current bridge API endpoint works correctly:
```bash
curl http://10.0.3.230:3100/api/agents
```

This returns accurate real-time status. The issue is **only with Socket.IO event emission**, not with status tracking.

---

**Action Required:** Bridge team needs to ensure `agent:status-changed` events are emitted for ALL status transitions, not just during call state changes.

**Contact:** Dashboard team ready to test once bridge fix is deployed.
