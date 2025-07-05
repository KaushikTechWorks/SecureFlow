import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

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
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle,
  trend 
}) => {
  const theme = useTheme();
  
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
    <Card
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(colorPalette.main, 0.1)} 0%, ${alpha(colorPalette.main, 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(colorPalette.main, 0.08)} 0%, ${alpha(colorPalette.main, 0.03)} 100%)`,
        border: `1px solid ${alpha(colorPalette.main, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? `0 8px 25px ${alpha(colorPalette.main, 0.3)}`
            : `0 8px 25px ${alpha(colorPalette.main, 0.15)}`,
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
              }}
            >
              {value}
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
            sx={{
              backgroundColor: alpha(colorPalette.main, 0.1),
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon 
              sx={{ 
                fontSize: 28, 
                color: colorPalette.main,
              }} 
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
