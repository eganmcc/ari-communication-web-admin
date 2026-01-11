# ARI Bridge - Stress Mode Socket.IO Fix Required

## Issue
The dashboard is not displaying stress mode UI because the `agent:call-started` Socket.IO event is missing stress mode metadata fields.

## Current Behavior

### What's Working ✅
- Stress mode is detected correctly in ARI Bridge
- Logs show: `🎪 Stress mode ENABLED: 1767549189.125 will run for 121s`
- Audio is playing to agent channel correctly
- Call auto-hangup timer is working

### What's Broken ❌
The `agent:call-started` Socket.IO event is currently emitting:
```javascript
{
  extension: "3001",
  channelId: "1767549189.125",
  timestamp: "2026-01-04T17:53:13.036Z"
}
```

**Missing fields:** `isStressMode`, `stressDuration`, `callType`

## Required Fix

When emitting the `agent:call-started` event for stress mode calls, include the stress metadata:

```javascript
// Current (WRONG)
io.emit('agent:call-started', {
  extension: agent.extension,
  channelId: channelId,
  timestamp: new Date().toISOString()
});

// Required (CORRECT)
io.emit('agent:call-started', {
  extension: agent.extension,
  channelId: channelId,
  timestamp: new Date().toISOString(),
  isStressMode: true,              // Add this for stress calls
  stressDuration: 121,             // Add the duration in seconds
  callType: 'stress-test'          // Add call type identifier
});
```

## Location to Fix

Look for the code that emits `agent:call-started` events. It's likely in the agent call handling logic, around where you see:

```javascript
io.emit('agent:call-started', { ... });
```

## Implementation Guide

### Step 1: Detect Stress Mode
You already have this - the logs show stress mode detection working.

### Step 2: Store Stress Duration
When stress mode is enabled and duration is calculated, store it:
```javascript
let stressModeData = null;

if (isStressMode) {
  const duration = calculateStressDuration(); // Your existing logic
  stressModeData = {
    isStressMode: true,
    stressDuration: duration,
    callType: 'stress-test'
  };
  console.log(`🎪 Stress mode ENABLED: ${channelId} will run for ${duration}s`);
}
```

### Step 3: Include in Socket.IO Event
When emitting `agent:call-started`, include the stress data:
```javascript
const eventData = {
  extension: agent.extension,
  channelId: channelId,
  timestamp: new Date().toISOString(),
  ...(stressModeData || {})  // Spread stress mode fields if present
};

io.emit('agent:call-started', eventData);

// Log for debugging
if (stressModeData) {
  console.log('🔄 Emitted agent:call-started with stress mode:', eventData);
}
```

## Testing

### Before Fix
Dashboard shows normal busy call (red border, no stress indicator)

### After Fix
Dashboard should show:
- Orange background (`bg-orange-50`)
- Orange border (`border-orange-400`)
- 🎪 STRESS TEST badge
- Countdown timer (e.g., `02:01`)
- Timer turns red when under 30 seconds

### Test Command
```bash
curl -sk -u 'asterisk:D1k4@4r1#D1k4' \
  -X POST "https://10.0.3.229:8089/ari/channels" \
  -d "endpoint=PJSIP/1000@sipp_medium" \
  -d "app=Livewire-ARI-Bridge0001" \
  -d "appArgs=customer,stress=true" \
  -d "callerId=StressTest"
```

### Verify in Browser Console
After fix, you should see:
```
📞 Call started: 
{
  extension: "3001",
  channelId: "1767549189.125",
  timestamp: "2026-01-04T17:53:13.036Z",
  isStressMode: true,        ← Should be present
  stressDuration: 121,       ← Should be present
  callType: "stress-test"    ← Should be present
}
🎪 STRESS TEST MODE detected - Duration: 121 seconds
🎪 Stress end time set to: 2026-01-04T17:55:14.036Z
```

## Dashboard Integration Status

✅ **Dashboard is ready** - All code is deployed and waiting for backend data:
- Type definitions include stress fields
- Socket handler processes stress metadata
- Countdown timer hook implemented
- Orange themed UI ready
- Auto-cleanup on call end

❌ **Backend not sending data** - Just needs to emit the 3 additional fields

## Example: Complete Event Flow

```javascript
// 1. Detect stress mode (you already have this)
const isStressMode = checkStressMode(appArgs);
let stressConfig = null;

if (isStressMode) {
  const duration = randomBetween(STRESS_MIN, STRESS_MAX); // e.g., 121
  stressConfig = {
    isStressMode: true,
    stressDuration: duration,
    callType: 'stress-test'
  };
  
  // Start auto-hangup timer
  setTimeout(() => {
    hangupChannel(channelId);
  }, duration * 1000);
  
  console.log(`🎪 Stress mode ENABLED: ${channelId} will run for ${duration}s`);
}

// 2. When agent answers and call starts
const callData = {
  extension: '3001',
  channelId: '1767549189.125',
  timestamp: new Date().toISOString(),
  ...stressConfig  // Add stress fields here
};

io.emit('agent:call-started', callData);

if (stressConfig) {
  console.log('🔄 Stress mode data sent to dashboard:', callData);
}
```

## Priority
**HIGH** - Stress mode feature is 90% complete. Only this one change needed.

## Contact
Dashboard developer: Ready to test immediately after backend fix is deployed.

## Verification Checklist
- [ ] `isStressMode` field present in event
- [ ] `stressDuration` field present (number of seconds)
- [ ] `callType` field present (value: 'stress-test')
- [ ] Dashboard shows orange theme
- [ ] Dashboard shows 🎪 badge
- [ ] Countdown timer displays and updates
- [ ] Timer turns red under 30 seconds
- [ ] Stress UI clears when call ends

## Reference
See `WEBSIP-STRESS-MODE-INTEGRATION.md` for complete specification.
