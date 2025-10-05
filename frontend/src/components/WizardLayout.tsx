import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import { Logout, Person, Save, RestartAlt } from '@mui/icons-material';
import { WizardStep, WizardState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWizardAutoSave } from '../hooks/useAutoSave';
import CustomBreadcrumbs, { generateWizardBreadcrumbs } from './Breadcrumbs';
import ConfirmDialog from './ConfirmDialog';

interface WizardLayoutProps {
  steps: WizardStep[];
  wizardState: WizardState;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  children: React.ReactNode;
  isStepValid?: boolean;
  isLoading?: boolean;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({
  steps,
  wizardState,
  onStepChange,
  onNext,
  onBack,
  onComplete,
  children,
  isStepValid = true,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentStep } = wizardState;
  const { user, logout } = useAuth();
  const { showSuccess, showWarning } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Auto-save functionality
  const { forceSave } = useWizardAutoSave(wizardState);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      onNext();
    }
  }, [currentStep, steps.length, onNext, onComplete]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep) {
      onStepChange(stepIndex);
    }
  }, [currentStep, onStepChange]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const handleSaveProgress = () => {
    forceSave();
    showSuccess('Progress saved successfully!');
    handleUserMenuClose();
  };

  const handleResetWizard = () => {
    setShowResetDialog(true);
    handleUserMenuClose();
  };

  const confirmReset = () => {
    // Clear auto-saved data and reset wizard
    localStorage.removeItem('autosave_wizard_progress');
    localStorage.removeItem('autosave_wizard_progress_timestamp');
    showWarning('Wizard progress has been reset');
    setShowResetDialog(false);
    // You can trigger wizard reset here by calling a prop function
  };

  // Generate breadcrumbs
  const breadcrumbItems = generateWizardBreadcrumbs(steps, currentStep);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box flex={1} />
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 0 }}>
              Donut Trainer Wizard
            </Typography>
            <Box flex={1} display="flex" justifyContent="flex-end">
              <Tooltip title="Account settings">
                <IconButton onClick={handleUserMenuOpen} size="small">
                  <Avatar sx={{
                    width: 32,
                    height: 32,
                    bgcolor: user?.role === 'superuser' ? '#ff6b35' : theme.palette.primary.main,
                    border: user?.role === 'superuser' ? '2px solid #ff6b35' : 'none'
                  }}>
                    <Person />
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleUserMenuClose}>
                  <Avatar sx={{
                    bgcolor: user?.role === 'superuser' ? '#ff6b35' : theme.palette.primary.main,
                    border: user?.role === 'superuser' ? '2px solid #ff6b35' : 'none'
                  }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {user?.name || user?.email}
                    </Typography>
                    {user?.role === 'superuser' && (
                      <Typography variant="caption" color="#ff6b35" fontWeight={600}>
                        SUPER USER
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSaveProgress}>
                  <Save fontSize="small" sx={{ mr: 2 }} />
                  Save Progress
                </MenuItem>
                <MenuItem onClick={handleResetWizard}>
                  <RestartAlt fontSize="small" sx={{ mr: 2 }} />
                  Reset Wizard
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 2 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Typography variant="subtitle1" align="center" color="textSecondary">
            {steps[currentStep]?.description}
          </Typography>

          {/* Breadcrumb Navigation */}
          <Box mt={2}>
            <CustomBreadcrumbs
              items={breadcrumbItems}
              onNavigate={(path: string, index: number) => onStepChange(index)}
              showStatus={true}
            />
          </Box>

          {/* Progress Bar */}
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" display="block" textAlign="center" mt={1}>
              Step {currentStep + 1} of {steps.length} - {Math.round(progress)}% Complete
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={4}>
          {/* Step Navigation */}
          <Box flex={isMobile ? 'none' : '0 0 300px'}>
            <Stepper
              activeStep={currentStep}
              orientation={isMobile ? 'horizontal' : 'vertical'}
              sx={{
                '& .MuiStepConnector-root': {
                  ml: isMobile ? 0 : 1,
                },
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.id} completed={step.completed}>
                  <StepLabel
                    onClick={() => handleStepClick(index)}
                    sx={{
                      cursor: index <= currentStep ? 'pointer' : 'default',
                      opacity: index > currentStep ? 0.5 : 1,
                    }}
                  >
                    <Typography variant="subtitle2" noWrap>
                      {step.title}
                    </Typography>
                  </StepLabel>
                  {!isMobile && (
                    <StepContent>
                      <Typography variant="caption" color="textSecondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  )}
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Main Content */}
          <Box flex={1}>
            <Paper variant="outlined" sx={{ p: 3, minHeight: 400 }}>
              {isLoading && (
                <Box mb={2}>
                  <LinearProgress />
                </Box>
              )}

              {children}
            </Paper>

            {/* Navigation Buttons */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={3}
            >
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
                size="large"
              >
                Back
              </Button>

              <Box>
                <Typography variant="caption" color="textSecondary" mr={2}>
                  {currentStep + 1} / {steps.length}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid || isLoading}
                  size="large"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showResetDialog}
        title="Reset Wizard Progress"
        message="Are you sure you want to reset all wizard progress? This action cannot be undone and all your current work will be lost."
        confirmText="Reset"
        cancelText="Cancel"
        severity="warning"
        onConfirm={confirmReset}
        onCancel={() => setShowResetDialog(false)}
        confirmColor="error"
      />
    </Container>
  );
};

export default WizardLayout;