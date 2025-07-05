#!/bin/bash

# Run SecureFlow locally for development
# This script sets up the local environment and starts the Flask dev server

set -e

echo "🏠 Starting SecureFlow locally..."

# Check if local requirements are installed
if ! python3 -c "import flask, psycopg2" 2>/dev/null; then
    echo "📦 Installing local development dependencies..."
    pip install -r requirements-local.txt
fi

# Set local environment
export IS_LOCAL=true

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please export your PostgreSQL connection string:"
    echo "   export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "🔗 Using database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo "🚀 Starting local server..."

# Run the app locally
python3 app.py
