#!/bin/bash

# Create RDS PostgreSQL for SecureFlow Production
echo "🚀 Creating RDS PostgreSQL instance for SecureFlow..."

# Variables
DB_INSTANCE_ID="secureflow-postgres"
DB_NAME="secureflow"
DB_USERNAME="postgres"
DB_PASSWORD="SecureFlow2024!"  # Change this!
VPC_SECURITY_GROUP_ID=""  # Will be created

# Create VPC Security Group for RDS
echo "📡 Creating security group for RDS..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name secureflow-rds-sg \
    --description "Security group for SecureFlow RDS PostgreSQL" \
    --query 'GroupId' --output text)

echo "Security Group ID: $SECURITY_GROUP_ID"

# Add inbound rule for PostgreSQL (port 5432)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0

# Create RDS Subnet Group (using default VPC)
echo "🏗️ Creating DB subnet group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name secureflow-subnet-group \
    --db-subnet-group-description "Subnet group for SecureFlow RDS" \
    --subnet-ids $(aws ec2 describe-subnets --query 'Subnets[?AvailabilityZone!=`us-east-1e`].SubnetId' --output text)

# Create RDS PostgreSQL instance
echo "🗄️ Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --db-subnet-group-name secureflow-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted \
    --deletion-protection

echo "⏳ RDS instance is being created. This will take 5-10 minutes..."
echo "📝 Note down these details:"
echo "   DB Instance ID: $DB_INSTANCE_ID"
echo "   DB Name: $DB_NAME" 
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo "   Security Group: $SECURITY_GROUP_ID"

# Wait for RDS to be available
echo "⏳ Waiting for RDS instance to be available..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_ID

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' --output text)

echo "✅ RDS PostgreSQL instance created successfully!"
echo "🔗 RDS Endpoint: $RDS_ENDPOINT"
echo "🔌 Connection String: postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME"

# Save to environment file
cat > rds-config.env << EOF
RDS_ENDPOINT=$RDS_ENDPOINT
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME
DB_HOST=$RDS_ENDPOINT
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
EOF

echo "💾 RDS configuration saved to rds-config.env"
echo "🎯 Next step: Update your Lambda function to use this PostgreSQL database"
