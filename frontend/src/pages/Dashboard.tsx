import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CardActionArea,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { wizardAPI } from '../services/api';

interface Model {
  id: string;
  name: string;
  documentType: string;
  status: 'active' | 'training' | 'draft' | 'error';
  documentsCount: number;
  accuracy?: number;
  lastTrained?: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await wizardAPI.getModels();

        // Transform API response to Model format
        const transformedModels: Model[] = response.data.models.map((model: any) => ({
          id: model.id,
          name: model.name,
          documentType: model.document_type_display || model.document_type,
          status: model.status === 'active' ? 'active' : model.status === 'testing' ? 'training' : 'draft',
          documentsCount: 0, // Will be populated from training job data
          accuracy: model.field_accuracy,
          lastTrained: model.updated_at ? new Date(model.updated_at).toLocaleDateString() : undefined,
          createdAt: new Date(model.created_at).toLocaleDateString(),
        }));

        setModels(transformedModels);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch models:', err);
        setError(err.response?.data?.error || 'Failed to load models');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'warning';
      case 'draft':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon fontSize="small" />;
      case 'training':
        return <ScheduleIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return <DocumentIcon fontSize="small" />;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Document Extraction Models
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage your custom document extraction models
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/upload')}
          sx={{ px: 4, py: 1.5 }}
        >
          Create New Model
        </Button>
      </Box>

      {/* Models Grid */}
      <Grid container spacing={3}>
        {/* Create New Model Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 280,
              border: '2px dashed',
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            }}
          >
            <CardActionArea
              sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => navigate('/upload')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Create New Model
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Start training a new document extraction model
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Existing Models */}
        {models.map((model) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={model.id}>
            <Card
              sx={{
                height: '100%',
                minHeight: 280,
                position: 'relative',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <CardActionArea onClick={() => navigate(`/projects/${model.id}`)}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Status Badge */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip
                      icon={getStatusIcon(model.status)}
                      label={model.status.toUpperCase()}
                      color={getStatusColor(model.status) as any}
                      size="small"
                    />
                    <DocumentIcon color="action" />
                  </Box>

                  {/* Model Name */}
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {model.name}
                  </Typography>

                  {/* Document Type */}
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {model.documentType}
                  </Typography>

                  {/* Stats */}
                  <Box mt="auto" pt={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Training Documents
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {model.documentsCount}
                      </Typography>
                    </Box>

                    {model.accuracy && (
                      <>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Accuracy
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {model.accuracy}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={model.accuracy}
                          color="success"
                          sx={{ height: 6, borderRadius: 3, mb: 2 }}
                        />
                      </>
                    )}

                    {model.lastTrained && (
                      <Typography variant="caption" color="textSecondary">
                        Last trained: {model.lastTrained}
                      </Typography>
                    )}

                    {model.status === 'draft' && (
                      <Typography variant="caption" color="warning.main">
                        Ready for training
                      </Typography>
                    )}

                    {model.status === 'training' && (
                      <Box mt={1}>
                        <Typography variant="caption" color="textSecondary" gutterBottom>
                          Training in progress...
                        </Typography>
                        <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Getting Started Guide */}
      {models.length === 0 && (
        <Box mt={4}>
          <Card sx={{ bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Getting Started
              </Typography>
              <Typography variant="body2" paragraph>
                Create your first document extraction model in a few simple steps:
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <li>
                  <Typography variant="body2">Choose the type of document you want to extract data from</Typography>
                </li>
                <li>
                  <Typography variant="body2">Define the fields you want to extract</Typography>
                </li>
                <li>
                  <Typography variant="body2">Upload sample documents (minimum 5)</Typography>
                </li>
                <li>
                  <Typography variant="body2">Annotate fields by selecting them in your documents</Typography>
                </li>
                <li>
                  <Typography variant="body2">Train the model and test with new documents</Typography>
                </li>
              </Box>
              <Box mt={2}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/upload')}>
                  Create Your First Model
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
