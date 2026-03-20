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
  getProveedores: () => ipcRenderer.invoke('getProveedores'),
  getProductos: () => ipcRenderer.invoke('getProductos'),
  getVentas: () => ipcRenderer.invoke('getVentas'),
  getDetallesVenta: (idVenta) => ipcRenderer.invoke('getDetallesVenta', idVenta),
  getReportes: (filters) => ipcRenderer.invoke('getReportes', filters),
  registrarCorteTurno: (payload) => ipcRenderer.invoke('registrarCorteTurno', payload),
  getUpdateStatus: () => ipcRenderer.invoke('getUpdateStatus'),
  installPendingUpdate: () => ipcRenderer.invoke('installPendingUpdate'),
  onUpdateStatus: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
