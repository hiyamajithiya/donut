import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as ConfigIcon,
  PlayArrow as ProcessIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  documentType?: string;
  extractedText?: string;
  errorMessage?: string;
}

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [projectName, setProjectName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const steps = ['Upload Documents', 'Configure Processing', 'Review & Process'];

  const documentTypes = [
    'Invoice',
    'Contract',
    'Receipt',
    'Form',
    'Report',
    'ID Document',
    'Medical Record',
    'Other',
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle accepted files
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0,
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Simulate upload process
      newFiles.forEach((uploadFile) => {
        simulateUpload(uploadFile.id);
      });

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        console.log('Rejected files:', rejectedFiles);
      }
    },
  });

  const simulateUpload = async (fileId: string) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, status: 'uploading' as const } : f)
    );

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, progress } : f)
      );
    }

    setUploadedFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, status: 'uploaded' as const } : f)
    );
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    setProcessing(true);

    // Set all files to processing
    setUploadedFiles(prev =>
      prev.map(f => ({ ...f, status: 'processing' as const, progress: 0 }))
    );

    // Simulate processing each file
    for (const file of uploadedFiles) {
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev =>
          prev.map(f => f.id === file.id ? { ...f, progress } : f)
        );
      }

      setUploadedFiles(prev =>
        prev.map(f => f.id === file.id ? {
          ...f,
          status: 'completed' as const,
          documentType: selectedDocumentType,
          extractedText: `Extracted text from ${f.file.name}...`
        } : f)
      );
    }

    setProcessing(false);
    setActiveStep(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'uploading':
      case 'processing':
        return 'info';
      case 'uploaded':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0:
        return uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'uploaded');
      case 1:
        return selectedDocumentType && projectName;
      default:
        return false;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Upload Documents
        </Typography>
        <Typography variant="body1" color="textSecondary" mb={3}>
          Upload your documents and configure processing settings
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upload Documents
                </Typography>

                {/* Drop Zone */}
                <Paper
                  {...getRootProps()}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    or click to browse your computer
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Supported formats: PDF, Images (PNG, JPG, etc.), Word documents
                    <br />
                    Maximum file size: 50MB
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2 }}>
                    Choose Files
                  </Button>
                </Paper>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                      Uploaded Files ({uploadedFiles.length})
                    </Typography>
                    <List>
                      {uploadedFiles.map((uploadFile) => (
                        <ListItem
                          key={uploadFile.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            {getStatusIcon(uploadFile.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={2}>
                                <Typography variant="subtitle2">
                                  {uploadFile.file.name}
                                </Typography>
                                <Chip
                                  label={uploadFile.status}
                                  size="small"
                                  color={getStatusColor(uploadFile.status) as any}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box mt={1}>
                                <Typography variant="caption" color="textSecondary">
                                  {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                                </Typography>
                                {uploadFile.status === 'uploading' && (
                                  <Box mt={1}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={uploadFile.progress}
                                      sx={{ height: 4, borderRadius: 2 }}
                                    />
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                          <Box display="flex" gap={1}>
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeFile(uploadFile.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configure Processing
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Project Name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g., Invoice Processing Q1 2024"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                        label="Document Type"
                      >
                        {documentTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Processing Configuration
                  </Typography>
                  <Typography variant="body2">
                    • OCR will be applied to extract text from images and scanned documents
                    <br />
                    • AI models will identify and extract relevant fields based on document type
                    <br />
                    • Quality validation will ensure accuracy of extracted data
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Complete
                </Typography>

                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    All documents processed successfully!
                  </Typography>
                  <Typography variant="body2">
                    {uploadedFiles.length} documents have been processed and are ready for review.
                  </Typography>
                </Alert>

                <List>
                  {uploadedFiles.map((file) => (
                    <ListItem
                      key={file.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <SuccessIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.file.name}
                        secondary={`Type: ${file.documentType} • Extracted text available`}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/documents/${file.id}`)}
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Summary
              </Typography>

              <Box mb={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Files Uploaded
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {uploadedFiles.length}
                </Typography>
              </Box>

              {uploadedFiles.length > 0 && (
                <Box mb={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Total Size
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatFileSize(uploadedFiles.reduce((total, file) => total + file.file.size, 0))}
                  </Typography>
                </Box>
              )}

              {selectedDocumentType && (
                <Box mb={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Document Type
                  </Typography>
                  <Chip label={selectedDocumentType} color="primary" />
                </Box>
              )}

              {projectName && (
                <Box mb={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Project Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {projectName}
                  </Typography>
                </Box>
              )}

              <Box display="flex" flexDirection="column" gap={2}>
                {activeStep === 0 && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!canProceedToNext()}
                    onClick={() => setActiveStep(1)}
                  >
                    Configure Processing
                  </Button>
                )}

                {activeStep === 1 && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!canProceedToNext() || processing}
                      onClick={processFiles}
                      startIcon={processing ? undefined : <ProcessIcon />}
                    >
                      {processing ? 'Processing...' : 'Start Processing'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                    >
                      Back
                    </Button>
                  </>
                )}

                {activeStep === 2 && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/documents')}
                    >
                      View All Documents
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/projects')}
                    >
                      Go to Projects
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Processing Tips */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Tips
              </Typography>
              <List dense>
                <ListItem>
                  <Typography variant="body2">
                    • Ensure documents are clearly scanned with good resolution
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    • Remove any handwritten annotations that might interfere
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    • Group similar document types for better accuracy
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    • Review extracted data before finalizing
                  </Typography>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Upload;