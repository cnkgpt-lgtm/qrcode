# Barcode Studio

Aplikasi pembuat **QR Code** & **barcode 1D** siap cetak — satu file HTML, 100% berjalan di browser, tanpa server, bisa dibuka offline.

## Fitur

- **QR Code** — teks/URL, preset WhatsApp & WiFi, koreksi error L/M/Q/H, warna kustom, zona tenang, ukuran ekspor 512/1024/2048 px
- **Upload logo** — logo di tengah QR (drag & drop), atur ukuran, bantalan putih, lengkung sudut, hapus background putih pada logo
- **Hapus background** — latar transparan (PNG) untuk QR maupun barcode, cocok ditempel ke desain kemasan
- **Barcode 1D** — CODE128/A/B/C, EAN-13/8, UPC-A/E, CODE39, ITF-14, MSI, Pharmacode, Codabar
- **Download PNG** resolusi penuh & **SVG** vektor
- **Mode Batch** — banyak nilai sekaligus → pratinjau grid → unduh sebagai ZIP

## Cara pakai

Buka `index.html` di browser. Atau deploy ke hosting statis apa pun (Vercel, Netlify, GitHub Pages) — tidak perlu build.

## Teknis

Tanpa framework & tanpa build step. Library di-inline langsung ke file HTML:

- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) — QR Code
- [JsBarcode](https://github.com/lindell/JsBarcode) (MIT) — barcode 1D
- [JSZip](https://github.com/Stuk/jszip) (MIT) — arsip ZIP mode batch
