import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import { documentsAPI } from '../../services/api';
import { Document, DocumentLabel } from '../../types';
import DocumentViewer from '../DocumentViewer';
import { useDebounce, useMemoizedCalculation } from '../../hooks/usePerformanceOptimization';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Step4AnnotateDocuments: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [labelData, setLabelData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [labeledDocuments, setLabeledDocuments] = useState<DocumentLabel[]>([]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getAll();
      const filteredDocs = response.data.filter(
        doc => doc.document_type === state.selectedDocumentType?.id
      );
      setDocuments(filteredDocs);
      if (filteredDocs.length > 0) {
        setSelectedDoc(filteredDocs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [state.selectedDocumentType]);

  const initializeLabelData = useCallback(() => {
    if (!state.selectedDocumentType?.sample_fields) return;

    const initialData: Record<string, any> = {};
    state.selectedDocumentType.sample_fields.forEach(field => {
      initialData[field] = '';
    });
    setLabelData(initialData);
  }, [state.selectedDocumentType]);

  useEffect(() => {
    if (state.createdDataset) {
      loadDocuments();
    }
  }, [state.createdDataset, loadDocuments]);

  useEffect(() => {
    if (state.selectedDocumentType?.sample_fields && documents.length > 0) {
      initializeLabelData();
    }
  }, [state.selectedDocumentType, documents, initializeLabelData]);

  const debouncedFieldChange = useCallback((fieldName: string, value: any) => {
    setLabelData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const handleFieldChange = useDebounce(debouncedFieldChange, 300);

  const handleSaveLabel = async () => {
    if (!selectedDoc) return;

    try {
      setSaving(true);
      await documentsAPI.label(selectedDoc.id, labelData);

      const newLabel: DocumentLabel = {
        id: `label-${selectedDoc.id}`,
        document: selectedDoc.id,
        label_data: labelData,
        labeled_by: 'current_user', // This should come from auth context
        created_at: new Date().toISOString(),
      };

      setLabeledDocuments(prev => {
        const updated = prev.filter(label => label.document !== selectedDoc.id);
        return [...updated, newLabel];
      });

      // Move to next document
      const currentIndex = documents.findIndex(doc => doc.id === selectedDoc.id);
      if (currentIndex < documents.length - 1) {
        setSelectedDoc(documents[currentIndex + 1]);
        initializeLabelData();
      }

    } catch (err) {
      console.error('Failed to save label:', err);
      setError('Failed to save label');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDoc(doc);

    // Load existing label data if available
    const existingLabel = labeledDocuments.find(label => label.document === doc.id);
    if (existingLabel) {
      setLabelData(existingLabel.label_data);
    } else {
      initializeLabelData();
    }
  };

  const getFieldType = (fieldName: string): 'text' | 'number' | 'date' | 'multiline' => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('amount') || lowerField.includes('total') || lowerField.includes('price')) {
      return 'number';
    }
    if (lowerField.includes('date')) {
      return 'date';
    }
    if (lowerField.includes('description') || lowerField.includes('notes') || lowerField.includes('address')) {
      return 'multiline';
    }
    return 'text';
  };

  const renderFieldInput = useCallback((fieldName: string) => {
    const fieldType = getFieldType(fieldName);
    const value = labelData[fieldName] || '';

    const commonProps = {
      label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        handleFieldChange(fieldName, e.target.value),
      fullWidth: true,
      margin: 'normal' as const,
    };

    switch (fieldType) {
      case 'number':
        return <TextField {...commonProps} type="number" />;
      case 'date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;
      case 'multiline':
        return <TextField {...commonProps} multiline rows={3} />;
      default:
        return <TextField {...commonProps} />;
    }
  }, [labelData]);

  const progressCalculations = useMemoizedCalculation(() => {
    const labeledCount = labeledDocuments.length;
    const totalCount = documents.length;
    const progress = totalCount > 0 ? (labeledCount / totalCount) * 100 : 0;
    return { labeledCount, totalCount, progress };
  }, [labeledDocuments.length, documents.length]);

  const isDocumentLabeled = useCallback((docId: string) => {
    return labeledDocuments.some(label => label.document === docId);
  }, [labeledDocuments]);

  // Update wizard state
  useEffect(() => {
    dispatch({ type: 'SET_LABELED_DOCUMENTS', payload: labeledDocuments });
  }, [labeledDocuments, dispatch]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Annotate Documents
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Label key fields in your documents to train the model. The more accurately you label,
        the better your model will perform.
      </Typography>

      {!state.createdDataset && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please create a dataset in the previous step.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Progress Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>
                Labeling Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressCalculations.progress}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                {progressCalculations.labeledCount} of {progressCalculations.totalCount} documents labeled ({progressCalculations.progress.toFixed(1)}%)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={`${progressCalculations.totalCount} Total`}
                  variant="outlined"
                />
                <Chip
                  label={`${progressCalculations.labeledCount} Labeled`}
                  color="success"
                  variant={progressCalculations.labeledCount > 0 ? "filled" : "outlined"}
                />
                <Chip
                  label={`${progressCalculations.totalCount - progressCalculations.labeledCount} Remaining`}
                  color="warning"
                  variant={progressCalculations.totalCount - progressCalculations.labeledCount > 0 ? "filled" : "outlined"}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Document List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: 600, overflow: 'auto' }}>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6">Documents</Typography>
            </Box>
            <List>
              {documents.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemButton
                    selected={selectedDoc?.id === doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                  >
                    <ListItemText
                      primary={doc.title}
                      secondary={`${doc.page_count || 1} page(s)`}
                    />
                  </ListItemButton>
                  <ListItemSecondaryAction>
                    {isDocumentLabeled(doc.id) && (
                      <CheckIcon color="success" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Annotation Interface */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedDoc ? (
            <Paper sx={{ height: 600 }}>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                <Tab label="Label Fields" />
                <Tab label="Visual Annotation" />
                <Tab label="Preview" />
              </Tabs>

              <TabPanel value={currentTab} index={0}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Document: {selectedDoc.title}
                  </Typography>

                  {state.selectedDocumentType?.sample_fields?.map((field) => (
                    <Box key={field} mb={2}>
                      {renderFieldInput(field)}
                    </Box>
                  ))}

                  <Box mt={3} display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveLabel}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save & Next'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={initializeLabelData}
                    >
                      Reset
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <Box sx={{ height: 500 }}>
                  <DocumentViewer
                    documentUrl={selectedDoc.file}
                    documentName={selectedDoc.title}
                    showAnnotationTools={true}
                    height={480}
                    onAnnotationChange={(annotations) => {
                      // Convert visual annotations to label data
                      const newLabelData = { ...labelData };
                      annotations.forEach(annotation => {
                        newLabelData[annotation.fieldName] = annotation.text || '';
                      });
                      setLabelData(newLabelData);
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Label Preview
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <pre style={{ fontSize: '14px', margin: 0 }}>
                      {JSON.stringify(labelData, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              </TabPanel>
            </Paper>
          ) : (
            <Paper sx={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">
                Select a document from the list to start labeling
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Labeling Guidelines */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Labeling Guidelines</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Best Practices for Accurate Labeling:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>Be consistent with field formats (e.g., dates, amounts)</li>
              <li>Extract exactly what appears in the document</li>
              <li>Use empty values for fields that don't exist in the document</li>
              <li>For amounts, include currency symbols if present</li>
              <li>For dates, maintain the original format when possible</li>
              <li>Double-check your labels before saving</li>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Field Types:</Typography>
              <Typography variant="body2">
                • <strong>Text fields:</strong> Names, addresses, descriptions<br/>
                • <strong>Number fields:</strong> Amounts, quantities, IDs<br/>
                • <strong>Date fields:</strong> Dates, deadlines, periods<br/>
                • <strong>Multi-line fields:</strong> Long descriptions, notes
              </Typography>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Completion Status */}
      {progressCalculations.labeledCount > 0 && (
        <Alert severity={progressCalculations.labeledCount === progressCalculations.totalCount ? "success" : "info"} sx={{ mt: 3 }}>
          {progressCalculations.labeledCount === progressCalculations.totalCount ? (
            <>
              <Typography variant="subtitle2">All documents labeled!</Typography>
              <Typography variant="body2">
                You've successfully labeled all {progressCalculations.totalCount} documents. You can now proceed to training configuration.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="subtitle2">Good progress!</Typography>
              <Typography variant="body2">
                You've labeled {progressCalculations.labeledCount} out of {progressCalculations.totalCount} documents.
                We recommend labeling at least 80% of your documents for best results.
              </Typography>
            </>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default Step4AnnotateDocuments;