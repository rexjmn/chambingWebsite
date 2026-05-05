import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin debe usarse dentro de AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        canManageUsers: false,
        canManageCategories: false,
        canVerifyDocuments: false,
        canManageContracts: false,
        canManageRoles: false,
        canDeleteAdmins: false,
      };
    }

    const userRoles = [
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(user?.tipo_usuario ? [user.tipo_usuario] : []),
    ].map((role) => String(role).toLowerCase());

    const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('superadmin');
    const isAdmin = isSuperAdmin || userRoles.includes('admin');

    return {
      isAdmin,
      isSuperAdmin,
      canManageUsers: isAdmin,
      canManageCategories: isAdmin,
      canVerifyDocuments: isAdmin,
      canManageContracts: isAdmin,
      canManageRoles: isSuperAdmin,
      canDeleteAdmins: isSuperAdmin,
      canCreateSuperAdmin: isSuperAdmin,
    };
  }, [user]);

  return (
    <AdminContext.Provider value={permissions}>
      {children}
    </AdminContext.Provider>
  );
};