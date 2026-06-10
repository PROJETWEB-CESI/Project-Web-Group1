#!/bin/sh
set -e

echo "==> Running Python seed..."
python seed.py

echo "==> Running extra students seed..."
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -f /seed/seed_extra_students.sql

echo "==> All seeds complete."
