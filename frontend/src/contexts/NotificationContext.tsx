import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Slide,
  SlideProps,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface Notification {
  id: string;
  message: string;
  type: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

interface NotificationContextType {
  showNotification: (message: string, type?: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    message: string,
    type: AlertColor = 'info',
    duration: number = 6000
  ) => {
    const id = generateId();
    const notification: Notification = {
      id,
      message,
      type,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }
  }, [hideNotification]);


  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification(message, 'error', duration || 8000); // Longer duration for errors
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };

  // Get the topmost notification
  const currentNotification = notifications[notifications.length - 1];

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!currentNotification}
        autoHideDuration={currentNotification?.duration || 6000}
        onClose={() => currentNotification && hideNotification(currentNotification.id)}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {currentNotification && (
          <Alert
            onClose={() => hideNotification(currentNotification.id)}
            severity={currentNotification.type}
            variant="filled"
            action={
              currentNotification.action || (
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => hideNotification(currentNotification.id)}
                >
                  <Close fontSize="small" />
                </IconButton>
              )
            }
            sx={{ minWidth: 300 }}
          >
            {currentNotification.message}
          </Alert>
        )}
      </Snackbar>
    </NotificationContext.Provider>
  );
};