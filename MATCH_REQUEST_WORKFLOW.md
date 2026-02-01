# Match Request & Chat Workflow

## Overview
Complete ride-sharing match workflow with request/approval system and real-time chat.

## User Flow

### 1. **Ride Creator Posts Ride**
- User creates a ride with origin, destination, time, fare, etc.
- Ride is set to `pending` status
- All other users can see this ride in "Find Matches"

### 2. **Match Request**
When a user clicks "Join Ride":

**Requester Experience:**
- Sees "⏳ Request Sent! Wait for approval..." notification
- Request appears in their Dashboard as "Pending"
- Status shows "WAITING FOR APPROVAL"

**Creator Experience:**
- Receives "📨 New Match Request!" notification
- Request appears in "My Rides" → "Pending Match Requests" section
- Can see requester's name, college, and ride details
- Has "Accept" and "Reject" buttons

### 3. **Match Acceptance**

**When Creator Accepts:**
- Match status changes from `pending` to `accepted`
- Ride status changes from `pending` to `matched`
- Both users receive "✅ Match Accepted!" notification
- Match appears in "Active Matches" section
- "Open Chat" button becomes available

**Both Users Get:**
- Real-time notification with notification sound
- Chat access to communicate before the ride
- Ride details visible in chat header

### 4. **Match Rejection**

**When Creator Rejects:**
- Match status changes to `rejected`
- Requester receives "❌ Request Declined" notification
- Ride remains `pending` for other users to request
- Match is removed from both users' views

### 5. **Real-Time Chat**

**After Match Acceptance:**
- Click "Open Chat" in Active Matches
- Opens full-screen chat modal
- Shows ride route and departure time
- Real-time message delivery via Socket.IO
- Messages appear instantly for both users
- Timestamps show "Just now", "5m ago", "2h ago", etc.
- Online status indicator (green dot)
- Smooth scrolling to latest message

## Technical Implementation

### Backend Routes

#### POST /api/matches
Creates a pending match request
```json
{
  "rideId": "ride-uuid"
}
```
**Response:**
- Match created with `status: "pending"`
- Emits `match_request_${creatorId}` to ride creator
- Emits `match_request_sent_${requesterId}` to requester

#### POST /api/matches/:id/accept
Accept a match request (creator only)
```json
{}
```
**Response:**
- Updates match to `status: "accepted"`
- Updates ride to `status: "matched"`
- Sets `acceptedAt` timestamp
- Emits `match_accepted_${userId}` to both users
- Emits `ride-status-updated` globally

#### POST /api/matches/:id/reject
Reject a match request (creator only)
```json
{}
```
**Response:**
- Updates match to `status: "rejected"`
- Emits `match_rejected_${requesterId}` to requester
- Ride remains available for others

#### GET /api/matches/my
Get user's matches (pending and accepted)
```json
{
  "matches": [
    {
      "id": "match-uuid",
      "status": "pending" | "accepted",
      "user1": { "id", "name", "college" },
      "user2": { "id", "name", "college" },
      "ride": { "origin", "destination", "departureTime" },
      "chatRoomId": "room-uuid"
    }
  ]
}
```

