import React from 'react';
import { Box, keyframes } from '@mui/material';

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const floatingAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
`;

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'hero' | 'card' | 'subtle';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  variant = 'hero' 
}) => {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'hero':
        return {
          background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          backgroundSize: '400% 400%',
          animation: `${gradientShift} 15s ease infinite`,
        };
      case 'card':
        return {
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(139, 92, 246, 0.1))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'subtle':
        return {
          background: 'linear-gradient(45deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))',
        };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...getBackgroundStyle(),
      }}
    >
      {variant === 'hero' && (
        <>
          {/* Floating geometric shapes */}
          <Box
            sx={{
              position: 'absolute',
              top: '10%',
              right: '10%',
              width: 100,
              height: 100,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              animation: `${floatingAnimation} 6s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '15%',
              left: '5%',
              width: 60,
              height: 60,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '20%',
              animation: `${floatingAnimation} 8s ease-in-out infinite reverse`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '60%',
              right: '25%',
              width: 40,
              height: 40,
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '50%',
              animation: `${floatingAnimation} 10s ease-in-out infinite`,
            }}
          />
        </>
      )}
      {children}
    </Box>
  );
};

export default AnimatedBackground;
