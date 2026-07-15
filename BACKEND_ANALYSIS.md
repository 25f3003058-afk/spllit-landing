# Spllit Backend - Comprehensive Architecture Analysis

**Date:** 2026-07-15  
**Version:** 2.1.0  
**Database:** MongoDB  
**Runtime:** Node.js (TypeScript)  
**Current Deployment:** Render.com

---

## 📋 Executive Summary

Spllit Backend is a real-time ride-matching platform API built with Express.js, Socket.IO, TypeScript, and Prisma ORM. It manages user profiles, ride creation/matching, real-time chat, emergency alerts, and admin/subadmin management with AI-powered email automation.

**Key Characteristics:**
- Monorepo structure (backend folder in `/backend`)
- Production-ready at Render.com (Port 10000)
- Event-driven architecture with Socket.IO for real-time features
- MongoDB as primary database
- Role-based access control (user, subadmin, admin/master)
- Multi-deployment configurations (Render, Vercel frontend)

---

## 1️⃣ Project Structure & Organization

### File Organization
```
backend/
├── src/
│   ├── server.ts              # Main entry point, Express & Socket.IO setup
│   ├── middleware/            # Auth & performance tracking
│   │   ├── auth.ts            # JWT authentication
│   │   └── perf.ts            # Performance monitoring
│   ├── routes/                # API endpoints (10 route files)
│   │   ├── auth.ts            # Registration, login, Firebase integration
│   │   ├── rides.ts           # Ride CRUD operations
│   │   ├── matches.ts         # Match creation/acceptance/rejection
│   │   ├── users.ts           # User profile management
│   │   ├── admin.ts           # Admin dashboard & management
│   │   ├── subadmin.ts        # Subadmin (college-level admin) operations
│   │   ├── emergency.ts       # SOS/emergency alert endpoints
│   │   ├── announcements.ts   # Admin-posted announcements
│   │   ├── automation.ts      # Email campaign automation
│   │   └── earlyAccess.ts     # Spllit Social waitlist
│   ├── services/              # Business logic & external integrations
│   │   ├── socket.ts          # Socket.IO event handlers
│   │   ├── emailService.ts    # Gmail & Zoho email sending
│   │   ├── aiService.ts       # OpenAI integration for email generation
│   │   ├── csvService.ts      # CSV parsing for bulk emails
│   │   └── testmail.ts        # Testmail verification service
│   ├── utils/
│   │   ├── helpers.ts         # JWT, password hashing, distance calculations
│   │   ├── prisma.ts          # Prisma client initialization
│   │   └── firebaseAdmin.ts   # Firebase Admin SDK setup
│   └── types/
│       └── express.ts         # TypeScript interfaces for requests
├── prisma/
│   └── schema.prisma          # Database schema (13 models)
├── tsconfig.json              # TypeScript configuration (ES2022 target)
├── package.json               # Dependencies & scripts
├── render.yaml                # Render.com deployment config
├── nixpacks.toml              # Nix build configuration
├── start.sh                   # Startup script with env validation
├── Dockerfile                 # Docker image definition
└── uploads/                   # Directory for CSV uploads (created at runtime)
```

### Directory Structure Insights
- **Monorepo Pattern:** Backend is in `/backend` subfolder for multi-module project
- **ES Modules:** Uses `"type": "module"` for native ES6 imports
- **Layered Architecture:** Routes → Services → Utils → Database
- **Type Safety:** Full TypeScript with strict Express types

---

## 2️⃣ Package.json - Dependencies & Scripts

### NPM Dependencies (Production)

| Package | Version | Purpose |
|---------|---------|---------|
| **@prisma/client** | ^6.19.2 | MongoDB ORM - Schema, migrations, queries |
| **express** | ^4.19.2 | HTTP server framework |
| **socket.io** | ^4.8.1 | Real-time bidirectional communication |
| **jsonwebtoken** | ^9.0.2 | JWT token generation & verification |
| **bcrypt** | ^5.1.1 | Password hashing (10 salt rounds) |
| **cors** | ^2.8.5 | CORS middleware for cross-origin requests |
| **dotenv** | ^16.4.5 | Environment variable loading |
| **firebase-admin** | ^13.7.0 | Firebase Authentication & ID token verification |
| **google-auth-library** | ^10.6.1 | Google OAuth authentication |
| **nodemailer** | ^6.9.13 | Email sending (Gmail & Zoho SMTP) |
| **openai** | ^4.52.7 | AI email generation (GPT-4o-mini) |
| **multer** | ^1.4.5-lts.1 | File upload handling (CSV uploads) |
| **csv-parse** | ^5.5.5 | CSV file parsing for bulk recipients |
| **zod** | ^3.23.8 | Runtime schema validation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **typescript** | ^5.7.2 | TypeScript compiler |
| **tsx** | ^4.19.2 | TypeScript execution runner (for dev) |
| **prisma** | ^6.19.2 | Prisma CLI tools |
| **@types/\*** | Latest | TypeScript type definitions |

### NPM Scripts

```bash
npm run dev              # tsx watch - Hot reload development
npm run build            # tsc - Compile TypeScript to dist/
npm start                # node dist/server.js - Production start
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Sync schema with MongoDB
npm run prisma:studio    # Prisma Studio GUI
npm run testmail:verify  # Test mail verification
```

