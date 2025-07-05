import json
import os
import logging
from datetime import datetime, timedelta
import urllib.parse
import random
import uuid

# Database driver - use pg8000 for Lambda (pure Python), psycopg2 for local
try:
    # Try pg8000 first (for Lambda)
    import pg8000.native as db_driver
    DB_DRIVER = 'pg8000'
except ImportError:
    try:
        # Fall back to psycopg2 (for local development)
        import psycopg2
        import psycopg2.extras
        DB_DRIVER = 'psycopg2'
    except ImportError:
        raise ImportError("Neither pg8000 nor psycopg2 is available")

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
IS_LOCAL = os.environ.get('IS_LOCAL', 'false').lower() == 'true'

def get_db_connection():
    """Get database connection - works with both pg8000 (Lambda) and psycopg2 (local)"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not configured")
    
    # Parse the URL
    parsed = urllib.parse.urlparse(DATABASE_URL)
    
    if DB_DRIVER == 'pg8000':
        # Lambda: Use pg8000 (pure Python, easier to package)
        return db_driver.Connection(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading '/'
            user=parsed.username,
            password=urllib.parse.unquote(parsed.password) if parsed.password else None,
            ssl_context=True  # Enable SSL for RDS
        )
    else:
        # Local: Use psycopg2 (more features, better for development)
        return psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=urllib.parse.unquote(parsed.password) if parsed.password else None,
            sslmode='require' if not IS_LOCAL else 'prefer'
        )

def execute_query(conn, query, params=None):
    """Execute query with driver-specific parameter handling"""
    if DB_DRIVER == 'pg8000':
        # pg8000: Pass parameters as individual arguments
        if params:
            return conn.run(query, *params)
        else:
            return conn.run(query)
    else:
        # psycopg2: Use cursor with tuple parameters
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            if cur.description:  # SELECT query
                return cur.fetchall()
            conn.commit()  # INSERT/UPDATE query
            return []

def close_connection(conn):
    """Close connection - handle both drivers"""
    if DB_DRIVER == 'pg8000':
        conn.close()
    else:
        conn.close()

def init_database():
    """Initialize PostgreSQL database tables with sample data"""
    try:
        conn = get_db_connection()
        
        # Create transactions table
        create_table_query = '''
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(255) UNIQUE,
                amount FLOAT NOT NULL,
                hour INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL,
                merchant_category VARCHAR(100) NOT NULL,
                transaction_type VARCHAR(100) NOT NULL,
                anomaly_score FLOAT NOT NULL,
                is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''
        execute_query(conn, create_table_query)
        
        # Check if we already have data
        count_result = execute_query(conn, "SELECT COUNT(*) FROM transactions")
        
        if DB_DRIVER == 'pg8000':
            record_count = count_result[0][0]
        else:
            record_count = count_result[0]['count']
            
        if record_count > 0:
            logger.info(f"Database already has {record_count} records, skipping initialization")
            close_connection(conn)
            return
        
        # Insert sample data
        categories = ['retail', 'grocery', 'gas', 'restaurant', 'online']
        types = ['purchase', 'refund', 'transfer']
        
        for i in range(100):
            transaction_id = str(uuid.uuid4())
            amount = random.uniform(10, 500)
            
            # Create some anomalies (higher amounts)
            is_anomaly = random.random() < 0.15  # 15% anomalies
            if is_anomaly:
                amount = random.uniform(1000, 5000)  # Higher amounts for anomalies
            
            # Use appropriate parameter style for each driver
            if DB_DRIVER == 'pg8000':
                insert_query = '''
                    INSERT INTO transactions (
                        transaction_id, amount, hour, day_of_week, 
                        merchant_category, transaction_type, anomaly_score, 
                        is_anomaly, timestamp
                    ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)
                '''
            else:
                insert_query = '''
                    INSERT INTO transactions (
                        transaction_id, amount, hour, day_of_week, 
                        merchant_category, transaction_type, anomaly_score, 
                        is_anomaly, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                '''
            
            params = [
                transaction_id,
                amount,
                random.randint(0, 23),
                random.randint(0, 6),
                random.choice(categories),
                random.choice(types),
                random.uniform(-1, 1),
                is_anomaly,
                datetime.now() - timedelta(days=random.randint(0, 30))
            ]
            
            execute_query(conn, insert_query, params)
        
        close_connection(conn)
        logger.info("Database initialized successfully with 100 sample transactions")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

def handle_health(event, context):
    """Health check endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        execute_query(conn, "SELECT 1")
        close_connection(conn)
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'database_available': True,
                'environment': 'local' if IS_LOCAL else 'production',
                'db_driver': DB_DRIVER,
                'version': '5.0.0-unified'
            })
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'database_available': False,
                'environment': 'local' if IS_LOCAL else 'production',
                'db_driver': DB_DRIVER
            })
        }

