const assert = require('assert');
const db = require('../src/main/database');

async function run() {
  console.log('\n--- [TEST SUITE 1: BASE DE DATOS & TRANSACCIONES] ---');

  // Test 1.1: Conexión y consulta básica
  const res = await db.query('SELECT 1 + 1 AS resultado');
  assert.strictEqual(res[0].resultado, 2, 'La consulta básica debe responder 2');
  console.log('  ✓ 1.1 Conexión al pool de MySQL verificada');

  // Test 1.2: Integridad de tablas esenciales
  const tablasEsperadas = [
    'Articulos', 'Categorias', 'Clientes', 'Empleados', 'Proveedores',
    'Ventas', 'VentaDetalle', 'Compras', 'CompraDetalle', 'MovimientosInventario',
    'VentasCanal', 'CortesTurno', 'RecepcionesProveedor', 'DevolucionesCliente'
  ];

  for (const tabla of tablasEsperadas) {
    const existe = await db.query(
      'SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [tabla]
    );
    assert.strictEqual(Number(existe[0].total), 1, `La tabla ${tabla} debe existir`);
  }
  console.log(`  ✓ 1.2 Existencia e integridad de ${tablasEsperadas.length} tablas del sistema`);

  // Test 1.3: Ausencia de triggers conflictivos (evitar doble descuento)
  const triggersConflictivos = [
    'trg_ventadetalle_ai_descontar_inventario',
    'trg_ventadetalle_ai_registrar_movimiento',
    'trg_ventadetalle_ai_recalcular_totales'
  ];

  for (const trg of triggersConflictivos) {
    const trgExists = await db.query(
      'SELECT COUNT(*) AS total FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ?',
      [trg]
    );
    assert.strictEqual(Number(trgExists[0].total), 0, `El trigger conflictivo ${trg} NO debe existir`);
  }
  console.log('  ✓ 1.3 Verificado: triggers legados duplicados están eliminados');

  // Test 1.4: Transacción con Rollback (Aislamiento ACID)
  await db.beginTransaction();
  const insertTemp = await db.query(
    'INSERT INTO Categorias (Nombre, Descripcion) VALUES (?, ?)',
    ['Categoria_Temporal_Rollback', 'No debe persistir']
  );
  const idTemp = insertTemp.insertId;
  await db.rollback();

  const checkRollback = await db.query('SELECT * FROM Categorias WHERE IdCategoria = ?', [idTemp]);
  assert.strictEqual(checkRollback.length, 0, 'El registro revertido con rollback no debe existir');
  console.log('  ✓ 1.4 Transacción ACID: Rollback revierte operaciones correctamente');

  // Test 1.5: Transacción con Commit
  await db.beginTransaction();
  const insertCommit = await db.query(
    'INSERT INTO Categorias (Nombre, Descripcion) VALUES (?, ?)',
    ['Categoria_Temporal_Commit', 'Debe persistir temporalmente']
  );
  const idCommit = insertCommit.insertId;
  await db.commit();

  const checkCommit = await db.query('SELECT * FROM Categorias WHERE IdCategoria = ?', [idCommit]);
  assert.strictEqual(checkCommit.length, 1, 'El registro con commit debe persistir');

  // Limpieza de registro de prueba
  await db.query('DELETE FROM Categorias WHERE IdCategoria = ?', [idCommit]);
  console.log('  ✓ 1.5 Transacción ACID: Commit confirma operaciones de forma atómica');
}

module.exports = run;