**Build Output:** TypeScript → `dist/server.js` (ES2022 modules)

---

## 3️⃣ All Route Files & Endpoints

### 3.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/register` | ❌ | User registration (email/phone/password) |
| POST | `/login` | ❌ | Email/password login |
| POST | `/refresh-token` | ❌ | Refresh JWT access token |
| POST | `/google` | ❌ | Google OAuth login |
| POST | `/firebase-login` | ❌ | Firebase ID token verification & login |
| POST | `/verify-email` | ❌ | Email verification (if implemented) |

**Validation:** Zod schemas for input validation  
**Response:** `{ message, user, tokens: { accessToken, refreshToken } }`  
**Features:**
- Phone number hashing for privacy (SHA256)
- Placeholder phone generation for Firebase users
- Firebase auto-user creation on first login
- Admin/subadmin status checks on login

---

### 3.2 Rides Routes (`/api/rides`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/` | ✅ User | Create a ride posting |
| GET | `/` | ✅ User | List rides (with search) |
| GET | `/:id` | ✅ User | Get ride details |
| PUT | `/:id` | ✅ User | Update ride (creator only) |
| DELETE | `/:id` | ✅ User | Cancel ride (creator only) |
| GET | `/announcements` | ✅ User | Get ride announcement feed |

**Ride Lifecycle:**
- Status: `pending` → `matched` → `completed` / `cancelled`
- Auto-expiry: 3 hours after departure time (RIDE_POST_DEPARTURE_ACTIVE_WINDOW_MS)
- Ride Announcements: Persistent dashboard bell feed

**Validation:**
- Vehicle type: `cab`, `bike`, `auto`, `cab-xl`
- Seat limits: auto (3), bike (1), cab (4), cab-xl (7)
- Gender preference: `male`, `female`, `any`
- Coordinates (lat/lng) from Google Maps API

**Distance Calculation:** Haversine formula for route matching

---

### 3.3 Matches Routes (`/api/matches`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/` | ✅ User | Create match request for a ride |
| GET | `/` | ✅ User | Get user's matches |
| GET | `/:id` | ✅ User | Get match details |
| POST | `/:id/accept` | ✅ User | Accept match (ride creator only) |
| POST | `/:id/reject` | ✅ User | Reject match |
| POST | `/:id/complete` | ✅ User | Mark match complete after ride |

**Match Status Flow:**
- `pending` (awaiting ride creator acceptance)
- `accepted` (confirmed)
- `rejected` (declined)
- `completed` (after ride)
- `cancelled`

**Chat Window:** 30 minutes post-acceptance (CHAT_WINDOW_MINUTES)  
**Ride Active Window:** 8 hours from creation (RIDE_ACTIVE_WINDOW_MS)

---

### 3.4 Users Routes (`/api/users`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/me` | ✅ User | Get current user profile |
| PUT | `/me` | ✅ User | Update current user profile |
| GET | `/profile` | ✅ User | Alias for `/me` |
| PUT | `/profile` | ✅ User | Alias for `/me` |
| GET | `/:id` | ✅ User | Get user profile by ID |
| GET | `/:id/rides` | ✅ User | Get user's ride history |
| GET | `/:id/rating` | ✅ User | Get user's rating |
| POST | `/:id/rate` | ✅ User | Rate a user after ride |
| POST | `/:id/block` | ✅ User | Block a user |
| DELETE | `/:id/block` | ✅ User | Unblock a user |

**Profile Fields:**
- name, email, phone, dateOfBirth, college
- gender, profilePhoto, rating, totalRides
- role (user/admin/subadmin), isActive, lastSeen

**Safety Features:** User blocking, rating system

---

### 3.5 Admin Routes (`/api/admin`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/login` | ❌ | Admin/subadmin login (JWT) |
| GET | `/stats` | ✅ Admin | Dashboard stats (cached 8s) |
| GET | `/announcements` | ✅ Admin | List platform announcements |
| POST | `/announcements` | ✅ Admin | Create announcement |
| PUT | `/announcements/:id` | ✅ Admin | Update announcement |
| DELETE | `/announcements/:id` | ✅ Admin | Delete announcement |
| GET | `/users` | ✅ Admin | List all users |
| POST | `/users/:id/deactivate` | ✅ Master | Deactivate user |
| GET | `/emergencies` | ✅ Admin | List SOS alerts |
| GET | `/rides` | ✅ Admin | View all rides |

**Admin Tiers:**
- **Master Admin:** Full platform control, in `Admin` table
- **Subadmin:** College-level admin, stored in `User` table with `role: 'subadmin'`

**Stats Cached:** 8-second TTL for performance

---

### 3.6 Subadmin Routes (`/api/subadmin`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/create` | ✅ Master | Create new subadmin |
| GET | `/list` | ✅ Admin | List all subadmins |
| PUT | `/:id/status` | ✅ Master | Change subadmin status |
| DELETE | `/:id` | ✅ Master | Delete subadmin |
| GET | `/:id/stats` | ✅ Subadmin | College-specific stats |

**Subadmin Status:** `active`, `inactive`, `deleted`

---

