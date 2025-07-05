# SecureFlow Lambda Backend

This directory contains the unified SecureFlow backend that works both as an AWS Lambda function and as a local Flask development server.

## Files

- **`app.py`** - Main application code (unified for Lambda and local)
- **`requirements.txt`** - Main requirements file with production dependencies
- **`requirements-production.txt`** - Production-only dependencies (for Lambda)
- **`requirements-local.txt`** - Local development dependencies (includes Flask)
- **`deploy.sh`** - Script to deploy to AWS Lambda
- **`run-local.sh`** - Script to run locally for development

## Architecture

The `app.py` file automatically detects the environment and uses:
- **Lambda**: pg8000 driver (pure Python, easier packaging)
- **Local**: psycopg2 driver (better features for development) + Flask server

## Quick Start

### Local Development

1. Set your database URL:
   ```bash
   export DATABASE_URL='postgresql://username:password@host:port/database'
   ```

2. Run locally:
   ```bash
   ./run-local.sh
   ```

3. Access endpoints:
   - Health: http://localhost:5000/api/health
   - Dashboard: http://localhost:5000/api/dashboard
   - Transactions: http://localhost:5000/api/transactions

### Production Deployment

1. Deploy to AWS Lambda:
   ```bash
   ./deploy.sh
   ```

2. Test production endpoints:
   ```bash
   curl https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod/api/health
   ```

## Environment Variables

### Required
- **`DATABASE_URL`** - PostgreSQL connection string

### Optional
- **`IS_LOCAL`** - Set to 'true' for local development (auto-detected)

## API Endpoints

All endpoints work with real PostgreSQL data:

- **GET /api/health** - Health check
- **GET /api/dashboard** - Dashboard statistics
- **GET /api/transactions** - Transaction history (with pagination)
- **POST /api/predict** - Single transaction fraud prediction
- **POST /api/feedback** - Submit feedback on predictions
- **POST /api/predict-batch** - Batch fraud prediction

## Database

The backend automatically initializes PostgreSQL tables on first run and includes sample data for testing.
