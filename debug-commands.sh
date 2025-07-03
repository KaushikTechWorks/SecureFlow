#!/bin/bash

echo "=== SecureFlow API Debug Commands ==="
echo "Run these to test the API directly:"
echo ""

echo "1. Test Health Endpoint:"
echo "curl https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod/api/health"
echo ""

echo "2. Test Predict Endpoint (Normal Transaction):"
echo 'curl -X POST "https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod/api/predict" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "amount": 150.50,
    "hour": 14,
    "day_of_week": 2,
    "merchant_category": 1,
    "transaction_type": 0
  }'"'"' | jq .'
echo ""

echo "3. Test Predict Endpoint (High Amount - Should be Anomaly):"
echo 'curl -X POST "https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod/api/predict" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "amount": 5000.00,
    "hour": 3,
    "day_of_week": 0,
    "merchant_category": 1,
    "transaction_type": 0
  }'"'"' | jq .'
echo ""

echo "4. Frontend URL:"
echo "http://secureflow-frontend-1751504254.s3-website-us-east-1.amazonaws.com"
echo ""

echo "=== What to Check ==="
echo "✅ Frontend loads without errors"
echo "✅ Form accepts input values"
echo "✅ 'Analyze Transaction' button works"
echo "✅ Results show up with prediction details"
echo "✅ SHAP analysis shows key factors"
echo ""

echo "=== How to Report Issues ==="
echo "If there are problems, tell me:"
echo "1. What error message you see"
echo "2. Browser console errors (F12 -> Console tab)"
echo "3. Network errors (F12 -> Network tab)"
echo "4. Result of running the curl commands above"
