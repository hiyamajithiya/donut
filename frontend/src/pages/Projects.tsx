import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Fab,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timeline as AnalyticsIcon,
  Description as DocumentIcon,
  ModelTraining as TrainingIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { wizardAPI } from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
  documentType: string;
  status: 'active' | 'completed' | 'training' | 'idle' | 'error';
  progress: number;
  documentsCount: number;
  processedCount: number;
  successRate: number;
  accuracy?: number;
  createdAt: string;
  lastActivity: string;
  estimatedCompletion?: string;
  modelVersion?: string;
}

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    documentType: '',
  });

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await wizardAPI.getModels();

        // Transform API response to Project format
        const transformedProjects: Project[] = response.data.models.map((model: any) => ({
          id: model.id,
          name: model.name,
          description: model.description || 'No description',
          documentType: model.document_type_display || model.document_type,
          status: model.status === 'active' ? 'completed' : model.status,
          progress: model.status === 'active' ? 100 : 0,
          documentsCount: 0,
          processedCount: 0,
          successRate: model.field_accuracy || 0,
          accuracy: model.field_accuracy,
          createdAt: model.created_at,
          lastActivity: new Date(model.updated_at).toLocaleString(),
          modelVersion: model.version,
        }));

        setProjects(transformedProjects);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch models:', err);
        setError(err.response?.data?.error || 'Failed to load projects');
        // If API fails, set empty array (no fallback to mock data)
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    if (newProject.name && newProject.description && newProject.documentType) {
      const project: Project = {
        id: Date.now().toString(),
        name: newProject.name,
        description: newProject.description,
        documentType: newProject.documentType,
        status: 'idle',
        progress: 0,
        documentsCount: 0,
        processedCount: 0,
        successRate: 0,
        createdAt: new Date().toISOString(),
        lastActivity: 'Just created',
      };
      setProjects([...projects, project]);
      setNewProject({ name: '', description: '', documentType: '' });
      setCreateDialogOpen(false);
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
      case 'training':
        return 'info';
      case 'idle':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon />;
      case 'active':
      case 'training':
        return <TrainingIcon />;
      case 'idle':
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
      year: 'numeric',
    });
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Project Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your document processing projects and training pipelines
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/training')}
        >
          Create Project
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DocumentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {projects.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrainingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {projects.filter(p => ['active', 'training'].includes(p.status)).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SuccessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {projects.filter(p => p.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'text.secondary' }}>
                  <AnalyticsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {Math.round(projects.reduce((acc, p) => acc + p.successRate, 0) / projects.length)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: getStatusColor(project.status) + '.main' }}>
                      {getStatusIcon(project.status)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        size="small"
                        color={getStatusColor(project.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, project)}
                    size="small"
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="textSecondary" mb={2}>
                  {project.description}
                </Typography>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {project.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    color={getStatusColor(project.status) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Documents
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {project.processedCount}/{project.documentsCount}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Success Rate
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {project.successRate}%
                    </Typography>
                  </Grid>
                </Grid>

                {project.accuracy && (
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Model Accuracy
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {project.accuracy}%
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Created: {formatDate(project.createdAt)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {project.lastActivity}
                  </Typography>
                </Box>

                {project.estimatedCompletion && project.status !== 'completed' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      Est. completion: {formatDate(project.estimatedCompletion)}
                    </Typography>
                  </Alert>
                )}
              </CardContent>

              <Box p={2} pt={0}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 4 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      View
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<AnalyticsIcon />}
                      onClick={() => navigate(`/analytics?project=${project.id}`)}
                    >
                      Analytics
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    {project.status === 'idle' ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<StartIcon />}
                        color="success"
                      >
                        Start
                      </Button>
                    ) : project.status === 'active' ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<PauseIcon />}
                        color="warning"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/projects/${selectedProject?.id}`)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Project
        </MenuItem>
        <MenuItem onClick={() => navigate(`/analytics?project=${selectedProject?.id}`)}>
          <AnalyticsIcon fontSize="small" sx={{ mr: 1 }} />
          View Analytics
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Project
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={newProject.documentType}
                onChange={(e) => setNewProject({ ...newProject, documentType: e.target.value })}
                label="Document Type"
              >
                <MenuItem value="Invoice">Invoice</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Receipt">Receipt</MenuItem>
                <MenuItem value="Form">Form</MenuItem>
                <MenuItem value="Report">Report</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;