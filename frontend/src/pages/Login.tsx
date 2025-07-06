import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Fade,
  Slide,
  alpha,
  ThemeProvider,
  CssBaseline,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security,
  Person,
  Lock,
  Email,
} from '@mui/icons-material';
import GlassCard from '../components/GlassCard';
import EnhancedButton from '../components/EnhancedButton';
import AnimatedBackground from '../components/AnimatedBackground';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../context/AuthContext';
import { loginLightTheme, loginDarkTheme } from '../context/LoginTheme';
import { useTheme as useAppTheme } from '../context/ThemeContext';

interface LoginFormData {
  email: string;
  password: string;
}

// Separate component to use theme hook properly
const LoginContent: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme(); // This will now use the login theme
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) setError('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Simulate authentication - for now, accept any credentials
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (formData.email && formData.password) {
        // Use auth context to login
        login(formData.email);
        
        // Navigate to main application
        navigate('/home');
      } else {
        setError('Please enter both email and password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    login(`user@${provider}.com`);
    navigate('/home');
  };

  const handleForgotPassword = () => {
    // For now, just show an alert
    alert('Password reset functionality will be implemented soon!');
  };

  const handleCreateAccount = () => {
    // For now, just show an alert
    alert('Account creation functionality will be implemented soon!');
  };

  return (
    <>
      <ParticleBackground />
      <AnimatedBackground>
        <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Left Side - Branding */}
            <Slide direction="right" in={isVisible} timeout={1000}>
              <Box sx={{ 
                flex: 1, 
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <Box sx={{ mb: 4 }}>
                  <Security 
                    sx={{ 
                      fontSize: 120, 
                      color: theme.palette.primary.main,
                      filter: 'drop-shadow(0 0 20px rgba(37, 99, 235, 0.3))',
                    }} 
                  />
                </Box>
                
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    mb: 2,
                  }}
                >
                  SecureFlow
                </Typography>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 300,
                    mb: 3,
                    maxWidth: 400,
                  }}
                >
                  Advanced Risk Detection & Transaction Security Platform
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Real-time Detection', 'AI-Powered Analytics', 'Secure Processing'].map((feature, index) => (
                    <Paper
                      key={feature}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: '12px',
                        background: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        animation: `fadeInUp 0.8s ease-out ${index * 0.2}s both`,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Typography variant="body2" color="primary" fontWeight={500}>
                        {feature}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Slide>

            {/* Right Side - Login Form */}
            <Slide direction="left" in={isVisible} timeout={1000}>
              <Box sx={{ flex: { xs: 1, md: 0.6 }, maxWidth: 480 }}>
                <GlassCard 
                  glassEffect="medium"
                  sx={{ 
                    p: 4,
                    animation: 'fadeInUp 1s ease-out 0.3s both',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 1,
                      }}
                    >
                      Welcome Back
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                      }}
                    >
                      Sign in to your account to continue
                    </Typography>
                  </Box>

                  {error && (
                    <Fade in timeout={300}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3,
                          borderRadius: '10px',
                          background: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  <Box component="form" onSubmit={handleLogin} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={loading}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          background: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(10px)',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          background: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(10px)',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                      <Button 
                        variant="text" 
                        onClick={handleForgotPassword}
                        disabled={loading}
                        sx={{ 
                          color: theme.palette.primary.main,
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </Box>

                    <EnhancedButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      loading={loading}
                      sx={{
                        py: 1.5,
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </EnhancedButton>
                  </Box>

                  <Divider sx={{ my: 3, color: theme.palette.text.secondary }}>
                    <Typography variant="body2" sx={{ px: 2 }}>
                      or continue with
                    </Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <EnhancedButton
                      fullWidth
                      variant="outlined"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        borderRadius: '10px',
                        borderColor: alpha(theme.palette.divider, 0.3),
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          background: alpha(theme.palette.error.main, 0.08),
                        },
                      }}
                    >
                      Google
                    </EnhancedButton>
                    
                    <EnhancedButton
                      fullWidth
                      variant="outlined"
                      onClick={() => handleSocialLogin('github')}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        borderRadius: '10px',
                        borderColor: alpha(theme.palette.divider, 0.3),
                        '&:hover': {
                          borderColor: theme.palette.text.primary,
                          background: alpha(theme.palette.text.primary, 0.08),
                        },
                      }}
                    >
                      GitHub
                    </EnhancedButton>
                  </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Don't have an account?{' '}
                        <Button 
                          variant="text" 
                          onClick={handleCreateAccount}
                          sx={{ 
                            color: theme.palette.primary.main,
                            textTransform: 'none',
                            fontWeight: 600,
                            p: 0,
                            minWidth: 'auto',
                          }}
                        >
                          Create Account
                        </Button>
                      </Typography>
                    </Box>
                </GlassCard>
              </Box>
            </Slide>
          </Box>
        </Container>
      </AnimatedBackground>

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

const Login: React.FC = () => {
  const { isDarkMode } = useAppTheme();
  const loginTheme = isDarkMode ? loginDarkTheme : loginLightTheme;

  return (
    <ThemeProvider theme={loginTheme}>
      <CssBaseline />
      <LoginContent />
    </ThemeProvider>
  );
};

export default Login;
