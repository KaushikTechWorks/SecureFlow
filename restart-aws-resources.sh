#!/bin/bash

# =============================================================================
# AWS Resources Restart Script
# =============================================================================
# 
# IMPORTANT: Run this script on September 5, 2025 (2 days after pausing)
# 
# This script restarts the AWS resources that were paused on September 3, 2025:
# - RDS Database: secureflow-postgres-prod
# - CloudFront Distribution: E2ZM8N6JLQE3NI
# 
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting AWS Resources Restart Process..."
echo "Date: $(date)"
echo "===================================================="

# Check AWS CLI is configured
echo "✓ Checking AWS CLI configuration..."
aws sts get-caller-identity
echo ""

# =============================================================================
# 1. START RDS DATABASE
# =============================================================================
echo "🗄️  Step 1: Starting RDS Database..."
echo "Database: secureflow-postgres-prod"

# Check current status
echo "Current RDS status:"
aws rds describe-db-instances \
    --db-instance-identifier secureflow-postgres-prod \
    --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus]' \
    --output table

# Start the database
echo "Starting RDS database..."
aws rds start-db-instance --db-instance-identifier secureflow-postgres-prod

echo "✓ RDS start command issued. Database will take 5-10 minutes to become available."
echo ""

# =============================================================================
# 2. RE-ENABLE CLOUDFRONT DISTRIBUTION
# =============================================================================
echo "🌐 Step 2: Re-enabling CloudFront Distribution..."
echo "Distribution ID: E2ZM8N6JLQE3NI"

# Check current status
echo "Current CloudFront status:"
aws cloudfront get-distribution \
    --id E2ZM8N6JLQE3NI \
    --query 'Distribution.[Id,Status,DistributionConfig.Enabled]' \
    --output table

# Get current configuration
echo "Getting CloudFront configuration..."
aws cloudfront get-distribution-config \
    --id E2ZM8N6JLQE3NI \
    --output json > /tmp/cloudfront-config-restart.json

# Enable the distribution
echo "Enabling CloudFront distribution..."
python3 << 'EOF'
import json

# Read the configuration
with open('/tmp/cloudfront-config-restart.json', 'r') as f:
    config = json.load(f)

etag = config['ETag']
dist_config = config['DistributionConfig']
dist_config['Enabled'] = True

# Save the updated configuration
with open('/tmp/cloudfront-config-enabled.json', 'w') as f:
    json.dump(dist_config, f, indent=2)

print(f'ETag: {etag}')
print('Configuration updated to enable CloudFront')

# Write the ETag to a file for the bash script to read
with open('/tmp/cloudfront-etag.txt', 'w') as f:
    f.write(etag)
EOF

# Read the ETag and update the distribution
ETAG=$(cat /tmp/cloudfront-etag.txt)
aws cloudfront update-distribution \
    --id E2ZM8N6JLQE3NI \
    --distribution-config file:///tmp/cloudfront-config-enabled.json \
    --if-match "$ETAG"

echo "✓ CloudFront enable command issued. Distribution will take 15-20 minutes to deploy."
echo ""

# =============================================================================
# 3. VERIFY STATUS
# =============================================================================
echo "🔍 Step 3: Verifying Resource Status..."

echo "RDS Database Status:"
aws rds describe-db-instances \
    --db-instance-identifier secureflow-postgres-prod \
    --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus]' \
    --output table

echo "CloudFront Distribution Status:"
aws cloudfront get-distribution \
    --id E2ZM8N6JLQE3NI \
    --query 'Distribution.[Id,Status,DistributionConfig.Enabled]' \
    --output table

# =============================================================================
# 4. CLEANUP TEMPORARY FILES
# =============================================================================
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/cloudfront-config-restart.json
rm -f /tmp/cloudfront-config-enabled.json
rm -f /tmp/cloudfront-etag.txt

echo ""
echo "===================================================="
echo "✅ AWS Resources Restart Process Complete!"
echo ""
echo "⏱️  EXPECTED TIMELINE:"
echo "   - RDS Database: 5-10 minutes to become available"
echo "   - CloudFront: 15-20 minutes to fully deploy"
echo ""
echo "🔍 MONITOR STATUS:"
echo "   - RDS: aws rds describe-db-instances --db-instance-identifier secureflow-postgres-prod"
echo "   - CloudFront: aws cloudfront get-distribution --id E2ZM8N6JLQE3NI"
echo ""
echo "💰 BILLING:"
echo "   - Charges will resume for both services"
echo "   - RDS charges based on instance hours"
echo "   - CloudFront charges based on data transfer and requests"
echo "===================================================="
