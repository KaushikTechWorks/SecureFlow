import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Button,
  Skeleton,
  Grid,
  Fade,
  useTheme,
  useMediaQuery,
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
import { TrendingUp, Security, Assessment, Feedback, Refresh, ErrorOutline } from '@mui/icons-material';
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

const DashboardComponent: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds (increased from 30 to reduce server load)
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await axios.get(API_CONFIG.ENDPOINTS.DASHBOARD, {
        signal: controller.signal,
        timeout: 10000
      });
      
      clearTimeout(timeoutId);
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Dashboard loading timed out. Please try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getHourlyChartData = useMemo(() => {
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
  }, [data?.hourly_distribution]);

  const getAnomalyDistributionData = useMemo(() => {
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
  }, [data?.hourly_distribution]);

  // Skeleton Loading Component
  const MetricCardSkeleton = () => (
    <Card elevation={3} sx={{ 
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Skeleton variant="rectangular" height={6} />
      <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
        <Skeleton variant="circular" width={60} height={60} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 1 }} />
        <Skeleton variant="text" />
      </CardContent>
    </Card>
  );

  const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={250} height={32} />
        <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 1 }} />
      </Box>
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
    </Paper>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header Skeleton */}
        <Box sx={{ 
          backgroundColor: 'background.paper',
          pt: 4, pb: 6, mb: 4,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" sx={{ fontSize: '2.5rem', mb: 1 }} width="60%" />
              <Skeleton variant="text" width="80%" />
            </Box>
            <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>

        {/* Metrics Skeleton */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>
          {[1, 2, 3, 4].map((index) => (
            <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <MetricCardSkeleton />
            </Box>
          ))}
        </Box>

        {/* Charts Skeleton */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 65%' } }}>
            <ChartSkeleton height={400} />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 30%' } }}>
            <ChartSkeleton height={300} />
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Fade in>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'error.light',
              backgroundColor: 'error.lighter'
            }}
          >
            <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" color="error.main" gutterBottom fontWeight="bold">
              Unable to Load Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Refresh />}
              onClick={handleRetry}
              size="large"
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Try Again
            </Button>
          </Paper>
        </Fade>
      </Container>
    );
  }

  return (
    <Fade in timeout={600}>
      <Box>
        {/* Dashboard Header */}
        <Box 
          sx={{ 
            backgroundColor: 'background.paper',
            pt: { xs: 2, md: 4 },
            pb: { xs: 4, md: 6 },
            mb: 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundImage: 'linear-gradient(to right, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.02))'
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: { xs: 2, md: 0 }
            }}>
              <Box sx={{ mb: { xs: 2, md: 0 } }}>
                <Typography 
                  variant={isMobile ? "h4" : "h3"} 
                  fontWeight="bold" 
                  color="primary"
                  sx={{ mb: 1 }}
                >
                  SecureFlow Dashboard
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                  Real-time analytics and insights from transaction anomaly detection
                </Typography>
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {refreshing && (
                  <Chip 
                    icon={<CircularProgress size={16} />} 
                    label="Updating..." 
                    color="info" 
                    variant="outlined"
                    size="small"
                  />
                )}
                <Chip 
                  icon={<Assessment />} 
                  label="LAST 7 DAYS" 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: 'medium' }}
                />
                <Button
                  startIcon={<Refresh />}
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  size="small"
                  sx={{ 
                    minWidth: 'auto',
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        {/* Key Metrics */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: { xs: 2, md: 3 },
          mb: 6 
        }}>
          {/* Total Transactions */}
          <Fade in timeout={800} style={{ transitionDelay: '100ms' }}>
            <Card elevation={3} sx={{ 
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'primary.main' }} />
              <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  borderRadius: '50%',
                  width: { xs: 50, md: 60 },
                  height: { xs: 50, md: 60 },
                  mx: 'auto',
                  mb: 2
                }}>
                  <Assessment sx={{ fontSize: { xs: 24, md: 30 }, color: 'white' }} />
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold" color="primary">
                  {data?.stats?.total_transactions?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        
          {/* Anomalies Detected */}
          <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
            <Card elevation={3} sx={{ 
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'error.main' }} />
              <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'error.light',
                  borderRadius: '50%',
                  width: { xs: 50, md: 60 },
                  height: { xs: 50, md: 60 },
                  mx: 'auto',
                  mb: 2
                }}>
                  <Security sx={{ fontSize: { xs: 24, md: 30 }, color: 'white' }} />
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold" color="error">
                  {data?.stats?.anomalies_detected?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Anomalies Detected
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        
          {/* Anomaly Rate */}
          <Fade in timeout={800} style={{ transitionDelay: '300ms' }}>
            <Card elevation={3} sx={{ 
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'warning.main' }} />
              <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'warning.light',
                  borderRadius: '50%',
                  width: { xs: 50, md: 60 },
                  height: { xs: 50, md: 60 },
                  mx: 'auto',
                  mb: 2
                }}>
                  <TrendingUp sx={{ fontSize: { xs: 24, md: 30 }, color: 'white' }} />
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold" color="warning.main">
                  {data?.stats?.anomaly_rate ? data.stats.anomaly_rate.toFixed(1) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Anomaly Rate
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        
          {/* Feedback Accuracy */}
          <Fade in timeout={800} style={{ transitionDelay: '400ms' }}>
            <Card elevation={3} sx={{ 
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: (theme) => theme.shadows[8]
              }
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, bgcolor: 'success.main' }} />
              <CardContent sx={{ pt: 3, pb: '24px !important', px: 3, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'success.light',
                  borderRadius: '50%',
                  width: { xs: 50, md: 60 },
                  height: { xs: 50, md: 60 },
                  mx: 'auto',
                  mb: 2
                }}>
                  <Feedback sx={{ fontSize: { xs: 24, md: 30 }, color: 'white' }} />
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} fontWeight="bold" color="success.main">
                  {data?.feedback?.accuracy?.toFixed(1) || '0.0'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feedback Accuracy
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Box>

        {/* Charts */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom 
          sx={{ mb: 3, fontWeight: 'medium' }}
        >
          Transaction Analytics
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
          mb: 4
        }}>
          {/* Hourly Chart */}
          <Fade in timeout={1000} style={{ transitionDelay: '500ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, md: 3 }, 
                borderRadius: 3,
                height: '100%',
                backgroundImage: 'linear-gradient(to bottom, rgba(37, 99, 235, 0.02), rgba(255, 255, 255, 0))',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[6]
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="medium">
                  Hourly Transaction Distribution
                </Typography>
                <Chip 
                  label="Last 24 Hours" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              {getHourlyChartData ? (
                <Box sx={{ height: { xs: 300, md: 400 } }}>
                  <Bar
                    data={getHourlyChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index' as const,
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: {
                            usePointStyle: true,
                            padding: isMobile ? 15 : 20,
                            font: {
                              size: isMobile ? 10 : 12,
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
                              size: isMobile ? 8 : 10,
                            },
                            maxRotation: 0,
                            callback: function(value, index) {
                              // Show every 2nd hour on mobile, every hour on desktop
                              const skip = isMobile ? 2 : 2;
                              return index % skip === 0 ? this.getLabelForValue(value as number) : '';
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
                              size: isMobile ? 8 : 10,
                            }
                          }
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  height: { xs: 300, md: 400 }, 
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
          </Fade>
        
          {/* Doughnut Chart */}
          <Fade in timeout={1000} style={{ transitionDelay: '600ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, md: 3 }, 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[6]
                }
              }}
            >
              <Typography variant={isMobile ? "body1" : "h6"} gutterBottom>
                Transaction Classification
              </Typography>
              {getAnomalyDistributionData ? (
                <Box sx={{ height: { xs: 250, md: 300 } }}>
                  <Doughnut
                    data={getAnomalyDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            usePointStyle: true,
                            padding: isMobile ? 10 : 15,
                            font: {
                              size: isMobile ? 10 : 11,
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
                              return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
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
                  height: { xs: 250, md: 300 }, 
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
          </Fade>
        </Box>

        {/* Additional Stats */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom 
          sx={{ mb: 3, mt: 4, fontWeight: 'medium' }}
        >
          System Performance
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3 
        }}>
          <Fade in timeout={1000} style={{ transitionDelay: '700ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[6]
                }
              }}
            >
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
          </Fade>
        
          <Fade in timeout={1000} style={{ transitionDelay: '800ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[6]
                }
              }}
            >
              <Typography variant="h6" gutterBottom>
                Transaction Overview
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">Total Feedback:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {data?.feedback?.total_feedback?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">Positive Feedback:</Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {data?.feedback?.positive_feedback?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Feedback Accuracy:</Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {data?.feedback?.accuracy?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Paper>
          </Fade>
        </Box>
      </Container>
      </Box>
    </Fade>
  );
};

const Dashboard = React.memo(DashboardComponent);

export default Dashboard;
