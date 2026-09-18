# Pemeriksaan portfolio — 18 September 2026

Navbar mobile gagal karena Alpine menjalankan evaluasi JavaScript yang diblokir CSP produksi. Navbar sekarang memakai JavaScript native tanpa `eval`, dengan status menu dan label aksesibilitas yang konsisten. Ruang header tetap tersedia sejak render pertama, sehingga aktivasi JavaScript tidak menggeser konten.

## Perbaikan

- Menu mendukung tap, Enter/Space, Escape, klik di luar, perpindahan halaman, dan perubahan lebar viewport. Navigasi tetap tersedia ketika JavaScript dimatikan.
- Footer, pendidikan, heading, dan halaman 404 tidak lagi menyebabkan overflow horizontal. Kontrol utama memiliki area sentuh 44 px dan indikator fokus keyboard.
- Gambar memakai ukuran responsif dan WebP; gambar di bawah layar dimuat secara lazy. Favicon dibuat sesuai ukuran penggunaan. Font lokal dipreload dengan `font-display: optional` untuk menghindari pergeseran layout akibat pergantian font.
- Canvas dekoratif yang terus melakukan render dihapus; background grid menggunakan dua gradient CSS. Animasi mengikuti preferensi reduced motion.
- Filter blog benar-benar menyembunyikan kartu, urutan heading diperbaiki, dan preview tanpa tujuan menggunakan elemen non-link. Nama link mengikuti kontennya.
- Pemutar artikel memakai range input native, tidak menunggu daftar suara tanpa batas, dapat memutar ulang setelah selesai, serta muat pada layar sempit dan landscape pendek. Tombol audio tidak ditampilkan pada browser yang tidak mendukung API. Tombol copy dapat diakses dengan keyboard dan tidak melaporkan sukses ketika penyalinan gagal.
- Tracking dimuat setelah load melalui idle callback/fallback. URL Umami diperbarui. CSP mengizinkan stylesheet Giscus pada domain yang diperlukan tanpa menambahkan `unsafe-eval`.
- Astro diperbarui ke 7.3.3 dan collection blog menggunakan loader/render API yang kompatibel. Dependency yang tidak digunakan dihapus. Output tetap berupa HTML statis dengan sitemap dan header cache untuk aset.

## Validasi

`npm run build`, `npm run check`, dan `npm test` digunakan untuk verifikasi. Build dengan `VERCEL=1` juga berhasil dan menghasilkan script Vercel Analytics/Speed Insights; build lokal tidak meminta endpoint Vercel yang tidak tersedia.

Pemeriksaan tipe menghasilkan **0 error, 0 warning**, dengan satu hint deprecation untuk `document.execCommand` yang dipertahankan hanya sebagai fallback clipboard. `npm audit` dan `npm audit --omit=dev` menghasilkan **0 vulnerability**.

Regresi mencakup **540 kombinasi halaman dan viewport**: 15 halaman × 12 lebar × Chromium, Firefox, dan WebKit. Lebar: 320, 360, 375, 390, 430, 768, 820, 1023, 1024, 1280, 1440, dan 1920 px.

Interaksi tambahan mencakup touch dengan DPR 3, keyboard, landscape, resize, fallback tanpa JavaScript, filter blog, copy kode, back-to-top, reduced motion, dan kontrol audio. Kasus pemutar juga mencakup viewport 320 × 640 dan 844 × 240. Pemeriksaan seluruh hasil HTML menemukan 264 referensi internal yang valid dan tidak menemukan ID duplikat.

Suite berjalan pada HTTPS lokal dengan CSP, compression, dan header produksi. Layanan pihak ketiga distub untuk pengujian fungsi yang konsisten; pengukuran Lighthouse menggunakan layanan asli. Suara pada pengujian kontrol audio disimulasikan, sehingga hasilnya memverifikasi logika kontrol, bukan kualitas suara perangkat.

## Lighthouse lokal

Pengukuran menggunakan Lighthouse 13.1.0, Node ARM native, Chrome ARM native, dan build produksi melalui HTTPS lokal. Mobile memakai throttling bawaan Lighthouse. Angka di bawah adalah hasil pengukuran terakhir, bukan median beberapa pengukuran.

| Halaman | Performa | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home mobile | 99 | 100 | 100 | 100 | 1,6 s | 90 ms | 0 |
| Home desktop | 100 | 100 | 100 | 100 | 0,8 s | 0 ms | 0 |
| Projects mobile | 100 | 100 | 100 | 100 | 1,6 s | 50 ms | 0 |
| About mobile | 99 | 100 | 100 | 100 | 1,5 s | 100 ms | 0 |
| Blogs mobile | 95 | 100 | 100 | 100 | 2,2 s | 220 ms | 0 |
| Artikel Composer mobile | 100 | 100 | 100 | 100 | 1,5 s | 50 ms | 0 |

Tidak ada warning pengukuran Lighthouse. Audit bfcache artikel mencatat internal error pada iframe Giscus, diklasifikasikan Lighthouse sebagai `Not actionable`; nilai best practices tetap 100.

Skor dapat berubah mengikuti CPU, jaringan, dan layanan tracking/komentar. SDK Vercel hanya aktif pada build Vercel sehingga biaya layanan tersebut tidak tercakup dalam pengukuran lokal. Pengujian browser menggunakan emulasi, bukan perangkat fisik. Performa hosting dan Core Web Vitals pengguna nyata perlu dinilai setelah deployment.

## Menjalankan ulang

Memerlukan Node.js ≥22.12, OpenSSL, dan browser Playwright:

```sh
npm install
npx playwright install chromium firefox webkit
npm run build
npm run check
npm test
npm audit
```

Screenshot dan JSON Lighthouse tersedia di `test-results/` (diabaikan Git). Implementasi regresi berada di `scripts/test-responsive.mjs`. Perubahan belum dideploy.
