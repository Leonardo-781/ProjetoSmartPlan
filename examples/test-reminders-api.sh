#!/bin/bash

# Test script for Reminders API
# This script demonstrates how to use the reminders API endpoints
# 
# Prerequisites:
# 1. Server must be running (npm run dev)
# 2. User must be logged in (obtain session cookie from browser or login endpoint)
# 
# Usage:
#   1. Export your session cookie: export SESSION_COOKIE="connect.sid=your_session_id"
#   2. Run: bash examples/test-reminders-api.sh

BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE="${SESSION_COOKIE:-}"

if [ -z "$COOKIE" ]; then
  echo "⚠️  Warning: SESSION_COOKIE not set. Requests will fail without authentication."
  echo "   To test: export SESSION_COOKIE='connect.sid=your_session_id'"
  echo ""
fi

echo "🧪 Testing Reminders API"
echo "========================"
echo ""

# Test 1: Create a reminder
echo "1️⃣  Creating a reminder..."
REMINDER_DATA='{
  "title": "Prova de Cálculo II",
  "description": "Capítulos 1-5: Integrais e Derivadas",
  "type": "exam_assignment",
  "dueAt": "2024-12-20T10:00:00.000Z",
  "remindBeforeMinutes": 60,
  "repeat": "none"
}'

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/reminders" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d "$REMINDER_DATA")

echo "Response: $CREATE_RESPONSE"
REMINDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created reminder ID: $REMINDER_ID"
echo ""

# Test 2: List reminders
echo "2️⃣  Listing all reminders..."
curl -s -X GET "$BASE_URL/api/reminders" \
  -H "Cookie: $COOKIE" | head -200
echo ""
echo ""

# Test 3: Get specific reminder
if [ -n "$REMINDER_ID" ]; then
  echo "3️⃣  Getting reminder by ID..."
  curl -s -X GET "$BASE_URL/api/reminders/$REMINDER_ID" \
    -H "Cookie: $COOKIE"
  echo ""
  echo ""
fi

# Test 4: Update reminder
if [ -n "$REMINDER_ID" ]; then
  echo "4️⃣  Updating reminder..."
  UPDATE_DATA='{
    "title": "Prova de Cálculo II - ATUALIZADO",
    "remindBeforeMinutes": 120
  }'
  
  curl -s -X PUT "$BASE_URL/api/reminders/$REMINDER_ID" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" \
    -d "$UPDATE_DATA"
  echo ""
  echo ""
fi

# Test 5: Export as .ics
if [ -n "$REMINDER_ID" ]; then
  echo "5️⃣  Exporting reminder as .ics..."
  curl -s -X GET "$BASE_URL/api/reminders/$REMINDER_ID/export.ics" \
    -H "Cookie: $COOKIE" \
    -o "/tmp/reminder-$REMINDER_ID.ics"
  
  if [ -f "/tmp/reminder-$REMINDER_ID.ics" ]; then
    echo "✅ File exported to /tmp/reminder-$REMINDER_ID.ics"
    echo "Content preview:"
    head -20 "/tmp/reminder-$REMINDER_ID.ics"
  else
    echo "❌ Export failed"
  fi
  echo ""
fi

# Test 6: List with filters
echo "6️⃣  Listing reminders with type filter..."
curl -s -X GET "$BASE_URL/api/reminders?type=exam_assignment" \
  -H "Cookie: $COOKIE" | head -200
echo ""
echo ""

# Test 7: Dispatch reminders
echo "7️⃣  Dispatching reminders (manual trigger)..."
curl -s -X POST "$BASE_URL/api/reminders/dispatch" \
  -H "Cookie: $COOKIE"
echo ""
echo ""

# Test 8: Delete reminder
if [ -n "$REMINDER_ID" ]; then
  echo "8️⃣  Deleting reminder..."
  curl -s -X DELETE "$BASE_URL/api/reminders/$REMINDER_ID" \
    -H "Cookie: $COOKIE"
  echo ""
  echo ""
fi

echo "✅ Tests completed!"
echo ""
echo "📝 Notes:"
echo "   - If you see 401 Unauthorized, you need to set SESSION_COOKIE"
echo "   - To get a session cookie, login via the web UI and inspect cookies"
echo "   - Check server logs for dispatcher output"
