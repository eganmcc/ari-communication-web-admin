# Agent Dashboard Deployment Guide

## Production Server

**Server**: 10.0.3.230  
**User**: egan / 220506Hug@  
**Project Path**: `/home/egan/ari-communication-web-admin`  
**Branch**: `master`

## Service Details

| Service | Port | PM2 Name | Purpose |
|---------|------|----------|---------|
| **agent-dashboard** | 3002 | agent-dashboard | Agent monitoring dashboard |

Connects to:
- **ARI Bridge API**: https://10.0.3.230:3100 (Socket.IO)

## Application URLs

- **Production**: https://10.0.3.230/dashboard
- **Direct Port**: http://10.0.3.230:3002 (for debugging)

## Tech Stack

- **Framework**: Vite + React 18
- **Language**: TypeScript 5
- **Runtime**: Node.js 20.19.5
- **Styling**: Tailwind CSS 3
- **Real-time**: Socket.IO Client 4.7.2
- **Process Manager**: PM2

## Initial Deployment

### 1. Clone Repository on Server

```bash
ssh egan@10.0.3.230
cd /home/egan
git clone https://github.com/eganmcc/ari-communication-web-admin.git
cd ari-communication-web-admin
git checkout master
```

### 2. Install Dependencies

```bash
# Switch to Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

# Install packages
npm install
```

### 3. Build for Production

```bash
npm run build
```

This creates the `dist/` folder with optimized static files.

### 4. Create Logs Directory

```bash
mkdir -p logs
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 6. Configure Nginx

Add to `/etc/nginx/sites-available/websip58k`:

```nginx
# Agent Dashboard
location /dashboard {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Allow direct access to dashboard assets
location /dashboard/ {
    proxy_pass http://localhost:3002/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs agent-dashboard --lines 50

# Test URL
curl http://localhost:3002
```

Visit: https://10.0.3.230/dashboard

## Updating Deployment

### Quick Deploy Script

```bash
ssh egan@10.0.3.230 'cd /home/egan/ari-communication-web-admin && \
  git pull origin master && \
  export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
  nvm use 20 && npm install && npm run build && \
  pm2 restart agent-dashboard && pm2 save'
```

### Manual Update

```bash
# 1. Connect to server
ssh egan@10.0.3.230

# 2. Navigate to project
cd /home/egan/ari-communication-web-admin

# 3. Pull latest changes
git pull origin master

# 4. Switch to Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

# 5. Install dependencies (if package.json changed)
npm install

# 6. Rebuild
npm run build

# 7. Restart PM2
pm2 restart agent-dashboard
pm2 save

# 8. Check status
pm2 status
pm2 logs agent-dashboard --lines 50
```

## Troubleshooting

### Check Application Status
```bash
pm2 status
pm2 describe agent-dashboard
```

### View Logs
```bash
# Follow logs
pm2 logs agent-dashboard

# Last 100 lines
pm2 logs agent-dashboard --lines 100

# Clear logs
pm2 flush agent-dashboard
```

### Restart Application
```bash
pm2 restart agent-dashboard
pm2 save
```

### Common Issues

#### 1. Dashboard shows "Disconnected"
**Cause**: Cannot connect to ARI Bridge at port 3100  
**Solution**: 
- Verify ARI Bridge is running: `pm2 status ari-bridge`
- Check ARI Bridge logs: `pm2 logs ari-bridge`
- Test Socket.IO: `curl http://localhost:3100/socket.io/`

#### 2. 404 on /dashboard
**Cause**: Nginx not configured or PM2 not running  
**Solution**:
- Check PM2: `pm2 status agent-dashboard`
- Test direct: `curl http://localhost:3002`
- Check Nginx: `sudo nginx -t`

#### 3. Build fails
**Cause**: Wrong Node version or missing dependencies  
**Solution**:
- Use Node 20: `nvm use 20`
- Clean install: `rm -rf node_modules && npm install`

#### 4. Agent timers stuck at 00:00
**Cause**: Backend not sending timestamps (see BACKEND-FIXES-REQUIRED.md)  
**Solution**: Dashboard uses workaround (client-side timestamps)

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs agent-dashboard
pm2 logs agent-dashboard --lines 100

# Restart
pm2 restart agent-dashboard

# Stop
pm2 stop agent-dashboard

# Start
pm2 start agent-dashboard

# Save configuration
pm2 save

# Monitor resources
pm2 monit

# Clear logs
pm2 flush
```

## Configuration Files

### Production Environment (`.env.production`)
```bash
VITE_SOCKET_URL=https://10.0.3.230:3100
```

### PM2 Configuration (`ecosystem.config.cjs`)
```javascript
{
  name: 'agent-dashboard',
  script: 'node_modules/vite/bin/vite.js',
  args: 'preview --port 3002 --host',
  instances: 1,
  exec_mode: 'cluster',
}
```

## Backend Requirements

The dashboard expects Socket.IO events from ARI Bridge (port 3100):

- `agents:initial` - Initial agent list
- `agent:registered` - Agent logged in
- `agent:unregistered` - Agent logged out
- `agent:status-changed` - Status changed
- `agent:call-started` - Call started
- `agent:call-ended` - Call ended

See `BACKEND-FIXES-REQUIRED.md` for detailed event specifications.

## Monitoring

### Check Dashboard Health
```bash
# Test Socket.IO connection
curl http://localhost:3100/socket.io/

# Test dashboard response
curl http://localhost:3002

# Check PM2 status
pm2 status

# Monitor logs
pm2 logs agent-dashboard --lines 0 --raw
```

### Performance Metrics
```bash
pm2 monit
pm2 info agent-dashboard
```

## Security Notes

- Dashboard connects to ARI Bridge over HTTPS in production
- WebSocket uses secure connection (wss://)
- Nginx handles SSL termination
- No authentication required (internal network only)

## Backup Files

Configuration files to backup:
- `/home/egan/ari-communication-web-admin/.env.production`
- `/home/egan/ari-communication-web-admin/ecosystem.config.cjs`
- `/etc/nginx/sites-available/websip58k` (dashboard section)

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Dec 16, 2025 | 1.0.0 | Initial production deployment |

## Testing Checklist

After deployment:
- [ ] https://10.0.3.230/dashboard loads
- [ ] Socket.IO connects (check connection status indicator)
- [ ] Agents appear when they log in
- [ ] Status changes update in real-time
- [ ] Call timers work (even with backend workaround)
- [ ] Total calls increment
- [ ] Last activity updates
- [ ] Agents removed when they log out
- [ ] Toast notifications appear
- [ ] Responsive design works on mobile/tablet

## Support

For issues, check:
1. PM2 logs: `pm2 logs agent-dashboard`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Browser console for JavaScript errors
4. Network tab for Socket.IO connection issues
