import json
import boto3
import random
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

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
            'service': 'SecureFlow API',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0-serverless'
        })
    }

def handle_predict(event, context):
    """Handle single transaction prediction - simplified version"""
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Extract features
        amount = float(body.get('amount', 0))
        hour = int(body.get('hour', 12))
        day_of_week = int(body.get('day_of_week', 1))
        merchant_category = int(body.get('merchant_category', 0))
        transaction_type = int(body.get('transaction_type', 0))
        
        # Simple rule-based anomaly detection for now
        # We'll replace this with ML model later
        is_anomaly = False
        anomaly_score = 0.0
        risk_level = 'Low'
        
        # Simple rules for anomaly detection
        if amount > 1000:  # High amount
            is_anomaly = True
            anomaly_score = -0.8
            risk_level = 'High'
        elif hour < 6 or hour > 22:  # Unusual hours
            is_anomaly = True
            anomaly_score = -0.6
            risk_level = 'Medium'
        elif amount < 1:  # Very small amount
            is_anomaly = True
            anomaly_score = -0.4
            risk_level = 'Medium'
        else:
            # Normal transaction
            anomaly_score = random.uniform(0.1, 0.3)
            risk_level = 'Low'
        
        # Mock explanation
        explanation = {
            'amount': {
                'value': amount,
                'impact': 'High' if amount > 1000 else 'Low'
            },
            'hour': {
                'value': hour,
                'impact': 'High' if hour < 6 or hour > 22 else 'Low'
            },
            'day_of_week': {
                'value': day_of_week,
                'impact': 'Low'
            },
            'merchant_category': {
                'value': merchant_category,
                'impact': 'Low'
            },
            'transaction_type': {
                'value': transaction_type,
                'impact': 'Low'
            }
        }
        
        # Generate transaction ID
        transaction_id = random.randint(1000, 9999)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({
                'transaction_id': transaction_id,
                'is_anomaly': is_anomaly,
                'anomaly_score': anomaly_score,
                'confidence': abs(anomaly_score),
                'explanation': explanation,
                'risk_level': risk_level,
                'message': 'Prediction completed successfully'
            })
        }
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

