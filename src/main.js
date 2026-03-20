const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const db = require('./includes/conexion.js');

const DEFAULT_BOLILLO_WEIGHT_KG = 0.065;
let mainWindow = null;
let updateState = {
  status: 'checking',
  version: app.getVersion(),
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

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function beginTransaction() {
  return new Promise((resolve, reject) => db.beginTransaction((error) => error ? reject(error) : resolve()));
}

function commit() {
  return new Promise((resolve, reject) => db.commit((error) => error ? reject(error) : resolve()));
}

function rollback() {
  return new Promise((resolve) => db.rollback(() => resolve()));
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

function setUpdateState(nextState) {
  updateState = {
    ...updateState,
    ...nextState
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', updateState);
  }
}

async function ensureSupportTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS VentasCanal (
      IdVenta INT PRIMARY KEY,
      Canal ENUM('Autocobro', 'CajaEmpleado', 'SinClasificar') NOT NULL DEFAULT 'SinClasificar',
      FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS CortesTurno (
      IdCorte INT AUTO_INCREMENT PRIMARY KEY,
      Canal ENUM('Autocobro', 'CajaEmpleado') NOT NULL,
      IdEmpleado INT NULL,
      IdCliente INT NULL,
      FechaInicio DATETIME NOT NULL,
      FechaFin DATETIME NOT NULL,
      TotalVentas INT NOT NULL DEFAULT 0,
      TotalImporte DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      ResumenJSON TEXT,
      AutorizadoPor INT NOT NULL,
      FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado),
      FOREIGN KEY (IdCliente) REFERENCES Empleados(IdEmpleado),
      FOREIGN KEY (AutorizadoPor) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    INSERT INTO VentasCanal (IdVenta, Canal)
    SELECT v.IdVenta,
           CASE WHEN v.IdEmpleado IS NULL THEN 'Autocobro' ELSE 'CajaEmpleado' END AS Canal
    FROM Ventas v
    LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
    WHERE vc.IdVenta IS NULL
  `);
}

function configureAutoUpdates() {
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
  updateDownloadInProgress = false;
  updateInstallTriggered = false;

  if (!app.isPackaged) {
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'views', 'index.html'));
}

function sanitizeChannel(channel) {
  return channel === 'Autocobro' ? 'Autocobro' : channel === 'CajaEmpleado' ? 'CajaEmpleado' : 'SinClasificar';
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
  const rows = await query(
    `SELECT IdEmpleado, NombreCompleto, NombreUsuario, Rol, Activo
     FROM Empleados
     WHERE NombreUsuario = ? AND Password = ? AND Rol = 'Gerente'`,
    [username, password]
  );

  if (!rows.length) {
    throw new Error('Las credenciales del gerente no son válidas.');
  }

  if (!rows[0].Activo) {
    throw new Error('El gerente seleccionado está desactivado.');
  }

  return rows[0];
}

async function getLastCutRange({ channel, idEmpleado = null, idCliente = null }) {
  const rows = await query(
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

  const salesRows = await query(
    `SELECT MIN(v.FechaVenta) AS PrimeraVenta
     FROM Ventas v
     LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
     WHERE COALESCE(vc.Canal, 'SinClasificar') = ?
       AND ((v.IdEmpleado IS NULL AND ? IS NULL) OR v.IdEmpleado = ?)
       AND ((v.IdCliente IS NULL AND ? IS NULL) OR v.IdCliente = ?)`,
    [channel, idEmpleado, idEmpleado, idCliente, idCliente]
  );

  return salesRows[0]?.PrimeraVenta || normalizeDate(new Date());
}

app.whenReady().then(async () => {
  await ensureSupportTables();
  createWindow();
  configureAutoUpdates();
  checkForAppUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('getUpdateStatus', async () => updateState);
ipcMain.handle('retryUpdateCheck', async () => {
  await checkForAppUpdates();
  return updateState;
});
ipcMain.handle('installPendingUpdate', async () => {
  if (!['pending', 'pending_install'].includes(updateState.status)) {
    return { success: false, message: 'No hay una actualización descargada para instalar.' };
  }

  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return { success: true };
});

ipcMain.handle('getVentas', async () => query('SELECT * FROM Ventas ORDER BY FechaVenta DESC'));

ipcMain.handle('getDetallesVenta', async (event, idVenta) => {
  const ventas = await query('SELECT * FROM Ventas WHERE IdVenta = ?', [idVenta]);
  if (!ventas.length) {
    throw new Error('No se encontró la venta.');
  }

  const venta = ventas[0];
  const empleados = venta.IdEmpleado
    ? await query('SELECT IdEmpleado, NombreCompleto, Turno FROM Empleados WHERE IdEmpleado = ?', [venta.IdEmpleado])
    : [];

  const detalles = await query(
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

ipcMain.handle('getArticulos', async () => query('SELECT * FROM Articulos ORDER BY Nombre ASC'));

ipcMain.handle('login', async (event, username, password) => {
  const results = await query(
    'SELECT * FROM Empleados WHERE NombreUsuario = ? AND Password = ?',
    [username, password]
  );

  if (!results.length) {
    return {
      success: false,
      error: 'Credenciales incorrectas',
      message: 'Usuario o contraseña incorrectos'
    };
  }

  const usuario = results[0];
  if (!usuario.Activo) {
    return {
      success: false,
      error: 'Usuario desactivado',
      message: 'Este usuario ha sido desactivado y no puede acceder al sistema.'
    };
  }

  return { success: true, user: usuario };
});

ipcMain.handle('registrarUsuario', async (event, data) => {
  const results = await query(
    `INSERT INTO Empleados
     (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, FechaRegistro)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.username, data.password, data.rol, data.puesto, data.turno, data.salario, data.name, new Date()]
  );
  return { id: results.insertId };
});

