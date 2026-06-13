# SPDX-FileCopyrightText: 2026 Security Enhancement
#
# SPDX-License-Identifier: BSD-3-Clause

"""
Simple IDS/IPS - Detects malicious command patterns and activities
"""

from __future__ import annotations

import re
from typing import Dict, List, Tuple
from twisted.python import log

from cowrie.core.config import CowrieConfig


class SimpleIDS:
    """
    Simple Intrusion Detection System for detecting malicious command patterns
    """

    def __init__(self):
        """
        Initialize IDS with pattern rules
        """
        self.enabled = CowrieConfig.getboolean("honeypot", "simple_ids_enabled", fallback=True)
        
        # Pattern rules: (pattern, severity, description)
        self.rules: List[Tuple[re.Pattern, str, str]] = [
            # SQL Injection patterns
            (re.compile(rb"('\s*(or|and)\s*'|(\d+)\s*(or|and)\s*(\d+)=(\d+))", re.IGNORECASE), 
             "CRITICAL", "SQL Injection attempt detected"),
            
            # SQL dangerous commands
            (re.compile(rb"(DROP\s+(TABLE|DATABASE)|DELETE\s+FROM|TRUNCATE|ALTER\s+TABLE|EXEC|EXECUTE)", re.IGNORECASE), 
             "CRITICAL", "Dangerous SQL command detected"),
            
            # Command injection patterns
            (re.compile(rb"(;|\||&|\$\(|`|&&|\|\|)\s*(cat|ls|rm|dd|nc|bash|sh|cmd|powershell)", re.IGNORECASE), 
             "CRITICAL", "Command injection attempt detected"),
            
            # RCE/Shell commands
            (re.compile(rb"(wget|curl|nc|bash|sh|bash\s+-i|sh\s+-i|/bin/(bash|sh|nc)|cmd\.exe)", re.IGNORECASE), 
             "HIGH", "Reverse shell/RCE command detected"),
            
            # Privilege escalation
            (re.compile(rb"(sudo\s+-l|sudo\s+su|su\s+-|chmod\s+777|chown\s+root)", re.IGNORECASE), 
             "MEDIUM", "Privilege escalation attempt detected"),
            
            # Directory traversal
            (re.compile(rb"(\.\./|\.\.\\|%2e%2e)", re.IGNORECASE), 
             "MEDIUM", "Directory traversal attempt detected"),
            
            # Null byte injection
            (re.compile(rb"%00|\\x00"), 
             "MEDIUM", "Null byte injection attempt detected"),
            
            # XXE/XML injection
            (re.compile(rb"(<!ENTITY|SYSTEM\s*\"?file|xdtd|DTD)", re.IGNORECASE), 
             "MEDIUM", "XXE injection attempt detected"),
            
            # Script uploads
            (re.compile(rb"(\.(php|asp|aspx|jsp|py|pl|rb|sh|exe))", re.IGNORECASE), 
             "MEDIUM", "Suspicious script file detected"),
        ]
        
        # Alert tracking to prevent spam
        self.alerts: Dict[str, int] = {}
        self.alert_threshold = 10  # Max alerts per session

    def check_command(self, command: bytes, session_id: str = None, username: str = None) -> Tuple[bool, str, str]:
        """
        Check if command contains malicious patterns
        
        @param command: Command to check (bytes)
        @param session_id: Session identifier for tracking
        @param username: Username for logging
        @return: (is_malicious, severity, description)
        """
        if not self.enabled or not command:
            return False, "", ""

        for pattern, severity, description in self.rules:
            if pattern.search(command):
                self._log_alert(session_id, username, command, severity, description)
                return True, severity, description

        return False, "", ""

    def _log_alert(self, session_id: str, username: str, command: bytes, 
                   severity: str, description: str) -> None:
        """
        Log IDS alert
        """
        if session_id is None:
            session_id = "unknown"
        if username is None:
            username = "unknown"

        # Limit alerts per session
        if session_id not in self.alerts:
            self.alerts[session_id] = 0
        
        self.alerts[session_id] += 1

        if self.alerts[session_id] <= self.alert_threshold:
            try:
                cmd_str = command.decode('utf-8', errors='ignore')[:100]
            except Exception:
                cmd_str = str(command)[:100]

            log.msg(
                eventid="cowrie.ids.alert",
                format="IDS Alert [%(severity)s] - %(description)s | User: %(username)s | Command: %(command)s",
                severity=severity,
                description=description,
                username=username,
                command=cmd_str,
                session=session_id,
            )

    def check_input(self, user_input: bytes, input_type: str = "command", 
                   session_id: str = None, username: str = None) -> Tuple[bool, str, str]:
        """
        Generic input checking (command, argument, etc)
        
        @param user_input: User input to check
        @param input_type: Type of input (command, argument, etc)
        @param session_id: Session identifier
        @param username: Username for logging
        @return: (is_malicious, severity, description)
        """
        return self.check_command(user_input, session_id, username)

    def reset_session(self, session_id: str) -> None:
        """
        Reset alert counter for a session
        """
        if session_id in self.alerts:
            del self.alerts[session_id]


# Global IDS instance
_ids_instance = None


def get_ids() -> SimpleIDS:
    """
    Get or create global IDS instance
    """
    global _ids_instance
    if _ids_instance is None:
        _ids_instance = SimpleIDS()
    return _ids_instance


def check_malicious(command: bytes, session_id: str = None, username: str = None) -> bool:
    """
    Quick check if command is malicious
    """
    is_malicious, _, _ = get_ids().check_command(command, session_id, username)
    return is_malicious
