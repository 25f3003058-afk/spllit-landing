# 📊 How to View & Manage Your Spllit Data

## 🎯 Your Database Setup

You're using **Supabase PostgreSQL** database connected at:
- **Host:** aws-1-ap-south-1.pooler.supabase.com
- **Database:** postgres
- **Region:** AWS Mumbai (ap-south-1)

---

## 🔍 **Method 1: Supabase Dashboard (BEST & EASIEST)**

### Step 1: Access Your Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard
2. **Login** with your Supabase account credentials
3. **Select** your project: `yocsvbxahwccuhydvxiv`

### Step 2: Navigate to Table Editor

```
Dashboard → Your Project → Table Editor (left sidebar)
```

### What You'll See:

📋 **All Your Tables:**
- ✅ **User** - All registered users
- ✅ **Ride** - All created rides
- ✅ **Match** - All ride matches/connections
- ✅ **Message** - All chat messages
- ✅ **Location** - User location tracking
- ✅ **Block** - Blocked user relationships

### Features Available:
- ✏️ **Edit data** directly in the browser
- ➕ **Add new rows** manually
- 🗑️ **Delete rows**
- 🔍 **Search and filter** data
- 📊 **View relationships** between tables
- 📈 **Export data** to CSV/JSON

### Step 3: View Real-Time Data

**Table Editor View:**
```
┌─────────────────────────────────────────────────────────────┐
│  Table: User                                    [+ Insert]   │
├──────────┬──────────────┬────────────────────┬──────────────┤
│ id       │ name         │ email               │ college      │
├──────────┼──────────────┼────────────────────┼──────────────┤
│ cm5t... │ John Doe     │ test@study.iitm... │ IIT Madras   │
│ cm5u... │ Jane Smith   │ jane@study.iitm... │ IIT Madras   │
└──────────┴──────────────┴────────────────────┴──────────────┘
```

---

## 🛠️ **Method 2: Prisma Studio (Local Visual Tool)**

Prisma Studio is like a mini-database admin panel that runs locally.

### Start Prisma Studio:

```bash
cd /workspaces/spllit-landing/backend
npm run prisma:studio
```

or

```bash
cd /workspaces/spllit-landing/backend
npx prisma studio
```

### Access:
- Opens at: **http://localhost:5555**
- Automatic browser launch

### Features:
- 🎨 Beautiful, modern UI
- 🔗 See related data (e.g., User → their Rides)
- ✏️ Edit data visually
- 🔍 Search across all fields
- 📱 Mobile-friendly interface

### Screenshot Preview:
```
┌───────────────────────────────────────────────┐
│  Prisma Studio                                │
├───────────────────────────────────────────────┤
│  Models:                                      │
│  • User (15 records)                          │
│  • Ride (8 records)                           │
│  • Match (3 records)                          │
│  • Message (12 records)                       │
│  • Location (20 records)                      │
│  • Block (0 records)                          │
└───────────────────────────────────────────────┘
```

---

## 💻 **Method 3: SQL Query Editor (Supabase)**

For advanced users who want to run custom SQL queries.

### Access SQL Editor:

1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Write your queries

### Example Queries:

**See all users:**
```sql
SELECT id, name, email, college, created_at 
FROM "User" 
ORDER BY created_at DESC 
LIMIT 10;
```

**See all rides with creator info:**
```sql
SELECT 
  r.id,
  r.origin,
  r.destination,
  r.departure_time,
  r.available_seats,
  u.name as creator_name,
  u.college
FROM "Ride" r
JOIN "User" u ON r.user_id = u.id
ORDER BY r.created_at DESC;
```

**See match statistics:**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM "Match"
GROUP BY status;
```

**Recent messages:**
```sql
SELECT 
  m.content,
  m.created_at,
  u.name as sender_name
FROM "Message" m
JOIN "User" u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 20;
```

---

## 🔄 **How Data Flows in Your Application**

### Architecture Overview:

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   React     │ HTTP │   Express    │ SQL  │   Supabase     │
│  Frontend   │─────▶│   Backend    │─────▶│  PostgreSQL    │
│ Port: 5173  │◀─────│  Port: 3001  │◀─────│    Database    │
└─────────────┘ JSON └──────────────┘      └────────────────┘
                          ↕
                    ┌──────────────┐
                    │    Prisma    │
                    │     ORM      │
                    └──────────────┘
```

