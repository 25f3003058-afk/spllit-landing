# Quick Testing Guide - Match Request Workflow

## Test Scenario: Two Users (Creator & Requester)

### Setup
- **User A (Creator):** ankit@spllit.app / Kurkure123@
- **User B (Requester):** Use another test account
- **Two Browser Windows/Tabs:** One for each user

---

## Step-by-Step Test

### 1. User A: Create a Ride ✅
```
1. Login as User A (ankit@spllit.app)
2. Click "Create Ride"
3. Fill in:
   - Origin: "IIT Madras"
   - Destination: "Chennai Airport"
   - Date/Time: Tomorrow 10:00 AM
   - Vehicle: Cab
   - Seats: 2
   - Fare: ₹200
4. Click "Create Ride & Find Matches"
5. ✅ Should see success message
6. ✅ Ride appears in Dashboard
```

**Expected Results:**
- Success notification appears
- Ride created with status "pending"
- Socket.IO logs: "new-ride-created" event emitted

---

### 2. User B: Find and Request to Join ⏳
```
1. Login as User B in another window
2. Click "Find Matches"
3. ✅ Should see User A's ride
4. Click "Join Ride" button
5. ✅ Should see "⏳ Request Sent!" notification
```

**Expected Results:**
- User B sees toast: "⏳ Request Sent! Wait for approval"
- Ride disappears from User B's Find Matches
- User A receives notification: "📨 New Match Request!"
- Notification sound plays (if audio enabled)

**Check in Console:**
```
User A logs: "Socket.IO event: match_request_${userId}"
User B logs: "Socket.IO event: match_request_sent_${userId}"
```

---

### 3. User A: View Pending Request 📋
```
1. As User A, click "My Rides" in Dashboard
2. ✅ Should see "Pending Match Requests" section
3. ✅ Request shows:
   - User B's name and college
   - Ride route and time
   - Yellow "PENDING" badge
   - "Accept" (green) button
   - "Reject" (red) button
```

**Expected UI:**
```
┌─────────────────────────────────────────┐
│ 📋 1 Pending Match Requests             │
├─────────────────────────────────────────┤
│ [B] User B                              │
│     IIT Madras                          │
│                                         │
│ 🗺️ IIT Madras → Chennai Airport       │
│ 🕐 Feb 2, 10:00 AM                     │
│                                         │
│ [✅ Accept]  [❌ Reject]               │
└─────────────────────────────────────────┘
```

---

### 4. User A: Accept Request ✅
```
1. As User A, click "Accept" button
2. ✅ Request moves to "Active Matches" section
3. ✅ "Open Chat" button appears
4. ✅ Both users get "Match Accepted!" notification
```

**Expected Results:**

**User A sees:**
- Toast: "✅ Match Accepted! You can now chat with your ride partner"
- Match appears in green "Active Matches" section
- "Open Chat" button available
- Notification sound plays

**User B sees:**
- Toast: "🎉 Request Accepted! Start chatting now"
- Match appears in "Active Matches" in Dashboard
- "Open Chat" button available
- Notification sound plays

**Database Changes:**
- Match status: `pending` → `accepted`
- Match `acceptedAt`: timestamp set
- Ride status: `pending` → `matched`

**Socket.IO Events:**
```javascript
// Both users receive:
match_accepted_${userId}: {
  match: { status: "accepted", ... },
  notification: { title, message, matchId, chatRoomId }
}

// All users receive:
ride-status-updated: {
  rideId: "...",
  status: "matched"
}
```

---

### 5. User A & B: Open Chat 💬
```
1. As User A, click "Open Chat"
2. ✅ Chat modal opens
3. ✅ Shows User B's name, college
4. ✅ Shows ride route and time
5. ✅ Green online indicator visible
6. Type message: "Hello! See you at 10 AM"
7. Click Send or press Enter
8. ✅ Message appears immediately
```

**User B:**
```
1. In User B's window, click "Open Chat"
2. ✅ Chat modal opens
3. ✅ Sees User A's message instantly
4. ✅ Timestamp shows "Just now"
5. Type reply: "Great! I'll be ready"
6. ✅ User A sees message instantly
```

**Expected Chat UI:**
```
┌─────────────────────────────────────────┐
│ [A] User A                        [×]   │
│     IIT Madras                          │
├─────────────────────────────────────────┤
│ 🗺️ IIT Madras → Chennai Airport       │
│ 📅 Feb 2, 10:00 AM                     │
├─────────────────────────────────────────┤
│                                         │
│     ┌─────────────────────────┐        │
│     │ Hello! See you at 10 AM │ User A │
│     │ Just now                │        │
│     └─────────────────────────┘        │
│                                         │
│ User B ┌─────────────────┐             │
│        │ Great! I'll be  │             │
│        │ ready           │             │
│        │ Just now        │             │
│        └─────────────────┘             │
│                                         │
├─────────────────────────────────────────┤
│ [Type a message...] [📤 Send]         │
└─────────────────────────────────────────┘
```

**Socket.IO Events:**
```javascript
// Both users in chat receive:
new_message_${chatRoomId}: {
  message: {
    content: "Hello! See you at 10 AM",
    sender: { id, name },
    createdAt: "2026-02-01T..."
  },
  matchId: "...",
  chatRoomId: "..."
}

// Recipient gets notification (if chat closed):
message_notification_${userId}: {
  notification: {
    title: "💬 New Message",
    message: "User A: Hello! See you..."
  }
}
```

---

## Test Case: Reject Request ❌

### Alternative Flow for Step 4:
```
1. As User A, click "Reject" button
2. ✅ Confirmation dialog appears
3. Click "OK" to confirm
4. ✅ Request disappears from list
5. ✅ User B receives "❌ Request Declined" notification
```

