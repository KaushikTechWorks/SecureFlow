#!/usr/bin/env python3
"""
SecureFlow API Integration Tests

This test suite verifies all API endpoints work correctly with the Lambda backend.
Tests include health checks, transaction operations, analytics, and compliance features.
"""

import requests
import json
import time
import random
import unittest
from datetime import datetime, timedelta
import sys
import os

# Configuration
API_BASE_URL = "https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod"
TIMEOUT = 30  # seconds

class SecureFlowAPITests(unittest.TestCase):
    """Integration tests for SecureFlow API"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        print("🚀 Starting SecureFlow API Integration Tests")
        print(f"📡 Testing API at: {API_BASE_URL}")
        cls.test_transactions = []
        cls.session = requests.Session()
        cls.session.timeout = TIMEOUT
        
    def setUp(self):
        """Set up for each test"""
        print(f"\n🧪 Running: {self.id().split('.')[-1]}")
        
    def test_01_health_check(self):
        """Test API health endpoint"""
        print("   Checking API health...")
        response = self.session.get(f"{API_BASE_URL}/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)
        print("   ✅ Health check passed")
        
    def test_02_api_info(self):
        """Test API info endpoint"""
        print("   Getting API information...")
        response = self.session.get(f"{API_BASE_URL}/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['message'], 'SecureFlow API is running')
        self.assertIn('version', data)
        print(f"   ✅ API Info: {data['message']} v{data['version']}")

    def test_03_create_transaction(self):
        """Test creating a new transaction"""
        print("   Creating test transaction...")
        
        test_transaction = {
            "amount": 1500.00,
            "description": "Integration Test Transaction",
            "category": "testing",
            "merchant": "Test Merchant Inc"
        }
        
        response = self.session.post(
            f"{API_BASE_URL}/transactions",
            json=test_transaction,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['amount'], test_transaction['amount'])
        self.assertEqual(data['description'], test_transaction['description'])
        
        # Store for later tests
        self.__class__.test_transactions.append(data)
        print(f"   ✅ Transaction created with ID: {data['id']}")

    def test_04_get_transactions(self):
        """Test retrieving all transactions"""
        print("   Retrieving all transactions...")
        
        response = self.session.get(f"{API_BASE_URL}/transactions")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Fix: The API returns an object with 'transactions' key, not a direct list
        self.assertIn('transactions', data)
        self.assertIsInstance(data['transactions'], list)
        
        if len(data['transactions']) > 0:
            # Verify transaction structure
            transaction = data['transactions'][0]
            required_fields = ['id', 'amount', 'description', 'timestamp']
            for field in required_fields:
                self.assertIn(field, transaction)
                
        print(f"   ✅ Retrieved {len(data)} transactions")

    def test_05_get_single_transaction(self):
        """Test retrieving a specific transaction"""
        if not self.__class__.test_transactions:
            self.skipTest("No test transactions available")
            
        transaction_id = self.__class__.test_transactions[0]['id']
        print(f"   Retrieving transaction {transaction_id}...")
        
        response = self.session.get(f"{API_BASE_URL}/transactions/{transaction_id}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], transaction_id)
        print(f"   ✅ Retrieved transaction: {data['description']}")

    def test_06_analytics_endpoint(self):
        """Test analytics endpoint"""
        print("   Getting analytics data...")
        
        response = self.session.get(f"{API_BASE_URL}/analytics")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check required analytics fields
        required_fields = ['total_transactions', 'total_amount', 'average_amount']
        for field in required_fields:
            self.assertIn(field, data)
            
        print(f"   ✅ Analytics: {data['total_transactions']} transactions, "
              f"${data['total_amount']:.2f} total")

    def test_07_search_transactions(self):
        """Test transaction search functionality"""
        print("   Testing transaction search...")
        
        # Search with query parameter
        response = self.session.get(f"{API_BASE_URL}/search?q=test")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        print(f"   ✅ Search returned {len(data)} results")

    def test_08_fraud_detection(self):
        """Test fraud detection endpoint"""
        print("   Testing fraud detection...")
        
        test_transaction = {
            "amount": 10000.00,  # High amount to trigger fraud detection
            "description": "Suspicious large transaction",
            "merchant": "Unknown Merchant"
        }
        
        response = self.session.post(
            f"{API_BASE_URL}/fraud-check",
            json=test_transaction,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Fix: API returns 'fraud_score' not 'risk_score'
        self.assertIn('fraud_score', data)
        self.assertIn('is_suspicious', data)
        print(f"   ✅ Fraud check: Fraud score {data['fraud_score']}, "
              f"Suspicious: {data['is_suspicious']}")

    def test_09_compliance_report(self):
        """Test compliance reporting endpoint"""
        print("   Testing compliance report...")
        
        response = self.session.get(f"{API_BASE_URL}/compliance/report")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('report_date', data)
        self.assertIn('total_transactions', data)
        print("   ✅ Compliance report generated successfully")

    def test_10_error_handling(self):
        """Test API error handling"""
        print("   Testing error handling...")
        
        # Test non-existent endpoint
        response = self.session.get(f"{API_BASE_URL}/nonexistent")
        self.assertEqual(response.status_code, 404)
        
        # Test invalid transaction ID
        response = self.session.get(f"{API_BASE_URL}/transactions/invalid-id")
        self.assertEqual(response.status_code, 404)
        
        # Test malformed JSON
        response = self.session.post(
            f"{API_BASE_URL}/transactions",
            data="invalid json",
            headers={'Content-Type': 'application/json'}
        )
        self.assertEqual(response.status_code, 400)
        
        print("   ✅ Error handling working correctly")

    def test_11_performance_check(self):
        """Test API response performance"""
        print("   Testing API performance...")
        
        start_time = time.time()
        response = self.session.get(f"{API_BASE_URL}/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        self.assertEqual(response.status_code, 200)
        self.assertLess(response_time, 5.0, "API response too slow")
        
        print(f"   ✅ Response time: {response_time:.3f}s")

    def test_12_cors_headers(self):
        """Test CORS headers are present"""
        print("   Testing CORS headers...")
        
        response = self.session.get(f"{API_BASE_URL}/health")
        
        self.assertEqual(response.status_code, 200)
        # Check for CORS headers
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            self.assertIn(header, response.headers)
            
        print("   ✅ CORS headers present")

    def test_99_cleanup(self):
        """Clean up test data"""
        print("   Cleaning up test data...")
        
        # In a real scenario, you might want to clean up test transactions
        # For now, we'll just report what we created
        if self.__class__.test_transactions:
            print(f"   📝 Created {len(self.__class__.test_transactions)} test transactions")
            for tx in self.__class__.test_transactions:
                print(f"      - {tx['id']}: {tx['description']}")
        
        print("   ✅ Cleanup completed")

def run_tests():
    """Run all integration tests"""
    print("=" * 60)
    print("🔒 SECUREFLOW API INTEGRATION TESTS")
    print("=" * 60)
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(SecureFlowAPITests)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(
        verbosity=2,
        stream=sys.stdout,
        buffer=True
    )
    
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\n❌ FAILURES:")
        for test, error in result.failures:
            print(f"  - {test}: {error}")
    
    if result.errors:
        print("\n💥 ERRORS:")
        for test, error in result.errors:
            print(f"  - {test}: {error}")
    
    if result.wasSuccessful():
        print("\n🎉 ALL TESTS PASSED! API is working correctly.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED! Check the API implementation.")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
