# Tutorial Go-Live KaryaPay di aaPanel (Fase 0 & 1)

Tutorial ini membawa Anda dari server kosong sampai **KaryaPay bisa dibuka di `https://app.domainanda.com`**.
Ringkasan seluruh tahapan (termasuk backend nanti) ada di [GO-LIVE.md](GO-LIVE.md).

**Waktu:** ±3 jam (sebagian besar menunggu DNS & instalasi).
**Hasil akhir:** frontend live dengan HTTPS, update cukup satu perintah, dan bisa rollback.

> ⚠️ **Mode uji coba.** Sampai backend selesai (Fase 2), data tiap pengguna tersimpan di browser mereka sendiri dan login masih akun demo. Pakai untuk demo & tes, **bukan untuk data pelanggan sungguhan**.

---

## Sebelum mulai

### Tanda tempat menjalankan perintah
| Tanda | Artinya |
| --- | --- |
| **[Laptop]** | Windows PowerShell di laptop Anda |
| **[Server]** | Terminal SSH ke server (lihat langkah A3), atau aaPanel → **Terminal** |
| **[aaPanel]** | Klik di halaman web aaPanel |
| **[GitHub]** | Klik di github.com |
| **[DNS]** | Panel pengelola domain (Niagahoster, Rumahweb, Cloudflare, dll.) |

### Ganti nilai contoh ini di seluruh tutorial
| Contoh | Ganti dengan |
| --- | --- |
| `app.domainanda.com` | Domain/subdomain untuk aplikasi |
| `IP_SERVER` | IP publik server, mis. `103.123.45.67` |

> Nama menu aaPanel bisa sedikit berbeda antar versi. Jika tidak menemukan menu persis, cari yang namanya paling mirip.

### Checklist kemajuan
- [ ] A. Persiapan laptop & login server
- [ ] B. DNS
- [ ] C. Dasar server (update, swap, SSH key)
- [ ] D. Amankan aaPanel
- [ ] E. Firewall
- [ ] F. Install Nginx & Node.js
- [ ] G. Buat situs di aaPanel
- [ ] H. Clone repo dari GitHub
- [ ] I. Deploy pertama
- [ ] J. Arahkan situs ke rilis
- [ ] K. Pasang aturan Nginx
- [ ] L. HTTPS
- [ ] M. Uji
- [ ] N. Cara update & rollback

---

## A. Persiapan laptop & login ke server

### A1. Kumpulkan data
Dari email/panel penyedia VPS, catat:
- IP server
- Password root
- Alamat login aaPanel (mis. `https://IP_SERVER:7800/abcd1234`), username & password aaPanel

Lupa info aaPanel? Login SSH (A3) lalu jalankan **[Server]** `bt default` untuk melihat alamat & username panel.

### A2. Buat SSH key di laptop
SSH key adalah "kunci" pengganti password: jauh lebih aman dan tidak bisa ditebak.

**[Laptop]** buka PowerShell:
```powershell
ssh-keygen -t ed25519 -C "laptop-uib"
```
Tekan **Enter** 3 kali (lokasi default, tanpa passphrase — atau isi passphrase jika ingin lebih aman).

Tampilkan kunci publiknya dan **salin seluruh baris** (diawali `ssh-ed25519`):
```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

### A3. Login ke server pertama kali
**[Laptop]**
```powershell
ssh root@IP_SERVER
```
- Muncul `Are you sure you want to continue connecting (yes/no)?` → ketik `yes`
- Masukkan password root (tidak tampil saat diketik — normal)
- Berhasil jika muncul prompt seperti `root@namaserver:~#`

---

## B. DNS — arahkan domain ke server

### B1. Tambah record
**[DNS]** tambahkan:

| Type | Name / Host | Value / Points to | TTL |
| --- | --- | --- | --- |
| A | `app` | `IP_SERVER` | 300 (atau 5 menit) |

