.. SPDX-FileCopyrightText: 2014 Upi Tamminen <desaster@gmail.com>
.. SPDX-FileCopyrightText: 2014-2025 Michel Oosterhof <michel@oosterhof.net>
..
.. SPDX-License-Identifier: BSD-3-Clause

Cowrie
######

Apa itu Cowrie
*****************************************

Cowrie adalah honeypot SSH dan Telnet dengan interaksi menengah hingga tinggi
yang dirancang untuk mencatat serangan brute force dan interaksi shell
yang dilakukan oleh penyerang. Dalam mode interaksi menengah (shell), ia
meniru sistem UNIX menggunakan Python, sedangkan dalam mode interaksi tinggi (proxy)
Cowrie berfungsi sebagai proxy SSH dan Telnet untuk mengamati perilaku penyerang
ke sistem lain. Dalam mode LLM, Cowrie menggunakan model bahasa besar untuk
menghasilkan respons dinamis terhadap perintah penyerang.

`Cowrie <http://github.com/cowrie/cowrie/>`_ dipelihara oleh Michel Oosterhof.

Dokumentasi
****************************************

Dokumentasi dapat ditemukan `di sini <https://docs.cowrie.org/en/latest/index.html>`_.

Slack
*****************************************

Anda dapat bergabung dengan komunitas Cowrie melalui `Slack workspace <https://www.cowrie.org/slack/>`_.

Fitur
*****************************************

* Pilih menjalankan sebagai shell yang diemulasikan (default):
   * Sistem berkas palsu dengan kemampuan menambah/menghapus file. Sistem berkas
     palsu lengkap yang menyerupai instalasi Debian 5.0 sudah disertakan
   * Kemungkinan menambahkan konten file palsu agar penyerang bisa `cat` file
     seperti `/etc/passwd`. Hanya konten file minimal yang disertakan
   * Cowrie menyimpan file yang diunduh dengan wget/curl atau diunggah melalui
     SFTP dan scp untuk pemeriksaan selanjutnya

* Atau proxy SSH dan Telnet ke sistem lain
   * Jalankan sebagai proxy telnet dan ssh murni dengan pemantauan
   * Atau biarkan Cowrie mengelola sekelompok server emulasi QEMU untuk
     menyediakan sistem yang bisa login

* Atau gunakan backend LLM (eksperimental):
   * Gunakan model bahasa besar (misalnya OpenAI GPT) untuk menghasilkan respons
     shell yang realistis secara dinamis
   * Menangani perintah apa pun tanpa respons yang telah ditentukan sebelumnya
   * Menjaga konteks percakapan untuk sesi yang konsisten

Untuk kedua mode ini:

* Log sesi disimpan dalam format `UML Compatible <http://user-mode-linux.sourceforge.net/>`_
  untuk replay yang mudah menggunakan utilitas `playlog`.
* Dukungan SFTP dan SCP untuk unggahan file
* Dukungan perintah SSH exec
* Pencatatan upaya koneksi direct-tcp (proxy ssh)
* Meneruskan koneksi SMTP ke SMTP Honeypot (misalnya `mailoney <https://github.com/awhitehatter/mailoney>`_)
* Logging JSON untuk pemrosesan yang mudah dalam solusi manajemen log

Instalasi
*****************************************

Saat ini ada tiga cara untuk memasang Cowrie: `git clone`, `Docker`, dan `pip`.
`Docker` adalah cara termudah untuk mencoba dan menjalankannya, tetapi untuk
mengonfigurasi dan memodifikasi, Anda memerlukan pemahaman yang baik tentang
kontainer dan volume.
`git clone` direkomendasikan jika Anda ingin mengubah konfigurasi honeypot.
Mode `pip` masih dalam pengembangan.

Docker
*****************************************

`Docker images <https://hub.docker.com/repository/docker/cowrie/cowrie>`_ tersedia di Docker Hub.

* Untuk mulai cepat dan mencoba Cowrie, jalankan::

    $ docker run -p 2222:2222 cowrie/cowrie:latest
    $ ssh -p 2222 root@localhost

* Untuk membuatnya secara lokal, jalankan::

    $ make docker-build

PyPI
*****************************************

`Cowrie tersedia di PyPI <https://pypi.org/project/cowrie>`_, untuk memasangnya jalankan::

    $ pip install cowrie
    $ twistd cowrie

Jika diinstal dengan cara ini, perilakunya akan berbeda dari mengunduh seluruh direktori.

Ini masih dalam versi beta dan mungkin tidak berjalan seperti yang diharapkan,
metode `git clone` atau `docker` lebih disarankan.

Persyaratan
*****************************************

Perangkat lunak yang diperlukan untuk menjalankan secara lokal:

* Python 3.10+
* python-virtualenv

File yang penting:
*****************************************

* `etc/cowrie.cfg` - file konfigurasi Cowrie (milik operator). Dibuat oleh ``cowrie init``.
* `src/cowrie/data/etc/cowrie.cfg.dist <https://github.com/cowrie/cowrie/blob/main/src/cowrie/data/etc/cowrie.cfg.dist>`_ - default bawaan, edit ``etc/cowrie.cfg`` Anda
  sebagai gantinya
* `etc/userdb.txt` - kredensial untuk mengakses honeypot
* `src/cowrie/data/fs.pickle` - sistem berkas palsu; memuat metadata (path, uid, gid, size, mode)
  dan konten tersemat (``A_CONTENTS`` bytes) untuk file kecil yang sering
  di-cat oleh penyerang. Edit lewat ``fsctl``; bangun ulang lewat
  ``make build-fs-pickle``.
* `src/cowrie/data/txtcmds/` - keluaran untuk perintah palsu sederhana
* `var/log/cowrie/cowrie.json` - keluaran audit dalam format JSON
* `var/log/cowrie/cowrie.log` - keluaran log/debug
* `var/lib/cowrie/tty/` - log sesi, dapat direplay dengan utilitas `playlog`.
* `var/lib/cowrie/downloads/` - file yang ditransfer dari penyerang ke honeypot disimpan di sini

Perintah
******************************************
* `cowrie` - mulai, hentikan dan restart Cowrie
* `fsctl` - ubah sistem berkas palsu
* `createfs` - buat sistem berkas palsu Anda sendiri
* `playlog` - utilitas untuk memutar ulang log sesi
* `asciinema` - ubah log Cowrie menjadi file asciinema

Kontributor
***************

Banyak orang telah berkontribusi pada Cowrie selama bertahun-tahun. Terima kasih khusus untuk:

* Upi Tamminen (desaster) atas semua karyanya mengembangkan Kippo yang menjadi dasar Cowrie
* Dave Germiquet (davegermiquet) untuk dukungan TFTP, unit test, dan penanganan proses baru
* Olivier Bilodeau (obilodeau) untuk dukungan Telnet
* Ivan Korolev (fe7ch) untuk banyak peningkatan selama bertahun-tahun.
* Florian Pelgrim (craneworks) untuk kerja pembersihan kode dan Docker.
* Guilherme Borges (sgtpepperpt) untuk proxy SSH dan telnet (GSoC 2019)
* Dan banyak lainnya.
