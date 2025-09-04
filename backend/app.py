from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap
import json
import os
from datetime import datetime, timedelta
import logging
from sqlalchemy import create_engine, Column, Integer, Float, Boolean, String, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import time
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration with connection pooling
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/secureflow')
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Transaction(Base):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False, index=True)  # Index for performance
    hour = Column(Integer, nullable=False, index=True)  # Index for hourly queries
    day_of_week = Column(Integer, nullable=False)
    merchant_category = Column(Integer, nullable=False)
    transaction_type = Column(Integer, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, nullable=False, index=True)  # Index for anomaly queries
    shap_explanation = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)  # Index for time-based queries
    
    # Relationship to feedback
    feedback = relationship("Feedback", back_populates="transaction")

class Feedback(Base):
    __tablename__ = 'feedback'
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=False)
    user_feedback = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to transaction
    transaction = relationship("Transaction", back_populates="feedback")

# Global variables for model and scaler
model = None
scaler = None
_initialized = False
feature_names = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']

# Dashboard cache
_dashboard_cache = None
_dashboard_cache_time = None
DASHBOARD_CACHE_DURATION = 30  # seconds

# ------------------------------
# Input normalization utilities
# ------------------------------
def _stable_category_code(value: str, modulus: int = 10) -> int:
    """Create a stable non-negative numeric code from a string for categorical hashing."""
    if value is None:
        return 0
    return abs(hash(value)) % modulus

def normalize_transaction_payload(raw: dict):
    """Normalize incoming transaction JSON to required feature set.

    Accepts either the full explicit schema (amount, hour, day_of_week, merchant_category, transaction_type)
    OR a simplified/legacy schema: { amount, merchant, category, timestamp, type }.

    Derivations:
      - hour/day_of_week derived from timestamp (ISO8601) if missing.
      - merchant_category derived by hashing (merchant or category) if merchant_category missing.
      - transaction_type falls back to provided 'type' or 0.
    """
    data = dict(raw or {})

    # Mandatory base field
    if 'amount' not in data:
        raise ValueError('Missing required field: amount')

    # Derive hour / day_of_week from timestamp if not supplied directly
    if ('hour' not in data or 'day_of_week' not in data) and 'timestamp' in data:
        try:
            ts = data['timestamp']
            # Accept both with/without Z
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            data.setdefault('hour', dt.hour)
            data.setdefault('day_of_week', dt.weekday())
        except Exception:
            # If parsing fails leave for validation later
            pass

    # Map alternative field names
    if 'merchant_category' not in data:
        if 'category' in data:
            data['merchant_category'] = _stable_category_code(str(data['category']))
        elif 'merchant' in data:
            data['merchant_category'] = _stable_category_code(str(data['merchant']))

    if 'transaction_type' not in data:
        if 'type' in data:
            data['transaction_type'] = _stable_category_code(str(data['type']), modulus=3)
        else:
            data['transaction_type'] = 0

    # Final validation of required model features
    missing = [f for f in feature_names if f not in data]
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")

    # Coerce types
    normalized = {
        'amount': float(data['amount']),
        'hour': int(data['hour']),
        'day_of_week': int(data['day_of_week']),
        'merchant_category': int(data['merchant_category']),
        'transaction_type': int(data['transaction_type'])
    }
    return normalized

def ensure_model_initialized():
    """Ensure model is initialized, initialize if not"""
    global _initialized
    if not _initialized:
        logger.info("Initializing model for first use...")
        init_model()
        logger.info("Model initialization complete")

def init_model():
    """Initialize the Isolation Forest model with synthetic data"""
    global model, scaler, _initialized
    
    if _initialized:
        return
    
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
    
    _initialized = True
    logger.info("Model initialized successfully")
    
    logger.info("Model initialized successfully")

