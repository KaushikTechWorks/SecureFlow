#!/bin/bash

# Fix VPC Mismatch Between ECS and Target Group
set -e

echo "🔧 Fixing VPC mismatch between ECS tasks and ALB target group..."

# Get current configuration
TARGET_GROUP_VPC=$(aws elbv2 describe-target-groups --target-group-arns arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591 --query 'TargetGroups[0].VpcId' --output text)

TASK_ARN=$(aws ecs list-tasks --cluster secureflow-cluster --service-name secureflow-service --query 'taskArns[0]' --output text)
TASK_VPC=$(aws ecs describe-tasks --cluster secureflow-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`subnetId`].value | [0]' --output text | xargs -I {} aws ec2 describe-subnets --subnet-ids {} --query 'Subnets[0].VpcId' --output text)

echo "Target Group VPC: $TARGET_GROUP_VPC"
echo "ECS Task VPC: $TASK_VPC"

if [ "$TARGET_GROUP_VPC" != "$TASK_VPC" ]; then
    echo "❌ VPC Mismatch detected!"
    echo "🔄 Solution: Update ECS service to use the target group's VPC"
    
    # Get subnets in the target group's VPC
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" --query 'Subnets[?MapPublicIpOnLaunch==`true`].SubnetId' --output text)
    echo "Available public subnets in target VPC: $SUBNETS"
    
    if [ -z "$SUBNETS" ]; then
        echo "❌ No public subnets found in target VPC. Need to create them first."
        exit 1
    fi
    
    # Convert space-separated subnets to comma-separated for AWS CLI
    SUBNET_LIST=$(echo $SUBNETS | tr ' ' ',')
    
    # Get security groups in the target VPC (try multiple possible names)
    SECURITY_GROUPS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" "Name=group-name,Values=SecureFlow-ECS-SG" --query 'SecurityGroups[0].GroupId' --output text)
    
    if [ "$SECURITY_GROUPS" = "None" ] || [ -z "$SECURITY_GROUPS" ]; then
        # Try alternative name
        SECURITY_GROUPS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" "Name=group-name,Values=secureflow-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text)
    fi
    
    if [ "$SECURITY_GROUPS" = "None" ] || [ -z "$SECURITY_GROUPS" ]; then
        echo "❌ ECS security group not found in target VPC"
        echo "Available security groups:"
        aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$TARGET_GROUP_VPC" --query 'SecurityGroups[*].[GroupName,GroupId]' --output table
        echo "Using the ECS security group ID directly..."
        SECURITY_GROUPS="sg-0e5adc2767c46aa16"
    fi
    
    echo "Using security group: $SECURITY_GROUPS"
    
    # Scale service to 0 first
    echo "📉 Scaling service to 0..."
    aws ecs update-service --cluster secureflow-cluster --service secureflow-service --desired-count 0
    aws ecs wait services-stable --cluster secureflow-cluster --services secureflow-service
    
    # Update service network configuration
    echo "🔄 Updating service network configuration..."
    aws ecs update-service \
        --cluster secureflow-cluster \
        --service secureflow-service \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$SECURITY_GROUPS],assignPublicIp=ENABLED}" \
        --desired-count 1
    
    echo "⏳ Waiting for service to stabilize..."
    aws ecs wait services-stable --cluster secureflow-cluster --services secureflow-service
    
    echo "✅ Service updated! Checking target registration..."
    sleep 30
    
    # Check target health for both target groups
    echo "📋 Frontend Target Group Health:"
    aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591 --output table
    
    echo "📋 Backend Target Group Health:"
    aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets-new/ac45d167e4e56943 --output table
    
    # Update ECS service to include both target groups
    echo "🔄 Updating ECS service to register both frontend and backend containers..."
    aws ecs update-service \
        --cluster secureflow-cluster \
        --service secureflow-service \
        --load-balancers \
            targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591,containerName=frontend,containerPort=80 \
            targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets-new/ac45d167e4e56943,containerName=backend,containerPort=5001 \
        --desired-count 1
    
    echo "⏳ Waiting for service to update with both target groups..."
    aws ecs wait services-stable --cluster secureflow-cluster --services secureflow-service
    
    echo "🔄 Final check - both target groups health:"
    echo "📋 Frontend Target Group Health:"
    aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591 --output table
    
    echo "📋 Backend Target Group Health:"
    aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-backend-targets-new/ac45d167e4e56943 --output table
    
else
    echo "✅ VPCs match! The issue might be elsewhere."
    echo "Checking if targets are registered..."
    aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591 --output table
fi

echo "🎉 Fix completed!"
