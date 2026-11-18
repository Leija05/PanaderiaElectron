/**
 * Test de Ciclo de Vida Completo de Licencias, Tokens y Contraseñas
 */
const db = require('../src/main/database');
const remoteAgent = require('../src/main/remoteAgent');

async function runLicenseLifecycleTest() {
  console.log('=== TEST: CICLO DE VIDA COMPLETO DE LICENCIAS & TOKENS ===\n');
  await db.ensureDatabaseExists();
  await db.ensureSupportTables();
  const pool = db.pool;

  const testBranchId = 'dh-test-pos-01';

  // 1. Generación de Token Estructurado con Checksum
  console.log('1. Verificando generador de tokens estructurados...');
  const tokenPro = remoteAgent.generateStructuredToken('PRO', testBranchId);
  const tokenAnn = remoteAgent.generateStructuredToken('ANN', testBranchId);
  const tokenMth = remoteAgent.generateStructuredToken('MTH', testBranchId);
  const tokenDemo = remoteAgent.generateStructuredToken('DEMO', testBranchId);

  console.log('  Token PRO:', tokenPro);
  console.log('  Token ANN:', tokenAnn);
  console.log('  Token MTH:', tokenMth);
  console.log('  Token DEMO:', tokenDemo);

  if (!tokenPro.startsWith('DH-PRO-') || !tokenAnn.startsWith('DH-ANN-')) {
    throw new Error('Formato de token estructurado inválido');
  }
  console.log('  ✓ Tokens estructurados con checksum generados correctamente.');

  // 2. Activación de Terminal y Despacho de Gerente
  console.log('\n2. Probando activación remota de licencia...');
  const actRes = await remoteAgent.handleRemoteAction('activate_terminal_license', {
    token: tokenPro,
    nombreNegocio: 'Panadería San Martín Test',
    nombreGerente: 'Martín Gerente',
    usuarioGerente: 'gerente_sanmartin',
    passwordGerente: 'ClaveSecreta123*',
    tipoLicencia: 'Comercial Pro Vitalicia',
    fechaExpiracion: null
  });
  console.log('  Resultado activación:', actRes.message);

  let lic = await remoteAgent.getLicenseDetails();
  console.log('  Estado tras activar:', lic.estado, '| isActivated:', lic.isActivated, '| isSuspended:', lic.isSuspended);
  if (!lic.isActivated || lic.isSuspended || lic.estado !== 'Activa') {
    throw new Error('La licencia no quedó en estado Activa');
  }

  // Verificar que el gerente puede autenticarse
  const uRows1 = await db.query("SELECT Password FROM Empleados WHERE NombreUsuario = 'gerente_sanmartin'");
  const authOk = uRows1[0] && db.verifyPassword('ClaveSecreta123*', uRows1[0].Password);
  if (!authOk) {
    throw new Error('El gerente no pudo autenticarse con la contraseña asignada');
  }
  console.log('  ✓ Gerente creado y autenticado exitosamente.');

  // 3. Modificación de Licencia
  console.log('\n3. Probando modificación remota de parámetros de licencia...');
  const modRes = await remoteAgent.handleRemoteAction('modify_license', {
    token: tokenAnn,
    nombreNegocio: 'Panadería San Martín Gran Plaza',
    titular: 'Martín Rodríguez',
    tipoLicencia: 'Suscripción Anual 2026',
    fechaExpiracion: '2026-12-31',
    notas: 'Pago anual folio #8821'
  });
  console.log('  Resultado modificación:', modRes.message);

  lic = await remoteAgent.getLicenseDetails();
  if (lic.tipoLicencia !== 'Suscripción Anual 2026' || lic.token !== tokenAnn) {
    throw new Error('Los parámetros modificados de la licencia no coinciden');
  }
  console.log('  ✓ Licencia modificada correctamente (Tier:', lic.tipoLicencia, '| Vence:', lic.fechaExpiracion, ').');

  // 4. Cambio Rápido de Contraseña de Gerente
  console.log('\n4. Probando cambio rápido de contraseña de Gerente...');
  const passRes = await remoteAgent.handleRemoteAction('change_manager_password', {
    usuarioGerente: 'gerente_sanmartin',
    nuevoPassword: 'NuevaClaveSuperSegura2026*'
  });
  console.log('  Resultado cambio de clave:', passRes.message);

  const uRows2 = await db.query("SELECT Password FROM Empleados WHERE NombreUsuario = 'gerente_sanmartin'");
  const authNew = uRows2[0] && db.verifyPassword('NuevaClaveSuperSegura2026*', uRows2[0].Password);
  if (!authNew) {
    throw new Error('Fallo la autenticación con la nueva contraseña de gerente');
  }
  console.log('  ✓ Nueva contraseña validada exitosamente con scrypt.');

  // 5. Revocación / Suspensión de Licencia
  console.log('\n5. Probando suspensión / revocación de licencia...');
  const revRes = await remoteAgent.handleRemoteAction('revoke_license', {
    motivo: 'Falta de pago de mensualidad enero'
  });
  console.log('  Resultado suspensión:', revRes.message);

  lic = await remoteAgent.getLicenseDetails();
  console.log('  Estado tras suspender:', lic.estado, '| isActivated:', lic.isActivated, '| isSuspended:', lic.isSuspended);
  if (!lic.isSuspended || lic.estado !== 'Suspendida') {
    throw new Error('La licencia no quedó suspendida');
  }

  // Verificar que el Gerente quedó inhabilitado en la base de datos
  const empRows = await db.query("SELECT Activo FROM Empleados WHERE NombreUsuario = 'gerente_sanmartin'");
  if (empRows[0]?.Activo) {
    throw new Error('El Gerente debería estar inhabilitado (Activo = 0)');
  }
  console.log('  ✓ Licencia suspendida y cuenta de Gerente inhabilitada en BD.');

  // 6. Reactivación de Licencia
  console.log('\n6. Probando reactivación de licencia...');
  const reactRes = await remoteAgent.handleRemoteAction('reactivate_license', {
    notas: 'Pago recibido y validado'
  });
  console.log('  Resultado reactivación:', reactRes.message);

  lic = await remoteAgent.getLicenseDetails();
  if (!lic.isActivated || lic.isSuspended || lic.estado !== 'Activa') {
    throw new Error('La licencia no volvió a estado Activa tras reactivación');
  }

  const empRows2 = await db.query("SELECT Activo FROM Empleados WHERE NombreUsuario = 'gerente_sanmartin'");
  if (!empRows2[0]?.Activo) {
    throw new Error('El Gerente debería estar habilitado tras reactivación (Activo = 1)');
  }
  console.log('  ✓ Licencia reactivada y cuenta de Gerente habilitada nuevamente.');

  console.log('\n✨ TODAS LAS ACCIONES DEL CICLO DE VIDA DE LICENCIAS Y TOKENS FUERON VERIFICADAS AL 100% CON ÉXITO.');
  process.exit(0);
}

runLicenseLifecycleTest().catch((err) => {
  console.error('\n❌ ERROR EN TEST:', err);
  process.exit(1);
});