def init_database():
    """Initialize PostgreSQL database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def ensure_initialized():
    """Lazily initialize model and database (for Gunicorn workers)."""
    global _initialized
    if _initialized:
        return
    try:
        if (model is None) or (scaler is None):
            logger.info("Lazy initializing model and scaler...")
            init_model()
        # Always ensure tables exist
        init_database()
        _initialized = True
        logger.info("Lazy initialization complete")
    except Exception as e:
        logger.error(f"Lazy initialization failed: {e}")
        # Don't mark initialized so we can retry next request
        raise

@app.before_request
def _lazy_before_request():
    # Only initialize for API routes, skip static asset fetches
    path = request.path
    if path.startswith('/api/'):
        try:
            ensure_initialized()
        except Exception:
            # Let endpoint handle/log detailed error if needed
            pass

def get_db_session():
    """Get database session"""
    session = SessionLocal()
    try:
        return session
    except Exception as e:
        session.close()
        raise

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
    """Health check endpoint with model pre-loading"""
    try:
        # Ensure model is initialized for faster subsequent requests
        ensure_model_initialized()
        
        # Test database connection
        session = get_db_session()
        try:
            session.execute(text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        finally:
            session.close()
        
        return jsonify({
            'status': 'healthy',
            'model_initialized': _initialized,
            'database': db_status,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/api/warmup', methods=['POST'])
def warmup():
    """Warm up endpoint to pre-load model and cache"""
    try:
        start_time = time.time()
        
        # Initialize model
        ensure_model_initialized()
        
        # Pre-load dashboard cache
        get_dashboard_data()
        
        # Test a prediction to warm up the prediction pipeline
        test_data = {
            'amount': 100.0,
            'hour': 14,
            'day_of_week': 1,
            'merchant_category': 5,
            'transaction_type': 1
        }
        
        normalized = normalize_transaction_payload(test_data)
        data_array = np.array([[normalized[f] for f in feature_names]])
        X_scaled = scaler.transform(data_array)
        model.decision_function(X_scaled)
        
        warmup_time = time.time() - start_time
        
        return jsonify({
            'status': 'warmed_up',
            'warmup_time_seconds': round(warmup_time, 3),
            'model_initialized': _initialized,
            'dashboard_cached': _dashboard_cache is not None,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'warmup_failed',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    if not _initialized:
        try:
            ensure_initialized()
        except Exception:
            pass
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'initialized': _initialized,
        'timestamp': datetime.now().isoformat()
    })

# Serve React frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React frontend files"""
    # Skip API routes - let them be handled by their specific handlers
    if path.startswith('api/'):
        return None  # This will result in a 404, letting API routes handle themselves
    
    # Serve static files
    if path != "" and os.path.exists(os.path.join('/app/build', path)):
        return send_from_directory('/app/build', path)
    else:
        # For any non-API route, serve the React app's index.html (SPA routing)
        return send_from_directory('/app/build', 'index.html')

