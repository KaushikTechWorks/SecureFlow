import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, keyframes, ButtonBase } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

const countUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const ripple = keyframes`
  to {
    transform: scale(2);
    opacity: 0;
  }
`;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: SvgIconComponent;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  animated?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle,
  trend,
  animated = true,
  onClick 
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const rippleId = useRef(0);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = {
        x,
        y,
        id: rippleId.current++,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
      
      onClick();
    }
  };

  useEffect(() => {
    setIsVisible(true);
    
    if (animated && typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 1500; // 1.5 seconds
      const startTime = Date.now();
      
      const updateValue = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setAnimatedValue(Math.floor(start + (end - start) * easeOutQuart));
        
        if (progress < 1) {
          requestAnimationFrame(updateValue);
        }
      };
      
      requestAnimationFrame(updateValue);
    }
  }, [value, animated]);

  const displayValue = animated && typeof value === 'number' ? animatedValue : value;
  
  const getColorPalette = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary;
      case 'secondary':
        return theme.palette.secondary;
      case 'error':
        return theme.palette.error;
      case 'warning':
        return theme.palette.warning;
      case 'info':
        return theme.palette.info;
      case 'success':
        return theme.palette.success;
      default:
        return theme.palette.primary;
    }
  };

  const colorPalette = getColorPalette();

  return (
    <ButtonBase
      onClick={handleClick}
      disabled={!onClick}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        display: 'block',
        textAlign: 'left',
        '&:disabled': {
          cursor: 'default',
        },
      }}
    >
      <Card
        sx={{
          height: '100%',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(colorPalette.main, 0.1)} 0%, ${alpha(colorPalette.main, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(colorPalette.main, 0.08)} 0%, ${alpha(colorPalette.main, 0.03)} 100%)`,
          border: `1px solid ${alpha(colorPalette.main, 0.2)}`,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          opacity: isVisible ? 1 : 0,
          animation: isVisible ? `${countUp} 0.6s ease-out` : 'none',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 12px 40px ${alpha(colorPalette.main, 0.25)}`
              : `0 12px 40px ${alpha(colorPalette.main, 0.15)}`,
            '& .icon-container': {
              animation: `${pulse} 0.6s ease-in-out`,
            },
            '& .shimmer-effect': {
              animation: `${shimmer} 2s linear infinite`,
            },
          },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colorPalette.main}, ${colorPalette.light})`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.1)}, transparent)`,
          transition: 'left 0.6s ease-in-out',
        },
        '&:hover::after': {
          left: '100%',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1 
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: colorPalette.main,
                mb: subtitle ? 0.5 : 0,
                background: `linear-gradient(45deg, ${colorPalette.main}, ${colorPalette.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              {displayValue}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box 
                display="flex" 
                alignItems="center" 
                gap={0.5}
                sx={{ mt: 1 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                  }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            className="icon-container"
            sx={{
              backgroundColor: alpha(colorPalette.main, 0.1),
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon 
              sx={{ 
                fontSize: 28, 
                color: colorPalette.main,
                transition: 'all 0.3s ease',
              }} 
            />
          </Box>
        </Box>
        
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: alpha(colorPalette.main, 0.3),
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              left: ripple.x,
              top: ripple.y,
              width: 100,
              height: 100,
              animation: `${ripple} 0.6s ease-out`,
            }}
          />
        ))}
      </CardContent>
    </Card>
    </ButtonBase>
  );
};

export default StatsCard;
