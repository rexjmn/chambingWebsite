import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const SuccessSnackbar = ({ open, message, onClose, severity = 'success' }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SuccessSnackbar;
