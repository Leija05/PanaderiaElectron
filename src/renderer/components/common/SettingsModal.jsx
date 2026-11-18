import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ToggleSwitch } from './ToggleSwitch';
import { useSettings, DEFAULT_GLOBAL_SETTINGS, DEFAULT_DEV_SETTINGS } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { soundFX } from '../../utils/audio';
import {
  UserIcon,
  PosIcon,
  CodeIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  LockIcon,
  AlertIcon,
  SoundIcon,
  DatabaseIcon,
  RefreshIcon,
  DownloadIcon
} from './Icons';

export const SettingsModal = ({
  isOpen,
  onClose,
  onCheckUpdates,
  onSimulateUpdate,
  updateStatus
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const {
    userSettings,
    globalSettings,
    devSettings,
    updateUserSettings,
    updateGlobalSettings,
    updateDevSettings,
    resetUserSettings,
    resetAllSettings,
    exportSettingsJSON,
    importSettingsJSON
  } = useSettings();

  const role = user?.Rol || 'Empleado';
  const isGerente = role === 'Gerente' || role === 'Programador' || role === 'Administrador';

  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil' | 'tienda' | 'remoto'

  // Entorno de desarrollo vs empaquetado
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    if (isOpen && window.api && typeof window.api.getAppInfo === 'function') {
      window.api.getAppInfo().then((info) => {
        if (info && typeof info.isDev === 'boolean') {
          setIsDev(info.isDev);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Form states locales para Tienda
  const [storeForm, setStoreForm] = useState({ ...globalSettings });

  // Estado para importar JSON
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImportBox, setShowJsonImportBox] = useState(false);

  // Estado para arranque automático en Windows (Exclusivo Gerente / Admin)
  const [autostartActive, setAutostartActive] = useState(false);
  const [loadingAutostart, setLoadingAutostart] = useState(false);

  useEffect(() => {
    if (isOpen && window.api && window.api.getAutostartStatus) {
      window.api.getAutostartStatus()
        .then((status) => setAutostartActive(Boolean(status)))
        .catch(() => {});
    }
  }, [isOpen]);

  // Soporte Remoto & Enlace al Hub Central
  const [remoteStatus, setRemoteStatus] = useState(null);
  const [remoteBranchName, setRemoteBranchName] = useState('');
  const [remoteRelayUrl, setRemoteRelayUrl] = useState('');
  const [remoteEnabled, setRemoteEnabled] = useState(true);
  const [remoteSessionPin, setRemoteSessionPin] = useState('');
  const [savingRemote, setSavingRemote] = useState(false);

  useEffect(() => {
    if (isOpen && window.api && typeof window.api.getRemoteSupportStatus === 'function') {
      window.api.getRemoteSupportStatus().then((info) => {
        if (info) {
          setRemoteStatus(info);
          setRemoteBranchName(info.branchName || '');
          setRemoteRelayUrl(info.relayUrl || '');
          setRemoteEnabled(Boolean(info.enabled));
          setRemoteSessionPin(info.sessionPin || '');
        }
      }).catch(() => {});
    }
  }, [isOpen, activeTab]);

  const handleSaveRemoteConfig = async (e) => {
    if (e) e.preventDefault();
    if (!window.api || typeof window.api.updateRemoteSupportConfig !== 'function') return;
    setSavingRemote(true);
    try {
      const updated = await window.api.updateRemoteSupportConfig({
        branchName: remoteBranchName.trim() || 'Panadería Dulce Horno - Sucursal',
        relayUrl: remoteRelayUrl.trim() || 'ws://127.0.0.1:4800',
        enabled: remoteEnabled
      });
      setRemoteStatus(updated);
      showToast('Parámetros de soporte remoto actualizados exitosamente', 'success');
    } catch (err) {
      showToast('Error guardando configuración remota: ' + err.message, 'error');
    } finally {
      setSavingRemote(false);
    }
  };

  const handleRegeneratePin = async () => {
    if (!window.api || typeof window.api.regenerateSessionPin !== 'function') return;
    try {
      const newPin = await window.api.regenerateSessionPin();
      setRemoteSessionPin(newPin);
      showToast(`Nuevo PIN de soporte generado: ${newPin}`, 'success');
    } catch (err) {
      showToast('Error generando PIN: ' + err.message, 'error');
    }
  };

  const handleCopyPin = () => {
    if (!remoteSessionPin) return;
    navigator.clipboard.writeText(remoteSessionPin);
    showToast(`PIN "${remoteSessionPin}" copiado. Proporciónalo a tu técnico para soporte.`, 'success');
  };

  const handleToggleAutostart = async (enable) => {
    if (!isGerente) {
      showToast('Acceso Restringido: Solo el Administrador o Gerente puede configurar el arranque de Windows.', 'warning');
      return;
    }
    try {
      setLoadingAutostart(true);
      const res = await window.api.setAutostart(enable);
      if (res && res.success) {
        setAutostartActive(res.enabled);
        showToast(
          res.enabled
            ? 'Arranque automático activado: Dulce Horno y MySQL iniciarán al encender la computadora'
            : 'Arranque automático desactivado',
          'success'
        );
      } else {
        showToast('No se pudo configurar el arranque automático: ' + (res?.error || 'Desconocido'), 'error');
      }
    } catch (err) {
      showToast('Error al modificar arranque de Windows: ' + err.message, 'error');
    } finally {
      setLoadingAutostart(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveStore = (e) => {
    e.preventDefault();
    try {
      updateGlobalSettings({
        nombrePanaderia: storeForm.nombrePanaderia.trim(),
        contactoTicket: storeForm.contactoTicket.trim(),
        rfcTienda: (storeForm.rfcTienda || '').trim().toUpperCase(),
        pieTicket: storeForm.pieTicket.trim(),
        ivaPorcentaje: Number(storeForm.ivaPorcentaje) || 16,
        pesoBolilloRefKg: Number(storeForm.pesoBolilloRefKg) || 0.065,
        stockMinimoAlerta: Number(storeForm.stockMinimoAlerta) || 5,
        limiteEfectivoCaja: Number(storeForm.limiteEfectivoCaja) || 3500,
        descuentoPanAyer: Number(storeForm.descuentoPanAyer) || 50,
        horaFelizPan: storeForm.horaFelizPan || '20:00',
        autocobroHabilitado: Boolean(storeForm.autocobroHabilitado),
        requiereAuthGerenteCorte: Boolean(storeForm.requiereAuthGerenteCorte),
        permitirDevolucionSinTicket: Boolean(storeForm.permitirDevolucionSinTicket)
      });
      showToast('Parámetros de tienda guardados con éxito', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportSettingsJSON());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `config_dulcehorno_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Configuración exportada a JSON', 'success');
    } catch (err) {
      showToast('Error al exportar configuración: ' + err.message, 'error');
    }
  };

  const handleImportJSONSubmit = () => {
    try {
      if (!jsonInput.trim()) {
        showToast('Pega un contenido JSON válido antes de importar', 'warning');
        return;
      }
      importSettingsJSON(jsonInput);
      setStoreForm({ ...globalSettings });
      setDevForm({ ...devSettings });
      setShowJsonImportBox(false);
      setJsonInput('');
      showToast('Configuración importada y aplicada exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes y Configuración del Sistema"
      subtitle={`Perfil activo: ${user?.NombreCompleto || user?.NombreUsuario} • Nivel: ${role}`}
      maxWidth="800px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {/* Pestañas de configuración según jerarquía */}
      <div className="tabs-nav-bar mb-3">
        <button
          className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          <UserIcon style={{ width: 16, height: 16 }} />
          <span>Mi Perfil</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'tienda' ? 'active' : ''}`}
          onClick={() => setActiveTab('tienda')}
        >
          <PosIcon style={{ width: 16, height: 16 }} />
          <span>Parámetros de Tienda</span>
          <span className={`tab-pill-badge ${isGerente ? 'badge-gerente' : 'badge-readonly'}`}>
            {isGerente ? 'Gerencia' : 'Consulta'}
          </span>
        </button>

        {isGerente && (
          <button
            className={`tab-btn ${activeTab === 'remoto' ? 'active' : ''}`}
            onClick={() => setActiveTab('remoto')}
          >
            <span>Soporte Remoto</span>
            <span className="tab-pill-badge badge-gerente">Asistencia</span>
          </button>
        )}
      </div>

      {/* PESTAÑA 1: MI PERFIL (TODOS LOS ROLES) */}
      {activeTab === 'perfil' && (
        <div className="settings-panel animate-fade-in">
          {/* Sección 1: Apariencia y Ergonomía */}
          <div className="settings-section-card mb-3">
            <h4 className="font-semibold text-primary mb-2">Apariencia y Ergonomía Personal</h4>
            
            <div className="settings-row-item">
              <div>
                <strong>Tema Visual</strong>
                <p className="text-secondary text-xs">Elige entre la paleta artesanal cálida o modo cacao nocturno.</p>
              </div>
              <button className="btn btn-sm btn-outline" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <>
                    <SunIcon style={{ width: 14, height: 14 }} /> <span>Cambiar a Modo Claro</span>
                  </>
                ) : (
                  <>
                    <MoonIcon style={{ width: 14, height: 14 }} /> <span>Cambiar a Modo Oscuro</span>
                  </>
                )}
              </button>
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Densidad Visual en Pantalla</strong>
                <p className="text-secondary text-xs">Normal para pantallas estándar; Compacto para vitrinas de alto volumen.</p>
              </div>
              <select
                className="form-control"
                style={{ width: '150px' }}
                value={userSettings.density}
                onChange={(e) => updateUserSettings({ density: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="compact">Compacto</option>
              </select>
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Tamaño de Texto / Accesibilidad</strong>
                <p className="text-secondary text-xs">Ajusta el tamaño tipográfico para mayor legibilidad en terminales táctiles.</p>
              </div>
              <select
                className="form-control"
                style={{ width: '150px' }}
                value={userSettings.fontSize || 'normal'}
                onChange={(e) => updateUserSettings({ fontSize: e.target.value })}
              >
                <option value="small">Compacto (13px)</option>
                <option value="normal">Estándar (15px)</option>
                <option value="large">Grande / Táctil (17px)</option>
              </select>
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Animaciones y Transiciones Suaves</strong>
                <p className="text-secondary text-xs">Desactívalas si trabajas en terminales con recursos de hardware limitados.</p>
              </div>
              <ToggleSwitch
                checked={userSettings.animationsEnabled !== false}
                onChange={(e) => updateUserSettings({ animationsEnabled: e.target.checked })}
              />
            </div>
          </div>

          {/* Sección 2: Comportamiento en Caja y Punto de Venta */}
          <div className="settings-section-card mb-3">
            <div className="settings-section-header">
              <PosIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
              <h4 className="settings-section-title">Comportamiento en Caja y Punto de Venta</h4>
            </div>
            
            <div className="settings-row-item">
              <div>
                <strong>Categoría inicial al abrir Caja</strong>
                <p className="text-secondary text-xs">Filtro que se seleccionará automáticamente al ingresar.</p>
              </div>
              <select
                className="form-control"
                style={{ width: '170px' }}
                value={userSettings.defaultPOSCategory}
                onChange={(e) => updateUserSettings({ defaultPOSCategory: e.target.value })}
              >
                <option value="todos">Todos los Panes</option>
                <option value="Pan Dulce">Pan Dulce</option>
                <option value="Blanco & Bolillos">Blanco &amp; Bolillos</option>
                <option value="Repostería">Repostería</option>
              </select>
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Confirmar antes de vaciar carrito</strong>
                <p className="text-secondary text-xs">Previene vaciados accidentales de tickets largos.</p>
              </div>
              <ToggleSwitch
                checked={userSettings.confirmClearCart}
                onChange={(e) => updateUserSettings({ confirmClearCart: e.target.checked })}
              />
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Mostrar barra de atajos rápidos</strong>
                <p className="text-secondary text-xs">Muestra recordatorios de teclas (F2 para cobrar, F4 para báscula, Ctrl+F).</p>
              </div>
              <ToggleSwitch
                checked={userSettings.showShortcuts}
                onChange={(e) => updateUserSettings({ showShortcuts: e.target.checked })}
              />
            </div>

            {/* Efectos de Sonido */}
            <div className="settings-row-item mt-3">
              <div>
                <strong>Efectos Auditivos Panaderos</strong>
                <p className="text-secondary text-xs">Emite un tono suave al agregar piezas y acorde al finalizar venta.</p>
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => soundFX.playBeep()}
                    title="Probar sonido de escaneo / agregar"
                  >
                    <SoundIcon style={{ width: 14, height: 14 }} /> <span>Probar Beep</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => soundFX.playSuccess()}
                    title="Probar sonido de cobro finalizado"
                  >
                    <span>Probar Cobro</span>
                  </button>
                </div>
              </div>
              <ToggleSwitch
                checked={userSettings.soundEffects !== false}
                onChange={(e) => updateUserSettings({ soundEffects: e.target.checked })}
              />
            </div>

            {/* Limpieza automática de búsqueda */}
            <div className="settings-row-item mt-3">
              <div>
                <strong>Limpiar búsqueda al agregar pan</strong>
                <p className="text-secondary text-xs">Restaura el catálogo completo de inmediato al seleccionar una pieza.</p>
              </div>
              <ToggleSwitch
                checked={Boolean(userSettings.autoClearSearch)}
                onChange={(e) => updateUserSettings({ autoClearSearch: e.target.checked })}
              />
            </div>

            {/* Impresión automática de ticket */}
            <div className="settings-row-item mt-3">
              <div>
                <strong>Disparar impresión automática al cobrar</strong>
                <p className="text-secondary text-xs">Abre directamente el cuadro de impresión térmica al registrar la venta.</p>
              </div>
              <ToggleSwitch
                checked={Boolean(userSettings.autoPrintReceipt)}
                onChange={(e) => updateUserSettings({ autoPrintReceipt: e.target.checked })}
              />
            </div>
          </div>

          <div className="text-right">
            <button
              className="btn btn-sm btn-outline btn-danger-outline"
              onClick={() => {
                resetUserSettings();
                showToast('Preferencias de perfil restablecidas', 'info');
              }}
            >
              Restablecer mis preferencias personales
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PARÁMETROS DE TIENDA (GERENTE) */}
      {activeTab === 'tienda' && (
        <div className="settings-panel animate-fade-in">
          {!isGerente ? (
            <div className="access-level-banner access-warning mb-3">
              <LockIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <strong>Nivel de Acceso: Modo Consulta (Solo Lectura)</strong>
                <p className="text-xs mt-0.5">
                  Como empleado puedes revisar los parámetros de operación, membretes y límites. Para modificarlos se requiere la cuenta del Gerente o Administrador.
                </p>
              </div>
            </div>
          ) : (
            <div className="access-level-banner access-success mb-3">
              <CheckIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <strong>Modo Gerencia Habilitado</strong>
                <p className="text-xs mt-0.5">
                  Tienes autorización completa para ajustar los parámetros comerciales, membretes de tickets, tasas de IVA y políticas de negocio.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveStore}>
            {/* Tarjeta 1: Identidad del Ticket */}
            <div className="settings-section-card mb-3">
              <div className="settings-section-header">
                <PosIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <h4 className="settings-section-title">Membrete e Identidad del Ticket Térmico</h4>
              </div>
              
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Nombre del Establecimiento:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={storeForm.nombrePanaderia}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, nombrePanaderia: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">RFC / Identificador Fiscal:</label>
                  <input
                    type="text"
                    className="form-control font-mono"
                    placeholder="DHO-260101-AAA"
                    value={storeForm.rfcTienda || ''}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, rfcTienda: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Datos de Contacto y Dirección:</label>
                <input
                  type="text"
                  className="form-control"
                  value={storeForm.contactoTicket}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, contactoTicket: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mensaje al Pie del Ticket:</label>
                <input
                  type="text"
                  className="form-control"
                  value={storeForm.pieTicket}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, pieTicket: e.target.value })}
                />
              </div>
            </div>

            {/* Tarjeta 2: Parámetros de Cálculo e Impuestos */}
            <div className="settings-section-card mb-3">
              <div className="settings-section-header">
                <DatabaseIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <h4 className="settings-section-title">Parámetros de Cálculo, Báscula e Impuestos</h4>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Tasa de IVA (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className="form-control"
                    value={storeForm.ivaPorcentaje}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, ivaPorcentaje: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peso Bolillo Ref (Kg):</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0.02"
                    max="0.5"
                    className="form-control"
                    value={storeForm.pesoBolilloRefKg}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, pesoBolilloRefKg: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta Stock Mínimo:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-control"
                    value={storeForm.stockMinimoAlerta}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, stockMinimoAlerta: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group mt-2">
                <label className="form-label">Límite Máximo de Efectivo en Caja antes de Retiro ($):</label>
                <input
                  type="number"
                  step="100"
                  min="500"
                  className="form-control"
                  placeholder="3500"
                  value={storeForm.limiteEfectivoCaja || 3500}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, limiteEfectivoCaja: e.target.value })}
                />
                <small className="text-secondary text-xs">Alerta de seguridad al cajero para depositar exceso de efectivo en bóveda.</small>
              </div>
            </div>

            {/* Tarjeta 3: Políticas Comerciales y Pan Rezago */}
            <div className="settings-section-card mb-3">
              <div className="settings-section-header">
                <AlertIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <h4 className="settings-section-title">Políticas Comerciales y Pan Rezago</h4>
              </div>
              
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Descuento Pan del Día Anterior (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    className="form-control"
                    value={storeForm.descuentoPanAyer || 50}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, descuentoPanAyer: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hora Inicio "Hora Feliz" de Pan:</label>
                  <input
                    type="time"
                    className="form-control"
                    value={storeForm.horaFelizPan || '20:00'}
                    disabled={!isGerente}
                    onChange={(e) => setStoreForm({ ...storeForm, horaFelizPan: e.target.value })}
                  />
                </div>
              </div>

              <div className="settings-row-item mt-2">
                <div>
                  <strong>Permitir Devoluciones sin Ticket Físico</strong>
                  <p className="text-secondary text-xs">Habilita reintegros en caja con autorización del cajero sin exigir folio previo.</p>
                </div>
                <ToggleSwitch
                  checked={Boolean(storeForm.permitirDevolucionSinTicket)}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, permitirDevolucionSinTicket: e.target.checked })}
                />
              </div>
            </div>

            {/* Tarjeta 4: Canales y Seguridad Operativa */}
            <div className="settings-section-card mb-3">
              <div className="settings-section-header">
                <LockIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <h4 className="settings-section-title">Canales y Seguridad Operativa</h4>
              </div>
              
              <div className="settings-row-item">
                <div>
                  <strong>Habilitar Módulo de Autocobro a Clientes</strong>
                  <p className="text-secondary text-xs">Permite a los clientes usar terminales de autoservicio para sus órdenes.</p>
                </div>
                <ToggleSwitch
                  checked={Boolean(storeForm.autocobroHabilitado)}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, autocobroHabilitado: e.target.checked })}
                />
              </div>

              <div className="settings-row-item mt-3">
                <div>
                  <strong>Requerir Autorización de Gerente para Cortes</strong>
                  <p className="text-secondary text-xs">Exige credenciales de gerente antes de emitir y cerrar el arqueo de caja.</p>
                </div>
                <ToggleSwitch
                  checked={Boolean(storeForm.requiereAuthGerenteCorte)}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, requiereAuthGerenteCorte: e.target.checked })}
                />
              </div>
            </div>

            {/* Tarjeta 5: Arranque y Automatización de la Terminal (Windows) */}
            <div className="settings-section-card mb-3">
              <div className="settings-section-header">
                <RefreshIcon style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                <h4 className="settings-section-title">Arranque y Automatización de la Terminal (Windows)</h4>
                <span className={`tab-pill-badge ${isGerente ? 'badge-gerente' : 'badge-readonly'}`} style={{ marginLeft: 'auto', fontSize: '10px' }}>
                  {isGerente ? 'Gerencia / Admin' : 'Solo Lectura'}
                </span>
              </div>

              <div className="settings-row-item">
                <div>
                  <strong>Iniciar Dulce Horno y MySQL automáticamente al encender la PC</strong>
                  <p className="text-secondary text-xs">
                    Inicia el Punto de Venta en pantalla completa y asegura silenciosamente que MySQL de XAMPP esté listo al prender la computadora.
                  </p>
                  {!isGerente && (
                    <small className="text-warning text-xs font-semibold" style={{ display: 'block', marginTop: '4px' }}>
                      <LockIcon style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '4px' }} />
                      Configuración reservada exclusivamente para el Administrador o Gerente.
                    </small>
                  )}
                </div>
                <ToggleSwitch
                  checked={autostartActive}
                  disabled={!isGerente || loadingAutostart}
                  onChange={(e) => handleToggleAutostart(e.target.checked)}
                />
              </div>
            </div>

            {/* Sección: Actualizaciones del Software */}
            <div className="settings-section-card mb-3">
              <h4 className="font-semibold text-primary mb-2">Actualizaciones del Software</h4>
              <div className="settings-row-item">
                <div>
                  <strong>Buscar Nueva Versión</strong>
                  <p className="text-secondary text-xs">
                    Verifica automáticamente en GitHub Releases si hay una versión más reciente de Dulce Horno.
                  </p>
                  <small className="text-muted text-xs" style={{ display: 'block', marginTop: '2px' }}>
                    Versión actual del sistema: <strong>v1.1.0</strong>
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isDev && onSimulateUpdate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        onClose();
                        onSimulateUpdate();
                      }}
                      title="Ver en vivo cómo busca, descarga con barra de porcentaje y prepara la instalación"
                    >
                      🧪 Simular Actualización (Demo)
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      onClose();
                      if (onCheckUpdates) onCheckUpdates();
                    }}
                  >
                    <RefreshIcon style={{ width: 14, height: 14, marginRight: 5 }} />
                    Comprobar Ahora
                  </button>
                </div>
              </div>
            </div>

            {isGerente && (
              <div className="text-right">
                <button type="submit" className="btn btn-primary">
                  <CheckIcon style={{ width: 16, height: 16 }} />
                  <span>Guardar Parámetros de Tienda</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* PESTAÑA: SOPORTE REMOTO & ASISTENCIA AL CLIENTE */}
      {activeTab === 'remoto' && isGerente && (
        <div className="settings-panel animate-fade-in">
          {/* Tarjeta 1: Estado del Túnel de Soporte */}
          <div className="settings-section-card mb-3">
            <h4 className="font-semibold text-primary mb-2">Estado del Enlace de Soporte Técnico</h4>
            <p className="text-secondary text-xs mb-3">
              Permite que el equipo de desarrollo y soporte de DulceHorno se conecte remotamente a esta computadora para
              diagnosticar fallas, optimizar la base de datos o recuperar cuentas de administrador.
            </p>

            <div className="settings-row-item">
              <div>
                <strong>Conexión con Broker DulceHorno</strong>
                <div className="text-secondary text-xs">
                  {remoteStatus?.connected
                    ? 'Enlace activo y seguro. Esta caja es visible en el Centro de Mando.'
                    : 'Desconectado del servidor de soporte (reintentando en segundo plano).'}
                </div>
              </div>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: remoteStatus?.connected ? 'rgba(46,125,50,0.15)' : 'rgba(211,47,47,0.15)',
                  color: remoteStatus?.connected ? '#2e7d32' : '#d32f2f'
                }}
              >
                {remoteStatus?.connected ? '● En Línea' : '○ Desconectado'}
              </span>
            </div>

            <div className="settings-row-item">
              <div>
                <strong>Código / PIN de Asistencia en Vivo</strong>
                <div className="text-secondary text-xs">
                  Proporciona este código a tu técnico cuando solicites asistencia por teléfono o WhatsApp.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span
                  className="font-mono font-bold"
                  style={{
                    fontSize: '1.15rem',
                    color: 'var(--color-primary)',
                    background: 'rgba(0,0,0,0.05)',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}
                >
                  {remoteSessionPin || 'DH-0000'}
                </span>
                <button type="button" className="btn btn-xs btn-outline" onClick={handleCopyPin} title="Copiar al portapapeles">
                  Copiar PIN
                </button>
                <button type="button" className="btn btn-xs btn-outline" onClick={handleRegeneratePin} title="Generar nuevo código aleatorio">
                  ↻ Nuevo PIN
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Identificación de la Sucursal */}
          <div className="settings-section-card mb-3">
            <h4 className="font-semibold text-primary mb-2">Identificación de la Sucursal</h4>
            <form onSubmit={handleSaveRemoteConfig}>
              <div className="form-group mb-3">
                <label className="form-label text-xs">Nombre Comercial de esta Sucursal / Panadería:</label>
                <input
                  type="text"
                  className="form-control"
                  value={remoteBranchName}
                  onChange={(e) => setRemoteBranchName(e.target.value)}
                  placeholder="Ej. Panadería Dulce Horno - Sucursal Centro"
                />
                <small className="text-muted text-xs">
                  Este es el nombre con el que el equipo de soporte técnico identificará tu caja en su panel de asistencia.
                </small>
              </div>

              <div className="form-group mb-3">
                <label className="form-label text-xs">Servidor Central / Cloud Relay / Túnel:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                    value={remoteRelayUrl}
                    onChange={(e) => setRemoteRelayUrl(e.target.value)}
                    placeholder="ws://127.0.0.1:4800 o https://tu-tunel.trycloudflare.com"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => setRemoteRelayUrl('ws://127.0.0.1:4800')}
                    title="Restablecer a Localhost"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Localhost
                  </button>
                </div>
                <small className="text-muted text-xs">
                  Pega aquí la URL de Cloudflare Tunnel (ej: https://visibility-ballet-surname-unity.trycloudflare.com) o la IP de tu servidor central.
                </small>
              </div>

              <div className="settings-row-item mb-3">
                <div>
                  <strong>Habilitar Soporte y Diagnóstico Remoto</strong>
                  <div className="text-secondary text-xs">
                    Si desactivas esta opción, el sistema no aceptará conexiones remotas de mantenimiento.
                  </div>
                </div>
                <ToggleSwitch
                  id="toggle-remote-enabled"
                  checked={remoteEnabled}
                  onChange={setRemoteEnabled}
                />
              </div>

              <div className="text-right">
                <button type="submit" className="btn btn-primary" disabled={savingRemote}>
                  <CheckIcon style={{ width: 14, height: 14 }} />
                  <span>{savingRemote ? 'Guardando...' : 'Guardar Parámetros de Sucursal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
};
