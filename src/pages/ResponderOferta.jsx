import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, CircularProgress, Button, Divider,
  TextField, Chip, Alert, Stack
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../services/api';

const MODALIDAD_LABELS = {
  hora: 'Por hora',
  dia: 'Por día',
  semana: 'Por semana',
  mes: 'Por mes',
  proyecto: 'Proyecto fijo',
};

export default function ResponderOferta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const accionInicial = searchParams.get('accion'); // 'aceptar' | 'rechazar'

  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'loaded' | 'respondido' | 'error'
  const [contrato, setContrato] = useState(null);
  const [accion, setAccion] = useState(null); // null | 'rechazar'
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  useEffect(() => {
    if (!token) {
      setEstado('error');
      return;
    }

    api.get(`/contracts/oferta/${token}`)
      .then(res => {
        if (res.data.status === 'success') {
          setContrato(res.data.data);
          setEstado('loaded');
          if (accionInicial === 'aceptar') aceptar(token);
          if (accionInicial === 'rechazar') setAccion('rechazar');
        } else {
          setEstado('error');
        }
      })
      .catch(() => setEstado('error'));
  }, [token]);

  const aceptar = async (t = token) => {
    setEnviando(true);
    try {
      const res = await api.post(`/contracts/oferta/${t}/aceptar`);
      setResultadoMensaje(res.data.message);
      setResultadoExito(res.data.status === 'success');
      setEstado('respondido');
    } catch (err) {
      setResultadoMensaje(err.response?.data?.message || 'Error al aceptar la oferta.');
      setResultadoExito(false);
      setEstado('respondido');
    } finally {
      setEnviando(false);
    }
  };

  const rechazar = async () => {
    setEnviando(true);
    try {
      const res = await api.post(`/contracts/oferta/${token}/rechazar`, {
        comentario: comentario.trim() || undefined,
      });
      setResultadoMensaje(res.data.message);
      setResultadoExito(res.data.status === 'success');
      setEstado('respondido');
    } catch (err) {
      setResultadoMensaje(err.response?.data?.message || 'Error al rechazar la oferta.');
      setResultadoExito(false);
      setEstado('respondido');
    } finally {
      setEnviando(false);
    }
  };

  if (estado === 'cargando') {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (estado === 'error') {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={3} sx={{ p: 5, maxWidth: 480, textAlign: 'center', borderRadius: 3 }}>
          <CancelOutlinedIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>Oferta no disponible</Typography>
          <Typography color="text.secondary">
            Este enlace es inválido, ha expirado, o la oferta ya fue respondida anteriormente.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (estado === 'respondido') {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={3} sx={{ p: 5, maxWidth: 480, textAlign: 'center', borderRadius: 3 }}>
          {resultadoExito
            ? <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            : <CancelOutlinedIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />}
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {resultadoExito ? '¡Listo!' : 'Algo salió mal'}
          </Typography>
          <Typography color="text.secondary">{resultadoMensaje}</Typography>
          {resultadoExito && (
            <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
              El cliente ha sido notificado. Coordina los detalles finales cuando te contacten.
            </Alert>
          )}
        </Paper>
      </Box>
    );
  }

  // Estado: loaded
  const { empleador, trabajador, categoria, detalles_servicio, modalidad, monto_total, fecha_inicio_programada, fecha_fin_programada } = contrato;

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, width: '100%', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Nueva oferta de trabajo
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>{empleador?.nombre} {empleador?.apellido}</strong> te está ofreciendo trabajo.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <WorkOutlineIcon sx={{ color: 'primary.main', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2">Servicio</Typography>
              <Typography>{categoria?.nombre}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {detalles_servicio?.descripcion}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <LocationOnOutlinedIcon sx={{ color: 'primary.main', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2">Lugar</Typography>
              <Typography>{detalles_servicio?.direccion || 'No especificado'}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <AttachMoneyIcon sx={{ color: 'primary.main', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2">Tarifa</Typography>
              <Typography fontWeight="bold">${Number(monto_total).toFixed(2)}</Typography>
              <Chip label={MODALIDAD_LABELS[modalidad] || modalidad} size="small" sx={{ mt: 0.5 }} />
            </Box>
          </Box>

          {(fecha_inicio_programada || fecha_fin_programada) && (
            <Box>
              <Typography variant="subtitle2">Fechas</Typography>
              {fecha_inicio_programada && (
                <Typography variant="body2">
                  Inicio: {new Date(fecha_inicio_programada).toLocaleDateString('es-SV')}
                </Typography>
              )}
              {fecha_fin_programada && (
                <Typography variant="body2">
                  Fin: {new Date(fecha_fin_programada).toLocaleDateString('es-SV')}
                </Typography>
              )}
            </Box>
          )}

          {detalles_servicio?.notas_adicionales && (
            <Box>
              <Typography variant="subtitle2">Notas del cliente</Typography>
              <Typography variant="body2" color="text.secondary">
                {detalles_servicio.notas_adicionales}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {accion !== 'rechazar' ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              disabled={enviando}
              onClick={() => aceptar()}
            >
              {enviando ? <CircularProgress size={22} color="inherit" /> : '✓ Aceptar oferta'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              fullWidth
              onClick={() => setAccion('rechazar')}
            >
              ✗ Rechazar
            </Button>
          </Stack>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Motivo del rechazo (opcional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Ej: No tengo disponibilidad en esas fechas..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => setAccion(null)} disabled={enviando}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={enviando}
                onClick={rechazar}
              >
                {enviando ? <CircularProgress size={22} color="inherit" /> : 'Confirmar rechazo'}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