### 3.7 Emergency Routes (`/api/emergency`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/sos` | ✅ User | Create emergency SOS alert |
| GET | `/` | ✅ Admin | List emergency alerts |
| GET | `/:id` | ✅ Admin | Get alert details |
| PATCH | `/:id/status` | ✅ Admin | Update alert status (acknowledge/resolve) |

**Emergency Types:** `accident`, `harassment`, `medical`, `other`  
**Status Flow:** `active` → `acknowledged` → `resolved` / `false-alarm`  
**Socket.IO Broadcast:** `emergency-sos` event to admin dashboard

---

### 3.8 Announcements Routes (`/api/announcements`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | ❌ | Get announcements feed (public) |
| POST | `/` | ✅ Admin | Create announcement |
| PUT | `/:id` | ✅ Admin | Update announcement |
| DELETE | `/:id` | ✅ Admin | Delete announcement |

**Fields:** title, message, location, imageUrl, imageAlt  
**Created By:** Admin or Subadmin (name & role tracked)

---

### 3.9 Automation Routes (`/api/automation`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/providers` | ✅ Admin | List mail providers (Gmail, Zoho) |
| POST | `/providers` | ✅ Admin | Create/update mail provider |
| POST | `/providers/:id/test` | ✅ Admin | Test SMTP connection |
| POST | `/send-bulk` | ✅ Admin | Send bulk emails with CSV |
| GET | `/campaigns` | ✅ Admin | List email campaigns |
| GET | `/campaigns/:id` | ✅ Admin | Get campaign details |
| POST | `/preview` | ✅ Admin | Preview email template |

**Features:**
- AI-powered email generation (GPT-4o-mini)
- CSV recipient upload (max 10MB)
- Template variables: `{{name}}`, `{{email}}`
- Dual-mode: AI generation or custom message
- Campaign status tracking

---

### 3.10 Early Access Routes (`/api/early-access`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/status/:email` | ❌ | Check if email registered for waitlist |
| POST | `/` | ❌ | Register for Spllit Social launch |

**Response:** Duplicate prevention (409 error if already registered)

---

### 3.11 Other Routes

**Health Check:**
```
GET /health
Response: { status: "ok", timestamp: "ISO-8601" }
```

---

## 4️⃣ Middleware Implementations

### 4.1 Authentication Middleware

**File:** [src/middleware/auth.ts](src/middleware/auth.ts)

```typescript
// authenticate() - Required JWT
// Extracts Bearer token from Authorization header
// Verifies JWT using JWT_SECRET
// Attaches decoded payload to req.user { userId, email }

// optionalAuth() - Optional JWT
// Doesn't fail if no token provided
// Useful for public endpoints with optional user context
```

**Error Handling:**
- 401: "No token provided"
- 401: "Invalid token"

**Token Format:** `Authorization: Bearer <JWT>`

---

### 4.2 Performance Middleware

**File:** [src/middleware/perf.ts](src/middleware/perf.ts)

```typescript
// Tracks route execution time using process.hrtime.bigint()
// Logs routes that exceed threshold (PERF_LOG_SLOW_MS env var, default 500ms)
// Routes monitored:
  - /api/auth/register
  - /api/auth/login
  - /api/auth/google
  - /api/admin/stats
  - /api/admin/announcements
  - /api/announcements
// Verbose logging: PERF_LOG_VERBOSE=true
```

---

### 4.3 CORS Middleware

**Allowed Origins:**
```javascript
- http://localhost:5173 (dev frontend)
- http://localhost:3000 (alt dev)
- https://spllit.app (production)
- https://www.spllit.app (www variant)
- https://spllit-landing.onrender.com (Render frontend)
- https://spllit-landing.vercel.app (Vercel deployment)
- https://spllit-landing-git-main-25f3003058-afks-projects.vercel.app (Vercel preview)
- All *.vercel.app subdomains
- All *.onrender.com subdomains
```

**Methods Allowed:** GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD

---

### 4.4 Error Handling Middleware

**Pattern:**
```typescript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

**Features:**
- Development: Stack trace included
- Production: Minimal error details

---

## 5️⃣ Service Layer Implementations

### 5.1 Socket.IO Service

**File:** [src/services/socket.ts](src/services/socket.ts)

**Real-Time Events:**

#### Authentication
```typescript
// Middleware: Verifies JWT token in socket handshake
socket.handshake.auth.token
```

#### User Events
```typescript
// join_matches: { matchIds: string[] }
// Subscribe to chat rooms for all user's matches

// send_message: { matchId, content, type, metadata }
// type: 'text' | 'location' | 'image'
// Saves to DB, broadcasts via socket

// typing: { matchId, isTyping }
// Real-time typing indicator

