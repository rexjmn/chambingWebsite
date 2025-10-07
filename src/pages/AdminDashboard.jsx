import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import adminService from '../services/adminService';
import CategoriesManager from '../components/admin/CategoriesManager';
import DocumentsVerifier from '../components/admin/DocumentsVerifier';
import ContractsManager from '../components/admin/ContractsManager';
import UsersManager from '../components/admin/UsersManager';
import RolesManager from '../components/admin/RolesManager';
import AdminStats from '../components/admin/AdminStats';
import '../styles/admin-dashboard.scss';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✨ NUEVO: Verificar permisos usando los roles administrativos
  // Los roles están en user.roles (array de strings como ['admin', 'super_admin'])
  const userRoles = user?.roles || [];
  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = userRoles.includes('admin') || isSuperAdmin;

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin]);

  const tabs = [
    { id: 'stats', name: 'Estadísticas', icon: '📊', roles: ['admin', 'super_admin'] },
    { id: 'categories', name: 'Categorías', icon: '🏷️', roles: ['admin', 'super_admin'] },
    { id: 'documents', name: 'Documentos', icon: '📄', roles: ['admin', 'super_admin'] },
    { id: 'contracts', name: 'Contratos', icon: '📝', roles: ['admin', 'super_admin'] },
    { id: 'users', name: 'Usuarios', icon: '👥', roles: ['admin', 'super_admin'] },
    { id: 'roles', name: 'Roles', icon: '🔑', roles: ['super_admin'] }
  ];

  // Filtrar tabs según los roles del usuario
  const visibleTabs = tabs.filter(tab => 
    tab.roles.some(role => userRoles.includes(role))
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'stats':
        return <AdminStats isSuperAdmin={isSuperAdmin} />;
      case 'categories':
        return <CategoriesManager />;
      case 'documents':
        return <DocumentsVerifier />;
      case 'contracts':
        return <ContractsManager />;
      case 'users':
        return <UsersManager isSuperAdmin={isSuperAdmin} />;
      case 'roles':
        return isSuperAdmin ? <RolesManager /> : null;
      default:
        return <AdminStats isSuperAdmin={isSuperAdmin} />;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-dashboard__header">
        <div className="admin-dashboard__header-content">
          <div className="admin-dashboard__branding">
            <h1>🛡️ Panel de Administración</h1>
            <span className="admin-dashboard__badge">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <div className="admin-dashboard__header-actions">
            <button 
              className="admin-dashboard__icon-btn"
              onClick={() => window.location.href = '/dashboard'}
              title="Volver al dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>

            <button
              className="admin-dashboard__icon-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user?.foto_perfil ? (
                <img src={user.foto_perfil} alt="" className="admin-dashboard__avatar-img" />
              ) : (
                <div className="admin-dashboard__avatar-placeholder">
                  {user?.nombre?.charAt(0) || 'A'}
                </div>
              )}
            </button>

            {menuOpen && (
              <>
                <div 
                  className="admin-dashboard__overlay"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="admin-dashboard__menu">
                  <div className="admin-dashboard__menu-header">
                    <p className="admin-dashboard__menu-name">{user?.nombre}</p>
                    <p className="admin-dashboard__menu-email">{user?.email}</p>
                    {/* Mostrar roles administrativos */}
                    <div className="admin-dashboard__menu-roles">
                      {userRoles.map(role => (
                        <span key={role} className="admin-role-badge">
                          {role === 'super_admin' ? '👑 Super Admin' : 
                           role === 'admin' ? '👨‍💼 Admin' : role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="admin-dashboard__menu-item"
                    onClick={logout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <nav className="admin-dashboard__tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-dashboard__tab ${activeTab === tab.id ? 'admin-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-dashboard__tab-icon">{tab.icon}</span>
              <span className="admin-dashboard__tab-name">{tab.name}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="admin-dashboard__content">
        {loading ? (
          <div className="admin-dashboard__loading">
            <div className="admin-dashboard__spinner" />
            <p>Cargando...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;