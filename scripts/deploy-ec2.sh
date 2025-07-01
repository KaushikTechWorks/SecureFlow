#!/bin/bash

# Simple EC2 + Docker Deployment Script
set -e

echo "🚀 Deploying SecureFlow to EC2 with Docker..."

# Configuration
INSTANCE_NAME="secureflow-server"
KEY_NAME="secureflow-key"
SECURITY_GROUP="secureflow-sg"
AWS_REGION="us-east-1"

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
    
    # Allow HTTP, HTTPS, SSH, and Backend API
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 5001 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo "✅ Created security group: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --region $AWS_REGION --query 'SecurityGroups[0].GroupId' --output text)
    echo "✅ Security group already exists: $SECURITY_GROUP_ID"
fi

# Create user data script for EC2 instance
cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log) 2>&1  # Log all output
echo "Starting user data script at $(date)"

yum update -y
yum install -y docker git certbot python3-certbot-nginx

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

# Build and run the application
echo "Starting Docker Compose..."
export API_URL="http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5001"
docker-compose up -d

# Wait for containers to be ready
sleep 30

# Setup self-signed SSL certificate for immediate HTTPS
echo "Setting up self-signed SSL certificate..."
mkdir -p /etc/ssl/private /etc/ssl/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/secureflow.key \
    -out /etc/ssl/certs/secureflow.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

# Create HTTPS Nginx configuration
cat > /tmp/nginx-https.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    ssl_certificate /etc/ssl/certs/secureflow.crt;
    ssl_certificate_key /etc/ssl/private/secureflow.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Install and configure nginx for HTTPS
yum install -y nginx
cp /tmp/nginx-https.conf /etc/nginx/conf.d/default.conf
rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
systemctl enable nginx
systemctl start nginx

# Update frontend to use HTTPS API URL and rebuild
echo "Rebuilding frontend with HTTPS API URL..."
docker-compose down
export API_URL="https://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api"
docker-compose build --no-cache frontend
docker-compose up -d

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

echo ""
echo "🎉 Deployment completed!"
echo "📱 Your app will be available at: http://$PUBLIC_IP (wait 5-10 minutes for setup)"
echo "🔑 SSH access: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "💰 Cost: ~$16-25/month for t3.small instance"
echo ""
echo "🗑️  To delete resources later:"
echo "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo "   aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID --region $AWS_REGION"
echo "   aws ec2 delete-key-pair --key-name $KEY_NAME --region $AWS_REGION"

# Cleanup
rm -f user-data.sh
