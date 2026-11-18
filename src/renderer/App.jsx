import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { SettingsModal } from './components/common/SettingsModal';
import { UpdateModal } from './components/common/UpdateModal';

import { LoginView } from './views/LoginView';
import { POSView } from './views/POSView';
import { InventarioView } from './views/InventarioView';
import { PersonalView } from './views/PersonalView';
import { ClientesView } from './views/ClientesView';
import { ProveedoresView } from './views/ProveedoresView';
import { ReportesView } from './views/ReportesView';
import { CortesView } from './views/CortesView';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('ventas');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.Rol === 'Cliente') {
        setCurrentPage('compras');
      } else {
        setCurrentPage('ventas');
      }
    }
  }, [user]);

  // Suscripción al actualizador y consulta inicial
  useEffect(() => {
    let mounted = true;

    if (window.api && typeof window.api.getUpdateStatus === 'function') {
      window.api.getUpdateStatus()
        .then((status) => {
          if (mounted && status) {
            setUpdateStatus(status);
            // Mostrar modal si está buscando, disponible, descargando o listo para instalar
            if (['checking', 'available', 'downloading', 'pending_install'].includes(status.status)) {
              setIsUpdateModalOpen(true);
            }
          }
        })
        .catch((err) => console.warn('Error al obtener estado inicial del actualizador:', err));
    }

    if (window.api && typeof window.api.onUpdateStatus === 'function') {
      const cleanup = window.api.onUpdateStatus((status) => {
        if (mounted && status) {
          setUpdateStatus(status);
          if (['checking', 'available', 'downloading', 'pending_install'].includes(status.status)) {
            setIsUpdateModalOpen(true);
          }
        }
      });
      return () => {
        mounted = false;
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    if (updateStatus) {
      setUpdateStatus((prev) => ({ ...prev, dismissed: true }));
    }
  };

  const handleCheckUpdates = async () => {
    setIsUpdateModalOpen(true);
    setUpdateStatus((prev) => ({
      ...(prev || {}),
      status: 'checking',
      message: 'Comprobando la última versión en GitHub Releases...'
    }));
    if (window.api && typeof window.api.retryUpdateCheck === 'function') {
      try {
        const res = await window.api.retryUpdateCheck();
        if (res) setUpdateStatus(res);
      } catch (e) {
        console.error('Error al comprobar actualizaciones:', e);
      }
    }
  };

  const handleInstallUpdate = async () => {
    if (window.api && typeof window.api.installPendingUpdate === 'function') {
      await window.api.installPendingUpdate();
    }
  };

  const handleSimulateUpdate = async () => {
    setIsUpdateModalOpen(true);
    if (window.api && typeof window.api.simulateUpdateDemo === 'function') {
      await window.api.simulateUpdateDemo();
    }
  };

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
      default:
        return <POSView isClientMode={user?.Rol === 'Cliente'} />;
    }
  };

  return (
    <>
      {/* Modal global de actualización (visible tanto en Login como dentro del POS) */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        status={updateStatus}
        onClose={handleCloseUpdateModal}
        onRetry={handleCheckUpdates}
        onInstall={handleInstallUpdate}
        onSimulate={handleSimulateUpdate}
      />

      {!isAuthenticated ? (
        <LoginView onLoginSuccess={() => {}} />
      ) : (
        <div className="app-layout">
          <Navbar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onCheckUpdates={handleCheckUpdates}
            onSimulateUpdate={handleSimulateUpdate}
            updateStatus={updateStatus}
          />

          <main className="app-main-viewport">{renderCurrentView()}</main>
        </div>
      )}
    </>
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
