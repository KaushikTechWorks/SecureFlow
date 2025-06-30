// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    HEALTH: `${API_BASE_URL}/api/health`,
    PREDICT: `${API_BASE_URL}/api/predict`,
    PREDICT_BATCH: `${API_BASE_URL}/api/predict-batch`,
    FEEDBACK: `${API_BASE_URL}/api/feedback`,
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,
    TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
  }
};
