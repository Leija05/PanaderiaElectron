import React, { useEffect } from 'react';
import { CheckIcon, CloseIcon, AlertIcon, BreadIcon } from './Icons';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  type = 'info',
  maxWidth = '520px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeIcons = {
    success: <CheckIcon />,
    error: <CloseIcon />,
    warning: <AlertIcon />,
    info: <BreadIcon />
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className={`modal-card modal-${type} animate-pop-in`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div className={`modal-icon-badge modal-badge-${type}`}>
            {typeIcons[type] || typeIcons.info}
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

