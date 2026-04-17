// src/pages/Onboarding.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import api from '../services/api';
import Cropper from 'react-easy-crop';
import {
  User, Camera, MapPin, Briefcase, DollarSign,
  CheckCircle, ChevronRight, ChevronLeft, Search,
  Star, ArrowRight, X,
} from 'lucide-react';
import '../styles/onboarding.scss';

// ─── helpers ────────────────────────────────────────────────────────────────
const departamentosSV = [
  'Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad',
  'La Paz','La Unión','Morazán','San Miguel','San Salvador',
  'San Vicente','Santa Ana','Sonsonate','Usulután',
];

const municipiosPorDepartamento = {
  'San Salvador':['San Salvador','Mejicanos','Soyapango','Apopa','Delgado','Ilopango','San Marcos','Ayutuxtepeque','Cuscatancingo'],
  'La Libertad':['Santa Tecla','Antiguo Cuscatlán','Nuevo Cuscatlán','San Juan Opico','Colón','La Libertad','Quezaltepeque'],
  'Santa Ana':['Santa Ana','Metapán','Chalchuapa','Candelaria de la Frontera','Coatepeque','El Congo','Texistepeque'],
  'San Miguel':['San Miguel','Usulután','Santiago de María','Chinameca','Nueva Guadalupe','San Rafael Oriente'],
  'Sonsonate':['Sonsonate','Acajutla','Izalco','Nahuizalco','Sonzacate','Armenia','Caluco'],
};

// Step identifiers
const STEPS_CLIENTE    = ['welcome','photo','profile','done'];
const STEPS_TRABAJADOR = ['welcome','photo','profile','skills','rates','done'];

// ─── image cropping helpers ──────────────────────────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.src = url;
  });

const getCroppedBlob = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');
  const maxSize  = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width  = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width  * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
};

