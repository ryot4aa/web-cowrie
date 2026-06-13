import React, { useState, useEffect } from 'react';

// Jenis Role yang diizinkan sesuai spek RBAC Pak Diash
type UserRole = 'Dokter' | 'Pasien';

interface PatientData {
  id: number;
  nama: string;
  keluhan: string;
}

function App() {
  // 1. STATE MANAGEMENT (Autentikasi & Session)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuth') === 'true';
  });
  const [role, setRole] = useState<UserRole>(() => {
    return (sessionStorage.getItem('userRole') as UserRole) || 'Pasien';
  });

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [patientName, setPatientName] = useState('');
  const [symptom, setSymptom] = useState('');
  
  // Data Medis dari Database
  const [medicalRecords, setMedicalRecords] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Pesan Error/Validasi Keamanan
  const [secAlert, setSecAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Fetch medical records dari API saat login
  useEffect(() => {
    if (isLoggedIn) {
      fetchMedicalRecords();
    }
  }, [isLoggedIn]);

  // Fetch medical records dari database
  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/medical-records');
      const data = await response.json();
      if (data.success) {
        setMedicalRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      triggerSecurityAlert('error', 'Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  };

  // Monitor session hijacking
  useEffect(() => {
    const checkSession = () => {
      const token = sessionStorage.getItem('sessionToken');
      if (isLoggedIn && !token) {
        handleLogout();
        triggerSecurityAlert('error', 'Session Hijacking / Manipulasi Terdeteksi! Otomatis Logout.');
      }
    };
    checkSession();
  }, [isLoggedIn]);

  // 2. LOGIC PERTAHANAN KELAS APLIKASI
  
  // A. Sanitisasi Input untuk Mencegah SQL Injection & XSS (Kriteria Pak Diash)
  const sanitizeInput = (text: string): string => {
    let clean = text;
    // Deteksi indikasi SQL Injection sederhana (kata kunci SQL)
    if (/UNION|SELECT|DROP|OR\s+1=1|--/gi.test(clean)) {
      triggerSecurityAlert('error', 'Terdeteksi Serangan SQL Injection pada Form!');
      return '';
    }
    // Deteksi indikasi XSS (tag script atau atribut berbahaya)
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(clean) || /javascript:/gi.test(clean)) {
      triggerSecurityAlert('error', 'Terdeteksi Serangan Cross-Site Scripting (XSS)!');
      return '';
    }
    // Mengubah karakter HTML khusus (Escaping)
    return clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  const triggerSecurityAlert = (type: 'success' | 'error', msg: string) => {
    setSecAlert({ type, msg });
    setTimeout(() => setSecAlert(null), 5000);
  };

  // B. Proses Login Connect ke API Backend
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input kosong
    if (!username.trim() || !password.trim()) {
      triggerSecurityAlert('error', 'Username dan password wajib diisi.');
      return;
    }

    // Validasi Password Kuat
    if (password.length < 6) {
      triggerSecurityAlert('error', 'Gagal: Password lemah! Minimal harus 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        const userRole = data.user.role as UserRole;
        
        // Set session dengan data dari API
        sessionStorage.setItem('isAuth', 'true');
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('sessionToken', data.token);
        sessionStorage.setItem('userId', data.user.id);

        setIsLoggedIn(true);
        setRole(userRole);
        setUserId(data.user.id);
        setUsername('');
        setPassword('');
        triggerSecurityAlert('success', `Login berhasil sebagai ${userRole}. Token digenerate.`);
      } else {
        triggerSecurityAlert('error', data.error || 'Login gagal!');
      }
    } catch (error) {
      console.error('Login error:', error);
      triggerSecurityAlert('error', 'Gagal connect ke server. Pastikan backend sedang running.');
    } finally {
      setLoading(false);
    }
  };

  // C. Proses Logout (Clearing Session)
  const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    triggerSecurityAlert('success', 'Session dihapus. Anda telah logout.');
  };

  // D. Pengisian Data Medis Baru ke Database (Proteksi Input Layer)
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jalankan fungsi filter sanitisasi
    const cleanName = sanitizeInput(patientName);
    const cleanSymptom = sanitizeInput(symptom);

    // Jika terindikasi serangan (fungsi sanitisasi menghasilkan string kosong)
    if (!cleanName || !cleanSymptom) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: cleanName, keluhan: cleanSymptom })
      });

      const data = await response.json();

      if (data.success) {
        setMedicalRecords([...medicalRecords, data.data]);
        setPatientName('');
        setSymptom('');
        triggerSecurityAlert('success', 'Data rekam medis berhasil disimpan ke database (Tersanitisasi).');
      } else {
        triggerSecurityAlert('error', data.error || 'Gagal menyimpan data.');
      }
    } catch (error) {
      console.error('Add record error:', error);
      triggerSecurityAlert('error', 'Gagal connect ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      
      {/* GLOBAL NOTIFIKASI KEAMANAN (Sangat berguna saat demo Live Testing lawan Red Team) */}
      {secAlert && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl border ${
          secAlert.type === 'error' ? 'bg-red-950 border-red-500 text-red-200' : 'bg-emerald-950 border-emerald-500 text-emerald-200'
        } z-50 animate-bounce`}>
          <div className="font-bold flex items-center gap-2">
            {secAlert.type === 'error' ? '⚠️ SECURITY LOG ALERT' : '✅ SECURE OPERATIONS'}
          </div>
          <p className="text-sm mt-1">{secAlert.msg}</p>
        </div>
      )}

      <div className="w-full max-w-4xl bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Sistem Rekam Medis SehatItenas</h1>
            <p className="text-emerald-100 text-xs mt-1">Application Layer Protected Environment</p>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-slate-900 bg-opacity-40 rounded-full text-xs font-semibold text-emerald-200">
                Role: {role}
              </span>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all">
                Log Out
              </button>
            </div>
          )}
        </header>

        {/* CONTAINER UTAMA */}
        <div className="p-8">
          {!isLoggedIn ? (
            /* --- SCREEN 1: HALAMAN LOGIN SECURITY --- */
            <div className="max-w-md mx-auto py-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-200">Autentikasi Gateway</h2>
                <p className="text-slate-400 text-xs mt-1">Gunakan kata "dokter" di username untuk mendapatkan hak akses Dokter</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: dr_ahmad / pasien_budi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 transition-all"
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-all text-sm mt-2">
                  Masuk Ke Sistem (Secure Session)
                </button>
              </form>
            </div>
          ) : (
            /* --- SCREEN 2: DASHBOARD AKTIF (DEMO RBAC & VALIDASI INPUT) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Kiri: Form Input Data - Hanya untuk Role 'Dokter' (Implementasi RBAC) */}
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">Input Rekam Medis Baru</h3>
                {role === 'Dokter' ? (
                  <form onSubmit={handleAddRecord} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Nama Pasien</label>
                      <input 
                        type="text" 
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Masukkan nama..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Diagnosa / Keluhan</label>
                      <textarea 
                        value={symptom}
                        onChange={(e) => setSymptom(e.target.value)}
                        placeholder="Masukkan keluhan medis..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-200"
                      />
                    </div>
                    <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md">
                      Simpan Rekam Medis Pasien
                    </button>
                  </form>
                ) : (
                  /* Block Akses Jika Role adalah Pasien (Demo Proteksi Hak Akses ke Dosen) */
                  <div className="bg-slate-900/50 border border-dashed border-red-900/60 p-6 rounded-2xl text-center">
                    <p className="text-red-400 text-sm font-semibold">⛔ Hak Akses Terbatas (RBAC)</p>
                    <p className="text-slate-400 text-xs mt-2">
                      Akun Anda terdaftar sebagai **Pasien**. Form manipulasi data rekam medis hanya diizinkan untuk staff medis ber-role **Dokter**.
                    </p>
                  </div>
                )}
              </div>

              {/* Kanan: View Data Terenkripsi & Aman */}
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">Data Pasien Terdaftar</h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-slate-900 border border-slate-700 rounded-xl">
                      <div className="text-sm font-bold text-emerald-400">{record.nama}</div>
                      <p className="text-slate-300 text-xs mt-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono">
                        Diagnosa: {record.keluhan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;