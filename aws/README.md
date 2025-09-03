# AWS Infrastructure (Previous Architecture)

> **📋 STATUS: Legacy/Reference**  
> **These files are preserved for historical reference and potential future AWS deployments.**  
> **Current production deployment uses Fly.io (see main README.md).**

## Files in this directory:

### `infrastructure.yml`
CloudFormation template for the complete AWS infrastructure including:
- CloudFront CDN for frontend distribution
- S3 bucket for static website hosting
- API Gateway for REST API
- Lambda function for backend processing
- PostgreSQL RDS for database
- IAM roles and security groups

### `backend-infrastructure.yml`
Additional backend-specific infrastructure components.

## Why We Migrated to Fly.io

The AWS serverless architecture was replaced with Fly.io for:
- **Simplified deployment**: Single `flyctl deploy` vs complex CloudFormation
- **Better development parity**: Same Docker containers locally and in production
- **Reduced operational complexity**: No Lambda packaging, API Gateway configs, or S3 bucket management
- **Easier debugging**: Direct container access and logs
- **Cost predictability**: Straightforward container pricing

## Using These Files (If Needed)

If you need to deploy to AWS in the future:

1. **Deploy infrastructure:**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure.yml \
     --stack-name secureflow-infrastructure \
     --parameter-overrides Environment=prod \
     --capabilities CAPABILITY_IAM
   ```

2. **Follow the complete guide:**
   See [../AWS_DEPLOYMENT.md](../AWS_DEPLOYMENT.md) for full instructions.

## Current Architecture

For the current Fly.io deployment:
- See [../README.md](../README.md) for quick start
- See [../FLY_CURRENT_ARCHITECTURE.md](../FLY_CURRENT_ARCHITECTURE.md) for detailed architecture
