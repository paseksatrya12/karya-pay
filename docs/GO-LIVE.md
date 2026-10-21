# Tahapan Go-Live KaryaPay di Server aaPanel

Server: aaPanel, 4 core CPU, 4 GB RAM (Ubuntu 22.04/24.04 atau Debian 12).
Repo: `https://github.com/paseksatrya12/karya-pay` · Domain contoh: `app.domainanda.com` (ganti dengan domain Anda).

| Fase | Isi | Kapan | Perkiraan |
| --- | --- | --- | --- |
| **0. Persiapan server** | DNS, keamanan, swap, software dasar | Sekali di awal | ½ hari |
| **1. Frontend live (uji coba)** | Aplikasi React tampil di domain + HTTPS | Bisa sekarang | 2 jam |
| **2. Backend & staging** | Laravel + MySQL + Redis di `staging.` | Saat backend dibangun | menyesuaikan |
| **3. Hari H produksi** | Rilis resmi, data sungguhan | Setelah staging lolos uji | 1 hari |
| **4. Operasional** | Backup, pemantauan, update | Rutin setelah live | — |

> **Penting:** sebelum Fase 2 selesai, semua data (akun, invoice, klien) masih tersimpan di browser masing-masing pengguna.
> Fase 1 hanya untuk demo/uji coba, **jangan dipakai untuk data pelanggan sungguhan**.

---

## Fase 0 — Persiapan Server (sekali)

### 0.1 Siapkan dulu
- [ ] Akses SSH root ke server + IP publik server
- [ ] Domain dan akses ke pengaturan DNS-nya
- [ ] Email untuk notifikasi SSL & pemantauan

### 0.2 DNS
Tambahkan A record (TTL 300 dulu agar mudah diubah):

| Nama | Tipe | Nilai |
| --- | --- | --- |
| `app` | A | IP server |
| `staging` | A | IP server (untuk Fase 2) |

Cek: `ping app.domainanda.com` harus menunjuk ke IP server.

### 0.3 Dasar server (via SSH)
```bash
apt update && apt upgrade -y
timedatectl set-timezone Asia/Jakarta

# Swap 2 GB — penyangga agar proses tidak dimatikan saat RAM penuh
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf && sysctl --system
free -h   # pastikan Swap 2.0Gi
```

**Login SSH pakai key** (dari laptop: `ssh-keygen -t ed25519`, lalu salin isi `~/.ssh/id_ed25519.pub` ke server `~/.ssh/authorized_keys`).
Setelah **berhasil masuk dengan key di jendela terminal baru**, baru matikan login password:
```bash
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh
```
> Jangan tutup sesi SSH lama sebelum memastikan login key berhasil — kalau gagal, Anda bisa terkunci dari server.

### 0.4 Amankan aaPanel
Di aaPanel → **Settings**:
- [ ] Ganti **Panel port** dari bawaan (mis. 7800 → port acak 5 digit)
- [ ] Atur **Security entrance** (URL rahasia panel)
- [ ] Aktifkan **Google Authenticator / 2FA**
- [ ] **Authorized IP**: batasi akses panel hanya dari IP kantor/rumah (jika IP Anda tetap)
- [ ] Update aaPanel ke versi terbaru (aaPanel pernah punya celah keamanan; update rutin)

### 0.5 Firewall
aaPanel → **Security** → Firewall, buka hanya:

| Port | Untuk |
| --- | --- |
| 22 (atau port SSH Anda) | SSH |
| 80, 443 | Website |
| Port panel | aaPanel (sebaiknya dibatasi IP) |

**Jangan pernah membuka 3306 (MySQL) dan 6379 (Redis) ke publik.**
Opsional: `apt install -y fail2ban` untuk memblokir percobaan login SSH berulang.

