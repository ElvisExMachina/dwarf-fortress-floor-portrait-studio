#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PACKAGE_NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"
RELEASE_NAME="${PACKAGE_NAME}-v${VERSION}"
RELEASE_DIR="$ROOT/.release"
STAGE_DIR="$RELEASE_DIR/$RELEASE_NAME"
ARCHIVE="$RELEASE_DIR/${RELEASE_NAME}.zip"

rm -rf "$RELEASE_DIR"
mkdir -p "$STAGE_DIR"

npm run licenses:check
npm run build
cp -R dist/. "$STAGE_DIR/"
cp LICENSE THIRD_PARTY_NOTICES.md THIRD_PARTY_LICENSES.txt "$STAGE_DIR/"

cat > "$STAGE_DIR/RUN.txt" <<EOF
Dwarf Fortress Floor Portrait Studio v${VERSION}

This archive contains the static production build.

Serve it from this directory instead of opening index.html directly:

  python3 -m http.server 8000

Then open http://127.0.0.1:8000/ in a browser.

The app is local-first and stores projects in that browser's localStorage.
See THIRD_PARTY_NOTICES.md for project status and attribution, and
THIRD_PARTY_LICENSES.txt for complete runtime dependency license texts.
EOF

# Normalize mtimes and strip platform-specific ZIP metadata so repeated runs from
# an unchanged tree produce the same archive bytes on the same Info-ZIP version.
node --input-type=module - "$STAGE_DIR" <<'NODE'
import { readdirSync, statSync, utimesSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
const releaseTime = new Date('2026-07-23T00:00:00.000Z')
const visit = (path) => {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path).sort()) visit(join(path, entry))
  }
  utimesSync(path, releaseTime, releaseTime)
}
visit(root)
NODE

(
  cd "$RELEASE_DIR"
  LC_ALL=C find "$RELEASE_NAME" -print | LC_ALL=C sort | zip -X -q "$ARCHIVE" -@
)

(
  cd "$RELEASE_DIR"
  shasum -a 256 "$(basename "$ARCHIVE")" > SHA256SUMS
)

printf 'Created %s\n' "$ARCHIVE"
cat "$RELEASE_DIR/SHA256SUMS"
