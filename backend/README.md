# Backend API - Web Kesehatan

Minimal Node.js + Express backend untuk aplikasi web-kesehatan.

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Pastikan MySQL berjalan** (Laragon MySQL)

3. **Jalankan server:**
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### 1. Login
```
POST /api/login
Content-Type: application/json

{
  "username": "dr_ahmad",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "dr_ahmad",
    "role": "Dokter"
  },
  "token": "token_1_1718090000000"
}
```

### 2. Get Medical Records
```
GET /api/medical-records

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Budi Santoso",
      "keluhan": "Demam tinggi dan gejala flu",
      "created_at": "2026-06-11T13:55:32.000Z"
    }
  ]
}
```

### 3. Create Medical Record
```
POST /api/medical-records
Content-Type: application/json

{
  "nama": "Pasien Baru",
  "keluhan": "Keluhan kesehatan"
}

Response:
{
  "success": true,
  "message": "Data rekam medis berhasil disimpan",
  "data": {
    "id": 4,
    "nama": "Pasien Baru",
    "keluhan": "Keluhan kesehatan",
    "created_at": "2026-06-11T14:00:00.000Z"
  }
}
```

### 4. Get Users (untuk testing)
```
GET /api/users

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "dr_ahmad",
      "role": "Dokter"
    }
  ]
}
```

## Test Credentials

- **Dokter:** username=`dr_ahmad`, password=`password123`
- **Pasien:** username=`pasien_budi`, password=`password123`

## Database Connection

- Host: `127.0.0.1`
- Port: `3306`
- Database: `db_web`
- User: `root`
- Password: (kosong)

Tabel:
- `user` - login credentials
- `medical_records` - data rekam medis pasien

## Security Notes

- ⚠️ Password tersimpan plain text (untuk demo saja)
- ⚠️ Input sanitasi sangat sederhana (SQL Injection detection)
- ⚠️ Tidak ada JWT atau authentication yang proper
- ✅ CORS enabled untuk frontend

## Hubungkan dengan React Frontend

Di file `src/App.tsx` atau file API client, gunakan base URL:

```typescript
const API_URL = 'http://localhost:5000/api';

// Login
await fetch(`${API_URL}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Get Records
await fetch(`${API_URL}/medical-records`);

// Create Record
await fetch(`${API_URL}/medical-records`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nama, keluhan })
});
```
