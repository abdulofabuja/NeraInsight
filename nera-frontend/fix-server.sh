#!/data/data/com.termux/files/usr/bin/bash

PORT=5000

echo "🔍 Checking if port $PORT is in use..."

# Use netstat to find process on port 5000 and extract PID
PID=$(netstat -tulnp 2>/dev/null | grep ":$PORT " | grep LISTEN | awk '{print $7}' | cut -d/ -f1)

if [ -n "$PID" ]; then
  echo "🛑 Port $PORT is being used by PID $PID. Killing..."
  kill -9 $PID
  sleep 1
else
  echo "✅ Port $PORT is free."
fi

echo "🚀 Starting server..."
node server.js