def handle_dashboard(event, context):
    """Handle dashboard data request - mock data for now"""
    try:
        # Mock dashboard data
        dashboard_data = {
            'total_transactions': random.randint(100, 1000),
            'anomalies_detected': random.randint(5, 50),
            'avg_anomaly_score': round(random.uniform(-0.8, 0.3), 3),
            'detection_rate': round(random.uniform(5, 15), 2),
            'last_updated': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps(dashboard_data)
        }
        
    except Exception as e:
        logger.error(f"Error in dashboard: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

def handle_transactions(event, context):
    """Handle transactions list request - mock data"""
    try:
        # Mock transaction data
        transactions = []
        for i in range(10):
            transactions.append({
                'id': random.randint(1000, 9999),
                'amount': round(random.uniform(10, 1500), 2),
                'timestamp': datetime.now().isoformat(),
                'is_anomaly': random.choice([True, False]),
                'risk_level': random.choice(['Low', 'Medium', 'High']),
                'merchant_category': random.randint(0, 9)
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({'transactions': transactions})
        }
        
    except Exception as e:
        logger.error(f"Error in transactions: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

def handle_root(event, context):
    """Root endpoint - API information"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps({
            'message': 'SecureFlow API is running',
            'version': '2.0-serverless',
            'timestamp': datetime.now().isoformat(),
            'available_endpoints': [
                'GET /',
                'GET /health',
                'GET /api/health',
                'GET /api/transactions',
                'POST /api/transactions',
                'GET /api/analytics',
                'GET /api/search',
                'POST /api/fraud-check',
                'GET /api/compliance/report'
            ]
        })
    }

def handle_create_transaction(event, context):
    """Create a new transaction"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Generate a simple transaction
        transaction = {
            'id': f"tx_{random.randint(100000, 999999)}",
            'amount': float(body.get('amount', 0)),
            'description': body.get('description', 'Transaction'),
            'category': body.get('category', 'general'),
            'merchant': body.get('merchant', 'Unknown'),
            'timestamp': datetime.now().isoformat(),
            'status': 'completed'
        }
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(transaction)
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid request', 'message': str(e)})
        }

def handle_get_transaction(event, context):
    """Get a specific transaction by ID"""
    try:
        path = event.get('path', '')
        transaction_id = path.split('/')[-1]
        
        # Mock transaction data
        transaction = {
            'id': transaction_id,
            'amount': 150.00,
            'description': f'Transaction {transaction_id}',
            'category': 'general',
            'merchant': 'Sample Merchant',
            'timestamp': datetime.now().isoformat(),
            'status': 'completed'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(transaction)
        }
    except Exception as e:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Transaction not found', 'message': str(e)})
        }

def handle_analytics(event, context):
    """Get analytics data"""
    analytics = {
        'total_transactions': 150,
        'total_amount': 45600.75,
        'average_amount': 304.00,
        'transactions_today': 12,
        'fraud_detected': 2,
        'compliance_score': 98.5,
        'top_categories': [
            {'category': 'retail', 'count': 45, 'amount': 12500.00},
            {'category': 'food', 'count': 32, 'amount': 8750.50},
            {'category': 'transport', 'count': 28, 'amount': 5600.25}
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(analytics)
    }

def handle_search(event, context):
    """Search transactions"""
    try:
        query_params = event.get('queryStringParameters') or {}
        search_query = query_params.get('q', '')
        
        # Mock search results
        results = [
            {
                'id': f"tx_{random.randint(100000, 999999)}",
                'amount': 125.50,
                'description': f'Search result for: {search_query}',
                'timestamp': datetime.now().isoformat(),
                'relevance_score': 0.95
            },
            {
                'id': f"tx_{random.randint(100000, 999999)}",
                'amount': 75.25,
                'description': f'Another match for: {search_query}',
                'timestamp': datetime.now().isoformat(),
                'relevance_score': 0.87
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(results)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Search failed', 'message': str(e)})
        }

def handle_fraud_check(event, context):
    """Fraud detection endpoint"""
    try:
        body = json.loads(event.get('body', '{}'))
        amount = float(body.get('amount', 0))
        
        # Simple fraud detection logic
        risk_score = 0.1  # Base risk
        
        if amount > 5000:
            risk_score += 0.4
        if amount > 10000:
            risk_score += 0.3
        
        is_suspicious = risk_score > 0.5
        
        result = {
            'transaction_id': f"tx_{random.randint(100000, 999999)}",
            'risk_score': round(risk_score, 2),
            'is_suspicious': is_suspicious,
            'risk_factors': [],
            'recommendation': 'approve' if not is_suspicious else 'review'
        }
        
        if amount > 5000:
            result['risk_factors'].append('High amount transaction')
        if amount > 10000:
            result['risk_factors'].append('Very high amount transaction')
            
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Fraud check failed', 'message': str(e)})
        }

def handle_compliance_report(event, context):
    """Generate compliance report"""
    report = {
        'report_date': datetime.now().isoformat(),
        'period': 'last_30_days',
        'total_transactions': 1250,
        'flagged_transactions': 15,
        'compliance_rate': 98.8,
        'risk_distribution': {
            'low': 1180,
            'medium': 55,
            'high': 15
        },
        'regulatory_status': 'compliant',
        'recommendations': [
            'Continue monitoring high-value transactions',
            'Review flagged transactions within 24 hours',
            'Update fraud detection rules monthly'
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(report)
    }

def lambda_handler(event, context):
    """Main Lambda handler that routes requests"""
    
    try:
        # Get the HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Handle API Gateway proxy path format
        if 'requestContext' in event and 'path' in event['requestContext']:
            full_path = event['requestContext']['path']
            # Remove the stage prefix (e.g., /prod)
            if full_path.startswith('/prod'):
                path = full_path[5:]  # Remove '/prod'
            else:
                path = full_path
        
        logger.info(f"Received {http_method} request for path: {path}")
        
        # Handle CORS preflight requests
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                },
                'body': ''
            }
        
        # Normalize path - handle both /api/xxx and /xxx patterns
        normalized_path = path
        if not normalized_path.startswith('/api/') and normalized_path != '/':
            if normalized_path.startswith('/'):
                normalized_path = f"/api{normalized_path}"
            else:
                normalized_path = f"/api/{normalized_path}"
        
        # Route requests based on normalized path
        if normalized_path in ['/api/health', '/health']:
            return handle_health(event, context)
        elif normalized_path == '/':
            return handle_root(event, context)
        elif normalized_path == '/api/predict' and http_method == 'POST':
            return handle_predict(event, context)
        elif normalized_path == '/api/dashboard' and http_method == 'GET':
            return handle_dashboard(event, context)
        elif normalized_path in ['/api/transactions', '/transactions'] and http_method == 'GET':
            return handle_transactions(event, context)
        elif normalized_path in ['/api/transactions', '/transactions'] and http_method == 'POST':
            return handle_create_transaction(event, context)
        elif normalized_path.startswith('/api/transactions/') and http_method == 'GET':
            return handle_get_transaction(event, context)
        elif normalized_path in ['/api/analytics', '/analytics'] and http_method == 'GET':
            return handle_analytics(event, context)
        elif normalized_path in ['/api/search', '/search'] and http_method == 'GET':
            return handle_search(event, context)
        elif normalized_path in ['/api/fraud-check', '/fraud-check'] and http_method == 'POST':
            return handle_fraud_check(event, context)
        elif normalized_path in ['/api/compliance/report', '/compliance/report'] and http_method == 'GET':
            return handle_compliance_report(event, context)
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Endpoint not found',
                    'path': path,
                    'normalized_path': normalized_path,
                    'method': http_method,
                    'available_endpoints': [
                        'GET /',
                        'GET /health',
                        'GET /api/health',
                        'POST /api/predict',
                        'GET /api/dashboard',
                        'GET /api/transactions',
                        'POST /api/transactions',
                        'GET /api/transactions/{id}',
                        'GET /api/analytics',
                        'GET /api/search',
                        'POST /api/fraud-check',
                        'GET /api/compliance/report'
                    ]
                })
            }
    
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