// share_location: { matchId, latitude, longitude, accuracy, heading, speed }
// Live location tracking during ride
```

#### Server Events (Emitted)
```typescript
// new-user-registered: Broadcast to all connected admins
// new_message: Broadcast to match chat room
// user_typing: Notify match participants
// user_online / user_offline: Online status updates
// emergency-sos: Alert admins of SOS emergency
// match_accepted / match_rejected: Real-time match updates
```

#### Active Users Tracking
```typescript
const activeUsers = new Map<string, string>(); // userId -> socketId
// Updates online status on connect/disconnect
```

**Chat Window:** 30 minutes post-acceptance

---

### 5.2 Email Service

**File:** [src/services/emailService.ts](src/services/emailService.ts)

**Transporter Setup:**

**Gmail:**
```typescript
nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: recipientEmail,
    refreshToken: OAUTH_REFRESH_TOKEN
  }
});
```

**Zoho:**
```typescript
nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587 (or 465 for secure),
  secure: port === 465,
  auth: { user, pass }
});
```

**Generic SMTP:**
```typescript
// Configurable host, port, auth
```

**Functions:**

```typescript
// sendBulkEmails(recipients, config, subject, htmlContent)
// - Sequential sending (no rate limit issues)
// - Template variable substitution: {{name}}, {{email}}
// - Returns: { successCount, failureCount, errors[] }

// sendSingleEmail(recipient, config, subject, htmlContent)
// - Single email send

// testMailConnection(config)
// - Validates SMTP connectivity

// renderMailPreview(template, recipients)
// - Renders template for preview
```

**Error Handling:** Continues with next email on individual failures

---

### 5.3 AI Service

**File:** [src/services/aiService.ts](src/services/aiService.ts)

```typescript
// generateMessageFromPrompt(prompt: string)
// Uses OpenAI GPT-4o-mini (lightweight, fast, cheap)
// System prompt: Professional email writer
// Max tokens: 300
// Temperature: 0.7 (balanced creativity)
// Graceful fallback if OPENAI_API_KEY not set
```

**Environment Dependency:** `OPENAI_API_KEY`

---

### 5.4 CSV Service

**File:** [src/services/csvService.ts](src/services/csvService.ts)

```typescript
// parseCSVRecipients(filePath): CsvRecipient[]
// Flexible column detection:
  - Email: email, Email, EMAIL, e_mail, user_email, userEmail
  - Name: name, Name, full_name, user_name, etc.
// Handles headers and header-less formats
// BOM & quote handling
// Email validation regex

// parseCSVFile(filePath): string[]
// Returns just emails array

// validateEmailList(emails): { valid, invalid }
// Regex validation
```

**Upload Limit:** 10MB (multer configuration)  
**Supported Format:** CSV with flexible column names

---

### 5.5 Testmail Service

**File:** [src/services/testmail.ts](src/services/testmail.ts)

Used for email verification testing (minimal implementation details in summary)

---

## 6️⃣ Authentication & Authorization Patterns

### 6.1 JWT Token Structure

**Access Token (User):**
```typescript
{
  userId: string,
  email: string,
  expiresIn: "1h" (default)
}
```

**Access Token (Admin):**
```typescript
{
  adminId: string,      // Master admin
  email: string,
  role: "master",
  expiresIn: "24h"
}
// OR
{
  userId: string,       // Subadmin
  email: string,
  role: "subadmin",
  expiresIn: "24h"
}
```

**Refresh Token:**
```typescript
{
  userId: string,
  expiresIn: "7d" (default)
}
```

**Storage:** Secrets
- `JWT_SECRET`: For access tokens
- `JWT_REFRESH_SECRET`: For refresh tokens
- Auto-generated on Render if not provided

---

### 6.2 Role-Based Access Control

**User Roles:**
```
user        → Standard user (rides, matches, chat)
subadmin    → College-level admin (manage users, view stats)
admin       → Platform admin (full platform control)
master      → Master admin (create other admins)
```

**Permission Matrix:**

| Action | User | Subadmin | Master | Note |
|--------|------|----------|--------|------|
| Create Ride | ✅ | ❌ | ❌ | Users only |
| Match Ride | ✅ | ❌ | ❌ | Users only |
| View Stats | ❌ | ✅ | ✅ | Admin endpoints |
| Create Announcement | ❌ | ✅ | ✅ | Admins only |
| Create Subadmin | ❌ | ❌ | ✅ | Master only |
| Send Email Campaign | ❌ | ✅ | ✅ | With restrictions |

---

### 6.3 Authentication Flow

**User Registration:**
```
POST /api/auth/register
Body: { name, email, phone, password, college, gender }
↓
Validate with Zod schema
↓
Check existing user (email/phone)
↓
Hash password (bcrypt, 10 rounds)
↓
Hash phone (SHA256 with pepper)
↓
Create user in MongoDB
↓
Emit "new-user-registered" event
↓
Return: { user, accessToken, refreshToken }
```

**Firebase Login:**
```
POST /api/auth/firebase-login
Body: { idToken }
↓
Verify Firebase ID token
↓
Extract email, name, profile photo
↓
Auto-create user if new (with placeholder phone)
↓
Update lastSeen, emailVerified
↓
Generate JWT tokens
↓
Return: { user, accessToken, refreshToken }
```

**Admin Login:**
```
POST /api/admin/login
Body: { email, password }
↓
Check subadmin (users table) first
↓
Then check master admin (admin table)
↓
Verify password with bcrypt
↓
Check admin status (active/inactive/deleted)
↓
Generate 24-hour JWT
↓
Return: { admin, token }
```

---

## 7️⃣ Error Handling Approach

### 7.1 Validation Errors

**Zod Schema Validation:**
```typescript
try {
  const data = someSchema.parse(req.body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: 'Invalid input',
      details: error.errors  // Array of validation failures
    });
  }
}
```

**Response:**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "too_small",
      "minimum": 2,
      "type": "string",
      "path": ["name"],
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

---

### 7.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 400 | Invalid input (Zod validation fails) |
| 401 | Unauthorized (no token/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate entry, e.g., already registered) |
| 500 | Server error (try-catch fallback) |

---

### 7.3 Error Handling Pattern

**Standard Pattern:**
```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid input', details: error.errors });
  }
  console.error('Operation error:', error);
  res.status(500).json({ error: 'Failed to [operation]' });
}
```

**Global Error Middleware:**
```typescript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

