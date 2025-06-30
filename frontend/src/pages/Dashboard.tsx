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

interface DashboardStats {
  total_transactions: number;
  anomalies_detected: number;
  avg_anomaly_score: number;
  anomaly_rate: number;
}

interface HourlyData {
  hour: number;
  total_transactions: number;
  anomalies: number;
}

interface FeedbackStats {
  total_feedback: number;
  positive_feedback: number;
  accuracy: number;
}

interface DashboardData {
  stats: DashboardStats;
  hourly_distribution: HourlyData[];
  feedback: FeedbackStats;
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
    if (!data?.hourly_distribution) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const transactionData = hours.map(hour => {
      const hourData = data.hourly_distribution.find(h => h.hour === hour);
      return hourData?.total_transactions || 0;
    });
    const anomalyData = hours.map(hour => {
      const hourData = data.hourly_distribution.find(h => h.hour === hour);
      return hourData?.anomalies || 0;
    });

    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        {
          label: 'Total Transactions',
          data: transactionData,
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 1,
        },
        {
          label: 'Anomalies',
          data: anomalyData,
          backgroundColor: 'rgba(220, 0, 78, 0.6)',
          borderColor: 'rgba(220, 0, 78, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getAnomalyDistributionData = () => {
    if (!data?.stats) return null;

    const normal = data.stats.total_transactions - data.stats.anomalies_detected;
    const anomalies = data.stats.anomalies_detected;

    return {
      labels: ['Normal Transactions', 'Suspicious Transactions'],
      datasets: [
        {
          data: [normal, anomalies],
          backgroundColor: ['rgba(46, 125, 50, 0.8)', 'rgba(220, 0, 78, 0.8)'],
          borderColor: ['rgba(46, 125, 50, 1)', 'rgba(220, 0, 78, 1)'],
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom color="primary">
        SecureFlow Dashboard
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }} color="text.secondary">
        Analytics and insights from transaction anomaly detection (Last 7 days)
      </Typography>

      {/* Key Metrics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {data?.stats.total_transactions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Security color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error">
                {data?.stats.anomalies_detected || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Anomalies Detected
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {data?.stats.anomaly_rate.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Anomaly Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Feedback color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {data?.feedback.accuracy.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Model Accuracy
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 65%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Transaction Distribution
            </Typography>
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
              <Typography variant="body1">Average Anomaly Score:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {data?.stats.avg_anomaly_score.toFixed(3) || 'N/A'}
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
              User Feedback
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Total Feedback:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {data?.feedback.total_feedback || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Positive Feedback:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.feedback.positive_feedback || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Model Accuracy:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.feedback.accuracy.toFixed(1) || 0}%
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
