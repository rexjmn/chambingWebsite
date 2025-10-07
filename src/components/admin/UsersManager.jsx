import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import adminService from '../../services/adminService';

const UsersManager = ({ isSuperAdmin }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showVerificationTab, setShowVerificationTab] = useState(true);

  useEffect(() => {
    loadUsers();
    loadPendingWorkers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingWorkers = async () => {
    try {
      const data = await adminService.getPendingWorkers();
      setPendingWorkers(data);
    } catch (error) {
      console.error('Error cargando trabajadores pendientes:', error);
    }
  };

  const handleVerifyWorker = async (userId, verified) => {
    try {
      await adminService.verifyWorker(userId, verified);
      alert(verified ? 'Trabajador verificado exitosamente' : 'Verificación removida');
      loadUsers();
      loadPendingWorkers();
    } catch (error) {
      console.error('Error verificando trabajador:', error);
      alert('Error al verificar trabajador');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      alert('Usuario eliminado exitosamente');
      loadUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleSuspend = async (userId) => {
    const reason = window.prompt('Motivo de la suspensión:');
    if (!reason) return;

    try {
      await adminService.suspendUser(userId, reason);
      alert('Usuario suspendido exitosamente');
      loadUsers();
    } catch (error) {
      console.error('Error suspendiendo usuario:', error);
      alert('Error al suspender usuario');
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || user.tipo_usuario === filterType;
    return matchesSearch && matchesType;
  });

  const getUserTypeIcon = (type) => {
    const icons = {
      'cliente': '👤',
      'trabajador': '🔧',
      'admin': '👨‍💼',
      'super_admin': '👑'
    };
    return icons[type] || '👤';
  };

  const getUserTypeBadge = (user) => {
    const type = user.tipo_usuario;
    const badges = {
      'cliente': { color: 'primary', text: 'Cliente' },
      'trabajador': { color: 'info', text: 'Trabajador' }
    };
    
    const badge = badges[type] || { color: 'muted', text: type };
    
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span className={`admin-badge admin-badge--${badge.color}`}>
          {getUserTypeIcon(type)} {badge.text}
        </span>
        {/* Badge de verificación para trabajadores */}
        {type === 'trabajador' && (
          <span className={`admin-badge admin-badge--${user.verificado ? 'success' : 'warning'}`}>
            {user.verificado ? '✓ Verificado' : '⏳ Pendiente'}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-section__loading">
        <div className="admin-dashboard__spinner" />
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      {/* Tabs: Todos los usuarios vs Trabajadores pendientes */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${showVerificationTab ? 'admin-tab--active' : ''}`}
          onClick={() => setShowVerificationTab(true)}
        >
          🔍 Verificación de Trabajadores
          {pendingWorkers.length > 0 && (
            <span className="admin-badge admin-badge--warning admin-badge--sm">
              {pendingWorkers.length}
            </span>
          )}
        </button>
        <button
          className={`admin-tab ${!showVerificationTab ? 'admin-tab--active' : ''}`}
          onClick={() => setShowVerificationTab(false)}
        >
          👥 Todos los Usuarios
        </button>
      </div>

      {showVerificationTab ? (
        // TAB: Verificación de Trabajadores
        <div className="verification-section">
          <div className="admin-section__header">
            <div>
              <h2>Trabajadores Pendientes de Verificación</h2>
              <p className="admin-section__subtitle">
                Revisa y verifica a los trabajadores que se han registrado
              </p>
            </div>
          </div>

          {pendingWorkers.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-state__icon">✅</div>
              <h3>No hay trabajadores pendientes</h3>
              <p>Todos los trabajadores han sido verificados</p>
            </div>
          ) : (
            <div className="workers-verification-grid">
              {pendingWorkers.map(worker => (
                <div key={worker.id} className="worker-verification-card">
                  <div className="worker-card__header">
                    {worker.foto_perfil ? (
                      <img src={worker.foto_perfil} alt="" className="worker-card__photo" />
                    ) : (
                      <div className="worker-card__photo-placeholder">
                        {worker.nombre?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="worker-card__info">
                      <h3>{worker.nombre} {worker.apellido}</h3>
                      <p className="worker-card__email">{worker.email}</p>
                      <p className="worker-card__location">
                        📍 {worker.municipio}, {worker.departamento}
                      </p>
                      <p className="worker-card__date">
                        Registrado: {new Date(worker.fecha_registro).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="worker-card__details">
                    <div className="worker-detail">
                      <span className="worker-detail__label">Teléfono:</span>
                      <span className="worker-detail__value">{worker.telefono || 'No registrado'}</span>
                    </div>
                    <div className="worker-detail">
                      <span className="worker-detail__label">DUI:</span>
                      <span className="worker-detail__value">{worker.dui || 'No registrado'}</span>
                    </div>
                    {worker.biografia && (
                      <div className="worker-detail">
                        <span className="worker-detail__label">Biografía:</span>
                        <p className="worker-detail__bio">{worker.biografia}</p>
                      </div>
                    )}
                    {worker.habilidades && worker.habilidades.length > 0 && (
                      <div className="worker-detail">
                        <span className="worker-detail__label">Habilidades:</span>
                        <div className="worker-skills">
                          {worker.habilidades.map((skill, idx) => (
                            <span key={idx} className="skill-badge">
                              {skill.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="worker-card__actions">
                    <button
                      className="admin-btn admin-btn--success"
                      onClick={() => handleVerifyWorker(worker.id, true)}
                    >
                      ✓ Verificar
                    </button>
                    <button
                      className="admin-btn admin-btn--secondary"
                      onClick={() => viewUserDetails(worker)}
                    >
                      👁️ Ver Detalles
                    </button>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => handleDelete(worker.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // TAB: Todos los Usuarios
        <>
          <div className="admin-section__header">
            <div>
              <h2>Gestión de Usuarios</h2>
              <p className="admin-section__subtitle">
                Administra todos los usuarios de la plataforma
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="admin-section__stats">
            <div className="admin-stat-badge admin-stat-badge--primary">
              <strong>{users.length}</strong>
              <span>Total Usuarios</span>
            </div>
            <div className="admin-stat-badge admin-stat-badge--info">
              <strong>{users.filter(u => u.tipo_usuario === 'trabajador').length}</strong>
              <span>Trabajadores</span>
            </div>
            <div className="admin-stat-badge admin-stat-badge--success">
              <strong>{users.filter(u => u.tipo_usuario === 'trabajador' && u.verificado).length}</strong>
              <span>Verificados</span>
            </div>
            <div className="admin-stat-badge admin-stat-badge--primary">
              <strong>{users.filter(u => u.tipo_usuario === 'cliente').length}</strong>
              <span>Clientes</span>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="admin-section__controls">
            <div className="admin-search">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search__input"
              />
            </div>

            <div className="admin-filters">
              <button 
                className={`admin-filter-chip ${filterType === 'todos' ? 'active' : ''}`}
                onClick={() => setFilterType('todos')}
              >
                Todos
              </button>
              <button 
                className={`admin-filter-chip ${filterType === 'cliente' ? 'active' : ''}`}
                onClick={() => setFilterType('cliente')}
              >
                Clientes
              </button>
              <button 
                className={`admin-filter-chip ${filterType === 'trabajador' ? 'active' : ''}`}
                onClick={() => setFilterType('trabajador')}
              >
                Trabajadores
              </button>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Ubicación</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-table__user">
                        {user.foto_perfil ? (
                          <img src={user.foto_perfil} alt="" className="admin-table__avatar" />
                        ) : (
                          <div className="admin-table__avatar-placeholder">
                            {user.nombre?.charAt(0) || '?'}
                          </div>
                        )}
                        <strong>{user.nombre} {user.apellido}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="admin-table__email">{user.email}</span>
                    </td>
                    <td>
                      {getUserTypeBadge(user)}
                    </td>
                    <td>
                      <span className="admin-table__location">
                        {user.municipio}, {user.departamento}
                      </span>
                    </td>
                    <td>
                      <span className="admin-table__date">
                        {new Date(user.fecha_registro).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-icon-btn admin-icon-btn--view"
                          onClick={() => viewUserDetails(user)}
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        {user.tipo_usuario === 'trabajador' && (
                          <button
                            className={`admin-icon-btn ${user.verificado ? 'admin-icon-btn--warning' : 'admin-icon-btn--success'}`}
                            onClick={() => handleVerifyWorker(user.id, !user.verificado)}
                            title={user.verificado ? 'Remover verificación' : 'Verificar'}
                          >
                            {user.verificado ? '✓' : '⏳'}
                          </button>
                        )}
                        <button
                          className="admin-icon-btn admin-icon-btn--warning"
                          onClick={() => handleSuspend(user.id)}
                          title="Suspender"
                        >
                          ⏸️
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--delete"
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="admin-empty-state">
                <div className="admin-empty-state__icon">👥</div>
                <h3>No se encontraron usuarios</h3>
                <p>Intenta con otros filtros de búsqueda</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Detalles */}
      {showModal && selectedUser && (
        <>
          <div className="admin-modal-overlay" onClick={closeModal} />
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>Detalles del Usuario</h3>
              <button className="admin-modal__close" onClick={closeModal}>×</button>
            </div>
            
            <div className="admin-modal__content">
              <div className="admin-user-details">
                <div className="admin-user-details__header">
                  {selectedUser.foto_perfil ? (
                    <img src={selectedUser.foto_perfil} alt="" className="admin-user-details__avatar" />
                  ) : (
                    <div className="admin-user-details__avatar-placeholder">
                      {selectedUser.nombre?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <h4>{selectedUser.nombre} {selectedUser.apellido}</h4>
                    <p>{selectedUser.email}</p>
                    {getUserTypeBadge(selectedUser)}
                  </div>
                </div>

                <div className="admin-user-details__info">
                  <div className="admin-info-row">
                    <span className="admin-info-label">Teléfono:</span>
                    <span className="admin-info-value">
                      {selectedUser.telefono || 'No registrado'}
                    </span>
                  </div>
                  <div className="admin-info-row">
                    <span className="admin-info-label">DUI:</span>
                    <span className="admin-info-value">
                      {selectedUser.dui || 'No registrado'}
                    </span>
                  </div>
                  <div className="admin-info-row">
                    <span className="admin-info-label">Ubicación:</span>
                    <span className="admin-info-value">
                      {selectedUser.municipio}, {selectedUser.departamento}
                    </span>
                  </div>
                  <div className="admin-info-row">
                    <span className="admin-info-label">Dirección:</span>
                    <span className="admin-info-value">
                      {selectedUser.direccion || 'No registrada'}
                    </span>
                  </div>
                  <div className="admin-info-row">
                    <span className="admin-info-label">Fecha de Registro:</span>
                    <span className="admin-info-value">
                      {new Date(selectedUser.fecha_registro).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedUser.biografia && (
                    <div className="admin-info-row">
                      <span className="admin-info-label">Biografía:</span>
                      <p className="admin-info-value">{selectedUser.biografia}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersManager;