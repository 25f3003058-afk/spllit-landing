# Spllit - Complete Implementation Guide

## 🚀 Project Overview

Transform your Spllit landing page into a **fully functional ride-matching platform** with real-time chat, location sharing, and smart matching algorithm. Users going to the same destination within 30 minutes get matched, can chat privately (without sharing phone numbers), see each other's online status, and share live locations.

## 📋 What We're Building

### Core Features
1. **User Authentication** - Register/login with email and phone
2. **Ride Creation & Search** - Create rides and find matches
3. **Smart Matching** - Algorithm matches users by destination, time, and preferences
4. **Real-Time Chat** - Private messaging between matched users
5. **Online Status** - See when your match is online/offline
6. **Location Sharing** - Share live GPS location during rides
7. **Privacy First** - Phone numbers are never shared

## 📁 Project Structure

\`\`\`
spllit-landing/
├── backend/                    # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── rides.ts       # Ride management
│   │   │   ├── matches.ts     # Match management
│   │   │   └── users.ts       # User profiles
│   │   ├── services/
│   │   │   └── socket.ts      # Socket.IO real-time handlers
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT authentication
│   │   ├── utils/
│   │   │   ├── helpers.ts     # Utility functions
│   │   │   └── prisma.ts      # Database client
│   │   └── server.ts          # Main server file
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json
│   └── .env                   # Environment variables
│
├── src/                        # React frontend (existing)
│   ├── components/
│   │   ├── SignupModal.jsx    # Will connect to backend
│   │   ├── ChatWindow.jsx     # New: Chat UI
│   │   └── LocationMap.jsx    # New: Map with location
│   ├── pages/
│   │   ├── Login.jsx          # Will connect to backend
│   │   ├── QuizPage.jsx       # Will create rides
│   │   └── Dashboard.jsx      # New: User dashboard
│   ├── services/
│   │   ├── api.js             # New: API client
│   │   └── socket.js          # New: Socket.IO client
│   └── store/
│       └── authStore.js       # New: Zustand auth state
│
└── package.json
\`\`\`

## 🛠️ Step-by-Step Setup Guide

### Phase 1: Backend Setup (COMPLETED ✅)

#### 1.1 Created Backend Structure
- ✅ Express.js server with TypeScript
- ✅ Prisma ORM with PostgreSQL schema
- ✅ Socket.IO for real-time features
- ✅ JWT authentication system
- ✅ API routes for auth, rides, matches, users

#### 1.2 Database Schema
Created 6 models:
- **User** - Authentication and profiles
- **Ride** - Ride creation and search
- **Match** - User connections
- **Message** - Chat history
- **Location** - GPS tracking
- **Block** - User safety

### Phase 2: Database Setup (NEXT STEP 🎯)

#### Option A: Supabase (Recommended - Free with Student Pack)

1. **Sign up for Supabase**
   - Go to https://supabase.com/github-students
   - Sign in with GitHub (Student Developer Pack)
   - Get $100 credit

2. **Create Project**
   - Click "New Project"
   - Name: "spllit-db"
   - Set a strong database password
   - Choose region closest to you

3. **Get Connection String**
   - Go to Settings → Database
   - Find "Connection string" section
   - Copy the "Transaction" connection string
   - Replace \`[YOUR-PASSWORD]\` with your database password

4. **Update .env file**
   \`\`\`bash
   cd backend
   cp .env.example .env
   nano .env  # or use VS Code
   \`\`\`
   
   Update:
   \`\`\`env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   JWT_SECRET="$(openssl rand -base64 32)"
   JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
   FRONTEND_URL="http://localhost:5173"
   \`\`\`

5. **Run Migrations**
   \`\`\`bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   \`\`\`

#### Option B: Local PostgreSQL

\`\`\`bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb spllit_db

# Create user
sudo -u postgres psql
CREATE USER spllit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE spllit_db TO spllit_user;
\\q

# Update .env
DATABASE_URL="postgresql://spllit_user:your_password@localhost:5432/spllit_db"
\`\`\`

### Phase 3: Start Backend Server

\`\`\`bash
cd backend
npm run dev
\`\`\`

Expected output:
\`\`\`
🚀 Server running on port 3001
📡 Socket.IO enabled
🌐 Frontend URL: http://localhost:5173
\`\`\`

Test it:
\`\`\`bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
\`\`\`

### Phase 4: Frontend Integration (TODO)

#### 4.1 Install Frontend Dependencies

\`\`\`bash
npm install socket.io-client axios zustand @react-google-maps/api
\`\`\`

#### 4.2 Create API Service

Create \`src/services/api.js\`:
\`\`\`javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:3001/api/auth/refresh', {
            refreshToken
          });
          localStorage.setItem('accessToken', response.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
          error.config.headers.Authorization = \`Bearer \${response.data.tokens.accessToken}\`;
          return axios(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
\`\`\`

#### 4.3 Create Socket Service

Create \`src/services/socket.js\`:
\`\`\`javascript
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  socket = io('http://localhost:3001', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
\`\`\`

#### 4.4 Create Auth Store

Create \`src/store/authStore.js\`:
\`\`\`javascript
import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      connectSocket(tokens.accessToken);
      
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.error };
    }
  },

  register: async (userData) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/register', userData);
      const { user, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      connectSocket(tokens.accessToken);
      
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.error };
    }
  },

  logout: () => {
    localStorage.clear();
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await api.get('/users/me');
      connectSocket(token);
      set({ user: response.data.user, isAuthenticated: true });
    } catch {
      localStorage.clear();
    }
  }
}));

export default useAuthStore;
\`\`\`

#### 4.5 Update SignupModal.jsx

Replace the Google Script submission with API call:
\`\`\`javascript
import useAuthStore from '../store/authStore';

// In handleSubmit:
const register = useAuthStore((state) => state.register);

const result = await register({
  name: formData.name,
  email: \`\${formData.rollNumber}@study.iitm.ac.in\`,
  phone: \`+91\${formData.phone}\`,
  password: formData.phone, // Or add password field
  college: formData.college,
  gender: 'other' // Or add gender selection
});

if (result.success) {
  setStep(3); // Success screen
} else {
  alert(result.error);
}
\`\`\`

### Phase 5: Create Chat UI Component

Create \`src/components/ChatWindow.jsx\` with:
- Message list with scroll
- Input field with send button
- Typing indicator
- Online/offline status
- Location sharing button
- File/image upload

### Phase 6: Create Dashboard

Create \`src/pages/Dashboard.jsx\` with:
- List of active matches
- Quick ride creation
- View ride history
- Profile settings

### Phase 7: Testing

1. Register two test users
2. Create a ride from User 1
3. Search and match from User 2
4. Test chat functionality
5. Test location sharing
6. Test online/offline status

## 🔑 Free Resources with GitHub Student Pack

1. **Supabase** - $100 credit for database
2. **Railway** - $5/month free for backend hosting
3. **MongoDB Atlas** - Free M0 cluster (alternative to PostgreSQL)
4. **Stripe** - Waived transaction fees
5. **Twilio** - $50 credit for SMS OTP
6. **Namecheap** - Free domain + SSL
7. **DigitalOcean** - $200 credit
8. **Google Cloud** - $300 credit (for Maps API)

## 🚀 Deployment (When Ready)

### Backend: Railway

\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy
railway up
\`\`\`

Set environment variables in Railway dashboard.

### Frontend: Vercel (Already Set Up)

Update \`src/services/api.js\` and \`socket.js\` with production URLs.

## 📊 Current Status

✅ Backend structure created  
✅ Database schema designed  
✅ Authentication system built  
✅ Ride matching algorithm implemented  
✅ Socket.IO chat system ready  
✅ Location sharing handlers created  
🎯 **NEXT: Set up database and run migrations**  
⏳ Frontend integration pending  
⏳ Chat UI creation pending  
⏳ Testing pending  
⏳ Deployment pending  

## 🎯 Next Steps

1. **Set up Supabase database** (5 minutes)
2. **Run database migrations** (2 minutes)
3. **Start backend server** (1 minute)
4. **Test API endpoints** with Postman/curl (10 minutes)
5. **Integrate frontend** - Update SignupModal and Login (30 minutes)
6. **Create chat UI** (1-2 hours)
7. **Add Google Maps** for location (1 hour)
8. **Test end-to-end** (30 minutes)
9. **Deploy to production** (30 minutes)

**Estimated Total Time: 6-8 hours of active work**

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **Prisma Docs**: https://www.prisma.io/docs
- **React Query**: https://tanstack.com/query/latest
- **GitHub Student Pack**: https://education.github.com/pack

## 🎓 Learning Resources

If you're new to any of these technologies:
- **Node.js + Express**: [NodeJS.org Getting Started](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **PostgreSQL**: [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- **Socket.IO**: [Socket.IO Get Started](https://socket.io/get-started/chat)
- **JWT Authentication**: [JWT.io Introduction](https://jwt.io/introduction)

## 💡 Tips

1. **Start with database setup** - Everything depends on this
2. **Test each API endpoint** before moving to frontend
3. **Use Prisma Studio** to visualize data: \`npm run prisma:studio\`
4. **Check logs** if something doesn't work
5. **Use environment variables** for all sensitive data
6. **Never commit .env file** to git

## 🐛 Common Issues

**Port already in use:**
\`\`\`bash
lsof -ti:3001 | xargs kill -9
\`\`\`

**Prisma migration issues:**
\`\`\`bash
npx prisma migrate reset
npx prisma migrate dev
\`\`\`

**Socket connection refused:**
- Check if backend is running
- Verify CORS settings
- Check firewall rules

Good luck building Spllit! 🚀