---

## 8️⃣ Database Connection Setup

### 8.1 Prisma Configuration

**File:** [prisma/schema.prisma](prisma/schema.prisma)

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Database URL Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
```

---

### 8.2 Prisma Client

**File:** [src/utils/prisma.ts](src/utils/prisma.ts)

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});

// Graceful shutdown on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Features:**
- Verbose logging in development
- Graceful connection cleanup
- Singleton pattern (imported as singleton)

---

### 8.3 Database Models (13 Total)

| Model | Purpose | Relations |
|-------|---------|-----------|
| **User** | Core user profile | rides, matches, messages, emergencies |
| **Ride** | Ride postings | creator, matches, announcements |
| **Match** | User matching | ride, user1, user2, messages |
| **Message** | Chat messages | match, sender |
| **Location** | Live tracking | user |
| **Block** | User blocking | blocker, blocked |
| **Admin** | Master admin accounts | Independent |
| **Emergency** | SOS alerts | user |
| **RideAnnouncement** | Feed announcements | Ride-linked |
| **Announcement** | Platform announcements | Admin-created |
| **EarlyAccess** | Waitlist registrations | No relations |
| **MailProvider** | Email service config | No relations |
| **AutomationMail** | Campaign logs | No relations |

---

### 8.4 Key Indexes

**User Indexes:**
- `college`, `role`, `adminStatus` (lookup speed)

**Ride Indexes:**
- `userId`, `destination`, `departureTime`, `status`, `createdAt`

**Match Indexes:**
- `status` (finding pending/active matches)

**Message Indexes:**
- `matchId`, `senderId`, `createdAt` (chat history)

**Location Indexes:**
- `userId`, `isActive` (tracking active users)

---

## 9️⃣ Environment Variable Usage

### Required Variables

```bash
# Database
DATABASE_URL=mongodb+srv://...  # MongoDB connection string

# JWT
JWT_SECRET=<auto-generated>              # Access token secret
JWT_REFRESH_SECRET=<auto-generated>      # Refresh token secret
JWT_EXPIRES_IN=1h                        # Default: 1 hour
JWT_REFRESH_EXPIRES_IN=7d                # Default: 7 days

# Server
NODE_ENV=production                      # development / production
PORT=10000                               # Render default
FRONTEND_URL=https://spllit.app          # CORS origin

# Firebase (Optional)
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-key-with-newlines>

# Google
GOOGLE_MAPS_API_KEY=<api-key>            # For distance calculations

# OpenAI (Optional)
OPENAI_API_KEY=<api-key>                 # For email generation
```

### Optional Variables

```bash
# Performance
PERF_LOG_SLOW_MS=500                     # Slow query threshold (ms)
PERF_LOG_VERBOSE=false                   # Log all tracked routes

# Phone Hashing
PHONE_HASH_PEPPER=<custom-pepper>        # Fallback: JWT_SECRET

# Render
RENDER=true                              # Auto-set by Render
RENDER_EXTERNAL_URL=<service-url>
RENDER_SERVICE_ID=<service-id>
```

---

## 🔟 Render-Specific Configurations

### 10.1 Render.yaml Deployment

**File:** [render.yaml](render.yaml)

```yaml
services:
  - type: web
    name: spllit-backend
    env: node
    region: oregon
    plan: free (or starter/standard)
    rootDir: backend              # Monorepo backend folder
    
buildCommand: |
  npm install && 
  npx prisma generate && 
  npm run build
    
startCommand: chmod +x start.sh && ./start.sh

healthCheckPath: /health          # Render monitoring

envVars:
  - NODE_ENV: production
  - PORT: 10000
  - DATABASE_URL: (set in dashboard)
  - JWT_SECRET: (auto-generated)
  - JWT_REFRESH_SECRET: (auto-generated)
  - FRONTEND_URL: https://spllit.app
  - GOOGLE_MAPS_API_KEY: (set in dashboard)
```

**Port:** 10000 (Render requirement for free tier)  
**Region:** Oregon  
**Health Check:** `/health` endpoint

---

### 10.2 Startup Script

**File:** [start.sh](start.sh)

```bash
#!/bin/bash
set -e

# Load .env files
if [ -f ".env" ]; then
  set -a; . ".env"; set +a
fi

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

