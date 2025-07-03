#!/bin/bash

# Create IAM role for Lambda
set -e

echo "🔐 Creating IAM role for Lambda execution..."

# Create trust policy for Lambda
cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name lambda-execution-role \
    --assume-role-policy-document file://lambda-trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name lambda-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Clean up
rm lambda-trust-policy.json

echo "✅ IAM role created: lambda-execution-role"

# Wait a moment for role to propagate
echo "⏳ Waiting for role to propagate..."
sleep 10

echo "🎉 IAM setup complete!"
