import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  CloudUpload as CloudIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';

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

const Settings: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);

  // User settings state
  const [userSettings, setUserSettings] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    timezone: 'UTC-8',
    language: 'en',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    processingComplete: true,
    trainingComplete: true,
    errorAlerts: true,
    weeklyReports: false,
    maintenanceAlerts: true,
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoProcessing: true,
    retainLogs: '30',
    maxConcurrentJobs: 5,
    defaultDocumentType: 'auto-detect',
    ocrEngine: 'advanced',
  });

  const handleUserSettingChange = (field: string, value: string) => {
    setUserSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemSettingChange = (field: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your account, system preferences, and application settings
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<StorageIcon />} label="System" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Profile Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {userSettings.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Button variant="outlined" startIcon={<EditIcon />}>
                  Change Photo
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={userSettings.name}
                    onChange={(e) => handleUserSettingChange('name', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => handleUserSettingChange('email', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={userSettings.timezone}
                      onChange={(e) => handleUserSettingChange('timezone', e.target.value)}
                      label="Timezone"
                    >
                      <MenuItem value="UTC-8">Pacific Time (UTC-8)</MenuItem>
                      <MenuItem value="UTC-5">Eastern Time (UTC-5)</MenuItem>
                      <MenuItem value="UTC+0">GMT (UTC+0)</MenuItem>
                      <MenuItem value="UTC+1">Central European Time (UTC+1)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={userSettings.language}
                      onChange={(e) => handleUserSettingChange('language', e.target.value)}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button variant="contained" sx={{ mr: 2 }}>
                  Save Changes
                </Button>
                <Button variant="outlined">
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>

          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.emailNotifications}
                  onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />

            <ListItem>
              <ListItemText
                primary="Processing Complete"
                secondary="Notify when document processing is finished"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.processingComplete}
                  onChange={(e) => handleNotificationChange('processingComplete', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Training Complete"
                secondary="Notify when model training is finished"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.trainingComplete}
                  onChange={(e) => handleNotificationChange('trainingComplete', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Error Alerts"
                secondary="Notify when processing errors occur"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.errorAlerts}
                  onChange={(e) => handleNotificationChange('errorAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Weekly Reports"
                secondary="Receive weekly performance and usage reports"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.weeklyReports}
                  onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Maintenance Alerts"
                secondary="Notify about system maintenance and updates"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.maintenanceAlerts}
                  onChange={(e) => handleNotificationChange('maintenanceAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Box mt={3}>
            <Button variant="contained">
              Save Notification Settings
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <KeyIcon color="primary" />
                    <Typography variant="h6">
                      API Keys
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Manage API keys for external integrations
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setApiKeyDialogOpen(true)}
                  >
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6">
                      Password
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Change your account password
                  </Typography>
                  <Button variant="outlined">
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <BackupIcon color="primary" />
                    <Typography variant="h6">
                      Data Backup & Export
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Download your data and create backups
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                    >
                      Export Data
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<BackupIcon />}
                      onClick={() => setBackupDialogOpen(true)}
                    >
                      Create Backup
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Security Best Practices
            </Typography>
            <Typography variant="body2">
              • Use strong, unique passwords<br/>
              • Enable two-factor authentication when available<br/>
              • Regularly review and rotate API keys<br/>
              • Keep your contact information up to date
            </Typography>
          </Alert>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Processing Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.autoProcessing}
                    onChange={(e) => handleSystemSettingChange('autoProcessing', e.target.checked)}
                  />
                }
                label="Auto-process uploaded documents"
                sx={{ display: 'block', mb: 2 }}
              />

              <TextField
                fullWidth
                label="Max Concurrent Jobs"
                type="number"
                value={systemSettings.maxConcurrentJobs}
                onChange={(e) => handleSystemSettingChange('maxConcurrentJobs', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Default Document Type</InputLabel>
                <Select
                  value={systemSettings.defaultDocumentType}
                  onChange={(e) => handleSystemSettingChange('defaultDocumentType', e.target.value)}
                  label="Default Document Type"
                >
                  <MenuItem value="auto-detect">Auto-detect</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="receipt">Receipt</MenuItem>
                  <MenuItem value="form">Form</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>OCR Engine</InputLabel>
                <Select
                  value={systemSettings.ocrEngine}
                  onChange={(e) => handleSystemSettingChange('ocrEngine', e.target.value)}
                  label="OCR Engine"
                >
                  <MenuItem value="basic">Basic OCR</MenuItem>
                  <MenuItem value="advanced">Advanced OCR</MenuItem>
                  <MenuItem value="cloud">Cloud OCR</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Storage & Logs
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Retain Logs</InputLabel>
                <Select
                  value={systemSettings.retainLogs}
                  onChange={(e) => handleSystemSettingChange('retainLogs', e.target.value)}
                  label="Retain Logs"
                >
                  <MenuItem value="7">7 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                  <MenuItem value="90">90 days</MenuItem>
                  <MenuItem value="365">1 year</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Storage Usage
                </Typography>
                <Typography variant="body2">
                  Current usage: 2.3 TB / 5 TB
                </Typography>
              </Alert>

              <Box display="flex" gap={2}>
                <Button variant="outlined" size="small">
                  Clear Cache
                </Button>
                <Button variant="outlined" size="small" color="error">
                  Clear Old Logs
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box mt={4}>
            <Typography variant="subtitle1" gutterBottom>
              System Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Application Version"
                  secondary="DocuAI v2.1.0"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Updated"
                  secondary="January 15, 2024"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="System Status"
                  secondary={
                    <Chip
                      label="All systems operational"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  }
                />
              </ListItem>
            </List>
          </Box>

          <Box mt={3}>
            <Button variant="contained" sx={{ mr: 2 }}>
              Save System Settings
            </Button>
            <Button variant="outlined">
              Reset to Defaults
            </Button>
          </Box>
        </TabPanel>
      </Card>

      {/* API Key Management Dialog */}
      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>API Key Management</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Create and manage API keys for external integrations
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Production API Key"
                secondary="Used for production integrations • Created: Jan 10, 2024"
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" color="error">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
          <Button variant="outlined" startIcon={<CloudIcon />}>
            Generate New API Key
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Select what to include in your backup
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Project configurations"
            sx={{ display: 'block', mb: 1 }}
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Trained models"
            sx={{ display: 'block', mb: 1 }}
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Processing logs"
            sx={{ display: 'block', mb: 1 }}
          />
          <FormControlLabel
            control={<Switch />}
            label="Raw document files"
            sx={{ display: 'block', mb: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setBackupDialogOpen(false)}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;