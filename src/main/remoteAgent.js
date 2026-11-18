const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const { WebSocket } = require('ws');
const db = require('./database.js');

let ws = null;
let pingInterval = null;
let reconnectTimeout = null;
let isConnected = false;
let config = null;

function safeWsSend(socket, data) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      socket.send(payload);
      return true;
    }
  } catch (err) {
    console.warn('[RemoteAgent] Error protegido enviando por WebSocket:', err.message);
  }
  return false;
}

function getConfigPath() {
  const isPackaged = app && app.isPackaged;
  if (!isPackaged) {
    const rootCfg = path.join(__dirname, '..', '..', 'remote-support-config.json');
    if (fs.existsSync(rootCfg)) {
      return rootCfg;
    }
  }
  const baseDir = app && typeof app.getPath === 'function'
    ? app.getPath('userData')
    : path.join(__dirname, '..', '..');
  return path.join(baseDir, 'remote-support-config.json');
}

function generateRandomPin() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DH-${digits}`;
}

function loadConfig() {
  const cfgPath = getConfigPath();
  const cleanHost = (os.hostname() || 'caja').toLowerCase().replace(/[^a-z0-9]/g, '');
  const defaultCfg = {
    enabled: true,
    branchName: `Panadería Dulce Horno (${os.hostname() || 'Sucursal'})`,
    branchId: `dh-${cleanHost}`,
    relayUrl: process.env.RELAY_URL || 'ws://127.0.0.1:4800',
    sessionPin: generateRandomPin(),
    allowRemoteSql: true,
    allowRemoteBackups: true,
    lastConnected: null
  };

  try {
    if (fs.existsSync(cfgPath)) {
      const data = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      config = { ...defaultCfg, ...data };
      if (process.env.RELAY_URL) config.relayUrl = process.env.RELAY_URL;
      if (!config.sessionPin) config.sessionPin = generateRandomPin();
      return config;
    }
  } catch (err) {
    console.warn('[RemoteAgent] Aviso cargando configuración, usando valores por defecto:', err.message);
  }

  config = defaultCfg;
  saveConfig(config);
  return config;
}

function saveConfig(newConfig) {
  try {
    const cfgPath = getConfigPath();
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(cfgPath, JSON.stringify(newConfig, null, 2), 'utf8');
    config = newConfig;
  } catch (err) {
    console.error('[RemoteAgent] Error guardando configuración:', err.message);
  }
}

async function handleRemoteAction(action, payload) {
  if (!config) config = loadConfig();
  const start = performance.now();
  switch (action) {
    case 'ping': {
      return { pong: true, timestamp: Date.now() };
    }

    case 'sql_query': {
      if (!config.allowRemoteSql) {
        throw new Error('La ejecución de consultas remotas está desactivada por el gerente en esta sucursal.');
      }
      const queryStr = String(payload?.query || '').trim();
      if (!queryStr) throw new Error('Consulta SQL vacía.');

      // Guardia contra destrucción de base de datos
      if (/drop\s+database/i.test(queryStr) || /truncate\s+database/i.test(queryStr)) {
        throw new Error('Comando bloqueado: no se permite eliminar la base de datos completa vía soporte remoto.');
      }

      const results = await db.query(queryStr);
      const executionTimeMs = Number((performance.now() - start).toFixed(2));

      if (Array.isArray(results)) {
        const columns = results.length > 0 ? Object.keys(results[0]) : [];
        return {
          success: true,
          isSelect: true,
          rows: results.slice(0, 250),
          totalRows: results.length,
          columns,
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
    }

    case 'system_health': {
      let dbPingMs = null;
      let dbVersion = 'Desconocida';
      let dbTables = [];
      let dbTotalSizeMB = '0.00';
      let spList = [];
      let triggersList = [];
      let currentDbName = 'panaderia';

      try {
        const dbNameRes = await db.query('SELECT DATABASE() as dbName');
        currentDbName = dbNameRes[0]?.dbName || 'panaderia';

        const versionRes = await db.query('SELECT VERSION() as version');
        dbVersion = versionRes[0]?.version || 'MySQL 8.0';
        dbPingMs = Number((performance.now() - start).toFixed(2));

        const tablesRes = await db.query(`
          SELECT 
            TABLE_NAME as tableName, 
            TABLE_ROWS as tableRows, 
            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as sizeKB,
            CREATE_TIME as createTime,
            UPDATE_TIME as updateTime
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
        `);
        dbTables = tablesRes || [];
        const totalKB = dbTables.reduce((acc, t) => acc + (Number(t.sizeKB) || 0), 0);
        dbTotalSizeMB = (totalKB / 1024).toFixed(2);

        const spRes = await db.query(`
          SELECT ROUTINE_NAME as spName, ROUTINE_TYPE as spType, CREATED as created, LAST_ALTERED as modified
          FROM information_schema.ROUTINES 
          WHERE ROUTINE_SCHEMA = DATABASE()
        `);
        spList = spRes || [];

        const trigRes = await db.query(`
          SELECT TRIGGER_NAME as trigName, EVENT_MANIPULATION as event, EVENT_OBJECT_TABLE as tableName, ACTION_TIMING as timing
          FROM information_schema.TRIGGERS
          WHERE TRIGGER_SCHEMA = DATABASE()
        `);
        triggersList = trigRes || [];
      } catch (err) {
        console.warn('[RemoteAgent] Aviso consultando telemetría:', err.message);
      }

      const mem = process.memoryUsage();
      const cpus = os.cpus() || [];

      return {
        success: true,
        database: {
          status: dbPingMs !== null ? 'ONLINE' : 'ERROR',
          pingMs: dbPingMs,
          version: dbVersion,
          databaseName: currentDbName,
          totalSizeMB: dbTotalSizeMB,
          totalTables: dbTables.length,
          tables: dbTables,
          storedProcedures: spList,
          triggers: triggersList
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          hostname: os.hostname(),
          cpuModel: cpus[0]?.model || 'CPU Genérica',
          cpuCores: cpus.length,
          totalMemMB: (os.totalmem() / (1024 * 1024)).toFixed(0),
          freeMemMB: (os.freemem() / (1024 * 1024)).toFixed(0),
          heapUsedMB: (mem.heapUsed / (1024 * 1024)).toFixed(2),
          heapTotalMB: (mem.heapTotal / (1024 * 1024)).toFixed(2),
          rssMB: (mem.rss / (1024 * 1024)).toFixed(2),
          uptimeSeconds: Math.floor(process.uptime()),
          versions: {
            node: process.versions.node,
            electron: process.versions.electron,
            chrome: process.versions.chrome,
            v8: process.versions.v8
          }
        }
      };
    }

    case 'optimize_db': {
      const candidateTables = [
        'Articulos', 'Categorias', 'Ventas', 'VentaDetalle', 'VentasCanal',
        'MovimientosInventario', 'Empleados', 'Clientes', 'Proveedores',
        'CortesTurno', 'Compras', 'CompraDetalle', 'RecepcionesProveedor',
        'RecepcionProveedorDetalle', 'DevolucionesCliente', 'DevolucionClienteDetalle'
      ];
      let tables = candidateTables;
      try {
        const existingRes = await db.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
        if (Array.isArray(existingRes) && existingRes.length > 0) {
          const lowerMap = new Map(existingRes.map((r) => [r.TABLE_NAME.toLowerCase(), r.TABLE_NAME]));
          tables = candidateTables.filter((t) => lowerMap.has(t.toLowerCase())).map((t) => lowerMap.get(t.toLowerCase()));
        }
      } catch (_) {}

      const results = [];
      for (const t of tables) {
        try {
          const opt = await db.query(`OPTIMIZE TABLE ${t}`);
          results.push({ table: t, status: opt[0]?.Msg_text || 'OK', success: true });
        } catch (e) {
          results.push({ table: t, status: e.message, success: false });
        }
      }
      return { success: true, results };
    }

    case 'export_backup': {
      if (!config.allowRemoteBackups) {
        throw new Error('La exportación de respaldos remotos está restringida por el cliente.');
      }
      const candidateTables = [
        'Empleados', 'Clientes', 'Proveedores', 'Categorias', 'Articulos',
        'Ventas', 'VentaDetalle', 'VentasCanal', 'MovimientosInventario',
        'CortesTurno', 'Compras', 'CompraDetalle', 'RecepcionesProveedor',
        'RecepcionProveedorDetalle', 'DevolucionesCliente', 'DevolucionClienteDetalle'
      ];
      let tables = candidateTables;
      let activeDb = 'panaderia';
      try {
        const dbNameRes = await db.query('SELECT DATABASE() as dbName');
        if (dbNameRes[0]?.dbName) activeDb = dbNameRes[0].dbName;

        const existingRes = await db.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
        if (Array.isArray(existingRes) && existingRes.length > 0) {
          const lowerMap = new Map(existingRes.map((r) => [r.TABLE_NAME.toLowerCase(), r.TABLE_NAME]));
          tables = candidateTables.filter((t) => lowerMap.has(t.toLowerCase())).map((t) => lowerMap.get(t.toLowerCase()));
        }
      } catch (_) {}

      const backupData = {
        app: 'Panadería Dulce Horno POS',
        type: 'REMOTE_SUPPORT_SNAPSHOT',
        timestamp: new Date().toISOString(),
        branchName: config.branchName,
        branchId: config.branchId,
        database: activeDb,
        totalTables: tables.length,
        tables: {}
      };

      for (const t of tables) {
        try {
          const rows = await db.query(`SELECT * FROM ${t}`);
          backupData.tables[t] = rows;
        } catch (_) {
          backupData.tables[t] = [];
        }
      }
      return { success: true, backup: backupData };
    }

    case 'cambiar_password': {
      const { usernameProgramador, passwordProgramador, usuarioObjetivo, passwordNuevo } = payload || {};
      if (!usernameProgramador || !passwordProgramador || !usuarioObjetivo || !passwordNuevo) {
        throw new Error('Credenciales o campos incompletos para cambio de contraseña.');
      }
      const progRows = await db.query(
        "SELECT IdEmpleado, Password FROM Empleados WHERE NombreUsuario = ? AND Rol = 'Programador' AND Activo = TRUE",
        [usernameProgramador]
      );
      if (!progRows.length || !db.verifyPassword(passwordProgramador, progRows[0].Password)) {
        throw new Error('Acceso denegado: credenciales del programador incorrectas.');
      }
      const nuevoHash = db.hashPassword(passwordNuevo);
      await db.query('CALL sp_programador_cambiar_password(?, ?, ?)', [progRows[0].IdEmpleado, usuarioObjetivo, nuevoHash]);
      return { success: true, message: `Contraseña de ${usuarioObjetivo} actualizada remotamente mediante Stored Procedure.` };
    }

    case 'agregar_gerente': {
      const p = payload || {};
      const progRows = await db.query(
        "SELECT IdEmpleado, Password FROM Empleados WHERE NombreUsuario = ? AND Rol = 'Programador' AND Activo = TRUE",
        [p.usernameProgramador]
      );
      if (!progRows.length || !db.verifyPassword(p.passwordProgramador, progRows[0].Password)) {
        throw new Error('Acceso denegado: credenciales del programador incorrectas.');
      }
      const hash = db.hashPassword(p.password);
      await db.query(
        `CALL AgregarEmpleadoPorProgramador(?, ?, ?, ?, 'Gerente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.usernameProgramador,
          progRows[0].Password,
          p.username,
          hash,
          p.puesto || 'Gerente Sucursal',
          p.turno || 'Any',
          p.salario ?? 0,
          p.nombre,
          p.apellidoPaterno,
          p.apellidoMaterno || null,
          p.genero || 'Prefiero no decir',
          p.fechaNacimiento || null,
          p.calle || null,
          p.numeroExterior || null,
          p.numeroInterior || null,
          p.colonia || null,
          p.ciudad || null,
          p.estado || null,
          p.codigoPostal || null,
          p.pais || 'México'
        ]
      );
      return { success: true, message: `Gerente ${p.username} registrado remotamente exitosamente.` };
    }

    case 'get_license_info': {
      const lic = await getLicenseDetails();
      return { success: true, license: lic };
    }

    case 'activate_terminal_license': {
      const p = payload || {};
      const token = String(p.token || '').trim();
      const nombreNegocio = String(p.nombreNegocio || 'Panadería Dulce Horno').trim();
      const nombreGerente = String(p.nombreGerente || '').trim();
      const usuarioGerente = String(p.usuarioGerente || '').trim();
      const passwordGerente = String(p.passwordGerente || '').trim();
      const tipoLicencia = String(p.tipoLicencia || 'Comercial Pro Vitalicia').trim();

      if (!token) throw new Error('El token de activación no puede estar vacío.');
      if (!usuarioGerente) throw new Error('El usuario del Gerente no puede estar vacío.');
      if (!passwordGerente) throw new Error('La contraseña del Gerente no puede estar vacía.');

      // 1. Guardar o actualizar registro de licencia
      await db.query(`
        INSERT INTO LicenciaSistema (TokenActivacion, NombreNegocio, Propietario, TipoLicencia, Estado, FechaActivacion, ActivadoPor)
        VALUES (?, ?, ?, ?, 'Activa', NOW(), 'Central Hub Remoto')
        ON DUPLICATE KEY UPDATE
          NombreNegocio = VALUES(NombreNegocio),
          Propietario = VALUES(Propietario),
          TipoLicencia = VALUES(TipoLicencia),
          Estado = 'Activa',
          FechaActivacion = NOW(),
          ActivadoPor = 'Central Hub Remoto'
      `, [token, nombreNegocio, nombreGerente || usuarioGerente, tipoLicencia]);

      // 2. Hashear contraseña y registrar Gerente en Empleados
      const passHash = db.hashPassword(passwordGerente);
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

      // 3. Actualizar configuración de la sucursal
      config.branchName = nombreNegocio;
      saveConfig(config);

      // 4. Notificar a todas las ventanas de la aplicación en tiempo real
      try {
        const { BrowserWindow } = require('electron');
        const wins = BrowserWindow.getAllWindows();
        for (const win of wins) {
          if (!win.isDestroyed()) {
            win.webContents.send('terminal-activated', {
              token,
              nombreNegocio,
              usuarioGerente,
              nombreGerente: nombreGerente || usuarioGerente
            });
          }
        }
      } catch (_) {}

      // 5. Re-notificar al broker con la información de activación actualizada
      if (ws && ws.readyState === WebSocket.OPEN) {
        const version = app && typeof app.getVersion === 'function' ? app.getVersion() : '1.1.0';
        safeWsSend(ws, {
          type: 'register_branch',
          branchId: config.branchId,
          branchName: config.branchName,
          sessionPin: config.sessionPin,
          version,
          license: {
            isActivated: true,
            token,
            nombreNegocio,
            propietario: nombreGerente || usuarioGerente,
            gerenteUsuario: usuarioGerente,
            gerenteNombre: nombreGerente || usuarioGerente,
            tipoLicencia
          },
          system: {
            platform: process.platform,
            hostname: os.hostname(),
            uptime: Math.floor(process.uptime()),
            isActivated: true
          }
        });
      }

      console.log(`[RemoteAgent] ¡Licencia activada con éxito! Token: ${token} - Negocio: ${nombreNegocio} - Gerente: ${usuarioGerente}`);
      return {
        success: true,
        message: `Licencia activada exitosamente para "${nombreNegocio}". Gerente titular "${usuarioGerente}" registrado y habilitado.`,
        token,
        nombreNegocio,
        usuarioGerente
      };
    }

    case 'modify_license': {
      const p = payload || {};
      const nombreNegocio = String(p.nombreNegocio || '').trim();
      const propietario = String(p.propietario || p.titular || '').trim();
      const tipoLicencia = String(p.tipoLicencia || '').trim();
      const fechaExpiracion = p.fechaExpiracion !== undefined ? (p.fechaExpiracion ? p.fechaExpiracion : null) : undefined;
      const notas = p.notas !== undefined ? (p.notas ? String(p.notas).trim() : null) : undefined;
      const nuevoToken = (p.nuevoToken || p.token) ? String(p.nuevoToken || p.token).trim() : null;

      const updates = [];
      const params = [];
      if (nombreNegocio) { updates.push('NombreNegocio = ?'); params.push(nombreNegocio); }
      if (propietario) { updates.push('Propietario = ?'); params.push(propietario); }
      if (tipoLicencia) { updates.push('TipoLicencia = ?'); params.push(tipoLicencia); }
      if (fechaExpiracion !== undefined) { updates.push('FechaExpiracion = ?'); params.push(fechaExpiracion); }
      if (notas !== undefined) { updates.push('Notas = ?'); params.push(notas); }
      if (nuevoToken) { updates.push('TokenActivacion = ?'); params.push(nuevoToken); }

      if (updates.length > 0) {
        await db.query(`UPDATE LicenciaSistema SET ${updates.join(', ')} ORDER BY IdLicencia DESC LIMIT 1`, params);
      }

      if (nombreNegocio) {
        config.branchName = nombreNegocio;
        saveConfig(config);
      }

      broadcastLicenseChangeToWindows('license-modified', { nombreNegocio, tipoLicencia, fechaExpiracion, nuevoToken });
      await reRegisterWithBroker();

      return {
        success: true,
        message: `Licencia de "${nombreNegocio || config.branchName}" actualizada exitosamente.`,
        nombreNegocio: nombreNegocio || config.branchName,
        tipoLicencia,
        token: nuevoToken
      };
    }

    case 'revoke_license': {
      const motivo = String(payload?.motivo || 'Licencia suspendida por administración o falta de pago.').trim();

      await db.query(`
        UPDATE LicenciaSistema 
        SET Estado = 'Suspendida', MotivoSuspension = ? 
        ORDER BY IdLicencia DESC LIMIT 1
      `, [motivo]);

      // Desactivar temporalmente al Gerente en Empleados para forzar bloqueo
      await db.query("UPDATE Empleados SET Activo = FALSE WHERE Rol = 'Gerente'");

      broadcastLicenseChangeToWindows('license-revoked', { motivo });
      await reRegisterWithBroker();

      console.log(`[RemoteAgent] ⛔ Licencia revocada. Motivo: ${motivo}`);
      return {
        success: true,
        message: `Licencia suspendida exitosamente. Motivo: "${motivo}". La terminal ha sido bloqueada.`,
        motivo
      };
    }

    case 'reactivate_license': {
      const notas = String(payload?.notas || 'Reactivación autorizada desde Central Hub').trim();

      await db.query(`
        UPDATE LicenciaSistema 
        SET Estado = 'Activa', MotivoSuspension = NULL, Notas = COALESCE(CONCAT(COALESCE(Notas, ''), ' | ', ?), ?)
        ORDER BY IdLicencia DESC LIMIT 1
      `, [notas, notas]);

      // Reactivar al Gerente
      await db.query("UPDATE Empleados SET Activo = TRUE WHERE Rol = 'Gerente'");

      const lic = await getLicenseDetails();
      broadcastLicenseChangeToWindows('license-reactivated', { ...lic });
      await reRegisterWithBroker();

      console.log(`[RemoteAgent] ✅ Licencia reactivada para "${lic.nombreNegocio}"`);
      return {
        success: true,
        message: `Licencia reactivada exitosamente para "${lic.nombreNegocio}". Terminal desbloqueada.`,
        license: lic
      };
    }

    case 'change_manager_password': {
      const p = payload || {};
      const usuarioGerente = String(p.usuarioGerente || '').trim();
      const nuevoPassword = String(p.nuevoPassword || '').trim();

      if (!nuevoPassword) throw new Error('La nueva contraseña no puede estar vacía.');

      let targetUser = usuarioGerente;
      if (!targetUser) {
        const gerRows = await db.query("SELECT NombreUsuario FROM Empleados WHERE Rol = 'Gerente' LIMIT 1");
        if (!gerRows.length) throw new Error('No existe ningún Gerente registrado en esta terminal.');
        targetUser = gerRows[0].NombreUsuario;
      }

      const passHash = db.hashPassword(nuevoPassword);
      const res = await db.query(
        "UPDATE Empleados SET Password = ?, Activo = TRUE WHERE NombreUsuario = ? AND Rol = 'Gerente'",
        [passHash, targetUser]
      );

      if (res.affectedRows === 0) {
        await db.query("UPDATE Empleados SET Password = ?, Activo = TRUE WHERE Rol = 'Gerente' LIMIT 1", [passHash]);
      }

      broadcastLicenseChangeToWindows('manager-password-changed', {
        usuarioGerente: targetUser,
        mensaje: 'La contraseña del Gerente ha sido actualizada por soporte central.'
      });

      console.log(`[RemoteAgent] 🔑 Contraseña del Gerente "${targetUser}" actualizada exitosamente.`);
      return {
        success: true,
        message: `Contraseña del Gerente "${targetUser}" actualizada exitosamente.`,
        usuarioGerente: targetUser,
        nuevoPassword
      };
    }

    default:
      throw new Error(`Acción remota desconocida o no implementada: "${action}"`);
  }
}

