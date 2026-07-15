# Cloudflare Workers Deployment Checklist

## Pre-Deployment (1-2 days before)

### Account & Permissions
- [ ] Cloudflare account created
- [ ] Domain (spllit.app) added to Cloudflare
- [ ] DNS nameservers updated
- [ ] wrangler CLI authenticated (`wrangler login`)

### Secrets & Configuration
- [ ] JWT_SECRET value obtained from Render backend
- [ ] JWT_REFRESH_SECRET value obtained from Render backend
- [ ] Firebase API Key obtained (if needed)
- [ ] RENDER_BACKEND_URL verified (https://spllit-backend.onrender.com)

### Code Review
- [ ] All TypeScript files compile without errors (`npm run build`)
- [ ] ESLint passes (if configured)
- [ ] Security review completed
- [ ] CORS origins are correct in src/index.ts

## Staging Deployment (Test Environment)

### Setup
- [ ] Staging subdomain created (api-staging.spllit.app)
- [ ] Staging Cloudflare Worker created
- [ ] `wrangler.toml` configured for staging

### Secrets
```bash
wrangler secret put JWT_SECRET --env staging
wrangler secret put JWT_REFRESH_SECRET --env staging
```
- [ ] All secrets set in staging environment
- [ ] Secrets verified: `wrangler secret list --env staging`

### Build & Deploy
- [ ] Dependencies installed: `npm install`
- [ ] Build succeeds: `npm run build`
- [ ] Local testing passes: `npm run dev` → test endpoints
- [ ] Deploy to staging: `npm run deploy:staging`

### Testing
- [ ] Health check responds: `curl https://api-staging.spllit.app/health`
- [ ] Auth endpoint works: `curl -X POST https://api-staging.spllit.app/api/auth/login`
- [ ] Error handling works (test invalid credentials)
- [ ] CORS headers present in response
- [ ] Logs are accessible: `wrangler tail --env staging`

### Frontend Integration (Staging)
- [ ] Frontend .env updated with staging Workers URL
- [ ] Frontend deployed to staging
- [ ] Login flow tested end-to-end
- [ ] Network tab shows Workers API being called
- [ ] No console errors

### Load Testing
- [ ] Run 100 concurrent requests to auth endpoint
- [ ] Monitor Cloudflare dashboard for errors
- [ ] Check cache hit rates (should be >70%)
- [ ] Verify no timeouts or 503 errors

### Security Review
- [ ] Secrets not exposed in logs
- [ ] CORS restrictions working
- [ ] Invalid requests return 400/401 (not 500)
- [ ] Rate limiting working (if configured)

## Production Deployment (Go-Live)

### Pre-Flight Checks
- [ ] Staging tests completed successfully (all items above passed)
- [ ] Render backend is running and healthy
- [ ] Frontend is ready to deploy with new routing
- [ ] Rollback plan is documented and tested
- [ ] On-call team notified of deployment window

### Secrets Setup
```bash
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
```
- [ ] Production secrets set
- [ ] Secrets verified: `wrangler secret list`

### DNS Configuration
- [ ] `api.spllit.app` CNAME points to Cloudflare worker
- [ ] DNS propagated (check with `dig api.spllit.app`)
- [ ] TTL lowered to 5 minutes (for quick rollback if needed)

### Deployment
- [ ] Production build succeeds: `npm run build`
- [ ] Deploy to production: `npm run deploy`
- [ ] Verify deployment: `wrangler deployments list`

### Post-Deployment Verification (15 minutes)

**Health & Basic Functionality**
- [ ] Health endpoint responds: `curl https://api.spllit.app/health`
- [ ] Authentication works: Test login with valid credentials
- [ ] Error handling works: Test login with invalid credentials (should return 401)
- [ ] Announcements endpoint works: `curl https://api.spllit.app/api/announcements`

**Performance**
- [ ] Latency < 200ms (check Cloudflare dashboard)
- [ ] Error rate < 0.5% (check dashboard)
- [ ] No timeout errors (check logs)

**Browser Testing**
- [ ] Frontend loads successfully
- [ ] Login flow works end-to-end
- [ ] No CORS errors in console
- [ ] Vercel frontend displays data correctly

**Monitoring Setup**
- [ ] Cloudflare alerts configured
- [ ] Email notifications enabled for errors
- [ ] Slack integration (if available) connected
- [ ] Start monitoring logs: `npm run tail`

### Team Communication
- [ ] Team notified deployment is live
- [ ] Status page updated (if available)
- [ ] Stakeholders informed

## Post-Deployment (1 week monitoring)

### Daily Checks (First 3 days)
- [ ] Error rate < 0.5%
- [ ] P95 latency < 200ms
- [ ] No unusual spikes in requests
- [ ] Frontend users reporting no issues
- [ ] No database connection issues

### Weekly Review (After 1 week)
- [ ] Cache hit rates >70%
- [ ] All endpoints responding normally
- [ ] No performance degradation
- [ ] Cost within expected range
- [ ] User feedback positive

### Optimization
- [ ] Fine-tune cache TTLs if needed
- [ ] Consider enabling gzip compression
- [ ] Review slow requests in logs
- [ ] Prepare Phase 2 (file uploads to R2)

## Rollback (If Issues Occur)

### Immediate Actions (< 5 minutes)
- [ ] Identify the issue
- [ ] Notify team on Slack/Teams
- [ ] Check if it's Workers or Render issue
- [ ] Update frontend `.env` to use RENDER_BACKEND_URL only

### Quick Rollback (5-15 minutes)
```bash
# Option 1: Point all requests to Render
# Update frontend .env and redeploy

# Option 2: Undeploy Workers completely
cd backend/workers
wrangler undeploy
```

- [ ] Verify Render backend receiving all traffic
- [ ] Health check passing: `curl https://spllit-backend.onrender.com/api/health`
- [ ] Frontend still working
- [ ] Notify team rollback is complete

### Post-Rollback Analysis
- [ ] Review error logs
- [ ] Identify root cause
- [ ] Create hotfix
- [ ] Plan re-deployment

---

## ✅ Deployment Sign-Off

**Deployed By:** ___________________

**Date:** ___________________

**Environment:** ___________________

**All Checks Passed:** _____ YES _____ NO

**Notes:** ___________________________________________

**Approved By:** ___________________

---

## 📞 Emergency Contacts

- **Render Support:** https://render.com/support
- **Cloudflare Support:** https://dash.cloudflare.com/support
- **On-Call Engineer:** ___________________

---

**Keep this checklist for reference. Update it after each deployment to track changes.**
