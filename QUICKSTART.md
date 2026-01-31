# 🚀 Quick Start Guide - Spllit Backend

## What Has Been Created

✅ **Complete Backend Structure**
- Node.js + Express + TypeScript server
- PostgreSQL database schema with Prisma ORM
- Socket.IO for real-time chat and location sharing
- JWT authentication system
- RESTful API endpoints for rides, matches, users
- Smart matching algorithm (destination, time, gender preferences)

✅ **Database Models**
- Users (with hashed phones/passwords)
- Rides (create and search)
- Matches (user connections)
- Messages (chat history)
- Locations (GPS tracking)
- Blocks (user safety)

✅ **Real-Time Features**
- Private chat rooms
- Online/offline status
- Typing indicators
- Location sharing
- Read receipts
- Match notifications

## 📋 What You Need to Do Next

### 1. Set Up Database (5 minutes)

**Recommended: Supabase (Free with GitHub Student Pack)**

```bash
# Go to: https://supabase.com/github-students
# Create account → New Project → Get connection string
```

1. Visit https://supabase.com/github-students
2. Sign in with GitHub
3. Create new project: "spllit-db"
4. Go to Settings → Database → Connection String
5. Copy the "Transaction pooler" connection string
6. Replace `[YOUR-PASSWORD]` with your database password

### 2. Run Setup Script

```bash
cd backend
./setup.sh
```

The script will:
- Install all dependencies
- Create .env file with auto-generated JWT secrets
- Guide you through database setup
- Run Prisma migrations

### 3. Update .env File

```bash
nano .env  # or open in VS Code
```

Update this line with your Supabase connection string:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

### 4. Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📡 Socket.IO enabled
🌐 Frontend URL: http://localhost:5173
```

### 6. Test the API

Open a new terminal:
```bash
# Health check
curl http://localhost:3001/health

# Register a test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@study.iitm.ac.in",
    "phone": "+919876543210",
    "password": "test123",
    "college": "IIT Madras",
    "gender": "other"
  }'
```

## 🎯 Next Steps

### Frontend Integration

1. **Install Dependencies**
   ```bash
   cd ..  # Back to root
   npm install socket.io-client axios zustand @react-google-maps/api
   ```

2. **Create API Service** (see IMPLEMENTATION_GUIDE.md)
3. **Update SignupModal.jsx** to use backend API
4. **Update Login.jsx** to use backend API
5. **Create Chat Component**
6. **Add Google Maps** for location sharing

## 📖 Documentation

- **Full Guide**: [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md)
- **Backend README**: [backend/README.md](README.md)
- **API Endpoints**: See backend/README.md
- **Socket Events**: See backend/README.md

## 🔍 Useful Commands

```bash
# Development
npm run dev                # Start with hot reload

# Database
npm run prisma:studio      # Open database GUI
npm run prisma:generate    # Regenerate Prisma client
npm run prisma:migrate     # Run migrations

# Production
npm run build             # Build TypeScript
npm start                 # Start production server
```

## 📊 API Endpoints Created

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Rides
- `POST /api/rides` - Create ride
- `GET /api/rides/search` - Search matching rides
- `GET /api/rides/my` - Get user's rides
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Delete ride

### Matches
- `POST /api/matches` - Create match
- `GET /api/matches/my` - Get user's matches
- `GET /api/matches/:id/messages` - Get chat messages
- `PUT /api/matches/:id/complete` - Complete match

### Users
- `GET /api/users/me` - Get profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID

## 🔌 Socket.IO Events

### Client → Server
- `join_matches` - Join chat rooms
- `send_message` - Send message
- `typing` - Typing indicator
- `share_location` - Share GPS location
- `stop_location` - Stop sharing
- `mark_read` - Mark message as read

### Server → Client
- `new_message` - New message received
- `user_typing` - User is typing
- `location_update` - Location update
- `user_status` - Online/offline status
- `message_read` - Message read receipt
- `match_created_{userId}` - New match created

## 🐛 Troubleshooting

**Database connection error:**
```bash
# Check your DATABASE_URL format
# Ensure your IP is allowedlisted in Supabase

# Test connection
npm run prisma:studio
```

**Port 3001 already in use:**
```bash
# Kill the process
lsof -ti:3001 | xargs kill -9
```

**Prisma Client not generated:**
```bash
npm run prisma:generate
```

**Migration errors:**
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Then run migrations again
npm run prisma:migrate
```

## 💡 Tips

1. **Keep backend running** while developing frontend
2. **Use Prisma Studio** to see data: `npm run prisma:studio`
3. **Check logs** if API calls fail
4. **Test with curl/Postman** before integrating frontend
5. **Never commit .env** file to git

## 🎓 What to Learn Next

If you want to understand the code better:

1. **Express.js** - Backend framework basics
2. **Prisma ORM** - Database queries and migrations
3. **JWT Authentication** - How tokens work
4. **Socket.IO** - Real-time communication
5. **TypeScript** - Type-safe JavaScript

## 📞 Need Help?

1. Check [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) for detailed walkthrough
2. Read [backend/README.md](README.md) for API documentation
3. Prisma docs: https://www.prisma.io/docs
4. Socket.IO docs: https://socket.io/docs/v4/

## ✅ Checklist

- [ ] Database set up (Supabase or local PostgreSQL)
- [ ] .env file configured with DATABASE_URL
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Migrations run (`npm run prisma:migrate`)
- [ ] Backend server running (`npm run dev`)
- [ ] API health check successful (`curl http://localhost:3001/health`)
- [ ] Test user registered successfully
- [ ] Ready to integrate frontend! 🎉

---

**Current Status:** Backend is ready! Now integrate with your React frontend.

**Estimated Time to Complete Setup:** 10-15 minutes

**Next File to Edit:** `src/components/SignupModal.jsx` (replace Google Script with API call)
