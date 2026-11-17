const log = require('electron-log');
const { app } = require('electron');

let autoUpdater = null;
try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
} catch (e) {
  console.warn('Advertencia al cargar electron-updater:', e.message);
}

let appVersion = '1.0.8';
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
  mandatory: true,
  message: 'Comprobando si el sistema está actualizado contra los releases de GitHub...'
};

let updateDownloadInProgress = false;
let updateInstallTriggered = false;
let mainWindowGetter = () => null;

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
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: 0,
      progressTransferred: 0,
      progressTotal: 0,
      message: 'Comprobando la última versión publicada en GitHub Releases...'
    });
  });

  autoUpdater.on('update-available', async (info) => {
    setUpdateState({
      status: 'available',
      availableVersion: info.version,
      progressPercent: 0,
      progressTransferred: 0,
      progressTotal: 0,
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
      message: `La actualización ${info.version} se descargó correctamente. Abriendo el instalador...`
    });

    if (updateInstallTriggered) return;
    updateInstallTriggered = true;

    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 1200);
  });

  autoUpdater.on('update-not-available', () => {
    updateDownloadInProgress = false;
    updateInstallTriggered = false;
    setUpdateState({
      status: 'up_to_date',
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: 100,
      progressTransferred: 0,
      progressTotal: 0,
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
  if (!autoUpdater) return;
  updateDownloadInProgress = false;
  updateInstallTriggered = false;

  if (!app?.isPackaged) {
    setUpdateState({
      status: 'development',
      message: 'La comprobación obligatoria contra GitHub Releases solo funciona en builds empaquetados. En desarrollo se permite continuar.'
    });
    return;
  }

  setUpdateState({
    status: 'checking',
    availableVersion: null,
    downloadedVersion: null,
    progressPercent: 0,
    progressTransferred: 0,
    progressTotal: 0,
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

function getUpdateState() {
  return updateState;
}

function installPendingUpdate() {
  if (!autoUpdater || !['pending', 'pending_install'].includes(updateState.status)) {
    return { success: false, message: 'No hay una actualización descargada para instalar.' };
  }
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return { success: true };
}

module.exports = {
  setMainWindowGetter,
  configureAutoUpdates,
  checkForAppUpdates,
  getUpdateState,
  installPendingUpdate
};