# Validate MongoDB URL format
if [[ "$DATABASE_URL" != mongodb://* && "$DATABASE_URL" != mongodb+srv://* ]]; then
  echo "❌ ERROR: DATABASE_URL invalid MongoDB URL"
  exit 1
fi

# Run migrations & start server
npx prisma db push --skip-generate
node dist/server.js
```

**Ensures:**
- Environment variables loaded
- Database URL validated
- Prisma migrations applied
- TypeScript compiled to JS

---

### 10.3 Nixpacks Configuration

**File:** [nixpacks.toml](nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "bash start.sh"
```

**Uses:** Nix package manager for deterministic builds

---

## 1️⃣1️⃣ Current API Response Patterns

### 11.1 Success Response Pattern

```json
{
  "message": "Operation successful",
  "data": { /* resource */ },
  "timestamp": "2026-07-15T10:30:00Z"
}
```

**Variants:**

**Single Resource:**
```json
{
  "message": "User profile updated",
  "user": { /* user object */ }
}
```

**List Response:**
```json
{
  "rides": [ /* array */ ],
  "count": 42,
  "page": 1
}
```

**Authentication:**
```json
{
  "message": "Login successful",
  "user": { /* sanitized user */ },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 11.2 Error Response Pattern

```json
{
  "error": "Error message",
  "details": [ /* optional validation details */ ],
  "code": "ERROR_CODE"  /* optional */
}
```

**Examples:**

**Validation Error (400):**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "invalid_string",
      "validation": "email",
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "error": "No token provided"
}
```

**Conflict (409):**
```json
{
  "error": "You have already joined early access with this email.",
  "code": "ALREADY_REGISTERED",
  "registration": { /* existing record */ }
}
```

**Server Error (500):**
```json
{
  "error": "Failed to create ride",
  "stack": "... stack trace in development only ..."
}
```

---

## 1️⃣2️⃣ WebSocket/Real-Time Implementation

### 12.1 Socket.IO Configuration

**Server Setup:**
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: [/* allowed origins */],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});
```

**Client Connection:**
```typescript
// Frontend example
const socket = io('https://backend-url', {
  auth: {
    token: accessToken
  }
});
```

---

### 12.2 Real-Time Events (Comprehensive)

**User Join Matches:**
```
📤 join_matches: { matchIds: ['match1', 'match2'] }
→ Joins chat rooms for each match
```

**Chat Messaging:**
```
📤 send_message: {
  matchId: string,
  content: string,
  type: 'text' | 'location' | 'image',
  metadata: { url, lat, lng, ... }?
}

📥 new_message: {
  id: string,
  matchId: string,
  senderId: string,
  sender: { id, name },
  content: string,
  type: string,
  read: boolean,
  createdAt: ISO8601
}
```

**Typing Indicator:**
```
📤 typing: { matchId: string, isTyping: boolean }

📥 user_typing: {
  userId: string,
  isTyping: boolean
}
```

**Live Location Sharing:**
```
📤 share_location: {
  matchId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  heading?: number,
  speed?: number
}

📥 location_shared: {
  userId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: ISO8601
}
```

**Online Status:**
```
📥 user_online: {
  userId: string,
  timestamp: ISO8601
}

📥 user_offline: {
  userId: string,
  timestamp: ISO8601
}
```

**Match Events:**
```
📥 match_accepted: {
  matchId: string,
  acceptedAt: ISO8601
}

📥 match_rejected: {
  matchId: string,
  rejectedAt: ISO8601
}

📥 match_completed: {
  matchId: string,
  completedAt: ISO8601,
  rating?: number
}
```

**Emergency Alerts (Admin):**
```
📥 emergency-sos: {
  id: string,
  userName: string,
  userPhone: string,
  userEmail: string,
  college: string,
  location: { lat, lng },
  message: string,
  emergencyType: 'accident' | 'harassment' | 'medical' | 'other',
  timestamp: ISO8601,
  status: 'active'
}
```

**Ride Announcements:**
```
📥 new_ride_announcement: {
  rideId: string,
  title: string,
  message: string,
  origin: string,
  destination: string,
  departureTime: ISO8601,
  createdAt: ISO8601
}
```

**System Broadcasts:**
```
📥 new-user-registered: {
  name: string,
  college: string,
  email: string,
  timestamp: ISO8601
}
```

---

### 12.3 Chat Window Duration

**30-Minute Window:**
```
Match accepted → Chat window opens
↓ (30 minutes elapsed)
Chat window closes → Cannot send messages
```

**Check in send_message handler:**
```typescript
const isChatActive = (acceptedAt?: Date | null) => {
  if (!acceptedAt) return false;
  const acceptedTime = new Date(acceptedAt).getTime();
  return Date.now() - acceptedTime <= 30 * 60 * 1000;
};
```

---

## 1️⃣3️⃣ File Upload Handling

### 13.1 Multer Configuration

**File:** [src/routes/automation.ts](src/routes/automation.ts)

```typescript
const uploadDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

### 13.2 CSV Upload Endpoint

```
POST /api/automation/send-bulk (multipart/form-data)
File field: csvFile
Form fields:
  - providerId: string (mail provider ID)
  - subject: string (email subject)
  - prompt: string (AI generation prompt)
  - message: string (custom message, if not using AI)
  - aiMode: 'yes' | 'no'
```

### 13.3 Upload Workflow

