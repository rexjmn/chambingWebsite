import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, CircularProgress, Button, Divider,
  TextField, Chip, Alert, Stack, Avatar
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
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

  const [estado, setEstado] = useState('cargando');
  const [contrato, setContrato] = useState(null);
  const [empleadorStats, setEmpleadorStats] = useState(null);
  const [empleadorReviews, setEmpleadorReviews] = useState([]);
  const [accion, setAccion] = useState(null); // null | 'rechazar'
  const [mensaje, setMensaje] = useState('');  // mensaje opcional (aceptar o rechazar)
  const [enviando, setEnviando] = useState(false);
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  useEffect(() => {
    if (!token) { setEstado('error'); return; }

    api.get(`/contracts/oferta/${token}`)
      .then(res => {
        if (res.data.status === 'success') {
          const data = res.data.data;
          setContrato(data);
          setEstado('loaded');
          // Solo pre-abrir formulario de rechazo si llega con accion=rechazar
          // NUNCA auto-aceptar: el trabajador siempre decide en la página
          if (accionInicial === 'rechazar') setAccion('rechazar');

          const empleadorId = data.empleador?.id;
          if (empleadorId) {
            api.get(`/users/${empleadorId}/stats`).then(r => setEmpleadorStats(r.data?.data)).catch(() => {});
            api.get(`/users/${empleadorId}/reviews`).then(r => setEmpleadorReviews(r.data?.data?.slice(0, 3) || [])).catch(() => {});
          }
        } else {
          setEstado('error');
        }
      })
      .catch(() => setEstado('error'));
  }, [token]);

  const aceptar = async () => {
    setEnviando(true);
    try {
      const res = await api.post(`/contracts/oferta/${token}/aceptar`, {
        mensaje: mensaje.trim() || undefined,
      });
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
        comentario: mensaje.trim() || undefined,
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

        {/* Perfil del cliente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <Avatar
            src={empleador?.foto_perfil}
            sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
          >
            {empleador?.nombre?.charAt(0)}
          </Avatar>
          <Box>
            <Typography fontWeight="bold">
              {empleador?.nombre} {empleador?.apellido}
            </Typography>
            {empleadorStats && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                {Array.from({ length: 5 }, (_, i) => {
                  const avg = empleadorStats.rating || 0;
                  return i < Math.round(avg)
                    ? <StarIcon key={i} sx={{ fontSize: 16, color: 'warning.main' }} />
                    : <StarOutlineIcon key={i} sx={{ fontSize: 16, color: 'text.disabled' }} />;
                })}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  {empleadorStats.rating
                    ? `${Number(empleadorStats.rating).toFixed(1)} (${empleadorStats.total_reviews || 0} reseñas)`
                    : 'Sin reseñas aún'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Reseñas recientes del cliente */}
        {empleadorReviews.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Lo que dicen trabajadores anteriores
            </Typography>
            <Stack spacing={1}>
              {empleadorReviews.map((r) => (
                <Box key={r.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 0.2, mt: 0.2, flexShrink: 0 }}>
                    {Array.from({ length: r.estrellas }, (_, i) => (
                      <StarIcon key={i} sx={{ fontSize: 12, color: 'warning.main' }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    "{r.comentario?.slice(0, 100)}{r.comentario?.length > 100 ? '…' : ''}"
                    {' '}— {r.calificador?.nombre}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

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

        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={accion === 'rechazar' ? 'Motivo del rechazo (opcional)' : 'Mensaje para el cliente (opcional)'}
            placeholder={accion === 'rechazar' ? 'Ej: No tengo disponibilidad en esas fechas...' : 'Ej: ¡Con gusto! Estaré puntual.'}
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            inputProps={{ maxLength: 500 }}
            sx={{ mb: 2 }}
          />

          {accion !== 'rechazar' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                color="success"
                size="large"
                fullWidth
                disabled={enviando}
                onClick={aceptar}
              >
                {enviando ? <CircularProgress size={22} color="inherit" /> : '✓ Aceptar oferta'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                fullWidth
                disabled={enviando}
                onClick={() => setAccion('rechazar')}
              >
                ✗ Rechazar
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => setAccion(null)} disabled={enviando}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                disabled={enviando}
                onClick={rechazar}
              >
                {enviando ? <CircularProgress size={22} color="inherit" /> : 'Confirmar rechazo'}
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
