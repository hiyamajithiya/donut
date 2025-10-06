import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as MetricsIcon,
  Speed as PerformanceIcon,
  Analytics as AccuracyIcon,
  Timeline as TimelineIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { modelsAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Analytics: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await modelsAPI.getAnalytics();
        setAnalyticsData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.error || 'Failed to load analytics');
        // Set default values if API fails
        setAnalyticsData({
          overview: {
            total_models: 0,
            production_models: 0,
            models_trained_last_30_days: 0,
          },
          by_document_type: {},
          recent_performance: [],
          top_used_models: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedProject, timeRange]);

  // Use real data or fallback to defaults
  const overviewMetrics = {
    totalDocuments: 0,
    processedDocuments: 0,
    successRate: 0,
    averageAccuracy: 0,
    averageProcessingTime: 0,
    totalProjects: analyticsData?.overview?.total_models || 0,
    activeModels: analyticsData?.overview?.production_models || 0,
    dataVolume: '0 GB',
  };

  const performanceData = [
    {
      model: 'Invoice Processing v2.1',
      accuracy: 96.5,
      speed: '1.2s',
      throughput: '450/hr',
      status: 'excellent',
    },
    {
      model: 'Contract Analysis v1.3',
      accuracy: 92.1,
      speed: '3.8s',
      throughput: '120/hr',
      status: 'good',
    },
    {
      model: 'Receipt Processing v1.0',
      accuracy: 94.2,
      speed: '0.8s',
      throughput: '680/hr',
      status: 'excellent',
    },
  ];

  const fieldAccuracy = [
    { field: 'Invoice Number', accuracy: 98.5, confidence: 97.2 },
    { field: 'Total Amount', accuracy: 96.8, confidence: 95.1 },
    { field: 'Date', accuracy: 94.3, confidence: 92.8 },
    { field: 'Vendor Name', accuracy: 92.1, confidence: 89.6 },
    { field: 'Line Items', accuracy: 88.7, confidence: 85.3 },
  ];

  const insights = [
    {
      type: 'success',
      title: 'High Performance Model',
      description: 'Invoice Processing v2.1 is performing excellently with 96.5% accuracy',
      icon: <SuccessIcon />,
    },
    {
      type: 'warning',
      title: 'Field Accuracy Alert',
      description: 'Line Items extraction needs improvement - consider additional training data',
      icon: <WarningIcon />,
    },
    {
      type: 'info',
      title: 'Processing Volume',
      description: 'Document processing volume increased by 23% this month',
      icon: <InfoIcon />,
    },
    {
      type: 'error',
      title: 'Error Rate Increase',
      description: 'Contract analysis showing 5% error rate increase - investigate data quality',
      icon: <ErrorIcon />,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'info';
      case 'needs_improvement':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'success';
    if (accuracy >= 90) return 'info';
    if (accuracy >= 80) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive insights into your document processing performance
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              label="Project"
            >
              <MenuItem value="all">All Projects</MenuItem>
              <MenuItem value="invoice">Invoice Processing</MenuItem>
              <MenuItem value="contract">Contract Analysis</MenuItem>
              <MenuItem value="receipt">Receipt Processing</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <MetricsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.totalDocuments.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Documents
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    <TrendingUpIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    +12% vs last month
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
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.successRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Success Rate
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    <TrendingUpIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    +2.3% vs last month
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
                  <AccuracyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.averageAccuracy}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Accuracy
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    <TrendingUpIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    +1.8% vs last month
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
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PerformanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overviewMetrics.averageProcessingTime}s
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Processing Time
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    <TrendingDownIcon sx={{ fontSize: 12, mr: 0.5 }} />
                    +0.3s vs last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Performance Overview" />
            <Tab label="Field Analysis" />
            <Tab label="Model Comparison" />
            <Tab label="Insights & Recommendations" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Typography variant="h6" gutterBottom>
                Model Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Accuracy</TableCell>
                      <TableCell>Speed</TableCell>
                      <TableCell>Throughput</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceData.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {model.model}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="bold">
                              {model.accuracy}%
                            </Typography>
                            <Chip
                              size="small"
                              label={model.accuracy >= 95 ? 'Excellent' : model.accuracy >= 90 ? 'Good' : 'Needs Work'}
                              color={getAccuracyColor(model.accuracy) as any}
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{model.speed}</TableCell>
                        <TableCell>{model.throughput}</TableCell>
                        <TableCell>
                          <Chip
                            label={model.status}
                            size="small"
                            color={getStatusColor(model.status) as any}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TimelineIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Active Models"
                    secondary={`${overviewMetrics.activeModels} models in production`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MetricsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Volume"
                    secondary={`${overviewMetrics.dataVolume} processed`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SuccessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Uptime"
                    secondary="99.8% this month"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Field Extraction Accuracy
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field Name</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Recommendations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fieldAccuracy.map((field) => (
                  <TableRow key={field.field}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {field.field}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {field.accuracy}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {field.confidence}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={field.accuracy >= 95 ? 'Excellent' : field.accuracy >= 90 ? 'Good' : 'Needs Work'}
                        color={getAccuracyColor(field.accuracy) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {field.accuracy < 90 ? (
                        <Typography variant="caption" color="warning.main">
                          Consider additional training data
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="success.main">
                          Performing well
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Model Comparison
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Compare different model versions and configurations to optimize performance.
          </Alert>
          <Paper sx={{ p: 3, textAlign: 'center', minHeight: 200 }}>
            <Typography variant="h6" color="textSecondary">
              Model Comparison Charts
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={2}>
              Interactive charts comparing model performance, accuracy trends, and resource usage would be displayed here.
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            AI-Powered Insights & Recommendations
          </Typography>
          <Grid container spacing={3}>
            {insights.map((insight, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={index}>
                <Alert
                  severity={insight.type as any}
                  icon={insight.icon}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {insight.title}
                  </Typography>
                  <Typography variant="body2">
                    {insight.description}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Optimization Recommendations
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Increase training data for line items"
                  secondary="Adding 200+ more examples could improve accuracy by 5-8%"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PerformanceIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Optimize preprocessing pipeline"
                  secondary="Image preprocessing optimizations could reduce processing time by 15%"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccuracyIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Review contract model configuration"
                  secondary="Model may benefit from architecture adjustments or hyperparameter tuning"
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Analytics;