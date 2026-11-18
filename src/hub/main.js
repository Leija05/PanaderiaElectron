const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { WebSocket } = require('ws');
const db = require('../main/database.js');
const { startRelayServer } = require('../../server/relay-server.js');

// Supresión segura de excepciones no críticas en el proceso principal del Hub
process.on('uncaughtException', (err) => {
  console.warn('[Hub Main] Excepción no interceptada capturada de forma segura:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Hub Main] Rechazo no interceptado capturado de forma segura:', reason?.message || reason);
});

// Suprimir diálogos emergentes nativos de Electron por errores de red transitorios
if (dialog && typeof dialog.showErrorBox === 'function') {
  dialog.showErrorBox = (title, content) => {
    console.warn(`[Hub Main Intercepted ErrorBox] ${title}: ${content}`);
  };
}

Menu.setApplicationMenu(null);

let hubWindow = null;
let brokerWs = null;
let isBrokerConnected = false;
let branchList = [];
let reconnectTimer = null;
const pendingHubRequests = new Map();

// ========================================================
// MOTOR INTEGRADO DE TÚNEL CLOUDFLARE (ACCESO MUNDIAL 1-CLICK)
// ========================================================
let tunnelProcess = null;
let tunnelStatus = {
  status: 'idle', // 'idle' | 'starting' | 'running' | 'error'
  url: null,
  error: null,
  startedAt: null,
  logs: []
};

function appendTunnelLog(line) {
  if (!line) return;
  const str = String(line).trim();
  if (!str) return;
  const timestamp = new Date().toLocaleTimeString();
  tunnelStatus.logs.push(`[${timestamp}] ${str}`);
  if (tunnelStatus.logs.length > 80) {
    tunnelStatus.logs.shift();
  }
}

function broadcastTunnelStatus() {
  if (hubWindow && !hubWindow.isDestroyed()) {
    hubWindow.webContents.send('hub-tunnel-status', { ...tunnelStatus });
  }
}

function getCloudflareTunnelStatus() {
  return { ...tunnelStatus };
}

function startCloudflareTunnel(port = 4800) {
  if (tunnelProcess && tunnelStatus.status === 'running') {
    return Promise.resolve({ ...tunnelStatus });
  }

  tunnelStatus.status = 'starting';
  tunnelStatus.error = null;
  tunnelStatus.url = null;
  tunnelStatus.startedAt = new Date().toISOString();
  appendTunnelLog(`Solicitando túnel seguro en trycloudflare.com hacia http://127.0.0.1:${port}...`);
  broadcastTunnelStatus();

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (res) => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };

    try {
      const child = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://127.0.0.1:${port}`], {
        shell: true,
        windowsHide: true
      });
      tunnelProcess = child;

      const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/i;

      const onData = (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          appendTunnelLog(line);
          const match = line.match(urlRegex);
          if (match && !tunnelStatus.url) {
            tunnelStatus.url = match[0];
            tunnelStatus.status = 'running';
            appendTunnelLog(`Enlace público activo y listo: ${tunnelStatus.url}`);
            broadcastTunnelStatus();
            safeResolve({ ...tunnelStatus });
          }
        }
      };

      child.stdout.on('data', onData);
      child.stderr.on('data', onData);

      child.on('error', (err) => {
        tunnelStatus.status = 'error';
        tunnelStatus.error = err.message;
        appendTunnelLog(`Error iniciando proceso de túnel: ${err.message}`);
        broadcastTunnelStatus();
        safeResolve({ ...tunnelStatus });
      });

      child.on('exit', (code) => {
        tunnelProcess = null;
        if (tunnelStatus.status === 'running' || tunnelStatus.status === 'starting') {
          tunnelStatus.status = 'idle';
        }
        tunnelStatus.url = null;
        appendTunnelLog(`Proceso del túnel cerrado (código de salida: ${code})`);
        broadcastTunnelStatus();
      });

      // Timeout preventivo de 25 segundos
      setTimeout(() => {
        safeResolve({ ...tunnelStatus });
      }, 25000);

    } catch (err) {
      tunnelStatus.status = 'error';
      tunnelStatus.error = err.message;
      appendTunnelLog(`Excepción al ejecutar cloudflared: ${err.message}`);
      broadcastTunnelStatus();
      safeResolve({ ...tunnelStatus });
    }
  });
}