### 0.6 Software
**Untuk Fase 1** cukup:
- aaPanel → App Store → **Nginx** (1.24+)
- **Node.js 22 LTS** (dibutuhkan untuk build; Vite 8 butuh Node ≥ 20.19):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs git rsync
  node -v   # v22.x
  ```
  (Alternatif: App Store → *Node.js version manager* → install v22 → set sebagai *command line version*.)

**Untuk Fase 2** (nanti): PHP 8.3, MySQL 8.0, Redis, Supervisor, Composer — rincian di [Fase 2](#fase-2--backend--staging).

---

## Fase 1 — Frontend Live (Mode Uji Coba)

Struktur folder di server (dibuat oleh skrip deploy):
```
/www/wwwroot/karyapay/
├── repo/                      clone GitHub khusus deploy (jangan diedit manual)
├── releases/20261021-1030/    hasil build tiap rilis (disimpan 5 terakhir)
└── current -> releases/…      ← root situs di aaPanel
```
Setiap deploy membuat folder rilis baru lalu memindahkan `current` sekaligus, jadi pengunjung tidak pernah melihat build setengah jadi dan rollback cukup satu perintah.

### 1.1 Buat situs di aaPanel
Website → **Add site**:
- Domain: `app.domainanda.com`
- Root directory: **`/www/wwwroot/karyapay`**
- FTP: tidak · Database: tidak · PHP version: **Pure static**

### 1.2 Clone repo & deploy pertama (via SSH)
Repo **publik**:
```bash
git clone https://github.com/paseksatrya12/karya-pay.git /www/wwwroot/karyapay/repo
```
Repo **privat** — pakai *deploy key* (hanya-baca):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/karyapay_deploy -N ""
cat ~/.ssh/karyapay_deploy.pub
# → GitHub repo → Settings → Deploy keys → Add key (tanpa centang write access)
cat >> ~/.ssh/config <<'CFG'
Host github.com
  IdentityFile ~/.ssh/karyapay_deploy
  IdentitiesOnly yes
CFG
git clone git@github.com:paseksatrya12/karya-pay.git /www/wwwroot/karyapay/repo
```
Lalu jalankan deploy:
```bash
bash /www/wwwroot/karyapay/repo/deploy/deploy-frontend.sh main
ls -l /www/wwwroot/karyapay/current        # harus menunjuk ke releases/<waktu>
cat /www/wwwroot/karyapay/current/REVISION # commit yang sedang live
```
> Skrip deploy & rollback sudah diuji bagian build dan rilisnya, tetapi penggantian symlink baru bisa diuji di Linux. Jalankan perintah di atas sekali dan pastikan `current` terbentuk **sebelum** langkah 1.3.

### 1.3 Arahkan situs ke `current`
Website → situs → **Site directory** → ubah ke `/www/wwwroot/karyapay/current` → Save.
(Jika aaPanel menolak symlink: buka **Conf** situs dan ubah baris `root` menjadi `root /www/wwwroot/karyapay/current;`.)

### 1.4 Pasang aturan Nginx
Website → situs → **Conf → URL rewrite** → tempel isi [`deploy/nginx/karyapay.conf`](../deploy/nginx/karyapay.conf) (bagian Fase 1 saja, blok Fase 2 biarkan bertanda `#`) → Save.
aaPanel akan menolak jika ada salah ketik. Aturan ini wajib: tanpa itu, membuka/refresh `/invoice/INV-2026-001/pdf` menghasilkan **404**.

### 1.5 HTTPS
Website → situs → **SSL** → Let's Encrypt → pilih domain → Apply → aktifkan **Force HTTPS**.
(DNS harus sudah mengarah ke server dan port 80 terbuka.)

### 1.6 Uji setelah live
- [ ] `http://app.domainanda.com` otomatis pindah ke `https://`
- [ ] Halaman awal mengarah ke `/login`; login akun demo berhasil
- [ ] Buka langsung & **refresh** `https://app.domainanda.com/invoice/INV-2026-046/pdf` → tidak 404
- [ ] Pratinjau PDF tampil, "Simpan sebagai PDF" & "Cetak" berfungsi
- [ ] Cache benar:
  ```bash
  curl -sI https://app.domainanda.com/ | grep -i cache-control              # no-cache
  curl -sI https://app.domainanda.com/assets/$(ls /www/wwwroot/karyapay/current/assets | grep -m1 '\.js$') | grep -i cache-control  # immutable
  ```
- [ ] Dicoba di HP (Chrome Android & Safari iOS)

### 1.7 Update & rollback
Setiap ada perubahan: `git push` dari laptop → di server:
```bash
bash /www/wwwroot/karyapay/repo/deploy/deploy-frontend.sh main
```
Jika rilis baru bermasalah:
```bash
bash /www/wwwroot/karyapay/repo/deploy/rollback-frontend.sh          # mundur 1 rilis
bash /www/wwwroot/karyapay/repo/deploy/rollback-frontend.sh --list   # lihat daftar rilis
```
Tidak perlu restart Nginx; perubahan langsung aktif.

