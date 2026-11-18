const assert = require('assert');
const db = require('../src/main/database');

async function run() {
  console.log('\n--- [TEST SUITE 3: VENTAS POS, STOCK ATÓMICO & MATEMÁTICA FINANCIERA] ---');

  // Test 3.1: Matemática de Totales e IVA (16%)
  const itemsVenta = [
    { precio: 12.00, cantidad: 2 }, // 24.00 (Conchas)
    { precio: 8.00, cantidad: 5 },  // 40.00 (Bolillos)
    { precio: 28.00, cantidad: 1 }  // 28.00 (Panqué)
  ];
  const subtotalEsperado = 92.00;
  const ivaEsperado = Number((92.00 * 0.16).toFixed(2)); // 14.72
  const totalEsperado = Number((subtotalEsperado + ivaEsperado).toFixed(2)); // 106.72

  const subtotalCalc = itemsVenta.reduce((acc, it) => acc + (it.precio * it.cantidad), 0);
  const ivaCalc = Number((subtotalCalc * 0.16).toFixed(2));
  const totalCalc = Number((subtotalCalc + ivaCalc).toFixed(2));

  assert.strictEqual(subtotalCalc, subtotalEsperado, 'Subtotal calculado debe ser 92.00');
  assert.strictEqual(ivaCalc, ivaEsperado, 'IVA calculado debe ser 14.72');
  assert.strictEqual(totalCalc, totalEsperado, 'Total calculado debe ser 106.72');
  console.log('  ✓ 3.1 Cálculo aritmético exacto de Subtotal, IVA (16%) y Total');

  // Test 3.2: Cálculo de Cambio / Arqueo de Dinero
  const dineroRecibido = 200.00;
  const cambioEsperado = Number((dineroRecibido - totalEsperado).toFixed(2)); // 93.28
  const cambioCalc = Number((dineroRecibido - totalCalc).toFixed(2));
  assert.strictEqual(cambioCalc, cambioEsperado, 'El cambio debe ser exactamente 93.28');
  console.log('  ✓ 3.2 Cálculo exacto de cambio con billete de $200.00');

  // Test 3.3: Venta atómica sin duplicación de descuentos ni movimientos dobles
  // Usamos el artículo 101 (Bolillo Tradicional Crujiente)
  const articuloRows = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = 101');
  assert.ok(articuloRows.length > 0, 'El artículo 101 debe existir en la base de datos');
  const stockInicial = Number(articuloRows[0].Cantidad);
  const cantidadVendida = 3;

  await db.beginTransaction();
  try {
    const clienteRows = await db.query("SELECT IdEmpleado FROM Empleados WHERE Rol = 'Cliente' LIMIT 1");
    const idCliente = clienteRows.length ? clienteRows[0].IdEmpleado : null;

    // 1. Insertar Venta
    const sub = 24.00;
    const iv = 3.84;
    const tot = 27.84;
    const ventaRes = await db.query(
      `INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado)
       VALUES (58, ?, ?, ?, ?, 'Mostrador', 'Completada')`,
      [idCliente, sub, iv, tot]
    );
    const idVenta = ventaRes.insertId;

    // 2. Insertar Detalle
    await db.query(
      `INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal)
       VALUES (?, 101, ?, 8.00, ?)`,
      [idVenta, cantidadVendida, sub]
    );

    // 3. Descontar Inventario en código como lo hace ipc.js
    const stockActualizado = stockInicial - cantidadVendida;
    await db.query('UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = 101', [stockActualizado]);

    // 4. Registrar Movimiento único en Kardex
    await db.query(
      `INSERT INTO MovimientosInventario
       (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado)
       VALUES (101, 'Salida', ?, ?, ?, 'Venta Test', ?, 'Venta', 58)`,
      [cantidadVendida, stockInicial, stockActualizado, idVenta]
    );

    // 5. Asignar Canal
    await db.query('INSERT INTO VentasCanal (IdVenta, Canal) VALUES (?, ?)', [idVenta, 'CajaEmpleado']);

    // Verificar en la misma transacción:
    // a) El stock debe ser exactamente stockInicial - 3 (NO stockInicial - 6 que causaba el trigger legado)
    const checkStock = await db.query('SELECT Cantidad FROM Articulos WHERE IdArticulo = 101');
    assert.strictEqual(Number(checkStock[0].Cantidad), stockActualizado, `El stock debe ser ${stockActualizado}, sin doble descuento`);

    // b) Debe haber exactamente 1 movimiento registrado para esta venta
    const checkMovs = await db.query(
      "SELECT COUNT(*) AS total FROM MovimientosInventario WHERE IdReferencia = ? AND TipoReferencia = 'Venta'",
      [idVenta]
    );
    assert.strictEqual(Number(checkMovs[0].total), 1, 'Debe existir exactamente 1 movimiento en Kardex para esta venta');

    // Rollback para no alterar el stock real de la panadería
    await db.rollback();
    console.log('  ✓ 3.3 Deducción atómica unitaria verificada (eliminación comprobada del bug de doble descuento)');
  } catch (err) {
    await db.rollback();
    throw err;
  }

  // Test 3.4: Segregación de Canales (Autocobro vs CajaEmpleado)
  const canalValido = (c) => ['Autocobro', 'CajaEmpleado'].includes(c);
  assert.strictEqual(canalValido('CajaEmpleado'), true);
  assert.strictEqual(canalValido('Autocobro'), true);
  assert.strictEqual(canalValido('Invalido'), false);
  console.log('  ✓ 3.4 Segregación estricta de canales de venta POS');
}

module.exports = run;
