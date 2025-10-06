import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Divider,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Business,
  Analytics,
  Security,
  Speed,
  CloudUpload
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Analytics sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Advanced Analytics',
      description: 'Get deep insights into your document processing with comprehensive analytics and reporting.'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Enterprise Security',
      description: 'Bank-level security with end-to-end encryption and compliance with industry standards.'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Lightning Fast',
      description: 'Process thousands of documents in minutes with our optimized machine learning pipeline.'
    },
    {
      icon: <CloudUpload sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Cloud Native',
      description: 'Scalable cloud infrastructure that grows with your business needs.'
    }
  ];

  if (isMobile) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 3 }}>
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Business sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Donut
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Document Intelligence Platform
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2, height: 48 }}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>

            <Box textAlign="center" mt={2}>
              <Link href="#" variant="body2" color="primary">
                Forgot your password?
              </Link>
            </Box>

            {/* Demo Credentials */}
            <Box mt={3} p={2} bgcolor="rgba(25, 118, 210, 0.08)" borderRadius={1}>
              <Typography variant="body2" color="primary" fontWeight={600} gutterBottom>
                Demo Credentials:
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Super User: chinmaytechsoft@gmail.com
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Password: Chinmay@123
              </Typography>
            </Box>

            {/* Company Branding */}
            <Box textAlign="center" mt={3} pt={2} borderTop="1px solid" borderColor="divider">
              <Typography variant="caption" color="text.secondary" display="block">
                © {new Date().getFullYear()} Chinmay Technosoft Private Limited
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All rights reserved
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Column - Features */}
      <Box
        sx={{
          flex: 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="2"/%3E%3Ccircle cx="27" cy="27" r="2"/%3E%3Ccircle cx="47" cy="47" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', color: 'white', textAlign: 'center' }}>
          <Box mb={6}>
            <Business sx={{ fontSize: 80, mb: 3 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Donut
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Transform Your Documents with AI
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: 18, lineHeight: 1.6 }}>
              Automate document processing, extract valuable data, and streamline your workflow with our cutting-edge machine learning platform.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    textAlign: 'center',
                    height: '100%'
                  }}
                >
                  <Box mb={2}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 40, color: 'white' } })}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Right Column - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 6,
              backgroundColor: 'transparent'
            }}
          >
            <Box textAlign="center" mb={4}>
              <Person sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom fontWeight={600}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to access your document intelligence dashboard
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  mb: 3,
                  height: 56,
                  borderRadius: 2,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                {isSubmitting ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} color="inherit" />
                    Signing in...
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Need help?
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Link href="#" variant="body2" color="primary" sx={{ mr: 3 }}>
                Forgot Password?
              </Link>
              <Link href="#" variant="body2" color="primary">
                Contact Support
              </Link>
            </Box>

            {/* Demo Credentials */}
            <Box mt={3} p={3} bgcolor="rgba(25, 118, 210, 0.08)" borderRadius={2}>
              <Typography variant="body1" color="primary" fontWeight={600} gutterBottom>
                Demo Credentials:
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary" mb={0.5}>
                Super User: chinmaytechsoft@gmail.com
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary">
                Password: Chinmay@123
              </Typography>
            </Box>

            {/* Company Branding */}
            <Box textAlign="center" mt={4} pt={3} borderTop="1px solid" borderColor="divider">
              <Typography variant="body2" color="text.secondary" display="block" fontWeight={500}>
                © {new Date().getFullYear()} Chinmay Technosoft Private Limited
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All rights reserved
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;