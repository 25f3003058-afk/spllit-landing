# Admin Dashboard Features - Visual Guide

## 🎯 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                              │
│  Spllit Admin  [Dashboard] [Users] [Rides] [Emergency]  🔔 [3]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 STATISTICS (5 Cards)                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ 👥      │ │ 🚗      │ │ 🤝      │ │ 🚨      │ │ 💰      │    │
│  │ Total   │ │ Total   │ │ Active  │ │ Active  │ │ Total   │    │
│  │ Users   │ │ Rides   │ │ Matches │ │Emergency│ │ Split   │    │
│  │   245   │ │   128   │ │    34   │ │    2    │ │ ₹12,450 │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                                     │
│  📋 TABS                                                           │
│  ┌──────────┬──────────┬──────────┬──────────┐                   │
│  │Dashboard │  Users   │  Rides   │Emergency │                   │
│  └──────────┴──────────┴──────────┴──────────┘                   │
│                                                                     │
│  DASHBOARD TAB CONTENT                                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Recent Activity                                             │  │
│  │ • New user registered: John Doe from IIT Delhi             │  │
│  │ • New ride created: Connaught Place → Airport              │  │
│  │ • Match created: ₹150 split between 2 users                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔔 Real-Time Notifications

### Notification Types

#### 1. New User Registration (Blue)
```
┌─────────────────────────────────────┐
│ 👤 New User Registered         [×] │
│ John Doe from IIT Delhi just joined!│
└─────────────────────────────────────┘
```

#### 2. New Ride Created (Green)
```
┌─────────────────────────────────────┐
│ 🚗 New Ride Created            [×] │
│ IIT Delhi → Connaught Place (₹150) │
└─────────────────────────────────────┘
```

#### 3. New Match Created (Purple)
```
┌─────────────────────────────────────┐
│ ✓ New Match Created            [×] │
│ Total: ₹150 | Split: ₹75 each      │
└─────────────────────────────────────┘
```

#### 4. Emergency SOS (Red + Audio)
```
┌─────────────────────────────────────┐
│ 🚨 EMERGENCY SOS              [×]  │
│ John Doe needs help! medical        │
└─────────────────────────────────────┘
🔊 *BEEP BEEP BEEP* (Audio Alert)
```

### Notification Behavior
- **Position**: Top-right corner
- **Auto-dismiss**: 5 seconds
- **Animation**: Slide in from right
- **Stacking**: Vertical with 16px gap
- **Max visible**: All notifications stack

## 👥 Users Tab - Activity Tracking

```
┌────────────────────────────────────────────────────────────────┐
│  USERS                                                         │
│  Search: [______________] [Search]                             │
│                                                                │
│  Name         Email            College      Activity  Actions  │
│  ────────────────────────────────────────────────────────────  │
│  🟢 John Doe   john@iit.ac.in   IIT Delhi   Active   [View]   │
│  🟢 Jane Smith jane@du.ac.in    DU Delhi    Active   [View]   │
│  🔴 Bob Lee    bob@example.com  BITS Pilani Inactive [View]   │
│                                                                │
│  🟢 = Active (< 10 min)  |  🔴 = Inactive (> 10 min)         │
└────────────────────────────────────────────────────────────────┘
```

### Activity Logic
- **Green Pulsing Dot**: User active within last 10 minutes
- **Red Static Dot**: User inactive for more than 10 minutes
- **Checked Field**: `updatedAt` timestamp
- **Update Trigger**: Any user action (login, ride creation, match)

## 🚗 Rides Tab

```
┌────────────────────────────────────────────────────────────────┐
│  RIDES                                                         │
│  Filter: [All] [Pending] [Matched] [Completed]                │
│                                                                │
│  Origin        Destination       Fare    Status     Actions   │
│  ────────────────────────────────────────────────────────────  │
│  IIT Delhi     Connaught Place   ₹150    Matched   [View]    │
│  DU North      Airport           ₹250    Pending   [View]    │
│  Hauz Khas     Cyber Hub         ₹180    Completed [View]    │
└────────────────────────────────────────────────────────────────┘
```

## 🚨 Emergency Tab - SOS Center

```
┌────────────────────────────────────────────────────────────────┐
│  🚨 EMERGENCY SOS CENTER                                      │
│                                                                │
│  Active Emergencies: 2                                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🚨 ACTIVE                                                │ │
│  │ User: John Doe                                           │ │
│  │ Phone: +91 9999999999                                    │ │
│  │ College: IIT Delhi                                       │ │
│  │ Location: 28.5449°N, 77.1926°E                          │ │
│  │ Type: Medical Emergency                                  │ │
│  │ Message: Need immediate medical help                     │ │
│  │ Time: 2 minutes ago                                      │ │
│  │                                                          │ │
│  │ Quick Actions:                                           │ │
│  │ [📞 Call Police]  [🚑 Call Ambulance]  [🗺️ Open Maps]  │ │
│  │ [Acknowledge]  [Mark Resolved]                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Emergency Protocols:                                          │
│  📞 Police: 100                                               │
│  🚑 Ambulance: 102 / 108                                      │
│  🔥 Fire: 101                                                 │
│  👩‍⚕️ Women Helpline: 1091                                     │
└────────────────────────────────────────────────────────────────┘
```

