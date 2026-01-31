# 🚀 Spllit - How to See Results & Test the Application

## 🌐 Access Points

### Frontend Application
- **URL:** http://localhost:5175/
- **What you'll see:**
  - Landing page with features
  - Sign up modal
  - Login functionality
  - Hero section with animations
  - How it works section
  - Testimonials
  - FAQ page
  - About page

### Backend API
- **URL:** http://localhost:3001/
- **Health Check:** http://localhost:3001/health

---

## 📋 Available API Endpoints

### 🔐 Authentication Endpoints
Base URL: `http://localhost:3001/api/auth`

1. **Register New User**
   - **POST** `/api/auth/register`
   - **Body:**
     ```json
     {
       "email": "student@college.edu",
       "phoneNumber": "+919876543210",
       "password": "SecurePass123",
       "name": "John Doe",
       "college": "IIT Delhi",
       "gender": "MALE"
     }
     ```

2. **Login**
   - **POST** `/api/auth/login`
   - **Body:**
     ```json
     {
       "email": "student@college.edu",
       "password": "SecurePass123"
     }
     ```
   - **Returns:** JWT tokens (access & refresh)

3. **Refresh Token**
   - **POST** `/api/auth/refresh`
   - **Body:**
     ```json
     {
       "refreshToken": "your_refresh_token_here"
     }
     ```

---

### 🚗 Ride Endpoints
Base URL: `http://localhost:3001/api/rides`
*(Requires Authentication - Add header: `Authorization: Bearer YOUR_TOKEN`)*

1. **Create a Ride**
   - **POST** `/api/rides`
   - **Body:**
     ```json
     {
       "origin": "IIT Delhi",
       "destination": "IGI Airport",
       "departureTime": "2026-02-01T10:00:00Z",
       "availableSeats": 3,
       "pricePerSeat": 150,
       "preferences": {
         "gender": "ANY",
         "smoking": false,
         "petsAllowed": false,
         "musicPreference": "any"
       }
     }
     ```

2. **Search for Rides**
   - **GET** `/api/rides/search?origin=IIT Delhi&destination=IGI Airport&date=2026-02-01`

3. **Get My Rides**
   - **GET** `/api/rides/my`

4. **Update a Ride**
   - **PUT** `/api/rides/:id`

5. **Delete a Ride**
   - **DELETE** `/api/rides/:id`

---

### 🤝 Match Endpoints
Base URL: `http://localhost:3001/api/matches`
*(Requires Authentication)*

1. **Create a Match (Request to Join Ride)**
   - **POST** `/api/matches`
   - **Body:**
     ```json
     {
       "rideId": "ride_id_here",
       "matchedUserId": "user_id_here"
     }
     ```

2. **Get My Matches**
   - **GET** `/api/matches/my`

3. **Get Messages for a Match**
   - **GET** `/api/matches/:id/messages`

4. **Complete a Match**
   - **PUT** `/api/matches/:id/complete`

---

### 👤 User Endpoints
Base URL: `http://localhost:3001/api/users`
*(Requires Authentication)*

1. **Get My Profile**
   - **GET** `/api/users/me`

2. **Update My Profile**
   - **PUT** `/api/users/me`
   - **Body:**
     ```json
     {
       "name": "Updated Name",
       "bio": "Love to travel!",
       "preferences": {
         "gender": "ANY",
         "smoking": false
       }
     }
     ```

3. **Get User by ID**
   - **GET** `/api/users/:id`

---

## 🧪 Testing Methods

### Option 1: Using the Frontend (Easiest)
1. Open http://localhost:5175/ in your browser
2. Click "Join Waitlist" or "Get Started"
3. Sign up with your email
4. Log in
5. Navigate through the app to see all features

### Option 2: Using cURL (Command Line)
```bash
# 1. Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@college.edu",
    "phoneNumber": "+919876543210",
    "password": "Test123",
    "name": "Test User",
    "college": "IIT Delhi",
    "gender": "MALE"
  }'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@college.edu",
    "password": "Test123"
  }'

# 3. Create a ride (replace YOUR_TOKEN with the token from login)
curl -X POST http://localhost:3001/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "origin": "IIT Delhi",
    "destination": "IGI Airport",
    "departureTime": "2026-02-01T10:00:00Z",
    "availableSeats": 3,
    "pricePerSeat": 150
  }'

# 4. Search rides
curl "http://localhost:3001/api/rides/search?origin=IIT%20Delhi&destination=IGI%20Airport" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Using Postman
1. Download Postman: https://www.postman.com/
2. Import the API endpoints above
3. Test each endpoint with the sample requests

### Option 4: Using VS Code REST Client
Install the "REST Client" extension and create a file `test.http`:

```http
### Register
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@college.edu",
  "phoneNumber": "+919876543210",
  "password": "Test123",
  "name": "Test User",
  "college": "IIT Delhi",
  "gender": "MALE"
}

### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@college.edu",
  "password": "Test123"
}

### Create Ride
POST http://localhost:3001/api/rides
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "origin": "IIT Delhi",
  "destination": "IGI Airport",
  "departureTime": "2026-02-01T10:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 150
}
```

---

## 🔍 What Results You Can See

### 1. **Database Results** (Prisma Studio)
```bash
cd backend && npm run prisma:studio
```
Opens at http://localhost:5555 - See all data in your database:
- Users table
- Rides table
- Matches table
- Messages table
- Locations table
- Blocks table

### 2. **API Response Examples**

**Successful Registration:**
```json
{
  "user": {
    "id": "cm5txxx",
    "email": "test@college.edu",
    "name": "Test User",
    "college": "IIT Delhi"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Search Rides Result:**
```json
{
  "rides": [
    {
      "id": "ride123",
      "origin": "IIT Delhi",
      "destination": "IGI Airport",
      "departureTime": "2026-02-01T10:00:00Z",
      "availableSeats": 3,
      "pricePerSeat": 150,
      "user": {
        "name": "John Doe",
        "college": "IIT Delhi"
      }
    }
  ],
  "total": 1
}
```

### 3. **Frontend Features You Can See**
- ✅ Responsive landing page
- ✅ Signup/Login modals
- ✅ Hero section with animations
- ✅ Feature showcase
- ✅ How it works section
- ✅ Testimonials
- ✅ FAQ section
- ✅ Footer with links

### 4. **Real-time Features** (Socket.IO)
Once logged in, you can see:
- Real-time chat messages
- Live ride updates
- Match notifications
- Online user status

---

## 🎯 Quick Start Testing Flow

1. **Open Frontend:** http://localhost:5175/
2. **Check Health:** http://localhost:3001/health
3. **Register a user** via the signup modal
4. **Login** with your credentials
5. **View Prisma Studio:** Run `cd backend && npm run prisma:studio`
6. **See your user** in the database

---

## 🐛 Troubleshooting

If you don't see results:
- Check backend is running on port 3001
- Check frontend is running on port 5175
- Verify database connection in `.env`
- Check browser console for errors (F12)
- Check terminal for server logs

---

## 📊 Monitoring

**Server Logs** show:
- Incoming requests
- Database queries
- Socket connections
- Errors and warnings

**Browser DevTools** (F12) show:
- Network requests
- Console logs
- React component tree
- WebSocket connections
