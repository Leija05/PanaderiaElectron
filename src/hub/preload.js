const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hubApi', {
  // Conexión y Estado del Broker
  getBrokerStatus: () => ipcRenderer.invoke('hubGetBrokerStatus'),
  reconnectBroker: () => ipcRenderer.invoke('hubReconnectBroker'),
  getBranches: () => ipcRenderer.invoke('hubGetBranches'),
  getNetworkInfo: () => ipcRenderer.invoke('hubGetNetworkInfo'),
  getAppVersion: () => ipcRenderer.invoke('hubGetAppVersion'),
  setRelayUrl: (url) => ipcRenderer.invoke('hubSetRelayUrl', url),

  // Ejecución Remota de Acciones hacia Sucursales
  sendRemoteAction: (targetBranchId, action, payload) => ipcRenderer.invoke('hubSendRemoteAction', targetBranchId, action, payload),

  // Acciones Locales (en esta máquina)
  executeLocalQuery: (query) => ipcRenderer.invoke('hubExecuteLocalQuery', query),
  getLocalSystemHealth: () => ipcRenderer.invoke('hubGetLocalSystemHealth'),

  // Guardado de Respaldos
  saveBackupFile: (defaultFilename, backupData) => ipcRenderer.invoke('hubSaveBackupFile', defaultFilename, backupData),

  // Túnel Cloudflare Integrado (Generador de Enlace Remoto sin Terminal)
  startTunnel: (port) => ipcRenderer.invoke('hubStartTunnel', port),
  stopTunnel: () => ipcRenderer.invoke('hubStopTunnel'),
  getTunnelStatus: () => ipcRenderer.invoke('hubGetTunnelStatus'),
  generateToken: (tier, branchId) => ipcRenderer.invoke('hubGenerateToken', tier, branchId),
  onTunnelStatus: (callback) => {
    const handler = (_, status) => callback(status);
    ipcRenderer.on('hub-tunnel-status', handler);
    return () => ipcRenderer.removeListener('hub-tunnel-status', handler);
  },

  // Eventos Push en Tiempo Real (ej. actualización de lista de sucursales)
  onBranchListUpdate: (callback) => {
    const handler = (_, branches) => callback(branches);
    ipcRenderer.on('hub-branch-list', handler);
    return () => ipcRenderer.removeListener('hub-branch-list', handler);
  },
  onBrokerStatusChange: (callback) => {
    const handler = (_, status) => callback(status);
    ipcRenderer.on('hub-broker-status', handler);
    return () => ipcRenderer.removeListener('hub-broker-status', handler);
  }
});
