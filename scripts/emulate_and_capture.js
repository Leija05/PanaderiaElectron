const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../assets/promo_video/app_screens');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mock database products for realistic bakery POS emulation
const MOCK_PRODUCTS = [
  { IdArticulo: 1, CodigoBarras: '7501001', Nombre: 'Concha de Vainilla', Descripcion: 'Concha clásica esponjosa con costra dulce tradicional', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 48, Minimo: 15, PrecioVenta: 12.00, PrecioCosto: 6.00 },
  { IdArticulo: 2, CodigoBarras: '7501002', Nombre: 'Concha de Chocolate', Descripcion: 'Concha dulce con costra crocante de cacao puro', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 35, Minimo: 15, PrecioVenta: 12.00, PrecioCosto: 6.00 },
  { IdArticulo: 3, CodigoBarras: '7501003', Nombre: 'Croissant Mantequilla', Descripcion: 'Hojaldre francés dorado y crujiente 100% mantequilla', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 22, Minimo: 10, PrecioVenta: 22.00, PrecioCosto: 11.00 },
  { IdArticulo: 4, CodigoBarras: '7501004', Nombre: 'Dona Azúcar y Canela', Descripcion: 'Dona suave esponjada espolvoreada con canela fina', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 30, Minimo: 12, PrecioVenta: 14.00, PrecioCosto: 7.00 },
  { IdArticulo: 5, CodigoBarras: '7501005', Nombre: 'Baguette Rústica', Descripcion: 'Pan artesanal masa madre horneado sobre piedra', IdCategoria: 2, Categoria: 'Blanco & Bolillos', Cantidad: 16, Minimo: 10, PrecioVenta: 18.00, PrecioCosto: 8.50 },
  { IdArticulo: 6, CodigoBarras: '7501006', Nombre: 'Bolillo de Mesa', Descripcion: 'Bolillo crujiente por pieza recién salido del horno', IdCategoria: 2, Categoria: 'Blanco & Bolillos', Cantidad: 65, Minimo: 20, PrecioVenta: 5.50, PrecioCosto: 2.20 },
  { IdArticulo: 7, CodigoBarras: '7501007', Nombre: 'Muffin con Arándanos', Descripcion: 'Muffin húmedo horneado con arándanos silvestres', IdCategoria: 3, Categoria: 'Repostería', Cantidad: 18, Minimo: 8, PrecioVenta: 24.00, PrecioCosto: 12.00 },
  { IdArticulo: 8, CodigoBarras: '7501008', Nombre: 'Tarta de Frutos Rojos', Descripcion: 'Tarta gourmet con crema pastelera, frambuesas y zarzamoras', IdCategoria: 3, Categoria: 'Repostería', Cantidad: 8, Minimo: 5, PrecioVenta: 45.00, PrecioCosto: 22.00 },
  { IdArticulo: 9, CodigoBarras: '7501009', Nombre: 'Café Cappuccino 12oz', Descripcion: 'Café de altura recién tostado y leche vaporizada', IdCategoria: 4, Categoria: 'Bebidas', Cantidad: 50, Minimo: 15, PrecioVenta: 35.00, PrecioCosto: 14.00 }
];

const MOCK_USER = {
  IdEmpleado: 1,
  NombreUsuario: 'carlos.gerente',
  NombreCompleto: 'Carlos Leija (Gerente)',
  Rol: 'Gerente',
  Activo: 1
};

