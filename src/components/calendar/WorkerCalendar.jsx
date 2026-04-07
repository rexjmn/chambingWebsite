import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import './workerCalendar.scss';
import {
  Event as EventIcon,
  AccessTime as TimeIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
} from '@mui/icons-material';

/**
 * Componente para mostrar la disponibilidad de un trabajador en su perfil público
 *
 * Muestra:
 * - Horarios disponibles de forma visual
 * - Próximas reservas
 * - Estado de disponibilidad general
 */
const WorkerCalendar = ({ trabajadorId, showReservas = false }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    // ✅ Solo cargar si trabajadorId existe y es válido
    if (trabajadorId && trabajadorId !== 'null' && trabajadorId !== 'undefined') {
      cargarDisponibilidad();
    } else {
      setLoading(false);
    }
  }, [trabajadorId]);

  const cargarDisponibilidad = async () => {
    // ✅ Validación adicional
    if (!trabajadorId || trabajadorId === 'null' || trabajadorId === 'undefined') {
      console.warn('WorkerCalendar: trabajadorId inválido', trabajadorId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Cargar configuración (sin auth, es público)
      const configRes = await api.get(`/availability/config/${trabajadorId}`);
      setConfig(configRes.data);

      // Cargar bloques activos
      const bloquesRes = await api.get(`/availability/bloques/${trabajadorId}?activo=true`);
      setBloques(bloquesRes.data);

      // Si se solicita, cargar reservas próximas
      if (showReservas) {
        const hoy = new Date();
        const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

        const reservasRes = await api.get(
          `/availability/reservas/${trabajadorId}`,
          { params: { fecha_inicio: hoy.toISOString(), fecha_fin: treintaDias.toISOString(), estado: 'activo' } }
        );
        setReservas(reservasRes.data);
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const modalidadesLabels = {
    hora: t('availabilityCalendar.modalities.hora'),
    dia: t('availabilityCalendar.modalities.dia'),
    semana: t('availabilityCalendar.modalities.semana'),
    mes: t('availabilityCalendar.modalities.mes'),
    proyecto: t('availabilityCalendar.modalities.proyecto'),
  };

  if (loading) {
    return (
      <div className="worker-calendar">
        <div className="calendar-loading">
          <div className="spinner"></div>
          <p>{t('workerCalendar.loading')}</p>
        </div>
      </div>
    );
  }

  if (!config || !config.activo) {
    return (
      <div className="worker-calendar">
        <div className="calendar-unavailable">
          <UnavailableIcon />
          <p>{t('workerCalendar.notConfigured')}</p>
        </div>
      </div>
    );
  }

  // Agrupar bloques recurrentes por día de la semana
  const bloquesRecurrentes = bloques
    .filter((b) => b.tipo_disponibilidad === 'recurrente')
    .reduce((acc, bloque) => {
      if (!acc[bloque.dia_semana]) {
        acc[bloque.dia_semana] = [];
      }
      acc[bloque.dia_semana].push(bloque);
      return acc;
    }, {});

  // Bloques específicos
  const bloquesEspecificos = bloques.filter((b) => b.tipo_disponibilidad === 'especifica');

  return (
    <div className="worker-calendar">
      {/* Header con estado general */}
      <div className="calendar-header">
        <div className="status-badge available">
          <AvailableIcon />
          <span>{t('workerCalendar.availableForHire')}</span>
        </div>

        <div className="config-info">
          {config.acepta_mismo_dia && (
            <span className="info-tag">
              <TimeIcon fontSize="small" />
              {t('workerCalendar.acceptsSameDay')}
            </span>
          )}
          {config.acepta_fines_semana && (
            <span className="info-tag">
              <EventIcon fontSize="small" />
              {t('workerCalendar.worksWeekends')}
            </span>
          )}
          {config.dias_anticipacion_minima > 0 && (
            <span className="info-tag">
              {t('workerCalendar.advanceNotice', { days: config.dias_anticipacion_minima })}
            </span>
          )}
        </div>
      </div>

      {/* Horario semanal */}
      {Object.keys(bloquesRecurrentes).length > 0 && (
        <div className="horario-semanal">
          <h3>
            <TimeIcon /> {t('workerCalendar.weeklySchedule')}
          </h3>

          <div className="semana-grid">
            {[0, 1, 2, 3, 4, 5, 6].map((dia) => {
              const bloquesDelDia = bloquesRecurrentes[dia] || [];
              const tieneDisponibilidad = bloquesDelDia.length > 0;

              return (
                <div
                  key={dia}
                  className={`dia-card ${!tieneDisponibilidad ? 'no-disponible' : ''}`}
                >
                  <div className="dia-header">
                    <span className="dia-nombre">{diasSemana[dia]}</span>
                  </div>

                  <div className="dia-horarios">
                    {tieneDisponibilidad ? (
                      bloquesDelDia.map((bloque, idx) => (
                        <div key={idx} className="horario-bloque">
                          <span className="horario-tiempo">
                            {bloque.hora_inicio} - {bloque.hora_fin}
                          </span>
                          {bloque.modalidades_aceptadas && bloque.modalidades_aceptadas.length < 5 && (
                            <div className="modalidades-mini">
                              {bloque.modalidades_aceptadas.map((mod) => (
                                <span key={mod} className="mod-tag" title={modalidadesLabels[mod]}>
                                  {mod === 'hora' ? 'H' : mod === 'dia' ? 'D' : mod === 'semana' ? 'S' : mod === 'mes' ? 'M' : 'P'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="no-disp">{t('workerCalendar.notAvailable')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fechas específicas */}
      {bloquesEspecificos.length > 0 && (
        <div className="fechas-especificas">
          <h3>
            <EventIcon /> {t('workerCalendar.specificDates')}
          </h3>

          <div className="fechas-list">
            {bloquesEspecificos.map((bloque) => (
              <div key={bloque.id} className="fecha-card">
                <div className="fecha-fecha">
                  {new Date(bloque.fecha_especifica).toLocaleDateString('es-SV', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="fecha-horario">
                  {bloque.hora_inicio} - {bloque.hora_fin}
                </div>
                {bloque.notas && (
                  <div className="fecha-notas">
                    <small>{bloque.notas}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modalidades aceptadas (resumen general) */}
      {bloques.length > 0 && (
        <div className="modalidades-section">
          <h3>{t('workerCalendar.hiringModalities')}</h3>

          <div className="modalidades-grid">
            {(() => {
              // Obtener todas las modalidades únicas de todos los bloques
              const todasModalidades = new Set();
              bloques.forEach((bloque) => {
                if (bloque.tipo_disponibilidad !== 'bloqueada' && bloque.modalidades_aceptadas) {
                  bloque.modalidades_aceptadas.forEach((mod) => todasModalidades.add(mod));
                }
              });

              return Array.from(todasModalidades).map((modalidad) => (
                <div key={modalidad} className="modalidad-card">
                  <AvailableIcon className="icon" />
                  <span>{modalidadesLabels[modalidad]}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Reservas (si se solicitan) */}
      {showReservas && reservas.length > 0 && (
        <div className="reservas-section">
          <h3>
            <EventIcon /> {t('workerCalendar.upcomingReservations')}
          </h3>

          <div className="reservas-list">
            {reservas.map((reserva) => (
              <div key={reserva.id} className="reserva-item">
                <div className="reserva-fecha">
                  {new Date(reserva.fecha_inicio).toLocaleDateString('es-SV', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="reserva-info">
                  <span className="tipo">{reserva.tipo_reserva}</span>
                  <span className="horario">
                    {new Date(reserva.fecha_inicio).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(reserva.fecha_fin).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay bloques */}
      {bloques.length === 0 && (
        <div className="empty-calendar">
          <EventIcon />
          <p>{t('workerCalendar.openAvailability')}</p>
          <small>{t('workerCalendar.contactDirectly')}</small>
        </div>
      )}
    </div>
  );
};

export default WorkerCalendar;
