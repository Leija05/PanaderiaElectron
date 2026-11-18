const { BrowserWindow, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../../assets/promo_video/app_screens');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MOCK_PRODUCTS = [
  { IdArticulo: 1, CodigoBarras: '7501001', Nombre: 'Concha de Vainilla', Descripcion: 'Concha clásica esponjosa con costra dulce tradicional', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 48, Minimo: 15, PrecioVenta: 12.00, PrecioCosto: 6.00 },
  { IdArticulo: 2, CodigoBarras: '7501002', Nombre: 'Concha de Chocolate', Descripcion: 'Concha dulce con costra crocante de cacao puro', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 35, Minimo: 15, PrecioVenta: 12.00, PrecioCosto: 6.00 },
  { IdArticulo: 3, CodigoBarras: '7501003', Nombre: 'Croissant Mantequilla', Descripcion: 'Hojaldre dorado y crujiente 100% mantequilla', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 22, Minimo: 10, PrecioVenta: 22.00, PrecioCosto: 11.00 },
  { IdArticulo: 4, CodigoBarras: '7501004', Nombre: 'Dona Azúcar y Canela', Descripcion: 'Dona suave esponjada espolvoreada con canela fina', IdCategoria: 1, Categoria: 'Pan Dulce', Cantidad: 30, Minimo: 12, PrecioVenta: 14.00, PrecioCosto: 7.00 },
  { IdArticulo: 5, CodigoBarras: '7501005', Nombre: 'Baguette Rústica', Descripcion: 'Pan artesanal masa madre horneado sobre piedra', IdCategoria: 2, Categoria: 'Blanco & Bolillos', Cantidad: 6, Minimo: 10, PrecioVenta: 18.00, PrecioCosto: 8.50 },
  { IdArticulo: 6, CodigoBarras: '7501006', Nombre: 'Bolillo de Mesa', Descripcion: 'Bolillo crujiente por pieza recién salido', IdCategoria: 2, Categoria: 'Blanco & Bolillos', Cantidad: 65, Minimo: 20, PrecioVenta: 5.50, PrecioCosto: 2.20 },
  { IdArticulo: 7, CodigoBarras: '7501007', Nombre: 'Muffin con Arándanos', Descripcion: 'Muffin húmedo con arándanos silvestres', IdCategoria: 3, Categoria: 'Repostería', Cantidad: 18, Minimo: 8, PrecioVenta: 24.00, PrecioCosto: 12.00 },
  { IdArticulo: 8, CodigoBarras: '7501008', Nombre: 'Tarta de Frutos Rojos', Descripcion: 'Tarta gourmet con frambuesas y zarzamoras', IdCategoria: 3, Categoria: 'Repostería', Cantidad: 8, Minimo: 5, PrecioVenta: 45.00, PrecioCosto: 22.00 },
  { IdArticulo: 9, CodigoBarras: '7501009', Nombre: 'Café Cappuccino 12oz', Descripcion: 'Café de grano de altura con leche vaporizada', IdCategoria: 4, Categoria: 'Bebidas', Cantidad: 50, Minimo: 15, PrecioVenta: 35.00, PrecioCosto: 14.00 }
];

const MOCK_USER = {
  IdEmpleado: 1,
  NombreUsuario: 'carlos.gerente',
  NombreCompleto: 'Carlos Leija',
  Rol: 'Gerente',
  Activo: 1
};

