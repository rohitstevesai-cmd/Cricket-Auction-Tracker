#!/bin/bash
set -e

# Start the API server in the background
PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Start the frontend on port 5000 (Replit webview port)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/cricket-auction run dev &
FRONTEND_PID=$!

# Wait for either process to exit
wait -n $API_PID $FRONTEND_PID

# If one exits, kill the other
kill $API_PID $FRONTEND_PID 2>/dev/null || true
