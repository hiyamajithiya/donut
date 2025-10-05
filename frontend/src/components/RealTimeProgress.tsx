import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  duration?: number;
  errorMessage?: string;
  details?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  diskUsage: number;
  networkActivity: number;
}

interface RealTimeProgressProps {
  title: string;
  steps: ProgressStep[];
  isRunning: boolean;
  canPause?: boolean;
  canStop?: boolean;
  canRetry?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRetry?: () => void;
  showSystemMetrics?: boolean;
  estimatedTimeRemaining?: number;
  currentStep?: string;
  logs?: string[];
}

const RealTimeProgress: React.FC<RealTimeProgressProps> = ({
  title,
  steps,
  isRunning,
  canPause = false,
  canStop = false,
  canRetry = false,
  onPause,
  onResume,
  onStop,
  onRetry,
  showSystemMetrics = false,
  estimatedTimeRemaining,
  currentStep,
  logs = [],
}) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    diskUsage: 0,
    networkActivity: 0,
  });
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate system metrics updates
  useEffect(() => {
    if (!showSystemMetrics || !isRunning) return;

    const interval = setInterval(() => {
      setSystemMetrics({
        cpuUsage: Math.random() * 100,
        memoryUsage: 60 + Math.random() * 30,
        gpuUsage: Math.random() * 90,
        diskUsage: 45 + Math.random() * 20,
        networkActivity: Math.random() * 50,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [showSystemMetrics, isRunning]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handlePauseResume = () => {
    if (isPaused) {
      onResume?.();
      setIsPaused(false);
    } else {
      onPause?.();
      setIsPaused(true);
    }
  };

  const getOverallProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const runningStep = steps.find(step => step.status === 'running');

    if (runningStep?.progress !== undefined) {
      return ((completedSteps + runningStep.progress / 100) / steps.length) * 100;
    }

    return (completedSteps / steps.length) * 100;
  };

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'running':
        return <TimelineIcon color="primary" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Box>
      {/* Header with Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{title}</Typography>
            <Box display="flex" gap={1}>
              {canPause && isRunning && (
                <Tooltip title={isPaused ? "Resume" : "Pause"}>
                  <IconButton onClick={handlePauseResume} color="primary">
                    {isPaused ? <StartIcon /> : <PauseIcon />}
                  </IconButton>
                </Tooltip>
              )}
              {canStop && isRunning && (
                <Tooltip title="Stop">
                  <IconButton onClick={onStop} color="error">
                    <StopIcon />
                  </IconButton>
                </Tooltip>
              )}
              {canRetry && !isRunning && (
                <Tooltip title="Retry">
                  <IconButton onClick={onRetry} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Overall Progress */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Overall Progress</Typography>
              <Typography variant="body2" color="primary">
                {getOverallProgress().toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Time Estimates */}
          {estimatedTimeRemaining !== undefined && (
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<TimelineIcon />}
                label={`ETA: ${formatTime(estimatedTimeRemaining)}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {currentStep && (
                <Chip
                  label={`Current: ${currentStep}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              <Chip
                label={isPaused ? 'Paused' : isRunning ? 'Running' : 'Stopped'}
                size="small"
                color={isPaused ? 'warning' : isRunning ? 'success' : 'default'}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Steps Progress */}
        <Grid size={{ xs: 12, md: showSystemMetrics ? 8 : 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Process Steps
              </Typography>
              <List>
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(step.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1">{step.name}</Typography>
                            <Chip
                              label={step.status}
                              size="small"
                              color={getStatusColor(step.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {step.details && (
                              <Typography variant="caption" display="block">
                                {step.details}
                              </Typography>
                            )}
                            {step.status === 'running' && step.progress !== undefined && (
                              <Box mt={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={step.progress}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {step.progress.toFixed(1)}%
                                </Typography>
                              </Box>
                            )}
                            {step.duration && (
                              <Typography variant="caption" color="textSecondary">
                                Duration: {formatTime(step.duration)}
                              </Typography>
                            )}
                            {step.errorMessage && (
                              <Typography variant="caption" color="error">
                                Error: {step.errorMessage}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < steps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        {showSystemMetrics && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Resources
                </Typography>
                <Box sx={{ '& > *': { mb: 2 } }}>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2">{systemMetrics.cpuUsage.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={systemMetrics.cpuUsage}
                      color={systemMetrics.cpuUsage > 80 ? 'error' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2">Memory</Typography>
                      <Typography variant="body2">{systemMetrics.memoryUsage.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={systemMetrics.memoryUsage}
                      color={systemMetrics.memoryUsage > 85 ? 'warning' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  {systemMetrics.gpuUsage !== undefined && (
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2">GPU</Typography>
                        <Typography variant="body2">{systemMetrics.gpuUsage.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemMetrics.gpuUsage}
                        color="secondary"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2">Disk I/O</Typography>
                      <Typography variant="body2">{systemMetrics.diskUsage.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={systemMetrics.diskUsage}
                      color="info"
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Process Logs
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    height: 200,
                    overflow: 'auto',
                    p: 1,
                    backgroundColor: 'grey.900',
                    color: 'common.white',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {logs.map((log, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      component="div"
                      sx={{ color: 'inherit', fontSize: 'inherit' }}
                    >
                      {log}
                    </Typography>
                  ))}
                  <div ref={logsEndRef} />
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RealTimeProgress;