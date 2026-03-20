let usuarioActual = null;
let carrito = [];
let ventas = [];
let usuarioAModificar = [];
const appContainer = document.getElementById('app-container');
const APP_STORAGE_KEYS = {
  tema: 'panaderia-tema',
  ultimaVista: 'panaderia-ultima-vista',
  actualizacionVista: 'panaderia-update-vista'
};
const DEFAULT_BOLILLO_WEIGHT_KG = 0.065;
const ICONS = {
  success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.2 4.8 12.45l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4Z"/></svg>',
  error: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 10.6 4.9-4.9 1.4 1.4-4.9 4.9 4.9 4.9-1.4 1.4-4.9-4.9-4.9 4.9-1.4-1.4 4.9-4.9-4.9-4.9 1.4-1.4Z"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 2a9.5 9.5 0 1 0 9.9 12.4A8 8 0 1 1 12.1 2Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0 4h-1v-3h2v3h-1Zm0-17h-1V2h2v3h-1ZM4.9 6.3l-1.4-1.4L4.9 3.5l1.4 1.4-1.4 1.4Zm14.2 14.2-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4ZM2 13v-2h3v2H2Zm17 0v-2h3v2h-3ZM4.9 20.5l-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4Zm14.2-14.2-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4Z"/></svg>'
};

function iconHTML(type, label = '') {
  return `<span class="inline-icon inline-icon-${type}">${ICONS[type] || ''}${label ? `<span>${label}</span>` : ''}</span>`;
}

function ensureModalRoot() {
  if (document.getElementById('global-modal-root')) return;
  const root = document.createElement('div');
  root.id = 'global-modal-root';
  document.body.appendChild(root);
}

function showModal({ title = 'Mensaje', message = '', type = 'warning', showCancel = false, confirmText = 'Aceptar', cancelText = 'Cancelar' }) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');
  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="app-modal-overlay">
        <div class="app-modal-card">
          <div class="app-modal-title">${iconHTML(type, title)}</div>
          <div class="app-modal-body">${String(message).replaceAll('\n', '<br>')}</div>
          <div class="app-modal-actions">
            ${showCancel ? `<button id="modal-cancel" class="btn btn-secondary">${cancelText}</button>` : ''}
            <button id="modal-confirm" class="btn btn-primary">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const cleanup = (result) => {
      root.innerHTML = '';
      resolve(result);
    };

    document.getElementById('modal-confirm').addEventListener('click', () => cleanup(true));
    if (showCancel) {
      document.getElementById('modal-cancel').addEventListener('click', () => cleanup(false));
    }
    root.querySelector('.app-modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('app-modal-overlay')) cleanup(false);
    });
  });
}

const showAlert = (message, type = 'warning', title = 'Aviso') => showModal({ title, message, type, showCancel: false });
const showConfirm = (message, title = 'Confirmar') => showModal({ title, message, type: 'warning', showCancel: true, confirmText: 'Confirmar' });

function esVistaCliente() {
  return usuarioActual?.Rol === 'Cliente';
}

function guardarUltimaVista(page) {
  if (esVistaCliente()) return;
  localStorage.setItem(APP_STORAGE_KEYS.ultimaVista, page);
}

function obtenerUltimaVistaPorRol() {
  if (esVistaCliente()) return 'compras';

  const fallback = usuarioActual?.Rol === 'Empleado' ? 'ventas' : 'personal';
  const guardada = localStorage.getItem(APP_STORAGE_KEYS.ultimaVista);

  if (!guardada) return fallback;

  const paginasPermitidas = usuarioActual?.Rol === 'Empleado'
    ? ['ventas']
    : ['personal', 'proveedores', 'inventario', 'registroVenta', 'reportes'];

  return paginasPermitidas.includes(guardada) ? guardada : fallback;
}

function aplicarTemaGuardado() {
  const tema = localStorage.getItem(APP_STORAGE_KEYS.tema) || 'claro';
  const debeUsarOscuro = tema === 'oscuro' && !esVistaCliente();
  document.body.classList.toggle('dark-theme', debeUsarOscuro);
}

function alternarTema() {
  if (esVistaCliente()) {
    document.body.classList.remove('dark-theme');
    localStorage.setItem(APP_STORAGE_KEYS.tema, 'claro');
    return;
  }

  const esOscuro = document.body.classList.toggle('dark-theme');
  localStorage.setItem(APP_STORAGE_KEYS.tema, esOscuro ? 'oscuro' : 'claro');

  const temaBtn = document.getElementById('theme-toggle-btn');
  if (temaBtn) {
    temaBtn.innerHTML = esOscuro ? `${iconHTML('sun')} Tema Claro` : `${iconHTML('moon')} Tema Oscuro`;
  }
}

function formatearFechaHora(valor) {
  if (!valor) return 'N/D';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString('es-MX');
}

function obtenerCanalActual() {
  return esVistaCliente() ? 'Autocobro' : 'CajaEmpleado';
}

function cerrarSesionActual() {
  usuarioActual = null;
  carrito = [];
  localStorage.removeItem(APP_STORAGE_KEYS.ultimaVista);
  renderLogin();
}

async function pedirAutorizacionGerente(canal) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');

  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="app-modal-overlay">
        <div class="app-modal-card auth-modal-card">
          <div class="app-modal-title">${iconHTML('warning', 'Autorización de gerente')}</div>
          <div class="app-modal-body">
            <p>Para confirmar el corte de <strong>${canal === 'Autocobro' ? 'autocobro' : 'caja del empleado'}</strong>, ingresa un usuario y contraseña con rol Gerente.</p>
            <div class="form-group">
              <label for="gerente-usuario">Usuario gerente</label>
              <input id="gerente-usuario" class="form-control" type="text" autocomplete="username">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label for="gerente-password">Contraseña</label>
              <input id="gerente-password" class="form-control" type="password" autocomplete="current-password">
            </div>
          </div>
          <div class="app-modal-actions">
            <button id="modal-cancel" class="btn btn-secondary">Cancelar</button>
            <button id="modal-confirm" class="btn btn-primary">Autorizar corte</button>
          </div>
        </div>
      </div>
    `;

    const cleanup = (result) => {
      root.innerHTML = '';
      resolve(result);
    };

    document.getElementById('modal-cancel').addEventListener('click', () => cleanup(null));
    document.getElementById('modal-confirm').addEventListener('click', () => {
      cleanup({
        gerenteUsuario: document.getElementById('gerente-usuario').value.trim(),
        gerentePassword: document.getElementById('gerente-password').value
      });
    });
  });
}

async function ejecutarCorteTurno() {
  const credenciales = await pedirAutorizacionGerente(obtenerCanalActual());
  if (!credenciales) return;

  if (!credenciales.gerenteUsuario || !credenciales.gerentePassword) {
    await showAlert('Debes capturar usuario y contraseña del gerente para continuar.', 'warning', 'Autorización requerida');
    return;
  }

  try {
    const resultado = await window.api.registrarCorteTurno({
      channel: obtenerCanalActual(),
      idEmpleado: esVistaCliente() ? null : (usuarioActual.IdEmpleado || usuarioActual.idEmpleado || null),
      idCliente: esVistaCliente() ? (usuarioActual.IdEmpleado || usuarioActual.idEmpleado || null) : null,
      ...credenciales
    });

    const resumen = resultado.resumen;
    await showAlert(
      `Corte registrado correctamente.

Canal: ${resumen.canal}
Ventas incluidas: ${resumen.totalVentas}
Importe total: ${formatearMoneda(resumen.totalImporte)}
Desde: ${formatearFechaHora(resumen.fechaInicio)}
Hasta: ${formatearFechaHora(resumen.fechaFin)}
Autorizó: ${resultado.autorizadoPor}

La sesión actual se cerrará para permitir el acceso del siguiente empleado.`,
      'success',
      'Corte completado'
    );
    cerrarSesionActual();
  } catch (error) {
    await showAlert(error.message || 'No fue posible registrar el corte.', 'error', 'Corte rechazado');
  }
}

function renderUpdateStatusBanner(status) {
  if (!status || ['idle', 'development', 'up_to_date'].includes(status.status)) {
    return '';
  }

  const version = status.downloadedVersion || status.availableVersion;
  const action = status.status === 'pending'
    ? `<button id="install-update-btn" class="btn btn-warning btn-sm">Instalar al reiniciar</button>`
    : '';

  return `
    <div class="update-banner ${status.status}">
      <div>
        <strong>Actualización pendiente</strong>
        <p>${status.message || 'Hay una actualización disponible.'}${version ? ` Versión: ${version}.` : ''}</p>
      </div>
      <div>${action}</div>
    </div>
  `;
}

async function obtenerEstadoActualizacion() {
  try {
    return await window.api.getUpdateStatus();
  } catch (error) {
    return null;
  }
}

async function instalarActualizacionPendiente() {
  try {
    const resultado = await window.api.installPendingUpdate();
    if (!resultado.success) {
      await showAlert(resultado.message || 'Todavía no hay una actualización descargada.', 'warning', 'Actualización');
      return;
    }
    await showAlert('La aplicación se cerrará para instalar la actualización descargada.', 'success', 'Instalando actualización');
  } catch (error) {
    await showAlert(error.message || 'No fue posible iniciar la instalación de la actualización.', 'error', 'Actualización');
  }
}

async function notificarActualizacionPendienteUnaVez() {
  const estado = await obtenerEstadoActualizacion();
  if (!estado || !['available', 'pending'].includes(estado.status)) return;

  const ultimaVersionMostrada = localStorage.getItem(APP_STORAGE_KEYS.actualizacionVista);
  const versionActual = estado.downloadedVersion || estado.availableVersion || estado.version;
  if (ultimaVersionMostrada === versionActual) return;

  localStorage.setItem(APP_STORAGE_KEYS.actualizacionVista, versionActual);
  await showAlert(estado.message || 'Hay una actualización pendiente para esta estación.', 'warning', 'Actualización pendiente');
}

aplicarTemaGuardado();

function formatearMoneda(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

function crearCSV(data, headers) {
  const encabezado = headers.join(',');
  const filas = data.map((row) => headers.map((key) => {
    const raw = row[key] ?? '';
    const escaped = String(raw).replaceAll('"', '""');
    return `"${escaped}"`;
  }).join(','));

  return [encabezado, ...filas].join('\n');
}

function descargarTexto(nombreArchivo, contenido, tipo = 'text/plain;charset=utf-8;') {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
}

async function renderResumenRol() {
  const content = document.getElementById('content-area');
  if (!content || !usuarioActual) return;

  try {
    if (usuarioActual.Rol === 'Gerente') {
      const [empleados, proveedores, productos] = await Promise.all([
        window.api.getEmpleados(),
        window.api.getProveedores(),
        window.api.getProductos()
      ]);
      const productosBajoStock = productos.filter((p) => Number(p.Cantidad || 0) <= Number(p.Minimo || p.CantidadMinima || 5));
      content.innerHTML = `
        <div class="card">
          <h2>Panel Gerencial</h2>
          <div class="stats-grid">
            <div class="stat-item"><strong>${empleados.length}</strong><span>Empleados registrados</span></div>
            <div class="stat-item"><strong>${proveedores.length}</strong><span>Proveedores activos</span></div>
            <div class="stat-item"><strong>${productos.length}</strong><span>Productos en catálogo</span></div>
            <div class="stat-item warning"><strong>${productosBajoStock.length}</strong><span>Productos con stock bajo</span></div>
          </div>
          <p style="margin-top:12px;">Tip: revisa Inventario para reabastecer productos críticos.</p>
        </div>
      `;
      return;
    }

    if (usuarioActual.Rol === 'Empleado') {
      const productos = await window.api.getProductos();
      const agotados = productos.filter((p) => (p.Cantidad || 0) === 0).length;
      content.innerHTML = `
        <div class="card">
          <h2>Panel de Caja</h2>
          <div class="stats-grid">
            <div class="stat-item"><strong>${productos.length}</strong><span>Productos disponibles</span></div>
            <div class="stat-item"><strong>${agotados}</strong><span>Productos agotados</span></div>
          </div>
          <p style="margin-top:12px;">Puedes iniciar una venta desde el menú lateral.</p>
        </div>
      `;
      return;
    }

    const productos = await window.api.getProductos();
    content.innerHTML = `
      <div class="card">
        <h2>Bienvenido a Dulce Horno</h2>
        <div class="stats-grid">
          <div class="stat-item"><strong>${productos.length}</strong><span>Productos para comprar</span></div>
        </div>
        <p style="margin-top:12px;">Explora el catálogo y genera tu pedido en segundos.</p>
      </div>
    `;
  } catch (error) {
    content.innerHTML = '<div class="card"><h2>Resumen</h2><p>No fue posible cargar estadísticas iniciales.</p></div>';
  }
}

// =============== LOGIN ==================
// 1. Usuarios permitidos para entrar sin base de datos
const DATOS_LOCAL_BACKUP = {
  usuarios: [
    { 
      NombreUsuario: 'admin', 
      PasswordLocal: '1234',
      NombreCompleto: 'Admin Local (Sin DB)', 
      Rol: 'Gerente', 
      Activo: 1, 
      IdEmpleado: 999 
    },
    { 
      NombreUsuario: 'empleado1', 
      PasswordLocal: '5678', 
      NombreCompleto: 'Empleado de Turno', 
      Rol: 'Empleado', 
      Activo: 1, 
      IdEmpleado: 888 
    }
  ]
};

async function renderLogin() {
  appContainer.innerHTML = `
    <div class="login-container card">
        <h2><i class="fas fa-bread-slice icon"></i> Panadería Dulce Horno</h2>
        <div id="login-error" style="display: none;" class="alert alert-danger"></div>
        <form id="login-form">
            <div class="form-group">
                <label for="username">Usuario:</label>
                <input type="text" id="username" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-sign-in-alt icon"></i> Ingresar
            </button>
        </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    errorDiv.style.display = 'none';
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;

    try {
      const result = await window.api.login(username, password);

      if (result.success) {
        usuarioActual = result.user;
        const updateStatus = await obtenerEstadoActualizacion();
        renderDashboard(updateStatus);
        await notificarActualizacionPendienteUnaVez();
      } else {
        mostrarErrorLogin('Error', result.message);
      }
    } catch (error) {
      console.warn('DB Offline. Buscando en usuarios locales...');
      
      const userLocal = DATOS_LOCAL_BACKUP.usuarios.find(u => 
        u.NombreUsuario === username && u.PasswordLocal === password
      );

      if (userLocal) {
        usuarioActual = userLocal;
        await showAlert('Modo local activo. Para habilitar la experiencia completa, configura la conexión en ./includes/conexion.js y ejecuta ./database/Panaderia.sql.', 'warning', 'Modo local');
        const updateStatus = await obtenerEstadoActualizacion();
        renderDashboard(updateStatus);
      } else {
        mostrarErrorLogin('Error de conexión', 'No hay conexión a la DB y las credenciales locales no coinciden.');
      }
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  function mostrarErrorLogin(titulo, mensaje) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.innerHTML = `<strong>${titulo}</strong><br>${mensaje}`;
    errorDiv.style.display = 'block';
  }
}

