import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', severity = 'warning' }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const colorMap = {
    warning: 'warning',
    error: 'error',
    info: 'info',
    success: 'success'
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={colorMap[severity] || 'warning'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
