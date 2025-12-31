// src/pages/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import '../styles/edit-profile.scss';

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    biografia: '',
    departamento: '',
    municipio: '',
    titulo_profesional: '', // 🆕 NUEVO
  });

  // 🆕 NUEVO - Estado para tarifas
  const [tarifas, setTarifas] = useState({
    tarifa_hora: '',
    tarifa_dia: '',
    tarifa_semana: '',
    tarifa_mes: '',
    moneda: 'USD'
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchSkill, setSearchSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasTarifas, setHasTarifas] = useState(false); // 🆕 NUEVO

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar habilidades disponibles
        const skillsResponse = await profileService.getAvailableSkills();
        logger.api('Skills loaded', skillsResponse);
        setAvailableSkills(skillsResponse?.data || []);

        // Cargar datos del usuario
        if (user) {
          setFormData({
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            telefono: user.telefono || '',
            biografia: user.biografia || '',
            departamento: user.departamento || '',
            municipio: user.municipio || '',
            titulo_profesional: user.titulo_profesional || '', // 🆕 NUEVO
          });

          // Cargar habilidades del usuario
          if (user.tipo_usuario === 'trabajador') {
            try {
              const userSkillsResponse = await profileService.getMySkills();
              logger.api('User skills loaded', userSkillsResponse);
              setSelectedSkills(userSkillsResponse?.data || []);
            } catch (err) {
              logger.warn('Error loading user skills:', err);
              setSelectedSkills([]);
            }

            // 🆕 NUEVO - Cargar tarifas del trabajador
            try {
              const tarifasResponse = await serviceService.getTarifasByWorker(user.id);
              logger.api('Tarifas loaded', tarifasResponse);

              if (tarifasResponse && tarifasResponse.tarifa_hora !== undefined) {
                setTarifas({
                  tarifa_hora: tarifasResponse.tarifa_hora || '',
                  tarifa_dia: tarifasResponse.tarifa_dia || '',
                  tarifa_semana: tarifasResponse.tarifa_semana || '',
                  tarifa_mes: tarifasResponse.tarifa_mes || '',
                  moneda: tarifasResponse.moneda || 'USD'
                });
                setHasTarifas(true);
              }
            } catch (err) {
              logger.warn('Error loading tarifas:', err);
              setHasTarifas(false);
            }
          }
        }
      } catch (err) {
        logger.error('Error loading data:', err);
        setError('Error al cargar los datos. Por favor recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🆕 NUEVO - Manejar cambios en tarifas
  const handleTarifaChange = (e) => {
    const { name, value } = e.target;
    // Solo permitir números y punto decimal
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setTarifas(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      // 1. Actualizar información del perfil (incluyendo titulo_profesional)
      await profileService.updateProfile(formData);

      // 2. Actualizar habilidades (solo para trabajadores)
      if (user.tipo_usuario === 'trabajador') {
        const skillIds = selectedSkills.map(s => s.id);
        await profileService.updateSkills(skillIds);

        // 🆕 NUEVO - 3. Actualizar o crear tarifas
        const validateTarifa = (value) => {
          if (!value) return null;
          const num = parseFloat(value);
          return isNaN(num) || num <= 0 ? null : num;
        };

        const tarifasToSave = {
          tarifa_hora: validateTarifa(tarifas.tarifa_hora),
          tarifa_dia: validateTarifa(tarifas.tarifa_dia),
          tarifa_semana: validateTarifa(tarifas.tarifa_semana),
          tarifa_mes: validateTarifa(tarifas.tarifa_mes),
          moneda: tarifas.moneda || 'USD'
        };

        // Solo guardar si hay al menos una tarifa
        const hasAnyTarifa = Object.values(tarifasToSave).some(
          (val, idx) => idx < 4 && val !== null && val > 0
        );

        if (hasAnyTarifa) {
          try {
            if (hasTarifas) {
              // Actualizar tarifas existentes
              await serviceService.updateTarifas(user.id, tarifasToSave);
            } else {
              // Crear nuevas tarifas
              await serviceService.createTarifas(user.id, tarifasToSave);
            }
          } catch (tarifaError) {
            logger.warn('Error guardando tarifas:', tarifaError);
              setError(prev => `${prev || ''} Advertencia: No se pudieron guardar las tarifas.`);
          }
        }
      }

      // 4. Refrescar datos del usuario
      await refreshUser();

      setSuccess(true);

      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      logger.error('Error actualizando perfil:', err);
      logger.error('Error details:', err.response);

      const errorMessage = err.response?.data?.message
        || err.message
        || 'Error al actualizar el perfil. Por favor intenta nuevamente.';

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Filtrar habilidades por búsqueda
  const filteredSkills = availableSkills.filter(skill =>
    skill.nombre.toLowerCase().includes(searchSkill.toLowerCase())
  );

  // Agrupar por categoría
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    const category = skill.categoria || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="edit-profile">
        <div className="edit-profile__loading">
          Cargando datos del perfil...
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile">
      <div className="edit-profile__header">
        <button
          className="edit-profile__back-btn"
          onClick={() => navigate('/dashboard')}
          type="button"
          disabled={saving}
        >
          ← Volver
        </button>
        <h1>Editar Perfil</h1>
      </div>

      <div className="edit-profile__container">
        {/* Mensajes de error/éxito */}
        {error && (
          <div className="edit-profile__error">
            {error}
          </div>
        )}

        {success && (
          <div className="edit-profile__success">
            Perfil actualizado exitosamente. Redirigiendo...
          </div>
        )}

        {/* Información Básica */}
        <section className="edit-profile__section">
          <h2>Información Básica</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__field">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="edit-profile__field">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="edit-profile__field">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="+503 0000-0000"
              />
            </div>

            {/* 🆕 NUEVO - Título Profesional para trabajadores */}
            {user?.tipo_usuario === 'trabajador' && (
              <div className="edit-profile__field">
                <label htmlFor="titulo_profesional">
                  Título Profesional
                  <span className="edit-profile__hint-inline">
                    (Ej: Maestro Constructor, Electricista Certificado)
                  </span>
                </label>
                <input
                  type="text"
                  id="titulo_profesional"
                  name="titulo_profesional"
                  value={formData.titulo_profesional}
                  onChange={handleInputChange}
                  placeholder="Ej: Maestro de Obras"
                  maxLength={100}
                />
              </div>
            )}

            <div className="edit-profile__field">
              <label htmlFor="departamento">Departamento</label>
              <select
                id="departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar departamento</option>
                <option value="Ahuachapán">Ahuachapán</option>
                <option value="Cabañas">Cabañas</option>
                <option value="Chalatenango">Chalatenango</option>
                <option value="Cuscatlán">Cuscatlán</option>
                <option value="La Libertad">La Libertad</option>
                <option value="La Paz">La Paz</option>
                <option value="La Unión">La Unión</option>
                <option value="Morazán">Morazán</option>
                <option value="San Miguel">San Miguel</option>
                <option value="San Salvador">San Salvador</option>
                <option value="San Vicente">San Vicente</option>
                <option value="Santa Ana">Santa Ana</option>
                <option value="Sonsonate">Sonsonate</option>
                <option value="Usulután">Usulután</option>
              </select>
            </div>

            <div className="edit-profile__field">
              <label htmlFor="municipio">Municipio</label>
              <input
                type="text"
                id="municipio"
                name="municipio"
                value={formData.municipio}
                onChange={handleInputChange}
                placeholder="Ej: San Salvador"
              />
            </div>
          </div>
        </section>

        {/* Biografía */}
        <section className="edit-profile__section">
          <h2>Biografía Profesional</h2>
          <div className="edit-profile__field edit-profile__field--full">
            <label htmlFor="biografia">
              Cuéntanos sobre ti y tu experiencia
              <span className="edit-profile__char-count">
                {formData.biografia.length} / 500
              </span>
            </label>
            <textarea
              id="biografia"
              name="biografia"
              value={formData.biografia}
              onChange={handleInputChange}
              maxLength={500}
              rows={6}
              placeholder="Ej: Tengo 5 años de experiencia en limpieza de hogares. Soy una persona responsable, puntual y detallista..."
            />
          </div>
        </section>

        {/* 🆕 NUEVO - Tarifas (solo para trabajadores) */}
        {user?.tipo_usuario === 'trabajador' && (
          <section className="edit-profile__section">
            <h2>Mis Tarifas</h2>
            <p className="edit-profile__hint">
              Configura tus tarifas por hora, día, semana o mes. Puedes dejar en blanco las que no apliquen.
            </p>

            <div className="edit-profile__tarifas-grid">
              <div className="edit-profile__field">
                <label htmlFor="tarifa_hora">
                  <span className="tarifa-icon">⏱️</span>
                  Tarifa por Hora
                </label>
                <div className="edit-profile__input-group">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    id="tarifa_hora"
                    name="tarifa_hora"
                    value={tarifas.tarifa_hora}
                    onChange={handleTarifaChange}
                    placeholder="15.00"
                    className="input-with-prefix"
                  />
                </div>
              </div>

              <div className="edit-profile__field">
                <label htmlFor="tarifa_dia">
                  <span className="tarifa-icon">📅</span>
                  Tarifa por Día
                </label>
                <div className="edit-profile__input-group">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    id="tarifa_dia"
                    name="tarifa_dia"
                    value={tarifas.tarifa_dia}
                    onChange={handleTarifaChange}
                    placeholder="100.00"
                    className="input-with-prefix"
                  />
                </div>
              </div>

              <div className="edit-profile__field">
                <label htmlFor="tarifa_semana">
                  <span className="tarifa-icon">📆</span>
                  Tarifa por Semana
                </label>
                <div className="edit-profile__input-group">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    id="tarifa_semana"
                    name="tarifa_semana"
                    value={tarifas.tarifa_semana}
                    onChange={handleTarifaChange}
                    placeholder="600.00"
                    className="input-with-prefix"
                  />
                </div>
              </div>

              <div className="edit-profile__field">
                <label htmlFor="tarifa_mes">
                  <span className="tarifa-icon">🗓️</span>
                  Tarifa por Mes
                </label>
                <div className="edit-profile__input-group">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    id="tarifa_mes"
                    name="tarifa_mes"
                    value={tarifas.tarifa_mes}
                    onChange={handleTarifaChange}
                    placeholder="2000.00"
                    className="input-with-prefix"
                  />
                </div>
              </div>
            </div>

            <div className="edit-profile__tarifa-note">
              💡 <strong>Nota:</strong> Estas tarifas serán visibles en tu perfil público y ayudarán a los clientes a entender tus costos.
            </div>
          </section>
        )}

        {/* Habilidades - Solo para trabajadores */}
        {user?.tipo_usuario === 'trabajador' && (
          <section className="edit-profile__section">
            <h2>Mis Habilidades</h2>
            <p className="edit-profile__hint">
              Selecciona todas las habilidades en las que tienes experiencia
            </p>

            {/* Buscador */}
            <div className="edit-profile__search">
              <input
                type="text"
                placeholder="Buscar habilidad..."
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
              />
            </div>

            {/* Seleccionadas */}
            {selectedSkills.length > 0 && (
              <div className="edit-profile__selected-skills">
                <h3>Seleccionadas ({selectedSkills.length})</h3>
                <div className="edit-profile__skills-list">
                  {selectedSkills.map(skill => (
                    <button
                      key={skill.id}
                      type="button"
                      className="edit-profile__skill-tag edit-profile__skill-tag--selected"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill.nombre} ✕
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Por categoría */}
            <div className="edit-profile__skills-categories">
              {Object.entries(skillsByCategory).map(([category, skills]) => (
                <div key={category} className="edit-profile__skill-category">
                  <h3>{category}</h3>
                  <div className="edit-profile__skills-list">
                    {skills.map(skill => {
                      const isSelected = selectedSkills.find(s => s.id === skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          className={`edit-profile__skill-tag ${isSelected ? 'edit-profile__skill-tag--selected' : ''
                            }`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill.nombre} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {availableSkills.length === 0 && (
              <div className="edit-profile__no-skills">
                No hay habilidades disponibles en este momento.
              </div>
            )}
          </section>
        )}

        {/* Botones */}
        <div className="edit-profile__actions">
          <button
            type="button"
            className="edit-profile__btn edit-profile__btn--secondary"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="edit-profile__btn edit-profile__btn--primary"
            onClick={handleSave}
            disabled={saving || !formData.nombre || !formData.apellido}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;