function broadcastLicenseChangeToWindows(channel, payload) {
  try {
    const { BrowserWindow } = require('electron');
    const wins = BrowserWindow.getAllWindows();
    for (const win of wins) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    }
  } catch (_) {}
}

async function reRegisterWithBroker() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      const version = app && typeof app.getVersion === 'function' ? app.getVersion() : '1.1.0';
      const lic = await getLicenseDetails();
      ws.send(JSON.stringify({
        type: 'register_branch',
        branchId: config.branchId,
        branchName: lic.nombreNegocio || config.branchName,
        sessionPin: config.sessionPin,
        version,
        license: {
          isActivated: lic.isActivated,
          isSuspended: lic.isSuspended,
          estado: lic.estado,
          token: lic.token,
          nombreNegocio: lic.nombreNegocio,
          propietario: lic.propietario,
          gerenteUsuario: lic.gerenteUsuario,
          gerenteNombre: lic.gerenteNombre,
          tipoLicencia: lic.tipoLicencia,
          fechaActivacion: lic.fechaActivacion,
          fechaExpiracion: lic.fechaExpiracion,
          motivoSuspension: lic.motivoSuspension
        },
        system: {
          platform: process.platform,
          hostname: os.hostname(),
          uptime: Math.floor(process.uptime()),
          isActivated: lic.isActivated,
          estadoLicencia: lic.estado
        }
      }));
    } catch (_) {}
  }
}