ipcMain.handle('registrarProveedor', async (event, data) => {
  const results = await query(
    'INSERT INTO Proveedores (Nombre, Direccion, Telefono, Correo, Contacto, RUC) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, data.direccion, data.telefono, data.mail, data.contacto, null]
  );
  return { id: results.insertId };
});

ipcMain.handle('modificarUsuario', async (event, data) => query(
  `UPDATE Empleados
   SET NombreUsuario = ?, Rol = ?, Puesto = ?, Turno = ?, Salario = ?, NombreCompleto = ?
   WHERE IdEmpleado = ?`,
  [data.username, data.rol, data.puesto, data.turno, data.salario, data.name, data.id]
));

async function eliminarEmpleadoSeguro(idEmpleado) {
  const rows = await query('SELECT IdEmpleado, Rol FROM Empleados WHERE IdEmpleado = ?', [idEmpleado]);
  if (!rows.length) {
    throw new Error('Empleado no encontrado');
  }

  const empleado = rows[0];
  if (empleado.Rol === 'Gerente') {
    const gerentes = await query('SELECT COUNT(*) AS totalGerentes FROM Empleados WHERE Rol = "Gerente" AND Activo = 1');
    if (gerentes[0].totalGerentes <= 1) {
      throw new Error('No se puede eliminar el único gerente del sistema');
    }
  }

  await beginTransaction();
  try {
    const [ventas, compras, envios, movimientos] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM Ventas WHERE IdEmpleado = ?', [idEmpleado]),
      query('SELECT COUNT(*) AS count FROM Compras WHERE IdEmpleado = ?', [idEmpleado]),
      query('SELECT COUNT(*) AS count FROM Envios WHERE IdEmpleadoRepartidor = ?', [idEmpleado]),
      query('SELECT COUNT(*) AS count FROM MovimientosInventario WHERE IdEmpleado = ?', [idEmpleado])
    ]);

    const tieneRelaciones =
      ventas[0].count > 0 ||
      compras[0].count > 0 ||
      envios[0].count > 0 ||
      movimientos[0].count > 0;

    if (tieneRelaciones) {
      await query('UPDATE Empleados SET Activo = FALSE WHERE IdEmpleado = ?', [idEmpleado]);
      await commit();
      return {
        ok: true,
        idEmpleado,
        message: 'Usuario desactivado (tenía registros relacionados)',
        tipo: 'desactivacion'
      };
    }

    await query('DELETE FROM Empleados WHERE IdEmpleado = ?', [idEmpleado]);
    await commit();
    return {
      ok: true,
      idEmpleado,
      message: 'Usuario eliminado permanentemente',
      tipo: 'eliminacion'
    };
  } catch (error) {
    await rollback();
    throw error;
  }
}

