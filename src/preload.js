const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (username, password, activo) => ipcRenderer.invoke('login', username, password, activo),
  registrarUsuario: (data) => ipcRenderer.invoke('registrarUsuario', data),
  modificarUsuario: (data) => ipcRenderer.invoke('modificarUsuario', data),
  deleteUsuario: (idEmpleado) => ipcRenderer.invoke('deleteUsuario', idEmpleado),
  cambiarEstadoUsuario: (idEmpleado, nuevoEstado) => ipcRenderer.invoke('cambiarEstadoUsuario', idEmpleado, nuevoEstado),
  cambiarEstadoProveedor: (idProveedor, nuevoEstado) => ipcRenderer.invoke('cambiarEstadoProveedor', idProveedor, nuevoEstado),
  registrarVenta: (ventaData) => ipcRenderer.invoke('registrarVenta', ventaData),
  registrarProducto: (data) => ipcRenderer.invoke('registrarProducto', data),
  registrarProveedor: (data) => ipcRenderer.invoke('registrarProveedor', data),
  eliminarProducto: (idArticulo, cantidad) => ipcRenderer.invoke('eliminarProducto', idArticulo, cantidad),
  agregarCantidadProducto: (idArticulo, cantidad) => ipcRenderer.invoke('agregarCantidadProducto', idArticulo, cantidad),
  agregarProducto: (productoData) => ipcRenderer.invoke('agregarProducto', productoData),
  verificarExistencia: (idArticulo, cantidad) => ipcRenderer.invoke('verificarExistencia', idArticulo, cantidad),
  getEmpleados: () => ipcRenderer.invoke('getEmpleados'),
  getClientes: () => ipcRenderer.invoke('getClientes'),
  getProveedores: () => ipcRenderer.invoke('getProveedores'),
  programadorCambiarPassword: (payload) => ipcRenderer.invoke('programadorCambiarPassword', payload),
  programadorAgregarGerente: (payload) => ipcRenderer.invoke('programadorAgregarGerente', payload),
  getProductos: () => ipcRenderer.invoke('getProductos'),
  getVentas: () => ipcRenderer.invoke('getVentas'),
  getDetallesVenta: (idVenta) => ipcRenderer.invoke('getDetallesVenta', idVenta),
  getReportes: (filters) => ipcRenderer.invoke('getReportes', filters),
  registrarCorteTurno: (payload) => ipcRenderer.invoke('registrarCorteTurno', payload),
  getRecepcionesProveedor: () => ipcRenderer.invoke('getRecepcionesProveedor'),
  getRecepcionProveedorDetalle: (idRecepcion) => ipcRenderer.invoke('getRecepcionProveedorDetalle', idRecepcion),
  registrarRecepcionProveedor: (payload) => ipcRenderer.invoke('registrarRecepcionProveedor', payload),
  modificarRecepcionProveedor: (payload) => ipcRenderer.invoke('modificarRecepcionProveedor', payload),
  devolverRecepcionProveedor: (payload) => ipcRenderer.invoke('devolverRecepcionProveedor', payload),
  getAuxiliarMovimientos: (payload) => ipcRenderer.invoke('getAuxiliarMovimientos', payload),
  getDevolucionesCliente: () => ipcRenderer.invoke('getDevolucionesCliente'),
  registrarDevolucionCliente: (payload) => ipcRenderer.invoke('registrarDevolucionCliente', payload),
  getUpdateStatus: () => ipcRenderer.invoke('getUpdateStatus'),
  retryUpdateCheck: () => ipcRenderer.invoke('retryUpdateCheck'),
  installPendingUpdate: () => ipcRenderer.invoke('installPendingUpdate'),
  simulateUpdateDemo: () => ipcRenderer.invoke('simulateUpdateDemo'),
  exportarReporteExcel: (payload) => ipcRenderer.invoke('exportarReporteExcel', payload),
  abrirArchivoExterno: (filePath) => ipcRenderer.invoke('abrirArchivoExterno', filePath),
  getAutostartStatus: () => ipcRenderer.invoke('getAutostartStatus'),
  setAutostart: (enable) => ipcRenderer.invoke('setAutostart', enable),
  getAppInfo: () => ipcRenderer.invoke('getAppInfo'),
  programadorExecuteQuery: (query) => ipcRenderer.invoke('programadorExecuteQuery', query),
  programadorGetSystemHealth: () => ipcRenderer.invoke('programadorGetSystemHealth'),
  programadorOptimizeDatabase: () => ipcRenderer.invoke('programadorOptimizeDatabase'),
  programadorExportBackup: () => ipcRenderer.invoke('programadorExportBackup'),
  programadorGetSystemLogs: () => ipcRenderer.invoke('programadorGetSystemLogs'),
  programadorClearLogs: () => ipcRenderer.invoke('programadorClearLogs'),
  programadorTestBarcode: (code) => ipcRenderer.invoke('programadorTestBarcode', code),
  getRemoteSupportStatus: () => ipcRenderer.invoke('getRemoteSupportStatus'),
  updateRemoteSupportConfig: (newSettings) => ipcRenderer.invoke('updateRemoteSupportConfig', newSettings),
  regenerateSessionPin: () => ipcRenderer.invoke('regenerateSessionPin'),
  getLicenseStatus: () => ipcRenderer.invoke('getLicenseStatus'),
  activateLicenseManual: (data) => ipcRenderer.invoke('activateLicenseManual', data),
  onTerminalActivated: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('terminal-activated', handler);
    return () => ipcRenderer.removeListener('terminal-activated', handler);
  },
  onLicenseRevoked: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('license-revoked', handler);
    return () => ipcRenderer.removeListener('license-revoked', handler);
  },
  onLicenseReactivated: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('license-reactivated', handler);
    return () => ipcRenderer.removeListener('license-reactivated', handler);
  },
  onLicenseModified: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('license-modified', handler);
    return () => ipcRenderer.removeListener('license-modified', handler);
  },
  onManagerPasswordChanged: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('manager-password-changed', handler);
    return () => ipcRenderer.removeListener('manager-password-changed', handler);
  },
  onUpdateStatus: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
