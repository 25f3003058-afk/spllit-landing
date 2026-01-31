#!/bin/bash

# Socket.IO Event Testing Script
# This script tests all Socket.IO events to ensure real-time notifications work

API_URL="https://ankit-production-f3d4.up.railway.app"
ADMIN_EMAIL="ankit@spllit.app"
ADMIN_PASSWORD="Kurkure123@"

echo "🚀 Testing Socket.IO Events for Spllit Admin Dashboard"
echo "=================================================="
echo ""

# 1. Admin Login
echo "1️⃣  Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }" | jq -r '.tokens.accessToken')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Admin login failed. Please check credentials."
  exit 1
fi

echo "✅ Admin logged in successfully"
echo ""

# 2. Create Test User (triggers new-user-registered event)
echo "2️⃣  Creating test user (should trigger notification)..."
TEST_EMAIL="testuser_$(date +%s)@example.com"
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"9999999999\",
    \"password\": \"Test123@\",
    \"college\": \"IIT Delhi\",
    \"gender\": \"male\"
  }")

USER_TOKEN=$(echo "$USER_RESPONSE" | jq -r '.tokens.accessToken')
USER_NAME=$(echo "$USER_RESPONSE" | jq -r '.user.name')

if [ "$USER_TOKEN" == "null" ] || [ -z "$USER_TOKEN" ]; then
  echo "❌ User registration failed"
  echo "Response: $USER_RESPONSE"
else
  echo "✅ User registered: $USER_NAME"
  echo "   → Should see notification: 'New User Registered'"
fi
echo ""
sleep 2

# 3. Create Test Ride (triggers new-ride-created event)
echo "3️⃣  Creating test ride (should trigger notification)..."
DEPARTURE_TIME=$(date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%SZ")
RIDE_RESPONSE=$(curl -s -X POST "$API_URL/api/rides" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"origin\": \"IIT Delhi\",
    \"originLat\": 28.5449,
    \"originLng\": 77.1926,
    \"destination\": \"Connaught Place\",
    \"destLat\": 28.6315,
    \"destLng\": 77.2167,
    \"departureTime\": \"$DEPARTURE_TIME\",
    \"vehicleType\": \"cab\",
    \"seats\": 2,
    \"fare\": 150
  }")

RIDE_ID=$(echo "$RIDE_RESPONSE" | jq -r '.ride.id')

if [ "$RIDE_ID" == "null" ] || [ -z "$RIDE_ID" ]; then
  echo "❌ Ride creation failed"
  echo "Response: $RIDE_RESPONSE"
else
  echo "✅ Ride created: IIT Delhi → Connaught Place (₹150)"
  echo "   → Should see notification: 'New Ride Created'"
fi
echo ""
sleep 2

# 4. Create Second User for Match
echo "4️⃣  Creating second user for match test..."
TEST_EMAIL_2="testuser2_$(date +%s)@example.com"
USER2_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User 2\",
    \"email\": \"$TEST_EMAIL_2\",
    \"phone\": \"8888888888\",
    \"password\": \"Test123@\",
    \"college\": \"IIT Delhi\",
    \"gender\": \"female\"
  }")

USER2_TOKEN=$(echo "$USER2_RESPONSE" | jq -r '.tokens.accessToken')
USER2_NAME=$(echo "$USER2_RESPONSE" | jq -r '.user.name')

if [ "$USER2_TOKEN" == "null" ] || [ -z "$USER2_TOKEN" ]; then
  echo "❌ Second user registration failed"
else
  echo "✅ Second user registered: $USER2_NAME"
fi
echo ""
sleep 2

# 5. Create Match (triggers new-match-created event)
if [ ! -z "$RIDE_ID" ] && [ "$RIDE_ID" != "null" ] && [ ! -z "$USER2_TOKEN" ]; then
  echo "5️⃣  Creating match (should trigger notification)..."
  MATCH_RESPONSE=$(curl -s -X POST "$API_URL/api/matches" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER2_TOKEN" \
    -d "{
      \"rideId\": \"$RIDE_ID\"
    }")

  MATCH_ID=$(echo "$MATCH_RESPONSE" | jq -r '.match.id')

  if [ "$MATCH_ID" == "null" ] || [ -z "$MATCH_ID" ]; then
    echo "❌ Match creation failed"
    echo "Response: $MATCH_RESPONSE"
  else
    echo "✅ Match created successfully"
    echo "   → Should see notification: 'New Match Created'"
    echo "   → Total: ₹150 | Split: ₹75 each"
  fi
  echo ""
fi
sleep 2

# 6. Create Emergency SOS (triggers emergency-sos event)
echo "6️⃣  Creating emergency SOS (should trigger URGENT notification)..."
EMERGENCY_RESPONSE=$(curl -s -X POST "$API_URL/api/emergency/sos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"location\": {
      \"lat\": 28.5449,
      \"lng\": 77.1926
    },
    \"message\": \"Test emergency - please ignore\",
    \"emergencyType\": \"other\"
  }")

EMERGENCY_ID=$(echo "$EMERGENCY_RESPONSE" | jq -r '.emergency.id')

if [ "$EMERGENCY_ID" == "null" ] || [ -z "$EMERGENCY_ID" ]; then
  echo "❌ Emergency SOS failed"
  echo "Response: $EMERGENCY_RESPONSE"
else
  echo "✅ Emergency SOS created"
  echo "   → Should see RED notification: '🚨 EMERGENCY SOS'"
  echo "   → Should hear audio alert"
  echo "   → Emergency ID: $EMERGENCY_ID"
fi
echo ""

# Summary
echo "=================================================="
echo "✨ Testing Complete!"
echo ""
echo "📊 What to check in Admin Dashboard:"
echo "   1. New User notification (blue icon)"
echo "   2. New Ride notification (green icon)"
echo "   3. New User notification for second user (blue icon)"
echo "   4. New Match notification (purple icon)"
echo "   5. Emergency SOS notification (red icon + audio)"
echo ""
echo "🔔 Notification Bell should show count"
echo "📈 Stats should update with new data"
echo "🚨 Emergency tab should list active emergency"
echo "🟢 User table should show green dot for active users"
echo ""
echo "Admin Dashboard URL: https://spllit.app/admin/dashboard"
echo "=================================================="
