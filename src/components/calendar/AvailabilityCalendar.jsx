import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import './availabilityCalendar.scss';

// ── Pure helpers ─────────────────────────────────────────────────────────────

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const getJornadaBounds = (horarios) => {
  if (!horarios.length) return null;
  let minStart = 24 * 60, maxEnd = 0;
  horarios.forEach(h => {
    if (!h.inicio || !h.fin) return;
    const s = timeToMinutes(h.inicio);
    const e = timeToMinutes(h.fin);
    if (s < minStart) minStart = s;
    if (e > maxEnd) maxEnd = e;
  });
  if (maxEnd === 0) return null;
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:00`;
  return { inicio: fmt(minStart), fin: fmt(maxEnd) };
};

const getHourRange = (inicio, fin) => {
  const startH = Math.floor(timeToMinutes(inicio) / 60);
  const endH = Math.ceil(timeToMinutes(fin) / 60);
  const hours = [];
  for (let h = startH; h < endH; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }
  return hours;
};

const getSlotStatus = (horarios, hourStr) => {
  const slotStart = timeToMinutes(hourStr);
  const slotEnd = slotStart + 60;
  let isDisponible = false;
  for (const h of horarios) {
    const hS = timeToMinutes(h.inicio);
    const hE = timeToMinutes(h.fin);
    if (hS < slotEnd && hE > slotStart) {
      if (h.tipo === 'reservado' || h.tipo === 'bloqueado') return 'ocupado';
      if (h.tipo === 'disponible') isDisponible = true;
    }
  }
  return isDisponible ? 'disponible' : 'libre';
};

// Clave única para un slot: "YYYY-MM-DD HH:00"
const getSlotKey = (date, hour) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} ${hour}`;
};

// Clave única para un día: "YYYY-MM-DD"
const getDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calendario visual de disponibilidad tipo Google Calendar
 * Props:
 *   trabajadorId   — ID del trabajador (requerido)
 *   onDateSelect   — callback(Date) cuando se hace clic en un día
 *   onSlotsConfirm — callback(slots[]) cuando se confirma la selección de horas
 *                    slots = [{ dateStr: "YYYY-MM-DD", hour: "HH:00" }, ...]
 */