### Detailed Flow:

#### **1. User Signup/Registration**

```
Frontend (SignupModal.jsx)
    ↓
    POST /api/auth/register
    {
      "name": "John Doe",
      "email": "john@study.iitm.ac.in",
      "phoneNumber": "+919876543210",
      "password": "SecurePass123",
      "college": "IIT Madras",
      "gender": "MALE"
    }
    ↓
Backend (routes/auth.ts)
    ↓
Password Hashing (bcrypt)
    ↓
Prisma Client → Supabase
    ↓
INSERT INTO "User" (id, name, email, phone_hash, password, college, gender)
    ↓
Supabase Database ✅ Data Stored
    ↓
Response with JWT tokens
```

#### **2. Creating a Ride**

```
Frontend
    ↓
    POST /api/rides (with JWT token)
    {
      "origin": "IIT Delhi",
      "destination": "IGI Airport",
      "departureTime": "2026-02-01T10:00:00Z",
      "availableSeats": 3,
      "pricePerSeat": 150
    }
    ↓
Backend authenticates user (JWT middleware)
    ↓
Prisma Client
    ↓
INSERT INTO "Ride" (id, user_id, origin, destination, ...)
    ↓
Supabase Database ✅ Ride Created
```

#### **3. Real-Time Messages (Socket.IO)**

```
Frontend → Socket.IO Connection
    ↓
    emit('send_message', { matchId, content })
    ↓
Backend Socket Handler (services/socket.ts)
    ↓
Prisma: INSERT INTO "Message"
    ↓
Supabase ✅ Message Saved
    ↓
Socket.IO broadcasts to room
    ↓
Frontend receives real-time message
```

---

## 📱 **Method 4: API Endpoints (Programmatic Access)**

You can also view data through your API endpoints.

### Using cURL:

**Get your profile (after login):**
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@study.iitm.ac.in","password":"Test123"}' \
  | jq -r '.accessToken')

# Get your profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/users/me
```

**Get all your rides:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/rides/my
```

**Search for rides:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/rides/search?origin=IIT%20Delhi&destination=Airport"
```

---

## 🎮 **Method 5: Browser DevTools (Network Tab)**

### See API calls in real-time:

1. Open your app: http://localhost:5173
2. Press **F12** (or Right Click → Inspect)
3. Go to **Network** tab
4. Perform actions (signup, create ride, etc.)
5. Click on requests to see:
   - Request payload (data sent)
   - Response data (data received)
   - Headers and status codes

### Example:
```
POST /api/auth/register     200 OK    1.2s
  ▼ Request Payload
    {
      "name": "John Doe",
      "email": "john@study.iitm.ac.in",
      ...
    }
  ▼ Response
    {
      "user": {
        "id": "cm5t123...",
        "name": "John Doe",
        "email": "john@study.iitm.ac.in"
      },
      "accessToken": "eyJhbG..."
    }
