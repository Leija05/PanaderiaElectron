import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { SettingsModal } from './components/common/SettingsModal';

import { LoginView } from './views/LoginView';
import { POSView } from './views/POSView';
import { InventarioView } from './views/InventarioView';
import { PersonalView } from './views/PersonalView';
import { ClientesView } from './views/ClientesView';
import { ProveedoresView } from './views/ProveedoresView';
import { ReportesView } from './views/ReportesView';
import { CortesView } from './views/CortesView';
import { ProgramadorView } from './views/ProgramadorView';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('ventas');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.Rol === 'Cliente') {
        setCurrentPage('compras');
      } else if (user.Rol === 'Programador') {
        setCurrentPage('programador');
      } else {
        setCurrentPage('ventas');
      }
    }
  }, [user]);

  useEffect(() => {
    if (window.api && typeof window.api.onUpdateStatus === 'function') {
      const cleanup = window.api.onUpdateStatus((status) => {
        setUpdateStatus(status);
      });
      return cleanup;
    }
  }, []);

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'ventas':
        return <POSView isClientMode={false} />;
      case 'compras':
        return <POSView isClientMode={true} />;
      case 'inventario':
        return <InventarioView />;
      case 'personal':
        return <PersonalView />;
      case 'clientes':
        return <ClientesView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'reportes':
        return <ReportesView />;
      case 'cortes':
        return <CortesView />;
      case 'programador':
        return <ProgramadorView />;
      default:
        return <POSView isClientMode={user?.Rol === 'Cliente'} />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {updateStatus && updateStatus.status === 'downloading' && (
        <div className="updater-banner">
          <span>
            Descargando actualización obligatoria:{' '}
            <strong>{updateStatus.progressPercent?.toFixed(1)}%</strong>
          </span>
        </div>
      )}

      {updateStatus && updateStatus.status === 'pending_install' && (
        <div className="updater-banner">
          <span>Actualización {updateStatus.version} lista para instalarse.</span>
          <button
            className="btn btn-sm btn-primary ml-3"
            onClick={() => window.api.installPendingUpdate()}
          >
            Reiniciar ahora
          </button>
        </div>
      )}

      <main className="app-main-viewport">{renderCurrentView()}</main>
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

