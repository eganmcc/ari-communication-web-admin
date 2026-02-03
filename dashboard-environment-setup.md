# Dashboard Environment Configuration Guide for DevOps

## Overview

The Agent Dashboard (v1.2.0+) requires environment variables to configure WebSocket connections to backend services. All server URLs and domains are now fully configurable via environment variables - **no hardcoded IPs or domains in source code**.

## Quick Start

### 1. Create Environment File

```bash
cd /home/egan/ari-communication-web-admin
cp .env.example .env
```

### 2. Edit Configuration

```bash
nano .env
```

### 3. Configure Variables

```bash
# Production domain (used for Socket.IO connections)
VITE_SERVER_DOMAIN=https://your-domain.com

# ARI Bridge Socket.IO URL (port 3100)
VITE_SOCKET_URL=https://your-domain.com

# Voice API URL (port 3001)
VITE_API_URL=https://your-domain.com

# Dialer API URL (port 4001)
VITE_DIALER_URL=https://your-domain.com
```

### 4. Build and Deploy

```bash
npm run build
pm2 restart agent-dashboard
```

## Environment Variables Reference

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `VITE_SERVER_DOMAIN` | Base domain for the application | Yes | `https://livewire.ptdika.local` |
| `VITE_SOCKET_URL` | ARI Bridge WebSocket connection (port 3100) | Yes | `https://livewire.ptdika.local` |
| `VITE_API_URL` | Voice API WebSocket connection (port 3001) | Yes | `https://livewire.ptdika.local` |
| `VITE_DIALER_URL` | Dialer API WebSocket connection (port 4001) | Yes | `https://livewire.ptdika.local` |

### Important Notes

- All variables are **required** - the application will not connect without them
- Variables prefixed with `VITE_` are compiled into the build at build-time
- Environment variables must be set **before running `npm run build`**
- Nginx must proxy the following Socket.IO paths:
  - `/ari-socket.io/` → `http://localhost:3100/socket.io/`
  - `/voice-api-socket.io/` → `http://localhost:3001/socket.io/`
  - `/dialer-socket.io/` → `http://localhost:4001/socket.io/`

## Deployment Scenarios

### Production (HTTPS with Domain)

**File:** `.env`

```bash
VITE_SERVER_DOMAIN=https://livewire.ptdika.local
VITE_SOCKET_URL=https://livewire.ptdika.local
VITE_API_URL=https://livewire.ptdika.local
VITE_DIALER_URL=https://livewire.ptdika.local
```

**Nginx Configuration Required:**
- SSL/TLS certificate configured
- WebSocket upgrade headers enabled
- Proxy paths configured (see below)

### Staging/Development (HTTP with IP)

**File:** `.env`

```bash
VITE_SERVER_DOMAIN=http://192.168.1.100
VITE_SOCKET_URL=http://192.168.1.100:3100
VITE_API_URL=http://192.168.1.100:3001
VITE_DIALER_URL=http://192.168.1.100:4001
```

**Note:** Direct port access requires firewall rules allowing ports 3100, 3001, 4001

### Multi-Environment Setup

Create separate env files:

```bash
.env.production
.env.staging
.env.development
```

Build for specific environment:

```bash
# Production
cp .env.production .env
npm run build

# Staging
cp .env.staging .env
npm run build
```

## Nginx Configuration Requirements

### Socket.IO Proxy Paths

The dashboard requires these nginx location blocks:

```nginx
# ARI Bridge Socket.IO (port 3100)
location /ari-socket.io/ {
    proxy_pass http://localhost:3100/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Voice API Socket.IO (port 3001)
location /voice-api-socket.io/ {
    proxy_pass http://localhost:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Dialer Socket.IO (port 4001)
location /dialer-socket.io/ {
    proxy_pass http://localhost:4001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Dashboard Application (port 3005)
location /dashboard {
    proxy_pass http://localhost:3005;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Verification Steps

### 1. Check Environment File Exists

```bash
cd /home/egan/ari-communication-web-admin
ls -la .env
cat .env
```

Expected output:
```
VITE_SERVER_DOMAIN=https://livewire.ptdika.local
VITE_SOCKET_URL=https://livewire.ptdika.local
VITE_API_URL=https://livewire.ptdika.local
VITE_DIALER_URL=https://livewire.ptdika.local
```

### 2. Verify Build Includes Environment Variables

```bash
# After building, check that URLs are compiled into JS bundle
cd dist/assets
grep -o 'https://[^"]*' index-*.js | head -5
```

Should show your domain, not hardcoded IPs.

### 3. Test Backend Service Connectivity

```bash
# Test ARI Bridge
curl -k https://your-domain.com/ari-socket.io/socket.io/?EIO=4&transport=polling

# Test Voice API
curl -k https://your-domain.com/voice-api-socket.io/socket.io/?EIO=4&transport=polling

