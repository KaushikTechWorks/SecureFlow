# SecureFlow - Financial Transaction Anomaly Detection

SecureFlow is a full-stack web application for real-time financial transaction anomaly detection, targeting 95% recall and <3-second latency, addressing the $40B financial scam problem in 2025.

## 🎯 Overview

SecureFlow empowers banks and users to detect suspicious financial transactions using machine learning, providing:
- **Real-time anomaly detection** with Isolation Forest model
- **SHAP explanations** for model interpretability  
- **Interactive web interface** for single and batch transaction analysis
- **Dashboard analytics** with visualizations
- **User feedback system** for continuous model improvement

## 🏗️ Architecture

### Production Architecture (Fly.io)
```
Internet → Fly Global Edge Network → Frontend App (secureflow)
                                    Container: nginx + React build
                                    Proxy: /api/* → Backend App
                                  → Backend App (secureflow-backend)
                                    Container: Python Flask + Gunicorn
                                  → Fly Postgres Cluster (Managed HA)
```

### Local Development
```
Frontend (React) → Backend (Flask) → PostgreSQL (Docker)
```

**Key Benefits:**
- ✅ **Global Edge**: Fly's global edge network for fast delivery
- ✅ **Simplified Deployment**: Single command deployments with flyctl
- ✅ **Cost-effective**: Pay only for usage, auto-scale to zero
- ✅ **Developer Experience**: Near-instant builds and deployments

## 🚀 Quick Start

### Local Development with Docker

1. **Clone and start development environment**
   ```bash
   git clone <your-repo-url>
   cd SecureFlow-1
   
   # Start PostgreSQL + Backend + Frontend with hot reload
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Database: PostgreSQL on localhost:5432

3. **Test the API**
   ```bash
   curl http://localhost:5001/api/health
   ```

### Production Deployment (Fly.io)

**Deploy backend:**
```bash
cd backend
flyctl deploy --app secureflow-backend
```

**Deploy frontend:**
```bash
cd frontend  
flyctl deploy --app secureflow
```

**Production URLs:**
- Frontend: https://secureflow.fly.dev
- Backend API: https://secureflow-backend.fly.dev

📖 **Detailed deployment guide**: [FLY_CURRENT_ARCHITECTURE.md](FLY_CURRENT_ARCHITECTURE.md)  
📖 **Previous AWS architecture**: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) (Legacy reference)

## 📋 Features

### 🔍 Anomaly Detection
- **Single Transaction Analysis**: Input transaction details and get instant anomaly detection
- **Batch Processing**: Upload CSV files for bulk transaction analysis  
- **ML Model**: Isolation Forest with SHAP explanations for interpretability
- **Performance**: <3 second response time

### 📊 Analytics Dashboard
- **Real-time Statistics**: Transaction counts, anomaly rates, model performance
- **Interactive Charts**: Hourly distribution, trends, feedback analytics
- **Transaction History**: Paginated view of all processed transactions

### 🔧 User Experience
- **Modern UI**: React with Material-UI components
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live data refresh
- **Feedback System**: Users can validate model predictions

## 🎯 Use Cases & Fraud Prevention

### 🛡️ Real-Time Detection for Recent Transactions
**How It Works**: Users or bank systems input transaction details (e.g., $1,000 at 2 AM). SecureFlow predicts if suspicious in <3 seconds with SHAP explanations.

**Prevention**: Many scams can be reversed if caught quickly. SecureFlow's fast detection allows banks to flag and freeze suspicious transactions before funds are transferred.

**Example**: User notices strange charge → inputs to SecureFlow → gets immediate alert → contacts bank to cancel before money is lost.

### 📈 Batch Processing for Monitoring  
**How It Works**: Upload CSV of multiple transactions for pattern analysis. Results show explanations and trigger alerts for high-risk transactions.

**Prevention**: Banks monitor recent transactions in bulk, catching scam patterns that slipped through initial checks.

**Example**: Bank uploads day's transactions → SecureFlow flags 5 suspicious ones → bank freezes accounts within minutes.

### 🔔 Alerts and Feedback for Response
**How It Works**: Users confirm if flagged transactions are correct. Custom alert thresholds trigger notifications.

**Prevention**: Instant alerts enable rapid action (freezing cards, contacting users). Feedback improves model accuracy over time.

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI** for modern design
- **Chart.js** for data visualization
- **Axios** for API communication

### Backend  
- **Python 3.11** with Flask
- **scikit-learn** for ML models
- **SHAP** for model explanations
- **SQLAlchemy** for database ORM
- **PostgreSQL** for data storage

### Infrastructure (Current: Fly.io)
- **Fly.io Apps** - Container-based hosting
- **Fly Global Edge Network** - Global routing and caching
- **Fly Postgres** - Managed PostgreSQL database
- **Docker** - Containerized deployments
- **nginx** - Frontend static file serving and API proxying

*Previous architecture used AWS Lambda + API Gateway + CloudFront (see [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for reference)*

### Development
- **Docker** - Local development environment
- **Hot Reload** - Fast development iteration
- **PostgreSQL** - Local database consistency

## 📊 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `POST /api/predict` - Single transaction prediction
- `POST /api/predict-batch` - Batch transaction analysis
- `POST /api/feedback` - Submit user feedback
- `GET /api/dashboard` - Analytics data
- `GET /api/transactions` - Transaction history

### Example Request
```bash
curl -X POST https://your-api.amazonaws.com/prod/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "hour": 23,
    "day_of_week": 6,
    "merchant_category": 8,
    "transaction_type": 1
  }'
