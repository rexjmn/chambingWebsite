import { useApp } from '../context/AppContext';

export const useNotification = () => {
  const { addNotification, removeNotification, notifications } = useApp();

  const showSuccess = (message, options = {}) => {
    addNotification({
      type: 'success',
      message,
      ...options,
    });
  };

  const showError = (message, options = {}) => {
    addNotification({
      type: 'error',
      message,
      ...options,
    });
  };

  const showWarning = (message, options = {}) => {
    addNotification({
      type: 'warning',
      message,
      ...options,
    });
  };

  const showInfo = (message, options = {}) => {
    addNotification({
      type: 'info',
      message,
      ...options,
    });
  };

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
};