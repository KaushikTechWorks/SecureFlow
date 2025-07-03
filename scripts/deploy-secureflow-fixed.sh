#!/bin/bash

# CONSOLIDATED SecureFlow ECS Deployment Script
# This script fixes all the issues we discovered during troubleshooting

set -e

echo "🚀 Deploying SecureFlow to AWS ECS with ALB..."

# Configuration
CLUSTER_NAME="secureflow-cluster"
SERVICE_NAME="secureflow-service"
TASK_FAMILY="secureflow-task"
ALB_NAME="secureflow-alb"
TARGET_GROUP_NAME="secureflow-targets"
AWS_REGION="us-east-1"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Account ID: $ACCOUNT_ID"

# Get existing ALB and Target Group information
echo "🔍 Getting existing ALB and Target Group information..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names $ALB_NAME --query 'LoadBalancers[0].LoadBalancerArn' --output text)
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names $TARGET_GROUP_NAME --query 'TargetGroups[0].TargetGroupArn' --output text)
TARGET_GROUP_VPC=$(aws elbv2 describe-target-groups --target-group-arns $TARGET_GROUP_ARN --query 'TargetGroups[0].VpcId' --output text)

echo "ALB DNS: $ALB_DNS"
echo "Target Group VPC: $TARGET_GROUP_VPC"

# Get subnets and security groups in the target group's VPC
echo "🌐 Getting network configuration for VPC: $TARGET_GROUP_VPC"
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' --output text)
SECURITY_GROUPS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" "Name=group-name,Values=SecureFlow-ECS-SG" --query 'SecurityGroups[0].GroupId' --output text)

if [ "$SECURITY_GROUPS" = "None" ] || [ -z "$SECURITY_GROUPS" ]; then
    SECURITY_GROUPS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" "Name=group-name,Values=secureflow-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text)
fi

echo "Subnets: $SUBNETS"
echo "Security Group: $SECURITY_GROUPS"

# Convert space-separated subnets to comma-separated
SUBNET_LIST=$(echo $SUBNETS | tr ' ' ',')

# Create ECR repositories if they don't exist
echo "📦 Checking ECR repositories..."
aws ecr create-repository --repository-name secureflow-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend repository already exists"
aws ecr create-repository --repository-name secureflow-backend --region $AWS_REGION 2>/dev/null || echo "Backend repository already exists"

# Build and push Docker images (only if not already built)
echo "🏗️ Building and pushing Docker images..."

# Backend
echo "Building backend..."
cd ../backend
docker build -t secureflow-backend .
docker tag secureflow-backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-backend:latest

# Login to ECR and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-backend:latest

# Frontend
echo "Building frontend..."
cd ../frontend
docker build -t secureflow-frontend .
docker tag secureflow-frontend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-frontend:latest

cd ../scripts

# Create ECS Cluster
echo "🏭 Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/secureflow --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Create ECS Task Definition
echo "📋 Creating ECS task definition..."
cat > task-definition.json << EOF
{
    "family": "$TASK_FAMILY",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "frontend",
            "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-frontend:latest",
            "portMappings": [
                {
                    "containerPort": 80,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/secureflow",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "frontend"
                }
            }
        },
        {
            "name": "backend",
            "image": "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-backend:latest",
            "portMappings": [
                {
                    "containerPort": 5001,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "environment": [
                {
                    "name": "FLASK_ENV",
                    "value": "production"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/secureflow",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "backend"
                }
            }
        }
    ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION

# Check if service exists and delete it if it does
echo "🔄 Checking existing ECS service..."
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --query 'services[0].serviceName' --output text 2>/dev/null | grep -q $SERVICE_NAME; then
    echo "Deleting existing service..."
    aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 0
    aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME
    aws ecs delete-service --cluster $CLUSTER_NAME --service $SERVICE_NAME
    echo "Waiting for service deletion..."
    sleep 30
fi

# Create ECS Service with correct VPC configuration
echo "🎯 Creating ECS service in the correct VPC..."
aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$SECURITY_GROUPS],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=$TARGET_GROUP_ARN,containerName=frontend,containerPort=80 \
    --region $AWS_REGION

echo "⏳ Waiting for service to become stable..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME

# Wait for targets to register and become healthy
echo "🏥 Waiting for targets to become healthy..."
sleep 60

# Check target health
echo "✅ Checking target health..."
aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --output table

# Cleanup
rm -f task-definition.json

echo ""
echo "🎉 ECS Deployment completed!"
echo ""
echo "🔗 Your SecureFlow app is available at: http://$ALB_DNS"
echo ""
echo "📊 Summary:"
echo "- ECS Cluster: $CLUSTER_NAME"
echo "- ECS Service: $SERVICE_NAME"
echo "- ALB: $ALB_NAME"
echo "- Target Group: $TARGET_GROUP_NAME"
echo "- VPC: $TARGET_GROUP_VPC"
echo ""
echo "💡 To check application status:"
echo "   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
echo "   aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN"
