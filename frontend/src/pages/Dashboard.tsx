import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Security, Assessment, Feedback } from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  total_transactions: number;
  total_amount: number;
  average_amount: number;
  transactions_today: number;
  fraud_detected: number;
  anomaly_rate: number;
  compliance_score: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  top_categories: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_CONFIG.ENDPOINTS.DASHBOARD);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getHourlyChartData = () => {
    // Since the API doesn't provide hourly data, we'll create mock data
    // or hide this chart until we implement it in the backend
    return null;
  };

  const getAnomalyDistributionData = () => {
    if (!data?.risk_distribution) return null;

    const { low, medium, high } = data.risk_distribution;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [low, medium, high],
          backgroundColor: ['rgba(46, 125, 50, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(220, 0, 78, 0.8)'],
          borderColor: ['rgba(46, 125, 50, 1)', 'rgba(255, 193, 7, 1)', 'rgba(220, 0, 78, 1)'],
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <Box 
        sx={{ 
          backgroundColor: 'background.paper',
          pt: 4,
          pb: 6,
          mb: 4,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'linear-gradient(to right, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.02))'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ mb: { xs: 3, md: 0 } }}>
              <Typography variant="h3" fontWeight="bold" color="primary">
                SecureFlow Dashboard
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
                Real-time analytics and insights from transaction anomaly detection
              </Typography>
            </Box>
            <Box>
              <Chip 
                icon={<Assessment />} 
                label="LAST 7 DAYS" 
                color="primary" 
                variant="outlined"
                sx={{ fontWeight: 'medium' }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        {/* Key Metrics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card elevation={3} sx={{ 
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'primary.main' }} />
              <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2
                }}>
                  <Assessment sx={{ fontSize: 30, color: 'white' }} />
                </Box>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {data?.total_transactions || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3} sx={{ 
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'error.main' }} />
            <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'error.light',
                borderRadius: '50%',
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <Security sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error">
                {data?.fraud_detected || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Anomalies Detected
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3} sx={{ 
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'warning.main' }} />
            <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'warning.light',
                borderRadius: '50%',
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUp sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {data?.anomaly_rate ? (data.anomaly_rate * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Anomaly Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3} sx={{ 
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'success.main' }} />
            <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'success.light',
                borderRadius: '50%',
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <Feedback sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {data?.compliance_score?.toFixed(1) || 'N/A'}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compliance Score
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
        Transaction Analytics
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 65%' } }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              height: '100%',
              backgroundImage: 'linear-gradient(to bottom, rgba(37, 99, 235, 0.02), rgba(255, 255, 255, 0))'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="medium">
                Hourly Transaction Distribution
              </Typography>
              <Chip 
                label="Last 24 Hours" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            {getHourlyChartData() && (
              <Box sx={{ height: 400 }}>
                <Bar
                  data={getHourlyChartData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Transaction Volume by Hour',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 30%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Classification
            </Typography>
            {getAnomalyDistributionData() && (
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={getAnomalyDistributionData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Additional Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Performance
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Average Transaction Amount:</Typography>
              <Typography variant="body1" fontWeight="bold">
                ${data?.average_amount?.toFixed(2) || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Response Time:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                &lt; 3 seconds
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Model Type:</Typography>
              <Typography variant="body1" fontWeight="bold">
                Isolation Forest
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Overview
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Total Amount:</Typography>
              <Typography variant="body1" fontWeight="bold">
                ${data?.total_amount?.toLocaleString() || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Transactions Today:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.transactions_today || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Compliance Score:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.compliance_score?.toFixed(1) || 0}%
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
    </>
  );
};

export default Dashboard;
