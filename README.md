# Accank Barcode Studio

Aplikasi pembuat **QR Code** & **barcode 1D** siap cetak — dengan **akun pengguna**,
**riwayat tersimpan**, dan **logo tersimpan**.

## Fitur

- **QR Code** — teks/URL, preset WhatsApp & WiFi, koreksi error L/M/Q/H, warna kustom, zona tenang, ukuran ekspor 512/1024/2048 px
- **Upload logo** — logo di tengah QR (drag & drop), atur ukuran, bantalan putih, lengkung sudut, hapus background putih pada logo
- **Hapus background** — latar transparan (PNG) untuk QR maupun barcode, cocok ditempel ke desain kemasan
- **Barcode 1D** — CODE128/A/B/C, EAN-13/8, UPC-A/E, CODE39, ITF-14, MSI, Pharmacode, Codabar
- **Download PNG** resolusi penuh & **SVG** vektor
- **Mode Batch** — banyak nilai sekaligus → pratinjau grid → unduh sebagai ZIP
- **Akun** — daftar & masuk (email + kata sandi)
- **Riwayat per pengguna** — simpan hasil ke akun, muat lagi kapan pun, hapus
- **Logo tersimpan** — simpan logo ke akun, pakai ulang tanpa upload lagi

## Teknologi

Next.js 15 + React 19 + Tailwind CSS v4 + Prisma (PostgreSQL/Neon) + NextAuth v5.
Proses gambar 100% di browser (client-side):

- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT)
- [JsBarcode](https://github.com/lindell/JsBarcode) (MIT)
- [JSZip](https://github.com/Stuk/jszip) (MIT)

## Env yang dibutuhkan

```
DATABASE_URL="postgresql://... (pooler)"
DIRECT_URL="postgresql://... (direct, tanpa pooler)"
NEXTAUTH_SECRET="<random 32+ karakter>"
```

Jalankan migrasi: `npx prisma migrate deploy`

## Deploy

Terhubung ke Vercel (project `qrcode`) — setiap push ke `main` otomatis deploy ke production.

> Status: live.