## 💰 Total Splitting Amount Calculation

### Logic
```javascript
calculateTotalSplitAmount() {
  const totalSplit = matches
    .filter(match => match.status === 'completed')
    .reduce((sum, match) => sum + (match.ride.fare || 0), 0);
  return totalSplit;
}
```

### Example
```
Match 1: Ride fare ₹150
Match 2: Ride fare ₹200
Match 3: Ride fare ₹100
────────────────────────
Total Splitting: ₹450
```

## 🔔 Notification Bell Badge

```
┌──────────┐
│  🔔 [3] │  ← Red badge shows emergency count only
└──────────┘
```

### Badge Logic
- Shows count of **active emergencies only**
- Red background for urgency
- Updates in real-time
- Click to jump to Emergency tab

## 🎨 Color Scheme

### Notification Colors
- **Blue** (`bg-blue-100/text-blue-600`): User registrations
- **Green** (`bg-green-100/text-green-600`): Ride creations
- **Purple** (`bg-purple-100/text-purple-600`): Match creations
- **Red** (`bg-red-100/text-red-600`): Emergency alerts

### Activity Status Colors
- **Green** (`bg-green-500`): Active (pulsing animation)
- **Red** (`bg-red-500`): Inactive (static)

### Emergency Status Colors
- **Orange** (`bg-orange-500`): Active
- **Blue** (`bg-blue-500`): Acknowledged
- **Green** (`bg-green-500`): Resolved
- **Gray** (`bg-gray-500`): False Alarm

## 📱 Responsive Design

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────────────────────┐
│ Stats: [Card1] [Card2] [Card3] [Card4] [Card5]        │
│ Grid: 5 columns                                         │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────┐
│ Stats: [Card1] [Card2] [Card3]     │
│       [Card4] [Card5]               │
│ Grid: 3 columns                     │
└─────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌───────────────────┐
│ Stats: [Card1]   │
│       [Card2]     │
│       [Card3]     │
│       [Card4]     │
│       [Card5]     │
│ Grid: 2 columns   │
└───────────────────┘
```

## 🔄 Real-Time Update Flow

```
User Action              Backend                 Socket.IO              Frontend
────────────────────────────────────────────────────────────────────────────────

1. User Registers
   │
   └──────────────────> POST /api/auth/register
                             │
                             ├─ Create user in DB
                             │
                             └─> io.emit('new-user-registered')
                                                 │
                                                 └──────────────────> Notification appears
                                                                      Stats update
                                                                      User table updates

2. User Creates Ride
   │
   └──────────────────> POST /api/rides
                             │
                             ├─ Create ride in DB
                             │
                             └─> io.emit('new-ride-created')
                                                 │
                                                 └──────────────────> Notification appears
                                                                      Stats update
                                                                      Rides table updates

3. Users Match
   │
   └──────────────────> POST /api/matches
                             │
                             ├─ Create match in DB
                             ├─ Update ride status
                             │
                             └─> io.emit('new-match-created')
                                                 │
                                                 └──────────────────> Notification appears
                                                                      Stats update
                                                                      Total split updates

4. Emergency SOS
   │
   └──────────────────> POST /api/emergency/sos
                             │
                             ├─ Create emergency in DB
                             │
                             └─> io.emit('emergency-sos')
                                                 │
                                                 └──────────────────> RED notification
                                                                      Audio alert plays
                                                                      Badge counter updates
                                                                      Emergency tab updates
```

## 🎯 Key Features Summary

✅ **Real-Time Notifications** - Instant updates without page refresh  
✅ **Activity Tracking** - 10-minute rule with visual indicators  
✅ **Emergency SOS** - Critical alerts with audio + visual warnings  
✅ **Total Split Amount** - Live calculation of fare splitting  
✅ **Notification Bell** - Counter badge for active emergencies  
✅ **Responsive Design** - Works on all device sizes  
✅ **Auto-Dismiss** - Notifications clear after 5 seconds  
✅ **Color-Coded** - Different colors for different event types  
✅ **Socket.IO** - Bidirectional real-time communication  
✅ **Database Integration** - All data persisted in PostgreSQL  

---

**Dashboard URL**: https://spllit.app/admin/dashboard  
**Backend API**: https://ankit-production-f3d4.up.railway.app  
**Admin Login**: ankit@spllit.app / Kurkure123@