```

### Example Response
```json
{
  "transaction_id": 123,
  "is_anomaly": true,
  "anomaly_score": -0.15,
  "confidence": 0.85,
  "shap_explanation": {
    "amount": 0.45,
    "hour": 0.30,
    "merchant_category": 0.10
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 🔧 Development

### Local Setup
```bash
# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# Start with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Database Migration
The app automatically creates PostgreSQL tables on startup. No manual migration needed.

### Environment Variables
```bash
# Local development (.env)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/secureflow
FLASK_ENV=development

# Production (managed by CloudFormation)
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/secureflow
ENVIRONMENT=prod
```

## 📈 Performance & Scalability

### Performance Metrics
- **Response Time**: <3 seconds for predictions
- **Throughput**: Handles concurrent requests via Lambda auto-scaling
- **Accuracy**: 95% recall target for anomaly detection

### Scalability
- **Lambda**: Automatically scales to handle traffic spikes
- **CloudFront**: Global edge locations for fast content delivery
- **RDS**: Can scale vertically/horizontally as needed
- **S3**: Virtually unlimited storage capacity

## 🔒 Security

### Data Protection
- **Encryption**: Data encrypted in transit and at rest
- **VPC**: Database isolated in private subnets
- **IAM**: Least privilege access controls
- **HTTPS**: End-to-end encryption

### Privacy
- **No PII Storage**: Only transaction patterns stored
- **Data Retention**: Configurable retention policies
- **Audit Logs**: CloudWatch logging for compliance

## 🚀 Deployment

### Production Deployment
```bash
# Deploy everything to AWS
./scripts/deploy-to-aws.sh

# Or manual CloudFormation
aws cloudformation deploy \
  --template-file aws/infrastructure.yml \
  --stack-name secureflow-production \
  --capabilities CAPABILITY_NAMED_IAM
```

### Monitoring
- **CloudWatch Logs**: `/aws/lambda/secureflow-api-prod`
- **CloudWatch Metrics**: Lambda performance, API Gateway requests
- **RDS Monitoring**: Database performance metrics

## 📚 Documentation

- [AWS Deployment Guide](AWS_DEPLOYMENT.md) - Complete production deployment
- [Architecture Summary](ARCHITECTURE_SUMMARY.md) - Technical architecture details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues:
- Create an issue in this repository
- Check the deployment documentation
- Review CloudWatch logs for troubleshooting

---

**🎉 SecureFlow helps banks and users stop financial scams before money is lost!**
