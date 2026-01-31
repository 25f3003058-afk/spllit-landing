# 🚀 Spllit Backend API

Complete ride-matching backend with real-time chat, location sharing, and smart matching algorithm.

## ✅ What's Been Built

### Backend Infrastructure
- **Express.js + TypeScript** server running on port 3001
- **PostgreSQL database** via Supabase (cloud-hosted)
- **Prisma ORM** for type-safe database operations
- **Socket.IO** for real-time features
- **JWT authentication** with bcrypt password hashing

### Database Schema (6 Models)
1. **User** - Authentication and profiles
2. **Ride** - Ride requests and searches
3. **Match** - User connections and pairings
4. **Message** - Chat history
5. **Location** - GPS tracking
6. **Block** - User safety features

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - User login with email/password
- `POST /refresh` - Refresh access token

#### Rides (`/api/rides`)
- `POST /` - Create ride request
- `GET /search` - Find matching rides (smart algorithm)
- `GET /my` - Get user's rides
- `GET /:id` - Get specific ride
- `PUT /:id` - Update ride
- `DELETE /:id` - Delete ride

#### Matches (`/api/matches`)
- `GET /` - Get all matches
- `POST /:id/accept` - Accept a match
- `GET /:id/messages` - Get chat history
- `POST /block` - Block a user

#### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PATCH /status` - Update online status

### Socket.IO Real-time Features
- **Chat**: Send/receive messages instantly
- **Typing indicators**: See when others are typing
- **Online status**: Track user availability
- **Location sharing**: Real-time GPS updates
- **Match notifications**: Instant match alerts

### Smart Matching Algorithm
Finds rides based on:
- **Destination proximity**: Within ±2km radius
- **Time coordination**: Within ±30 minutes
- **Gender preferences**: Respect user preferences
- **Active status**: Only matches active rides

## 🎯 Frontend Integration Complete

### What Was Updated

1. **SignupModal.jsx** ✅
   - Replaced Google Apps Script with backend API
   - Added password field for secure authentication
   - Integrated with Zustand auth store
   - Auto-redirects to dashboard after signup

2. **Login.jsx** ✅
   - Simplified login form (email + password only)
   - Connected to backend `/api/auth/login`
   - JWT token management
   - Auto-redirects to dashboard on success

3. **New Files Created**
   - `src/services/api.js` - Axios client with interceptors
   - `src/store/authStore.js` - Zustand state management
   - `src/services/socket.js` - Socket.IO client
   - `src/pages/Dashboard.jsx` - User dashboard
   - `.env` - Frontend environment config

## 🔧 How to Test

### 1. Start Backend (Already Running)
```bash
cd backend
npm run dev
# ✅ Server running on http://localhost:3001
```

### 2. Start Frontend
```bash
cd /workspaces/spllit-landing
npm run dev
# Frontend will start on http://localhost:5173
```

### 3. Test the Flow

#### Sign Up
1. Visit http://localhost:5173
2. Click "Join Waitlist"
3. Complete the game
4. Fill form:
   - Name: Your name
   - Email: rollnumber (e.g., 25f36563058)
   - Phone: +91 + 10 digits
   - **Password**: Minimum 6 characters
5. Click "JOIN WAITLIST"
6. You'll be redirected to Dashboard

#### Login
1. Visit http://localhost:5173/login
2. Click "Login to Connect"
3. Enter your credentials:
   - Email: rollnumber
   - Password: your password
4. Click "Login to Connect"
5. You'll be redirected to Dashboard

### 4. Test API Directly

#### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@study.iitm.ac.in",
    "phone": "+919876543210",
    "password": "test123",
    "college": "IIT Madras"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@study.iitm.ac.in",
    "password": "test123"
  }'
```

Response will include:
```json
{
  "user": { "id": 1, "name": "Test User", "email": "..." },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Create a Ride (with token from login)
```bash
curl -X POST http://localhost:3001/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "origin": "IIT Madras",
    "destination": "T. Nagar Exam Center",
    "departureTime": "2026-02-15T09:00:00Z",
    "originLat": 12.9916,
    "originLng": 80.2336,
    "destinationLat": 13.0418,
    "destinationLng": 80.2341,
    "seats": 3,
    "genderPreference": "ANY"
  }'
```

#### Search for Matching Rides
```bash
curl "http://localhost:3001/api/rides/search?destination=T.%20Nagar&departureTime=2026-02-15T09:00:00Z&destinationLat=13.0418&destinationLng=80.2341" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📦 Tech Stack

### Backend
- Node.js 24.11.1
- Express.js 4.19.2
- TypeScript
- Prisma 6.19.2
- Socket.IO 4.8.1
- PostgreSQL (Supabase)
- JWT + bcrypt

### Frontend
- React 19.2.0
- Vite 7.2.4
- Zustand (state management)
- Axios (HTTP client)
- Socket.IO Client
- React Router

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📊 Database Status

✅ **Connected to Supabase**
- Project ID: yocsvbxahwccuhydvxiv
- Region: AWS Mumbai (ap-south-1)
- Connection: Session Pooler (Port 5432)

✅ **All Tables Created**
```
User
Ride
Match
Message
Location
Block
```

## 🎉 What's Next?

### Immediate Next Steps
1. **Test the signup/login flow** in the browser
2. **Create ride functionality** - Build UI for ride creation
3. **Search and match UI** - Display matching rides
4. **Chat component** - Real-time messaging interface
5. **Google Maps integration** - Visual location display

### Future Features
- Email verification
- Phone OTP verification
- Push notifications
- Ride history
- Rating system
- Payment integration
- Admin dashboard

## 🐛 Troubleshooting

### Backend Won't Start
```bash
cd backend
rm -rf node_modules
npm install
npx prisma generate
npm run dev
```

### Frontend Build Errors
```bash
rm -rf node_modules
npm install
npm run dev
```

### Database Connection Issues
Check `backend/.env` for correct `DATABASE_URL`

### CORS Errors
Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

## 📝 Notes

- **Passwords are hashed** using bcrypt (salt rounds: 10)
- **Phone numbers are hashed** for privacy
- **JWT tokens expire**: Access token (15min), Refresh token (7 days)
- **Socket.IO requires authentication**: Pass JWT in auth header
- **Matching algorithm** considers ±2km distance and ±30min time window

---

**Built with ❤️ for IIT Madras BS Students**
