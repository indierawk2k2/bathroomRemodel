#!/bin/bash
# Start the Bathroom Remodel Visualizer: serves this folder with Python's
# built-in web server on port 8787 (or the next free port) and opens the
# default browser.  Ctrl-C stops the server.
cd "$(dirname "$0")" || exit 1
PORT=${1:-8787}
port_busy() { python3 -c "import socket,sys; s=socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1', $1)) == 0 else 1)"; }
while port_busy "$PORT"; do PORT=$((PORT + 1)); done
URL="http://localhost:$PORT/"
echo "Bathroom viewer: $URL   (Ctrl-C to stop)"
python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; exit 0' INT TERM
sleep 0.7
if command -v open >/dev/null; then open "$URL"; elif command -v xdg-open >/dev/null; then xdg-open "$URL"; fi
wait $SERVER
