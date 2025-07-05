import React, { useState } from 'react';
import { Button, ButtonProps, Box, useTheme, alpha, keyframes } from '@mui/material';

const rippleEffect = keyframes`
  to {
    transform: scale(4);
    opacity: 0;
  }
`;

const buttonPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

interface EnhancedButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'gradient' | 'glow' | 'ripple' | 'pulse' | 'neumorphism' | ButtonProps['variant'];
  glowColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  component?: React.ElementType;
  to?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  variant = 'contained',
  glowColor,
  icon,
  loading = false,
  sx,
  onClick,
  ...props
}) => {
  const theme = useTheme();
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'ripple' && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      position: 'relative',
      overflow: 'hidden',
      fontWeight: 600,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      textTransform: 'none' as const,
    };

    switch (variant) {
      case 'gradient':
        return {
          ...baseStyles,
          background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          backgroundSize: '400% 400%',
          animation: `${gradientShift} 4s ease infinite`,
          color: 'white',
          border: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            animationDuration: '2s',
          },
        };

      case 'glow':
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          color: 'white',
          boxShadow: `0 0 20px ${alpha(glowColor || theme.palette.primary.main, 0.5)}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 0 30px ${alpha(glowColor || theme.palette.primary.main, 0.8)}, 0 5px 15px rgba(0,0,0,0.2)`,
          },
        };

      case 'pulse':
        return {
          ...baseStyles,
          animation: `${buttonPulse} 2s infinite`,
          background: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            animation: `${buttonPulse} 1s infinite`,
          },
        };

      case 'neumorphism':
        return {
          ...baseStyles,
          background: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
          color: theme.palette.text.primary,
          border: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '20px 20px 60px #1a1a1a, -20px -20px 60px #3a3a3a'
            : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? 'inset 20px 20px 60px #1a1a1a, inset -20px -20px 60px #3a3a3a'
              : 'inset 20px 20px 60px #bebebe, inset -20px -20px 60px #ffffff',
          },
        };

      case 'ripple':
        return {
          ...baseStyles,
          background: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        };

      default:
        return baseStyles;
    }
  };

  return (
    <Button
      {...props}
      sx={{
        ...(getButtonStyles() as any),
        ...sx,
      }}
      onClick={handleClick}
      disabled={loading || props.disabled}
    >
      {variant === 'ripple' && ripples.map((ripple) => (
        <Box
          key={ripple.id}
          sx={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(0)',
            animation: `${rippleEffect} 0.6s linear`,
            pointerEvents: 'none',
          }}
        />
      ))}
      
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 20,
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {children}
      </Box>
    </Button>
  );
};

export default EnhancedButton;
