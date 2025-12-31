import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';

const TextInputModal = ({ open, onClose, onSubmit, title, label, placeholder, required = true }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (required && !value.trim()) {
      setError('Este campo es requerido');
      return;
    }
    onSubmit(value.trim());
    setValue('');
    setError('');
  };

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={label}
          type="text"
          fullWidth
          multiline
          rows={3}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          placeholder={placeholder}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextInputModal;
