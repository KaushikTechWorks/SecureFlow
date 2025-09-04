// API Configuration - Updated for Fly.io deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://secureflow-backend.fly.dev';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    HEALTH: `${API_BASE_URL}/api/health`,
    PREDICT: `${API_BASE_URL}/api/predict`,
    PREDICT_BATCH: `${API_BASE_URL}/api/predict-batch`,
    FEEDBACK: `${API_BASE_URL}/api/feedback`,
    DASHBOARD: `${API_BASE_URL}/api/dashboard`,
    TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
    WARMUP: `${API_BASE_URL}/api/warmup`,
  }
};

// API warmup utility
export const warmupBackend = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_CONFIG.ENDPOINTS.WARMUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend warmed up successfully:', data);
      return true;
    } else {
      console.warn('Backend warmup failed:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Backend warmup error:', error);
    return false;
  }
};
