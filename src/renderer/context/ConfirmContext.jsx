import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Modal } from '../components/common/Modal';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(({
    title = 'Confirmación Requerida',
    subtitle = '',
    message = '',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    type = 'warning',
    confirmButtonClass = 'btn-danger',
    maxWidth = '480px'
  }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfig({
        title,
        subtitle,
        message,
        confirmText,
        cancelText,
        type,
        confirmButtonClass,
        maxWidth
      });
    });
  }, []);

  const handleClose = () => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setConfig(null);
  };

  const handleConfirm = () => {
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    setConfig(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {config && (
        <Modal
          isOpen={true}
          onClose={handleClose}
          title={config.title}
          subtitle={config.subtitle}
          type={config.type}
          maxWidth={config.maxWidth}
          footer={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                autoFocus
              >
                {config.cancelText}
              </button>
              <button
                type="button"
                className={`btn ${config.confirmButtonClass || 'btn-danger'}`}
                style={
                  config.confirmButtonClass === 'btn-danger'
                    ? { background: 'var(--color-danger, #ef4444)', borderColor: '#ef4444', color: '#fff' }
                    : {}
                }
                onClick={handleConfirm}
              >
                {config.confirmText}
              </button>
            </div>
          }
        >
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.55 }}>
            {config.message}
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  }
  return context;
};