// =============== DASHBOARD ==================
function renderDashboard(updateStatus = null) {
  aplicarTemaGuardado();

  if (esVistaCliente()) {
    document.body.classList.remove('dark-theme');
    localStorage.setItem(APP_STORAGE_KEYS.tema, 'claro');
    appContainer.innerHTML = `
      <div class="client-pos-layout">
        <div class="client-pos-header card">
          <div>
            <h2>Autocobro Dulce Horno</h2>
            <p>Bienvenido, ${usuarioActual.NombreCompleto || usuarioActual.NombreUsuario}. Esta vista solo muestra el punto de venta.</p>
          </div>
          <div class="client-pos-actions">
            <button id="client-shift-cut-btn" class="btn btn-warning">${iconHTML('warning')} Corte de autocobro</button>
            <button id="logout-btn" class="btn btn-danger">Cerrar Sesión</button>
          </div>
        </div>
        ${renderUpdateStatusBanner(updateStatus)}
        <div id="content-area"></div>
      </div>
    `;

    const updateBtn = document.getElementById('install-update-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', instalarActualizacionPendiente);
    }

    document.getElementById('client-shift-cut-btn').addEventListener('click', ejecutarCorteTurno);
    document.getElementById('logout-btn').addEventListener('click', () => {
      cerrarSesionActual();
    });

    renderPage('compras');
    return;
  }

  let navbar = '';

  if (usuarioActual.Rol === 'Gerente') {
    navbar = `
      <a href="#" class="nav-link" data-page="personal">Gestión de Personal</a>
      <a href="#" class="nav-link" data-page="proveedores">Gestión de Proveedores</a>
      <a href="#" class="nav-link" data-page="inventario">Inventario</a>
      <a href="#" class="nav-link" data-page="registroVenta">Registro Ventas</a>
      <a href="#" class="nav-link" data-page="reportes">Reportes</a>
      <a href="#" class="nav-link" id="logout-btn" style="color:red;">Cerrar Sesión</a>`;
  } else if (usuarioActual.Rol === 'Empleado') {
    navbar = `
      <a href="#" class="nav-link" data-page="ventas">Punto de Venta</a>
      <a href="#" class="nav-link" id="logout-btn" style="color:red;">Cerrar Sesión</a>`;
  } else {
    navbar = `<a href="#" class="nav-link" data-page="compras">Comprar</a>`;
  }

  appContainer.innerHTML = `
    <div class="dashboard-container">
      <div class="sidebar">
        <h3>Menú</h3>
        <button id="theme-toggle-btn" class="btn btn-secondary theme-toggle-btn">${iconHTML('moon')} Tema Oscuro</button>
        ${navbar}
      </div>
      <div class="main-content">
        ${renderUpdateStatusBanner(updateStatus)}
        <div class="card">
          <div class="dashboard-header-row">
            <div>
              <h2>Bienvenido, ${usuarioActual.NombreUsuario} (${usuarioActual.Rol})</h2>
              <p class="dashboard-subtitle">Administra ventas, inventario, reportes y cortes desde un solo lugar.</p>
            </div>
            ${usuarioActual.Rol === 'Empleado' ? `<button id="shift-cut-btn" class="btn btn-warning">${iconHTML('warning')} Corte de turno</button>` : ''}
          </div>
          <div id="content-area"></div>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedPage = link.getAttribute('data-page');
      guardarUltimaVista(selectedPage);
      renderPage(selectedPage);
    });
  });

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.innerHTML = document.body.classList.contains('dark-theme')
      ? `${iconHTML('sun')} Tema Claro`
      : `${iconHTML('moon')} Tema Oscuro`;
    themeBtn.addEventListener('click', alternarTema);
  }

  const updateBtn = document.getElementById('install-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', instalarActualizacionPendiente);
  }

  const shiftCutBtn = document.getElementById('shift-cut-btn');
  if (shiftCutBtn) {
    shiftCutBtn.addEventListener('click', ejecutarCorteTurno);
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    cerrarSesionActual();
  });

  renderPage(obtenerUltimaVistaPorRol());
}

// ===================== REGISTRO PRODUCTO ==============
function showRegistrationProductForm() {
  // Crear el modal de registro
  const modalHTML = `
    <div id="modalRegistroProducto" class="modal" style="display:flex; position: fixed; 
        top: 0; left: 0; width:100%; height:100%; background: rgba(0,0,0,0.5);
        justify-content:center; align-items:center; z-index: 1000;">
      <div style="background:white; padding:25px; border-radius:10px; width:500px; max-height:90vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="margin:0; color: #2c3e50;">Agregar Nuevo Producto</h3>
          <button id="cerrarRegistro" style="background:none; border:none; font-size:20px; cursor:pointer; color:#666;">&times;</button>
        </div>
        
        <form id="formularioProducto">
          <div style="margin-bottom:15px;">
            <label for="nombreProducto" style="display:block; margin-bottom:5px; font-weight:bold;">Nombre del Producto *</label>
            <input type="text" id="nombreProducto" required 
                   style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:14px;"
                   placeholder="Ingresa el nombre del producto">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
            <div>
              <label for="cantidadProducto" style="display:block; margin-bottom:5px; font-weight:bold;">Cantidad Inicial *</label>
              <input type="number" id="cantidadProducto" required min="0" value="0"
                     style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:14px;">
            </div>
            
            <div>
              <label for="minimoProducto" style="display:block; margin-bottom:5px; font-weight:bold;">Stock Mínimo *</label>
              <input type="number" id="minimoProducto" required min="0" value="5"
                     style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:14px;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
            <div>
              <label for="precioVenta" style="display:block; margin-bottom:5px; font-weight:bold;">Precio de Venta *</label>
              <div style="position:relative;">
                <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#666;">$</span>
                <input type="number" id="precioVenta" required min="0" step="0.01" 
                       style="width:100%; padding:10px 10px 10px 25px; border:1px solid #ddd; border-radius:5px; font-size:14px;"
                       placeholder="0.00">
              </div>
            </div>
            
            <div>
              <label for="precioCompra" style="display:block; margin-bottom:5px; font-weight:bold;">Precio de Compra *</label>
              <div style="position:relative;">
                <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#666;">$</span>
                <input type="number" id="precioCompra" required min="0" step="0.01" 
                       style="width:100%; padding:10px 10px 10px 25px; border:1px solid #ddd; border-radius:5px; font-size:14px;"
                       placeholder="0.00">
              </div>
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label for="descripcionProducto" style="display:block; margin-bottom:5px; font-weight:bold;">Descripción (Opcional)</label>
            <textarea id="descripcionProducto" 
                     style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:14px; height:80px; resize:vertical;"
                     placeholder="Descripción adicional del producto"></textarea>
          </div>

          <div style="margin-bottom:15px; padding:10px; background:#f8f9fa; border-radius:5px;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Resumen:</label>
            <div id="resumenProducto" style="font-size:13px; color:#666;">
              Completa los campos para ver el resumen...
            </div>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
            <button type="button" id="cancelarRegistro" class="btn btn-secondary">Cancelar</button>
            <button type="submit" id="guardarProducto" class="btn btn-success">
              <i class="fas fa-save" style="margin-right:5px;"></i> Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Insertar el modal en el DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('modalRegistroProducto');
  const form = document.getElementById('formularioProducto');
  const resumen = document.getElementById('resumenProducto');

  // Función para actualizar el resumen
  function actualizarResumen() {
    const nombre = document.getElementById('nombreProducto').value || 'No especificado';
    const cantidad = document.getElementById('cantidadProducto').value || '0';
    const minimo = document.getElementById('minimoProducto').value || '0';
    const precioVenta = document.getElementById('precioVenta').value || '0.00';
    const precioCompra = document.getElementById('precioCompra').value || '0.00';
    const descripcion = document.getElementById('descripcionProducto').value || 'Ninguna';

    resumen.innerHTML = `
      <strong>${nombre}</strong><br>
      Cantidad: ${cantidad} | Mínimo: ${minimo}<br>
      Precio Venta: $${parseFloat(precioVenta).toFixed(2)} | Precio Compra: $${parseFloat(precioCompra).toFixed(2)}
    `;
  }

  // Event listeners para actualizar el resumen en tiempo real
  document.getElementById('nombreProducto').addEventListener('input', actualizarResumen);
  document.getElementById('cantidadProducto').addEventListener('input', actualizarResumen);
  document.getElementById('minimoProducto').addEventListener('input', actualizarResumen);
  document.getElementById('precioVenta').addEventListener('input', actualizarResumen);
  document.getElementById('precioCompra').addEventListener('input', actualizarResumen);
  document.getElementById('descripcionProducto').addEventListener('input', actualizarResumen);

  // Cerrar modal
  document.getElementById('cerrarRegistro').addEventListener('click', () => {
    modal.remove();
  });

  document.getElementById('cancelarRegistro').addEventListener('click', async () => {
    if (await showConfirm('¿Seguro que deseas cancelar? Se perderán los datos no guardados.', 'Cancelar registro')) {
      modal.remove();
    }
  });

  // Manejar envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnGuardar = document.getElementById('guardarProducto');
    const originalText = btnGuardar.innerHTML;

    try {
      // Deshabilitar botón mientras se guarda
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      // Obtener datos del formulario
      const productoData = {
        nombre: document.getElementById('nombreProducto').value,
        cantidad: document.getElementById('cantidadProducto').value,
        minimo: document.getElementById('minimoProducto').value,
        precioVenta: document.getElementById('precioVenta').value,
        precioCompra: document.getElementById('precioCompra').value,
        descripcion: document.getElementById('descripcionProducto').value
      };

      console.log('Enviando datos:', productoData);

      // Llamar al backend para guardar el producto
      const resultado = await window.api.agregarProducto(productoData);

      // Mostrar mensaje de éxito
      await showAlert(`${resultado.message}\nID del producto: ${resultado.id}`, 'success', 'Producto guardado');

      // Cerrar modal y recargar la página de inventario
      modal.remove();
      renderPage('inventario');

    } catch (error) {
      console.error('Error al guardar producto:', error);
      await showAlert(error.message, 'error', 'Error al guardar producto');

      // Restaurar botón
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = originalText;
    }
  });

  // Cerrar modal al hacer clic fuera del contenido
  modal.addEventListener('click', async (e) => {
    if (e.target === modal) {
      if (await showConfirm('¿Seguro que deseas cancelar? Se perderán los datos no guardados.', 'Cancelar registro')) {
        modal.remove();
      }
    }
  });

  // Enfocar el primer campo
  document.getElementById('nombreProducto').focus();
}

