import React, { useState } from 'react';
import { Box, Typography, useTheme, alpha, Tooltip, IconButton } from '@mui/material';
import { TrendingUp, TrendingDown, Remove, Info } from '@mui/icons-material';

interface DataPoint {
  label: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

interface InteractiveChartProps {
  data: DataPoint[];
  title: string;
  type: 'bar' | 'progress' | 'radial';
  height?: number;
  animated?: boolean;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  type,
  height = 300,
  animated = true,
}) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value));

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />;
      default:
        return <Remove sx={{ fontSize: 16, color: theme.palette.text.secondary }} />;
    }
  };

  const renderBarChart = () => (
    <Box sx={{ height, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
        <Tooltip title="Interactive bar chart showing data distribution">
          <IconButton size="small" sx={{ ml: 1 }}>
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'end', height: height - 80, gap: 1 }}>
        {data.map((item, index) => (
          <Tooltip 
            key={index}
            title={`${item.label}: ${item.value}${item.percentage ? ` (${item.percentage}%)` : ''}`}
          >
            <Box
              sx={{
                flex: 1,
                height: `${(item.value / maxValue) * 100}%`,
                background: hoveredIndex === index 
                  ? `linear-gradient(to top, ${item.color || theme.palette.primary.main}, ${item.color || theme.palette.primary.light})`
                  : item.color || theme.palette.primary.main,
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                boxShadow: hoveredIndex === index 
                  ? `0 4px 20px ${alpha(item.color || theme.palette.primary.main, 0.4)}`
                  : 'none',
                ...(animated && {
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }),
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Box sx={{ 
                position: 'relative', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'end',
                p: 1,
              }}>
                {hoveredIndex === index && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      mb: 1,
                    }}
                  >
                    {item.value}
                  </Typography>
                )}
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
        {data.map((item, index) => (
          <Typography 
            key={index}
            variant="caption" 
            sx={{ 
              flex: 1, 
              textAlign: 'center',
              fontSize: '0.7rem',
              opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}
          >
            {item.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );

  const renderProgressChart = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {data.map((item, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {item.label}
              </Typography>
              {getTrendIcon(item.trend)}
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {item.value}{item.percentage ? '%' : ''}
            </Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              backgroundColor: alpha(theme.palette.grey[500], 0.2),
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${item.percentage || (item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${item.color || theme.palette.primary.main}, ${item.color || theme.palette.primary.light})`,
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(animated && {
                  animation: `slideIn 1s ease-out ${index * 0.2}s both`,
                }),
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );

  const renderRadialChart = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {data.map((item, index) => {
          const percentage = item.percentage || (item.value / maxValue) * 100;
          const radius = 45;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (percentage / 100) * circumference;
          
          return (
            <Box key={index} sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={alpha(theme.palette.grey[400], 0.3)}
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={item.color || theme.palette.primary.main}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{
                      transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      ...(animated && {
                        animation: `drawCircle 2s ease-out ${index * 0.3}s both`,
                      }),
                    }}
                  />
                </svg>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {Math.round(percentage)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.value}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  switch (type) {
    case 'bar':
      return renderBarChart();
    case 'progress':
      return renderProgressChart();
    case 'radial':
      return renderRadialChart();
    default:
      return renderBarChart();
  }
};

export default InteractiveChart;
