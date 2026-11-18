const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./main/database.js');
const updater = require('./main/updater.js');
const remoteAgent = require('./main/remoteAgent.js');
const { registerIpcHandlers } = require('./main/ipc.js');

// Eliminar el menú genérico superior de Electron (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

let mainWindow = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[DulceHorno] Ya existe una instancia activa. Cerrando proceso duplicado.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'Panadería Dulce Horno - Punto de Venta',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    backgroundColor: '#FFF9F0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Eliminar y deshabilitar por completo la barra de menú superior de Electron (File, Edit, View, Window, Help)
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // En modo desarrollo, permitir F12 para abrir DevTools y Ctrl+R para recargar sin menú visible
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
      if (input.control && input.key.toLowerCase() === 'r') {
        mainWindow.webContents.reload();
        event.preventDefault();
      }
    });
  }

  mainWindow.loadFile(path.join(__dirname, 'views', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', updater.getUpdateState());
      }
    }, 400);
  });
}

updater.setMainWindowGetter(() => mainWindow);

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  // 1. Registrar handlers IPC prioritariamente para que siempre respondan al preload
  registerIpcHandlers();

  // Asegurar compilación de React si no existe bundle.js
  const bundlePath = path.join(__dirname, 'views', 'bundle.js');
  if (!fs.existsSync(bundlePath)) {
    try {
      const build = require('../scripts/build.js');
      await build();
    } catch (err) {
      console.error('Error al autocompilar bundle.js de React:', err.message);
    }
  }

  try {
    // Asegurar que MySQL esté corriendo, crear base de datos si no existe y estructurar tablas
    await db.ensureMySQLRunning();
    await db.ensureDatabaseExists();
    await db.ensureSupportTables();
  } catch (err) {
    console.error('Advertencia al inicializar MySQL o esquema:', err.message);
  }

  createWindow();

  // Asegurar que el broker de soporte esté activo en puerto 4800 (o reutilizar el existente si ya está levantado)
  try {
    const { startRelayServer } = require('../server/relay-server.js');
    await startRelayServer(4800);
  } catch (err) {
    console.log('[DulceHorno] Broker local ya activo o gestionado externamente:', err.message);
  }

  remoteAgent.initRemoteAgent();
  updater.configureAutoUpdates();
  setTimeout(() => {
    updater.checkForAppUpdates();
  }, 1200);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.closePool().finally(() => {
      app.quit();
    });
  }
});
