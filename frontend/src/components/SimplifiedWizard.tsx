import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';

// Import simplified step components
import Step1SelectDocumentType from './simplified-steps/Step1SelectDocumentType';
import Step2DefineFields from './simplified-steps/Step2DefineFields';
import Step3UploadSamples from './simplified-steps/Step3UploadSamples';
import Step4AnnotateFields from './simplified-steps/Step4AnnotateFields';
import Step5TrainModel from './simplified-steps/Step5TrainModel';

const steps = [
  'Select Document Type',
  'Define Fields',
  'Upload Samples',
  'Annotate Fields',
  'Train Model',
];

const SimplifiedWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    documentType: '',
    modelName: '',
    fields: [],
    documents: [],
    annotations: {},
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      documentType: '',
      modelName: '',
      fields: [],
      documents: [],
      annotations: {},
    });
  };

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1SelectDocumentType data={formData} updateData={updateFormData} />;
      case 1:
        return <Step2DefineFields data={formData} updateData={updateFormData} />;
      case 2:
        return <Step3UploadSamples data={formData} updateData={updateFormData} />;
      case 3:
        return <Step4AnnotateFields data={formData} updateData={updateFormData} />;
      case 4:
        return <Step5TrainModel data={formData} updateData={updateFormData} />;
      default:
        return 'Unknown step';
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!formData.documentType && !!formData.modelName;
      case 1:
        return formData.fields && formData.fields.length > 0;
      case 2:
        return formData.documents && formData.documents.length >= 5;
      case 3:
        return Object.keys(formData.annotations).length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create Document Extraction Model
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Follow these simple steps to train your custom model
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.default' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Paper elevation={2} sx={{ p: 4, minHeight: 500 }}>
          {activeStep === steps.length ? (
            // Completion Screen
            <Box textAlign="center" py={8}>
              <CompleteIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Model Training Complete!
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Your model "{formData.modelName}" has been successfully created and trained.
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                You can now use this model to extract data from new documents.
              </Typography>
              <Box mt={4} display="flex" gap={2} justifyContent="center">
                <Button variant="outlined" onClick={handleReset}>
                  Create Another Model
                </Button>
                <Button variant="contained" href="/dashboard">
                  Go to Dashboard
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Step Content */}
              <Box mb={4}>{getStepContent(activeStep)}</Box>

              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="space-between" pt={3} borderTop="1px solid" borderColor="divider">
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<BackIcon />}
                  size="large"
                >
                  Back
                </Button>
                <Box display="flex" gap={2}>
                  <Button variant="outlined" href="/dashboard">
                    Save Draft
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={activeStep === steps.length - 1 ? <CompleteIcon /> : <NextIcon />}
                    disabled={!isStepComplete(activeStep)}
                    size="large"
                  >
                    {activeStep === steps.length - 1 ? 'Start Training' : 'Next'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default SimplifiedWizard;
