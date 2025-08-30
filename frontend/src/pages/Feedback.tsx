import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  useTheme,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  Feedback as FeedbackIcon, 
  Send, 
  ThumbUp, 
  ThumbDown, 
  Help,
  Analytics,
  TrendingUp,
  Timeline,
  BugReport
} from '@mui/icons-material';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface FeedbackForm {
  transaction_id: string;
  user_feedback: 'correct' | 'incorrect';
  comments: string;
}

interface FeedbackSubmission {
  transaction_id: number;
  feedback: boolean;
  comments?: string;
}

const Feedback: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackForm>({
    transaction_id: '',
    user_feedback: 'correct',
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const theme = useTheme();

  const handleInputChange = (field: keyof FeedbackForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submission: FeedbackSubmission = {
        transaction_id: parseInt(formData.transaction_id),
        feedback: formData.user_feedback === 'correct',
        comments: formData.comments || undefined,
      };

      const response = await axios.post(API_CONFIG.ENDPOINTS.FEEDBACK, submission);
      console.log('Feedback submitted successfully:', response.data);
      
      setSuccess('Thank you for your feedback! This helps improve our model accuracy.');
      setFormData({
        transaction_id: '',
        user_feedback: 'correct',
        comments: '',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
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
                Feedback & Model Improvement
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
                Help us improve SecureFlow's accuracy by providing feedback on transaction analysis results
              </Typography>
            </Box>
            <FeedbackIcon color="primary" sx={{ fontSize: 64, opacity: 0.8 }} />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
          {/* Feedback Form */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 60%' } }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: theme.palette.divider,
                height: '100%'
              }}
            >
              <Typography variant="h5" fontWeight="medium" gutterBottom>
                Submit Feedback
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  value={formData.transaction_id}
                  onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                  required
                  type="number"
                  sx={{ mb: 4 }}
                  helperText="Enter the transaction ID from the analysis results"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title="You can find the Transaction ID in your analysis results">
                        <IconButton size="small">
                          <Help fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />

                <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'medium' }}>Was the analysis result correct?</FormLabel>
                  <RadioGroup
                    value={formData.user_feedback}
                    onChange={(e) => handleInputChange('user_feedback', e.target.value)}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        width: '100%'
                      }}
                    >
                      <Paper 
                        elevation={formData.user_feedback === 'correct' ? 3 : 0}
                        sx={{ 
                          p: 2, 
                          flex: '1 1 auto',
                          border: '1px solid',
                          borderColor: formData.user_feedback === 'correct' ? 'success.main' : theme.palette.divider,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'success.main'
                          }
                        }}
                        onClick={() => handleInputChange('user_feedback', 'correct')}
                      >
                        <FormControlLabel
                          value="correct"
                          control={<Radio color="success" />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ThumbUp color="success" />
                              <Typography fontWeight="medium">Yes, correct analysis</Typography>
                            </Box>
                          }
                          sx={{ width: '100%' }}
                        />
                      </Paper>
                      
                      <Paper 
                        elevation={formData.user_feedback === 'incorrect' ? 3 : 0}
                        sx={{ 
                          p: 2, 
                          flex: '1 1 auto',
                          border: '1px solid',
                          borderColor: formData.user_feedback === 'incorrect' ? 'error.main' : theme.palette.divider,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'error.main'
                          }
                        }}
                        onClick={() => handleInputChange('user_feedback', 'incorrect')}
                      >
                        <FormControlLabel
                          value="incorrect"
                          control={<Radio color="error" />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ThumbDown color="error" />
                              <Typography fontWeight="medium">No, incorrect analysis</Typography>
                            </Box>
                          }
                          sx={{ width: '100%' }}
                        />
                      </Paper>
                    </Box>
                  </RadioGroup>
                </FormControl>

                <TextField
                  fullWidth
                  label="Additional Comments (Optional)"
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  multiline
                  rows={4}
                  sx={{ mb: 4 }}
                  helperText="Provide any additional context about why the result was correct or incorrect"
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    {success}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || !formData.transaction_id}
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Information Panel */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 35%' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3,
                  backgroundImage: 'linear-gradient(135deg, rgba(21, 101, 192, 0.05), rgba(21, 101, 192, 0.01))'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    Why Your Feedback Matters
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column', lg: 'row' }, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: { xs: '1 1 30%', md: '1 1 100%', lg: '1 1 30%' }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1 }}>
                      <Box 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          borderRadius: '50%', 
                          p: 1, 
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 50,
                          height: 50
                        }}
                      >
                        <Analytics fontSize="medium" />
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Improves Accuracy
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Helps our ML model learn from mistakes
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: { xs: '1 1 30%', md: '1 1 100%', lg: '1 1 30%' }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1 }}>
                      <Box 
                        sx={{ 
                          bgcolor: 'warning.main', 
                          color: 'white', 
                          borderRadius: '50%', 
                          p: 1, 
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 50,
                          height: 50
                        }}
                      >
                        <BugReport fontSize="medium" />
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Reduces False Positives
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Helps fine-tune detection precision
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: { xs: '1 1 30%', md: '1 1 100%', lg: '1 1 30%' }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1 }}>
                      <Box 
                        sx={{ 
                          bgcolor: 'success.main', 
                          color: 'white', 
                          borderRadius: '50%', 
                          p: 1, 
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 50,
                          height: 50
                        }}
                      >
                        <TrendingUp fontSize="medium" />
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Enhances Detection
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Helps identify sophisticated anomalies
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  flex: '1'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" fontWeight="medium">
                      Current Model Stats
                    </Typography>
                    <Timeline color="primary" />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">Accuracy</Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        95.2%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={95.2} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">Precision</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        92.8%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={92.8} 
                      color="primary"
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">Recall</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        96.1%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={96.1} 
                      color="primary"
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">Response Time</Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        &lt; 3s
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={85} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          {/* How to Find Transaction ID */}
          <Box sx={{ width: '100%' }}>
            <Alert 
              severity="info" 
              icon={<Help color="info" />}
              sx={{ 
                borderRadius: 3, 
                p: 2.5,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                    How to Find Your Transaction ID
                  </Typography>
                  <Typography variant="body2">
                    After analyzing a transaction, the Transaction ID appears at the bottom of the results panel. 
                    Copy this ID to report on that specific analysis result.
                  </Typography>
                </Box>
                <Box sx={{ mt: { xs: 2, sm: 0 } }}>
                  <Button variant="outlined" color="info" size="small">
                    View Example
                  </Button>
                </Box>
              </Box>
            </Alert>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Feedback;
