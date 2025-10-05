import React from 'react';
import { WizardProvider, useWizard } from '../contexts/WizardContext';
import WizardLayout from './WizardLayout';
import LazyStepLoader from './LazyStepLoader';


const WizardContent: React.FC = () => {
  const {
    state,
    steps,
    nextStep,
    previousStep,
    goToStep,
    updateStepStatus,
  } = useWizard();

  const handleStepChange = (step: number) => {
    goToStep(step);
  };

  const handleNext = () => {
    updateStepStatus(state.currentStep, true);
    nextStep();
  };

  const handleBack = () => {
    previousStep();
  };

  const handleComplete = () => {
    updateStepStatus(state.currentStep, true);
    console.log('Wizard completed!', state);
    // Navigate to completion page or trigger completion logic
  };

  const isStepValid = (): boolean => {
    switch (state.currentStep) {
      case 0: // Document Type
        return !!state.selectedDocumentType;
      case 1: // Upload Documents
        return state.uploadedDocuments.length > 0;
      case 2: // Create Dataset
        return !!state.createdDataset;
      case 3: // Annotate Documents
        return state.labeledDocuments.length > 0;
      case 4: // Training Configuration
        return Object.keys(state.trainingConfig).length > 0;
      case 5: // Train Model
        return !!state.trainingJob;
      case 6: // Test Model
        return Object.keys(state.testResults).length > 0;
      case 7: // Review Results
        return !!state.trainedModel;
      case 8: // Deploy Model
        return !!state.trainedModel?.is_production;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    return <LazyStepLoader step={state.currentStep + 1} />;
  };

  return (
    <WizardLayout
      steps={steps}
      wizardState={state}
      onStepChange={handleStepChange}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={handleComplete}
      isStepValid={isStepValid()}
    >
      {renderStepContent()}
    </WizardLayout>
  );
};

const MainWizard: React.FC = () => {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
};

export default MainWizard;