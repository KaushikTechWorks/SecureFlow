from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap
import sqlite3
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for model and scaler
model = None
scaler = None
feature_names = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']

def init_model():
    """Initialize the Isolation Forest model with synthetic data"""
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
    
    # Generate some anomalous transactions
    anomaly_data = pd.DataFrame({
        'amount': np.random.normal(500, 200, 200),  # High amounts
        'hour': np.random.choice([2, 3, 4, 23], 200),  # Unusual hours
        'day_of_week': np.random.randint(0, 7, 200),
        'merchant_category': np.random.randint(0, 10, 200),
        'transaction_type': np.random.randint(0, 3, 200)
    })
    
    # Combine data
    training_data = pd.concat([normal_data, anomaly_data], ignore_index=True)
    
    # Ensure positive amounts and valid hours
    training_data['amount'] = np.abs(training_data['amount'])
    training_data['hour'] = np.clip(training_data['hour'], 0, 23)
    
    # Initialize and train the model
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(training_data[feature_names])
    
    model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
    model.fit(X_scaled)
    
    logger.info("Model initialized successfully")

def init_database():
    """Initialize SQLite database for storing transactions and feedback"""
    conn = sqlite3.connect('secureflow.db')
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            hour INTEGER,
            day_of_week INTEGER,
            merchant_category INTEGER,
            transaction_type INTEGER,
            anomaly_score REAL,
            is_anomaly BOOLEAN,
            shap_explanation TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create feedback table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER,
            user_feedback BOOLEAN,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