```

---

## 📊 **What Data is Stored Where**

### User Table
```
┌─────────────────────┬────────────────────────────────────┐
│ Field               │ Description                        │
├─────────────────────┼────────────────────────────────────┤
│ id                  │ Unique user ID (cuid)              │
│ name                │ Full name                          │
│ email               │ Email (unique)                     │
│ phoneHash           │ Encrypted phone number             │
│ password            │ Bcrypt hashed password             │
│ college             │ College/Institution name           │
│ gender              │ MALE/FEMALE/OTHER                  │
│ profilePhoto        │ Photo URL (optional)               │
│ rating              │ User rating (0-5)                  │
│ totalRides          │ Number of completed rides          │
│ createdAt           │ Registration date                  │
│ lastSeen            │ Last activity timestamp            │
└─────────────────────┴────────────────────────────────────┘
```

### Ride Table
```
┌─────────────────────┬────────────────────────────────────┐
│ Field               │ Description                        │
├─────────────────────┼────────────────────────────────────┤
│ id                  │ Unique ride ID                     │
│ userId              │ Creator's user ID                  │
│ origin              │ Starting location                  │
│ destination         │ End location                       │
│ departureTime       │ When ride starts                   │
│ availableSeats      │ Seats available                    │
│ pricePerSeat        │ Cost per person                    │
│ status              │ ACTIVE/COMPLETED/CANCELLED         │
│ preferences         │ JSON: gender, smoking, etc.        │
└─────────────────────┴────────────────────────────────────┘
```

### Match Table (Ride Connections)
```
┌─────────────────────┬────────────────────────────────────┐
│ Field               │ Description                        │
├─────────────────────┼────────────────────────────────────┤
│ id                  │ Unique match ID                    │
│ rideId              │ Related ride                       │
│ user1Id             │ Ride creator                       │
│ user2Id             │ Joining user                       │
│ status              │ PENDING/ACCEPTED/COMPLETED         │
│ chatRoomId          │ Chat room ID                       │
│ splitAmount         │ Money split amount                 │
└─────────────────────┴────────────────────────────────────┘
```

### Message Table
```
┌─────────────────────┬────────────────────────────────────┐
│ Field               │ Description                        │
├─────────────────────┼────────────────────────────────────┤
│ id                  │ Unique message ID                  │
│ matchId             │ Which conversation                 │
│ senderId            │ Who sent it                        │
│ content             │ Message text                       │
│ createdAt           │ Timestamp                          │
│ isRead              │ Read status                        │
└─────────────────────┴────────────────────────────────────┘
```

---

## 🔐 **Security Features in Your Data**

1. **Password Storage:**
   - ✅ Passwords are hashed with bcrypt (never stored as plain text)
   - ✅ Salt rounds: 10

2. **Phone Number Privacy:**
   - ✅ Stored as `phoneHash` (hashed)
   - ✅ Not visible to other users

3. **JWT Tokens:**
   - ✅ Expire after 1 hour
   - ✅ Refresh tokens last 7 days
   - ✅ Stored in memory/localStorage (frontend)

4. **Database Access:**
   - ✅ Connection string uses SSL
   - ✅ Supabase handles connection pooling
   - ✅ All queries through Prisma ORM (SQL injection protection)

---

## 🚀 **Quick Start: See Your First Data**

### Step-by-Step:

1. **Start Backend:**
   ```bash
   cd /workspaces/spllit-landing/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd /workspaces/spllit-landing
   npm run dev
   ```

3. **Open Prisma Studio:**
   ```bash
   cd /workspaces/spllit-landing/backend
   npm run prisma:studio
   ```

4. **Register a Test User:**
   - Open http://localhost:5173
   - Click "Join Waitlist"
   - Fill form and submit

5. **View in Prisma Studio:**
   - Go to http://localhost:5555
   - Click "User" model
   - See your new user! 🎉

6. **Or View in Supabase:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Table Editor → User
   - See your data there too!

---

## 📈 **Monitoring & Analytics**

### Supabase Dashboard Features:

1. **Database Size:**
   - Settings → Database → Shows total DB size

2. **API Usage:**
   - Settings → API → Request statistics

3. **Real-time Logs:**
   - Logs → Database logs
   - See all queries being executed

4. **Performance:**
   - Database → Query Performance
   - Slow query detection

---

## 🛟 **Troubleshooting**

### Can't see data in Supabase?

1. **Check connection:**
   ```bash
   cd /workspaces/spllit-landing/backend
   npx prisma db push
   ```

2. **Verify DATABASE_URL:**
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```

3. **Test connection:**
   ```bash
   psql "postgresql://postgres.yocsvbxahwccuhydvxiv:Kurkure123%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

### Prisma Studio won't start?

```bash
cd backend
npx prisma generate
npx prisma studio
```

### No data showing?

- Make sure you've registered/created data first
- Check backend logs for errors
- Verify tables exist: `npx prisma db push`

---

## 📚 **Additional Resources**

- **Supabase Docs:** https://supabase.com/docs
- **Prisma Studio Docs:** https://www.prisma.io/studio
- **Your API Guide:** [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)

---

**Need Help?** Check the backend server logs or open Prisma Studio to debug!
