const assert = require('assert');
const db = require('../src/main/database');

async function run() {
  console.log('\n--- [TEST SUITE 5: CORTE DE TURNO & ARQUEO DE CAJA] ---');

  // Test 5.1: Validación de credenciales de Gerente para autorización de corte
  const gerenteRows = await db.query(
    "SELECT IdEmpleado, NombreUsuario, Password FROM Empleados WHERE NombreUsuario = 'admin' AND Rol = 'Gerente' AND Activo = 1"
  );
  assert.strictEqual(gerenteRows.length, 1, 'Debe existir un Gerente activo para autorizar');
  const gerente = gerenteRows[0];

  const passValido = db.verifyPassword('admin123', gerente.Password);
  assert.strictEqual(passValido, true, 'El Gerente debe validar con su contraseña');

  const passInvalido = db.verifyPassword('ClaveErronea', gerente.Password);
  assert.strictEqual(passInvalido, false, 'Una contraseña errónea debe impedir el corte');
  console.log('  ✓ 5.1 Mecanismo de autorización de Gerente para corte de turno verificado');

  // Test 5.2: Generación de Corte de Turno en transacción segura
  await db.beginTransaction();
  try {
    const inicio = new Date(Date.now() - 3600000 * 8); // Hace 8 horas
    const fin = new Date();

    const corteRes = await db.query(
      `INSERT INTO CortesTurno
       (Canal, IdEmpleado, FechaInicio, FechaFin, TotalVentas, TotalImporte, ResumenJSON, AutorizadoPor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CajaEmpleado',
        58,
        inicio,
        fin,
        12,
        1540.50,
        JSON.stringify({ canal: 'CajaEmpleado', ventasTotal: 12, importeTotal: 1540.50, cajero: 'Juan Pérez' }),
        gerente.IdEmpleado
      ]
    );

    const idCorte = corteRes.insertId;
    assert.ok(idCorte > 0, 'El corte debe generar un ID único incremental');

    const checkCorte = await db.query('SELECT * FROM CortesTurno WHERE IdCorte = ?', [idCorte]);
    assert.strictEqual(checkCorte.length, 1, 'El registro de corte debe recuperarse');
    assert.strictEqual(Number(checkCorte[0].TotalImporte), 1540.50, 'El importe total debe coincidir');

    await db.rollback();
    console.log('  ✓ 5.2 Registro y emisión de comprobante de arqueo contable verificado');
  } catch (err) {
    await db.rollback();
    throw err;
  }
}

module.exports = run;
