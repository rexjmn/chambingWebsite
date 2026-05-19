import React, { useState, useEffect, useMemo } from 'react';
import adminService from '../../services/adminService';
import { logger } from '../../utils/logger';

const emptyForm = { nombre: '', categoria: '', descripcion: '', activo: true };

const SkillsManager = () => {
  const [skills, setSkills] = useState([]);
  const [managedCategories, setManagedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => { load(); }, [showInactive]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [skillsData, categoriesData] = await Promise.all([
        adminService.getSkills(showInactive),
        adminService.getCategories().catch((err) => {
          logger.warn('No se pudieron cargar categorías administradas:', err);
          return [];
        }),
      ]);
      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setManagedCategories(
        (Array.isArray(categoriesData) ? categoriesData : [])
          .filter((category) => category?.activo !== false)
          .map((category) => category?.nombre)
          .filter(Boolean)
      );
    } catch (err) {
      logger.error('Error cargando servicios:', err);
      setError('No se pudieron cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (skill) => {
    setEditing(skill);
    setForm({
      nombre: skill.nombre,
      categoria: skill.categoria || '',
      descripcion: skill.descripcion || '',
      activo: skill.activo,
    });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre del servicio es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await adminService.updateSkill(editing.id, form);
      } else {
        await adminService.createSkill(form);
      }
      closeModal();
      await load();
    } catch (err) {
      logger.error('Error guardando servicio:', err);
      setError(err?.response?.data?.message || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (skill) => {
    if (!window.confirm(`Desactivar "${skill.nombre}"? Dejara de aparecer en los perfiles.`)) return;
    try {
      await adminService.deleteSkill(skill.id);
      await load();
    } catch (err) {
      logger.error('Error desactivando servicio:', err);
      alert('Error al desactivar el servicio.');
    }
  };

  const handleReactivate = async (skill) => {
    try {
      await adminService.updateSkill(skill.id, { activo: true });
      await load();
    } catch (err) {
      logger.error('Error reactivando servicio:', err);
      alert('Error al reactivar el servicio.');
    }
  };

  const existingCategories = useMemo(() => {
    const cats = new Set(skills.map((s) => s.categoria).filter(Boolean));
    return [...cats].sort();
  }, [skills]);

  const availableCategories = useMemo(() => {
    const merged = new Set([...managedCategories, ...existingCategories]);
    return [...merged].sort((a, b) => a.localeCompare(b, 'es'));
  }, [managedCategories, existingCategories]);

  // Para el formulario, mostrar solo categorías administradas.
  // Si el servicio editado tiene una categoría legacy, la conservamos para no perderla.
  const formCategories = useMemo(() => {
    const merged = new Set(managedCategories);
    if (form.categoria) merged.add(form.categoria);
    return [...merged].sort((a, b) => a.localeCompare(b, 'es'));
  }, [managedCategories, form.categoria]);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchSearch =
        !search ||
        s.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (s.categoria || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCategory || s.categoria === filterCategory;
      return matchSearch && matchCat;
    });
  }, [skills, search, filterCategory]);

  const groupedByCategory = useMemo(() => {
    return filtered.reduce((acc, skill) => {
      const cat = skill.categoria || 'Sin categoria';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="admin-section admin-services">
      <div className="admin-section__header">
        <div>
          <h2>Catalogo de Servicios</h2>
          <p className="admin-section__subtitle">
            Estos son los servicios que los trabajadores pueden asignar a su perfil
          </p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          Nuevo servicio
        </button>
      </div>

      {error && !showModal && (
        <div className="admin-alert admin-alert--error">{error}</div>
      )}

      <div className="admin-section__stats">
        <div className="admin-stat-badge admin-stat-badge--primary">
          <strong>{skills.length}</strong>
          <span>Total</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--success">
          <strong>{skills.filter((s) => s.activo).length}</strong>
          <span>Activos</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--muted">
          <strong>{skills.filter((s) => !s.activo).length}</strong>
          <span>Inactivos</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--muted">
          <strong>{existingCategories.length}</strong>
          <span>Categorias</span>
        </div>
      </div>

      <div className="admin-services__toolbar">
        <input
          type="text"
          placeholder="Buscar servicio o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-services__search"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="admin-services__category-select"
        >
          <option value="">Todas las categorias</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label className="admin-services__checkbox">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>

      {loading ? (
        <div className="admin-section__loading">
          <div className="admin-dashboard__spinner" />
          <p>Cargando servicios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="admin-services__empty-message">
          No se encontraron servicios. Crea el primero con el boton de arriba.
        </p>
      ) : (
        <div className="admin-services__category-list">
          {Object.entries(groupedByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
          <div key={category} className="admin-services__category-block">
            <h3 className="admin-services__category-title">
              {category}
            </h3>
            <ul className="admin-services__skill-list" role="list">
              {items.map((skill) => (
                <li
                      key={skill.id}
                      className={`admin-services__skill-item${!skill.activo ? ' admin-services__row--inactive' : ''}`}
                    >
                      <div className="admin-services__skill-main">
                        <strong className="admin-services__skill-name">{skill.nombre}</strong>
                        {skill.descripcion && (
                          <span className="admin-services__description">
                            {skill.descripcion}
                          </span>
                        )}
                      </div>
                      <span className={`admin-badge admin-services__status ${skill.activo ? 'admin-badge--success' : 'admin-badge--muted'}`}>
                          {skill.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <div className="admin-services__skill-actions">
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--edit"
                            onClick={() => openEdit(skill)}
                            title="Editar"
                            aria-label={`Editar ${skill.nombre}`}
                          >
                            ✏️
                          </button>
                          {skill.activo ? (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--warning"
                              onClick={() => handleDeactivate(skill)}
                              title="Desactivar"
                              aria-label={`Desactivar ${skill.nombre}`}
                            >
                              ⏸️
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--success"
                              onClick={() => handleReactivate(skill)}
                              title="Reactivar"
                              aria-label={`Reactivar ${skill.nombre}`}
                            >
                              ↩️
                            </button>
                          )}
                        </div>
                    </li>
                  ))}
            </ul>
          </div>
        ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="admin-modal-overlay" onClick={closeModal} />
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>{editing ? 'Editar servicio' : 'Nuevo servicio'}</h3>
              <button className="admin-modal__close" onClick={closeModal}>
                Cerrar
              </button>
            </div>

            {error && (
              <div className="admin-alert admin-alert--error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-modal__form">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Nombre del servicio <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Ej: Instalacion de cableado electrico"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  maxLength={120}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Categoria</label>
                <select
                  className="admin-input"
                  value={form.categoria}
                  onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                >
                  <option value="">Sin categoria</option>
                  {formCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Descripcion (opcional)</label>
                <textarea
                  className="admin-input"
                  placeholder="Breve descripcion del servicio..."
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  rows={3}
                  maxLength={300}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {editing && (
                <div className="admin-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                    />
                    Servicio activo (visible para los trabajadores)
                  </label>
                </div>
              )}

              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsManager;
