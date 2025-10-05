import React from 'react';
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Stack,
  Grid,
  Typography
} from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'form' | 'custom';
  count?: number;
  height?: number | string;
  width?: number | string;
  children?: React.ReactNode;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  height,
  width,
  children
}) => {
  if (children) {
    return <>{children}</>;
  }

  const renderCardSkeleton = () => (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="30%" height={20} />
        </Stack>
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} display="flex" alignItems="center" p={2} borderBottom="1px solid #eee">
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} />
        </Box>
      ))}
    </Box>
  );

  const renderTableSkeleton = () => (
    <Box>
      {/* Table Header */}
      <Box display="flex" p={2} borderBottom="2px solid #eee">
        {Array.from({ length: 4 }).map((_, index) => (
          <Box key={index} flex={1} mx={1}>
            <Skeleton variant="text" height={24} />
          </Box>
        ))}
      </Box>

      {/* Table Rows */}
      {Array.from({ length: count }).map((_, rowIndex) => (
        <Box key={rowIndex} display="flex" p={2} borderBottom="1px solid #eee">
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <Box key={colIndex} flex={1} mx={1}>
              <Skeleton variant="text" height={20} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );

  const renderFormSkeleton = () => (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
        <Box>
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
        <Box>
          <Skeleton variant="text" width="25%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={120} />
        </Box>
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </Box>
      </Stack>
    </Box>
  );

  const renderCustomSkeleton = () => (
    <Skeleton
      variant="rectangular"
      height={height}
      width={width}
      sx={{ borderRadius: 1 }}
    />
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Grid container spacing={3}>
            {Array.from({ length: count }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                {renderCardSkeleton()}
              </Grid>
            ))}
          </Grid>
        );
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'custom':
        return renderCustomSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return <Box>{renderSkeleton()}</Box>;
};

// Specialized loading components
export const CardLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <LoadingSkeleton variant="card" count={count} />
);

export const ListLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <LoadingSkeleton variant="list" count={count} />
);

export const TableLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <LoadingSkeleton variant="table" count={count} />
);

export const FormLoadingSkeleton: React.FC = () => (
  <LoadingSkeleton variant="form" />
);

export const WizardLoadingSkeleton: React.FC = () => (
  <Box>
    {/* Header skeleton */}
    <Box mb={4} textAlign="center">
      <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mx: 'auto', mb: 3 }} />
      <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
    </Box>

    {/* Step content skeleton */}
    <Card>
      <CardContent>
        <FormLoadingSkeleton />
      </CardContent>
    </Card>

    {/* Navigation buttons skeleton */}
    <Box display="flex" justifyContent="space-between" mt={3}>
      <Skeleton variant="rectangular" width={100} height={40} />
      <Skeleton variant="rectangular" width={100} height={40} />
    </Box>
  </Box>
);

export default LoadingSkeleton;