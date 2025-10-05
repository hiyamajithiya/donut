import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';

interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'adamw';
  scheduler: 'cosine' | 'linear' | 'polynomial' | 'constant';
  warmupSteps: number;
  weightDecay: number;
  maxImageSize: number;
  enableMixedPrecision: boolean;
  enableGradientClipping: boolean;
  gradientClipValue: number;
  saveCheckpoints: boolean;
  checkpointInterval: number;
  earlyStoppingPatience: number;
  validationSplit: number;
}

const defaultConfig: TrainingConfig = {
  epochs: 30,
  batchSize: 8,
  learningRate: 5e-5,
  optimizer: 'adamw',
  scheduler: 'cosine',
  warmupSteps: 300,
  weightDecay: 0.01,
  maxImageSize: 1280,
  enableMixedPrecision: true,
  enableGradientClipping: true,
  gradientClipValue: 1.0,
  saveCheckpoints: true,
  checkpointInterval: 5,
  earlyStoppingPatience: 5,
  validationSplit: 0.2,
};

const Step5TrainingConfig: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [config, setConfig] = useState<TrainingConfig>(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  useEffect(() => {
    if (state.trainingConfig && Object.keys(state.trainingConfig).length > 0) {
      setConfig({ ...defaultConfig, ...state.trainingConfig });
    }
  }, [state.trainingConfig]);

  useEffect(() => {
    dispatch({ type: 'SET_TRAINING_CONFIG', payload: config });
  }, [config, dispatch]);

  const calculateEstimatedTime = useCallback(() => {
    const docsCount = state.labeledDocuments.length;
    const batchesPerEpoch = Math.ceil(docsCount / config.batchSize);
    const totalBatches = batchesPerEpoch * config.epochs;

    // Estimate ~3 seconds per batch (rough estimate)
    const estimatedSeconds = totalBatches * 3;
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);

    if (hours > 0) {
      setEstimatedTime(`~${hours}h ${minutes}m`);
    } else {
      setEstimatedTime(`~${minutes}m`);
    }
  }, [config, state.labeledDocuments]);

  useEffect(() => {
    calculateEstimatedTime();
  }, [calculateEstimatedTime]);

  const handleConfigChange = (key: keyof TrainingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getPresetConfig = (preset: 'fast' | 'balanced' | 'quality') => {
    switch (preset) {
      case 'fast':
        return {
          ...defaultConfig,
          epochs: 10,
          batchSize: 16,
          learningRate: 1e-4,
          maxImageSize: 960,
          earlyStoppingPatience: 3,
        };
      case 'balanced':
        return defaultConfig;
      case 'quality':
        return {
          ...defaultConfig,
          epochs: 50,
          batchSize: 4,
          learningRate: 2e-5,
          maxImageSize: 1600,
          earlyStoppingPatience: 8,
        };
    }
  };

  const applyPreset = (preset: 'fast' | 'balanced' | 'quality') => {
    setConfig(getPresetConfig(preset));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Training Configuration
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Configure training parameters for your Donut model. Choose a preset or customize settings for optimal results.
      </Typography>

      {!state.createdDataset && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please create a dataset and add labeled documents in previous steps.
        </Alert>
      )}

      {/* Training Presets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Presets
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => applyPreset('fast')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SpeedIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Fast Training</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Quick training with lower accuracy. Good for testing.
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="10 epochs" size="small" />
                    <Chip label="Batch 16" size="small" />
                    <Chip label="~2-4 hours" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => applyPreset('balanced')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SettingsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Balanced</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Recommended settings for most use cases.
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="30 epochs" size="small" />
                    <Chip label="Batch 8" size="small" />
                    <Chip label="~6-12 hours" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => applyPreset('quality')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TimelineIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">High Quality</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Maximum accuracy training for production use.
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="50 epochs" size="small" />
                    <Chip label="Batch 4" size="small" />
                    <Chip label="~12-24 hours" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Training Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Training Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {state.labeledDocuments.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Labeled Documents
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {config.epochs}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Training Epochs
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {Math.ceil(state.labeledDocuments.length / config.batchSize)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Batches per Epoch
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {estimatedTime}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Estimated Time
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Basic Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Training Epochs"
                type="number"
                value={config.epochs}
                onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 100 }}
                helperText="Number of training iterations over the dataset"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Batch Size"
                type="number"
                value={config.batchSize}
                onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 32 }}
                helperText="Number of documents processed together"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Optimizer</InputLabel>
                <Select
                  value={config.optimizer}
                  onChange={(e) => handleConfigChange('optimizer', e.target.value)}
                >
                  <MenuItem value="adamw">AdamW (Recommended)</MenuItem>
                  <MenuItem value="adam">Adam</MenuItem>
                  <MenuItem value="sgd">SGD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Learning Rate"
                type="number"
                value={config.learningRate}
                onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
                fullWidth
                inputProps={{ min: 0.00001, max: 0.01, step: 0.00001 }}
                helperText="Controls how fast the model learns"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography gutterBottom>Validation Split: {(config.validationSplit * 100).toFixed(0)}%</Typography>
              <Slider
                value={config.validationSplit}
                onChange={(_, value) => handleConfigChange('validationSplit', value as number)}
                min={0.1}
                max={0.3}
                step={0.05}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.2, label: '20%' },
                  { value: 0.3, label: '30%' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <Accordion expanded={showAdvanced} onChange={(_, expanded) => setShowAdvanced(expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Learning Rate Scheduler</InputLabel>
                <Select
                  value={config.scheduler}
                  onChange={(e) => handleConfigChange('scheduler', e.target.value)}
                >
                  <MenuItem value="cosine">Cosine Annealing</MenuItem>
                  <MenuItem value="linear">Linear Decay</MenuItem>
                  <MenuItem value="polynomial">Polynomial Decay</MenuItem>
                  <MenuItem value="constant">Constant</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Warmup Steps"
                type="number"
                value={config.warmupSteps}
                onChange={(e) => handleConfigChange('warmupSteps', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 0, max: 1000 }}
                helperText="Number of warmup steps for learning rate"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Weight Decay"
                type="number"
                value={config.weightDecay}
                onChange={(e) => handleConfigChange('weightDecay', parseFloat(e.target.value))}
                fullWidth
                inputProps={{ min: 0, max: 0.1, step: 0.001 }}
                helperText="L2 regularization factor"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Max Image Size"
                type="number"
                value={config.maxImageSize}
                onChange={(e) => handleConfigChange('maxImageSize', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 640, max: 2048, step: 64 }}
                helperText="Maximum image resolution for training"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Early Stopping Patience"
                type="number"
                value={config.earlyStoppingPatience}
                onChange={(e) => handleConfigChange('earlyStoppingPatience', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 20 }}
                helperText="Epochs to wait before stopping if no improvement"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Checkpoint Interval"
                type="number"
                value={config.checkpointInterval}
                onChange={(e) => handleConfigChange('checkpointInterval', parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 10 }}
                helperText="Save model every N epochs"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Optimization Options
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableMixedPrecision}
                    onChange={(e) => handleConfigChange('enableMixedPrecision', e.target.checked)}
                  />
                }
                label="Mixed Precision Training"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Faster training with lower memory usage
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableGradientClipping}
                    onChange={(e) => handleConfigChange('enableGradientClipping', e.target.checked)}
                  />
                }
                label="Gradient Clipping"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Prevents gradient explosion during training
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.saveCheckpoints}
                    onChange={(e) => handleConfigChange('saveCheckpoints', e.target.checked)}
                  />
                }
                label="Save Checkpoints"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Save model checkpoints during training
              </Typography>

              {config.enableGradientClipping && (
                <Box mt={2}>
                  <TextField
                    label="Gradient Clip Value"
                    type="number"
                    value={config.gradientClipValue}
                    onChange={(e) => handleConfigChange('gradientClipValue', parseFloat(e.target.value))}
                    inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                    helperText="Maximum gradient norm"
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Configuration Summary */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Configuration Summary:
        </Typography>
        <Typography variant="body2">
          • Training {state.labeledDocuments.length} documents for {config.epochs} epochs<br/>
          • Batch size: {config.batchSize}, Learning rate: {config.learningRate}<br/>
          • Estimated training time: {estimatedTime}<br/>
          • Memory usage: {config.enableMixedPrecision ? 'Optimized' : 'Standard'}<br/>
          • Checkpoints: {config.saveCheckpoints ? `Every ${config.checkpointInterval} epochs` : 'Disabled'}
        </Typography>
      </Alert>
    </Box>
  );
};

export default Step5TrainingConfig;