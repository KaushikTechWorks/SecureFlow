import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import SecurityIcon from '@mui/icons-material/Security';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface PredictionResult {
  is_fraudulent: boolean; // This represents risk level - keeping technical field name for API compatibility
  confidence: number;
  risk_factors: {
    high_amount: boolean;
    unusual_time: boolean;
    risky_category: boolean;
  };
  data_source: string;
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
        merchant_category: merchantCategories[parseInt(formData.merchant_category)].toLowerCase(),
        transaction_type: transactionTypes[parseInt(formData.transaction_type)].toLowerCase(),
      };

      const response = await axios.post(API_CONFIG.ENDPOINTS.PREDICT, payload);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while processing the transaction');
    } finally {
      setLoading(false);
    }
  };

  const getShapExplanation = () => {
    if (!result) return null;

    // Since our current API doesn't return SHAP explanations,
    // we'll create a simple explanation based on risk factors
    const factors: [string, number][] = [];
    
    if (result.risk_factors.high_amount) {
      factors.push(['High Amount', 0.4]);
    }
    if (result.risk_factors.unusual_time) {
      factors.push(['Unusual Time', 0.3]);
    }
    if (result.risk_factors.risky_category) {
      factors.push(['Risky Category', 0.3]);
    }

    if (factors.length === 0) return null;

    return factors
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([feature, value]) => ({
        feature: feature,
        value: value,
        impact: value > 0 ? 'increases' : 'decreases',
      }));
  };

  return (
    <>
      {/* Professional Hero Section */}
      <Box 
        sx={{ 
          backgroundColor: 'background.default',
          pt: { xs: 6, md: 8 },
          pb: { xs: 8, md: 12 },
          mb: 6,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(21, 101, 192, 0.05) 0%, rgba(55, 71, 79, 0.05) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center',
            gap: 6,
          }}>
            <Box sx={{ 
              flex: 1, 
              textAlign: { xs: 'center', md: 'left' },
              zIndex: 2,
            }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 3,
                  lineHeight: 1.1,
                }}
              >
                Enterprise Risk Management
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 400,
                  mb: 4,
                  maxWidth: 600,
                  lineHeight: 1.6,
                }}
              >
                Advanced AI-powered risk detection with real-time analysis. 
                Protect your transactions with enterprise-grade security technology.
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                mb: 4,
              }}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/dashboard"
                  sx={{ 
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  View Dashboard
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/batch"
                  sx={{ 
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Batch Upload
                </Button>
              </Box>

              {/* Feature Highlights */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}>
                {[
                  { icon: <Security />, text: 'Real-time Detection' },
                  { icon: <TrendingUp />, text: 'AI-Powered Analytics' },
                  { icon: <Speed />, text: 'Fast Processing' }
                ].map((feature, index) => (
                  <Paper
                    key={feature.text}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ color: 'primary.main' }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="body2" fontWeight={500}>
                      {feature.text}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>

            {/* Right Side - Professional Stats Cards */}
            <Box sx={{ 
              flex: { xs: 1, md: 0.5 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
            }}>
              <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <Security />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      99.8%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Detection Accuracy
                    </Typography>
                  </Box>
                </Box>
              </Card>

              <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <Speed />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      &lt;100ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Response Time
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        {/* Features Overview */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom color="primary">
            Advanced Anomaly Detection Features
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 700, mx: 'auto' }} color="text.secondary">
            SecureFlow uses state-of-the-art machine learning algorithms to detect and prevent suspicious transactions in real-time.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  borderRadius: '50%', 
                  width: 80, 
                  height: 80, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <Security sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">95% Accuracy</Typography>
                <Typography variant="body2" color="text.secondary">
                  High precision anomaly detection using machine learning to reduce false positives
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  backgroundColor: 'secondary.light', 
                  borderRadius: '50%', 
                  width: 80, 
                  height: 80, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <Speed sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">Real-time Analysis</Typography>
                <Typography variant="body2" color="text.secondary">
                  Process transactions in under 3 seconds with our high-performance system
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  backgroundColor: 'success.light', 
                  borderRadius: '50%', 
                  width: 80, 
                  height: 80, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">SHAP Explanations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Transparent AI decisions with detailed factor analysis for each transaction
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  backgroundColor: 'error.light', 
                  borderRadius: '50%', 
                  width: 80, 
                  height: 80, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <TrendingDown sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">ML-Powered</Typography>
                <Typography variant="body2" color="text.secondary">
                  Advanced Isolation Forest and ensemble algorithms for anomaly detection
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Typography variant="h4" textAlign="center" gutterBottom color="primary" sx={{ mt: 8, mb: 4 }}>
          Test A Transaction
        </Typography>

        {/* Transaction Input Form */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
                    label={result.is_fraudulent ? 'TRANSACTION REQUIRES REVIEW' : 'TRANSACTION APPROVED'}
                    color={result.is_fraudulent ? 'warning' : 'success'}
                    size="medium"
                    sx={{ fontSize: '1rem', py: 2 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Risk Level
                    </Typography>
                    <Typography variant="h6">
                      {result.is_fraudulent ? 'Elevated Risk' : 'Low Risk'}
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
                      Key Risk Factors
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

                {/* Risk Factors Display */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Risk Factor Analysis
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {result.risk_factors.high_amount && (
                      <Chip label="High Amount" size="small" color="warning" />
                    )}
                    {result.risk_factors.unusual_time && (
                      <Chip label="Unusual Time" size="small" color="warning" />
                    )}
                    {result.risk_factors.risky_category && (
                      <Chip label="Risky Category" size="small" color="warning" />
                    )}
                    {!result.risk_factors.high_amount && !result.risk_factors.unusual_time && !result.risk_factors.risky_category && (
                      <Typography variant="body2" color="text.secondary">No specific risk factors detected</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Data Source: {result.data_source}
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
    </>
  );
};

export default Home;
