#!/bin/bash

# Deploy SecureFlow Lambda Function
set -e

echo "🚀 Deploying SecureFlow to Lambda + API Gateway..."

# Variables
FUNCTION_NAME="secureflow-api"
REGION="us-east-1"
ZIP_FILE="secureflow-lambda.zip"

cd /Users/kaushiksamayam/Elevate/Projects/SecureFlow-1/lambda

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
rm -f $ZIP_FILE

# Create a temporary directory for dependencies
mkdir -p package

# Install dependencies
echo "⬇️ Installing Python dependencies..."
pip install -r requirements.txt -t package/

# Copy our Lambda function
cp lambda_function.py package/

# Create ZIP file
cd package
zip -r ../$ZIP_FILE .
cd ..

# Clean up
rm -rf package

echo "✅ Deployment package created: $ZIP_FILE"

# Step 2: Create or update Lambda function
echo "🔧 Creating/updating Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$ZIP_FILE \
        --region $REGION
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 30 \
        --memory-size 512 \
        --region $REGION
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role arn:aws:iam::834620997253:role/lambda-execution-role \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://$ZIP_FILE \
        --timeout 30 \
        --memory-size 512 \
        --region $REGION
fi

echo "✅ Lambda function deployed: $FUNCTION_NAME"

# Step 3: Create API Gateway
echo "🌐 Setting up API Gateway..."

# Create REST API
API_ID=$(aws apigateway create-rest-api \
    --name "secureflow-api" \
    --description "SecureFlow API Gateway" \
    --region $REGION \
    --query 'id' --output text)

echo "📝 API Gateway created with ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/`].id' --output text)

# Create /api resource
API_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "api" \
    --region $REGION \
    --query 'id' --output text)

# Create proxy resource {proxy+}
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part "{proxy+}" \
    --region $REGION \
    --query 'id' --output text)

# Create ANY method for proxy resource
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query 'Configuration.FunctionArn' --output text)

# Create integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

# Add Lambda permission
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:apigateway:$REGION::/restapis/$API_ID/*/*" \
    --region $REGION

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "🎉 Deployment completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Lambda Function: $FUNCTION_NAME"
echo "  ✅ API Gateway ID: $API_ID"
echo "  ✅ API Endpoint: $API_ENDPOINT"
echo ""
echo "🔗 Test endpoints:"
echo "  Health: $API_ENDPOINT/api/health"
echo "  Predict: $API_ENDPOINT/api/predict (POST)"
echo "  Dashboard: $API_ENDPOINT/api/dashboard"
echo ""
echo "💡 Save this API endpoint for frontend configuration!"