```
1. POST /api/automation/send-bulk with CSV file
   ↓
2. Multer saves to /uploads/{timestamp}-{filename}
   ↓
3. CSV parsed: Extract email, name columns (flexible)
   ↓
4. AI generates email (if aiMode=yes)
   ↓
5. Create AutomationMail record (status: processing)
   ↓
6. Background process: Send bulk emails
   ↓
7. Update campaign status & success/failure counts
   ↓
8. File cleaned up (optional)
```

---

## 1️⃣4️⃣ External API Integrations

### 14.1 Firebase Admin SDK

**File:** [src/utils/firebaseAdmin.ts](src/utils/firebaseAdmin.ts)

**Purpose:** Verify Firebase ID tokens for user authentication

```typescript
// Endpoint: POST /api/auth/firebase-login
// Verifies Firebase idToken from frontend
// Creates/updates user on first login
// Auto-generates user if new
```

**Environment Setup:**
```bash
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

### 14.2 Google Maps API

**Purpose:** Distance calculations, location validation

**Used in:**
- Route matching: `calculateDistance()` using Haversine formula
- Ride search: Filter rides within maxDistance (default 2km)

**Environment:**
```bash
GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

### 14.3 OpenAI API

**File:** [src/services/aiService.ts](src/services/aiService.ts)

**Model:** GPT-4o-mini (lightweight, fast, cost-effective)

**Purpose:** AI-powered email content generation

```typescript
// generateMessageFromPrompt(prompt)
// System: "You are a professional email writer..."
// Input: Admin's prompt (e.g., "Announce new feature")
// Output: Professional email body (max 200 words)
// Temperature: 0.7 (balanced)
```

**Environment:**
```bash
OPENAI_API_KEY=sk-proj-...
```

**Fallback:** If not configured, returns placeholder message

---

### 14.4 Email Providers (Gmail & Zoho)

**Nodemailer Integration:**

**Gmail OAuth:**
```typescript
transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: sender@gmail.com,
    refreshToken: OAUTH_REFRESH_TOKEN
  }
});
```

**Zoho SMTP:**
```typescript
transport = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: admin@zoho.com,
    pass: ZOHO_PASSWORD
  }
});
```

**Features:**
- Template variable replacement: {{name}}, {{email}}
- Bulk recipient support via CSV
- Connection testing before send
- Error tracking per recipient

---

## 1️⃣5️⃣ Cloudflare Workers Compatibility Analysis

### ⚠️ Critical Compatibility Issues

#### 1. **Long-Running Processes ❌**
- **Issue:** Rides expire after 3 hours; matches have 8-hour active windows; chat has 30-minute windows
- **Problem:** Cloudflare Workers timeout at 30 seconds (free) or max CPU time
- **Impact:** Background expiry cleanup won't work; chat timers impossible
- **Workaround:** Use external cron service (cron-job.org, EasyCron) + webhook

#### 2. **Node.js APIs Not Available ❌**
**Unavailable in Workers:**
- `fs` module (file I/O) - used in multer, CSV parsing
- `node:path` (used throughout)
- `process` global (env vars, exit handlers)
- `setInterval`/`setTimeout` (long-running jobs)
- WebSocket persistence (Socket.IO needs persistent connections)

**Impact:**
- CSV file uploads won't work
- Email campaign automation impossible
- Real-time chat/location sharing broken

#### 3. **Socket.IO ❌**
- **Issue:** Requires persistent WebSocket connections
- **Problem:** Workers disconnect after 30 seconds
- **Alternative:** Use Durable Objects (Cloudflare) + WebSocket API, not Socket.IO

#### 4. **MongoDB Connection Pooling ❌**
- **Issue:** Prisma uses connection pooling (Node.js specific)
- **Workaround:** Prisma Data Proxy (serverless-friendly) with increased latency

#### 5. **Multer File Uploads ❌**
- **Issue:** Multer writes to disk (`fs` module)
- **Problem:** Workers have no persistent file system
- **Alternative:** Stream uploads to cloud storage (S3, Cloudflare R2)

#### 6. **Graceful Shutdown ❌**
```typescript
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```
- Workers don't support process lifecycle events
- Connection cleanup unpredictable

---

### ✅ Compatible Features

| Feature | Status | Notes |
|---------|--------|-------|
| Express routing | ⚠️ Partial | Hono framework recommended for Workers |
| Database queries | ✅ | Prisma Data Proxy with limitations |
| JWT validation | ✅ | Pure JS, no Node deps |
| Password hashing (bcrypt) | ✅ | Works in Workers |
| Email sending (nodemailer) | ✅ | If using SMTP without OAuth refresh |
| CORS | ✅ | Standard fetch API |
| Zod validation | ✅ | Pure JS library |

---

### 🔄 Migration Strategy to Cloudflare Workers

**Recommended Approach: Hybrid Architecture**

```
┌─────────────────────┐
│   Cloudflare Page   │ (Frontend)
│   Rules/Redirects   │
└──────────┬──────────┘
           │
    ┌──────▼──────────┐
    │  Cloudflare     │
    │  Workers        │ (API Gateway)
    │  - Auth routes  │
    │  - Lite routes  │ (stateless)
    └──────┬──────────┘
           │
    ┌──────▼──────────────────┐
    │  Render/Node Backend     │
    │  (Monolith for now)      │
    │  - Socket.IO chat        │
    │  - File uploads          │
    │  - Long-running jobs     │
    └──────────────────────────┘
```

