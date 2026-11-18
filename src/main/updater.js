const log = require('electron-log');
const { app } = require('electron');

let autoUpdater = null;
try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
} catch (e) {
  console.warn('Advertencia al cargar electron-updater:', e.message);
}

let appVersion = '1.1.0';
try {
  if (app && typeof app.getVersion === 'function') {
    appVersion = app.getVersion();
  }
} catch {
  // Modo sin app de electron
}

let updateState = {
  status: 'checking',
  version: appVersion,
  availableVersion: null,
  downloadedVersion: null,
  progressPercent: 0,
  progressTransferred: 0,
  progressTotal: 0,
  bytesPerSecond: 0,
  mandatory: true,
  message: 'Comprobando si el sistema está actualizado contra los releases de GitHub...'
};

let updateDownloadInProgress = false;
let updateInstallTriggered = false;
let mainWindowGetter = () => null;
let demoSimulationTimer = null;
let demoSimulationInterval = null;

function setMainWindowGetter(fn) {
  mainWindowGetter = fn;
}

function setUpdateState(nextState) {
  updateState = {
    ...updateState,
    ...nextState
  };

  const win = mainWindowGetter();
  if (win && !win.isDestroyed()) {
    win.webContents.send('update-status', updateState);
  }
}

function configureAutoUpdates() {
  if (!autoUpdater) return;

  log.transports.file.level = 'info';
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    setUpdateState({
      status: 'checking',
      version: appVersion,
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: 0,
      progressTransferred: 0,
      progressTotal: 0,
      bytesPerSecond: 0,
      message: 'Comprobando la última versión publicada en GitHub Releases...'
    });
  });

  autoUpdater.on('update-available', async (info) => {
    setUpdateState({
      status: 'available',
      version: appVersion,
      availableVersion: info.version,
      progressPercent: 0,
      progressTransferred: 0,
      progressTotal: 0,
      bytesPerSecond: 0,
      message: `Se encontró la versión ${info.version}. La actualización es obligatoria y comenzará a descargarse ahora.`
    });

    if (updateDownloadInProgress) return;
    updateDownloadInProgress = true;

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      updateDownloadInProgress = false;
      log.error('downloadUpdate failed:', error);
      setUpdateState({
        status: 'error',
        message: `No se pudo descargar la actualización requerida: ${error.message}`
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    setUpdateState({
      status: 'downloading',
      progressPercent: Number(progress.percent || 0),
      progressTransferred: Number(progress.transferred || 0),
      progressTotal: Number(progress.total || 0),
      bytesPerSecond: Number(progress.bytesPerSecond || 0),
      message: `Descargando actualización ${updateState.availableVersion || ''}... ${Number(progress.percent || 0).toFixed(1)}%`
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloadInProgress = false;
    setUpdateState({
      status: 'pending_install',
      downloadedVersion: info.version,
      availableVersion: info.version,
      progressPercent: 100,
      progressTransferred: Number(updateState.progressTotal || 0),
      progressTotal: Number(updateState.progressTotal || 0),
      bytesPerSecond: 0,
      message: `La actualización ${info.version} se descargó correctamente. Haz clic en "Reiniciar e Instalar Ahora".`
    });
  });

  autoUpdater.on('update-not-available', () => {
    updateDownloadInProgress = false;
    updateInstallTriggered = false;
    setUpdateState({
      status: 'up_to_date',
      version: appVersion,
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: 100,
      progressTransferred: 0,
      progressTotal: 0,
      bytesPerSecond: 0,
      message: 'El sistema ya está actualizado a la última versión publicada.'
    });
  });

  autoUpdater.on('error', (error) => {
    updateDownloadInProgress = false;
    log.error('AutoUpdater error:', error);
    setUpdateState({
      status: 'error',
      message: `No fue posible confirmar la versión más reciente desde GitHub Releases: ${error.message}`
    });
  });
}

async function checkForAppUpdates() {
  updateDownloadInProgress = false;
  updateInstallTriggered = false;

  if (!app?.isPackaged) {
    setUpdateState({
      status: 'development',
      version: appVersion,
      message: 'Modo de desarrollo activo (npm start).'
    });
    return;
  }

  if (!autoUpdater) {
    setUpdateState({
      status: 'error',
      message: 'El módulo autoUpdater no está disponible en este entorno.'
    });
    return;
  }

  setUpdateState({
    status: 'checking',
    version: appVersion,
    availableVersion: null,
    downloadedVersion: null,
    progressPercent: 0,
    progressTransferred: 0,
    progressTotal: 0,
    bytesPerSecond: 0,
    message: 'Comprobando la última versión disponible en GitHub Releases...'
  });

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log.error('checkForUpdates failed:', error);
    setUpdateState({
      status: 'error',
      message: `Error al consultar GitHub Releases: ${error.message}`
    });
  }
}

function simulateUpdateDemo() {
  if (demoSimulationTimer) clearTimeout(demoSimulationTimer);
  if (demoSimulationInterval) clearInterval(demoSimulationInterval);

  const mockTotal = 86450000; // 86.4 MB
  const nextVer = '1.2.0';

  // 1. Buscando
  setUpdateState({
    status: 'checking',
    version: appVersion,
    availableVersion: null,
    downloadedVersion: null,
    progressPercent: 0,
    progressTransferred: 0,
    progressTotal: mockTotal,
    bytesPerSecond: 0,
    message: 'Comprobando la última versión publicada en GitHub Releases...'
  });

  // 2. Nueva versión encontrada
  demoSimulationTimer = setTimeout(() => {
    setUpdateState({
      status: 'available',
      version: appVersion,
      availableVersion: nextVer,
      progressPercent: 0,
      progressTransferred: 0,
      progressTotal: mockTotal,
      bytesPerSecond: 0,
      message: `Se encontró la versión ${nextVer}. Iniciando descarga obligatoria...`
    });

    // 3. Descargando progresivamente
    demoSimulationTimer = setTimeout(() => {
      let currentPercent = 0;
      demoSimulationInterval = setInterval(() => {
        currentPercent += 8;
        if (currentPercent >= 100) {
          clearInterval(demoSimulationInterval);
          // 4. Descargado y listo para instalar
          setUpdateState({
            status: 'pending_install',
            version: appVersion,
            availableVersion: nextVer,
            downloadedVersion: nextVer,
            progressPercent: 100,
            progressTransferred: mockTotal,
            progressTotal: mockTotal,
            bytesPerSecond: 0,
            message: `La versión ${nextVer} se descargó correctamente. Haz clic en "Reiniciar e Instalar Ahora".`
          });
        } else {
          const transferred = Math.round((currentPercent / 100) * mockTotal);
          const speed = 4.8 * 1024 * 1024; // 4.8 MB/s
          setUpdateState({
            status: 'downloading',
            version: appVersion,
            availableVersion: nextVer,
            progressPercent: currentPercent,
            progressTransferred: transferred,
            progressTotal: mockTotal,
            bytesPerSecond: speed,
            message: `Descargando actualización ${nextVer}... ${currentPercent}%`
          });
        }
      }, 350);
    }, 1200);
  }, 1500);

  return { success: true };
}

function getUpdateState() {
  return updateState;
}

function installPendingUpdate() {
  if (updateState.availableVersion === '1.2.0' && !app?.isPackaged) {
    setUpdateState({
      status: 'up_to_date',
      version: '1.2.0',
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: 100,
      message: '¡Actualización simulada con éxito! El sistema se actualizó a la versión 1.2.0.'
    });
    return { success: true, simulated: true };
  }

  if (!autoUpdater || !['pending', 'pending_install'].includes(updateState.status)) {
    return { success: false, message: 'No hay una actualización descargada para instalar.' };
  }

  try {
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = {
  setMainWindowGetter,
  configureAutoUpdates,
  checkForAppUpdates,
  getUpdateState,
  installPendingUpdate,
  simulateUpdateDemo
};