> **Pakai Cloudflare?** Set ikon awan menjadi **abu-abu (DNS only)** dulu sampai SSL di langkah L selesai. Jika nanti ingin awan oranye (proxied), set Cloudflare → SSL/TLS → **Full (strict)**. Mode *Flexible* akan menyebabkan halaman berputar terus (*too many redirects*).

### B2. Pastikan sudah tersambung
**[Laptop]**
```powershell
nslookup app.domainanda.com
```
Berhasil jika baris `Address:` terakhir menunjukkan `IP_SERVER`. Biasanya 5–30 menit, kadang sampai beberapa jam. Lanjutkan langkah C–K sambil menunggu; DNS baru wajib siap di langkah L.

---

## C. Dasar server

### C1. Cek sistem operasi
**[Server]**
```bash
cat /etc/os-release | head -3
```
Tutorial ini untuk **Ubuntu 22.04/24.04** atau **Debian 12**. Jika CentOS/AlmaLinux/Rocky, ganti `apt` dengan `dnf` dan instalasi Node di langkah F2 berbeda.

### C2. Update & zona waktu
**[Server]**
```bash
apt update && apt upgrade -y
timedatectl set-timezone Asia/Jakarta
date    # harus menunjukkan jam WIB
```
Jika muncul layar ungu tentang konfigurasi file, pilih **keep the local version currently installed**. Jika diminta restart service, tekan Enter.

### C3. Swap 2 GB
Swap adalah "RAM cadangan" di disk agar proses tidak mati mendadak saat RAM 4 GB penuh.

**[Server]** cek dulu:
```bash
free -h
```
Jika baris `Swap:` sudah ≥ 2.0Gi, **lewati langkah ini**. Jika `0B`:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf
sysctl --system > /dev/null
free -h    # Swap: 2.0Gi
```

### C4. Login pakai SSH key, matikan login password
**[Server]** pasang kunci dari langkah A2 (ganti teks dalam tanda kutip dengan baris yang Anda salin):
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA...isi-kunci-anda... laptop-uib" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**[Laptop]** buka **jendela PowerShell BARU** (jangan tutup yang lama) dan uji:
```powershell
ssh root@IP_SERVER
```
✅ Harus langsung masuk **tanpa ditanya password**. Jika masih ditanya password, cek ulang kunci yang ditempel — **jangan lanjut**.

Setelah login key berhasil, **[Server]** matikan login password:
```bash
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
grep -rl 'PasswordAuthentication yes' /etc/ssh/sshd_config.d/ 2>/dev/null | xargs -r sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/'
sshd -t && systemctl restart ssh || systemctl restart sshd
```
Uji sekali lagi dari jendela baru: harus tetap bisa masuk dengan key.

> 🆘 **Terkunci dari server?** Gunakan **Console/VNC** di panel penyedia VPS (bukan SSH) untuk masuk dan mengembalikan `PasswordAuthentication yes`.

---

## D. Amankan aaPanel

**[aaPanel]** login ke panel.

1. **Update panel**: klik tombol **Update** di pojok kanan atas halaman Home (jika ada versi baru).
2. **Settings** (menu kiri) → bagian **Panel settings / Security**:
   - **Panel port** → ganti ke angka acak, mis. `28417` → Save.
     Catat! Alamat panel jadi `https://IP_SERVER:28417/...`. **Buka port ini di firewall (langkah E) sebelum/sesaat setelah mengganti.**
   - **Security entrance** → ganti ke teks acak, mis. `/kp-7Fq2xL`.
   - **Panel password** → ganti password kuat (≥ 16 karakter).
   - **Google Authenticator / Two-step verification** → aktifkan, scan QR dengan aplikasi Google Authenticator/Authy di HP.
   - (Opsional) **Authorized IP** → isi IP kantor/rumah. **Hanya jika IP Anda tetap**, kalau tidak Anda bisa terkunci.
3. Logout lalu login lagi memakai alamat baru untuk memastikan semuanya benar.

