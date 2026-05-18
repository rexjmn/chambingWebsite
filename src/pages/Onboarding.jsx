import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import { isValidNationalPhone } from '../utils/security';
import {
  PHONE_COUNTRIES,
  fetchDefaultPhoneCountryIso,
  splitInternationalTelefono,
  buildInternationalTelefonoDigits,
  getCountryByIso,
} from '../utils/phoneCountries';
import api from '../services/api';
import CoverageRadiusPicker, {
  COVERAGE_RADIUS_KM_PRESETS,
  snapRadiusKmToPreset,
} from '../components/profile/CoverageRadiusPicker';
import { sanitizeInternalReturnUrl } from '../utils/returnUrl';
import Cropper from 'react-easy-crop';
import {
  User, Camera, MapPin, Briefcase, DollarSign,
  CheckCircle, ChevronRight, ChevronLeft, Search,
  Star, ArrowRight, X, Phone, FileText,
} from 'lucide-react';
import '../styles/onboarding.scss';

// ─── helpers ────────────────────────────────────────────────────────────────────────────
const departamentosSV = [
  'Ahuachapán','Cabañas','Chalatenango','Cuscatán','La Libertad',
  'La Paz','La Unión','Morazán','San Miguel','San Salvador',
  'San Vicente','Santa Ana','Sonsonate','Usulután',
];

const municipiosPorDepartamento = {
  'San Salvador':['San Salvador','Mejicanos','Soyapango','Apopa','Delgado','Ilopango','San Marcos','Ayutuxtepeque','Cuscatancingo'],
  'La Libertad':['Santa Tecla','Antiguo Cuscatán','Nuevo Cuscatán','San Juan Opico','Colón','La Libertad','Quezaltepeque'],
  'Santa Ana':['Santa Ana','Metapán','Chalchuapa','Candelaria de la Frontera','Coatepeque','El Congo','Texistepeque'],
  'San Miguel':['San Miguel','Usulután','Santiago de María','Chinameca','Nueva Guadalupe','San Rafael Oriente'],
  'Sonsonate':['Sonsonate','Acajutla','Izalco','Nahuizalco','Sonzacate','Armenia','Caluco'],
};

// Step identifiers — userType + phone steps injected for OAuth users (no password set)
const buildSteps = (tipoUsuario, isOAuth) => {
  const userTypeStep = isOAuth ? ['userType'] : [];
  const phoneStep    = isOAuth ? ['phone']    : [];
  if (tipoUsuario === 'trabajador') {
    return ['welcome', 'terms', ...userTypeStep, 'photo', ...phoneStep, 'profile', 'skills', 'rates', 'done'];
  }
  return ['welcome', 'terms', ...userTypeStep, 'photo', ...phoneStep, 'profile', 'done'];
};

