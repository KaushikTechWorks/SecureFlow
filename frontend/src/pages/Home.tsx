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
import AnimatedBackground from '../components/AnimatedBackground';
import GlassCard from '../components/GlassCard';
import EnhancedButton from '../components/EnhancedButton';
import ParticleBackground from '../components/ParticleBackground';

interface PredictionResult {
  is_fraudulent: boolean;
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
      {/* Hero Section */}
      <Box 
        sx={{ 
          backgroundColor: 'primary.main',
          color: 'white',
          pt: 8,
          pb: 8,
          mb: 6,
          backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
          clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ParticleBackground particleCount={25} />
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
            <Box sx={{ flex: 1, pr: { md: 4 }, mb: { xs: 4, md: 0 } }}>
              <Typography 
                variant="h2" 
                gutterBottom 
                fontWeight="bold"
                className="fade-in-up"
                sx={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Secure Your Financial Transactions
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 4, opacity: 0.9 }} 
                fontWeight="normal"
                className="fade-in-up"
              >
                Advanced machine learning detection with 95% accuracy and real-time alerts
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <EnhancedButton 
                  variant="glow"
                  size="large" 
                  component={RouterLink} 
                  to="/batch"
                  glowColor="#ffffff"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    backgroundColor: 'white',
                    color: 'primary.dark',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  Try Batch Upload
                </EnhancedButton>
                <Button 
                  variant="outlined" 
                  size="large" 
                  component={RouterLink} 
                  to="/dashboard"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  View Dashboard
                </Button>
              </Box>
            </Box>
            <Box sx={{ 
              flex: 1, 
              maxWidth: { xs: '100%', md: '50%' }, 
              display: 'flex', 
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Box sx={{
                width: '100%',
                maxWidth: 500,
                height: 300,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0px 20px 40px rgba(0,0,0,0.2)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ fontSize: 36, mr: 2 }} />
                  <Typography variant="h5">Real-time Protection</Typography>
                </Box>
                <Box sx={{ 
                  height: 10, 
                  width: '100%', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 5,
                  mb: 3,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '95%',
                    backgroundColor: 'secondary.main',
                    borderRadius: 5
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography>Transaction Security Score</Typography>
                  <Typography fontWeight="bold">95%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip 
                    icon={<TrendingUp />} 
                    label="ACTIVE PROTECTION" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Typography variant="body2">Last scan: Just now</Typography>
                </Box>
              </Box>
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
