#!/bin/bash

echo "🚀 Deploying SecureFlow to AWS (CloudFront + S3 + Lambda + API Gateway + PostgreSQL)"
echo "=================================================================="

# Configuration
STACK_NAME="secureflow-production"
REGION="us-east-1"
ENVIRONMENT="prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install and configure AWS CLI."
    exit 1
fi

# Check if AWS is configured
aws sts get-caller-identity > /dev/null 2>&1
if [ $? -ne 0 ]; then
    print_error "AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

print_success "AWS CLI configured correctly"

# Step 1: Deploy Infrastructure
print_step "Step 1: Deploying AWS infrastructure..."

aws cloudformation deploy \
    --template-file aws/infrastructure.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DBPassword="SecureFlow2024!" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    print_success "Infrastructure deployed successfully"
else
    print_error "Infrastructure deployment failed"
    exit 1
fi

# Get stack outputs
print_step "Getting stack outputs..."

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text --region $REGION)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text --region $REGION)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text --region $REGION)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text --region $REGION)

LAMBDA_FUNCTION=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text --region $REGION)

DATABASE_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text --region $REGION)

APPLICATION_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' \
    --output text --region $REGION)

print_success "Retrieved stack outputs"

# Step 2: Build and Deploy Frontend
print_step "Step 2: Building and deploying frontend to S3..."

cd frontend

# Install dependencies and build
npm install
REACT_APP_API_URL=$API_URL npm run build

# Deploy to S3
aws s3 sync build/ s3://$S3_BUCKET --delete --region $REGION

if [ $? -eq 0 ]; then
    print_success "Frontend deployed to S3"
else
    print_error "Frontend deployment failed"
    exit 1
fi

cd ..

# Step 3: Deploy Lambda Function
print_step "Step 3: Deploying Lambda function..."

cd lambda

# Create deployment package
rm -rf deploy_package
mkdir deploy_package

# Copy the PostgreSQL Lambda function
cp lambda_function_postgres.py deploy_package/lambda_function.py
cp requirements_postgres.txt deploy_package/requirements.txt

cd deploy_package

# Install dependencies
pip install -r requirements.txt -t .

# Create deployment zip
zip -r ../secureflow-lambda-deployment.zip . -x "*.pyc" "*__pycache__*"

cd ..

# Update Lambda function
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION \
    --zip-file fileb://secureflow-lambda-deployment.zip \
    --region $REGION

if [ $? -eq 0 ]; then
    print_success "Lambda function updated"
else
    print_error "Lambda function update failed"
    exit 1
fi

# Cleanup
rm -rf deploy_package
rm secureflow-lambda-deployment.zip

cd ..

# Step 4: Invalidate CloudFront Cache
print_step "Step 4: Invalidating CloudFront cache..."

aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --region $REGION > /dev/null

print_success "CloudFront cache invalidated"

# Step 5: Test Deployment
print_step "Step 5: Testing deployment..."

# Test API Gateway
API_HEALTH_URL="$API_URL/api/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_HEALTH_URL)

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "API Gateway health check passed"
else
    print_warning "API Gateway health check returned status: $HTTP_STATUS"
fi

# Final Summary
echo ""
echo "=================================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=================================================================="
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "• Environment: $ENVIRONMENT"
echo "• Region: $REGION"
echo "• Stack Name: $STACK_NAME"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "• Frontend: $APPLICATION_URL"
echo "• API: $API_URL"
echo "• Health Check: $API_HEALTH_URL"
echo ""
echo -e "${BLUE}📦 AWS Resources:${NC}"
echo "• S3 Bucket: $S3_BUCKET"
echo "• CloudFront Distribution: $CLOUDFRONT_ID"
echo "• Lambda Function: $LAMBDA_FUNCTION"
echo "• Database Endpoint: $DATABASE_ENDPOINT"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Test your application at: $APPLICATION_URL"
echo "2. Monitor logs in CloudWatch"
echo "3. Set up custom domain (optional)"
echo "4. Configure monitoring and alerts"
echo ""
echo -e "${GREEN}✅ SecureFlow is now live in production!${NC}"
