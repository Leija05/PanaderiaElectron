const { ipcMain, dialog, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database.js');
const updater = require('./updater.js');
const { generateExecutiveExcel } = require('./excelService.js');

const DEFAULT_BOLILLO_WEIGHT_KG = 0.065;

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    nombre: parts.slice(0, Math.max(1, parts.length - 2)).join(' ') || parts[0] || '',
    apellidoPaterno: parts.length > 1 ? parts[parts.length - 2] : '',
    apellidoMaterno: parts.length > 2 ? parts[parts.length - 1] : ''
  };
}

function buildFullName(data = {}) {
  return [data.nombre, data.apellidoPaterno, data.apellidoMaterno]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
}

function sanitizeChannel(channel) {
  return channel === 'Autocobro' ? 'Autocobro' : channel === 'CajaEmpleado' ? 'CajaEmpleado' : 'SinClasificar';
}

function normalizeDate(value, { endOfDay = false } = {}) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new Error('Fecha inválida.');
  }

  if (endOfDay) {
    base.setHours(23, 59, 59, 999);
  } else {
    base.setHours(0, 0, 0, 0);
  }

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  const hours = String(base.getHours()).padStart(2, '0');
  const minutes = String(base.getMinutes()).padStart(2, '0');
  const seconds = String(base.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatSqlDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatLocalSqlDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida.');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generarFolio(prefix) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${yyyy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
}

