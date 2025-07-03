#!/usr/bin/env python3
"""
Unit tests for SecureFlow Lambda function
"""
import json
import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add parent directory to path to import lambda_function
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import lambda_function

class TestSecureFlowLambda(unittest.TestCase):
    """Test cases for SecureFlow Lambda functions"""

    def setUp(self):
        """Set up test fixtures"""
        self.context = MagicMock()
        self.context.aws_request_id = 'test-request-id'
        self.context.function_name = 'test-function'

    def test_health_endpoint(self):
        """Test health check endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/health',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('application/json', response['headers']['Content-Type'])
        
        body = json.loads(response['body'])
        self.assertEqual(body['status'], 'healthy')
        self.assertEqual(body['service'], 'SecureFlow API')
        self.assertIn('timestamp', body)

    def test_predict_endpoint_valid_transaction(self):
        """Test predict endpoint with valid transaction data"""
        transaction_data = {
            'amount': 150.50,
            'hour': 14,
            'day_of_week': 2,
            'merchant_category': 1,
            'transaction_type': 0
        }
        
        event = {
            'httpMethod': 'POST',
            'path': '/api/predict',
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(transaction_data),
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('is_anomaly', body)
        self.assertIn('anomaly_score', body)
        self.assertIn('risk_level', body)
        self.assertIn('confidence', body)

    def test_predict_endpoint_high_amount_anomaly(self):
        """Test predict endpoint detects high amount anomaly"""
        transaction_data = {
            'amount': 5000.00,  # High amount should trigger anomaly
            'hour': 3,  # Unusual hour
            'day_of_week': 0,
            'merchant_category': 1,
            'transaction_type': 0
        }
        
        event = {
            'httpMethod': 'POST',
            'path': '/api/predict',
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(transaction_data),
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertTrue(body['is_anomaly'])
        self.assertGreater(body['anomaly_score'], 0.5)
        self.assertIn(body['risk_level'], ['Medium', 'High'])

    def test_predict_endpoint_invalid_json(self):
        """Test predict endpoint with invalid JSON"""
        event = {
            'httpMethod': 'POST',
            'path': '/api/predict',
            'headers': {'Content-Type': 'application/json'},
            'body': 'invalid json',
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 400)
        
        body = json.loads(response['body'])
        self.assertIn('error', body)

    def test_transactions_endpoint_get(self):
        """Test GET transactions endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/transactions',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': {'limit': '10'}
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('transactions', body)
        self.assertIsInstance(body['transactions'], list)

    def test_transactions_endpoint_post(self):
        """Test POST transactions endpoint"""
        transaction_data = {
            'amount': 250.75,
            'merchant': 'Test Merchant',
            'category': 'Retail',
            'description': 'Test transaction'
        }
        
        event = {
            'httpMethod': 'POST',
            'path': '/api/transactions',
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(transaction_data),
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 201)
        
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertIn('transaction_id', body)

    def test_analytics_endpoint(self):
        """Test analytics endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/analytics',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('total_transactions', body)
        self.assertIn('anomaly_rate', body)
        self.assertIn('risk_distribution', body)

    def test_compliance_endpoint(self):
        """Test compliance endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/compliance',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('compliance_status', body)
        self.assertIn('last_updated', body)

    def test_fraud_check_endpoint(self):
        """Test fraud check endpoint"""
        check_data = {
            'transaction_id': 'test-123',
            'amount': 1500.00,
            'merchant': 'Suspicious Merchant'
        }
        
        event = {
            'httpMethod': 'POST',
            'path': '/api/fraud-check',
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(check_data),
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('fraud_score', body)
        self.assertIn('risk_factors', body)
        self.assertIn('recommendation', body)

    def test_root_endpoint(self):
        """Test root endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertIn('version', body)

    def test_unknown_endpoint(self):
        """Test unknown endpoint returns 404"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/unknown',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 404)
        
        body = json.loads(response['body'])
        self.assertIn('error', body)

    def test_cors_headers(self):
        """Test CORS headers are present in all responses"""
        event = {
            'httpMethod': 'GET',
            'path': '/api/health',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertIn('Access-Control-Allow-Origin', response['headers'])
        self.assertEqual(response['headers']['Access-Control-Allow-Origin'], '*')
        self.assertIn('Access-Control-Allow-Headers', response['headers'])
        self.assertIn('Access-Control-Allow-Methods', response['headers'])

    def test_options_method(self):
        """Test OPTIONS method for CORS preflight"""
        event = {
            'httpMethod': 'OPTIONS',
            'path': '/api/predict',
            'headers': {'Content-Type': 'application/json'},
            'body': None,
            'queryStringParameters': None
        }
        
        response = lambda_function.lambda_handler(event, self.context)
        
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('Access-Control-Allow-Origin', response['headers'])

if __name__ == '__main__':
    unittest.main()
