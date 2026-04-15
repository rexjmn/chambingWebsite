import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import CoverPhotoModal from '../components/CoverPhotoModal';
import '../styles/onboarding.scss';

const DEPARTAMENTOS = [
  'Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad',
  'La Paz','La Unión','Morazán','San Miguel','San Salvador',
  'San Vicente','Santa Ana','Sonsonate','Usulután',
];

// ── Comisiones Chambing ─────────────────────────────────────────────────────
const PLATFORM_FEE  = 0.10;   // 10%
const GATEWAY_FEE   = 0.035;  // 3.5%
const IVA_RATE      = 0.13;   // IVA El Salvador 13%

/**
 * Calcula cuánto recibe el trabajador después de comisiones.
 * Comisión bruta = tarifa × (PLATFORM_FEE + GATEWAY_FEE)
 * IVA se aplica sobre la comisión bruta
 * Trabajador recibe = tarifa − comisión bruta − IVA sobre comisión
 */
const calcNet = (bruto) => {
  if (!bruto || isNaN(bruto) || bruto <= 0) return null;
  const comision = bruto * (PLATFORM_FEE + GATEWAY_FEE);
  const iva      = comision * IVA_RATE;
  const neto     = bruto - comision - iva;
  return { bruto, comision, iva, neto };
};

const fmt = (n) => `$${Number(n).toFixed(2)}`;

