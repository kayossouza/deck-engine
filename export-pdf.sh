#!/usr/bin/env bash
# Builds deck.pdf from print mode (one page per scene x step) with headless Chrome.
# Optional: OUT=path.pdf, CHROME=/path/to/chrome, MODE=final (only the last step of each scene).
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "$(command -v google-chrome || true)" "$(command -v chromium || true)" "$(command -v chromium-browser || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
[ -n "$CHROME" ] || { echo "Chrome não encontrado. Use CHROME=/caminho/do/chrome ./export-pdf.sh"; exit 1; }
MODE="${MODE:-1}"
OUT="${OUT:-$(pwd)/deck.pdf}"
URL="file://$(pwd)/index.html?print=$MODE"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT" \
  --virtual-time-budget=8000 --run-all-compositor-stages-before-draw "$URL" 2>/dev/null
echo "PDF: $OUT"
if [ "$MODE" != "1" ]; then exit 0; fi
# Check: page count must equal the sum of steps of every scene listed in index.html.
EXPECTED=$(node -e '
const fs=require("fs");const html=fs.readFileSync("index.html","utf8");
const files=[...html.matchAll(/scenes\/([^"?]+\.js)/g)].map(m=>m[1]);
let n=0;for(const f of files){const s=fs.readFileSync("scenes/"+f,"utf8");const m=s.match(/steps:\s*(\d+)/);n+=m?parseInt(m[1],10):1;}
console.log(n)' 2>/dev/null || echo "?")
if command -v pdfinfo >/dev/null; then
  PAGES=$(pdfinfo "$OUT" | awk '/^Pages:/{print $2}')
  echo "páginas: $PAGES · esperado (soma das etapas): $EXPECTED"
  [ "$PAGES" = "$EXPECTED" ] && echo "OK" || { echo "DIVERGÊNCIA"; exit 1; }
else
  echo "pdfinfo não encontrado (instale o poppler); contagem de páginas não conferida."
fi
