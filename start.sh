#!/bin/bash

# Start Python FastAPI backend on port 8000
echo "Starting Python FastAPI backend on port 8000..."
cd server && python main.py &
PYTHON_PID=$!

# Wait a moment for Python to start
sleep 3

# Start Node.js Express frontend on port 5000
echo "Starting Node.js Express frontend on port 5000..."
npm run dev &
NODE_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
