import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { contractService } from '../services/contractService';
import adminService from '../services/adminService';
import { workerService } from '../services/workerService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import AvailabilityCalendar from '../components/calendar/AvailabilityCalendar';
import '../styles/createContract.scss';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  DateRange as DateRangeIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';

// ── Helpers de formato de fecha ───────────────────────────────────────────────
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const formatFecha = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};

// ── Constantes fuera del componente (no se recrean en cada render) ─────────────
const PAYMENT_MODES = [
  { value: 'hora',     label: 'Por Hora',     desc: 'Pagas por cada hora trabajada',       icon: <TimeIcon />,        unit: '/hora' },
  { value: 'dia',      label: 'Por Día',      desc: 'Precio fijo por día completo',         icon: <CalendarIcon />,    unit: '/día' },
  { value: 'semana',   label: 'Por Semana',   desc: 'Precio acordado por semana',           icon: <DateRangeIcon />,   unit: '/semana' },
  { value: 'mes',      label: 'Por Mes',      desc: 'Trabajo mensual fijo',                 icon: <DateRangeIcon />,   unit: '/mes' },
  { value: 'proyecto', label: 'Precio Total', desc: 'Un precio fijo por todo el trabajo',  icon: <AssignmentIcon />,  unit: 'total' },
];

// Tarifa del trabajador para una modalidad (null si no aplica)
const getWorkerRate = (modalidad, tarifas) => {
  if (!tarifas) return null;
  const map = { hora: tarifas.tarifa_hora, dia: tarifas.tarifa_dia, semana: tarifas.tarifa_semana, mes: tarifas.tarifa_mes };
  return map[modalidad] || null;
};

// ─────────────────────────────────────────────────────────────────────────────

