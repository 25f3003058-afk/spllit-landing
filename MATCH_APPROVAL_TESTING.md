# Match Request/Approval Workflow Testing Guide

## Overview
This guide explains how to test the complete match request, approval, and real-time chat workflow.

## Features Implemented

### 1. Match Request System
- ✅ Users can request to join rides
- ✅ Requests show as "pending" status
- ✅ Ride creator receives real-time notification
- ✅ Requester sees "waiting for approval" status

### 2. Accept/Reject Functionality
- ✅ Ride creator can accept or reject match requests
- ✅ Real-time notifications sent to both users
- ✅ Accepted matches enable chat functionality
- ✅ Rejected requests remove from pending list

### 3. Real-Time Chat
- ✅ Chat available only after match acceptance
- ✅ Messages sent via Socket.IO for instant delivery
- ✅ Message history persisted in database
- ✅ Chat UI with message timestamps
- ✅ Notification for new messages

## Testing Steps

### Prerequisites
- Two user accounts (test on different devices/browsers)
- Backend: https://ankit-production-f3d4.up.railway.app
- Frontend: https://spllit.app

### Account Setup
**User A (Ride Creator):**
- Email: ankit@spllit.app
- Password: Kurkure123@

**User B (Requester):**
- Create a new account at https://spllit.app/signup

### Test Scenario 1: Match Request Flow

1. **User A Creates a Ride:**
   - Login to https://spllit.app with User A credentials
   - Click "Create Ride"
   - Fill in ride details:
     - Origin: IIT Madras
     - Destination: Chennai Airport
     - Date/Time: Select future time
     - Seats: 2-3
     - Fare: 100-200
   - Click "Create Ride & Find Matches"

2. **User B Sees Available Ride:**
   - Login on different browser/device with User B
   - Click "Find Matches"
   - Should see User A's ride in the list
   - Click "Join Ride" button
   - Should see success notification: "⏳ Request Sent!"

3. **User A Receives Request:**
   - User A should see:
     - Real-time notification: "📨 New Match Request!"
     - Notification sound plays
     - Bell icon shows badge with count
   - Click "My Rides"
   - See "Pending Match Requests" section
   - Shows User B's details with Accept/Reject buttons

### Test Scenario 2: Accept Match & Chat

4. **User A Accepts Request:**
   - In "Pending Match Requests" section
   - Click "Accept" button on User B's request
   - Should see notification: "✅ Match Accepted!"
   - Request moves to "Active Matches" section
   - "Chat Now" button appears

5. **User B Gets Acceptance:**
   - User B sees notification: "🎉 Request Accepted!"
   - Click "My Rides"
   - See "Active Matches" section
   - "Chat Now" button available

6. **Test Real-Time Chat:**
   - User A clicks "Chat Now"
   - Chat modal opens
   - Send message: "Hi, ready for the ride?"
   - User B receives notification: "💬 New Message"
   - User B clicks "Chat Now"
   - Both can see messages in real-time
   - Messages show timestamps
   - Scroll to bottom automatically

### Test Scenario 3: Reject Match

7. **Create New Match Request:**
   - User B requests another ride from User A
   - User A receives notification

8. **User A Rejects Request:**
   - Click "Reject" button
   - Confirm rejection
   - Should see notification: "Request Rejected"
   - Request removed from pending list

9. **User B Gets Rejection:**
   - Receives notification: "❌ Request Declined"
   - No chat available

## Socket.IO Events Verification

### Events Emitted by Backend:

1. **match_request_${creatorId}**
   - Sent when: User requests to join ride
   - Payload: match object, notification
   - Recipient: Ride creator

2. **match_request_sent_${requesterId}**
   - Sent when: Match request created
   - Payload: notification with waiting message
   - Recipient: Requester

3. **match_accepted_${userId}**
   - Sent when: Match request accepted
   - Payload: match object, notification, chatRoomId
   - Recipient: Both users (separate events)

4. **match_rejected_${userId}**
   - Sent when: Match request rejected
   - Payload: notification
   - Recipient: Requester only

5. **new_message_${chatRoomId}**
   - Sent when: Message sent in chat
   - Payload: message object, matchId, chatRoomId
   - Recipient: All users in chat room

