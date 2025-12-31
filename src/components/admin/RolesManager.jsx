import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import adminService from '../../services/adminService';
import { logger } from '../../utils/logger';

const RolesManager = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    usuarioId: '',
    rolId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, usersData] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllUsers()
      ]);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (error) {
      logger.error('Error cargando datos:', error);
      alert(t('admin.roles.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignmentData.usuarioId || !assignmentData.rolId) {
      alert(t('admin.roles.messages.selectBoth'));
      return;
    }

    try {
      await adminService.assignRole(assignmentData);
      alert(t('admin.roles.messages.assignSuccess'));
      setShowAssignModal(false);
      setAssignmentData({ usuarioId: '', rolId: '' });
      loadData();
    } catch (error) {
      logger.error('Error asignando rol:', error);
      alert(t('admin.roles.messages.assignError'));
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    if (!window.confirm(t('admin.roles.confirmations.removeRole'))) {
      return;
    }

    try {
      await adminService.removeRole(userId, roleId);
      alert(t('admin.roles.messages.removeSuccess'));
      loadData();
    } catch (error) {
      logger.error('Error removiendo rol:', error);
      alert(t('admin.roles.messages.removeError'));
    }
  };

  const getRoleBadge = (roleName) => {
    const badges = {
      'super_admin': { 
        color: 'danger', 
        icon: '👑', 
        text: t('admin.roles.types.superAdmin') 
      },
      'admin': { 
        color: 'warning', 
        icon: '👨‍💼', 
        text: t('admin.roles.types.admin') 
      },
      'verificador': { 
        color: 'info', 
        icon: '✓', 
        text: t('admin.roles.types.verifier') 
      }
    };
    const badge = badges[roleName] || { color: 'muted', icon: '🔑', text: roleName };
    return (
      <span className={`admin-badge admin-badge--${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-section__loading">
        <div className="admin-dashboard__spinner" />
        <p>{t('admin.loading.roles')}</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h2>{t('admin.roles.title')}</h2>
          <p className="admin-section__subtitle">
            {t('admin.roles.subtitle')}
          </p>
        </div>
        <button 
          className="admin-btn admin-btn--primary"
          onClick={() => setShowAssignModal(true)}
        >
          <span>➕</span>
          {t('admin.roles.assignRole')}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="admin-section__stats">
        <div className="admin-stat-badge admin-stat-badge--danger">
          <strong>{roles.filter(r => r.nombre === 'super_admin').length}</strong>
          <span>{t('admin.roles.stats.superAdmins')}</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--warning">
          <strong>{roles.filter(r => r.nombre === 'admin').length}</strong>
          <span>{t('admin.roles.stats.admins')}</span>
        </div>
        <div className="admin-stat-badge admin-stat-badge--info">
          <strong>{roles.filter(r => r.nombre === 'verificador').length}</strong>
          <span>{t('admin.roles.stats.verifiers')}</span>
        </div>
      </div>

      {/* Lista de Roles */}
      <div className="admin-roles-grid">
        {roles.map(role => (
          <div key={role.id} className="admin-role-card">
            <div className="admin-role-card__header">
              <div>
                {getRoleBadge(role.nombre)}
                <h3>{role.descripcion || role.nombre}</h3>
              </div>
              <span className="admin-role-card__level">
                {t('admin.roles.card.level', { level: role.nivelAcceso })}
              </span>
            </div>

            <div className="admin-role-card__body">
              <h4>{t('admin.roles.card.usersWithRole')}</h4>
              {role.rolesAdministrativos && role.rolesAdministrativos.length > 0 ? (
                <div className="admin-role-users">
                  {role.rolesAdministrativos.map(rolAdmin => (
                    <div key={rolAdmin.id} className="admin-role-user">
                      <div className="admin-role-user__info">
                        {rolAdmin.usuario?.foto_perfil ? (
                          <img 
                            src={rolAdmin.usuario.foto_perfil} 
                            alt="" 
                            className="admin-role-user__avatar"
                          />
                        ) : (
                          <div className="admin-role-user__avatar-placeholder">
                            {rolAdmin.usuario?.nombre?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <strong>{rolAdmin.usuario?.nombre}</strong>
                          <span>{rolAdmin.usuario?.email}</span>
                        </div>
                      </div>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete admin-icon-btn--sm"
                        onClick={() => handleRemoveRole(rolAdmin.usuario?.id, role.id)}
                        title={t('common.delete')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-role-card__empty">
                  {t('admin.roles.card.noUsers')}
                </p>
              )}
            </div>

            <div className="admin-role-card__footer">
              <small>
                {t('admin.roles.card.assigned', { 
                  date: new Date(role.rolesAdministrativos?.[0]?.fecha_asignacion || Date.now()).toLocaleDateString() 
                })}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Asignación */}
      {showAssignModal && (
        <>
          <div className="admin-modal-overlay" onClick={() => setShowAssignModal(false)} />
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>{t('admin.roles.modal.title')}</h3>
              <button 
                className="admin-modal__close" 
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="admin-form">
              <div className="admin-form__group">
                <label className="admin-form__label">{t('admin.roles.modal.selectUser')}</label>
                <select
                  className="admin-form__select"
                  value={assignmentData.usuarioId}
                  onChange={(e) => setAssignmentData({...assignmentData, usuarioId: e.target.value})}
                  required
                >
                  <option value="">{t('admin.roles.modal.selectUserPlaceholder')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.email}) - {user.tipo_usuario}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form__group">
                <label className="admin-form__label">{t('admin.roles.modal.selectRole')}</label>
                <select
                  className="admin-form__select"
                  value={assignmentData.rolId}
                  onChange={(e) => setAssignmentData({...assignmentData, rolId: e.target.value})}
                  required
                >
                  <option value="">{t('admin.roles.modal.selectRolePlaceholder')}</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.nombre} - {role.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-alert admin-alert--warning">
                <strong>{t('admin.roles.modal.warning')}</strong>
                <p>{t('admin.roles.modal.warningText')}</p>
              </div>

              <div className="admin-form__actions">
                <button 
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {t('admin.roles.modal.assignButton')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Información sobre Permisos */}
      <div className="admin-permissions-info">
        <h3>{t('admin.roles.permissions.title')}</h3>
        <div className="admin-permissions-grid">
          <div className="admin-permission-card">
            <h4>{t('admin.roles.permissions.superAdmin.title')}</h4>
            <ul>
              <li>{t('admin.roles.permissions.superAdmin.perm1')}</li>
              <li>{t('admin.roles.permissions.superAdmin.perm2')}</li>
              <li>{t('admin.roles.permissions.superAdmin.perm3')}</li>
              <li>{t('admin.roles.permissions.superAdmin.perm4')}</li>
            </ul>
          </div>
          <div className="admin-permission-card">
            <h4>{t('admin.roles.permissions.admin.title')}</h4>
            <ul>
              <li>{t('admin.roles.permissions.admin.perm1')}</li>
              <li>{t('admin.roles.permissions.admin.perm2')}</li>
              <li>{t('admin.roles.permissions.admin.perm3')}</li>
              <li>{t('admin.roles.permissions.admin.perm4')}</li>
            </ul>
          </div>
          <div className="admin-permission-card">
            <h4>{t('admin.roles.permissions.verifier.title')}</h4>
            <ul>
              <li>{t('admin.roles.permissions.verifier.perm1')}</li>
              <li>{t('admin.roles.permissions.verifier.perm2')}</li>
              <li>{t('admin.roles.permissions.verifier.perm3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesManager;