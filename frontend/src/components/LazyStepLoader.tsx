import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography, Card, CardContent } from '@mui/material';

// Lazy load all step components
const Step1DocumentType = lazy(() => import('./steps/Step1DocumentType'));
const Step2UploadDocuments = lazy(() => import('./steps/Step2UploadDocuments'));
const Step3CreateDataset = lazy(() => import('./steps/Step3CreateDataset'));
const Step4AnnotateDocuments = lazy(() => import('./steps/Step4AnnotateDocuments'));
const Step5TrainingConfig = lazy(() => import('./steps/Step5TrainingConfig'));
const Step6TrainModel = lazy(() => import('./steps/Step6TrainModel'));
const Step7TestModel = lazy(() => import('./steps/Step7TestModel'));
const Step8ReviewResults = lazy(() => import('./steps/Step8ReviewResults'));
const Step9DeployModel = lazy(() => import('./steps/Step9DeployModel'));

interface LazyStepLoaderProps {
  step: number;
}

// Loading fallback component
const StepLoadingFallback: React.FC<{ stepName: string }> = ({ stepName }) => (
  <Card sx={{ minHeight: 400 }}>
    <CardContent>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={300}
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="textSecondary">
          Loading {stepName}...
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Preparing the interface for this step
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const LazyStepLoader: React.FC<LazyStepLoaderProps> = ({ step }) => {
  const getStepComponent = () => {
    switch (step) {
      case 1:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Document Type Selection" />}>
            <Step1DocumentType />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Document Upload" />}>
            <Step2UploadDocuments />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Dataset Creation" />}>
            <Step3CreateDataset />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Document Annotation" />}>
            <Step4AnnotateDocuments />
          </Suspense>
        );
      case 5:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Training Configuration" />}>
            <Step5TrainingConfig />
          </Suspense>
        );
      case 6:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Model Training" />}>
            <Step6TrainModel />
          </Suspense>
        );
      case 7:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Model Testing" />}>
            <Step7TestModel />
          </Suspense>
        );
      case 8:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Results Review" />}>
            <Step8ReviewResults />
          </Suspense>
        );
      case 9:
        return (
          <Suspense fallback={<StepLoadingFallback stepName="Model Deployment" />}>
            <Step9DeployModel />
          </Suspense>
        );
      default:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                Invalid step: {step}
              </Typography>
            </CardContent>
          </Card>
        );
    }
  };

  return getStepComponent();
};

export default LazyStepLoader;