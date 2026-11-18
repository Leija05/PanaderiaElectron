const db = require('../src/main/database');

async function cleanAndSeed() {
  console.log('=====================================================');
  console.log(' DULCE HORNO - AUDITORÍA, LIMPIEZA & SEED DE PRODUCCIÓN');
  console.log('=====================================================');

  try {
    // 1. Eliminar triggers conflictivos que duplicaban descuentos y forzaban IVA 16%
    console.log('\n1. Eliminando triggers legados problemáticos en MySQL...');
    const dropTriggers = [
      'trg_ventadetalle_ai_descontar_inventario',
      'trg_ventadetalle_ai_registrar_movimiento',
      'trg_ventadetalle_ai_recalcular_totales',
      'trg_ventadetalle_bi_calcular_subtotal',
      'trg_compradetalle_ai_sumar_inventario',
      'trg_compradetalle_ai_registrar_movimiento',
      'trg_compradetalle_ai_recalcular_totales',
      'trg_compradetalle_bi_calcular_subtotal'
    ];

    for (const trg of dropTriggers) {
      await db.query(`DROP TRIGGER IF EXISTS ${trg}`);
      console.log(`   - Trigger eliminado / verificado: ${trg}`);
    }

    // 2. Limpieza de datos basura y de pruebas
    console.log('\n2. Purgando datos basura de pruebas (Trigger, Test, Dummy)...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Movimientos de inventario asociados a artículos de prueba
    await db.query(`
      DELETE FROM MovimientosInventario
      WHERE IdArticulo IN (SELECT IdArticulo FROM Articulos WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%')
         OR Motivo LIKE '%trigger%'
         OR Motivo LIKE '%prueba%'
    `);

    // Ventas y detalles asociados a clientes o artículos de prueba
    await db.query(`
      DELETE FROM VentaDetalle
      WHERE IdArticulo IN (SELECT IdArticulo FROM Articulos WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%')
         OR IdVenta IN (SELECT IdVenta FROM Ventas WHERE IdCliente IN (SELECT IdCliente FROM Clientes WHERE NombreCompleto LIKE '%Trigger%' OR NombreCompleto LIKE '%Prueba%'))
    `);

    await db.query(`
      DELETE FROM VentasCanal
      WHERE IdVenta NOT IN (SELECT IdVenta FROM Ventas)
    `);

    // Compras y detalles asociados a proveedores de prueba
    await db.query(`
      DELETE FROM CompraDetalle
      WHERE IdArticulo IN (SELECT IdArticulo FROM Articulos WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%')
         OR IdCompra IN (SELECT IdCompra FROM Compras WHERE IdProveedor IN (SELECT IdProveedor FROM Proveedores WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%'))
    `);

    await db.query(`
      DELETE FROM Compras
      WHERE IdProveedor IN (SELECT IdProveedor FROM Proveedores WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%')
    `);

    // Artículos de prueba
    await db.query("DELETE FROM Articulos WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%'");

    // Clientes de prueba
    await db.query("DELETE FROM Clientes WHERE NombreCompleto LIKE '%Trigger%' OR NombreCompleto LIKE '%ClienteVentaPrueba%'");

    // Proveedores de prueba
    await db.query("DELETE FROM Proveedores WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%'");

    // Categorías de prueba
    await db.query("DELETE FROM Categorias WHERE Nombre LIKE '%Trigger%' OR Nombre LIKE '%Prueba%'");

    // Empleados de prueba basura (empleado_2 .. empleado_51), manteniendo usuarios clave
    await db.query(`
      DELETE FROM Empleados
      WHERE NombreUsuario LIKE 'empleado_%'
        AND NombreUsuario NOT IN ('empleado_demo_1')
    `);

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   - Registros de prueba purgados con éxito.');

    // 3. Configurar Categorías Oficiales
    console.log('\n3. Configurando categorías oficiales de la panadería...');
    const categorias = [
      { id: 1, nombre: 'Pan Salado y de Mesa', desc: 'Bolillos, teleras, baguettes rústicas y hogazas artesanales' },
      { id: 2, nombre: 'Pan Dulce Tradicional', desc: 'Conchas, cuernitos, donas, orejas, rebanadas y roles horneados' },
      { id: 3, nombre: 'Repostería y Pasteles', desc: 'Pasteles tres leches, cheesecakes, tartaletas y muffins gourmet' },
      { id: 4, nombre: 'Galletas y Hojaldres', desc: 'Galletas de chispas, polvorones finos, biscochos y hojaldras doradas' },
      { id: 5, nombre: 'Cafetería y Bebidas', desc: 'Café americano chiapaneco, capuchinos, chocolate oaxaqueño y tés' }
    ];

    for (const cat of categorias) {
      await db.query(
        `INSERT INTO Categorias (IdCategoria, Nombre, Descripcion)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), Descripcion = VALUES(Descripcion)`,
        [cat.id, cat.nombre, cat.desc]
      );
    }
    console.log(`   - ${categorias.length} categorías sincronizadas.`);

    // 4. Catálogo de Artículos y Panes Artesanales
    console.log('\n4. Poblando catálogo completo de panadería artesanal mexicana...');
    const productos = [
      // Pan Salado y de Mesa (Cat 1)
      { id: 101, nombre: 'Bolillo Tradicional Crujiente', desc: 'Bolillo crujiente por fuera y migajón suave, horneado en piso de piedra.', cat: 1, cant: 85, min: 25, pVenta: 8.00, pCompra: 3.20 },
      { id: 102, nombre: 'Telera Esponjosa para Torta', desc: 'Telera dorada con 3 hendiduras clásicas, textura esponjosa ideal para tortas.', cat: 1, cant: 60, min: 20, pVenta: 8.50, pCompra: 3.50 },
      { id: 103, nombre: 'Baguette Rústica Artesanal', desc: 'Baguette francesa de fermentación lenta de 18 horas y corteza dorada.', cat: 1, cant: 35, min: 10, pVenta: 26.00, pCompra: 11.00 },
      { id: 104, nombre: 'Hogaza de Masa Madre', desc: 'Hogaza redonda con harina de centeno y fermento natural sin conservadores.', cat: 1, cant: 22, min: 8, pVenta: 48.00, pCompra: 21.00 },
      { id: 105, nombre: 'Pan de Caja Rústico Integral', desc: 'Pan de molde con salvado de trigo, linaza, semillas de girasol y avena.', cat: 1, cant: 28, min: 8, pVenta: 42.00, pCompra: 18.00 },

      // Pan Dulce Tradicional (Cat 2)
      { id: 106, nombre: 'Concha de Vainilla Tradicional', desc: 'Concha clásica esponjosa con pasta crujiente de mantequilla y vainilla.', cat: 2, cant: 65, min: 20, pVenta: 12.00, pCompra: 5.50 },
      { id: 107, nombre: 'Concha de Chocolate de Metate', desc: 'Concha dulce con pasta oscura de cacao oaxaqueño molido y canela.', cat: 2, cant: 55, min: 20, pVenta: 12.00, pCompra: 5.50 },
      { id: 108, nombre: 'Cuernito de Mantequilla Francés', desc: 'Croissant hojaldrado con capas finas de mantequilla pura Gloria.', cat: 2, cant: 45, min: 15, pVenta: 16.00, pCompra: 7.20 },
      { id: 109, nombre: 'Dona Glaseada Clásica', desc: 'Dona frita suave y aireada con glaseado transparente de azúcar glass.', cat: 2, cant: 50, min: 15, pVenta: 14.00, pCompra: 6.00 },
      { id: 110, nombre: 'Dona de Chocolate con Granillo', desc: 'Dona esponjosa con cobertura de chocolate semiamargo y granillo de chocolate.', cat: 2, cant: 40, min: 15, pVenta: 16.00, pCompra: 7.00 },
      { id: 111, nombre: 'Oreja de Hojaldre Caramelizada', desc: 'Hojaldre crujiente con bordes acaramelados con azúcar dorada al horno.', cat: 2, cant: 48, min: 15, pVenta: 14.00, pCompra: 5.80 },
      { id: 112, nombre: 'Rebanada de Mantequilla', desc: 'Rebanada de pan brioche con generosa crema de mantequilla y azúcar espolvoreada.', cat: 2, cant: 32, min: 10, pVenta: 12.00, pCompra: 5.00 },
      { id: 113, nombre: 'Rol de Canela con Glaseado Cream Cheese', desc: 'Masa suave enrollada con canela de Ceilán, piloncillo y cubierta de queso crema.', cat: 2, cant: 28, min: 10, pVenta: 24.00, pCompra: 10.50 },
      { id: 114, nombre: 'Margarita de Crema Pastelera', desc: 'Pan dulce en forma de flor relleno de crema pastelera casera con toque de limón.', cat: 2, cant: 30, min: 10, pVenta: 15.00, pCompra: 6.50 },

      // Repostería y Pasteles (Cat 3)
      { id: 115, nombre: 'Pastel Tres Leches con Fresas (Rebanada)', desc: 'Bizcocho bañado en mezcla de tres leches, relleno de crema batida y fresas frescas.', cat: 3, cant: 18, min: 6, pVenta: 48.00, pCompra: 22.00 },
      { id: 116, nombre: 'Cheesecake de Zarzamora Silvestre', desc: 'Pay cremoso estilo New York con base de galleta y jalea artesanal de zarzamora.', cat: 3, cant: 14, min: 5, pVenta: 52.00, pCompra: 24.00 },
      { id: 117, nombre: 'Pastel de Chocolate Fudge Belga', desc: 'Bizcocho húmedo de cacao con ganache oscuro y relleno de trufa.', cat: 3, cant: 12, min: 5, pVenta: 55.00, pCompra: 26.00 },
      { id: 118, nombre: 'Tartaleta de Frutas de Temporada', desc: 'Base crujiente de masa sableé rellena de crema pastelera y fruta fresca abrillantada.', cat: 3, cant: 16, min: 6, pVenta: 38.00, pCompra: 17.00 },
      { id: 119, nombre: 'Muffin de Arándanos Silvestres', desc: 'Muffin horneado con arándanos enteros y cobertura crocante de azúcar mascabado.', cat: 3, cant: 35, min: 12, pVenta: 22.00, pCompra: 9.50 },
      { id: 120, nombre: 'Panqué Tradicional de Nuez', desc: 'Panqué casero con mantequilla, trozos de nuez pecana y toque de ron.', cat: 3, cant: 26, min: 8, pVenta: 28.00, pCompra: 12.50 },

      // Galletas y Hojaldres (Cat 4)
      { id: 121, nombre: 'Galletas de Chispas de Chocolate', desc: 'Galleta dorada, suave al centro, con abundantes chispas de chocolate semiamargo.', cat: 4, cant: 55, min: 20, pVenta: 10.00, pCompra: 4.20 },
      { id: 122, nombre: 'Polvorón Sevillano de Canela', desc: 'Polvorón tradicional que se deshace en la boca con canela molida y azúcar glass.', cat: 4, cant: 45, min: 15, pVenta: 9.00, pCompra: 3.80 },
      { id: 123, nombre: 'Beso de Nuez y Mermelada', desc: 'Dos esferas de galleta de nuez unidas con mermelada de fresa casera y mantequilla.', cat: 4, cant: 38, min: 12, pVenta: 12.00, pCompra: 5.20 },
      { id: 124, nombre: 'Hojaldra de Jamón y Queso Crema', desc: 'Hojaldre salado relleno de jamón de pavo horneado y queso Philadelphia.', cat: 4, cant: 24, min: 10, pVenta: 22.00, pCompra: 9.50 },

      // Cafetería y Bebidas (Cat 5)
      { id: 125, nombre: 'Café Americano de Grano Chiapaneco (12 oz)', desc: 'Café de altura 100% arábica recién molido, tostado medio notas achocolatadas.', cat: 5, cant: 90, min: 30, pVenta: 22.00, pCompra: 6.50 },
      { id: 126, nombre: 'Capuchino Italiano Cremoso (12 oz)', desc: 'Espresso doble con leche texturizada sedosa y toque de cacao en polvo.', cat: 5, cant: 60, min: 20, pVenta: 32.00, pCompra: 10.50 },
      { id: 127, nombre: 'Chocolate Caliente Oaxaqueño (12 oz)', desc: 'Chocolate de metate preparado con leche entera espumada y canela natural.', cat: 5, cant: 45, min: 15, pVenta: 30.00, pCompra: 9.80 },
      { id: 128, nombre: 'Té Chai con Especias (12 oz)', desc: 'Infusión de té negro con cardamomo, clavo, jengibre y leche evaporada.', cat: 5, cant: 40, min: 15, pVenta: 28.00, pCompra: 9.00 },
      { id: 129, nombre: 'Leche Entera Santa Clara (250 ml)', desc: 'Botellita de leche pasteurizada fría ideal para acompañar el pan dulce.', cat: 5, cant: 50, min: 15, pVenta: 16.00, pCompra: 9.00 }
    ];

    for (const prod of productos) {
      await db.query(
        `INSERT INTO Articulos (IdArticulo, Nombre, Descripcion, IdCategoria, Cantidad, Minimo, PrecioVenta, PrecioCompra, Activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           Nombre = VALUES(Nombre),
           Descripcion = VALUES(Descripcion),
           IdCategoria = VALUES(IdCategoria),
           Cantidad = VALUES(Cantidad),
           Minimo = VALUES(Minimo),
           PrecioVenta = VALUES(PrecioVenta),
           PrecioCompra = VALUES(PrecioCompra),
           Activo = 1`,
        [prod.id, prod.nombre, prod.desc, prod.cat, prod.cant, prod.min, prod.pVenta, prod.pCompra]
      );
    }
    console.log(`   - ${productos.length} artículos auténticos sincronizados.`);

    // 5. Directorio de Proveedores Mexicanos Reales
    console.log('\n5. Configurando proveedores industriales de panadería...');
    const proveedores = [
      {
        id: 1,
        nombre: 'Harinera Los Pirineos S.A. de C.V.',
        empresa: 'Molino Harinero Los Pirineos',
        contacto: 'Ing. Carlos Villarreal Ramos',
        telefono: '55-5390-1200',
        correo: 'ventas@harinerosdelnorte.mx',
        direccion: 'Av. Industrial Molinera 450, Col. Parque Industrial',
        ciudad: 'Monterrey',
        estado: 'Nuevo León',
        cp: '64000',
        ruc: 'HPI850312NM1'
      },
      {
        id: 2,
        nombre: 'Lácteos y Mantequillas San Juan S.A.',
        empresa: 'Lácteos del Bajío San Juan',
        contacto: 'Lic. Martha Elena Gómez',
        telefono: '477-718-4500',
        correo: 'pedidos@lacteosanjuan.com',
        direccion: 'Carretera León-Silao Km 12.5',
        ciudad: 'León',
        estado: 'Guanajuato',
        cp: '37290',
        ruc: 'LSJ920615K32'
      },
      {
        id: 3,
        nombre: 'Levaduras y Mejorantes Fleischmann de México',
        empresa: 'AB Mauri Fleischmann México',
        contacto: 'Ing. Roberto Fuentes Solís',
        telefono: '55-5804-7000',
        correo: 'contacto@fleischmann.mx',
        direccion: 'Calzada Vallejo 1110, Col. Santa Cruz de las Salinas',
        ciudad: 'Ciudad de México',
        estado: 'CDMX',
        cp: '02300',
        ruc: 'FMM730918L89'
      },
      {
        id: 4,
        nombre: 'Azúcar Dulce Caña de Veracruz S.A. de C.V.',
        empresa: 'Ingenio La Gloria Veracruz',
        contacto: 'Don Arturo Domínguez Herrera',
        telefono: '229-923-8800',
        correo: 'ventas@azucardulcecana.mx',
        direccion: 'Av. Las Palmas 300, Zona Portuaria',
        ciudad: 'Veracruz',
        estado: 'Veracruz',
        cp: '91700',
        ruc: 'ADC880420PT4'
      },
      {
        id: 5,
        nombre: 'Chocolates y Coberturas Finas La Fama',
        empresa: 'Chocolatera Oaxaqueña La Fama',
        contacto: 'Chef Chocolatier Sofía Mendoza',
        telefono: '951-516-3344',
        correo: 'pedidos@chocolateslafama.com',
        direccion: 'Calle Francisco Javier Mina 502, Centro',
        ciudad: 'Oaxaca de Juárez',
        estado: 'Oaxaca',
        cp: '68000',
        ruc: 'CLF951010AB7'
      },
      {
        id: 6,
        nombre: 'Empaques y Cajas Biodegradables del Centro',
        empresa: 'Empaques Ecológicos del Centro S.A.',
        contacto: 'Lic. Fernando Ortiz Morales',
        telefono: '55-5688-9922',
        correo: 'atencion@empaquesdelcentro.mx',
        direccion: 'Eje 6 Sur Trabajadores Sociales 210, Iztapalapa',
        ciudad: 'Ciudad de México',
        estado: 'CDMX',
        cp: '09410',
        ruc: 'EBC041125JJ3'
      }
    ];

    for (const prov of proveedores) {
      await db.query(
        `INSERT INTO Proveedores (IdProveedor, Nombre, NombreEmpresa, Contacto, Telefono, Correo, Direccion, Ciudad, Estado, CodigoPostal, RUC, Activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           Nombre = VALUES(Nombre),
           NombreEmpresa = VALUES(NombreEmpresa),
           Contacto = VALUES(Contacto),
           Telefono = VALUES(Telefono),
           Correo = VALUES(Correo),
           Direccion = VALUES(Direccion),
           Ciudad = VALUES(Ciudad),
           Estado = VALUES(Estado),
           CodigoPostal = VALUES(CodigoPostal),
           RUC = VALUES(RUC),
           Activo = 1`,
        [prov.id, prov.nombre, prov.empresa, prov.contacto, prov.telefono, prov.correo, prov.direccion, prov.ciudad, prov.estado, prov.cp, prov.ruc]
      );
    }
    console.log(`   - ${proveedores.length} proveedores industriales sincronizados.`);

    // 6. Configurar Empleados y Cuentas de Acceso
    console.log('\n6. Configurando empleados oficiales de la panadería...');
    const empleados = [
      { id: 4, user: 'Nicky', pass: 'empleado123', rol: 'Empleado', puesto: 'Cajero de Turno', turno: 'Nocturno', salario: 8500, full: 'Nicolás Cruz Pérez', nom: 'Nicolás', pat: 'Cruz', mat: 'Pérez', gen: 'Masculino' },
      { id: 52, user: 'Crisprogg', pass: 'empleado123', rol: 'Empleado', puesto: 'Cajero Principal', turno: 'Vespertino', salario: 9000, full: 'Cristian Hernández Romero', nom: 'Cristian', pat: 'Hernández', mat: 'Romero', gen: 'Masculino' },
      { id: 53, user: 'LEZH', pass: 'admin123', rol: 'Gerente', puesto: 'Gerente de Turno', turno: 'Matutino', salario: 16000, full: 'Luis Eduardo Zúñiga Hernández', nom: 'Luis Eduardo', pat: 'Zúñiga', mat: 'Hernández', gen: 'Masculino' },
      { id: 54, user: 'programador', pass: 'programador123', rol: 'Programador', puesto: 'Programador del Sistema', turno: 'Any', salario: 20000, full: 'Ing. Sistemas Software', nom: 'Ingeniero', pat: 'Sistemas', mat: 'Software', gen: 'Prefiero no decir' },
      { id: 57, user: 'admin', pass: 'admin123', rol: 'Gerente', puesto: 'Gerente General', turno: 'Vespertino', salario: 18000, full: 'Administrador General Dulce Horno', nom: 'Administrador', pat: 'General', mat: 'Panadería', gen: 'Prefiero no decir' },
      { id: 58, user: 'empleado1', pass: 'empleado123', rol: 'Empleado', puesto: 'Vendedor y Mostrador', turno: 'Matutino', salario: 8000, full: 'Juan Pérez Hernández', nom: 'Juan', pat: 'Pérez', mat: 'Hernández', gen: 'Masculino' },
      { id: 61, user: 'gerente_demo', pass: 'demo123', rol: 'Gerente', puesto: 'Gerente Demo', turno: 'Matutino', salario: 15000, full: 'Gerente Demostración', nom: 'Gerente', pat: 'Demo', mat: 'Prueba', gen: 'Prefiero no decir' },
      { id: 62, user: 'empleado_demo_1', pass: 'demo123', rol: 'Empleado', puesto: 'Cajero Demo', turno: 'Matutino', salario: 8000, full: 'Cajero Demostración', nom: 'Cajero', pat: 'Demo', mat: 'Prueba', gen: 'Prefiero no decir' },
      { id: 70, user: 'panadero_mateo', pass: 'panadero123', rol: 'Empleado', puesto: 'Maestro Panadero', turno: 'Matutino', salario: 12500, full: 'Mateo Sandoval Castillo', nom: 'Mateo', pat: 'Sandoval', mat: 'Castillo', gen: 'Masculino' },
      { id: 71, user: 'repostera_elena', pass: 'repostera123', rol: 'Empleado', puesto: 'Chef Pastelera', turno: 'Matutino', salario: 13500, full: 'Elena Rocha Morales', nom: 'Elena', pat: 'Rocha', mat: 'Morales', gen: 'Femenino' }
    ];

    for (const emp of empleados) {
      await db.query(
        `INSERT INTO Empleados (IdEmpleado, NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, Activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           NombreUsuario = VALUES(NombreUsuario),
           Password = VALUES(Password),
           Rol = VALUES(Rol),
           Puesto = VALUES(Puesto),
           Turno = VALUES(Turno),
           Salario = VALUES(Salario),
           NombreCompleto = VALUES(NombreCompleto),
           Nombre = VALUES(Nombre),
           ApellidoPaterno = VALUES(ApellidoPaterno),
           ApellidoMaterno = VALUES(ApellidoMaterno),
           Genero = VALUES(Genero),
           Activo = 1`,
        [emp.id, emp.user, emp.pass, emp.rol, emp.puesto, emp.turno, emp.salario, emp.full, emp.nom, emp.pat, emp.mat, emp.gen]
      );
    }
    console.log(`   - ${empleados.length} cuentas de empleados y administradores sincronizadas.`);

    // 7. Directorio de Clientes Frecuentes Reales
    console.log('\n7. Configurando directorio de clientes frecuentes...');
    const clientes = [
      { id: 201, nom: 'María', pat: 'García', mat: 'López', full: 'María García López', gen: 'Femenino' },
      { id: 202, nom: 'Roberto', pat: 'Morales', mat: 'Peña', full: 'Roberto Morales Peña', gen: 'Masculino' },
      { id: 203, nom: 'Carmen', pat: 'Valenzuela', mat: 'Díaz', full: 'Carmen Valenzuela Díaz', gen: 'Femenino' },
      { id: 204, nom: 'Fernando', pat: 'Mendoza', mat: 'Solís', full: 'Fernando Mendoza Solís', gen: 'Masculino' },
      { id: 205, nom: 'Laura', pat: 'Estrada', mat: 'Gómez', full: 'Laura Estrada Gómez', gen: 'Femenino' },
      { id: 206, nom: 'Alejandro', pat: 'Ruiz', mat: 'Ortiz', full: 'Alejandro Ruiz Ortiz', gen: 'Masculino' },
      { id: 207, nom: 'Patricia', pat: 'Domínguez', mat: 'Silva', full: 'Patricia Domínguez Silva', gen: 'Femenino' },
      { id: 208, nom: 'Ricardo', pat: 'Torres', mat: 'Vega', full: 'Ricardo Torres Vega', gen: 'Masculino' },
      { id: 209, nom: 'Sofía', pat: 'Hernández', mat: 'Ramos', full: 'Sofía Hernández Ramos', gen: 'Femenino' },
      { id: 210, nom: 'Javier', pat: 'Navarro', mat: 'Bautista', full: 'Javier Navarro Bautista', gen: 'Masculino' }
    ];

    for (const c of clientes) {
      await db.query(
        `INSERT INTO Clientes (IdCliente, Nombre, ApellidoPaterno, ApellidoMaterno, Genero, NombreCompleto, Activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           Nombre = VALUES(Nombre),
           ApellidoPaterno = VALUES(ApellidoPaterno),
           ApellidoMaterno = VALUES(ApellidoMaterno),
           Genero = VALUES(Genero),
           NombreCompleto = VALUES(NombreCompleto),
           Activo = 1`,
        [c.id, c.nom, c.pat, c.mat, c.gen, c.full]
      );
    }
    console.log(`   - ${clientes.length} clientes registrados sincronizados.`);

    // 8. Movimientos Iniciales de Inventario (Entradas de horneado)
    console.log('\n8. Registrando movimientos iniciales de inventario (Kardex)...');
    const existingMovs = await db.query('SELECT COUNT(*) AS total FROM MovimientosInventario');
    if (existingMovs[0].total < 10) {
      for (const p of productos) {
        await db.query(
          `INSERT INTO MovimientosInventario
           (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, Motivo, IdReferencia, TipoReferencia, IdEmpleado, FechaMovimiento)
           VALUES (?, 'Entrada', ?, 0, ?, 'Horneado del día / Stock inicial', NULL, 'Ajuste', 58, NOW())`,
          [p.id, p.cant, p.cant]
        );
      }
      console.log('   - Kardex inicial de horneado registrado.');
    } else {
      console.log('   - Kardex ya contenía registros previos válidos.');
    }

    console.log('\n=====================================================');
    console.log(' ¡AUDITORÍA Y SEED COMPLETADOS EXITOSAMENTE!');
    console.log('=====================================================');
  } catch (error) {
    console.error('Error durante clean and seed:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

cleanAndSeed();
