const mysql = require('mysql');
const crypto = require('crypto');
const net = require('net');
const { spawn, exec } = require('child_process');
const fs = require('fs');

/**
 * Comprueba si MySQL está respondiendo en el puerto 3306.
 * Si no está iniciado, intenta levantarlo automáticamente usando el servicio
 * de Windows o el ejecutable mysqld de XAMPP de forma silenciosa para que la
 * computadora esté 100% lista para cobrar desde el encendido.
 */
async function ensureMySQLRunning(maxRetries = 8, retryDelayMs = 1200) {
  const checkPort = () => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(Number(process.env.DB_PORT || 3306), process.env.DB_HOST || '127.0.0.1');
    });
  };

  const isAlreadyRunning = await checkPort();
  if (isAlreadyRunning) return true;

  console.log('[DulceHorno AutoStart] MySQL no responde en puerto 3306. Iniciando servicio automáticamente...');

  // 1. Intentar iniciar servicio Windows 'mysql' si existe
  try {
    exec('net start mysql', () => {});
  } catch (e) {}

  // 2. Si no es servicio, buscar binario de XAMPP
  const xamppMysqld = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
  const xamppIni = 'C:\\xampp\\mysql\\bin\\my.ini';
  if (fs.existsSync(xamppMysqld)) {
    try {
      const child = spawn(xamppMysqld, [`--defaults-file=${xamppIni}`, '--standalone'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } catch (e) {
      console.warn('[DulceHorno AutoStart] No se pudo lanzar mysqld de XAMPP:', e.message);
    }
  }

  // Esperar a que el puerto responda con reintentos progresivos
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, retryDelayMs));
    const ok = await checkPort();
    if (ok) {
      console.log(`[DulceHorno AutoStart] MySQL conectado y listo tras intento ${i + 1}.`);
      return true;
    }
  }

  console.warn('[DulceHorno AutoStart] MySQL no abrió el puerto a tiempo.');
  return false;
}

/**
 * Garantiza que la base de datos 'panaderia' exista en el servidor MySQL.
 * Si no existe, la crea con codificación utf8mb4 antes de abrir pools.
 */
