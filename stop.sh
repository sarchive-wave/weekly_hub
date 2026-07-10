#!/bin/bash
BASE="$(cd "$(dirname "$0")" && pwd)"

echo "=== AI Weekly Hub 중지 ==="

stop_service() {
  local name=$1
  local pid_file="$BASE/$2"
  if [ -f "$pid_file" ]; then
    PID=$(cat "$pid_file")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      echo "$name 중지 (PID: $PID)"
    else
      echo "$name 이미 종료됨"
    fi
    rm -f "$pid_file"
  else
    echo "$name PID 파일 없음"
  fi
}

stop_service "Backend" "backend.pid"
stop_service "Frontend" "frontend.pid"

echo "완료"
