#!/bin/bash
# Headless screenshot via Microsoft Edge (the only Chromium on this machine).
# Usage: tools/headless_shot.sh <url> <out.png> [WxH] [wait_seconds]
# Edge's --screenshot mode renders WebGL2 but never exits cleanly, so we
# poll for the file and then kill the process.  Exit 0 iff the PNG exists.
set -u
URL="$1"; OUT="$2"; SIZE="${3:-1280,800}"; WAIT="${4:-45}"
EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
PROFILE="/private/tmp/claude-501/edge-headless-profile-$$"
rm -f "$OUT"
"$EDGE" --headless=new --no-first-run --no-default-browser-check \
  --user-data-dir="$PROFILE" --window-size="$SIZE" --hide-scrollbars \
  --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
PID=$!
for i in $(seq 1 "$WAIT"); do
  [ -s "$OUT" ] && break
  sleep 1
done
sleep 1
kill "$PID" 2>/dev/null; pkill -P "$PID" 2>/dev/null
wait "$PID" 2>/dev/null
rm -rf "$PROFILE"
[ -s "$OUT" ] && { echo "saved $OUT"; exit 0; } || { echo "no screenshot after ${WAIT}s" >&2; exit 1; }
