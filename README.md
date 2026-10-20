# KaryaPay

Aplikasi invoice & penawaran untuk freelancer dan penyedia jasa, dibangun dengan React + Vite + Tailwind CSS v3 berdasarkan desain di folder [`design/`](design/).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di dist/
npm run preview
```

## Halaman

| Route | Halaman |
| --- | --- |
| `/` | Dashboard |
| `/login`, `/register`, `/lupa-kata-sandi`, `/verifikasi-otp` | Autentikasi |
| `/dokumen` | Daftar semua invoice & penawaran |
| `/invoice/baru` (`?type=penawaran`, `?client=<id>`) | Buat invoice / surat penawaran |
| `/invoice/:id` | Detail dokumen |
| `/invoice/:id/edit` | Edit dokumen (klien, tanggal, rincian & nominal) |
| `/invoice/:id/pdf` | Pratinjau cetak, simpan PDF & cetak |
| `/klien` | Manajemen klien |
| `/master/jasa` | Master jasa (harga default per satuan) |
| `/master/item` | Master item & sparepart (harga, merek, stok) |
| `/pengaturan/tanda-tangan` | Profil usaha, kop, rekening, tanda tangan & menu data master |
| `/pengaturan/template` | Template, warna, ukuran kertas cetak |

## Alur dokumen

1. Isi master jasa dan item/sparepart beserta harga default.
2. Saat membuat invoice/penawaran, pilih baris dari master (atau isi manual). Nama, keterangan, qty, satuan, dan **harga satuan bisa diedit per dokumen** tanpa mengubah master.
3. Diskon nominal dan PPN (11% / 12% / custom) dihitung otomatis; total ikut di detail, cetak, dan terbilang.
4. Penawaran bisa dijadikan invoice dari halaman detail.
5. Cetak resmi A4 / Letter (potret atau lanskap) atau nota thermal 80mm. "Simpan sebagai PDF" memakai dialog cetak browser, jadi teks PDF tetap tajam dan bisa dicari.

## Struktur

- `src/store/` — sumber data bersama (`DataProvider`, data contoh, aturan perhitungan dokumen, pengaturan template). Disimpan di `localStorage` (`karyapay:data`).
- `src/components/PrintDocument.jsx` + `.css` — lembar cetak resmi (kop surat, tabel jasa & sparepart, terbilang, rekening, tanda tangan) dan nota thermal.
- `src/pages/` — satu komponen per layar.
- `tailwind.config.js` — token desain dari `design/karyapay/DESIGN.md`.

Desainnya mobile-first; di layar lebar aplikasi tampil sebagai kolom selebar ponsel (maks. 480px). Belum ada backend: semua data tersimpan di browser.