function generateStructuredToken(tier = 'PRO', branchId = '') {
  const cleanTier = String(tier || 'PRO').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'PRO';
  const year = new Date().getFullYear();
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rawKey = `${branchId || 'dh'}:${cleanTier}:${p1}:${p2}:${Date.now()}`;
  const chk = require('crypto').createHash('sha256').update(rawKey).digest('hex').substring(0, 4).toUpperCase();
  return `DH-${cleanTier}-${year}-${p1}-${p2}-${chk}`;
}

async function getLicenseDetails() {
  try {
    const licRows = await db.query("SELECT * FROM LicenciaSistema ORDER BY IdLicencia DESC LIMIT 1");
    const gerRows = await db.query("SELECT IdEmpleado, NombreUsuario, NombreCompleto, Activo FROM Empleados WHERE Rol = 'Gerente' LIMIT 1");

    const lic = licRows[0] || null;
    const ger = gerRows[0] || null;

    const estado = lic ? String(lic.Estado || 'Pendiente') : 'Pendiente';
    const isSuspended = estado === 'Suspendida' || estado === 'Revocada' || Boolean(ger && !ger.Activo && estado !== 'Pendiente');
    const isActivated = estado === 'Activa' && Boolean(ger && ger.Activo) && !isSuspended;

    return {
      isActivated,
      isSuspended,
      estado,
      token: lic?.TokenActivacion || null,
      nombreNegocio: lic?.NombreNegocio || (config ? config.branchName : 'Panadería Dulce Horno'),
      propietario: lic?.Propietario || ger?.NombreCompleto || null,
      tipoLicencia: lic?.TipoLicencia || 'Comercial Pro Vitalicia',
      fechaActivacion: lic?.FechaActivacion || null,
      fechaExpiracion: lic?.FechaExpiracion || null,
      motivoSuspension: lic?.MotivoSuspension || null,
      gerenteUsuario: ger?.NombreUsuario || null,
      gerenteNombre: ger?.NombreCompleto || null,
      gerenteActivo: ger ? Boolean(ger.Activo) : false,
      notas: lic?.Notas || null
    };
  } catch (_) {
    return {
      isActivated: false,
      isSuspended: false,
      estado: 'Pendiente',
      token: null,
      nombreNegocio: config ? config.branchName : 'Panadería Dulce Horno',
      gerenteUsuario: null
    };
  }
}

