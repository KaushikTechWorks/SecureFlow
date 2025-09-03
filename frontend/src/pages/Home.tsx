import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { TrendingUp, TrendingDown, Security, Speed } from '@mui/icons-material';
import SecurityIcon from '@mui/icons-material/Security';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '@mui/material/styles';

interface PredictionResult {
  is_anomaly: boolean;
  anomaly_score: number;
  confidence?: number; // Backend returns both
  shap_explanation: {
    [key: string]: number;
  };
  data_source?: string;
  timestamp?: string;
  transaction_id?: number;
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
        // Use numeric hashed-like codes expected by backend normalization
        merchant_category: parseInt(formData.merchant_category),
        transaction_type: parseInt(formData.transaction_type),
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
    if (!result || !result.shap_explanation) return null;

    // Convert SHAP explanation object to sorted array of [feature, value] pairs
    const factors: [string, number][] = Object.entries(result.shap_explanation)
      .filter(([_, value]) => Math.abs(value) > 0.001) // Filter out very small values
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) // Sort by absolute value
      .slice(0, 3); // Take top 3 most important features

    if (factors.length === 0) return null;

    return factors
      .map(([feature, value]) => ({
        feature: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format feature name
        value: value,
        impact: value > 0 ? 'positive' : 'negative'
      }));
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const surfaceStyles = React.useMemo(() => ({
    background: isDark
      ? 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))'
      : 'linear-gradient(145deg,#ffffff,#f3f8fb)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
    borderRadius: 3,
    backdropFilter: 'blur(10px)',
    boxShadow: isDark
      ? '0 4px 14px -4px rgba(0,0,0,0.55)'
      : '0 6px 18px -6px rgba(15,80,140,0.15)'
  }), [isDark]);

  return (
    <>
      {/* New Hero Section */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(145deg,#06121f 0%, #0d2238 60%, #16324d 100%)'
          : 'linear-gradient(180deg,#f6f9fb 0%, #f6f9fb 60%, #f2f7fa 100%)',
        color: isDark ? 'white' : theme.palette.text.primary,
        pt: { xs: 10, md: 12 },
        pb: { xs: 9, md: 11 },
        position: 'relative',
        overflow: 'hidden',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)'
      }}>
        <ParticleBackground particleCount={55} speed={0.6} />
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 6, md: 10 } }}>
            {/* Left Column: Textual Narrative */}
            <Box sx={{ flex: 1, maxWidth: 760, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="overline" sx={{ letterSpacing: '0.15em', fontSize: 12, mb: 2, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,40,80,0.6)' }}>
                SECUREFLOW PLATFORM
              </Typography>
              <Typography component="h1" sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-1.5px',
                fontSize: { xs: '2.25rem', sm: '2.9rem', md: '3.35rem' },
                mb: 3,
                maxWidth: 720
              }}>
                <Box component="span" sx={isDark ? {
                  background: 'linear-gradient(90deg,#06b6ff,#00d5ff)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                } : { color: theme.palette.primary.dark }}>
                  Real‑Time Transaction Intelligence
                </Box>
              </Typography>
              <Typography variant="h6" sx={{
                mb: 4,
                fontWeight: 400,
                color: isDark ? 'rgba(255,255,255,0.74)' : 'rgba(0,32,64,0.58)',
                maxWidth: 600,
                lineHeight: 1.4
              }}>
                Advanced ML-powered risk detection with real-time analysis. Protect your transactions with enterprise-grade security technology.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 4 }}>
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    background: isDark ? 'linear-gradient(90deg,#0096ff,#00c0ff)' : theme.palette.primary.dark,
                    boxShadow: isDark ? '0 10px 24px -6px rgba(0,150,255,0.45)' : '0 4px 14px -4px rgba(0,64,120,0.35)',
                    '&:hover': { background: isDark ? 'linear-gradient(90deg,#0088e6,#00afd9)' : theme.palette.primary.main }
                  }}
                >
                  View Dashboard
                </Button>
                <Button
                  component={RouterLink}
                  to="/batch"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.6,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)',
                    color: isDark ? 'white' : theme.palette.primary.dark,
                    background: isDark ? 'transparent' : '#ffffff',
                    '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.5)' : theme.palette.primary.main, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff' }
                  }}
                >
                  Batch Upload
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, rowGap: 1.4, maxWidth: 720 }}>
                {[
                  { label: 'Real-time Detection', icon: <Security fontSize="small" /> },
                  { label: 'Explainable ML', icon: <TrendingUp fontSize="small" /> },
                  { label: 'Sub‑100ms Scoring', icon: <Speed fontSize="small" /> },
                ].map(b => (
                  <Chip
                    key={b.label}
                    icon={b.icon}
                    label={b.label}
                    sx={{
                      px: 1.4,
                      height: 40,
                      background: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff',
                      color: isDark ? 'rgba(255,255,255,0.85)' : theme.palette.primary.dark,
                      fontWeight: 500,
                      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
                      boxShadow: isDark ? 'none' : '0 2px 6px -2px rgba(0,40,80,0.15)',
                      backdropFilter: 'blur(6px)'
                    }}
                  />
                ))}
              </Box>
            </Box>
            {/* Right Column: KPI Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: { xs: '100%', lg: 360 } }}>
              {[{
                title: 'Detection Accuracy', value: '99.8%', icon: <SecurityIcon />, color: '#06b6ff'
              }, { title: 'Median Response', value: '82ms', icon: <Speed />, color: '#10b981' }].map(card => (
                <Paper key={card.title} elevation={0} sx={{
                  p: 4,
                  background: isDark
                    ? 'linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))'
                    : '#ffffff',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  boxShadow: isDark ? '0 6px 20px -6px rgba(0,0,0,0.5)' : '0 8px 20px -6px rgba(15,60,110,0.15)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: card.color, color: '#fff', boxShadow: `0 6px 18px -4px ${card.color}aa` }}>{card.icon}</Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5, color: isDark ? '#fff' : theme.palette.primary.dark }}>{card.value}</Typography>
                      <Typography variant="body2" sx={{ opacity: isDark ? 0.7 : 0.75 }}>{card.title}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content Wrapper with blended background */}
      <Box sx={{
        background: isDark
          ? 'linear-gradient(180deg,#0d2238 0%, #0f1e2b 100%)'
          : 'linear-gradient(180deg,#f4f9fc 0%, #ffffff 70%)',
        pt: { xs: 6, md: 8 },
        pb: { xs: 8, md: 10 }
      }}>
      <Container maxWidth="lg">
        {/* Features Overview */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, letterSpacing: '-0.5px' }} color="primary">
            Advanced Anomaly Detection Features
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 720, mx: 'auto', opacity: 0.85 }} color="text.secondary">
            SecureFlow uses state-of-the-art machine learning algorithms to detect and prevent suspicious transactions in real-time.
          </Typography>
          <Divider sx={{ maxWidth: 160, mx: 'auto', mb: 4, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 8 }}>
          {[
            { title: '95% Accuracy', icon: <Security sx={{ fontSize: 34 }} />, color: 'linear-gradient(135deg,#06b6ff,#0096ff)', desc: 'High precision anomaly detection using machine learning to reduce false positives' },
            { title: 'Real-time Analysis', icon: <Speed sx={{ fontSize: 34 }} />, color: 'linear-gradient(135deg,#16c784,#0d9f63)', desc: 'Process transactions in under 3 seconds with our high-performance system' },
            { title: 'SHAP Explanations', icon: <TrendingUp sx={{ fontSize: 34 }} />, color: 'linear-gradient(135deg,#6366f1,#4f46e5)', desc: 'Transparent ML decisions with detailed factor analysis for each transaction' },
            { title: 'ML-Powered', icon: <TrendingDown sx={{ fontSize: 34 }} />, color: 'linear-gradient(135deg,#f43f5e,#e11d48)', desc: 'Advanced Isolation Forest and ensemble algorithms for anomaly detection' },
          ].map(f => (
            <Paper key={f.title} sx={{ ...surfaceStyles, flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'transform .35s, box-shadow .35s', '&:hover': { transform: 'translateY(-6px)', boxShadow: isDark ? '0 10px 28px -6px rgba(0,0,0,0.65)' : '0 14px 32px -10px rgba(20,80,140,0.25)' } }}>
              <Box sx={{
                width: 78,
                height: 78,
                borderRadius: '50%',
                mx: 'auto',
                mb: 2.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: f.color,
                color: '#fff',
                boxShadow: '0 8px 22px -8px rgba(0,0,0,0.35)'
              }}>{f.icon}</Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>{f.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>{f.desc}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }} color="primary">Test A Transaction</Typography>
          <Typography variant="body2" sx={{ maxWidth: 640, mx: 'auto', opacity: 0.75 }}>
            Simulate a transaction below to see real-time anomaly scoring and risk factor explanations.
          </Typography>
        </Box>

        {/* Transaction Input Form */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
          <Paper elevation={0} sx={{ p: 3, ...surfaceStyles }}>
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
          <Paper elevation={0} sx={{ p: 3, minHeight: '400px', ...surfaceStyles }}>
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
                    label={result.is_anomaly ? 'TRANSACTION REQUIRES REVIEW' : 'TRANSACTION APPROVED'}
                    color={result.is_anomaly ? 'warning' : 'success'}
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
                      {result.is_anomaly ? 'Elevated Risk' : 'Low Risk'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Anomaly Score
                    </Typography>
                    <Typography variant="h6">
                      {(result.anomaly_score * 100).toFixed(1)}%
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
                    SHAP Feature Analysis
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {getShapExplanation()?.map((factor, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{factor.feature}</Typography>
                        <Chip 
                          label={`${factor.value > 0 ? '+' : ''}${factor.value.toFixed(3)}`}
                          size="small" 
                          color={factor.value > 0 ? 'warning' : 'success'}
                        />
                      </Box>
                    )) || (
                      <Typography variant="body2" color="text.secondary">No significant features detected</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                  {result.data_source && (
                    <Typography variant="body2" color="text.secondary">
                      Data Source: {result.data_source}
                    </Typography>
                  )}
                  {result.timestamp && (
                    <Typography variant="body2" color="text.secondary">
                      Analyzed at: {new Date(result.timestamp).toLocaleString()}
                    </Typography>
                  )}
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
    </Box>
    </>
  );
};

export default Home;