// ════════════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════════════════════
const Onboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const steps = user?.tipo_usuario === 'trabajador' ? STEPS_TRABAJADOR : STEPS_CLIENTE;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Pulse animation state — resets on each new step to guide user's attention
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    setShowPulse(true);
    const t = setTimeout(() => setShowPulse(false), 6000);
    return () => clearTimeout(t);
  }, [currentIdx]);

  // Photo state
  const [previewUrl, setPreviewUrl]         = useState(user?.foto_perfil || null);
  const [imageSrc, setImageSrc]             = useState(null);
  const [crop, setCrop]                     = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                     = useState(1);
  const [rotation, setRotation]             = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [photoUploaded, setPhotoUploaded]   = useState(!!user?.foto_perfil);
  const fileInputRef = useRef(null);

  // Profile state
  const [biografia, setBiografia]           = useState(user?.biografia || '');
  const [departamento, setDepartamento]     = useState(user?.departamento || '');
  const [municipio, setMunicipio]           = useState(user?.municipio || '');
  const [tituloProfesional, setTituloProfesional] = useState(user?.titulo_profesional || '');

  // Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills]   = useState([]);
  const [skillSearch, setSkillSearch]         = useState('');

  // Rates state
  const [tarifas, setTarifas] = useState({ tarifa_hora: '', tarifa_dia: '', tarifa_semana: '', tarifa_mes: '' });
  const [hasTarifas, setHasTarifas] = useState(false);

  const currentStep = steps[currentIdx];
  const isFirstStep = currentIdx === 0;
  const isLastStep  = currentIdx === steps.length - 1;
  const progress    = Math.round((currentIdx / (steps.length - 1)) * 100);

  // Whether the image cropper is currently active
  const cropperActive = currentStep === 'photo' && imageSrc !== null;

  // ── Load initial data for worker ──────────────────────────────────────
  useEffect(() => {
    if (user?.tipo_usuario === 'trabajador') {
      profileService.getAvailableSkills()
        .then((res) => setAvailableSkills(res?.data || []))
        .catch(() => {});

      profileService.getMySkills()
        .then((res) => setSelectedSkills(res?.data || []))
        .catch(() => {});

      serviceService.getTarifasByWorker(user.id)
        .then((res) => {
          if (res?.tarifa_hora !== undefined) {
            setTarifas({
              tarifa_hora:    res.tarifa_hora   || '',
              tarifa_dia:     res.tarifa_dia    || '',
              tarifa_semana:  res.tarifa_semana || '',
              tarifa_mes:     res.tarifa_mes    || '',
            });
            setHasTarifas(true);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // ── Photo handlers ────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 5MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Returns true on success, false on failure
  const handleUploadPhoto = async () => {
    if (!imageSrc || !croppedAreaPixels) return false;

    setSaving(true);
    setError(null);

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      const formData = new FormData();
      formData.append('file', blob, 'profile-photo.jpg');

      const { data: result } = await api.post('/users/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newUrl = result?.data?.foto_perfil;
      if (newUrl) {
        setPreviewUrl(newUrl);
        setPhotoUploaded(true);
      }

      setImageSrc(null);
      // Don't await refreshUser() here — it sets loading:true in ProtectedRoute
      // which unmounts this component and resets currentIdx to 0.
      // The photo URL is already updated in local state (previewUrl).
      return true; // success
    } catch (err) {
      logger.error('Error uploading photo:', err);
      setError(err.response?.data?.message || 'Error al subir la foto. Intenta de nuevo.');
      return false; // failure
    } finally {
      setSaving(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────
  const handleNext = async () => {
    setError(null);

    if (currentStep === 'photo' && imageSrc && croppedAreaPixels) {
      const ok = await handleUploadPhoto();
      if (!ok) return; // stop if upload failed
    }

    if (currentStep === 'profile') {
      const ok = await saveProfile();
      if (!ok) return;
    }

    if (currentStep === 'skills') {
      await saveSkills();
    }

    if (currentStep === 'rates') {
      await saveRates();
    }

    if (currentStep === 'done') {
      finishOnboarding();
      return;
    }

    setCurrentIdx((i) => i + 1);
  };

  // Used only by the cropper save button — uploads AND advances
  const handleSavePhotoAndAdvance = async () => {
    const ok = await handleUploadPhoto();
    if (ok) setCurrentIdx((i) => i + 1);
  };

  const handleBack = () => {
    setError(null);
    setImageSrc(null); // discard any pending crop
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  };

  const handleSkip = () => {
    setError(null);
    setImageSrc(null);
    if (currentStep === 'done') {
      finishOnboarding();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const finishOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`chambing_onboarding_done_${user.id}`, '1');
    }
    // Fire-and-forget refresh so dashboard shows updated user data.
    // We don't await — navigation happens immediately.
    refreshUser().catch(() => {});
    navigate('/dashboard', { replace: true });
  };

  // ── Save helpers ──────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre:    user?.nombre    || '',
        apellido:  user?.apellido  || '',
        telefono:  user?.telefono  || '',
        biografia,
        departamento,
        municipio,
        ...(user?.tipo_usuario === 'trabajador' && { titulo_profesional: tituloProfesional }),
      };
      await profileService.updateProfile(payload);
      // Don't await refreshUser() — it triggers ProtectedRoute to unmount
      // this component (loading:true), resetting currentIdx to 0.
      // Data is saved on the backend; refresh happens at finishOnboarding.
      return true;
    } catch (err) {
      logger.error('Error saving profile:', err);
      setError('Error al guardar. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSkills = async () => {
    setSaving(true);
    try {
      await profileService.updateSkills(selectedSkills.map((s) => s.id));
    } catch (err) {
      logger.error('Error saving skills:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveRates = async () => {
    const toNum = (v) => { const n = parseFloat(v); return isNaN(n) || n <= 0 ? null : n; };
    const data = {
      tarifa_hora:   toNum(tarifas.tarifa_hora),
      tarifa_dia:    toNum(tarifas.tarifa_dia),
      tarifa_semana: toNum(tarifas.tarifa_semana),
      tarifa_mes:    toNum(tarifas.tarifa_mes),
      moneda: 'USD',
    };
    const hasAny = Object.values(data).slice(0,4).some((v) => v !== null);
    if (!hasAny) return;

    setSaving(true);
    try {
      if (hasTarifas) {
        await serviceService.updateTarifas(user.id, data);
      } else {
        await serviceService.createTarifas(user.id, data);
      }
    } catch (err) {
      logger.error('Error saving rates:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      const exists = prev.find((s) => s.id === skill.id);
      return exists ? prev.filter((s) => s.id !== skill.id) : [...prev, skill];
    });
  };

  const filteredSkills = availableSkills.filter((s) =>
    s.nombre.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // ── Render steps ──────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      // ── Welcome ────────────────────────────────────────────────────
      case 'welcome': {
        const isWorker = user?.tipo_usuario === 'trabajador';
        const items = isWorker
          ? [
              { icon: <Camera size={18} />, title: 'Foto de perfil', desc: 'Una foto genera más confianza' },
              { icon: <User size={18} />, title: 'Tu presentación', desc: 'Cuéntanos sobre tu experiencia' },
              { icon: <Briefcase size={18} />, title: 'Habilidades y tarifas', desc: 'Para que los clientes te encuentren' },
            ]
          : [
              { icon: <Camera size={18} />, title: 'Foto de perfil', desc: 'Opcional, pero mejora tu experiencia' },
              { icon: <MapPin size={18} />, title: 'Tu ubicación', desc: 'Confirmamos dónde encontrarte' },
              { icon: <Star size={18} />, title: 'Listo para empezar', desc: 'Encuentra profesionales cerca de ti' },
            ];

        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              {isWorker
                ? <Briefcase size={30} strokeWidth={1.75} />
                : <Search   size={30} strokeWidth={1.75} />}
            </div>

            <h1 className="onboarding__step-title">
              Bienvenido/a,{' '}
              <span className="onboarding__welcome-name">
                {user?.nombre || 'usuario'}
              </span>
            </h1>
            <p className="onboarding__step-subtitle">
              {isWorker
                ? 'En 2 minutos configuramos tu perfil para que los clientes puedan encontrarte. ¡Es muy fácil!'
                : 'Completemos tu perfil rápidamente. Solo toma un par de pasos.'}
            </p>

            <ul className="onboarding__checklist">
              {items.map((item, i) => (
                <li key={i} className="onboarding__checklist-item">
                  <div className="onboarding__checklist-icon">{item.icon}</div>
                  <div className="onboarding__checklist-text">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      // ── Photo ──────────────────────────────────────────────────────
      case 'photo':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <Camera size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Tu foto de perfil</h1>
            <p className="onboarding__step-subtitle">
              Los perfiles con foto reciben hasta 3 veces más contactos.
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} />
                {error}
              </div>
            )}

            {!imageSrc ? (
              /* ── Photo picker (cropper NOT active) ── */
              <div className="onboarding__photo-area">
                <button
                  type="button"
                  className="onboarding__avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Seleccionar foto de perfil"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Foto de perfil" className="onboarding__avatar-img" />
                  ) : (
                    <div className="onboarding__avatar-placeholder">
                      <User size={40} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="onboarding__avatar-badge">
                    <Camera size={14} />
                  </div>
                </button>

                {photoUploaded ? (
                  <p className="onboarding__photo-hint onboarding__photo-hint--success">
                    <CheckCircle size={15} />
                    ¡Foto guardada! Presiona el botón azul de abajo para continuar.
                  </p>
                ) : (
                  <p className="onboarding__photo-hint">
                    Toca la imagen de arriba para elegir una foto de tu galería.
                    <br />
                    <small>JPG, PNG o WebP — máximo 5 MB</small>
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className="ob-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={18} />
                  {photoUploaded ? 'Cambiar foto' : 'Elegir foto de mi galería'}
                </button>

                {/* Clear hint for older users */}
                {!photoUploaded && (
                  <p className="onboarding__photo-skip-hint">
                    <ArrowRight size={13} />
                    No tienes foto ahora? Está bien — presiona el botón azul de abajo.
                  </p>
                )}
              </div>
            ) : (
              /* ── Cropper (imageSrc is set) ──
                 ⚠️  No navigation buttons here — they live in the fixed bottom nav
                     to avoid competing buttons. */
              <>
                <div className="onboarding__cropper-wrap">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>

                <div className="onboarding__crop-controls">
                  <label>Zoom</label>
                  <div className="crop-slider-row">
                    <Search size={16} />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      // ── Profile ────────────────────────────────────────────────────
      case 'profile':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <User size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Cuéntanos de ti</h1>
            <p className="onboarding__step-subtitle">
              {user?.tipo_usuario === 'trabajador'
                ? 'Una buena descripción te ayuda a conseguir más clientes.'
                : 'Una breve descripción mejora tu experiencia en la plataforma.'}
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} /> {error}
              </div>
            )}

            {user?.tipo_usuario === 'trabajador' && (
              <div className="ob-form-group">
                <label className="ob-label" htmlFor="ob-titulo">
                  Título profesional
                </label>
                <input
                  id="ob-titulo"
                  className="ob-input"
                  type="text"
                  placeholder="Ej: Electricista Certificado, Maestro de Obras…"
                  value={tituloProfesional}
                  onChange={(e) => setTituloProfesional(e.target.value)}
                  maxLength={100}
                />
              </div>
            )}

            <div className="ob-form-group">
              <label className="ob-label" htmlFor="ob-bio">
                {user?.tipo_usuario === 'trabajador' ? 'Sobre mí y mi trabajo' : 'Sobre mí'}
                <span className="ob-optional">(opcional)</span>
              </label>
              <textarea
                id="ob-bio"
                className="ob-textarea"
                placeholder={
                  user?.tipo_usuario === 'trabajador'
                    ? 'Ej: Soy electricista con 10 años de experiencia. Realizo instalaciones, reparaciones y revisiones eléctricas con garantía…'
                    : 'Cuéntanos un poco sobre ti…'
                }
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                maxLength={500}
              />
              <div className="ob-char-count">{biografia.length}/500</div>
            </div>

            <div className="ob-form-group">
              <label className="ob-label" htmlFor="ob-depto">
                Departamento
              </label>
              <select
                id="ob-depto"
                className="ob-select"
                value={departamento}
                onChange={(e) => { setDepartamento(e.target.value); setMunicipio(''); }}
              >
                <option value="">Seleccionar departamento</option>
                {departamentosSV.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="ob-form-group">
              <label className="ob-label" htmlFor="ob-municipio">
                Municipio
              </label>
              <select
                id="ob-municipio"
                className="ob-select"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                disabled={!departamento}
              >
                <option value="">{departamento ? 'Seleccionar municipio' : 'Primero elige el departamento'}</option>
                {departamento && municipiosPorDepartamento[departamento]?.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        );

      // ── Skills ─────────────────────────────────────────────────────
      case 'skills':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <Briefcase size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Tus habilidades</h1>
            <p className="onboarding__step-subtitle">
              Selecciona los servicios que ofreces. Los clientes podrán filtrarte por categoría.
            </p>

            <div className="ob-skills-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar habilidades…"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
            </div>

            <div className="ob-skills-scroll">
              {filteredSkills.length > 0 ? (
                <div className="ob-skills-grid">
                  {filteredSkills.map((skill) => {
                    const isSelected = selectedSkills.some((s) => s.id === skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        className={`ob-skill-chip ${isSelected ? 'ob-skill-chip--selected' : ''}`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {isSelected && <CheckCircle size={14} />}
                        {skill.nombre}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                  No se encontraron habilidades
                </p>
              )}
            </div>

            {selectedSkills.length > 0 && (
              <p className="ob-skills-selected">
                <CheckCircle size={14} style={{ verticalAlign: 'middle', color: 'var(--color-primary)', marginRight: '0.25rem' }} />
                {selectedSkills.length} habilidad{selectedSkills.length !== 1 ? 'es' : ''} seleccionada{selectedSkills.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        );

      // ── Rates ──────────────────────────────────────────────────────
      case 'rates':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <DollarSign size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Tus tarifas</h1>
            <p className="onboarding__step-subtitle">
              Define cuánto cobras. Esto es opcional — puedes completarlo más tarde desde tu perfil.
            </p>

            <div className="ob-rates-grid">
              {[
                { key: 'tarifa_hora',    label: 'Por hora' },
                { key: 'tarifa_dia',     label: 'Por día' },
                { key: 'tarifa_semana',  label: 'Por semana' },
                { key: 'tarifa_mes',     label: 'Por mes' },
              ].map(({ key, label }) => (
                <div key={key} className="ob-rate-card">
                  <label htmlFor={`ob-${key}`}>{label}</label>
                  <div className="ob-rate-input-wrap">
                    <span>$</span>
                    <input
                      id={`ob-${key}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={tarifas[key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) {
                          setTarifas((prev) => ({ ...prev, [key]: v }));
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Done ───────────────────────────────────────────────────────
      case 'done':
        return (
          <div className="onboarding__step">
            <div className="onboarding__done">
              <div className="onboarding__done-confetti">
                <CheckCircle size={48} strokeWidth={1.5} />
              </div>

              <h1 className="onboarding__done-title">
                {user?.tipo_usuario === 'trabajador'
                  ? '¡Tu perfil está listo!'
                  : '¡Todo configurado!'}
              </h1>
              <p className="onboarding__done-sub">
                {user?.tipo_usuario === 'trabajador'
                  ? 'Los clientes ya pueden encontrarte. Puedes actualizar tu información en cualquier momento desde tu perfil.'
                  : 'Ya puedes buscar y contratar profesionales en El Salvador.'}
              </p>

              <div className="onboarding__done-profile">
                {previewUrl ? (
                  <img src={previewUrl} alt={user?.nombre} className="onboarding__done-avatar" />
                ) : (
                  <div className="onboarding__done-avatar-placeholder">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="onboarding__done-info">
                  <strong>{user?.nombre} {user?.apellido}</strong>
                  <span>
                    {user?.tipo_usuario === 'trabajador'
                      ? tituloProfesional || 'Trabajador'
                      : 'Cliente'}
                    {departamento ? ` • ${departamento}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Dot indicators ────────────────────────────────────────────────────
  const renderDots = () => (
    <div className="onboarding__dots" aria-hidden="true">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`onboarding__dot ${
            i === currentIdx ? 'onboarding__dot--active' :
            i < currentIdx  ? 'onboarding__dot--done'   : ''
          }`}
        />
      ))}
    </div>
  );

  // ── Next button label — context-aware so users always know what happens ──
  const nextLabel = () => {
    if (saving) return <><span className="onboarding__nav-spinner" /> Guardando...</>;
    if (currentStep === 'done')    return <>Ir al Dashboard <ArrowRight size={18} /></>;
    if (currentStep === 'welcome') return <>Comenzar ahora <ChevronRight size={18} /></>;
    if (currentStep === 'photo')   return photoUploaded
      ? <>Continuar con mi foto <ChevronRight size={18} /></>
      : <>Continuar sin foto <ChevronRight size={18} /></>;
    return <>Guardar y continuar <ChevronRight size={18} /></>;
  };

  // ── Skip visibility ───────────────────────────────────────────────────
  const showSkip = ['photo', 'profile', 'skills', 'rates'].includes(currentStep) && !cropperActive;

  // ── Nav button class ─────────────────────────────────────────────────
  const nextBtnClass = [
    'onboarding__nav-next',
    (isFirstStep || currentStep === 'done') ? 'onboarding__nav-next--full' : '',
    (showPulse && !saving) ? 'onboarding__nav-next--pulse' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="onboarding">

      {/* Top progress bar */}
      <header className="onboarding__topbar">
        <Link to="/" className="onboarding__logo" aria-label="Chambing inicio">
          <div className="onboarding__logo-mark">C</div>
          <span className="onboarding__logo-name">Chambing</span>
        </Link>

        <div className="onboarding__progress-wrap">
          <div className="onboarding__progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="onboarding__progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="onboarding__progress-label">
            Paso {currentIdx + 1} de {steps.length}
          </div>
        </div>

        {showSkip && (
          <button className="onboarding__skip-btn" onClick={handleSkip}>
            Omitir paso
          </button>
        )}
      </header>

      {/* Step content */}
      <main className="onboarding__content">
        {renderDots()}
        <div key={currentStep}>
          {renderStep()}
        </div>
      </main>

      {/* ── Bottom navigation ──────────────────────────────────────────────
          When the CROPPER is active, we replace the default nav with
          "Cancelar" + "Guardar y continuar" to avoid 4 competing buttons.
          ─────────────────────────────────────────────────────────────────── */}
      <nav className="onboarding__nav" aria-label="Navegación del perfil">

        {cropperActive ? (
          /* Cropper mode: only these two buttons visible */
          <>
            <button
              type="button"
              className="onboarding__nav-back"
              onClick={() => setImageSrc(null)}
              disabled={saving}
            >
              <X size={18} />
              Cancelar
            </button>

            <button
              type="button"
              className={['onboarding__nav-next', showPulse && !saving ? 'onboarding__nav-next--pulse' : ''].filter(Boolean).join(' ')}
              onClick={handleSavePhotoAndAdvance}
              disabled={saving}
            >
              {saving
                ? <><span className="onboarding__nav-spinner" /> Guardando...</>
                : <><CheckCircle size={18} /> Guardar y continuar</>
              }
            </button>
          </>
        ) : (
          /* Normal mode */
          <>
            {!isFirstStep && currentStep !== 'done' && (
              <button
                type="button"
                className="onboarding__nav-back"
                onClick={handleBack}
                disabled={saving}
              >
                <ChevronLeft size={18} />
                Atrás
              </button>
            )}

            <button
              type="button"
              className={nextBtnClass}
              onClick={() => { setShowPulse(false); handleNext(); }}
              disabled={saving}
            >
              {nextLabel()}
            </button>
          </>
        )}
      </nav>

    </div>
  );
};

export default Onboarding;
