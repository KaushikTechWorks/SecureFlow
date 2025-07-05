import React from 'react';
import { Card, CardProps, useTheme, alpha } from '@mui/material';

interface GlassCardProps extends CardProps {
  glassEffect?: 'light' | 'medium' | 'heavy';
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  glassEffect = 'medium',
  hover = true,
  sx,
  ...props 
}) => {
  const theme = useTheme();
  
  const getGlassStyles = () => {
    const baseStyles = {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: `1px solid ${alpha('#ffffff', 0.2)}`,
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 32px rgba(0, 0, 0, 0.3)'
        : '0 8px 32px rgba(31, 38, 135, 0.15)',
    };

    switch (glassEffect) {
      case 'light':
        return {
          ...baseStyles,
          background: theme.palette.mode === 'dark'
            ? alpha('#ffffff', 0.05)
            : alpha('#ffffff', 0.25),
        };
      case 'medium':
        return {
          ...baseStyles,
          background: theme.palette.mode === 'dark'
            ? alpha('#ffffff', 0.1)
            : alpha('#ffffff', 0.4),
        };
      case 'heavy':
        return {
          ...baseStyles,
          background: theme.palette.mode === 'dark'
            ? alpha('#ffffff', 0.15)
            : alpha('#ffffff', 0.6),
        };
      default:
        return baseStyles;
    }
  };

  return (
    <Card
      sx={{
        ...getGlassStyles(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.4)'
              : '0 20px 40px rgba(31, 38, 135, 0.25)',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
