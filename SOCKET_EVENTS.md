# Socket.IO Events Documentation

## Overview
This document describes all real-time Socket.IO events implemented for the Spllit admin dashboard.

## Backend Events (Emitted by Server)

### 1. `new-user-registered`
**Triggered when:** A new user completes registration  
**File:** `backend/src/routes/auth.ts`  
**Payload:**
```javascript
{
  name: string,          // User's name
  college: string,       // User's college
  email: string,         // User's email
  timestamp: DateTime    // Registration timestamp
}
```

### 2. `new-ride-created`
**Triggered when:** A user creates a new ride  
**File:** `backend/src/routes/rides.ts`  
**Payload:**
```javascript
{
  origin: string,        // Starting location
  destination: string,   // Destination location
  fare: number,          // Ride fare amount
  vehicleType: string,   // 'cab', 'bike', or 'auto'
  creatorName: string,   // Name of ride creator
  timestamp: DateTime    // Creation timestamp
}
```

### 3. `new-match-created`
**Triggered when:** Two users are matched for a ride  
**File:** `backend/src/routes/matches.ts`  
**Payload:**
```javascript
{
  totalFare: number,     // Total ride fare
  splitAmount: number,   // Amount split per person (fare/2)
  origin: string,        // Starting location
  destination: string,   // Destination location
  matchId: string,       // Match ID
  timestamp: DateTime    // Match timestamp
}
```

### 4. `emergency-sos`
**Triggered when:** A user triggers an emergency SOS alert  
**File:** `backend/src/routes/emergency.ts`  
**Payload:**
```javascript
{
  id: string,            // Emergency ID
  userName: string,      // User's name
  userPhone: string,     // User's phone number
  userEmail: string,     // User's email
  college: string,       // User's college
  location: {
    lat: number,         // Latitude
    lng: number          // Longitude
  },
  message: string,       // Emergency message
  emergencyType: string, // 'accident', 'harassment', 'medical', 'other'
  timestamp: DateTime,   // Alert timestamp
  status: string         // 'active'
}
```

### 5. `emergency-status-updated`
**Triggered when:** Admin updates emergency status  
**File:** `backend/src/routes/emergency.ts`  
**Payload:**
```javascript
{
  id: string,            // Emergency ID
  status: string,        // 'active', 'acknowledged', 'resolved', 'false-alarm'
  resolvedAt: DateTime   // Resolution timestamp (null if not resolved)
}
```

## Frontend Listeners (Admin Dashboard)

### Location
All listeners are set up in `src/pages/AdminDashboard.jsx`

### Connection Setup
```javascript
const socket = io(import.meta.env.VITE_API_URL || 'https://ankit-production-f3d4.up.railway.app');
```

### Event Handlers

#### 1. New User Registration
```javascript
socket.on('new-user-registered', (data) => {
  addNotification({
    type: 'user',
    title: 'New User Registered',
    message: `${data.name} from ${data.college} just joined!`
  });
});
```

#### 2. New Ride Creation
```javascript
socket.on('new-ride-created', (data) => {
  addNotification({
    type: 'ride',
    title: 'New Ride Created',
    message: `${data.origin} → ${data.destination} (₹${data.fare})`
  });
});
```

#### 3. New Match Creation
```javascript
socket.on('new-match-created', (data) => {
  addNotification({
    type: 'match',
    title: 'New Match Created',
    message: `Total: ₹${data.totalFare} | Split: ₹${data.splitAmount} each`
  });
});
```

#### 4. Emergency SOS Alert
```javascript
socket.on('emergency-sos', (data) => {
  setEmergencies(prev => [data, ...prev]);
  addNotification({
    type: 'emergency',
    title: '🚨 EMERGENCY SOS',
    message: `${data.userName} needs help! ${data.emergencyType}`
  });
  // Audio alert
  const audio = new Audio('/emergency-alert.mp3');
  audio.play().catch(console.error);
});
```

## API Endpoints

### Emergency Endpoints

#### Create SOS Alert
```
POST /api/emergency/sos
Authorization: Bearer <token>

Body:
{
  location: {
    lat: number,
    lng: number
  },
  message?: string,
  emergencyType?: 'accident' | 'harassment' | 'medical' | 'other'
}
```

#### Update Emergency Status
```
PATCH /api/emergency/:id/status
Authorization: Bearer <token>

Body:
{
  status: 'active' | 'acknowledged' | 'resolved' | 'false-alarm'
}
```

#### Get Active Emergencies
```
GET /api/emergency
Authorization: Bearer <token>

Returns: Array of active/acknowledged emergencies
```

## Features

### Admin Dashboard Features
- ✅ Real-time toast notifications (auto-dismiss in 5s)
- ✅ Notification bell with emergency counter
- ✅ 10-minute activity tracking (green pulse = active, red static = inactive)
- ✅ Total splitting amount calculation
- ✅ Emergency SOS center tab
- ✅ Audio alerts for emergencies
- ✅ Quick action buttons (Call Police, Call Ambulance, Open Maps)
- ✅ Emergency protocols display

### Notification System
- Position: Fixed top-right
- Auto-dismiss: 5 seconds
- Types: User (blue), Ride (green), Match (purple), Emergency (red)
- Animation: Slide in from right with fade
- Stacking: Vertical with gap
- Icons: FaUser, FaCar, FaCheckCircle, FaExclamationTriangle

## Testing

### Test New User Registration
```bash
curl -X POST https://ankit-production-f3d4.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "password123",
    "college": "Test College",
    "gender": "male"
  }'
```

### Test New Ride Creation
```bash
curl -X POST https://ankit-production-f3d4.up.railway.app/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "origin": "IIT Delhi",
    "originLat": 28.5449,
    "originLng": 77.1926,
    "destination": "Connaught Place",
    "destLat": 28.6315,
    "destLng": 77.2167,
    "departureTime": "2024-01-20T10:00:00Z",
    "vehicleType": "cab",
    "seats": 2,
    "fare": 150
  }'
```

### Test Emergency SOS
```bash
curl -X POST https://ankit-production-f3d4.up.railway.app/api/emergency/sos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "location": {
      "lat": 28.5449,
      "lng": 77.1926
    },
    "message": "Need help urgently",
    "emergencyType": "medical"
  }'
```

## Deployment

### Backend
- Platform: Railway
- URL: https://ankit-production-f3d4.up.railway.app
- Auto-deploys from GitHub main branch
- Socket.IO port: Same as HTTP (3001 in dev, dynamic in production)

### Frontend
- Platform: Vercel
- URL: https://spllit.app
- Environment variables required:
  - `VITE_API_URL=https://ankit-production-f3d4.up.railway.app`

## Database Schema

### Emergency Table
```prisma
model Emergency {
  id              String    @id @default(cuid())
  userId          String
  locationLat     Float
  locationLng     Float
  message         String
  emergencyType   String    @default("other")
  status          String    @default("active")
  resolvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

## Notes

- Socket.IO connects to backend root URL (not `/api`)
- All events are broadcast globally to admin dashboard
- User-specific match events also exist: `match_created_${userId}`
- Emergency audio alerts may fail in browsers without user interaction
- Activity status checks `updatedAt` field within last 10 minutes
- Total splitting amount sums all match fares from completed rides
