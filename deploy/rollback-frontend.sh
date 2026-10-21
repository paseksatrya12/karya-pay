#!/usr/bin/env bash
# Kembalikan frontend ke rilis sebelumnya, atau ke rilis tertentu.
#
#   bash deploy/rollback-frontend.sh               # mundur satu rilis
#   bash deploy/rollback-frontend.sh 20261021-1030 # ke rilis tertentu
#   bash deploy/rollback-frontend.sh --list        # lihat daftar rilis
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/karyapay}"
LIVE="$(readlink -f "$APP_DIR/current")"
mapfile -t RELEASES < <(find "$APP_DIR/releases" -mindepth 1 -maxdepth 1 -type d | sort)

if [ "${1:-}" = "--list" ]; then
  for dir in "${RELEASES[@]}"; do
    mark=' '
    [ "$(readlink -f "$dir")" = "$LIVE" ] && mark='*'
    echo "$mark $(basename "$dir")  commit $(cat "$dir/REVISION" 2>/dev/null || echo '?')"
  done
  exit 0
fi

if [ -n "${1:-}" ]; then
  TARGET="$APP_DIR/releases/$1"
  [ -d "$TARGET" ] || { echo "Rilis $1 tidak ditemukan. Lihat: $0 --list"; exit 1; }
else
  TARGET=''
  for i in "${!RELEASES[@]}"; do
    if [ "$(readlink -f "${RELEASES[$i]}")" = "$LIVE" ] && [ "$i" -gt 0 ]; then
      TARGET="${RELEASES[$((i - 1))]}"
    fi
  done
  [ -n "$TARGET" ] || { echo "Tidak ada rilis sebelum $(basename "$LIVE")."; exit 1; }
fi

ln -sfn "$TARGET" "$APP_DIR/current.tmp"
mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
echo "✓ Dikembalikan ke rilis $(basename "$TARGET") (commit $(cat "$TARGET/REVISION" 2>/dev/null || echo '?'))"
