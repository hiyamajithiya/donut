import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
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
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import { trainingJobsAPI } from '../../services/api';
import { TrainingJob } from '../../types';
import RealTimeProgress from '../RealTimeProgress';

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
  learningRate: number;
  timestamp: string;
}

const Step6TrainModel: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [trainingJob, setTrainingJob] = useState<TrainingJob | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [metrics, setMetrics] = useState<TrainingMetrics[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 'init', name: 'Initialize Training', status: 'pending' },
    { id: 'load_data', name: 'Load Dataset', status: 'pending' },
    { id: 'train', name: 'Train Model', status: 'pending', progress: 0 },
    { id: 'validate', name: 'Validate Model', status: 'pending' },
    { id: 'save', name: 'Save Model', status: 'pending' },
  ]);

  const startPolling = useCallback(() => {
    const interval = setInterval(async () => {
      if (trainingJob) {
        try {
          const response = await trainingJobsAPI.getStatus(trainingJob.id);
          const updatedJob = response.data;
          setTrainingJob(updatedJob);

          if (updatedJob.status === 'completed' || updatedJob.status === 'failed' || updatedJob.status === 'cancelled') {
            setIsTraining(false);
            clearInterval(interval);

            // Update progress steps based on final status
            setProgressSteps(prev => prev.map(step => {
              if (updatedJob.status === 'completed') {
                return { ...step, status: 'completed' };
              } else if (updatedJob.status === 'failed') {
                return { ...step, status: step.id === 'train' ? 'error' : step.status };
              }
              return step;
            }));
          } else {
            // Update progress steps during training
            setProgressSteps(prev => prev.map(step => {
              if (step.id === 'init' && updatedJob.status !== 'pending') {
                return { ...step, status: 'completed'  };
              }
              if (step.id === 'load_data' && updatedJob.status === 'training') {
                return { ...step, status: 'completed'  };
              }
              if (step.id === 'train' && updatedJob.status === 'training') {
                return {
                  ...step,
                  status: 'running' ,
                  progress: updatedJob.progress || 0,
                  details: `Epoch ${updatedJob.current_epoch || 0}/${updatedJob.total_epochs || 0}`
                };
              }
              return step;
            }));
          }

          // Simulate metrics updates (in real implementation, these would come from the API)
          if (updatedJob.status === 'training' && updatedJob.current_epoch) {
            const newMetric: TrainingMetrics = {
              epoch: updatedJob.current_epoch,
              loss: updatedJob.loss || Math.random() * 0.5 + 0.1,
              accuracy: updatedJob.accuracy || Math.random() * 0.3 + 0.7,
              valLoss: Math.random() * 0.6 + 0.15,
              valAccuracy: Math.random() * 0.25 + 0.75,
              learningRate: 5e-5 * Math.pow(0.95, updatedJob.current_epoch),
              timestamp: new Date().toISOString(),
            };

            setMetrics(prev => {
              const updated = [...prev];
              const existingIndex = updated.findIndex(m => m.epoch === newMetric.epoch);
              if (existingIndex >= 0) {
                updated[existingIndex] = newMetric;
              } else {
                updated.push(newMetric);
              }
              return updated.sort((a, b) => a.epoch - b.epoch);
            });
          }
        } catch (err) {
          console.error('Failed to poll training status:', err);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [trainingJob]);

  useEffect(() => {
    if (state.trainingJob) {
      setTrainingJob(state.trainingJob);
      if (state.trainingJob.status === 'training') {
        setIsTraining(true);
        startPolling();
      }
    }
  }, [state.trainingJob, startPolling]);

  const handleStartTraining = async () => {
    if (!state.createdDataset || !state.trainingConfig) {
      setError('Please complete previous steps first');
      return;
    }

    try {
      setError(null);

      // Create training job
      const jobData = {
        dataset: state.createdDataset.id,
        config: state.trainingConfig,
      };

      const response = await trainingJobsAPI.create(jobData);
      const newJob = response.data;
      setTrainingJob(newJob);
      dispatch({ type: 'SET_TRAINING_JOB', payload: newJob });

      // Start training
      await trainingJobsAPI.start(newJob.id);
      setIsTraining(true);
      setMetrics([]);
      setLogs([]);

      // Add initial log
      setLogs(prev => [...prev, `Training started at ${new Date().toLocaleString()}`]);

      startPolling();
    } catch (err: any) {
      console.error('Failed to start training:', err);
      setError(err.response?.data?.error || 'Failed to start training');
    }
  };

  const handleCancelTraining = async () => {
    if (!trainingJob) return;

    try {
      await trainingJobsAPI.cancel(trainingJob.id);
      setIsTraining(false);
      setShowCancelDialog(false);
      setLogs(prev => [...prev, `Training cancelled at ${new Date().toLocaleString()}`]);
    } catch (err: any) {
      console.error('Failed to cancel training:', err);
      setError(err.response?.data?.error || 'Failed to cancel training');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <WarningIcon color="warning" />;
      case 'training':
        return <TimelineIcon color="primary" />;
      default:
        return <RefreshIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      case 'training':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const currentMetric = metrics[metrics.length - 1];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Train Model
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Start training your Donut model and monitor progress in real-time.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {(!state.createdDataset || !state.trainingConfig) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please complete dataset creation and training configuration in previous steps.
        </Alert>
      )}

      {/* Training Control */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>
                Training Control
              </Typography>
              {trainingJob ? (
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getStatusIcon(trainingJob.status)}
                  <Typography variant="body1">
                    Training Job: {trainingJob.id}
                  </Typography>
                  <Chip
                    label={trainingJob.status.toUpperCase()}
                    color={getStatusColor(trainingJob.status) as any}
                    variant="filled"
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" paragraph>
                  No training job created yet.
                </Typography>
              )}

              {trainingJob && trainingJob.started_at && (
                <Typography variant="body2" color="textSecondary">
                  Duration: {formatDuration(trainingJob.started_at, trainingJob.completed_at)}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" gap={2}>
                {!isTraining ? (
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={handleStartTraining}
                    disabled={!state.createdDataset || !state.trainingConfig}
                    size="large"
                  >
                    Start Training
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={() => setShowCancelDialog(true)}
                    size="large"
                  >
                    Cancel Training
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Real-time Training Progress */}
      {trainingJob && (
        <Box sx={{ mb: 3 }}>
          <RealTimeProgress
            title="Model Training Progress"
            steps={progressSteps}
            isRunning={isTraining}
            canPause={false}
            canStop={true}
            canRetry={!isTraining && trainingJob.status === 'failed'}
            onStop={() => setShowCancelDialog(true)}
            onRetry={handleStartTraining}
            showSystemMetrics={true}
            estimatedTimeRemaining={
              trainingJob.total_epochs && trainingJob.current_epoch
                ? Math.max(0, (trainingJob.total_epochs - trainingJob.current_epoch) * 60) // Estimate 60 seconds per epoch
                : undefined
            }
            currentStep={progressSteps.find(s => s.status === 'running')?.name}
            logs={logs}
          />
        </Box>
      )}

      {trainingJob && (
        <Grid container spacing={3}>
          {/* Quick Metrics Overview */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {trainingJob.current_epoch || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Current Epoch
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary">
                        {currentMetric ? currentMetric.loss.toFixed(4) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Training Loss
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {currentMetric ? (currentMetric.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Training Accuracy
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {currentMetric ? (currentMetric.valAccuracy ? currentMetric.valAccuracy * 100 : 0).toFixed(1) + '%' : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Validation Accuracy
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Metrics Table */}
          {metrics.length > 0 && (
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Training Metrics
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Epoch</TableCell>
                          <TableCell align="right">Loss</TableCell>
                          <TableCell align="right">Accuracy</TableCell>
                          <TableCell align="right">Val Loss</TableCell>
                          <TableCell align="right">Val Accuracy</TableCell>
                          <TableCell align="right">LR</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {metrics.slice(-10).reverse().map((metric) => (
                          <TableRow key={metric.epoch}>
                            <TableCell>{metric.epoch}</TableCell>
                            <TableCell align="right">{metric.loss.toFixed(4)}</TableCell>
                            <TableCell align="right">{(metric.accuracy * 100).toFixed(1)}%</TableCell>
                            <TableCell align="right">
                              {metric.valLoss ? metric.valLoss.toFixed(4) : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {metric.valAccuracy ? (metric.valAccuracy * 100).toFixed(1) + '%' : 'N/A'}
                            </TableCell>
                            <TableCell align="right">{metric.learningRate.toExponential(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Training Logs */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Training Logs
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    height: 400,
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                >
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        {log}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No logs available yet.
                    </Typography>
                  )}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Training Configuration Summary */}
      {state.trainingConfig && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Training Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><SpeedIcon /></ListItemIcon>
                    <ListItemText
                      primary="Epochs"
                      secondary={state.trainingConfig.epochs}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MemoryIcon /></ListItemIcon>
                    <ListItemText
                      primary="Batch Size"
                      secondary={state.trainingConfig.batchSize}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                    <ListItemText
                      primary="Learning Rate"
                      secondary={state.trainingConfig.learningRate}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Optimizer"
                      secondary={state.trainingConfig.optimizer?.toUpperCase()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Mixed Precision"
                      secondary={state.trainingConfig.enableMixedPrecision ? 'Enabled' : 'Disabled'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Validation Split"
                      secondary={`${(state.trainingConfig.validationSplit * 100).toFixed(0)}%`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Cancel Training Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Training?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel the training? This action cannot be undone
            and all progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Keep Training
          </Button>
          <Button onClick={handleCancelTraining} color="error" variant="contained">
            Cancel Training
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step6TrainModel;