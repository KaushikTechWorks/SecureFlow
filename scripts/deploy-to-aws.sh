#!/bin/bash

# AWS ECS Deployment Script for SecureFlow Application
# Prerequisites: AWS CLI configured, Docker installed

set -e

# Configuration
AWS_REGION="us-east-1"  # Your configured region
AWS_ACCOUNT_ID="834620997253"  # Your AWS Account ID
STACK_NAME="secureflow-infrastructure"
CLUSTER_NAME="secureflow-cluster"
SERVICE_NAME="secureflow-service"

echo "🚀 Starting SecureFlow AWS ECS Deployment..."
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Step 1: Deploy Infrastructure
echo "📦 Deploying CloudFormation infrastructure..."
aws cloudformation deploy \
  --template-file aws/infrastructure.yml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $AWS_REGION

# Get stack outputs
BACKEND_REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`BackendRepository`].OutputValue' \
  --output text \
  --region $AWS_REGION)

FRONTEND_REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendRepository`].OutputValue' \
  --output text \
  --region $AWS_REGION)

TASK_EXECUTION_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskExecutionRoleArn`].OutputValue' \
  --output text \
  --region $AWS_REGION)

TASK_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`TaskRoleArn`].OutputValue' \
  --output text \
  --region $AWS_REGION)

SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnets`].OutputValue' \
  --output text \
  --region $AWS_REGION)

SECURITY_GROUP=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroup`].OutputValue' \
  --output text \
  --region $AWS_REGION)

TARGET_GROUP_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`TargetGroup`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo "✅ Infrastructure deployed successfully!"
echo "Backend Repository: $BACKEND_REPO_URI"
echo "Frontend Repository: $FRONTEND_REPO_URI"

# Step 2: Build and Push Docker Images
echo "🐳 Building and pushing Docker images..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
echo "Building backend..."
docker build -t secureflow-backend ./backend
docker tag secureflow-backend:latest $BACKEND_REPO_URI:latest
docker push $BACKEND_REPO_URI:latest

# Build and push frontend
echo "Building frontend..."
docker build -t secureflow-frontend ./frontend
docker tag secureflow-frontend:latest $FRONTEND_REPO_URI:latest
docker push $FRONTEND_REPO_URI:latest

echo "✅ Docker images pushed successfully!"

# Step 3: Update ECS Task Definition
echo "📝 Creating ECS Task Definition..."
sed -e "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" \
    -e "s/YOUR_REGION/$AWS_REGION/g" \
    aws/ecs-task-definition.json > aws/ecs-task-definition-updated.json

# Update task definition with actual role ARNs
sed -i.bak -e "s|arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole|$TASK_EXECUTION_ROLE_ARN|g" \
           -e "s|arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole|$TASK_ROLE_ARN|g" \
           aws/ecs-task-definition-updated.json

# Register task definition
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition-updated.json \
  --region $AWS_REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "✅ Task Definition registered: $TASK_DEFINITION_ARN"

# Step 4: Create ECS Service
echo "🎯 Creating ECS Service..."

# Convert comma-separated subnets to array format
SUBNET_ARRAY=$(echo $SUBNETS | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')

# Create service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_DEFINITION_ARN \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ARRAY],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=secureflow-frontend,containerPort=80" \
  --region $AWS_REGION \
  --enable-execute-command || echo "Service might already exist, updating instead..."

# If service exists, update it
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEFINITION_ARN \
  --region $AWS_REGION || true

echo "✅ ECS Service created/updated successfully!"

# Step 5: Get Application URL
LOAD_BALANCER_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text \
  --region $AWS_REGION)

echo ""
echo "🎉 Deployment Complete!"
echo "=========================================="
echo "Application URL: $LOAD_BALANCER_URL"
echo "ECS Cluster: $CLUSTER_NAME"
echo "ECS Service: $SERVICE_NAME"
echo "=========================================="
echo ""
echo "⏳ Note: It may take a few minutes for the service to become available."
echo "💡 Monitor deployment: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION"

# Cleanup temporary files
rm -f aws/ecs-task-definition-updated.json aws/ecs-task-definition-updated.json.bak

echo "✅ Deployment script completed!"
