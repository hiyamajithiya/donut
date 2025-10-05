import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { Warning, Info, Error, CheckCircle } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  onConfirm,
  onCancel,
  confirmColor
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <Error sx={{ color: theme.palette.error.main, fontSize: 32 }} />;
      case 'warning':
        return <Warning sx={{ color: theme.palette.warning.main, fontSize: 32 }} />;
      case 'info':
        return <Info sx={{ color: theme.palette.info.main, fontSize: 32 }} />;
      case 'success':
        return <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 32 }} />;
      default:
        return <Warning sx={{ color: theme.palette.warning.main, fontSize: 32 }} />;
    }
  };

  const getConfirmColor = () => {
    if (confirmColor) return confirmColor;

    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 8
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {getIcon()}
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size="large"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={getConfirmColor()}
          size="large"
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;