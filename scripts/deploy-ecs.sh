#!/bin/bash

# ECS + ALB + HTTPS Deployment Script for SecureFlow
set -e

echo "🚀 Deploying SecureFlow to AWS ECS with HTTPS..."

# Configuration
CLUSTER_NAME="secureflow-cluster"
SERVICE_NAME="secureflow-service"
TASK_FAMILY="secureflow-task"
ALB_NAME="secureflow-alb"
TARGET_GROUP_NAME="secureflow-targets"
AWS_REGION="us-east-1"
DOMAIN_NAME="secureflow.yourdomain.com"  # You'll need to replace this

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Account ID: $ACCOUNT_ID"

# Create ECR repositories if they don't exist
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name secureflow-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend repository already exists"
aws ecr create-repository --repository-name secureflow-backend --region $AWS_REGION 2>/dev/null || echo "Backend repository already exists"

# Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push Docker images
echo "🏗️  Building and pushing Docker images..."

# Backend
echo "Building backend..."
cd backend
docker build -t secureflow-backend .
docker tag secureflow-backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-backend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-backend:latest
cd ..

# Frontend (with proper API URL for ALB)
echo "Building frontend..."
cd frontend
docker build --build-arg REACT_APP_API_URL=https://$DOMAIN_NAME/api -t secureflow-frontend .
docker tag secureflow-frontend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/secureflow-frontend:latest
cd ..

# Create ECS Cluster
echo "🏭 Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"

# Create VPC and networking components
echo "🌐 Setting up VPC and networking..."
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region $AWS_REGION)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=secureflow-vpc --region $AWS_REGION

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region $AWS_REGION)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $AWS_REGION

# Create subnets in different AZs
SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ${AWS_REGION}a --query 'Subnet.SubnetId' --output text --region $AWS_REGION)
SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ${AWS_REGION}b --query 'Subnet.SubnetId' --output text --region $AWS_REGION)

# Create route table and route
ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text --region $AWS_REGION)
aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $AWS_REGION
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $ROUTE_TABLE_ID --region $AWS_REGION
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $ROUTE_TABLE_ID --region $AWS_REGION

# Create security groups
echo "🔒 Creating security groups..."
ALB_SG_ID=$(aws ec2 create-security-group --group-name secureflow-alb-sg --description "Security group for SecureFlow ALB" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)
ECS_SG_ID=$(aws ec2 create-security-group --group-name secureflow-ecs-sg --description "Security group for SecureFlow ECS" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)

# ALB security group rules (HTTPS and HTTP)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION

# ECS security group rules (allow from ALB)
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 80 --source-group $ALB_SG_ID --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $ECS_SG_ID --protocol tcp --port 5001 --source-group $ALB_SG_ID --region $AWS_REGION

# Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $ALB_NAME \
    --subnets $SUBNET1_ID $SUBNET2_ID \
    --security-groups $ALB_SG_ID \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text --region $AWS_REGION)

# Create target groups
echo "🎯 Creating target groups..."
FRONTEND_TG_ARN=$(aws elbv2 create-target-group \
    --name secureflow-frontend-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path / \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

BACKEND_TG_ARN=$(aws elbv2 create-target-group \
    --name secureflow-backend-tg \
    --protocol HTTP \
    --port 5001 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /api/health \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create listeners (HTTP redirect to HTTPS)
echo "👂 Creating ALB listeners..."
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
    --region $AWS_REGION

# Note: HTTPS listener will be created after SSL certificate is issued

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

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/secureflow --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION

# Create ECS Service
echo "🎯 Creating ECS service..."
aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_FAMILY \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=$FRONTEND_TG_ARN,containerName=frontend,containerPort=80 targetGroupArn=$BACKEND_TG_ARN,containerName=backend,containerPort=5001 \
    --region $AWS_REGION

echo ""
echo "🎉 ECS Deployment completed!"
echo ""
echo "📋 Next Steps for HTTPS:"
echo "1. Point your domain '$DOMAIN_NAME' to: $ALB_DNS"
echo "2. Request SSL certificate:"
echo "   aws acm request-certificate --domain-name $DOMAIN_NAME --validation-method DNS --region $AWS_REGION"
echo "3. Add HTTPS listener to ALB with the certificate"
echo ""
echo "💰 Estimated Cost: ~\$25-50/month (Fargate + ALB)"
echo ""
echo "🔗 Your app will be available at: https://$DOMAIN_NAME (after DNS setup)"
echo "🔗 Temporary access: http://$ALB_DNS (will redirect to HTTPS once configured)"

# Cleanup
rm -f task-definition.json

echo ""
echo "⚠️  Important: You need to:"
echo "1. Own a domain name (or use a subdomain)"
echo "2. Point the domain to the ALB DNS name"
echo "3. Request and configure SSL certificate"
echo ""
echo "Would you like me to create a script for the SSL certificate setup?"