async function resolveReportRange(filters = {}) {
  const mode = filters.mode || 'weekly';
  const reference = filters.referenceDate ? new Date(filters.referenceDate) : new Date();

  if (Number.isNaN(reference.getTime())) {
    throw new Error('Fecha de referencia inválida.');
  }

  const start = new Date(reference);
  const end = new Date(reference);

  if (mode === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (mode === 'custom') {
    return {
      start: normalizeDate(filters.startDate),
      end: normalizeDate(filters.endDate || filters.startDate, { endOfDay: true })
    };
  } else {
    const day = start.getDay();
    const diffToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  return {
    start: normalizeDate(start),
    end: normalizeDate(end, { endOfDay: true })
  };
}

async function getManagerByCredentials(username, password) {
  const rows = await db.query(
    `SELECT IdEmpleado, NombreCompleto, NombreUsuario, Password, Rol, Activo
     FROM Empleados
     WHERE NombreUsuario = ? AND Rol = 'Gerente'`,
    [username]
  );

  if (!rows.length) {
    throw new Error('Las credenciales del gerente no son válidas.');
  }

  const manager = rows[0];
  if (!db.verifyPassword(password, manager.Password)) {
    throw new Error('Contraseña de gerente incorrecta.');
  }

  if (!manager.Activo) {
    throw new Error('El gerente seleccionado está desactivado.');
  }

  const safe = { ...manager };
  delete safe.Password;
  return safe;
}

async function getLastCutRange({ channel, idEmpleado = null, idCliente = null }) {
  const rows = await db.query(
    `SELECT FechaFin
     FROM CortesTurno
     WHERE Canal = ?
       AND ((IdEmpleado IS NULL AND ? IS NULL) OR IdEmpleado = ?)
       AND ((IdCliente IS NULL AND ? IS NULL) OR IdCliente = ?)
     ORDER BY FechaFin DESC
     LIMIT 1`,
    [channel, idEmpleado, idEmpleado, idCliente, idCliente]
  );

  if (rows.length) {
    return rows[0].FechaFin;
  }

  const salesRows = await db.query(
    `SELECT MIN(v.FechaVenta) AS PrimeraVenta
     FROM Ventas v
     LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
     WHERE COALESCE(vc.Canal, 'SinClasificar') = ?
       AND ((v.IdEmpleado IS NULL AND ? IS NULL) OR v.IdEmpleado = ?)
       AND ((v.IdCliente IS NULL AND ? IS NULL) OR v.IdCliente = ?)`,
    [channel, idEmpleado, idEmpleado, idCliente, idCliente]
  );

  return salesRows[0]?.PrimeraVenta || formatLocalSqlDateTime(new Date());
}

async function registrarClienteVenta(datosCliente = {}) {
  const nombreCompleto = buildFullName(datosCliente);
  if (!nombreCompleto) return null;

  const usernameBase = `cliente_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const empleadoResult = await db.query(
    `INSERT INTO Empleados
     (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento)
     VALUES (?, ?, 'Cliente', 'Cliente', 'Any', 0.00, ?, ?, ?, ?, ?, ?)`,
    [
      usernameBase,
      db.hashPassword(Math.random().toString(36).slice(2, 12)),
      nombreCompleto,
      datosCliente.nombre || null,
      datosCliente.apellidoPaterno || null,
      datosCliente.apellidoMaterno || null,
      datosCliente.genero || null,
      datosCliente.fechaNacimiento || null
    ]
  );

  const idCliente = empleadoResult.insertId;
  await db.query(
    `INSERT INTO Clientes
     (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      idCliente,
      datosCliente.nombre || null,
      datosCliente.apellidoPaterno || null,
      datosCliente.apellidoMaterno || null,
      datosCliente.genero || null,
      datosCliente.fechaNacimiento || null,
      nombreCompleto
    ]
  );

  return idCliente;
}

async function eliminarEmpleadoSeguro(idEmpleado) {
  const rows = await db.query('SELECT IdEmpleado, Rol FROM Empleados WHERE IdEmpleado = ?', [idEmpleado]);
  if (!rows.length) {
    throw new Error('Empleado no encontrado');
  }

  const empleado = rows[0];
  if (empleado.Rol === 'Gerente') {
    const gerentes = await db.query('SELECT COUNT(*) AS totalGerentes FROM Empleados WHERE Rol = "Gerente" AND Activo = 1');
    if (gerentes[0].totalGerentes <= 1) {
      throw new Error('No se puede eliminar el único gerente del sistema');
    }
  }

  await db.beginTransaction();
  try {
    const [ventas, compras, envios, movimientos] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM Ventas WHERE IdEmpleado = ?', [idEmpleado]),
      db.query('SELECT COUNT(*) AS count FROM Compras WHERE IdEmpleado = ?', [idEmpleado]),
      db.query('SELECT COUNT(*) AS count FROM Envios WHERE IdEmpleadoRepartidor = ?', [idEmpleado]),
      db.query('SELECT COUNT(*) AS count FROM MovimientosInventario WHERE IdEmpleado = ?', [idEmpleado])
    ]);

    const tieneRelaciones =
      ventas[0].count > 0 ||
      compras[0].count > 0 ||
      envios[0].count > 0 ||
      movimientos[0].count > 0;

    if (tieneRelaciones) {
      await db.query('UPDATE Empleados SET Activo = FALSE WHERE IdEmpleado = ?', [idEmpleado]);
      await db.commit();
      return {
        ok: true,
        idEmpleado,
        message: 'Usuario desactivado (tenía registros relacionados)',
        tipo: 'desactivacion'
      };
    }

    await db.query('DELETE FROM Empleados WHERE IdEmpleado = ?', [idEmpleado]);
    await db.commit();
    return {
      ok: true,
      idEmpleado,
      message: 'Usuario eliminado permanentemente',
      tipo: 'eliminacion'
    };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function obtenerDetalleRecepcion(idRecepcion) {
  const headers = await db.query(
    `SELECT rp.*, p.Nombre AS NombreProveedor, e.NombreCompleto AS NombreEmpleado
     FROM RecepcionesProveedor rp
     JOIN Proveedores p ON p.IdProveedor = rp.IdProveedor
     LEFT JOIN Empleados e ON e.IdEmpleado = rp.IdEmpleado
     WHERE rp.IdRecepcion = ?`,
    [idRecepcion]
  );
  if (!headers.length) throw new Error('Recepción no encontrada.');

  const detalles = await db.query(
    `SELECT rd.*, a.Nombre AS NombreProducto
     FROM RecepcionProveedorDetalle rd
     JOIN Articulos a ON a.IdArticulo = rd.IdArticulo
     WHERE rd.IdRecepcion = ?`,
    [idRecepcion]
  );

  return { ...headers[0], detalles };
}

function registerIpcHandlers() {
  // ============================================
  // Actualizaciones
  // ============================================
  ipcMain.handle('getUpdateStatus', async () => updater.getUpdateState());
  ipcMain.handle('retryUpdateCheck', async () => {
    await updater.checkForAppUpdates();
    return updater.getUpdateState();
  });
  ipcMain.handle('installPendingUpdate', async () => updater.installPendingUpdate());

  // ============================================
  // Ventas y Catálogo
  // ============================================
  ipcMain.handle('getVentas', async () => db.query('SELECT * FROM Ventas ORDER BY FechaVenta DESC'));

  ipcMain.handle('getDetallesVenta', async (event, idVenta) => {
    const ventas = await db.query('SELECT * FROM Ventas WHERE IdVenta = ?', [idVenta]);
    if (!ventas.length) {
      throw new Error('No se encontró la venta.');
    }

    const venta = ventas[0];
    const empleados = venta.IdEmpleado
      ? await db.query('SELECT IdEmpleado, NombreCompleto, Turno FROM Empleados WHERE IdEmpleado = ?', [venta.IdEmpleado])
      : [];

    const detalles = await db.query(
      `SELECT vd.IdArticulo, a.Nombre AS NombreProducto, vd.Cantidad, vd.PrecioUnitario, vd.Subtotal
       FROM VentaDetalle vd
       JOIN Articulos a ON vd.IdArticulo = a.IdArticulo
       WHERE vd.IdVenta = ?`,
      [idVenta]
    );

    return {
      Empleado: empleados[0] || { NombreCompleto: 'Autocobro / Sistema' },
      Productos: detalles
    };
  });

  ipcMain.handle('getArticulos', async () => db.query('SELECT * FROM Articulos ORDER BY Nombre ASC'));
  ipcMain.handle('getProductos', async () => db.query('SELECT * FROM Articulos ORDER BY Nombre ASC'));

  // ============================================
  // Autenticación y Seguridad
  // ============================================
  ipcMain.handle('login', async (event, username, password) => {
    const results = await db.query(
      'SELECT * FROM Empleados WHERE NombreUsuario = ?',
      [username]
    );

    if (!results.length) {
      return {
        success: false,
        error: 'Credenciales incorrectas',
        message: 'Usuario o contraseña incorrectos'
      };
    }

    const usuario = results[0];
    const passwordValida = db.verifyPassword(password, usuario.Password);

    if (!passwordValida) {
      return {
        success: false,
        error: 'Credenciales incorrectas',
        message: 'Usuario o contraseña incorrectos'
      };
    }

    if (!usuario.Activo) {
      return {
        success: false,
        error: 'Usuario desactivado',
        message: 'Este usuario ha sido desactivado y no puede acceder al sistema.'
      };
    }

    // NUNCA exponer la contraseña al renderer
    const safeUser = { ...usuario };
    delete safeUser.Password;

    return { success: true, user: safeUser };
  });

  // ============================================
  // Gestión de Usuarios y Personal
  // ============================================
  ipcMain.handle('registrarUsuario', async (event, data) => {
    if (data.usuarioEjecutaRol === 'Gerente' && data.rol !== 'Empleado') {
      throw new Error('Acceso denegado: el Gerente solo puede registrar empleados. Los gerentes se agregan desde Programador.');
    }

    const nombreCompleto = data.name || buildFullName(data);
    const passwordUsuario = String(data.password || '123456');

    const results = await db.query(
      `INSERT INTO Empleados
      (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento,
       Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.username,
        passwordUsuario,
        data.rol,
        data.puesto || null,
        data.turno || null,
        data.salario ?? null,
        nombreCompleto || null,
        data.nombre || null,
        data.apellidoPaterno || null,
        data.apellidoMaterno || null,
        data.genero || null,
        data.fechaNacimiento || null,
        data.calle || null,
        data.numeroExterior || null,
        data.numeroInterior || null,
        data.colonia || null,
        data.ciudad || null,
        data.estado || null,
        data.codigoPostal || null,
        data.pais || 'México'
      ]
    );

    if (data.rol === 'Cliente') {
      await db.query(
        `INSERT IGNORE INTO Clientes
         (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [results.insertId, data.nombre || nombreCompleto || data.username, data.apellidoPaterno || null, data.apellidoMaterno || null, data.genero || 'Prefiero no decir', data.fechaNacimiento || null, nombreCompleto || data.username]
      );
    }

    return { id: results.insertId };
  });

  ipcMain.handle('modificarUsuario', async (event, data) => {
    if (data.usuarioEjecutaRol === 'Gerente' && data.rol !== 'Empleado') {
      throw new Error('Acceso denegado: el Gerente solo puede modificar empleados. Los gerentes se gestionan desde Programador.');
    }

    if (data.usuarioEjecutaRol === 'Programador' && !['Empleado', 'Gerente'].includes(data.rol)) {
      throw new Error('Acceso denegado: el Programador solo puede modificar usuarios con rol Empleado o Gerente desde esta herramienta.');
    }

    const nombreCompleto = data.name || buildFullName(data);
    const result = await db.query(
      `UPDATE Empleados
       SET NombreUsuario = ?, Rol = ?, Puesto = ?, Turno = ?, Salario = ?, NombreCompleto = ?, Nombre = ?, ApellidoPaterno = ?, ApellidoMaterno = ?, Genero = ?, FechaNacimiento = ?,
           Calle = ?, NumeroExterior = ?, NumeroInterior = ?, Colonia = ?, Ciudad = ?, Estado = ?, CodigoPostal = ?, Pais = ?
       WHERE IdEmpleado = ?`,
      [
        data.username,
        data.rol,
        data.puesto,
        data.turno,
        data.salario,
        nombreCompleto,
        data.nombre || null,
        data.apellidoPaterno || null,
        data.apellidoMaterno || null,
        data.genero || null,
        data.fechaNacimiento || null,
        data.calle || null,
        data.numeroExterior || null,
        data.numeroInterior || null,
        data.colonia || null,
        data.ciudad || null,
        data.estado || null,
        data.codigoPostal || null,
        data.pais || 'México',
        data.id
      ]
    );

    if (data.rol === 'Cliente') {
      await db.query(
        `INSERT INTO Clientes (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto, Activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), ApellidoPaterno = VALUES(ApellidoPaterno), ApellidoMaterno = VALUES(ApellidoMaterno),
                                 Genero = VALUES(Genero), FechaNacimiento = VALUES(FechaNacimiento), NombreCompleto = VALUES(NombreCompleto), Activo = TRUE`,
        [data.id, data.nombre || nombreCompleto || data.username, data.apellidoPaterno || null, data.apellidoMaterno || null, data.genero || 'Prefiero no decir', data.fechaNacimiento || null, nombreCompleto || data.username]
      );
    }

    return result;
  });

  ipcMain.handle('deleteUsuario', async (event, idEmpleado) => eliminarEmpleadoSeguro(idEmpleado));
  ipcMain.handle('getEmpleados', async () => db.query('SELECT IdEmpleado, NombreUsuario, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais, FechaRegistro, Activo FROM Empleados ORDER BY Activo DESC, IdEmpleado ASC'));

  ipcMain.handle('getClientes', async () => db.query(
    `SELECT c.IdCliente, c.Nombre, c.ApellidoPaterno, c.ApellidoMaterno, c.Genero, c.FechaNacimiento,
            c.NombreCompleto, c.FechaRegistro, c.Activo,
            GROUP_CONCAT(DISTINCT v.IdVenta ORDER BY v.IdVenta DESC SEPARATOR ', ') AS Ventas,
            GROUP_CONCAT(CONCAT('#', v.IdVenta, ': ', a.Nombre, ' x', vd.Cantidad) ORDER BY v.IdVenta DESC, a.Nombre SEPARATOR ' | ') AS ProductosComprados
     FROM Clientes c
     LEFT JOIN Ventas v ON v.IdCliente = c.IdCliente
     LEFT JOIN VentaDetalle vd ON vd.IdVenta = v.IdVenta
     LEFT JOIN Articulos a ON a.IdArticulo = vd.IdArticulo
     GROUP BY c.IdCliente
     ORDER BY c.FechaRegistro DESC, c.IdCliente DESC`
  ));

  ipcMain.handle('cambiarEstadoUsuario', async (event, idEmpleado, nuevoEstado) => {
    const idNum = Number(idEmpleado);
    const estado = Boolean(nuevoEstado);

    if (Number.isNaN(idNum) || idNum <= 0) {
      throw new Error('ID de empleado inválido.');
    }

    const selectResults = await db.query(
      'SELECT IdEmpleado, NombreCompleto, Rol FROM Empleados WHERE IdEmpleado = ?',
      [idNum]
    );

    if (!selectResults.length) {
      throw new Error('Empleado no encontrado.');
    }

    const empleado = selectResults[0];
    if (empleado.Rol === 'Gerente' && !estado) {
      const countResults = await db.query(
        "SELECT COUNT(*) AS total FROM Empleados WHERE Rol = 'Gerente' AND Activo = 1"
      );

      if (countResults[0].total <= 1) {
        throw new Error('No se puede desactivar el único administrador del sistema.');
      }
    }

    const updateResults = await db.query('UPDATE Empleados SET Activo = ? WHERE IdEmpleado = ?', [estado, idNum]);
    if (!updateResults.affectedRows) {
      throw new Error('No se pudo actualizar el empleado.');
    }

    return {
      success: true,
      message: `Empleado ${empleado.NombreCompleto} ${estado ? 'reactivado' : 'desactivado'} correctamente.`,
      idEmpleado: idNum,
      nuevoEstado: estado
    };
  });

  // ============================================
  // Gestión de Proveedores (¡Bug Corregido!)
  // ============================================
  ipcMain.handle('getProveedores', async () => db.query('SELECT * FROM Proveedores ORDER BY Activo DESC, IdProveedor ASC'));

  ipcMain.handle('registrarProveedor', async (event, data) => {
    const contactoCompleto = [data.contactoNombre, data.contactoApellidoPaterno, data.contactoApellidoMaterno]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ') || data.contacto || null;
    const direccionCompleta = [data.calle, data.numeroExterior, data.numeroInterior, data.colonia, data.ciudad, data.estado, data.codigoPostal, data.pais]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(', ') || data.direccion || null;

    const results = await db.query(
      `INSERT INTO Proveedores
       (Nombre, NombreEmpresa, Direccion, Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais,
        Telefono, Correo, Contacto, ContactoNombre, ContactoApellidoPaterno, ContactoApellidoMaterno, RUC, Activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        data.name,
        data.name,
        direccionCompleta,
        data.calle || null,
        data.numeroExterior || null,
        data.numeroInterior || null,
        data.colonia || null,
        data.ciudad || null,
        data.estado || null,
        data.codigoPostal || null,
        data.pais || 'México',
        data.telefono,
        data.mail,
        contactoCompleto,
        data.contactoNombre || null,
        data.contactoApellidoPaterno || null,
        data.contactoApellidoMaterno || null,
        null
      ]
    );
    return { id: results.insertId };
  });

  ipcMain.handle('cambiarEstadoProveedor', async (event, idProveedor, nuevoEstado) => {
    const idNum = Number(idProveedor);
    const estado = Boolean(nuevoEstado);

    if (Number.isNaN(idNum) || idNum <= 0) {
      throw new Error('ID de proveedor inválido.');
    }

    const selectResults = await db.query(
      'SELECT IdProveedor, Nombre FROM Proveedores WHERE IdProveedor = ?',
      [idNum]
    );

    if (!selectResults.length) {
      throw new Error('Proveedor no encontrado.');
    }

    const proveedor = selectResults[0];
    await db.query('UPDATE Proveedores SET Activo = ? WHERE IdProveedor = ?', [estado, idNum]);

    return {
      success: true,
      message: `Proveedor ${proveedor.Nombre} ${estado ? 'reactivado' : 'desactivado'} correctamente.`,
      idProveedor: idNum,
      nuevoEstado: estado
    };
  });

  // ============================================
  // Herramientas de Programador (Stored Procedures)
  // ============================================
  ipcMain.handle('programadorCambiarPassword', async (event, payload = {}) => {
    const { usernameProgramador, passwordProgramador, usuarioObjetivo, passwordNuevo } = payload;
    if (!usernameProgramador || !passwordProgramador || !usuarioObjetivo || !passwordNuevo) {
      throw new Error('Completa las credenciales del programador, el usuario objetivo y la nueva contraseña.');
    }

    const programadores = await db.query(
      `SELECT IdEmpleado, Password FROM Empleados
       WHERE NombreUsuario = ? AND Rol = 'Programador' AND Activo = TRUE`,
      [usernameProgramador]
    );

    if (!programadores.length || !db.verifyPassword(passwordProgramador, programadores[0].Password)) {
      throw new Error('Solo un programador activo con credenciales válidas puede cambiar contraseñas.');
    }

    const nuevoHash = db.hashPassword(passwordNuevo);
    await db.query('CALL sp_programador_cambiar_password(?, ?, ?)', [programadores[0].IdEmpleado, usuarioObjetivo, nuevoHash]);
    return { success: true, message: `Contraseña de ${usuarioObjetivo} actualizada mediante stored procedure.` };
  });

  ipcMain.handle('programadorAgregarGerente', async (event, payload = {}) => {
    const requiredFields = [
      ['usernameProgramador', 'usuario del programador'],
      ['passwordProgramador', 'contraseña del programador'],
      ['username', 'usuario del gerente'],
      ['password', 'contraseña del gerente'],
      ['nombre', 'nombre(s)'],
      ['apellidoPaterno', 'apellido paterno'],
      ['genero', 'género'],
      ['puesto', 'puesto']
    ];

    const missing = requiredFields
      .filter(([key]) => !String(payload[key] || '').trim())
      .map(([, label]) => label);

    if (missing.length) {
      throw new Error(`Completa: ${missing.join(', ')}.`);
    }

    // Verificar primero la contraseña del programador
    const progRows = await db.query(
      "SELECT IdEmpleado, Password FROM Empleados WHERE NombreUsuario = ? AND Rol = 'Programador' AND Activo = TRUE",
      [payload.usernameProgramador]
    );
    if (!progRows.length || !db.verifyPassword(payload.passwordProgramador, progRows[0].Password)) {
      throw new Error('Acceso denegado: credenciales del programador incorrectas.');
    }

    const gerentePassHash = db.hashPassword(payload.password);

    await db.query(
      `CALL AgregarEmpleadoPorProgramador(?, ?, ?, ?, 'Gerente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.usernameProgramador,
        progRows[0].Password, // usa la clave almacenada para el procedure
        payload.username,
        gerentePassHash,
        payload.puesto,
        payload.turno || 'Any',
        payload.salario ?? 0,
        payload.nombre,
        payload.apellidoPaterno,
        payload.apellidoMaterno || null,
        payload.genero,
        payload.fechaNacimiento || null,
        payload.calle || null,
        payload.numeroExterior || null,
        payload.numeroInterior || null,
        payload.colonia || null,
        payload.ciudad || null,
        payload.estado || null,
        payload.codigoPostal || null,
        payload.pais || 'México'
      ]
    );

    return { success: true, message: 'Gerente registrado correctamente mediante stored procedure.' };
  });

  // ============================================
  // Operaciones de Punto de Venta (Ventas e Inventario)
  // ============================================
  ipcMain.handle('verificarExistencia', async (event, idArticulo, cantidadRequerida) => {
    const results = await db.query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [idArticulo]);
    if (!results.length) {
      throw new Error('Producto no encontrado');
    }

    const producto = results[0];
    const disponible = Number(producto.Cantidad || 0);
    return {
      disponible,
      puedeVender: disponible >= cantidadRequerida,
      producto: producto.Nombre,
      mensaje: disponible >= cantidadRequerida ? 'Disponible' : `Solo hay ${disponible} unidades disponibles`
    };
  });

  ipcMain.handle('registrarVenta', async (event, ventaData) => {
    const {
      idEmpleado = null,
      idCliente = null,
      datosCliente = null,
      canal = idEmpleado ? 'CajaEmpleado' : 'Autocobro',
      carrito = []
    } = ventaData || {};

    if (!carrito.length) {
      throw new Error('El carrito está vacío.');
    }

    await db.beginTransaction();
    try {
      for (const item of carrito) {
        const results = await db.query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [item.id]);
        if (!results.length) {
          throw new Error(`Producto ${item.nombre} no encontrado.`);
        }

        const producto = results[0];
        if (Number(producto.Cantidad) < Number(item.cantidad)) {
          throw new Error(`No hay suficiente existencia de ${producto.Nombre}. Disponible: ${producto.Cantidad}, solicitado: ${item.cantidad}`);
        }
      }

      const subtotal = Number(carrito.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad)), 0).toFixed(2));
      const tasaIva = Number.isFinite(Number(ventaData.tasaIva)) ? Number(ventaData.tasaIva) : 0.16;
      const iva = Number((subtotal * tasaIva).toFixed(2));
      const total = Number((subtotal + iva).toFixed(2));
      let idClienteVenta = idCliente;

      if (datosCliente && buildFullName(datosCliente)) {
        if (canal === 'Autocobro' && !datosCliente.genero) {
          throw new Error('El género del cliente es requerido para autocobro.');
        }
        idClienteVenta = await registrarClienteVenta(datosCliente);
      }

      const ventaResults = await db.query(
        `INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado)
         VALUES (?, ?, ?, ?, ?, 'Mostrador', 'Completada')`,
        [idEmpleado, idClienteVenta, subtotal, iva, total]
      );

      const idVenta = ventaResults.insertId;

      for (const item of carrito) {
        const subtotalItem = Number(item.precio) * Number(item.cantidad);
        await db.query(
          `INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idVenta, item.id, item.cantidad, item.precio, subtotalItem]
        );

        const beforeRows = await db.query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [item.id]);
        const cantidadAnterior = Number(beforeRows[0].Cantidad);
        const cantidadNueva = cantidadAnterior - Number(item.cantidad);

        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.id]);

        await db.query(
          `INSERT INTO MovimientosInventario
           (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado)
           VALUES (?, 'Salida', ?, ?, ?, 'Venta', ?, 'Venta', ?)`,
          [item.id, item.cantidad, cantidadAnterior, cantidadNueva, idVenta, idEmpleado]
        );
      }

      await db.query('INSERT INTO VentasCanal (IdVenta, Canal) VALUES (?, ?)', [idVenta, sanitizeChannel(canal)]);
      await db.commit();

      return {
        success: true,
        idVenta,
        idCliente: idClienteVenta,
        total,
        canal: sanitizeChannel(canal),
        message: 'Venta registrada exitosamente'
      };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  ipcMain.handle('agregarCantidadProducto', async (event, idArticulo, cantidad) => {
    const idNum = Number(idArticulo);
    const cantidadNum = Number(cantidad);

    if (Number.isNaN(idNum) || idNum <= 0) throw new Error('ID de artículo inválido.');
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0) throw new Error('Cantidad inválida. Debe ser un número mayor a 0.');

    const results = await db.query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [idNum]);
    if (!results.length) throw new Error('Artículo no encontrado.');

    const producto = results[0];
    const cantidadActual = Number(producto.Cantidad);
    const nuevaCantidad = cantidadActual + cantidadNum;

    await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, idNum]);

    return {
      success: true,
      message: `Se agregaron ${cantidadNum} unidades al producto "${producto.Nombre}".`,
      cantidadAnterior: cantidadActual,
      cantidadNueva: nuevaCantidad,
      producto: producto.Nombre
    };
  });

  ipcMain.handle('agregarProducto', async (event, productoData) => {
    const { nombre, descripcion, cantidad, minimo, precioVenta, precioCompra } = productoData || {};

    if (!nombre?.trim()) throw new Error('El nombre del producto es requerido.');
    if (!descripcion?.trim()) throw new Error('La descripción del producto es requerida.');
    if (Number.isNaN(Number(cantidad)) || Number(cantidad) < 0) throw new Error('La cantidad debe ser un número válido mayor o igual a 0.');
    if (Number.isNaN(Number(minimo)) || Number(minimo) < 0) throw new Error('El mínimo debe ser un número válido mayor o igual a 0.');
    if (Number.isNaN(Number(precioVenta)) || Number(precioVenta) < 0) throw new Error('El precio de venta debe ser un número válido mayor o igual a 0.');
    if (Number.isNaN(Number(precioCompra)) || Number(precioCompra) < 0) throw new Error('El precio de compra debe ser un número válido mayor o igual a 0.');

    const results = await db.query(
      `INSERT INTO Articulos (Nombre, Descripcion, Cantidad, Minimo, PrecioVenta, PrecioCompra)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), descripcion.trim(), Number(cantidad), Number(minimo), Number(precioVenta), Number(precioCompra)]
    );

    return { success: true, message: 'Producto agregado correctamente.', id: results.insertId };
  });

  ipcMain.handle('eliminarProducto', async (event, idArticulo, cantidad) => {
    const idNum = Number(idArticulo);
    const cantidadNum = Number(cantidad);

    if (Number.isNaN(idNum) || idNum <= 0) throw new Error('ID de artículo inválido.');
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0) throw new Error('Cantidad inválida. Debe ser un número mayor a 0.');

    const selectResults = await db.query('SELECT Cantidad, Minimo, Nombre FROM Articulos WHERE IdArticulo = ?', [idNum]);
    if (!selectResults.length) throw new Error('Artículo no encontrado.');

    const producto = selectResults[0];
    const cantidadActual = Number(producto.Cantidad);
    const minimo = Number(producto.Minimo);
    const nuevaCantidad = cantidadActual - cantidadNum;

    if (nuevaCantidad < 0) {
      throw new Error('No hay suficiente inventario para eliminar esa cantidad.');
    }

    const updateResults = await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, idNum]);

    return {
      message: 'Inventario actualizado correctamente.',
      filasAfectadas: updateResults.affectedRows,
      necesitaReorder: nuevaCantidad < minimo,
      producto: {
        id: idNum,
        nombre: producto.Nombre,
        cantidadAnterior: cantidadActual,
        cantidadNueva: nuevaCantidad,
        minimo
      }
    };
  });

  // ============================================
  // Recepciones de Proveedor y Devoluciones
  // ============================================
  ipcMain.handle('getRecepcionesProveedor', async () => db.query(
    `SELECT rp.IdRecepcion, rp.NumeroRecepcion, rp.Folio, rp.FechaRecepcion, rp.PuedeModificarHasta,
            rp.Total, rp.Estado, rp.Observaciones,
            p.Nombre AS NombreProveedor,
            e.NombreCompleto AS NombreEmpleado,
            GROUP_CONCAT(CONCAT(a.Nombre, ' x', rd.Cantidad) ORDER BY a.Nombre SEPARATOR ', ') AS ProductosIngresados
     FROM RecepcionesProveedor rp
     JOIN Proveedores p ON p.IdProveedor = rp.IdProveedor
     LEFT JOIN Empleados e ON e.IdEmpleado = rp.IdEmpleado
     LEFT JOIN RecepcionProveedorDetalle rd ON rd.IdRecepcion = rp.IdRecepcion
     LEFT JOIN Articulos a ON a.IdArticulo = rd.IdArticulo
     GROUP BY rp.IdRecepcion
     ORDER BY rp.FechaRecepcion DESC`
  ));

  ipcMain.handle('getRecepcionProveedorDetalle', async (event, idRecepcion) => obtenerDetalleRecepcion(idRecepcion));

  ipcMain.handle('registrarRecepcionProveedor', async (event, payload = {}) => {
    const { idProveedor, idEmpleado = null, observaciones = '', items = [] } = payload;
    if (!idProveedor) throw new Error('Selecciona un proveedor.');
    if (!items.length) throw new Error('Agrega al menos un producto a la recepción.');

    await db.beginTransaction();
    try {
      const numeroRecepcion = generarFolio('REC');
      const folio = generarFolio('FOL');
      const fechaRecepcion = formatLocalSqlDateTime(new Date());
      const puedeModificarHasta = formatLocalSqlDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      const total = items.reduce((acc, item) => acc + (Number(item.costoUnitario) * Number(item.cantidad)), 0);

      const recepcionResult = await db.query(
        `INSERT INTO RecepcionesProveedor
         (NumeroRecepcion, Folio, IdProveedor, IdEmpleado, FechaRecepcion, PuedeModificarHasta, Total, Estado, Observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Recibida', ?)`,
        [numeroRecepcion, folio, idProveedor, idEmpleado, fechaRecepcion, puedeModificarHasta, total, observaciones]
      );

      const idRecepcion = recepcionResult.insertId;

      for (const item of items) {
        const articulo = await db.query('SELECT IdArticulo, Nombre, Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
        if (!articulo.length) throw new Error('Uno de los productos ya no existe.');

        const cantidadActual = Number(articulo[0].Cantidad || 0);
        const cantidadNueva = cantidadActual + Number(item.cantidad);
        const subtotal = Number(item.costoUnitario) * Number(item.cantidad);

        await db.query(
          `INSERT INTO RecepcionProveedorDetalle (IdRecepcion, IdArticulo, Cantidad, CostoUnitario, Subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idRecepcion, item.idArticulo, item.cantidad, item.costoUnitario, subtotal]
        );

        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);

        await db.query(
          `INSERT INTO MovimientosInventario
           (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
           VALUES (?, 'Entrada', ?, ?, ?, ?, ?, 'Compra', ?, ?)`,
          [item.idArticulo, item.cantidad, cantidadActual, cantidadNueva, `Recepción proveedor ${numeroRecepcion}`, idRecepcion, idEmpleado, observaciones || `Ingreso por proveedor ${idProveedor}`]
        );
      }

      await db.commit();
      return { success: true, idRecepcion, numeroRecepcion, folio, total: Number(total.toFixed(2)) };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  ipcMain.handle('modificarRecepcionProveedor', async (event, payload = {}) => {
    const { idRecepcion, observaciones = '', items = [] } = payload;
    if (!idRecepcion) throw new Error('Selecciona una recepción.');
    if (!items.length) throw new Error('Agrega al menos un producto a la recepción.');

    await db.beginTransaction();
    try {
      const recepcion = await obtenerDetalleRecepcion(idRecepcion);
      if (recepcion.Estado === 'Devuelta') throw new Error('No puedes modificar una recepción ya devuelta.');
      if (new Date(recepcion.PuedeModificarHasta).getTime() < Date.now()) {
        throw new Error('Solo puedes modificar la recepción dentro de las primeras 24 horas.');
      }

      for (const detalle of recepcion.detalles) {
        const articulo = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [detalle.IdArticulo]);
        const existenciaActual = Number(articulo[0]?.Cantidad || 0);
        if (existenciaActual < Number(detalle.Cantidad)) {
          throw new Error(`No es posible modificar la recepción porque el producto ${detalle.NombreProducto} ya tuvo movimiento físico.`);
        }
        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [existenciaActual - Number(detalle.Cantidad), detalle.IdArticulo]);
      }

      await db.query('DELETE FROM RecepcionProveedorDetalle WHERE IdRecepcion = ?', [idRecepcion]);

      let total = 0;
      for (const item of items) {
        const articulo = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
        if (!articulo.length) throw new Error('Uno de los productos ya no existe.');
        const cantidadActual = Number(articulo[0].Cantidad || 0);
        const cantidadNueva = cantidadActual + Number(item.cantidad);
        const subtotal = Number(item.costoUnitario) * Number(item.cantidad);
        total += subtotal;

        await db.query(
          `INSERT INTO RecepcionProveedorDetalle (IdRecepcion, IdArticulo, Cantidad, CostoUnitario, Subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idRecepcion, item.idArticulo, item.cantidad, item.costoUnitario, subtotal]
        );
        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);
      }

      await db.query(
        `UPDATE RecepcionesProveedor
         SET Total = ?, Estado = 'Modificada', Observaciones = ?
         WHERE IdRecepcion = ?`,
        [Number(total.toFixed(2)), observaciones || recepcion.Observaciones || '', idRecepcion]
      );

      await db.commit();
      return { success: true, idRecepcion, total: Number(total.toFixed(2)) };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  ipcMain.handle('devolverRecepcionProveedor', async (event, payload = {}) => {
    const { idRecepcion, motivo = 'Devolución al proveedor por error de recepción' } = payload;
    if (!idRecepcion) throw new Error('Selecciona una recepción.');

    await db.beginTransaction();
    try {
      const recepcion = await obtenerDetalleRecepcion(idRecepcion);
      if (recepcion.Estado === 'Devuelta') throw new Error('La recepción ya fue devuelta.');

      for (const detalle of recepcion.detalles) {
        const articulo = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [detalle.IdArticulo]);
        const existenciaActual = Number(articulo[0]?.Cantidad || 0);
        if (existenciaActual < Number(detalle.Cantidad)) {
          throw new Error(`No es posible devolver ${detalle.NombreProducto} porque ya hubo cambio físico en inventario.`);
        }
        const nuevaCantidad = existenciaActual - Number(detalle.Cantidad);
        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, detalle.IdArticulo]);
        await db.query(
          `INSERT INTO MovimientosInventario
           (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
           VALUES (?, 'Salida', ?, ?, ?, ?, ?, 'Compra', ?, ?)`,
          [detalle.IdArticulo, detalle.Cantidad, existenciaActual, nuevaCantidad, 'Devolución a proveedor', idRecepcion, recepcion.IdEmpleado, motivo]
        );
      }

      await db.query("UPDATE RecepcionesProveedor SET Estado = 'Devuelta', Observaciones = ? WHERE IdRecepcion = ?", [motivo, idRecepcion]);
      await db.commit();
      return { success: true, idRecepcion };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  ipcMain.handle('getAuxiliarMovimientos', async (event, payload = {}) => {
    const days = Math.max(1, Number(payload.days || 7));
    const productId = payload.idArticulo ? Number(payload.idArticulo) : null;
    const desde = formatLocalSqlDateTime(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    const params = [desde];
    let filtroArticulo = '';
    if (productId) {
      filtroArticulo = ' AND m.IdArticulo = ?';
      params.push(productId);
    }

    return db.query(
      `SELECT m.IdMovimiento, m.FechaMovimiento, DATE(m.FechaMovimiento) AS Fecha, TIME(m.FechaMovimiento) AS Hora,
              a.Nombre AS Producto, m.TipoMovimiento, m.Cantidad, m.Motivo, m.TipoReferencia,
              rp.NumeroRecepcion, rp.Folio, p.Nombre AS Proveedor,
              v.IdVenta
       FROM MovimientosInventario m
       JOIN Articulos a ON a.IdArticulo = m.IdArticulo
       LEFT JOIN RecepcionesProveedor rp ON m.TipoReferencia = 'Compra' AND rp.IdRecepcion = m.IdReferencia
       LEFT JOIN Proveedores p ON p.IdProveedor = rp.IdProveedor
       LEFT JOIN Ventas v ON m.TipoReferencia = 'Venta' AND v.IdVenta = m.IdReferencia
       WHERE m.FechaMovimiento >= ?${filtroArticulo}
       ORDER BY m.FechaMovimiento DESC`,
      params
    );
  });

  ipcMain.handle('getDevolucionesCliente', async () => db.query(
    `SELECT dc.IdDevolucion, dc.FolioDevolucion, dc.FechaDevolucion, dc.TotalReintegrado, dc.Motivo,
            dc.IdVenta, e.NombreCompleto AS Empleado,
            GROUP_CONCAT(CONCAT(a.Nombre, ' x', dcd.Cantidad) ORDER BY a.Nombre SEPARATOR ', ') AS Productos
     FROM DevolucionesCliente dc
     LEFT JOIN Empleados e ON e.IdEmpleado = dc.IdEmpleado
     LEFT JOIN DevolucionClienteDetalle dcd ON dcd.IdDevolucion = dc.IdDevolucion
     LEFT JOIN Articulos a ON a.IdArticulo = dcd.IdArticulo
     GROUP BY dc.IdDevolucion
     ORDER BY dc.FechaDevolucion DESC`
  ));

  ipcMain.handle('registrarDevolucionCliente', async (event, payload = {}) => {
    const { idVenta, idEmpleado = null, motivo = 'Devolución de cliente', items = [] } = payload;
    if (!idVenta) throw new Error('Selecciona una venta.');
    if (!items.length) throw new Error('Selecciona al menos un producto para devolución.');

    await db.beginTransaction();
    try {
      const venta = await db.query('SELECT IdVenta FROM Ventas WHERE IdVenta = ?', [idVenta]);
      if (!venta.length) throw new Error('La venta seleccionada no existe.');

      const folioDevolucion = generarFolio('DEVCLI');
      let totalReintegrado = 0;

      const devolucionResult = await db.query(
        `INSERT INTO DevolucionesCliente (FolioDevolucion, IdVenta, IdEmpleado, TotalReintegrado, Motivo)
         VALUES (?, ?, ?, 0, ?)`,
        [folioDevolucion, idVenta, idEmpleado, motivo]
      );
      const idDevolucion = devolucionResult.insertId;

      for (const item of items) {
        const vendidos = await db.query(
          `SELECT vd.Cantidad, vd.PrecioUnitario, a.Nombre
           FROM VentaDetalle vd
           JOIN Articulos a ON a.IdArticulo = vd.IdArticulo
           WHERE vd.IdVenta = ? AND vd.IdArticulo = ?`,
          [idVenta, item.idArticulo]
        );
        if (!vendidos.length) throw new Error('Uno de los productos no pertenece a la venta.');

        const devueltosPrevios = await db.query(
          `SELECT COALESCE(SUM(dcd.Cantidad), 0) AS cantidad
           FROM DevolucionClienteDetalle dcd
           JOIN DevolucionesCliente dc ON dc.IdDevolucion = dcd.IdDevolucion
           WHERE dc.IdVenta = ? AND dcd.IdArticulo = ?`,
          [idVenta, item.idArticulo]
        );

        const disponibleParaDevolver = Number(vendidos[0].Cantidad) - Number(devueltosPrevios[0].cantidad || 0);
        if (Number(item.cantidad) <= 0 || Number(item.cantidad) > disponibleParaDevolver) {
          throw new Error(`La devolución de ${vendidos[0].Nombre} excede lo vendido disponible.`);
        }

        const precioUnitario = Number(vendidos[0].PrecioUnitario || 0);
        const subtotal = precioUnitario * Number(item.cantidad);
        totalReintegrado += subtotal;

        await db.query(
          `INSERT INTO DevolucionClienteDetalle (IdDevolucion, IdArticulo, Cantidad, PrecioUnitario, Subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idDevolucion, item.idArticulo, item.cantidad, precioUnitario, subtotal]
        );

        const articulo = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
        const cantidadActual = Number(articulo[0]?.Cantidad || 0);
        const cantidadNueva = cantidadActual + Number(item.cantidad);
        await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);
        await db.query(
          `INSERT INTO MovimientosInventario
           (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
           VALUES (?, 'Entrada', ?, ?, ?, 'Devolución cliente', ?, 'Ajuste', ?, ?)`,
          [item.idArticulo, item.cantidad, cantidadActual, cantidadNueva, idDevolucion, idEmpleado, motivo]
        );
      }

      await db.query('UPDATE DevolucionesCliente SET TotalReintegrado = ? WHERE IdDevolucion = ?', [Number(totalReintegrado.toFixed(2)), idDevolucion]);
      await db.commit();
      return { success: true, idDevolucion, folioDevolucion, totalReintegrado: Number(totalReintegrado.toFixed(2)) };
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  // ============================================
  // Reportes y Analíticas
  // ============================================
  ipcMain.handle('getReportes', async (event, filters = {}) => {
    const range = await resolveReportRange(filters);
    const ventas = await db.query(
      `SELECT v.IdVenta, v.FechaVenta, v.IdEmpleado, v.IdCliente, v.Subtotal, v.Iva, v.Total,
              e.NombreCompleto AS EmpleadoNombre,
              COALESCE(c.NombreCompleto, ce.NombreCompleto) AS ClienteNombre,
              COALESCE(vc.Canal, 'SinClasificar') AS Canal
       FROM Ventas v
       LEFT JOIN Empleados e ON e.IdEmpleado = v.IdEmpleado
       LEFT JOIN Clientes c ON c.IdCliente = v.IdCliente
       LEFT JOIN Empleados ce ON ce.IdEmpleado = v.IdCliente
       LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
       WHERE v.FechaVenta BETWEEN ? AND ?
       ORDER BY v.FechaVenta DESC`,
      [range.start, range.end]
    );

    const detalles = await db.query(
      `SELECT vd.IdVenta, vd.IdArticulo, vd.Cantidad, vd.PrecioUnitario, vd.Subtotal, a.Nombre AS NombreProducto
       FROM VentaDetalle vd
       JOIN Ventas v ON v.IdVenta = vd.IdVenta
       JOIN Articulos a ON a.IdArticulo = vd.IdArticulo
       WHERE v.FechaVenta BETWEEN ? AND ?`,
      [range.start, range.end]
    );

    const inventario = await db.query(
      `SELECT IdArticulo, Nombre, Descripcion, Cantidad, Minimo, PrecioCompra, PrecioVenta,
              CASE WHEN Cantidad <= Minimo THEN 1 ELSE 0 END AS StockBajo
       FROM Articulos
       ORDER BY Nombre ASC`
    );

    const ventasPorDiaMap = new Map();
    const productosMap = new Map();
    const canalMap = new Map([
      ['Autocobro', { canal: 'Autocobro', ventas: 0, total: 0 }],
      ['CajaEmpleado', { canal: 'CajaEmpleado', ventas: 0, total: 0 }],
      ['SinClasificar', { canal: 'SinClasificar', ventas: 0, total: 0 }]
    ]);

    for (const venta of ventas) {
      const day = formatSqlDate(venta.FechaVenta).slice(0, 10);
      const dayEntry = ventasPorDiaMap.get(day) || {
        fecha: day,
        ventas: 0,
        total: 0,
        autocobro: 0,
        cajaEmpleado: 0
      };

      dayEntry.ventas += 1;
      dayEntry.total += Number(venta.Total || 0);
      if (venta.Canal === 'Autocobro') dayEntry.autocobro += Number(venta.Total || 0);
      if (venta.Canal === 'CajaEmpleado') dayEntry.cajaEmpleado += Number(venta.Total || 0);
      ventasPorDiaMap.set(day, dayEntry);

      const channelEntry = canalMap.get(venta.Canal) || { canal: venta.Canal, ventas: 0, total: 0 };
      channelEntry.ventas += 1;
      channelEntry.total += Number(venta.Total || 0);
      canalMap.set(venta.Canal, channelEntry);
    }

    for (const detalle of detalles) {
      const key = `${detalle.IdArticulo}`;
      const existing = productosMap.get(key) || {
        idArticulo: detalle.IdArticulo,
        producto: detalle.NombreProducto,
        cantidadVendida: 0,
        importe: 0
      };

      existing.cantidadVendida += Number(detalle.Cantidad || 0);
      existing.importe += Number(detalle.Subtotal || 0);
      productosMap.set(key, existing);
    }

    const bolillo = Array.from(productosMap.values()).find((item) => /bolillo/i.test(item.producto));
    const bolilloPiezas = bolillo?.cantidadVendida || 0;

    return {
      range,
      resumen: {
        ventas: ventas.length,
        totalIngresos: ventas.reduce((acc, venta) => acc + Number(venta.Total || 0), 0),
        articulosVendidos: detalles.reduce((acc, detalle) => acc + Number(detalle.Cantidad || 0), 0),
        productosStockBajo: inventario.filter((item) => Number(item.StockBajo) === 1).length,
        bolilloPiezas,
        bolilloKilosEstimados: Number((bolilloPiezas * DEFAULT_BOLILLO_WEIGHT_KG).toFixed(2))
      },
      ventas,
      ventasPorDia: Array.from(ventasPorDiaMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
      porCanal: Array.from(canalMap.values()),
      productosMasVendidos: Array.from(productosMap.values()).sort((a, b) => b.cantidadVendida - a.cantidadVendida),
      inventario,
      inventarioStockBajo: inventario.filter((item) => Number(item.StockBajo) === 1)
    };
  });

  // ============================================
  // Cortes de Turno y Caja
  // ============================================
  ipcMain.handle('registrarCorteTurno', async (event, payload = {}) => {
    const channel = payload.channel === 'Autocobro' ? 'Autocobro' : 'CajaEmpleado';
    const idEmpleado = payload.idEmpleado || null;
    const idCliente = payload.idCliente || null;
    const gerente = await getManagerByCredentials(payload.gerenteUsuario, payload.gerentePassword);

    const fechaInicioRaw = await getLastCutRange({ channel, idEmpleado, idCliente });
    const fechaInicio = formatLocalSqlDateTime(fechaInicioRaw || new Date());
    const fechaFin = formatLocalSqlDateTime(new Date());

    const ventas = await db.query(
      `SELECT v.IdVenta, v.FechaVenta, v.Total, COALESCE(vc.Canal, 'SinClasificar') AS Canal
       FROM Ventas v
       LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
       WHERE COALESCE(vc.Canal, 'SinClasificar') = ?
         AND ((v.IdEmpleado IS NULL AND ? IS NULL) OR v.IdEmpleado = ?)
         AND ((v.IdCliente IS NULL AND ? IS NULL) OR v.IdCliente = ?)
         AND v.FechaVenta > ?
         AND v.FechaVenta <= ?
       ORDER BY v.FechaVenta ASC`,
      [channel, idEmpleado, idEmpleado, idCliente, idCliente, fechaInicio, fechaFin]
    );

    const totalImporte = ventas.reduce((acc, venta) => acc + Number(venta.Total || 0), 0);
    const resumen = {
      canal: channel,
      fechaInicio,
      fechaFin,
      totalVentas: ventas.length,
      totalImporte: Number(totalImporte.toFixed(2)),
      ventas
    };

    const insert = await db.query(
      `INSERT INTO CortesTurno
       (Canal, IdEmpleado, IdCliente, FechaInicio, FechaFin, TotalVentas, TotalImporte, ResumenJSON, AutorizadoPor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [channel, idEmpleado, idCliente, fechaInicio, fechaFin, ventas.length, resumen.totalImporte, JSON.stringify(resumen), gerente.IdEmpleado]
    );

    return {
      success: true,
      idCorte: insert.insertId,
      autorizadoPor: gerente.NombreCompleto,
      resumen
    };
  });

  ipcMain.handle('exportarReporteExcel', async (event, payload = {}) => {
    try {
      delete require.cache[require.resolve('./excelService.js')];
      const { generateExecutiveExcel } = require('./excelService.js');
      const { reportData, auxiliarData = [], storeInfo = {}, saveToFile = false } = payload;
      const buffer = await generateExecutiveExcel({ reportData, auxiliarData, storeInfo });

      const startDateStr = reportData?.range?.start ? String(reportData.range.start).slice(0, 10) : 'reporte';
      const endDateStr = reportData?.range?.end ? String(reportData.range.end).slice(0, 10) : '';
      const defaultFilename = `DulceHorno_Reporte_${startDateStr}_al_${endDateStr}.xlsx`;

      if (saveToFile) {
        const { canceled, filePath } = await dialog.showSaveDialog({
          title: 'Guardar Reporte Ejecutivo Excel (Dulce Horno)',
          defaultPath: defaultFilename,
          filters: [
            { name: 'Libro de Excel (*.xlsx)', extensions: ['xlsx'] }
          ]
        });

        if (!canceled && filePath) {
          const fs = require('fs');
          fs.writeFileSync(filePath, buffer);
          return {
            success: true,
            saved: true,
            filePath,
            filename: defaultFilename
          };
        }
        return { success: true, canceled: true };
      }

      return {
        success: true,
        saved: false,
        filename: defaultFilename,
        base64: buffer.toString('base64'),
        size: buffer.length
      };
    } catch (err) {
      console.error('Error generando archivo Excel en IPC:', err);
      throw err;
    }
  });

  ipcMain.handle('abrirArchivoExterno', async (event, filePath) => {
    if (filePath && shell) {
      await shell.openPath(filePath);
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('getAppInfo', () => {
    return {
      isPackaged: Boolean(app && app.isPackaged),
      isDev: Boolean(app && !app.isPackaged),
      version: app ? app.getVersion() : '1.1.0'
    };
  });

  ipcMain.handle('getAutostartStatus', async () => {
    try {
      if (app && app.isPackaged) {
        return Boolean(app.getLoginItemSettings().openAtLogin);
      }
      const startupFolder = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      const vbsPath = path.join(startupFolder, 'DulceHorno_AutoStart.vbs');
      return fs.existsSync(vbsPath);
    } catch (e) {
      console.warn('Error consultando autostart:', e.message);
      return false;
    }
  });

  ipcMain.handle('setAutostart', async (event, enable) => {
    try {
      const shouldEnable = Boolean(enable);
      if (app && app.isPackaged) {
        app.setLoginItemSettings({
          openAtLogin: shouldEnable,
          path: process.execPath
        });
      }

      const startupFolder = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      const vbsPath = path.join(startupFolder, 'DulceHorno_AutoStart.vbs');

      if (shouldEnable) {
        if (!fs.existsSync(startupFolder)) {
          fs.mkdirSync(startupFolder, { recursive: true });
        }
        const projectDir = path.resolve(__dirname, '..', '..');
        const vbsContent = [
          'Set WshShell = CreateObject("WScript.Shell")',
          `WshShell.CurrentDirectory = "${projectDir.replace(/\\/g, '\\\\')}"`,
          'WshShell.Run "cmd /c npm start", 0, False',
          ''
        ].join('\r\n');
        fs.writeFileSync(vbsPath, vbsContent, 'utf8');

        // Levantar o verificar servicio MySQL si existe
        try {
          const { exec } = require('child_process');
          exec('net start MySQL', () => {});
        } catch (e) {}
      } else {
        if (fs.existsSync(vbsPath)) {
          fs.unlinkSync(vbsPath);
        }
      }

      return { success: true, enabled: shouldEnable };
    } catch (err) {
      console.error('Error configurando autostart en IPC:', err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  registerIpcHandlers
};

