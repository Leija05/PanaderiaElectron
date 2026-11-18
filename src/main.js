const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./main/database.js');
const updater = require('./main/updater.js');
const { registerIpcHandlers } = require('./main/ipc.js');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'Panadería Dulce Horno - Punto de Venta',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    backgroundColor: '#FFF9F0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'views', 'index.html'));
}

updater.setMainWindowGetter(() => mainWindow);

app.whenReady().then(async () => {
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
    // Verificar si MySQL de XAMPP está activo; si no, levantarlo automáticamente
    await db.ensureMySQLRunning();
    await db.ensureSupportTables();
    await db.seedRandomDataIfEmpty();
  } catch (err) {
    console.error('Advertencia al verificar esquema o datos en MySQL:', err.message);
  }

  registerIpcHandlers();
  createWindow();
  updater.configureAutoUpdates();
  updater.checkForAppUpdates();

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
