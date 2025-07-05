import React from 'react';
import { Box, Skeleton, useTheme, keyframes } from '@mui/material';

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

interface LoadingSkeletonProps {
  variant: 'dashboard' | 'card' | 'chart' | 'transaction' | 'stats';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant, count = 1 }) => {
  const theme = useTheme();

  const renderDashboardSkeleton = () => (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4 }} />
      
      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        {[...Array(4)].map((_, i) => (
          <Box
            key={i}
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.grey[200]} 0px, ${theme.palette.grey[100]} 40px, ${theme.palette.grey[200]} 80px)`,
              backgroundSize: '600px',
              animation: `${shimmer} 1.2s ease-in-out infinite`,
              borderRadius: 2,
              p: 3,
              height: 120,
            }}
          />
        ))}
      </Box>
      
      {/* Charts */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Skeleton variant="rectangular" width="65%" height={400} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="35%" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );

  const renderCardSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="circular" width={60} height={60} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} />
    </Box>
  );

  const renderChartSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="50%" height={30} sx={{ mb: 3 }} />
      <Box sx={{ 
        background: `repeating-linear-gradient(
          90deg,
          ${theme.palette.grey[200]} 0px,
          ${theme.palette.grey[200]} 40px,
          ${theme.palette.grey[300]} 40px,
          ${theme.palette.grey[300]} 80px
        )`,
        height: 300,
        borderRadius: 2,
        animation: `${pulse} 2s ease-in-out infinite`,
      }} />
    </Box>
  );

  const renderTransactionSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(count)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="50%" height={16} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  );

  const renderStatsSkeleton = () => (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="80%" height={32} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="40%" height={16} sx={{ mx: 'auto' }} />
    </Box>
  );

  switch (variant) {
    case 'dashboard':
      return renderDashboardSkeleton();
    case 'card':
      return renderCardSkeleton();
    case 'chart':
      return renderChartSkeleton();
    case 'transaction':
      return renderTransactionSkeleton();
    case 'stats':
      return renderStatsSkeleton();
    default:
      return <Skeleton variant="rectangular" height={200} />;
  }
};

export default LoadingSkeleton;
