from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap
import json
import os
from datetime import datetime
import logging
from sqlalchemy import create_engine, Column, Integer, Float, Boolean, String, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/secureflow')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Transaction(Base):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    hour = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    merchant_category = Column(Integer, nullable=False)
    transaction_type = Column(Integer, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, nullable=False)
    shap_explanation = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
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
    """Initialize PostgreSQL database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

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
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
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
        session = get_db_session()
        try:
            feedback_record = Feedback(
                transaction_id=transaction_id,
                user_feedback=feedback
            )
            session.add(feedback_record)
            session.commit()
        finally:
            session.close()
        
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
        session = get_db_session()
        try:
            # Get recent transactions stats
            from sqlalchemy import func, and_
            from datetime import datetime, timedelta
            
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            # Get stats
            stats_query = session.query(
                func.count(Transaction.id).label('total_transactions'),
                func.sum(func.cast(Transaction.is_anomaly, Integer)).label('anomalies_detected'),
                func.avg(Transaction.anomaly_score).label('avg_anomaly_score')
            ).filter(Transaction.timestamp >= week_ago).first()
            
            # Get hourly distribution
            hourly_query = session.query(
                Transaction.hour,
                func.count(Transaction.id).label('count'),
                func.sum(func.cast(Transaction.is_anomaly, Integer)).label('anomalies')
            ).filter(Transaction.timestamp >= week_ago)\
             .group_by(Transaction.hour)\
             .order_by(Transaction.hour).all()
            
            # Get feedback stats
            feedback_query = session.query(
                func.count(Feedback.id).label('total_feedback'),
                func.sum(func.cast(Feedback.user_feedback, Integer)).label('positive_feedback')
            ).join(Transaction).filter(Transaction.timestamp >= week_ago).first()
            
            # Ensure all values are properly converted to Python native types
            total_transactions = int(stats_query.total_transactions) if stats_query.total_transactions else 0
            anomalies_detected = int(stats_query.anomalies_detected) if stats_query.anomalies_detected else 0
            avg_anomaly_score = float(stats_query.avg_anomaly_score) if stats_query.avg_anomaly_score else 0.0
            
            response = {
                'stats': {
                    'total_transactions': total_transactions,
                    'anomalies_detected': anomalies_detected,
                    'avg_anomaly_score': avg_anomaly_score,
                    'anomaly_rate': float((anomalies_detected / total_transactions * 100)) if total_transactions > 0 else 0.0
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
                    'accuracy': float((feedback_query.positive_feedback / feedback_query.total_feedback * 100)) if feedback_query.total_feedback and feedback_query.total_feedback > 0 else 0.0
                }
            }
            
            return jsonify(response)
        finally:
            session.close()
        
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
