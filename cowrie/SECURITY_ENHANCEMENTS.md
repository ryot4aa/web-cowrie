# Fitur Keamanan Baru - Cowrie

## 1. Enkripsi Database Credentials (at-rest)

**Deskripsi:**
Modul encryption memungkinkan Anda mengenkripsi kredensial database yang sensitif di file konfigurasi menggunakan Fernet symmetric encryption dengan PBKDF2 key derivation.

**File:**
- `src/cowrie/core/encryption.py` - Module enkripsi utama
- `bin/encrypt_credentials.py` - Helper script untuk generate encrypted credentials

**Cara Penggunaan:**

1. Generate encrypted credentials:
```bash
python3 bin/encrypt_credentials.py
```

2. Update `etc/cowrie.cfg`:
```ini
[honeypot]
encryption_key = your-strong-key-here

[output_mysql]
password = <encrypted_password_here>
```

3. Module akan otomatis decrypt saat runtime

**Keamanan:**
- Menggunakan Fernet (symmetric encryption)
- PBKDF2 dengan 100.000 iterations
- SHA256 hash
- Base64 encoding untuk encrypted values

---

## 2. Simple IDS - Malicious Command Detection

**Deskripsi:**
Intrusion Detection System sederhana yang mendeteksi pola command berbahaya secara real-time, termasuk:
- SQL Injection patterns
- Command injection attempts
- Remote code execution (RCE) commands
- Privilege escalation attempts
- Directory traversal
- Null byte injection
- XXE injection
- Suspicious script uploads

**File:**
- `src/cowrie/core/ids.py` - Module IDS utama
- Terintegrasi dengan: `src/cowrie/shell/honeypot.py`

**Cara Penggunaan:**

1. Enable di `etc/cowrie.cfg`:
```ini
[honeypot]
simple_ids_enabled = true
```

2. IDS otomatis memeriksa setiap command input
3. Alert dicatat dengan event ID: `cowrie.ids.alert`

**Contoh Alert:**
```
IDS Alert [CRITICAL] - SQL Injection attempt detected | 
User: attacker | 
Command: SELECT * FROM users WHERE id=1' OR '1'='1
```

**Fitur:**
- Pattern matching dengan regex
- Per-session alert tracking
- Alert throttling (max 10 alerts per session)
- Severity levels: CRITICAL, HIGH, MEDIUM
- Terintegrasi dengan Cowrie logging system

---

## Integrasi

Kedua fitur sudah terintegrasi dengan:
- ✅ Configuration system (`CowrieConfig`)
- ✅ Logging system (Twisted logging framework)
- ✅ Command execution pipeline
- ✅ Output modules (dapat decrypt credentials untuk database connections)

## Testing

Test encryption:
```python
from cowrie.core.encryption import encrypt_credential, decrypt_credential

encrypted = encrypt_credential("my_password")
decrypted = decrypt_credential(encrypted)
assert decrypted == "my_password"
```

Test IDS:
```python
from cowrie.core.ids import get_ids

ids = get_ids()
is_malicious, severity, desc = ids.check_command(
    b"rm -rf /; DROP TABLE users;", 
    "session123", 
    "attacker"
)
# Returns: (True, 'CRITICAL', 'SQL Injection attempt detected')
```
