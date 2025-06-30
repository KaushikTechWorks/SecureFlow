# SecureFlow - Development Guide

## Quick Start

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- Docker Desktop (for containerized deployment)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data
python data_generator.py

# Start the backend server
python start_server.py
```
Backend will be available at: http://localhost:5001

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```
Frontend will be available at: http://localhost:3000

## API Endpoints

### Backend API (Port 5001)
- `GET /api/health` - Health check
- `POST /api/predict` - Single transaction analysis
- `POST /api/predict/batch` - Batch transaction analysis
- `POST /api/feedback` - Submit feedback
- `GET /api/dashboard` - Dashboard analytics
- `GET /api/transactions` - Recent transactions

### API Usage Examples

#### Single Transaction Analysis
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.50,
    "hour": 14,
    "day_of_week": 1,
    "merchant_category": 2,
    "transaction_type": 0
  }'
```

#### Health Check
```bash
curl http://localhost:5001/api/health
```

## Project Structure

```
SecureFlow-1/
├── README.md
├── backend/
│   ├── app.py                 # Flask application
│   ├── data_generator.py      # Synthetic data generation
│   ├── start_server.py        # Server startup script
│   ├── requirements.txt       # Python dependencies
│   ├── sample_transactions.csv # Generated test data
│   └── transactions.db        # SQLite database
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Single transaction analysis
│   │   │   ├── BatchUpload.tsx # Batch CSV analysis
│   │   │   ├── Dashboard.tsx   # Analytics dashboard
│   │   │   └── Feedback.tsx    # User feedback
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── DEV_README.md
```

## Features

### ✅ Completed
- **Single Transaction Analysis**: Real-time fraud detection with SHAP explanations
- **Batch Processing**: CSV upload for bulk transaction analysis
- **Interactive Dashboard**: Analytics with Chart.js visualizations
- **User Feedback System**: Model improvement through user corrections
- **Responsive UI**: Material-UI components with mobile support
- **Synthetic Data Generation**: Realistic transaction patterns for testing
- **RESTful API**: Complete Flask backend with CORS support

### 🚧 In Development
- Docker containerization
- Advanced model training
- Real-time alerts
- Enhanced analytics

## Development

### Adding New Features
1. **Backend**: Add new endpoints in `backend/app.py`
2. **Frontend**: Create new components in `frontend/src/pages/` or `frontend/src/components/`
3. **Database**: Modify schema in `backend/app.py` (SQLite)

### Testing
- **Frontend**: `npm test` (in frontend directory)
- **Backend**: `python -m pytest` (tests coming soon)
- **API Testing**: Use the provided curl examples or Postman

### Deployment
- **Development**: Use the quick start guide above
- **Production**: Use Docker (coming soon) or traditional deployment

## Technologies Used

### Frontend
- **React 19** with TypeScript
- **Material-UI v7** for components
- **Chart.js** for visualizations
- **Axios** for API calls
- **React Router** for navigation

### Backend
- **Flask** for REST API
- **SQLAlchemy** for database ORM
- **Scikit-learn** for ML models
- **SHAP** for explainable AI
- **Pandas/NumPy** for data processing
- **Flask-CORS** for cross-origin requests

### Machine Learning
- **Isolation Forest** for anomaly detection
- **SHAP** for model explanations
- **Synthetic Data Generation** for testing
- **95%+ accuracy** target performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

**Port 5000 already in use**
- MacOS: Disable AirPlay Receiver in System Preferences
- Alternative: Backend now uses port 5001 by default

**Frontend build errors**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Backend import errors**
- Ensure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt`

**CORS errors**
- Ensure backend is running on port 5001
- Check Flask-CORS configuration in app.py

## Performance

- **Latency**: <3 seconds for single transaction analysis
- **Throughput**: 100+ transactions per batch
- **Accuracy**: 95%+ fraud detection rate
- **Scalability**: Designed for horizontal scaling

## Security

- Input validation on all API endpoints
- SQL injection protection via SQLAlchemy ORM
- CORS configured for development (localhost)
- Rate limiting (to be implemented)

---

For more information, see the main [README.md](../README.md)
