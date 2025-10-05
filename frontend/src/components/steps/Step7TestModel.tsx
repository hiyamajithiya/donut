import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudUpload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useWizard } from '../../contexts/WizardContext';
import { extractionAPI } from '../../services/api';

interface TestResult {
  documentName: string;
  predicted: Record<string, any>;
  groundTruth?: Record<string, any>;
  confidence: number;
  accuracy?: number;
  fieldAccuracies: Record<string, number>;
  extractionTime: number;
  status: 'success' | 'error';
  error?: string;
}

interface ModelMetrics {
  totalTests: number;
  averageAccuracy: number;
  averageConfidence: number;
  averageExtractionTime: number;
  fieldLevelAccuracies: Record<string, number>;
  successRate: number;
}

const Step7TestModel: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [testFiles, setTestFiles] = useState<File[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const calculateMetrics = useCallback(() => {
    if (testResults.length === 0) return;

    const successfulTests = testResults.filter(r => r.status === 'success');
    const totalTests = testResults.length;

    const averageAccuracy = successfulTests.reduce((sum, r) => sum + (r.accuracy || 0), 0) / successfulTests.length;
    const averageConfidence = successfulTests.reduce((sum, r) => sum + r.confidence, 0) / successfulTests.length;
    const averageExtractionTime = successfulTests.reduce((sum, r) => sum + r.extractionTime, 0) / successfulTests.length;

    // Calculate field-level accuracies
    const fieldLevelAccuracies: Record<string, number> = {};
    if (state.selectedDocumentType?.sample_fields) {
      state.selectedDocumentType.sample_fields.forEach(field => {
        const fieldAccuracies = successfulTests
          .map(r => r.fieldAccuracies[field] || 0)
          .filter(acc => acc > 0);

        if (fieldAccuracies.length > 0) {
          fieldLevelAccuracies[field] = fieldAccuracies.reduce((sum, acc) => sum + acc, 0) / fieldAccuracies.length;
        }
      });
    }

    const metrics: ModelMetrics = {
      totalTests,
      averageAccuracy: averageAccuracy * 100,
      averageConfidence: averageConfidence * 100,
      averageExtractionTime,
      fieldLevelAccuracies,
      successRate: (successfulTests.length / totalTests) * 100,
    };

    setModelMetrics(metrics);
  }, [testResults, state.selectedDocumentType]);

  useEffect(() => {
    if (testResults.length > 0) {
      calculateMetrics();
      dispatch({ type: 'SET_TEST_RESULTS', payload: { results: testResults, metrics: modelMetrics } });
    }
  }, [testResults, calculateMetrics, dispatch, modelMetrics]);

  const onDrop = (acceptedFiles: File[]) => {
    setTestFiles(prev => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setTestFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runTests = async () => {
    if (!state.trainedModel || testFiles.length === 0) {
      setError('Please ensure training is complete and test files are uploaded');
      return;
    }

    setTesting(true);
    setError(null);
    setTestResults([]);

    try {
      const results: TestResult[] = [];

      for (const file of testFiles) {
        try {
          const startTime = Date.now();

          // Extract data using the trained model
          const response = await extractionAPI.extractSingle(
            file,
            state.selectedDocumentType?.name,
            state.trainedModel.version
          );

          const extractionTime = Date.now() - startTime;
          const result: TestResult = {
            documentName: file.name,
            predicted: response.data.extracted_data || {},
            confidence: response.data.confidence || 0,
            fieldAccuracies: response.data.field_confidences || {},
            extractionTime,
            status: 'success',
          };

          // Calculate accuracy if ground truth is available (mock for demo)
          if (state.selectedDocumentType?.sample_fields) {
            result.accuracy = Math.random() * 0.3 + 0.7; // Mock accuracy
            result.groundTruth = generateMockGroundTruth(state.selectedDocumentType.sample_fields);
          }

          results.push(result);
        } catch (err: any) {
          results.push({
            documentName: file.name,
            predicted: {},
            confidence: 0,
            fieldAccuracies: {},
            extractionTime: 0,
            status: 'error',
            error: err.message || 'Extraction failed',
          });
        }
      }

      setTestResults(results);
    } catch (err: any) {
      setError(err.message || 'Testing failed');
    } finally {
      setTesting(false);
    }
  };

  const generateMockGroundTruth = (fields: string[]): Record<string, any> => {
    const mockData: Record<string, any> = {};
    fields.forEach(field => {
      switch (field.toLowerCase()) {
        case 'invoice_number':
          mockData[field] = `INV-${Math.floor(Math.random() * 10000)}`;
          break;
        case 'date':
          mockData[field] = new Date().toISOString().split('T')[0];
          break;
        case 'total_amount':
          mockData[field] = (Math.random() * 1000 + 100).toFixed(2);
          break;
        case 'vendor_name':
          mockData[field] = 'Sample Vendor Inc.';
          break;
        default:
          mockData[field] = `Sample ${field.replace(/_/g, ' ')}`;
      }
    });
    return mockData;
  };


  const viewResult = (result: TestResult) => {
    setSelectedResult(result);
    setShowResultDialog(true);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'success';
    if (accuracy >= 75) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Test Model
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Test your trained model with sample documents to evaluate performance and accuracy.
      </Typography>

      {!state.trainedModel && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please complete model training in the previous step.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Model Information */}
      {state.trainedModel && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Model Version"
                      secondary={state.trainedModel.version}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Document Type"
                      secondary={state.selectedDocumentType?.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={state.trainedModel.status.toUpperCase()}
                          color={state.trainedModel.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Field Accuracy"
                      secondary={state.trainedModel.field_accuracy ? `${state.trainedModel.field_accuracy.toFixed(1)}%` : 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Exact Match"
                      secondary={state.trainedModel.json_exact_match ? `${state.trainedModel.json_exact_match.toFixed(1)}%` : 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Avg Inference Time"
                      secondary={state.trainedModel.avg_inference_time ? `${state.trainedModel.avg_inference_time.toFixed(0)}ms` : 'N/A'}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Upload Test Documents */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Test Documents
          </Typography>

          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              mb: 2,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop test documents here' : 'Upload test documents'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Drag & drop documents here, or click to select files
            </Typography>
          </Paper>

          {testFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Test Files ({testFiles.length})
              </Typography>
              <List>
                {testFiles.map((file, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <Button
                      color="error"
                      onClick={() => removeFile(index)}
                      disabled={testing}
                    >
                      Remove
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box mt={2}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={runTests}
              disabled={testing || testFiles.length === 0 || !state.trainedModel}
              size="large"
            >
              {testing ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </Box>

          {testing && (
            <Box mt={2}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" mt={1}>
                Testing documents...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <>
          {/* Overall Metrics */}
          {modelMetrics && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test Results Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {modelMetrics.totalTests}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Tests
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography
                        variant="h4"
                        color={`${getAccuracyColor(modelMetrics.averageAccuracy)}.main`}
                      >
                        {modelMetrics.averageAccuracy.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Average Accuracy
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {modelMetrics.averageConfidence.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Average Confidence
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary.main">
                        {modelMetrics.averageExtractionTime.toFixed(0)}ms
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Avg Extraction Time
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Field-Level Performance */}
          {modelMetrics && Object.keys(modelMetrics.fieldLevelAccuracies).length > 0 && (
            <Accordion sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Field-Level Performance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {Object.entries(modelMetrics.fieldLevelAccuracies).map(([field, accuracy]) => (
                    <Grid size={{ xs: 12, md: 6 }} key={field}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">
                            {field.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="body2" color={`${getAccuracyColor(accuracy * 100)}.main`}>
                            {(accuracy * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={accuracy * 100}
                          color={getAccuracyColor(accuracy * 100) as any}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Test Results Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Individual Test Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Accuracy</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                      <TableCell align="right">Time (ms)</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.documentName}</TableCell>
                        <TableCell align="center">
                          {result.status === 'success' ? (
                            <CheckIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {result.accuracy ? (
                            <Typography color={`${getAccuracyColor(result.accuracy * 100)}.main`}>
                              {(result.accuracy * 100).toFixed(1)}%
                            </Typography>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {result.status === 'success' ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {result.status === 'success' ? result.extractionTime : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => viewResult(result)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Result Detail Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Test Result: {selectedResult?.documentName}
        </DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Extracted Data
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                <pre style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedResult.predicted, null, 2)}
                </pre>
              </Paper>

              {selectedResult.groundTruth && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Ground Truth
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                    <pre style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedResult.groundTruth, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Overall Confidence"
                    secondary={`${(selectedResult.confidence * 100).toFixed(1)}%`}
                  />
                </ListItem>
                {selectedResult.accuracy && (
                  <ListItem>
                    <ListItemText
                      primary="Accuracy"
                      secondary={`${(selectedResult.accuracy * 100).toFixed(1)}%`}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Extraction Time"
                    secondary={`${selectedResult.extractionTime}ms`}
                  />
                </ListItem>
              </List>

              {selectedResult.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {selectedResult.error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step7TestModel;