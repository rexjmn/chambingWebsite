import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractService } from '../services/contractService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import { logger } from '../utils/logger';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  Grid,
  Paper,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import '../styles/contractDetails.scss';

const ContractDetails = () => {
  const { t } = useTranslation();
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { calificadoId, calificadoNombre, titulo }
  const [contractReviews, setContractReviews] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');
  const [codigoLlegada, setCodigoLlegada] = useState(null);

  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        const response = await contractService.getContractById(contractId);

        if (response.status === 'success') {
          setContract(response.data);
        } else {
          setError(t('contractDetails.errors.notFound') || 'Contrato no encontrado');
        }
      } catch (err) {
        logger.error('Error loading contract:', err);
        setError(t('contractDetails.errors.loadError') || 'Error al cargar el contrato');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [contractId, t]);

  useEffect(() => {
    if (contract?.estado === 'cerrado') {
      reviewService.getContractReviews(contractId)
        .then(res => setContractReviews(res.data || []))
        .catch(() => {});
    }
  }, [contract?.estado, contractId]);

  const getStatusChip = (estado) => {
    const statusConfig = {
      'oferta_pendiente': { color: 'warning', icon: <HourglassIcon />, label: 'Oferta pendiente' },
      'confirmado':        { color: 'info',    icon: <HourglassIcon />, label: 'Confirmado' },
      'en_camino':         { color: 'info',    icon: <HourglassIcon />, label: 'En camino' },
      'activo':            { color: 'success', icon: <CheckCircleIcon />, label: t('contractDetails.status.active') || 'Activo' },
      'completado':        { color: 'info',    icon: <CheckCircleIcon />, label: t('contractDetails.status.completed') || 'Completado' },
      'cerrado':           { color: 'default', icon: <CheckCircleIcon />, label: t('contractDetails.status.closed') || 'Cerrado' },
      'cancelado':         { color: 'error',   icon: <CancelIcon />,      label: t('contractDetails.status.cancelled') || 'Cancelado' },
    };

    const config = statusConfig[estado] || { color: 'default', icon: <HourglassIcon />, label: estado };

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        sx={{ fontWeight: 600, fontSize: '0.9rem' }}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('contractDetails.notSpecified') || 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Determinar rol del usuario en este contrato
  const esEmpleador  = user && contract && String(user.id) === String(contract.empleador?.id);
  const esTrabajador = user && contract && String(user.id) === String(contract.trabajador?.id);

  const handleEnCamino = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await contractService.iniciarViaje(contractId);
      if (res.status === 'success') {
        setCodigoLlegada(res.data.codigo_llegada);
        const updated = await contractService.getContractById(contractId);
        if (updated.status === 'success') setContract(updated.data);
      } else {
        setActionError(res.message || 'No se pudo iniciar el viaje.');
      }
    } catch (err) {
      logger.error('Error iniciando viaje:', err);
      setActionError(err.response?.data?.message || 'Error al iniciar el viaje.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmarLlegada = async () => {
    if (!codigoConfirmacion || codigoConfirmacion.length !== 4) {
      setActionError('El código debe tener exactamente 4 dígitos');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await contractService.confirmarLlegada(contractId, codigoConfirmacion);
      if (res.status === 'success') {
        const updated = await contractService.getContractById(contractId);
        if (updated.status === 'success') setContract(updated.data);
        setCodigoConfirmacion('');
      } else {
        setActionError(res.message || 'Código incorrecto.');
      }
    } catch (err) {
      logger.error('Error confirmando llegada:', err);
      setActionError(err.response?.data?.message || 'Código incorrecto. Verifica con el trabajador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletarContrato = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await contractService.completarContrato(contractId);
      // Recargar contrato para reflejar nuevo estado
      const res = await contractService.getContractById(contractId);
      if (res.status === 'success') setContract(res.data);
    } catch (err) {
      logger.error('Error completando contrato:', err);
      setActionError(err.response?.data?.message || 'No se pudo completar el contrato.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCerrarContrato = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await contractService.cerrarContrato(contractId);
      const res = await contractService.getContractById(contractId);
      if (res.status === 'success') setContract(res.data);
      // Abrir modal para que el empleador califique al trabajador
      setReviewTarget({
        calificadoId: contract.trabajador?.id,
        calificadoNombre: `${contract.trabajador?.nombre} ${contract.trabajador?.apellido}`,
        titulo: 'Califica al trabajador',
      });
    } catch (err) {
      logger.error('Error cerrando contrato:', err);
      setActionError(err.response?.data?.message || 'No se pudo cerrar el contrato.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determina si el usuario actual ya dejó una reseña en este contrato
  const yaResene = contractReviews.some(r => String(r.calificador?.id) === String(user?.id));

  if (loading) {
    return (
      <Box className="contract-details-loading">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {t('contractDetails.loading') || 'Cargando contrato...'}
        </Typography>
      </Box>
    );
  }

  if (error || !contract) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          {t('contractDetails.backToDashboard') || 'Volver al Dashboard'}
        </Button>
      </Container>
    );
  }

  return (
    <Box className="contract-details-page">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2 }}
          >
            {t('contractDetails.back') || 'Volver'}
          </Button>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <div>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                {t('contractDetails.title') || 'Detalles del Contrato'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('contractDetails.contractNumber') || 'Número de contrato'}: <strong>{contract.codigo_contrato}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('contractDetails.creationDate') || 'Fecha de creación'}: {formatDate(contract.fecha_creacion)}
              </Typography>
            </div>
            {getStatusChip(contract.estado)}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Información de las Partes */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t('contractDetails.parties.title') || '1. Información de las Partes'}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  {/* Cliente/Empleador */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                        {t('contractDetails.parties.client') || 'Cliente'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          src={contract.empleador?.foto_perfil}
                          sx={{ width: 60, height: 60 }}
                        >
                          {contract.empleador?.nombre?.charAt(0)}
                        </Avatar>
                        <div>
                          <Typography variant="h6" fontWeight={600}>
                            {contract.empleador?.nombre} {contract.empleador?.apellido}
                          </Typography>
                          {contract.empleador?.email && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {contract.empleador.email}
                              </Typography>
                            </Box>
                          )}
                        </div>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Trabajador */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom color="success.main">
                        {t('contractDetails.parties.provider') || 'Prestador del Servicio'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          src={contract.trabajador?.foto_perfil}
                          sx={{ width: 60, height: 60 }}
                        >
                          {contract.trabajador?.nombre?.charAt(0)}
                        </Avatar>
                        <div>
                          <Typography variant="h6" fontWeight={600}>
                            {contract.trabajador?.nombre} {contract.trabajador?.apellido}
                          </Typography>
                          {contract.trabajador?.email && (
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {contract.trabajador.email}
                              </Typography>
                            </Box>
                          )}
                        </div>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Detalles del Servicio */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t('contractDetails.service.title') || '2. Detalles del Servicio'}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={2} mb={2}>
                      <CategoryIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.service.category') || 'Categoría del servicio'}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {contract.categoria_servicio?.nombre || t('contractDetails.notSpecified')}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={2} mb={2}>
                      <LocationIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.service.address') || 'Dirección del servicio'}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {contract.detalles_servicio?.direccion || t('contractDetails.notSpecified')}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" gap={2} mb={2}>
                      <DescriptionIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.service.description') || 'Descripción del servicio'}
                        </Typography>
                        <Typography variant="body1">
                          {contract.detalles_servicio?.descripcion || t('contractDetails.notSpecified')}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={2} mb={2}>
                      <CalendarIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.service.startDate') || 'Fecha de inicio'}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDate(contract.fecha_inicio_programada)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={2} mb={2}>
                      <CalendarIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.service.endDate') || 'Fecha de finalización'}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDate(contract.fecha_fin_programada)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  {contract.detalles_servicio?.notas_adicionales && (
                    <Grid item xs={12}>
                      <Box display="flex" gap={2} mb={2}>
                        <DescriptionIcon color="action" />
                        <div>
                          <Typography variant="caption" color="text.secondary">
                            {t('contractDetails.service.notes') || 'Notas adicionales'}
                          </Typography>
                          <Typography variant="body1">
                            {contract.detalles_servicio.notas_adicionales}
                          </Typography>
                        </div>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Condiciones Económicas */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {t('contractDetails.payment.title') || '3. Condiciones Económicas'}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" gap={2} mb={2}>
                      <MoneyIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.payment.totalAmount') || 'Monto total'}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="primary">
                          {formatCurrency(contract.monto_total)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box display="flex" gap={2} mb={2}>
                      <MoneyIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.payment.workerAmount') || 'Monto trabajador'}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="success.main">
                          {formatCurrency(contract.monto_trabajador)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box display="flex" gap={2} mb={2}>
                      <MoneyIcon color="action" />
                      <div>
                        <Typography variant="caption" color="text.secondary">
                          {t('contractDetails.payment.platformFee') || 'Comisión plataforma'}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {formatCurrency(contract.comision_plataforma || 0)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Contrato confirmado, esperando que trabajador salga ── */}
          {contract.estado === 'confirmado' && esEmpleador && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    ⏳ Contrato confirmado
                  </Typography>
                  <Typography variant="body1">
                    El trabajador ha aceptado. Cuando salga hacia tu casa pulsará "Estoy en camino" y recibirás una notificación.
                    Al llegar, pídele un código de 4 dígitos para confirmar su identidad.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {contract.estado === 'confirmado' && esTrabajador && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    🚶 ¿Listo para salir?
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Pulsa el botón cuando estés en camino. Recibirás un código de 4 dígitos que deberás decirle al cliente al llegar.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleEnCamino}
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <LockOpenIcon />}
                  >
                    {actionLoading ? 'Generando código...' : 'Estoy en camino'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ── Trabajador en camino: muestra su código ── */}
          {contract.estado === 'en_camino' && esTrabajador && (
            <Grid item xs={12}>
              <Card elevation={3} sx={{ bgcolor: '#e3f2fd', border: '2px solid #1976d2' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    🔑 Tu código de verificación
                  </Typography>
                  {codigoLlegada ? (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Díselo al cliente cuando llegues a su puerta
                      </Typography>
                      <Typography variant="h2" fontWeight={900} color="primary" letterSpacing={8} sx={{ my: 2 }}>
                        {codigoLlegada}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Tu código fue enviado por WhatsApp/email. Revisa tus mensajes.
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Válido por 4 horas · {contract.codigo_contrato}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ── Cliente espera al trabajador: ingresa código ── */}
          {contract.estado === 'en_camino' && esEmpleador && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ bgcolor: '#e8f5e9', border: '2px solid #388e3c' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={contract.trabajador?.foto_perfil}
                      sx={{ width: 56, height: 56 }}
                    >
                      {contract.trabajador?.nombre?.charAt(0)}
                    </Avatar>
                    <div>
                      <Typography variant="h6" fontWeight={600}>
                        🚶 {contract.trabajador?.nombre} {contract.trabajador?.apellido} está en camino
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cuando llegue, pídele su código de 4 dígitos y confírmalo aquí
                      </Typography>
                    </div>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <TextField
                      label="Código del trabajador"
                      value={codigoConfirmacion}
                      onChange={e => setCodigoConfirmacion(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                      size="small"
                      sx={{ width: 140, bgcolor: 'white', borderRadius: 1 }}
                      placeholder="0000"
                    />
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={handleConfirmarLlegada}
                      disabled={actionLoading || codigoConfirmacion.length !== 4}
                      startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <LockOpenIcon />}
                    >
                      {actionLoading ? 'Confirmando...' : 'Confirmar llegada'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* ── Acciones del contrato ── */}
        {actionError && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
            <Typography color="error.dark" variant="body2">{actionError}</Typography>
          </Box>
        )}

        {/* Trabajador: marcar como completado cuando está activo */}
        {esTrabajador && contract.estado === 'activo' && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleCompletarContrato}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            >
              {actionLoading ? 'Procesando...' : 'Marcar como completado'}
            </Button>
          </Box>
        )}

        {/* Empleador: cerrar contrato cuando el trabajador lo marcó como completado */}
        {esEmpleador && contract.estado === 'completado' && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCerrarContrato}
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            >
              {actionLoading ? 'Procesando...' : 'Cerrar contrato y dejar reseña'}
            </Button>
          </Box>
        )}

        {/* Contrato cerrado: ambas partes pueden dejar reseña si aún no lo hicieron */}
        {contract.estado === 'cerrado' && (esEmpleador || esTrabajador) && !yaResene && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                const otro = esTrabajador ? contract.empleador : contract.trabajador;
                setReviewTarget({
                  calificadoId: otro?.id,
                  calificadoNombre: `${otro?.nombre} ${otro?.apellido}`,
                  titulo: esTrabajador ? 'Califica al cliente' : 'Califica al trabajador',
                });
              }}
            >
              Dejar reseña
            </Button>
          </Box>
        )}

        {contract.estado === 'cerrado' && (esEmpleador || esTrabajador) && yaResene && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
            <Typography variant="body2" color="success.dark">
              ✓ Ya dejaste tu reseña para este contrato.
            </Typography>
          </Box>
        )}

      </Container>

      {/* Modal de reseña — bidireccional */}
      <ReviewModal
        isOpen={!!reviewTarget}
        contratoId={contractId}
        calificadoId={reviewTarget?.calificadoId}
        calificadoNombre={reviewTarget?.calificadoNombre}
        titulo={reviewTarget?.titulo}
        onSuccess={() => { setReviewTarget(null); setContractReviews(prev => [...prev, { calificador: { id: user?.id } }]); }}
        onClose={() => setReviewTarget(null)}
        canSkip={true}
      />

    </Box>
  );
};

export default ContractDetails;
