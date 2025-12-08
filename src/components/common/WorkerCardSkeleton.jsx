import React from 'react';
import { Box, Card, CardContent } from '@mui/material';
import '../../styles/skeleton.scss';

/**
 * Skeleton loader para WorkerCard
 * Diseño moderno con shimmer effect
 */
const WorkerCardSkeleton = () => {
  return (
    <Card className="worker-card-skeleton" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box className="skeleton skeleton-cover" sx={{ height: 200 }} />

      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box className="skeleton skeleton-avatar" sx={{ width: 56, height: 56, borderRadius: '50%', mr: 2 }} />
          <Box flex={1}>
            <Box className="skeleton skeleton-text" sx={{ width: '70%', height: 20, mb: 1 }} />
            <Box className="skeleton skeleton-text" sx={{ width: '50%', height: 16 }} />
          </Box>
        </Box>

        <Box className="skeleton skeleton-text" sx={{ width: '100%', height: 16, mb: 1 }} />
        <Box className="skeleton skeleton-text" sx={{ width: '90%', height: 16, mb: 1 }} />
        <Box className="skeleton skeleton-text" sx={{ width: '60%', height: 16 }} />

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Box className="skeleton skeleton-button" sx={{ width: '45%', height: 36, borderRadius: 2 }} />
          <Box className="skeleton skeleton-button" sx={{ width: '45%', height: 36, borderRadius: 2 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkerCardSkeleton;