6. **message_notification_${recipientId}**
   - Sent when: New message received
   - Payload: notification with message preview
   - Recipient: Message recipient

## API Endpoints Testing

### Test with curl:

```bash
# Login as User A
TOKEN=$(curl -X POST https://ankit-production-f3d4.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankit@spllit.app","password":"Kurkure123@"}' | jq -r '.accessToken')

# Get my matches
curl -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/my

# Accept match (replace MATCH_ID)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/accept

# Reject match (replace MATCH_ID)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/reject

# Send message (replace MATCH_ID)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}' \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/messages

# Get messages (replace MATCH_ID)
curl -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/messages
```

## Expected UI States

### Dashboard "My Rides" Modal Sections:

1. **Pending Match Requests** (Yellow theme)
   - Shows only if user is ride creator
   - Shows only pending requests
   - Accept/Reject buttons visible
   - Shows requester's name, college, route

2. **Active Matches** (Green theme)
   - Shows accepted matches for all users
   - "Chat Now" button available
   - Shows partner's name, college, route
   - Available for both creator and requester

3. **My Created Rides** (Default theme)
   - Shows all rides created by user
   - Status badge: pending/matched/completed
   - Delete button for pending rides

## Database Verification

Check match status in database:

```sql
-- View all matches
SELECT m.id, m.status, m."acceptedAt",
       u1.name as creator, u2.name as requester,
       r."startLocation", r."endLocation"
FROM "Match" m
JOIN "User" u1 ON m."user1Id" = u1.id
JOIN "User" u2 ON m."user2Id" = u2.id
JOIN "Ride" r ON m."rideId" = r.id
ORDER BY m."createdAt" DESC;

-- View messages
SELECT m.content, u.name as sender,
       m."createdAt", m.read
FROM "Message" m
JOIN "User" u ON m."senderId" = u.id
ORDER BY m."createdAt" DESC
LIMIT 20;
```

## Troubleshooting

### No Real-Time Notifications
- Check browser console for Socket.IO connection
- Verify: "Socket.IO connected successfully" message
- Check Network tab for WebSocket connection
- Ensure both users are logged in

### Messages Not Appearing
- Check match status is 'accepted' (not 'pending')
- Verify chatRoomId exists in match
- Check browser console for errors
- Ensure Socket.IO is connected

### Match Request Not Showing
- Verify ride status is 'pending' (not 'matched')
- Check user is not trying to join own ride
- Verify ride has available seats
- Check GET /api/rides/available endpoint

### Accept/Reject Not Working
- Verify user is the ride creator (user1Id)
- Check match status is 'pending'
- Look for error messages in notifications
- Check browser console and network tab

## Success Criteria

✅ **Match Request Flow:**
- Requester sees instant feedback
- Creator gets real-time notification
- Both see appropriate status indicators

✅ **Accept/Reject:**
- Works instantly without page refresh
- Both users get notifications
- UI updates automatically

✅ **Real-Time Chat:**
- Messages appear instantly
- No page refresh needed
- Message history loads correctly
- Timestamps display properly

✅ **Notification System:**
- Toast notifications show for all events
- Bell icon updates badge count
- Sound plays for important events
- Notifications auto-dismiss after 5s

## Performance Checks

- Page load time: < 2 seconds
- Socket.IO connection: < 1 second
- Message delivery: < 500ms
- Notification display: Instant
- Chat history load: < 1 second

## Browser Compatibility

Tested on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Known Limitations

1. **Chat History:** Currently loads all messages (pagination to be added)
2. **Online Status:** Shows green dot but doesn't update in real-time
3. **Typing Indicators:** Not implemented yet
4. **Read Receipts:** Messages marked as read but no UI indicator
5. **File Sharing:** Not supported yet

## Next Steps

Potential enhancements:
1. Add typing indicators in chat
2. Show online/offline status in real-time
3. Add message read receipts UI
4. Support file/image sharing
5. Add chat search functionality
6. Implement message reactions
7. Add chat message editing/deletion
8. Support voice messages
9. Add chat history pagination
10. Implement push notifications for mobile

## Support

For issues or questions:
- GitHub: https://github.com/25f3003058-afk/spllit-landing
- Email: ankit@spllit.app
