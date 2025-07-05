// API Configuration - Updated for local development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pp6mtqf9qj.execute-api.us-east-1.amazonaws.com/prod';

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