// ─── image cropping helpers ────────────────────────────────────────────────────────────────
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

  // Whether this session was started via Google / OAuth (no password set)
  const isOAuth = !!(user?.auth_provider && user.auth_provider !== 'local');

  // For OAuth users, tipo_usuario defaults to 'cliente' on creation;
  // selectedUserType is the source of truth for flow branching.
  const [selectedUserType, setSelectedUserType] = useState(user?.tipo_usuario || 'cliente');

  // steps is state so it can be rebuilt after the userType selection
  const [steps, setSteps] = useState(() => buildSteps(user?.tipo_usuario || 'cliente', isOAuth));

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
  const [direccion, setDireccion]           = useState(user?.direccion || '');
  const [tituloProfesional, setTituloProfesional] = useState(user?.titulo_profesional || '');
  const [coberturaTipo, setCoberturaTipo]   = useState(user?.cobertura_tipo || 'pais');
  const [radioKm, setRadioKm]               = useState(() =>
    user?.cobertura_tipo === 'radio' && user?.radio_km != null
      ? snapRadiusKmToPreset(user.radio_km)
      : '',
  );
  const [lat, setLat]                       = useState(
    user?.ubicacion_lat != null ? String(user.ubicacion_lat) : '',
  );
  const [lng, setLng]                       = useState(
    user?.ubicacion_lng != null ? String(user.ubicacion_lng) : '',
  );
  const [geoConsent, setGeoConsent]         = useState(
    !!user?.consentimiento_geolocalizacion,
  );

  // Phone state (for OAuth users) — país + número nacional; guardado como código+nacional
  const initialPhone = splitInternationalTelefono(user?.telefono || '');
  const [phoneCountryIso, setPhoneCountryIso] = useState(initialPhone.iso);
  const [telefono, setTelefono]               = useState(initialPhone.national);
  const [telefonoError, setTelefonoError]     = useState('');

  useEffect(() => {
    if (!user?.telefono) return;
    const p = splitInternationalTelefono(user.telefono);
    setPhoneCountryIso(p.iso);
    setTelefono(p.national);
  }, [user?.telefono]);

  useEffect(() => {
    if (user?.telefono) return;
    let cancelled = false;
    fetchDefaultPhoneCountryIso().then((iso) => {
      if (cancelled) return;
      setPhoneCountryIso((prev) => (prev === 'SV' ? iso : prev));
    });
    return () => {
      cancelled = true;
    };
  }, [user?.telefono, user?.id]);

  // Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills]   = useState([]);
  const [skillSearch, setSkillSearch]         = useState('');

  // Rates state
  const [tarifas, setTarifas] = useState({
    tarifa_hora: '',
    etiqueta_tarifa_hora: '',
    tarifa_dia: '',
    etiqueta_tarifa_dia: '',
    tarifa_semana: '',
    etiqueta_tarifa_semana: '',
    tarifa_mes: '',
    etiqueta_tarifa_mes: '',
  });
  const [hasTarifas, setHasTarifas] = useState(false);

  // Terms state
  const [termsAccepted, setTermsAccepted] = useState(false);

  const currentStep = steps[currentIdx];
  const isFirstStep = currentIdx === 0;
  const progress    = Math.round((currentIdx / (steps.length - 1)) * 100);

  // Whether the image cropper is currently active
  const cropperActive = currentStep === 'photo' && imageSrc !== null;

  // ── Load data for worker (fires when selectedUserType changes to 'trabajador') ──
  useEffect(() => {
    if (selectedUserType === 'trabajador') {
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
              etiqueta_tarifa_hora: res.etiqueta_tarifa_hora || '',
              tarifa_dia:     res.tarifa_dia    || '',
              etiqueta_tarifa_dia: res.etiqueta_tarifa_dia || '',
              tarifa_semana:  res.tarifa_semana || '',
              etiqueta_tarifa_semana: res.etiqueta_tarifa_semana || '',
              tarifa_mes:     res.tarifa_mes    || '',
              etiqueta_tarifa_mes: res.etiqueta_tarifa_mes || '',
            });
            setHasTarifas(true);
          }
        })
        .catch(() => {});
    }
  }, [selectedUserType]);  

  // ── Photo handlers ────────────────────────────────────────────────────────────
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
      return true; // success
    } catch (err) {
      logger.error('Error uploading photo:', err);
      setError(err.response?.data?.message || 'Error al subir la foto. Intenta de nuevo.');
      return false; // failure
    } finally {
      setSaving(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    setError(null);

    // terms step — require acceptance before advancing
    if (currentStep === 'terms') {
      if (!termsAccepted) {
        setError('Debes aceptar los Términos y Condiciones para continuar.');
        return;
      }
      setCurrentIdx((i) => i + 1);
      return;
    }

    // userType step — save choice, rebuild steps, then advance
    if (currentStep === 'userType') {
      const ok = await saveUserType();
      if (!ok) return;
      const newSteps = buildSteps(selectedUserType, true);
      setSteps(newSteps);
      setCurrentIdx((i) => i + 1);
      return;
    }

    if (currentStep === 'photo' && imageSrc && croppedAreaPixels) {
      const ok = await handleUploadPhoto();
      if (!ok) return; // stop if upload failed
    }

    if (currentStep === 'phone') {
      const ok = await savePhone();
      if (!ok) return;
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
    // Persist completion server-side so any browser/device skips onboarding on future logins
    profileService.completeOnboarding().catch(() => {});
    refreshUser().catch(() => {});

    const rawReturn = sessionStorage.getItem('chambing_return_url');
    sessionStorage.removeItem('chambing_return_url');
    const returnUrl = sanitizeInternalReturnUrl(rawReturn);

    if (returnUrl) {
      navigate(returnUrl, { replace: true });
    } else {
      // Use selectedUserType (not user.tipo_usuario) so OAuth users who just
      // chose their type land on the right page before refreshUser() resolves.
      navigate(selectedUserType === 'cliente' ? '/service' : '/dashboard', { replace: true });
    }
  };

  // ── Save helpers ─────────────────────────────────────────────────────────────
  const saveUserType = async () => {
    setSaving(true);
    try {
      await profileService.changeUserType(selectedUserType);
      return true;
    } catch (err) {
      logger.error('Error saving user type:', err);
      setError('Error al guardar el tipo de usuario. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const savePhone = async () => {
    const national = telefono.replace(/\D/g, '');
    if (!isValidNationalPhone(national, phoneCountryIso)) {
      setTelefonoError('Ingresa un número válido para el país seleccionado');
      return false;
    }
    setTelefonoError('');
    const fullDigits = buildInternationalTelefonoDigits(phoneCountryIso, national).replace(/\D/g, '');
    setSaving(true);
    try {
      await profileService.updateProfile({
        nombre:   user?.nombre   || '',
        apellido: user?.apellido || '',
        telefono: fullDigits,
      });
      await refreshUser().catch(() => {});
      return true;
    } catch (err) {
      logger.error('Error saving phone:', err);
      setError('Error al guardar el teléfono. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resolveTelefonoForApi = () => {
    const stored = (user?.telefono || '').replace(/\D/g, '');
    if (stored.length >= 8) return stored;
    const national = telefono.replace(/\D/g, '');
    if (national.length >= 8 && isValidNationalPhone(national, phoneCountryIso)) {
      return buildInternationalTelefonoDigits(phoneCountryIso, national).replace(/\D/g, '');
    }
    return null;
  };

  const saveProfile = async () => {
    if (selectedUserType === 'trabajador' && coberturaTipo === 'radio') {
      const rk = Number(radioKm);
      if (!COVERAGE_RADIUS_KM_PRESETS.includes(rk)) {
        setError('Elige una distancia en la barra azul o «Todo El Salvador».');
        return false;
      }
      const la = lat !== '' ? Number(lat) : NaN;
      const lo = lng !== '' ? Number(lng) : NaN;
      if (!Number.isFinite(la) || !Number.isFinite(lo)) {
        setError(
          'Para trabajar por zona, usa «Usar mi ubicación aproximada» o elige «Todo El Salvador».',
        );
        return false;
      }
      if (!geoConsent) {
        setError('Debes autorizar el uso de ubicación aproximada para el modo por distancia.');
        return false;
      }
    }

    setSaving(true);
    try {
      const telefonoDigits = resolveTelefonoForApi();
      const payload = {
        nombre:    user?.nombre    || '',
        apellido:  user?.apellido  || '',
        biografia,
        departamento,
        municipio,
        direccion,
      };
      if (telefonoDigits) {
        payload.telefono = telefonoDigits;
      }
      if (selectedUserType === 'trabajador') {
        if (tituloProfesional.trim()) {
          payload.titulo_profesional = tituloProfesional.trim();
        }
        payload.cobertura_tipo = coberturaTipo;
        if (coberturaTipo === 'radio') {
          payload.radio_km = Number(radioKm);
          payload.lat = Number(lat);
          payload.lng = Number(lng);
          payload.consentimiento_geolocalizacion = true;
        } else {
          payload.consentimiento_geolocalizacion = false;
        }
      }
      await profileService.updateProfile(payload);
      return true;
    } catch (err) {
      logger.error('Error saving profile:', err);
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null);
      setError(msg || 'Error al guardar. Intenta de nuevo.');
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
    const cleanLabel = (value) => {
      const trimmed = (value || '').trim();
      return trimmed ? trimmed.slice(0, 80) : null;
    };
    const data = {
      tarifa_hora:   toNum(tarifas.tarifa_hora),
      etiqueta_tarifa_hora: cleanLabel(tarifas.etiqueta_tarifa_hora),
      tarifa_dia:    toNum(tarifas.tarifa_dia),
      etiqueta_tarifa_dia: cleanLabel(tarifas.etiqueta_tarifa_dia),
      tarifa_semana: toNum(tarifas.tarifa_semana),
      etiqueta_tarifa_semana: cleanLabel(tarifas.etiqueta_tarifa_semana),
      tarifa_mes:    toNum(tarifas.tarifa_mes),
      etiqueta_tarifa_mes: cleanLabel(tarifas.etiqueta_tarifa_mes),
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

  // ── Render steps ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      // ── Welcome ─────────────────────────────────────────────────────────────
      case 'welcome': {
        const isWorker = selectedUserType === 'trabajador';
        const items = isWorker
          ? [
              ...(isOAuth ? [{ icon: <Briefcase size={18} />, title: 'Tu tipo de cuenta', desc: '¿Eres cliente o trabajador?' }] : []),
              { icon: <FileText  size={18} />, title: 'Términos y condiciones', desc: 'Rápido de leer — te protege a ti también' },
              { icon: <Camera   size={18} />, title: 'Foto de perfil',          desc: 'Una foto genera más confianza' },
              ...(isOAuth ? [{ icon: <Phone size={18} />, title: 'Número de WhatsApp', desc: 'Para recibir notificaciones de contratos' }] : []),
              { icon: <User     size={18} />, title: 'Tu presentación',          desc: 'Cuéntanos sobre tu experiencia' },
              { icon: <Briefcase size={18} />, title: 'Habilidades y tarifas',  desc: 'Para que los clientes te encuentren' },
            ]
          : [
              ...(isOAuth ? [{ icon: <Briefcase size={18} />, title: 'Tu tipo de cuenta', desc: '¿Eres cliente o trabajador?' }] : []),
              { icon: <FileText size={18} />, title: 'Términos y condiciones',  desc: 'Rápido de leer — te protege a ti también' },
              { icon: <Camera size={18} />, title: 'Foto de perfil',            desc: 'Opcional, pero mejora tu experiencia' },
              ...(isOAuth ? [{ icon: <Phone size={18} />, title: 'Número de WhatsApp', desc: 'Para recibir notificaciones importantes' }] : []),
              { icon: <MapPin size={18} />, title: 'Tu ubicación',              desc: 'Confirmamos dónde encontrarte' },
              { icon: <Star   size={18} />, title: 'Listo para empezar',        desc: 'Encuentra profesionales cerca de ti' },
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

      // ── Terms & Conditions ───────────────────────────────────────────────────
      case 'terms':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <FileText size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Términos y Condiciones</h1>
            <p className="onboarding__step-subtitle">
              Lee nuestros términos — son claros y te protegen a ti también.
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} /> {error}
              </div>
            )}

            <div className="ob-terms-scroll">
              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">1. ¿Qué es Chambing?</h3>
                <p>Somos una plataforma que conecta clientes con trabajadores. Actuamos como intermediario tecnológico y <strong>no somos empleador ni parte contratante</strong> en ninguna transacción.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">2. Responsabilidad limitada</h3>
                <p>Chambing <strong>no se hace responsable</strong> por: robos, pérdidas o daños durante los servicios; disputas económicas entre usuarios; la calidad del trabajo prestado. Los pagos son directamente entre cliente y trabajador — Chambing no interviene.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">3. Contratos descargables</h3>
                <p>Ponemos a tu disposición contratos simplificados para que tengas un respaldo formal ante las autoridades competentes si lo necesitas.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">4. Verificación por PIN</h3>
                <p>Usamos un PIN único para confirmar la asistencia del trabajador. Recomendamos verificar siempre una identificación personal adicional.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">5. Cero tolerancia a la agresión</h3>
                <p>No toleramos ningún tipo de agresión física, verbal, acoso o discriminación. Las cuentas involucradas serán suspendidas permanentemente.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">6. Sistema de reseñas</h3>
                <p>Las reseñas deben ser honestas. Las reseñas falsas o malintencionadas son causa de suspensión de cuenta.</p>
              </div>

              <div className="ob-terms-section">
                <h3 className="ob-terms-section-title">7. Conducta adecuada</h3>
                <p>Te comprometes a proporcionar información verídica y a usar la plataforma solo para los fines para los que fue creada.</p>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
                Ley aplicable: República de El Salvador • Mayo 2026 •{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: '#233DFF' }}>
                  Ver versión completa
                </a>
              </p>
            </div>

            <label className="ob-terms-check">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (e.target.checked) setError(null);
                }}
              />
              <span>
                He leído y acepto los{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer">
                  Términos y Condiciones
                </a>{' '}
                de Chambing
              </span>
            </label>
          </div>
        );

      // ── User type (OAuth only) ───────────────────────────────────────────────
      case 'userType':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <Briefcase size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">¿Cómo usarás Chambing?</h1>
            <p className="onboarding__step-subtitle">
              Elige tu tipo de cuenta para personalizar tu experiencia.
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} /> {error}
              </div>
            )}

            <div className="ob-role-cards">
              <button
                type="button"
                className={`ob-role-card ${selectedUserType === 'cliente' ? 'ob-role-card--active' : ''}`}
                onClick={() => setSelectedUserType('cliente')}
              >
                <div className="ob-role-card__icon">
                  <Search size={26} strokeWidth={2} />
                </div>
                <div className="ob-role-card__text">
                  <strong>Soy Cliente</strong>
                  <span>Busco profesionales</span>
                </div>
                {selectedUserType === 'cliente' && (
                  <div className="ob-role-card__check">
                    <CheckCircle size={13} />
                  </div>
                )}
              </button>

              <button
                type="button"
                className={`ob-role-card ${selectedUserType === 'trabajador' ? 'ob-role-card--active' : ''}`}
                onClick={() => setSelectedUserType('trabajador')}
              >
                <div className="ob-role-card__icon">
                  <Briefcase size={26} strokeWidth={2} />
                </div>
                <div className="ob-role-card__text">
                  <strong>Soy Trabajador</strong>
                  <span>Ofrezco mis servicios</span>
                </div>
                {selectedUserType === 'trabajador' && (
                  <div className="ob-role-card__check">
                    <CheckCircle size={13} />
                  </div>
                )}
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5, marginTop: '0.25rem' }}>
              Puedes cambiar esto más tarde desde tu perfil.
            </p>
          </div>
        );

      // ── Photo ────────────────────────────────────────────────────────────
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

      // ── Phone ─────────────────────────────────────────────────────────────
      case 'phone':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <Phone size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Tu número de WhatsApp</h1>
            <p className="onboarding__step-subtitle">
              {user?.telefono
                ? 'Confirma que este número sigue siendo el correcto. Te enviaremos notificaciones por WhatsApp.'
                : 'Necesitamos tu número para enviarte notificaciones de contratos y mensajes por WhatsApp.'}
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} /> {error}
              </div>
            )}

            <div className="ob-form-group">
              <label className="ob-label" htmlFor="ob-telefono">
                Número de teléfono / WhatsApp
              </label>
              <div className="ob-phone-row">
                <select
                  id="ob-phone-country"
                  className="ob-select ob-select--phone-country"
                  value={phoneCountryIso}
                  onChange={(e) => {
                    setTelefonoError('');
                    setPhoneCountryIso(e.target.value);
                  }}
                  aria-label="Código de país"
                >
                  {[...PHONE_COUNTRIES]
                    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                    .map((c) => (
                      <option key={c.iso} value={c.iso}>
                        +{c.dial} {c.name}
                      </option>
                    ))}
                </select>
                <div className="ob-input-wrap">
                  <input
                    id="ob-telefono"
                    className="ob-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="Solo número local"
                    value={telefono}
                    onChange={(e) => {
                      setTelefonoError('');
                      const v = e.target.value.replace(/[^\d\-\s]/g, '');
                      setTelefono(v);
                    }}
                    maxLength={getCountryByIso(phoneCountryIso).nsnMax + 2}
                  />
                </div>
              </div>
              {telefonoError && (
                <div className="ob-alert ob-alert--error" style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem' }}>
                  <X size={14} /> {telefonoError}
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.5rem', lineHeight: 1.5 }}>
                El prefijo se elige según tu ubicación (puedes cambiarlo). Solo usamos tu número para notificaciones importantes por WhatsApp; no lo compartimos con terceros.
              </p>
            </div>
          </div>
        );

      // ── Profile ───────────────────────────────────────────────────────────
      case 'profile':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <User size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Cuéntanos de ti</h1>
            <p className="onboarding__step-subtitle">
              {selectedUserType === 'trabajador'
                ? 'Una buena descripción te ayuda a conseguir más clientes.'
                : 'Una breve descripción mejora tu experiencia en la plataforma.'}
            </p>

            {error && (
              <div className="ob-alert ob-alert--error">
                <X size={16} /> {error}
              </div>
            )}

            {selectedUserType === 'trabajador' && (
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
                {selectedUserType === 'trabajador' ? 'Sobre mí y mi trabajo' : 'Sobre mí'}
                <span className="ob-optional">(opcional)</span>
              </label>
              <textarea
                id="ob-bio"
                className="ob-textarea"
                placeholder={
                  selectedUserType === 'trabajador'
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

            {selectedUserType === 'trabajador' && (
              <>
                <div className="ob-form-group">
                  <label className="ob-label" htmlFor="ob-direccion">
                    Dirección base de trabajo
                    <span className="ob-optional">(opcional, no pública)</span>
                  </label>
                  <input
                    id="ob-direccion"
                    className="ob-input"
                    type="text"
                    placeholder="Ej: Colonia Escalón, San Salvador"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    maxLength={255}
                  />
                </div>

                <div className="ob-form-group">
                  <CoverageRadiusPicker
                    coverageType={coberturaTipo}
                    radiusKm={radioKm}
                    disabled={saving}
                    onChange={(next) => {
                      if (next.tipo === 'pais') {
                        setCoberturaTipo('pais');
                        setLat('');
                        setLng('');
                        setGeoConsent(false);
                        setRadioKm('');
                        setError(null);
                      } else {
                        setCoberturaTipo('radio');
                        setRadioKm(String(next.km));
                        setError(null);
                      }
                    }}
                  />
                </div>

                {coberturaTipo === 'radio' && (
                  <>
                    <div className="ob-form-group">
                      <label className="ob-label">Ubicación aproximada</label>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          margin: '0 0 0.75rem',
                          lineHeight: 1.45,
                        }}
                      >
                        No mostramos coordenadas: solo pulsa el botón para guardar un punto
                        aproximado (no publicamos tu dirección exacta en el perfil).
                      </p>
                      {lat && lng && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#059669',
                            margin: '0 0 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <CheckCircle size={16} aria-hidden />
                          Ubicación aproximada lista
                        </p>
                      )}
                      <button
                        type="button"
                        className="ob-upload-btn"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            setError('Tu navegador no soporta geolocalización');
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setLat(String(pos.coords.latitude));
                              setLng(String(pos.coords.longitude));
                              setError(null);
                            },
                            () =>
                              setError(
                                'No pudimos obtener tu ubicación. Revisa permisos del navegador o elige «Todo El Salvador».',
                              ),
                            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
                          );
                        }}
                      >
                        <MapPin size={16} />
                        Usar mi ubicación aproximada
                      </button>
                      <label className="ob-terms-check" style={{ marginTop: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={geoConsent}
                          onChange={(e) => setGeoConsent(e.target.checked)}
                        />
                        <span>
                          Autorizo usar mi ubicación aproximada para calcular distancias. No se
                          publica de forma exacta en mi perfil.
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );

      // ── Skills ─────────────────────────────────────────────────────────────
      case 'skills':
        return (
          <div className="onboarding__step">
            <div className="onboarding__step-icon">
              <Briefcase size={30} strokeWidth={1.75} />
            </div>
            <h1 className="onboarding__step-title">Tus servicios</h1>
            <p className="onboarding__step-subtitle">
              Selecciona los servicios que ofreces. Los clientes podran filtrarte por categoria.
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

      // ── Rates ────────────────────────────────────────────────────────────
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
                { key: 'tarifa_hora', labelKey: 'etiqueta_tarifa_hora', label: 'Por hora', labelPlaceholder: 'Ej: Diagnóstico a domicilio' },
                { key: 'tarifa_dia', labelKey: 'etiqueta_tarifa_dia', label: 'Por día', labelPlaceholder: 'Ej: Jornada completa' },
                { key: 'tarifa_semana', labelKey: 'etiqueta_tarifa_semana', label: 'Por semana', labelPlaceholder: 'Ej: Proyecto semanal' },
                { key: 'tarifa_mes', labelKey: 'etiqueta_tarifa_mes', label: 'Por mes', labelPlaceholder: 'Ej: Mantenimiento mensual' },
              ].map(({ key, labelKey, label, labelPlaceholder }) => (
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
                  <input
                    id={`ob-${labelKey}`}
                    type="text"
                    maxLength={80}
                    className="ob-rate-tag-input"
                    placeholder={labelPlaceholder}
                    value={tarifas[labelKey] || ''}
                    onChange={(e) => setTarifas((prev) => ({ ...prev, [labelKey]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      // ── Done ─────────────────────────────────────────────────────────────
      case 'done':
        return (
          <div className="onboarding__step">
            <div className="onboarding__done">
              <div className="onboarding__done-confetti">
                <CheckCircle size={48} strokeWidth={1.5} />
              </div>

              <h1 className="onboarding__done-title">
                {selectedUserType === 'trabajador'
                  ? '¡Tu perfil está listo!'
                  : '¡Todo configurado!'}
              </h1>
              <p className="onboarding__done-sub">
                {selectedUserType === 'trabajador'
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
                    {selectedUserType === 'trabajador'
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

  // ── Dot indicators ────────────────────────────────────────────────────────────
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
    if (currentStep === 'terms')   return termsAccepted
      ? <>Aceptar y continuar <ChevronRight size={18} /></>
      : <>Acepta los términos para continuar <ChevronRight size={18} /></>;
    if (currentStep === 'photo')   return photoUploaded
      ? <>Continuar con mi foto <ChevronRight size={18} /></>
      : <>Continuar sin foto <ChevronRight size={18} /></>;
    return <>Guardar y continuar <ChevronRight size={18} /></>;
  };

  // ── Skip visibility (terms and userType are mandatory — not skippable) ─────
  const showSkip = ['photo', 'phone', 'profile', 'skills', 'rates'].includes(currentStep) && !cropperActive;

  // ── Nav button class ────────────────────────────────────────────────────────────
  const nextBtnClass = [
    'onboarding__nav-next',
    (isFirstStep || currentStep === 'done') ? 'onboarding__nav-next--full' : '',
    (showPulse && !saving && currentStep !== 'terms') ? 'onboarding__nav-next--pulse' : '',
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

      {/* ── Bottom navigation ───────────────────────────────────────────────────────────────────
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
              disabled={saving || (currentStep === 'terms' && !termsAccepted)}
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
