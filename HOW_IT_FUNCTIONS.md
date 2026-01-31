# 🔄 How Spllit Data Flows & Functions

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR BROWSER                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React Frontend (http://localhost:5173)                │    │
│  │  • SignupModal.jsx                                     │    │
│  │  • Dashboard.jsx                                       │    │
│  │  • Pages & Components                                  │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ HTTP Requests (JSON)
                │ POST /api/auth/register
                │ GET /api/rides/search
                │ WebSocket Connection
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│         Express.js Backend (http://localhost:3001)              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Routes:                                               │    │
│  │  • /api/auth    → Login, Register, Token              │    │
│  │  • /api/rides   → Create, Search, Update rides        │    │
│  │  • /api/matches → Create matches, Messages            │    │
│  │  • /api/users   → Get profile, Update info            │    │
│  │                                                        │    │
│  │  Middleware:                                           │    │
│  │  • authenticate() → Verify JWT tokens                 │    │
│  │  • cors()         → Allow frontend access             │    │
│  │                                                        │    │
│  │  Socket.IO:                                            │    │
│  │  • Real-time messaging                                │    │
│  │  • Live location updates                              │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ Prisma ORM
                │ prisma.user.create()
                │ prisma.ride.findMany()
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma Client                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Type-safe database queries                          │    │
│  │  • Automatic relation loading                          │    │
│  │  • Migration management                                │    │
│  │  • Schema validation                                   │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ SQL Queries
                │ INSERT INTO "User" ...
                │ SELECT * FROM "Ride" ...
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│           Supabase PostgreSQL Database                          │
│           (aws-1-ap-south-1.pooler.supabase.com)               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tables:                                               │    │
│  │  ┌──────────┬──────────┬──────────┬──────────┐        │    │
│  │  │   User   │   Ride   │  Match   │ Message  │        │    │
│  │  │  15 rows │  8 rows  │  3 rows  │ 12 rows  │        │    │
│  │  └──────────┴──────────┴──────────┴──────────┘        │    │
│  │                                                        │    │
│  │  Storage:                                              │    │
│  │  • Secure encrypted storage                           │    │
│  │  • Automatic backups                                  │    │
│  │  • Connection pooling                                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                │
                │ View Data Through:
                │
        ┌───────┴────────┬────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  Prisma     │  │   Supabase   │  │  API         │
│  Studio     │  │   Dashboard  │  │  Endpoints   │
│  :5555      │  │   Web UI     │  │  :3001/api   │
└─────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎬 Step-by-Step: User Registration Flow

### What Happens When Someone Signs Up:

```
1. USER ACTION
   └─ Fills signup form in browser
   └─ Clicks "JOIN WAITLIST" button

2. FRONTEND (SignupModal.jsx)
   └─ Validates form data (password length, email format)
   └─ Calls: register(userData)
   └─ Sends HTTP POST to backend

3. HTTP REQUEST
   POST http://localhost:3001/api/auth/register
   Headers: Content-Type: application/json
   Body: {
     "name": "John Doe",
     "email": "john@study.iitm.ac.in",
     "phoneNumber": "+919876543210",
     "password": "SecurePass123",
     "college": "IIT Madras",
     "gender": "MALE"
   }

4. BACKEND (routes/auth.ts)
   └─ Receives request
   └─ Validates data (email unique, phone unique)
   └─ Hashes password with bcrypt
      Before: "SecurePass123"
      After: "$2b$10$xF7Y9..."
   └─ Hashes phone number
      Before: "+919876543210"
      After: "a3d8f92b..."

5. PRISMA ORM
   └─ Converts to SQL query:
   
   INSERT INTO "User" (
     id, name, email, phone_hash, password, 
     college, gender, created_at, updated_at
   ) VALUES (
     'cm5t123abc',
     'John Doe',
     'john@study.iitm.ac.in',
     'a3d8f92b...',
     '$2b$10$xF7Y9...',
     'IIT Madras',
     'MALE',
     '2026-01-31T12:00:00Z',
     '2026-01-31T12:00:00Z'
   ) RETURNING *;

6. SUPABASE DATABASE
   └─ Executes SQL query
   └─ Stores data in User table
   └─ Returns new user record
   
   ✅ DATA STORED IN SUPABASE!

7. BACKEND RESPONSE
   └─ Generates JWT tokens:
      • Access Token (expires 1h)
      • Refresh Token (expires 7d)
   └─ Returns to frontend:
   
   {
     "user": {
       "id": "cm5t123abc",
       "name": "John Doe",
       "email": "john@study.iitm.ac.in",
       "college": "IIT Madras"
     },
     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
   }

8. FRONTEND
   └─ Receives response
   └─ Stores tokens in authStore (Zustand)
   └─ Shows success confetti animation
   └─ Redirects to Dashboard

9. VIEW DATA
   └─ Prisma Studio: http://localhost:5555
      • Click "User" model
      • See "John Doe" in the list
   
   └─ Supabase Dashboard: https://supabase.com/dashboard
      • Table Editor → User
      • See new row with John's data
```

---

## 🚗 Example: Creating a Ride Flow

```
1. USER in Dashboard
   └─ Fills "Create Ride" form
   
2. FRONTEND
   POST http://localhost:3001/api/rides
   Headers: {
     "Authorization": "Bearer eyJhbGc...",
     "Content-Type": "application/json"
   }
   Body: {
     "origin": "IIT Delhi",
     "destination": "IGI Airport",
     "departureTime": "2026-02-01T10:00:00Z",
     "availableSeats": 3,
     "pricePerSeat": 150
   }

3. BACKEND
   └─ authenticate() middleware verifies JWT
   └─ Extracts userId from token
   └─ Validates ride data

4. PRISMA
   await prisma.ride.create({
     data: {
       userId: "cm5t123abc",
       origin: "IIT Delhi",
       destination: "IGI Airport",
       departureTime: new Date("2026-02-01T10:00:00Z"),
       availableSeats: 3,
       pricePerSeat: 150,
       status: "ACTIVE"
     }
   })

5. SUPABASE
   INSERT INTO "Ride" (
     id, user_id, origin, destination,
     departure_time, available_seats,
     price_per_seat, status, created_at
   ) VALUES (...);
   
   ✅ RIDE SAVED!

6. RESPONSE
   {
     "ride": {
       "id": "cm5t456def",
       "origin": "IIT Delhi",
       "destination": "IGI Airport",
       "departureTime": "2026-02-01T10:00:00Z",
       "availableSeats": 3,
       "pricePerSeat": 150,
       "status": "ACTIVE"
     }
   }

7. VIEW
   └─ Prisma Studio → Ride model
      • See new ride listed
   └─ Supabase → Ride table
      • New row appears instantly
```

---

## 💬 Real-Time Messaging Flow

```
1. USER sends message
   
2. SOCKET.IO EVENT
   socket.emit('send_message', {
     matchId: "cm5t789ghi",
     content: "Hey! When are we leaving?"
   })

3. BACKEND (services/socket.js)
   └─ Receives socket event
   └─ Validates user is in match
   
4. SAVE TO DATABASE
   await prisma.message.create({
     data: {
       matchId: "cm5t789ghi",
       senderId: "cm5t123abc",
       content: "Hey! When are we leaving?",
       isRead: false
     }
   })
   
   ✅ MESSAGE SAVED IN SUPABASE!

5. BROADCAST
   io.to(matchId).emit('new_message', {
     id: "cm5tabc",
     content: "Hey! When are we leaving?",
     sender: { name: "John Doe" },
     createdAt: "2026-01-31T12:30:00Z"
   })

6. OTHER USER
   └─ Receives message instantly
   └─ Displays in chat UI
   └─ No refresh needed!

7. VIEW
   └─ Prisma Studio → Message model
      • Real-time message history
   └─ Supabase → Message table
      • All messages stored
```

---

## 🔍 How to Find Specific Data

### In Prisma Studio (http://localhost:5555):

1. **Find User by Email:**
   - Click "User" model
   - Use filter: `email contains "john"`
   - See matching users

2. **See User's Rides:**
   - Click on a User row
   - Scroll to "ridesCreated" section
   - See all their rides!

3. **See Match Messages:**
   - Click "Match" model
   - Click on a match
   - See related messages automatically

### In Supabase Dashboard:

1. **SQL Query:**
   ```sql
   -- Find all rides by a specific user
   SELECT * FROM "Ride" 
   WHERE user_id = 'cm5t123abc';
   
   -- Find active rides
   SELECT * FROM "Ride" 
   WHERE status = 'ACTIVE' 
   ORDER BY departure_time ASC;
   
   -- See match with messages
   SELECT 
     m.id as match_id,
     u1.name as user1,
     u2.name as user2,
     COUNT(msg.id) as message_count
   FROM "Match" m
   JOIN "User" u1 ON m.user1_id = u1.id
   JOIN "User" u2 ON m.user2_id = u2.id
   LEFT JOIN "Message" msg ON m.id = msg.match_id
   GROUP BY m.id, u1.name, u2.name;
   ```

---

## 📊 Understanding the Database Schema

### Relationships:

```
User (one) ──< ridesCreated >── (many) Ride
                                          │
                                          │ belongs to
                                          ▼
User (one) ──< matchesAsUser1 >── (many) Match
                                          │
                                          │ has many
                                          ▼
Match (one) ──< messages >────── (many) Message
```

### Example Data Structure:

```javascript
// User Object
{
  id: "cm5t123abc",
  name: "John Doe",
  email: "john@study.iitm.ac.in",
  phoneHash: "a3d8f92b...",
  college: "IIT Madras",
  rating: 4.5,
  totalRides: 12,
  
  // Related data (loaded with Prisma)
  ridesCreated: [
    { id: "ride1", origin: "IIT Delhi", ... },
    { id: "ride2", origin: "IIT Bombay", ... }
  ],
  
  matchesAsUser1: [
    { id: "match1", status: "ACCEPTED", ... }
  ]
}
```

---

## 🎯 Quick Access Summary

| What | Where | URL |
|------|-------|-----|
| **View All Data** | Prisma Studio | http://localhost:5555 |
| **Edit Data in Browser** | Supabase Dashboard | https://supabase.com/dashboard |
| **Test API** | Your App | http://localhost:5173 |
| **Backend API** | Express Server | http://localhost:3001 |
| **Health Check** | API Endpoint | http://localhost:3001/health |

---

## 🔐 Data Security

### What Gets Stored:
✅ Hashed passwords (bcrypt)
✅ Hashed phone numbers
✅ Encrypted connections (SSL)
✅ JWT tokens (signed & verified)

### What NEVER Gets Stored:
❌ Plain text passwords
❌ Raw phone numbers in responses
❌ Credit card info (use payment gateway)
❌ Unencrypted sensitive data

---

## 📝 Summary

**Data flows like this:**
1. User interacts with Frontend
2. Frontend sends HTTP/WebSocket to Backend
3. Backend validates and processes
4. Prisma converts to SQL
5. Supabase PostgreSQL stores data
6. Backend sends response
7. Frontend updates UI

**You can view data in:**
- ✅ Prisma Studio (local, visual, easy)
- ✅ Supabase Dashboard (cloud, powerful, advanced)
- ✅ API responses (programmatic)
- ✅ Browser DevTools (debugging)

**Check out:**
- [DATA_VIEWING_GUIDE.md](./DATA_VIEWING_GUIDE.md) - Detailed guide
- [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - API documentation