function connectToRelay() {
  if (!config) loadConfig();
  if (!config.enabled) {
    console.log('[RemoteAgent] El soporte remoto está deshabilitado en configuración local.');
    return;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    let targetUrl = (process.env.RELAY_URL || config.relayUrl || 'ws://127.0.0.1:4800').trim();
    if (targetUrl.startsWith('https://')) targetUrl = targetUrl.replace(/^https:\/\//, 'wss://');
    if (targetUrl.startsWith('http://')) targetUrl = targetUrl.replace(/^http:\/\//, 'ws://');
    if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
      targetUrl = `wss://${targetUrl}`;
    }
    console.log(`[RemoteAgent] Conectando al broker de soporte en ${targetUrl}...`);
    const currentWs = new WebSocket(targetUrl);
    ws = currentWs;

    currentWs.on('open', async () => {
      try {
        if (!currentWs || currentWs.readyState !== WebSocket.OPEN) return;
        isConnected = true;
        console.log('[RemoteAgent] Conectado al broker. Registrando sucursal...');

        const version = app && typeof app.getVersion === 'function' ? app.getVersion() : '1.1.0';
        const lic = await getLicenseDetails();

        safeWsSend(currentWs, {
          type: 'register_branch',
          branchId: config.branchId,
          branchName: lic.nombreNegocio || config.branchName,
          sessionPin: config.sessionPin,
          version,
          license: {
            isActivated: lic.isActivated,
            isSuspended: lic.isSuspended,
            estado: lic.estado,
            token: lic.token,
            nombreNegocio: lic.nombreNegocio,
            propietario: lic.propietario,
            gerenteUsuario: lic.gerenteUsuario,
            gerenteNombre: lic.gerenteNombre,
            tipoLicencia: lic.tipoLicencia,
            fechaActivacion: lic.fechaActivacion,
            fechaExpiracion: lic.fechaExpiracion,
            motivoSuspension: lic.motivoSuspension
          },
          system: {
            platform: process.platform,
            hostname: os.hostname(),
            uptime: Math.floor(process.uptime()),
            isActivated: lic.isActivated,
            estadoLicencia: lic.estado
          }
        });

        // Iniciar heartbeat cada 15 segundos
        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          try {
            if (ws === currentWs && currentWs.readyState === WebSocket.OPEN) {
              safeWsSend(currentWs, { type: 'ping', timestamp: Date.now() });
            }
          } catch (_) {}
        }, 15000);
        if (pingInterval.unref) pingInterval.unref();
      } catch (err) {
        console.warn('[RemoteAgent] Error durante registro inicial:', err.message);
      }
    });

    currentWs.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'registered_ack') {
          console.log(`[RemoteAgent] Registro confirmado. ID: ${data.branchId} - PIN: ${config.sessionPin}`);
          config.lastConnected = new Date().toISOString();
          saveConfig(config);
          return;
        }

        if (data.type === 'execute_action') {
          const { commandId, action, payload } = data;
          console.log(`[RemoteAgent] Ejecutando acción remota solicitada por el Hub: "${action}" (Cmd ID: ${commandId})`);

          try {
            const result = await handleRemoteAction(action, payload);
            safeWsSend(currentWs, {
              type: 'action_result',
              commandId,
              success: true,
              result
            });
          } catch (execErr) {
            console.error(`[RemoteAgent] Error ejecutando acción remota "${action}":`, execErr.message);
            safeWsSend(currentWs, {
              type: 'action_result',
              commandId,
              success: false,
              error: execErr.message
            });
          }
        }
      } catch (parseErr) {
        console.warn('[RemoteAgent] Error procesando mensaje entrante:', parseErr.message);
      }
    });

    currentWs.on('close', () => {
      if (ws === currentWs) {
        isConnected = false;
        clearInterval(pingInterval);
        ws = null;
        scheduleReconnect();
      }
    });

    currentWs.on('error', (err) => {
      console.warn('[RemoteAgent] Aviso de WebSocket con el broker:', err.message);
      if (ws === currentWs) {
        isConnected = false;
        clearInterval(pingInterval);
        try { currentWs.close(); } catch (_) {}
        ws = null;
        scheduleReconnect();
      }
    });
  } catch (err) {
    ws = null;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    connectToRelay();
  }, 2500);
}