function stopCloudflareTunnel() {
  if (tunnelProcess) {
    appendTunnelLog('Deteniendo túnel Cloudflare...');
    try {
      if (process.platform === 'win32' && tunnelProcess.pid) {
        spawn('taskkill', ['/pid', String(tunnelProcess.pid), '/T', '/F'], { windowsHide: true });
      } else {
        tunnelProcess.kill('SIGTERM');
      }
    } catch (_) {}
    tunnelProcess = null;
  }
  tunnelStatus.status = 'idle';
  tunnelStatus.url = null;
  broadcastTunnelStatus();
  return { ...tunnelStatus };
}

function generateStructuredToken(tier = 'PRO', branchId = '') {
  const cleanTier = String(tier || 'PRO').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'PRO';
  const year = new Date().getFullYear();
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rawKey = `${branchId || 'dh'}:${cleanTier}:${p1}:${p2}:${Date.now()}`;
  const chk = crypto.createHash('sha256').update(rawKey).digest('hex').substring(0, 4).toUpperCase();
  return `DH-${cleanTier}-${year}-${p1}-${p2}-${chk}`;
}

function getHubConfigPath() {
  const baseDir = app && typeof app.getPath === 'function'
    ? app.getPath('userData')
    : path.join(__dirname, '..', '..');
  return path.join(baseDir, 'hub-config.json');
}

let hubConfig = {
  relayUrl: process.env.RELAY_URL || 'ws://127.0.0.1:4800',
  devSecret: process.env.DEV_SECRET || 'dulcehorno_master_key_2026'
};

function getSystemAppVersion() {
  try {
    const pkg = require('../../package.json');
    if (pkg && pkg.version) return pkg.version;
  } catch (_) {}
  return '1.1.2';
}

function loadHubConfig() {
  try {
    const p = getHubConfigPath();
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      hubConfig = { ...hubConfig, ...data };
    }
  } catch (_) {}
  return hubConfig;
}

function saveHubConfig(newCfg) {
  try {
    const p = getHubConfigPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(newCfg, null, 2), 'utf8');
    hubConfig = newCfg;
  } catch (_) {}
}

function getMachineIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, address: net.address });
      }
    }
  }
  return ips;
}

function safeWsSend(targetSocket, data) {
  try {
    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      targetSocket.send(payload);
      return true;
    }
  } catch (err) {
    console.warn('[Hub Main] Error protegido en safeWsSend:', err.message);
  }
  return false;
}

