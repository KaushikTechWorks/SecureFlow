import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, useTheme, alpha, keyframes } from '@mui/material';

const slideIn = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
`;

interface AnimatedProgressBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  delay?: number;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  label,
  value,
  maxValue = 100,
  color = 'primary',
  showPercentage = true,
  animated = true,
  delay = 0,
}) => {
  const theme = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      if (animated) {
        let start = 0;
        const end = percentage;
        const duration = 1500;
        const startTime = Date.now();
        
        const updateValue = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          
          setAnimatedValue(start + (end - start) * easeOutCubic);
          
          if (progress < 1) {
            requestAnimationFrame(updateValue);
          }
        };
        
        requestAnimationFrame(updateValue);
      } else {
        setAnimatedValue(percentage);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [percentage, animated, delay]);

  const getColorValue = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const colorValue = getColorValue();

  return (
    <Box sx={{ mb: 3, opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant="body1" 
          fontWeight="medium"
          sx={{ 
            color: theme.palette.text.primary,
            fontSize: '0.95rem',
          }}
        >
          {label}
        </Typography>
        {showPercentage && (
          <Typography 
            variant="body2" 
            fontWeight="bold"
            sx={{ 
              color: colorValue,
              fontSize: '0.9rem',
              minWidth: '45px',
              textAlign: 'right',
            }}
          >
            {Math.round(animatedValue)}%
          </Typography>
        )}
      </Box>
      
      <Box
        sx={{
          position: 'relative',
          height: 8,
          backgroundColor: alpha(theme.palette.grey[500], 0.15),
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${animatedValue}%`,
            background: `linear-gradient(90deg, ${colorValue}, ${alpha(colorValue, 0.8)})`,
            borderRadius: 4,
            transition: 'width 0.3s ease, box-shadow 0.3s ease',
            animation: animated && isVisible ? `${slideIn} 1.5s ease-out` : 'none',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent 0%, ${alpha('#ffffff', 0.3)} 50%, transparent 100%)`,
              animation: animatedValue > 0 ? `${slideIn} 2s ease-out infinite` : 'none',
            },
            '&:hover': {
              animation: `${glow} 2s ease-in-out infinite`,
            },
          }}
        />
        
        {/* Shimmer effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.4)}, transparent)`,
            animation: isVisible ? 'shimmer 2s linear infinite' : 'none',
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' },
            },
          }}
        />
      </Box>
      
      {/* Additional info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {value} / {maxValue}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Fair' : 'Needs Improvement'}
        </Typography>
      </Box>
    </Box>
  );
};

export default AnimatedProgressBar;
