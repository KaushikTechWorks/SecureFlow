import json
import os
import sys
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap

# Add database imports
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
db_pool = None

def get_db_connection():
    """Get database connection from pool"""
    global db_pool
    if db_pool is None:
        db_pool = SimpleConnectionPool(1, 10, DATABASE_URL)
    return db_pool.getconn()

def return_db_connection(conn):
    """Return connection to pool"""
    global db_pool
    if db_pool:
        db_pool.putconn(conn)

def init_database():
    """Initialize PostgreSQL database tables"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Create transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    amount FLOAT NOT NULL,
                    hour INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    merchant_category INTEGER NOT NULL,
                    transaction_type INTEGER NOT NULL,
                    anomaly_score FLOAT NOT NULL,
                    is_anomaly BOOLEAN NOT NULL,
                    shap_explanation TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create feedback table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    transaction_id INTEGER REFERENCES transactions(id),
                    user_feedback BOOLEAN NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        conn.rollback()
        raise
    finally:
        return_db_connection(conn)

# Global variables for model
model = None
scaler = None
feature_names = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']

def init_model():
    """Initialize the ML model (same as before)"""
    global model, scaler
    
    # Generate synthetic training data
    np.random.seed(42)
    n_samples = 10000
    
    # Generate normal transactions
    normal_data = pd.DataFrame({
        'amount': np.random.normal(50, 30, n_samples),
        'hour': np.random.normal(14, 4, n_samples),
        'day_of_week': np.random.randint(0, 7, n_samples),
        'merchant_category': np.random.randint(0, 10, n_samples),
        'transaction_type': np.random.randint(0, 3, n_samples)
    })
    
    # Generate anomalous transactions  
    anomaly_data = pd.DataFrame({
        'amount': np.random.normal(500, 200, 200),
        'hour': np.random.choice([2, 3, 4, 23], 200),
        'day_of_week': np.random.randint(0, 7, 200),
        'merchant_category': np.random.randint(0, 10, 200),
        'transaction_type': np.random.randint(0, 3, 200)
    })
    
    # Combine and train
    training_data = pd.concat([normal_data, anomaly_data], ignore_index=True)
    training_data['amount'] = np.abs(training_data['amount'])
    training_data['hour'] = np.clip(training_data['hour'], 0, 23)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(training_data[feature_names])
    
    model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
    model.fit(X_scaled)
    
    logger.info("Model initialized successfully")

def handle_health(event, context):
    """Health check endpoint"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps({
            'status': 'healthy',
            'model_loaded': model is not None,
            'database': 'postgresql',
            'timestamp': datetime.now().isoformat()
        })
    }

def handle_predict(event, context):
    """Handle single prediction"""
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            data = json.loads(event['body'])
        else:
            data = event.get('body', {})
        
        # Validate required fields
        required_fields = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']
        for field in required_fields:
            if field not in data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Prepare data for prediction
        transaction_data = pd.DataFrame([{
            'amount': float(data['amount']),
            'hour': int(data['hour']),
            'day_of_week': int(data['day_of_week']),
            'merchant_category': int(data['merchant_category']),
            'transaction_type': int(data['transaction_type'])
        }])
        
        # Scale and predict
        X_scaled = scaler.transform(transaction_data[feature_names])
        anomaly_score = model.decision_function(X_scaled)[0]
        is_anomaly = model.predict(X_scaled)[0] == -1
        
        # Generate SHAP explanation
        try:
            explainer = shap.Explainer(model, scaler.transform(np.random.normal(0, 1, (100, len(feature_names)))))
            shap_values = explainer(X_scaled[0:1])
            shap_explanation = {feature: float(shap_values.values[0][i]) for i, feature in enumerate(feature_names)}
        except:
            shap_explanation = {feature: 0.0 for feature in feature_names}
        
        # Store in PostgreSQL
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute('''
                    INSERT INTO transactions (amount, hour, day_of_week, merchant_category, 
                                            transaction_type, anomaly_score, is_anomaly, shap_explanation)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                ''', (
                    float(transaction_data['amount'].iloc[0]),
                    int(transaction_data['hour'].iloc[0]),
                    int(transaction_data['day_of_week'].iloc[0]),
                    int(transaction_data['merchant_category'].iloc[0]),
                    int(transaction_data['transaction_type'].iloc[0]),
                    float(anomaly_score),
                    bool(is_anomaly),
                    json.dumps(shap_explanation)
                ))
                transaction_id = cursor.fetchone()[0]
                conn.commit()
        finally:
            return_db_connection(conn)
        
        response = {
            'transaction_id': transaction_id,
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'confidence': abs(float(anomaly_score)),
            'shap_explanation': shap_explanation,
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response)
        }
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        # Initialize model and database on cold start
        if model is None:
            init_model()
            init_database()
        
        # Route based on HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        if path == '/api/health':
            return handle_health(event, context)
        elif path == '/api/predict' and http_method == 'POST':
            return handle_predict(event, context)
        # Add more endpoints as needed...
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
            
    except Exception as e:
        logger.error(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error'})
        }