// =============== REGISTRO USUARIO ==================
function showRegistrationForm() {
  usuarioActual.rol = 'Gerente'
  appContainer.innerHTML = `
    <div class="register-container card">
        <h2><i class="fas fa-user-plus icon"></i> Registrar Nuevo Usuario</h2>
        <form id="register-form">
            <div class="form-group">
                <label for="reg-name">Nombre Completo:</label>
                <input type="text" id="reg-name" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-username">Nombre de Usuario:</label>
                <input type="text" id="reg-username" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-password">Contraseña:</label>
                <input type="password" id="reg-password" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-confirm-password">Confirmar contraseña:</label>
                <input type="password" id="reg-confirm-password" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-role">Rol:</label>
                <select id="reg-role" class="form-control">
                    <option value="Cliente">Cliente</option>
                    <option value="Empleado">Empleado</option>
                    <option value="Gerente">Gerente</option>
                </select>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-puesto">Puesto:</label>
                <input type="text" id="reg-puesto" class="form-control">
            </div>
            <div class="form-group" id="turno-group">
                <label for="reg-turno">Turno:</label>
                <select id="reg-turno" class="form-control">
                    <option value="">Seleccionar turno</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Nocturno">Nocturno</option>
                    <option value="Any">Any</option>
                </select>
            </div>
            <div class="form-group" id="salario-group">
                <label for="reg-salario">Salario:</label>
                <input type="number" id="reg-salario" class="form-control" step="0.01" min="0">
            </div>
            <button type="submit" class="btn btn-primary">Registrar</button>
            <button type="button" id="cancel-btn" class="btn btn-secondary">Cancelar</button>
        </form>
    </div>
  `;

  // Mostrar/ocultar campos según el rol seleccionado
  const roleSelect = document.getElementById('reg-role');
  const puestoGroup = document.getElementById('puesto-group');
  const turnoGroup = document.getElementById('turno-group');
  const salarioGroup = document.getElementById('salario-group');

  function toggleFields() {
    const role = roleSelect.value;
    if (role === 'Cliente') {
      puestoGroup.style.display = 'none';
      turnoGroup.style.display = 'none';
      salarioGroup.style.display = 'none';
    } else {
      puestoGroup.style.display = 'block';
      turnoGroup.style.display = 'block';
      salarioGroup.style.display = 'block';
    }
  }

  // Ejecutar al cargar y cuando cambie el rol
  toggleFields();
  roleSelect.addEventListener('change', toggleFields);

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm-password').value;
    const rol = document.getElementById('reg-role').value;
    const puesto = document.getElementById('reg-puesto').value;
    const turno = document.getElementById('reg-turno').value;
    const salario = document.getElementById('reg-salario').value;

    if (password !== confirm) {
      await showAlert('Las contraseñas no coinciden', 'warning', 'Validación');
      return;
    }
    if (rol !== 'Cliente') {
      if (!puesto) { await showAlert('El puesto es requerido para empleados y gerentes', 'warning', 'Validación'); return; }
      if (!turno && rol !== 'Gerente') { await showAlert('El turno es requerido para empleados', 'warning', 'Validación'); return; }
    }

    const userData = {
      name,
      username,
      password,
      rol,
      puesto: rol === 'Cliente' ? 'Usuario' : puesto,
      turno: rol === 'Cliente' ? 'Any' : turno,
      salario: rol === 'Cliente' ? null : parseFloat(salario) || 0
    };

    await window.api.registrarUsuario(userData);
    await showAlert('Usuario registrado correctamente', 'success', 'Registro exitoso');
    renderDashboard();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    renderDashboard();
  });
}

