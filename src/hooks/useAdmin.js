import { useState, useCallback } from 'react';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verificar si el usuario es admin o super admin
  const isAdmin = user?.tipo_usuario === 'admin' || user?.tipo_usuario === 'super_admin';
  const isSuperAdmin = user?.tipo_usuario === 'super_admin';

  // Wrapper genérico para manejar operaciones async con loading y error
  const executeAdminOperation = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error en la operación';
      setError(errorMessage);
      console.error('Admin operation error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== CATEGORÍAS =====
  const getCategories = useCallback(() => {
    return executeAdminOperation(() => adminService.getCategories());
  }, [executeAdminOperation]);

  const createCategory = useCallback((categoryData) => {
    return executeAdminOperation(() => adminService.createCategory(categoryData));
  }, [executeAdminOperation]);

  const updateCategory = useCallback((id, categoryData) => {
    return executeAdminOperation(() => adminService.updateCategory(id, categoryData));
  }, [executeAdminOperation]);

  const deleteCategory = useCallback((id) => {
    return executeAdminOperation(() => adminService.deleteCategory(id));
  }, [executeAdminOperation]);

  // ===== DOCUMENTOS =====
  const getPendingDocuments = useCallback(() => {
    return executeAdminOperation(() => adminService.getPendingDocuments());
  }, [executeAdminOperation]);

  const getAllDocuments = useCallback((filters) => {
    return executeAdminOperation(() => adminService.getAllDocuments(filters));
  }, [executeAdminOperation]);

  const verifyDocument = useCallback((documentId, verificationData) => {
    return executeAdminOperation(() => 
      adminService.verifyDocument(documentId, {
        ...verificationData,
        verificadorId: user.id
      })
    );
  }, [executeAdminOperation, user]);

  // ===== CONTRATOS =====
  const getAllContracts = useCallback((filters) => {
    return executeAdminOperation(() => adminService.getAllContracts(filters));
  }, [executeAdminOperation]);

  const updateContractStatus = useCallback((contractId, newStatus, notas) => {
    return executeAdminOperation(() => 
      adminService.updateContractStatus(contractId, {
        nuevoEstado: newStatus,
        usuarioId: user.id,
        notas
      })
    );
  }, [executeAdminOperation, user]);

  const getContractHistory = useCallback((contractId) => {
    return executeAdminOperation(() => adminService.getContractHistory(contractId));
  }, [executeAdminOperation]);

  // ===== USUARIOS =====
  const getAllUsers = useCallback((filters) => {
    return executeAdminOperation(() => adminService.getAllUsers(filters));
  }, [executeAdminOperation]);

  const getUserById = useCallback((userId) => {
    return executeAdminOperation(() => adminService.getUserById(userId));
  }, [executeAdminOperation]);

  const updateUser = useCallback((userId, userData) => {
    return executeAdminOperation(() => adminService.updateUser(userId, userData));
  }, [executeAdminOperation]);

  const deleteUser = useCallback((userId) => {
    if (!isSuperAdmin) {
      return Promise.resolve({ 
        success: false, 
        error: 'Solo Super Admins pueden eliminar usuarios' 
      });
    }
    return executeAdminOperation(() => adminService.deleteUser(userId));
  }, [executeAdminOperation, isSuperAdmin]);

  const suspendUser = useCallback((userId, reason) => {
    return executeAdminOperation(() => adminService.suspendUser(userId, reason));
  }, [executeAdminOperation]);

  // ===== ROLES =====
  const getAllRoles = useCallback(() => {
    if (!isSuperAdmin) {
      return Promise.resolve({ 
        success: false, 
        error: 'Solo Super Admins pueden gestionar roles' 
      });
    }
    return executeAdminOperation(() => adminService.getAllRoles());
  }, [executeAdminOperation, isSuperAdmin]);

  const assignRole = useCallback((assignmentData) => {
    if (!isSuperAdmin) {
      return Promise.resolve({ 
        success: false, 
        error: 'Solo Super Admins pueden asignar roles' 
      });
    }
    return executeAdminOperation(() => adminService.assignRole(assignmentData));
  }, [executeAdminOperation, isSuperAdmin]);

  const removeRole = useCallback((userId, roleId) => {
    if (!isSuperAdmin) {
      return Promise.resolve({ 
        success: false, 
        error: 'Solo Super Admins pueden remover roles' 
      });
    }
    return executeAdminOperation(() => adminService.removeRole(userId, roleId));
  }, [executeAdminOperation, isSuperAdmin]);

  // ===== ESTADÍSTICAS =====
  const getAdminStats = useCallback(() => {
    return executeAdminOperation(() => adminService.getAdminStats());
  }, [executeAdminOperation]);

  const getDashboardMetrics = useCallback(() => {
    return executeAdminOperation(() => adminService.getDashboardMetrics());
  }, [executeAdminOperation]);

  return {
    // Estado
    loading,
    error,
    isAdmin,
    isSuperAdmin,

    // Categorías
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Documentos
    getPendingDocuments,
    getAllDocuments,
    verifyDocument,

    // Contratos
    getAllContracts,
    updateContractStatus,
    getContractHistory,

    // Usuarios
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    suspendUser,

    // Roles
    getAllRoles,
    assignRole,
    removeRole,

    // Estadísticas
    getAdminStats,
    getDashboardMetrics,

    // Utilidades
    clearError: () => setError(null)
  };
};

export default useAdmin;