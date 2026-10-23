#!/usr/bin/env bash
# Serves the deck on a local server (offline). Ctrl+C stops it.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
echo "Projeção:     http://localhost:$PORT/index.html"
echo "Apresentador: http://localhost:$PORT/index.html?presenter=1   (ou tecla P na projeção)"
echo "Print:        http://localhost:$PORT/index.html?print=1"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