ipcMain.handle('deleteUsuario', async (event, idEmpleado) => eliminarEmpleadoSeguro(idEmpleado));

ipcMain.handle('getEmpleados', async () => query('SELECT * FROM Empleados ORDER BY Activo DESC, IdEmpleado ASC'));
ipcMain.handle('getProveedores', async () => query('SELECT * FROM Proveedores ORDER BY IdProveedor ASC'));

ipcMain.handle('cambiarEstadoUsuario', async (event, idEmpleado, nuevoEstado) => {
  const idNum = Number(idEmpleado);
  const estado = Boolean(nuevoEstado);

  if (Number.isNaN(idNum) || idNum <= 0) {
    throw new Error('ID de empleado inválido.');
  }

  const selectResults = await query(
    'SELECT IdEmpleado, NombreCompleto, Rol FROM Empleados WHERE IdEmpleado = ?',
    [idNum]
  );

  if (!selectResults.length) {
    throw new Error('Empleado no encontrado.');
  }

  const empleado = selectResults[0];
  if (empleado.Rol === 'Gerente' && !estado) {
    const countResults = await query(
      "SELECT COUNT(*) AS total FROM Empleados WHERE Rol = 'Gerente' AND Activo = 1"
    );

    if (countResults[0].total <= 1) {
      throw new Error('No se puede desactivar el único administrador del sistema.');
    }
  }

  const updateResults = await query('UPDATE Empleados SET Activo = ? WHERE IdEmpleado = ?', [estado, idNum]);
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

ipcMain.handle('getProductos', async () => query('SELECT * FROM Articulos ORDER BY Nombre ASC'));

ipcMain.handle('verificarExistencia', async (event, idArticulo, cantidadRequerida) => {
  const results = await query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [idArticulo]);
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
    canal = idEmpleado ? 'CajaEmpleado' : 'Autocobro',
    carrito = []
  } = ventaData || {};

  if (!carrito.length) {
    throw new Error('El carrito está vacío.');
  }

  await beginTransaction();
  try {
    for (const item of carrito) {
      const results = await query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [item.id]);
      if (!results.length) {
        throw new Error(`Producto ${item.nombre} no encontrado.`);
      }

      const producto = results[0];
      if (Number(producto.Cantidad) < Number(item.cantidad)) {
        throw new Error(`No hay suficiente existencia de ${producto.Nombre}. Disponible: ${producto.Cantidad}, solicitado: ${item.cantidad}`);
      }
    }

    const subtotal = carrito.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad)), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const ventaResults = await query(
      `INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado)
       VALUES (?, ?, ?, ?, ?, 'Mostrador', 'Completada')`,
      [idEmpleado, idCliente, subtotal, iva, total]
    );

    const idVenta = ventaResults.insertId;

    for (const item of carrito) {
      const subtotalItem = Number(item.precio) * Number(item.cantidad);
      await query(
        `INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idVenta, item.id, item.cantidad, item.precio, subtotalItem]
      );

      const beforeRows = await query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [item.id]);
      const cantidadAnterior = Number(beforeRows[0].Cantidad);
      const cantidadNueva = cantidadAnterior - Number(item.cantidad);

      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.id]);

      await query(
        `INSERT INTO MovimientosInventario
         (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado)
         VALUES (?, 'Salida', ?, ?, ?, 'Venta', ?, 'Venta', ?)`,
        [item.id, item.cantidad, cantidadAnterior, cantidadNueva, idVenta, idEmpleado]
      );
    }

    await query('INSERT INTO VentasCanal (IdVenta, Canal) VALUES (?, ?)', [idVenta, sanitizeChannel(canal)]);
    await commit();

    return {
      success: true,
      idVenta,
      total,
      canal: sanitizeChannel(canal),
      message: 'Venta registrada exitosamente'
    };
  } catch (error) {
    await rollback();
    throw error;
  }
});

ipcMain.handle('agregarCantidadProducto', async (event, idArticulo, cantidad) => {
  const idNum = Number(idArticulo);
  const cantidadNum = Number(cantidad);

  if (Number.isNaN(idNum) || idNum <= 0) throw new Error('ID de artículo inválido.');
  if (Number.isNaN(cantidadNum) || cantidadNum <= 0) throw new Error('Cantidad inválida. Debe ser un número mayor a 0.');

  const results = await query('SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?', [idNum]);
  if (!results.length) throw new Error('Artículo no encontrado.');

  const producto = results[0];
  const cantidadActual = Number(producto.Cantidad);
  const nuevaCantidad = cantidadActual + cantidadNum;

  await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, idNum]);

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

  const results = await query(
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

  const selectResults = await query('SELECT Cantidad, Minimo, Nombre FROM Articulos WHERE IdArticulo = ?', [idNum]);
  if (!selectResults.length) throw new Error('Artículo no encontrado.');

  const producto = selectResults[0];
  const cantidadActual = Number(producto.Cantidad);
  const minimo = Number(producto.Minimo);
  const nuevaCantidad = cantidadActual - cantidadNum;

  if (nuevaCantidad < 0) {
    throw new Error('No hay suficiente inventario para eliminar esa cantidad.');
  }

  const updateResults = await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, idNum]);

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

ipcMain.handle('getReportes', async (event, filters = {}) => {
  const range = await resolveReportRange(filters);
  const ventas = await query(
    `SELECT v.IdVenta, v.FechaVenta, v.IdEmpleado, v.IdCliente, v.Subtotal, v.Iva, v.Total,
            e.NombreCompleto AS EmpleadoNombre,
            c.NombreCompleto AS ClienteNombre,
            COALESCE(vc.Canal, 'SinClasificar') AS Canal
     FROM Ventas v
     LEFT JOIN Empleados e ON e.IdEmpleado = v.IdEmpleado
     LEFT JOIN Empleados c ON c.IdEmpleado = v.IdCliente
     LEFT JOIN VentasCanal vc ON vc.IdVenta = v.IdVenta
     WHERE v.FechaVenta BETWEEN ? AND ?
     ORDER BY v.FechaVenta DESC`,
    [range.start, range.end]
  );

  const detalles = await query(
    `SELECT vd.IdVenta, vd.IdArticulo, vd.Cantidad, vd.PrecioUnitario, vd.Subtotal, a.Nombre AS NombreProducto
     FROM VentaDetalle vd
     JOIN Ventas v ON v.IdVenta = vd.IdVenta
     JOIN Articulos a ON a.IdArticulo = vd.IdArticulo
     WHERE v.FechaVenta BETWEEN ? AND ?`,
    [range.start, range.end]
  );

  const inventario = await query(
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

ipcMain.handle('registrarCorteTurno', async (event, payload = {}) => {
  const channel = payload.channel === 'Autocobro' ? 'Autocobro' : 'CajaEmpleado';
  const idEmpleado = payload.idEmpleado || null;
  const idCliente = payload.idCliente || null;
  const gerente = await getManagerByCredentials(payload.gerenteUsuario, payload.gerentePassword);

  const fechaInicioRaw = await getLastCutRange({ channel, idEmpleado, idCliente });
  const fechaInicio = formatSqlDate(fechaInicioRaw || new Date());
  const fechaFin = normalizeDate(new Date(), { endOfDay: false });

  const ventas = await query(
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

  const insert = await query(
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db?.end) {
      db.end();
    }
    app.quit();
  }
});
