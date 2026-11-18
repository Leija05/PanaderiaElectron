const db = require('../src/main/database');

async function inspect() {
  try {
    console.log('--- TRIGGERS EN BASE DE DATOS ---');
    const triggers = await db.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
    `);
    console.table(triggers);

    console.log('\n--- CONTEO POR TABLAS ---');
    const tables = ['Articulos', 'Categorias', 'Clientes', 'Empleados', 'Proveedores', 'Ventas', 'VentaDetalle', 'Compras', 'CompraDetalle', 'MovimientosInventario'];
    for (const t of tables) {
      try {
        const res = await db.query(`SELECT COUNT(*) as count FROM ${t}`);
        console.log(`${t}: ${res[0].count} registros`);
      } catch (e) {
        console.log(`${t}: error (${e.message})`);
      }
    }

    console.log('\n--- ARTICULOS ACTUALES ---');
    const arts = await db.query('SELECT IdArticulo, Nombre, Cantidad, Minimo, PrecioVenta, PrecioCompra FROM Articulos');
    console.table(arts);

    console.log('\n--- EMPLEADOS ACTUALES ---');
    const emps = await db.query('SELECT IdEmpleado, NombreUsuario, Rol, Puesto, Activo FROM Empleados');
    console.table(emps);

    console.log('\n--- PROVEEDORES ACTUALES ---');
    const provs = await db.query('SELECT IdProveedor, Nombre, Telefono, Activo FROM Proveedores');
    console.table(provs);

    console.log('\n--- CLIENTES ACTUALES ---');
    const clis = await db.query('SELECT IdCliente, NombreCompleto, Genero, Activo FROM Clientes');
    console.table(clis);

  } catch (err) {
    console.error('Error inspeccionando BD:', err);
  } finally {
    await db.closePool();
  }
}

inspect();
