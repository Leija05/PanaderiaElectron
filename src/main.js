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


async function tableExists(tableName) {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  if (!await columnExists(tableName, columnName)) {
    await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureEmpleadosRolProgramador() {
  const columns = await query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empleados' AND COLUMN_NAME = 'Rol'`
  );
  const type = columns[0]?.COLUMN_TYPE || '';
  if (!type.includes("'Programador'")) {
    await query(
      `ALTER TABLE Empleados
       MODIFY Rol ENUM('Cliente', 'Empleado', 'Gerente', 'Programador') NOT NULL`
    );
  }
}

async function ensureSecurityProcedure() {
  await query('DROP PROCEDURE IF EXISTS sp_programador_cambiar_password');
  await query(`
    CREATE PROCEDURE sp_programador_cambiar_password(
      IN p_id_programador INT,
      IN p_usuario_objetivo VARCHAR(50),
      IN p_password_nuevo VARCHAR(100)
    )
    BEGIN
      DECLARE v_es_programador INT DEFAULT 0;
      SELECT COUNT(*) INTO v_es_programador
      FROM Empleados
      WHERE IdEmpleado = p_id_programador
        AND Rol = 'Programador'
        AND Activo = TRUE;

      IF v_es_programador = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo un programador activo puede ejecutar este procedimiento.';
      END IF;

      UPDATE Empleados
      SET Password = p_password_nuevo
      WHERE NombreUsuario = p_usuario_objetivo
        AND Activo = TRUE;

      IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se encontró un usuario activo con ese nombre.';
      END IF;
    END
  `);

  await query('DROP PROCEDURE IF EXISTS AgregarEmpleadoPorProgramador');
  await query(`
    CREATE PROCEDURE AgregarEmpleadoPorProgramador(
      IN p_UsuarioProgramador VARCHAR(50),
      IN p_PasswordProgramador VARCHAR(100),
      IN p_NuevoUsuario VARCHAR(50),
      IN p_NuevoPassword VARCHAR(100),
      IN p_NuevoRol VARCHAR(20),
      IN p_NuevoPuesto VARCHAR(50),
      IN p_NuevoTurno VARCHAR(20),
      IN p_NuevoSalario DECIMAL(10,2),
      IN p_Nombre VARCHAR(60),
      IN p_ApellidoPaterno VARCHAR(60),
      IN p_ApellidoMaterno VARCHAR(60),
      IN p_Genero VARCHAR(30),
      IN p_FechaNacimiento DATE,
      IN p_Calle VARCHAR(100),
      IN p_NumeroExterior VARCHAR(20),
      IN p_NumeroInterior VARCHAR(20),
      IN p_Colonia VARCHAR(80),
      IN p_Ciudad VARCHAR(80),
      IN p_Estado VARCHAR(80),
      IN p_CodigoPostal VARCHAR(15),
      IN p_Pais VARCHAR(80)
    )
    BEGIN
      DECLARE v_es_programador INT DEFAULT 0;
      DECLARE v_nombre_completo VARCHAR(180);

      SELECT COUNT(*) INTO v_es_programador
      FROM Empleados
      WHERE NombreUsuario = p_UsuarioProgramador
        AND Password = p_PasswordProgramador
        AND Rol = 'Programador'
        AND Activo = TRUE;

      IF v_es_programador = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: solo un Programador activo puede registrar gerentes.';
      END IF;

      IF p_NuevoRol NOT IN ('Gerente') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acceso denegado: esta herramienta solo registra Gerentes.';
      END IF;

      SET v_nombre_completo = TRIM(CONCAT_WS(' ', NULLIF(p_Nombre, ''), NULLIF(p_ApellidoPaterno, ''), NULLIF(p_ApellidoMaterno, '')));

      INSERT INTO Empleados
      (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento,
       Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais)
      VALUES
      (p_NuevoUsuario, p_NuevoPassword, p_NuevoRol, p_NuevoPuesto, COALESCE(NULLIF(p_NuevoTurno, ''), 'Any'), COALESCE(p_NuevoSalario, 0.00),
       NULLIF(v_nombre_completo, ''), p_Nombre, p_ApellidoPaterno, p_ApellidoMaterno, p_Genero, p_FechaNacimiento,
       p_Calle, p_NumeroExterior, p_NumeroInterior, p_Colonia, p_Ciudad, p_Estado, p_CodigoPostal, COALESCE(NULLIF(p_Pais, ''), 'México'));
    END
  `);
}

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

async function registrarClienteVenta(datosCliente = {}) {
  const nombreCompleto = buildFullName(datosCliente);
  if (!nombreCompleto) return null;

  const usernameBase = `cliente_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const empleadoResult = await query(
    `INSERT INTO Empleados
     (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento)
     VALUES (?, ?, 'Cliente', 'Cliente', 'Any', 0.00, ?, ?, ?, ?, ?, ?)`,
    [
      usernameBase,
      Math.random().toString(36).slice(2, 12),
      nombreCompleto,
      datosCliente.nombre || null,
      datosCliente.apellidoPaterno || null,
      datosCliente.apellidoMaterno || null,
      datosCliente.genero || null,
      datosCliente.fechaNacimiento || null
    ]
  );

  const idCliente = empleadoResult.insertId;
  await query(
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
  await ensureEmpleadosRolProgramador();

  await ensureColumn('Empleados', 'Nombre', 'VARCHAR(60) NULL AFTER NombreCompleto');
  await ensureColumn('Empleados', 'ApellidoPaterno', 'VARCHAR(60) NULL AFTER Nombre');
  await ensureColumn('Empleados', 'ApellidoMaterno', 'VARCHAR(60) NULL AFTER ApellidoPaterno');
  await ensureColumn('Empleados', 'Genero', "ENUM('Femenino','Masculino','No binario','Prefiero no decir','Otro') NULL AFTER ApellidoMaterno");
  await ensureColumn('Empleados', 'FechaNacimiento', 'DATE NULL AFTER Genero');
  await ensureColumn('Empleados', 'Calle', 'VARCHAR(100) NULL AFTER Direccion');
  await ensureColumn('Empleados', 'NumeroExterior', 'VARCHAR(20) NULL AFTER Calle');
  await ensureColumn('Empleados', 'NumeroInterior', 'VARCHAR(20) NULL AFTER NumeroExterior');
  await ensureColumn('Empleados', 'Colonia', 'VARCHAR(80) NULL AFTER NumeroInterior');
  await ensureColumn('Empleados', 'Ciudad', 'VARCHAR(80) NULL AFTER Colonia');
  await ensureColumn('Empleados', 'Estado', 'VARCHAR(80) NULL AFTER Ciudad');
  await ensureColumn('Empleados', 'CodigoPostal', 'VARCHAR(15) NULL AFTER Estado');
  await ensureColumn('Empleados', 'Pais', "VARCHAR(80) DEFAULT 'México' AFTER CodigoPostal");

  await query(`
    UPDATE Empleados
    SET Nombre = COALESCE(NULLIF(Nombre, ''), TRIM(SUBSTRING_INDEX(NombreCompleto, ' ', 1))),
        ApellidoMaterno = COALESCE(NULLIF(ApellidoMaterno, ''), NULLIF(TRIM(SUBSTRING_INDEX(NombreCompleto, ' ', -1)), NombreCompleto))
    WHERE NombreCompleto IS NOT NULL
      AND (Nombre IS NULL OR Nombre = '')
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Clientes (
      IdCliente INT AUTO_INCREMENT PRIMARY KEY,
      Nombre VARCHAR(60) NOT NULL,
      ApellidoPaterno VARCHAR(60),
      ApellidoMaterno VARCHAR(60),
      Genero ENUM('Femenino','Masculino','No binario','Prefiero no decir','Otro') NOT NULL,
      FechaNacimiento DATE NULL,
      NombreCompleto VARCHAR(180),
      FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
      Activo BOOLEAN DEFAULT TRUE
    )
  `);

  await ensureColumn('Proveedores', 'NombreEmpresa', 'VARCHAR(100) NULL AFTER Nombre');
  await ensureColumn('Proveedores', 'ContactoNombre', 'VARCHAR(60) NULL AFTER Contacto');
  await ensureColumn('Proveedores', 'ContactoApellidoPaterno', 'VARCHAR(60) NULL AFTER ContactoNombre');
  await ensureColumn('Proveedores', 'ContactoApellidoMaterno', 'VARCHAR(60) NULL AFTER ContactoApellidoPaterno');
  await ensureColumn('Proveedores', 'Calle', 'VARCHAR(100) NULL AFTER Direccion');
  await ensureColumn('Proveedores', 'NumeroExterior', 'VARCHAR(20) NULL AFTER Calle');
  await ensureColumn('Proveedores', 'NumeroInterior', 'VARCHAR(20) NULL AFTER NumeroExterior');
  await ensureColumn('Proveedores', 'Colonia', 'VARCHAR(80) NULL AFTER NumeroInterior');
  await ensureColumn('Proveedores', 'Ciudad', 'VARCHAR(80) NULL AFTER Colonia');
  await ensureColumn('Proveedores', 'Estado', 'VARCHAR(80) NULL AFTER Ciudad');
  await ensureColumn('Proveedores', 'CodigoPostal', 'VARCHAR(15) NULL AFTER Estado');
  await ensureColumn('Proveedores', 'Pais', "VARCHAR(80) DEFAULT 'México' AFTER CodigoPostal");

  await query(`
    INSERT IGNORE INTO Empleados
    (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, Genero)
    VALUES ('programador', 'programador123', 'Programador', 'Programador del sistema', 'Any', 0.00,
            'Programador Sistema', 'Programador', 'Sistema', 'Prefiero no decir')
  `);

  await ensureSecurityProcedure();
  await query(`
    INSERT IGNORE INTO Clientes (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto, Activo)
    SELECT IdEmpleado,
           COALESCE(NULLIF(Nombre, ''), TRIM(SUBSTRING_INDEX(NombreCompleto, ' ', 1)), NombreUsuario),
           NULLIF(ApellidoPaterno, ''),
           NULLIF(ApellidoMaterno, ''),
           COALESCE(Genero, 'Prefiero no decir'),
           FechaNacimiento,
           COALESCE(NombreCompleto, NombreUsuario),
           Activo
    FROM Empleados
    WHERE Rol = 'Cliente'
  `);

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

  await query(`
    CREATE TABLE IF NOT EXISTS RecepcionesProveedor (
      IdRecepcion INT AUTO_INCREMENT PRIMARY KEY,
      NumeroRecepcion VARCHAR(40) NOT NULL UNIQUE,
      Folio VARCHAR(40) NOT NULL,
      IdProveedor INT NOT NULL,
      IdEmpleado INT NULL,
      FechaRecepcion DATETIME DEFAULT CURRENT_TIMESTAMP,
      PuedeModificarHasta DATETIME NOT NULL,
      Total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      Estado ENUM('Recibida', 'Modificada', 'Devuelta') DEFAULT 'Recibida',
      Observaciones TEXT,
      FOREIGN KEY (IdProveedor) REFERENCES Proveedores(IdProveedor),
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS RecepcionProveedorDetalle (
      IdDetalleRecepcion INT AUTO_INCREMENT PRIMARY KEY,
      IdRecepcion INT NOT NULL,
      IdArticulo INT NOT NULL,
      Cantidad INT NOT NULL,
      CostoUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      FOREIGN KEY (IdRecepcion) REFERENCES RecepcionesProveedor(IdRecepcion) ON DELETE CASCADE,
      FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS DevolucionesCliente (
      IdDevolucion INT AUTO_INCREMENT PRIMARY KEY,
      FolioDevolucion VARCHAR(40) NOT NULL UNIQUE,
      IdVenta INT NOT NULL,
      IdEmpleado INT NULL,
      FechaDevolucion DATETIME DEFAULT CURRENT_TIMESTAMP,
      TotalReintegrado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      Motivo TEXT,
      FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta),
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS DevolucionClienteDetalle (
      IdDetalleDevolucion INT AUTO_INCREMENT PRIMARY KEY,
      IdDevolucion INT NOT NULL,
      IdArticulo INT NOT NULL,
      Cantidad INT NOT NULL,
      PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      FOREIGN KEY (IdDevolucion) REFERENCES DevolucionesCliente(IdDevolucion) ON DELETE CASCADE,
      FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
    )
  `);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(list) {
  return list[randomInt(0, list.length - 1)];
}

async function seedRandomDataIfEmpty() {
  const [{ totalArticulos }] = await query('SELECT COUNT(*) AS totalArticulos FROM Articulos');
  const [{ totalEmpleados }] = await query("SELECT COUNT(*) AS totalEmpleados FROM Empleados WHERE Rol IN ('Empleado','Gerente')");
  const [{ totalVentas }] = await query('SELECT COUNT(*) AS totalVentas FROM Ventas');

  if (Number(totalArticulos) > 0 && Number(totalEmpleados) > 0 && Number(totalVentas) > 0) {
    return { seeded: false };
  }

  await beginTransaction();
  try {
    const usuarios = [
      ['gerente_demo', 'demo123', 'Gerente', 'Gerente General', 'Matutino', 18000, 'Gerente Demo'],
      ['empleado_demo_1', 'demo123', 'Empleado', 'Cajero', 'Matutino', 9000, 'Cajero Demo 1'],
      ['empleado_demo_2', 'demo123', 'Empleado', 'Vendedor', 'Vespertino', 8500, 'Vendedor Demo 2'],
      ['cliente_demo_1', 'demo123', 'Cliente', 'Cliente', 'Any', 0, 'Cliente Demo 1'],
      ['cliente_demo_2', 'demo123', 'Cliente', 'Cliente', 'Any', 0, 'Cliente Demo 2']
    ];
    for (const u of usuarios) {
      await query(
        `INSERT IGNORE INTO Empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        u
      );
    }

    await query(`
      INSERT IGNORE INTO Clientes (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto, Activo)
      SELECT IdEmpleado,
             COALESCE(NULLIF(Nombre, ''), TRIM(SUBSTRING_INDEX(NombreCompleto, ' ', 1)), NombreUsuario),
             NULLIF(ApellidoPaterno, ''),
             NULLIF(ApellidoMaterno, ''),
             COALESCE(Genero, 'Prefiero no decir'),
             FechaNacimiento,
             COALESCE(NombreCompleto, NombreUsuario),
             Activo
      FROM Empleados
      WHERE Rol = 'Cliente'
    `);

    const categorias = await query('SELECT IdCategoria FROM Categorias');
    const articulos = await query('SELECT IdArticulo, PrecioVenta FROM Articulos');
    const empleados = await query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Empleado' LIMIT 5");
    const clientes = await query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Cliente' LIMIT 5");

    if (!categorias.length) {
      await query("INSERT INTO Categorias (Nombre, Descripcion) VALUES ('Panadería', 'Productos base')");
    }

    if (!articulos.length) {
      const categoriasNuevas = await query('SELECT IdCategoria FROM Categorias');
      const idCategoria = categoriasNuevas[0].IdCategoria;
      const productosBase = [
        ['Pan integral', 'Pan integral artesanal', idCategoria, randomInt(20, 70), 10, 16, 8],
        ['Croissant', 'Croissant de mantequilla', idCategoria, randomInt(20, 70), 10, 20, 11],
        ['Muffin chocolate', 'Muffin de chocolate', idCategoria, randomInt(20, 70), 10, 22, 12]
      ];
      for (const p of productosBase) {
        await query(
          `INSERT INTO Articulos (Nombre, Descripcion, IdCategoria, Cantidad, Minimo, PrecioVenta, PrecioCompra)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          p
        );
      }
    }

    const articulosFinal = await query('SELECT IdArticulo, PrecioVenta, Cantidad, Nombre FROM Articulos');
    const empleadosFinal = await query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Empleado'");
    const clientesFinal = await query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Cliente'");

    if (!Number(totalVentas)) {
      const cantidadVentas = randomInt(8, 16);
      for (let i = 0; i < cantidadVentas; i++) {
        const idEmpleado = randomItem(empleadosFinal).IdEmpleado;
        const idCliente = randomItem(clientesFinal).IdEmpleado;
        const lineas = randomInt(1, 3);
        const usados = new Set();
        let subtotal = 0;
        const detalle = [];
        for (let j = 0; j < lineas; j++) {
          const candidato = randomItem(articulosFinal);
          if (usados.has(candidato.IdArticulo)) continue;
          usados.add(candidato.IdArticulo);
          const cantidad = randomInt(1, 4);
          const precio = Number(candidato.PrecioVenta || 0);
          const sub = cantidad * precio;
          subtotal += sub;
          detalle.push({ idArticulo: candidato.IdArticulo, cantidad, precio, sub });
        }
        if (!detalle.length) continue;
        const iva = Number((subtotal * 0.16).toFixed(2));
        const total = Number((subtotal + iva).toFixed(2));
        const venta = await query(
          `INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado)
           VALUES (?, ?, ?, ?, ?, 'Mostrador', 'Completada')`,
          [idEmpleado, idCliente, subtotal, iva, total]
        );
        for (const d of detalle) {
          await query(
            'INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal) VALUES (?, ?, ?, ?, ?)',
            [venta.insertId, d.idArticulo, d.cantidad, d.precio, d.sub]
          );
        }
      }
    }

    await commit();
    return { seeded: true };
  } catch (error) {
    await rollback();
    throw error;
  }
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

  return salesRows[0]?.PrimeraVenta || formatLocalSqlDateTime(new Date());
}

app.whenReady().then(async () => {
  await ensureSupportTables();
  await seedRandomDataIfEmpty();
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
  if (data.usuarioEjecutaRol === 'Gerente' && data.rol !== 'Empleado') {
    throw new Error('Acceso denegado: el Gerente solo puede registrar empleados. Los gerentes se agregan desde Programador.');
  }

  const nombreCompleto = data.name || buildFullName(data);
  const results = await query(
    `INSERT INTO Empleados
    (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento,
     Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.username,
      data.password,
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
    await query(
      `INSERT IGNORE INTO Clientes
       (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [results.insertId, data.nombre || nombreCompleto || data.username, data.apellidoPaterno || null, data.apellidoMaterno || null, data.genero || 'Prefiero no decir', data.fechaNacimiento || null, nombreCompleto || data.username]
    );
  }

  return { id: results.insertId };
});

ipcMain.handle('registrarProveedor', async (event, data) => {
  const contactoCompleto = [data.contactoNombre, data.contactoApellidoPaterno, data.contactoApellidoMaterno]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ') || data.contacto || null;
  const direccionCompleta = [data.calle, data.numeroExterior, data.numeroInterior, data.colonia, data.ciudad, data.estado, data.codigoPostal, data.pais]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ') || data.direccion || null;

  const results = await query(
    `INSERT INTO Proveedores
     (Nombre, NombreEmpresa, Direccion, Calle, NumeroExterior, NumeroInterior, Colonia, Ciudad, Estado, CodigoPostal, Pais,
      Telefono, Correo, Contacto, ContactoNombre, ContactoApellidoPaterno, ContactoApellidoMaterno, RUC)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

ipcMain.handle('modificarUsuario', async (event, data) => {
  if (data.usuarioEjecutaRol === 'Gerente' && data.rol !== 'Empleado') {
    throw new Error('Acceso denegado: el Gerente solo puede modificar empleados. Los gerentes se gestionan desde Programador.');
  }

  const nombreCompleto = data.name || buildFullName(data);
  const result = await query(
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
    await query(
      `INSERT INTO Clientes (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, FechaNacimiento, NombreCompleto, Activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), ApellidoPaterno = VALUES(ApellidoPaterno), ApellidoMaterno = VALUES(ApellidoMaterno),
                               Genero = VALUES(Genero), FechaNacimiento = VALUES(FechaNacimiento), NombreCompleto = VALUES(NombreCompleto), Activo = TRUE`,
      [data.id, data.nombre || nombreCompleto || data.username, data.apellidoPaterno || null, data.apellidoMaterno || null, data.genero || 'Prefiero no decir', data.fechaNacimiento || null, nombreCompleto || data.username]
    );
  }

  return result;
});

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
ipcMain.handle('getClientes', async () => query(
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
ipcMain.handle('getProveedores', async () => query('SELECT * FROM Proveedores ORDER BY IdProveedor ASC'));

ipcMain.handle('programadorCambiarPassword', async (event, payload = {}) => {
  const { usernameProgramador, passwordProgramador, usuarioObjetivo, passwordNuevo } = payload;
  if (!usernameProgramador || !passwordProgramador || !usuarioObjetivo || !passwordNuevo) {
    throw new Error('Completa las credenciales del programador, el usuario objetivo y la nueva contraseña.');
  }

  const programadores = await query(
    `SELECT IdEmpleado FROM Empleados
     WHERE NombreUsuario = ? AND Password = ? AND Rol = 'Programador' AND Activo = TRUE`,
    [usernameProgramador, passwordProgramador]
  );

  if (!programadores.length) {
    throw new Error('Solo un programador activo puede cambiar contraseñas mediante el procedimiento almacenado.');
  }

  await query('CALL sp_programador_cambiar_password(?, ?, ?)', [programadores[0].IdEmpleado, usuarioObjetivo, passwordNuevo]);
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

  await query(
    `CALL AgregarEmpleadoPorProgramador(?, ?, ?, ?, 'Gerente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.usernameProgramador,
      payload.passwordProgramador,
      payload.username,
      payload.password,
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
    datosCliente = null,
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
    let idClienteVenta = idCliente;

    if (datosCliente && buildFullName(datosCliente)) {
      if (canal === 'Autocobro' && !datosCliente.genero) {
        throw new Error('El género del cliente es requerido para autocobro.');
      }
      idClienteVenta = await registrarClienteVenta(datosCliente);
    }

    const ventaResults = await query(
      `INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado)
       VALUES (?, ?, ?, ?, ?, 'Mostrador', 'Completada')`,
      [idEmpleado, idClienteVenta, subtotal, iva, total]
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
      idCliente: idClienteVenta,
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

async function obtenerDetalleRecepcion(idRecepcion) {
  const headers = await query(
    `SELECT rp.*, p.Nombre AS NombreProveedor, e.NombreCompleto AS NombreEmpleado
     FROM RecepcionesProveedor rp
     JOIN Proveedores p ON p.IdProveedor = rp.IdProveedor
     LEFT JOIN Empleados e ON e.IdEmpleado = rp.IdEmpleado
     WHERE rp.IdRecepcion = ?`,
    [idRecepcion]
  );
  if (!headers.length) throw new Error('Recepción no encontrada.');

  const detalles = await query(
    `SELECT rd.*, a.Nombre AS NombreProducto
     FROM RecepcionProveedorDetalle rd
     JOIN Articulos a ON a.IdArticulo = rd.IdArticulo
     WHERE rd.IdRecepcion = ?`,
    [idRecepcion]
  );

  return { ...headers[0], detalles };
}

ipcMain.handle('getRecepcionesProveedor', async () => query(
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

  await beginTransaction();
  try {
    const numeroRecepcion = generarFolio('REC');
    const folio = generarFolio('FOL');
    const fechaRecepcion = formatLocalSqlDateTime(new Date());
    const puedeModificarHasta = formatLocalSqlDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const total = items.reduce((acc, item) => acc + (Number(item.costoUnitario) * Number(item.cantidad)), 0);

    const recepcionResult = await query(
      `INSERT INTO RecepcionesProveedor
       (NumeroRecepcion, Folio, IdProveedor, IdEmpleado, FechaRecepcion, PuedeModificarHasta, Total, Estado, Observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Recibida', ?)`,
      [numeroRecepcion, folio, idProveedor, idEmpleado, fechaRecepcion, puedeModificarHasta, total, observaciones]
    );

    const idRecepcion = recepcionResult.insertId;

    for (const item of items) {
      const articulo = await query('SELECT IdArticulo, Nombre, Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
      if (!articulo.length) throw new Error('Uno de los productos ya no existe.');

      const cantidadActual = Number(articulo[0].Cantidad || 0);
      const cantidadNueva = cantidadActual + Number(item.cantidad);
      const subtotal = Number(item.costoUnitario) * Number(item.cantidad);

      await query(
        `INSERT INTO RecepcionProveedorDetalle (IdRecepcion, IdArticulo, Cantidad, CostoUnitario, Subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idRecepcion, item.idArticulo, item.cantidad, item.costoUnitario, subtotal]
      );

      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);

      await query(
        `INSERT INTO MovimientosInventario
         (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
         VALUES (?, 'Entrada', ?, ?, ?, ?, ?, 'Compra', ?, ?)`,
        [item.idArticulo, item.cantidad, cantidadActual, cantidadNueva, `Recepción proveedor ${numeroRecepcion}`, idRecepcion, idEmpleado, observaciones || `Ingreso por proveedor ${idProveedor}`]
      );
    }

    await commit();
    return { success: true, idRecepcion, numeroRecepcion, folio, total: Number(total.toFixed(2)) };
  } catch (error) {
    await rollback();
    throw error;
  }
});

ipcMain.handle('modificarRecepcionProveedor', async (event, payload = {}) => {
  const { idRecepcion, observaciones = '', items = [] } = payload;
  if (!idRecepcion) throw new Error('Selecciona una recepción.');
  if (!items.length) throw new Error('Agrega al menos un producto a la recepción.');

  await beginTransaction();
  try {
    const recepcion = await obtenerDetalleRecepcion(idRecepcion);
    if (recepcion.Estado === 'Devuelta') throw new Error('No puedes modificar una recepción ya devuelta.');
    if (new Date(recepcion.PuedeModificarHasta).getTime() < Date.now()) {
      throw new Error('Solo puedes modificar la recepción dentro de las primeras 24 horas.');
    }

    for (const detalle of recepcion.detalles) {
      const articulo = await query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [detalle.IdArticulo]);
      const existenciaActual = Number(articulo[0]?.Cantidad || 0);
      if (existenciaActual < Number(detalle.Cantidad)) {
        throw new Error(`No es posible modificar la recepción porque el producto ${detalle.NombreProducto} ya tuvo movimiento físico.`);
      }
      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [existenciaActual - Number(detalle.Cantidad), detalle.IdArticulo]);
    }

    await query('DELETE FROM RecepcionProveedorDetalle WHERE IdRecepcion = ?', [idRecepcion]);

    let total = 0;
    for (const item of items) {
      const articulo = await query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
      if (!articulo.length) throw new Error('Uno de los productos ya no existe.');
      const cantidadActual = Number(articulo[0].Cantidad || 0);
      const cantidadNueva = cantidadActual + Number(item.cantidad);
      const subtotal = Number(item.costoUnitario) * Number(item.cantidad);
      total += subtotal;

      await query(
        `INSERT INTO RecepcionProveedorDetalle (IdRecepcion, IdArticulo, Cantidad, CostoUnitario, Subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idRecepcion, item.idArticulo, item.cantidad, item.costoUnitario, subtotal]
      );
      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);
    }

    await query(
      `UPDATE RecepcionesProveedor
       SET Total = ?, Estado = 'Modificada', Observaciones = ?
       WHERE IdRecepcion = ?`,
      [Number(total.toFixed(2)), observaciones || recepcion.Observaciones || '', idRecepcion]
    );

    await commit();
    return { success: true, idRecepcion, total: Number(total.toFixed(2)) };
  } catch (error) {
    await rollback();
    throw error;
  }
});

ipcMain.handle('devolverRecepcionProveedor', async (event, payload = {}) => {
  const { idRecepcion, motivo = 'Devolución al proveedor por error de recepción' } = payload;
  if (!idRecepcion) throw new Error('Selecciona una recepción.');

  await beginTransaction();
  try {
    const recepcion = await obtenerDetalleRecepcion(idRecepcion);
    if (recepcion.Estado === 'Devuelta') throw new Error('La recepción ya fue devuelta.');

    for (const detalle of recepcion.detalles) {
      const articulo = await query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [detalle.IdArticulo]);
      const existenciaActual = Number(articulo[0]?.Cantidad || 0);
      if (existenciaActual < Number(detalle.Cantidad)) {
        throw new Error(`No es posible devolver ${detalle.NombreProducto} porque ya hubo cambio físico en inventario.`);
      }
      const nuevaCantidad = existenciaActual - Number(detalle.Cantidad);
      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [nuevaCantidad, detalle.IdArticulo]);
      await query(
        `INSERT INTO MovimientosInventario
         (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
         VALUES (?, 'Salida', ?, ?, ?, ?, ?, 'Compra', ?, ?)`,
        [detalle.IdArticulo, detalle.Cantidad, existenciaActual, nuevaCantidad, 'Devolución a proveedor', idRecepcion, recepcion.IdEmpleado, motivo]
      );
    }

    await query("UPDATE RecepcionesProveedor SET Estado = 'Devuelta', Observaciones = ? WHERE IdRecepcion = ?", [motivo, idRecepcion]);
    await commit();
    return { success: true, idRecepcion };
  } catch (error) {
    await rollback();
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

  return query(
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

ipcMain.handle('getDevolucionesCliente', async () => query(
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

  await beginTransaction();
  try {
    const venta = await query('SELECT IdVenta FROM Ventas WHERE IdVenta = ?', [idVenta]);
    if (!venta.length) throw new Error('La venta seleccionada no existe.');

    const folioDevolucion = generarFolio('DEVCLI');
    let totalReintegrado = 0;

    const devolucionResult = await query(
      `INSERT INTO DevolucionesCliente (FolioDevolucion, IdVenta, IdEmpleado, TotalReintegrado, Motivo)
       VALUES (?, ?, ?, 0, ?)`,
      [folioDevolucion, idVenta, idEmpleado, motivo]
    );
    const idDevolucion = devolucionResult.insertId;

    for (const item of items) {
      const vendidos = await query(
        `SELECT vd.Cantidad, vd.PrecioUnitario, a.Nombre
         FROM VentaDetalle vd
         JOIN Articulos a ON a.IdArticulo = vd.IdArticulo
         WHERE vd.IdVenta = ? AND vd.IdArticulo = ?`,
        [idVenta, item.idArticulo]
      );
      if (!vendidos.length) throw new Error('Uno de los productos no pertenece a la venta.');

      const devueltosPrevios = await query(
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

      await query(
        `INSERT INTO DevolucionClienteDetalle (IdDevolucion, IdArticulo, Cantidad, PrecioUnitario, Subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [idDevolucion, item.idArticulo, item.cantidad, precioUnitario, subtotal]
      );

      const articulo = await query('SELECT Cantidad FROM Articulos WHERE IdArticulo = ?', [item.idArticulo]);
      const cantidadActual = Number(articulo[0]?.Cantidad || 0);
      const cantidadNueva = cantidadActual + Number(item.cantidad);
      await query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?', [cantidadNueva, item.idArticulo]);
      await query(
        `INSERT INTO MovimientosInventario
         (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, Observaciones)
         VALUES (?, 'Entrada', ?, ?, ?, 'Devolución cliente', ?, 'Ajuste', ?, ?)`,
        [item.idArticulo, item.cantidad, cantidadActual, cantidadNueva, idDevolucion, idEmpleado, motivo]
      );
    }

    await query('UPDATE DevolucionesCliente SET TotalReintegrado = ? WHERE IdDevolucion = ?', [Number(totalReintegrado.toFixed(2)), idDevolucion]);
    await commit();
    return { success: true, idDevolucion, folioDevolucion, totalReintegrado: Number(totalReintegrado.toFixed(2)) };
  } catch (error) {
    await rollback();
    throw error;
  }
});

ipcMain.handle('getReportes', async (event, filters = {}) => {
  const range = await resolveReportRange(filters);
  const ventas = await query(
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
  const fechaInicio = formatLocalSqlDateTime(fechaInicioRaw || new Date());
  const fechaFin = formatLocalSqlDateTime(new Date());

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
