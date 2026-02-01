# Quick Testing Reference Card

## 🚀 Quick Start

### URLs
- **Frontend**: https://spllit.app
- **Backend API**: https://ankit-production-f3d4.up.railway.app/api
- **Health Check**: https://ankit-production-f3d4.up.railway.app/health

### Test Accounts
**User A (Ride Creator)**
- Email: `ankit@spllit.app`
- Password: `Kurkure123@`

**User B (Requester)**
- Sign up at: https://spllit.app/signup

---

## ⚡ 5-Minute Test Flow

### 1️⃣ User A: Create Ride (2 min)
```
Login → Click "Create Ride" → Fill details:
  Origin: IIT Madras
  Destination: Chennai Airport
  Date/Time: Future time
  Seats: 2-3
  Fare: ₹100-200
→ Click "Create Ride"
```

### 2️⃣ User B: Request to Join (1 min)
```
Login (different browser) → Click "Find Matches"
→ See User A's ride → Click "Join Ride"
✅ Notification: "⏳ Request Sent!"
```

### 3️⃣ User A: Accept Request (1 min)
```
Check notification: "📨 New Match Request!"
→ Click "My Rides" → See yellow "Pending Requests" section
→ Click "Accept" button
✅ Notification: "✅ Match Accepted!"
```

### 4️⃣ Both Users: Start Chat (1 min)
```
Click "My Rides" → See green "Active Matches" section
→ Click "Chat Now" → Send messages
✅ Messages appear instantly
```

---

## 🎯 What to Verify

### ✅ Notifications (Real-time)
- [ ] User A gets "📨 New Match Request!" when User B joins
- [ ] User B gets "⏳ Request Sent!" after clicking Join
- [ ] Both get acceptance notifications (✅/🎉)
- [ ] Sound plays for notifications
- [ ] Bell icon shows badge count

### ✅ My Rides Modal (UI)
- [ ] **Pending Requests** section (yellow) shows for creator
- [ ] Accept/Reject buttons work
- [ ] **Active Matches** section (green) shows for both
- [ ] "Chat Now" button appears after acceptance
- [ ] Status updates without page refresh

### ✅ Real-Time Chat
- [ ] Chat modal opens
- [ ] Messages send/receive instantly
- [ ] Timestamps display correctly
- [ ] Auto-scroll to bottom
- [ ] Partner's name and route shown in header

### ✅ Socket.IO Connection
- [ ] Browser console shows: "Socket.IO connected successfully"
- [ ] No connection errors
- [ ] Events received in real-time

---

## 🔧 API Testing (Optional)

### Get Auth Token
```bash
TOKEN=$(curl -X POST https://ankit-production-f3d4.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankit@spllit.app","password":"Kurkure123@"}' \
  | jq -r '.accessToken')
```

### Get My Matches
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/my \
  | jq .
```

### Accept Match
```bash
# Replace MATCH_ID with actual ID
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/accept \
  | jq .
```

### Send Message
```bash
# Replace MATCH_ID
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from API!"}' \
  https://ankit-production-f3d4.up.railway.app/api/matches/MATCH_ID/messages \
  | jq .
```

---

## 🐛 Troubleshooting

### No Real-Time Updates?
1. Check browser console for Socket.IO connection
2. Verify: Network tab shows WebSocket connection (ws://)
3. Look for "Socket.IO connected successfully" message
4. Try refreshing the page

### Can't See Pending Requests?
1. Verify you're logged in as ride creator
2. Check match status is 'pending' (not 'accepted')
3. Refresh "My Rides" modal
4. Check browser console for errors

### Chat Not Working?
1. Ensure match is accepted (green section, not yellow)
2. Verify Socket.IO is connected
3. Check browser console for errors
4. Try sending a test message

### Messages Not Appearing?
1. Check match status is 'accepted'
2. Verify chatRoomId exists in match
3. Look for Socket.IO events in console
4. Refresh chat modal

---

## 📊 Browser Console Checks

### Expected Console Logs
```
Socket.IO connected successfully
Match request event received: {...}
Match accepted event: {...}
Message notification: {...}
```

### Socket.IO Events to Watch
```javascript
// Ride creator
match_request_${userId}

// Requester  
match_request_sent_${userId}

// Both users
match_accepted_${userId}
new_message_${chatRoomId}
message_notification_${userId}
```

---

## 📱 Mobile Testing

### iOS Safari
- Test notifications
- Test chat scroll
- Test keyboard behavior

### Android Chrome
- Test Socket.IO connection
- Test real-time updates
- Test chat interface

---

## ✅ Success Indicators

All working correctly if you see:

1. ✅ Real-time notifications appear instantly
2. ✅ No page refresh needed for any action
3. ✅ Chat messages sync in < 500ms
4. ✅ Bell icon updates badge count
5. ✅ UI sections update automatically
6. ✅ No errors in browser console
7. ✅ Sound plays for notifications
8. ✅ Timestamps display correctly
9. ✅ Socket.IO stays connected
10. ✅ All buttons respond immediately

---

## 📞 Support

**Issues?** Check:
1. [MATCH_APPROVAL_TESTING.md](MATCH_APPROVAL_TESTING.md) - Detailed testing guide
2. [MATCH_APPROVAL_SUMMARY.md](MATCH_APPROVAL_SUMMARY.md) - Technical details
3. Browser console for errors
4. Network tab for API/WebSocket issues

**Still stuck?** Open an issue on GitHub or email ankit@spllit.app

---

**Last Updated**: February 1, 2026  
**Status**: ✅ All Features Deployed
