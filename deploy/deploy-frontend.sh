#!/usr/bin/env bash
# Deploy frontend KaryaPay di server aaPanel: tarik kode dari GitHub, build, lalu rilis
# atomik lewat symlink `current` (pengunjung tidak pernah melihat build setengah jadi).
#
# Dijalankan DI SERVER:  bash /www/wwwroot/karyapay/repo/deploy/deploy-frontend.sh [branch]
# Struktur:
#   $APP_DIR/repo/                 clone khusus deploy (jangan diedit manual)
#   $APP_DIR/releases/<waktu>/     hasil build tiap rilis
#   $APP_DIR/current -> releases/… root situs di aaPanel
set -euo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/karyapay}"
BRANCH="${1:-main}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
WEB_USER="${WEB_USER:-www}"

REPO_DIR="$APP_DIR/repo"
RELEASE="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="$APP_DIR/releases/$RELEASE"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repo belum ada di $REPO_DIR. Jalankan dulu:"
  echo "  git clone https://github.com/paseksatrya12/karya-pay.git $REPO_DIR"
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20.19+ / 22 LTS diperlukan (sekarang: $(node -v 2>/dev/null || echo 'tidak ada'))."
  exit 1
fi

echo "→ Mengambil kode terbaru (branch $BRANCH)"
git -C "$REPO_DIR" fetch --prune origin
git -C "$REPO_DIR" checkout -q "$BRANCH"
git -C "$REPO_DIR" reset -q --hard "origin/$BRANCH"
COMMIT="$(git -C "$REPO_DIR" rev-parse --short HEAD)"

echo "→ Install dependensi & build ($COMMIT)"
cd "$REPO_DIR"
npm ci --no-audit --no-fund
npm run build

echo "→ Menyiapkan rilis $RELEASE"
mkdir -p "$RELEASE_DIR"
cp -a dist/. "$RELEASE_DIR/"
echo "$COMMIT" > "$RELEASE_DIR/REVISION"
chown -R "$WEB_USER:$WEB_USER" "$RELEASE_DIR" 2>/dev/null || true

# Ganti symlink secara atomik: buat symlink sementara lalu rename menimpa `current`.
ln -sfn "$RELEASE_DIR" "$APP_DIR/current.tmp"
mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"

echo "→ Menghapus rilis lama (menyisakan $KEEP_RELEASES terbaru)"
LIVE="$(readlink -f "$APP_DIR/current")"
mapfile -t OLD < <(find "$APP_DIR/releases" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"$KEEP_RELEASES")
for dir in "${OLD[@]}"; do
  [ "$(readlink -f "$dir")" = "$LIVE" ] || rm -rf "$dir"
done

echo "✓ Live: rilis $RELEASE (commit $COMMIT)"
