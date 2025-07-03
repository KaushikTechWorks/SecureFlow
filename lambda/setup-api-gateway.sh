#!/bin/bash

# Setup API Gateway for SecureFlow Lambda
set -e

echo "🌐 Setting up API Gateway for SecureFlow..."

# Step 1: Create REST API
echo "📋 Step 1: Creating REST API..."
API_ID=$(aws apigateway create-rest-api \
    --name "secureflow-api" \
    --description "SecureFlow API Gateway" \
    --endpoint-configuration types=REGIONAL \
    --query 'id' --output text)

echo "✅ API Gateway created with ID: $API_ID"

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[0].id' --output text)

echo "📋 Root resource ID: $ROOT_RESOURCE_ID"

# Step 2: Create {proxy+} resource for catch-all routing
echo "📋 Step 2: Creating proxy resource..."
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "{proxy+}" \
    --query 'id' --output text)

echo "✅ Proxy resource created with ID: $PROXY_RESOURCE_ID"

# Step 3: Create ANY method for the proxy resource
echo "📋 Step 3: Creating ANY method..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE

echo "✅ ANY method created"

# Step 4: Set up Lambda integration
echo "📋 Step 4: Setting up Lambda integration..."
LAMBDA_ARN="arn:aws:lambda:us-east-1:834620997253:function:secureflow-api"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

echo "✅ Lambda integration configured"

# Step 5: Create method response
echo "📋 Step 5: Creating method response..."
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --status-code 200

echo "✅ Method response created"

# Step 6: Give API Gateway permission to invoke Lambda
echo "📋 Step 6: Setting up Lambda permissions..."
aws lambda add-permission \
    --function-name secureflow-api \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:apigateway:us-east-1::/restapis/$API_ID/*/*" \
    2>/dev/null || echo "Permission already exists"

echo "✅ Lambda permissions configured"

# Step 7: Deploy the API
echo "📋 Step 7: Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

echo "✅ API deployed to 'prod' stage"

# Step 8: Get the API URL
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
echo ""
echo "🎉 API Gateway Setup Complete!"
echo "📋 API Details:"
echo "  API ID: $API_ID"
echo "  API URL: $API_URL"
echo "  Stage: prod"
echo ""
echo "🧪 Test your API:"
echo "  curl $API_URL/health"
echo "  curl $API_URL/api/transactions"
echo ""

# Save API URL to a file for frontend configuration
echo $API_URL > ../api-url.txt
echo "💾 API URL saved to api-url.txt"
