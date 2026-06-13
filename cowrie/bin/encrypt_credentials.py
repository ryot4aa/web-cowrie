#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Security Enhancement
#
# SPDX-License-Identifier: BSD-3-Clause

"""
Helper script to generate encrypted database credentials
Usage: python3 encrypt_credentials.py
"""

import sys
import getpass

# Add src to path
sys.path.insert(0, 'src')

from cowrie.core.encryption import CredentialEncryption


def main():
    print("=" * 60)
    print("Cowrie Database Credentials Encryption Tool")
    print("=" * 60)
    print()
    
    # Get encryption key from user
    key = getpass.getpass("Enter encryption key (leave blank for default): ").strip()
    if not key:
        key = "cowrie-default-insecure-key-change-this"
        print("Using default encryption key (NOT RECOMMENDED FOR PRODUCTION)")
    
    enc = CredentialEncryption(key)
    
    print("\nEnter credentials to encrypt (leave blank to skip):")
    
    # MySQL password
    password = getpass.getpass("MySQL Password: ").strip()
    if password:
        encrypted = enc.encrypt(password)
        print(f"\nEncrypted MySQL Password:\n  {encrypted}")
        print("\nAdd to cowrie.cfg under [output_mysql]:")
        print(f'  password = {encrypted}')
    
    # Database user (optional)
    username = input("\nDatabase Username (optional): ").strip()
    if username:
        encrypted_user = enc.encrypt(username)
        print(f"\nEncrypted Username:\n  {encrypted_user}")
    
    print("\n" + "=" * 60)
    print("IMPORTANT: Update cowrie.cfg with:")
    print(f"  [honeypot]")
    print(f"  encryption_key = {key}")
    print("=" * 60)


if __name__ == "__main__":
    main()
