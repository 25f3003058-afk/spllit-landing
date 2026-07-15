# Cloudflare Workers Hybrid Migration Guide

**Date:** 2026-07-15  
**Version:** 1.0.0  
**Status:** Implementation Phase

---

## 📋 Executive Summary

This document outlines the hybrid migration of Spllit's backend to Cloudflare Workers. Only stateless, read-heavy endpoints are migrated to Workers for improved latency and cost. Complex features (Socket.IO, file uploads, background jobs) remain on Render.

**Expected Results:**
- ⚡ 50-100ms latency (vs. 500ms+ on Render)
- 💰 Reduced hosting costs (Workers are cheaper at scale)
- ✅ Zero downtime migration
- ✅ All features preserved

---

## 🏗️ Architecture Overview

### Before
```
Frontend (Vercel)
       ↓
Render Backend (All endpoints)
       ↓
Supabase (Database)
```

### After (Hybrid)
```
Frontend (Vercel)
    ↙    ↘
    ↓      ↓
Workers  Render
(Auth,   (Socket.IO,
Query)   Uploads,
   ↓      Jobs)
   ├──────┴──→ Supabase (Database)
```

---

## 📦 Cloudflare Workers Project Structure

```
backend/workers/
├── src/
│   ├── index.ts                  # Worker entry point
│   ├── middleware/
│   │   └── auth.ts               # JWT validation, CORS
│   ├── routes/
│   │   ├── auth.ts               # Authentication endpoints
│   │   └── public.ts             # Public data endpoints
│   ├── utils/
│   │   └── helpers.ts            # JWT, password, responses
│   └── types/
│       └── schemas.ts            # Zod validation schemas
├── wrangler.toml                 # Cloudflare configuration
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── deploy.sh                     # Deployment script
├── .env.example                  # Environment template
└── .gitignore
```

---

## 🔀 Endpoints Routing

### Cloudflare Workers (Fast ⚡)
These endpoints are stateless and cached for maximum performance:

```
POST   /api/auth/login              (Cache: 1 min)
POST   /api/auth/register           (Cache: N/A - no cache)
POST   /api/auth/firebase-login     (Cache: N/A - no cache)
POST   /api/auth/google             (Cache: N/A - no cache)
POST   /api/auth/refresh-token      (Cache: N/A - no cache)

GET    /api/announcements           (Cache: 10 min)
GET    /api/rides/search            (Cache: 2 min)
GET    /api/users/:id               (Cache: 10 min)
```

### Render Backend (Feature-complete 🎯)
These endpoints require stateful operations, file I/O, or WebSocket:

```
POST   /api/rides                   (Create ride)
POST   /api/matches                 (Match operations)
POST   /api/emergency/sos           (Emergency alerts - WebSocket)
POST   /api/automation/send         (Email campaign - long-running)
GET    /api/chat/:rideId            (WebSocket upgrade)
POST   /api/uploads                 (File uploads)
... (all other mutations and complex operations)
```

---

## 🔐 Environment Variables & Secrets

### Cloudflare Secrets (Use `wrangler secret put`)

These MUST be stored as Cloudflare Secrets, never in wrangler.toml:

```
JWT_SECRET                    # JWT signing key (from Render .env)
JWT_REFRESH_SECRET            # Refresh token signing key
FIREBASE_API_KEY              # (Optional) Direct Firebase access
```

### Cloudflare Variables (In wrangler.toml)

```
RENDER_BACKEND_URL            # https://spllit-backend.onrender.com
ENVIRONMENT                   # production / staging
```

### How to Set Secrets

```bash
# Interactively
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET

# From environment variable
echo $JWT_SECRET | wrangler secret put JWT_SECRET

# For staging
wrangler secret put JWT_SECRET --env staging
```

---

## 🚀 Deployment Steps

### 1. Prerequisites
```bash
# Install Cloudflare CLI
npm install -g @cloudflare/wrangler

# Authenticate
wrangler login
```

### 2. First-time Setup
```bash
# Navigate to workers directory
cd backend/workers

# Install dependencies
npm install

# Build
npm run build

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
```

### 3. Deploy
```bash
# Production
npm run deploy

# Staging
npm run deploy:staging

# Or use script
./deploy.sh production
./deploy.sh staging
```

### 4. Verify Deployment
```bash
# Check health
curl https://api.spllit.app/health

# View logs
npm run tail

# Test auth endpoint
curl -X POST https://api.spllit.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🔄 Frontend Integration

### Update Frontend API Configuration

**File:** `src/config/backendUrl.js`

```javascript
// Determine which backend to use based on endpoint type
const WORKERS_API_BASE = 'https://api.spllit.app/api';
const RENDER_API_BASE = 'https://spllit-backend.onrender.com/api';

