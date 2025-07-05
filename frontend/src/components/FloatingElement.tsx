import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface FloatingElementProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  direction?: 'vertical' | 'horizontal' | 'both';
  speed?: number;
  sx?: SxProps<Theme>;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  intensity = 'subtle',
  direction = 'vertical',
  speed = 3,
  sx = {},
}) => {
  const getAnimationName = () => {
    const intensityMap = {
      subtle: 'subtle',
      medium: 'medium',
      strong: 'strong'
    };
    
    return `floating-${direction}-${intensityMap[intensity]}`;
  };

  return (
    <Box
      sx={{
        animation: `${getAnimationName()} ${speed}s ease-in-out infinite`,
        willChange: 'transform',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default FloatingElement;