function initRemoteAgent() {
  loadConfig();
  // Conectar rápidamente al broker de soporte
  setTimeout(() => {
    connectToRelay();
  }, 400);
}

function getRemoteAgentStatus() {
  if (!config) loadConfig();
  return {
    connected: isConnected,
    enabled: config.enabled,
    branchName: config.branchName,
    branchId: config.branchId,
    sessionPin: config.sessionPin,
    relayUrl: config.relayUrl,
    lastConnected: config.lastConnected,
    allowRemoteSql: config.allowRemoteSql,
    allowRemoteBackups: config.allowRemoteBackups
  };
}

function updateRemoteAgentConfig(newSettings = {}) {
  const current = config || loadConfig();
  const updated = {
    ...current,
    ...newSettings
  };
  saveConfig(updated);

  // Si cambiaron la URL o el estado, reconectar
  if (ws) {
    try {
      ws.close();
    } catch (_) {}
  }
  if (updated.enabled) {
    connectToRelay();
  }

  return getRemoteAgentStatus();
}

function regenerateSessionPin() {
  const current = config || loadConfig();
  current.sessionPin = generateRandomPin();
  saveConfig(current);
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Re-registrar con el nuevo pin
    safeWsSend(ws, {
      type: 'register_branch',
      branchId: current.branchId,
      branchName: current.branchName,
      sessionPin: current.sessionPin,
      version: app && typeof app.getVersion === 'function' ? app.getVersion() : '1.1.0'
    });
  }
  return current.sessionPin;
}

module.exports = {
  initRemoteAgent,
  getRemoteAgentStatus,
  updateRemoteAgentConfig,
  regenerateSessionPin,
  getLicenseDetails,
  generateStructuredToken,
  handleRemoteAction
};
