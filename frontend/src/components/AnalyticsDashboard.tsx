import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Analytics as AccuracyIcon,
  Assessment as MetricsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon?: React.ReactElement;
}

interface AnalyticsData {
  modelMetrics: {
    fieldAccuracy: number;
    averageInferenceTime: number;
    modelSize: number;
    trainingTime: number;
  };
  testMetrics: {
    successRate: number;
    averageConfidence: number;
    averageExtractionTime: number;
    totalTests: number;
    fieldLevelAccuracies?: Record<string, number>;
  };
  datasetMetrics: {
    totalDocuments: number;
    labeledDocuments: number;
    averageDocumentSize: number;
    documentTypes: number;
  };
  performanceInsights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  compact?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  compact = false
}) => {
  const keyMetrics: MetricData[] = useMemo(() => [
    {
      label: 'Field Accuracy',
      value: data.modelMetrics.fieldAccuracy,
      unit: '%',
      trend: data.modelMetrics.fieldAccuracy >= 85 ? 'up' : 'down',
      color: data.modelMetrics.fieldAccuracy >= 85 ? 'success' : 'warning',
      icon: <AccuracyIcon />,
    },
    {
      label: 'Success Rate',
      value: data.testMetrics.successRate,
      unit: '%',
      trend: data.testMetrics.successRate >= 90 ? 'up' : 'down',
      color: data.testMetrics.successRate >= 90 ? 'success' : 'warning',
      icon: <SuccessIcon />,
    },
    {
      label: 'Inference Speed',
      value: data.modelMetrics.averageInferenceTime,
      unit: 'ms',
      trend: data.modelMetrics.averageInferenceTime <= 2000 ? 'up' : 'down',
      color: data.modelMetrics.averageInferenceTime <= 2000 ? 'success' : 'warning',
      icon: <SpeedIcon />,
    },
    {
      label: 'Avg Confidence',
      value: data.testMetrics.averageConfidence,
      unit: '%',
      trend: data.testMetrics.averageConfidence >= 80 ? 'up' : 'down',
      color: data.testMetrics.averageConfidence >= 80 ? 'success' : 'warning',
      icon: <TrendingUpIcon />,
    },
  ], [data]);

  const getPerformanceScore = () => {
    const scores = [
      data.modelMetrics.fieldAccuracy,
      data.testMetrics.successRate,
      data.testMetrics.averageConfidence,
      data.modelMetrics.averageInferenceTime <= 2000 ? 100 : 50,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'ms') return `${Math.round(value)}ms`;
    return `${value.toFixed(1)} ${unit}`;
  };

  const performanceScore = getPerformanceScore();

  if (compact) {
    return (
      <Grid container spacing={2}>
        {keyMetrics.map((metric, index) => (
          <Grid size={{ xs: 6, md: 3 }} key={index}>
            <Card>
              <CardContent sx={{ pb: '16px !important' }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {metric.icon}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {metric.label}
                  </Typography>
                </Box>
                <Typography variant="h6" color={`${metric.color}.main`}>
                  {formatValue(metric.value, metric.unit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* Performance Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Overview
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <Box flex={1} mr={2}>
              <LinearProgress
                variant="determinate"
                value={performanceScore}
                color={getScoreColor(performanceScore) as any}
                sx={{ height: 12, borderRadius: 6 }}
              />
            </Box>
            <Typography variant="h4" color={`${getScoreColor(performanceScore)}.main`}>
              {performanceScore}%
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Overall model performance based on accuracy, speed, and reliability metrics
          </Typography>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {keyMetrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="h4" color={`${metric.color}.main`}>
                      {formatValue(metric.value, metric.unit)}
                    </Typography>
                  </Box>
                  <Box color={`${metric.color}.main`}>
                    {metric.icon}
                  </Box>
                </Box>
                {metric.trend && (
                  <Box display="flex" alignItems="center">
                    {metric.trend === 'up' ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="caption"
                      color={metric.trend === 'up' ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {metric.trend === 'up' ? 'Good' : 'Needs Improvement'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Dataset Analytics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dataset Analytics
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><MetricsIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Total Documents"
                    secondary={data.datasetMetrics.totalDocuments}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                  <ListItemText
                    primary="Labeled Documents"
                    secondary={`${data.datasetMetrics.labeledDocuments} (${Math.round((data.datasetMetrics.labeledDocuments / data.datasetMetrics.totalDocuments) * 100)}%)`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText
                    primary="Document Types"
                    secondary={data.datasetMetrics.documentTypes}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SpeedIcon color="secondary" /></ListItemIcon>
                  <ListItemText
                    primary="Avg Document Size"
                    secondary={`${(data.datasetMetrics.averageDocumentSize / 1024).toFixed(1)} KB`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Field Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Field-Level Performance
              </Typography>
              {data.testMetrics.fieldLevelAccuracies ? (
                <Box>
                  {Object.entries(data.testMetrics.fieldLevelAccuracies).map(([field, accuracy]) => {
                    const accuracyPercent = (accuracy as number) * 100;
                    return (
                      <Box key={field} mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2">
                            {field.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Chip
                            label={`${accuracyPercent.toFixed(1)}%`}
                            size="small"
                            color={accuracyPercent >= 90 ? 'success' : accuracyPercent >= 75 ? 'warning' : 'error'}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={accuracyPercent}
                          color={accuracyPercent >= 90 ? 'success' : accuracyPercent >= 75 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No field-level data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Insights */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Insights
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    <SuccessIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Strengths
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'success.50' }}>
                    <List dense>
                      {data.performanceInsights.strengths.map((strength, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <Typography variant="body2">{strength}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    <WarningIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Areas for Improvement
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'warning.50' }}>
                    <List dense>
                      {data.performanceInsights.weaknesses.map((weakness, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <Typography variant="body2">{weakness}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    <InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recommendations
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'info.50' }}>
                    <List dense>
                      {data.performanceInsights.recommendations.map((recommendation, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <Typography variant="body2">{recommendation}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;