import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Fade
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import ShieldIcon from '@mui/icons-material/Security';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import AnimatedBackground from '../components/AnimatedBackground';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError(null);
    setLoading(true);
    // Placeholder auth; integrate real backend later
    setTimeout(() => {
      login(email);
      navigate('/home', { replace: true }); // Redirect to Home after login
    }, 400);
  };

  const quickAuth = (provider: string) => {
    setLoading(true);
    setTimeout(() => {
      login(`${provider.toLowerCase()}_user@secureflow.ml`);
      navigate('/home', { replace: true });
    }, 300);
  };

  return (
    <AnimatedBackground variant="hero">
      <ParticleBackground particleCount={70} speed={0.8} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 4,
          py: 6,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={6}
          sx={{ width: '100%', maxWidth: 1400, alignItems: 'stretch' }}
        >
          {/* Left hero panel */}
          <Fade in timeout={800}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: 'white',
                textAlign: { xs: 'center', md: 'left' },
                position: 'relative',
                px: { xs: 0, md: 4 }
              }}
            >
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                  mx: { xs: 'auto', md: 0 },
                  backdropFilter: 'blur(8px)'
                }}
              >
                <ShieldIcon sx={{ fontSize: 70, color: '#1EA7FD' }} />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-1px',
                  mb: 2,
                  background: 'linear-gradient(90deg,#1EA7FD,#7F5AF0)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                SecureFlow
              </Typography>
              <Typography variant="h6" sx={{ maxWidth: 420, opacity: 0.9, fontWeight: 400, lineHeight: 1.4, mx: { xs: 'auto', md: 0 } }}>
                Advanced Risk Detection & Transaction Security Platform
              </Typography>
              <Stack direction="row" spacing={2} mt={6} flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                {['Real-time Detection','ML-Powered Analytics','Secure Processing'].map((label) => (
                  <Box key={label} sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 14,
                    letterSpacing: 0.5,
                    backdropFilter: 'blur(6px)',
                    color: 'rgba(255,255,255,0.85)'
                  }}>{label}</Box>
                ))}
              </Stack>
            </Box>
          </Fade>

          {/* Right auth card */}
            <Fade in timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  maxWidth: 560,
                  mx: 'auto',
                  p: 5,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.35)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Typography variant="h4" fontWeight={600} align="center" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 4, opacity: 0.75 }}>
                  Sign in to your account to continue
                </Typography>
                <form onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlineIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(p => !p)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {error && <Typography color="error" variant="caption">{error}</Typography>}
                  <Box textAlign="right" mt={1} mb={2}>
                    <Button size="small" variant="text" sx={{ textTransform: 'none', opacity: 0.7 }}>Forgot Password?</Button>
                  </Box>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: 1.4,
                      fontWeight: 600,
                      fontSize: 16,
                      background: 'linear-gradient(90deg,#1EA7FD,#7F5AF0)',
                      boxShadow: '0 8px 20px -6px rgba(30,167,253,0.55)',
                      '&:hover': { background: 'linear-gradient(90deg,#1995e3,#6d49d9)' }
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Divider sx={{ my: 3 }}>or continue with</Divider>
                  <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
                    <Button onClick={() => quickAuth('Google')} variant="outlined" startIcon={<GoogleIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>Google</Button>
                    <Button onClick={() => quickAuth('GitHub')} variant="outlined" startIcon={<GitHubIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>GitHub</Button>
                  </Stack>
                  <Typography variant="caption" display="block" align="center">
                    Don't have an account? <Button size="small" variant="text" sx={{ textTransform: 'none' }}>Create Account</Button>
                  </Typography>
                </form>
              </Paper>
            </Fade>
        </Stack>
      </Box>
    </AnimatedBackground>
  );
};

export default Login;
