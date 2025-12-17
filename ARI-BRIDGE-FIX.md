# ARI Bridge Backend Fix Required

## Issue: Agent Name Display

**Problem:** Agent names are showing as "Agent 3001" instead of "Agent 001"

**Root Cause:** The ARI Bridge backend is using the full SIP extension number (3001) instead of formatting it as a sequential agent number (001).

## Location to Fix

Search in the ARI Bridge backend for where agent names are created. Look for:

1. **Agent Registration Handler** - Where agents are first registered
2. **Socket.IO Event Emission** - Where `agents:initial` and `agent:registered` events are emitted

## Expected Format

The agent name should be formatted as:
```javascript
const agentName = `Agent ${extension.slice(-3).padStart(3, '0')}`;
// Extension 3001 → "Agent 001"
// Extension 3002 → "Agent 002"
// Extension 3010 → "Agent 010"
```

## Files to Check

Look for these patterns in the ARI Bridge code:

```javascript
// WRONG - Don't do this
name: `Agent ${extension}`  // Results in "Agent 3001"

// CORRECT - Format the extension
name: `Agent ${extension.slice(-3).padStart(3, '0')}`  // Results in "Agent 001"
```

## Socket.IO Events Affected

The following Socket.IO events send agent data with names:

1. `agents:initial` - Initial list of all registered agents
2. `agent:registered` - When a new agent registers
3. Any other event that includes agent information

## Testing

After fixing:
1. Restart the ARI Bridge service
2. Register an agent with extension 3001
3. Check the dashboard - should show "Agent 001" not "Agent 3001"

## Dashboard Expectation

The dashboard displays whatever name is sent from the backend - it does not format or modify it.
