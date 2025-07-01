#!/bin/bash

# Simple AWS App Runner Deployment Script
set -e

echo "🚀 Deploying SecureFlow to AWS App Runner..."

# Configuration
SERVICE_NAME="secureflow-app"
AWS_REGION="us-east-1"
GITHUB_REPO="https://github.com/KaushikTechWorks/SecureFlow.git"

echo "📋 Prerequisites:"
echo "1. AWS CLI configured: aws configure"
echo "2. GitHub repository is public or you have access tokens configured"
echo ""

read -p "✅ Have you configured AWS CLI? (y/n): " aws_configured
if [ "$aws_configured" != "y" ]; then
    echo "❌ Please run 'aws configure' first"
    exit 1
fi

# Create apprunner.yaml for configuration
cat > apprunner.yaml << 'EOF'
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building application..."
      - docker build -t secureflow-backend ./backend
      - docker build -t secureflow-frontend ./frontend
run:
  runtime-version: latest
  command: docker-compose up
  network:
    port: 80
    env: PORT
  env:
    - name: PORT
      value: "80"
    - name: FLASK_ENV
      value: "production"
EOF

echo "📄 Created apprunner.yaml configuration"

# Create service configuration JSON
cat > app-runner-service.json << EOF
{
  "ServiceName": "${SERVICE_NAME}",
  "SourceConfiguration": {
    "RepoType": "GITHUB",
    "GitHubConfiguration": {
      "RepositoryUrl": "${GITHUB_REPO}",
      "BranchName": "main",
      "ConfigurationSource": "REPOSITORY"
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/",
    "Interval": 30,
    "Timeout": 5,
    "HealthyThreshold": 2,
    "UnhealthyThreshold": 5
  }
}
EOF

echo "🔧 Creating App Runner service..."
aws apprunner create-service --cli-input-json file://app-runner-service.json --region $AWS_REGION

echo "⏳ Waiting for service to be ready..."
aws apprunner wait service-running --service-arn $(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text) --region $AWS_REGION

# Get the service URL
SERVICE_URL=$(aws apprunner describe-service --service-arn $(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text) --region $AWS_REGION --query 'Service.ServiceUrl' --output text)

echo ""
echo "🎉 Deployment completed!"
echo "📱 Your app is available at: https://$SERVICE_URL"
echo ""
echo "🛠️  To manage your service:"
echo "   AWS Console: https://console.aws.amazon.com/apprunner/home"
echo ""
echo "🗑️  To delete the service later:"
echo "   aws apprunner delete-service --service-arn <service-arn> --region $AWS_REGION"

# Cleanup
rm -f app-runner-service.json apprunner.yaml
