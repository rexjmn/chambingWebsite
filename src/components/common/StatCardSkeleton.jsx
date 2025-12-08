import React from 'react';
import { Box } from '@mui/material';
import '../../styles/skeleton.scss';

/**
 * Skeleton loader para tarjetas de estadísticas
 */
const StatCardSkeleton = () => {
  return (
    <Box
      className="stat-card-skeleton"
      sx={{
        textAlign: 'center',
        p: { xs: 2, md: 3 },
        borderRadius: 3
      }}
    >
      <Box className="skeleton skeleton-icon" sx={{ width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 2 }} />
      <Box className="skeleton skeleton-text" sx={{ width: '60%', height: 32, mx: 'auto', mb: 1 }} />
      <Box className="skeleton skeleton-text" sx={{ width: '80%', height: 20, mx: 'auto' }} />
    </Box>
  );
};

export default StatCardSkeleton;