export function getApiUrl(endpoint) {
  // Fast endpoints on Workers
  const workersEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/firebase-login',
    '/auth/google',
    '/auth/refresh-token',
    '/announcements',
    '/rides/search',
    '/users'
  ];

  const isWorkersEndpoint = workersEndpoints.some(ep => endpoint.includes(ep));
  return isWorkersEndpoint ? WORKERS_API_BASE : RENDER_API_BASE;
}
```

### Update API Service

**File:** `src/services/api.js`

```javascript
import { getApiUrl } from '../config/backendUrl';

export const authAPI = {
  login: (email, password) => {
    const url = getApiUrl('/auth/login');
    return fetch(`${url}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  // ... other methods
};
```

---

## 📊 Performance Expectations

### Latency Improvements

| Endpoint | Render | Workers | Improvement |
|----------|--------|---------|-------------|
| `/auth/login` | 500ms | 50ms | **10x faster** |
| `/rides/search` | 400ms | 80ms | **5x faster** |
| `/announcements` | 350ms | 40ms | **8.7x faster** |

### Cost Analysis

**Render (Current):**
- $7/month (starter)
- Cold start: 30-60s
- Memory: Always allocated

**Workers (Proposed):**
- Free tier: 100,000 requests/day
- Paid: $0.50 per 1M requests (after free tier)
- Cold start: 0ms (instant)
- Memory: Per-request (pay only for used)

**Estimated Monthly Cost:**
- 1M requests/month: ~$0.50 (Workers) vs. ~$7 (Render)
- 10M requests/month: ~$5 (Workers) vs. ~$100 (Render scaling)

---

## ⚠️ Important: What Still Requires Render

Do NOT migrate these to Workers:

### 1. WebSocket/Socket.IO Endpoints
- Real-time chat (`/socket.io/*`)
- Location tracking
- Emergency alerts
- Ride matching updates

**Reason:** Workers disconnects after 30 seconds; Socket.IO requires persistent connections.

**Alternative:** If needed later, use Cloudflare Durable Objects with WebSocket API.

### 2. File Upload Endpoints
- CSV imports (`/api/automation/csv`)
- Profile image uploads
- Document uploads

**Reason:** Workers have no persistent file system; can't use `multer` or `fs` module.

**Alternative:** Migrate to Cloudflare R2 (object storage) in Phase 2.

### 3. Long-Running Jobs
- Email campaign automation (30+ mins)
- Ride/match expiry cleanup
- Bulk user operations

**Reason:** Workers timeout after 30 seconds.

**Alternative:** Use external cron service (EasyCron, cron-job.org) or Cloudflare Cron Triggers (beta).

---

## 🔄 Rollback Plan

If issues occur after deployment:

```bash
# Revert to Render-only (disable Workers)
1. Update frontend config to use RENDER_API_BASE for all endpoints
2. Redeploy frontend
3. Undeploy Workers: wrangler undeploy

# Or point DNS back to Render (if using separate subdomain)
dns: api.spllit.app -> CNAME render-backend.onrender.com
```

---

## 📝 Checklist for Production Deployment

- [ ] All secrets configured in Cloudflare (`wrangler secret list`)
- [ ] Build passes without errors (`npm run build`)
- [ ] Tests pass locally (`npm run test`)
- [ ] Health endpoint responds (`curl /health`)
- [ ] Auth endpoints tested with valid/invalid credentials
- [ ] CORS headers verified from frontend
- [ ] Frontend updated to route to Workers API
- [ ] Render backend still running (for non-Workers endpoints)
- [ ] Monitoring/logging configured (Cloudflare tail)
- [ ] Rollback plan documented

---

## 🔗 Useful Commands

```bash
# Navigation
cd backend/workers

# Development
npm run dev                    # Local testing
npm run build                  # Compile TypeScript

# Deployment
npm run deploy                 # Production
npm run deploy:staging         # Staging
npm run preview                # Dry-run

# Management
wrangler secret list           # View all secrets
wrangler secret put <name>     # Add/update secret
npm run tail                   # Stream live logs

# Debugging
curl https://api.spllit.app/health
curl https://api.spllit.app/api/announcements
```

---

## 📚 Useful Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework Docs](https://hono.dev/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Secrets Management](https://developers.cloudflare.com/workers/platform/environment-variables/#secrets)
- [KV Namespace (Caching)](https://developers.cloudflare.com/workers/runtime-apis/kv/)

---

## 📞 Support & Troubleshooting

### Endpoint returns 503 (Backend Unavailable)
- Check if Render backend is online
- Verify RENDER_BACKEND_URL is correct
- Check Render logs for errors

### CORS errors in browser
- Verify origins are listed in wrangler.toml
- Check request headers match allowed methods
- Test with curl (bypasses CORS)

### High latency
- Check Cloudflare Analytics Dashboard
- Verify KV cache is working (X-Cache header)
- Review log output with `npm run tail`

---

**Next Steps:**
1. Deploy Workers to staging first
2. Run load tests and verify endpoints
3. Update frontend in staging
4. Promote to production after 1-2 weeks testing
