import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckIcon, AlertIcon, BreadIcon, CloseIcon } from '../components/common/Icons';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="app-toast-container">
        {toasts.map((toast) => {
          const iconMap = {
            success: <CheckIcon />,
            error: <AlertIcon />,
            warning: <AlertIcon />,
            info: <BreadIcon />
          };

          return (
            <div key={toast.id} className={`toast toast-${toast.type} animate-slide-in`}>
              <div className="toast-icon">{iconMap[toast.type] || iconMap.info}</div>
              <div className="toast-message">{toast.message}</div>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                <CloseIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

