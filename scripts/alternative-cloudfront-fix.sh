#!/bin/bash
# Alternative approach: Make S3 bucket public and enable website hosting directly

# Variables
S3_BUCKET="secureflow-frontend-1751504254"
AWS_REGION="us-east-1"
DISTRIBUTION_ID="E2ZM8N6JLQE3NI"

echo "Applying public read policy to S3 bucket..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://frontend/public-bucket-policy.json

echo "Enabling S3 website hosting..."
aws s3 website s3://$S3_BUCKET --index-document index.html --error-document index.html

# Enable CORS
echo "Configuring CORS..."
aws s3api put-bucket-cors --bucket $S3_BUCKET --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Create CloudFront invalidation
echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Display URLs for testing
echo ""
echo "========== TESTING URLS =========="
echo "S3 Website URL (HTTP): http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo "CloudFront URL (HTTPS): https://d1ibtg4yjgwthn.cloudfront.net"
echo ""
echo "If CloudFront still shows 'Access Denied', try these steps:"
echo "1. In the AWS Console, update your CloudFront distribution origin"
echo "2. Change the origin domain from '$S3_BUCKET.s3.amazonaws.com' to '$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com'"
echo "3. Disable any Origin Access Control or Origin Access Identity settings"
echo "4. Set 'Origin Protocol Policy' to 'HTTP Only'"
echo "5. Create another invalidation after the changes are deployed"
echo ""
echo "The changes should take effect within 5-15 minutes"
