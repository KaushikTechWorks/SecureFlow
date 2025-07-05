#!/bin/bash

# Step-by-step Backend Deployment
# Run each function individually for better control and debugging

set -e

# Configuration
DB_INSTANCE_ID="secureflow-postgres-prod"
DB_NAME="secureflow"
DB_USERNAME="secureflow_user"
DB_PASSWORD="SecureFlow2024!"
LAMBDA_FUNCTION_NAME="secureflow-api"
REGION="us-east-1"

# Function to create RDS instance
create_rds() {
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
        --vpc-security-group-ids sg-0cef058120f9b7564 \
        --db-name $DB_NAME \
        --backup-retention-period 7 \
        --no-multi-az \
        --publicly-accessible \
        --no-storage-encrypted \
        --no-deletion-protection \
        --no-auto-minor-version-upgrade \
        --region $REGION
    
    echo "✅ RDS creation initiated. Check status with: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID"
}

# Function to wait for RDS to be ready
wait_rds() {
    echo "⏳ Waiting for RDS instance to be available..."
    aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID --region $REGION
    echo "✅ RDS instance is now available!"
}

# Function to get RDS endpoint
get_rds_endpoint() {
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text \
        --region $REGION)
    echo "📍 RDS Endpoint: $RDS_ENDPOINT"
    export RDS_ENDPOINT
}

# Function to update Lambda environment
update_lambda_env() {
    echo "🔧 Updating Lambda environment variables..."
    aws lambda update-function-configuration \
        --function-name $LAMBDA_FUNCTION_NAME \
        --environment "Variables={DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME,ENVIRONMENT=production}" \
        --region $REGION
    echo "✅ Lambda environment updated!"
}

# Function to deploy Lambda code
deploy_lambda_code() {
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
    echo "✅ Lambda function deployed!"
}

# Function to test deployment
test_deployment() {
    echo "🧪 Testing API Gateway health endpoint..."
    API_GATEWAY_URL=$(aws apigateway get-rest-apis \
        --query 'items[?name==`secureflow-api`].id' \
        --output text \
        --region $REGION)
    
    if [ -n "$API_GATEWAY_URL" ]; then
        HEALTH_URL="https://$API_GATEWAY_URL.execute-api.$REGION.amazonaws.com/prod/health"
        echo "📍 Testing: $HEALTH_URL"
        
        echo "Waiting 30 seconds for Lambda to warm up..."
        sleep 30
        
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "✅ Health check passed!"
            curl -s "$HEALTH_URL" | jq .
        else
            echo "❌ Health check failed (HTTP $HTTP_STATUS)"
            echo "Response:"
            curl -s "$HEALTH_URL"
        fi
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "📊 Current Status:"
    echo "=================="
    
    # RDS Status
    aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
        --output table 2>/dev/null || echo "RDS: Not found"
    
    # Lambda Status
    aws lambda get-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --query 'Configuration.[State,LastUpdateStatus]' \
        --output table 2>/dev/null || echo "Lambda: Not found"
}

# Main execution based on argument
case "${1:-all}" in
    "rds")
        create_rds
        ;;
    "wait")
        wait_rds
        ;;
    "endpoint")
        get_rds_endpoint
        ;;
    "lambda-env")
        get_rds_endpoint
        update_lambda_env
        ;;
    "lambda-code")
        deploy_lambda_code
        ;;
    "test")
        test_deployment
        ;;
    "status")
        show_status
        ;;
    "all")
        create_rds
        wait_rds
        get_rds_endpoint
        update_lambda_env
        deploy_lambda_code
        test_deployment
        ;;
    *)
        echo "Usage: $0 [rds|wait|endpoint|lambda-env|lambda-code|test|status|all]"
        echo ""
        echo "Steps:"
        echo "  rds        - Create RDS instance"
        echo "  wait       - Wait for RDS to be ready"
        echo "  endpoint   - Get RDS endpoint"
        echo "  lambda-env - Update Lambda environment"
        echo "  lambda-code- Deploy Lambda code"
        echo "  test       - Test the deployment"
        echo "  status     - Show current status"
        echo "  all        - Run all steps (default)"
        ;;
esac
