import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, CircularProgress } from '@mui/material';
import {
  ArrowLeft, Briefcase, Users, Clock, DollarSign,
  FileText, Image, Plus, X, Search,
} from 'lucide-react';
import { misionService } from '../services/misionService';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';
import '../styles/misiones.scss';

export default function CrearMision() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    cantidad_personas: 1,
    salario_por_persona: '',
    duracion: '',
    notas: '',
    habilidades_ids: [],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (user?.tipo_usuario !== 'cliente') {
      navigate('/misiones');
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoadingSkills(true);
      try {
        const res = await profileService.getAvailableSkills();
        setAllSkills(res.data || res || []);
      } catch (err) {
        logger.error('Error cargando habilidades:', err.message);
      } finally {
        setLoadingSkills(false);
      }
    };
    load();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleSkill = (skillId) => {
    setForm((prev) => ({
      ...prev,
      habilidades_ids: prev.habilidades_ids.includes(skillId)
        ? prev.habilidades_ids.filter((id) => id !== skillId)
        : [...prev.habilidades_ids, skillId],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.titulo.trim() || form.titulo.length < 5) e.titulo = 'El título debe tener al menos 5 caracteres';
    if (!form.descripcion.trim() || form.descripcion.length < 20) e.descripcion = 'La descripción debe tener al menos 20 caracteres';
    if (!form.cantidad_personas || form.cantidad_personas < 1) e.cantidad_personas = 'Debe ser al menos 1 persona';
    if (!form.salario_por_persona || Number(form.salario_por_persona) < 1) e.salario_por_persona = 'El salario debe ser mayor a $0';
    if (!form.duracion.trim()) e.duracion = 'La duración es requerida';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        cantidad_personas: Number(form.cantidad_personas),
        salario_por_persona: Number(form.salario_por_persona),
        duracion: form.duracion.trim(),
        notas: form.notas.trim() || undefined,
        habilidades_ids: form.habilidades_ids,
      };

      const res = await misionService.createMision(payload);
      const misionId = res.data?.id;

      // Upload cover photo if provided
      if (photoFile && misionId) {
        try {
          await misionService.uploadFotoPortada(misionId, photoFile);
        } catch (photoErr) {
          logger.error('Error subiendo foto (no crítico):', photoErr.message);
        }
      }

      navigate(`/misiones/${misionId}`);
    } catch (err) {
      logger.error('Error creando misión:', err.message);
      const msg = err.response?.data?.message || 'Error al publicar la misión';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSkills = allSkills.filter((s) =>
    s.nombre?.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const selectedSkillNames = allSkills
    .filter((s) => form.habilidades_ids.includes(s.id))
    .map((s) => s.nombre);

  return (
    <div className="crear-mision">
      <Link
        to="/misiones"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', marginBottom: 20, fontSize: '0.9rem', fontWeight: 500 }}
      >
        <ArrowLeft size={16} />
        Volver a Misiones
      </Link>

      <div className="crear-mision__header">
        <h1>Publicar Misión</h1>
        <p>Describe el trabajo que necesitas y encuentra al mejor talento</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="crear-mision__card">

          {/* ── Foto de portada ── */}
          <div className="crear-mision__section">
            <h3 className="crear-mision__section-title">
              <Image size={18} /> Foto de portada
            </h3>
            <div
              className={`crear-mision__photo-upload ${photoPreview ? 'crear-mision__photo-upload--has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Vista previa" />
              ) : (
                <>
                  <Image size={40} color="#94a3b8" />
                  <p>Haz clic para subir una imagen (opcional)</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>JPG, PNG, WebP · Máx. 5 MB</p>
                </>
              )}
            </div>
          </div>

          {/* ── Información básica ── */}
          <div className="crear-mision__section">
            <h3 className="crear-mision__section-title">
              <Briefcase size={18} /> Información del trabajo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                label="Título de la misión"
                value={form.titulo}
                onChange={handleChange('titulo')}
                error={Boolean(errors.titulo)}
                helperText={errors.titulo || 'Ej: Necesito albañiles para construcción de pared'}
                fullWidth
                inputProps={{ maxLength: 255 }}
              />

              <TextField
                label="Descripción del trabajo"
                value={form.descripcion}
                onChange={handleChange('descripcion')}
                error={Boolean(errors.descripcion)}
                helperText={errors.descripcion || 'Describe el proyecto con detalle: qué se debe hacer, condiciones, etc.'}
                fullWidth
                multiline
                rows={4}
                inputProps={{ maxLength: 3000 }}
              />
            </div>
          </div>

          {/* ── Detalles de contratación ── */}
          <div className="crear-mision__section">
            <h3 className="crear-mision__section-title">
              <Users size={18} /> Detalles de contratación
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <TextField
                label="Personas necesarias"
                type="number"
                value={form.cantidad_personas}
                onChange={handleChange('cantidad_personas')}
                error={Boolean(errors.cantidad_personas)}
                helperText={errors.cantidad_personas}
                inputProps={{ min: 1, max: 100 }}
              />

              <TextField
                label="Salario por persona"
                type="number"
                value={form.salario_por_persona}
                onChange={handleChange('salario_por_persona')}
                error={Boolean(errors.salario_por_persona)}
                helperText={errors.salario_por_persona || 'En USD'}
                InputProps={{ startAdornment: <span style={{ marginRight: 4, color: '#64748b' }}>$</span> }}
                inputProps={{ min: 1, step: '0.01' }}
              />

              <TextField
                label="Duración"
                value={form.duracion}
                onChange={handleChange('duracion')}
                error={Boolean(errors.duracion)}
                helperText={errors.duracion || 'Ej: 2 semanas, 3 días'}
                inputProps={{ maxLength: 100 }}
              />
            </div>
          </div>

          {/* ── Habilidades ── */}
          <div className="crear-mision__section">
            <h3 className="crear-mision__section-title">
              <FileText size={18} /> Habilidades requeridas
            </h3>

            {form.habilidades_ids.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {selectedSkillNames.map((name, i) => (
                  <span
                    key={form.habilidades_ids[i]}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#2563eb', color: '#fff', borderRadius: 999, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 500 }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleSkill(form.habilidades_ids[i])}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar habilidad..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {loadingSkills ? (
              <div style={{ textAlign: 'center', padding: 16 }}><CircularProgress size={20} /></div>
            ) : (
              <div className="crear-mision__skills-grid">
                {filteredSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className={`crear-mision__skill-toggle ${form.habilidades_ids.includes(skill.id) ? 'crear-mision__skill-toggle--selected' : ''}`}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.nombre}
                  </button>
                ))}
                {filteredSkills.length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No se encontraron habilidades</p>
                )}
              </div>
            )}
          </div>

          {/* ── Notas adicionales ── */}
          <div className="crear-mision__section">
            <h3 className="crear-mision__section-title">
              <FileText size={18} /> Notas adicionales
            </h3>
            <TextField
              label="Notas o requerimientos especiales (opcional)"
              value={form.notas}
              onChange={handleChange('notas')}
              fullWidth
              multiline
              rows={3}
              placeholder="Ej: Se requieren herramientas propias, acceso a vehículo, horario específico..."
              inputProps={{ maxLength: 2000 }}
            />
          </div>

          {serverError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#b91c1c', fontSize: '0.9rem' }}>
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className="crear-mision__submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CircularProgress size={18} color="inherit" />
                Publicando misión...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={18} />
                Publicar Misión
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