function setupMockIpc() {
  ipcMain.removeHandler('login');
  ipcMain.removeHandler('getProductos');
  ipcMain.removeHandler('getClientes');
  ipcMain.removeHandler('getEmpleados');
  ipcMain.removeHandler('getProveedores');
  ipcMain.removeHandler('getUpdateStatus');
  ipcMain.removeHandler('getLicenseStatus');
  ipcMain.removeHandler('getRemoteSupportStatus');
  ipcMain.removeHandler('getReportes');
  ipcMain.removeHandler('registrarVenta');
  ipcMain.removeHandler('registrarCorteTurno');
  ipcMain.removeHandler('getDevolucionesCliente');
  ipcMain.removeHandler('getRecepcionesProveedor');
  ipcMain.removeHandler('getAuxiliarMovimientos');
  ipcMain.removeHandler('getVentas');

  ipcMain.handle('login', async () => ({ success: true, user: MOCK_USER }));
  ipcMain.handle('getProductos', async () => MOCK_PRODUCTS);
  ipcMain.handle('getClientes', async () => [
    { IdCliente: 1, Nombre: 'María González', Telefono: '811-234-5678', TotalCompras: 24, PuntosFidelidad: 120, Correo: 'maria.g@gmail.com' },
    { IdCliente: 2, Nombre: 'Roberto Hernández', Telefono: '818-987-6543', TotalCompras: 15, PuntosFidelidad: 75, Correo: 'roberto.h@yahoo.com' },
    { IdCliente: 3, Nombre: 'Elena Villarreal', Telefono: '812-445-6677', TotalCompras: 38, PuntosFidelidad: 190, Correo: 'elena.v@outlook.com' },
    { IdCliente: 4, Nombre: 'Cafetería Las Palomas', Telefono: '811-998-1122', TotalCompras: 62, PuntosFidelidad: 310, Correo: 'pedidos@laspalomas.com' }
  ]);
  ipcMain.handle('getEmpleados', async () => [
    { IdEmpleado: 1, NombreCompleto: 'Carlos Leija', NombreUsuario: 'carlos.gerente', Rol: 'Gerente', Activo: 1, Turno: 'Matutino' },
    { IdEmpleado: 2, NombreCompleto: 'Ana Martínez', NombreUsuario: 'ana.cajera', Rol: 'Empleado', Activo: 1, Turno: 'Vespertino' },
    { IdEmpleado: 3, NombreCompleto: 'José Manuel Reyes', NombreUsuario: 'jose.panadero', Rol: 'Empleado', Activo: 1, Turno: 'Madrugada' }
  ]);
  ipcMain.handle('getProveedores', async () => [
    { IdProveedor: 1, Nombre: 'Molinos del Norte S.A.', Contacto: 'Harinas Selectas', Telefono: '800-111-2233', Activo: 1 },
    { IdProveedor: 2, Nombre: 'Lácteos La Vaca Dorada', Contacto: 'Mantequillas Puras', Telefono: '800-444-5566', Activo: 1 }
  ]);
  ipcMain.handle('getUpdateStatus', async () => ({ status: 'idle' }));
  ipcMain.handle('getLicenseStatus', async () => ({
    isActivated: true,
    isSuspended: false,
    tipoLicencia: 'Comercial Pro Vitalicia',
    nombreNegocio: 'Panadería Dulce Horno',
    gerenteUsuario: 'carlos.gerente'
  }));
  ipcMain.handle('getRemoteSupportStatus', async () => ({ enabled: false }));
  ipcMain.handle('registrarVenta', async (_, p) => ({
    success: true,
    idVenta: 1042,
    folio: 'DH-1042',
    total: p?.total || 105.00
  }));
  ipcMain.handle('registrarCorteTurno', async () => ({ success: true, idCorte: 88 }));
  ipcMain.handle('getDevolucionesCliente', async () => []);
  ipcMain.handle('getRecepcionesProveedor', async () => []);
  ipcMain.handle('getAuxiliarMovimientos', async () => []);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runDemoEmulation() {
  console.log('[DemoEmulation] Iniciando emulación interactiva del software DulceHorno...');
  setupMockIpc();

  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    backgroundColor: '#FFF9F0',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, '../views/index.html');
  await win.loadFile(indexPath);
  console.log('[DemoEmulation] Cargado index.html.');
  await sleep(1500);

  // 1. CAPTURA: LOGIN
  console.log('[DemoEmulation] Rellenando credenciales...');
  await win.webContents.executeJavaScript(`
    (() => {
      const uInput = document.querySelector('input[type="text"]');
      const pInput = document.querySelector('input[type="password"]');
      if (uInput) {
        uInput.value = 'carlos.gerente';
        uInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (pInput) {
        pInput.value = 'admin123';
        pInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })();
  `);
  await sleep(600);
  let img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '01_login.png'), img.toPNG());
  console.log('  [OK] 01_login.png guardado.');

  // 2. INICIAR SESIÓN
  console.log('[DemoEmulation] Iniciando sesión...');
  await win.webContents.executeJavaScript(`
    (() => {
      const form = document.querySelector('form.login-form') || document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    })();
  `);
  await sleep(2200);

  // 3. CAPTURA: POS CATÁLOGO
  console.log('[DemoEmulation] Capturando 02_pos_catalog.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '02_pos_catalog.png'), img.toPNG());
  console.log('  [OK] 02_pos_catalog.png guardado.');

  // 4. AGREGAR PRODUCTOS AL TICKET
  console.log('[DemoEmulation] Agregando panes al ticket...');
  await win.webContents.executeJavaScript(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.pos-product-card, [class*="product-card"]'));
      if (cards.length > 0) {
        cards[0].click(); // Concha Vainilla 1
        cards[0].click(); // Concha Vainilla 2
        if (cards[2]) cards[2].click(); // Croissant
        if (cards[3]) cards[3].click(); // Dona
        if (cards[7]) cards[7].click(); // Tarta Frutos Rojos
      }
    })();
  `);
  await sleep(1500);

  // 5. CAPTURA: TICKET DE VENTA EN VIVO
  console.log('[DemoEmulation] Capturando 03_pos_cart.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '03_pos_cart.png'), img.toPNG());
  console.log('  [OK] 03_pos_cart.png guardado.');

  // 6. ABRIR MODAL DE PAGO (COBRO)
  console.log('[DemoEmulation] Abriendo modal de cobro...');
  await win.webContents.executeJavaScript(`
    (() => {
      const checkoutBtn = document.querySelector('.btn-checkout');
      if (checkoutBtn) checkoutBtn.click();
    })();
  `);
  await sleep(1200);

  // Click billete o poner $150
  await win.webContents.executeJavaScript(`
    (() => {
      const quickBtns = Array.from(document.querySelectorAll('.modal button, .btn-quick'));
      const btn = quickBtns.find(b => b.textContent.includes('200') || b.textContent.includes('100'));
      if (btn) btn.click();
    })();
  `);
  await sleep(600);

  // CAPTURA: MODAL DE PAGO
  console.log('[DemoEmulation] Capturando 04_payment_modal.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '04_payment_modal.png'), img.toPNG());
  console.log('  [OK] 04_payment_modal.png guardado.');

  // Cerrar modal
  await win.webContents.executeJavaScript(`
    (() => {
      const cancelBtn = Array.from(document.querySelectorAll('.modal button')).find(b => b.textContent.includes('Cancelar'));
      if (cancelBtn) cancelBtn.click();
    })();
  `);
  await sleep(800);

  // 7. NAVEGAR A INVENTARIO
  console.log('[DemoEmulation] Navegando a Inventario...');
  await win.webContents.executeJavaScript(`
    (() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item-btn'));
      const invBtn = navItems.find(b => b.textContent.includes('Inventario'));
      if (invBtn) invBtn.click();
    })();
  `);
  await sleep(1500);

  console.log('[DemoEmulation] Capturando 05_inventario.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '05_inventario.png'), img.toPNG());
  console.log('  [OK] 05_inventario.png guardado.');

  // 8. NAVEGAR A CLIENTES
  console.log('[DemoEmulation] Navegando a Clientes...');
  await win.webContents.executeJavaScript(`
    (() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item-btn'));
      const cliBtn = navItems.find(b => b.textContent.includes('Clientes'));
      if (cliBtn) cliBtn.click();
    })();
  `);
  await sleep(1500);

  console.log('[DemoEmulation] Capturando 06_clientes.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '06_clientes.png'), img.toPNG());
  console.log('  [OK] 06_clientes.png guardado.');

  // 9. NAVEGAR A PERSONAL
  console.log('[DemoEmulation] Navegando a Personal...');
  await win.webContents.executeJavaScript(`
    (() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item-btn'));
      const perBtn = navItems.find(b => b.textContent.includes('Personal'));
      if (perBtn) perBtn.click();
    })();
  `);
  await sleep(1500);

  console.log('[DemoEmulation] Capturando 07_personal.png...');
  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, '07_personal.png'), img.toPNG());
  console.log('  [OK] 07_personal.png guardado.');

  console.log('\n[DemoEmulation] ¡TODAS LAS PANTALLAS DE DULCEHORNO CAPTURADAS CON ÉXITO!');
  app.quit();
}

module.exports = { runDemoEmulation };