**Expected Results:**

**User A:**
- Request removed from Pending section
- Toast: "Request Rejected"

**User B:**
- Toast: "❌ Request Declined - Creator declined your request"
- Match disappears from Dashboard
- Can request to join other rides

**Database:**
- Match status: `pending` → `rejected`
- Ride remains: `status: "pending"` (available for others)

**Socket.IO:**
```javascript
// User B receives:
match_rejected_${userId}: {
  notification: {
    type: "error",
    title: "❌ Request Declined",
    message: "Creator declined your request"
  }
}
```

---

## Real-Time Tests

### Test 1: Simultaneous Actions
```
1. User A and User B both logged in
2. User C requests to join User A's ride
3. ✅ User A sees request appear without refresh
4. ✅ Notification sound plays
5. ✅ Notification badge updates
```

### Test 2: Chat Message Delivery
```
1. User A types message in chat
2. ✅ Message appears in User A's chat immediately
3. ✅ Message appears in User B's chat < 500ms
4. ✅ No page refresh needed
5. Close chat, send message
6. ✅ User B gets notification with message preview
```

### Test 3: Multiple Pending Requests
```
1. User A creates ride with 3 seats
2. User B, User C, User D all request to join
3. ✅ User A sees 3 pending requests
4. ✅ Each has unique data (names, colleges)
5. User A accepts User B
6. ✅ User A can still accept User C or D
7. ✅ Ride status remains "pending" until all seats filled
```

### Test 4: Connection Recovery
```
1. User A in chat with User B
2. Turn off WiFi for 5 seconds
3. Turn WiFi back on
4. ✅ Socket.IO reconnects automatically
5. Send message
6. ✅ Message delivers successfully
7. Check console: "Socket.IO reconnected"
```

---

## Verification Checklist

### Backend ✅
- [ ] POST /api/matches creates pending match
- [ ] POST /api/matches/:id/accept works
- [ ] POST /api/matches/:id/reject works
- [ ] GET /api/matches/my returns pending & accepted
- [ ] GET /api/matches/:id/messages loads history
- [ ] POST /api/matches/:id/messages sends message
- [ ] Socket.IO events emit correctly
- [ ] Database updates correctly
- [ ] Only ride creator can accept/reject
- [ ] Only accepted matches can chat

### Frontend ✅
- [ ] Match request creates pending status
- [ ] Notifications appear with correct icons
- [ ] Notification sound plays
- [ ] Pending requests section shows
- [ ] Accept/Reject buttons work
- [ ] Active matches section shows
- [ ] Chat modal opens
- [ ] Messages send and receive
- [ ] Real-time updates work
- [ ] UI updates without refresh

### Socket.IO ✅
- [ ] Connection establishes on login
- [ ] match_request events received
- [ ] match_accepted events received
- [ ] match_rejected events received
- [ ] new_message events received
- [ ] message_notification events received
- [ ] ride-status-updated events received
- [ ] Auto-reconnect after disconnect
- [ ] Console logs show events

### Database ✅
- [ ] Match model has pending/accepted/rejected
- [ ] Match has acceptedAt field
- [ ] Message model exists
- [ ] Messages linked to matches
- [ ] chatRoomId unique per match
- [ ] Timestamps set correctly

---

## Browser Console Commands

### Check Socket.IO Connection
```javascript
console.log('Socket connected:', window.socket?.connected);
```

### Listen for Events (Debug)
```javascript
socket.on('match_request_YOUR_USER_ID', (data) => {
  console.log('Match request received:', data);
});

socket.on('match_accepted_YOUR_USER_ID', (data) => {
  console.log('Match accepted:', data);
});

socket.on('new_message_CHAT_ROOM_ID', (data) => {
  console.log('New message:', data);
});
```

### Check Local State
```javascript
// In Dashboard component
console.log('Pending requests:', pendingRequests);
console.log('Active matches:', matches);
console.log('Notifications:', notifications);
```

---

## Common Issues & Solutions

### Issue: Match request not appearing
**Solution:**
1. Check Socket.IO connection in console
2. Verify user ID matches in event name
3. Refresh browser and try again
4. Check backend logs for event emission

### Issue: Chat messages not syncing
**Solution:**
1. Ensure match status is "accepted"
2. Verify chatRoomId is same for both users
3. Check Socket.IO connection active
4. Look for errors in browser console

### Issue: Notifications not showing
**Solution:**
1. Check browser notification permissions
2. Verify notification sound file exists
3. Check notifications array state
4. Try different browser

### Issue: "Failed to accept match"
**Solution:**
1. Ensure you're the ride creator
2. Verify match is still "pending"
3. Check backend logs for error
4. Try refreshing and accepting again

---

## Test URLs

- **Frontend:** https://spllit.app
- **Backend:** https://ankit-production-f3d4.up.railway.app
- **Health Check:** https://ankit-production-f3d4.up.railway.app/health

## Test Accounts

- **User A:** ankit@spllit.app / Kurkure123@
- **User B:** Create new account or use test account

---

## Success Criteria

✅ **Request Flow**
- Requester sees "Request Sent" notification
- Creator sees "New Match Request" notification
- Request appears in creator's Dashboard immediately

✅ **Accept Flow**
- Both users see "Match Accepted" notification
- Match moves to Active Matches
- Chat becomes available
- Real-time updates without refresh

✅ **Chat Flow**
- Messages deliver instantly (< 500ms)
- Timestamps show correctly
- Both users can send/receive
- Chat history persists
- Notifications for new messages

✅ **Real-Time**
- Socket.IO connects on login
- All events arrive in real-time
- Auto-reconnect works
- No manual refresh needed

---

**Happy Testing! 🚀**

If you encounter any issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs on Railway
4. Socket.IO connection status
5. Database schema sync