function connectToRelayBroker() {
  if (brokerWs && (brokerWs.readyState === WebSocket.OPEN || brokerWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  clearTimeout(reconnectTimer);

  try {
    let targetUrl = (hubConfig.relayUrl || 'ws://127.0.0.1:4800').trim();
    if (targetUrl.startsWith('https://')) targetUrl = targetUrl.replace(/^https:\/\//, 'wss://');
    if (targetUrl.startsWith('http://')) targetUrl = targetUrl.replace(/^http:\/\//, 'ws://');
    if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
      targetUrl = `wss://${targetUrl}`;
    }
    console.log(`[Hub Main] Conectando con Broker de Soporte en ${targetUrl}...`);
    const currentSocket = new WebSocket(targetUrl);
    brokerWs = currentSocket;

    currentSocket.on('open', () => {
      try {
        if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN) {
          return;
        }
        console.log('[Hub Main] Conexión establecida. Autenticando Hub...');
        safeWsSend(currentSocket, {
          type: 'auth_hub',
          secretKey: hubConfig.devSecret || 'dulcehorno_master_key_2026'
        });
      } catch (err) {
        console.warn('[Hub Main] Error al autenticar con broker:', err.message);
      }
    });

    currentSocket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth_ok') {
          isBrokerConnected = true;
          console.log('[Hub Main] Broker autenticado exitosamente.');
          if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents && !hubWindow.webContents.isDestroyed()) {
            try {
              hubWindow.webContents.send('hub-broker-status', { connected: true, url: targetUrl });
            } catch (_) {}
          }
          return;
        }

        if (data.type === 'auth_error') {
          isBrokerConnected = false;
          console.error('[Hub Main] Error de autenticación con el broker:', data.message);
          if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents && !hubWindow.webContents.isDestroyed()) {
            try {
              hubWindow.webContents.send('hub-broker-status', { connected: false, error: data.message });
            } catch (_) {}
          }
          return;
        }

        if (data.type === 'branch_list') {
          branchList = data.branches || [];
          console.log(`[Hub Main] Lista de sucursales actualizada (${branchList.length} en línea).`);
          if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents && !hubWindow.webContents.isDestroyed()) {
            try {
              hubWindow.webContents.send('hub-branch-list', branchList);
            } catch (_) {}
          }
          return;
        }

        if (data.type === 'command_response') {
          const { commandId, success, result, error } = data;
          const pending = pendingHubRequests.get(commandId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            pendingHubRequests.delete(commandId);
            if (success) {
              pending.resolve(result);
            } else {
              pending.reject(new Error(error || 'Error desconocido reportado por la sucursal.'));
            }
          }
          return;
        }
      } catch (err) {
        console.warn('[Hub Main] Error procesando mensaje de broker:', err.message);
      }
    });

    currentSocket.on('close', () => {
      if (brokerWs === currentSocket) {
        isBrokerConnected = false;
        branchList = [];
        brokerWs = null;
        if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents && !hubWindow.webContents.isDestroyed()) {
          try {
            hubWindow.webContents.send('hub-broker-status', { connected: false, url: targetUrl });
            hubWindow.webContents.send('hub-branch-list', []);
          } catch (_) {}
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToRelayBroker, 3000);
      }
    });

    currentSocket.on('error', (err) => {
      console.warn('[Hub Main] Aviso de conexión WebSocket con el broker:', err.message);
      if (brokerWs === currentSocket) {
        isBrokerConnected = false;
        try { currentSocket.close(); } catch (_) {}
        brokerWs = null;
        if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents && !hubWindow.webContents.isDestroyed()) {
          try {
            hubWindow.webContents.send('hub-broker-status', { connected: false, url: targetUrl });
          } catch (_) {}
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToRelayBroker, 3000);
      }
    });
  } catch (e) {
    brokerWs = null;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectToRelayBroker, 3000);
  }
}

function sendActionToRemoteBranch(targetBranchId, action, payload) {
  return new Promise((resolve, reject) => {
    if (!isBrokerConnected || !brokerWs || brokerWs.readyState !== WebSocket.OPEN) {
      return reject(new Error('El Hub no está conectado al servidor broker de retransmisión.'));
    }

    const commandId = require('crypto').randomUUID();
    const timeoutId = setTimeout(() => {
      if (pendingHubRequests.has(commandId)) {
        pendingHubRequests.delete(commandId);
        reject(new Error(`Tiempo de espera agotado esperando respuesta de la sucursal "${targetBranchId}".`));
      }
    }, 40000);

    pendingHubRequests.set(commandId, { resolve, reject, timeoutId });

    const sent = safeWsSend(brokerWs, {
      type: 'remote_command',
      targetBranchId,
      commandId,
      action,
      payload
    });

    if (!sent) {
      clearTimeout(timeoutId);
      pendingHubRequests.delete(commandId);
      reject(new Error('No se pudo enviar el comando: la conexión WebSocket no está lista.'));
    }
  });
}

