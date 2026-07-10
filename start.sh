#!/bin/bash
BASE="$(cd "$(dirname "$0")" && pwd)"

echo "=== AI Weekly Hub 시작 ==="

# Backend
cd "$BASE/backend"
source venv/bin/activate
nohup uvicorn app.main:app --port 8081 > "$BASE/backend.log" 2>&1 &
echo $! > "$BASE/backend.pid"
echo "Backend 시작 (PID: $(cat "$BASE/backend.pid"), 포트: 8081)"

# Frontend
cd "$BASE/frontend"
nohup npm run dev > "$BASE/frontend.log" 2>&1 &
echo $! > "$BASE/frontend.pid"
echo "Frontend 시작 (PID: $(cat "$BASE/frontend.pid"), 포트: 5174)"

echo ""
echo "Frontend: http://localhost:5174"
echo "Backend API: http://localhost:8081/docs"
echo "로그: tail -f $BASE/backend.log"
