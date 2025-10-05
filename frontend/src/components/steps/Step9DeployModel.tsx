import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as DeployIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  MonitorHeart as MonitorIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Backup as BackupIcon,
  Celebration as CelebrationIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import { modelsAPI, modelManagementAPI } from '../../services/api';

interface DeploymentConfig {
  enableAutoScaling: boolean;
  maxConcurrentRequests: number;
  enableCaching: boolean;
  enableMonitoring: boolean;
  enableBackups: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  enableABTesting: boolean;
  trafficSplit: number;
}

const defaultDeploymentConfig: DeploymentConfig = {
  enableAutoScaling: true,
  maxConcurrentRequests: 100,
  enableCaching: true,
  enableMonitoring: true,
  enableBackups: true,
  backupFrequency: 'daily',
  enableABTesting: false,
  trafficSplit: 10,
};

const Step9DeployModel: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>(defaultDeploymentConfig);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [apiEndpoint, setApiEndpoint] = useState<string>('');

  useEffect(() => {
    if (state.trainedModel?.is_production) {
      setDeployed(true);
      setDeploymentStep(4);
      setApiEndpoint(`/api/extract/${state.trainedModel.id}`);
    }
  }, [state.trainedModel]);

  const deploymentSteps = [
    'Configure Deployment',
    'Validate Model',
    'Deploy to Production',
    'Setup Monitoring',
    'Complete',
  ];

  const handleDeploy = async () => {
    if (!state.trainedModel) {
      setError('No trained model available for deployment');
      return;
    }

    setDeploying(true);
    setError(null);
    setDeploymentProgress(0);

    try {
      // Step 1: Validate model
      setDeploymentStep(1);
      setDeploymentProgress(20);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate validation

      // Step 2: Deploy to production
      setDeploymentStep(2);
      setDeploymentProgress(50);

      await modelsAPI.promote(state.trainedModel.id);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate deployment

      // Step 3: Setup monitoring
      setDeploymentStep(3);
      setDeploymentProgress(80);

      if (deploymentConfig.enableMonitoring) {
        await modelManagementAPI.monitorHealth();
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate monitoring setup

      // Step 4: Complete
      setDeploymentStep(4);
      setDeploymentProgress(100);

      // Update model state
      const updatedModel = { ...state.trainedModel, is_production: true, status: 'active' as const };
      dispatch({ type: 'SET_TRAINED_MODEL', payload: updatedModel });

      setDeployed(true);
      setApiEndpoint(`/api/extract/${state.trainedModel.id}`);
      setShowDeployDialog(false);

    } catch (err: any) {
      console.error('Deployment failed:', err);
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleConfigChange = (key: keyof DeploymentConfig, value: any) => {
    setDeploymentConfig(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const apiExamples = {
    curl: `curl -X POST "${window.location.origin}${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf"`,

    python: `import requests

url = "${window.location.origin}${apiEndpoint}"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"file": open("document.pdf", "rb")}

response = requests.post(url, headers=headers, files=files)
result = response.json()
print(result)`,

    javascript: `const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('${window.location.origin}${apiEndpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));`
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Deploy Model
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Deploy your trained model to production and start processing documents in real-time.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!state.trainedModel && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please complete model training and testing in previous steps.
        </Alert>
      )}

      {/* Deployment Status */}
      {deployed ? (
        <Card sx={{ mb: 3, border: 2, borderColor: 'success.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CelebrationIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h5" color="success.main">
                  Model Successfully Deployed!
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Your model is now live and ready to process documents.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {state.trainedModel?.version}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Model Version
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="success.main">
                    Active
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="info.main">
                    {new Date().toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Deployed Date
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Deployment Status
            </Typography>
            <Stepper activeStep={deploymentStep} orientation="vertical">
              {deploymentSteps.map((label, index) => (
                <Step key={label} completed={index < deploymentStep}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {index === 0 && !deployed && (
                      <Button
                        variant="contained"
                        onClick={() => setShowDeployDialog(true)}
                        disabled={!state.trainedModel || deploying}
                        startIcon={<DeployIcon />}
                      >
                        Start Deployment
                      </Button>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {deploying && (
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Deployment Progress: {deploymentProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={deploymentProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Integration */}
      {deployed && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Integration
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Use these examples to integrate the model into your applications.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">API Endpoint:</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TextField
                  value={`${window.location.origin}${apiEndpoint}`}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                />
                <Button
                  onClick={() => copyToClipboard(`${window.location.origin}${apiEndpoint}`)}
                  sx={{ ml: 1 }}
                >
                  Copy
                </Button>
              </Box>
            </Alert>

            <Grid container spacing={2}>
              {Object.entries(apiExamples).map(([language, code]) => (
                <Grid size={{ xs: 12 }} key={language}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" color="primary">
                        {language.toUpperCase()}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(code)}
                      >
                        Copy
                      </Button>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: 'grey.50',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {code}
                      </pre>
                    </Paper>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Model Information */}
      {state.trainedModel && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <List>
                  <ListItem>
                    <ListItemIcon><ApiIcon /></ListItemIcon>
                    <ListItemText
                      primary="Model ID"
                      secondary={state.trainedModel.id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText
                      primary="Version"
                      secondary={state.trainedModel.version}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText
                      primary="Document Type"
                      secondary={state.selectedDocumentType?.name}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <List>
                  <ListItem>
                    <ListItemIcon><SpeedIcon /></ListItemIcon>
                    <ListItemText
                      primary="Field Accuracy"
                      secondary={state.trainedModel.field_accuracy ? `${state.trainedModel.field_accuracy.toFixed(1)}%` : 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MonitorIcon /></ListItemIcon>
                    <ListItemText
                      primary="Inference Time"
                      secondary={state.trainedModel.avg_inference_time ? `${state.trainedModel.avg_inference_time.toFixed(0)}ms` : 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SecurityIcon /></ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={state.trainedModel.status.toUpperCase()}
                          color={state.trainedModel.is_production ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Next Steps
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><MonitorIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Monitor Performance"
                secondary="Keep an eye on model performance and accuracy in production"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><BackupIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Regular Backups"
                secondary="Ensure model checkpoints are backed up regularly"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><LaunchIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Scale as Needed"
                secondary="Monitor usage and scale infrastructure based on demand"
              />
            </ListItem>
          </List>

          {deployed && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                Congratulations! 🎉
              </Typography>
              <Typography variant="body2">
                You have successfully completed the Donut Trainer wizard and deployed your model to production.
                Your OCR model is now ready to process {state.selectedDocumentType?.name} documents with
                {state.trainedModel?.field_accuracy ? ` ${state.trainedModel.field_accuracy.toFixed(1)}%` : ' high'} accuracy.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deployment Configuration Dialog */}
      <Dialog open={showDeployDialog} onClose={() => setShowDeployDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Deployment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Configure deployment settings for your production model.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Performance Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={deploymentConfig.enableAutoScaling}
                    onChange={(e) => handleConfigChange('enableAutoScaling', e.target.checked)}
                  />
                }
                label="Enable Auto Scaling"
              />

              <Box mt={2}>
                <TextField
                  label="Max Concurrent Requests"
                  type="number"
                  value={deploymentConfig.maxConcurrentRequests}
                  onChange={(e) => handleConfigChange('maxConcurrentRequests', parseInt(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Box>

              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={deploymentConfig.enableCaching}
                      onChange={(e) => handleConfigChange('enableCaching', e.target.checked)}
                    />
                  }
                  label="Enable Response Caching"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monitoring & Backup
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={deploymentConfig.enableMonitoring}
                    onChange={(e) => handleConfigChange('enableMonitoring', e.target.checked)}
                  />
                }
                label="Enable Health Monitoring"
              />

              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={deploymentConfig.enableBackups}
                      onChange={(e) => handleConfigChange('enableBackups', e.target.checked)}
                    />
                  }
                  label="Enable Automatic Backups"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="textSecondary">
            Review the deployment settings above and click "Deploy" to promote your model to production.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeployDialog(false)} disabled={deploying}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            variant="contained"
            disabled={deploying}
            startIcon={<DeployIcon />}
          >
            {deploying ? 'Deploying...' : 'Deploy to Production'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step9DeployModel;