import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material';
import { CloudUpload, Download, Article, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Category mappings (same as in Home.tsx)
const merchantCategories = [
  'Grocery', 'Gas Station', 'Restaurant', 'Retail', 'Online',
  'ATM', 'Bank', 'Healthcare', 'Entertainment', 'Other'
];

const transactionTypes = ['Purchase', 'Withdrawal', 'Transfer'];

interface BatchResult {
  transaction_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  confidence?: number; // Backend returns both
  shap_explanation: {
    [key: string]: number;
  };
  timestamp?: string;
}

interface BatchResponse {
  results: BatchResult[];
  total_processed: number;
  timestamp: string;
}

const BatchUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const requiredHeaders = ['amount', 'hour', 'day_of_week', 'merchant_category', 'transaction_type'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const transaction: any = {};
      
      headers.forEach((header, index) => {
        if (requiredHeaders.includes(header)) {
          const value = values[index];
          if (header === 'amount') {
            transaction[header] = parseFloat(value);
          } else if (header === 'merchant_category') {
            const categoryIndex = parseInt(value);
            transaction[header] = merchantCategories[categoryIndex]?.toLowerCase() || 'other';
          } else if (header === 'transaction_type') {
            const typeIndex = parseInt(value);
            transaction[header] = transactionTypes[typeIndex]?.toLowerCase() || 'purchase';
          } else {
            transaction[header] = parseInt(value);
          }
        }
      });
      
      transactions.push(transaction);
    }
    
    return transactions;
  };

  const getTopShapFeatures = (shapExplanation: { [key: string]: number }) => {
    return Object.entries(shapExplanation)
      .filter(([_, value]) => Math.abs(value) > 0.001)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 2) // Show top 2 features
      .map(([feature, value]) => ({
        feature: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value,
        impact: value > 0 ? 'positive' : 'negative'
      }));
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const csvText = await file.text();
      const transactions = parseCSV(csvText);
      
      const response = await axios.post(API_CONFIG.ENDPOINTS.PREDICT_BATCH, {
        transactions
      });
      
      setResults(response.data);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'An error occurred while processing the file');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `amount,hour,day_of_week,merchant_category,transaction_type
50.25,14,1,0,0
1200.00,2,6,3,1
75.50,18,3,2,0
25.00,12,4,0,0
2500.00,3,0,8,2`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAnomalyRate = () => {
    if (!results) return 0;
    const anomalies = results.results.filter(r => r.is_anomaly).length;
    return (anomalies / results.results.length) * 100;
  };

  return (
    <>
      {/* Header */}
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
                Batch Transaction Analysis
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
                Upload a CSV file containing multiple transactions for bulk anomaly detection
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={downloadSampleCSV}
              sx={{ 
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Download Sample CSV
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 60%' } }}>
            <Paper elevation={3} sx={{ 
              p: 4, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.divider
            }}>
              <Typography variant="h5" gutterBottom fontWeight="medium">
                Upload Transaction File
              </Typography>
              
              <Box sx={{ mb: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Article color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">File Requirements</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  CSV should contain the following columns:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                  <Typography component="li" variant="body2" color="text.secondary">amount (float)</Typography>
                  <Typography component="li" variant="body2" color="text.secondary">hour (int, 0-23)</Typography>
                  <Typography component="li" variant="body2" color="text.secondary">day_of_week (int, 0-6)</Typography>
                  <Typography component="li" variant="body2" color="text.secondary">merchant_category (int)</Typography>
                  <Typography component="li" variant="body2" color="text.secondary">transaction_type (int)</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                  <label htmlFor="csv-file-input" style={{ display: 'flex', flexGrow: 1 }}>
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      fullWidth
                      sx={{ height: '56px', borderStyle: 'dashed', borderWidth: '2px' }}
                    >
                      Choose CSV File
                    </Button>
                  </label>
                  
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!file || loading}
                    size="large"
                    sx={{ height: '56px', px: 4, flexShrink: 0 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Analyze Transactions'}
                  </Button>
                </Box>
                
                {file && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Box>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 37%' } }}>
            <Card elevation={3} sx={{ 
              height: '100%', 
              borderRadius: 3,
              backgroundImage: 'linear-gradient(to bottom right, rgba(21, 101, 192, 0.05), rgba(21, 101, 192, 0.01))'
            }}>
              <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom fontWeight="medium">
                  Batch Processing Benefits
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
                    <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6" color="white">1</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Efficient Analysis</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Process hundreds of transactions in a single request
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
                    <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6" color="white">2</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Detailed Reporting</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get comprehensive results for each transaction
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ bgcolor: 'primary.light', borderRadius: '50%', p: 1, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h6" color="white">3</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Risk Assessment</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Identify anomalies and risk patterns in your transaction data
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

      {loading && (
        <Paper elevation={3} sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: theme.palette.primary.light
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Processing Transactions
            </Typography>
            <CircularProgress size={20} sx={{ ml: 2 }} />
          </Box>
          <LinearProgress sx={{ height: 8, borderRadius: 4, mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Analyzing transactions for anomalies. This may take a moment for large files...
          </Typography>
        </Paper>
      )}

      {results && (
        <Paper elevation={3} sx={{ 
          p: 0, 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: theme.palette.divider
        }}>
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: theme.palette.divider }}>
            <Typography variant="h5" fontWeight="medium">
              Analysis Results
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Processed at {new Date(results.timestamp).toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: { xs: 2, md: 0 }, 
            p: { xs: 2, md: 0 },
            borderBottom: '1px solid',
            borderColor: theme.palette.divider
          }}>
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 33.33%' },
              p: { xs: 2, md: 3 },
              borderRight: { md: '1px solid' },
              borderBottom: { xs: '1px solid', sm: 'none' },
              borderColor: 'divider',
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                Total Processed
              </Typography>                <Typography variant="h4" fontWeight="bold">
                  {results.total_processed}
                </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 33.33%' },
              p: { xs: 2, md: 3 },
              borderRight: { md: '1px solid' },
              borderBottom: { xs: '1px solid', sm: 'none' },
              borderColor: 'divider',
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                Anomalies Detected
              </Typography>                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {results.results.filter(r => r.is_anomaly).length}
                </Typography>
            </Box>
            
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: '1 1 30%', md: '1 1 33.33%' },
              p: { xs: 2, md: 3 },
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                Anomaly Rate
              </Typography>
              <Typography variant="h4" fontWeight="bold" 
                sx={{ color: getAnomalyRate() > 15 ? 'error.main' : getAnomalyRate() > 5 ? 'warning.main' : 'success.main' }}
              >
                {getAnomalyRate().toFixed(1)}%
              </Typography>
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Index</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>SHAP Features</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Anomaly Score</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Transaction ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.results.map((result, index) => (
                  <TableRow 
                    key={index} 
                    sx={{ 
                      bgcolor: result.is_anomaly ? 'rgba(211, 47, 47, 0.04)' : 'inherit',
                      '&:hover': { bgcolor: result.is_anomaly ? 'rgba(211, 47, 47, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Chip
                        label={result.is_anomaly ? 'Requires Review' : 'Approved'}
                        color={result.is_anomaly ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {getTopShapFeatures(result.shap_explanation).map((feature, idx) => (
                          <Chip 
                            key={idx}
                            label={`${feature.feature}: ${feature.value > 0 ? '+' : ''}${feature.value.toFixed(3)}`}
                            size="small" 
                            color={feature.value > 0 ? 'warning' : 'success'}
                          />
                        ))}
                        {getTopShapFeatures(result.shap_explanation).length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {`${(result.anomaly_score * 100).toFixed(1)}%`}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {result.transaction_id}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
    </>
  );
};

export default BatchUpload;
