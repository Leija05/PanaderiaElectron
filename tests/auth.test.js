const assert = require('assert');
const db = require('../src/main/database');

async function run() {
  console.log('\n--- [TEST SUITE 2: AUTENTICACIÓN, CONTRASEÑAS & RBAC] ---');

  // Test 2.1: Hashing con scrypt
  const passPrueba = 'PanDulce2026!';
  const hashGenerado = db.hashPassword(passPrueba);
  assert.ok(hashGenerado.startsWith('scrypt:'), 'El hash debe iniciar con prefijo scrypt:');
  const partes = hashGenerado.split(':');
  assert.strictEqual(partes.length, 3, 'El hash scrypt debe tener formato scrypt:salt:hash');
  console.log('  ✓ 2.1 Generación de hash seguro scrypt con salt aleatorio');

  // Test 2.2: Verificación de contraseña scrypt
  const verifCorrecta = db.verifyPassword(passPrueba, hashGenerado);
  assert.strictEqual(verifCorrecta, true, 'La contraseña correcta debe validar con su hash scrypt');

  const verifErronea = db.verifyPassword('PasswordIncorrecto', hashGenerado);
  assert.strictEqual(verifErronea, false, 'Una contraseña incorrecta debe ser rechazada');
  console.log('  ✓ 2.2 Verificación criptográfica segura timingSafeEqual');

  // Test 2.3: Tolerancia segura a contraseñas estándar en texto plano
  assert.strictEqual(db.verifyPassword('admin123', 'admin123'), true);
  assert.strictEqual(db.verifyPassword('empleado123', 'empleado123'), true);
  assert.strictEqual(db.verifyPassword('demo123', 'demo123'), true);
  assert.strictEqual(db.verifyPassword('wrong', 'admin123'), false);
  console.log('  ✓ 2.3 Coincidencia exacta y fallback tolerante para cuentas maestras');

  // Test 2.4: Verificación de cuentas activas del sistema en base de datos
  const cuentasAProbar = [
    { user: 'admin', pass: 'admin123', rolEsperado: 'Gerente' },
    { user: 'empleado1', pass: 'empleado123', rolEsperado: 'Empleado' },
    { user: 'programador', pass: 'programador123', rolEsperado: 'Programador' },
    { user: 'gerente_demo', pass: 'demo123', rolEsperado: 'Gerente' },
    { user: 'empleado_demo_1', pass: 'demo123', rolEsperado: 'Empleado' }
  ];

  for (const c of cuentasAProbar) {
    const rows = await db.query(
      'SELECT IdEmpleado, NombreUsuario, Password, Rol, Activo FROM Empleados WHERE NombreUsuario = ?',
      [c.user]
    );
    assert.strictEqual(rows.length, 1, `El usuario ${c.user} debe existir en Empleados`);
    const emp = rows[0];
    assert.strictEqual(emp.Rol, c.rolEsperado, `El rol de ${c.user} debe ser ${c.rolEsperado}`);
    assert.strictEqual(Boolean(emp.Activo), true, `El usuario ${c.user} debe estar activo`);

    const passValido = db.verifyPassword(c.pass, emp.Password);
    assert.strictEqual(passValido, true, `La contraseña para ${c.user} debe validar exitosamente`);
  }
  console.log(`  ✓ 2.4 Validación exitosa de ${cuentasAProbar.length} cuentas de producción en MySQL`);

  // Test 2.5: Matriz de roles y permisos RBAC
  const rolesPermitidos = ['Cliente', 'Empleado', 'Gerente', 'Programador'];
  const enumRol = await db.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empleados' AND COLUMN_NAME = 'Rol'`
  );
  const typeStr = enumRol[0].COLUMN_TYPE;
  for (const r of rolesPermitidos) {
    assert.ok(typeStr.includes(`'${r}'`), `El ENUM de Rol debe incluir '${r}'`);
  }
  console.log('  ✓ 2.5 Matriz de Roles (Cliente, Empleado, Gerente, Programador) íntegra');
}

module.exports = run;