---

## Fase 2 — Backend & Staging

Dikerjakan saat backend Laravel dibangun. Prinsipnya: **deploy ke `staging.domainanda.com` sejak fitur pertama**, sehingga saat Hari H tidak ada kejutan.

### 2.1 Install software (aaPanel → App Store)
- **PHP 8.3** → Install extensions: `redis`, `fileinfo`, `intl`, `opcache`, `imagick` (atau `gd`); di *Disabled functions* hapus `proc_open`, `putenv`, `symlink` (dipakai Composer/Artisan)
- **MySQL 8.0** · **Redis** · **Supervisor manager**
- Composer: `curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer`

### 2.2 Pengaturan untuk RAM 4 GB
| Komponen | Di mana | Nilai |
| --- | --- | --- |
| MySQL | MySQL → Performance | `innodb_buffer_pool_size = 1024M`, `max_connections = 150` |
| PHP-FPM | PHP 8.3 → Performance | `dynamic`, `max_children 12`, `start 4`, `min_spare 4`, `max_spare 8`, `max_requests 500` |
| OPcache | PHP 8.3 → Config | `opcache.memory_consumption=128`, `opcache.validate_timestamps=1`, `opcache.revalidate_freq=60` |
| Redis | Redis → Config | `maxmemory 256mb`, `maxmemory-policy noeviction` (antrean tidak boleh terhapus) |
| Queue worker | Supervisor | 2 proses |

Perkiraan pemakaian: OS+aaPanel ~600 MB · MySQL ~1,2 GB · PHP-FPM ~600 MB · Redis ~256 MB · worker ~200 MB · sisanya cadangan + swap.

### 2.3 Database
Databases → **Add database**: nama `karyapay_staging` (staging) / `karyapay` (produksi), user khusus, password kuat, **Access: Local server**. Charset `utf8mb4`.

### 2.4 Struktur backend
```
/www/wwwroot/karyapay/
├── shared/.env                 konfigurasi produksi (tidak ada di Git)
├── shared/storage/             upload logo/tanda tangan, log (tetap antar rilis)
└── releases/<waktu>/
    ├── index.html, assets/     frontend
    └── backend/                Laravel (storage → symlink ke shared/storage)
```
Langkah deploy backend per rilis (akan dibuatkan skripnya bersama backend):
```bash
composer install --no-dev --optimize-autoloader
ln -s /www/wwwroot/karyapay/shared/.env .env
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan storage:link
# ganti symlink current → reload PHP-FPM → php artisan queue:restart
```

### 2.5 `.env` produksi (inti)
```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://app.domainanda.com
DB_DATABASE=karyapay
DB_USERNAME=karyapay
DB_PASSWORD=********
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_DOMAIN=app.domainanda.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=app.domainanda.com
LOG_CHANNEL=daily
LOG_LEVEL=warning
MAIL_MAILER=smtp            # untuk reset kata sandi
WHATSAPP_PROVIDER=…         # provider OTP & kirim invoice
```

### 2.6 Nginx untuk `/api`
- Site → PHP version: **PHP 8.3**
- Site directory → **matikan "Anti-XSS / open_basedir"** (menyebabkan error *open_basedir restriction* di Laravel)
- URL rewrite → hapus tanda `#` pada blok **Fase 2** di `deploy/nginx/karyapay.conf`

### 2.7 Worker & jadwal
- **Supervisor manager** → Add: nama `karyapay-queue`, user `www`, jumlah proses 2, perintah:
  `php /www/wwwroot/karyapay/current/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600`
- **Cron** → Add task → Shell script, setiap 1 menit:
  `cd /www/wwwroot/karyapay/current/backend && php artisan schedule:run >> /dev/null 2>&1`

### 2.8 Situs staging
Ulangi Fase 1 + 2.3–2.7 untuk `staging.domainanda.com` dengan folder `/www/wwwroot/karyapay-staging` dan database `karyapay_staging`. Tambahan:
- Website → situs → **Password access** (Basic Auth) agar tidak bisa dibuka publik
- Tambahkan `add_header X-Robots-Tag "noindex, nofollow";` agar tidak terindeks Google

