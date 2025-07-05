#!/bin/bash

echo "🚀 Deploying SecureFlow Lambda with PostgreSQL to AWS..."

# Configuration
FUNCTION_NAME="secureflow-api"
REGION="us-east-1"
ROLE_NAME="secureflow-lambda-role"

# Load RDS configuration
if [ -f "rds-config.env" ]; then
    source rds-config.env
    echo "✅ Loaded RDS configuration"
else
    echo "❌ RDS configuration not found. Run setup-rds-postgres.sh first!"
    exit 1
fi

# Navigate to lambda directory
cd lambda

echo "📦 Creating deployment package..."

# Create clean deployment directory
rm -rf deploy_package
mkdir deploy_package

# Copy PostgreSQL Lambda function
cp lambda_function_postgres.py deploy_package/lambda_function.py
cp requirements_postgres.txt deploy_package/requirements.txt

cd deploy_package

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt -t .

# Create the deployment package
echo "📦 Creating deployment zip..."
zip -r ../secureflow-lambda-postgres.zip . -x "*.pyc" "*__pycache__*"

cd ..

# Upload to Lambda
echo "🚀 Updating Lambda function..."

# Update function code
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://secureflow-lambda-postgres.zip \
    --region $REGION

# Update environment variables
echo "🔧 Setting environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{
        DATABASE_URL=$DATABASE_URL,
        DB_HOST=$DB_HOST,
        DB_PORT=$DB_PORT,
        DB_NAME=$DB_NAME,
        DB_USERNAME=$DB_USERNAME,
        DB_PASSWORD=$DB_PASSWORD
    }" \
    --region $REGION

# Update timeout and memory (PostgreSQL connections need more resources)
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout 30 \
    --memory-size 512 \
    --region $REGION

echo "✅ Lambda function updated successfully!"

# Test the deployment
echo "🧪 Testing Lambda function..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod":"GET","path":"/api/health"}' \
    --region $REGION \
    response.json

echo "📄 Lambda response:"
cat response.json
echo ""

# Get API Gateway URL
API_URL=$(aws apigateway get-rest-apis --query 'items[?name==`secureflow-api`].id' --output text)
if [ ! -z "$API_URL" ]; then
    echo "🌐 API Gateway URL: https://$API_URL.execute-api.$REGION.amazonaws.com/prod"
    echo "🔗 Health Check: https://$API_URL.execute-api.$REGION.amazonaws.com/prod/api/health"
fi

echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test your API endpoints"
echo "2. Update frontend to use the new API"
echo "3. Monitor CloudWatch logs for any issues"

# Cleanup
rm -rf deploy_package
rm response.json
