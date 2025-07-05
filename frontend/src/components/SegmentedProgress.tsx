import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, SxProps, Theme, useTheme } from '@mui/material';

interface SegmentedProgressProps {
  value: number;
  max?: number;
  segments?: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  animationDuration?: number;
  showPercentage?: boolean;
  sx?: SxProps<Theme>;
}

const SegmentedProgress: React.FC<SegmentedProgressProps> = ({
  value,
  max = 100,
  segments = 10,
  label,
  color = 'primary',
  animationDuration = 1500,
  showPercentage = true,
  sx = {},
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const theme = useTheme();
  
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

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

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" fontWeight="medium" color={color}>
              {Math.round(animatedValue)}%
            </Typography>
          )}
        </Box>
      )}
      
      {/* Segmented Progress Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          height: 8,
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {Array.from({ length: segments }).map((_, index) => {
          const segmentPercentage = (100 / segments) * (index + 1);
          const isActive = animatedValue >= segmentPercentage;
          const isPartial = animatedValue > segmentPercentage - (100 / segments) && animatedValue < segmentPercentage;
          
          return (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: '100%',
                backgroundColor: isActive 
                  ? getColorValue()
                  : isPartial
                    ? `${getColorValue()}80`
                    : 'transparent',
                borderRadius: 0.5,
                transition: `all ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                transitionDelay: `${index * 50}ms`,
                transform: isActive ? 'scaleY(1)' : 'scaleY(0.6)',
                opacity: isActive ? 1 : isPartial ? 0.6 : 0.3,
              }}
            />
          );
        })}
      </Box>
      
      {/* Smooth Progress Bar Alternative */}
      <Box sx={{ mt: 1, position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={animatedValue}
          color={color}
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              transition: `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${getColorValue()}40, transparent)`,
                animation: 'shimmer 2s infinite',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SegmentedProgress;
