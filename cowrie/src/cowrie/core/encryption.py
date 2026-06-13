# SPDX-FileCopyrightText: 2026 Security Enhancement
#
# SPDX-License-Identifier: BSD-3-Clause

"""
Encryption utilities for protecting sensitive data at rest
"""

from __future__ import annotations

import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from twisted.python import log

from cowrie.core.config import CowrieConfig


class CredentialEncryption:
    """
    Encrypt/decrypt sensitive credentials using Fernet (symmetric encryption)
    """

    def __init__(self, master_key: str = None):
        """
        Initialize encryption with master key
        
        @param master_key: Master encryption key (if None, uses config value)
        """
        if master_key is None:
            try:
                master_key = CowrieConfig.get("honeypot", "encryption_key", fallback="")
            except Exception:
                master_key = ""

        if not master_key:
            log.msg("WARNING: No encryption key configured. Using default (NOT RECOMMENDED FOR PRODUCTION)")
            master_key = "cowrie-default-insecure-key-change-this"

        # Derive a proper key from the master key using PBKDF2
        salt = b'cowrie-salt-2026'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key_bytes = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        self.cipher = Fernet(key_bytes)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext credential
        
        @param plaintext: Plain text to encrypt
        @return: Base64 encoded encrypted value
        """
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            log.msg(f"Encryption error: {e}")
            return plaintext

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt credential
        
        @param ciphertext: Encrypted text (base64 encoded)
        @return: Decrypted plaintext
        """
        try:
            encrypted_bytes = base64.b64decode(ciphertext)
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            log.msg(f"Decryption error: {e}, returning as-is")
            return ciphertext


# Global encryption instance
_encryption_instance = None


def get_encryption() -> CredentialEncryption:
    """
    Get or create global encryption instance
    """
    global _encryption_instance
    if _encryption_instance is None:
        _encryption_instance = CredentialEncryption()
    return _encryption_instance


def encrypt_credential(value: str) -> str:
    """
    Encrypt a credential value
    """
    return get_encryption().encrypt(value)


def decrypt_credential(value: str) -> str:
    """
    Decrypt a credential value
    """
    return get_encryption().decrypt(value)
