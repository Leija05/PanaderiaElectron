const db = require('../src/main/database.js');

async function cleanProductionDb() {
  console.log('Limpiando datos ficticios de la base de datos para producción...');

  // Asegurar que las tablas existan primero
  await db.ensureSupportTables();

  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  await db.query('TRUNCATE TABLE VentaDetalle');
  await db.query('TRUNCATE TABLE VentasCanal');
  await db.query('TRUNCATE TABLE Ventas');
  await db.query('TRUNCATE TABLE MovimientosInventario');
  await db.query('TRUNCATE TABLE RecepcionProveedorDetalle');
  await db.query('TRUNCATE TABLE RecepcionesProveedor');
  await db.query('TRUNCATE TABLE DevolucionClienteDetalle');
  await db.query('TRUNCATE TABLE DevolucionesCliente');
  await db.query('TRUNCATE TABLE CortesTurno');
  await db.query('TRUNCATE TABLE Clientes');
  await db.query('TRUNCATE TABLE Articulos');
  await db.query('TRUNCATE TABLE LicenciaSistema');

  // Dejar únicamente el usuario programador en Empleados (sin ningún Gerente aún)
  await db.query("DELETE FROM Empleados WHERE Rol != 'Programador'");

  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // Asegurar soporte de tablas y categorías vacías
  await db.ensureSupportTables();

  const artCount = await db.query('SELECT COUNT(*) as c FROM Articulos');
  const ventCount = await db.query('SELECT COUNT(*) as c FROM Ventas');
  const empCount = await db.query('SELECT COUNT(*) as c FROM Empleados');
  const licCount = await db.query('SELECT COUNT(*) as c FROM LicenciaSistema');

  console.log('Estado de Base de Datos para Producción:');
  console.log(' - Artículos:', artCount[0].c, '(CERO datos ficticios)');
  console.log(' - Ventas:', ventCount[0].c, '(CERO ventas falsas)');
  console.log(' - Empleados:', empCount[0].c, '(Solo programador interno, esperando Gerente)');
  console.log(' - Licencias Activas:', licCount[0].c, '(Esperando activación)');

  await db.closePool();
  console.log('✨ Base de datos lista, limpia y estructurada para uso comercial real.');
}

if (require.main === module) {
  cleanProductionDb().catch((e) => {
    console.error('Error limpiando base de datos:', e);
    process.exit(1);
  });
}

module.exports = { cleanProductionDb };