**Phased Refactoring:**

1. **Phase 1:** Keep current Render backend as-is
2. **Phase 2:** Extract stateless endpoints to Durable Objects
3. **Phase 3:** Move WebSocket to Workers Durable Objects
4. **Phase 4:** Move file uploads to Cloudflare R2 + edge functions

---

## 1️⃣6️⃣ TypeScript Configuration

**File:** [tsconfig.json](tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",              // Modern JavaScript
    "module": "NodeNext",            // ES modules
    "moduleResolution": "nodenext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": false,                 // Not strict (allows implicit any)
    "esModuleInterop": true,         // CommonJS interop
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,             // Generate .d.ts
    "declarationMap": true,
    "sourceMap": true                // Debugging support
  }
}
```

**Build Output:** `dist/server.js` (CommonJS compatible)

---

## 1️⃣7️⃣ Monitoring & Debugging

### 17.1 Logging Strategy

**Levels:**

```typescript
// Always
console.error(err);              // Errors

// Production
// (errors only)

// Development
console.log('[PERF]', ...);      // Performance metrics
console.warn('[PERF:SLOW]', ..); // Slow routes
console.log('Socket events')      // Connection lifecycle
```

**Performance Tracking:**
```
Routes monitored:
  /api/auth/register (typically 500-800ms)
  /api/auth/login
  /api/admin/stats (cached 8s to reduce DB load)
```

---

### 17.2 Health Check

```
GET /health
Response: { status: "ok", timestamp: "ISO-8601" }
```

Used by Render for:
- Service readiness check
- Auto-restart on failure
- Load balancer routing

---

### 17.3 Debug Output

**Enable verbose logging:**
```bash
PERF_LOG_VERBOSE=true npm run dev
```

**Prisma query logging (dev only):**
```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});
```

---

## 📊 Summary Comparison Table

### Dependencies by Category

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | express | ^4.19.2 | HTTP server |
| **Real-time** | socket.io | ^4.8.1 | WebSockets |
| **Database** | @prisma/client | ^6.19.2 | MongoDB ORM |
| **Database** | prisma | ^6.19.2 | CLI tools |
| **Auth** | jsonwebtoken | ^9.0.2 | JWT tokens |
| **Auth** | bcrypt | ^5.1.1 | Password hashing |
| **Auth** | firebase-admin | ^13.7.0 | Firebase verification |
| **Auth** | google-auth-library | ^10.6.1 | Google OAuth |
| **Validation** | zod | ^3.23.8 | Schema validation |
| **Email** | nodemailer | ^6.9.13 | SMTP sending |
| **Email** | csv-parse | ^5.5.5 | CSV parsing |
| **AI** | openai | ^4.52.7 | GPT integration |
| **Upload** | multer | ^1.4.5-lts.1 | File uploads |
| **Server** | cors | ^2.8.5 | CORS middleware |
| **Config** | dotenv | ^16.4.5 | Env variables |
| **Dev** | typescript | ^5.7.2 | TypeScript compiler |
| **Dev** | tsx | ^4.19.2 | TS executor |

---

## 🎯 API Endpoints Summary (Quick Reference)

**Total Endpoints:** 60+

| Route | Endpoints | Auth |
|-------|-----------|------|
| `/api/auth` | 6 | ❌ |
| `/api/rides` | 6 | ✅ User |
| `/api/matches` | 6 | ✅ User |
| `/api/users` | 10 | ✅ User |
| `/api/admin` | 12 | ✅ Admin |
| `/api/subadmin` | 5 | ✅ Admin |
| `/api/emergency` | 4 | ✅ User/Admin |
| `/api/announcements` | 4 | Mixed |
| `/api/automation` | 8 | ✅ Admin |
| `/api/early-access` | 2 | ❌ |

---

## 🚀 Deployment Checklist

- ✅ Render.yaml configured
- ✅ Nixpacks build setup
- ✅ Start.sh with env validation
- ✅ Environment variables generated
- ✅ MongoDB Atlas connection
- ✅ Firebase Admin configured
- ✅ OpenAI API key set
- ✅ Google Maps API key set
- ✅ CORS origins whitelisted
- ✅ Health check endpoint active
- ✅ Port 10000 in use
- ✅ Prisma migrations auto-run

---

## 📝 Additional Notes

### Scalability Considerations
- Admin stats cached (8s TTL) - reduces DB load
- Ride expiry auto-cleanup - prevents stale data
- Socket.IO active users tracking - reduces DB queries
- Message history pagination - prevents large response bodies

### Security Practices
- Password hashing: bcrypt (10 rounds)
- Phone hashing: SHA256 with pepper
- JWT secrets auto-generated on Render
- Firebase ID token verification
- CORS whitelist enforcement
- Role-based access control
- Admin status checks on login

### Known Limitations
- No refresh token rotation
- No rate limiting on endpoints
- CSV uploads stored on disk (not cloud)
- Email campaign errors stored as text logs (not structured)
- No database transaction support (MongoDB without multi-doc ACID)

---

**End of Analysis**

---
