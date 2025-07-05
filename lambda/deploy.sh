#!/bin/bash

# Deploy SecureFlow Lambda to AWS
# This script packages and deploys the unified app.py to AWS Lambda

set -e

echo "🚀 Deploying SecureFlow Lambda..."

# Clean up any existing package
rm -rf package/ *.zip

# Create package directory
mkdir package

# Install production dependencies
echo "📦 Installing production dependencies..."
pip install -r requirements-production.txt -t package/

# Copy the main application
echo "📋 Copying application code..."
cp lambda_function.py package/

# Create deployment package
echo "🗜️ Creating deployment package..."
cd package
zip -r ../secureflow-lambda.zip .
cd ..

# Deploy to AWS Lambda
echo "☁️ Deploying to AWS Lambda..."
aws lambda update-function-code \
    --function-name secureflow-api \
    --zip-file fileb://secureflow-lambda.zip

echo "✅ Deployment complete!"
echo "🔗 Test your API at: https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod/api/health"

# Clean up
rm -rf package/ secureflow-lambda.zip

echo "🧹 Cleanup complete!"
