import React from 'react';
import { Box, Skeleton, Paper, SxProps, Theme } from '@mui/material';

interface ChartSkeletonProps {
  type?: 'bar' | 'doughnut' | 'line';
  height?: number;
  showLegend?: boolean;
  sx?: SxProps<Theme>;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  height = 400,
  showLegend = true,
  sx = {},
}) => {
  const renderBarSkeleton = () => (
    <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: height - 100, px: 2 }}>
      {Array.from({ length: 12 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Skeleton
            variant="rectangular"
            sx={{
              width: '100%',
              height: `${Math.random() * 60 + 20}%`,
              borderRadius: 1,
              animation: 'wave 1.5s ease-in-out infinite',
              animationDelay: `${index * 0.1}s`,
            }}
          />
          <Skeleton
            variant="text"
            width="80%"
            sx={{
              fontSize: '0.75rem',
              animationDelay: `${index * 0.1}s`,
            }}
          />
        </Box>
      ))}
    </Box>
  );

  const renderDoughnutSkeleton = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height - 100 }}>
      <Box sx={{ position: 'relative' }}>
        <Skeleton
          variant="circular"
          width={200}
          height={200}
          sx={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <Skeleton
          variant="circular"
          width={100}
          height={100}
          sx={{
            position: 'absolute',
            top: 50,
            left: 50,
            backgroundColor: 'background.paper',
          }}
        />
      </Box>
    </Box>
  );

  const renderLineSkeleton = () => (
    <Box sx={{ height: height - 100, p: 2, position: 'relative' }}>
      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(index + 1) * 16}%`,
            height: 1,
            backgroundColor: 'divider',
            opacity: 0.3,
          }}
        />
      ))}
      
      {/* Animated line */}
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Skeleton
          variant="rectangular"
          sx={{
            width: '100%',
            height: 2,
            position: 'absolute',
            top: '60%',
            borderRadius: 1,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)',
              animation: 'shimmer 2s infinite',
            },
          }}
        />
      </Box>
    </Box>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'doughnut':
        return renderDoughnutSkeleton();
      case 'line':
        return renderLineSkeleton();
      case 'bar':
      default:
        return renderBarSkeleton();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        height,
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={28} />
        <Skeleton variant="rectangular" width={120} height={24} sx={{ borderRadius: 3 }} />
      </Box>

      {/* Chart skeleton */}
      <Box sx={{ flex: 1 }}>
        {renderSkeleton()}
      </Box>

      {/* Legend skeleton */}
      {showLegend && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
          {Array.from({ length: type === 'doughnut' ? 3 : 2 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton
                variant="circular"
                width={12}
                height={12}
                sx={{ animationDelay: `${index * 0.2}s` }}
              />
              <Skeleton
                variant="text"
                width={80}
                sx={{ animationDelay: `${index * 0.2}s` }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default ChartSkeleton;
