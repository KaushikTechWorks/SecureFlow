#!/bin/bash

# AWS Lightsail Container Deployment Script
set -e

echo "🚀 Deploying SecureFlow to AWS Lightsail Containers..."

# Configuration
SERVICE_NAME="secureflow"
AWS_REGION="us-east-1"

echo "📋 This will deploy using AWS Lightsail Containers (simpler than ECS)"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"

# Build and push images to Lightsail
echo "🔨 Building Docker images..."
docker build -t secureflow-backend ./backend
docker build -t secureflow-frontend ./frontend

# Push to Lightsail's private registry
echo "📤 Pushing images to Lightsail..."
aws lightsail push-container-image --service-name $SERVICE_NAME --label backend --image secureflow-backend --region $AWS_REGION
aws lightsail push-container-image --service-name $SERVICE_NAME --label frontend --image secureflow-frontend --region $AWS_REGION

# Create deployment configuration
cat > lightsail-deployment.json << 'EOF'
{
  "containers": {
    "backend": {
      "image": ":backend.1",
      "environment": {
        "FLASK_ENV": "production",
        "DATABASE_URL": "sqlite:///secureflow.db"
      },
      "ports": {
        "5001": "HTTP"
      }
    },
    "frontend": {
      "image": ":frontend.1",
      "environment": {
        "REACT_APP_API_URL": "http://backend:5001"
      },
      "ports": {
        "80": "HTTP"
      }
    }
  },
  "publicEndpoint": {
    "containerName": "frontend",
    "containerPort": 80,
    "healthCheck": {
      "path": "/",
      "intervalSeconds": 30
    }
  }
}
EOF

# Create the container service
echo "🔧 Creating Lightsail container service..."
aws lightsail create-container-service \
    --service-name $SERVICE_NAME \
    --power micro \
    --scale 1 \
    --region $AWS_REGION

echo "⏳ Waiting for service to be ready..."
sleep 60

# Deploy the containers
echo "🚀 Deploying containers..."
aws lightsail create-container-service-deployment \
    --service-name $SERVICE_NAME \
    --cli-input-json file://lightsail-deployment.json \
    --region $AWS_REGION

echo "⏳ Waiting for deployment to complete..."
sleep 120

# Get the service URL
SERVICE_URL=$(aws lightsail get-container-services --service-name $SERVICE_NAME --region $AWS_REGION --query 'containerServices[0].url' --output text)

echo ""
echo "🎉 Deployment completed!"
echo "📱 Your app is available at: $SERVICE_URL"
echo ""
echo "🛠️  To manage your service:"
echo "   AWS Console: https://lightsail.aws.amazon.com/ls/webapp/home/containers"
echo ""
echo "💰 Cost: ~$7/month for micro instance"
echo ""
echo "🗑️  To delete the service later:"
echo "   aws lightsail delete-container-service --service-name $SERVICE_NAME --region $AWS_REGION"

# Cleanup
rm -f lightsail-deployment.json
