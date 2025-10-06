import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { apiKeysAPI } from '../services/api';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit: number;
  total_requests: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  allowed_models_count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch API keys
  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysAPI.getAPIKeys();
      setApiKeys(response.data.api_keys);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      setError(err.response?.data?.error || 'Failed to load API keys');
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      if (!newKeyName.trim()) {
        setError('Please enter a name for the API key');
        return;
      }

      const response = await apiKeysAPI.createAPIKey({
        name: newKeyName,
        rate_limit: 1000,
      });

      setNewApiKey(response.data.api_key);
      setNewKeyName('');
      setError(null);
      fetchAPIKeys();
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiKeysAPI.deleteAPIKey(keyId);
      setError(null);
      fetchAPIKeys();
    } catch (err: any) {
      console.error('Failed to delete API key:', err);
      setError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    try {
      await apiKeysAPI.updateAPIKey(keyId, !currentStatus);
      setError(null);
      fetchAPIKeys();
    } catch (err: any) {
      console.error('Failed to update API key:', err);
      setError(err.response?.data?.error || 'Failed to update API key');
    }
  };

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCloseNewKeyDialog = () => {
    setNewApiKey(null);
    setShowNewKey(false);
    setCopiedKey(false);
    setCreateDialogOpen(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your API keys and integration settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<KeyIcon />} iconPosition="start" label="API Keys" />
          <Tab icon={<CodeIcon />} iconPosition="start" label="Developer Docs" />
        </Tabs>
      </Box>

      {/* API Keys Tab */}
      <TabPanel value={tabValue} index={0}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Your API Keys
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create New Key
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <KeyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No API Keys Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  Create an API key to start using your models in external applications
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First API Key
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Rate Limit</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {key.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {key.key_prefix}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={key.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={key.is_active ? 'Active' : 'Inactive'}
                        color={key.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {key.total_requests.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {key.rate_limit}/hr
                    </TableCell>
                    <TableCell>
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={key.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(key.id, key.is_active)}
                        >
                          {key.is_active ? <InactiveIcon /> : <ActiveIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteKey(key.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Developer Docs Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Using the API
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Use your API key to make requests to the Donut Trainer inference API from your applications.
                </Typography>

                <Typography variant="subtitle2" fontWeight="bold" mt={3} mb={1}>
                  1. Authentication
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  Authorization: Bearer YOUR_API_KEY
                </Paper>

                <Typography variant="subtitle2" fontWeight="bold" mt={3} mb={1}>
                  2. Get Available Models
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem', mb: 1 }}>
                  GET http://localhost:8000/api/inference/
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
{`curl -X GET http://localhost:8000/api/inference/ \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </Paper>

                <Typography variant="subtitle2" fontWeight="bold" mt={3} mb={1}>
                  3. Extract Data from Document
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem', mb: 1 }}>
                  POST http://localhost:8000/api/inference/
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
{`curl -X POST http://localhost:8000/api/inference/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "model_id=YOUR_MODEL_ID" \\
  -F "document=@/path/to/document.pdf"`}
                </Paper>

                <Typography variant="subtitle2" fontWeight="bold" mt={3} mb={1}>
                  Response Format
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
{`{
  "document_type": "invoice",
  "model_id": "uuid",
  "model_name": "Invoice Extractor",
  "extracted_fields": {
    "invoice_number": "INV-001",
    "date": "2024-01-15",
    "total": "1,234.56"
  },
  "confidence_scores": {
    "invoice_number": 0.95,
    "date": 0.92,
    "total": 0.88
  },
  "inference_time_ms": 250
}`}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create API Key Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !newApiKey && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {newApiKey ? 'API Key Created' : 'Create New API Key'}
        </DialogTitle>
        <DialogContent>
          {newApiKey ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Make sure to copy your API key now. You won't be able to see it again!
              </Alert>
              <TextField
                fullWidth
                label="Your API Key"
                value={newApiKey}
                type={showNewKey ? 'text' : 'password'}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewKey(!showNewKey)} edge="end">
                        {showNewKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      <IconButton onClick={handleCopyKey} edge="end">
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ fontFamily: 'monospace' }}
              />
              {copiedKey && (
                <Typography variant="caption" color="success.main" display="block" mt={1}>
                  ✓ Copied to clipboard!
                </Typography>
              )}
            </Box>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="API Key Name"
              fullWidth
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production App, Mobile App"
              helperText="Choose a descriptive name to identify this key"
            />
          )}
        </DialogContent>
        <DialogActions>
          {newApiKey ? (
            <Button onClick={handleCloseNewKeyDialog} variant="contained">
              Done
            </Button>
          ) : (
            <>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateKey} variant="contained">
                Create
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
