import React, { useEffect, useRef, useState } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface AnimatedChartWrapperProps {
  children: React.ReactNode;
  animationType?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'drawIn';
  delay?: number;
  duration?: number;
  sx?: SxProps<Theme>;
}

const AnimatedChartWrapper: React.FC<AnimatedChartWrapperProps> = ({
  children,
  animationType = 'fadeIn',
  delay = 0,
  duration = 1.2,
  sx = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay * 1000);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [delay, hasAnimated]);

  const getInitialStyles = () => {
    switch (animationType) {
      case 'slideUp':
        return {
          opacity: 0,
          transform: 'translateY(40px)',
        };
      case 'scaleIn':
        return {
          opacity: 0,
          transform: 'scale(0.8)',
        };
      case 'drawIn':
        return {
          opacity: 0,
          transform: 'scale(0.95)',
          filter: 'blur(2px)',
        };
      case 'fadeIn':
      default:
        return {
          opacity: 0,
        };
    }
  };

  const getVisibleStyles = () => {
    return {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
      filter: 'blur(0px)',
    };
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        ...(isVisible ? getVisibleStyles() : getInitialStyles()),
        transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'transform, opacity, filter',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedChartWrapper;
