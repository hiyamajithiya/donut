import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  ModelTraining as TrainingIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DocumentProgress {
  id: string;
  name: string;
  type: string;
  status: 'uploaded' | 'processing' | 'labeled' | 'trained' | 'error';
  progress: number;
  accuracy?: number;
  uploadedAt: string;
  lastUpdated: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  documentsCount: number;
  successRate: number;
  status: 'active' | 'completed' | 'training' | 'idle';
  lastActivity: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real app, this would come from API
  const [stats] = useState({
    totalDocuments: 2847,
    processedDocuments: 2234,
    successRate: 94.2,
    activeProjects: 12,
    modelsInTraining: 3,
    avgProcessingTime: '2.4 min',
  });

  const [recentDocuments] = useState<DocumentProgress[]>([
    {
      id: '1',
      name: 'Invoice_2024_001.pdf',
      type: 'Invoice',
      status: 'trained',
      progress: 100,
      accuracy: 96.5,
      uploadedAt: '2024-01-15T10:30:00Z',
      lastUpdated: '2024-01-15T14:22:00Z',
    },
    {
      id: '2',
      name: 'Contract_ABC_Corp.pdf',
      type: 'Contract',
      status: 'processing',
      progress: 65,
      uploadedAt: '2024-01-15T11:15:00Z',
      lastUpdated: '2024-01-15T14:20:00Z',
    },
    {
      id: '3',
      name: 'Receipt_Store_123.jpg',
      type: 'Receipt',
      status: 'labeled',
      progress: 80,
      accuracy: 89.2,
      uploadedAt: '2024-01-15T09:45:00Z',
      lastUpdated: '2024-01-15T13:10:00Z',
    },
    {
      id: '4',
      name: 'Form_Application.pdf',
      type: 'Form',
      status: 'error',
      progress: 30,
      uploadedAt: '2024-01-15T08:20:00Z',
      lastUpdated: '2024-01-15T12:50:00Z',
    },
  ]);

  const [activeProjects] = useState<ProjectSummary[]>([
    {
      id: '1',
      name: 'Invoice Processing System',
      documentsCount: 1250,
      successRate: 97.8,
      status: 'active',
      lastActivity: '2 hours ago',
    },
    {
      id: '2',
      name: 'Contract Analysis Pipeline',
      documentsCount: 450,
      successRate: 92.1,
      status: 'training',
      lastActivity: '30 minutes ago',
    },
    {
      id: '3',
      name: 'Receipt Digitization',
      documentsCount: 890,
      successRate: 95.4,
      status: 'completed',
      lastActivity: '1 day ago',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trained':
      case 'completed':
      case 'active':
        return 'success';
      case 'processing':
      case 'training':
        return 'info';
      case 'labeled':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trained':
      case 'completed':
        return <SuccessIcon />;
      case 'processing':
      case 'training':
        return <PendingIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor your document processing pipeline and training progress
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <RefreshIcon className="animate-spin" /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/upload')}
          >
            Upload Documents
          </Button>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DocumentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDocuments.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Documents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SuccessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.processedDocuments.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Processed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.successRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrainingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.modelsInTraining}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Training
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeProjects}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'text.secondary' }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.avgProcessingTime}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Processing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Documents */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Documents
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/documents')}
                  endIcon={<ViewIcon />}
                >
                  View All
                </Button>
              </Box>

              <List>
                {recentDocuments.map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    <ListItem
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {getStatusIcon(doc.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {doc.name}
                            </Typography>
                            <Chip
                              label={doc.status}
                              size="small"
                              color={getStatusColor(doc.status) as any}
                              variant="outlined"
                            />
                            <Chip
                              label={doc.type}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="caption" color="textSecondary">
                                Progress: {doc.progress}%
                                {doc.accuracy && ` • Accuracy: ${doc.accuracy}%`}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Updated: {formatDate(doc.lastUpdated)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={doc.progress}
                              color={getStatusColor(doc.status) as any}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {doc.status === 'error' && (
                          <Tooltip title="Retry Processing">
                            <IconButton size="small" color="primary">
                              <StartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Projects */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Active Projects
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/projects')}
                  endIcon={<ViewIcon />}
                >
                  View All
                </Button>
              </Box>

              <List>
                {activeProjects.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {project.name}
                            </Typography>
                            <Chip
                              label={project.status}
                              size="small"
                              color={getStatusColor(project.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {project.documentsCount} documents • {project.successRate}% success
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Last activity: {project.lastActivity}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < activeProjects.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<StartIcon />}
                  onClick={() => navigate('/projects/new')}
                >
                  Create New Project
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => navigate('/upload')}
                >
                  Upload New Documents
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrainingIcon />}
                  onClick={() => navigate('/training')}
                >
                  Start Training
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status Alert */}
      <Box mt={3}>
        <Alert severity="info" icon={<PendingIcon />}>
          <Typography variant="subtitle2" fontWeight="bold">
            System Status: All services operational
          </Typography>
          <Typography variant="body2">
            Processing queue: 45 documents • Average processing time: {stats.avgProcessingTime}
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default Dashboard;