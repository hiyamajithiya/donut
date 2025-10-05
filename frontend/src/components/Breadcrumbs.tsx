import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  Link,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import {
  NavigateNext,
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
  completed?: boolean;
  current?: boolean;
  disabled?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string, index: number) => void;
  showStatus?: boolean;
  maxItems?: number;
}

const CustomBreadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigate,
  showStatus = true,
  maxItems = 8
}) => {
  const theme = useTheme();

  const getStatusIcon = (item: BreadcrumbItem) => {
    if (item.current) {
      return <PlayArrow sx={{ fontSize: 16, color: theme.palette.primary.main }} />;
    }
    if (item.completed) {
      return <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />;
    }
    return <RadioButtonUnchecked sx={{ fontSize: 16, color: theme.palette.grey[400] }} />;
  };

  const handleClick = (item: BreadcrumbItem, index: number) => {
    if (item.disabled || !item.path || !onNavigate) return;
    onNavigate(item.path, index);
  };

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const isClickable = !item.disabled && item.path && onNavigate && !item.current;

    const content = (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: 1
          } : {}
        }}
        onClick={() => handleClick(item, index)}
        p={0.5}
      >
        {showStatus && getStatusIcon(item)}
        <Typography
          variant="body2"
          color={
            item.current
              ? 'primary'
              : item.disabled
              ? 'text.disabled'
              : isClickable
              ? 'text.primary'
              : 'text.secondary'
          }
          fontWeight={item.current ? 600 : 400}
        >
          {item.label}
        </Typography>
      </Box>
    );

    if (isLast || item.current) {
      return content;
    }

    if (isClickable) {
      return (
        <Link
          component="button"
          variant="body2"
          color="inherit"
          underline="none"
          sx={{ all: 'unset' }}
        >
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <Box mb={2}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        maxItems={maxItems}
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap'
          }
        }}
      >
        {items.map((item, index) => (
          <Box key={index}>
            {renderBreadcrumbItem(item, index, index === items.length - 1)}
          </Box>
        ))}
      </MuiBreadcrumbs>

      {/* Progress indicator */}
      {showStatus && (
        <Box mt={1} display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Progress:
          </Typography>
          <Box display="flex" gap={0.5}>
            {items.map((item, index) => (
              <Chip
                key={index}
                size="small"
                variant={item.current ? 'filled' : item.completed ? 'filled' : 'outlined'}
                color={
                  item.current
                    ? 'primary'
                    : item.completed
                    ? 'success'
                    : 'default'
                }
                label={index + 1}
                sx={{
                  minWidth: 24,
                  height: 20,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {items.filter(item => item.completed).length} of {items.length} completed
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Utility function to generate breadcrumbs from wizard steps
export const generateWizardBreadcrumbs = (
  steps: Array<{ title: string; completed?: boolean }>,
  currentStep: number
): BreadcrumbItem[] => {
  return steps.map((step, index) => ({
    label: step.title,
    path: index <= currentStep ? `/step/${index}` : undefined,
    completed: step.completed || index < currentStep,
    current: index === currentStep,
    disabled: index > currentStep
  }));
};

export default CustomBreadcrumbs;