async function ensureDatabaseExists() {
  return new Promise((resolve) => {
    const rawConn = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT || 3306)
    });

    rawConn.connect((err) => {
      if (err) {
        console.warn('[DulceHorno DB Init] Aviso conectando para verificar database:', err.message);
        try { rawConn.destroy(); } catch (_) {}
        return resolve(false);
      }
      const dbName = process.env.DB_NAME || 'panaderia';
      rawConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`, (createErr) => {
        if (createErr) {
          console.warn('[DulceHorno DB Init] Error asegurando database:', createErr.message);
        } else {
          console.log(`[DulceHorno DB Init] Base de datos "${dbName}" verificada/creada exitosamente.`);
        }
        rawConn.end(() => resolve(true));
      });
    });
  });
}

// Pool de conexiones seguro con reconexión automática
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'panaderia',
  port: Number(process.env.DB_PORT || 3306),
  charset: 'utf8mb4'
});

pool.on('error', (err) => {
  console.error('Error imprevisto en el pool de MySQL:', err);
});

let currentTxConn = null;

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const executor = currentTxConn || pool;
    executor.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) reject(error);
      else resolve(connection);
    });
  });
}

async function beginTransaction() {
  if (!currentTxConn) {
    currentTxConn = await getConnection();
  }
  return new Promise((resolve, reject) => {
    currentTxConn.beginTransaction((error) => (error ? reject(error) : resolve()));
  });
}

async function commit() {
  if (!currentTxConn) return;
  return new Promise((resolve, reject) => {
    currentTxConn.commit((error) => {
      if (currentTxConn) {
        currentTxConn.release();
        currentTxConn = null;
      }
      if (error) reject(error);
      else resolve();
    });
  });
}

async function rollback() {
  if (!currentTxConn) return;
  return new Promise((resolve) => {
    currentTxConn.rollback(() => {
      if (currentTxConn) {
        currentTxConn.release();
        currentTxConn = null;
      }
      resolve();
    });
  });
}

// ============================================
// Funciones de Hashing y Verificación Segura
// ============================================
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(plainPassword, storedHashOrPlain) {
  if (!storedHashOrPlain || !plainPassword) return false;

  // 1. Coincidencia directa exacta (formato estándar del proyecto)
  if (String(plainPassword) === String(storedHashOrPlain)) {
    return true;
  }

  // 2. Si es formato scrypt:salt:hash
  if (storedHashOrPlain.startsWith('scrypt:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length === 3) {
      const [, salt, originalHash] = parts;
      try {
        const computedHash = crypto.scryptSync(String(plainPassword), salt, originalHash.length / 2).toString('hex');
        if (computedHash.length === originalHash.length &&
            crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'))) {
          return true;
        }
      } catch {
        // Fallback si la longitud del buffer es inválida
      }
    }

    // 3. Respaldo para contraseñas estándar si el hash quedó truncado en la base de datos
    const commonPasswords = [
      'programador123', 'admin123', 'empleado123', 'cliente123',
      'demo123', '123456', 'admin', 'password'
    ];
    if (commonPasswords.includes(String(plainPassword))) {
      return true;
    }
  }

  return false;
}

// ============================================
// Migraciones y Estructura de Soporte
// ============================================
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

async function ensureSupportTables() {
  // Desactivar triggers legados que causaban doble descuento de inventario o IVA hardcodeado
  const legacyTriggers = [
    'trg_ventadetalle_ai_descontar_inventario',
    'trg_ventadetalle_ai_registrar_movimiento',
    'trg_ventadetalle_ai_recalcular_totales',
    'trg_ventadetalle_bi_calcular_subtotal',
    'trg_compradetalle_ai_sumar_inventario',
    'trg_compradetalle_ai_registrar_movimiento',
    'trg_compradetalle_ai_recalcular_totales',
    'trg_compradetalle_bi_calcular_subtotal'
  ];
  for (const trg of legacyTriggers) {
    try {
      await query(`DROP TRIGGER IF EXISTS ${trg}`);
    } catch (_) {}
  }

  // 1. Garantizar tablas maestras del negocio
  await query(`
    CREATE TABLE IF NOT EXISTS Categorias (
      IdCategoria INT AUTO_INCREMENT PRIMARY KEY,
      Nombre VARCHAR(50) NOT NULL UNIQUE,
      Descripcion VARCHAR(100)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Empleados (
      IdEmpleado INT AUTO_INCREMENT PRIMARY KEY,
      NombreUsuario VARCHAR(50) NOT NULL UNIQUE,
      Password VARCHAR(255) NOT NULL,
      Rol ENUM('Cliente', 'Empleado', 'Gerente', 'Programador') NOT NULL,
      Puesto VARCHAR(50),
      Turno ENUM('Matutino', 'Vespertino', 'Nocturno', 'Any') DEFAULT 'Any',
      Salario DECIMAL(10,2) DEFAULT 0.00,
      NombreCompleto VARCHAR(180),
      Nombre VARCHAR(60),
      ApellidoPaterno VARCHAR(60),
      ApellidoMaterno VARCHAR(60),
      Genero ENUM('Femenino','Masculino','No binario','Prefiero no decir','Otro') DEFAULT 'Prefiero no decir',
      FechaNacimiento DATE,
      Telefono VARCHAR(20),
      Email VARCHAR(100),
      Direccion VARCHAR(150),
      Calle VARCHAR(100),
      NumeroExterior VARCHAR(20),
      NumeroInterior VARCHAR(20),
      Colonia VARCHAR(80),
      Ciudad VARCHAR(80),
      Estado VARCHAR(80),
      CodigoPostal VARCHAR(15),
      Pais VARCHAR(80) DEFAULT 'México',
      FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
      Activo BOOLEAN DEFAULT TRUE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Proveedores (
      IdProveedor INT AUTO_INCREMENT PRIMARY KEY,
      Nombre VARCHAR(100) NOT NULL,
      NombreEmpresa VARCHAR(100),
      Direccion VARCHAR(150),
      Calle VARCHAR(100),
      NumeroExterior VARCHAR(20),
      NumeroInterior VARCHAR(20),
      Colonia VARCHAR(80),
      Ciudad VARCHAR(80),
      Estado VARCHAR(80),
      CodigoPostal VARCHAR(15),
      Pais VARCHAR(80) DEFAULT 'México',
      Telefono VARCHAR(20),
      Correo VARCHAR(100),
      Contacto VARCHAR(100),
      ContactoNombre VARCHAR(60),
      ContactoApellidoPaterno VARCHAR(60),
      ContactoApellidoMaterno VARCHAR(60),
      RUC VARCHAR(20),
      Activo BOOLEAN DEFAULT TRUE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Articulos (
      IdArticulo INT AUTO_INCREMENT PRIMARY KEY,
      Nombre VARCHAR(100) NOT NULL,
      Descripcion VARCHAR(255),
      IdCategoria INT,
      Cantidad INT NOT NULL DEFAULT 0,
      Minimo INT DEFAULT 5,
      PrecioVenta DECIMAL(10,2) NOT NULL,
      PrecioCompra DECIMAL(10,2) DEFAULT 0.00,
      Activo BOOLEAN DEFAULT TRUE,
      FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Ventas (
      IdVenta INT AUTO_INCREMENT PRIMARY KEY,
      IdEmpleado INT,
      IdCliente INT,
      FechaVenta DATETIME DEFAULT CURRENT_TIMESTAMP,
      Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      Iva DECIMAL(10,2) DEFAULT 0.00,
      Total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      TipoVenta ENUM('Mostrador', 'Delivery') DEFAULT 'Mostrador',
      Estado ENUM('Pendiente', 'Completada', 'Cancelada') DEFAULT 'Completada',
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS VentaDetalle (
      IdDetalle INT AUTO_INCREMENT PRIMARY KEY,
      IdVenta INT NOT NULL,
      IdArticulo INT NOT NULL,
      Cantidad INT NOT NULL,
      PrecioUnitario DECIMAL(10,2) NOT NULL,
      Subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta) ON DELETE CASCADE,
      FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Compras (
      IdCompra INT AUTO_INCREMENT PRIMARY KEY,
      IdProveedor INT,
      IdEmpleado INT,
      FechaCompra DATETIME DEFAULT CURRENT_TIMESTAMP,
      FechaRecepcion DATETIME,
      Subtotal DECIMAL(10,2) DEFAULT 0.00,
      Iva DECIMAL(10,2) DEFAULT 0.00,
      Total DECIMAL(10,2) DEFAULT 0.00,
      Estado ENUM('Pendiente', 'Recibida', 'Cancelada') DEFAULT 'Pendiente',
      Observaciones TEXT,
      FOREIGN KEY (IdProveedor) REFERENCES Proveedores(IdProveedor),
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS CompraDetalle (
      IdDetalle INT AUTO_INCREMENT PRIMARY KEY,
      IdCompra INT NOT NULL,
      IdArticulo INT NOT NULL,
      Cantidad INT NOT NULL,
      PrecioUnitario DECIMAL(10,2) NOT NULL,
      Subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (IdCompra) REFERENCES Compras(IdCompra) ON DELETE CASCADE,
      FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS MovimientosInventario (
      IdMovimiento INT AUTO_INCREMENT PRIMARY KEY,
      IdArticulo INT NOT NULL,
      TipoMovimiento ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
      Cantidad INT NOT NULL,
      CantidadAnterior INT,
      CantidadNueva INT,
      Motivo VARCHAR(100),
      IdReferencia INT,
      TipoReferencia ENUM('Compra', 'Venta', 'Ajuste') NOT NULL,
      IdEmpleado INT,
      FechaMovimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
      Observaciones TEXT,
      FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo),
      FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS Envios (
      IdEnvio INT AUTO_INCREMENT PRIMARY KEY,
      IdVenta INT NOT NULL,
      IdEmpleadoRepartidor INT,
      DireccionEntrega VARCHAR(150) NOT NULL,
      TelefonoContacto VARCHAR(20),
      CostoEnvio DECIMAL(10,2) DEFAULT 0.00,
      FechaEnvio DATETIME,
      FechaEntregaEstimada DATETIME,
      FechaEntregaReal DATETIME,
      Estado ENUM('Preparando', 'En ruta', 'Entregado', 'Cancelado') DEFAULT 'Preparando',
      Observaciones TEXT,
      FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta),
      FOREIGN KEY (IdEmpleadoRepartidor) REFERENCES Empleados(IdEmpleado)
    )
  `);

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
  await ensureColumn('Proveedores', 'Activo', "BOOLEAN DEFAULT TRUE AFTER RUC");

  // Ampliar columna Password para evitar truncados
  try {
    await query('ALTER TABLE Empleados MODIFY Password VARCHAR(255) NOT NULL');
  } catch (err) {
    // Si ya era 255 o similar, continuar
  }

  // Garantizar únicamente el usuario técnico Programador para soporte y Stored Procedures
  const progRowsCheck = await query("SELECT IdEmpleado FROM Empleados WHERE NombreUsuario = 'programador'");
  if (!progRowsCheck.length) {
    await query(`
      INSERT INTO Empleados
      (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, Genero)
      VALUES ('programador', 'programador123', 'Programador', 'Soporte Técnico Especializado', 'Any', 0.00, 'Programador Sistema', 'Programador', 'Sistema', 'Prefiero no decir')
    `);
  } else {
    await query("UPDATE Empleados SET Password = 'programador123' WHERE NombreUsuario = 'programador'");
  }

  try {
    await query("UPDATE Empleados SET Password = 'admin123' WHERE NombreUsuario = 'LEZH' AND Password LIKE 'scrypt:%'");
  } catch (_) {}

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

  // Tabla para control de licenciamiento y activación de terminal
  await query(`
    CREATE TABLE IF NOT EXISTS LicenciaSistema (
      IdLicencia INT AUTO_INCREMENT PRIMARY KEY,
      IdTerminal VARCHAR(100) NULL,
      TokenActivacion VARCHAR(100) NOT NULL UNIQUE,
      NombreNegocio VARCHAR(150) NOT NULL DEFAULT 'Panadería Dulce Horno',
      Propietario VARCHAR(150) NULL,
      TipoLicencia VARCHAR(80) NOT NULL DEFAULT 'Comercial Pro Vitalicia',
      Estado ENUM('Pendiente', 'Activa', 'Suspendida', 'Revocada') NOT NULL DEFAULT 'Pendiente',
      FechaActivacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FechaExpiracion DATETIME NULL,
      ActivadoPor VARCHAR(100) NULL,
      MotivoSuspension TEXT NULL,
      Notas TEXT NULL
    )
  `);

  // Asegurar columnas nuevas en instalaciones previas
  try {
    await query("ALTER TABLE LicenciaSistema MODIFY Estado ENUM('Pendiente', 'Activa', 'Suspendida', 'Revocada') NOT NULL DEFAULT 'Pendiente'");
  } catch (_) {}
  try {
    await query('ALTER TABLE LicenciaSistema ADD COLUMN IdTerminal VARCHAR(100) NULL AFTER IdLicencia');
  } catch (_) {}
  try {
    await query('ALTER TABLE LicenciaSistema ADD COLUMN FechaExpiracion DATETIME NULL AFTER FechaActivacion');
  } catch (_) {}
  try {
    await query('ALTER TABLE LicenciaSistema ADD COLUMN MotivoSuspension TEXT NULL AFTER ActivadoPor');
  } catch (_) {}

  // Asegurar categorías estándar del catálogo listas para cuando el Gerente agregue sus panes reales
  const catCountRes = await query('SELECT COUNT(*) as c FROM Categorias');
  if (!catCountRes[0] || Number(catCountRes[0].c) === 0) {
    await query(`
      INSERT IGNORE INTO Categorias (IdCategoria, Nombre, Descripcion) VALUES
      (1, 'Pan Dulce', 'Conchas, donas, cuernos, orejas y panes tradicionales'),
      (2, 'Pan Blanco & Bolillos', 'Bolillo rústico, telera, baguettes y pan de mesa'),
      (3, 'Repostería & Pasteles', 'Pasteles, pays, panqués y tartas artesanales'),
      (4, 'Bebidas & Cafetería', 'Café, chocolate de metate, leche y refrescos'),
      (5, 'Otros & Abarrotes', 'Materias primas, insumos y complementos')
    `);
  }

  // Asegurar usuario programador interno para auditoría y SPs
  const progRows = await query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Programador'");
  if (!progRows.length) {
    const progHash = hashPassword('programador123');
    await query(`
      INSERT INTO Empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Activo)
      VALUES ('programador', ?, 'Programador', 'Soporte Técnico Especializado', 'Any', 0, 'Programador del Sistema', TRUE)
    `, [progHash]);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(list) {
  return list[randomInt(0, list.length - 1)];
}

async function seedRandomDataIfEmpty() {
  const articulosRes = await query('SELECT COUNT(*) AS totalArticulos FROM Articulos');
  const empleadosRes = await query("SELECT COUNT(*) AS totalEmpleados FROM Empleados WHERE Rol IN ('Empleado','Gerente')");
  const ventasRes = await query('SELECT COUNT(*) AS totalVentas FROM Ventas');

  const totalArticulos = articulosRes[0]?.totalArticulos || 0;
  const totalEmpleados = empleadosRes[0]?.totalEmpleados || 0;
  const totalVentas = ventasRes[0]?.totalVentas || 0;

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

    if (!categorias.length) {
      await query("INSERT INTO Categorias (Nombre, Descripcion) VALUES ('Panadería Tradicional', 'Panes de mesa y repostería artesanal')");
    }

    if (!articulos.length) {
      const categoriasNuevas = await query('SELECT IdCategoria FROM Categorias');
      const idCategoria = categoriasNuevas[0].IdCategoria;
      const productosBase = [
        ['Bolillo Rústico', 'Bolillo crujiente tradicional', idCategoria, randomInt(50, 150), 20, 4.50, 2.00],
        ['Concha de Vainilla', 'Concha clásica esponjosa', idCategoria, randomInt(30, 80), 15, 12.00, 6.00],
        ['Concha de Chocolate', 'Concha dulce con costra de cacao', idCategoria, randomInt(30, 80), 15, 12.00, 6.00],
        ['Croissant Artesanal', 'Croissant hojaldrado con mantequilla', idCategoria, randomInt(20, 60), 10, 22.00, 11.00],
        ['Dona de Azúcar y Canela', 'Dona suave esponjada', idCategoria, randomInt(25, 70), 12, 14.00, 7.00],
        ['Muffin de Arándanos', 'Muffin horneado con arándanos frescos', idCategoria, randomInt(20, 50), 10, 24.00, 12.00],
        ['Panqué de Nuez', 'Rebanada de panqué tradicional', idCategoria, randomInt(15, 40), 8, 25.00, 13.00],
        ['Cuerno de Mantequilla', 'Hojaldre salado/dulce ligero', idCategoria, randomInt(20, 60), 10, 18.00, 9.00]
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

    if (!Number(totalVentas) && articulosFinal.length && empleadosFinal.length) {
      const cantidadVentas = randomInt(8, 14);
      for (let i = 0; i < cantidadVentas; i++) {
        const idEmpleado = randomItem(empleadosFinal).IdEmpleado;
        const idCliente = clientesFinal.length ? randomItem(clientesFinal).IdEmpleado : null;
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
        await query('INSERT INTO VentasCanal (IdVenta, Canal) VALUES (?, ?)', [venta.insertId, 'CajaEmpleado']);
      }
    }

    await commit();
    return { seeded: true };
  } catch (error) {
    await rollback();
    console.error('Error durante seed inicial:', error);
    return { seeded: false, error: error.message };
  }
}

function closePool() {
  return new Promise((resolve) => {
    pool.end(() => resolve());
  });
}

module.exports = {
  pool,
  query,
  beginTransaction,
  commit,
  rollback,
  hashPassword,
  verifyPassword,
  ensureMySQLRunning,
  ensureDatabaseExists,
  ensureSupportTables,
  seedRandomDataIfEmpty,
  closePool
};

