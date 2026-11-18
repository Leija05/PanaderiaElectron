import React from 'react';
import {
  BakeryLogo,
  DownloadIcon,
  RefreshIcon,
  CheckIcon,
  AlertIcon,
  CloseIcon,
  CodeIcon
} from './Icons';

export const UpdateModal = ({
  status,
  isOpen,
  onClose,
  onRetry,
  onInstall,
  onSimulate
}) => {
  if (!isOpen || !status) return null;

  const {
    status: currentStatus,
    version,
    availableVersion,
    downloadedVersion,
    progressPercent = 0,
    progressTransferred = 0,
    progressTotal = 0,
    bytesPerSecond = 0,
    message
  } = status;

  // No mostrar modal si el estado es silencioso o ya fue descartado
  if (status.dismissed) return null;

  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    const mbps = bytesPerSec / (1024 * 1024);
    if (mbps < 1) {
      return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    }
    return `${mbps.toFixed(1)} MB/s`;
  };

  const isMandatory = currentStatus === 'downloading' || currentStatus === 'pending_install';
  const showCloseBtn = !isMandatory;

  return (
    <div className="update-modal-backdrop animate-fade-in" style={{ zIndex: 99999 }}>
      <div className="update-modal-card animate-scale-up" role="dialog" aria-modal="true">
        {/* Encabezado */}
        <div className="update-modal-header">
          <div className="update-modal-brand">
            <BakeryLogo size={36} />
            <div>
              <span className="update-modal-tag">SISTEMA DULCE HORNO</span>
              <h2 className="update-modal-title">Actualización del Sistema</h2>
            </div>
          </div>
          {showCloseBtn && (
            <button
              type="button"
              className="update-modal-close"
              onClick={onClose}
              title="Cerrar ventana"
            >
              <CloseIcon style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Cuerpo dinámico según estado */}
        <div className="update-modal-body">
          {/* ESTADO 1: BUSCANDO ACTUALIZACIONES */}
          {currentStatus === 'checking' && (
            <div className="update-state-content text-center">
              <div className="update-spinner-wrapper">
                <div className="update-pulse-ring"></div>
                <div className="update-spinner-icon">
                  <RefreshIcon className="spin-animation" style={{ width: 38, height: 38, color: 'var(--color-primary)' }} />
                </div>
              </div>
              <h3 className="update-state-heading">Buscando actualizaciones...</h3>
              <p className="update-state-desc">
                Conectando con el repositorio oficial en GitHub Releases para comprobar si existe una versión más reciente.
              </p>
              <div className="update-version-pill">
                <span>Versión instalada: <strong>v{version || '1.1.0'}</strong></span>
              </div>
            </div>
          )}

          {/* ESTADO 2: NUEVA VERSIÓN DETECTADA */}
          {currentStatus === 'available' && (
            <div className="update-state-content text-center">
              <div className="update-icon-badge update-badge-info">
                <DownloadIcon style={{ width: 38, height: 38 }} />
              </div>
              <h3 className="update-state-heading">¡Nueva versión disponible!</h3>
              <div className="update-version-comparison">
                <span className="version-pill current">v{version || '1.1.0'}</span>
                <span className="version-arrow">➜</span>
                <span className="version-pill next">v{availableVersion || 'Nueva'}</span>
              </div>
              <p className="update-state-desc">
                {message || 'Se ha detectado una nueva actualización obligatoria. Iniciando la descarga automática del instalador...'}
              </p>
              <div className="update-progress-indeterminate">
                <div className="indeterminate-bar"></div>
              </div>
            </div>
          )}

          {/* ESTADO 3: DESCARGANDO ACTUALIZACIÓN */}
          {currentStatus === 'downloading' && (
            <div className="update-state-content">
              <div className="update-download-header">
                <div className="update-icon-badge update-badge-downloading">
                  <DownloadIcon className="bounce-animation" style={{ width: 32, height: 32 }} />
                </div>
                <div>
                  <h3 className="update-state-heading" style={{ margin: 0, textAlign: 'left' }}>
                    Descargando versión {availableVersion ? `v${availableVersion}` : ''}
                  </h3>
                  <span className="update-speed-indicator">
                    {formatSpeed(bytesPerSecond) ? `Velocidad: ${formatSpeed(bytesPerSecond)}` : 'Descargando paquete oficial...'}
                  </span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="update-progress-wrapper">
                <div className="update-progress-track">
                  <div
                    className="update-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  >
                    <div className="progress-shimmer"></div>
                  </div>
                </div>
                <div className="update-progress-stats">
                  <span className="progress-percent">
                    <strong>{Number(progressPercent || 0).toFixed(1)}%</strong> completado
                  </span>
                  <span className="progress-bytes">
                    {formatBytes(progressTransferred)} de {formatBytes(progressTotal || 86450000)}
                  </span>
                </div>
              </div>

              <div className="update-alert-box">
                <AlertIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>
                  Por favor mantén la aplicación abierta mientras se completa la descarga. Al finalizar se abrirá el asistente de instalación.
                </span>
              </div>
            </div>
          )}

          {/* ESTADO 4: DESCARGADO Y LISTO PARA INSTALAR */}
          {currentStatus === 'pending_install' && (
            <div className="update-state-content text-center">
              <div className="update-icon-badge update-badge-success">
                <CheckIcon style={{ width: 42, height: 42 }} />
              </div>
              <h3 className="update-state-heading" style={{ color: '#2e7d32' }}>
                ¡Actualización lista para instalar!
              </h3>
              <p className="update-state-desc">
                La versión <strong>v{downloadedVersion || availableVersion || '1.1.0'}</strong> ha sido descargada e inspeccionada con éxito.
              </p>
              <div className="update-ready-box">
                <p>
                  Haz clic en el botón inferior para cerrar el sistema e iniciar la instalación de forma desatendida.
                </p>
              </div>

              <div className="update-actions-row">
                <button
                  type="button"
                  className="btn btn-success btn-lg btn-block update-install-btn"
                  onClick={onInstall}
                >
                  <RefreshIcon style={{ width: 20, height: 20, marginRight: 8 }} />
                  Reiniciar e Instalar Ahora
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 5: SISTEMA AL DÍA */}
          {currentStatus === 'up_to_date' && (
            <div className="update-state-content text-center">
              <div className="update-icon-badge update-badge-success">
                <CheckIcon style={{ width: 42, height: 42 }} />
              </div>
              <h3 className="update-state-heading">Tu sistema está al día</h3>
              <p className="update-state-desc">
                Actualmente cuentas con la versión más reciente publicada (<strong>v{version || '1.1.0'}</strong>). No hay actualizaciones pendientes.
              </p>
              <div className="update-actions-row">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={onClose}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 6: ERROR DE CONEXIÓN */}
          {currentStatus === 'error' && (
            <div className="update-state-content text-center">
              <div className="update-icon-badge update-badge-error">
                <AlertIcon style={{ width: 40, height: 40 }} />
              </div>
              <h3 className="update-state-heading">No se pudo verificar la actualización</h3>
              <p className="update-state-desc" style={{ color: 'var(--text-muted)' }}>
                {message || 'No fue posible conectar con el servidor de GitHub Releases. Verifica tu conexión a internet.'}
              </p>
              <div className="update-actions-row" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={onRetry}
                >
                  <RefreshIcon style={{ width: 16, height: 16, marginRight: 6 }} />
                  Reintentar
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={onClose}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 7: MODO DESARROLLO */}
          {currentStatus === 'development' && (
            <div className="update-state-content text-center">
              <div className="update-icon-badge update-badge-dev">
                <CodeIcon style={{ width: 40, height: 40 }} />
              </div>
              <h3 className="update-state-heading">Modo de Desarrollo Activo</h3>
              <p className="update-state-desc">
                La aplicación está ejecutándose sin empaquetar (<code>npm start</code>). La búsqueda automática obligatoria solo aplica en el ejecutable instalado.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Puedes probar la simulación completa para ver cómo busca, cómo descarga con barra de progreso y cómo se prepara la instalación:
              </p>
              <div className="update-actions-row" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={onSimulate}
                >
                  <DownloadIcon style={{ width: 16, height: 16, marginRight: 6 }} />
                  Simular Actualización (Demo)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