function registerHubIpcHandlers() {
  ipcMain.handle('hubGetBrokerStatus', () => ({
    connected: isBrokerConnected,
    url: hubConfig.relayUrl || 'ws://127.0.0.1:4800',
    totalBranchesOnline: branchList.length
  }));

  ipcMain.handle('hubReconnectBroker', () => {
    if (brokerWs) {
      try { brokerWs.terminate(); } catch (_) {}
      brokerWs = null;
    }
    connectToRelayBroker();
    return { connected: isBrokerConnected, url: hubConfig.relayUrl || 'ws://127.0.0.1:4800' };
  });

  ipcMain.handle('hubGetBranches', () => branchList);

  ipcMain.handle('hubGetNetworkInfo', () => ({
    ips: getMachineIps(),
    port: 4800,
    relayUrl: hubConfig.relayUrl || 'ws://127.0.0.1:4800',
    connected: isBrokerConnected,
    totalBranches: branchList.length,
    appVersion: getSystemAppVersion()
  }));

  ipcMain.handle('hubGetAppVersion', () => {
    return getSystemAppVersion();
  });

  ipcMain.handle('hubSetRelayUrl', (event, newUrl) => {
    const trimmed = String(newUrl || '').trim();
    if (!trimmed) throw new Error('La URL no puede estar vacía.');
    hubConfig.relayUrl = trimmed;
    saveHubConfig(hubConfig);
    if (brokerWs) {
      try { brokerWs.terminate(); } catch (_) {}
      brokerWs = null;
    }
    connectToRelayBroker();
    return { success: true, relayUrl: hubConfig.relayUrl };
  });

  ipcMain.handle('hubSendRemoteAction', async (event, targetBranchId, action, payload) => {
    if (!targetBranchId) throw new Error('Debes seleccionar una sucursal destino.');

    if (targetBranchId === '__local__') {
      if (action === 'activate_terminal_license') {
        const p = payload || {};
        const token = String(p.token || '').trim();
        const nombreNegocio = String(p.nombreNegocio || 'Panadería Dulce Horno').trim();
        const nombreGerente = String(p.nombreGerente || '').trim();
        const usuarioGerente = String(p.usuarioGerente || '').trim();
        const passwordGerente = String(p.passwordGerente || '').trim();
        const tipoLicencia = String(p.tipoLicencia || 'Comercial Pro Vitalicia').trim();

        if (!token || !usuarioGerente || !passwordGerente) {
          throw new Error('Faltan datos obligatorios para la activación (Token, Usuario o Contraseña).');
        }

        const passHash = db.hashPassword(passwordGerente);

        await db.query(`
          INSERT INTO LicenciaSistema (TokenActivacion, NombreNegocio, Propietario, TipoLicencia, Estado, FechaActivacion, ActivadoPor)
          VALUES (?, ?, ?, ?, 'Activa', NOW(), 'Hub Local')
          ON DUPLICATE KEY UPDATE
            NombreNegocio = VALUES(NombreNegocio),
            Propietario = VALUES(Propietario),
            TipoLicencia = VALUES(TipoLicencia),
            Estado = 'Activa',
            FechaActivacion = NOW(),
            ActivadoPor = 'Hub Local'
        `, [token, nombreNegocio, nombreGerente || usuarioGerente, tipoLicencia]);

        const userExists = await db.query('SELECT IdEmpleado FROM Empleados WHERE NombreUsuario = ?', [usuarioGerente]);
        if (userExists.length > 0) {
          await db.query(`
            UPDATE Empleados 
            SET Password = ?, Rol = 'Gerente', NombreCompleto = ?, Puesto = 'Gerente General', Activo = TRUE
            WHERE IdEmpleado = ?
          `, [passHash, nombreGerente || usuarioGerente, userExists[0].IdEmpleado]);
        } else {
          await db.query(`
            INSERT INTO Empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Activo)
            VALUES (?, ?, 'Gerente', 'Gerente General', 'Matutino', 0, ?, TRUE)
          `, [usuarioGerente, passHash, nombreGerente || usuarioGerente]);
        }

        return {
          success: true,
          message: `Licencia activada localmente para "${nombreNegocio}". Gerente "${usuarioGerente}" registrado exitosamente.`
        };
      }

      if (action === 'modify_license') {
        const p = payload || {};
        const updates = [];
        const params = [];
        if (p.nombreNegocio) { updates.push('NombreNegocio = ?'); params.push(p.nombreNegocio); }
        if (p.propietario) { updates.push('Propietario = ?'); params.push(p.propietario); }
        if (p.tipoLicencia) { updates.push('TipoLicencia = ?'); params.push(p.tipoLicencia); }
        if (p.fechaExpiracion !== undefined) { updates.push('FechaExpiracion = ?'); params.push(p.fechaExpiracion); }
        if (p.notas !== undefined) { updates.push('Notas = ?'); params.push(p.notas); }
        if (p.nuevoToken) { updates.push('TokenActivacion = ?'); params.push(p.nuevoToken); }
        if (updates.length > 0) {
          await db.query(`UPDATE LicenciaSistema SET ${updates.join(', ')} ORDER BY IdLicencia DESC LIMIT 1`, params);
        }
        return { success: true, message: 'Licencia actualizada exitosamente.' };
      }

      if (action === 'revoke_license') {
        const motivo = String(payload?.motivo || 'Licencia suspendida localmente').trim();
        await db.query("UPDATE LicenciaSistema SET Estado = 'Suspendida', MotivoSuspension = ? ORDER BY IdLicencia DESC LIMIT 1", [motivo]);
        await db.query("UPDATE Empleados SET Activo = FALSE WHERE Rol = 'Gerente'");
        return { success: true, message: `Licencia suspendida exitosamente. Motivo: "${motivo}".` };
      }

      if (action === 'reactivate_license') {
        await db.query("UPDATE LicenciaSistema SET Estado = 'Activa', MotivoSuspension = NULL ORDER BY IdLicencia DESC LIMIT 1");
        await db.query("UPDATE Empleados SET Activo = TRUE WHERE Rol = 'Gerente'");
        return { success: true, message: 'Licencia reactivada localmente con éxito.' };
      }

      if (action === 'change_manager_password') {
        const p = payload || {};
        const usuarioGerente = String(p.usuarioGerente || '').trim();
        const nuevoPassword = String(p.nuevoPassword || '').trim();
        if (!nuevoPassword) throw new Error('La nueva contraseña no puede estar vacía.');
        const passHash = db.hashPassword(nuevoPassword);
        if (usuarioGerente) {
          await db.query("UPDATE Empleados SET Password = ?, Activo = TRUE WHERE NombreUsuario = ? AND Rol = 'Gerente'", [passHash, usuarioGerente]);
        } else {
          await db.query("UPDATE Empleados SET Password = ?, Activo = TRUE WHERE Rol = 'Gerente' LIMIT 1", [passHash]);
        }
        return { success: true, message: 'Contraseña de Gerente actualizada exitosamente.' };
      }
    }

    return sendActionToRemoteBranch(targetBranchId, action, payload);
  });

  ipcMain.handle('hubExecuteLocalQuery', async (event, queryStr) => {
    const trimmed = String(queryStr || '').trim();
    if (!trimmed) throw new Error('Consulta vacía.');
    const start = performance.now();
    const results = await db.query(trimmed);
    const executionTimeMs = Number((performance.now() - start).toFixed(2));

    if (Array.isArray(results)) {
      return {
        success: true,
        isSelect: true,
        rows: results.slice(0, 250),
        totalRows: results.length,
        columns: results.length > 0 ? Object.keys(results[0]) : [],
        executionTimeMs
      };
    }
    return {
      success: true,
      isSelect: false,
      affectedRows: results.affectedRows ?? 0,
      changedRows: results.changedRows ?? 0,
      insertId: results.insertId ?? null,
      message: results.message || 'Operación completada exitosamente',
      executionTimeMs
    };
  });

  ipcMain.handle('hubGetLocalSystemHealth', async () => {
    const start = performance.now();
    const dbNameRes = await db.query('SELECT DATABASE() as dbName');
    const versionRes = await db.query('SELECT VERSION() as version');
    const tablesRes = await db.query(`
      SELECT TABLE_NAME as tableName, TABLE_ROWS as tableRows, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as sizeKB
      FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `);
    const totalKB = (tablesRes || []).reduce((acc, t) => acc + (Number(t.sizeKB) || 0), 0);
    return {
      success: true,
      database: {
        status: 'ONLINE',
        pingMs: Number((performance.now() - start).toFixed(2)),
        version: versionRes[0]?.version || 'MySQL 8.0',
        databaseName: dbNameRes[0]?.dbName || 'panaderia',
        totalSizeMB: (totalKB / 1024).toFixed(2),
        totalTables: tablesRes.length,
        tables: tablesRes
      }
    };
  });

  ipcMain.handle('hubSaveBackupFile', async (event, defaultFilename, backupData) => {
    const { canceled, filePath } = await dialog.showSaveDialog(hubWindow, {
      title: 'Guardar Respaldo de Sucursal Remota (.JSON)',
      defaultPath: defaultFilename || `DulceHorno_Backup_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'Archivos JSON (*.json)', extensions: ['json'] }]
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
      return { success: true, saved: true, filePath };
    }
    return { success: true, saved: false, canceled: true };
  });

  // Handlers para el Túnel Cloudflare Integrado
  ipcMain.handle('hubStartTunnel', async (event, port = 4800) => {
    return startCloudflareTunnel(port);
  });

  ipcMain.handle('hubStopTunnel', async () => {
    return stopCloudflareTunnel();
  });

  ipcMain.handle('hubGetTunnelStatus', async () => {
    return getCloudflareTunnelStatus();
  });

  ipcMain.handle('hubGenerateToken', async (event, tier, branchId) => {
    return generateStructuredToken(tier, branchId);
  });
}

function createHubWindow() {
  hubWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1150,
    minHeight: 740,
    title: 'DulceHorno Central Hub - Centro de Mando & Soporte Técnico',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    backgroundColor: '#0b1120',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  hubWindow.setMenu(null);
  hubWindow.setMenuBarVisibility(false);
  hubWindow.removeMenu();

  hubWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      hubWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.control && input.key.toLowerCase() === 'r') {
      hubWindow.webContents.reload();
      event.preventDefault();
    }
  });

  hubWindow.webContents.on('did-finish-load', () => {
    hubWindow.webContents.send('hub-broker-status', { connected: isBrokerConnected, url: hubConfig.relayUrl });
    hubWindow.webContents.send('hub-branch-list', branchList);
    hubWindow.webContents.send('hub-tunnel-status', getCloudflareTunnelStatus());
  });

  hubWindow.on('closed', () => {
    hubWindow = null;
    stopCloudflareTunnel();
  });

  hubWindow.loadFile(path.join(__dirname, 'views', 'index.html'));
}

app.whenReady().then(async () => {
  if (typeof app.setVersion === 'function') {
    app.setVersion(getSystemAppVersion());
  }
  if (typeof app.setName === 'function') {
    app.setName('DulceHorno Central Hub');
  }
  Menu.setApplicationMenu(null);
  loadHubConfig();
  registerHubIpcHandlers();

  // Asegurar que MySQL esté iniciado y la base de datos lista para consultas locales
  try {
    await db.ensureMySQLRunning();
    await db.ensureDatabaseExists();
  } catch (err) {
    console.warn('[Hub Main] Aviso comprobando MySQL local:', err.message);
  }

  // Asegurar compilación del bundle del Hub si falta
  const bundlePath = path.join(__dirname, 'views', 'bundle.js');
  if (!fs.existsSync(bundlePath)) {
    try {
      const buildHub = require('../../scripts/build-hub.js');
      await buildHub();
    } catch (e) {
      console.warn('Compilación previa de Hub bundle falló:', e.message);
    }
  }

  // Iniciar el servidor broker en segundo plano (0.0.0.0:4800) y esperar a que esté listo
  try {
    await startRelayServer(4800);
  } catch (err) {
    console.warn('[Hub Main] Aviso iniciando relay server:', err.message);
  }

  createHubWindow();
  connectToRelayBroker();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createHubWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopCloudflareTunnel();
});
