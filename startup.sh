#!/bin/sh
set -eu
cd /workspace

pidfile=/tmp/atlas-github-sync.pid
if [ -f "$pidfile" ]; then
  old=$(cat "$pidfile" 2>/dev/null || true)
  if [ -n "${old:-}" ] && [ -d "/proc/$old" ]; then
    :
  else
    rm -f "$pidfile"
  fi
fi
if [ ! -f "$pidfile" ]; then
  node /workspace/scripts/sync-github.mjs >>/tmp/github-sync.log 2>&1 &
  echo $! > "$pidfile"
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
