import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { useTranslations } from '../hooks/useTranslations';

const PinModal = ({ open, onClose, onSubmit, contractCode }) => {
  const { t } = useTranslations();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!pin || pin.length !== 6) {
      setError(t('dashboard.contract.invalidPin') || 'PIN debe tener 6 dígitos');
      return;
    }
    onSubmit(pin);
    setPin('');
    setError('');
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('dashboard.contract.activateContract')}</DialogTitle>
      <DialogContent>
        <p>{t('dashboard.contract.enterPinMessage', { code: contractCode })}</p>
        <TextField
          autoFocus
          margin="dense"
          label={t('dashboard.contract.pin')}
          type="text"
          fullWidth
          value={pin}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setPin(value);
            setError('');
          }}
          inputProps={{
            maxLength: 6,
            pattern: '[0-9]*',
            inputMode: 'numeric'
          }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {t('dashboard.contract.activate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PinModal;
