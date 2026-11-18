import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  BakeryLogo,
  BreadIcon,
  PosIcon,
  BoxIcon,
  ChartIcon,
  UsersIcon,
  UserIcon,
  TruckIcon,
  CutIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  SettingsIcon
} from './Icons';

export const Navbar = ({ currentPage, onNavigate, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const role = user?.Rol || 'Empleado';

  // Navegación por rol
  const navItems = [];
  if (role === 'Cliente') {
    navItems.push({ id: 'compras', label: 'Catálogo de Panes', icon: <BreadIcon /> });
    navItems.push({ id: 'clientes', label: 'Mis Compras', icon: <UserIcon /> });
  } else if (role === 'Empleado') {
    navItems.push({ id: 'ventas', label: 'Caja Mostrador', icon: <PosIcon /> });
    navItems.push({ id: 'inventario', label: 'Inventario', icon: <BoxIcon /> });
    navItems.push({ id: 'reportes', label: 'Reportes', icon: <ChartIcon /> });
    navItems.push({ id: 'clientes', label: 'Clientes', icon: <UserIcon /> });
    navItems.push({ id: 'cortes', label: 'Corte de Caja', icon: <CutIcon /> });
  } else {
    // Gerente y Administración
    navItems.push({ id: 'ventas', label: 'Caja POS', icon: <PosIcon /> });
    navItems.push({ id: 'inventario', label: 'Inventario', icon: <BoxIcon /> });
    navItems.push({ id: 'reportes', label: 'Reportes', icon: <ChartIcon /> });
    navItems.push({ id: 'personal', label: 'Personal', icon: <UsersIcon /> });
    navItems.push({ id: 'clientes', label: 'Clientes', icon: <UserIcon /> });
    navItems.push({ id: 'proveedores', label: 'Proveedores', icon: <TruckIcon /> });
    navItems.push({ id: 'cortes', label: 'Cortes', icon: <CutIcon /> });
  }

  const userInitial = (user?.NombreCompleto || user?.NombreUsuario || 'U').charAt(0).toUpperCase();

  return (
    <header className="app-navbar">
      <div className="navbar-brand-section">
        <div className="navbar-brand-logo">
          <BakeryLogo size={38} />
        </div>
        <div>
          <h1 className="navbar-brand-title">Dulce Horno</h1>
          <span className={`navbar-role-pill role-${role.toLowerCase()}`}>{role}</span>
        </div>
      </div>

      <nav className="navbar-nav-links">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-btn-icon">{item.icon}</span>
              <span className="nav-btn-text">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="navbar-user-section">
        <button
          className="theme-toggle-btn"
          onClick={onOpenSettings}
          title="Configuración del Sistema por Perfil"
          aria-label="Configuración"
        >
          <SettingsIcon />
        </button>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="user-profile-badge">
          <span className="user-avatar-circle">{userInitial}</span>
          <span className="user-display-name">
            {user?.NombreCompleto || user?.NombreUsuario}
          </span>
        </div>

        <button
          className="btn-logout"
          onClick={logout}
          title="Cerrar Sesión"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

