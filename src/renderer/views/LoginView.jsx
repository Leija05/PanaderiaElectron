import React, { useState } from 'react';
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

  const handleQuickDemo = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
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
          <h1 className="login-title">Dulce Horno</h1>
          <p className="login-subtitle">Punto de Venta &amp; Panadería Artesanal</p>
        </div>

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

        <div className="login-demo-bar">
          <span className="demo-label">Acceso rápido para demostración:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn"
              title="Usuario: admin | Contraseña: admin123"
              onClick={() => handleQuickDemo('admin', 'admin123')}
            >
              Gerente
            </button>
            <button
              type="button"
              className="demo-btn"
              title="Usuario: empleado1 | Contraseña: empleado123"
              onClick={() => handleQuickDemo('empleado1', 'empleado123')}
            >
              Cajero
            </button>
            <button
              type="button"
              className="demo-btn"
              title="Usuario: cliente1 | Contraseña: cliente123"
              onClick={() => handleQuickDemo('cliente1', 'cliente123')}
            >
              Cliente
            </button>
            <button
              type="button"
              className="demo-btn"
              title="Usuario: programador | Contraseña: programador123"
              onClick={() => handleQuickDemo('programador', 'programador123')}
            >
              Programador
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            O cuentas demo: <code>gerente_demo</code> / <code>empleado_demo_1</code> / <code>cliente_demo_1</code> (pass: <code>demo123</code>)
          </div>
        </div>
      </div>
    </div>
  );
};

