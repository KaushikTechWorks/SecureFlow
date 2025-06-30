import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { TrendingUp, TrendingDown, Security, Speed } from '@mui/icons-material';
import axios from 'axios';

interface PredictionResult {
  transaction_id: number;
  is_anomaly: boolean;
  anomaly_score: number;
  confidence: number;
  shap_explanation: Record<string, number>;
  timestamp: string;
}

const Home: React.FC = () => {
  const [formData, setFormData] = useState({
    amount: '',
    hour: '',
    day_of_week: '',
    merchant_category: '',
    transaction_type: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merchantCategories = [
    'Grocery', 'Gas Station', 'Restaurant', 'Retail', 'Online',
    'ATM', 'Bank', 'Healthcare', 'Entertainment', 'Other'
  ];

  const transactionTypes = ['Purchase', 'Withdrawal', 'Transfer'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        hour: parseInt(formData.hour),
        day_of_week: parseInt(formData.day_of_week),
        merchant_category: parseInt(formData.merchant_category),
        transaction_type: parseInt(formData.transaction_type),
      };

      const response = await axios.post('http://localhost:5001/api/predict', payload);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while processing the transaction');
    } finally {
      setLoading(false);
    }
  };

  const getShapExplanation = () => {
    if (!result?.shap_explanation) return null;

    const features = Object.entries(result.shap_explanation)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3);

    return features.map(([feature, value]) => ({
      feature: feature.replace('_', ' ').toUpperCase(),
      value: value,
      impact: value > 0 ? 'increases' : 'decreases',
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        SecureFlow - Transaction Anomaly Detection
      </Typography>
      
      <Typography variant="body1" align="center" sx={{ mb: 4 }} color="text.secondary">
        Real-time financial transaction fraud detection with 95% accuracy and &lt;3s latency
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Features Overview */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">95% Accuracy</Typography>
                  <Typography variant="body2" color="text.secondary">
                    High precision fraud detection
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">&lt;3s Latency</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time analysis
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">SHAP Explanations</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Explainable AI decisions
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingDown color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">ML-Powered</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Isolation Forest algorithm
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Transaction Input Form */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Analyze Transaction
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
                  <TextField
                    fullWidth
                    label="Amount ($)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
                  <TextField
                    fullWidth
                    label="Hour (0-23)"
                    type="number"
                    value={formData.hour}
                    onChange={(e) => handleInputChange('hour', e.target.value)}
                    required
                    inputProps={{ min: 0, max: 23 }}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
                  <FormControl fullWidth required>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={formData.day_of_week}
                      label="Day of Week"
                      onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                    >
                      {daysOfWeek.map((day, index) => (
                        <MenuItem key={index} value={index}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
                  <FormControl fullWidth required>
                    <InputLabel>Merchant Category</InputLabel>
                    <Select
                      value={formData.merchant_category}
                      label="Merchant Category"
                      onChange={(e) => handleInputChange('merchant_category', e.target.value)}
                    >
                      {merchantCategories.map((category, index) => (
                        <MenuItem key={index} value={index}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <FormControl fullWidth required>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={formData.transaction_type}
                      label="Transaction Type"
                      onChange={(e) => handleInputChange('transaction_type', e.target.value)}
                    >
                      {transactionTypes.map((type, index) => (
                        <MenuItem key={index} value={index}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Analyze Transaction'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Results */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
          <Paper elevation={3} sx={{ p: 3, minHeight: '400px' }}>
            <Typography variant="h5" gutterBottom>
              Analysis Results
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {result && (
              <Box>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Chip
                    label={result.is_anomaly ? 'SUSPICIOUS TRANSACTION' : 'NORMAL TRANSACTION'}
                    color={result.is_anomaly ? 'error' : 'success'}
                    size="medium"
                    sx={{ fontSize: '1rem', py: 2 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Anomaly Score
                    </Typography>
                    <Typography variant="h6">
                      {result.anomaly_score.toFixed(3)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Confidence
                    </Typography>
                    <Typography variant="h6">
                      {(result.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                {getShapExplanation() && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Key Factors (SHAP Analysis)
                    </Typography>
                    {getShapExplanation()?.map((factor, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>{factor.feature}</strong> {factor.impact} risk by{' '}
                          <span style={{ color: factor.value > 0 ? '#d32f2f' : '#2e7d32' }}>
                            {Math.abs(factor.value).toFixed(3)}
                          </span>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID: {result.transaction_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analyzed at: {new Date(result.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}

            {!result && !error && !loading && (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                <Typography variant="body1">
                  Enter transaction details and click "Analyze Transaction" to get started
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
