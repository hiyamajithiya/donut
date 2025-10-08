import axios from 'axios';
import { DocumentType, Document, TrainingDataset, TrainingJob, TrainedModel } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (implement based on your auth system)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Document Types API
export const documentTypesAPI = {
  getAll: () => api.get<DocumentType[]>('/document-types/'),
  getById: (id: string) => api.get<DocumentType>(`/document-types/${id}/`),
};

// Documents API
export const documentsAPI = {
  getAll: () => api.get<Document[]>('/documents/'),
  getById: (id: string) => api.get<Document>(`/documents/${id}/`),
  upload: (formData: FormData) => api.post<Document>('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  label: (id: string, labelData: Record<string, any>) =>
    api.post(`/documents/${id}/label/`, { label_data: labelData }),
  delete: (id: string) => api.delete(`/documents/${id}/`),
};

// Datasets API
export const datasetsAPI = {
  getAll: () => api.get<TrainingDataset[]>('/datasets/'),
  getById: (id: string) => api.get<TrainingDataset>(`/datasets/${id}/`),
  create: (data: Partial<TrainingDataset>) => api.post<TrainingDataset>('/datasets/', data),
  update: (id: string, data: Partial<TrainingDataset>) =>
    api.patch<TrainingDataset>(`/datasets/${id}/`, data),
  delete: (id: string) => api.delete(`/datasets/${id}/`),
};

// Training Jobs API
export const trainingJobsAPI = {
  getAll: () => api.get<TrainingJob[]>('/training-jobs/'),
  getById: (id: string) => api.get<TrainingJob>(`/training-jobs/${id}/`),
  create: (data: Partial<TrainingJob>) => api.post<TrainingJob>('/training-jobs/', data),
  start: (id: string) => api.post(`/training-jobs/${id}/start/`),
  cancel: (id: string) => api.post(`/training-jobs/${id}/cancel/`),
  getStatus: (id: string) => api.get(`/training-jobs/${id}/status/`),
};

// Models API
export const modelsAPI = {
  getAll: () => api.get<TrainedModel[]>('/models/'),
  getById: (id: string) => api.get<TrainedModel>(`/models/${id}/`),
  promote: (id: string) => api.post(`/models/${id}/promote/`),
  getHealth: () => api.get('/models/health/'),
  getStats: (modelId?: string) => api.get('/models/stats/', {
    params: modelId ? { model_id: modelId } : {}
  }),
  getAnalytics: () => api.get('/models/analytics/'),
  compare: (modelIds: string[]) => api.post('/models/compare/', { model_ids: modelIds }),
};

// Extraction API
export const extractionAPI = {
  extractSingle: (file: File, documentType?: string, modelVersion?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) formData.append('document_type', documentType);
    if (modelVersion) formData.append('model_version', modelVersion);

    return api.post('/extract/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  extractBatch: (files: File[], docTypes: string[], batchSize = 4) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    docTypes.forEach(type => formData.append('doc_types', type));
    formData.append('batch_size', batchSize.toString());

    return api.post('/extract/batch/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Model Management API
export const modelManagementAPI = {
  autoPromote: () => api.post('/models/manage/', { action: 'auto_promote' }),
  createABTest: (data: {
    document_type: string;
    challenger_model_id: string;
    traffic_split: number;
    duration_days: number;
  }) => api.post('/models/manage/', { action: 'create_ab_test', ...data }),
  getABResults: (testId: string) =>
    api.post('/models/manage/', { action: 'get_ab_results', test_id: testId }),
  monitorHealth: () => api.post('/models/manage/', { action: 'monitor_health' }),
};

// Wizard API
export const wizardAPI = {
  // Save configuration and create dataset
  saveConfig: (data: {
    documentType: string;
    modelName: string;
    fields: Array<{ id: string; name: string; type: string; required: boolean }>;
    annotations?: Record<string, any>;
  }) => api.post('/wizard/config/', data),

  // Upload training documents
  uploadDocuments: (datasetId: string, files: File[]) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    files.forEach(file => formData.append('files', file));
    return api.post('/wizard/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Save document annotations
  saveAnnotations: (data: {
    dataset_id: string;
    document_id: string;
    annotations: Record<string, any>;
  }) => api.post('/wizard/annotate/', data),

  // Start training
  startTraining: (data: {
    dataset_id: string;
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
  }) => api.post('/wizard/train/', data),

  // Get training status
  getTrainingStatus: (trainingJobId: string) =>
    api.get('/wizard/status/', { params: { training_job_id: trainingJobId } }),

  // Get all models for current user
  getModels: () => api.get('/wizard/models/'),

  // Test a trained model with a document
  testModel: (modelId: string, file: File) => {
    const formData = new FormData();
    formData.append('model_id', modelId);
    formData.append('file', file);
    return api.post('/wizard/test-model/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// API Key Management
export const apiKeysAPI = {
  // Get all API keys
  getAPIKeys: () => api.get('/api-keys/'),

  // Create new API key
  createAPIKey: (data: {
    name: string;
    rate_limit?: number;
    expires_in_days?: number;
    allowed_models?: string[];
  }) => api.post('/api-keys/', data),

  // Delete API key
  deleteAPIKey: (keyId: string) => api.delete('/api-keys/', { data: { key_id: keyId } }),

  // Update API key (activate/deactivate)
  updateAPIKey: (keyId: string, isActive: boolean) =>
    api.patch('/api-keys/', { key_id: keyId, is_active: isActive }),
};

export default api;