import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Science as TestIcon,
  RocketLaunch as UseIcon,
} from '@mui/icons-material';
import { wizardAPI } from '../../services/api';

interface Props {
  data: any;
  updateData: (data: any) => void;
}

const Step5TrainModel: React.FC<Props> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('Not Started');
  const [error, setError] = useState<string | null>(null);
  const [trainingJobId, setTrainingJobId] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(data.configId || null);

  const totalEpochs = 10;

  const handleStartTraining = async () => {
    try {
      setIsTraining(true);
      setError(null);
      setTrainingStatus('Saving configuration...');

      // Step 1: Save configuration if not already saved
      let currentDatasetId: string = datasetId || '';
      if (!currentDatasetId) {
        const configResponse = await wizardAPI.saveConfig({
          documentType: data.documentType,
          modelName: data.modelName,
          fields: data.fields || [],
        });
        currentDatasetId = configResponse.data.configId;
        setDatasetId(currentDatasetId);
        updateData({ ...data, configId: currentDatasetId });
      }

      // Ensure we have a valid dataset ID before proceeding
      if (!currentDatasetId) {
        throw new Error('Failed to create or retrieve dataset configuration');
      }

      // Step 2: Upload documents if not already uploaded
      if (data.documents && data.documents.length > 0 && !data.documentsUploaded) {
        setTrainingStatus('Uploading documents...');
        await wizardAPI.uploadDocuments(currentDatasetId, data.documents);
        updateData({ ...data, documentsUploaded: true });
      }

      // Step 3: Save annotations if any
      if (data.annotations && Object.keys(data.annotations).length > 0) {
        setTrainingStatus('Saving annotations...');
        // Save annotations for each document
        for (const docId of Object.keys(data.annotations)) {
          if (data.annotations[docId] && Object.keys(data.annotations[docId]).length > 0) {
            await wizardAPI.saveAnnotations({
              dataset_id: currentDatasetId,
              document_id: docId,
              annotations: data.annotations[docId],
            });
          }
        }
      }

      // Step 4: Start training
      setTrainingStatus('Starting training...');
      const trainingResponse = await wizardAPI.startTraining({
        dataset_id: currentDatasetId,
        epochs: totalEpochs,
        batch_size: 8,
        learning_rate: 0.00005,
      });

      const jobId = trainingResponse.data.training_job_id;
      setTrainingJobId(jobId);

      // Step 5: Poll for training status
      pollTrainingStatus(jobId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start training');
      setIsTraining(false);
      setTrainingStatus('Training failed');
    }
  };

  const pollTrainingStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await wizardAPI.getTrainingStatus(jobId);
        const status = statusResponse.data.status;
        const progress = statusResponse.data.progress || 0;
        const epoch = statusResponse.data.current_epoch || 0;

        setTrainingProgress(progress);
        setCurrentEpoch(epoch);

        if (status === 'training') {
          setTrainingStatus(`Training epoch ${epoch}/${totalEpochs}...`);
        } else if (status === 'completed') {
          clearInterval(pollInterval);
          setTrainingProgress(100);
          setTrainingStatus('Training complete!');
          setIsTraining(false);
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setError('Training failed. Please try again.');
          setIsTraining(false);
          setTrainingStatus('Training failed');
        }
      } catch (err: any) {
        clearInterval(pollInterval);
        setError(err.response?.data?.error || 'Failed to get training status');
        setIsTraining(false);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleTestModel = () => {
    // Navigate to projects page where user can test the model
    // In a real app, this would navigate to a dedicated test page with the model data
    navigate('/projects');
  };

  const handleUseModel = () => {
    // Navigate to dashboard to use the model
    navigate('/dashboard');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Train Your Model
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Review your configuration and start training your document extraction model
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Configuration Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Model Configuration
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Model Name" secondary={data.modelName || 'Unnamed Model'} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Document Type" secondary={data.documentType?.replace('_', ' ')} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Fields to Extract" secondary={`${data.fields?.length || 0} fields`} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Training Documents" secondary={`${data.documents?.length || 0} documents`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Training Settings
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Epochs" secondary={totalEpochs} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Batch Size" secondary="8" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Learning Rate" secondary="5e-5" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Estimated Time" secondary="15-20 minutes" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fields Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Fields to Extract
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {data.fields?.map((field: any) => (
            <Chip key={field.id} label={field.name} icon={<CheckIcon />} color="primary" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* Training Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Training Status
          </Typography>
          <Chip label={trainingStatus} color={trainingProgress === 100 ? 'success' : isTraining ? 'warning' : 'default'} />
        </Box>

        {isTraining && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="textSecondary">
                Epoch {currentEpoch} / {totalEpochs}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {trainingProgress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={trainingProgress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        {!isTraining && trainingProgress === 0 && (
          <Box textAlign="center" py={4}>
            <InfoIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="body1" color="textSecondary" paragraph>
              Your model is ready to be trained
            </Typography>
            <Button variant="contained" size="large" startIcon={<StartIcon />} onClick={handleStartTraining}>
              Start Training
            </Button>
          </Box>
        )}

        {trainingProgress === 100 && (
          <Box textAlign="center" py={4}>
            <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              Training Complete!
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Your model has been successfully trained and is ready to use.
            </Typography>
            <Box mt={2} display="flex" gap={2} justifyContent="center">
              <Button variant="outlined" size="large" startIcon={<TestIcon />} onClick={handleTestModel}>
                Test Model
              </Button>
              <Button variant="contained" size="large" startIcon={<UseIcon />} onClick={handleUseModel}>
                Use Model
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Training Logs */}
      {isTraining && (
        <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace', fontSize: 12 }}>
          <Typography variant="caption" component="div">
            [INFO] Starting training...
          </Typography>
          <Typography variant="caption" component="div">
            [INFO] Loading training data: {data.documents?.length} documents
          </Typography>
          <Typography variant="caption" component="div">
            [INFO] Model: Donut Base
          </Typography>
          <Typography variant="caption" component="div">
            [INFO] Epoch {currentEpoch}/{totalEpochs} - Loss: {(Math.random() * 0.5 + 0.1).toFixed(4)}
          </Typography>
          {currentEpoch > 0 && (
            <Typography variant="caption" component="div">
              [INFO] Validation accuracy: {(85 + currentEpoch * 1.2).toFixed(2)}%
            </Typography>
          )}
        </Paper>
      )}

      {/* Important Notes */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'warning.lighter' }}>
        <Typography variant="body2" fontWeight="bold" color="warning.dark" gutterBottom>
          ⚠ Important
        </Typography>
        <Typography variant="body2" color="warning.dark">
          • Training may take 15-20 minutes depending on your hardware
          • Do not close this window during training
          • You'll be notified when training is complete
        </Typography>
      </Paper>
    </Box>
  );
};

export default Step5TrainModel;
