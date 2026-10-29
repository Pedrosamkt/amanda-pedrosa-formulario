#!/bin/sh
# Monta só o que o navegador precisa. README, planilha e config ficam fora do ar.
set -eu
cd "$(dirname "$0")/.."
rm -rf public
mkdir -p public
cp index.html politica-de-privacidade.html public/
cp -r assets public/
cp cloudflare/_headers public/_headers
