import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { useStaggeredAnimation } from '../hooks/useStaggeredAnimation';

interface LightAnimationProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  distance?: number;
  triggerOnScroll?: boolean;
  sx?: SxProps<Theme>;
}

const LightAnimation: React.FC<LightAnimationProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 20,
  triggerOnScroll = true,
  sx = {},
}) => {
  const { ref, isVisible } = useStaggeredAnimation({
    delay,
    triggerOnScroll,
  });

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)';
    
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`;
      case 'fade':
      default:
        return 'translate3d(0, 0, 0)';
    }
  };

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: isVisible ? 'auto' : 'transform, opacity',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default LightAnimation;
