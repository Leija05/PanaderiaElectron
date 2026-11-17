import React, { useState } from 'react';
import { Modal } from './Modal';
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

export const SettingsModal = ({ isOpen, onClose }) => {
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
  const isGerente = role === 'Gerente' || role === 'Programador';
  const isProgramador = role === 'Programador';

  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil' | 'tienda' | 'sistema'

  // Form states locales para Tienda
  const [storeForm, setStoreForm] = useState({ ...globalSettings });
  // Form states locales para Dev
  const [devForm, setDevForm] = useState({ ...devSettings });

  // Estado para prueba de ping de base de datos
  const [dbPingStatus, setDbPingStatus] = useState(null); // { latency: number, ok: boolean, timestamp: string }
  const [isPinging, setIsPinging] = useState(false);

  // Estado para importar JSON
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImportBox, setShowJsonImportBox] = useState(false);

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

  const handleSaveDev = (e) => {
    e.preventDefault();
    try {
      updateDevSettings({
        modoDebug: Boolean(devForm.modoDebug),
        mostrarLogsIPC: Boolean(devForm.mostrarLogsIPC),
        simularModoOffline: Boolean(devForm.simularModoOffline),
        autoAbrirDevTools: Boolean(devForm.autoAbrirDevTools),
        tasaRefrescoMs: Number(devForm.tasaRefrescoMs) || 5000
      });
      showToast('Configuraciones técnicas actualizadas', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePingDatabase = async () => {
    try {
      setIsPinging(true);
      const start = performance.now();
      await window.api.getProductos();
      const end = performance.now();
      const latency = Math.round(end - start);
      setDbPingStatus({
        latency,
        ok: true,
        timestamp: new Date().toLocaleTimeString('es-MX')
      });
      showToast(`Ping a MySQL exitoso: ${latency}ms`, 'success');
    } catch (err) {
      setDbPingStatus({
        latency: 0,
        ok: false,
        error: err.message,
        timestamp: new Date().toLocaleTimeString('es-MX')
      });
      showToast('Error de comunicación con MySQL: ' + err.message, 'error');
    } finally {
      setIsPinging(false);
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
      title="Configuración del Sistema por Perfil"
      subtitle={`Usuario activo: ${user?.NombreCompleto || user?.NombreUsuario} (${role})`}
      maxWidth="720px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {/* Pestañas de configuración según jerarquía */}
      <div className="tabs-nav-bar mb-4">
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
          <span>Parámetros de Tienda {isGerente ? '' : '(Solo Lectura)'}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'sistema' ? 'active' : ''}`}
          onClick={() => setActiveTab('sistema')}
        >
          <CodeIcon style={{ width: 16, height: 16 }} />
          <span>Sistema &amp; Dev {isProgramador ? '' : '(Restringido)'}</span>
        </button>
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
              <input
                type="checkbox"
                checked={userSettings.animationsEnabled !== false}
                onChange={(e) => updateUserSettings({ animationsEnabled: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>

          {/* Sección 2: Comportamiento en Caja y Punto de Venta */}
          <div className="settings-section-card mb-3">
            <h4 className="font-semibold text-primary mb-2">Comportamiento en Caja y Punto de Venta</h4>
            
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
              <input
                type="checkbox"
                checked={userSettings.confirmClearCart}
                onChange={(e) => updateUserSettings({ confirmClearCart: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="settings-row-item mt-3">
              <div>
                <strong>Mostrar barra de atajos rápidos</strong>
                <p className="text-secondary text-xs">Muestra recordatorios de teclas (F2 para cobrar, F4 para báscula, Ctrl+F).</p>
              </div>
              <input
                type="checkbox"
                checked={userSettings.showShortcuts}
                onChange={(e) => updateUserSettings({ showShortcuts: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
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
              <input
                type="checkbox"
                checked={userSettings.soundEffects !== false}
                onChange={(e) => updateUserSettings({ soundEffects: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            {/* Limpieza automática de búsqueda */}
            <div className="settings-row-item mt-3">
              <div>
                <strong>Limpiar búsqueda al agregar pan</strong>
                <p className="text-secondary text-xs">Restaura el catálogo completo de inmediato al seleccionar una pieza.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(userSettings.autoClearSearch)}
                onChange={(e) => updateUserSettings({ autoClearSearch: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
              />
            </div>

            {/* Impresión automática de ticket */}
            <div className="settings-row-item mt-3">
              <div>
                <strong>Disparar impresión automática al cobrar</strong>
                <p className="text-secondary text-xs">Abre directamente el cuadro de impresión térmica al registrar la venta.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(userSettings.autoPrintReceipt)}
                onChange={(e) => updateUserSettings({ autoPrintReceipt: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
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

      {/* PESTAÑA 2: PARÁMETROS DE TIENDA (GERENTE Y PROGRAMADOR) */}
      {activeTab === 'tienda' && (
        <div className="settings-panel animate-fade-in">
          {!isGerente && (
            <div className="inv-alert-banner mb-3" style={{ background: '#FFF3CD', color: '#856404', borderColor: '#FFEEBA' }}>
              <LockIcon style={{ width: 18, height: 18 }} />
              <div>
                <strong>Nivel de Acceso: Limitado para Empleado</strong>
                <p className="text-xs mt-1" style={{ margin: 0 }}>
                  Como empleado puedes consultar estos parámetros de operación del negocio. Para modificarlos se requiere la cuenta del Gerente o Programador.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveStore}>
            {/* Tarjeta 1: Identidad del Ticket */}
            <div className="settings-section-card mb-3">
              <h4 className="font-semibold text-primary mb-2">Membrete e Identidad del Ticket Térmico</h4>
              
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
              <h4 className="font-semibold text-primary mb-2">Parámetros de Cálculo, Báscula e Impuestos</h4>
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
              <h4 className="font-semibold text-primary mb-2">Políticas Comerciales y Pan Rezago</h4>
              
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
                <input
                  type="checkbox"
                  checked={Boolean(storeForm.permitirDevolucionSinTicket)}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, permitirDevolucionSinTicket: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>

            {/* Tarjeta 4: Canales y Seguridad Operativa */}
            <div className="settings-section-card mb-3">
              <h4 className="font-semibold text-primary mb-2">Canales y Seguridad Operativa</h4>
              
              <div className="settings-row-item">
                <div>
                  <strong>Habilitar Módulo de Autocobro a Clientes</strong>
                  <p className="text-secondary text-xs">Permite a los clientes usar terminales de autoservicio para sus órdenes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={storeForm.autocobroHabilitado}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, autocobroHabilitado: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                />
              </div>

              <div className="settings-row-item mt-3">
                <div>
                  <strong>Requerir Autorización de Gerente para Cortes</strong>
                  <p className="text-secondary text-xs">Exige credenciales de gerente antes de emitir y cerrar el arqueo de caja.</p>
                </div>
                <input
                  type="checkbox"
                  checked={storeForm.requiereAuthGerenteCorte}
                  disabled={!isGerente}
                  onChange={(e) => setStoreForm({ ...storeForm, requiereAuthGerenteCorte: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                />
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

      {/* PESTAÑA 3: SISTEMA Y DESARROLLO (EXCLUSIVO PROGRAMADOR) */}
      {activeTab === 'sistema' && (
        <div className="settings-panel animate-fade-in">
          {!isProgramador ? (
            <div className="inv-alert-banner mb-3" style={{ background: '#F8D7DA', color: '#721C24', borderColor: '#F5C6CB' }}>
              <LockIcon style={{ width: 18, height: 18 }} />
              <div>
                <strong>Acceso Denegado: Exclusivo para Programador</strong>
                <p className="text-xs mt-1" style={{ margin: 0 }}>
                  Esta pestaña contiene herramientas de diagnóstico, exportación de esquemas y parámetros de bajo nivel. Solo el rol de Programador tiene autorización.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveDev}>
              {/* Tarjeta 1: Monitor de Salud de Base de Datos */}
              <div className="settings-section-card mb-3">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 className="font-semibold text-primary" style={{ margin: 0 }}>
                    <DatabaseIcon style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '6px' }} />
                    <span>Monitor de Salud de Base de Datos y Red</span>
                  </h4>
                  {dbPingStatus && (
                    <span className={`ping-indicator-badge ${dbPingStatus.ok ? (dbPingStatus.latency < 50 ? 'ping-fast' : 'ping-slow') : 'ping-error'}`}>
                      {dbPingStatus.ok ? `● ${dbPingStatus.latency}ms (${dbPingStatus.timestamp})` : '● Error'}
                    </span>
                  )}
                </div>

                <p className="text-secondary text-xs mb-3">
                  Comprueba la latencia del pool de conexiones MySQL 8.0 y el tiempo de respuesta del motor de consultas.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={isPinging}
                    onClick={handlePingDatabase}
                  >
                    <RefreshIcon style={{ width: 14, height: 14 }} />
                    <span>{isPinging ? 'Midiendo latencia...' : 'Probar Latencia de MySQL'}</span>
                  </button>
                  <span className="text-muted text-xs font-mono">Host: localhost:3306 &bull; DB: panaderia</span>
                </div>
              </div>

              {/* Tarjeta 2: Diagnóstico y Registro Técnico */}
              <div className="settings-section-card mb-3">
                <h4 className="font-semibold text-primary mb-2">Herramientas de Depuración y Diagnóstico</h4>
                
                <div className="settings-row-item">
                  <div>
                    <strong>Modo Desarrollador Activo</strong>
                    <p className="text-secondary text-xs">Muestra tiempos de ejecución y detalles de cada comanda.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={devForm.modoDebug}
                    onChange={(e) => setDevForm({ ...devForm, modoDebug: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                <div className="settings-row-item mt-3">
                  <div>
                    <strong>Registro de Tráfico IPC en Consola</strong>
                    <p className="text-secondary text-xs">Imprime en la terminal de Electron cada canal y payload invocado.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={devForm.mostrarLogsIPC}
                    onChange={(e) => setDevForm({ ...devForm, mostrarLogsIPC: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                <div className="settings-row-item mt-3">
                  <div>
                    <strong>Simular Modo Desconectado / Fallas de Red</strong>
                    <p className="text-secondary text-xs">Permite verificar el manejo de errores ante interrupción de conexión.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={devForm.simularModoOffline}
                    onChange={(e) => setDevForm({ ...devForm, simularModoOffline: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                  />
                </div>
              </div>

              {/* Tarjeta 3: Respaldos y Migración de Configuraciones */}
              <div className="settings-section-card mb-3">
                <h4 className="font-semibold text-primary mb-2">Gestión de Respaldos y Migración (.JSON)</h4>
                <p className="text-secondary text-xs mb-3">
                  Exporta e importa todas las reglas de negocio, membresías de tickets, políticas e IVA en formato portable.
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={handleExportJSON}>
                    <DownloadIcon style={{ width: 14, height: 14 }} />
                    <span>Exportar Configuración (.JSON)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowJsonImportBox(!showJsonImportBox)}
                  >
                    <span>{showJsonImportBox ? 'Ocultar Importador' : 'Importar Configuración (.JSON)'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-danger-outline"
                    onClick={() => {
                      if (window.confirm('¿Deseas restablecer todas las configuraciones de tienda y desarrollador a sus valores de fábrica?')) {
                        resetAllSettings();
                        setStoreForm(DEFAULT_GLOBAL_SETTINGS);
                        setDevForm(DEFAULT_DEV_SETTINGS);
                        showToast('Configuraciones globales restablecidas a valores de fábrica', 'warning');
                      }
                    }}
                  >
                    Restablecer Todo a Fábrica
                  </button>
                </div>

                {showJsonImportBox && (
                  <div className="animate-fade-in mt-2" style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <label className="form-label">Pega el contenido JSON de configuración:</label>
                    <textarea
                      className="form-control font-mono text-xs"
                      rows={5}
                      placeholder='{ "globalSettings": { ... }, "devSettings": { ... } }'
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                    />
                    <div className="text-right mt-2">
                      <button type="button" className="btn btn-sm btn-primary" onClick={handleImportJSONSubmit}>
                        <CheckIcon style={{ width: 14, height: 14 }} />
                        <span>Cargar y Aplicar JSON</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <button type="submit" className="btn btn-primary">
                  <CheckIcon style={{ width: 16, height: 16 }} />
                  <span>Aplicar Parámetros de Programador</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
