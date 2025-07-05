#!/bin/bash

# Simple AWS CLI Backend Deployment Script
# This script provisions PostgreSQL RDS and updates Lambda function

set -e  # Exit on any error

# Configuration
DB_INSTANCE_ID="secureflow-postgres-prod"
DB_NAME="secureflow"
DB_USERNAME="secureflow_user"
DB_PASSWORD="SecureFlow2024!"  # Change this to a secure password
LAMBDA_FUNCTION_NAME="secureflow-api"
REGION="us-east-1"

echo "🚀 Starting SecureFlow Backend Deployment..."
echo "=================================================="

# Step 1: Create RDS PostgreSQL instance
echo "📦 Creating PostgreSQL RDS instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.13 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $(aws ec2 describe-security-groups --filters "Name=group-name,Values=default" --query 'SecurityGroups[0].GroupId' --output text) \
    --db-name $DB_NAME \
    --backup-retention-period 7 \
    --no-multi-az \
    --publicly-accessible \
    --no-storage-encrypted \
    --no-deletion-protection \
    --no-auto-minor-version-upgrade \
    --region $REGION

echo "⏳ Waiting for RDS instance to be available (this may take 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION

# Get RDS endpoint
echo "🔍 Getting RDS endpoint..."
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $REGION)

echo "✅ RDS instance created successfully!"
echo "📍 RDS Endpoint: $RDS_ENDPOINT"

# Step 2: Update Lambda environment variables
echo "🔧 Updating Lambda environment variables..."
aws lambda update-function-configuration \
    --function-name $LAMBDA_FUNCTION_NAME \
    --environment "Variables={DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME,ENVIRONMENT=production}" \
    --region $REGION

echo "✅ Lambda environment updated!"

# Step 3: Package and deploy Lambda code
echo "📦 Packaging Lambda function..."
cd lambda
zip -r ../lambda_postgres.zip . -x "*.pyc" "__pycache__/*"
cd ..

echo "🚀 Deploying Lambda function code..."
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://lambda_postgres.zip \
    --region $REGION

echo "⏳ Waiting for Lambda update to complete..."
aws lambda wait function-updated \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $REGION

echo "✅ Lambda function deployed successfully!"

# Step 4: Test the deployment
echo "🧪 Testing API Gateway health endpoint..."
API_GATEWAY_URL=$(aws apigateway get-rest-apis \
    --query 'items[?name==`secureflow-api`].id' \
    --output text \
    --region $REGION)

if [ -n "$API_GATEWAY_URL" ]; then
    HEALTH_URL="https://$API_GATEWAY_URL.execute-api.$REGION.amazonaws.com/prod/health"
    echo "📍 Testing: $HEALTH_URL"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Health check passed! Backend is working."
        echo "🌐 API Base URL: https://$API_GATEWAY_URL.execute-api.$REGION.amazonaws.com/prod"
    else
        echo "❌ Health check failed (HTTP $HTTP_STATUS)"
        echo "🔍 Check Lambda logs for details:"
        echo "   aws logs tail /aws/lambda/$LAMBDA_FUNCTION_NAME --follow"
    fi
else
    echo "⚠️  Could not find API Gateway - please check manually"
fi

echo ""
echo "🎉 Backend Deployment Complete!"
echo "=================================================="
echo "📋 Summary:"
echo "   • RDS Endpoint: $RDS_ENDPOINT"
echo "   • Database: $DB_NAME"
echo "   • Username: $DB_USERNAME"
echo "   • Lambda Function: $LAMBDA_FUNCTION_NAME"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test API endpoints manually"
echo "   2. Deploy frontend to CloudFront/S3"
echo "   3. Update frontend environment to use new API"
echo ""
echo "📊 Monitor resources:"
echo "   • Lambda logs: aws logs tail /aws/lambda/$LAMBDA_FUNCTION_NAME --follow"
echo "   • RDS status: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID"
