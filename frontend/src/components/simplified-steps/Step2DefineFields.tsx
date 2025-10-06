import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';

interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
}

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const Step2DefineFields: React.FC<Props> = ({ data, updateData }) => {
  const [fields, setFields] = useState<Field[]>(data.fields || []);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'boolean'>('text');

  // Common field templates based on document type
  const getFieldTemplates = () => {
    switch (data.documentType) {
      case 'invoice':
        return [
          { name: 'Invoice Number', type: 'text' },
          { name: 'Invoice Date', type: 'date' },
          { name: 'Vendor Name', type: 'text' },
          { name: 'Total Amount', type: 'number' },
          { name: 'Tax Amount', type: 'number' },
          { name: 'Due Date', type: 'date' },
        ];
      case 'bank_statement':
        return [
          { name: 'Account Number', type: 'text' },
          { name: 'Account Holder', type: 'text' },
          { name: 'Statement Period', type: 'text' },
          { name: 'Opening Balance', type: 'number' },
          { name: 'Closing Balance', type: 'number' },
        ];
      case 'receipt':
        return [
          { name: 'Merchant Name', type: 'text' },
          { name: 'Purchase Date', type: 'date' },
          { name: 'Total Amount', type: 'number' },
          { name: 'Payment Method', type: 'text' },
        ];
      default:
        return [];
    }
  };

  const handleAddField = () => {
    if (newFieldName.trim()) {
      const newField: Field = {
        id: Date.now().toString(),
        name: newFieldName,
        type: newFieldType,
        required: true,
      };
      const updatedFields = [...fields, newField];
      setFields(updatedFields);
      updateData({ fields: updatedFields });
      setNewFieldName('');
    }
  };

  const handleRemoveField = (id: string) => {
    const updatedFields = fields.filter((f) => f.id !== id);
    setFields(updatedFields);
    updateData({ fields: updatedFields });
  };

  const handleUseTemplate = () => {
    const templates = getFieldTemplates();
    const templateFields: Field[] = templates.map((t, index) => ({
      id: `template-${index}`,
      name: t.name,
      type: t.type as any,
      required: true,
    }));
    setFields(templateFields);
    updateData({ fields: templateFields });
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Define Fields to Extract
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Specify the data fields you want to extract from your documents
      </Typography>

      {/* Quick Template */}
      {getFieldTemplates().length > 0 && fields.length === 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Quick Start
          </Typography>
          <Typography variant="body2" paragraph>
            Use our recommended fields for {data.documentType?.replace('_', ' ')} documents
          </Typography>
          <Button variant="contained" size="small" onClick={handleUseTemplate}>
            Use Template Fields
          </Button>
        </Paper>
      )}

      {/* Add New Field */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Add Field
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Field Name"
              placeholder="e.g., Invoice Number"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Field Type</InputLabel>
              <Select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)} label="Field Type">
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="boolean">Yes/No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleAddField}>
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Fields List */}
      {fields.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Fields to Extract ({fields.length})
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {fields.map((field, index) => (
              <Paper
                key={field.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <DragIcon sx={{ color: 'text.disabled', cursor: 'grab' }} />
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {index + 1}. {field.name}
                    </Typography>
                    <Chip label={field.type} size="small" variant="outlined" />
                    {field.required && <Chip label="Required" size="small" color="primary" />}
                  </Box>
                </Box>
                <IconButton size="small" color="error" onClick={() => handleRemoveField(field.id)}>
                  <DeleteIcon />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Validation Message */}
      {fields.length === 0 && (
        <Paper sx={{ p: 3, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main' }}>
          <Typography variant="body2" color="warning.dark">
            ⚠ Please add at least one field to extract
          </Typography>
        </Paper>
      )}

      {fields.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.lighter' }}>
          <Typography variant="body2" color="success.dark">
            ✓ {fields.length} field{fields.length > 1 ? 's' : ''} configured
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Step2DefineFields;