// ── Componente calculadora de tarifa ───────────────────────────────────────
const TarifaField = ({ label, icon, name, value, onChange }) => {
  const resultado = calcNet(parseFloat(value));
  return (
    <div className="onboarding-tarifa-block">
      <div className="onboarding-field">
        <label htmlFor={`ob-${name}`}>
          <span className="tarifa-icon">{icon}</span> {label}
        </label>
        <div className="onboarding-currency-wrap">
          <span className="currency-prefix">$</span>
          <input
            id={`ob-${name}`}
            name={name}
            type="number"
            value={value}
            onChange={onChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
          />
        </div>
      </div>
      {resultado && (
        <div className="onboarding-net-calc">
          <div className="calc-row calc-deduct">
            <span>Comisión Chambing (10% + 3.5%)</span>
            <span>−{fmt(resultado.comision)}</span>
          </div>
          <div className="calc-row calc-deduct">
            <span>IVA 13% sobre comisión</span>
            <span>−{fmt(resultado.iva)}</span>
          </div>
          <div className="calc-row calc-net">
            <span>Tú recibes</span>
            <strong>{fmt(resultado.neto)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const isTrabajador = user?.tipo_usuario === 'trabajador';
  const TOTAL_STEPS  = isTrabajador ? 3 : 2;

  const [step, setStep] = useState(1);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCoverModal,   setShowCoverModal]   = useState(false);
  const [profilePhotoDone, setProfilePhotoDone] = useState(!!user?.foto_perfil);
  const [coverPhotoDone,   setCoverPhotoDone]   = useState(!!user?.foto_portada);

  // Step 2 — datos básicos
  const [formData, setFormData] = useState({
    telefono:          user?.telefono          || '',
    biografia:         user?.biografia         || '',
    titulo_profesional:user?.titulo_profesional|| '',
    departamento:      user?.departamento      || '',
    municipio:         user?.municipio         || '',
  });

  // Step 3 — tarifas (solo trabajadores)
  const [tarifas, setTarifas] = useState({
    tarifa_hora:   '',
    tarifa_dia:    '',
    tarifa_semana: '',
    tarifa_mes:    '',
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const progressPct = (step / TOTAL_STEPS) * 100;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTarifaChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setTarifas(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkipAll = () => {
    localStorage.removeItem('chambing_needs_onboarding');
    navigate('/dashboard', { replace: true });
  };

  const handleNextStep = () => setStep(s => s + 1);

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      // ── Guardar datos básicos ────────────────────────────────────────────
      const profilePayload = {};
      if (formData.telefono.trim())          profilePayload.telefono           = formData.telefono.trim();
      if (formData.biografia.trim())         profilePayload.biografia          = formData.biografia.trim();
      if (isTrabajador) {
        if (formData.titulo_profesional.trim()) profilePayload.titulo_profesional = formData.titulo_profesional.trim();
        if (formData.departamento)              profilePayload.departamento        = formData.departamento;
        if (formData.municipio.trim())          profilePayload.municipio           = formData.municipio.trim();
      }
      if (Object.keys(profilePayload).length > 0) {
        await profileService.updateProfile(profilePayload);
        updateUser(profilePayload);
      }

      // ── Guardar tarifas (solo trabajadores) ──────────────────────────────
      if (isTrabajador) {
        const toNum = (v) => {
          const n = parseFloat(v);
          return isNaN(n) || n <= 0 ? null : n;
        };
        const tarifasPayload = {
          tarifa_hora:   toNum(tarifas.tarifa_hora),
          tarifa_dia:    toNum(tarifas.tarifa_dia),
          tarifa_semana: toNum(tarifas.tarifa_semana),
          tarifa_mes:    toNum(tarifas.tarifa_mes),
          moneda: 'USD',
        };
        const hasTarifa = Object.values(tarifasPayload).some(v => v !== null && typeof v === 'number');
        if (hasTarifa) {
          try {
            await serviceService.createTarifas(user.id, tarifasPayload);
          } catch (tarifaErr) {
            // Intentar actualizar si ya existen
            try {
              await serviceService.updateTarifas(user.id, tarifasPayload);
            } catch {
              logger.warn('No se pudieron guardar las tarifas:', tarifaErr);
            }
          }
        }
      }

      localStorage.removeItem('chambing_needs_onboarding');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      logger.error('Error saving onboarding profile:', err);
      setError('No se pudo guardar tu perfil. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="onboarding-page">
      <div className="onboarding-card">

        {/* Progress bar */}
        <div className="onboarding-progress">
          <div className="onboarding-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1: FOTOS
        ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div className="onboarding-header">
              <div>
                <span className="onboarding-step-label">Paso 1 de {TOTAL_STEPS}</span>
                <h1 className="onboarding-title">Tu foto de perfil</h1>
                <p className="onboarding-subtitle">
                  Una buena foto genera más confianza con los{' '}
                  {isTrabajador ? 'clientes' : 'trabajadores'}.
                </p>
              </div>
              <button className="onboarding-skip-top" onClick={handleSkipAll} type="button">
                Omitir todo
              </button>
            </div>

            <div className="onboarding-body">
              <div className="onboarding-photos">

                {/* Foto de perfil */}
                <button
                  className={`onboarding-photo-item${profilePhotoDone ? ' onboarding-photo-item--done' : ''}`}
                  onClick={() => setShowProfileModal(true)}
                  type="button"
                >
                  <div className="onboarding-photo-preview onboarding-photo-preview--circle">
                    {user?.foto_perfil ? (
                      <img src={user.foto_perfil} alt="Foto de perfil" />
                    ) : (
                      <span className="photo-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                      </span>
                    )}
                    {profilePhotoDone && (
                      <span className="done-check">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="2,6 5,9 10,3"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="onboarding-photo-text">
                    <strong>{profilePhotoDone ? 'Foto de perfil lista' : 'Agregar foto de perfil'}</strong>
                    <span>{profilePhotoDone ? 'Clic para cambiarla' : 'Circular · JPG, PNG, WebP · máx. 5 MB'}</span>
                  </div>
                  <span className="onboarding-photo-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </span>
                </button>

                {/* Foto de portada */}
                <button
                  className={`onboarding-photo-item${coverPhotoDone ? ' onboarding-photo-item--done' : ''}`}
                  onClick={() => setShowCoverModal(true)}
                  type="button"
                >
                  <div className="onboarding-photo-preview onboarding-photo-preview--rect">
                    {user?.foto_portada ? (
                      <img src={user.foto_portada} alt="Foto de portada" />
                    ) : (
                      <span className="photo-placeholder">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </span>
                    )}
                    {coverPhotoDone && (
                      <span className="done-check">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="2,6 5,9 10,3"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="onboarding-photo-text">
                    <strong>{coverPhotoDone ? 'Portada lista' : 'Agregar foto de portada'}</strong>
                    <span>{coverPhotoDone ? 'Clic para cambiarla' : 'Opcional · 4:1 · máx. 10 MB'}</span>
                  </div>
                  <span className="onboarding-photo-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </span>
                </button>

              </div>
            </div>

            <div className="onboarding-footer">
              <button className="onboarding-btn-skip" onClick={handleSkipAll} type="button">
                Omitir todo
              </button>
              <button className="onboarding-btn-primary" onClick={handleNextStep} type="button">
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2: DATOS BÁSICOS
        ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div className="onboarding-header">
              <div>
                <span className="onboarding-step-label">Paso 2 de {TOTAL_STEPS}</span>
                <h1 className="onboarding-title">Cuéntanos sobre ti</h1>
                <p className="onboarding-subtitle">
                  Esta información aparece en tu perfil público.
                </p>
              </div>
              <button className="onboarding-skip-top" onClick={handleSkipAll} type="button">
                Omitir todo
              </button>
            </div>

            <div className="onboarding-body">
              {error && <div className="onboarding-error">{error}</div>}

              <div className="onboarding-form">

                <div className="onboarding-field">
                  <label htmlFor="ob-telefono">Teléfono</label>
                  <input
                    id="ob-telefono" name="telefono" type="tel"
                    value={formData.telefono} onChange={handleChange}
                    placeholder="Ej: +503 7123-4567" maxLength={20}
                  />
                </div>

                {isTrabajador && (
                  <div className="onboarding-field">
                    <label htmlFor="ob-titulo">Título profesional</label>
                    <input
                      id="ob-titulo" name="titulo_profesional" type="text"
                      value={formData.titulo_profesional} onChange={handleChange}
                      placeholder="Ej: Electricista residencial" maxLength={100}
                    />
                  </div>
                )}

                <div className="onboarding-field">
                  <label htmlFor="ob-bio">
                    {isTrabajador ? 'Tu presentación profesional' : 'Sobre ti'}
                  </label>
                  <textarea
                    id="ob-bio" name="biografia"
                    value={formData.biografia} onChange={handleChange}
                    placeholder={isTrabajador
                      ? 'Describe tu experiencia, especialidades y qué te diferencia de otros profesionales...'
                      : 'Cuéntanos sobre ti...'}
                    maxLength={500}
                  />
                  <span className="onboarding-char-count">{formData.biografia.length}/500</span>
                </div>

                {isTrabajador && (
                  <div className="onboarding-field-row">
                    <div className="onboarding-field">
                      <label htmlFor="ob-depto">Departamento</label>
                      <select
                        id="ob-depto" name="departamento"
                        value={formData.departamento} onChange={handleChange}
                      >
                        <option value="">Seleccionar</option>
                        {DEPARTAMENTOS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="onboarding-field">
                      <label htmlFor="ob-muni">Municipio</label>
                      <input
                        id="ob-muni" name="municipio" type="text"
                        value={formData.municipio} onChange={handleChange}
                        placeholder="Tu municipio" maxLength={80}
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="onboarding-footer">
              <button className="onboarding-btn-skip" onClick={handleSkipAll} type="button">
                Omitir todo
              </button>
              {isTrabajador ? (
                <button className="onboarding-btn-primary" onClick={handleNextStep} type="button">
                  Siguiente
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              ) : (
                <button
                  className="onboarding-btn-primary"
                  onClick={handleFinish}
                  type="button"
                  disabled={saving}
                >
                  {saving ? <><span className="btn-spinner" /> Guardando...</> : 'Listo, ir al Dashboard'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3 (solo trabajadores): TARIFAS
        ════════════════════════════════════════════════════════════════ */}
        {step === 3 && isTrabajador && (
          <>
            <div className="onboarding-header">
              <div>
                <span className="onboarding-step-label">Paso 3 de {TOTAL_STEPS}</span>
                <h1 className="onboarding-title">Define tus tarifas</h1>
                <p className="onboarding-subtitle">
                  Ingresa lo que quieres cobrar. Verás exactamente cuánto recibirás.
                </p>
              </div>
              <button className="onboarding-skip-top" onClick={handleSkipAll} type="button">
                Omitir
              </button>
            </div>

            <div className="onboarding-body">
              {error && <div className="onboarding-error">{error}</div>}

              {/* Aviso de comisiones */}
              <div className="onboarding-fee-notice">
                <div className="fee-notice-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div className="fee-notice-text">
                  <strong>Sobre las comisiones de Chambing</strong>
                  <p>
                    De cada pago que recibas, Chambing descuenta:
                    <span className="fee-item">10% comisión de plataforma</span>
                    <span className="fee-item">3.5% procesamiento de pago</span>
                    <span className="fee-item">13% IVA sobre las comisiones (obligatorio en El Salvador)</span>
                  </p>
                  <p className="fee-example">
                    Cada tarifa que defines abajo muestra cuánto recibirás realmente.
                  </p>
                </div>
              </div>

              <div className="onboarding-form">
                <TarifaField
                  label="Por hora"    icon="⏱️" name="tarifa_hora"
                  value={tarifas.tarifa_hora}   onChange={handleTarifaChange}
                />
                <TarifaField
                  label="Por día"     icon="📅" name="tarifa_dia"
                  value={tarifas.tarifa_dia}    onChange={handleTarifaChange}
                />
                <TarifaField
                  label="Por semana"  icon="📆" name="tarifa_semana"
                  value={tarifas.tarifa_semana} onChange={handleTarifaChange}
                />
                <TarifaField
                  label="Por mes"     icon="🗓️" name="tarifa_mes"
                  value={tarifas.tarifa_mes}    onChange={handleTarifaChange}
                />
              </div>

              <p className="onboarding-skip-note">
                Puedes omitir este paso y configurar tus tarifas más tarde desde{' '}
                <strong>Editar Perfil</strong>.
              </p>
            </div>

            <div className="onboarding-footer">
              <button
                className="onboarding-btn-skip"
                onClick={handleSkipAll}
                type="button"
                disabled={saving}
              >
                Omitir
              </button>
              <button
                className="onboarding-btn-primary"
                onClick={handleFinish}
                type="button"
                disabled={saving}
              >
                {saving
                  ? <><span className="btn-spinner" /> Guardando...</>
                  : 'Listo, ir al Dashboard'}
              </button>
            </div>
          </>
        )}

      </div>

      {/* Modales de foto — siempre montados para evitar remount */}
      <ProfilePhotoModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onPhotoUpdated={(url) => {
          updateUser({ foto_perfil: url });
          setProfilePhotoDone(true);
          setShowProfileModal(false);
        }}
      />
      <CoverPhotoModal
        open={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onPhotoUpdated={(url) => {
          updateUser({ foto_portada: url });
          setCoverPhotoDone(true);
          setShowCoverModal(false);
        }}
      />
    </div>
  );
};

export default Onboarding;
