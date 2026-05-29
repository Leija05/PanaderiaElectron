const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (username, password, activo) => ipcRenderer.invoke('login', username, password, activo),
  registrarUsuario: (data) => ipcRenderer.invoke('registrarUsuario', data),
  modificarUsuario: (data) => ipcRenderer.invoke('modificarUsuario', data),
  deleteUsuario: (idEmpleado) => ipcRenderer.invoke('deleteUsuario', idEmpleado),
  cambiarEstadoUsuario: (idEmpleado, nuevoEstado) => ipcRenderer.invoke('cambiarEstadoUsuario', idEmpleado, nuevoEstado),
  cambiarEstadoProveedor: (idProveedor, nuevoEstado) => ipcRenderer.invoke('cambiarEstadoUsuario', idProveedor, nuevoEstado),
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
  onUpdateStatus: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
