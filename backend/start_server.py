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
    print("Starting SecureFlow Backend Server...")
    print("Server will be available at: http://localhost:5001")
    print("API endpoints:")
    print("  - GET  /api/health")
    print("  - POST /api/predict")
    print("  - POST /api/predict-batch")
    print("  - POST /api/feedback")
    print("  - GET  /api/dashboard")
    print("  - GET  /api/transactions")
    print("\nPress Ctrl+C to stop the server")
    
    # Initialize model and database
    print("Initializing model and database...")
    init_model()
    init_database()
    print("Initialization complete!")
    
    try:
        app.run(host='0.0.0.0', port=5001, debug=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
