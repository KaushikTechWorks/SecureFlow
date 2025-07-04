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
  stats: {
    total_transactions: number;
    anomalies_detected: number;
    avg_anomaly_score: number;
    anomaly_rate: number;
  };
  hourly_distribution: Array<{
    hour: number;
    total_transactions: number;
    anomalies: number;
  }>;
  feedback: {
    total_feedback: number;
    positive_feedback: number;
    accuracy: number;
  };
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
    if (!data?.hourly_distribution || data.hourly_distribution.length === 0) return null;

    // Create a complete 24-hour dataset, filling missing hours with 0
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourData = data.hourly_distribution.find(h => h.hour === hour);
      return {
        hour,
        total_transactions: hourData?.total_transactions || 0,
        anomalies: hourData?.anomalies || 0,
        normal: (hourData?.total_transactions || 0) - (hourData?.anomalies || 0)
      };
    });

    return {
      labels: hourlyData.map(h => `${h.hour.toString().padStart(2, '0')}:00`),
      datasets: [
        {
          label: 'Normal Transactions',
          data: hourlyData.map(h => h.normal),
          backgroundColor: 'rgba(46, 125, 50, 0.8)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Anomalous Transactions',
          data: hourlyData.map(h => h.anomalies),
          backgroundColor: 'rgba(244, 67, 54, 0.8)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const getAnomalyDistributionData = () => {
    if (!data?.hourly_distribution || data.hourly_distribution.length === 0) return null;

    // Calculate risk distribution based on anomaly rate per hour
    let low = 0, medium = 0, high = 0;
    
    data.hourly_distribution.forEach(hour => {
      const anomalyRate = hour.total_transactions > 0 ? (hour.anomalies / hour.total_transactions) * 100 : 0;
      if (anomalyRate < 20) low += hour.total_transactions;
      else if (anomalyRate < 50) medium += hour.total_transactions;
      else high += hour.total_transactions;
    });

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
                  {data?.stats?.total_transactions || 0}
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
                {data?.stats?.anomalies_detected || 0}
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
                {data?.stats?.anomaly_rate ? data.stats.anomaly_rate.toFixed(1) : 0}%
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
                {data?.feedback?.accuracy?.toFixed(1) || '0.0'}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Feedback Accuracy
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
            {getHourlyChartData() ? (
              <Box sx={{ height: 400 }}>
                <Bar
                  data={getHourlyChartData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      },
                      title: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                          afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const hourData = data?.hourly_distribution?.find(h => h.hour === dataIndex);
                            const total = hourData?.total_transactions || 0;
                            const anomalies = hourData?.anomalies || 0;
                            const rate = total > 0 ? ((anomalies / total) * 100).toFixed(1) : '0.0';
                            return `Anomaly Rate: ${rate}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        stacked: true,
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: {
                            size: 10,
                          },
                          maxRotation: 0,
                          callback: function(value, index) {
                            // Show every 2nd hour to avoid crowding
                            return index % 2 === 0 ? this.getLabelForValue(value as number) : '';
                          }
                        }
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          font: {
                            size: 10,
                          }
                        }
                      },
                    },
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider'
              }}>
                <Assessment sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  No Hourly Data Available
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ maxWidth: 300 }}>
                  Process some transactions to see the hourly distribution chart with normal vs anomalous transactions.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 30%' } }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Classification
            </Typography>
            {getAnomalyDistributionData() ? (
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={getAnomalyDistributionData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 11,
                            weight: 'bold'
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    cutout: '50%',
                    elements: {
                      arc: {
                        borderWidth: 2,
                        borderColor: '#ffffff'
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider'
              }}>
                <Security sx={{ fontSize: 50, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" gutterBottom textAlign="center">
                  No Classification Data
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ maxWidth: 200 }}>
                  Transaction risk levels will appear here once data is processed.
                </Typography>
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
                {data?.stats?.avg_anomaly_score?.toFixed(4) || 'N/A'}
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
              <Typography variant="body1">Total Feedback:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {data?.feedback?.total_feedback || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1">Positive Feedback:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.feedback?.positive_feedback || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Feedback Accuracy:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {data?.feedback?.accuracy?.toFixed(1) || 0}%
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
