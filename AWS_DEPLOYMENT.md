# SecureFlow AWS ECS Deployment Guide

This guide will help you deploy the SecureFlow application to AWS using Docker containers and Amazon ECS (Elastic Container Service).

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **Docker installed**
   ```bash
   docker --version
   ```

3. **AWS Account with appropriate permissions**
   - ECS Full Access
   - ECR Full Access
   - CloudFormation Full Access
   - IAM permissions for role creation
   - VPC and Load Balancer permissions

## Deployment Architecture

```
Internet → Application Load Balancer → ECS Service (Fargate)
                                    ├── Frontend Container (nginx:80)
                                    └── Backend Container (python:5001)
```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/KaushikTechWorks/SecureFlow.git
   cd SecureFlow
   ```

2. **Configure AWS region** (Edit `scripts/deploy-to-aws.sh`)
   ```bash
   AWS_REGION="us-east-1"  # Change to your preferred region
   ```

3. **Run deployment script**
   ```bash
   chmod +x scripts/deploy-to-aws.sh
   ./scripts/deploy-to-aws.sh
   ```

4. **Access your application**
   - The script will output the Application Load Balancer URL
   - Wait 3-5 minutes for the service to become healthy

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Deploy Infrastructure
```bash
aws cloudformation deploy \
  --template-file aws/infrastructure.yml \
  --stack-name secureflow-infrastructure \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

#### Step 2: Build and Push Docker Images
```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t secureflow-backend ./backend
docker tag secureflow-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/secureflow-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/secureflow-backend:latest

# Build and push frontend
docker build -t secureflow-frontend ./frontend
docker tag secureflow-frontend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/secureflow-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/secureflow-frontend:latest
```

#### Step 3: Deploy ECS Service
```bash
# Update task definition with your account ID and region
# Register task definition
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster secureflow-cluster \
  --service-name secureflow-service \
  --task-definition secureflow-task:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

## Configuration

### Environment Variables

**Frontend (.env.production):**
```
REACT_APP_API_URL=http://your-load-balancer-url:5001
REACT_APP_ENV=production
```

**Backend:**
- `FLASK_ENV=production`
- `DATABASE_URL=sqlite:///secureflow.db`

### AWS Resources Created

1. **VPC with 2 public subnets**
2. **Application Load Balancer**
3. **ECS Cluster (Fargate)**
4. **ECR Repositories** (frontend & backend)
5. **IAM Roles** (Task Execution & Task roles)
6. **Security Groups**
7. **CloudWatch Log Groups**

## Monitoring and Logs

### View Service Status
```bash
aws ecs describe-services \
  --cluster secureflow-cluster \
  --services secureflow-service
```

### View Logs
```bash
# Backend logs
aws logs tail /ecs/secureflow-backend --follow

# Frontend logs
aws logs tail /ecs/secureflow-frontend --follow
```

### ECS Console
- Navigate to ECS Console in AWS
- Select `secureflow-cluster`
- Monitor service health and task status

## Scaling

### Manual Scaling
```bash
aws ecs update-service \
  --cluster secureflow-cluster \
  --service secureflow-service \
  --desired-count 3
```

### Auto Scaling (Optional)
You can set up auto scaling policies based on:
- CPU utilization
- Memory utilization
- Request count per target

## Security Considerations

1. **HTTPS Setup** (Recommended for production)
   - Add SSL certificate to the load balancer
   - Update security groups to allow HTTPS traffic

2. **Database** (For production)
   - Use RDS instead of SQLite
   - Update environment variables

3. **Secrets Management**
   - Use AWS Secrets Manager for sensitive data
   - Update task definition to use secrets

## Troubleshooting

### Common Issues

1. **Service fails to start**
   - Check CloudWatch logs
   - Verify IAM permissions
   - Check task definition configuration

2. **Load balancer returns 503**
   - Verify service is running
   - Check target group health checks
   - Ensure containers are listening on correct ports

3. **Images not found**
   - Verify ECR repository URIs
   - Check if images were pushed successfully

### Useful Commands

```bash
# Check service events
aws ecs describe-services --cluster secureflow-cluster --services secureflow-service --query 'services[0].events'

# View running tasks
aws ecs list-tasks --cluster secureflow-cluster --service-name secureflow-service

# Get load balancer DNS
aws elbv2 describe-load-balancers --names secureflow-alb --query 'LoadBalancers[0].DNSName'
```

## Cleanup

To remove all AWS resources:

```bash
# Delete ECS service
aws ecs update-service --cluster secureflow-cluster --service secureflow-service --desired-count 0
aws ecs delete-service --cluster secureflow-cluster --service secureflow-service

# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name secureflow-infrastructure

# Delete ECR images (optional)
aws ecr batch-delete-image --repository-name secureflow-backend --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name secureflow-frontend --image-ids imageTag=latest
```

## Cost Optimization

1. **Use Fargate Spot** for development environments
2. **Set up scheduled scaling** to reduce costs during low usage
3. **Use smaller instance types** for testing
4. **Monitor CloudWatch costs** regularly

## Support

For issues with the deployment:
1. Check CloudWatch logs
2. Review AWS ECS documentation
3. Contact AWS support for infrastructure issues

---

**Note:** Replace `ACCOUNT_ID` with your actual AWS Account ID and update region as needed.