> 🆘 **Tidak bisa masuk panel?** **[Server]** jalankan `bt` → muncul menu pemulihan aaPanel (lihat info login, ganti password/port, matikan pembatasan IP atau 2FA).

---

## E. Firewall

### E1. Firewall aaPanel
**[aaPanel]** **Security** → **Firewall** (daftar port):

| Port | Status | Keterangan |
| --- | --- | --- |
| `22` (atau port SSH Anda) | ✅ Buka | SSH |
| `80` | ✅ Buka | HTTP (wajib untuk SSL Let's Encrypt) |
| `443` | ✅ Buka | HTTPS |
| Port panel (mis. `28417`) | ✅ Buka | aaPanel |
| `20`, `21`, `39000-40000` | ❌ Hapus | FTP — tidak dipakai |
| `888` | ❌ Hapus | phpMyAdmin — tidak dipakai di Fase 1 |
| `8888` / port panel lama | ❌ Hapus | setelah port panel diganti |
| `3306`, `6379` | ❌ Jangan pernah dibuka | MySQL & Redis |

### E2. Firewall penyedia VPS
Beberapa penyedia (mis. AWS, GCP, Biznet, IDCloudHost) punya firewall/*security group* sendiri di panel mereka. Pastikan port **80, 443, SSH, dan port panel** juga dibuka di sana.

### E3. Opsional: blokir pembobol password SSH
**[Server]**
```bash
apt install -y fail2ban
systemctl enable --now fail2ban
fail2ban-client status sshd   # Status for the jail: sshd
```

---

## F. Install Nginx & Node.js

### F1. Nginx
**[aaPanel]** **App Store** → cari **Nginx** → **Install** → pilih versi **1.24** atau lebih baru → mode **Fast** (biner) → Submit.
Tunggu sampai di **Message box** (ikon tugas di atas) statusnya selesai. Cek di App Store → **Installed**: Nginx berstatus berjalan.

> Jika saat pertama login aaPanel menawarkan paket **LNMP**, cukup centang **Nginx** saja untuk sekarang. PHP & MySQL baru dibutuhkan di Fase 2.

### F2. Node.js 22 & Git
Node.js dibutuhkan untuk mem-build aplikasi di server (Vite 8 butuh Node **20.19+**).

**[Server]**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh
apt install -y nodejs git
node -v   # v22.x.x
npm -v    # 10.x
git --version
```
> Sudah memasang Node lewat **Node.js version manager** di App Store? Pastikan `node -v` di terminal menunjukkan v22; jika tidak, di manager tersebut pilih v22 sebagai **command line version**.

---

## G. Buat situs di aaPanel

**[aaPanel]** **Website** → **Add site**:

| Isian | Nilai |
| --- | --- |
| Domain name | `app.domainanda.com` |
| Description | `KaryaPay` |
| Website path / Root directory | **`/www/wwwroot/karyapay`** (ubah dari bawaan) |
| FTP | Not create |
| Database | Not create |
| PHP version | **Pure static** |

Klik **Submit**. Situs muncul di daftar Website.

---

## H. Clone repo dari GitHub

Repo `paseksatrya12/karya-pay` bersifat **publik**, jadi server bisa langsung mengambil kode tanpa login GitHub.

**[Server]**
```bash
git clone https://github.com/paseksatrya12/karya-pay.git /www/wwwroot/karyapay/repo
ls /www/wwwroot/karyapay/repo/deploy
# deploy-frontend.sh  nginx  rollback-frontend.sh
```
✅ Berhasil jika tiga nama di atas tampil. Skrip deploy nanti mengambil update dari alamat yang sama.

> 🔒 **Karena repo publik, siapa pun bisa membaca isinya.** Jangan pernah meng-commit password, token WhatsApp, kunci API, atau file `.env`. Semua rahasia itu nanti (Fase 2) hanya disimpan di server, di `/www/wwwroot/karyapay/shared/.env`.

<details>
<summary><strong>Jika suatu saat repo dijadikan privat lagi</strong> — pakai deploy key</summary>

1. **[Server]** buat kunci baca-saja:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/karyapay_deploy -N "" -C "aapanel-karyapay"
   cat ~/.ssh/karyapay_deploy.pub
   ```
2. **[GitHub]** repo → **Settings** → **Deploy keys** → **Add deploy key** → tempel kunci, **jangan** centang *Allow write access* → **Add key**.
3. **[Server]** pakai kunci itu & ganti alamat repo ke SSH:
   ```bash
   cat >> ~/.ssh/config <<'CFG'
   Host github.com
     IdentityFile ~/.ssh/karyapay_deploy
     IdentitiesOnly yes
   CFG
   chmod 600 ~/.ssh/config
   ssh -T git@github.com    # "Hi paseksatrya12/karya-pay! You've successfully authenticated…"
   git -C /www/wwwroot/karyapay/repo remote set-url origin git@github.com:paseksatrya12/karya-pay.git
   ```
</details>

---

## I. Deploy pertama

**[Server]**
```bash
bash /www/wwwroot/karyapay/repo/deploy/deploy-frontend.sh main
```
Pertama kali butuh 1–3 menit (mengunduh dependensi). Contoh hasil yang benar:
```
→ Mengambil kode terbaru (branch main)
→ Install dependensi & build (7bd5223)
...
✓ built in 2.31s
→ Menyiapkan rilis 20261021-103000
→ Menghapus rilis lama (menyisakan 5 terbaru)
✓ Live: rilis 20261021-103000 (commit 7bd5223)
```
Periksa hasilnya:
```bash
ls -l /www/wwwroot/karyapay/current
# current -> /www/wwwroot/karyapay/releases/20261021-103000
cat /www/wwwroot/karyapay/current/REVISION   # 7bd5223 (commit terakhir)
ls /www/wwwroot/karyapay/current             # assets  favicon.svg  images  index.html  REVISION
```
✅ Lanjut hanya jika `current` sudah menunjuk ke folder `releases/...`.

**Buat perintah pendek** agar update berikutnya mudah:
```bash
echo "alias deploy-karyapay='bash /www/wwwroot/karyapay/repo/deploy/deploy-frontend.sh main'" >> ~/.bashrc
echo "alias rollback-karyapay='bash /www/wwwroot/karyapay/repo/deploy/rollback-frontend.sh'" >> ~/.bashrc
source ~/.bashrc
```

---

## J. Arahkan situs ke rilis

**[aaPanel]** **Website** → klik nama situs `app.domainanda.com` (atau tombol **Conf**) → tab **Site directory**:
- **Site directory**: ubah menjadi **`/www/wwwroot/karyapay/current`** → **Save**

Jika aaPanel menolak, pakai tab **Config file**: cari baris
```nginx
root /www/wwwroot/karyapay;
```
ubah menjadi
```nginx
root /www/wwwroot/karyapay/current;
```
→ **Save**.

**Uji sementara:** buka `http://app.domainanda.com` (http, belum https) di browser → halaman **login KaryaPay** harus tampil.
Coba buka `http://app.domainanda.com/dokumen` lalu tekan **F5** → kemungkinan muncul **404**. Itu normal; diperbaiki di langkah K.

---

## K. Pasang aturan Nginx

Aturan ini membuat semua alamat aplikasi (mis. `/invoice/INV-2026-001/pdf`) bisa dibuka & di-refresh, dan mengatur cache agar pengguna selalu mendapat versi terbaru.

**Cara 1 — lewat aaPanel**
1. **[Server]** tampilkan isi file:
   ```bash
   cat /www/wwwroot/karyapay/repo/deploy/nginx/karyapay.conf
   ```
2. Salin **seluruh** isinya (blok Fase 2 yang diawali `#` boleh ikut tersalin — tidak aktif).
3. **[aaPanel]** situs → **Conf** → tab **URL rewrite** → hapus isi lama → tempel → **Save**.
   aaPanel akan menolak dengan pesan error bila ada salah tempel.

**Cara 2 — lewat terminal** (lebih aman dari salah salin)
**[Server]**
```bash
cp /www/wwwroot/karyapay/repo/deploy/nginx/karyapay.conf \
   /www/server/panel/vhost/rewrite/app.domainanda.com.conf
/www/server/nginx/sbin/nginx -t && /etc/init.d/nginx reload
```
✅ Harus muncul `syntax is ok` dan `test is successful`.

**Uji:** buka lagi `http://app.domainanda.com/dokumen` → **F5** → sekarang muncul halaman login (bukan 404).

---

## L. HTTPS (SSL Let's Encrypt)

Syarat: langkah B2 sudah berhasil (DNS mengarah ke server) dan port 80 terbuka.

**[aaPanel]** situs → **Conf** → tab **SSL**:
1. Pilih **Let's Encrypt**.
2. Verifikasi: **File verification** (bawaan).
3. Centang domain `app.domainanda.com` → **Apply**. Tunggu ±1 menit.
4. Setelah sertifikat terpasang, aktifkan **Force HTTPS** (toggle di kanan atas tab SSL).

✅ Buka `http://app.domainanda.com` → otomatis pindah ke `https://` dengan ikon gembok.
Sertifikat berlaku 90 hari dan **diperpanjang otomatis** oleh aaPanel.

> Gagal? Lihat tabel masalah di bagian akhir (biasanya DNS belum menyebar, port 80 tertutup, atau Cloudflare proxied).

---

## M. Uji setelah live

### M0. Cek otomatis (paling cepat)
**[Laptop]** (Git Bash, dari folder proyek) atau **[Server]**:
```bash
bash deploy/check-live.sh https://app.domainanda.com
```
Skrip memeriksa HTTPS, akses langsung ke halaman dalam (`/dokumen`, `/invoice/.../pdf`), cache, kompresi, dan header keamanan. Setiap baris ✗ disertai petunjuk perbaikannya. Jalankan lagi setelah setiap perubahan konfigurasi.

### M1. Di browser (laptop & HP)
- [ ] `https://app.domainanda.com` → diarahkan ke halaman **Login**
- [ ] Klik **Isi Otomatis** (akun demo) → **Masuk** → Dashboard tampil
- [ ] Buka **Dokumen** → pilih invoice → **Cetak / PDF** → pratinjau lembar A4 tampil
- [ ] Tekan **F5** di halaman pratinjau → tetap tampil (bukan 404)
- [ ] **Simpan sebagai PDF** → dialog cetak terbuka, file PDF tersimpan
- [ ] Coba di HP: Chrome Android dan/atau Safari iPhone

### M2. Cek cache dari laptop
**[Laptop]** (pakai `curl.exe`, bukan `curl`, di PowerShell):
```powershell
curl.exe -sI https://app.domainanda.com/ | findstr /i "cache-control"
```
✅ `Cache-Control: no-cache, no-store, must-revalidate`

**[Server]** cari nama salah satu file aset:
```bash
ls /www/wwwroot/karyapay/current/assets | grep -m1 '\.js$'
```
**[Laptop]** (ganti `index-XXXX.js` dengan hasil di atas):
```powershell
curl.exe -sI https://app.domainanda.com/assets/index-XXXX.js | findstr /i "cache-control"
```
✅ `Cache-Control: public, max-age=31536000, immutable`

### M3. Cek kompresi
```powershell
curl.exe -sI -H "Accept-Encoding: gzip" https://app.domainanda.com/assets/index-XXXX.js | findstr /i "content-encoding"
```
✅ `Content-Encoding: gzip` (aktif bawaan di Nginx aaPanel).

🎉 **Selesai — KaryaPay sudah live.**

---

## N. Cara update & rollback

### N1. Update aplikasi
1. **[Laptop]** ubah kode → `git commit` → `git push`
2. **[Server]**
   ```bash
   deploy-karyapay
   ```
3. Pengguna mendapat versi baru saat membuka/refresh halaman. Tidak perlu restart apa pun.

### N2. Rilis baru bermasalah? Rollback
**[Server]**
```bash
rollback-karyapay --list   # tanda * = rilis yang sedang live
rollback-karyapay          # kembali 1 rilis
rollback-karyapay 20261021-103000   # kembali ke rilis tertentu
```
Rollback instan; kode di GitHub tidak berubah. Perbaiki bug, push, lalu `deploy-karyapay` lagi.

### N3. Aturan Nginx di repo berubah?
Ulangi **langkah K** (Cara 2) setelah `deploy-karyapay`.

### N4. Perawatan ringan bulanan
- **[aaPanel]** update panel bila ada versi baru
- **[Server]** `apt update && apt upgrade -y`
- Cek **[aaPanel]** situs → SSL: tanggal kedaluwarsa masih jauh (perpanjangan otomatis berjalan)
- Opsional: daftar gratis di **UptimeRobot**, pantau `https://app.domainanda.com` tiap 5 menit

---

## Masalah umum

| Gejala | Langkah | Penyebab & solusi |
| --- | --- | --- |
| `ssh: connect ... Connection timed out` | A3 | IP salah, atau port SSH ditutup firewall penyedia VPS (E2) |
| Masih ditanya password setelah pasang key | C4 | Kunci salah tempel/terpotong; cek `cat ~/.ssh/authorized_keys`, harus satu baris utuh |
| Tidak bisa buka aaPanel setelah ganti port | D | Port baru belum dibuka di firewall (E1/E2). Masuk SSH → `bt` → ganti port kembali |
| `node: command not found` / `Node.js 20.19+ … diperlukan` | F2, I | Ulangi F2; tutup & buka lagi terminal |
| `Repository not found` / diminta username GitHub saat clone atau deploy | H, I | Repo sudah tidak publik, atau alamat salah ketik. Cek `https://github.com/paseksatrya12/karya-pay` di browser dalam mode incognito; jika privat, ikuti bagian *deploy key* di langkah H |
| `Could not resolve host: github.com` | H, I | Server tidak bisa mengakses internet/DNS: `ping -c2 github.com`; cek DNS server di `/etc/resolv.conf` |
| `npm ci` gagal / `ENOSPC` | I | Disk penuh: `df -h`. Hapus file besar tak terpakai |
| Proses build terhenti `Killed` | I | RAM habis → pastikan swap aktif (C3) |
| Masih muncul halaman bawaan aaPanel ("Congratulations…") | J | Site directory belum diarahkan ke `/www/wwwroot/karyapay/current` |
| 404 saat refresh `/dokumen` | K | Aturan Nginx belum terpasang; ulangi K dan pastikan `nginx -t` sukses |
| SSL: `Verification failed` | L | DNS belum mengarah ke server (B2), port 80 tertutup, atau awan Cloudflare oranye (set abu-abu dulu) |
| `ERR_TOO_MANY_REDIRECTS` | L | Cloudflare mode *Flexible* → ganti ke **Full (strict)** |
| `http://` tidak pindah ke `https://` padahal SSL aktif (situs di belakang Cloudflare) | L | Cloudflare → SSL/TLS → **Full (strict)**, lalu Edge Certificates → **Always Use HTTPS: On** |
| Halaman putih setelah update | N1 | Tekan Ctrl+F5; jika tetap, cek M2 (index.html harus no-cache). Darurat: `rollback-karyapay` |
| Tampilan lama setelah `deploy-karyapay` | N1 | Pastikan `git push` sudah sampai GitHub; cek `cat /www/wwwroot/karyapay/current/REVISION` = commit terbaru |

---

**Berikutnya:** setelah backend Laravel dibangun, tutorial Fase 2 (PHP, MySQL, Redis, staging) dan Fase 3 (Hari H) akan ditambahkan mengikuti format yang sama.
