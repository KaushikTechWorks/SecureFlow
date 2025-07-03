#!/bin/bash

# Cleanup ECS Infrastructure Script
set -e

echo "🧹 Starting ECS Infrastructure Cleanup..."
echo "This will remove all ECS, ALB, and ECR resources for SecureFlow"

# Function to wait with progress indicator
wait_with_progress() {
    local duration=$1
    local description=$2
    echo "⏳ $description..."
    for ((i=0; i<duration; i++)); do
        echo -n "."
        sleep 1
    done
    echo " Done!"
}

# Step 1: Scale down and delete ECS Service
echo "📉 Step 1: Cleaning up ECS Service..."
aws ecs update-service \
    --cluster secureflow-cluster \
    --service secureflow-service \
    --desired-count 0

echo "⏳ Waiting for service to scale down..."
aws ecs wait services-stable --cluster secureflow-cluster --services secureflow-service

echo "🗑️ Deleting ECS Service..."
aws ecs delete-service \
    --cluster secureflow-cluster \
    --service secureflow-service

echo "✅ ECS Service deleted"

# Step 2: Delete Target Groups (remove from ALB first)
echo "🎯 Step 2: Cleaning up Target Groups..."

# Get listener ARN
LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:loadbalancer/app/secureflow-alb/2c856b9edd191e30 \
    --query 'Listeners[0].ListenerArn' --output text)

# Delete listener rules (except default)
echo "🗑️ Deleting listener rules..."
RULE_ARNS=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query 'Rules[?!IsDefault].RuleArn' --output text)
for rule_arn in $RULE_ARNS; do
    if [ ! -z "$rule_arn" ]; then
        aws elbv2 delete-rule --rule-arn $rule_arn
        echo "   Deleted rule: $rule_arn"
    fi
done

# Delete target groups
echo "🗑️ Deleting target groups..."
TARGET_GROUPS=(
    "arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets/e082bb38f44b0b43"
    "arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets-new/ac45d167e4e56943"
    "arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591"
)

for tg in "${TARGET_GROUPS[@]}"; do
    aws elbv2 delete-target-group --target-group-arn $tg && echo "   Deleted: $tg" || echo "   Failed to delete: $tg"
done

echo "✅ Target Groups cleaned up"

# Step 3: Delete Load Balancer
echo "⚖️ Step 3: Deleting Load Balancer..."
aws elbv2 delete-load-balancer \
    --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:loadbalancer/app/secureflow-alb/2c856b9edd191e30

echo "⏳ Waiting for load balancer to be deleted..."
sleep 30
echo "✅ Load Balancer deleted"

# Step 4: Delete ECS Cluster
echo "🖥️ Step 4: Deleting ECS Cluster..."
aws ecs delete-cluster --cluster secureflow-cluster
echo "✅ ECS Cluster deleted"

# Step 5: Clean up ECR repositories (optional - keep images for Lambda migration)
echo "📦 Step 5: ECR Repository Cleanup Options..."
echo "Do you want to:"
echo "1. Keep ECR repositories (recommended for Lambda migration)"
echo "2. Delete ECR repositories completely"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    echo "🗑️ Deleting ECR repositories..."
    aws ecr delete-repository --repository-name secureflow-frontend --force
    aws ecr delete-repository --repository-name secureflow-backend --force
    echo "✅ ECR repositories deleted"
else
    echo "✅ ECR repositories preserved for Lambda migration"
fi

# Step 6: Clean up CloudWatch Log Groups
echo "📋 Step 6: Cleaning up CloudWatch Log Groups..."
LOG_GROUPS=(
    "/ecs/secureflow-backend"
    "/ecs/secureflow-frontend"
)

for log_group in "${LOG_GROUPS[@]}"; do
    aws logs delete-log-group --log-group-name $log_group 2>/dev/null && echo "   Deleted: $log_group" || echo "   Not found or already deleted: $log_group"
done

echo "✅ CloudWatch Log Groups cleaned up"

# Summary
echo ""
echo "🎉 ECS Infrastructure Cleanup Complete!"
echo ""
echo "✅ Cleaned up:"
echo "   - ECS Service (secureflow-service)"
echo "   - ECS Cluster (secureflow-cluster)"
echo "   - Application Load Balancer (secureflow-alb)"
echo "   - Target Groups (3 groups)"
echo "   - CloudWatch Log Groups"
if [ "$choice" = "2" ]; then
    echo "   - ECR Repositories"
else
    echo "   - ECR Repositories (preserved)"
fi
echo ""
echo "🚀 Ready for Lambda + API Gateway migration!"
