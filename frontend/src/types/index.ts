export interface DocumentType {
  id: string;
  name: string;
  description: string;
  sample_fields: string[];
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  file: string;
  document_type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'labeled' | 'error';
  user: string;
  page_count?: number;
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentLabel {
  id: string;
  document: string;
  label_data: Record<string, any>;
  labeled_by: string;
  created_at: string;
}

export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  document_type: string;
  user: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingJob {
  id: string;
  dataset: string;
  config: Record<string, any>;
  status: 'pending' | 'preparing' | 'training' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  current_epoch?: number;
  total_epochs?: number;
  loss?: number;
  accuracy?: number;
  user: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface TrainedModel {
  id: string;
  training_job: string;
  version: string;
  model_path: string;
  document_type: string;
  is_production: boolean;
  status: 'training' | 'testing' | 'active' | 'inactive';
  field_accuracy?: number;
  json_exact_match?: number;
  avg_inference_time?: number;
  model_size?: number;
  training_time?: number;
  inference_count: number;
  created_at: string;
  promoted_at?: string;
  last_used_at?: string;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export interface WizardState {
  currentStep: number;
  selectedDocumentType?: DocumentType;
  uploadedDocuments: File[];
  createdDataset?: TrainingDataset;
  labeledDocuments: DocumentLabel[];
  trainingConfig: Record<string, any>;
  trainingJob?: TrainingJob;
  trainedModel?: TrainedModel;
  testResults: Record<string, any>;
}