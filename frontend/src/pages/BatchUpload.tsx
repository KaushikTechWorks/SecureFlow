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
} from '@mui/material';
import { CloudUpload, Download } from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface BatchResult {
  index: number;
  transaction_id?: number;
  is_anomaly?: boolean;
  anomaly_score?: number;
  confidence?: number;
  error?: string;
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
          } else {
            transaction[header] = parseInt(value);
          }
        }
      });
      
      transactions.push(transaction);
    }
    
    return transactions;
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Batch Transaction Analysis
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }} color="text.secondary">
        Upload a CSV file containing multiple transactions for bulk anomaly detection
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload CSV File
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            CSV should contain columns: amount, hour, day_of_week, merchant_category, transaction_type
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={downloadSampleCSV}
            sx={{ mb: 2 }}
          >
            Download Sample CSV
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-file-input"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mr: 2 }}
            >
              Choose CSV File
            </Button>
          </label>
          
          {file && (
            <Typography variant="body2" component="span">
              Selected: {file.name}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
          size="large"
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Transactions'}
        </Button>
      </Paper>

      {loading && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Processing...
          </Typography>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
            Analyzing transactions for anomalies
          </Typography>
        </Paper>
      )}

      {results && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          
          <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Processed
              </Typography>
              <Typography variant="h5">
                {results.total_processed}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Anomalies Detected
              </Typography>
              <Typography variant="h5" color="error.main">
                {results.results.filter(r => r.is_anomaly).length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Anomaly Rate
              </Typography>
              <Typography variant="h5">
                {getAnomalyRate().toFixed(1)}%
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Index</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Anomaly Score</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Transaction ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.index}</TableCell>
                    <TableCell>
                      {result.error ? (
                        <Chip label="Error" color="error" size="small" />
                      ) : (
                        <Chip
                          label={result.is_anomaly ? 'Suspicious' : 'Normal'}
                          color={result.is_anomaly ? 'error' : 'success'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {result.anomaly_score ? result.anomaly_score.toFixed(3) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {result.transaction_id || (result.error ? result.error : 'N/A')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default BatchUpload;
