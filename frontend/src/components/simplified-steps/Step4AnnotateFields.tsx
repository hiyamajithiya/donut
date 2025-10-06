import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  TouchApp as SelectIcon,
} from '@mui/icons-material';

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const Step4AnnotateFields: React.FC<Props> = ({ data, updateData }) => {
  const [selectedDocument, setSelectedDocument] = useState(0);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState(data.annotations || {});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const documents = data.documents || [];
  const fields = data.fields || [];

  // Debug: Log data on component mount
  useEffect(() => {
    console.log('Step4 - Documents:', documents.length, documents);
    console.log('Step4 - Fields:', fields.length, fields);
    console.log('Step4 - Annotations:', annotations);
  }, []);

  // Generate preview URL for the selected document
  useEffect(() => {
    const currentDoc = documents[selectedDocument];
    if (currentDoc && currentDoc.file) {
      const url = URL.createObjectURL(currentDoc.file);
      setPreviewUrl(url);

      // Cleanup old URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedDocument, documents]);

  const handleFieldSelect = (fieldId: string) => {
    console.log('Field selected:', fieldId);
    console.log('Current selectedField:', selectedField);
    setSelectedField(fieldId);
  };

  const handleAnnotate = () => {
    console.log('Handle annotate clicked');
    console.log('Selected field:', selectedField);
    console.log('Selected document:', documents[selectedDocument]);

    if (selectedField && documents[selectedDocument]) {
      const docId = documents[selectedDocument].id;
      console.log('Annotating docId:', docId, 'fieldId:', selectedField);

      // Create a new annotations object without mutating the original
      const newAnnotations = {
        ...annotations,
        [docId]: {
          ...(annotations[docId] || {}),
          [selectedField]: { annotated: true, area: {}, timestamp: Date.now() },
        },
      };

      console.log('New annotations:', newAnnotations);
      setAnnotations(newAnnotations);
      updateData({ annotations: newAnnotations });

      // Clear selection after successful annotation
      setSelectedField(null);
    } else {
      console.log('Cannot annotate - missing selectedField or document');
    }
  };

  const isFieldAnnotated = (docId: string, fieldId: string) => {
    return annotations[docId]?.[fieldId]?.annotated;
  };

  const getAnnotationProgress = () => {
    let total = documents.length * fields.length;
    let annotated = 0;
    documents.forEach((doc: any) => {
      fields.forEach((field: any) => {
        if (isFieldAnnotated(doc.id, field.id)) {
          annotated++;
        }
      });
    });
    return total > 0 ? (annotated / total) * 100 : 0;
  };

  const progress = getAnnotationProgress();
  const minProgress = 80;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Annotate Fields
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Select and map each field in your sample documents. This teaches the model where to find the data.
      </Typography>

      {/* Progress */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: progress >= minProgress ? 'success.lighter' : 'warning.lighter' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">
            Annotation Progress
          </Typography>
          <Typography variant="subtitle2" color={progress >= minProgress ? 'success.main' : 'warning.main'}>
            {progress.toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} color={progress >= minProgress ? 'success' : 'warning'} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption" color="textSecondary" mt={1} display="block">
          {progress >= minProgress ? '✓ Ready to train!' : `Annotate at least ${minProgress}% to continue`}
        </Typography>
      </Paper>

      <Box display="flex" gap={2} sx={{ height: 'calc(100vh - 350px)', minHeight: 700 }}>
        {/* Left Sidebar - Documents & Fields */}
        <Paper sx={{ width: 280, flexShrink: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
          {/* Document Selector */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Documents ({documents.length})
            </Typography>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {documents.map((doc: any, index: number) => (
                <ListItem key={doc.id} sx={{ p: 0 }}>
                  <ListItemButton
                    selected={selectedDocument === index}
                    onClick={() => setSelectedDocument(index)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: selectedDocument === index ? 'primary.lighter' : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={`Doc ${index + 1}`}
                      secondary={doc.name.substring(0, 20) + '...'}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          {/* Fields Panel */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Fields to Annotate
            </Typography>
            <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
              {fields.map((field: any) => {
                const isAnnotated = isFieldAnnotated(documents[selectedDocument]?.id, field.id);
                return (
                  <ListItem key={field.id} sx={{ p: 0 }}>
                    <ListItemButton
                      selected={selectedField === field.id}
                      onClick={() => handleFieldSelect(field.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: isAnnotated ? 'success.lighter' : selectedField === field.id ? 'primary.lighter' : 'transparent',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        {isAnnotated ? <CheckIcon fontSize="small" color="success" /> : <UncheckedIcon fontSize="small" />}
                        <ListItemText
                          primary={field.name}
                          secondary={field.type}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </Box>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>

        {/* Main Preview Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Document Preview
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <Chip
                label={documents[selectedDocument]?.name || 'No document'}
                color="primary"
                variant="outlined"
              />
              {selectedField && (
                <Button variant="contained" size="large" onClick={handleAnnotate}>
                  Mark Selected Field
                </Button>
              )}
            </Box>
          </Paper>

          {/* Document Viewer - Full Height */}
          <Paper
            sx={{
              flexGrow: 1,
              border: '2px solid',
              borderColor: selectedField ? 'primary.main' : 'divider',
              bgcolor: 'white',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {previewUrl ? (
              <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
                {documents[selectedDocument]?.type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '800px',
                      border: 'none',
                      display: 'block',
                    }}
                    title="Document Preview"
                  />
                ) : (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Document Preview"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <SelectIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="body2" color="textSecondary">
                  No document available
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Please upload documents in Step 3
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Status Message */}
          <Paper sx={{ mt: 2, p: 2, bgcolor: selectedField ? 'primary.lighter' : 'grey.100', textAlign: 'center' }}>
            {selectedField ? (
              <Box>
                <Typography variant="body1" color="primary.main" fontWeight="bold">
                  ✓ Field Selected: {fields.find((f: any) => f.id === selectedField)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Click the "Mark Selected Field" button in the header to annotate this field
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                👉 Select a field from the left sidebar to start annotating
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.lighter' }}>
        <Typography variant="body2" fontWeight="bold" color="info.dark" gutterBottom>
          💡 How to Annotate
        </Typography>
        <Typography variant="body2" color="info.dark" component="div">
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Select a document from the left sidebar</li>
            <li>Choose a field to annotate from the fields list</li>
            <li>Click the "Mark Selected Field" button in the document preview</li>
            <li>Repeat for all fields across all documents</li>
            <li>Progress will be tracked automatically - aim for at least 80% completion</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Step4AnnotateFields;
