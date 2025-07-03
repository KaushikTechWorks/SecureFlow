#!/bin/bash

# Cleanup ECS Infrastructure Script
set -e

echo "🧹 Starting ECS Infrastructure Cleanup..."

# Step 1: Scale down and delete ECS service
echo "📉 Step 1: Scaling down ECS service..."
aws ecs update-service --cluster secureflow-cluster --service secureflow-service --desired-count 0
echo "⏳ Waiting for service to scale down..."
aws ecs wait services-stable --cluster secureflow-cluster --services secureflow-service

echo "🗑️ Deleting ECS service..."
aws ecs delete-service --cluster secureflow-cluster --service secureflow-service
echo "✅ ECS service deleted"

# Step 2: Delete ECS cluster
echo "🗑️ Step 2: Deleting ECS cluster..."
aws ecs delete-cluster --cluster secureflow-cluster
echo "✅ ECS cluster deleted"

# Step 3: Delete Application Load Balancer (this will also delete listeners)
echo "🗑️ Step 3: Deleting Application Load Balancer..."
aws elbv2 delete-load-balancer --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:loadbalancer/app/secureflow-alb/2c856b9edd191e30
echo "⏳ Waiting for ALB to be deleted (this takes a few minutes)..."
aws elbv2 wait load-balancer-deleted --load-balancer-arns arn:aws:elasticloadbalancing:us-east-1:834620997253:loadbalancer/app/secureflow-alb/2c856b9edd191e30
echo "✅ ALB deleted"

# Step 4: Delete Target Groups
echo "🗑️ Step 4: Deleting Target Groups..."
aws elbv2 delete-target-group --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets/e082bb38f44b0b43
echo "✅ Backend target group (old) deleted"

aws elbv2 delete-target-group --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets-new/ac45d167e4e56943
echo "✅ Backend target group (new) deleted"

aws elbv2 delete-target-group --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591
echo "✅ Frontend target group deleted"

# Step 5: Delete ECR repositories (optional - keeps Docker images for reference)
echo "🤔 Step 5: ECR Repositories cleanup..."
read -p "Do you want to delete ECR repositories? This will remove all Docker images. (y/N): " delete_ecr

if [[ $delete_ecr =~ ^[Yy]$ ]]; then
    echo "🗑️ Deleting ECR repositories..."
    aws ecr delete-repository --repository-name secureflow-backend --force
    aws ecr delete-repository --repository-name secureflow-frontend --force
    echo "✅ ECR repositories deleted"
else
    echo "⏭️ Skipping ECR deletion - repositories preserved"
fi

echo "🎉 ECS Infrastructure cleanup completed!"
echo ""
echo "📋 Summary of deleted resources:"
echo "  ✅ ECS Service: secureflow-service"
echo "  ✅ ECS Cluster: secureflow-cluster"
echo "  ✅ ALB: secureflow-alb"
echo "  ✅ Target Groups: 3 groups deleted"
if [[ $delete_ecr =~ ^[Yy]$ ]]; then
    echo "  ✅ ECR Repositories: secureflow-backend, secureflow-frontend"
else
    echo "  ⏭️ ECR Repositories: preserved"
fi
echo ""
echo "💰 This will significantly reduce your AWS costs!"
