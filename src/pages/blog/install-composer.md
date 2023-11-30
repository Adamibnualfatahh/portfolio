---
layout: ../../layouts/BlogPost.astro
title: Cara Install Composer
description: Panduan langkah demi langkah tentang cara menginstal Composer pada sistem Anda.
publishDate: Nov 30 2023
heroImage: ../composer.webp
imageCredit: 
author:
  name: Adam Ibnu Alfatah
showReadingTime: true
tags:
  - Composer
  - PHP
readDuration: 5
---

# <span class="text-white">Cara Install Composer</span>

## <span class="text-white">Pendahuluan</span>

Composer adalah manajer paket untuk PHP yang mempermudah pengelolaan dependensi dalam proyek PHP. Dengan Composer, Anda dapat dengan mudah mengelola library dan alat yang dibutuhkan proyek PHP Anda.

## <span class="text-white">Langkah-langkah Instalasi</span>

Berikut adalah langkah-langkah untuk menginstal Composer:

### <span class="text-white">1. Pastikan PHP Sudah Terinstal</span>

Sebelum menginstal Composer, pastikan PHP sudah terinstal di sistem Anda. Anda dapat memeriksa instalasi PHP dengan menjalankan perintah berikut di terminal atau command prompt:

```bash
php --version
```

Jika PHP sudah terinstal, Anda akan melihat versi PHP yang terinstal seperti di bawah ini:

```bash
PHP 7.4.3 (cli) (built: Oct  6 2020 15:47:56) ( NTS Visual C++ 2017 x64 )
```

Jika PHP belum terinstal, Anda dapat menginstalnya dengan mengikuti panduan instalasi PHP.

### <span class="text-white">2. Unduh Composer</span>

Anda dapat mengunduh Composer dengan menjalankan perintah berikut di terminal atau command prompt:

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
```

Perintah ini akan mengunduh Composer dan menyimpannya sebagai file composer-setup.php di direktori saat ini.

### <span class="text-white">3. Verifikasi Integritas</span>

Selanjutnya, Anda perlu memverifikasi integritas file yang diunduh. Anda dapat menggunakan perintah berikut untuk memverifikasi integritas file yang diunduh:

```bash
php -r "if (hash_file('sha384', 'composer-setup.php') === 'e0012edf3e80b6978849f5eff0d4b4e4c79ff1609dd1e613307e16318854d24ae64f26d17af3ef0bf7cfb710ca74755a') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
```

Jika file yang diunduh tidak rusak, Anda akan melihat pesan "Installer verified".

### <span class="text-white">4. Instal Composer</span>

Setelah mengunduh dan memverifikasi integritas file, Anda dapat menginstal Composer dengan menjalankan perintah berikut:

```bash
php composer-setup.php
```


Perintah ini akan menginstal Composer di direktori saat ini. Jika Anda ingin menginstal Composer di direktori lain, Anda dapat menentukan direktori tujuan dengan menjalankan perintah berikut:

```bash
php composer-setup.php --install-dir=bin
```

Anda juga dapat menentukan nama file Composer dengan menjalankan perintah berikut:

```bash
php composer-setup.php --filename=composer
```

### <span class="text-white">5. Pindahkan Composer ke Direktori Global</span>

```bash
mv composer.phar /usr/local/bin/composer
```

### <span class="text-white">6. Verifikasi Instalasi</span>

Anda dapat memeriksa instalasi Composer dengan menjalankan perintah berikut:

```bash
composer --version
```

Jika Composer berhasil diinstal, Anda akan melihat versi Composer yang terinstal seperti di bawah ini:

```bash
Composer version 2.0.8 2020-12-03 17:20:38
```

## <span class="text-white">Kesimpulan</span>

Anda telah berhasil menginstal Composer di sistem Anda. Anda sekarang dapat mengelola dependensi PHP Anda dengan mudah menggunakan Composer.

## <span class="text-white">Sumber</span>

<a href = "https://www.digitalocean.com/community/tutorials/how-to-install-and-use-composer-on-ubuntu-20-04" style="color: orangered"> Digital Ocean </a>


