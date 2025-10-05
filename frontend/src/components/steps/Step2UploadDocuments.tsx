import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useWizard } from '../../contexts/WizardContext';
import { documentsAPI } from '../../services/api';
import DocumentViewer from '../DocumentViewer';

interface FileWithPreview extends File {
  preview?: string;
  uploaded?: boolean;
  error?: string;
  id?: string;
}

const Step2UploadDocuments: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      uploaded: false,
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles(files.filter(file => file !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const uploadFile = async (file: FileWithPreview) => {
    if (!state.selectedDocumentType) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', state.selectedDocumentType.id);
    formData.append('title', file.name);

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const response = await documentsAPI.upload(formData);

      setFiles(prevFiles =>
        prevFiles.map(f =>
          f === file ? { ...f, uploaded: true, id: response.data.id } : f
        )
      );

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
    } catch (error) {
      console.error('Upload failed:', error);
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f === file ? { ...f, error: 'Upload failed' } : f
        )
      );
    }
  };

  const uploadAllFiles = async () => {
    if (!state.selectedDocumentType) {
      return;
    }

    setUploading(true);
    const unuploadedFiles = files.filter(file => !file.uploaded && !file.error);

    for (const file of unuploadedFiles) {
      await uploadFile(file);
    }

    // Update wizard state with uploaded files
    dispatch({ type: 'SET_UPLOADED_DOCUMENTS', payload: files.filter(f => f.uploaded) });
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDropzoneColor = () => {
    if (isDragReject) return 'error.main';
    if (isDragActive) return 'primary.main';
    return 'text.secondary';
  };

  const uploadedCount = files.filter(f => f.uploaded).length;
  const totalCount = files.length;

  const handlePreviewFile = (file: FileWithPreview) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload Training Documents
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload sample documents of type "{state.selectedDocumentType?.name}" to train your model.
        Aim for at least 20-50 documents for good results.
      </Typography>

      {!state.selectedDocumentType && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please select a document type in the previous step before uploading documents.
        </Alert>
      )}

      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: getDropzoneColor(),
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 64, color: getDropzoneColor(), mb: 2 }} />

        {isDragActive ? (
          <Typography variant="h6" color="primary">
            Drop the files here...
          </Typography>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Drag & drop documents here, or click to select
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, PNG, JPG, JPEG, TIFF (max 10MB each)
            </Typography>
          </Box>
        )}

        {isDragReject && (
          <Typography variant="body2" color="error" mt={1}>
            Some files are not supported. Please upload PDF or image files only.
          </Typography>
        )}
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box p={2} borderBottom={1} borderColor="divider">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Uploaded Files ({uploadedCount}/{totalCount})
              </Typography>
              <Box>
                <Chip
                  label={`${totalCount} file${totalCount !== 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={uploadAllFiles}
                  disabled={uploading || uploadedCount === totalCount || !state.selectedDocumentType}
                  startIcon={<UploadIcon />}
                >
                  {uploading ? 'Uploading...' : 'Upload All'}
                </Button>
              </Box>
            </Box>
          </Box>

          <List>
            {files.map((file, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {file.uploaded ? (
                    <CheckIcon color="success" />
                  ) : file.error ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <FileIcon />
                  )}
                </ListItemIcon>

                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {formatFileSize(file.size)}
                      </Typography>
                      {file.error && (
                        <Typography variant="caption" color="error">
                          {file.error}
                        </Typography>
                      )}
                      {uploadProgress[file.name] !== undefined && !file.uploaded && !file.error && (
                        <Box mt={1}>
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress[file.name]}
                          />
                        </Box>
                      )}
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => handlePreviewFile(file)}
                    disabled={uploading}
                    sx={{ mr: 1 }}
                  >
                    <PreviewIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(file)}
                    disabled={uploading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Upload Guidelines */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Upload Guidelines:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <li>Upload 20-50 representative documents for best results</li>
          <li>Ensure documents are clear and readable</li>
          <li>Include diverse examples of your document type</li>
          <li>Each document should be under 10MB</li>
          <li>Supported formats: PDF, PNG, JPG, JPEG, TIFF</li>
        </Box>
      </Alert>

      {files.length > 0 && (
        <Box mt={3}>
          <Typography variant="body2" color="textSecondary">
            Progress: {uploadedCount} of {totalCount} files uploaded
            {uploadedCount === totalCount && uploadedCount > 0 && (
              <Chip label="All files uploaded!" color="success" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Preview: {previewFile?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {previewFile && (
            <DocumentViewer
              documentUrl={previewFile.preview}
              documentName={previewFile.name}
              height="100%"
              width="100%"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step2UploadDocuments;