// =============== REGISTRO PROVEEDOR ==================
function showAddProveedor() {
  usuarioActual.rol = 'Gerente'
  appContainer.innerHTML = `
    <div class="register-container card">
        <h2><i class="fas fa-user-plus icon"></i> Registrar Nuevo Proveedor</h2>
        <form id="register-form">
            <div class="form-group">
                <label for="reg-name">Nombre:</label>
                <input type="text" id="reg-name" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-address">Direccion:</label>
                <input type="text" id="reg-address" class="form-control" required>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-telefono">Telefono:</label>
                <input type="number" id="reg-telefono" class="form-control" required>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-mail">Correo:</label>
                <input type="enail" id="reg-mail" class="form-control" required>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-contacto">Persona de Contacto:</label>
                <input type="text" id="reg-contacto" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary">Registrar</button>
            <button type="button" id="cancel-btn" class="btn btn-secondary">Cancelar</button>
        </form>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const direccion = document.getElementById('reg-address').value;
    const telefono = document.getElementById('reg-telefono').value;
    const mail = document.getElementById('reg-mail').value;
    const contacto = document.getElementById('reg-contacto').value;


    const userData = {
      name,
      direccion,
      telefono,
      mail,
      contacto
    };

    await window.api.registrarProveedor(userData);
    await showAlert('Proveedor registrado correctamente', 'success', 'Registro exitoso');
    renderDashboard();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    renderDashboard();
  });
}

// =============== FORMULARIO PARA MODIFICAR USUARIO ==================
function showUpdateForm(usuarioAModificar) {
  usuarioActual.rol = 'Gerente'
  appContainer.innerHTML = `
    <div class="register-container card">
        <h2><i class="fas fa-user-plus icon"></i> Modificar Usuario</h2>
        <form id="register-form">
            <div class="form-group">
                <label for="reg-name">Nombre Completo:</label>
                <input type="text" id="reg-name" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-username">Nombre de Usuario:</label>
                <input type="text" id="reg-username" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-role">Rol:</label>
                <select id="reg-role" class="form-control">
                    <option value="Cliente">Cliente</option>
                    <option value="Empleado">Empleado</option>
                    <option value="Gerente">Gerente</option>
                </select>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-puesto">Puesto:</label>
                <input type="text" id="reg-puesto" class="form-control">
            </div>
            <div class="form-group" id="turno-group">
                <label for="reg-turno">Turno:</label>
                <select id="reg-turno" class="form-control">
                    <option value="">Seleccionar turno</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Nocturno">Nocturno</option>
                    <option value="Any">Any</option>
                </select>
            </div>
            <div class="form-group" id="salario-group">
                <label for="reg-salario">Salario:</label>
                <input type="number" id="reg-salario" class="form-control" step="0.01" min="0">
            </div>
            <button type="submit" class="btn btn-primary">Modificar Datos</button>
            <button type="button" id="cancel-btn" class="btn btn-secondary">Cancelar</button>
        </form>
    </div>
  `;
  //Agregar valores
  document.getElementById('reg-name').value = usuarioAModificar[2]
  document.getElementById('reg-username').value = usuarioAModificar[1]
  document.getElementById('reg-role').value = usuarioAModificar[3]
  document.getElementById('reg-puesto').value = usuarioAModificar[4]
  document.getElementById('reg-turno').value = usuarioAModificar[5]
  document.getElementById('reg-salario').value = usuarioAModificar[6]

  // Mostrar/ocultar campos según el rol seleccionado
  const roleSelect = document.getElementById('reg-role');
  const puestoGroup = document.getElementById('puesto-group');
  const turnoGroup = document.getElementById('turno-group');
  const salarioGroup = document.getElementById('salario-group');

  function toggleFields() {
    const role = roleSelect.value;
    if (role === 'Cliente') {
      puestoGroup.style.display = 'none';
      turnoGroup.style.display = 'none';
      salarioGroup.style.display = 'none';
    } else {
      puestoGroup.style.display = 'block';
      turnoGroup.style.display = 'block';
      salarioGroup.style.display = 'block';
    }
  }

  // Ejecutar al cargar y cuando cambie el rol
  toggleFields();
  roleSelect.addEventListener('change', toggleFields);
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = usuarioAModificar[0];
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const rol = document.getElementById('reg-role').value;
    const puesto = document.getElementById('reg-puesto').value;
    const turno = document.getElementById('reg-turno').value;
    const salario = document.getElementById('reg-salario').value;
    if (rol !== 'Cliente') {
      if (!puesto) { await showAlert('El puesto es requerido para empleados y gerentes', 'warning', 'Validación'); return; }
      if (!turno && rol !== 'Gerente') { await showAlert('El turno es requerido para empleados', 'warning', 'Validación'); return; }
    }

    const userData = {
      id,
      name,
      username,
      rol,
      puesto: rol === 'Cliente' ? 'Usuario' : puesto,
      turno: rol === 'Cliente' ? 'Any' : turno,
      salario: rol === 'Cliente' ? null : parseFloat(salario) || 0
    };
    
    try {
      const result = await window.api.modificarUsuario(userData);
      console.log("Actualización exitosa:", result);
      await showAlert('Usuario actualizado correctamente', 'success', 'Actualización exitosa');
      renderDashboard();
    } catch (error) {
      console.error("Error:", error);
      await showAlert('Error al actualizar usuario', 'error', 'Actualización fallida');
    }
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    renderDashboard();
  });
}
// =============== PÁGINAS ==================
async function renderPage(page) {
  guardarUltimaVista(page);
  const content = document.getElementById('content-area');
  if (page === 'personal') {
    const empleados = await window.api.getEmpleados();
    let seleccionadosPersonal = new Set();

    let rows = empleados.map((e, index) => {
      // Determinar si el empleado está activo o desactivado
      const estaActivo = e.Activo !== undefined ? e.Activo : true;
      const claseFila = estaActivo ? '' : 'empleado-desactivado';
      const indicadorEstado = estaActivo ? iconHTML('success') : iconHTML('error');

      return `
        <tr data-index="${index}" data-activo="${estaActivo}" class="${claseFila}">
          <td>${e.IdEmpleado || 'N/A'}</td>
          <td>
            ${indicadorEstado} ${e.NombreUsuario || 'No especificado'}
            ${!estaActivo ? '<br><small style="color:#e74c3c;">(Desactivado)</small>' : ''}
          </td>
          <td>${e.NombreCompleto || 'No especificado'}</td>
          <td>${e.Puesto || 'No especificado'}</td>
          <td>${e.Rol || 'No especificado'}</td>
          <td>${e.Turno || 'No especificado'}</td>
          <td>$${e.Salario ? parseFloat(e.Salario).toFixed(2) : '0.00'}</td>
        </tr>
      `;
    }).join('');

    content.innerHTML = `
        <div class="card">
          <h2>Gestión de Personal</h2>
          <div class="filter-toolbar">
            <input type="text" id="filtroPersonal" class="form-control" placeholder="Buscar por usuario, nombre, rol o turno...">
            <span id="resumenPersonal" class="filter-summary"></span>
          </div>
          <div style="margin-bottom:15px; padding:10px; background:#f8f9fa; border-radius:5px;">
            <strong>Leyenda:</strong> 
            <span style="color:#27ae60;">${iconHTML('success')} Empleado activo</span> | 
            <span style="color:#e74c3c;">${iconHTML('error')} Empleado desactivado</span>
          </div>
          <table class="table" id="tablaEmpleados">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Puesto</th>
                <th>Rol</th>
                <th>Turno</th>
                <th>Salario</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="botones-accion">
          <button id="registrarUsuario" class="btn btn-success">
            <i class="fas fa-user-plus"></i> Agregar Empleado
          </button>
          <button id="eliminarUsuario" class="btn btn-danger">
            <i class="fas fa-user-minus"></i> Desactivar Empleado
          </button>
          <button id="reactivarUsuario" class="btn btn-warning">
            <i class="fas fa-user-check"></i> Reactivar Empleado
          </button>
          <button id="modificarUsuario" class="btn btn-warning">
            <i class="fas fa-user-check"></i> Modificar Empleado
          </button>
        </div>

        <!-- Modal único para confirmaciones -->
        <div id="confirmacionUsuario" class="modal-confirmacion" style="display:none;">
          <div class="modal-contenido">
            <h3 id="tituloModal">Confirmar Acción</h3>
            <p id="mensajeModal">Selecciona empleados para realizar la acción</p>
            <div class="botones-modal">
              <button id="aceptarAccionUsuario" class="btn btn-success">
                <i class="fas fa-check"></i> Confirmar
              </button>
              <button id="cancelarAccionUsuario" class="btn btn-secondary">
                <i class="fas fa-times"></i> Cancelar
              </button>
            </div>
          </div>
        </div>
      `;

    const tabla = document.getElementById('tablaEmpleados');
    const filtroPersonal = document.getElementById('filtroPersonal');
    const resumenPersonal = document.getElementById('resumenPersonal');
    const confirmacionModal = document.getElementById('confirmacionUsuario');
    const tituloModal = document.getElementById('tituloModal');
    const mensajeModal = document.getElementById('mensajeModal');
    const btnAceptar = document.getElementById('aceptarAccionUsuario');

    let modoActual = null;

    function actualizarConteoFiltrado() {
      const filasVisibles = Array.from(tabla.querySelectorAll('tbody tr')).filter((fila) => fila.style.display !== 'none').length;
      resumenPersonal.textContent = `${filasVisibles} de ${empleados.length} empleados visibles`;
    }

    filtroPersonal.addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      tabla.querySelectorAll('tbody tr').forEach((fila) => {
        const filaTexto = fila.textContent.toLowerCase();
        fila.style.display = filaTexto.includes(query) ? '' : 'none';
      });
      actualizarConteoFiltrado();
    });

    actualizarConteoFiltrado();

    // ===================== REGISTRAR USUARIO =====================================
    document.getElementById('registrarUsuario').addEventListener('click', () => {
      showRegistrationForm();
    });

    // ===================== DESACTIVAR EMPLEADO ==================================
    document.getElementById('eliminarUsuario').addEventListener('click', () => {
      modoActual = 'desactivar';
      activarModoSeleccion('desactivar');
    });

    // ===================== REACTIVAR EMPLEADO ===================================
    document.getElementById('reactivarUsuario').addEventListener('click', () => {
      modoActual = 'reactivar';
      activarModoSeleccion('reactivar');
    });
    // ===================== MODIFICAR EMPLEADO ===================================
    document.getElementById('modificarUsuario').addEventListener('click', () => {
      modoActual = 'modificar';
      activarModoSeleccion('modificar');
    });
    // ===================== ACTIVAR MODO SELECCIÓN ===============================
    function activarModoSeleccion(modo) {
      // Limpiar selecciones anteriores
      seleccionadosPersonal.clear();
      tabla.querySelectorAll('.fila-seleccionada').forEach(f => f.classList.remove('fila-seleccionada'));

      // Configurar según el modo
      if(modo === 'modificar'){
          tabla.classList.add('modo-modificar');
          tabla.classList.remove('modo-reactivar');
          tabla.classList.remove('modo-desactivar');
          tituloModal.textContent = 'Modificar Empleado';
          mensajeModal.textContent = 'Selecciona un empleado para modificarlo';
          btnAceptar.className = 'btn btn-warning';
          btnAceptar.innerHTML = '<i class="fas fa-check"></i> Confirmar Modificacion';
      } else {
        if (modo === 'desactivar') {
          tabla.classList.add('modo-desactivar');
          tabla.classList.remove('modo-reactivar');
          tabla.classList.remove('modo-modificar');
          tituloModal.textContent = 'Desactivar Empleados';
          mensajeModal.textContent = 'Selecciona empleados ACTIVOS para desactivarlos';
          btnAceptar.className = 'btn btn-danger';
          btnAceptar.innerHTML = '<i class="fas fa-check"></i> Confirmar Desactivación';
        } else {
          tabla.classList.add('modo-reactivar');
          tabla.classList.remove('modo-desactivar');
          tabla.classList.remove('modo-modificar');
          tituloModal.textContent = 'Reactivar Empleados';
          mensajeModal.textContent = 'Selecciona empleados DESACTIVADOS para reactivarlos';
          btnAceptar.className = 'btn btn-success';
          btnAceptar.innerHTML = '<i class="fas fa-check"></i> Confirmar Reactivación';
        }
      }

      // Mostrar el modal único
      confirmacionModal.style.display = 'flex';
      // Mostrar instrucciones
      if(modo==='modificar'){
       // instruccion = '💡 Selecciona un empleado(s) para modificarlo';
      }else{
        if(modo==='desactivar'){
          instruccion='💡 Selecciona empleados ACTIVOS (verdes) para desactivarlos';
        }else{
          instruccion='💡 Selecciona empleados DESACTIVADOS (rojos) para reactivarlos';
        }
      }

      mostrarInstrucciones(instruccion);
    }

    // ===================== SELECCIONAR EMPLEADO =================================
    tabla.addEventListener('click', (e) => {
      const fila = e.target.closest('tr[data-index]');
      if (!fila) return;

      // Verificar que estemos en modo de selección
      const enModoModificar = tabla.classList.contains('modo-modificar');
      const enModoDesactivar = tabla.classList.contains('modo-desactivar');
      const enModoReactivar = tabla.classList.contains('modo-reactivar');

      if (!enModoDesactivar && !enModoReactivar && !enModoModificar) return;

      const index = fila.dataset.index;
      const empleado = empleados[index];
      const estaActivo = empleado.Activo !== undefined ? empleado.Activo : true;

      // Validar según el modo
      if (enModoDesactivar && !estaActivo) {
        showAlert('Este empleado ya está desactivado. Solo puedes seleccionar empleados activos.', 'warning', 'Selección no válida');
        return;
      }

      if (enModoReactivar && estaActivo) {
        showAlert('Este empleado ya está activo. Solo puedes seleccionar empleados desactivados.', 'warning', 'Selección no válida');
        return;
      }

      // Alternar selección
      if(modoActual==='modificar'){
        if(seleccionadosPersonal.has(index) || seleccionadosPersonal.size==1){
              seleccionadosPersonal.delete(index)
              fila.classList.remove('fila-seleccionada')
          }else{
            if(seleccionadosPersonal.size==0){
              seleccionadosPersonal.add(index)
              fila.classList.add('fila-seleccionada')
              usuarioAModificar[0] = tabla.rows[fila.rowIndex].cells[0].textContent;
              usuarioAModificar[1] = tabla.rows[fila.rowIndex].cells[1].textContent; 
              usuarioAModificar[2] = tabla.rows[fila.rowIndex].cells[2].textContent;
              usuarioAModificar[3] = tabla.rows[fila.rowIndex].cells[3].textContent;
              usuarioAModificar[4] = tabla.rows[fila.rowIndex].cells[4].textContent;
              usuarioAModificar[5] = tabla.rows[fila.rowIndex].cells[5].textContent;
              usuarioAModificar[6] = tabla.rows[fila.rowIndex].cells[6].textContent;
            }
          }
      }else{
        if (seleccionadosPersonal.has(index)) {
          seleccionadosPersonal.delete(index);
          fila.classList.remove('fila-seleccionada');
        } else {
          seleccionadosPersonal.add(index);
          fila.classList.add('fila-seleccionada');
        }
      }

      // Actualizar mensajes de confirmación
      actualizarMensajesConfirmacion();
    });

    function actualizarMensajesConfirmacion() {
      const count = seleccionadosPersonal.size;
      if (modoActual === 'desactivar') {
        mensajeModal.textContent = count === 0
          ? 'Selecciona empleados ACTIVOS para desactivarlos'
          : `Has seleccionado ${count} empleado(s) activo(s) para desactivar. ¿Continuar?`;
      } else{
        if(modoActual ==="modificar"){
          mensajeModal.textContent = count === 0
          ? 'Selecciona un empleado para modificarlo'
          : `Has seleccionado ${count} empleado(s) para modificarlo. ¿Continuar?`;
        }
        else
        {
          mensajeModal.textContent = count === 0
          ? 'Selecciona empleados DESACTIVADOS para reactivarlos'
          : `Has seleccionado ${count} empleado(s) desactivado(s) para reactivar. ¿Continuar?`;  
        }
      }
    }

    function mostrarInstrucciones(mensaje) {
      // Remover instrucciones anteriores
      const instruccionesAnteriores = document.getElementById('instruccionesModo');
      if (instruccionesAnteriores) {
        instruccionesAnteriores.remove();
      }

      const instrucciones = document.createElement('div');
      instrucciones.id = 'instruccionesModo';
      instrucciones.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${(modoActual === 'desactivar') ? '#e74c3c' : '#27ae60'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1001;
        font-weight: bold;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      `;
      instrucciones.textContent = mensaje;
      document.body.appendChild(instrucciones);
    }

    function desactivarModoSeleccion() {
      seleccionadosPersonal.clear();
      tabla.classList.remove('modo-desactivar', 'modo-reactivar','modo-modificar');
      confirmacionModal.style.display = 'none';

      // Remover instrucciones
      const instrucciones = document.getElementById('instruccionesModo');
      if (instrucciones) {
        instrucciones.remove();
      }

      // Remover selecciones visuales
      tabla.querySelectorAll('.fila-seleccionada').forEach(fila => {
        fila.classList.remove('fila-seleccionada');
      });
    }

    
    // ===================== CONFIRMAR ACCIÓN =====================================
    document.getElementById('aceptarAccionUsuario').addEventListener('click', async () => {
      if(modoActual==='modificar'){
        if (seleccionadosPersonal.size === 0) {
          await showAlert('No seleccionaste ningún empleado.', 'warning', 'Acción requerida');
          return;
        }
        else
        {
          showUpdateForm(usuarioAModificar)
        }
      }else{
        if (modoActual === 'desactivar') {
          await procesarCambioEstado(false); // Desactivar
        } else if (modoActual === 'reactivar') {
          await procesarCambioEstado(true); // Reactivar
        }
      }
    });
    // ===================== PROCESAR CAMBIO DE ESTADO ============================
    async function procesarCambioEstado(nuevoEstado) {
      if (seleccionadosPersonal.size === 0) {
        await showAlert('No seleccionaste ningún empleado.', 'warning', 'Acción requerida');
        return;
      }

      const accion = nuevoEstado ? 'reactivar' : 'desactivar';
      const empleadosAProcesar = Array.from(seleccionadosPersonal).map(index => empleados[index]);
      const nombresEmpleados = empleadosAProcesar.map(e => e.NombreCompleto || e.NombreUsuario).join(', ');

      if (!await showConfirm(`¿Estás seguro de que deseas ${accion} ${seleccionadosPersonal.size} empleado(s)?\n\n${nombresEmpleados}`, 'Confirmar cambios')) {
        return;
      }

      try {
        const idsAProcesar = Array.from(seleccionadosPersonal).map(index => {
          const empleado = empleados[index];
          return empleado.IdEmpleado;
        });

        console.log(`${nuevoEstado ? 'Reactivando' : 'Desactivando'} empleados:`, idsAProcesar);

        let procesadosExitosos = 0;
        let errores = [];

        for (const id of idsAProcesar) {
          try {
            console.log(`Procesando empleado ID: ${id}, nuevo estado: ${nuevoEstado}`);
            const resultado = await window.api.cambiarEstadoUsuario(id, nuevoEstado);
            console.log(`Empleado ${id} ${nuevoEstado ? 'reactivado' : 'desactivado'}:`, resultado);
            procesadosExitosos++;
          } catch (error) {
            console.error(`Error procesando empleado ${id}:`, error);
            errores.push(`ID ${id}: ${error.message}`);
          }
        }

        if (errores.length === 0) {
          await showAlert(`${procesadosExitosos} empleado(s) ${nuevoEstado ? 'reactivado(s)' : 'desactivado(s)'} correctamente.`, 'success', 'Proceso finalizado');
        } else {
          await showAlert(`${procesadosExitosos} empleado(s) procesado(s).\n\nErrores:\n${errores.join('\n')}`, 'warning', 'Proceso con incidencias');
        }

        desactivarModoSeleccion();
        setTimeout(() => renderPage('personal'), 100);

      } catch (error) {
        console.error('Error crítico:', error);
        await showAlert(error.message, 'error', 'Error crítico');
      }
    }

    // ===================== CANCELAR ACCIÓN ======================================
    document.getElementById('cancelarAccionUsuario').addEventListener('click', () => {
      desactivarModoSeleccion();
    });
  };

  // =============== PROVEEDORES ==================
  if (page === 'proveedores') {
    const proveedores = await window.api.getProveedores();

    let rows = proveedores.map((e, index) => {
      // Determinar si el empleado está activo o desactivado
      const estaActivo = e.Activo !== undefined ? e.Activo : true;
      const claseFila = estaActivo ? '' : 'empleado-desactivado';
      const indicadorEstado = estaActivo ? iconHTML('success') : iconHTML('error');

      return `
        <tr data-index="${index}" data-activo="${estaActivo}" class="${claseFila}">
          <td>${e.IdProveedor || 'N/A'}</td>
          <td>
            ${indicadorEstado} ${e.Nombre || 'No especificado'}
            ${!estaActivo ? '<br><small style="color:#e74c3c;">(Desactivado)</small>' : ''}
          </td>
          <td>${e.Direccion || 'No especificado'}</td>
          <td>${e.Telefono || 'No especificado'}</td>
          <td>${e.Correo || 'No especificado'}</td>
          <td>${e.Contacto || 'No especificado'}</td>
        </tr>
      `;
    }).join('');

    content.innerHTML = `
        <div class="card">
          <h2>Gestión de Proveedores</h2>
          <div style="margin-bottom:15px; padding:10px; background:#f8f9fa; border-radius:5px;">
            <strong>Leyenda:</strong> 
            <span style="color:#27ae60;">${iconHTML('success')} Proveedor activo</span> | 
            <span style="color:#e74c3c;">${iconHTML('error')} Proveedor desactivado</span>
          </div>
          <table class="table" id="tablaProveedores">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Direccion</th>
                <th>Telefono</th>
                <th>Correo</th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="botones-accion">
          <button id="registrarProveedor" class="btn btn-success">
            <i class="fas fa-user-plus"></i> Agregar Proveedor
          </button>
        </div>
      `;

    const tabla = document.getElementById('tablaProveedores');
    const confirmacionModal = document.getElementById('confirmacionUsuario');
    const tituloModal = document.getElementById('tituloModal');
    const mensajeModal = document.getElementById('mensajeModal');
    const btnAceptar = document.getElementById('aceptarAccionUsuario');

    let modoActual = null;

    // ===================== REGISTRAR USUARIO =====================================
    document.getElementById('registrarProveedor').addEventListener('click', () => {
      showAddProveedor();
    });

  };
  // =============== REPORTES ==================
  if (page === 'reportes') {
    const fechaHoy = new Date().toISOString().slice(0, 10);

    content.innerHTML = `
      <div class="card">
        <div class="report-header-row">
          <div>
            <h2>Reportes de operación</h2>
            <p>Consulta reportes semanales, mensuales o por fecha, el inventario disponible y el desempeño por canal de venta.</p>
          </div>
          <button id="exportarReporteCsv" class="btn btn-secondary">Exportar ventas del periodo</button>
        </div>
        <div class="filter-toolbar report-filter-toolbar">
          <select id="reportMode" class="form-control" style="max-width:220px;">
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="custom">Por fecha</option>
          </select>
          <input type="date" id="reportReferenceDate" class="form-control" value="${fechaHoy}" style="max-width:190px;">
          <input type="date" id="reportStartDate" class="form-control" value="${fechaHoy}" style="max-width:190px; display:none;">
          <input type="date" id="reportEndDate" class="form-control" value="${fechaHoy}" style="max-width:190px; display:none;">
          <button id="aplicarReporte" class="btn btn-primary">Actualizar reporte</button>
        </div>
        <div id="reportes-content">
          <p>Cargando reporte...</p>
        </div>
      </div>
    `;

    const reportMode = document.getElementById('reportMode');
    const reportReferenceDate = document.getElementById('reportReferenceDate');
    const reportStartDate = document.getElementById('reportStartDate');
    const reportEndDate = document.getElementById('reportEndDate');
    const exportarReporteCsv = document.getElementById('exportarReporteCsv');
    const reportesContent = document.getElementById('reportes-content');

    function toggleDateInputs() {
      const esCustom = reportMode.value === 'custom';
      reportReferenceDate.style.display = esCustom ? 'none' : '';
      reportStartDate.style.display = esCustom ? '' : 'none';
      reportEndDate.style.display = esCustom ? '' : 'none';
    }

    async function cargarReporte() {
      reportesContent.innerHTML = '<p>Cargando reporte...</p>';
      try {
        const filtros = {
          mode: reportMode.value,
          referenceDate: reportReferenceDate.value,
          startDate: reportStartDate.value,
          endDate: reportEndDate.value
        };
        const reporte = await window.api.getReportes(filtros);
        exportarReporteCsv.dataset.reporte = JSON.stringify(reporte.ventas || []);

        const resumen = reporte.resumen;
        const ventasPorDia = (reporte.ventasPorDia || []).map((item) => `
          <tr>
            <td>${item.fecha}</td>
            <td>${item.ventas}</td>
            <td>${formatearMoneda(item.total)}</td>
            <td>${formatearMoneda(item.autocobro)}</td>
            <td>${formatearMoneda(item.cajaEmpleado)}</td>
          </tr>
        `).join('') || '<tr><td colspan="5">Sin ventas en el periodo.</td></tr>';

        const canales = (reporte.porCanal || []).map((item) => `
          <tr>
            <td>${item.canal}</td>
            <td>${item.ventas}</td>
            <td>${formatearMoneda(item.total)}</td>
          </tr>
        `).join('') || '<tr><td colspan="3">Sin datos</td></tr>';

        const topProductos = (reporte.productosMasVendidos || []).slice(0, 8).map((item) => `
          <tr>
            <td>${item.producto}</td>
            <td>${item.cantidadVendida}</td>
            <td>${formatearMoneda(item.importe)}</td>
          </tr>
        `).join('') || '<tr><td colspan="3">Sin datos</td></tr>';

        const stockBajo = (reporte.inventarioStockBajo || []).map((item) => `
          <tr>
            <td>${item.Nombre}</td>
            <td>${item.Cantidad}</td>
            <td>${item.Minimo}</td>
            <td>${formatearMoneda(item.PrecioCompra)}</td>
          </tr>
        `).join('') || '<tr><td colspan="4">No hay alertas de stock en este momento.</td></tr>';

        const inventario = (reporte.inventario || []).map((item) => `
          <tr>
            <td>${item.Nombre}</td>
            <td>${item.Descripcion || 'Sin descripción'}</td>
            <td>${item.Cantidad}</td>
            <td>${item.Minimo}</td>
            <td>${formatearMoneda(item.PrecioCompra)}</td>
            <td>${formatearMoneda(item.PrecioVenta)}</td>
          </tr>
        `).join('') || '<tr><td colspan="6">Sin inventario</td></tr>';

        reportesContent.innerHTML = `
          <div class="stats-grid report-stats-grid">
            <div class="stat-item"><strong>${resumen.ventas}</strong><span>Ventas del periodo</span></div>
            <div class="stat-item"><strong>${formatearMoneda(resumen.totalIngresos)}</strong><span>Ingresos totales</span></div>
            <div class="stat-item"><strong>${resumen.articulosVendidos}</strong><span>Artículos vendidos</span></div>
            <div class="stat-item warning"><strong>${resumen.productosStockBajo}</strong><span>Alertas de stock</span></div>
          </div>

          <div class="card nested-card info-highlight-card">
            <h3>Revisión de pesaje del bolillo</h3>
            <p>Bolillos vendidos: <strong>${resumen.bolilloPiezas}</strong></p>
            <p>Peso estimado consumido: <strong>${resumen.bolilloKilosEstimados} kg</strong></p>
            <p class="helper-text">Estimación calculada con ${DEFAULT_BOLILLO_WEIGHT_KG} kg por bolillo. Úsalo para revisar consumo semanal, mensual o por rango de fechas.</p>
          </div>

          <div class="report-grid">
            <div class="card nested-card">
              <h3>Ventas por día</h3>
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Ventas</th><th>Total</th><th>Autocobro</th><th>Caja empleado</th></tr>
                </thead>
                <tbody>${ventasPorDia}</tbody>
              </table>
            </div>

            <div class="card nested-card">
              <h3>Canales de cobro</h3>
              <table class="table">
                <thead>
                  <tr><th>Canal</th><th>Ventas</th><th>Total</th></tr>
                </thead>
                <tbody>${canales}</tbody>
              </table>
            </div>
          </div>

          <div class="report-grid">
            <div class="card nested-card">
              <h3>Productos más vendidos</h3>
              <table class="table">
                <thead>
                  <tr><th>Producto</th><th>Cantidad</th><th>Importe</th></tr>
                </thead>
                <tbody>${topProductos}</tbody>
              </table>
            </div>

            <div class="card nested-card">
              <h3>Alertas de stock</h3>
              <table class="table">
                <thead>
                  <tr><th>Producto</th><th>Existencia</th><th>Mínimo</th><th>Costo</th></tr>
                </thead>
                <tbody>${stockBajo}</tbody>
              </table>
            </div>
          </div>

          <div class="card nested-card">
            <h3>Inventario de productos y materia prima</h3>
            <table class="table">
              <thead>
                <tr><th>Producto</th><th>Descripción</th><th>Existencia</th><th>Mínimo</th><th>Compra</th><th>Venta</th></tr>
              </thead>
              <tbody>${inventario}</tbody>
            </table>
          </div>
        `;
      } catch (error) {
        reportesContent.innerHTML = `<div class="alert alert-danger">No fue posible generar el reporte: ${error.message}</div>`;
      }
    }

    reportMode.addEventListener('change', () => {
      toggleDateInputs();
      cargarReporte();
    });
    document.getElementById('aplicarReporte').addEventListener('click', cargarReporte);
    exportarReporteCsv.addEventListener('click', () => {
      const ventasPeriodo = JSON.parse(exportarReporteCsv.dataset.reporte || '[]');
      const csv = crearCSV(ventasPeriodo.map((venta) => ({
        IdVenta: venta.IdVenta,
        FechaVenta: venta.FechaVenta,
        Canal: venta.Canal,
        Empleado: venta.EmpleadoNombre || 'Autocobro / Sistema',
        Cliente: venta.ClienteNombre || 'Mostrador',
        Total: Number(venta.Total || 0).toFixed(2)
      })), ['IdVenta', 'FechaVenta', 'Canal', 'Empleado', 'Cliente', 'Total']);
      descargarTexto(`reporte-ventas-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;');
    });

    toggleDateInputs();
    await cargarReporte();
  }

  // =============== REGISTRO VENTAS ==================
  let seleccionVenta = new Set();

  if (page === 'registroVenta') {
    const ventas = await window.api.getVentas();
    seleccionVenta = new Set();

    let rows = ventas.map((v, index) => `
    <tr data-index="${index}">
      <td>${v.IdVenta || 'N/A'}</td>
      <td>${v.FechaVenta || 'N/A'}</td>
      <td>${v.IdEmpleado || 'N/A'}</td>
      <td>${(v.Subtotal || 0).toFixed(2)}</td>
      <td>${(v.Iva || 0).toFixed(2)}</td>
      <td>$${(v.Total || 0).toFixed(2)}</td>
    </tr>
  `).join('');

    content.innerHTML = `
    <div class="card">
      <h2>Registro de Ventas</h2>
      <div class="filter-toolbar">
        <input type="text" id="filtroVentas" class="form-control" placeholder="Buscar por ID, empleado o fecha...">
        <button id="exportarVentasCsv" class="btn btn-secondary btn-sm">Exportar CSV</button>
      </div>
      <table class="table" id="tablaVentas">
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Fecha</th>
            <th>Empleado</th>
            <th>SubTotal</th>
            <th>Iva</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  
    <div class="botones-accion">
        <button id="verDetallesVenta" class="btn btn-primary" style="margin-top:15px;">
          <i class="fas fa-info-circle icon"></i> Ver Detalles de Venta
        </button>
    </div>

    <!-- Modal para detalles de venta -->
    <div id="modalDetallesVenta" class="modal" style="display:none; position: fixed; 
        top: 0; left: 0; width:100%; height:100%; background: rgba(0,0,0,0.5);
        justify-content:center; align-items:center;">
      <div style="background:white; padding:20px; border-radius:10px; width:600px; max-height:80vh; overflow-y:auto;">
        <h3>Detalles de la Venta</h3>
        <div id="detallesVentaContainer"></div>
        <div style="margin-top:15px; text-align:right;">
          <button id="cerrarDetallesVenta" class="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  `;

    // =================== SELECCIONAR VENTA ===================
    const filas = document.querySelectorAll('#tablaVentas tbody tr');
    const filtroVentas = document.getElementById('filtroVentas');
    const exportarVentasCsv = document.getElementById('exportarVentasCsv');

    filtroVentas.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase().trim();
      filas.forEach((fila) => {
        fila.style.display = fila.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    });

    exportarVentasCsv.addEventListener('click', () => {
      const ventasNormalizadas = ventas.map((venta) => ({
        IdVenta: venta.IdVenta,
        FechaVenta: venta.FechaVenta,
        IdEmpleado: venta.IdEmpleado,
        Subtotal: Number(venta.Subtotal || 0).toFixed(2),
        Iva: Number(venta.Iva || 0).toFixed(2),
        Total: Number(venta.Total || 0).toFixed(2)
      }));
      const csv = crearCSV(ventasNormalizadas, ['IdVenta', 'FechaVenta', 'IdEmpleado', 'Subtotal', 'Iva', 'Total']);
      descargarTexto(`ventas-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;');
    });

    filas.forEach((fila) => {
      fila.addEventListener('click', () => {
        const index = parseInt(fila.dataset.index);
        if (seleccionVenta.has(index)) {
          seleccionVenta.delete(index);
          fila.style.backgroundColor = '';
        } else {
          seleccionVenta.clear();
          filas.forEach(f => f.style.backgroundColor = '');
          seleccionVenta.add(index);
          fila.style.backgroundColor = '#cce5ff';
        }
      });
    });

    // =================== BOTÓN VER DETALLES ===================
    document.getElementById('verDetallesVenta').addEventListener('click', async () => {
      if (seleccionVenta.size !== 1) {
        await showAlert('Por favor, selecciona una sola venta para ver los detalles.', 'warning', 'Acción requerida');
        return;
      }

      const index = Array.from(seleccionVenta)[0];
      const venta = ventas[index];

      // Obtener detalles desde backend
      const detallesVenta = await window.api.getDetallesVenta(venta.IdVenta);

      // Seguridad ante datos faltantes
      const productos = detallesVenta?.Productos || [];
      const empleado = detallesVenta?.Empleado || {};

      let productosHTML = productos.length > 0
        ? productos.map(p => `
        <tr>
          <td>${p.NombreProducto}</td>
          <td>${p.Cantidad}</td>
          <td>$${p.PrecioUnitario?.toFixed(2) || '0.00'}</td>
          <td>$${((p.Cantidad || 0) * (p.PrecioUnitario || 0)).toFixed(2)}</td>
        </tr>
      `).join('')
        : '<tr><td colspan="4">No hay productos registrados en esta venta.</td></tr>';

      const container = document.getElementById('detallesVentaContainer');
      container.innerHTML = `
    <p><strong>ID Venta:</strong> ${venta.IdVenta}</p>
    <p><strong>Fecha:</strong> ${venta.FechaVenta}</p>
    <p><strong>Empleado:</strong> ${empleado.NombreCompleto || 'N/A'}</p>
    <hr>
    <h4>Productos Vendidos</h4>
    <table class="table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio Unitario</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${productosHTML}</tbody>
    </table>
    <hr>
    <p><strong>Subtotal:</strong> $${venta.Subtotal.toFixed(2)}</p>
    <p><strong>IVA:</strong> $${venta.Iva.toFixed(2)}</p>
    <p><strong>Total:</strong> $${venta.Total.toFixed(2)}</p>
  `;

      document.getElementById('modalDetallesVenta').style.display = 'flex';
    });


    // =================== CERRAR MODAL ===================
    document.getElementById('cerrarDetallesVenta').addEventListener('click', () => {
      document.getElementById('modalDetallesVenta').style.display = 'none';
    });
  }


  // =============== INVENTARIO ==================
  if (page === 'inventario') {
    const productos = await window.api.getProductos();
    let seleccionadosProducto = new Set();

    let rows = productos.map((p, index) => `
      <tr data-index="${index}">
        <td>${p.Nombre || p.nombre || 'N/A'}</td>
        <td>${p.Cantidad || p.cantidad || 0}</td>
        <td>${p.Minimo || p.minimo || 0}</td>
        <td>$${(p.PrecioVenta || p.precioVenta || 0).toFixed(2)}</td>
        <td>$${(p.PrecioCompra || p.precioCompra || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div class="card">
        <h2>Inventario</h2>
        <table class="table" id="tablaInventario">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Existencia</th>
              <th>Mínimo</th>
              <th>Precio Venta</th>
              <th>Precio Compra</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="botones-accion">
        <button id="registrarProducto" class="btn btn-success">
          <i class="fas fa-plus icon"></i> Agregar Producto Nuevo
        </button>
        <button id="agregarCantidad" class="btn btn-primary">
          <i class="fas fa-plus icon"></i> Agregar Cantidad
        </button>
        <button id="eliminarProducto" class="btn btn-danger">
          <i class="fas fa-minus icon"></i> Eliminar Producto
        </button>
      </div>

      <div id="confirmacionEliminar" style="display:none; position: fixed; bottom: 20px; right: 20px;">
        <button id="aceptarEliminar" class="btn btn-danger">Aceptar Baja</button>
        <button id="cancelarEliminar" class="btn btn-secondary">Cancelar</button>
      </div>

      <!-- Modal para elegir cantidad a eliminar -->
      <div id="modalCantidad" class="modal" style="display:none; position: fixed; 
          top: 0; left: 0; width:100%; height:100%; background: rgba(0,0,0,0.5);
          justify-content:center; align-items:center;">
        <div style="background:white; padding:20px; border-radius:10px; width:400px;">
          <h3>Eliminar cantidad de productos</h3>
          <div id="cantidadContainer"></div>
          <div style="margin-top:15px; text-align:right;">
            <button id="confirmarCantidad" class="btn btn-danger">Confirmar</button>
            <button id="cerrarModal" class="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Modal para alerta de reorden -->
      <div id="modalAlertaReorder" class="modal" style="display:none; position: fixed; 
          top: 0; left: 0; width:100%; height:100%; background: rgba(0,0,0,0.5);
          justify-content:center; align-items:center;">
        <div style="background:white; padding:20px; border-radius:10px; width:500px;">
          <h3 style="color: #e74c3c;">${iconHTML('warning')} Alerta de Inventario Bajo</h3>
          <div id="alertaContainer">
            <p>El producto <strong id="productoAlerta"></strong> ha quedado por debajo del nivel mínimo.</p>
            <p><strong>Existencia actual:</strong> <span id="cantidadActualAlerta" style="color: red;"></span></p>
            <p><strong>Nivel mínimo:</strong> <span id="minimoAlerta"></span></p>
            <p>¿Deseas hacer un pedido para reabastecer este producto?</p>
          </div>
          <div style="margin-top:20px; text-align:right;">
            <button id="siPedir" class="btn btn-primary">Sí, hacer pedido</button>
            <button id="noPedir" class="btn btn-secondary">Más tarde</button>
          </div>
        </div>
      </div>
    `;

    const tabla = document.getElementById('tablaInventario');
    const confirmacion = document.getElementById('confirmacionEliminar');
    const modal = document.getElementById('modalCantidad');
    const cantidadContainer = document.getElementById('cantidadContainer');
    const modalAlerta = document.getElementById('modalAlertaReorder');

    let productoActualAlerta = null;

    // ===================== REGISTRAR PRODUCTO =====================================
    document.getElementById('registrarProducto').addEventListener('click', () => {
      showRegistrationProductForm();
    });

    // ===================== AGREGAR CANTIDAD ===================================
    document.getElementById('agregarCantidad').addEventListener('click', async () => {
      activarModoAgregarCantidad();
    });

    async function activarModoAgregarCantidad() {
      tabla.classList.add('modo-agregar-cantidad');
      seleccionadosProducto.clear();
      await showAlert('Selecciona el producto al que deseas agregar cantidad.', 'warning', 'Inventario');
    }

    // ===================== ACTIVAR MODO ELIMINAR ==================================
    document.getElementById('eliminarProducto').addEventListener('click', async () => {
      tabla.classList.add('modo-eliminar');
      confirmacion.style.display = 'flex';
      seleccionadosProducto.clear();
      await showAlert('Selecciona los productos que deseas dar de baja.', 'warning', 'Inventario');
    });

    // ===================== SELECCIONAR PRODUCTOS ==================================
    tabla.addEventListener('click', (e) => {
      const fila = e.target.closest('tr[data-index]');
      if (!fila) return;

      const index = fila.dataset.index;
      const producto = productos[index];

      // Modo agregar cantidad
      if (tabla.classList.contains('modo-agregar-cantidad')) {
        // Verificar si el producto está por debajo del mínimo
        const existencia = producto.Cantidad || producto.cantidad || 0;
        const minimo = producto.Minimo || producto.minimo || 0;

        if (existencia < minimo) {
          // Mostrar alerta de reorden
          mostrarAlertaReorder(producto);
        } else {
          // Mostrar modal normal de agregar cantidad
          mostrarAgregarCantidad(producto);
        }

        tabla.classList.remove('modo-agregar-cantidad');
        return;
      }

      // Modo eliminar
      if (tabla.classList.contains('modo-eliminar')) {
        if (seleccionadosProducto.has(index)) {
          seleccionadosProducto.delete(index);
          fila.classList.remove('fila-seleccionada');
        } else {
          seleccionadosProducto.add(index);
          fila.classList.add('fila-seleccionada');
        }
      }
    });

    // ===================== MOSTRAR ALERTA DE REORDEN =========================
    function mostrarAlertaReorder(producto) {
      // Configurar la alerta
      document.getElementById('productoAlerta').textContent = producto.Nombre || producto.nombre;
      document.getElementById('cantidadActualAlerta').textContent = producto.Cantidad || producto.cantidad;
      document.getElementById('minimoAlerta').textContent = producto.Minimo || producto.minimo;

      productoActualAlerta = producto;

      // Mostrar modal de alerta
      modalAlerta.style.display = 'flex';

      // Configurar botones
      document.getElementById('siPedir').onclick = () => {
        modalAlerta.style.display = 'none';
        mostrarAgregarCantidad(producto);
      };

      document.getElementById('noPedir').onclick = () => {
        modalAlerta.style.display = 'none';
        // Opcional: mostrar el modal de agregar cantidad de todas formas
        setTimeout(async () => {
          if (await showConfirm('¿Deseas agregar cantidad al producto de todas formas?', 'Confirmar')) {
            mostrarAgregarCantidad(producto);
          }
        }, 500);
      };
    }

    // ===================== ACEPTAR ELIMINACIÓN ====================================
    document.getElementById('aceptarEliminar').addEventListener('click', async () => {
      if (seleccionadosProducto.size === 0) {
        await showAlert('No seleccionaste ningún producto.', 'warning', 'Acción requerida');
        return;
      }
      cantidadContainer.innerHTML = '';
      seleccionadosProducto.forEach(index => {
        const p = productos[index];
        cantidadContainer.innerHTML += `
        <div style="margin-bottom:10px;">
          <label><strong>${p.Nombre}</strong> (Existencia: ${p.Cantidad})</label><br>
          <input type="number" id="cantidad-${index}" min="1" max="${p.Cantidad}" 
                 placeholder="Cantidad a eliminar" class="input-cantidad" style="width:100%; padding:5px;">
        </div>
      `;
      });
      modal.style.display = 'flex';
    });

    // ===================== CONFIRMAR CANTIDADES ===================================
    document.getElementById('confirmarCantidad').addEventListener('click', async () => {
      let eliminaciones = [];

      seleccionadosProducto.forEach(index => {
        const p = productos[index];
        const input = document.getElementById(`cantidad-${index}`);
        const cantidad = parseInt(input.value) || 0;

        if (cantidad > 0 && cantidad <= p.Cantidad) {
          eliminaciones.push({
            idArticulo: p.IdArticulo,
            cantidad,
            producto: p
          });
        }
      });

      if (eliminaciones.length === 0) {
        await showAlert('Debes ingresar una cantidad válida para al menos un producto.', 'warning', 'Validación');
        return;
      }

      if (!await showConfirm('¿Seguro que deseas aplicar las bajas indicadas?', 'Confirmar bajas')) return;

      // Array para productos que necesitan reorden
      let productosNecesitanReorder = [];

      for (const e of eliminaciones) {
        console.log('Eliminando:', e);
        try {
          const resultado = await window.api.eliminarProducto(e.idArticulo, e.cantidad);

          // Verificar si necesita reorden
          if (resultado.necesitaReorder) {
            productosNecesitanReorder.push(resultado.producto);
          }
        } catch (error) {
          console.error('Error al eliminar:', error);
          await showAlert(`Error al eliminar: ${error.message}`, 'error', 'Operación fallida');
        }
      }

      // Mostrar alertas para productos que necesitan reorden
      if (productosNecesitanReorder.length > 0) {
        await mostrarAlertasReorder(productosNecesitanReorder);
      }

      await showAlert('Bajas aplicadas correctamente.', 'success', 'Operación exitosa');
      modal.style.display = 'none';
      confirmacion.style.display = 'none';
      tabla.classList.remove('modo-eliminar');
      renderPage('inventario');
    });

    // ===================== FUNCIÓN PARA MOSTRAR ALERTAS DE REORDEN ================
    async function mostrarAlertasReorder(productosArray) {
      for (const producto of productosArray) {
        await new Promise((resolve) => {
          // Configurar la alerta
          document.getElementById('productoAlerta').textContent = producto.nombre || producto.Nombre;
          document.getElementById('cantidadActualAlerta').textContent = producto.cantidadNueva || producto.Cantidad;
          document.getElementById('minimoAlerta').textContent = producto.minimo || producto.Minimo;

          productoActualAlerta = producto;

          // Mostrar modal de alerta
          modalAlerta.style.display = 'flex';

          // Configurar botones
          document.getElementById('siPedir').onclick = () => {
            modalAlerta.style.display = 'none';
            mostrarAgregarCantidad(producto);
            resolve();
          };

          document.getElementById('noPedir').onclick = () => {
            modalAlerta.style.display = 'none';
            resolve();
          };
        });
      }
    }

    // ===================== FUNCIÓN PARA MOSTRAR AGREGAR CANTIDAD ==============
    function mostrarAgregarCantidad(producto) {
      // Crear modal para agregar cantidad
      const modalHTML = `
    <div id="modalAgregarCantidad" class="modal" style="display:flex; position: fixed; 
        top: 0; left: 0; width:100%; height:100%; background: rgba(0,0,0,0.5);
        justify-content:center; align-items:center; z-index: 1000;">
      <div style="background:white; padding:25px; border-radius:10px; width:450px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="margin:0; color: #2c3e50;">Agregar Cantidad</h3>
          <button id="cerrarAgregarCantidad" style="background:none; border:none; font-size:20px; cursor:pointer; color:#666;">&times;</button>
        </div>
        
        <div style="margin-bottom:20px; padding:15px; background:#f8f9fa; border-radius:5px;">
          <h4 style="margin:0 0 10px 0; color: #2c3e50;">${producto.Nombre || producto.nombre}</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            <div>
              <strong>Existencia actual:</strong><br>
              <span style="color: #e74c3c; font-size: 18px;">${producto.Cantidad || producto.cantidad}</span>
            </div>
            <div>
              <strong>Mínimo requerido:</strong><br>
              <span style="color: #27ae60; font-size: 18px;">${producto.Minimo || producto.minimo}</span>
            </div>
          </div>
        </div>

        <form id="formularioAgregarCantidad">
          <div style="margin-bottom:20px;">
            <label for="cantidadAgregar" style="display:block; margin-bottom:8px; font-weight:bold;">
              Cantidad a agregar:
            </label>
            <input type="number" id="cantidadAgregar" required min="1" 
                   value="${Math.max(10, (producto.Minimo || producto.minimo) - (producto.Cantidad || producto.cantidad) + 5)}"
                   style="width:100%; padding:12px; border:2px solid #ddd; border-radius:5px; font-size:16px; text-align: center;"
                   placeholder="Ingresa la cantidad">
            <div style="margin-top:8px; font-size:12px; color:#666;">
              Sugerencia: ${Math.max(10, (producto.Minimo || producto.minimo) - (producto.Cantidad || producto.cantidad) + 5)} unidades
            </div>
          </div>

          <div style="margin-bottom:15px; padding:10px; background:#e8f5e8; border-radius:5px;">
            <strong>Nueva existencia:</strong>
            <span id="nuevaExistenciaPreview" style="font-weight:bold; color: #27ae60; margin-left: 10px;">
              ${(producto.Cantidad || producto.cantidad) + Math.max(10, (producto.Minimo || producto.minimo) - (producto.Cantidad || producto.cantidad) + 5)}
            </span>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button type="button" id="cancelarAgregarCantidad" class="btn btn-secondary">Cancelar</button>
            <button type="submit" id="confirmarAgregarCantidad" class="btn btn-success">
              <i class="fas fa-plus-circle" style="margin-right:5px;"></i> Agregar Cantidad
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

      // Insertar el modal en el DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('modalAgregarCantidad');
      const form = document.getElementById('formularioAgregarCantidad');
      const inputCantidad = document.getElementById('cantidadAgregar');
      const preview = document.getElementById('nuevaExistenciaPreview');

      // Actualizar preview en tiempo real
      inputCantidad.addEventListener('input', () => {
        const cantidad = parseInt(inputCantidad.value) || 0;
        const nuevaExistencia = (producto.Cantidad || producto.cantidad) + cantidad;
        preview.textContent = nuevaExistencia;

        // Cambiar color según si supera el mínimo
        if (nuevaExistencia >= (producto.Minimo || producto.minimo)) {
          preview.style.color = '#27ae60';
        } else {
          preview.style.color = '#e74c3c';
        }
      });

      // Cerrar modal
      document.getElementById('cerrarAgregarCantidad').addEventListener('click', () => {
        modal.remove();
      });

      document.getElementById('cancelarAgregarCantidad').addEventListener('click', () => {
        modal.remove();
      });

      // Manejar envío del formulario
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnConfirmar = document.getElementById('confirmarAgregarCantidad');
        const originalText = btnConfirmar.innerHTML;

        try {
          // Deshabilitar botón mientras se guarda
          btnConfirmar.disabled = true;
          btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';

          const cantidad = parseInt(inputCantidad.value);

          if (!cantidad || cantidad <= 0) {
            throw new Error("Por favor ingresa una cantidad válida mayor a 0.");
          }

          // Llamar al backend para agregar cantidad
          const resultado = await window.api.agregarCantidadProducto(producto.IdArticulo || producto.idArticulo, cantidad);

          // Mostrar mensaje de éxito
          await showAlert(`${resultado.message}\nNueva existencia: ${resultado.cantidadNueva}`, 'success', 'Inventario actualizado');

          // Cerrar modal y recargar la página de inventario
          modal.remove();
          renderPage('inventario');

        } catch (error) {
          console.error('Error al agregar cantidad:', error);
          await showAlert(error.message, 'error', 'Error al agregar cantidad');

          // Restaurar botón
          btnConfirmar.disabled = false;
          btnConfirmar.innerHTML = originalText;
        }
      });

      // Cerrar modal al hacer clic fuera del contenido
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Enfocar el campo de cantidad
      inputCantidad.select();
    }

    // ===================== CANCELAR ================================================
    document.getElementById('cancelarEliminar').addEventListener('click', () => {
      seleccionadosProducto.clear();
      confirmacion.style.display = 'none';
      tabla.classList.remove('modo-eliminar');
      tabla.querySelectorAll('tr[data-index]').forEach(f => f.classList.remove('fila-seleccionada'));
    });

    document.getElementById('cerrarModal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }


  // =============== VENTAS / COMPRAS ==================
  if (page === 'ventas' || page === 'compras') {
    const productos = await window.api.getProductos();
    let carrito = [];
    const esModoCompraCliente = page === 'compras';

    // Crear tabla de productos con botón "Agregar"
    let rows = productos.map(p => `
    <tr>
      <td>${p.Nombre || p.nombre || 'N/A'}</td>
      <td>${p.Cantidad || p.cantidad || 0}</td>
      <td>$${(p.PrecioVenta || p.precioVenta || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-primary agregar-btn" 
                data-id="${p.IdArticulo || p.idArticulo || ''}" 
                data-nombre="${p.Nombre || p.nombre || ''}" 
                data-precio="${p.PrecioVenta || p.precioVenta || 0}"
                data-existencia="${p.Cantidad || p.cantidad || 0}"
                ${(p.Cantidad || p.cantidad || 0) <= 0 ? 'disabled' : ''}>
          <i class="fas fa-cart-plus"></i> Agregar
        </button>
      </td>
    </tr>
  `).join('');

    content.innerHTML = `
    <div class="ventas-container">
      <div class="productos card">
        <h2>${esModoCompraCliente ? 'Catálogo de Productos' : 'Productos Disponibles'}</h2>
        <div class="filter-toolbar">
          <input type="text" id="filtroProductos" class="form-control" placeholder="Buscar producto...">
          <select id="ordenProductos" class="form-control" style="max-width:220px;">
            <option value="default">Orden por defecto</option>
            <option value="stockAsc">Stock más bajo</option>
            <option value="precioAsc">Precio menor a mayor</option>
            <option value="precioDesc">Precio mayor a menor</option>
          </select>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Existencia</th>
              <th>Precio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="carrito card">
        <h2>Carrito de Ventas</h2>
        <div id="alertaStock" style="display:none; padding:10px; margin-bottom:15px; background:#ffeaa7; border-radius:5px; border-left:4px solid #fdcb6e;">
          <i class="fas fa-exclamation-triangle"></i>
          <span id="mensajeAlerta"></span>
        </div>
        <table class="table" id="tablaCarrito">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="carritoLista"></tbody>
        </table>
        <div class="carritoFooter">
          <div class="totales">
            <div>Subtotal: $<span id="subtotal">0.00</span></div>
            <div>IVA (16%): $<span id="iva">0.00</span></div>
            <h3>Total: $<span id="total">0.00</span></h3>
          </div>
          <div class="acciones">
            <button id="btnPagar" class="btn btn-success">
              <i class="fas fa-cash-register"></i> ${esModoCompraCliente ? 'Confirmar compra' : 'Confirmar Venta'}
            </button>
            <button id="btnVaciar" class="btn btn-danger">
              <i class="fas fa-trash"></i> Vaciar Carrito
            </button>
            <button id="btnCorteCaja" class="btn btn-warning">
              <i class="fas fa-user-shield"></i> ${esModoCompraCliente ? 'Corte autocobro' : 'Corte de turno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

    const tablaProductosBody = document.querySelector('.productos .table tbody');
    const filtroProductos = document.getElementById('filtroProductos');
    const ordenProductos = document.getElementById('ordenProductos');

    function renderTablaProductos() {
      const query = filtroProductos.value.toLowerCase().trim();
      const orden = ordenProductos.value;

      const productosFiltrados = productos
        .filter((p) => (p.Nombre || p.nombre || '').toLowerCase().includes(query))
        .sort((a, b) => {
          const precioA = Number(a.PrecioVenta || a.precioVenta || 0);
          const precioB = Number(b.PrecioVenta || b.precioVenta || 0);
          const stockA = Number(a.Cantidad || a.cantidad || 0);
          const stockB = Number(b.Cantidad || b.cantidad || 0);
          if (orden === 'stockAsc') return stockA - stockB;
          if (orden === 'precioAsc') return precioA - precioB;
          if (orden === 'precioDesc') return precioB - precioA;
          return 0;
        });

      tablaProductosBody.innerHTML = productosFiltrados.map(p => `
      <tr>
        <td>${p.Nombre || p.nombre || 'N/A'}</td>
        <td>${p.Cantidad || p.cantidad || 0}</td>
        <td>${formatearMoneda(p.PrecioVenta || p.precioVenta || 0)}</td>
        <td>
          <button class="btn btn-sm btn-primary agregar-btn" 
                  data-id="${p.IdArticulo || p.idArticulo || ''}" 
                  data-nombre="${p.Nombre || p.nombre || ''}" 
                  data-precio="${p.PrecioVenta || p.precioVenta || 0}"
                  data-existencia="${p.Cantidad || p.cantidad || 0}"
                  ${(p.Cantidad || p.cantidad || 0) <= 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> Agregar
          </button>
        </td>
      </tr>
    `).join('');
      bindEventosAgregar();
    }

    // =============== EVENTOS ===============

    // Agregar producto al carrito
    function bindEventosAgregar() {
      document.querySelectorAll('.agregar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const nombre = btn.dataset.nombre;
        const precio = parseFloat(btn.dataset.precio);
        const existencia = parseInt(btn.dataset.existencia);

        console.log('Agregando producto:', { id, nombre, precio, existencia });

        // Verificar existencia antes de agregar
        try {
          const verificacion = await window.api.verificarExistencia(id, 1);

          if (!verificacion.puedeVender) {
            mostrarAlerta(`No hay suficiente existencia de ${nombre}. ${verificacion.mensaje}`);
            return;
          }

          const productoExistente = carrito.find(p => p.id === id);
          if (productoExistente) {
            // Verificar si podemos agregar uno más
            const nuevaVerificacion = await window.api.verificarExistencia(id, productoExistente.cantidad + 1);
            if (!nuevaVerificacion.puedeVender) {
              mostrarAlerta(`No puedes agregar más de ${nombre}. ${nuevaVerificacion.mensaje}`);
              return;
            }
            productoExistente.cantidad++;
          } else {
            carrito.push({
              id: id,
              nombre: nombre,
              precio: precio,
              cantidad: 1
            });
          }
          actualizarCarrito();
          ocultarAlerta();

        } catch (error) {
          mostrarAlerta(`Error: ${error.message}`);
        }
      });
      });
    }

    filtroProductos.addEventListener('input', renderTablaProductos);
    ordenProductos.addEventListener('change', renderTablaProductos);
    bindEventosAgregar();

    // Vaciar carrito
    document.getElementById('btnVaciar').addEventListener('click', () => {
      carrito = [];
      actualizarCarrito();
      ocultarAlerta();
    });

    document.getElementById('btnCorteCaja').addEventListener('click', ejecutarCorteTurno);

    // Pagar / Registrar venta
    document.getElementById('btnPagar').addEventListener('click', async () => {
      if (carrito.length === 0) {
        mostrarAlerta('El carrito está vacío');
        return;
      }

      let hayProblemas = false;
      for (const item of carrito) {
        try {
          const verificacion = await window.api.verificarExistencia(item.id, item.cantidad);
          if (!verificacion.puedeVender) {
            mostrarAlerta(`No hay suficiente existencia de ${item.nombre}. ${verificacion.mensaje}`);
            hayProblemas = true;
            break;
          }
        } catch (error) {
          mostrarAlerta(`Error al verificar ${item.nombre}: ${error.message}`);
          hayProblemas = true;
          break;
        }
      }

      if (hayProblemas) return;

      const datosVenta = {
        idEmpleado: esModoCompraCliente ? null : (usuarioActual.idEmpleado || usuarioActual.IdEmpleado || null),
        idCliente: esModoCompraCliente ? (usuarioActual.idEmpleado || usuarioActual.IdEmpleado || null) : null,
        canal: esModoCompraCliente ? 'Autocobro' : 'CajaEmpleado',
        carrito: carrito.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      console.log('Enviando venta:', datosVenta);

      try {
        const res = await window.api.registrarVenta(datosVenta);

        if (res.success) {
          await showAlert(`${esModoCompraCliente ? 'Compra registrada con éxito' : 'Venta registrada con éxito'}.\nID Venta: ${res.idVenta}\nCanal: ${res.canal}\nTotal: $${res.total.toFixed(2)}`, 'success', esModoCompraCliente ? 'Compra completada' : 'Venta completada');
          carrito = [];
          actualizarCarrito();
          ocultarAlerta();

          // Recargar página para actualizar existencias
          renderPage(esModoCompraCliente ? 'compras' : 'ventas');
        } else {
          mostrarAlerta(`Error al registrar la venta: ${res.error || 'Error desconocido'}`);
        }
      } catch (error) {
        mostrarAlerta(`Error al registrar la venta: ${error.message}`);
      }
    });

    // =============== FUNCIONES AUXILIARES ===============
    function mostrarAlerta(mensaje) {
      const alerta = document.getElementById('alertaStock');
      const mensajeElem = document.getElementById('mensajeAlerta');
      mensajeElem.textContent = mensaje;
      alerta.style.display = 'block';
    }

    function ocultarAlerta() {
      document.getElementById('alertaStock').style.display = 'none';
    }

    async function actualizarCarrito() {
      const lista = document.getElementById('carritoLista');
      const subtotalElem = document.getElementById('subtotal');
      const ivaElem = document.getElementById('iva');
      const totalElem = document.getElementById('total');
      lista.innerHTML = '';

      let subtotal = 0;

      for (const [index, item] of carrito.entries()) {
        const subtotalItem = item.precio * item.cantidad;
        subtotal += subtotalItem;

        let estadoStock = '';
        try {
          const verificacion = await window.api.verificarExistencia(item.id, item.cantidad);
          if (!verificacion.puedeVender) {
            estadoStock = 'style="background-color: #ffeaa7;"';
          }
        } catch (error) {
          estadoStock = 'style="background-color: #fab1a0;"';
        }

        lista.innerHTML += `
        <tr ${estadoStock}>
          <td>${item.nombre}</td>
          <td>
            <div style="display:flex; align-items:center; gap:5px;">
              <button class="btn btn-sm btn-outline-secondary btn-restar" data-index="${index}">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" min="1" value="${item.cantidad}" 
                     class="cantidad-input" data-index="${index}" style="width:60px; text-align:center;">
              <button class="btn btn-sm btn-outline-secondary btn-sumar" data-index="${index}">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </td>
          <td>$${item.precio.toFixed(2)}</td>
          <td>$${subtotalItem.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-danger eliminar-btn" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
      }

      const iva = subtotal * 0.16;
      const total = subtotal + iva;

      subtotalElem.textContent = subtotal.toFixed(2);
      ivaElem.textContent = iva.toFixed(2);
      totalElem.textContent = total.toFixed(2);

      // Eventos de cantidad
      document.querySelectorAll('.cantidad-input').forEach(input => {
        input.addEventListener('change', async (e) => {
          const index = parseInt(e.target.dataset.index);
          const nuevaCantidad = parseInt(e.target.value);

          if (nuevaCantidad > 0) {
            try {
              const item = carrito[index];
              const verificacion = await window.api.verificarExistencia(item.id, nuevaCantidad);

              if (!verificacion.puedeVender) {
                mostrarAlerta(`No hay suficiente existencia. ${verificacion.mensaje}`);
                e.target.value = item.cantidad;
                return;
              }

              carrito[index].cantidad = nuevaCantidad;
              actualizarCarrito();
              ocultarAlerta();
            } catch (error) {
              mostrarAlerta(`Error: ${error.message}`);
              e.target.value = carrito[index].cantidad;
            }
          }
        });
      });

      // Botones de sumar/restar
      document.querySelectorAll('.btn-sumar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const index = parseInt(e.target.closest('button').dataset.index);
          const item = carrito[index];

          try {
            const verificacion = await window.api.verificarExistencia(item.id, item.cantidad + 1);
            if (!verificacion.puedeVender) {
              mostrarAlerta(`No hay suficiente existencia. ${verificacion.mensaje}`);
              return;
            }

            carrito[index].cantidad++;
            actualizarCarrito();
            ocultarAlerta();
          } catch (error) {
            mostrarAlerta(`Error: ${error.message}`);
          }
        });
      });

      document.querySelectorAll('.btn-restar').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.closest('button').dataset.index);
          if (carrito[index].cantidad > 1) {
            carrito[index].cantidad--;
            actualizarCarrito();
            ocultarAlerta();
          }
        });
      });

      // Eventos eliminar
      document.querySelectorAll('.eliminar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          carrito.splice(parseInt(btn.dataset.index), 1);
          actualizarCarrito();
          ocultarAlerta();
        });
      });
    }

    renderTablaProductos();
  }
}
renderLogin();