function registerMockIpc() {
  ipcMain.handle('login', async () => ({ success: true, user: MOCK_USER }));
  ipcMain.handle('getProductos', async () => MOCK_PRODUCTS);
  ipcMain.handle('getClientes', async () => [
    { IdCliente: 1, Nombre: 'María González', Telefono: '811-234-5678', TotalCompras: 24, PuntosFidelidad: 120 },
    { IdCliente: 2, Nombre: 'Roberto Hernández', Telefono: '818-987-6543', TotalCompras: 15, PuntosFidelidad: 75 }
  ]);
  ipcMain.handle('getEmpleados', async () => [
    { IdEmpleado: 1, NombreCompleto: 'Carlos Leija', NombreUsuario: 'carlos.gerente', Rol: 'Gerente', Activo: 1 },
    { IdEmpleado: 2, NombreCompleto: 'Ana Martínez', NombreUsuario: 'ana.cajera', Rol: 'Empleado', Activo: 1 }
  ]);
  ipcMain.handle('getProveedores', async () => [
    { IdProveedor: 1, Nombre: 'Molinos del Norte S.A.', Contacto: 'Harinas Selectas y Trigo', Telefono: '800-111-2233', Activo: 1 },
    { IdProveedor: 2, Nombre: 'Lácteos y Mantequillas La Vaca', Contacto: 'Mantequilla Pura y Lácteos', Telefono: '800-444-5566', Activo: 1 }
  ]);
  ipcMain.handle('getUpdateStatus', async () => ({ status: 'idle' }));
  ipcMain.handle('getLicenseStatus', async () => ({
    active: true,
    type: 'Comercial Pro Vitalicia',
    nombreNegocio: 'Panadería Dulce Horno'
  }));
  ipcMain.handle('getRemoteSupportStatus', async () => ({ enabled: false }));
  ipcMain.handle('registrarVenta', async (_, payload) => ({
    success: true,
    idVenta: 1042,
    folio: 'DH-1042',
    total: payload?.total || 74.00
  }));
  ipcMain.handle('registrarCorteTurno', async () => ({ success: true, idCorte: 88 }));
  ipcMain.handle('getReportes', async () => ({
    ventasTotales: 8450.00,
    numTickets: 72,
    ticketPromedio: 117.36,
    productoMasVendido: 'Concha de Vainilla (120 pzas)'
  }));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  registerMockIpc();

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    backgroundColor: '#FFF9F0',
    webPreferences: {
      preload: path.join(__dirname, '../src/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, '../src/views/index.html');
  await win.loadFile(indexPath);
  console.log('[Capture] Página index.html cargada exitosamente.');

  // Esperar montaje de React
  await sleep(1200);

  // 1. CAPTURAR LOGIN
  console.log('[Capture] Capturando Pantalla 1: Login...');
  // Rellenar credenciales visualmente en el formulario si están los inputs
  await win.webContents.executeJavaScript(`
    const uInput = document.querySelector('input[type="text"]') || document.querySelector('input[name="username"]');
    const pInput = document.querySelector('input[type="password"]');
    if (uInput) { uInput.value = 'carlos.gerente'; uInput.dispatchEvent(new Event('input', { bubbles: true })); }
    if (pInput) { pInput.value = 'password123'; pInput.dispatchEvent(new Event('input', { bubbles: true })); }
  `);
  await sleep(400);
  let img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '01_login.png'), img.toPNG());
  console.log('  [OK] 01_login.png');

  // 2. INICIAR SESIÓN
  console.log('[Capture] Ejecutando inicio de sesión...');
  await win.webContents.executeJavaScript(`
    const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Iniciar') || b.textContent.includes('Entrar'));
    if (btn) btn.click();
  `);
  await sleep(1500);

  // 3. CAPTURAR POS CATÁLOGO
  console.log('[Capture] Capturando Pantalla 2: POS Catálogo Inicial...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '02_pos_catalog.png'), img.toPNG());
  console.log('  [OK] 02_pos_catalog.png');

  // 4. AGREGAR PRODUCTOS AL CARRITO (Concha de Vainilla, Croissant, Tarta de Frutos)
  console.log('[Capture] Agregando productos al carrito...');
  await win.webContents.executeJavaScript(`
    const cards = Array.from(document.querySelectorAll('.pos-product-card, [class*="product-card"]'));
    if (cards.length > 0) {
      // Click concha de vainilla dos veces
      cards[0].click();
      setTimeout(() => cards[0].click(), 200);
      // Click croissant
      if (cards.length > 2) setTimeout(() => cards[2].click(), 400);
      // Click tarta
      if (cards.length > 7) setTimeout(() => cards[7].click(), 600);
    }
  `);
  await sleep(1000);

  // 5. CAPTURAR POS CON CARRITO Y TICKET EN VIVO
  console.log('[Capture] Capturando Pantalla 3: Carrito Activo y Ticket...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '03_pos_cart.png'), img.toPNG());
  console.log('  [OK] 03_pos_cart.png');

  // 6. ABRIR MODAL DE PAGO / COBRO
  console.log('[Capture] Abriendo Modal de Pago...');
  await win.webContents.executeJavaScript(`
    const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cobrar') || b.textContent.includes('Pagar') || b.classList.contains('pos-checkout-btn') || b.classList.contains('checkout-btn'));
    if (payBtn) payBtn.click();
  `);
  await sleep(800);

  // Rellenar efectivo recibido en modal
  await win.webContents.executeJavaScript(`
    const cashInput = document.querySelector('.payment-input, input[type="number"]') || document.querySelector('.modal input');
    if (cashInput) {
      cashInput.value = '100';
      cashInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await sleep(400);
  console.log('[Capture] Capturando Pantalla 4: Modal de Cobro & Cambio...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '04_payment_modal.png'), img.toPNG());
  console.log('  [OK] 04_payment_modal.png');

  // Cerrar modal
  await win.webContents.executeJavaScript(`
    const closeBtn = document.querySelector('.modal-close, [aria-label="Cerrar"], .btn-cancel') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cancelar') || b.textContent.includes('Cerrar'));
    if (closeBtn) closeBtn.click();
  `);
  await sleep(600);

  // 7. NAVEGAR A INVENTARIO
  console.log('[Capture] Navegando a Inventario...');
  await win.webContents.executeJavaScript(`
    const navItems = Array.from(document.querySelectorAll('.navbar-item, .nav-item, nav button, nav a'));
    const invBtn = navItems.find(b => b.textContent.includes('Inventario'));
    if (invBtn) invBtn.click();
  `);
  await sleep(1200);

  console.log('[Capture] Capturando Pantalla 5: Gestión de Inventario...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '05_inventario.png'), img.toPNG());
  console.log('  [OK] 05_inventario.png');

  // 8. NAVEGAR A CORTES DE CAJA O REPORTES
  console.log('[Capture] Navegando a Cortes / Reportes...');
  await win.webContents.executeJavaScript(`
    const navItems = Array.from(document.querySelectorAll('.navbar-item, .nav-item, nav button, nav a'));
    const cortesBtn = navItems.find(b => b.textContent.includes('Corte') || b.textContent.includes('Reportes'));
    if (cortesBtn) cortesBtn.click();
  `);
  await sleep(1200);

  console.log('[Capture] Capturando Pantalla 6: Cortes y Reportes...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '06_cortes_reportes.png'), img.toPNG());
  console.log('  [OK] 06_cortes_reportes.png');

  console.log('\n[Capture] ¡Todas las pantallas capturadas con éxito en alta resolución!');
  app.quit();
});
