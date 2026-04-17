import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractService } from '../services/contractService';
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

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

  const getStatusChip = (estado) => {
    const statusConfig = {
      'pendiente_activacion': {
        color: 'warning',
        icon: <HourglassIcon />,
        label: t('contractDetails.status.pending') || 'Pendiente de Activación'
      },
      'activo': {
        color: 'success',
        icon: <CheckCircleIcon />,
        label: t('contractDetails.status.active') || 'Activo'
      },
      'completado': {
        color: 'info',
        icon: <CheckCircleIcon />,
        label: t('contractDetails.status.completed') || 'Completado'
      },
      'cancelado': {
        color: 'error',
        icon: <CancelIcon />,
        label: t('contractDetails.status.cancelled') || 'Cancelado'
      },
      'cerrado': {
        color: 'default',
        icon: <CheckCircleIcon />,
        label: t('contractDetails.status.closed') || 'Cerrado'
      }
    };

    const config = statusConfig[estado] || statusConfig['pendiente_activacion'];

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
      setShowReviewModal(true);
    } catch (err) {
      logger.error('Error cerrando contrato:', err);
      setActionError(err.response?.data?.message || 'No se pudo cerrar el contrato.');
    } finally {
      setActionLoading(false);
    }
  };

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

          {/* Estado y Aceptación */}
          {contract.estado === 'pendiente_activacion' && contract.pin_activacion && (
            <Grid item xs={12}>
              <Card elevation={2} sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {t('contractDetails.activation.title') || '⚠️ Pendiente de Activación'}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {t('contractDetails.activation.message') || 'Este contrato requiere activación por parte del trabajador.'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('contractDetails.activation.pin') || 'PIN de activación'}:</strong>
                    <code style={{
                      marginLeft: '10px',
                      padding: '4px 12px',
                      background: 'rgba(0,0,0,0.1)',
                      borderRadius: '4px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {contract.pin_activacion}
                    </code>
                  </Typography>
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

      </Container>

      {/* Modal de reseña — se abre tras cerrar el contrato */}
      <ReviewModal
        isOpen={showReviewModal}
        contratoId={contractId}
        trabajadorId={contract?.trabajador?.id}
        trabajadorNombre={contract ? `${contract.trabajador?.nombre} ${contract.trabajador?.apellido}` : ''}
        onSuccess={() => setShowReviewModal(false)}
        onClose={() => setShowReviewModal(false)}
        canSkip={true}
      />

    </Box>
  );
};

export default ContractDetails;
