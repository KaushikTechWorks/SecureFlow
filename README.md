# SecureFlow - Financial Transaction Anomaly Detection

SecureFlow is a full-stack web application for real-time financial transaction anomaly detection, targeting 95% recall and <3-second latency, addressing the $40B financial scam problem in 2025.

## 🎯 Overview

SecureFlow is designed to detect suspicious financial transactions using machine learning, providing:
- **Real-time anomaly detection** with Isolation Forest model
- **SHAP explanations** for model interpretability  
- **Interactive web interface** for single and batch transaction analysis
- **Dashboard analytics** with visualizations
- **User feedback system** for continuous model improvement

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/KaushikTechWorks/SecureFlow.git
   cd SecureFlow
   ```

2. **Start the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python start_server.py
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Docker Deployment

```bash
docker-compose up --build
```



📖 **Detailed AWS deployment guide**: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)

## 🏗️ Architecture

```
Frontend (React/TypeScript) → Backend (Flask/Python) → ML Model (Isolation Forest)
         ↓                           ↓                        ↓
    Material-UI Interface      REST API + SHAP           SQLite Database
```

### AWS Production Architecture
```
Internet → ALB → ECS Fargate Service
                ├── Frontend Container (nginx:80)
                └── Backend Container (python:5001)
```

## 📋 Features

### Core Features
- **Single Transaction Analysis**: Input transaction details and get instant anomaly detection
- **Batch Processing**: Upload CSV files for bulk transaction analysis
- **Real-time Dashboard**: View analytics, charts, and transaction statistics
- **Model Feedback**: Provide feedback to improve model accuracy

### Technical Features
- **ML Model**: Isolation Forest with SHAP explanations
- **API Performance**: <3 second response time
- **Database**: SQLite for development, scalable to PostgreSQL/RDS
- **Containerization**: Docker support for easy deployment
- **Cloud Ready**: AWS ECS deployment with infrastructure as code

## 🎯 Use Cases

### For Users
- Verify suspicious transactions quickly
- Get explanations for why transactions are flagged
- Report potential fraud to banks with confidence

### For Financial Institutions  
- Monitor transactions in real-time
- Reduce false positives with explainable AI
- Integrate with existing fraud detection systems

## 🛠️ Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI for modern interface
- Chart.js for data visualization
- Axios for API communication

**Backend:**
- Flask with Python 3.11
- Scikit-learn for ML models
- SHAP for model explanations
- SQLite/PostgreSQL database

**DevOps:**
- Docker & Docker Compose
- CloudFormation for infrastructure

## 📊 Model Performance

- **Accuracy**: 95%+ recall rate
- **Latency**: <3 second response time
- **Explainability**: SHAP values for each prediction
- **Features**: Amount, time, merchant category, transaction type, day of week

## 🔧 Configuration

### Environment Variables

**Development (.env.local):**
```
REACT_APP_API_URL=http://localhost:5001
```

**Production (.env.production):**
```
REACT_APP_API_URL=https://your-production-api-url
REACT_APP_ENV=production
```

## 📈 Monitoring

- **CloudWatch Logs**: Application and container logs
- **Health Checks**: Built-in health endpoints
- **Metrics**: Transaction volume, anomaly rates, response times

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests  
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up
```

## 🚢 Deployment Options

1. **Local Development**: Direct Python/Node.js execution
2. **Docker Compose**: Local containerized environment
3. **AWS ECS**: Production-ready cloud deployment
4. **Kubernetes**: Alternative container orchestration (config available)

## 🔒 Security

- CORS configured for cross-origin requests
- Input validation on all endpoints
- Health checks for container monitoring
- Security groups and VPC isolation in AWS

## 📝 API Documentation

### Core Endpoints

- `GET /api/health` - Health check
- `POST /api/predict` - Single transaction prediction
- `POST /api/predict-batch` - Batch transaction processing
- `GET /api/dashboard` - Analytics data
- `POST /api/feedback` - Submit model feedback

### Example Request

```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "hour": 3,
    "day_of_week": 2,
    "merchant_category": 1,
    "transaction_type": 0
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

For questions and support:
- Create an issue in this repository
- Review the [AWS deployment guide](AWS_DEPLOYMENT.md)
- Check the troubleshooting section in documentation

---

**Note**: This application is for educational and demonstration purposes. For production use in financial institutions, additional security measures, compliance checks, and thorough testing are required.
