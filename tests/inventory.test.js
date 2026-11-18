const assert = require('assert');
const db = require('../src/main/database');

async function run() {
  console.log('\n--- [TEST SUITE 4: INVENTARIO, ALERTAS & BÁSCULA DE BOLILLO] ---');

  // Test 4.1: Cálculo de Báscula de Bolillo (Conversión Peso kg a Piezas)
  const PESO_BOLILLO_KG = 0.065; // 65 gramos estándar por pieza
  const calcularPiezas = (kg) => Math.round((parseFloat(kg) || 0) / PESO_BOLILLO_KG);

  assert.strictEqual(calcularPiezas(0.065), 1, '0.065 kg deben ser 1 pieza');
  assert.strictEqual(calcularPiezas(0.650), 10, '0.650 kg deben ser 10 piezas');
  assert.strictEqual(calcularPiezas(1.300), 20, '1.300 kg deben ser 20 piezas');
  assert.strictEqual(calcularPiezas(0.000), 0, '0.000 kg deben ser 0 piezas');
  assert.strictEqual(calcularPiezas(0.190), 3, '0.190 kg deben aproximar a 3 piezas (0.195)');
  console.log('  ✓ 4.1 Algoritmo de báscula de bolillo (65g ref.) validado con precisión');

  // Test 4.2: Detección de Alertas de Stock Mínimo (Reorden)
  const productosAlerta = await db.query(
    'SELECT IdArticulo, Nombre, Cantidad, Minimo FROM Articulos WHERE Cantidad <= Minimo'
  );
  assert.ok(Array.isArray(productosAlerta), 'La consulta de alertas debe devolver un arreglo');
  console.log(`  ✓ 4.2 Monitoreo de stock mínimo ejecutado (${productosAlerta.length} artículo(s) en umbral de reorden)`);

  // Test 4.3: Operaciones de Stock (Agregar y Retirar) en transacción segura
  await db.beginTransaction();
  try {
    const articulo = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = 101');
    const inicial = Number(articulo[0].Cantidad);

    // Agregar 15 unidades
    const nuevoAgregado = inicial + 15;
    await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = 101', [nuevoAgregado]);
    const checkAdd = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = 101');
    assert.strictEqual(Number(checkAdd[0].Cantidad), nuevoAgregado, 'Stock incrementado correctamente');

    // Retirar 5 unidades
    const nuevoRetirado = nuevoAgregado - 5;
    await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = 101', [nuevoRetirado]);
    const checkSub = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = 101');
    assert.strictEqual(Number(checkSub[0].Cantidad), nuevoRetirado, 'Stock retirado correctamente');

    await db.rollback();
    console.log('  ✓ 4.3 Operaciones de adición y retiro de existencias verificadas');
  } catch (err) {
    await db.rollback();
    throw err;
  }
}

module.exports = run;