### 2.9 Uji staging (UAT) — wajib lolos sebelum Fase 3
- [ ] Daftar → OTP WhatsApp sungguhan diterima → masuk
- [ ] Lupa kata sandi via email berfungsi
- [ ] Master jasa & item, buat invoice & penawaran, edit nominal, Jadikan Invoice
- [ ] Dua pengguna menyimpan invoice bersamaan → nomor tidak bentrok
- [ ] Data tetap ada saat login dari perangkat lain
- [ ] Upload logo & tanda tangan tampil di PDF
- [ ] Kirim invoice via WhatsApp, link publik invoice bisa dibuka klien tanpa login
- [ ] Restart server → aplikasi, worker, & cron jalan kembali otomatis

---

## Fase 3 — Hari H Go-Live Produksi

### H-7
- [ ] Bekukan fitur (hanya perbaikan bug)
- [ ] UAT staging lolos 100%
- [ ] Turunkan TTL DNS ke 300 detik
- [ ] Uji backup **dan restore** database staging
- [ ] Hapus fitur demo dari build produksi (kartu akun demo, OTP "mode demo", data contoh)

### H-1
- [ ] Tag rilis: `git tag v1.0.0 && git push --tags`
- [ ] Buat database produksi kosong + `shared/.env` produksi
- [ ] Situs produksi sudah dibuat, SSL aktif, akses dibatasi Password access sementara
- [ ] Siapkan pengumuman ke pengguna uji coba (data browser lama tidak ikut pindah kecuali lewat fitur impor)

### Hari H
| Jam | Langkah |
| --- | --- |
| 00:00 | Backup penuh (database + `shared/storage`) |
| 00:10 | Deploy tag `v1.0.0` → `migrate --force` → seeder data awal (satuan, kategori) |
| 00:30 | Uji cepat: login, buat invoice, cetak PDF, kirim WA, cek log `storage/logs` |
| 00:45 | **Go / No-go** — semua uji cepat lolos? |
| 01:00 | Buka akses publik (hapus Password access) |
| 01:00–03:00 | Pantau: aaPanel → Monitor (CPU/RAM), log Nginx & Laravel, UptimeRobot |

### Rencana mundur (rollback)
- Frontend: `deploy/rollback-frontend.sh`
- Backend: kembalikan symlink `current` ke rilis sebelumnya → `php artisan queue:restart`
- Database: `php artisan migrate:rollback` hanya jika migrasi bisa dibalik; jika tidak, **restore backup 00:00**

---

## Fase 4 — Operasional Setelah Live

| Kapan | Tugas |
| --- | --- |
| Otomatis harian | aaPanel → Cron → **Backup database** & folder `shared/storage`, simpan 7 harian + 4 mingguan, kirim ke penyimpanan luar (S3 / Google Drive / Backblaze) |
| Otomatis | **UptimeRobot** cek `https://app.domainanda.com` tiap 5 menit, notifikasi email/WA |
| Mingguan | Cek log error Laravel, ruang disk, notifikasi aaPanel |
| Bulanan | Update aaPanel, OS (`apt upgrade`), PHP minor · **uji restore backup** · cek SSL auto-renew · tinjau RAM (jika swap sering terpakai → upgrade ke 8 GB) |

---

## Lampiran — Masalah Umum

| Gejala | Penyebab & solusi |
| --- | --- |
| 404 saat refresh halaman selain `/` | URL rewrite (1.4) belum dipasang |
| Halaman putih setelah deploy | Browser memegang `index.html` lama → cek header no-cache (1.6), lalu Ctrl+F5 |
| `Node.js 20.19+ … diperlukan` | Install Node 22 (0.6) atau pilih command line version di Node manager |
| SSL gagal terbit | DNS belum mengarah ke server / port 80 tertutup |
| 502 Bad Gateway di `/api` | PHP-FPM 8.3 mati atau socket salah → App Store → PHP 8.3 → Restart; cek `/tmp/php-cgi-83.sock` |
| `open_basedir restriction` | Matikan Anti-XSS/open_basedir di Site directory (2.6) |
| `Permission denied` di `storage/` | `chown -R www:www /www/wwwroot/karyapay/shared/storage` |
| Perubahan backend tidak muncul | `php artisan config:cache` lalu reload PHP-FPM |
