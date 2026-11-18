const db = require('../src/main/database');
const testDatabase = require('./database.test');
const testAuth = require('./auth.test');
const testPosSales = require('./pos-sales.test');
const testInventory = require('./inventory.test');
const testCorte = require('./corte.test');

async function runAllTests() {
  const start = Date.now();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   DULCE HORNO - EJECUTOR DE PRUEBAS AUTOMATIZADAS     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

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
