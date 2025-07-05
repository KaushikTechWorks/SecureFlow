# SecureFlow AWS Deployment Guide

This guide covers deploying SecureFlow using the modern serverless architecture:
- **Frontend**: CloudFront + S3 (Static Website)
- **Backend**: Lambda + API Gateway + PostgreSQL RDS

## Architecture Overview

```
Internet → CloudFront → S3 (Frontend)
                    → API Gateway → Lambda → PostgreSQL RDS (Backend)
```

## Prerequisites

1. **AWS CLI configured**
   ```bash
   aws configure
   # Enter your AWS Access Key, Secret Key, Region (us-east-1), and output format (json)
   ```

2. **Node.js and npm** (for frontend build)
   ```bash
   node --version  # Should be 16+
   npm --version
   ```

3. **Python 3.11** (for Lambda function)
   ```bash
   python3 --version
   ```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make deployment script executable
chmod +x scripts/deploy-to-aws.sh

# Deploy everything
./scripts/deploy-to-aws.sh
```

This script will:
1. ✅ Deploy AWS infrastructure (CloudFormation)
2. ✅ Build and deploy frontend to S3
3. ✅ Deploy Lambda function with PostgreSQL support
4. ✅ Invalidate CloudFront cache
5. ✅ Test the deployment

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Deploy Infrastructure

```bash
aws cloudformation deploy \
  --template-file aws/infrastructure.yml \
  --stack-name secureflow-production \
  --parameter-overrides Environment=prod DBPassword="YourSecurePassword123!" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

#### Step 2: Get Stack Outputs

```bash
# Get S3 bucket name
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name secureflow-production \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name secureflow-production \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text)

# Get CloudFront Distribution ID
CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
  --stack-name secureflow-production \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

echo "S3 Bucket: $S3_BUCKET"
echo "API URL: $API_URL"
echo "CloudFront ID: $CLOUDFRONT_ID"
```

#### Step 3: Deploy Frontend

```bash
cd frontend

# Install dependencies and build
npm install
REACT_APP_API_URL=$API_URL npm run build

# Deploy to S3
aws s3 sync build/ s3://$S3_BUCKET --delete

cd ..
```

#### Step 4: Deploy Lambda Function

```bash
cd lambda

# Create deployment package
mkdir deploy_package
cp lambda_function_postgres.py deploy_package/lambda_function.py
cp requirements_postgres.txt deploy_package/requirements.txt

cd deploy_package
pip install -r requirements.txt -t .
zip -r ../lambda-deployment.zip . -x "*.pyc" "*__pycache__*"
cd ..

# Update Lambda function
LAMBDA_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name secureflow-production \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
  --output text)

aws lambda update-function-code \
  --function-name $LAMBDA_FUNCTION \
  --zip-file fileb://lambda-deployment.zip

# Cleanup
rm -rf deploy_package lambda-deployment.zip
cd ..
```

#### Step 5: Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*"
```

## Architecture Components

### 1. Frontend (CloudFront + S3)
- **S3**: Hosts static React application files
- **CloudFront**: Global CDN for fast content delivery
- **Domain**: Custom domain support (optional)

### 2. Backend (Lambda + API Gateway + PostgreSQL)
- **API Gateway**: RESTful API endpoints
- **Lambda**: Serverless compute for business logic
- **PostgreSQL RDS**: Managed database for transactions and feedback

### 3. Security
- **IAM Roles**: Least privilege access
- **VPC**: Database isolation
- **HTTPS**: End-to-end encryption
- **CORS**: Proper cross-origin configuration

## Environment Variables

The Lambda function uses these environment variables (auto-configured):

```bash
DATABASE_URL=postgresql://postgres:password@endpoint:5432/secureflow
ENVIRONMENT=prod
```

## API Endpoints

After deployment, your API will be available at:

```
https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/api/health
https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/api/predict
```

## Monitoring and Logs

- **CloudWatch Logs**: `/aws/lambda/secureflow-api-prod`
- **CloudWatch Metrics**: Lambda performance and errors
- **RDS Monitoring**: Database performance metrics

## Cost Optimization

This architecture is cost-effective:
- **Lambda**: Pay only for requests
- **S3**: Minimal storage costs
- **CloudFront**: Free tier available
- **RDS**: t3.micro for development

## Scaling

The architecture automatically scales:
- **Lambda**: Handles concurrent requests
- **CloudFront**: Global edge locations
- **RDS**: Can be upgraded as needed

## Troubleshooting

### Common Issues

1. **Lambda timeout**: Increase timeout in infrastructure.yml
2. **Database connection**: Check security group rules
3. **CORS errors**: Verify API Gateway CORS configuration
4. **Build failures**: Check Node.js/Python versions

### Useful Commands

```bash
# Check Lambda logs
aws logs tail /aws/lambda/secureflow-api-prod --follow

# Test API directly
curl https://your-api-url.amazonaws.com/prod/api/health

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name secureflow-production
```

## Cleanup

To remove all resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name secureflow-production

# Empty S3 bucket first if needed
aws s3 rm s3://your-bucket-name --recursive
```

---

## Next Steps

1. **Custom Domain**: Set up Route 53 for custom domain
2. **SSL Certificate**: Add ACM certificate to CloudFront
3. **Monitoring**: Set up CloudWatch alarms
4. **CI/CD**: Implement GitHub Actions for automated deployments

🎉 **Your SecureFlow application is now running on AWS with a modern, scalable architecture!**
