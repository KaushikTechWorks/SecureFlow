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
} from '@mui/material';
import { Feedback as FeedbackIcon, Send, ThumbUp, ThumbDown } from '@mui/icons-material';
import axios from 'axios';

interface FeedbackForm {
  transaction_id: string;
  user_feedback: 'correct' | 'incorrect';
  comments: string;
}

interface FeedbackSubmission {
  transaction_id: number;
  is_correct: boolean;
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
        is_correct: formData.user_feedback === 'correct',
        comments: formData.comments || undefined,
      };

      const response = await axios.post('http://localhost:5001/api/feedback', submission);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <FeedbackIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Feedback & Model Improvement
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help us improve SecureFlow's accuracy by providing feedback on transaction analysis results
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Feedback Form */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 58%' } }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Submit Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found an analysis result that was incorrect? Let us know to help improve our model.
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Transaction ID"
                value={formData.transaction_id}
                onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                required
                type="number"
                sx={{ mb: 3 }}
                helperText="Enter the transaction ID from the analysis results"
              />

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Was the analysis result correct?</FormLabel>
                <RadioGroup
                  value={formData.user_feedback}
                  onChange={(e) => handleInputChange('user_feedback', e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel
                    value="correct"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbUp color="success" fontSize="small" />
                        <Typography>Yes, the analysis was correct</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="incorrect"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbDown color="error" fontSize="small" />
                        <Typography>No, the analysis was incorrect</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                label="Additional Comments (Optional)"
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 3 }}
                helperText="Provide any additional context about why the result was correct or incorrect"
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
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
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Information Panel */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 38%' } }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Why Your Feedback Matters
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Improves Accuracy:</strong> Your feedback helps our machine learning model learn from mistakes and improve future predictions.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Reduces False Positives:</strong> When you report incorrect fraud alerts, we can fine-tune the model to be more precise.
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Enhances Detection:</strong> Feedback on missed fraud helps us catch more sophisticated scams.
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Model Stats
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Accuracy:</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                95.2%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Precision:</Typography>
              <Typography variant="body2" fontWeight="bold">
                92.8%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Recall:</Typography>
              <Typography variant="body2" fontWeight="bold">
                96.1%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Response Time:</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                &lt; 3s
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* How to Find Transaction ID */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: 'info.main', color: 'white' }}>
        <Typography variant="h6" gutterBottom>
          💡 How to Find Your Transaction ID
        </Typography>
        <Typography variant="body2">
          After analyzing a transaction on the Home page, the Transaction ID appears at the bottom of the results panel. 
          Copy this ID and paste it in the feedback form above to report on that specific analysis.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Feedback;
