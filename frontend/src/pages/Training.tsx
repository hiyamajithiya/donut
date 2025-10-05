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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  ModelTraining as TrainingIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Timeline as ProgressIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

interface TrainingJob {
  id: string;
  name: string;
  project: string;
  status: 'pending' | 'preparing' | 'training' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  accuracy: number;
  loss: number;
  estimatedTimeRemaining: string;
  startTime: string;
  duration?: string;
  documentsCount: number;
  modelSize: string;
}

const Training: React.FC = () => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
    {
      id: '1',
      name: 'Invoice Model v2.1',
      project: 'Invoice Processing System',
      status: 'training',
      progress: 75,
      currentEpoch: 15,
      totalEpochs: 20,
      accuracy: 94.2,
      loss: 0.08,
      estimatedTimeRemaining: '25 minutes',
      startTime: '2024-01-15T14:30:00Z',
      documentsCount: 1250,
      modelSize: '2.3 GB',
    },
    {
      id: '2',
      name: 'Contract Analysis Model',
      project: 'Contract Analysis Pipeline',
      status: 'pending',
      progress: 0,
      currentEpoch: 0,
      totalEpochs: 30,
      accuracy: 0,
      loss: 0,
      estimatedTimeRemaining: 'Not started',
      startTime: '2024-01-15T16:00:00Z',
      documentsCount: 450,
      modelSize: '1.8 GB',
    },
    {
      id: '3',
      name: 'Receipt Processing Model',
      project: 'Receipt Digitization',
      status: 'completed',
      progress: 100,
      currentEpoch: 25,
      totalEpochs: 25,
      accuracy: 96.8,
      loss: 0.03,
      estimatedTimeRemaining: 'Completed',
      startTime: '2024-01-14T10:15:00Z',
      duration: '2h 45m',
      documentsCount: 890,
      modelSize: '1.5 GB',
    },
  ]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, job: TrainingJob) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'training':
      case 'preparing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon />;
      case 'training':
      case 'preparing':
        return <TrainingIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'failed':
      case 'cancelled':
        return <ErrorIcon />;
      default:
        return <TrainingIcon />;
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

  const getTrainingSteps = (status: string, currentEpoch: number, totalEpochs: number) => {
    const steps = ['Data Preparation', 'Model Training', 'Validation', 'Deployment'];
    let activeStep = 0;

    if (status === 'preparing') activeStep = 0;
    else if (status === 'training') activeStep = 1;
    else if (status === 'completed') activeStep = 3;

    return { steps, activeStep };
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Training Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor and manage your model training processes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<StartIcon />}
        >
          Start New Training
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TrainingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {trainingJobs.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Jobs
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
                  <ProgressIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {trainingJobs.filter(j => ['training', 'preparing'].includes(j.status)).length}
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
                    {trainingJobs.filter(j => j.status === 'completed').length}
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
                  <SpeedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {Math.round(trainingJobs.filter(j => j.status === 'completed').reduce((acc, j) => acc + j.accuracy, 0) / trainingJobs.filter(j => j.status === 'completed').length) || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Accuracy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Training Jobs */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Training Jobs
                </Typography>
                <IconButton>
                  <RefreshIcon />
                </IconButton>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Accuracy</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainingJobs.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {job.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {job.project}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(job.status)}
                            <Chip
                              label={job.status}
                              size="small"
                              color={getStatusColor(job.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box width={120}>
                            <LinearProgress
                              variant="determinate"
                              value={job.progress}
                              color={getStatusColor(job.status) as any}
                              sx={{ height: 8, borderRadius: 4, mb: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {job.status === 'training' ?
                                `Epoch ${job.currentEpoch}/${job.totalEpochs}` :
                                `${job.progress}%`
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {job.accuracy > 0 ? `${job.accuracy}%` : '-'}
                          </Typography>
                          {job.loss > 0 && (
                            <Typography variant="caption" color="textSecondary">
                              Loss: {job.loss}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {job.status === 'training' ? job.estimatedTimeRemaining :
                             job.status === 'completed' ? job.duration :
                             formatDate(job.startTime)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuClick(e, job)}
                            size="small"
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Training Details Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Current Training
              </Typography>

              {trainingJobs.filter(j => j.status === 'training').map(job => (
                <Box key={job.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {job.name}
                    </Typography>
                    <Chip
                      label="Training"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>

                  {/* Training Progress Steps */}
                  <Box mb={3}>
                    <Stepper activeStep={1} orientation="vertical" sx={{ mb: 2 }}>
                      {getTrainingSteps(job.status, job.currentEpoch, job.totalEpochs).steps.map((label, index) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>

                  {/* Metrics */}
                  <Grid container spacing={2} mb={3}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Epoch
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {job.currentEpoch}/{job.totalEpochs}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Accuracy
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {job.accuracy}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Loss
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {job.loss}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        ETA
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {job.estimatedTimeRemaining}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Progress Bar */}
                  <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {job.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={job.progress}
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Control Buttons */}
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PauseIcon />}
                      color="warning"
                    >
                      Pause
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<StopIcon />}
                      color="error"
                    >
                      Stop
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => setDetailsDialogOpen(true)}
                    >
                      Details
                    </Button>
                  </Box>
                </Box>
              ))}

              {trainingJobs.filter(j => j.status === 'training').length === 0 && (
                <Alert severity="info">
                  No active training jobs. Start a new training session to monitor progress here.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* System Resources */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                System Resources
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <MemoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="GPU Usage"
                    secondary={
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={75}
                          color="info"
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          75% • 6.2 GB / 8 GB
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="CPU Usage"
                    secondary={
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={45}
                          color="success"
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          45% • 4 cores active
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { setDetailsDialogOpen(true); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedJob?.status === 'training' && (
          <MenuItem onClick={handleMenuClose}>
            <PauseIcon fontSize="small" sx={{ mr: 1 }} />
            Pause Training
          </MenuItem>
        )}
        {selectedJob?.status === 'pending' && (
          <MenuItem onClick={handleMenuClose}>
            <StartIcon fontSize="small" sx={{ mr: 1 }} />
            Start Training
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <StopIcon fontSize="small" sx={{ mr: 1 }} />
          Cancel Training
        </MenuItem>
      </Menu>

      {/* Training Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Training Details</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedJob.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Project: {selectedJob.project}
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedJob.status}
                    color={getStatusColor(selectedJob.status) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Documents
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.documentsCount}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Model Size
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.modelSize}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Started
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedJob.startTime)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Training;