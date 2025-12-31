import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { contractService } from '../services/contractService';
import adminService from '../services/adminService';
import { workerService } from '../services/workerService';
import { logger } from '../utils/logger';
import '../styles/createContract.scss';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const CreateContract = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const workerId = searchParams.get('workerId');

  const [worker, setWorker] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdContract, setCreatedContract] = useState(null);

  const [formData, setFormData] = useState({
    trabajador_id: workerId || '',
    categoria_id: '',
    descripcion: '',
    direccion: '',
    monto: '',
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

        // Load categories from admin service
        const categoriesData = await adminService.getCategories();
        setCategories(categoriesData || []);

        // Load worker info if workerId is provided
        if (workerId) {
          const workerResponse = await workerService.getWorkerById(workerId);
          if (workerResponse.status === 'success') {
            setWorker(workerResponse.data);
          }
        }

        setLoading(false);
      } catch (err) {
        logger.error('Error loading data:', err);
        setError(t('createContract.errors.loadError') || 'Error al cargar los datos necesarios');
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, workerId, navigate, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.trabajador_id || !formData.categoria_id || !formData.monto || !formData.descripcion || !formData.direccion || !formData.fecha_inicio) {
        setError(t('createContract.errors.requiredFields') || 'Por favor completa todos los campos requeridos');
        setSubmitting(false);
        return;
      }

      // Get current user from auth context
      const currentUser = JSON.parse(localStorage.getItem('user'));

      // Transform data to match backend DTO
      const contractData = {
        empleadorId: currentUser.id,
        trabajadorId: formData.trabajador_id,
        categoriaId: formData.categoria_id,
        fechaInicio: formData.fecha_inicio,
        fechaFin: formData.fecha_fin || undefined,
        detallesServicio: {
          descripcion: formData.descripcion,
          direccion: formData.direccion,
          notas_adicionales: formData.notas || undefined,
        },
        terminosCondiciones: 'Términos y condiciones estándar del servicio',
        monto: parseFloat(formData.monto),
        metodoPago: 'efectivo',
      };

      // Create contract
      const response = await contractService.createContract(contractData);

      if (response.status === 'success') {
        setSuccess(true);
        setCreatedContract(response.data);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      logger.error('Error creating contract:', err);
      setError(err.response?.data?.message || t('createContract.errors.createError') || 'Error al crear el contrato');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-contract-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('createContract.loading') || 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  if (success && createdContract) {
    return (
      <div className="create-contract-page">
        <div className="success-container">
          <CheckCircleIcon className="success-icon" />
          <h2>{t('createContract.success.title') || '¡Contrato Creado Exitosamente!'}</h2>
          <div className="contract-info">
            <p><strong>{t('createContract.success.contractCode') || 'Código del Contrato'}:</strong> {createdContract.codigo_contrato}</p>
            <p><strong>{t('createContract.success.activationPin') || 'PIN de Activación'}:</strong></p>
            <code className="pin-code">{createdContract.pin_activacion}</code>
            <p className="info-text">
              {t('createContract.success.pinInfo') || 'El trabajador deberá ingresar este PIN para activar el contrato.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            {t('createContract.success.goToDashboard') || 'Ir al Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-contract-page">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ArrowBackIcon />
          {t('createContract.back') || 'Volver'}
        </button>

        <div className="page-header">
          <AssignmentIcon className="header-icon" />
          <div>
            <h1>{t('createContract.title') || 'Crear Nuevo Contrato'}</h1>
            <p>{t('createContract.subtitle') || 'Completa la información para generar un contrato de servicio'}</p>
          </div>
        </div>

        {worker && (
          <div className="worker-info-card">
            <PersonIcon />
            <div>
              <h3>{t('createContract.selectedWorker') || 'Trabajador Seleccionado'}</h3>
              <p>{worker.nombre} {worker.apellido}</p>
              {worker.titulo_profesional && (
                <p className="title">{worker.titulo_profesional}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="contract-form">
          {/* Categoría del Servicio */}
          <div className="form-group">
            <label htmlFor="categoria_id">
              <CategoryIcon />
              {t('createContract.form.category') || 'Categoría del Servicio'} *
            </label>
            <select
              id="categoria_id"
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChange}
              required
            >
              <option value="">{t('createContract.form.selectCategory') || 'Selecciona una categoría'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción del Servicio */}
          <div className="form-group">
            <label htmlFor="descripcion">
              <DescriptionIcon />
              {t('createContract.form.description') || 'Descripción del Servicio'} *
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder={t('createContract.form.descriptionPlaceholder') || 'Describe el trabajo a realizar...'}
              rows="4"
              required
            />
          </div>

          {/* Dirección del Servicio */}
          <div className="form-group">
            <label htmlFor="direccion">
              <DescriptionIcon />
              {t('createContract.form.address') || 'Dirección del Servicio'} *
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder={t('createContract.form.addressPlaceholder') || 'Ingresa la dirección donde se realizará el servicio...'}
              required
            />
          </div>

          {/* Monto Total */}
          <div className="form-group">
            <label htmlFor="monto">
              <MoneyIcon />
              {t('createContract.form.amount') || 'Monto Total (USD)'} *
            </label>
            <input
              type="number"
              id="monto"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Fecha de Inicio */}
          <div className="form-group">
            <label htmlFor="fecha_inicio">
              <CalendarIcon />
              {t('createContract.form.startDate') || 'Fecha de Inicio'}
            </label>
            <input
              type="date"
              id="fecha_inicio"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
            />
          </div>

          {/* Fecha de Fin */}
          <div className="form-group">
            <label htmlFor="fecha_fin">
              <CalendarIcon />
              {t('createContract.form.endDate') || 'Fecha de Finalización'}
            </label>
            <input
              type="date"
              id="fecha_fin"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
            />
          </div>

          {/* Notas Adicionales */}
          <div className="form-group">
            <label htmlFor="notas">
              <DescriptionIcon />
              {t('createContract.form.notes') || 'Notas Adicionales'}
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder={t('createContract.form.notesPlaceholder') || 'Información adicional, requisitos especiales, etc...'}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              {t('createContract.form.cancel') || 'Cancelar'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (t('createContract.form.creating') || 'Creando Contrato...') : (t('createContract.form.create') || 'Crear Contrato')}
            </button>
          </div>
        </form>

        <div className="info-box">
          <p><strong>📋 {t('createContract.info.title') || 'Información Importante'}:</strong></p>
          <ul>
            <li>{t('createContract.info.pinGeneration') || 'Una vez creado el contrato, se generará un PIN de activación'}</li>
            <li>{t('createContract.info.workerPin') || 'El trabajador deberá ingresar el PIN para confirmar el contrato'}</li>
            <li>{t('createContract.info.pendingStatus') || 'El contrato estará en estado "Pendiente de Activación" hasta que el trabajador lo active'}</li>
            <li>{t('createContract.info.dashboard') || 'Puedes ver y gestionar tus contratos desde el Dashboard'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateContract;
