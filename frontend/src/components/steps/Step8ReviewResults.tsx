import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Analytics as AccuracyIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import AnalyticsDashboard from '../AnalyticsDashboard';

interface PerformanceRecommendation {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action?: string;
}

const Step8ReviewResults: React.FC = () => {
  const { state } = useWizard();
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [readyForProduction, setReadyForProduction] = useState<boolean>(false);

  const analyzeResults = useCallback(() => {
    const recs: PerformanceRecommendation[] = [];
    let score = 0;

    // Analyze training results
    if (state.trainedModel) {
      if (state.trainedModel.field_accuracy && state.trainedModel.field_accuracy >= 90) {
        recs.push({
          type: 'success',
          title: 'Excellent Field Accuracy',
          description: `Model achieved ${state.trainedModel.field_accuracy.toFixed(1)}% field accuracy, which is excellent for production use.`,
        });
        score += 30;
      } else if (state.trainedModel.field_accuracy && state.trainedModel.field_accuracy >= 75) {
        recs.push({
          type: 'warning',
          title: 'Good Field Accuracy',
          description: `Model achieved ${state.trainedModel.field_accuracy.toFixed(1)}% field accuracy. Consider additional training data for improvement.`,
          action: 'Add more labeled documents to improve accuracy',
        });
        score += 20;
      } else {
        recs.push({
          type: 'error',
          title: 'Low Field Accuracy',
          description: `Model achieved ${(state.trainedModel.field_accuracy || 0).toFixed(1)}% field accuracy. Requires significant improvement.`,
          action: 'Retrain with more diverse and high-quality labeled data',
        });
        score += 10;
      }

      if (state.trainedModel.avg_inference_time && state.trainedModel.avg_inference_time < 2000) {
        recs.push({
          type: 'success',
          title: 'Fast Inference Speed',
          description: `Average inference time of ${state.trainedModel.avg_inference_time.toFixed(0)}ms is excellent for real-time applications.`,
        });
        score += 20;
      } else if (state.trainedModel.avg_inference_time && state.trainedModel.avg_inference_time < 5000) {
        recs.push({
          type: 'warning',
          title: 'Moderate Inference Speed',
          description: `Average inference time of ${state.trainedModel.avg_inference_time.toFixed(0)}ms is acceptable but could be optimized.`,
          action: 'Consider model optimization or hardware upgrades',
        });
        score += 15;
      }
    }

    // Analyze test results
    if (state.testResults && state.testResults.metrics) {
      const metrics = state.testResults.metrics;

      if (metrics.successRate >= 95) {
        recs.push({
          type: 'success',
          title: 'High Success Rate',
          description: `${metrics.successRate.toFixed(1)}% of test documents were processed successfully.`,
        });
        score += 20;
      } else if (metrics.successRate >= 85) {
        recs.push({
          type: 'warning',
          title: 'Good Success Rate',
          description: `${metrics.successRate.toFixed(1)}% success rate. Some documents failed processing.`,
          action: 'Review failed documents and improve document quality',
        });
        score += 15;
      } else {
        recs.push({
          type: 'error',
          title: 'Low Success Rate',
          description: `Only ${metrics.successRate.toFixed(1)}% of documents processed successfully.`,
          action: 'Investigate processing failures and retrain model',
        });
        score += 5;
      }

      if (metrics.averageConfidence >= 85) {
        recs.push({
          type: 'success',
          title: 'High Confidence Predictions',
          description: `Average confidence of ${metrics.averageConfidence.toFixed(1)}% indicates reliable predictions.`,
        });
        score += 15;
      } else if (metrics.averageConfidence >= 70) {
        recs.push({
          type: 'warning',
          title: 'Moderate Confidence',
          description: `Average confidence of ${metrics.averageConfidence.toFixed(1)}% suggests some uncertainty in predictions.`,
          action: 'Consider additional training or validation data',
        });
        score += 10;
      }
    }

    // Dataset quality analysis
    if (state.labeledDocuments.length >= 50) {
      recs.push({
        type: 'success',
        title: 'Sufficient Training Data',
        description: `${state.labeledDocuments.length} labeled documents provide a solid foundation for training.`,
      });
      score += 15;
    } else if (state.labeledDocuments.length >= 20) {
      recs.push({
        type: 'warning',
        title: 'Moderate Training Data',
        description: `${state.labeledDocuments.length} labeled documents are sufficient but more data could improve performance.`,
        action: 'Consider adding more labeled documents for better accuracy',
      });
      score += 10;
    } else {
      recs.push({
        type: 'error',
        title: 'Insufficient Training Data',
        description: `Only ${state.labeledDocuments.length} labeled documents may not be enough for robust performance.`,
        action: 'Add more labeled documents before production deployment',
      });
      score += 5;
    }

    setRecommendations(recs);
    setOverallScore(Math.min(score, 100));
    setReadyForProduction(score >= 75);
  }, [state]);

  useEffect(() => {
    analyzeResults();
  }, [analyzeResults]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const generateAnalyticsData = () => {
    return {
      modelMetrics: {
        fieldAccuracy: state.trainedModel?.field_accuracy || 0,
        averageInferenceTime: state.trainedModel?.avg_inference_time || 0,
        modelSize: state.trainedModel?.model_size || 0,
        trainingTime: state.trainedModel?.training_time || 0,
      },
      testMetrics: {
        successRate: state.testResults?.metrics?.successRate || 0,
        averageConfidence: state.testResults?.metrics?.averageConfidence || 0,
        averageExtractionTime: state.testResults?.metrics?.averageExtractionTime || 0,
        totalTests: state.testResults?.metrics?.totalTests || 0,
        fieldLevelAccuracies: state.testResults?.metrics?.fieldLevelAccuracies,
      },
      datasetMetrics: {
        totalDocuments: state.labeledDocuments.length || 0,
        labeledDocuments: state.labeledDocuments.length || 0,
        averageDocumentSize: 1024000, // Mock data
        documentTypes: 1,
      },
      performanceInsights: {
        strengths: recommendations
          .filter(rec => rec.type === 'success')
          .map(rec => rec.title),
        weaknesses: recommendations
          .filter(rec => rec.type === 'error')
          .map(rec => rec.title),
        recommendations: recommendations
          .filter(rec => rec.action)
          .map(rec => rec.action!)
          .filter(Boolean),
      },
    };
  };


  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review Results
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Review your model's training and testing results to determine if it's ready for production deployment.
      </Typography>

      {/* Overall Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Performance Score
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <Box flex={1} mr={2}>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                color={getScoreColor(overallScore) as any}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Box>
            <Typography variant="h4" color={`${getScoreColor(overallScore)}.main`}>
              {overallScore}%
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {readyForProduction ? (
              <>
                <ThumbUpIcon color="success" />
                <Typography variant="h6" color="success.main">
                  Ready for Production
                </Typography>
              </>
            ) : (
              <>
                <ThumbDownIcon color="error" />
                <Typography variant="h6" color="error.main">
                  Needs Improvement
                </Typography>
              </>
            )}
          </Box>

          <Typography variant="body2" color="textSecondary" mt={1}>
            {readyForProduction
              ? 'Your model meets the recommended criteria for production deployment.'
              : 'Your model requires improvements before production deployment. Review the recommendations below.'}
          </Typography>
        </CardContent>
      </Card>

      {/* Advanced Analytics Dashboard */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Advanced Analytics
        </Typography>
        <AnalyticsDashboard data={generateAnalyticsData()} />
      </Box>

      {/* Model Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Training Summary
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText
                    primary="Document Type"
                    secondary={state.selectedDocumentType?.name || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TimelineIcon /></ListItemIcon>
                  <ListItemText
                    primary="Training Documents"
                    secondary={`${state.labeledDocuments.length} labeled documents`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AccuracyIcon /></ListItemIcon>
                  <ListItemText
                    primary="Field Accuracy"
                    secondary={state.trainedModel?.field_accuracy ? `${state.trainedModel.field_accuracy.toFixed(1)}%` : 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SpeedIcon /></ListItemIcon>
                  <ListItemText
                    primary="Inference Time"
                    secondary={state.trainedModel?.avg_inference_time ? `${state.trainedModel.avg_inference_time.toFixed(0)}ms` : 'N/A'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Testing Summary
              </Typography>
              {state.testResults?.metrics ? (
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText
                      primary="Success Rate"
                      secondary={`${state.testResults.metrics.successRate.toFixed(1)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                    <ListItemText
                      primary="Average Confidence"
                      secondary={`${state.testResults.metrics.averageConfidence.toFixed(1)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SpeedIcon /></ListItemIcon>
                    <ListItemText
                      primary="Avg Processing Time"
                      secondary={`${state.testResults.metrics.averageExtractionTime.toFixed(0)}ms`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><AssessmentIcon /></ListItemIcon>
                    <ListItemText
                      primary="Test Documents"
                      secondary={`${state.testResults.metrics.totalTests} documents tested`}
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography color="textSecondary">
                  No test results available. Please run model testing first.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Field Performance */}
      {state.testResults?.metrics?.fieldLevelAccuracies && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Field-Level Performance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell align="right">Accuracy</TableCell>
                    <TableCell align="center">Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(state.testResults.metrics.fieldLevelAccuracies).map(([field, accuracy]) => {
                    const accuracyNum = accuracy as number;
                    return (
                      <TableRow key={field}>
                        <TableCell>{field.replace(/_/g, ' ').toUpperCase()}</TableCell>
                        <TableCell align="right">{(accuracyNum * 100).toFixed(1)}%</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={accuracyNum >= 0.9 ? 'Excellent' : accuracyNum >= 0.75 ? 'Good' : 'Needs Improvement'}
                            color={accuracyNum >= 0.9 ? 'success' : accuracyNum >= 0.75 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Analysis & Recommendations
          </Typography>

          {recommendations.map((rec, index) => (
            <Alert key={index} severity={rec.type} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {rec.title}
              </Typography>
              <Typography variant="body2">
                {rec.description}
              </Typography>
              {rec.action && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  Recommended Action: {rec.action}
                </Typography>
              )}
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Training Configuration Review */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Training Configuration Review</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {state.trainingConfig && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Model Parameters
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Epochs"
                      secondary={state.trainingConfig.epochs}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Batch Size"
                      secondary={state.trainingConfig.batchSize}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Learning Rate"
                      secondary={state.trainingConfig.learningRate}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Optimizer"
                      secondary={state.trainingConfig.optimizer?.toUpperCase()}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Optimization Settings
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Mixed Precision"
                      secondary={state.trainingConfig.enableMixedPrecision ? 'Enabled' : 'Disabled'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Gradient Clipping"
                      secondary={state.trainingConfig.enableGradientClipping ? 'Enabled' : 'Disabled'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Validation Split"
                      secondary={`${(state.trainingConfig.validationSplit * 100).toFixed(0)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Early Stopping Patience"
                      secondary={state.trainingConfig.earlyStoppingPatience}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Production Readiness */}
      <Alert
        severity={readyForProduction ? 'success' : 'warning'}
        sx={{ mt: 3 }}
        action={
          readyForProduction ? (
            <Button color="inherit" size="small">
              Proceed to Deployment
            </Button>
          ) : undefined
        }
      >
        <Typography variant="subtitle2">
          {readyForProduction ? 'Production Ready!' : 'Improvements Needed'}
        </Typography>
        <Typography variant="body2">
          {readyForProduction
            ? 'Your model has passed all quality checks and is ready for production deployment. You can proceed to the final step to deploy your model.'
            : 'Your model needs improvement before production deployment. Please review the recommendations above and consider retraining or adjusting your approach.'}
        </Typography>
      </Alert>
    </Box>
  );
};

export default Step8ReviewResults;