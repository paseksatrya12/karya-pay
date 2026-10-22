#!/usr/bin/env bash
# Cek cepat situs KaryaPay yang sudah live: HTTPS, aturan Nginx, cache, kompresi.
# Bisa dijalankan dari laptop (Git Bash) atau server:
#   bash deploy/check-live.sh https://karyapay.mahajayakom.my.id
set -uo pipefail

URL="${1:?Pemakaian: bash deploy/check-live.sh https://domain-anda}"
URL="${URL%/}"
HOST="${URL#https://}"
FAILED=0

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n      → %s\n' "$1" "$2"; FAILED=$((FAILED + 1)); }
header() { curl -sI "$1" | tr -d '\r' | grep -i "^$2:" | head -1 | cut -d' ' -f2-; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

echo "Memeriksa $URL"

code="$(status "$URL/")"
[ "$code" = 200 ] && pass "Halaman utama terbuka (200)" || fail "Halaman utama: HTTP $code" "Cek situs aktif di aaPanel & Site directory mengarah ke /current"

redirect="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://$HOST/")"
case "$redirect" in
  30[178]\ https://*) pass "HTTP dialihkan ke HTTPS" ;;
  *) fail "HTTP tidak dialihkan ke HTTPS ($redirect)" "aaPanel SSL → Force HTTPS, atau Cloudflare → SSL/TLS → Edge Certificates → Always Use HTTPS" ;;
esac

for path in /dokumen /invoice/INV-2026-046/pdf /master/jasa; do
  code="$(status "$URL$path")"
  [ "$code" = 200 ] && pass "Buka langsung $path (200)" || fail "Buka langsung $path: HTTP $code" "Aturan Nginx (langkah K) belum aktif"
done

cache="$(header "$URL/" cache-control)"
case "$cache" in
  *no-cache*) pass "index.html tidak di-cache ($cache)" ;;
  *) fail "index.html: Cache-Control '${cache:-kosong}'" "Aturan Nginx (langkah K) belum aktif" ;;
esac

asset="$(curl -s "$URL/" | grep -o '/assets/[^"]*\.js' | head -1)"
if [ -n "$asset" ]; then
  cache="$(header "$URL$asset" cache-control)"
  # Query acak memaksa CDN (Cloudflare) mengambil langsung dari server, untuk membedakan
  # aturan Nginx yang belum aktif dengan salinan lama di cache CDN.
  origin_cache="$(header "$URL$asset?nocache=$RANDOM$RANDOM" cache-control)"
  case "$cache|$origin_cache" in
    *immutable*\|*) pass "Aset di-cache 1 tahun ($asset)" ;;
    *\|*immutable*) fail "Aset $asset: CDN masih menyajikan header lama ('$cache')" "Server sudah benar. Cloudflare → Caching → Configuration → Purge Everything" ;;
    *) fail "Aset $asset: Cache-Control '${cache:-kosong}'" "Aturan Nginx (langkah K) belum aktif" ;;
  esac
  enc="$(curl -sI -H 'Accept-Encoding: gzip, br' "$URL$asset" | tr -d '\r' | grep -i '^content-encoding:' | cut -d' ' -f2)"
  [ -n "$enc" ] && pass "Aset terkompresi ($enc)" || fail "Aset tidak terkompresi" "Aktifkan gzip di Nginx aaPanel"
else
  fail "Tidak menemukan file JS di index.html" "Deploy ulang: deploy-karyapay"
fi

code="$(status "$URL/REVISION")"
[ "$code" = 403 ] || [ "$code" = 404 ] && pass "File REVISION tertutup ($code)" || fail "File REVISION bisa diunduh ($code)" "Aturan Nginx (langkah K) belum aktif"

frame="$(header "$URL/" x-frame-options)"
[ -n "$frame" ] && pass "Header keamanan aktif (X-Frame-Options: $frame)" || fail "Header keamanan tidak ada" "Aturan Nginx (langkah K) belum aktif"

echo
if [ "$FAILED" -eq 0 ]; then
  echo "Semua pemeriksaan lolos."
else
  echo "$FAILED pemeriksaan gagal."
  exit 1
fi