def get_shap_explanation(data_point):
    """Generate SHAP explanation for a prediction"""
    try:
        # Create explainer
        explainer = shap.Explainer(model, scaler.transform(np.random.normal(0, 1, (100, len(feature_names)))))
        
        # Get SHAP values
        shap_values = explainer(data_point.reshape(1, -1))
        
        # Create explanation dictionary
        explanation = {}
        for i, feature in enumerate(feature_names):
            explanation[feature] = float(shap_values.values[0][i])
        
        return explanation
    except Exception as e:
        logger.error(f"Error generating SHAP explanation: {e}")
        return {feature: 0.0 for feature in feature_names}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict_anomaly():
    """Predict if a single transaction is anomalous"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Prepare data for prediction
        transaction_data = pd.DataFrame([{
            'amount': float(data['amount']),
            'hour': int(data['hour']),
            'day_of_week': int(data['day_of_week']),
            'merchant_category': int(data['merchant_category']),
            'transaction_type': int(data['transaction_type'])
        }])
        
        # Scale the data
        X_scaled = scaler.transform(transaction_data[feature_names])
        
        # Make prediction
        anomaly_score = model.decision_function(X_scaled)[0]
        is_anomaly = model.predict(X_scaled)[0] == -1
        
        # Get SHAP explanation
        shap_explanation = get_shap_explanation(X_scaled[0])
        
        # Store in database
        conn = sqlite3.connect('secureflow.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (amount, hour, day_of_week, merchant_category, 
                                    transaction_type, anomaly_score, is_anomaly, shap_explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        transaction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        response = {
            'transaction_id': transaction_id,
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'confidence': abs(float(anomaly_score)),
            'shap_explanation': shap_explanation,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-batch', methods=['POST'])
def predict_batch():
    """Predict anomalies for a batch of transactions"""
    try:
        data = request.get_json()
        
        if 'transactions' not in data:
            return jsonify({'error': 'Missing transactions array'}), 400
        
        transactions = data['transactions']
        results = []
        
        for i, transaction in enumerate(transactions):
            try:
                # Validate transaction data
                required_fields = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']
                for field in required_fields:
                    if field not in transaction:
                        results.append({
                            'index': i,
                            'error': f'Missing required field: {field}'
                        })
                        continue
                
                # Prepare data
                transaction_data = pd.DataFrame([{
                    'amount': float(transaction['amount']),
                    'hour': int(transaction['hour']),
                    'day_of_week': int(transaction['day_of_week']),
                    'merchant_category': int(transaction['merchant_category']),
                    'transaction_type': int(transaction['transaction_type'])
                }])
                
                # Scale and predict
                X_scaled = scaler.transform(transaction_data[feature_names])
                anomaly_score = model.decision_function(X_scaled)[0]
                is_anomaly = model.predict(X_scaled)[0] == -1
                
                # Get SHAP explanation
                shap_explanation = get_shap_explanation(X_scaled[0])
                
                # Store in database
                conn = sqlite3.connect('secureflow.db')
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO transactions (amount, hour, day_of_week, merchant_category, 
                                            transaction_type, anomaly_score, is_anomaly, shap_explanation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                transaction_id = cursor.lastrowid
                conn.commit()
                conn.close()
                
                results.append({
                    'index': i,
                    'transaction_id': transaction_id,
                    'is_anomaly': bool(is_anomaly),
                    'anomaly_score': float(anomaly_score),
                    'confidence': abs(float(anomaly_score)),
                    'shap_explanation': shap_explanation
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'error': str(e)
                })
        
        return jsonify({
            'results': results,
            'total_processed': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback for a transaction prediction"""
    try:
        data = request.get_json()
        
        if 'transaction_id' not in data or 'feedback' not in data:
            return jsonify({'error': 'Missing transaction_id or feedback'}), 400
        
        transaction_id = int(data['transaction_id'])
        feedback = bool(data['feedback'])
        
        # Store feedback
        conn = sqlite3.connect('secureflow.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO feedback (transaction_id, user_feedback)
            VALUES (?, ?)
        ''', (transaction_id, feedback))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Feedback submitted successfully',
            'transaction_id': transaction_id,
            'feedback': feedback
        })
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard analytics data"""
    try:
        conn = sqlite3.connect('secureflow.db')
        cursor = conn.cursor()
        
        # Get recent transactions
        cursor.execute('''
            SELECT COUNT(*) as total_transactions,
                   SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomalies_detected,
                   AVG(anomaly_score) as avg_anomaly_score
            FROM transactions
            WHERE timestamp >= datetime('now', '-7 days')
        ''')
        stats = cursor.fetchone()
        
        # Get hourly distribution
        cursor.execute('''
            SELECT hour, COUNT(*) as count,
                   SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomalies
            FROM transactions
            WHERE timestamp >= datetime('now', '-7 days')
            GROUP BY hour
            ORDER BY hour
        ''')
        hourly_data = cursor.fetchall()
        
        # Get feedback stats
        cursor.execute('''
            SELECT COUNT(*) as total_feedback,
                   SUM(CASE WHEN user_feedback THEN 1 ELSE 0 END) as positive_feedback
            FROM feedback f
            JOIN transactions t ON f.transaction_id = t.id
            WHERE t.timestamp >= datetime('now', '-7 days')
        ''')
        feedback_stats = cursor.fetchone()
        
        conn.close()
        
        # Ensure all values are properly converted to Python native types
        response = {
            'stats': {
                'total_transactions': int(stats[0]) if stats[0] is not None else 0,
                'anomalies_detected': int(stats[1]) if stats[1] is not None else 0,
                'avg_anomaly_score': float(stats[2]) if stats[2] is not None else 0.0,
                'anomaly_rate': float((stats[1] / stats[0] * 100)) if stats[0] and stats[0] > 0 else 0.0
            },
            'hourly_distribution': [
                {
                    'hour': int(row[0]),
                    'total_transactions': int(row[1]),
                    'anomalies': int(row[2])
                } for row in hourly_data
            ],
            'feedback': {
                'total_feedback': int(feedback_stats[0]) if feedback_stats[0] is not None else 0,
                'positive_feedback': int(feedback_stats[1]) if feedback_stats[1] is not None else 0,
                'accuracy': float((feedback_stats[1] / feedback_stats[0] * 100)) if feedback_stats[0] and feedback_stats[0] > 0 else 0.0
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get recent transactions with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        offset = (page - 1) * per_page
        
        conn = sqlite3.connect('secureflow.db')
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) FROM transactions')
        total = cursor.fetchone()[0]
        
        # Get transactions with pagination
        cursor.execute('''
            SELECT id, amount, hour, day_of_week, merchant_category, transaction_type,
                   anomaly_score, is_anomaly, shap_explanation, timestamp
            FROM transactions
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        ''', (per_page, offset))
        
        transactions = []
        for row in cursor.fetchall():
            transactions.append({
                'id': row[0],
                'amount': row[1],
                'hour': row[2],
                'day_of_week': row[3],
                'merchant_category': row[4],
                'transaction_type': row[5],
                'anomaly_score': row[6],
                'is_anomaly': row[7],
                'shap_explanation': json.loads(row[8]) if row[8] else {},
                'timestamp': row[9]
            })
        
        conn.close()
        
        return jsonify({
            'transactions': transactions,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize model and database
    init_model()
    init_database()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