@app.route('/api/predict', methods=['POST'])
def predict_anomaly():
    """Predict if a single transaction is anomalous"""
    try:
        raw = request.get_json()
        try:
            normalized = normalize_transaction_payload(raw)
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400

        # Prepare dataframe for prediction
        transaction_data = pd.DataFrame([normalized])
        
        # Scale the data
        X_scaled = scaler.transform(transaction_data[feature_names])
        
        # Make prediction
        anomaly_score = model.decision_function(X_scaled)[0]
        is_anomaly = model.predict(X_scaled)[0] == -1
        
        # Get SHAP explanation
        shap_explanation = get_shap_explanation(X_scaled[0])
        
        # Store in database
        session = get_db_session()
        try:
            transaction_record = Transaction(
                amount=float(transaction_data['amount'].iloc[0]),
                hour=int(transaction_data['hour'].iloc[0]),
                day_of_week=int(transaction_data['day_of_week'].iloc[0]),
                merchant_category=int(transaction_data['merchant_category'].iloc[0]),
                transaction_type=int(transaction_data['transaction_type'].iloc[0]),
                anomaly_score=float(anomaly_score),
                is_anomaly=bool(is_anomaly),
                shap_explanation=json.dumps(shap_explanation)
            )
            session.add(transaction_record)
            session.commit()
            transaction_id = transaction_record.id
        finally:
            session.close()
        
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
                normalized = normalize_transaction_payload(transaction)
                transaction_data = pd.DataFrame([normalized])

                X_scaled = scaler.transform(transaction_data[feature_names])
                anomaly_score = model.decision_function(X_scaled)[0]
                is_anomaly = model.predict(X_scaled)[0] == -1

                shap_explanation = get_shap_explanation(X_scaled[0])

                session = get_db_session()
                try:
                    transaction_record = Transaction(
                        amount=float(transaction_data['amount'].iloc[0]),
                        hour=int(transaction_data['hour'].iloc[0]),
                        day_of_week=int(transaction_data['day_of_week'].iloc[0]),
                        merchant_category=int(transaction_data['merchant_category'].iloc[0]),
                        transaction_type=int(transaction_data['transaction_type'].iloc[0]),
                        anomaly_score=float(anomaly_score),
                        is_anomaly=bool(is_anomaly),
                        shap_explanation=json.dumps(shap_explanation)
                    )
                    session.add(transaction_record)
                    session.commit()
                    transaction_id = transaction_record.id
                finally:
                    session.close()

                results.append({
                    'index': i,
                    'transaction_id': transaction_id,
                    'is_anomaly': bool(is_anomaly),
                    'anomaly_score': float(anomaly_score),
                    'confidence': abs(float(anomaly_score)),
                    'shap_explanation': shap_explanation
                })
            except Exception as e:
                results.append({'index': i, 'error': str(e)})
        
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
        session = get_db_session()
        try:
            # First check if the transaction exists
            transaction = session.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not transaction:
                return jsonify({
                    'error': f'Transaction ID {transaction_id} not found. Please ensure you are using a valid transaction ID from a recent analysis.'
                }), 404
            
            # Check if feedback already exists for this transaction
            existing_feedback = session.query(Feedback).filter(Feedback.transaction_id == transaction_id).first()
            if existing_feedback:
                # Update existing feedback instead of creating new one
                existing_feedback.user_feedback = feedback
                existing_feedback.timestamp = datetime.utcnow()
                session.commit()
                return jsonify({
                    'message': 'Feedback updated successfully',
                    'transaction_id': transaction_id,
                    'feedback': feedback
                })
            else:
                # Create new feedback record
                feedback_record = Feedback(
                    transaction_id=transaction_id,
                    user_feedback=feedback
                )
                session.add(feedback_record)
                session.commit()
                return jsonify({
                    'message': 'Feedback submitted successfully',
                    'transaction_id': transaction_id,
                    'feedback': feedback
                })
        finally:
            session.close()
        
    except ValueError:
        return jsonify({'error': 'Transaction ID must be a valid number'}), 400
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        return jsonify({'error': 'An error occurred while submitting feedback. Please try again.'}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard analytics data with caching"""
    global _dashboard_cache, _dashboard_cache_time
    
    try:
        # Check if we have fresh cached data
        current_time = time.time()
        if (_dashboard_cache is not None and 
            _dashboard_cache_time is not None and 
            current_time - _dashboard_cache_time < DASHBOARD_CACHE_DURATION):
            return jsonify(_dashboard_cache)
        
        # Ensure model is initialized
        ensure_model_initialized()
        
        session = get_db_session()
        try:
            # Use simplified queries for better compatibility
            from sqlalchemy import func, case
            
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            # Main stats query
            stats_query = session.query(
                func.count(Transaction.id).label('total_transactions'),
                func.sum(case((Transaction.is_anomaly == True, 1), else_=0)).label('anomalies_detected'),
                func.avg(Transaction.anomaly_score).label('avg_anomaly_score')
            ).filter(Transaction.timestamp >= week_ago).first()
            
            # Separate hourly distribution query
            hourly_query = session.query(
                Transaction.hour,
                func.count(Transaction.id).label('count'),
                func.sum(case((Transaction.is_anomaly == True, 1), else_=0)).label('anomalies')
            ).filter(Transaction.timestamp >= week_ago)\
             .group_by(Transaction.hour)\
             .order_by(Transaction.hour).all()
            
            # Feedback query
            feedback_query = session.query(
                func.count(Feedback.id).label('total_feedback'),
                func.sum(case((Feedback.user_feedback == True, 1), else_=0)).label('positive_feedback')
            ).join(Transaction).filter(Transaction.timestamp >= week_ago).first()
            
            # Build response with proper type conversion
            total_transactions = int(stats_query.total_transactions) if stats_query.total_transactions else 0
            anomalies_detected = int(stats_query.anomalies_detected) if stats_query.anomalies_detected else 0
            avg_anomaly_score = float(stats_query.avg_anomaly_score) if stats_query.avg_anomaly_score else 0.0
            
            response = {
                'stats': {
                    'total_transactions': total_transactions,
                    'anomalies_detected': anomalies_detected,
                    'avg_anomaly_score': round(avg_anomaly_score, 3),
                    'anomaly_rate': round((anomalies_detected / total_transactions * 100), 2) if total_transactions > 0 else 0.0
                },
                'hourly_distribution': [
                    {
                        'hour': int(row.hour),
                        'total_transactions': int(row.count),
                        'anomalies': int(row.anomalies) if row.anomalies else 0
                    } for row in hourly_query
                ],
                'feedback': {
                    'total_feedback': int(feedback_query.total_feedback) if feedback_query.total_feedback else 0,
                    'positive_feedback': int(feedback_query.positive_feedback) if feedback_query.positive_feedback else 0,
                    'accuracy': round((feedback_query.positive_feedback / feedback_query.total_feedback * 100), 2) if feedback_query.total_feedback and feedback_query.total_feedback > 0 else 0.0
                },
                'cached': False,
                'generated_at': datetime.utcnow().isoformat()
            }
            
            # Cache the response
            _dashboard_cache = response.copy()
            _dashboard_cache['cached'] = True
            _dashboard_cache_time = current_time
            
            return jsonify(response)
            
        finally:
            session.close()
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        
        # Return cached data if available, even if stale
        if _dashboard_cache is not None:
            logger.info("Returning stale cached dashboard data due to error")
            stale_response = _dashboard_cache.copy()
            stale_response['cached'] = True
            stale_response['stale'] = True
            return jsonify(stale_response)
        
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get recent transactions with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        offset = (page - 1) * per_page
        
        session = get_db_session()
        try:
            from sqlalchemy import func
            
            # Get total count
            total = session.query(func.count(Transaction.id)).scalar()
            
            # Get transactions with pagination
            transactions_query = session.query(Transaction)\
                .order_by(Transaction.timestamp.desc())\
                .offset(offset)\
                .limit(per_page).all()
            
            transactions = []
            for transaction in transactions_query:
                transactions.append({
                    'id': transaction.id,
                    'amount': transaction.amount,
                    'hour': transaction.hour,
                    'day_of_week': transaction.day_of_week,
                    'merchant_category': transaction.merchant_category,
                    'transaction_type': transaction.transaction_type,
                    'anomaly_score': transaction.anomaly_score,
                    'is_anomaly': transaction.is_anomaly,
                    'shap_explanation': json.loads(transaction.shap_explanation) if transaction.shap_explanation else {},
                    'timestamp': transaction.timestamp.isoformat() if transaction.timestamp else None
                })
            
            return jsonify({
                'transactions': transactions,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            })
        finally:
            session.close()
        
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize model and database
    init_model()
    init_database()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
