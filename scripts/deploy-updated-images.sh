#!/bin/bash

# Deploy Updated Docker Images to ECS
set -e

echo "🚀 Starting deployment of updated Docker images..."

# Variables
CLUSTER_NAME="secureflow-cluster"
SERVICE_NAME="secureflow-service"
TASK_DEFINITION_FILE="aws/ecs-task-definition-updated.json"
REGION="us-east-1"
ACCOUNT_ID="834620997253"

echo "📋 Registering new task definition revision..."
NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file://$TASK_DEFINITION_FILE \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "✅ New task definition registered: $NEW_TASK_DEF"

# Extract revision number
REVISION=$(echo $NEW_TASK_DEF | grep -o ':revision:[0-9]*' | cut -d: -f3)
echo "📦 Task definition revision: $REVISION"

echo "🔄 Updating ECS service to use new task definition..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition secureflow-task:$REVISION \
    --force-new-deployment

echo "⏳ Waiting for service to stabilize (this may take several minutes)..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME

echo "🔍 Checking service status..."
SERVICE_STATUS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].deployments[0].status' \
    --output text)

echo "Service deployment status: $SERVICE_STATUS"

if [ "$SERVICE_STATUS" = "PRIMARY" ]; then
    echo "✅ Deployment successful!"
    
    echo "🎯 Checking target health..."
    sleep 30  # Give targets time to register
    
    aws elbv2 describe-target-health \
        --target-group-arn arn:aws:elasticloadbalancing:us-east-1:834620997253:targetgroup/secureflow-targets/b36c7468f4c24591 \
        --output table
    
    echo "🌐 Getting ALB DNS name..."
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns arn:aws:elasticloadbalancing:us-east-1:834620997253:loadbalancer/app/secureflow-alb/d6f8c0a0b5c8b2a4 \
        --query 'LoadBalancers[0].DNSName' \
        --output text)
    
    echo "🎉 Deployment completed successfully!"
    echo "🔗 Application should be available at: http://$ALB_DNS"
    
else
    echo "❌ Deployment failed or still in progress"
    echo "📋 Recent service events:"
    aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --query 'services[0].events[:5]' \
        --output table
fi

echo "📊 Final service summary:"
aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].{Status:status,RunningCount:runningCount,PendingCount:pendingCount,DesiredCount:desiredCount,TaskDefinition:taskDefinition}' \
    --output table
