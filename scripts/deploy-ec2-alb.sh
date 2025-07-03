#!/bin/bash

# EC2 + ALB + SSL Deployment Script
set -e

echo "🚀 Deploying SecureFlow to EC2 with ALB and SSL..."

# Configuration
INSTANCE_NAME="secureflow-server"
KEY_NAME="secureflow-key"
SECURITY_GROUP="secureflow-sg"
ALB_SECURITY_GROUP="secureflow-alb-sg"
AWS_REGION="us-east-1"
DOMAIN_NAME="${1:-}"

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Please provide a domain name as first argument"
    echo "Usage: ./deploy-ec2-alb.sh yourdomain.com"
    echo ""
    echo "Note: You need to own this domain and be able to create DNS records"
    exit 1
fi

echo "🌐 Using domain: $DOMAIN_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI configured"

# Create key pair for SSH access
echo "🔑 Creating SSH key pair..."
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $AWS_REGION &> /dev/null; then
    aws ec2 create-key-pair --key-name $KEY_NAME --region $AWS_REGION --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Created key pair: ${KEY_NAME}.pem"
else
    echo "✅ Key pair already exists"
fi

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text)
echo "✅ Using VPC: $VPC_ID"

# Get subnets
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'Subnets[*].SubnetId' --output text)
SUBNET_ARRAY=($SUBNET_IDS)
echo "✅ Found ${#SUBNET_ARRAY[@]} subnets"

# Create security group for EC2
echo "🔒 Creating EC2 security group..."
if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $AWS_REGION &> /dev/null; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP \
        --description "Security group for SecureFlow EC2 instance" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' --output text)
    
    # Allow SSH and HTTP from anywhere (ALB will handle HTTPS)
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 5001 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo "✅ Created EC2 security group: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ EC2 security group already exists: $SECURITY_GROUP_ID"
fi

# Create security group for ALB
echo "🔒 Creating ALB security group..."
if ! aws ec2 describe-security-groups --group-names $ALB_SECURITY_GROUP --region $AWS_REGION &> /dev/null; then
    ALB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $ALB_SECURITY_GROUP \
        --description "Security group for SecureFlow ALB" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' --output text)
    
    # Allow HTTP and HTTPS from anywhere
    aws ec2 authorize-security-group-ingress --group-id $ALB_SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $ALB_SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo "✅ Created ALB security group: $ALB_SECURITY_GROUP_ID"
else
    ALB_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $ALB_SECURITY_GROUP --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ ALB security group already exists: $ALB_SECURITY_GROUP_ID"
fi

# Request SSL certificate from ACM
echo "🔐 Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --validation-method DNS \
    --region $AWS_REGION \
    --query 'CertificateArn' --output text)

echo "✅ Certificate requested: $CERT_ARN"
echo ""
echo "⚠️  IMPORTANT: You need to validate the certificate by adding DNS records"
echo "Run this command to get the DNS validation records:"
echo "aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION"
echo ""
echo "Add the CNAME record shown in the output to your DNS provider"
echo "Press Enter when you've added the DNS record and it has propagated..."
read -p ""

# Wait for certificate validation
echo "⏳ Waiting for certificate validation..."
aws acm wait certificate-validated --certificate-arn $CERT_ARN --region $AWS_REGION
echo "✅ Certificate validated!"

# Create user data script for EC2 instance
cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"

yum update -y
yum install -y docker git

# Add swap space for memory-intensive builds
echo "Adding swap space..."
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Start Docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone repository
cd /home/ec2-user
echo "Cloning repository..."
git clone https://github.com/KaushikTechWorks/SecureFlow.git
chown -R ec2-user:ec2-user SecureFlow
cd SecureFlow

# Wait for Docker to be fully ready
sleep 10

# Build and run the application (ALB will handle HTTPS)
echo "Starting Docker Compose..."
export API_URL="https://DOMAIN_PLACEHOLDER/api"
docker-compose up -d

echo "User data script completed at $(date)"
EOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" user-data.sh

# Get the latest Amazon Linux 2 AMI
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=amzn2-ami-hvm-*" "Name=state,Values=available" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --output text \
    --region $AWS_REGION)

echo "🖥️  Launching EC2 instance with AMI: $AMI_ID"

# Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t3.small \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region $AWS_REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $AWS_REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

# Create target group
echo "🎯 Creating target group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name secureflow-targets \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "✅ Created target group: $TARGET_GROUP_ARN"

# Register instance with target group
aws elbv2 register-targets \
    --target-group-arn $TARGET_GROUP_ARN \
    --targets Id=$INSTANCE_ID \
    --region $AWS_REGION

echo "✅ Registered instance with target group"

# Create Application Load Balancer
echo "⚖️  Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name secureflow-alb \
    --subnets ${SUBNET_ARRAY[@]} \
    --security-groups $ALB_SECURITY_GROUP_ID \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

echo "✅ Created ALB: $ALB_ARN"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].DNSName' --output text)

echo "✅ ALB DNS: $ALB_DNS"

# Create HTTP listener (redirect to HTTPS)
HTTP_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
    --region $AWS_REGION \
    --query 'Listeners[0].ListenerArn' --output text)

echo "✅ Created HTTP listener: $HTTP_LISTENER_ARN"

# Create HTTPS listener
HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region $AWS_REGION \
    --query 'Listeners[0].ListenerArn' --output text)

echo "✅ Created HTTPS listener: $HTTPS_LISTENER_ARN"

# Cleanup
rm -f user-data.sh

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Create a DNS A record pointing $DOMAIN_NAME to $ALB_DNS"
echo "2. Wait 5-10 minutes for the application to start"
echo "3. Visit https://$DOMAIN_NAME"
echo ""
echo "🔑 SSH access: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "💰 Cost: ~$20-30/month (t3.small + ALB)"
echo ""
echo "🗑️  To delete resources later:"
echo "   aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $AWS_REGION"
echo "   aws elbv2 delete-target-group --target-group-arn $TARGET_GROUP_ARN --region $AWS_REGION"
echo "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo "   aws acm delete-certificate --certificate-arn $CERT_ARN --region $AWS_REGION"
echo "   aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID --region $AWS_REGION"
echo "   aws ec2 delete-security-group --group-id $ALB_SECURITY_GROUP_ID --region $AWS_REGION"
echo "   aws ec2 delete-key-pair --key-name $KEY_NAME --region $AWS_REGION"