const CreateContractSimple = () => {
  useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const workerId = searchParams.get('workerId');

  const [worker, setWorker] = useState(null);
  const [workerTarifas, setWorkerTarifas] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdContract, setCreatedContract] = useState(null);
  // Slots de hora confirmados desde el calendario
  const [confirmedSlots, setConfirmedSlots] = useState([]);

  const [formData, setFormData] = useState({
    trabajador_id: workerId || '',
    categoria_id: '',
    modalidad: 'proyecto',
    descripcion: '',
    direccion: '',
    monto: '',
    cantidad: '1',
    fecha_inicio: '',
    fecha_fin: '',
    notas: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const categoriesData = await adminService.getCategories();
        setCategories(categoriesData || []);

        if (workerId) {
          const workerResponse = await workerService.getWorkerById(workerId);
          if (workerResponse.status === 'success') {
            setWorker(workerResponse.data);
          }
          // Cargar tarifas predefinidas (puede no existir → null)
          try {
            const tarifas = await serviceService.getTarifasByWorker(workerId);
            setWorkerTarifas(tarifas);
          } catch {
            setWorkerTarifas(null);
          }
        }
      } catch (err) {
        logger.error('Error loading data:', err);
        setError('Error al cargar los datos necesarios');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, workerId, navigate]);

  // ── Cálculo del total ─────────────────────────────────────────────────────
  const calculateTotal = () => {
    const monto = parseFloat(formData.monto) || 0;
    const cantidad = parseInt(formData.cantidad) || 1;
    return formData.modalidad === 'proyecto' ? monto : monto * cantidad;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalidadChange = (modalidad) => {
    setFormData(prev => ({ ...prev, modalidad, cantidad: '1' }));
    setConfirmedSlots([]); // limpiar selección previa al cambiar modo
  };

  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      fecha_inicio: date.toISOString().split('T')[0],
    }));
    setConfirmedSlots([]);
  };

  // Recibe días/semanas/meses confirmados desde el calendario (modos dia/semana/mes)
  const handleDaysConfirm = ({ fechaInicio, fechaFin, count }) => {
    setConfirmedSlots([]);
    setFormData(prev => ({
      ...prev,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || '',
      cantidad: String(count),
    }));
  };

  // Recibe los slots confirmados desde el calendario y extrae fecha_inicio
  const handleSlotsConfirm = (slots) => {
    setConfirmedSlots(slots);
    if (slots.length > 0) {
      setFormData(prev => ({
        ...prev,
        fecha_inicio: slots[0].dateStr,
        // Si todos los slots son del mismo día, calcular cantidad automáticamente
        cantidad: prev.modalidad === 'hora'
          ? String(slots.filter(s => s.dateStr === slots[0].dateStr).length)
          : prev.cantidad,
      }));
    }
  };

  // Seleccionar una tarifa predefinida del trabajador
  const handleSelectTarifa = (modalidad, monto) => {
    setFormData(prev => ({ ...prev, modalidad, monto: String(monto), cantidad: '1' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.trabajador_id) {
        setError('Debes seleccionar un trabajador');
        return;
      }
      if (!formData.categoria_id) {
        setError('Debes seleccionar un tipo de servicio');
        return;
      }
      if (!formData.descripcion || formData.descripcion.trim().length < 10) {
        setError('Describe el trabajo con al menos 10 caracteres');
        return;
      }
      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        setError('El precio debe ser mayor a $0');
        return;
      }

      const currentUser = user || JSON.parse(localStorage.getItem('user'));

      const contractData = {
        empleadorId: currentUser.id,
        trabajadorId: formData.trabajador_id,
        categoriaId: formData.categoria_id,
        modalidad: formData.modalidad,
        ...(formData.modalidad !== 'proyecto' && { cantidad: parseInt(formData.cantidad) || 1 }),
        ...(formData.fecha_inicio && { fechaInicio: formData.fecha_inicio }),
        ...(formData.fecha_fin && formData.fecha_fin > formData.fecha_inicio && { fechaFin: formData.fecha_fin }),
        detallesServicio: {
          descripcion: formData.descripcion,
          direccion: formData.direccion || 'Por definir',
          ...(formData.notas && { notas_adicionales: formData.notas }),
        },
        terminosCondiciones: 'Términos y condiciones estándar de ChambingApp',
        monto: parseFloat(formData.monto),
        metodoPago: 'efectivo',
      };

      logger.api('Creando contrato', contractData);
      const response = await contractService.createContract(contractData);

      if (response.status === 'success') {
        setSuccess(true);
        setCreatedContract(response.data);
        logger.api('Contrato creado', response.data);
      }
    } catch (err) {
      logger.error('Error creating contract:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al crear el contrato. Por favor intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="create-contract-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (success && createdContract) {
    const total = calculateTotal();
    return (
      <div className="create-contract-page">
        <div className="success-container">
          <CheckCircleIcon className="success-icon" />
          <h2>¡Contrato Creado!</h2>
          <p className="success-subtitle">El trabajador recibirá tu solicitud</p>

          <div className="contract-info">
            <div className="info-row">
              <span className="info-label">Código del contrato</span>
              <code className="contract-code">{createdContract.codigo_contrato}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Total a pagar</span>
              <span className="amount">${total.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Modalidad</span>
              <span>{PAYMENT_MODES.find(m => m.value === formData.modalidad)?.label}</span>
            </div>
            {formData.fecha_inicio && (
              <div className="info-row">
                <span className="info-label">Fecha de inicio</span>
                <span>{formatFecha(formData.fecha_inicio)}</span>
              </div>
            )}

          </div>

          <div className="success-actions">
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Ir al Dashboard
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">
              Crear Otro Contrato
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────
  const selectedMode = PAYMENT_MODES.find(m => m.value === formData.modalidad);
  const total = calculateTotal();
  const descLen = formData.descripcion.length;
  const formIsReady = formData.categoria_id && descLen >= 10 && formData.monto && parseFloat(formData.monto) > 0;

  return (
    <div className="create-contract-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowBackIcon />
          Volver
        </button>

        <div className="page-header">
          <AssignmentIcon className="header-icon" />
          <div>
            <h1>Contratar Trabajador</h1>
            <p>Completa los datos y crea tu contrato en segundos</p>
          </div>
        </div>

        {/* Tarjeta del trabajador */}
        {worker && (
          <div className="worker-info-card">
            <div className="worker-avatar">
              <PersonIcon />
            </div>
            <div className="worker-details">
              <p className="worker-label">Vas a contratar a</p>
              <p className="worker-name">{worker.nombre} {worker.apellido}</p>
              {worker.titulo_profesional && (
                <p className="worker-title">{worker.titulo_profesional}</p>
              )}
            </div>
            <CheckCircleIcon className="worker-check-icon" />
          </div>
        )}

        {error && (
          <div className="error-message">⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="contract-form">

          {/* ── PASO 1: ¿Qué necesitas? ── */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="step-badge">1</span>
              ¿Qué necesitas?
            </h3>

            <div className="form-group">
              <label htmlFor="descripcion">Describe el trabajo *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej: Necesito que arreglen la fuga del lavamanos del baño principal..."
                rows="4"
                required
                className="form-textarea"
              />
              <small className={`form-help ${descLen >= 10 ? 'help-ok' : ''}`}>
                {descLen < 10
                  ? `Escribe al menos ${10 - descLen} caracteres más`
                  : `✓ Descripción lista`}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="categoria_id">
                <CategoryIcon sx={{ fontSize: 18 }} />
                Tipo de servicio *
              </label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── PASO 2 (COMBINADO): ¿Cuándo y cuánto pagas? ── */}
          {/* MEJORA: Precio + fecha unificados — elegir modalidad ANTES del calendario
              permite que el auto-cálculo de horas/días funcione correctamente */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="step-badge">2</span>
              ¿Cuándo y cuánto pagas?
            </h3>

            {/* ── SUB: PRECIO — tarjetas unificadas con tarifa integrada ── */}
            <p className="subsection-label">Elige cómo quieres pagar</p>

            <div className="payment-modes">
              {PAYMENT_MODES.map(mode => {
                const workerRate = getWorkerRate(mode.value, workerTarifas);
                const isSelected = formData.modalidad === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    className={`mode-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (workerRate) {
                        handleSelectTarifa(mode.value, workerRate);
                      } else {
                        handleModalidadChange(mode.value);
                      }
                    }}
                  >
                    {mode.icon}
                    <span className="mode-label">{mode.label}</span>
                    <span className="mode-desc">{mode.desc}</span>
                    {workerRate ? (
                      <span className="mode-rate">${parseFloat(workerRate).toFixed(2)}{mode.unit !== 'total' ? mode.unit : ''}</span>
                    ) : (
                      <span className="mode-rate mode-rate-custom">
                        {mode.value === 'proyecto' ? 'precio libre' : 'ingresa precio'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="form-row amount-row">
              <div className="form-group">
                <label htmlFor="monto">
                  Precio {selectedMode?.value !== 'proyecto' ? selectedMode?.unit : 'total'} *
                </label>
                <div className="currency-input-group">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number"
                    id="monto"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {formData.modalidad !== 'proyecto' && (
                <div className="form-group">
                  <label htmlFor="cantidad">
                    Cantidad de {
                      formData.modalidad === 'hora' ? 'horas' :
                      formData.modalidad === 'dia' ? 'días' :
                      formData.modalidad === 'semana' ? 'semanas' : 'meses'
                    }
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    placeholder="1"
                    min="1"
                    step="1"
                    className="form-input"
                  />
                </div>
              )}
            </div>

            {formData.monto && parseFloat(formData.monto) > 0 && (
              <div className="total-display">
                <div className="total-label">
                  <strong>Total a pagar</strong>
                  {formData.modalidad !== 'proyecto' && (
                    <span className="total-formula">
                      ${parseFloat(formData.monto).toFixed(2)} × {formData.cantidad}{' '}
                      {formData.modalidad === 'hora' ? 'horas' :
                       formData.modalidad === 'dia' ? 'días' :
                       formData.modalidad === 'semana' ? 'semanas' : 'meses'}
                    </span>
                  )}
                </div>
                <span className="total-amount">${total.toFixed(2)}</span>
              </div>
            )}

            {/* ── DIVISOR ── */}
            <div className="section-divider">
              <span>📅 Ahora elige la fecha</span>
            </div>

            {/* ── SUB: FECHA ── */}
            <p className="section-help">
              {workerId
                ? formData.modalidad === 'hora'
                  ? 'Haz clic en un día del calendario y selecciona las horas que necesitas'
                  : 'Haz clic en un día verde del calendario para elegir cuándo empezar'
                : 'Elige cuándo necesitas el servicio (opcional)'}
            </p>

            {workerId ? (
              <div className="contract-calendar-wrapper">
                <AvailabilityCalendar
                  trabajadorId={workerId}
                  selectionMode={formData.modalidad}
                  onDateSelect={handleDateSelect}
                  onSlotsConfirm={formData.modalidad === 'hora' ? handleSlotsConfirm : undefined}
                  onDaysConfirm={formData.modalidad !== 'hora' ? handleDaysConfirm : undefined}
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de inicio</label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {formData.fecha_inicio && (
              <div className="selected-date-badge">
                <EventAvailableIcon sx={{ fontSize: 22 }} />
                <div>
                  <span className="badge-label">Fecha de inicio seleccionada</span>
                  <strong className="badge-date">{formatFecha(formData.fecha_inicio)}</strong>
                </div>
              </div>
            )}

            {/* Horas confirmadas desde el calendario — solo para modo hora */}
            {formData.modalidad === 'hora' && confirmedSlots.length > 0 && (
              <div className="confirmed-slots-panel">
                <div className="confirmed-slots-header">
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                  <span>{confirmedSlots.length} hora{confirmedSlots.length > 1 ? 's' : ''} reservada{confirmedSlots.length > 1 ? 's' : ''}</span>
                </div>
                <div className="confirmed-slots-list">
                  {confirmedSlots.map((s, i) => (
                    <span key={i} className="confirmed-slot-chip">
                      {DIAS[new Date(s.dateStr + 'T12:00:00').getDay()].slice(0, 3)} {new Date(s.dateStr + 'T12:00:00').getDate()} · {s.hour}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group date-fin-wrapper">
              <label htmlFor="fecha_fin">
                Fecha de fin <span className="optional-label">(opcional)</span>
              </label>
              <input
                type="date"
                id="fecha_fin"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                className="form-input"
                min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
              />
              <small className="form-help">Solo si el trabajo tiene una fecha de término definida</small>
            </div>
          </div>

          {/* ── PASO 3: Detalles opcionales ── */}
          <div className="form-section optional-section">
            <h3 className="section-title">
              <span className="step-badge optional">3</span>
              Detalles opcionales
            </h3>

            <div className="form-group">
              <label htmlFor="direccion">
                <LocationIcon sx={{ fontSize: 18 }} />
                Dirección del trabajo
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: San Salvador, Col. Escalón, Calle Principal #123"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas para el trabajador</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Ej: Traer sus propias herramientas, tocar el timbre al llegar..."
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>

          {/* ── Resumen antes del submit ── */}
          {formIsReady && (
            <div className="contract-summary">
              <h4>Resumen del contrato</h4>
              <div className="summary-grid">
                {worker && (
                  <div className="summary-item">
                    <span className="s-label">Trabajador</span>
                    <span className="s-value">{worker.nombre} {worker.apellido}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="s-label">Servicio</span>
                  <span className="s-value">
                    {categories.find(c => String(c.id) === String(formData.categoria_id))?.nombre || '—'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="s-label">Modalidad</span>
                  <span className="s-value">{selectedMode?.label}</span>
                </div>
                {formData.fecha_inicio && (
                  <div className="summary-item">
                    <span className="s-label">Fecha inicio</span>
                    <span className="s-value">{formatFecha(formData.fecha_inicio)}</span>
                  </div>
                )}
                <div className="summary-item summary-total-row">
                  <span className="s-label">Total</span>
                  <span className="s-value s-total">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Botones ── */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="btn-spinner" />
                  Creando contrato...
                </>
              ) : (
                <>
                  <CheckCircleIcon />
                  Crear Contrato
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info box */}
        <div className="info-box">
          <InfoIcon />
          <div>
            <p><strong>¿Cómo funciona?</strong></p>
            <ul>
              <li>✅ El contrato se crea al instante</li>
              <li>✅ El trabajador recibirá la solicitud y podrá aceptarla</li>
              <li>✅ El pago se coordina directamente con el trabajador</li>
              <li>✅ Puedes gestionar todo desde tu Dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractSimple;
