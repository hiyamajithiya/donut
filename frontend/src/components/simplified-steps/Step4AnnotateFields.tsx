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

      <Grid container spacing={3}>
        {/* Document Selector */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Documents ({documents.length})
            </Typography>
            <List dense>
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
          </Paper>
        </Grid>

        {/* Document Preview & Annotation */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, minHeight: 400, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Document Preview - {documents[selectedDocument]?.name}
            </Typography>
            <Box
              sx={{
                mt: 1,
                border: '2px solid',
                borderColor: selectedField ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: 'white',
                minHeight: 500,
                maxHeight: 600,
                overflow: 'auto',
                position: 'relative',
              }}
            >
              {previewUrl ? (
                <>
                  {documents[selectedDocument]?.type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      style={{
                        width: '100%',
                        height: '600px',
                        border: 'none',
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
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  )}
                  {selectedField && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                      }}
                    >
                      <Button variant="contained" size="large" onClick={handleAnnotate}>
                        Mark Selected Field
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 500,
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
            </Box>
            <Box mt={1} textAlign="center">
              {selectedField ? (
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  ✓ Field Selected: {fields.find((f: any) => f.id === selectedField)?.name}
                  <br />
                  Click the button above to mark this field!
                </Typography>
              ) : (
                <Typography variant="caption" color="textSecondary">
                  👉 Select a field from the right panel to start annotating
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Fields Panel */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Fields to Annotate
            </Typography>
            <List dense>
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
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.lighter' }}>
        <Typography variant="body2" fontWeight="bold" color="info.dark" gutterBottom>
          💡 How to Annotate
        </Typography>
        <Typography variant="body2" color="info.dark" component="div">
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Select a field from the right panel</li>
            <li>Click on the corresponding area in the document preview</li>
            <li>Repeat for all fields in each document</li>
            <li>Switch between documents using the left panel</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Step4AnnotateFields;
