#!/bin/bash
set -e

# Production-ready startup script for backend
# This script handles database migrations and starts the application
# Environment variables are loaded from backend/.env via docker-compose env_file

echo "Starting Extractable Backend..."

# Extract database connection details from DATABASE_URL or use individual vars
if [ -n "$DATABASE_URL" ]; then
    # Parse DATABASE_URL if provided
    DB_HOST="${POSTGRES_HOST:-postgres}"
else
    # Construct from individual variables
    DB_HOST="${POSTGRES_HOST:-postgres}"
fi

DB_USER="${POSTGRES_USER:-extractable_user}"
DB_NAME="${POSTGRES_DB:-extractable_db}"

# Wait for PostgreSQL to be ready (with timeout)
echo "Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

until pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo "ERROR: PostgreSQL failed to become ready after $MAX_ATTEMPTS attempts"
        exit 1
    fi
    echo "PostgreSQL is unavailable - sleeping (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || {
    echo "WARNING: Migration failed, continuing anyway..."
}

# Start the application
echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

