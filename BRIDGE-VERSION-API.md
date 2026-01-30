# Bridge Version API

## Health & Version Endpoint

**Endpoint:** `GET http://10.0.3.230:3100/api/health`

**Response:**
```json
{
  "status": "ok",
  "version": "1.1.0",
  "name": "ari-communication-hub",
  "uptime": 12345.67,
  "timestamp": "2026-01-29T10:30:00.000Z",
  "connections": {
    "ari": true,
    "redis": true,
    "postgres": true
  }
}
```

## Usage in Dashboard

Display bridge version in dashboard footer or settings page for troubleshooting:

```typescript
const [bridgeInfo, setBridgeInfo] = useState(null);

useEffect(() => {
  fetch('http://10.0.3.230:3100/api/health')
    .then(res => res.json())
    .then(data => setBridgeInfo(data))
    .catch(err => console.error('Failed to fetch bridge info:', err));
}, []);

// In footer:
{bridgeInfo && (
  <div className="text-xs text-gray-500">
    Bridge v{bridgeInfo.version} | Uptime: {Math.floor(bridgeInfo.uptime / 3600)}h
  </div>
)}
```

## Version History

- **1.1.0** - Added break status preservation, stress metadata persistence, health endpoint
- **1.0.0** - Initial release
