import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import CategoriesManager from '../components/admin/CategoriesManager';
import DocumentsVerifier from '../components/admin/DocumentsVerifier';
import ContractsManager from '../components/admin/ContractsManager';
import UsersManager from '../components/admin/UsersManager';
import RolesManager from '../components/admin/RolesManager';
import AdminStats from '../components/admin/AdminStats';
import '../styles/admin-dashboard.scss';

// ─── SVG Icon components (Heroicons style, 1.5px stroke) ───────────────────

const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const IconDocument = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// ─── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP = {
  chart: IconChart,
  tag: IconTag,
  document: IconDocument,
  contract: IconContract,
  users: IconUsers,
  key: IconKey,
};

// ─── Component ──────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('stats');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userRoles = user?.roles || [];
  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = userRoles.includes('admin') || isSuperAdmin;

  useEffect(() => {
    if (!isAdmin) window.location.href = '/dashboard';
  }, [isAdmin]);

  const tabs = [
    { id: 'stats',     name: 'Estadísticas', icon: 'chart',    roles: ['admin', 'super_admin'] },
    { id: 'categories',name: 'Categorías',   icon: 'tag',      roles: ['admin', 'super_admin'] },
    { id: 'documents', name: 'Documentos',   icon: 'document', roles: ['admin', 'super_admin'] },
    { id: 'contracts', name: 'Contratos',    icon: 'contract', roles: ['admin', 'super_admin'] },
    { id: 'users',     name: 'Usuarios',     icon: 'users',    roles: ['admin', 'super_admin'] },
    { id: 'roles',     name: 'Roles',        icon: 'key',      roles: ['super_admin'] },
  ];

  const visibleTabs = tabs.filter(tab =>
    tab.roles.some(role => userRoles.includes(role))
  );

  const activeTabData = visibleTabs.find(t => t.id === activeTab) || visibleTabs[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':      return <AdminStats isSuperAdmin={isSuperAdmin} />;
      case 'categories': return <CategoriesManager />;
      case 'documents':  return <DocumentsVerifier />;
      case 'contracts':  return <ContractsManager />;
      case 'users':      return <UsersManager isSuperAdmin={isSuperAdmin} />;
      case 'roles':      return isSuperAdmin ? <RolesManager /> : null;
      default:           return <AdminStats isSuperAdmin={isSuperAdmin} />;
    }
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-layout">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="admin-layout__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={[
        'admin-layout__sidebar',
        collapsed  ? 'admin-layout__sidebar--collapsed'    : '',
        mobileOpen ? 'admin-layout__sidebar--mobile-open'  : '',
      ].filter(Boolean).join(' ')}>

        {/* Brand */}
        <div className="admin-layout__brand">
          <div className="admin-layout__brand-icon">
            <IconShield />
          </div>
          {!collapsed && (
            <div className="admin-layout__brand-text">
              <span className="admin-layout__brand-name">Chambing</span>
              <span className="admin-layout__brand-sub">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          )}
          <button
            className="admin-layout__sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <IconX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-layout__nav">
          <p className="admin-layout__nav-section">
            {!collapsed && 'Panel'}
          </p>
          {visibleTabs.map(tab => {
            const Icon = ICON_MAP[tab.icon];
            return (
              <button
                key={tab.id}
                className={`admin-layout__nav-item ${activeTab === tab.id ? 'admin-layout__nav-item--active' : ''}`}
                onClick={() => handleNavClick(tab.id)}
                title={collapsed ? tab.name : undefined}
              >
                <span className="admin-layout__nav-icon"><Icon /></span>
                {!collapsed && <span className="admin-layout__nav-label">{tab.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="admin-layout__sidebar-footer">
          <button
            className="admin-layout__nav-item admin-layout__nav-item--muted"
            onClick={() => window.location.href = '/dashboard'}
            title={collapsed ? 'Ir al Dashboard' : undefined}
          >
            <span className="admin-layout__nav-icon"><IconHome /></span>
            {!collapsed && <span className="admin-layout__nav-label">Ir al Dashboard</span>}
          </button>
          <button
            className="admin-layout__nav-item admin-layout__nav-item--danger"
            onClick={logout}
            title={collapsed ? 'Cerrar Sesión' : undefined}
          >
            <span className="admin-layout__nav-icon"><IconLogout /></span>
            {!collapsed && <span className="admin-layout__nav-label">Cerrar Sesión</span>}
          </button>

          {/* Desktop collapse toggle */}
          <button
            className="admin-layout__collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', display: 'flex', transition: 'transform 0.3s' }}>
              <IconChevronLeft />
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className={`admin-layout__main ${collapsed ? 'admin-layout__main--collapsed' : ''}`}>

        {/* Top Header */}
        <header className="admin-layout__header">
          <div className="admin-layout__header-left">
            {/* Mobile hamburger */}
            <button
              className="admin-layout__hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>

            {/* Breadcrumb */}
            <div className="admin-layout__breadcrumb">
              <span className="admin-layout__breadcrumb-root">Admin</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="admin-layout__breadcrumb-sep">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="admin-layout__breadcrumb-page">{activeTabData?.name}</span>
            </div>
          </div>

          <div className="admin-layout__header-right">
            {/* User button */}
            <div className="admin-layout__user-wrapper">
              <button
                className="admin-layout__user-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user?.foto_perfil ? (
                  <img src={user.foto_perfil} alt="" className="admin-layout__user-avatar" />
                ) : (
                  <div className="admin-layout__user-avatar-fallback">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <div className="admin-layout__user-meta">
                  <span className="admin-layout__user-name">{user?.nombre}</span>
                  <span className={`admin-layout__user-role ${isSuperAdmin ? 'admin-layout__user-role--super' : ''}`}>
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div className="admin-layout__user-overlay" onClick={() => setUserMenuOpen(false)} />
                  <div className="admin-layout__user-dropdown">
                    <div className="admin-layout__dropdown-header">
                      <div className="admin-layout__dropdown-avatar-row">
                        {user?.foto_perfil ? (
                          <img src={user.foto_perfil} alt="" className="admin-layout__dropdown-avatar" />
                        ) : (
                          <div className="admin-layout__dropdown-avatar-fallback">
                            {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <p className="admin-layout__dropdown-name">{user?.nombre} {user?.apellido}</p>
                          <p className="admin-layout__dropdown-email">{user?.email}</p>
                        </div>
                      </div>
                      <div className="admin-layout__dropdown-roles">
                        {userRoles.map(role => (
                          <span key={role} className={`admin-role-chip admin-role-chip--${role === 'super_admin' ? 'super' : 'admin'}`}>
                            {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="admin-layout__dropdown-item" onClick={() => { window.location.href = '/dashboard'; }}>
                      <IconHome />
                      Ir al Dashboard
                    </button>
                    <button className="admin-layout__dropdown-item admin-layout__dropdown-item--danger" onClick={logout}>
                      <IconLogout />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-layout__content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
