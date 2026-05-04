import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { contractService } from '../../services/contractService';
import {
  normalizeAvailabilityReservasPayload,
  contractsToReservasFromWorkerContracts,
  mergeAvailabilityReservas,
} from '../../utils/availabilityReservas';
import './workerAvailability.scss';
import TimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

/**
 * Componente de gestión de disponibilidad para trabajadores
 *
 * Permite a los trabajadores:
 * - Configurar su disponibilidad general (horas semanales, anticipación, etc.)
 * - Crear bloques de disponibilidad recurrentes (ej: Lunes 9am-5pm)
 * - Crear disponibilidad específica para fechas concretas
 * - Bloquear tiempo no disponible
 * - Ver su calendario de reservas
 */
const WorkerAvailability = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('configuracion'); // configuracion, bloques, reservas

  // Estado de configuración
  const [config, setConfig] = useState({
    horas_semanales_maximas: 40,
    dias_anticipacion_minima: 0,
    acepta_mismo_dia: true,
    acepta_fines_semana: true,
    zona_horaria: 'America/El_Salvador',
    activo: true,
  });

  // Estado de bloques de disponibilidad
  const [bloques, setBloques] = useState([]);
  const [showBloqueForm, setShowBloqueForm] = useState(false);
  const [nuevoBloque, setNuevoBloque] = useState({
    tipo_disponibilidad: 'recurrente',
    dia_semana: 1,
    fecha_especifica: '',
    hora_inicio: '09:00',
    hora_fin: '17:00',
    modalidades_aceptadas: ['hora', 'dia', 'semana', 'mes', 'proyecto'],
    notas: '',
    activo: true,
  });

  // Estado de reservas
  const [reservas, setReservas] = useState([]);

  // ✅ Usar el user del contexto en lugar de localStorage directamente
  const trabajadorId = user?.id;

  useEffect(() => {
    // ⏳ Esperar a que AuthContext termine de inicializar
    if (authLoading) {
      console.log('WorkerAvailability: Esperando autenticación...');
      return;
    }

    // ❌ Si no hay usuario después de cargar, mostrar error
    if (!user || !user.id) {
      console.error('WorkerAvailability: Usuario no disponible después de cargar auth', { user, authLoading });
      setLoading(false);
      alert('No se pudo obtener tu ID de usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    // ✅ Solo cargar si trabajadorId existe y es válido
    if (trabajadorId && trabajadorId !== 'null' && trabajadorId !== 'undefined') {
      console.log('WorkerAvailability: Cargando datos para trabajador:', trabajadorId);
      cargarDatos();
    } else {
      setLoading(false);
      alert('No se pudo obtener tu ID de usuario. Por favor, inicia sesión nuevamente.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, trabajadorId]);

  const cargarDatos = async () => {
    // ✅ Validación adicional
    if (!trabajadorId || trabajadorId === 'null' || trabajadorId === 'undefined') {
      console.error('WorkerAvailability: trabajadorId inválido', trabajadorId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Cargar configuración (usa api con httpOnly cookies automáticamente)
      const configRes = await api.get(
        `/availability/config/${trabajadorId}`
      );
      setConfig(configRes.data);

      // Cargar bloques de disponibilidad
      const bloquesRes = await api.get(
        `/availability/bloques/${trabajadorId}`
      );
      setBloques(bloquesRes.data);

      // Cargar reservas (próximos 30 días)
      try {
        const hoy = new Date();
        const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

        const reservasRes = await api.get(
          `/availability/reservas/${trabajadorId}`,
          {
            params: {
              fecha_inicio: hoy.toISOString(),
              fecha_fin: treintaDias.toISOString()
            }
          }
        );
        const apiReservas = normalizeAvailabilityReservasPayload(reservasRes.data);
        let merged = apiReservas;
        try {
          const contractsPayload = await contractService.getMyContracts('trabajador');
          const contractsList =
            contractsPayload?.status === 'success'
              ? (contractsPayload.data || [])
              : Array.isArray(contractsPayload)
                ? contractsPayload
                : [];
          const fromContracts = contractsToReservasFromWorkerContracts(
            contractsList,
            trabajadorId,
            hoy,
            treintaDias
          );
          merged = mergeAvailabilityReservas(apiReservas, fromContracts);
        } catch (contractErr) {
          console.warn('WorkerAvailability: no se pudieron fusionar contratos en agenda:', contractErr.message);
        }
        setReservas(merged);
      } catch (reservasError) {
        // Si falla solo reservas, no bloquear toda la carga
        console.warn('No se pudieron cargar las reservas:', reservasError.response?.data || reservasError.message);
        setReservas([]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar la información de disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  // ========== CONFIGURACIÓN ==========

  const guardarConfiguracion = async () => {
    try {
      setSaving(true);

      // Solo enviar los campos que el DTO acepta (el backend tiene forbidNonWhitelisted: true)
      // No incluir id, fecha_creacion, fecha_actualizacion del objeto cargado
      const configData = {
        trabajador_id: trabajadorId,
        horas_semanales_maximas: config.horas_semanales_maximas,
        dias_anticipacion_minima: config.dias_anticipacion_minima,
        acepta_mismo_dia: config.acepta_mismo_dia,
        acepta_fines_semana: config.acepta_fines_semana,
        zona_horaria: config.zona_horaria,
        activo: config.activo,
      };

      await api.put(
        `/availability/config/${trabajadorId}`,
        configData
      );
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // ========== BLOQUES DE DISPONIBILIDAD ==========

  const crearBloque = async () => {
    // Validación: si el tipo requiere fecha específica, debe estar seleccionada
    if (nuevoBloque.tipo_disponibilidad !== 'recurrente' && !nuevoBloque.fecha_especifica) {
      alert('Por favor selecciona una fecha específica');
      return;
    }

    try {
      setSaving(true);

      // Preparar datos del bloque, limpiando fecha_especifica cuando no aplica
      const bloqueData = {
        ...nuevoBloque,
        trabajador_id: trabajadorId,
        // Solo enviar fecha_especifica si el tipo NO es recurrente Y hay una fecha válida
        fecha_especifica: nuevoBloque.tipo_disponibilidad !== 'recurrente' && nuevoBloque.fecha_especifica
          ? nuevoBloque.fecha_especifica
          : null,
        // Solo enviar dia_semana si el tipo ES recurrente
        dia_semana: nuevoBloque.tipo_disponibilidad === 'recurrente'
          ? nuevoBloque.dia_semana
          : null,
      };

      await api.post(
        `/availability/bloques`,
        bloqueData
      );

      setShowBloqueForm(false);
      setNuevoBloque({
        tipo_disponibilidad: 'recurrente',
        dia_semana: 1,
        fecha_especifica: '',
        hora_inicio: '09:00',
        hora_fin: '17:00',
        modalidades_aceptadas: ['hora', 'dia', 'semana', 'mes', 'proyecto'],
        notas: '',
        activo: true,
      });

      await cargarDatos();
      alert('Bloque de disponibilidad creado exitosamente');
    } catch (error) {
      console.error('Error creando bloque:', error);
      alert(error.response?.data?.message || 'Error al crear bloque de disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const actualizarBloque = async (bloqueId, datos) => {
    try {
      setSaving(true);
      await api.patch(
        `/availability/bloques/${bloqueId}`,
        datos
      );

      await cargarDatos();
      alert('Bloque actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando bloque:', error);
      alert('Error al actualizar el bloque');
    } finally {
      setSaving(false);
    }
  };

  const eliminarBloque = async (bloqueId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este bloque de disponibilidad?')) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(
        `/availability/bloques/${bloqueId}`
      );

      await cargarDatos();
      alert('Bloque eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando bloque:', error);
      alert('Error al eliminar el bloque');
    } finally {
      setSaving(false);
    }
  };

  // ========== HELPERS ==========

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const modalidadesLabels = {
    hora: 'Por Hora',
    dia: 'Por Día',
    semana: 'Por Semana',
    mes: 'Por Mes',
    proyecto: 'Proyecto Completo',
  };

  const tipoReservaLabels = {
    contrato: 'Contrato',
    bloqueado: 'Bloqueado',
    personal: 'Personal',
  };

  // ⏳ Mostrar loading mientras AuthContext inicializa
  if (authLoading) {
    return (
      <div className="worker-availability">
        <div className="loading">
          <div className="spinner"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // ⏳ Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="worker-availability">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-availability">
      <header className="availability-hero">
        <div className="availability-hero__mark" aria-hidden>
          <EventIcon />
        </div>
        <div className="availability-hero__copy">
          <p className="availability-hero__eyebrow">Tu agenda</p>
          <h1 className="availability-hero__title">Disponibilidad</h1>
          <p className="availability-hero__subtitle">
            Define cuánto puedes trabajar y cuándo los clientes pueden reservarte. Los cambios se aplican a nuevas solicitudes.
          </p>
        </div>
      </header>

      <nav className="availability-tabs" aria-label="Secciones de disponibilidad">
        <div className="availability-tabs__track" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'configuracion'}
            className={`availability-tabs__btn ${activeTab === 'configuracion' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('configuracion')}
          >
            <TuneOutlinedIcon className="availability-tabs__icon" fontSize="small" />
            <span className="availability-tabs__label">Reglas generales</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bloques'}
            className={`availability-tabs__btn ${activeTab === 'bloques' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('bloques')}
          >
            <TimeIcon className="availability-tabs__icon" fontSize="small" />
            <span className="availability-tabs__label">Horarios</span>
            <span className="availability-tabs__badge">{bloques.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reservas'}
            className={`availability-tabs__btn ${activeTab === 'reservas' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reservas')}
          >
            <CalendarMonthOutlinedIcon className="availability-tabs__icon" fontSize="small" />
            <span className="availability-tabs__label">Reservas</span>
            <span className="availability-tabs__badge availability-tabs__badge--muted">{reservas.length}</span>
          </button>
        </div>
      </nav>

      {/* PESTAÑA: CONFIGURACIÓN */}
      {activeTab === 'configuracion' && (
        <div className="config-panel">
          <div className="config-grid">
            <section className="config-card" aria-labelledby="config-card-plan">
              <header className="config-card__head">
                <h2 id="config-card-plan" className="config-card__title">Carga y aviso previo</h2>
                <p className="config-card__hint">
                  Ajusta tu tope semanal y el tiempo mínimo que necesitas antes de empezar un contrato.
                </p>
              </header>
              <div className="config-card__body config-card__body--fields">
                <div className="field-block">
                  <label className="field-block__label" htmlFor="wa-horas-max">
                    Horas máximas por semana
                  </label>
                  <input
                    id="wa-horas-max"
                    className="field-block__input"
                    type="number"
                    min="1"
                    max="168"
                    value={config.horas_semanales_maximas}
                    onChange={(e) =>
                      setConfig({ ...config, horas_semanales_maximas: parseInt(e.target.value, 10) })
                    }
                  />
                  <p className="field-block__help">Incluye todas las modalidades (por hora, día, proyecto, etc.).</p>
                </div>
                <div className="field-block">
                  <label className="field-block__label" htmlFor="wa-dias-anticipacion">
                    Días de anticipación mínima
                  </label>
                  <input
                    id="wa-dias-anticipacion"
                    className="field-block__input"
                    type="number"
                    min="0"
                    max="365"
                    value={config.dias_anticipacion_minima}
                    onChange={(e) =>
                      setConfig({ ...config, dias_anticipacion_minima: parseInt(e.target.value, 10) })
                    }
                  />
                  <p className="field-block__help">
                    <strong>0</strong> permite que te contraten con poco margen; sube el valor si necesitas más tiempo para prepararte.
                  </p>
                </div>
              </div>
            </section>

            <section className="config-card" aria-labelledby="config-card-prefs">
              <header className="config-card__head">
                <h2 id="config-card-prefs" className="config-card__title">Preferencias y visibilidad</h2>
                <p className="config-card__hint">
                  Indica cómo quieres trabajar y si tu perfil debe mostrarse como disponible.
                </p>
              </header>
              <div className="config-card__body">
                <ul className="toggle-list">
                  <li>
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        className="toggle-row__input"
                        checked={config.acepta_mismo_dia}
                        onChange={(e) => setConfig({ ...config, acepta_mismo_dia: e.target.checked })}
                      />
                      <span className="toggle-row__text">
                        <span className="toggle-row__title">Contratos el mismo día</span>
                        <span className="toggle-row__desc">Permite reservas con inicio en las próximas 24 h si encaja con tu anticipación mínima.</span>
                      </span>
                    </label>
                  </li>
                  <li>
                    <label className="toggle-row">
                      <input
                        type="checkbox"
                        className="toggle-row__input"
                        checked={config.acepta_fines_semana}
                        onChange={(e) => setConfig({ ...config, acepta_fines_semana: e.target.checked })}
                      />
                      <span className="toggle-row__text">
                        <span className="toggle-row__title">Fines de semana</span>
                        <span className="toggle-row__desc">Sábados y domingos cuentan como días laborables para nuevas reservas.</span>
                      </span>
                    </label>
                  </li>
                  <li>
                    <label className="toggle-row toggle-row--highlight">
                      <input
                        type="checkbox"
                        className="toggle-row__input"
                        checked={config.activo}
                        onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                      />
                      <span className="toggle-row__text">
                        <span className="toggle-row__title">Disponibilidad visible</span>
                        <span className="toggle-row__desc">Si lo desactivas, los clientes no verán tus huecos aunque tengas horarios creados.</span>
                      </span>
                    </label>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <div className="config-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={guardarConfiguracion}
              disabled={saving}
            >
              <SaveIcon fontSize="small" /> {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA: BLOQUES DE DISPONIBILIDAD */}
      {activeTab === 'bloques' && (
        <div className="bloques-section">
          <div className="section-header">
            <h2>Mis Horarios Disponibles</h2>
            <button
              className="btn-primary"
              onClick={() => setShowBloqueForm(!showBloqueForm)}
            >
              <AddIcon /> {showBloqueForm ? 'Cancelar' : 'Agregar Horario'}
            </button>
          </div>

          {/* Formulario para crear bloque */}
          {showBloqueForm && (
            <div className="bloque-form">
              <h3>Nuevo Horario Disponible</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de disponibilidad</label>
                  <select
                    value={nuevoBloque.tipo_disponibilidad}
                    onChange={(e) => setNuevoBloque({ ...nuevoBloque, tipo_disponibilidad: e.target.value })}
                  >
                    <option value="recurrente">Recurrente (cada semana)</option>
                    <option value="especifica">Fecha específica</option>
                    <option value="bloqueada">Bloquear tiempo</option>
                  </select>
                </div>

                {nuevoBloque.tipo_disponibilidad === 'recurrente' && (
                  <div className="form-group">
                    <label>Día de la semana</label>
                    <select
                      value={nuevoBloque.dia_semana}
                      onChange={(e) => setNuevoBloque({ ...nuevoBloque, dia_semana: parseInt(e.target.value) })}
                    >
                      {diasSemana.map((dia, idx) => (
                        <option key={idx} value={idx}>{dia}</option>
                      ))}
                    </select>
                  </div>
                )}

                {nuevoBloque.tipo_disponibilidad !== 'recurrente' && (
                  <div className="form-group">
                    <label>Fecha específica</label>
                    <input
                      type="date"
                      value={nuevoBloque.fecha_especifica}
                      onChange={(e) => setNuevoBloque({ ...nuevoBloque, fecha_especifica: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora de inicio</label>
                  <input
                    type="time"
                    value={nuevoBloque.hora_inicio}
                    onChange={(e) => setNuevoBloque({ ...nuevoBloque, hora_inicio: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hora de fin</label>
                  <input
                    type="time"
                    value={nuevoBloque.hora_fin}
                    onChange={(e) => setNuevoBloque({ ...nuevoBloque, hora_fin: e.target.value })}
                  />
                </div>
              </div>

              {nuevoBloque.tipo_disponibilidad !== 'bloqueada' && (
                <div className="form-group">
                  <label>Modalidades aceptadas</label>
                  <div className="checkbox-grid">
                    {Object.entries(modalidadesLabels).map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={nuevoBloque.modalidades_aceptadas.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNuevoBloque({
                                ...nuevoBloque,
                                modalidades_aceptadas: [...nuevoBloque.modalidades_aceptadas, key]
                              });
                            } else {
                              setNuevoBloque({
                                ...nuevoBloque,
                                modalidades_aceptadas: nuevoBloque.modalidades_aceptadas.filter(m => m !== key)
                              });
                            }
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Notas (opcional)</label>
                <textarea
                  value={nuevoBloque.notas}
                  onChange={(e) => setNuevoBloque({ ...nuevoBloque, notas: e.target.value })}
                  placeholder="Ej: Solo trabajos cerca de mi zona, preferencia por proyectos largos, etc."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn-primary"
                  onClick={crearBloque}
                  disabled={saving}
                >
                  <SaveIcon /> {saving ? 'Guardando...' : 'Guardar Horario'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowBloqueForm(false)}
                  disabled={saving}
                >
                  <CancelIcon /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de bloques */}
          <div className="bloques-list">
            {bloques.length === 0 ? (
              <div className="empty-state">
                <TimeIcon />
                <p>No tienes horarios configurados aún</p>
                <small>Agrega tus horarios disponibles para que los clientes puedan contratarte</small>
              </div>
            ) : (
              bloques.map((bloque) => (
                <div key={bloque.id} className={`bloque-card ${!bloque.activo ? 'inactive' : ''}`}>
                  <div className="bloque-header">
                    <div className="bloque-tipo">
                      {bloque.tipo_disponibilidad === 'bloqueada' ? (
                        <BlockIcon className="icon-blocked" />
                      ) : (
                        <TimeIcon className="icon-available" />
                      )}
                      <span className="tipo-label">
                        {bloque.tipo_disponibilidad === 'recurrente' && `Cada ${diasSemana[bloque.dia_semana]}`}
                        {bloque.tipo_disponibilidad === 'especifica' && new Date(bloque.fecha_especifica).toLocaleDateString('es-SV')}
                        {bloque.tipo_disponibilidad === 'bloqueada' && 'Bloqueado'}
                      </span>
                    </div>
                    <div className="bloque-actions">
                      <button
                        className="btn-icon"
                        onClick={() => actualizarBloque(bloque.id, { activo: !bloque.activo })}
                        title={bloque.activo ? 'Desactivar' : 'Activar'}
                      >
                        {bloque.activo ? '✓' : '○'}
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => eliminarBloque(bloque.id)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>

                  <div className="bloque-body">
                    <div className="horario">
                      <TimeIcon fontSize="small" />
                      <span>{bloque.hora_inicio} - {bloque.hora_fin}</span>
                    </div>

                    {bloque.tipo_disponibilidad !== 'bloqueada' && bloque.modalidades_aceptadas && (
                      <div className="modalidades">
                        {bloque.modalidades_aceptadas.map((mod) => (
                          <span key={mod} className="modalidad-tag">
                            {modalidadesLabels[mod]}
                          </span>
                        ))}
                      </div>
                    )}

                    {bloque.notas && (
                      <div className="notas">
                        <small>{bloque.notas}</small>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: RESERVAS */}
      {activeTab === 'reservas' && (
        <div className="reservas-section">
          <h2>Calendario de Reservas (Próximos 30 días)</h2>

          {reservas.length === 0 ? (
            <div className="empty-state">
              <EventIcon />
              <p>No tienes reservas próximas</p>
              <small>Tus contratos confirmados aparecerán aquí automáticamente</small>
            </div>
          ) : (
            <div className="reservas-list">
              {reservas.map((reserva) => (
                <div
                  key={reserva.id ?? `reserva-${reserva.contrato?.id}-${reserva.fecha_inicio}`}
                  className={`reserva-card tipo-${reserva.tipo_reserva || 'contrato'} estado-${reserva.estado || 'sin-estado'}`}
                >
                  <div className="reserva-header">
                    <span className="tipo-badge">{tipoReservaLabels[reserva.tipo_reserva] || tipoReservaLabels.contrato}</span>
                    <span className="estado-badge">{reserva.estado}</span>
                  </div>

                  <div className="reserva-body">
                    <div className="fecha-hora">
                      <EventIcon fontSize="small" />
                      <div>
                        <div className="fecha">
                          {new Date(reserva.fecha_inicio).toLocaleDateString('es-SV', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="hora">
                          {new Date(reserva.fecha_inicio).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })} -
                          {new Date(reserva.fecha_fin).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {reserva.modalidad_contrato && (
                      <div className="modalidad">
                        <span>Modalidad: {modalidadesLabels[reserva.modalidad_contrato]}</span>
                      </div>
                    )}

                    {reserva.motivo_bloqueo && (
                      <div className="motivo">
                        <small>Motivo: {reserva.motivo_bloqueo}</small>
                      </div>
                    )}

                    {reserva.contrato && (
                      <div className="contrato-info">
                        <small>Contrato: {reserva.contrato.codigo_contrato}</small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerAvailability;
