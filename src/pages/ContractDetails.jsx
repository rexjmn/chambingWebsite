import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contractService } from '../services/contractService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ContractEvidenceModal from '../components/contracts/ContractEvidenceModal';
import ContractConsentModal from '../components/contracts/ContractConsentModal';
import ContractEvidenceGallery from '../components/contracts/ContractEvidenceGallery';
import { logger } from '../utils/logger';
import {
  ArrowLeft,
  User,
  MapPin,
  Tag,
  CircleDollarSign,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Hourglass,
  KeyRound,
  Loader2,
} from 'lucide-react';
import '../styles/contractDetails.scss';

const ContractDetails = () => {
  const { t } = useTranslation();
  const { contractId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { calificadoId, calificadoNombre, titulo }
  const [contractReviews, setContractReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [autoReviewPrompted, setAutoReviewPrompted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');
  const [codigoLlegada, setCodigoLlegada] = useState(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidencePhase, setEvidencePhase] = useState('inicio');
  const [consentModalOpen, setConsentModalOpen] = useState(false);

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
    const action = location.state?.action;
    if (!action || !contractId) return;
    if (action === 'completeEvidence') {
      setEvidencePhase('final');
      setEvidenceModalOpen(true);
    }
    if (action === 'closeConsent') {
      setConsentModalOpen(true);
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, contractId, location.pathname, navigate]);

  useEffect(() => {
    if (contract?.estado === 'cerrado') {
      setReviewsLoaded(false);
      reviewService.getContractReviews(contractId)
        .then(res => setContractReviews(res.data || []))
        .catch(() => {})
        .finally(() => setReviewsLoaded(true));
    } else {
      setContractReviews([]);
      setReviewsLoaded(false);
    }
  }, [contract?.estado, contractId]);

  const getStatusChip = (estado) => {
    const statusConfig = {
      'oferta_pendiente': { cls: 'warning', icon: <Hourglass size={15} />, label: 'Oferta pendiente' },
      'confirmado': { cls: 'info', icon: <Hourglass size={15} />, label: 'Confirmado' },
      'en_camino': { cls: 'info', icon: <Hourglass size={15} />, label: 'En camino' },
      'activo': { cls: 'success', icon: <CheckCircle size={15} />, label: t('contractDetails.status.active') || 'Activo' },
      'completado': { cls: 'info', icon: <CheckCircle size={15} />, label: t('contractDetails.status.completed') || 'Completado' },
      'cerrado': { cls: 'neutral', icon: <CheckCircle size={15} />, label: t('contractDetails.status.closed') || 'Cerrado' },
      'cancelado': { cls: 'error', icon: <XCircle size={15} />, label: t('contractDetails.status.cancelled') || 'Cancelado' },
    };

    const config = statusConfig[estado] || { cls: 'neutral', icon: <Hourglass size={15} />, label: estado };

    return (
      <span className={`contract-status-badge ${config.cls}`}>
        {config.icon}
        {config.label}
      </span>
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
  // MVP: no descontar comision de plataforma todavia.
  // Cuando integremos pasarela de pago, volver a usar `contract.monto_trabajador`.
  const montoTrabajadorMvp = contract?.monto_total ?? contract?.monto_trabajador ?? 0;
  const direccionServicio =
    contract?.detalles_servicio?.direccion ||
    contract?.detallesServicio?.direccion ||
    contract?.detalles_servicio?.direccion_servicio ||
    contract?.detallesServicio?.direccion_servicio ||
    contract?.direccion_servicio ||
    '';

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

  const runConfirmarLlegada = async () => {
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
        setEvidenceModalOpen(false);
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

  const openConfirmarLlegadaFlow = () => {
    if (!codigoConfirmacion || codigoConfirmacion.length !== 4) {
      setActionError(t('contractDetails.evidence.codeRequired'));
      return;
    }
    setActionError(null);
    setEvidencePhase('inicio');
    setEvidenceModalOpen(true);
  };

  const handleCompletarContrato = async () => {
    setEvidencePhase('final');
    setEvidenceModalOpen(true);
  };

  const runCompletarContrato = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await contractService.completarContrato(contractId);
      const res = await contractService.getContractById(contractId);
      if (res.status === 'success') setContract(res.data);
      setEvidenceModalOpen(false);
    } catch (err) {
      logger.error('Error completando contrato:', err);
      setActionError(err.response?.data?.message || 'No se pudo completar el contrato.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCerrarContratoFlow = () => {
    setConsentModalOpen(true);
  };

  const runCerrarContrato = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await contractService.cerrarContrato(contractId, {
        clienteConsentimientoEvidencia: true,
      });
      const res = await contractService.getContractById(contractId);
      if (res.status === 'success') setContract(res.data);
      setConsentModalOpen(false);
      setReviewTarget({
        calificadoId: contract.trabajador?.id,
        calificadoNombre: `${contract.trabajador?.nombre} ${contract.trabajador?.apellido}`,
        titulo: 'Califica al trabajador',
      });
    } catch (err) {
      logger.error('Error cerrando contrato:', err);
      const msg = err.response?.data?.message || 'No se pudo cerrar el contrato.';
      setActionError(msg);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Determina si el usuario actual ya dejó una reseña en este contrato
  const yaResene = contractReviews.some(r => String(r.calificador?.id) === String(user?.id));

  useEffect(() => {
    if (!contract || !user) return;
    if (contract.estado !== 'cerrado') return;
    if (!reviewsLoaded) return;
    if (yaResene) return;
    if (reviewTarget || autoReviewPrompted) return;

    const otro = esTrabajador ? contract.empleador : contract.trabajador;
    if (!otro?.id) return;

    const shouldAutoOpen = Boolean(location.state?.openReview) || true;
    if (!shouldAutoOpen) return;

    setReviewTarget({
      calificadoId: otro.id,
      calificadoNombre: `${otro?.nombre || ''} ${otro?.apellido || ''}`.trim(),
      titulo: esTrabajador ? 'Califica al cliente' : 'Califica al trabajador',
    });
    setAutoReviewPrompted(true);
  }, [
    contract,
    user,
    reviewsLoaded,
    yaResene,
    reviewTarget,
    autoReviewPrompted,
    esTrabajador,
    location.state,
  ]);

  if (loading) {
    return (
      <div className="contract-details-loading">
        <Loader2 size={52} className="spin" />
        <p>{t('contractDetails.loading') || 'Cargando contrato...'}</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="contract-details-error">
        <h2>{error}</h2>
        <button className="cd-btn cd-btn--primary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          {t('contractDetails.backToDashboard') || 'Volver al Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="contract-details-page">
      <div className="contract-details-container">
        {/* Header */}
        <div className="contract-details-header">
          <button onClick={() => navigate('/dashboard')} className="contract-back-btn">
            <ArrowLeft size={16} />
            {t('contractDetails.back') || 'Volver'}
          </button>

          <div className="contract-details-header__main">
            <div className="contract-details-header__meta">
              <h1 className="contract-details-title">
                {t('contractDetails.title') || 'Detalles del Contrato'}
              </h1>
              <p className="contract-details-subline">
                {t('contractDetails.contractNumber') || 'Número de contrato'}: <strong>{contract.codigo_contrato}</strong>
              </p>
              <p className="contract-details-subline">
                {t('contractDetails.creationDate') || 'Fecha de creación'}: {formatDate(contract.fecha_creacion)}
              </p>
            </div>
            <div className="contract-details-status">
              {getStatusChip(contract.estado)}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            ACCIONES REQUERIDAS — siempre visibles al tope
            ══════════════════════════════════════════════════ */}

        {/* Oferta pendiente: cliente espera respuesta */}
        {contract.estado === 'oferta_pendiente' && esEmpleador && (
          <div className="contract-alert contract-alert--warning">
            <h3>⏳ Esperando respuesta del trabajador</h3>
            <p>
              La oferta expira en 72 horas. El trabajador recibirá un recordatorio.
            </p>
          </div>
        )}

        {/* Confirmado: empleador espera que trabajador salga */}
        {contract.estado === 'confirmado' && esEmpleador && (
          <div className="contract-alert contract-alert--pending">
            <h3>✅ Oferta aceptada</h3>
            <p>
              El trabajador confirmó. Cuando salga hacia tu ubicación recibirás una notificación.
              Al llegar, <strong>pídele un código de 4 dígitos</strong> para confirmar su identidad.
            </p>
          </div>
        )}

        {/* Confirmado: trabajador sale */}
        {contract.estado === 'confirmado' && esTrabajador && (
          <div className="contract-alert contract-alert--info">
            <h3>🚶 ¿Listo para salir?</h3>
            <p>
              Pulsa el botón cuando estés en camino. Recibirás un código de 4 dígitos que deberás decirle al cliente al llegar.
            </p>
            <button
              className="cd-btn cd-btn--primary"
              onClick={handleEnCamino}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
              {actionLoading ? 'Generando código...' : 'Estoy en camino'}
            </button>
          </div>
        )}

        {/* En camino: trabajador ve su código */}
        {contract.estado === 'en_camino' && esTrabajador && (
          <div className="contract-alert contract-alert--code">
            <h3>🔑 Tu código de verificación</h3>
            <p>
              Díselo al cliente cuando llegues a su puerta
            </p>
            <div className="contract-code">{codigoLlegada || contract.codigo_llegada}</div>
            <small>
              Válido por 4 horas · {contract.codigo_contrato}
            </small>
          </div>
        )}

        {/* En camino: cliente confirma llegada */}
        {contract.estado === 'en_camino' && esEmpleador && (
          <div className="contract-alert contract-alert--success">
            <div className="contract-inline-user">
              <div className="contract-avatar">
                {contract.trabajador?.foto_perfil ? (
                  <img src={contract.trabajador?.foto_perfil} alt={contract.trabajador?.nombre} />
                ) : (
                  contract.trabajador?.nombre?.charAt(0)
                )}
              </div>
              <div>
                <h3>
                  🚶 {contract.trabajador?.nombre} {contract.trabajador?.apellido} está en camino
                </h3>
                <p>
                  Cuando llegue, pídele su código de 4 dígitos y confírmalo aquí
                </p>
              </div>
            </div>
            <div className="contract-code-row">
              <input
                value={codigoConfirmacion}
                onChange={e => setCodigoConfirmacion(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0000"
                className="contract-code-input"
              />
              <button
                className="cd-btn cd-btn--success"
                onClick={openConfirmarLlegadaFlow}
                disabled={actionLoading || codigoConfirmacion.length !== 4}
              >
                {actionLoading ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
                {actionLoading ? 'Confirmando...' : t('contractDetails.evidence.confirmArrival')}
              </button>
            </div>
          </div>
        )}

        {/* Activo: trabajador marca como completado */}
        {esTrabajador && contract.estado === 'activo' && (
          <div className="contract-alert contract-alert--active">
            <h3>🔨 Trabajo en progreso</h3>
            <p>
              Cuando hayas terminado el trabajo, márcalo como completado para notificar al cliente.
            </p>
            <button
              className="cd-btn cd-btn--success"
              onClick={handleCompletarContrato}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {actionLoading ? 'Procesando...' : 'Marcar como completado'}
            </button>
          </div>
        )}

        {/* Completado: empleador cierra y reseña */}
        {esEmpleador && contract.estado === 'completado' && (
          <div className="contract-alert contract-alert--complete">
            <h3>⭐ El trabajador terminó el trabajo</h3>
            <p>
              Confirma que el trabajo fue realizado correctamente. Podrás dejar una reseña al cerrar.
            </p>
            <button
              className="cd-btn cd-btn--primary"
              onClick={openCerrarContratoFlow}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {actionLoading ? 'Procesando...' : 'Cerrar contrato y dejar reseña'}
            </button>
          </div>
        )}

        {/* Cerrado: dejar reseña pendiente */}
        {contract.estado === 'cerrado' && (esEmpleador || esTrabajador) && !yaResene && (
          <div className="contract-alert contract-alert--success">
            <h3>⭐ Deja tu reseña</h3>
            <p>
              Tu opinión ayuda a construir la confianza en la plataforma.
            </p>
            <button
              className="cd-btn cd-btn--outline-success"
              onClick={() => {
                const otro = esTrabajador ? contract.empleador : contract.trabajador;
                setReviewTarget({
                  calificadoId: otro?.id,
                  calificadoNombre: `${otro?.nombre} ${otro?.apellido}`,
                  titulo: esTrabajador ? 'Califica al cliente' : 'Califica al trabajador',
                });
              }}
            >
              <CheckCircle size={16} />
              Dejar reseña
            </button>
          </div>
        )}

        {contract.estado === 'cerrado' && (esEmpleador || esTrabajador) && yaResene && (
          <div className="contract-alert contract-alert--success">✓ Ya dejaste tu reseña para este contrato.</div>
        )}

        {actionError && (
          <div className="contract-alert contract-alert--error">{actionError}</div>
        )}

        <ContractEvidenceGallery
          contractId={contractId}
          evidencias={contract?.evidencias || []}
          onRefresh={async () => {
            const res = await contractService.getContractById(contractId);
            if (res.status === 'success') setContract(res.data);
          }}
        />

        {/* ══ Información del contrato ══ */}
        <div className="contract-sections">
          {/* Información de las Partes */}
          <section className="contract-card">
            <div className="contract-card-body">
              <h2 className="contract-card-title">
                  {t('contractDetails.parties.title') || '1. Información de las Partes'}
              </h2>
              <div className="contract-divider" />

                <div className="contract-two-cols">
                  {/* Cliente/Empleador */}
                  <div className="contract-person-card">
                      <p className="contract-person-role contract-person-role--client">
                        {t('contractDetails.parties.client') || 'Cliente'}
                      </p>
                      <div className="contract-person-main">
                        <div className="contract-avatar contract-avatar--lg">
                          {contract.empleador?.foto_perfil ? (
                            <img src={contract.empleador?.foto_perfil} alt={contract.empleador?.nombre} />
                          ) : (
                            contract.empleador?.nombre?.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="contract-person-name">
                            {contract.empleador?.nombre} {contract.empleador?.apellido}
                          </h3>
                          <button className="cd-btn cd-btn--outline" onClick={() => navigate(`/profile/${contract.empleador?.id}`)}>
                            Ver perfil
                          </button>
                        </div>
                      </div>
                  </div>

                  {/* Trabajador */}
                  <div className="contract-person-card">
                      <p className="contract-person-role contract-person-role--worker">
                        {t('contractDetails.parties.provider') || 'Prestador del Servicio'}
                      </p>
                      <div className="contract-person-main">
                        <div className="contract-avatar contract-avatar--lg">
                          {contract.trabajador?.foto_perfil ? (
                            <img src={contract.trabajador?.foto_perfil} alt={contract.trabajador?.nombre} />
                          ) : (
                            contract.trabajador?.nombre?.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="contract-person-name">
                            {contract.trabajador?.nombre} {contract.trabajador?.apellido}
                          </h3>
                          <button className="cd-btn cd-btn--outline-success" onClick={() => navigate(`/profile/${contract.trabajador?.id}`)}>
                            Ver perfil
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
            </div>
          </section>

          {/* Detalles del Servicio */}
          <section className="contract-card">
            <div className="contract-card-body">
                <h2 className="contract-card-title">
                  {t('contractDetails.service.title') || '2. Detalles del Servicio'}
                </h2>
                <div className="contract-divider" />

                <div className="contract-info-grid">
                  <div className="contract-info-item">
                      <Tag size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.service.category') || 'Categoría del servicio'}
                        </p>
                        <p className="value">
                          {contract.categoria?.nombre || t('contractDetails.notSpecified')}
                        </p>
                      </div>
                  </div>

                  <div className="contract-info-item">
                      <MapPin size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.service.address') || 'Dirección del servicio'}
                        </p>
                        <p className="value">
                          {direccionServicio || t('contractDetails.notSpecified')}
                        </p>
                      </div>
                  </div>

                  <div className="contract-info-item full">
                      <FileText size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.service.description') || 'Descripción del servicio'}
                        </p>
                        <p className="value">
                          {contract.detalles_servicio?.descripcion || t('contractDetails.notSpecified')}
                        </p>
                      </div>
                  </div>

                  <div className="contract-info-item">
                      <Calendar size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.service.startDate') || 'Fecha de inicio'}
                        </p>
                        <p className="value">
                          {formatDate(contract.fecha_inicio_programada)}
                        </p>
                      </div>
                  </div>

                  <div className="contract-info-item">
                      <Calendar size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.service.endDate') || 'Fecha de finalización'}
                        </p>
                        <p className="value">
                          {formatDate(contract.fecha_fin_programada)}
                        </p>
                      </div>
                  </div>

                  {contract.detalles_servicio?.notas_adicionales && (
                    <div className="contract-info-item full">
                        <FileText size={18} />
                        <div>
                          <p className="label">
                            {t('contractDetails.service.notes') || 'Notas adicionales'}
                          </p>
                          <p className="value">
                            {contract.detalles_servicio.notas_adicionales}
                          </p>
                        </div>
                    </div>
                  )}
                </div>
            </div>
          </section>

          {/* Condiciones Económicas */}
          <section className="contract-card">
            <div className="contract-card-body">
                <h2 className="contract-card-title">
                  {t('contractDetails.payment.title') || '3. Condiciones Económicas'}
                </h2>
                <div className="contract-divider" />

                <div className="contract-money-grid">
                  <div className="contract-info-item">
                      <CircleDollarSign size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.payment.totalAmount') || 'Monto total'}
                        </p>
                        <p className="value value--total">
                          {formatCurrency(contract.monto_total)}
                        </p>
                      </div>
                  </div>

                  <div className="contract-info-item">
                      <CircleDollarSign size={18} />
                      <div>
                        <p className="label">
                          {t('contractDetails.payment.workerAmount') || 'Monto trabajador'}
                        </p>
                        <p className="value value--worker">
                          {formatCurrency(montoTrabajadorMvp)}
                        </p>
                      </div>
                  </div>
                </div>
            </div>
          </section>
        </div>
      </div>

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

      <ContractEvidenceModal
        open={evidenceModalOpen}
        phase={evidencePhase}
        contractId={contractId}
        onClose={() => setEvidenceModalOpen(false)}
        onPrimary={
          evidencePhase === 'inicio' ? runConfirmarLlegada : runCompletarContrato
        }
        primaryLabel={
          evidencePhase === 'inicio'
            ? t('contractDetails.evidence.confirmArrival')
            : t('contractDetails.evidence.markComplete')
        }
      />

      <ContractConsentModal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onConfirm={runCerrarContrato}
      />

    </div>
  );
};

export default ContractDetails;
