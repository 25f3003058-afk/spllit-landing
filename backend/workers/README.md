# Spllit Cloudflare Workers API

Lightweight, stateless API endpoints deployed on Cloudflare Workers for maximum performance and global distribution.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Secrets
```bash
# JWT Secret
wrangler secret put JWT_SECRET

# JWT Refresh Secret  
wrangler secret put JWT_REFRESH_SECRET

# (Optional) Firebase API Key
wrangler secret put FIREBASE_API_KEY
```

### 3. Local Development
```bash
npm run dev
# Visit http://localhost:8787
```

### 4. Deploy to Production
```bash
npm run deploy
# Or: ./deploy.sh production
```

---

## 📋 Architecture

This Worker acts as a **lightweight API gateway** that:
- ✅ Handles authentication (login, register, refresh tokens)
- ✅ Serves cached public data (announcements, ride search results)
- ✅ Validates incoming requests with Zod schemas
- ✅ Proxies requests to Render backend for non-cached endpoints
- ✅ Manages CORS headers for Vercel frontend

**Endpoints Served:**
```
POST   /api/auth/login              (Cached 1 min)
POST   /api/auth/register           
POST   /api/auth/firebase-login     
POST   /api/auth/google             
POST   /api/auth/refresh-token      

GET    /api/announcements           (Cached 10 min)
GET    /api/rides/search            (Cached 2 min)
GET    /api/users/:id               (Cached 10 min)
```

**All other requests** are automatically forwarded to the Render backend.

---

## 🔧 Configuration

### Environment Variables

**In `wrangler.toml`:**
```toml
RENDER_BACKEND_URL = "https://spllit-backend.onrender.com"
ENVIRONMENT = "production"
```

**As Secrets (via `wrangler secret put`):**
```
JWT_SECRET
JWT_REFRESH_SECRET
FIREBASE_API_KEY (optional)
```

---

## 📦 Technologies

- **Framework:** [Hono](https://hono.dev/) - Lightweight HTTP framework
- **Validation:** [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Auth:** JWT with standard `jsonwebtoken` library
- **Password Hashing:** bcrypt
- **Caching:** Cloudflare KV Namespace

---

## 📚 Project Structure

```
src/
├── index.ts                    # Worker entry point & routing
├── middleware/
│   └── auth.ts                 # JWT validation & CORS
├── routes/
│   ├── auth.ts                 # Authentication endpoints
│   └── public.ts               # Public data endpoints
├── utils/
│   └── helpers.ts              # JWT, password, response helpers
└── types/
    └── schemas.ts              # Zod validation schemas

wrangler.toml                   # Cloudflare configuration
package.json                    # Dependencies
tsconfig.json                   # TypeScript config
```

---

## 🧪 Development

### Build
```bash
npm run build
```

### Local Testing
```bash
npm run dev
# Open http://localhost:8787
```

### Test Authentication
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Monitor Requests
```bash
npm run tail
```

---

## 🚀 Deployment

### Deploy to Production
```bash
npm run deploy
```

### Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy with Custom Secrets
```bash
# Set secret
echo "your-secret-value" | wrangler secret put JWT_SECRET

# Deploy
npm run deploy
```

### View Deployment Status
```bash
# Check recent deployments
wrangler deployments list

# View logs
npm run tail
```

---

## 🔒 Security

### Secrets Management
- Never commit `.env` files
- Always use `wrangler secret put` for sensitive values
- Verify secrets are set: `wrangler secret list`

### CORS Configuration
```javascript
// Origin whitelist in src/index.ts
cors({
  origin: [
    'https://spllit.app',
    'https://www.spllit.app',
    'http://localhost:5173',
    'https://spllit-landing.vercel.app'
  ]
})
```

### Request Validation
All inputs are validated with Zod schemas before processing:
```javascript
const validated = loginSchema.parse(body);
// Throws ZodError if invalid
```

---

## 📊 Monitoring

### Cloudflare Dashboard
- Visit: https://dash.cloudflare.com/
- Analytics → Workers
- Monitor: Requests, errors, latency

### Local Logs
```bash
npm run tail
# Real-time log streaming
```

### Health Check
```bash
curl https://api.spllit.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-15T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🐛 Troubleshooting

### Secrets Not Found
```bash
# Verify secrets are set
wrangler secret list

# Re-set if missing
wrangler secret put JWT_SECRET
```

### CORS Errors
```bash
# Check origin header
curl -H "Origin: http://localhost:5173" https://api.spllit.app/api/auth/login
```

### Backend Unreachable
```bash
# Test Render backend directly
curl https://spllit-backend.onrender.com/api/health

# Check RENDER_BACKEND_URL in wrangler.toml
```

### Build Errors
```bash
# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## 🔄 Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages (major)
npm install --legacy-peer-deps
```

---

## 📖 Learn More

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework Docs](https://hono.dev/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [KV Namespace (Caching)](https://developers.cloudflare.com/workers/runtime-apis/kv/)

---

## 📝 License

ISC

---

## 🤝 Support

For issues or questions:
1. Check the [Migration Guide](./MIGRATION.md)
2. Review [Cloudflare Docs](https://developers.cloudflare.com/workers/)
3. Check [Wrangler Logs](npm run tail)
4. Consult the main [Backend Analysis](../BACKEND_ANALYSIS.md)
