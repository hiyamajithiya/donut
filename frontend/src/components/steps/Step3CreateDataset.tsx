import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
  Dataset as DatasetIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import { datasetsAPI, documentsAPI } from '../../services/api';
import { TrainingDataset, Document } from '../../types';

const Step3CreateDataset: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [existingDatasets, setExistingDatasets] = useState<TrainingDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<TrainingDataset | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingDataset, setCreatingDataset] = useState(false);

  useEffect(() => {
    loadExistingDatasets();
    loadDocuments();
  }, []);

  useEffect(() => {
    if (state.selectedDocumentType) {
      setDatasetName(`${state.selectedDocumentType.name} Training Dataset`);
      setDatasetDescription(`Training dataset for ${state.selectedDocumentType.name} documents`);
    }
  }, [state.selectedDocumentType]);

  const loadExistingDatasets = async () => {
    try {
      const response = await datasetsAPI.getAll();
      setExistingDatasets(response.data);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
    }
  };

  const handleCreateDataset = async () => {
    if (!state.selectedDocumentType) {
      setError('Please select a document type first');
      return;
    }

    try {
      setCreatingDataset(true);

      const datasetData = {
        name: datasetName,
        description: datasetDescription,
        document_type: state.selectedDocumentType.id,
      };

      const response = await datasetsAPI.create(datasetData);
      const newDataset = response.data;

      setExistingDatasets(prev => [...prev, newDataset]);
      dispatch({ type: 'SET_CREATED_DATASET', payload: newDataset });
      setSelectedDataset(newDataset);
      setShowCreateDialog(false);

    } catch (err) {
      console.error('Failed to create dataset:', err);
      setError('Failed to create dataset');
    } finally {
      setCreatingDataset(false);
    }
  };

  const handleSelectDataset = (dataset: TrainingDataset) => {
    setSelectedDataset(dataset);
    dispatch({ type: 'SET_CREATED_DATASET', payload: dataset });
  };

  const getDocumentTypeDocuments = () => {
    if (!state.selectedDocumentType) return [];
    return documents.filter(doc => doc.document_type === state.selectedDocumentType?.id);
  };

  const getUploadedDocuments = () => {
    return documents.filter(doc =>
      state.uploadedDocuments.some(uploaded => uploaded.name === doc.title)
    );
  };

  const relevantDatasets = existingDatasets.filter(
    dataset => dataset.document_type === state.selectedDocumentType?.id
  );

  const typeDocuments = getDocumentTypeDocuments();
  const uploadedDocuments = getUploadedDocuments();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create Training Dataset
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Organize your uploaded documents into a training dataset. You can create a new dataset
        or add documents to an existing one.
      </Typography>

      {!state.selectedDocumentType && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please select a document type in the first step.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Document Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DatasetIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Available Documents
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {typeDocuments.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total {state.selectedDocumentType?.name || 'documents'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Recently Uploaded
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {uploadedDocuments.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                From this session
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Recommendation
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {typeDocuments.length >= 20 ? '✓' : '⚠'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {typeDocuments.length >= 20 ? 'Good for training' : 'Need more documents'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Existing Datasets */}
      {relevantDatasets.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Existing Datasets for {state.selectedDocumentType?.name}
          </Typography>
          <Grid container spacing={2}>
            {relevantDatasets.map((dataset) => (
              <Grid size={{ xs: 12, md: 6 }} key={dataset.id}>
                <Card
                  variant={selectedDataset?.id === dataset.id ? "elevation" : "outlined"}
                  sx={{
                    cursor: 'pointer',
                    border: selectedDataset?.id === dataset.id ? 2 : 1,
                    borderColor: selectedDataset?.id === dataset.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => handleSelectDataset(dataset)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography variant="h6">
                          {dataset.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {dataset.description}
                        </Typography>
                        <Chip
                          label={`${dataset.document_count} documents`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      {selectedDataset?.id === dataset.id && (
                        <CheckIcon color="primary" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Create New Dataset */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Create New Dataset
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          size="large"
          disabled={!state.selectedDocumentType}
        >
          Create New Training Dataset
        </Button>
      </Box>

      {/* Document List */}
      {typeDocuments.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Available Documents ({typeDocuments.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pages</TableCell>
                  <TableCell>Uploaded</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {typeDocuments.slice(0, 10).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        size="small"
                        color={doc.status === 'completed' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{doc.page_count || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {typeDocuments.length > 10 && (
            <Typography variant="caption" display="block" mt={1}>
              Showing first 10 documents. Total: {typeDocuments.length}
            </Typography>
          )}
        </Box>
      )}

      {/* Create Dataset Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Training Dataset</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Dataset Name"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              fullWidth
              required
              helperText="A descriptive name for your training dataset"
            />

            <TextField
              label="Description"
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              helperText="Describe the purpose and content of this dataset"
            />

            <Alert severity="info">
              <Typography variant="subtitle2">Dataset Information</Typography>
              <Typography variant="body2">
                • Document Type: {state.selectedDocumentType?.name}<br/>
                • Available Documents: {typeDocuments.length}<br/>
                • Minimum Recommended: 20 documents
              </Typography>
            </Alert>

            {creatingDataset && (
              <LinearProgress />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)} disabled={creatingDataset}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDataset}
            variant="contained"
            disabled={!datasetName || !datasetDescription || creatingDataset}
          >
            {creatingDataset ? 'Creating...' : 'Create Dataset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Message */}
      {selectedDataset && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Dataset "{selectedDataset.name}" selected. Ready to proceed to annotation.
        </Alert>
      )}
    </Box>
  );
};

export default Step3CreateDataset;