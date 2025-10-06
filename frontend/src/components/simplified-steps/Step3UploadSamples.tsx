import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const Step3UploadSamples: React.FC<Props> = ({ data, updateData }) => {
  const [documents, setDocuments] = React.useState(data.documents || []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newDocs = acceptedFiles.map((file) => ({
        id: Date.now().toString() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded: true,
      }));
      const updated = [...documents, ...newDocs];
      setDocuments(updated);
      updateData({ documents: updated });
    },
    [documents, updateData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    multiple: true,
  });

  const handleRemove = (id: string) => {
    const updated = documents.filter((doc: any) => doc.id !== id);
    setDocuments(updated);
    updateData({ documents: updated });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const minDocuments = 5;
  const progress = Math.min((documents.length / minDocuments) * 100, 100);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Upload Sample Documents
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload at least {minDocuments} sample documents for training. More documents = better accuracy.
      </Typography>

      {/* Upload Progress */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: documents.length >= minDocuments ? 'success.lighter' : 'warning.lighter' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">
            Documents Uploaded: {documents.length} / {minDocuments}
          </Typography>
          <Typography variant="subtitle2" color={documents.length >= minDocuments ? 'success.main' : 'warning.main'}>
            {progress.toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} color={documents.length >= minDocuments ? 'success' : 'warning'} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>

      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 6,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'primary.lighter' : 'background.default',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          or
        </Typography>
        <Button variant="contained" component="span">
          Browse Files
        </Button>
        <Typography variant="caption" display="block" mt={2} color="textSecondary">
          Supported formats: PDF, PNG, JPG, JPEG, TIFF
        </Typography>
      </Paper>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Uploaded Documents
          </Typography>
          <Paper variant="outlined">
            <List>
              {documents.map((doc: any, index: number) => (
                <ListItem
                  key={doc.id}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => handleRemove(doc.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    borderBottom: index < documents.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">{doc.name}</Typography>
                        <Chip icon={<CheckIcon />} label="Ready" size="small" color="success" />
                      </Box>
                    }
                    secondary={formatFileSize(doc.size)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Guidance */}
      {documents.length > 0 && documents.length < minDocuments && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.lighter' }}>
          <Typography variant="body2" color="info.dark">
            💡 Upload {minDocuments - documents.length} more document{minDocuments - documents.length > 1 ? 's' : ''} to continue
          </Typography>
        </Paper>
      )}

      {documents.length >= minDocuments && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.lighter' }}>
          <Typography variant="body2" color="success.dark">
            ✓ Great! You have enough documents to start training. You can add more for better accuracy.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Step3UploadSamples;
