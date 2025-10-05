import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Container,
  Stack
} from '@mui/material';
import { Refresh, Home, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // In production, you would send this to your error reporting service
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    alert('Error details copied to clipboard. Please send this to support.');
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <BugReport sx={{ fontSize: 64, color: 'error.main' }} />

              <Typography variant="h4" color="error" gutterBottom>
                Oops! Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary" maxWidth="sm">
                We're sorry for the inconvenience. An unexpected error occurred while loading this page.
              </Typography>

              {isDevelopment && this.state.error && (
                <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error: {this.state.error.message}
                  </Typography>
                  {this.state.error.stack && (
                    <Box component="pre" sx={{
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 200,
                      mt: 1
                    }}>
                      {this.state.error.stack}
                    </Box>
                  )}
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                  size="large"
                >
                  Refresh Page
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Go Home
                </Button>
              </Stack>

              {!isDevelopment && (
                <Button
                  variant="text"
                  startIcon={<BugReport />}
                  onClick={this.handleReportError}
                  size="small"
                  color="inherit"
                >
                  Report Error
                </Button>
              )}

              <Typography variant="caption" color="text.secondary">
                If this problem persists, please contact support.
              </Typography>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;