#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYSQL_SQL_FILE="$SCRIPT_DIR/docs/sql/mysql.sql"

usage() {
  cat <<EOF
Usage: $0 \
  --host HOST \
  --port PORT \
  --root-user ROOT_USER \
  --root-pass ROOT_PASSWORD \
  --db DB_NAME \
  --user DB_USER \
  --pass DB_PASSWORD

Example:
  $0 --host 127.0.0.1 --port 3306 --root-user root --root-pass secret \
    --db cowrie --user cowrie --pass cowrie_password
EOF
}

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

HOST=""
PORT="3306"
ROOT_USER=""
ROOT_PASS=""
DB_NAME="cowrie"
DB_USER="cowrie"
DB_PASS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;; 
    --port) PORT="$2"; shift 2 ;; 
    --root-user) ROOT_USER="$2"; shift 2 ;; 
    --root-pass) ROOT_PASS="$2"; shift 2 ;; 
    --db) DB_NAME="$2"; shift 2 ;; 
    --user) DB_USER="$2"; shift 2 ;; 
    --pass) DB_PASS="$2"; shift 2 ;; 
    -h|--help) usage; exit 0 ;; 
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;; 
  esac
done

if [[ -z "$HOST" || -z "$ROOT_USER" || -z "$ROOT_PASS" || -z "$DB_PASS" ]]; then
  echo "Missing required argument." >&2
  usage
  exit 1
fi

if [[ ! -f "$MYSQL_SQL_FILE" ]]; then
  echo "Cannot find schema file: $MYSQL_SQL_FILE" >&2
  exit 1
fi

export MYSQL_PWD="$ROOT_PASS"

mysql -h "$HOST" -P "$PORT" -u "$ROOT_USER" <<SQL
CREATE DATABASE IF NOT EXISTS \\`$DB_NAME\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT INSERT, SELECT, UPDATE ON \\`$DB_NAME\\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
USE \\`$DB_NAME\\`;
SOURCE "$MYSQL_SQL_FILE";
SQL

echo "Cowrie MySQL database '$DB_NAME' created and schema loaded."
