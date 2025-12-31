import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import adminService from '../../services/adminService';
import { logger } from '../../utils/logger';

const CategoriesManager = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    requisitosDocumentos: {},
    activo: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (error) {
      logger.error('Error cargando categorías:', error);
      alert(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        alert(t('success.generic'));
      } else {
        await adminService.createCategory(formData);
        alert(t('success.generic'));
      }
      setShowModal(false);
      setFormData({ nombre: '', descripcion: '', requisitosDocumentos: {}, activo: true });
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      logger.error('Error guardando categoría:', error);
      alert(t('errors.serverError'));
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion || '',
      requisitosDocumentos: category.requisitosDocumentos || {},
      activo: category.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.users.confirmations.delete'))) return;
    
    try {
      await adminService.deleteCategory(id);
      alert(t('success.generic'));
      loadCategories();
    } catch (error) {
      logger.error('Error eliminando categoría:', error);
      alert(t('errors.serverError'));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ nombre: '', descripcion: '', requisitosDocumentos: {}, activo: true });
  };

  if (loading) {
    return (
      <div className="admin-section__loading">
        <div className="admin-dashboard__spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h2>{t('services.categories.domesticCleaning')}</h2>
          <p className="admin-section__subtitle">
            {t('nav.services')}
          </p>
        </div>
        <button 
          className="admin-btn admin-btn--primary"
          onClick={() => setShowModal(true)}
        >
          <span>➕</span>
          Nueva Categoría
        </button>
      </div>

      <div className="admin-section__stats">
        <div className="admin-stat-badge admin-stat-badge--primary">
          <strong>{categories.length}</strong>
          <span>{t('admin.users.stats.total')}</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--success">
          <strong>{categories.filter(c => c.activo).length}</strong>
          <span>Activas</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--muted">
          <strong>{categories.filter(c => !c.activo).length}</strong>
          <span>Inactivas</span>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Trabajadores</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td>
                  <div className="admin-table__name">
                    <span className="admin-table__icon">🏷️</span>
                    <strong>{category.nombre}</strong>
                  </div>
                </td>
                <td>
                  <span className="admin-table__description">
                    {category.descripcion || 'Sin descripción'}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${category.activo ? 'admin-badge--success' : 'admin-badge--muted'}`}>
                    {category.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <span className="admin-table__count">
                    {category.trabajadoresCategorias?.length || 0}
                  </span>
                </td>
                <td>
                  <div className="admin-table__actions">
                    <button
                      className="admin-icon-btn admin-icon-btn--edit"
                      onClick={() => handleEdit(category)}
                      title={t('common.edit')}
                    >
                      ✏️
                    </button>
                    <button
                      className="admin-icon-btn admin-icon-btn--delete"
                      onClick={() => handleDelete(category.id)}
                      title={t('common.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">📋</div>
            <h3>No hay categorías registradas</h3>
            <p>Crea la primera categoría para comenzar</p>
            <button 
              className="admin-btn admin-btn--primary"
              onClick={() => setShowModal(true)}
            >
              Crear Categoría
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="admin-modal-overlay" onClick={closeModal} />
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>{editingCategory ? t('common.edit') : 'Nueva'} Categoría</h3>
              <button className="admin-modal__close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form__group">
                <label className="admin-form__label">Nombre *</label>
                <input
                  type="text"
                  className="admin-form__input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  placeholder="ej. Limpieza Doméstica"
                />
              </div>

              <div className="admin-form__group">
                <label className="admin-form__label">Descripción</label>
                <textarea
                  className="admin-form__textarea"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  placeholder="Describe el tipo de servicio..."
                />
              </div>

              <div className="admin-form__group">
                <label className="admin-form__checkbox">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  />
                  <span>Categoría activa</span>
                </label>
              </div>

              <div className="admin-form__actions">
                <button 
                  type="button" 
                  className="admin-btn admin-btn--secondary"
                  onClick={closeModal}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {editingCategory ? t('common.save') : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriesManager;