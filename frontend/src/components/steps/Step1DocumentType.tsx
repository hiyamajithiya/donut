import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { DocumentType } from '../../types';
import { documentTypesAPI } from '../../services/api';
import { useWizard } from '../../contexts/WizardContext';

const predefinedDocTypes = [
  {
    name: 'Invoice',
    description: 'Commercial invoices with vendor and line item details',
    sample_fields: ['invoice_number', 'date', 'vendor_name', 'total_amount', 'line_items'],
  },
  {
    name: 'Receipt',
    description: 'Purchase receipts from retail transactions',
    sample_fields: ['merchant_name', 'date', 'total_amount', 'items', 'payment_method'],
  },
  {
    name: 'Bank Statement',
    description: 'Financial statements showing account transactions',
    sample_fields: ['account_number', 'statement_period', 'balance', 'transactions'],
  },
  {
    name: 'Tax Document',
    description: 'Tax forms and related documentation',
    sample_fields: ['tax_year', 'form_type', 'taxpayer_id', 'income', 'deductions'],
  },
  {
    name: 'Contract',
    description: 'Legal contracts and agreements',
    sample_fields: ['parties', 'effective_date', 'terms', 'signatures', 'jurisdiction'],
  },
  {
    name: 'Financial Report',
    description: 'Corporate financial statements and reports',
    sample_fields: ['report_type', 'period', 'revenue', 'expenses', 'net_income'],
  },
  {
    name: 'Audit Report',
    description: 'Audit findings and recommendations',
    sample_fields: ['audit_period', 'auditor', 'findings', 'recommendations', 'status'],
  },
  {
    name: 'Compliance Document',
    description: 'Regulatory compliance forms and certificates',
    sample_fields: ['regulation', 'compliance_period', 'status', 'authority', 'expiry_date'],
  },
  {
    name: 'Business License',
    description: 'Business registration and licensing documents',
    sample_fields: ['license_type', 'business_name', 'license_number', 'issue_date', 'expiry_date'],
  },
];

const Step1DocumentType: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customDocType, setCustomDocType] = useState({
    name: '',
    description: '',
    sample_fields: [''],
  });

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await documentTypesAPI.getAll();
      setDocumentTypes(response.data);
    } catch (err) {
      console.error('Failed to load document types:', err);
      setError('Failed to load document types. Using predefined types.');
      // Use predefined types as fallback
      setDocumentTypes(predefinedDocTypes.map((type, index) => ({
        id: `predefined-${index}`,
        ...type,
        created_at: new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocumentType = (docType: DocumentType) => {
    dispatch({ type: 'SET_DOCUMENT_TYPE', payload: docType });
  };

  const handleCreateCustomType = () => {
    setShowCustomDialog(true);
  };

  const handleSaveCustomType = () => {
    const newDocType: DocumentType = {
      id: `custom-${Date.now()}`,
      name: customDocType.name,
      description: customDocType.description,
      sample_fields: customDocType.sample_fields.filter(field => field.trim() !== ''),
      created_at: new Date().toISOString(),
    };

    setDocumentTypes(prev => [...prev, newDocType]);
    dispatch({ type: 'SET_DOCUMENT_TYPE', payload: newDocType });
    setShowCustomDialog(false);
    setCustomDocType({ name: '', description: '', sample_fields: [''] });
  };

  const handleAddField = () => {
    setCustomDocType(prev => ({
      ...prev,
      sample_fields: [...prev.sample_fields, ''],
    }));
  };

  const handleFieldChange = (index: number, value: string) => {
    setCustomDocType(prev => ({
      ...prev,
      sample_fields: prev.sample_fields.map((field, i) =>
        i === index ? value : field
      ),
    }));
  };

  const handleRemoveField = (index: number) => {
    setCustomDocType(prev => ({
      ...prev,
      sample_fields: prev.sample_fields.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading document types...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Document Type
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Choose the type of documents you want to train the model to understand.
        This will help optimize the model for your specific use case.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {documentTypes.map((docType) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={docType.id}>
            <Card
              variant={state.selectedDocumentType?.id === docType.id ? "elevation" : "outlined"}
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: state.selectedDocumentType?.id === docType.id ? 2 : 1,
                borderColor: state.selectedDocumentType?.id === docType.id ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => handleSelectDocumentType(docType)}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    {docType.name}
                  </Typography>
                  {state.selectedDocumentType?.id === docType.id && (
                    <CheckIcon color="primary" sx={{ ml: 'auto' }} />
                  )}
                </Box>

                <Typography variant="body2" color="textSecondary" paragraph>
                  {docType.description}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Sample Fields:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {docType.sample_fields.slice(0, 3).map((field, index) => (
                    <Chip
                      key={index}
                      label={field}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {docType.sample_fields.length > 3 && (
                    <Chip
                      label={`+${docType.sample_fields.length - 3} more`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Custom Document Type Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={handleCreateCustomType}
          >
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}>
              <AddIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Create Custom Type
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Define your own document type with custom fields
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Custom Document Type Dialog */}
      <Dialog open={showCustomDialog} onClose={() => setShowCustomDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Custom Document Type</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Document Type Name"
              value={customDocType.name}
              onChange={(e) => setCustomDocType(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={customDocType.description}
              onChange={(e) => setCustomDocType(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              required
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Sample Fields
              </Typography>
              {customDocType.sample_fields.map((field, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    value={field}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    placeholder={`Field ${index + 1}`}
                    size="small"
                    fullWidth
                  />
                  {customDocType.sample_fields.length > 1 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveField(index)}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddField}
                size="small"
              >
                Add Field
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveCustomType}
            variant="contained"
            disabled={!customDocType.name || !customDocType.description}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step1DocumentType;