#### GET /api/matches/:id/messages
Get chat messages for a match
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Hello!",
      "senderId": "user-uuid",
      "sender": { "id", "name" },
      "createdAt": "2026-02-01T00:00:00.000Z",
      "read": true
    }
  ],
  "hasMore": false
}
```

#### POST /api/matches/:id/messages
Send a chat message
```json
{
  "content": "See you at 10 AM!"
}
```
**Response:**
- Creates message in database
- Emits `new_message_${chatRoomId}` to both users in real-time
- Emits `message_notification_${recipientId}` to recipient

### Socket.IO Events

#### Server → Client Events

1. **match_request_${userId}** (ride creator)
```json
{
  "match": { /* match object */ },
  "notification": {
    "type": "ride",
    "title": "📨 New Match Request!",
    "message": "John wants to join your ride"
  }
}
```

2. **match_request_sent_${userId}** (requester)
```json
{
  "notification": {
    "type": "success",
    "title": "⏳ Request Sent!",
    "message": "Wait for creator approval"
  }
}
```

3. **match_accepted_${userId}** (both users)
```json
{
  "match": { /* updated match with accepted status */ },
  "notification": {
    "type": "success",
    "title": "✅ Match Accepted!" | "🎉 Request Accepted!",
    "message": "You can now chat with your ride partner",
    "matchId": "match-uuid",
    "chatRoomId": "room-uuid"
  }
}
```

4. **match_rejected_${userId}** (requester)
```json
{
  "notification": {
    "type": "error",
    "title": "❌ Request Declined",
    "message": "Creator declined your request"
  }
}
```

5. **new_message_${chatRoomId}** (both users in chat)
```json
{
  "message": {
    "id": "msg-uuid",
    "content": "Hello!",
    "senderId": "user-uuid",
    "sender": { "id", "name" },
    "createdAt": "2026-02-01T00:00:00.000Z"
  },
  "matchId": "match-uuid",
  "chatRoomId": "room-uuid"
}
```

6. **message_notification_${userId}** (recipient)
```json
{
  "notification": {
    "type": "match",
    "title": "💬 New Message",
    "message": "John: Hello! See you...",
    "matchId": "match-uuid",
    "chatRoomId": "room-uuid"
  }
}
```

7. **ride-status-updated** (all users)
```json
{
  "rideId": "ride-uuid",
  "status": "matched"
}
```

### Frontend Components

#### ChatModal.jsx
- Full-screen modal overlay
- Real-time message updates via Socket.IO
- Auto-scroll to latest message
- Shows other user's avatar (first letter) and online status
- Displays ride details (route, departure time)
- Send message with Enter or Send button
- Message timestamps (relative time)
- Disabled state while sending
- Empty state for no messages

#### Dashboard.jsx Updates

**New State Variables:**
```javascript
const [pendingRequests, setPendingRequests] = useState([]); // Requests I need to accept/reject
const [activeChat, setActiveChat] = useState(null); // Currently open chat
const [matches, setMatches] = useState([]); // Accepted matches for chat
```

**New Socket.IO Listeners:**
- `match_request_${user.id}` - New requests for my rides
- `match_request_sent_${user.id}` - Confirmation when I request to join
- `match_accepted_${user.id}` - When match is accepted
- `match_rejected_${user.id}` - When match is rejected
- `message_notification_${user.id}` - New chat messages

**New Functions:**
```javascript
loadMatches() // Load pending requests and accepted matches
handleAcceptMatch(matchId) // Accept a match request
handleRejectMatch(matchId) // Reject a match request
handleOpenChat(match) // Open chat modal
```

**UI Sections:**

1. **Pending Match Requests** (Yellow theme)
   - Shows when I'm the ride creator
   - Lists users who want to join my ride
   - "Accept" (green) and "Reject" (red) buttons
   - Shows requester's name, college, ride details

2. **Active Matches** (Green theme)
   - Shows accepted matches
   - "Open Chat" button for each match
   - Shows matched user's name, college, ride details
   - "MATCHED" status badge

3. **My Created Rides** (Existing section)
   - Shows rides I've created
   - Status badges (pending/matched/completed)
   - Delete option for pending rides

### API Service Updates

**api.js additions:**
```javascript
matchesAPI: {
  createMatch(rideId) // Send join request
  acceptMatch(matchId) // Accept request
  rejectMatch(matchId) // Reject request
  getMyMatches() // Get all my matches
  getMessages(matchId) // Load chat history
  sendMessage(matchId, content) // Send chat message
}
```

## Database Schema

### Match Model
```prisma
model Match {
  id          String   @id @default(uuid())
  status      String   @default("pending") // pending/accepted/rejected
  acceptedAt  DateTime? // When match was accepted
  user1       User     @relation("creator")
  user2       User     @relation("requester")
  ride        Ride
  messages    Message[]
  chatRoomId  String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Message Model
```prisma
model Message {
  id        String   @id @default(uuid())
  content   String
  match     Match    @relation
  sender    User     @relation
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## User Experience Flow Diagram

```
User A (Creator)                        User B (Requester)
─────────────────                       ──────────────────

1. Creates Ride
   ↓ (status: pending)
                                    2. Sees Ride in Find Matches
                                       ↓
                                    3. Clicks "Join Ride"
                                       ↓ (Match created: pending)
                                       ↓
                                    4. Sees "⏳ Request Sent!"
   ↓
5. Receives "📨 New Match Request!"
   ↓
6. Goes to Dashboard → My Rides
   ↓
7. Sees Pending Request with
   Accept/Reject buttons
   ↓
8. Clicks "Accept"
   ↓ (Match status: accepted)
   ↓ (Ride status: matched)
   ↓
9. Sees "✅ Match Accepted!"       10. Sees "🎉 Request Accepted!"
   ↓                                   ↓
11. Match appears in                12. Match appears in
    "Active Matches"                    "Active Matches"
   ↓                                   ↓
13. Clicks "Open Chat"              14. Clicks "Open Chat"
   ↓                                   ↓
   ╔══════════════════════════════════════════╗
   ║        REAL-TIME CHAT SESSION             ║
   ║  Messages sync instantly via Socket.IO    ║
   ╚══════════════════════════════════════════╝
```

## Testing Checklist

### Request Flow
- [ ] Requester sees "Request Sent" notification
- [ ] Creator sees "New Match Request" notification
- [ ] Pending request appears in creator's Dashboard
- [ ] Request shows correct user details (name, college)
- [ ] Request shows correct ride details (route, time)

### Accept Flow
- [ ] Accept button works
- [ ] Both users see "Match Accepted" notification
- [ ] Match appears in "Active Matches" for both
- [ ] Ride status changes to "matched"
- [ ] Ride disappears from Find Matches for others
- [ ] Notification sound plays

### Reject Flow
- [ ] Reject button works
- [ ] Requester sees "Request Declined" notification
- [ ] Match disappears from both users' views
- [ ] Ride remains available for others
- [ ] Confirmation dialog appears before rejecting

### Chat Flow
- [ ] "Open Chat" button works
- [ ] Chat modal opens with correct user info
- [ ] Previous messages load correctly
- [ ] Can send text messages
- [ ] Messages appear instantly for both users
- [ ] Timestamps show correctly
- [ ] Empty state shows when no messages
- [ ] Close button works
- [ ] Auto-scroll to latest message
- [ ] Online indicator shows (green dot)

### Real-Time Updates
- [ ] Socket.IO connection established
- [ ] Match requests arrive in real-time
- [ ] Accept/reject notifications arrive in real-time
- [ ] Chat messages sync in real-time
- [ ] Ride status updates sync across users
- [ ] Notification badge counter updates

### Edge Cases
- [ ] Can't accept own match request
- [ ] Can't accept already accepted match
- [ ] Can't chat with pending match
- [ ] Can't send empty messages
- [ ] Multiple pending requests show correctly
- [ ] Page refresh preserves match state
- [ ] Socket reconnects after disconnect

## Troubleshooting

### Match Request Not Received
1. Check Socket.IO connection in browser console
2. Verify user IDs match in event names
3. Check backend logs for event emission
4. Ensure frontend is listening on correct event

### Chat Messages Not Syncing
1. Check chatRoomId is same for both users
2. Verify Socket.IO connection active
3. Check match status is "accepted"
4. Look for errors in browser/server console

### Notifications Not Showing
1. Check notification permissions (browser)
2. Verify audio file path (/notification.mp3)
3. Check notifications array state
4. Verify notification sound plays in console

### Database Out of Sync
1. Run `npx prisma db push` in backend
2. Check Match model has acceptedAt field
3. Verify default status is "pending"
4. Check Message model exists

## Performance Considerations

- Messages paginated (20 at a time)
- Socket.IO rooms prevent message spam
- Auto-reconnection on disconnect
- Debounced message sending
- Efficient state updates (no unnecessary re-renders)
- Lazy loading of chat history

## Security

- JWT authentication required for all endpoints
- Users can only accept/reject their own ride's requests
- Users can only chat in accepted matches
- Message content sanitized
- Rate limiting on API endpoints
- Socket.IO authentication middleware

## Future Enhancements

1. **Read Receipts** - Show when messages are read
2. **Typing Indicators** - "John is typing..."
3. **Image Sharing** - Send photos in chat
4. **Voice Messages** - Record and send audio
5. **Location Sharing** - Share live location
6. **Group Chats** - Multiple users per ride
7. **Push Notifications** - Mobile notifications
8. **Message Reactions** - 👍 👎 ❤️
9. **Chat History Search** - Search old messages
10. **Ride Ratings** - Rate user after ride completes

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/matches | Create match request | ✅ |
| POST | /api/matches/:id/accept | Accept request | ✅ |
| POST | /api/matches/:id/reject | Reject request | ✅ |
| GET | /api/matches/my | Get user's matches | ✅ |
| GET | /api/matches/:id/messages | Load chat history | ✅ |
| POST | /api/matches/:id/messages | Send message | ✅ |
| GET | /api/rides/available | Find available rides | ✅ |
| POST | /api/rides | Create ride | ✅ |
| GET | /api/rides/my | Get my rides | ✅ |

---

**Last Updated:** February 1, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready
