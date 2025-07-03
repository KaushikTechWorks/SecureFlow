#!/bin/bash
# Fix CloudFront access to S3 bucket

# Variables - you need to replace these with your actual values
AWS_REGION="us-east-1"  # Replace with your region
S3_BUCKET="secureflow-frontend-1751504254"
DISTRIBUTION_ID="E2ZM8N6JLQE3NI" # CloudFront distribution ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Update the placeholder in policy file with actual values
sed -i '' "s/ACCOUNT-ID/$AWS_ACCOUNT_ID/g" frontend/cloudfront-bucket-policy.json
sed -i '' "s/DISTRIBUTION-ID/$DISTRIBUTION_ID/g" frontend/cloudfront-bucket-policy.json

# Apply the bucket policy
echo "Applying S3 bucket policy to allow CloudFront access..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://frontend/cloudfront-bucket-policy.json

# Update S3 bucket CORS configuration to allow web access
echo "Updating CORS configuration..."
aws s3api put-bucket-cors --bucket $S3_BUCKET --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'

# Modify CloudFront distribution to use Origin Access Control (OAC) instead of public access
echo "Please complete these steps in the AWS Console:"
echo "1. Go to CloudFront console: https://console.aws.amazon.com/cloudfront/"
echo "2. Select your distribution: $DISTRIBUTION_ID"
echo "3. Go to Origins tab and edit your S3 origin"
echo "4. Under 'Origin access', select 'Origin access control settings (recommended)'"
echo "5. Create a new control setting if prompted"
echo "6. Save changes"
echo "7. Create an invalidation for '/*' to clear the cache"

echo ""
echo "Script completed. After making the CloudFront changes, test your site at:"
echo "https://d1ibtg4yjgwthn.cloudfront.net"
