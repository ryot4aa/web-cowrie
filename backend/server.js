import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env` });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: Get DB Connection
async function getConnection() {
  return pool.getConnection();
}

// ===================== ENDPOINTS =====================

// 1. LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const conn = await getConnection();
    const [users] = await conn.query('SELECT * FROM user WHERE username = ?', [username]);
    conn.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const user = users[0];
    
    // Simple password check (plain text in this demo)
    const passwordMatch = password === user.password;

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Return user data with token
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token: `token_${user.id}_${Date.now()}` // Simple token for demo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. GET ALL MEDICAL RECORDS
app.get('/api/medical-records', async (req, res) => {
  try {
    const conn = await getConnection();
    const [records] = await conn.query('SELECT * FROM medical_records ORDER BY created_at DESC');
    conn.release();

    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. POST NEW MEDICAL RECORD
app.post('/api/medical-records', async (req, res) => {
  try {
    const { nama, keluhan } = req.body;

    if (!nama || !keluhan) {
      return res.status(400).json({ error: 'Nama dan keluhan wajib diisi' });
    }

    // Simple input sanitization
    if (/UNION|SELECT|DROP|INSERT|DELETE|UPDATE/gi.test(nama) || 
        /UNION|SELECT|DROP|INSERT|DELETE|UPDATE/gi.test(keluhan)) {
      return res.status(400).json({ error: 'Input mengandung karakter terlarang (SQL Injection terdeteksi)' });
    }

    const conn = await getConnection();
    await conn.query('INSERT INTO medical_records (nama, keluhan) VALUES (?, ?)', [nama, keluhan]);
    
    // Get the newly inserted record
    const [newRecords] = await conn.query('SELECT * FROM medical_records ORDER BY created_at DESC LIMIT 1');
    conn.release();

    return res.status(201).json({
      success: true,
      message: 'Data rekam medis berhasil disimpan',
      data: newRecords[0]
    });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// 5. GET ALL USERS (for demo/testing only - should be removed in production)
app.get('/api/users', async (req, res) => {
  try {
    const conn = await getConnection();
    const [users] = await conn.query('SELECT id, username, role FROM user');
    conn.release();

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📍 Login: POST http://localhost:${PORT}/api/login`);
  console.log(`📍 Get Records: GET http://localhost:${PORT}/api/medical-records`);
  console.log(`📍 Create Record: POST http://localhost:${PORT}/api/medical-records`);
});
