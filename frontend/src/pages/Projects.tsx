import React, { useState } from 'react';
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
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Invoice Processing System',
      description: 'Automated invoice data extraction and validation',
      documentType: 'Invoice',
      status: 'active',
      progress: 85,
      documentsCount: 1250,
      processedCount: 1063,
      successRate: 97.8,
      accuracy: 96.5,
      createdAt: '2024-01-10T09:00:00Z',
      lastActivity: '2 hours ago',
      estimatedCompletion: '2024-01-20T18:00:00Z',
      modelVersion: 'v1.2.3',
    },
    {
      id: '2',
      name: 'Contract Analysis Pipeline',
      description: 'Legal document analysis and key clause extraction',
      documentType: 'Contract',
      status: 'training',
      progress: 45,
      documentsCount: 450,
      processedCount: 203,
      successRate: 92.1,
      createdAt: '2024-01-12T14:30:00Z',
      lastActivity: '30 minutes ago',
      estimatedCompletion: '2024-01-25T16:00:00Z',
    },
    {
      id: '3',
      name: 'Receipt Digitization',
      description: 'Receipt processing for expense management',
      documentType: 'Receipt',
      status: 'completed',
      progress: 100,
      documentsCount: 890,
      processedCount: 890,
      successRate: 95.4,
      accuracy: 94.2,
      createdAt: '2024-01-05T11:15:00Z',
      lastActivity: '1 day ago',
      modelVersion: 'v1.1.0',
    },
    {
      id: '4',
      name: 'Form Processing Beta',
      description: 'Government forms and applications processing',
      documentType: 'Form',
      status: 'error',
      progress: 25,
      documentsCount: 150,
      processedCount: 38,
      successRate: 78.9,
      createdAt: '2024-01-14T16:45:00Z',
      lastActivity: '3 hours ago',
    },
  ]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    documentType: '',
  });

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
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Project
        </Button>
      </Box>

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