# Test Dialer
curl -k https://your-domain.com/dialer-socket.io/socket.io/?EIO=4&transport=polling
```

Expected: Each should return JSON with `{"sid":"..."}` indicating Socket.IO is reachable.

### 4. Check Dashboard Status

```bash
pm2 status agent-dashboard
pm2 logs agent-dashboard --lines 50
```

Expected: No connection errors in logs.

### 5. Browser Console Check

Open `https://your-domain.com/dashboard/` and check browser console:

**Expected logs:**
```
✅ Connected to server
✅ Connected to voice-api
✅ Connected to dialer
```

**Not expected (connection errors):**
```
❌ Failed to connect to server
❌ WebSocket connection failed
```

## Troubleshooting

### Issue: Dashboard Shows "Disconnected"

**Symptoms:**
- ARI Bridge status shows red/disconnected
- Browser console shows connection errors

**Check:**

1. **Environment variables set?**
   ```bash
   cat /home/egan/ari-communication-web-admin/.env
   ```

2. **Backend services running?**
   ```bash
   pm2 status | grep -E "ari-bridge|voice-api|dialer"
   ```

3. **Nginx proxying correctly?**
   ```bash
   curl -k https://your-domain.com/ari-socket.io/socket.io/?EIO=4&transport=polling
   ```

4. **Rebuild after env changes?**
   ```bash
   cd /home/egan/ari-communication-web-admin
   npm run build
   pm2 restart agent-dashboard
   ```

### Issue: "Cannot connect to wss://undefined/..."

**Cause:** Environment variables not set before build.

**Solution:**
1. Verify `.env` file exists and contains all variables
2. Rebuild: `npm run build`
3. Restart: `pm2 restart agent-dashboard`

### Issue: Mixed Content Error (HTTP/HTTPS)

**Cause:** Environment variables use `http://` but dashboard served via `https://`

**Solution:**
```bash
# Update .env to use https:// for all URLs
nano .env

# Change:
# VITE_SOCKET_URL=http://...
# To:
# VITE_SOCKET_URL=https://...

npm run build
pm2 restart agent-dashboard
```

### Issue: 404 on Socket.IO paths

**Cause:** Nginx proxy paths not configured.

**Solution:**
1. Edit nginx config: `sudo nano /etc/nginx/sites-enabled/websip58k`
2. Add Socket.IO location blocks (see above)
3. Test config: `sudo nginx -t`
4. Reload: `sudo systemctl reload nginx`

## Backend Service Dependencies

The dashboard **requires** these backend services to be running:

| Service | Port | PM2 Name | Socket.IO Path | Purpose |
|---------|------|----------|----------------|---------|
| ARI Bridge | 3100 | `ari-bridge` | `/ari-socket.io/` | Call monitoring, agent status |
| Voice API | 3001 | `voice-api` | `/voice-api-socket.io/` | API version, notifications |
| Dialer | 4001 | `dialer-ui-fresh` | `/dialer-socket.io/` | Dialer engine status |

**Check all services:**
```bash
pm2 status | grep -E "ari-bridge|voice-api|dialer"
```

**Restart all services:**
```bash
pm2 restart ari-bridge voice-api dialer-ui-fresh
```

## Security Considerations

### .env File Permissions

```bash
# Restrict access to environment file
chmod 600 .env
chown egan:egan .env
```

### .gitignore

The `.env` file is git-ignored by default. Never commit actual credentials:

```bash
# Check .gitignore includes .env
cat .gitignore | grep "^\.env$"
```

### Secrets Management

For production environments, consider:
- Using secrets management tools (HashiCorp Vault, AWS Secrets Manager)
- Environment variables from CI/CD pipelines
- Encrypted configuration files

## Deployment Checklist

- [ ] Backend services (ari-bridge, voice-api, dialer) are running
- [ ] Nginx configured with Socket.IO proxy paths
- [ ] SSL/TLS certificate valid (if using HTTPS)
- [ ] `.env` file created with correct domain/URLs
- [ ] `.env` file has correct permissions (600)
- [ ] `npm run build` completed successfully
- [ ] `pm2 restart agent-dashboard` executed
- [ ] Dashboard accessible at configured URL
- [ ] Browser console shows all three "Connected" messages
- [ ] No "Disconnected" status indicators

## Support

**Version:** 1.2.0+  
**Documentation Date:** February 3, 2026  
**Repository:** https://github.com/eganmcc/ari-communication-web-admin

For issues:
1. Check PM2 logs: `pm2 logs agent-dashboard`
2. Verify backend services: `pm2 status`
3. Test Socket.IO endpoints: `curl -k https://your-domain.com/ari-socket.io/socket.io/?EIO=4&transport=polling`
4. Review nginx error logs: `sudo tail -50 /var/log/nginx/error.log`
