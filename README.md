# Sistem Rekam Medis dengan Cowrie Honeypot

Proyek ini adalah sistem rekam medis dengan keamanan berlapis yang terintegrasi dengan Cowrie Honeypot dan Wazuh SIEM.

## Deskripsi Project

Sistem ini menggabungkan aplikasi frontend React + Vite, backend API Node.js + Express, dan honeypot Cowrie untuk mendeteksi ancaman. Cowrie diintegrasikan dengan Wazuh SIEM untuk monitoring keamanan dan analisis insiden.

## Struktur Project

- `src/` : kode frontend React + Vite
- `backend/` : kode API backend Node.js + Express
- `cowrie/` : honeypot Cowrie untuk menangkap dan mencatat aktivitas penyerang

## Requirement

- Node.js
- Python
- MySQL atau MariaDB
- Wazuh Agent

## Cara Instalasi dan Menjalankan

1. Install dependencies frontend:
   ```bash
   npm install
   ```

2. Install dependencies backend:
   ```bash
   cd backend && npm install
   ```

3. Konfigurasi file environment di folder `backend/`.

4. Jalankan backend:
   ```bash
   cd backend
   node server.js
   ```

5. Jalankan frontend:
   ```bash
   npm run dev
   ```

6. Jalankan Cowrie:
   ```bash
   cd cowrie
   ./bin/cowrie start
   ```

   atau jika menggunakan twistd:
   ```bash
   cd cowrie
   twistd -n cowrie
   ```

## Fitur Keamanan

- Password hashing
- JWT authentication
- WAF (Web Application Firewall)
- RBAC (Role-Based Access Control)
- Honeypot Cowrie terintegrasi untuk deteksi serangan
- Integrasi dengan Wazuh SIEM untuk monitoring dan alerting

## Konfigurasi Environment

Buat file konfigurasi environment di folder `backend/` dengan variabel minimal berikut:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
WAZUH_SERVER=http://localhost:55000
WAZUH_AGENT_ID=agent_id
```

Sesuaikan variabel tersebut dengan lingkungan dan kredensial Anda.

## Catatan Keamanan

- Jangan pernah meng-push file konfigurasi environment yang berisi kredensial ke GitHub.
- Pastikan file sensitif, kunci privat, dan kredensial tidak disimpan dalam repository.
- Gunakan mekanisme secret management atau environment variables pada deployment.