const AvailabilityCalendar = ({
  trabajadorId,
  onDateSelect,
  onSlotsConfirm,
  selectionMode = 'hora', // 'hora' | 'dia' | 'semana' | 'mes' | 'proyecto'
  onDaysConfirm = null,   // callback({ fechaInicio, fechaFin, count }) para modos dia/semana/mes
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' o 'week'

  // Selección de slots en la grilla de 3 días — Set de claves "YYYY-MM-DD HH:00"
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  // Selección de días en modos dia/semana/mes — Set de claves "YYYY-MM-DD"
  const [selectedDays, setSelectedDays] = useState(new Set());

  // Días y meses en español
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    if (trabajadorId && trabajadorId !== 'null' && trabajadorId !== 'undefined') {
      cargarDatos();
    } else {
      setLoading(false);
    }
  }, [trabajadorId, currentDate]);

  const cargarDatos = async () => {
    if (!trabajadorId || trabajadorId === 'null' || trabajadorId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const inicioMes = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const finMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      finMes.setDate(finMes.getDate() + 7);

      const configRes = await api.get(`/availability/config/${trabajadorId}`);
      setConfig(configRes.data);

      const bloquesRes = await api.get(`/availability/bloques/${trabajadorId}?activo=true`);
      setBloques(bloquesRes.data);

      try {
        const reservasRes = await api.get(
          `/availability/reservas/${trabajadorId}`,
          { params: { fecha_inicio: inicioMes.toISOString(), fecha_fin: finMes.toISOString() } }
        );
        setReservas(reservasRes.data || []);
      } catch (reservasError) {
        console.warn('No se pudieron cargar las reservas:', reservasError.message);
        setReservas([]);
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const diasDelMes = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const dias = [];

    const primerDiaSemana = primerDia.getDay();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      dias.push({ fecha, esMesActual: false });
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = new Date(year, month, d);
      dias.push({ fecha, esMesActual: true });
    }

    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month + 1, i);
      dias.push({ fecha, esMesActual: false });
    }

    return dias;
  }, [currentDate]);

  const getDisponibilidadDia = (fecha) => {
    const diaSemana = fecha.getDay();
    const fechaStr = fecha.toISOString().split('T')[0];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha < hoy) return { tipo: 'pasado', horarios: [] };

    const bloqueosFecha = bloques.filter(
      b => b.tipo_disponibilidad === 'bloqueada' &&
           b.fecha_especifica &&
           b.fecha_especifica.split('T')[0] === fechaStr
    );

    const disponibilidadEspecifica = bloques.filter(
      b => b.tipo_disponibilidad === 'especifica' &&
           b.fecha_especifica &&
           b.fecha_especifica.split('T')[0] === fechaStr
    );

    const disponibilidadRecurrente = bloques.filter(
      b => b.tipo_disponibilidad === 'recurrente' &&
           b.dia_semana === diaSemana
    );

    const reservasFecha = reservas.filter(r => {
      const reservaInicio = new Date(r.fecha_inicio);
      const reservaFin = new Date(r.fecha_fin);
      return fecha >= reservaInicio && fecha <= reservaFin;
    });

    let horarios = [];

    disponibilidadEspecifica.forEach(b => {
      horarios.push({ inicio: b.hora_inicio, fin: b.hora_fin, tipo: 'disponible', modalidades: b.modalidades_aceptadas });
    });

    if (horarios.length === 0) {
      disponibilidadRecurrente.forEach(b => {
        horarios.push({ inicio: b.hora_inicio, fin: b.hora_fin, tipo: 'disponible', modalidades: b.modalidades_aceptadas });
      });
    }

    bloqueosFecha.forEach(b => {
      horarios.push({ inicio: b.hora_inicio, fin: b.hora_fin, tipo: 'bloqueado', motivo: b.notas });
    });

    reservasFecha.forEach(r => {
      const inicio = new Date(r.fecha_inicio);
      const fin = new Date(r.fecha_fin);
      horarios.push({ inicio: inicio.toTimeString().slice(0, 5), fin: fin.toTimeString().slice(0, 5), tipo: 'reservado', estado: r.estado });
    });

    horarios.sort((a, b) => a.inicio.localeCompare(b.inicio));

    let tipo = 'sin-disponibilidad';
    if (horarios.some(h => h.tipo === 'disponible')) tipo = 'disponible';
    if (horarios.every(h => h.tipo === 'reservado' || h.tipo === 'bloqueado')) tipo = 'ocupado';

    if ((diaSemana === 0 || diaSemana === 6) && config && !config.acepta_fines_semana) {
      tipo = 'sin-disponibilidad';
      horarios = [];
    }

    return { tipo, horarios };
  };

  // Navegación
  const mesAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
    setSelectedSlots(new Set());
    setSelectedDays(new Set());
  };

  const mesSiguiente = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
    setSelectedSlots(new Set());
    setSelectedDays(new Set());
  };

  const irAHoy = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
    setSelectedSlots(new Set());
    setSelectedDays(new Set());
  };

  // Toggle de un slot disponible en la grilla
  const toggleSlot = (slotKey) => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slotKey)) next.delete(slotKey);
      else next.add(slotKey);
      return next;
    });
  };

  const removeSlot = (slotKey) => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      next.delete(slotKey);
      return next;
    });
  };

  const confirmSlots = () => {
    const slots = Array.from(selectedSlots).sort().map(key => {
      const [dateStr, hour] = key.split(' ');
      return { dateStr, hour };
    });
    onSlotsConfirm?.(slots);
  };

  // ── Selección por día / semana / mes ──────────────────────────────────────────

  const getWeekDays = (fecha) => {
    const day = fecha.getDay();
    const monday = new Date(fecha);
    monday.setDate(fecha.getDate() - ((day + 6) % 7)); // retroceder al lunes
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return getDayKey(d);
    });
  };

  const getMonthDays = (fecha) => {
    const y = fecha.getFullYear();
    const m = fecha.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) =>
      `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );
  };

  const toggleDaySelection = (fecha) => {
    const key = getDayKey(fecha);
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleWeekSelection = (fecha) => {
    const weekDays = getWeekDays(fecha);
    const anySelected = weekDays.some(d => selectedDays.has(d));
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (anySelected) weekDays.forEach(d => next.delete(d));
      else weekDays.forEach(d => next.add(d));
      return next;
    });
  };

  const toggleMonthSelection = (fecha) => {
    const monthDays = getMonthDays(fecha);
    const anySelected = monthDays.some(d => selectedDays.has(d));
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (anySelected) monthDays.forEach(d => next.delete(d));
      else monthDays.forEach(d => next.add(d));
      return next;
    });
  };

  const confirmDays = () => {
    if (selectedDays.size === 0) return;
    const sorted = Array.from(selectedDays).sort();
    let count;
    if (selectionMode === 'dia') count = sorted.length;
    else if (selectionMode === 'semana') count = Math.round(sorted.length / 7);
    else count = new Set(sorted.map(d => d.slice(0, 7))).size;
    onDaysConfirm?.({ fechaInicio: sorted[0], fechaFin: sorted[sorted.length - 1], count });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()].slice(0, 3)}.`;
  };

  const formatHora = (hora) => {
    if (!hora) return '';
    const [h, m] = hora.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="availability-calendar">
        <div className="calendar-loading">
          <div className="spinner"></div>
          <p>{t('availabilityCalendar.loading')}</p>
        </div>
      </div>
    );
  }

  if (!config || !config.activo) {
    return (
      <div className="availability-calendar">
        <div className="calendar-unavailable">
          <XCircle size={48} />
          <p>{t('availabilityCalendar.notConfigured')}</p>
        </div>
      </div>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="availability-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={mesAnterior} aria-label="Mes anterior">
            <ChevronLeft size={20} />
          </button>
          <h3 className="calendar-title">
            {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button className="nav-btn" onClick={mesSiguiente} aria-label="Mes siguiente">
            <ChevronRight size={20} />
          </button>
        </div>
        <button className="today-btn" onClick={irAHoy}>
          {t('availabilityCalendar.today')}
        </button>
      </div>

      {/* Leyenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot disponible"></span>
          <span>{t('availabilityCalendar.legend.available')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot ocupado"></span>
          <span>{t('availabilityCalendar.legend.busy')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot sin-disponibilidad"></span>
          <span>{t('availabilityCalendar.legend.notAvailable')}</span>
        </div>
      </div>

      {/* Grid del mes */}
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {diasSemana.map((dia, idx) => (
            <div key={idx} className="weekday-header">{dia}</div>
          ))}
        </div>

        <div className="calendar-days">
          {diasDelMes.map(({ fecha, esMesActual }, idx) => {
            const disponibilidad = getDisponibilidadDia(fecha);
            const esHoy = fecha.toDateString() === hoy.toDateString();
            const esSeleccionado = selectedDate && fecha.toDateString() === selectedDate.toDateString();
            const isDaySelected = ['dia', 'semana', 'mes'].includes(selectionMode) && selectedDays.has(getDayKey(fecha));

            return (
              <div
                key={idx}
                className={`calendar-day ${!esMesActual ? 'otro-mes' : ''} ${esHoy ? 'es-hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''} ${isDaySelected ? 'dia-seleccionado' : ''} tipo-${disponibilidad.tipo}`}
                onClick={() => {
                  if (!esMesActual || disponibilidad.tipo === 'pasado') return;
                  if (selectionMode === 'hora') {
                    setSelectedDate(fecha);
                    setSelectedSlots(new Set());
                    onDateSelect?.(fecha);
                  } else if (selectionMode === 'proyecto') {
                    setSelectedDate(fecha);
                    onDateSelect?.(fecha);
                  } else if (selectionMode === 'dia') {
                    if (disponibilidad.tipo !== 'sin-disponibilidad') toggleDaySelection(fecha);
                  } else if (selectionMode === 'semana') {
                    toggleWeekSelection(fecha);
                  } else if (selectionMode === 'mes') {
                    toggleMonthSelection(fecha);
                  }
                }}
              >
                <span className="day-number">{fecha.getDate()}</span>

                {esMesActual && disponibilidad.tipo !== 'pasado' && disponibilidad.tipo !== 'sin-disponibilidad' && (
                  <div className="day-indicator">
                    {(() => {
                      const bounds = getJornadaBounds(disponibilidad.horarios);
                      if (!bounds) return null;
                      const hours = getHourRange(bounds.inicio, bounds.fin);
                      return (
                        <>
                          <div className="occ-time">
                            {bounds.inicio.slice(0, 5)}<span className="occ-sep">–</span>{bounds.fin.slice(0, 5)}
                          </div>
                          <div className="occ-squares">
                            {hours.map((h, i) => (
                              <span
                                key={i}
                                className={`occ-sq ${getSlotStatus(disponibilidad.horarios, h)}`}
                                title={h}
                              />
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel de detalle del día seleccionado — solo para modo hora */}
      {selectedDate && selectionMode === 'hora' && (
        <div className="day-detail-panel">
          <div className="detail-header">
            <Calendar size={20} />
            <h4>
              {diasSemanaCompletos[selectedDate.getDay()]}, {selectedDate.getDate()} de {meses[selectedDate.getMonth()]}
            </h4>
            {onSlotsConfirm && (
              <span className="detail-hint">
                <Info size={13} />
                Haz clic en una hora verde para seleccionarla
              </span>
            )}
          </div>

          {(() => {
            const prevDay = new Date(selectedDate);
            prevDay.setDate(prevDay.getDate() - 1);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const threeDays = [prevDay, selectedDate, nextDay];
            const threeDisp = threeDays.map(d => getDisponibilidadDia(d));
            const allHorarios = threeDisp.flatMap(d => d.horarios);
            const bounds = getJornadaBounds(allHorarios);

            if (!bounds) {
              return (
                <div className="detail-content">
                  <div className="no-horarios">
                    <Info size={24} />
                    <p>{t('availabilityCalendar.detail.noSchedulePeriod')}</p>
                    {config.acepta_mismo_dia && (
                      <small>{t('availabilityCalendar.detail.contactForAvailability')}</small>
                    )}
                  </div>
                </div>
              );
            }

            const hours = getHourRange(bounds.inicio, bounds.fin);

            return (
              <>
                <div className="three-day-grid">
                  <div className="tgrid-headers">
                    <div className="tgrid-gutter" />
                    {threeDays.map((d, i) => (
                      <div
                        key={i}
                        className={`tgrid-day-header${d.toDateString() === selectedDate.toDateString() ? ' is-selected' : ''}`}
                      >
                        <span className="tgrid-wd">{diasSemana[d.getDay()]}</span>
                        <span className={`tgrid-dn${d.toDateString() === hoy.toDateString() ? ' is-hoy' : ''}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="tgrid-body">
                    {hours.map(hour => (
                      <div key={hour} className="tgrid-row">
                        <div className="tgrid-hour-label">{hour}</div>
                        {threeDisp.map((disp, i) => {
                          const status = getSlotStatus(disp.horarios, hour);
                          const slotKey = getSlotKey(threeDays[i], hour);
                          const isSelected = selectedSlots.has(slotKey);
                          const isClickable = status === 'disponible' && !!onSlotsConfirm;
                          return (
                            <div
                              key={i}
                              className={`tgrid-cell ${status}${isSelected ? ' is-selected-slot' : ''}${isClickable ? ' is-clickable' : ''}`}
                              title={`${diasSemana[threeDays[i].getDay()]} ${threeDays[i].getDate()} · ${hour}${isClickable ? ' — clic para seleccionar' : ''}`}
                              onClick={() => isClickable && toggleSlot(slotKey)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="tgrid-legend">
                    <span className="tgrid-leg-item">
                      <span className="tgrid-leg-dot disponible" />
                      {t('availabilityCalendar.legend.available')}
                    </span>
                    <span className="tgrid-leg-item">
                      <span className="tgrid-leg-dot ocupado" />
                      {t('availabilityCalendar.legend.busy')}
                    </span>
                    <span className="tgrid-leg-item">
                      <span className="tgrid-leg-dot libre" />
                      {t('availabilityCalendar.legend.notAvailable')}
                    </span>
                    {onSlotsConfirm && (
                      <span className="tgrid-leg-item">
                        <span className="tgrid-leg-dot is-selected-slot" />
                        Seleccionado
                      </span>
                    )}
                  </div>
                </div>

                {/* Panel de confirmación de slots — solo si onSlotsConfirm está presente */}
                {onSlotsConfirm && selectedSlots.size > 0 && (
                  <div className="tgrid-confirm-panel">
                    <div className="tgrid-confirm-header">
                      <CheckCircle size={15} />
                      <span>
                        {selectedSlots.size} hora{selectedSlots.size > 1 ? 's' : ''} seleccionada{selectedSlots.size > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="tgrid-selected-slots">
                      {Array.from(selectedSlots).sort().map(key => {
                        const [dateStr, hour] = key.split(' ');
                        const d = new Date(dateStr + 'T12:00:00');
                        return (
                          <span
                            key={key}
                            className="tgrid-slot-badge"
                            onClick={() => removeSlot(key)}
                            title="Clic para quitar"
                          >
                            {diasSemana[d.getDay()]} {d.getDate()} · {hour}
                            <span className="slot-remove">×</span>
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="tgrid-confirm-btn"
                      onClick={confirmSlots}
                    >
                      <CheckCircle size={16} />
                      Confirmar horario seleccionado
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          {/* Footer de configuración */}
          <div className="detail-footer">
            {config.dias_anticipacion_minima > 0 && (
              <div className="config-note">
                <Info size={14} />
                <span>{t('availabilityCalendar.config.requiresAdvance', { days: config.dias_anticipacion_minima })}</span>
              </div>
            )}
            {config.acepta_mismo_dia && (
              <div className="config-note success">
                <CheckCircle size={14} />
                <span>{t('availabilityCalendar.config.acceptsSameDay')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de confirmación para modos día / semana / mes */}
      {['dia', 'semana', 'mes'].includes(selectionMode) && selectedDays.size > 0 && (
        <div className="days-confirm-panel">
          <div className="days-confirm-header">
            <CheckCircle size={15} />
            <span>
              {selectionMode === 'dia' && `${selectedDays.size} día${selectedDays.size !== 1 ? 's' : ''} seleccionado${selectedDays.size !== 1 ? 's' : ''}`}
              {selectionMode === 'semana' && (() => {
                const w = Math.round(selectedDays.size / 7);
                return `${w} semana${w !== 1 ? 's' : ''} seleccionada${w !== 1 ? 's' : ''}`;
              })()}
              {selectionMode === 'mes' && (() => {
                const mo = new Set(Array.from(selectedDays).map(d => d.slice(0, 7))).size;
                return `${mo} mes${mo !== 1 ? 'es' : ''} seleccionado${mo !== 1 ? 's' : ''}`;
              })()}
            </span>
          </div>
          <div className="days-range-display">
            <span className="days-range-badge">
              {formatDateShort(Array.from(selectedDays).sort()[0])}
              {' — '}
              {formatDateShort(Array.from(selectedDays).sort().at(-1))}
            </span>
          </div>
          <button type="button" className="tgrid-confirm-btn" onClick={confirmDays}>
            <CheckCircle size={16} />
            Confirmar selección
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="availability-summary">
        <div className="summary-item">
          <Clock size={18} />
          <span>{t('availabilityCalendar.config.maxHours', { hours: config.horas_semanales_maximas })}</span>
        </div>
        {config.acepta_fines_semana && (
          <div className="summary-item">
            <Calendar size={18} />
            <span>{t('availabilityCalendar.config.availableWeekends')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
