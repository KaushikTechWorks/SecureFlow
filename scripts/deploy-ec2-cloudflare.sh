#!/bin/bash

# EC2 + CloudFlare Tunnel Deployment Script
set -e

echo "🚀 Deploying SecureFlow with CloudFlare Tunnel (Free SSL)..."

# Configuration
INSTANCE_NAME="secureflow-server"
KEY_NAME="secureflow-key"
SECURITY_GROUP="secureflow-sg"
AWS_REGION="us-east-1"

echo "📋 This script will:"
echo "1. Deploy SecureFlow to EC2"
echo "2. Set up CloudFlare Tunnel for free SSL"
echo "3. Give you a secure https://random-name.trycloudflare.com URL"
echo ""

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

# Create security group
echo "🔒 Creating security group..."
if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $AWS_REGION &> /dev/null; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP \
        --description "Security group for SecureFlow application" \
        --region $AWS_REGION \
        --query 'GroupId' --output text)
    
    # Allow SSH only (CloudFlare tunnel handles web traffic)
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo "✅ Created security group: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ Security group already exists: $SECURITY_GROUP_ID"
fi

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

# Install CloudFlare Tunnel
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Clone repository
cd /home/ec2-user
echo "Cloning repository..."
git clone https://github.com/KaushikTechWorks/SecureFlow.git
chown -R ec2-user:ec2-user SecureFlow
cd SecureFlow

# Wait for Docker to be fully ready
sleep 10

# Start the application
echo "Starting Docker Compose..."
export API_URL="https://localhost/api"  # CloudFlare will handle the actual domain
docker-compose up -d

# Wait for application to be ready
sleep 30

# Start CloudFlare tunnel
echo "Starting CloudFlare tunnel..."
nohup cloudflared tunnel --url http://localhost:80 > /var/log/cloudflare-tunnel.log 2>&1 &

# Wait a moment for tunnel to establish
sleep 10

# Extract the tunnel URL from logs
TUNNEL_URL=$(grep -o 'https://.*\.trycloudflare\.com' /var/log/cloudflare-tunnel.log | head -1)

if [ ! -z "$TUNNEL_URL" ]; then
    echo "✅ CloudFlare tunnel established: $TUNNEL_URL"
    echo "$TUNNEL_URL" > /home/ec2-user/tunnel-url.txt
    chown ec2-user:ec2-user /home/ec2-user/tunnel-url.txt
    
    # Update frontend with the actual tunnel URL
    cd /home/ec2-user/SecureFlow
    docker-compose down
    export API_URL="$TUNNEL_URL/api"
    docker-compose build --no-cache frontend
    docker-compose up -d
    
    echo "✅ Application updated with tunnel URL: $TUNNEL_URL"
else
    echo "❌ Failed to establish CloudFlare tunnel"
fi

echo "User data script completed at $(date)"
EOF

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
    --security-groups $SECURITY_GROUP \
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

# Cleanup
rm -f user-data.sh

echo ""
echo "🎉 Deployment started!"
echo ""
echo "⏳ The setup will take 5-10 minutes. To get your secure URL:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP 'cat tunnel-url.txt'"
echo ""
echo "🔑 SSH access: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "💰 Cost: ~$16-25/month (t3.small only, CloudFlare tunnel is free)"
echo ""
echo "🗑️  To delete resources later:"
echo "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo "   aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID --region $AWS_REGION"
echo "   aws ec2 delete-key-pair --key-name $KEY_NAME --region $AWS_REGION"
