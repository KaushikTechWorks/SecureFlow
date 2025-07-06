import { createTheme } from '@mui/material/styles';

// Sleek, professional login theme - Steel & Copper inspired
export const loginLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#075985', // Steel blue to match main app
      light: '#0EA5E9',
      dark: '#0C4A6E',
    },
    secondary: {
      main: '#64748B', // Professional slate
      light: '#94A3B8',
      dark: '#475569',
    },
    error: {
      main: '#DC2626',
    },
    warning: {
      main: '#D97706',
    },
    success: {
      main: '#059669',
    },
    background: {
      default: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      paper: 'rgba(248, 250, 252, 0.95)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #475569 0%, #334155 50%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(248, 250, 252, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 8px 32px rgba(71, 85, 105, 0.15)',
          borderRadius: '16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 40px rgba(71, 85, 105, 0.12)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #075985 0%, #0EA5E9 100%)',
          boxShadow: '0 4px 14px 0 rgba(7, 89, 133, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0C4A6E 0%, #075985 100%)',
            boxShadow: '0 6px 20px 0 rgba(7, 89, 133, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(7, 89, 133, 0.3)',
          background: 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: '#075985',
            background: 'rgba(7, 89, 133, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(248, 250, 252, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'rgba(248, 250, 252, 1)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(7, 89, 133, 0.5)',
              },
            },
            '&.Mui-focused': {
              background: 'rgba(255, 255, 255, 1)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#075985',
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
  },
});

export const loginDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0EA5E9', // Steel blue for dark mode
      light: '#38BDF8',
      dark: '#075985',
    },
    secondary: {
      main: '#94A3B8', // Professional slate for dark mode
      light: '#CBD5E1',
      dark: '#64748B',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    success: {
      main: '#10B981',
    },
    background: {
      default: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E293B 100%)',
      paper: 'rgba(30, 41, 59, 0.95)',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 41, 59, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundImage: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
          boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #075985 0%, #0EA5E9 100%)',
            boxShadow: '0 6px 20px 0 rgba(14, 165, 233, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(14, 165, 233, 0.3)',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: '#0EA5E9',
            background: 'rgba(14, 165, 233, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'rgba(30, 41, 59, 1)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(14, 165, 233, 0.5)',
              },
            },
            '&.Mui-focused': {
              background: 'rgba(30, 41, 59, 1)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0EA5E9',
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
  },
});
