const db = require('../src/main/database');
const testDatabase = require('./database.test');
const testAuth = require('./auth.test');
const testPosSales = require('./pos-sales.test');
const testInventory = require('./inventory.test');
const testCorte = require('./corte.test');

async function ensureTestFixtures() {
  await db.ensureSupportTables();
  
  // Categoría de prueba
  await db.query("INSERT IGNORE INTO Categorias (IdCategoria, Nombre, Descripcion) VALUES (1, 'Panadería Test', 'Categoría para pruebas automatizadas')");

  // Artículo 101 de prueba para ventas e inventario
  await db.query(`
    INSERT INTO Articulos (IdArticulo, Nombre, Descripcion, IdCategoria, Cantidad, Minimo, PrecioVenta, PrecioCompra)
    VALUES (101, 'Bolillo Tradicional Crujiente', 'Bolillo de prueba', 1, 85, 20, 8.00, 3.50)
    ON DUPLICATE KEY UPDATE Cantidad = 85, Minimo = 20, PrecioVenta = 8.00
  `);

  // Usuarios de prueba para autenticación y RBAC
  const testUsers = [
    ['admin', 'admin123', 'Gerente', 'Gerente General'],
    ['empleado1', 'empleado123', 'Empleado', 'Cajero Test'],
    ['programador', 'programador123', 'Programador', 'Soporte'],
    ['gerente_demo', 'demo123', 'Gerente', 'Gerente Demo'],
    ['empleado_demo_1', 'demo123', 'Empleado', 'Empleado Demo'],
    ['cliente1', 'cliente123', 'Cliente', 'Cliente Test']
  ];

  for (const [u, p, r, pos] of testUsers) {
    const hash = db.hashPassword(p);
    await db.query(`
      INSERT INTO Empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Activo)
      VALUES (?, ?, ?, ?, 'Any', 0, ?, TRUE)
      ON DUPLICATE KEY UPDATE Password = VALUES(Password), Activo = TRUE
    `, [u, hash, r, pos, u]);
  }
}

async function runAllTests() {
  const start = Date.now();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   DULCE HORNO - EJECUTOR DE PRUEBAS AUTOMATIZADAS     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await ensureTestFixtures();

  let passed = 0;
  let failed = 0;

  const suites = [
    { name: 'Base de Datos & Transacciones ACID', fn: testDatabase },
    { name: 'Autenticación & Control de Acceso RBAC', fn: testAuth },
    { name: 'Ventas POS & Deducción Atómica de Stock', fn: testPosSales },
    { name: 'Inventario, Alertas & Báscula de Bolillo', fn: testInventory },
    { name: 'Corte de Turno & Arqueo Contable', fn: testCorte }
  ];

  for (const suite of suites) {
    try {
      await suite.fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`\n❌ ERROR EN SUITE: [${suite.name}]`);
      console.error(err);
    }
  }

  await db.closePool();

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log('\n========================================================');
  console.log(` RESUMEN DE PRUEBAS: ${passed} exitosas | ${failed} fallidas`);
  console.log(` TIEMPO TOTAL: ${duration} segundos`);
  console.log('========================================================');

  if (failed > 0) {
    console.error('⛔ ALGUNAS PRUEBAS FALLARON.');
    process.exit(1);
  } else {
    console.log('✨ TODAS LAS PRUEBAS PASARON EXITOSAMENTE AL 100%.');
    process.exit(0);
  }
}

runAllTests();
