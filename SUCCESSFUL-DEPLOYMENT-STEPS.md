# Successful Deployment Steps - Agent Dashboard

**Date:** January 10, 2026  
**Production URL:** https://livewire.ptdika.local/dashboard/  
**Server:** 10.0.3.230 (Ubuntu 22.04.5)

## Working Configuration

### PM2 Configuration (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [
    {
      name: 'agent-dashboard',
      script: 'npx',
      args: 'serve dist -l 3005',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

**Key points:**
- Uses `npx serve` (not Vite preview - has crypto issues)
- Port **3005** (must match nginx config)
- Serves from `dist/` directory
- Simple static file server

### Nginx Configuration

**File:** `/etc/nginx/sites-enabled/websip58k`

```nginx
# Agent Dashboard
location /dashboard/ {
    proxy_pass http://localhost:3005/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /dashboard {
    return 301 /dashboard/;
}

# ARI Bridge Socket.IO
location /ari-socket.io/ {
    rewrite ^/ari-socket.io/(.*) /socket.io/$1 break;
    proxy_pass http://localhost:3100;
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

**Critical:** Must be in the server block for `livewire.ptdika.local`

## Step-by-Step Deployment

### 1. Build Application Locally

```bash
# On local machine
cd d:\repos\ari-communication-web-admin
npm run build
```

This creates `dist/` folder with production assets.

### 2. Upload to Server

```bash
# From local machine
scp -r dist/* egan@10.0.3.230:/home/egan/ari-communication-web-admin/dist/
```

Or use Git:
```bash
ssh egan@10.0.3.230
cd /home/egan/ari-communication-web-admin
git pull origin master
npm run build
```

### 3. Verify Ecosystem Config

```bash
ssh egan@10.0.3.230
cd /home/egan/ari-communication-web-admin
cat ecosystem.config.cjs
# Should show: args: 'serve dist -l 3005'
```

### 4. Restart PM2 Service

```bash
# Full restart (delete and recreate)
pm2 delete agent-dashboard
pm2 start ecosystem.config.cjs
pm2 save

# Or just restart (if config unchanged)
pm2 restart agent-dashboard
pm2 save
```

### 5. Verify Service Status

```bash
# Check PM2 status
pm2 status agent-dashboard
# Should show: status: online, port in args: 3005

# Verify port listening
ss -tlnp | grep :3005
# Should show: LISTEN 0 511 *:3005

# Test local access
curl http://localhost:3005 | head -10
# Should return HTML with "Live Wire Agent Monitor"
```

### 6. Check Nginx Configuration

```bash
# Verify no conflicting server names
echo "PASSWORD" | sudo -S nginx -t
# Should NOT show warnings about conflicting server_name

# Ensure only websip58k is enabled for livewire.ptdika.local
ls -la /etc/nginx/sites-enabled/
# Should NOT have livewire-dialer.conf (causes conflict)
```

### 7. Reload Nginx

```bash
echo "PASSWORD" | sudo -S systemctl reload nginx
```

### 8. Test Public Access

```bash
# From any machine
curl -skL https://livewire.ptdika.local/dashboard/ | grep "Live Wire"
# Should return HTML with title
```

### 9. Browser Verification

Open: https://livewire.ptdika.local/dashboard/

**Expected:**
- Dashboard loads
- Shows "Live Wire Agent Monitor" title
- Connection status indicator (may show disconnected if ARI Bridge not running)
- Agent cards appear when agents register

## Verification Checklist

After deployment, verify:

- [ ] PM2 service online: `pm2 status agent-dashboard`
- [ ] Port 3005 listening: `ss -tlnp | grep :3005`
- [ ] Local access works: `curl http://localhost:3005`
- [ ] No nginx conflicts: `sudo nginx -t` (no warnings)
- [ ] Public HTTPS works: `curl -skL https://livewire.ptdika.local/dashboard/`
- [ ] Browser loads dashboard
- [ ] Socket.IO connects (if ARI Bridge running)
- [ ] Agent cards appear (if agents registered)

## Common Issues & Solutions

### Issue: 404 Not Found

**Symptoms:**
```
<title>404 Not Found</title>
nginx/1.18.0 (Ubuntu)
```

**Causes:**
1. **Nginx config conflict** - Another server block using same domain
2. **Wrong port** - PM2 using different port than nginx expects
3. **Location missing** - No `/dashboard/` location in nginx config

**Solution:**
```bash
# Check for conflicts
sudo nginx -t
# Look for: "conflicting server name"

# Check which server block handles the domain
grep -r "server_name.*livewire.ptdika.local" /etc/nginx/sites-enabled/

# Verify PM2 port matches nginx
pm2 describe agent-dashboard | grep "script args"
# Should show: serve dist -l 3005
```

### Issue: PM2 Restarts Constantly (Errored)

**Symptoms:**
```
│ status    │ errored   │
│ restarts  │ 15        │
```

**Cause:** Vite preview mode has crypto errors with Node 16

**Solution:** Use `npx serve` instead of Vite preview
```javascript
// ecosystem.config.cjs
script: 'npx',
args: 'serve dist -l 3005',
```

### Issue: Changes Not Appearing

**Cause:** Old build cached or PM2 using old config

**Solution:**
```bash
# Full rebuild
npm run build

# Full PM2 restart
pm2 delete agent-dashboard
pm2 start ecosystem.config.cjs
pm2 save

# Clear browser cache or hard refresh (Ctrl+Shift+R)
```

### Issue: Socket.IO Not Connecting

**Symptoms:** Dashboard shows "Disconnected" status

**Possible causes:**
1. ARI Bridge not running on port 3100
2. Nginx not proxying `/ari-socket.io/` correctly

**Check:**
```bash
# Verify ARI Bridge running
pm2 status ari-bridge

# Test Socket.IO endpoint
curl http://localhost:3100/socket.io/
# Should return: {"code":0,"message":"Transport unknown"}

# Check nginx location exists
grep -A 10 "location /ari-socket.io/" /etc/nginx/sites-enabled/websip58k
```

## Critical: Nginx Server Name Conflict

**Issue Encountered:** Dialer config also using `livewire.ptdika.local`

When multiple server blocks use the same `server_name`, nginx picks one and ignores others, causing 404s.

**Detection:**
```bash
sudo nginx -t
# Output: nginx: [warn] conflicting server name "livewire.ptdika.local" on 0.0.0.0:443, ignored
```

**Solution Options:**

1. **Remove conflicting config** (chosen):
```bash
sudo rm /etc/nginx/sites-enabled/livewire-dialer.conf
sudo systemctl reload nginx
```

2. **Use different domains:**
- Dashboard: `livewire.ptdika.local`
- Dialer: `dialer.ptdika.local`

3. **Merge location blocks** into one server block

See `NGINX-CONFLICT-ISSUE.md` for full details.

## Quick Deploy Command

```bash
ssh egan@10.0.3.230 'cd /home/egan/ari-communication-web-admin && \
  git pull origin master && \
  npm run build && \
  pm2 restart agent-dashboard && \
  pm2 save'
```

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| agent-dashboard | 3005 | Dashboard static files (via serve) |
| ARI Bridge | 3100 | Socket.IO server |
| ARI Bridge Socket.IO | 5000 | Original Socket.IO port |

**Note:** Port 3005 is what worked. DEPLOYMENT.md mentions 3002, but production was using 3005 due to earlier nginx configuration.

## Files Modified

- `ecosystem.config.cjs` - PM2 process definition (port 3005, npx serve)
- `/etc/nginx/sites-enabled/websip58k` - Nginx location blocks for /dashboard/
- `/etc/nginx/sites-enabled/livewire-dialer.conf` - **REMOVED** (conflict resolution)

## Success Indicators

When everything works:

```bash
$ pm2 status agent-dashboard
│ 32 │ agent-dashboard │ online │ 750212 │

$ curl -skL https://livewire.ptdika.local/dashboard/ | grep title
    <title>Live Wire Agent Monitor</title>

$ curl -sk https://livewire.ptdika.local/dashboard/assets/index-27gEqAGp.js | wc -c
123456  # Some large number (JS bundle size)
```

Browser shows Live Wire Agent Monitor with agent cards.

## Rollback Procedure

If deployment fails:

```bash
# Restore previous version
cd /home/egan/ari-communication-web-admin
git reset --hard HEAD~1
npm run build

# Restart with old code
pm2 restart agent-dashboard

# Check logs
pm2 logs agent-dashboard --lines 50
```

## Maintenance Commands

```bash
# View logs
pm2 logs agent-dashboard --lines 100

# Monitor resources
pm2 monit

# Flush logs
pm2 flush agent-dashboard

# Check process details
pm2 describe agent-dashboard

# Save configuration
pm2 save

# Auto-restart on reboot
pm2 startup
```

## Last Known Good Configuration

**Date:** January 10, 2026  
**Git Commit:** [Record commit hash here]  
**Build Assets:**
- `/dashboard/assets/index-27gEqAGp.js`
- `/dashboard/assets/index-sxqisHJ_.css`

**PM2 Process ID:** 32 (as of Jan 10, 2026 16:22 UTC)  
**Nginx Last Reload:** Jan 10, 2026 16:25 UTC

---

## Notes

- Dashboard uses **in-memory state** (no database)
- All data comes from ARI Bridge via Socket.IO
- Page refresh resets state
- Stress mode integration complete (frontend ready, backend pending)
- Backend fix needed: See `BACKEND-STRESS-MODE-FIX.md`
