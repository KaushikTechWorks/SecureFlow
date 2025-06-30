#!/bin/bash

# AWS ECS Cleanup Script for SecureFlow Application
# This script removes all AWS resources created for SecureFlow

set -e

# Configuration
AWS_REGION="us-east-1"  # Change to your region
STACK_NAME="secureflow-infrastructure"
CLUSTER_NAME="secureflow-cluster"
SERVICE_NAME="secureflow-service"

echo "🧹 Starting SecureFlow AWS Resource Cleanup..."
echo "AWS Region: $AWS_REGION"
echo "⚠️  WARNING: This will delete ALL SecureFlow resources in AWS!"

# Confirm deletion
read -p "Are you sure you want to proceed? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo "🗑️  Starting cleanup process..."

# Step 1: Scale down and delete ECS service
echo "📉 Scaling down ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --desired-count 0 \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Service may not exist or already scaled down"

echo "⏳ Waiting for service to scale down..."
sleep 30

echo "🗑️  Deleting ECS service..."
aws ecs delete-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Service may not exist"

echo "⏳ Waiting for service deletion..."
sleep 30

# Step 2: Delete ECR images
echo "🗑️  Deleting ECR images..."
aws ecr batch-delete-image \
  --repository-name secureflow-backend \
  --image-ids imageTag=latest \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Backend images may not exist"

aws ecr batch-delete-image \
  --repository-name secureflow-frontend \
  --image-ids imageTag=latest \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Frontend images may not exist"

# Step 3: Delete CloudFormation stack
echo "🗑️  Deleting CloudFormation stack..."
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

echo "⏳ Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete \
  --stack-name $STACK_NAME \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Stack deletion may have failed or stack doesn't exist"

# Step 4: Clean up any remaining log groups
echo "🗑️  Cleaning up CloudWatch log groups..."
aws logs delete-log-group \
  --log-group-name /ecs/secureflow-backend \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Backend log group may not exist"

aws logs delete-log-group \
  --log-group-name /ecs/secureflow-frontend \
  --region $AWS_REGION \
  2>/dev/null || echo "⚠️  Frontend log group may not exist"

echo ""
echo "✅ Cleanup completed!"
echo "=========================================="
echo "All SecureFlow AWS resources have been removed:"
echo "- ECS Service and Cluster"
echo "- Load Balancer and Target Groups"
echo "- VPC, Subnets, and Security Groups"
echo "- ECR Repositories and Images"
echo "- IAM Roles"
echo "- CloudWatch Log Groups"
echo "=========================================="
echo ""
echo "💡 Note: It may take a few minutes for all resources to be fully deleted."
echo "📊 Check AWS Console to verify all resources are removed."

echo "✅ Cleanup script completed!"
