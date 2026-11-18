import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BakeryLogo, UserIcon, LockIcon, CheckIcon, SunIcon, MoonIcon } from '../components/common/Icons';

export const LoginView = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Control de Licenciamiento Comercial
  const [licenseInfo, setLicenseInfo] = useState({ isActivated: true, loading: true });
  const [showManualForm, setShowManualForm] = useState(false);
  const [actForm, setActForm] = useState({
    token: '',
    nombreNegocio: 'Panadería Dulce Horno',
    nombreGerente: '',
    usuarioGerente: '',
    passwordGerente: ''
  });
  const [activating, setActivating] = useState(false);

  // Enlace y configuración con Central Hub
  const [showServerModal, setShowServerModal] = useState(false);
  const [remoteServerStatus, setRemoteServerStatus] = useState(null);
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [savingServerConfig, setSavingServerConfig] = useState(false);

  const loadRemoteServerStatus = () => {
    if (window.api && typeof window.api.getRemoteSupportStatus === 'function') {
      window.api.getRemoteSupportStatus()
        .then((st) => {
          if (st) {
            setRemoteServerStatus(st);
            if (!customServerUrl) {
              setCustomServerUrl(st.relayUrl || 'ws://127.0.0.1:4800');
            }
          }
        })
        .catch(() => {});
    }
  };

  const handleSaveServerUrl = async (e) => {
    if (e) e.preventDefault();
    if (!window.api || typeof window.api.updateRemoteSupportConfig !== 'function') return;
    setSavingServerConfig(true);
    try {
      const updated = await window.api.updateRemoteSupportConfig({
        relayUrl: customServerUrl.trim() || 'ws://127.0.0.1:4800',
        enabled: true
      });
      setRemoteServerStatus(updated);
      showToast('Enlace remoto actualizado y reconectando...', 'info');
      setShowServerModal(false);
    } catch (err) {
      showToast('Error actualizando enlace: ' + err.message, 'error');
    } finally {
      setSavingServerConfig(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (window.api && typeof window.api.getLicenseStatus === 'function') {
      window.api.getLicenseStatus()
        .then((info) => {
          if (mounted && info) {
            setLicenseInfo({ ...info, loading: false });
            if (info.gerenteUsuario && !username) {
              setUsername(info.gerenteUsuario);
            }
          }
        })
        .catch((err) => {
          console.warn('Error verificando estado de licencia:', err);
          if (mounted) setLicenseInfo({ isActivated: true, loading: false });
        });
    } else {
      setLicenseInfo({ isActivated: true, loading: false });
    }

    let unsubActivated = null;
    if (window.api && typeof window.api.onTerminalActivated === 'function') {
      unsubActivated = window.api.onTerminalActivated((data) => {
        setLicenseInfo({ isActivated: true, isSuspended: false, estado: 'Activa', loading: false, ...data });
        if (data.usuarioGerente) {
          setUsername(data.usuarioGerente);
        }
        showToast(`¡Terminal activada para ${data.nombreNegocio}! Gerente: ${data.usuarioGerente}`, 'success');
      });
    }

    let unsubRevoked = null;
    if (window.api && typeof window.api.onLicenseRevoked === 'function') {
      unsubRevoked = window.api.onLicenseRevoked((data) => {
        setLicenseInfo((prev) => ({
          ...prev,
          isActivated: false,
          isSuspended: true,
          estado: 'Suspendida',
          motivoSuspension: data.motivo
        }));
        showToast(`Terminal bloqueada: ${data.motivo || 'Licencia suspendida'}`, 'error');
      });
    }

    let unsubReactivated = null;
    if (window.api && typeof window.api.onLicenseReactivated === 'function') {
      unsubReactivated = window.api.onLicenseReactivated((data) => {
        setLicenseInfo((prev) => ({
          ...prev,
          isActivated: true,
          isSuspended: false,
          estado: 'Activa',
          motivoSuspension: null,
          ...data
        }));
        showToast('¡Terminal reactivada exitosamente! Puedes iniciar sesión normalmente.', 'success');
      });
    }

    let unsubPassChanged = null;
    if (window.api && typeof window.api.onManagerPasswordChanged === 'function') {
      unsubPassChanged = window.api.onManagerPasswordChanged((data) => {
        if (data.usuarioGerente) setUsername(data.usuarioGerente);
        showToast(`La contraseña del Gerente (${data.usuarioGerente}) fue actualizada por soporte central.`, 'info');
      });
    }

    loadRemoteServerStatus();
    const serverStatusPoll = setInterval(() => {
      if (mounted) loadRemoteServerStatus();
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(serverStatusPoll);
      if (typeof unsubActivated === 'function') unsubActivated();
      if (typeof unsubRevoked === 'function') unsubRevoked();
      if (typeof unsubReactivated === 'function') unsubReactivated();
      if (typeof unsubPassChanged === 'function') unsubPassChanged();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        showToast(`¡Bienvenido, ${res.user.NombreCompleto || res.user.NombreUsuario}!`, 'success');
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualActivation = async (e) => {
    e.preventDefault();
    if (!actForm.token || !actForm.usuarioGerente || !actForm.passwordGerente) {
      setErrorMsg('Por favor completa todos los campos requeridos para la activación.');
      return;
    }
    setActivating(true);
    setErrorMsg('');

    try {
      const res = await window.api.activateLicenseManual(actForm);
      if (res.success) {
        showToast(res.message, 'success');
        setLicenseInfo({ isActivated: true, loading: false });
        setUsername(actForm.usuarioGerente);
      } else {
        setErrorMsg(res.error || 'No se pudo activar la licencia.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error activando licencia.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="login-wrapper animate-fade-in">
      <button
        type="button"
        className="theme-toggle-btn login-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? (
          <SunIcon style={{ width: 20, height: 20 }} />
        ) : (
          <MoonIcon style={{ width: 20, height: 20 }} />
        )}
      </button>

      <div className="login-card animate-pop-in">
        <div className="login-brand">
          <div className="login-logo-circle">
            <BakeryLogo size={56} />
          </div>
          <h1 className="login-title">
            {licenseInfo.nombreNegocio || 'Dulce Horno'}
          </h1>
          <p className="login-subtitle">Punto de Venta &amp; Panadería Artesanal</p>
        </div>

        {/* ========================================================
            ESTADO 1: TERMINAL SUSPENDIDA / BLOQUEADA
            ======================================================== */}
        {!licenseInfo.loading && licenseInfo.isSuspended ? (
          <div className="suspension-notice-container" style={{ textAlign: 'center', padding: '10px 4px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '20px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⛔</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', margin: '0 0 6px 0' }}>
                Terminal Bloqueada por Administración
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                color: '#ef4444',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '3px 10px',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                Licencia Suspendida
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.06)',
                borderLeft: '3px solid #dc2626',
                borderRadius: '4px',
                padding: '10px 12px',
                textAlign: 'left',
                margin: '8px 0 12px 0'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary, #475569)' }}>
                  Motivo reportado:
                </div>
                <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                  {licenseInfo.motivoSuspension || 'Falta de pago de suscripción o licencia suspendida por soporte central.'}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.45 }}>
                Por favor comuníquese con el proveedor de software para regularizar su cuenta y reactivar el servicio.
              </p>
              <div style={{ marginTop: '12px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary, #475569)', background: 'rgba(0,0,0,0.04)', padding: '6px 8px', borderRadius: '4px' }}>
                ID Terminal: <strong>{licenseInfo.terminalId || 'dh-terminal'}</strong> | Enlace: ● Conectado a Central
              </div>
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted, #94a3b8)' }}>
              Esta pantalla se desbloqueará automáticamente en tiempo real cuando soporte confirme la reactivación.
            </p>
          </div>
        ) : !licenseInfo.loading && !licenseInfo.isActivated ? (
          <div className="activation-notice-container" style={{ textAlign: 'left' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626' }}>
                  Terminal Lista para Activación
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#16a34a',
                  fontWeight: 600,
                  background: 'rgba(22, 163, 74, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></span>
                  Enlazado con Central
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                Una vez confirmado el pago, el programador activará esta terminal automáticamente desde la consola remota.
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary, #475569)', background: 'rgba(0,0,0,0.04)', padding: '4px 8px', borderRadius: '4px' }}>
                ID Terminal: <strong>{licenseInfo.terminalId || 'dh-terminal'}</strong> {licenseInfo.sessionPin ? `| PIN: ${licenseInfo.sessionPin}` : ''}
              </div>
            </div>

            {errorMsg && <div className="login-error-alert" style={{ marginBottom: '12px' }}>{errorMsg}</div>}

            {!showManualForm ? (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ fontSize: '0.82rem', padding: '10px' }}
                  onClick={() => setShowManualForm(true)}
                >
                  Ingresar Token de Activación Manual
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '8px' }}>
                  Esperando despacho en tiempo real desde Central Hub...
                </p>
              </div>
            ) : (
              <form onSubmit={handleManualActivation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Token de Licencia:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="DH-2026-XXXX-XXXX-PRO"
                    value={actForm.token}
                    onChange={(e) => setActForm({ ...actForm, token: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Nombre de la Panadería:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Panadería La Esperanza"
                    value={actForm.nombreNegocio}
                    onChange={(e) => setActForm({ ...actForm, nombreNegocio: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Usuario Gerente:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="gerente"
                      value={actForm.usuarioGerente}
                      onChange={(e) => setActForm({ ...actForm, usuarioGerente: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Contraseña:</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={actForm.passwordGerente}
                      onChange={(e) => setActForm({ ...actForm, passwordGerente: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                    onClick={() => setShowManualForm(false)}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, fontSize: '0.8rem' }}
                    disabled={activating}
                  >
                    {activating ? 'Validando...' : 'Activar Terminal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ========================================================
             ESTADO 2: TERMINAL ACTIVADA - INICIO DE SESIÓN NORMAL
             ======================================================== */
          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            <div className="form-group">
              <label className="form-label">Usuario:</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <UserIcon style={{ width: 18, height: 18 }} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña:</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <LockIcon style={{ width: 18, height: 18 }} />
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              <span>{loading ? 'Validando...' : 'Iniciar Sesión'}</span>
              <CheckIcon style={{ width: 18, height: 18 }} />
            </button>
          </form>
        )}

        {/* Barra de estado y configuración de enlace con Central Hub */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: remoteServerStatus?.connected ? '#10b981' : '#f43f5e',
              boxShadow: remoteServerStatus?.connected ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
              display: 'inline-block'
            }}></span>
            <span style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>
              {remoteServerStatus?.connected ? 'Servidor Central Conectado' : 'Central Desconectado'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              loadRemoteServerStatus();
              setShowServerModal(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #6366f1)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              fontSize: '0.74rem'
            }}
          >
            ⚙ Configurar Enlace
          </button>
        </div>
      </div>

      {/* Modal de Configuración de Servidor Central */}
      {showServerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            color: 'var(--text-primary, #1e293b)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Conexión a Servidor Central
              </h3>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.03)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Estado de Enlace
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: remoteServerStatus?.connected ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
                  {remoteServerStatus?.connected ? '● En Línea con Central' : '○ Desconectado'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
                  ID Terminal
                </div>
                <code style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                  {remoteServerStatus?.branchId || licenseInfo.terminalId || 'dh-terminal'}
                </code>
              </div>
            </div>

            <form onSubmit={handleSaveServerUrl}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  Dirección del Broker Central / Túnel Cloudflare:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                  placeholder="https://...trycloudflare.com o ws://127.0.0.1:4800"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  required
                />
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', display: 'block', marginTop: '6px', lineHeight: 1.4 }}>
                  Pega el enlace HTTPS o WSS del túnel generado (ej. Cloudflare Tunnel) o la IP local con puerto 4800.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setCustomServerUrl('ws://127.0.0.1:4800')}
                >
                  Restablecer Localhost (127.0.0.1:4800)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setShowServerModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                  disabled={savingServerConfig}
                >
                  {savingServerConfig ? 'Guardando...' : 'Guardar y Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

