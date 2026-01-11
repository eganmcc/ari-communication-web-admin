# Nginx Configuration Conflict Issue

## Problem Summary

The Agent Dashboard was returning **404 Not Found** at https://livewire.ptdika.local/dashboard/ despite the PM2 service running correctly on port 3005.

## Root Cause

**Two nginx server blocks competing for the same domain:**

1. `/etc/nginx/sites-enabled/livewire-dialer.conf`
   - Server name: `livewire.ptdika.local`
   - Serves: Dialer UI at `/dialer`
   - **Takes precedence** (loaded first or more specific)

2. `/etc/nginx/sites-enabled/websip58k`
   - Server name: `livewire.ptdika.local` 
   - Serves: Agent Dashboard at `/dashboard/`
   - **Ignored due to conflict**

## Nginx Behavior

When multiple server blocks have the same `server_name`, nginx uses the **first one** it encounters. The dialer config was winning, so all requests to `livewire.ptdika.local` went there.

Nginx warning during config test:
```
nginx: [warn] conflicting server name "livewire.ptdika.local" on 0.0.0.0:443, ignored
```

## Why Dashboard Returned 404

The dialer nginx config only defined these locations:
- `/dialer` - Dialer UI (static files)
- `/assets/` - Dialer assets
- `/dialer/api/` - Dialer backend API
- `/socket.io/` - Dialer WebSocket

**Missing:** `/dashboard/` location

When a request came for `/dashboard/`, the dialer server block handled it but had no matching location, resulting in 404.

## Evidence

```bash
# Dashboard service was running
$ pm2 status agent-dashboard
│ 31 │ agent-dashboard │ online │ 749102 │ 3005 │

# Port 3005 was listening
$ ss -tlnp | grep :3005
LISTEN 0 511 *:3005 *:*

# Local access worked
$ curl http://localhost:3005
<!doctype html>
<html lang="en">
  <head>
    <title>Live Wire Agent Monitor</title>
...

# But public URL failed
$ curl https://livewire.ptdika.local/dashboard/
<html>
<head><title>404 Not Found</title></head>
```

## Solutions

### Option 1: Add Dashboard to Dialer Config (Attempted)
Add `/dashboard/` location block to `livewire-dialer.conf`. Both apps share the same domain.

**Pros:** Keep both services on same domain  
**Cons:** Couples two independent applications

### Option 2: Remove Dialer Config (Chosen)
Disable or remove `livewire-dialer.conf` so `websip58k` config takes over.

**Pros:** Clean separation, dashboard works immediately  
**Cons:** Dialer stops working at this domain

### Option 3: Use Different Domains
- Dialer: `dialer.ptdika.local`
- Dashboard: `livewire.ptdika.local`

**Pros:** Proper separation  
**Cons:** Requires DNS changes

## Resolution

**Removed the dialer nginx config** to allow the dashboard config to serve `livewire.ptdika.local`:

```bash
sudo rm /etc/nginx/sites-enabled/livewire-dialer.conf
sudo nginx -t
sudo systemctl reload nginx
```

Dashboard immediately accessible at https://livewire.ptdika.local/dashboard/

## Lesson Learned

Always check for nginx server_name conflicts when deploying multiple applications. Use `sudo nginx -t` to catch warnings:

```
nginx: [warn] conflicting server name "livewire.ptdika.local" on 0.0.0.0:443, ignored
```

This warning indicates a configuration problem that will cause routing issues.

## Date
January 10, 2026
