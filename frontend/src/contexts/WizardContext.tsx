import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { WizardState, WizardStep, DocumentType, TrainingDataset, TrainingJob, TrainedModel, DocumentLabel } from '../types';

type WizardAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_DOCUMENT_TYPE'; payload: DocumentType }
  | { type: 'SET_UPLOADED_DOCUMENTS'; payload: File[] }
  | { type: 'SET_CREATED_DATASET'; payload: TrainingDataset }
  | { type: 'SET_LABELED_DOCUMENTS'; payload: DocumentLabel[] }
  | { type: 'SET_TRAINING_CONFIG'; payload: Record<string, any> }
  | { type: 'SET_TRAINING_JOB'; payload: TrainingJob }
  | { type: 'SET_TRAINED_MODEL'; payload: TrainedModel }
  | { type: 'SET_TEST_RESULTS'; payload: Record<string, any> }
  | { type: 'RESET_WIZARD' };

const initialState: WizardState = {
  currentStep: 0,
  uploadedDocuments: [],
  labeledDocuments: [],
  trainingConfig: {},
  testResults: {},
};

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Document Type',
    description: 'Select the type of documents you want to train the model on',
    completed: false,
    active: true,
  },
  {
    id: 2,
    title: 'Upload Documents',
    description: 'Upload sample documents for training',
    completed: false,
    active: false,
  },
  {
    id: 3,
    title: 'Create Dataset',
    description: 'Organize your documents into a training dataset',
    completed: false,
    active: false,
  },
  {
    id: 4,
    title: 'Annotate Documents',
    description: 'Label key fields in your documents',
    completed: false,
    active: false,
  },
  {
    id: 5,
    title: 'Training Configuration',
    description: 'Configure training parameters',
    completed: false,
    active: false,
  },
  {
    id: 6,
    title: 'Train Model',
    description: 'Monitor the model training process',
    completed: false,
    active: false,
  },
  {
    id: 7,
    title: 'Test Model',
    description: 'Validate model performance with test documents',
    completed: false,
    active: false,
  },
  {
    id: 8,
    title: 'Review Results',
    description: 'Review training metrics and model performance',
    completed: false,
    active: false,
  },
  {
    id: 9,
    title: 'Deploy Model',
    description: 'Deploy the trained model to production',
    completed: false,
    active: false,
  },
];

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_DOCUMENT_TYPE':
      return { ...state, selectedDocumentType: action.payload };
    case 'SET_UPLOADED_DOCUMENTS':
      return { ...state, uploadedDocuments: action.payload };
    case 'SET_CREATED_DATASET':
      return { ...state, createdDataset: action.payload };
    case 'SET_LABELED_DOCUMENTS':
      return { ...state, labeledDocuments: action.payload };
    case 'SET_TRAINING_CONFIG':
      return { ...state, trainingConfig: action.payload };
    case 'SET_TRAINING_JOB':
      return { ...state, trainingJob: action.payload };
    case 'SET_TRAINED_MODEL':
      return { ...state, trainedModel: action.payload };
    case 'SET_TEST_RESULTS':
      return { ...state, testResults: action.payload };
    case 'RESET_WIZARD':
      return initialState;
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  steps: WizardStep[];
  dispatch: React.Dispatch<WizardAction>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
  updateStepStatus: (stepIndex: number, completed: boolean) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

interface WizardProviderProps {
  children: ReactNode;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const [steps, setSteps] = React.useState(wizardSteps);

  const nextStep = () => {
    if (state.currentStep < steps.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
      updateStepStatus(state.currentStep, true);
    }
  };

  const previousStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    }
  };

  const resetWizard = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setSteps(wizardSteps.map(step => ({ ...step, completed: false, active: step.id === 1 })));
  };

  const updateStepStatus = (stepIndex: number, completed: boolean) => {
    setSteps(prevSteps =>
      prevSteps.map((step, index) => ({
        ...step,
        completed: index === stepIndex ? completed : step.completed,
        active: index === stepIndex + 1 ? true : step.active,
      }))
    );
  };

  const value: WizardContextType = {
    state,
    steps,
    dispatch,
    nextStep,
    previousStep,
    goToStep,
    resetWizard,
    updateStepStatus,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};