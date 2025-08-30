#!/usr/bin/env python3
"""
Script to start the SecureFlow backend server
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, init_model, init_database

if __name__ == '__main__':
    # Determine port (default 5001 to align with Fly internal_port)
    port = int(os.environ.get('PORT', '5001'))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'

    print("Starting SecureFlow Backend Server (production mode)...")
    print(f"Listening on 0.0.0.0:{port}")
    print("API endpoints:")
    print("  - GET  /api/health")
    print("  - POST /api/predict")
    print("  - POST /api/predict-batch")
    print("  - POST /api/feedback")
    print("  - GET  /api/dashboard")
    print("  - GET  /api/transactions")

    # Initialize model and database before serving
    print("Initializing model and database...")
    init_model()
    init_database()
    print("Initialization complete. Serving traffic...")

    try:
        app.run(host='0.0.0.0', port=port, debug=debug)
    except KeyboardInterrupt:
        print("\nServer stopped.")
