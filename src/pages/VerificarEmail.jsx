import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'exito' | 'error'
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setEstado('error');
      setMensaje('Token de verificación no encontrado en el enlace.');
      return;
    }

    axios.get(`${API_URL}/api/users/verificar-email?token=${token}`)
      .then(res => {
        if (res.data.status === 'success') {
          setEstado('exito');
          setMensaje(res.data.message);
        } else {
          setEstado('error');
          setMensaje(res.data.message || 'No se pudo verificar el email.');
        }
      })
      .catch(err => {
        setEstado('error');
        setMensaje(err.response?.data?.message || 'Token inválido o expirado.');
      });
  }, []);

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: '#f5f5f5',
      }}
    >
      <Paper elevation={3} sx={{ p: 5, maxWidth: 480, width: '100%', textAlign: 'center', borderRadius: 3 }}>
        {estado === 'cargando' && (
          <>
            <CircularProgress size={56} sx={{ mb: 3 }} />
            <Typography variant="h6">Verificando tu cuenta...</Typography>
          </>
        )}

        {estado === 'exito' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              ¡Email verificado!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {mensaje}
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </>
        )}

        {estado === 'error' && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Enlace inválido
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {mensaje}
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/')}>
              Ir al inicio
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