def handle_dashboard(event, context):
    """Handle dashboard analytics - REAL DATA from PostgreSQL"""
    try:
        # Initialize database if needed
        init_database()
        
        conn = get_db_connection()
        
        # Get total transactions
        total_result = execute_query(conn, "SELECT COUNT(*) FROM transactions")
        if DB_DRIVER == 'pg8000':
            total_transactions = total_result[0][0]
        else:
            total_transactions = total_result[0]['count']
        
        # Get anomalies count
        anomaly_result = execute_query(conn, "SELECT COUNT(*) FROM transactions WHERE is_anomaly = true")
        if DB_DRIVER == 'pg8000':
            anomalies_detected = anomaly_result[0][0]
        else:
            anomalies_detected = anomaly_result[0]['count']
        
        # Calculate anomaly rate
        anomaly_rate = (anomalies_detected / total_transactions * 100) if total_transactions > 0 else 0
        
        # Get last 24h transactions
        cutoff_time = datetime.now() - timedelta(days=1)
        if DB_DRIVER == 'pg8000':
            last_24h_query = "SELECT COUNT(*) FROM transactions WHERE timestamp > :1"
            last_24h_result = execute_query(conn, last_24h_query, [cutoff_time])
            last_24h_transactions = last_24h_result[0][0]
            
            # Get last 24h anomalies
            last_24h_anomalies_query = "SELECT COUNT(*) FROM transactions WHERE timestamp > :1 AND is_anomaly = true"
            last_24h_anomalies_result = execute_query(conn, last_24h_anomalies_query, [cutoff_time])
            last_24h_anomalies = last_24h_anomalies_result[0][0]
        else:
            last_24h_query = "SELECT COUNT(*) FROM transactions WHERE timestamp > %s"
            last_24h_result = execute_query(conn, last_24h_query, (cutoff_time,))
            last_24h_transactions = last_24h_result[0]['count']
            
            # Get last 24h anomalies
            last_24h_anomalies_query = "SELECT COUNT(*) FROM transactions WHERE timestamp > %s AND is_anomaly = true"
            last_24h_anomalies_result = execute_query(conn, last_24h_anomalies_query, (cutoff_time,))
            last_24h_anomalies = last_24h_anomalies_result[0]['count']
        
        # Get top categories
        categories_query = """
            SELECT 
                merchant_category, 
                COUNT(*) as count,
                SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomaly_count
            FROM transactions 
            GROUP BY merchant_category 
            ORDER BY count DESC 
            LIMIT 5
        """
        categories_result = execute_query(conn, categories_query)
        
        top_categories = []
        for row in categories_result:
            if DB_DRIVER == 'pg8000':
                top_categories.append({
                    'category': row[0],
                    'count': row[1],
                    'anomaly_count': row[2]
                })
            else:
                top_categories.append({
                    'category': row['merchant_category'],
                    'count': row['count'],
                    'anomaly_count': row['anomaly_count']
                })
        
        # Get recent anomalies
        recent_anomalies_query = """
            SELECT transaction_id, amount, merchant_category, timestamp, anomaly_score
            FROM transactions 
            WHERE is_anomaly = true 
            ORDER BY timestamp DESC 
            LIMIT 5
        """
        recent_anomalies_result = execute_query(conn, recent_anomalies_query)
        
        recent_anomalies = []
        for row in recent_anomalies_result:
            if DB_DRIVER == 'pg8000':
                recent_anomalies.append({
                    'id': row[0],
                    'amount': float(row[1]),
                    'category': row[2],
                    'timestamp': row[3].isoformat(),
                    'confidence': abs(float(row[4]))
                })
            else:
                recent_anomalies.append({
                    'id': row['transaction_id'],
                    'amount': float(row['amount']),
                    'category': row['merchant_category'],
                    'timestamp': row['timestamp'].isoformat(),
                    'confidence': abs(float(row['anomaly_score']))
                })
        
        close_connection(conn)
        
        dashboard_data = {
            'total_transactions': total_transactions,
            'anomalies_detected': anomalies_detected,
            'anomaly_rate': round(anomaly_rate, 2),
            'last_24h_transactions': last_24h_transactions,
            'last_24h_anomalies': last_24h_anomalies,
            'top_categories': top_categories,
            'recent_anomalies': recent_anomalies,
            'data_source': f'PostgreSQL ({DB_DRIVER}) - {"Local" if IS_LOCAL else "RDS Production"}',
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(dashboard_data)
        }
        
    except Exception as e:
        logger.error(f"Error in dashboard: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def handle_predict(event, context):
    """Handle fraud prediction for single transaction"""
    try:
        # Parse request body
        if 'body' not in event:
            raise ValueError("Missing request body")
        
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        # Validate required fields
        required_fields = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type']
        for field in required_fields:
            if field not in body:
                raise ValueError(f"Missing required field: {field}")
        
        # Simple rule-based fraud detection
        amount = float(body['amount'])
        hour = int(body['hour'])
        merchant_category = body['merchant_category']
        
        # Fraud indicators
        risk_score = 0.0
        
        # High amount transactions are riskier
        if amount > 1000:
            risk_score += 0.4
        elif amount > 500:
            risk_score += 0.2
        
        # Late night transactions are riskier
        if hour < 6 or hour > 22:
            risk_score += 0.3
        
        # Online transactions are riskier
        if merchant_category.lower() == 'online':
            risk_score += 0.2
        
        # Add some randomness
        risk_score += random.uniform(-0.1, 0.1)
        risk_score = max(0.0, min(1.0, risk_score))
        
        is_fraudulent = risk_score > 0.5
        
        # Store prediction in database
        try:
            conn = get_db_connection()
            transaction_id = str(uuid.uuid4())
            
            if DB_DRIVER == 'pg8000':
                insert_query = '''
                    INSERT INTO transactions (
                        transaction_id, amount, hour, day_of_week, 
                        merchant_category, transaction_type, anomaly_score, 
                        is_anomaly, timestamp
                    ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)
                '''
            else:
                insert_query = '''
                    INSERT INTO transactions (
                        transaction_id, amount, hour, day_of_week, 
                        merchant_category, transaction_type, anomaly_score, 
                        is_anomaly, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                '''
            
            params = [
                transaction_id,
                amount,
                hour,
                body['day_of_week'],
                merchant_category,
                body['transaction_type'],
                risk_score,
                is_fraudulent,
                datetime.now()
            ]
            
            execute_query(conn, insert_query, params)
            close_connection(conn)
            
        except Exception as db_error:
            logger.warning(f"Could not store prediction in database: {db_error}")
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'is_fraudulent': is_fraudulent,
                'confidence': round(risk_score, 3),
                'risk_factors': {
                    'high_amount': amount > 500,
                    'unusual_time': hour < 6 or hour > 22,
                    'risky_category': merchant_category.lower() == 'online'
                },
                'data_source': f'Real-time Analysis + PostgreSQL Storage ({DB_DRIVER})',
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def handle_transactions(event, context):
    """Handle transaction history retrieval"""
    try:
        # Initialize database if needed
        init_database()
        
        conn = get_db_connection()
        
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        limit = min(int(query_params.get('limit', 20)), 100)  # Max 100 transactions
        offset = int(query_params.get('offset', 0))
        category = query_params.get('category')
        
        # Build query
        base_query = """
            SELECT transaction_id, amount, merchant_category, 
                   transaction_type, is_anomaly, timestamp, anomaly_score
            FROM transactions
        """
        
        params = []
        if category:
            if DB_DRIVER == 'pg8000':
                base_query += " WHERE merchant_category = :1"
            else:
                base_query += " WHERE merchant_category = %s"
            params.append(category)
        
        base_query += f" ORDER BY timestamp DESC LIMIT {limit} OFFSET {offset}"
        
        result = execute_query(conn, base_query, params if params else None)
        
        transactions = []
        for row in result:
            if DB_DRIVER == 'pg8000':
                transactions.append({
                    'id': row[0],
                    'amount': float(row[1]),
                    'category': row[2],
                    'type': row[3],
                    'is_anomaly': row[4],
                    'timestamp': row[5].isoformat(),
                    'risk_score': float(row[6])
                })
            else:
                transactions.append({
                    'id': row['transaction_id'],
                    'amount': float(row['amount']),
                    'category': row['merchant_category'],
                    'type': row['transaction_type'],
                    'is_anomaly': row['is_anomaly'],
                    'timestamp': row['timestamp'].isoformat(),
                    'risk_score': float(row['anomaly_score'])
                })
        
        close_connection(conn)
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'transactions': transactions,
                'count': len(transactions),
                'offset': offset,
                'limit': limit,
                'data_source': f'PostgreSQL ({DB_DRIVER}) - {"Local" if IS_LOCAL else "RDS Production"}',
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error retrieving transactions: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def handle_feedback(event, context):
    """Handle user feedback on predictions"""
    try:
        # Parse request body
        if 'body' not in event:
            raise ValueError("Missing request body")
        
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        # Validate required fields
        if 'transaction_id' not in body or 'feedback' not in body:
            raise ValueError("Missing required fields: transaction_id, feedback")
        
        transaction_id = body['transaction_id']
        feedback = body['feedback'].lower()
        
        if feedback not in ['correct', 'incorrect']:
            raise ValueError("Feedback must be 'correct' or 'incorrect'")
        
        # Store feedback (in a real system, you'd have a feedback table)
        logger.info(f"Received feedback for transaction {transaction_id}: {feedback}")
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'message': 'Feedback received successfully',
                'transaction_id': transaction_id,
                'feedback': feedback,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def cors_headers():
    """Standard CORS headers for all responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

def lambda_handler(event, context):
    """Main Lambda handler - Unified API for both local and production"""
    try:
        # Handle preflight CORS requests
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': ''
            }
        
        # Parse the path and method
        path = event.get('path', '').rstrip('/')
        http_method = event.get('httpMethod', 'GET')
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Health check endpoint
        if path == '/api/health' and http_method == 'GET':
            return handle_health(event, context)
        
        # Dashboard endpoint
        elif path == '/api/dashboard' and http_method == 'GET':
            return handle_dashboard(event, context)
        
        # Fraud prediction endpoint
        elif path == '/api/predict' and http_method == 'POST':
            return handle_predict(event, context)
        
        # Transaction history endpoint
        elif path == '/api/transactions' and http_method == 'GET':
            return handle_transactions(event, context)
        
        # Feedback endpoint
        elif path == '/api/feedback' and http_method == 'POST':
            return handle_feedback(event, context)
        
        # Batch prediction endpoint (placeholder)
        elif path == '/api/predict-batch' and http_method == 'POST':
            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'message': 'Batch prediction endpoint - implementation pending',
                    'status': 'placeholder',
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        # Default fallback
        else:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({
                    'error': 'Endpoint not found',
                    'path': path,
                    'method': http_method,
                    'environment': 'local' if IS_LOCAL else 'production'
                })
            }
            
    except Exception as e:
        logger.error(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e),
                'environment': 'local' if IS_LOCAL else 'production'
            })
        }

# For local development using Flask
if __name__ == '__main__':
    from flask import Flask, request, jsonify
    
    app = Flask(__name__)
    
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    def handle_api(path):
        # Convert Flask request to Lambda event format
        event = {
            'httpMethod': request.method,
            'path': f'/api/{path}',
            'queryStringParameters': dict(request.args),
            'body': request.get_data(as_text=True) if request.data else None,
            'headers': dict(request.headers)
        }
        
        # Call Lambda handler
        result = lambda_handler(event, {})
        
        # Convert Lambda response to Flask response
        response = jsonify(json.loads(result['body']))
        response.status_code = result['statusCode']
        
        # Add CORS headers
        for key, value in result['headers'].items():
            response.headers[key] = value
            
        return response
    
    @app.route('/api/health')
    def health():
        return handle_api('health')
    
    print("🚀 SecureFlow API running locally at http://localhost:5000")
    print("📊 Dashboard: http://localhost:5000/api/dashboard")
    print("💳 Predict: POST http://localhost:5000/api/predict")
    print("📋 Transactions: http://localhost:5000/api/transactions")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
