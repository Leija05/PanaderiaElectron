let usuarioActual = null;
let carrito = [];
let ventas = [];
let usuarioAModificar = [];
const appContainer = document.getElementById('app-container');
let estadoActualizacionGlobal = null;
let actualizacionListenerInicializado = false;
let aplicacionListaParaUso = false;
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

const APP_LOGO_SVG = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0 0 C0.83853516 -0.020625 1.67707031 -0.04125 2.54101562 -0.0625 C6.76420879 -0.08887435 9.28766758 -0.02080111 13.11328125 1.953125 C18.09664547 3.70019672 21.11875576 2.38720633 26.11914062 1.05419922 C32.86631268 -0.41494308 39.68971207 -0.24740785 46.5625 -0.1875 C47.31295593 -0.18412628 48.06341187 -0.18075256 48.83660889 -0.17727661 C66.60216819 -0.06149765 80.80195776 3.57873077 96.8125 11.25 C97.05097656 10.65574219 97.28945312 10.06148437 97.53515625 9.44921875 C99.08351091 6.78339712 100.66365147 5.71453543 103.25 4.0625 C104.03246094 3.55332031 104.81492188 3.04414062 105.62109375 2.51953125 C113.01622341 -1.76463477 124.98461641 -0.99929515 133.04296875 1.0859375 C140.0674121 4.33133923 145.48045998 9.89428771 148.6875 16.9375 C152.5735929 28.37988464 150.17774698 37.47579108 145.0625 48.0625 C144.61390625 48.93519531 144.1653125 49.80789062 143.703125 50.70703125 C141.88302179 55.9039049 144.56034157 60.23799436 146.625 65.0625 C151.71930057 77.3513695 155.0022339 90.32794036 154.875 103.6875 C154.86597656 104.92371094 154.85695312 106.15992187 154.84765625 107.43359375 C154.83025391 108.82771484 154.83025391 108.82771484 154.8125 110.25 C155.95138672 110.42789063 155.95138672 110.42789063 157.11328125 110.609375 C161.71331534 111.70113418 164.78420703 114.59578956 167.25 118.5625 C168.26190194 123.39714259 167.55759263 127.57354159 165.5625 132.0625 C163.8125 134.25 163.8125 134.25 161.30200195 135.49926758 C158.57705049 137.06101677 158.57705049 137.06101677 157.78588867 140.0690918 C157.51095581 141.74225464 157.51095581 141.74225464 157.23046875 143.44921875 C157.02099609 144.65771484 156.81152344 145.86621094 156.59570312 147.11132812 C156.39912109 148.37396484 156.20253906 149.63660156 156 150.9375 C155.67612305 152.84885742 155.67612305 152.84885742 155.34570312 154.79882812 C154.8151928 157.94652272 154.30503715 161.09617852 153.8125 164.25 C152.1625 163.92 150.5125 163.59 148.8125 163.25 C148.4825 165.56 148.1525 167.87 147.8125 170.25 C148.50287354 170.22905273 149.19324707 170.20810547 149.90454102 170.18652344 C153.06120993 170.10288905 156.21764502 170.05119047 159.375 170 C160.46103516 169.96648437 161.54707031 169.93296875 162.66601562 169.8984375 C169.32347562 169.81749574 173.42990278 170.22220616 178.8125 174.25 C183.98855505 179.97090295 184.32817452 184.05825376 184.296875 191.6796875 C183.66146168 196.36329858 182.03930474 198.54843978 178.734375 201.796875 C176.83234302 203.23499674 174.9527191 204.21491222 172.8125 205.25 C172.79848145 207.11132568 172.79848145 207.11132568 172.78417969 209.01025391 C172.74420717 213.62877866 172.67842793 218.24664238 172.60498047 222.86474609 C172.57681297 224.86075325 172.55557748 226.85687106 172.54150391 228.85302734 C172.52001597 231.72811364 172.47333574 234.60187529 172.421875 237.4765625 C172.42064636 238.36429352 172.41941772 239.25202454 172.41815186 240.16665649 C172.28914609 245.66495063 171.52454958 248.92583099 167.8125 253.25 C164.57543355 256.2290818 162.40875376 256.6285107 158.05018616 256.64440918 C156.87393173 256.65575897 155.69767731 256.66710876 154.48577881 256.67880249 C153.19891174 256.67587189 151.91204468 256.67294128 150.58618164 256.66992188 C149.21440438 256.67726294 147.84263331 256.68584928 146.47087097 256.69558716 C142.74769567 256.71780779 139.02474165 256.72073361 135.30150914 256.71883965 C132.19261409 256.71871997 129.08376597 256.7272827 125.97488397 256.73561716 C118.64020657 256.75485304 111.30564298 256.75773433 103.97094727 256.75097656 C96.40564801 256.74433458 88.84083617 256.7672056 81.27563578 256.80429029 C74.77868687 256.83498216 68.28189481 256.84634793 61.78487486 256.84245348 C57.90520672 256.84038549 54.0259179 256.84587229 50.14631844 256.87034607 C46.49763821 256.89260283 42.84975076 256.89074548 39.20106697 256.87041855 C37.22559986 256.86538072 35.25011805 256.88503459 33.27474976 256.90542603 C24.59468778 256.82290952 24.59468778 256.82290952 20.60276794 253.89904785 C16.56195594 247.91988458 16.56195594 247.91988458 16.6171875 243.36328125 C16.62363281 242.42548828 16.63007812 241.48769531 16.63671875 240.52148438 C16.66185547 239.05678711 16.66185547 239.05678711 16.6875 237.5625 C16.69652344 236.57443359 16.70554687 235.58636719 16.71484375 234.56835938 C16.7384157 232.12866235 16.77131978 229.68945303 16.8125 227.25 C14.5025 227.25 12.1925 227.25 9.8125 227.25 C9.8125 228.57 9.8125 229.89 9.8125 231.25 C4.72629356 231.3497145 -0.35932992 231.42186281 -5.44628906 231.46972656 C-7.17262702 231.48970285 -8.89889853 231.51689372 -10.625 231.55175781 C-32.83916739 231.98884212 -32.83916739 231.98884212 -41.5625 223.875 C-42.16835938 223.33101562 -42.77421875 222.78703125 -43.3984375 222.2265625 C-52.75529945 211.88906873 -53.52790551 196.70771075 -55.7734375 183.484375 C-55.94290264 182.49042473 -55.94290264 182.49042473 -56.11579132 181.47639465 C-57.17998982 175.23214526 -58.24302751 168.98783941 -59.25488281 162.73486328 C-59.8144151 159.28242845 -60.39890812 155.83502837 -60.99998856 152.38959503 C-61.32934366 150.46049644 -61.63155824 148.52682687 -61.93319702 146.59320068 C-62.75349324 140.67882748 -62.75349324 140.67882748 -65.63165283 135.65490723 C-67.40534892 134.4545255 -67.40534892 134.4545255 -70.1875 133.25 C-73.30492133 128.573868 -72.90299289 123.7209911 -72.1875 118.25 C-70.56648452 114.85942977 -68.21563909 112.91526647 -65.0625 110.875 C-63.1875 110.25 -63.1875 110.25 -60.1875 110.25 C-60.23390625 109.47140625 -60.2803125 108.6928125 -60.328125 107.890625 C-61.19523584 81.01018898 -50.97592631 55.17894234 -33.1875 35.25 C-32.5275 34.59 -31.8675 33.93 -31.1875 33.25 C-30.82514937 31.21968617 -30.54547103 29.17419416 -30.3125 27.125 C-29.50847753 21.43402848 -28.28340646 17.07868993 -25.1875 12.25 C-24.65125 11.38375 -24.115 10.5175 -23.5625 9.625 C-16.60949511 2.67199511 -9.49168141 0.05704993 0 0 Z" fill="#060402" transform="translate(72.1875,-0.25)"/></svg>`;

function mostrarTicketVenta({ idVenta, canal, total, carritoItems, esModoCompraCliente }) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');
  const fecha = new Date().toLocaleString('es-MX');
  const items = carritoItems.map((item) => `
    <tr>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${formatearMoneda(item.precio)}</td>
      <td>${formatearMoneda(item.cantidad * item.precio)}</td>
    </tr>
  `).join('');
  root.innerHTML = `
    <div class="app-modal-overlay">
      <div class="app-modal-card ticket-modal-card">
        <div class="ticket-receipt">
          <div class="ticket-header">
            <div class="ticket-logo">${APP_LOGO_SVG}</div>
            <h3>Panadería Dulce Horno</h3>
            <p>${esModoCompraCliente ? 'Ticket de compra' : 'Ticket de venta'}</p>
          </div>
          <div class="ticket-meta">
            <p><strong>Folio:</strong> ${idVenta}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Canal:</strong> ${canal}</p>
          </div>
          <table class="table ticket-table">
            <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Importe</th></tr></thead>
            <tbody>${items}</tbody>
          </table>
          <div class="ticket-total">TOTAL: ${formatearMoneda(total)}</div>
          <p class="ticket-footer">¡Gracias por tu compra! Vuelve pronto.</p>
        </div>
        <div class="app-modal-actions">
          <button id="ticket-close" class="btn btn-secondary">Cerrar</button>
          <button id="ticket-print" class="btn btn-primary">Imprimir</button>
        </div>
      </div>
    </div>`;
  document.getElementById('ticket-close').addEventListener('click', () => { root.innerHTML=''; });
  document.getElementById('ticket-print').addEventListener('click', () => window.print());
}

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

function construirOpcionesProducto(productos, selectedId = '') {
  return productos.map((producto) => `
    <option value="${producto.IdArticulo}" ${Number(selectedId) === Number(producto.IdArticulo) ? 'selected' : ''}>
      ${producto.Nombre}
    </option>
  `).join('');
}

async function solicitarRecepcionProveedor({ proveedores, productos, recepcion = null }) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');
  const detallesIniciales = recepcion?.detalles?.length
    ? recepcion.detalles.map((detalle) => ({
        idArticulo: detalle.IdArticulo,
        cantidad: detalle.Cantidad,
        costoUnitario: detalle.CostoUnitario
      }))
    : [{ idArticulo: productos[0]?.IdArticulo || '', cantidad: 1, costoUnitario: productos[0]?.PrecioCompra || 0 }];

  return new Promise((resolve) => {
    const render = () => {
      root.innerHTML = `
        <div class="app-modal-overlay">
          <div class="app-modal-card" style="width:min(96vw, 760px); max-height:90vh; overflow:auto;">
            <div class="app-modal-title">${iconHTML('warning', recepcion ? 'Modificar recepción de proveedor' : 'Registrar recepción de proveedor')}</div>
            <div class="app-modal-body">
              <div class="form-group">
                <label>Proveedor</label>
                <select id="recepcion-proveedor" class="form-control" ${recepcion ? 'disabled' : ''}>
                  ${proveedores.map((prov) => `<option value="${prov.IdProveedor}" ${Number(recepcion?.IdProveedor || '') === Number(prov.IdProveedor) ? 'selected' : ''}>${prov.Nombre}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Observaciones</label>
                <textarea id="recepcion-observaciones" class="form-control" rows="3">${recepcion?.Observaciones || ''}</textarea>
              </div>
              <div id="recepcion-lineas"></div>
              <button id="agregar-linea-recepcion" class="btn btn-secondary btn-sm" type="button">Agregar producto</button>
            </div>
            <div class="app-modal-actions">
              <button id="modal-cancel" class="btn btn-secondary">Cancelar</button>
              <button id="modal-confirm" class="btn btn-primary">Guardar recepción</button>
            </div>
          </div>
        </div>
      `;

      const lineasContainer = document.getElementById('recepcion-lineas');
      lineasContainer.innerHTML = detallesIniciales.map((detalle, index) => `
        <div class="recepcion-linea-grid" data-index="${index}" style="display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:8px; margin-bottom:10px; align-items:end;">
          <div>
            <label>Producto</label>
            <select class="form-control recepcion-producto">${construirOpcionesProducto(productos, detalle.idArticulo)}</select>
          </div>
          <div>
            <label>Cantidad</label>
            <input type="number" min="1" class="form-control recepcion-cantidad" value="${detalle.cantidad}">
          </div>
          <div>
            <label>Costo unitario</label>
            <input type="number" min="0" step="0.01" class="form-control recepcion-costo" value="${detalle.costoUnitario}">
          </div>
          <button type="button" class="btn btn-danger btn-sm eliminar-linea-recepcion">Quitar</button>
        </div>
      `).join('');

      document.querySelectorAll('.eliminar-linea-recepcion').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.closest('[data-index]').dataset.index);
          detallesIniciales.splice(idx, 1);
          if (!detallesIniciales.length) {
            detallesIniciales.push({ idArticulo: productos[0]?.IdArticulo || '', cantidad: 1, costoUnitario: productos[0]?.PrecioCompra || 0 });
          }
          render();
        });
      });

      document.getElementById('agregar-linea-recepcion').addEventListener('click', () => {
        detallesIniciales.push({ idArticulo: productos[0]?.IdArticulo || '', cantidad: 1, costoUnitario: productos[0]?.PrecioCompra || 0 });
        render();
      });

      document.getElementById('modal-cancel').addEventListener('click', () => {
        root.innerHTML = '';
        resolve(null);
      });

      document.getElementById('modal-confirm').addEventListener('click', () => {
        const proveedorId = recepcion?.IdProveedor || Number(document.getElementById('recepcion-proveedor').value);
        const observaciones = document.getElementById('recepcion-observaciones').value.trim();
        const items = Array.from(document.querySelectorAll('.recepcion-linea-grid')).map((linea) => ({
          idArticulo: Number(linea.querySelector('.recepcion-producto').value),
          cantidad: Number(linea.querySelector('.recepcion-cantidad').value),
          costoUnitario: Number(linea.querySelector('.recepcion-costo').value)
        })).filter((item) => item.idArticulo && item.cantidad > 0 && item.costoUnitario >= 0);

        root.innerHTML = '';
        resolve({ idProveedor: proveedorId, observaciones, items });
      });
    };

    render();
  });
}

async function solicitarDevolucionCliente({ productos = [] }) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');

  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="app-modal-overlay">
        <div class="app-modal-card" style="width:min(96vw, 700px); max-height:90vh; overflow:auto;">
          <div class="app-modal-title">${iconHTML('warning', 'Registrar devolución a cliente')}</div>
          <div class="app-modal-body">
            <p>Indica las cantidades a devolver. Solo se procesarán cantidades mayores a cero.</p>
            <div id="devolucion-lineas">
              ${productos.map((producto, index) => `
                <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:8px; margin-bottom:10px; align-items:end;">
                  <div>
                    <label>${producto.NombreProducto}</label>
                    <div class="helper-text">Vendidos: ${producto.Cantidad}</div>
                  </div>
                  <div>
                    <label>Cantidad a devolver</label>
                    <input type="number" min="0" max="${producto.Cantidad}" value="0" class="form-control devolucion-cantidad" data-index="${index}">
                  </div>
                  <div>
                    <label>Precio unitario</label>
                    <input type="text" class="form-control" value="${Number(producto.PrecioUnitario || 0).toFixed(2)}" disabled>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="form-group">
              <label>Motivo</label>
              <textarea id="devolucion-motivo" class="form-control" rows="3">Devolución de cliente</textarea>
            </div>
          </div>
          <div class="app-modal-actions">
            <button id="modal-cancel" class="btn btn-secondary">Cancelar</button>
            <button id="modal-confirm" class="btn btn-primary">Guardar devolución</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-cancel').addEventListener('click', () => {
      root.innerHTML = '';
      resolve(null);
    });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('.devolucion-cantidad')).map((input) => {
        const producto = productos[Number(input.dataset.index)];
        return {
          idArticulo: producto.IdArticulo,
          cantidad: Number(input.value)
        };
      }).filter((item) => item.cantidad > 0);
      const motivo = document.getElementById('devolucion-motivo').value.trim();
      root.innerHTML = '';
      resolve({ items, motivo });
    });
  });
}


function esVistaCliente() {
  return usuarioActual?.Rol === 'Cliente';
}

function guardarUltimaVista(page) {
  if (esVistaCliente()) return;
  localStorage.setItem(APP_STORAGE_KEYS.ultimaVista, page);
}

function obtenerUltimaVistaPorRol() {
  if (esVistaCliente()) return 'compras';

  const fallback = usuarioActual?.Rol === 'Empleado' ? 'ventas' : usuarioActual?.Rol === 'Programador' ? 'programador-password' : 'personal';
  const guardada = localStorage.getItem(APP_STORAGE_KEYS.ultimaVista);

  if (!guardada) return fallback;

  const paginasPermitidas = usuarioActual?.Rol === 'Empleado'
    ? ['ventas']
    : usuarioActual?.Rol === 'Programador'
      ? ['programador-password', 'programador-gerentes', 'programador-usuarios']
      : ['personal', 'clientes', 'proveedores', 'inventario', 'registroVenta', 'reportes'];

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
    temaBtn.innerHTML = esOscuro
      ? `${iconHTML('sun')}<span class="theme-toggle-label">Cambiar tema</span>`
      : `${iconHTML('moon')}<span class="theme-toggle-label">Cambiar tema</span>`;
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
Ventas acumuladas hasta este momento: ${resumen.totalVentas}
Importe total acumulado: ${formatearMoneda(resumen.totalImporte)}
Desde el último corte: ${formatearFechaHora(resumen.fechaInicio)}
Hasta este momento: ${formatearFechaHora(resumen.fechaFin)}
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

function formatearTamanoBytes(bytes = 0) {
  const valor = Number(bytes || 0);
  if (!valor) return '0 MB';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  let tamaño = valor;
  let indice = 0;
  while (tamaño >= 1024 && indice < unidades.length - 1) {
    tamaño /= 1024;
    indice += 1;
  }
  return `${tamaño.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

function aplicacionBloqueadaPorActualizacion(status = estadoActualizacionGlobal) {
  if (!status) return true;
  return ['checking', 'available', 'downloading', 'pending_install', 'error'].includes(status.status);
}

function renderUpdateStatusBanner(status) {
  if (!status || ['idle', 'checking', 'available', 'downloading', 'pending_install', 'development', 'up_to_date'].includes(status.status)) {
    return '';
  }

  const version = status.downloadedVersion || status.availableVersion;
  const action = status.status === 'pending'
    ? `<button id="install-update-btn" class="btn btn-warning btn-sm">Instalar actualización</button>`
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

function renderPantallaActualizacionObligatoria(status = estadoActualizacionGlobal) {
  const progreso = Math.max(0, Math.min(100, Number(status?.progressPercent || 0)));
  const versionObjetivo = status?.availableVersion || status?.downloadedVersion || 'última versión';
  const detalleDescarga = status?.progressTotal
    ? `${formatearTamanoBytes(status.progressTransferred)} / ${formatearTamanoBytes(status.progressTotal)}`
    : 'Esperando respuesta del servidor de releases...';
  const puedeReintentar = status?.status === 'error';

  appContainer.innerHTML = `
    <div class="update-required-screen">
      <div class="update-required-card card">
        <div class="update-required-icon">${iconHTML('warning')}</div>
        <h2>Validando actualización obligatoria</h2>
        <p class="update-required-message">${status?.message || 'Comprobando la última versión del sistema en GitHub Releases...'}</p>
        <div class="update-meta-grid">
          <div><strong>Versión actual</strong><span>${status?.version || 'N/D'}</span></div>
          <div><strong>Versión objetivo</strong><span>${versionObjetivo}</span></div>
          <div><strong>Estado</strong><span>${status?.status || 'checking'}</span></div>
          <div><strong>Descarga</strong><span>${detalleDescarga}</span></div>
        </div>
        <div class="update-progress-wrapper">
          <div class="update-progress-bar">
            <div class="update-progress-bar-fill" style="width:${progreso}%;"></div>
          </div>
          <div class="update-progress-text">${progreso.toFixed(1)}%</div>
        </div>
        <p class="helper-text update-required-helper">El sistema permanecerá bloqueado hasta comprobar que está actualizado. Si existe una nueva release, se descargará y al finalizar se abrirá el instalador.</p>
        ${puedeReintentar ? '<button id="retry-update-btn" class="btn btn-primary">Reintentar comprobación</button>' : ''}
      </div>
    </div>
  `;

  const retryBtn = document.getElementById('retry-update-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      retryBtn.disabled = true;
      retryBtn.textContent = 'Reintentando...';
      try {
        await window.api.retryUpdateCheck();
      } catch (error) {
        retryBtn.disabled = false;
        retryBtn.textContent = 'Reintentar comprobación';
        await showAlert(error.message || 'No fue posible reintentar la comprobación.', 'error', 'Actualización');
      }
    });
  }
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
    await showAlert('La aplicación cerrará la sesión actual y abrirá el instalador de la nueva versión.', 'success', 'Instalando actualización');
  } catch (error) {
    await showAlert(error.message || 'No fue posible iniciar la instalación de la actualización.', 'error', 'Actualización');
  }
}

async function notificarActualizacionPendienteUnaVez() {
  const estado = await obtenerEstadoActualizacion();
  if (!estado || !['available', 'pending', 'pending_install', 'downloading'].includes(estado.status)) return;

  const ultimaVersionMostrada = localStorage.getItem(APP_STORAGE_KEYS.actualizacionVista);
  const versionActual = estado.downloadedVersion || estado.availableVersion || estado.version;
  if (ultimaVersionMostrada === versionActual) return;

  localStorage.setItem(APP_STORAGE_KEYS.actualizacionVista, versionActual);
  await showAlert(estado.message || 'Hay una actualización pendiente para esta estación.', 'warning', 'Actualización pendiente');
}

function manejarCambioEstadoActualizacion(estado) {
  estadoActualizacionGlobal = estado;

  if (aplicacionBloqueadaPorActualizacion(estado)) {
    aplicacionListaParaUso = false;
    renderPantallaActualizacionObligatoria(estado);
    return;
  }

  if (!aplicacionListaParaUso) {
    aplicacionListaParaUso = true;
    if (usuarioActual) {
      renderDashboard(estado);
    } else {
      renderLogin();
    }
    return;
  }

  const updateBtn = document.getElementById('install-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', instalarActualizacionPendiente);
  }
}

async function inicializarComprobacionActualizacion() {
  if (!actualizacionListenerInicializado) {
    window.api.onUpdateStatus((estado) => {
      manejarCambioEstadoActualizacion(estado);
    });
    actualizacionListenerInicializado = true;
  }

  const estadoInicial = await obtenerEstadoActualizacion();
  manejarCambioEstadoActualizacion(estadoInicial);
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

    renderPage('compras');
    return;
  }

  let navbar = '';

  if (usuarioActual.Rol === 'Gerente') {
    navbar = `
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="personal"><i class="fas fa-users" aria-hidden="true"></i><span>Personal</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="clientes"><i class="fas fa-address-book" aria-hidden="true"></i><span>Clientes</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="proveedores"><i class="fas fa-truck" aria-hidden="true"></i><span>Proveedores</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="inventario"><i class="fas fa-boxes-stacked" aria-hidden="true"></i><span>Inventario</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="registroVenta"><i class="fas fa-cash-register" aria-hidden="true"></i><span>Registro ventas</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="reportes"><i class="fas fa-chart-line" aria-hidden="true"></i><span>Reportes</span></a>
      <a href="#" class="nav-link nav-link-logout" id="logout-btn"><i class="fas fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></a>`;
  } else if (usuarioActual.Rol === 'Empleado') {
    navbar = `
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="ventas"><i class="fas fa-store" aria-hidden="true"></i><span>Punto de venta</span></a>
      <a href="#" class="nav-link nav-link-logout" id="logout-btn"><i class="fas fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></a>`;
  } else if (usuarioActual.Rol === 'Programador') {
    navbar = `
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="programador-password"><i class="fas fa-key" aria-hidden="true"></i><span>Cambiar contraseñas</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="programador-gerentes"><i class="fas fa-user-tie" aria-hidden="true"></i><span>Agregar gerentes</span></a>
      <a href="#" class="nav-link" role="tab" aria-selected="false" data-page="programador-usuarios"><i class="fas fa-users-gear" aria-hidden="true"></i><span>Modificar usuarios</span></a>
      <a href="#" class="nav-link nav-link-logout" id="logout-btn"><i class="fas fa-right-from-bracket" aria-hidden="true"></i><span>Cerrar sesión</span></a>`;
  } else {
    navbar = `<a href="#" class="nav-link" role="tab" aria-selected="false" data-page="compras"><i class="fas fa-basket-shopping" aria-hidden="true"></i><span>Comprar</span></a>`;
  }

  appContainer.innerHTML = `
    <div class="dashboard-container">
      <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" aria-label="Mostrar u ocultar menú" aria-expanded="true" aria-controls="app-sidebar">
        <i class="fas fa-bars" aria-hidden="true"></i><span>Menú</span>
      </button>
      <aside id="app-sidebar" class="sidebar" aria-label="Navegación principal">
        <div class="sidebar-header">
          <h3>Categorías</h3>
          <button id="sidebar-hide-btn" class="sidebar-mini-btn" aria-label="Ocultar menú">
            <i class="fas fa-angle-left" aria-hidden="true"></i>
          </button>
        </div>
        <button id="theme-toggle-btn" class="btn btn-secondary theme-toggle-btn">${iconHTML('moon')}<span class="theme-toggle-label">Cambiar tema</span></button>
        <nav class="sidebar-nav" role="tablist">${navbar}</nav>
      </aside>
      <div id="sidebar-overlay" class="sidebar-overlay" hidden></div>
      <main class="main-content">
        ${renderUpdateStatusBanner(updateStatus)}
        <div class="main-panel card">
          <div class="dashboard-header-row">
            <div>
              <h2>Bienvenido, ${usuarioActual.NombreUsuario} (${usuarioActual.Rol})</h2>
              <p class="dashboard-subtitle">Administra ventas, inventario, reportes y cortes desde un solo lugar.</p>
            </div>
            ${usuarioActual.Rol === 'Empleado' ? `<button id="shift-cut-btn" class="btn btn-warning">${iconHTML('warning')} Corte de turno</button>` : ''}
          </div>
          <section id="content-area" class="content-panel" tabindex="-1"></section>
        </div>
      </main>
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

  const dashboard = document.querySelector('.dashboard-container');
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleSidebar = () => {
    dashboard.classList.toggle('sidebar-collapsed');
    const isExpanded = !dashboard.classList.contains('sidebar-collapsed');
    document.getElementById('sidebar-toggle-btn').setAttribute('aria-expanded', String(isExpanded));
  };
  const openSidebarMobile = () => {
    dashboard.classList.add('sidebar-open');
    overlay.hidden = false;
  };
  const closeSidebarMobile = () => {
    dashboard.classList.remove('sidebar-open');
    overlay.hidden = true;
  };

  document.getElementById('sidebar-toggle-btn').addEventListener('click', () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      openSidebarMobile();
    } else {
      toggleSidebar();
    }
  });
  document.getElementById('sidebar-hide-btn').addEventListener('click', () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      closeSidebarMobile();
    } else {
      toggleSidebar();
    }
  });
  overlay.addEventListener('click', closeSidebarMobile);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebarMobile();
  });

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.innerHTML = document.body.classList.contains('dark-theme')
      ? `${iconHTML('sun')}<span class="theme-toggle-label">Cambiar tema</span>`
      : `${iconHTML('moon')}<span class="theme-toggle-label">Cambiar tema</span>`;
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

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      cerrarSesionActual();
    });
  }

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


function opcionesGenero(valor = '') {
  const opciones = ['', 'Femenino', 'Masculino', 'No binario', 'Prefiero no decir', 'Otro'];
  return opciones.map((opcion) => `<option value="${opcion}" ${valor === opcion ? 'selected' : ''}>${opcion || 'Seleccionar género'}</option>`).join('');
}

function crearCamposNombre(prefix, valores = {}, requerido = true) {
  const req = requerido ? 'required' : '';
  return `
    <div class="form-grid-3">
      <div class="form-group">
        <label for="${prefix}-nombre">Nombre(s):</label>
        <input type="text" id="${prefix}-nombre" class="form-control" value="${valores.Nombre || valores.nombre || ''}" ${req}>
      </div>
      <div class="form-group">
        <label for="${prefix}-apellido-paterno">Apellido paterno:</label>
        <input type="text" id="${prefix}-apellido-paterno" class="form-control" value="${valores.ApellidoPaterno || valores.apellidoPaterno || ''}">
      </div>
      <div class="form-group">
        <label for="${prefix}-apellido-materno">Apellido materno:</label>
        <input type="text" id="${prefix}-apellido-materno" class="form-control" value="${valores.ApellidoMaterno || valores.apellidoMaterno || ''}">
      </div>
    </div>`;
}

function crearCamposDireccion(prefix, valores = {}) {
  return `
    <div class="form-grid-3">
      <div class="form-group"><label for="${prefix}-calle">Calle:</label><input type="text" id="${prefix}-calle" class="form-control" value="${valores.Calle || valores.calle || ''}"></div>
      <div class="form-group"><label for="${prefix}-numero-ext">Número exterior:</label><input type="text" id="${prefix}-numero-ext" class="form-control" value="${valores.NumeroExterior || valores.numeroExterior || ''}"></div>
      <div class="form-group"><label for="${prefix}-numero-int">Número interior:</label><input type="text" id="${prefix}-numero-int" class="form-control" value="${valores.NumeroInterior || valores.numeroInterior || ''}"></div>
      <div class="form-group"><label for="${prefix}-colonia">Colonia:</label><input type="text" id="${prefix}-colonia" class="form-control" value="${valores.Colonia || valores.colonia || ''}"></div>
      <div class="form-group"><label for="${prefix}-ciudad">Ciudad:</label><input type="text" id="${prefix}-ciudad" class="form-control" value="${valores.Ciudad || valores.ciudad || ''}"></div>
      <div class="form-group"><label for="${prefix}-estado">Estado:</label><input type="text" id="${prefix}-estado" class="form-control" value="${valores.Estado || valores.estado || ''}"></div>
      <div class="form-group"><label for="${prefix}-cp">Código postal:</label><input type="text" id="${prefix}-cp" class="form-control" value="${valores.CodigoPostal || valores.codigoPostal || ''}"></div>
      <div class="form-group"><label for="${prefix}-pais">País:</label><input type="text" id="${prefix}-pais" class="form-control" value="${valores.Pais || valores.pais || 'México'}"></div>
    </div>`;
}

function leerDatosNombre(prefix) {
  return {
    nombre: document.getElementById(`${prefix}-nombre`)?.value.trim() || '',
    apellidoPaterno: document.getElementById(`${prefix}-apellido-paterno`)?.value.trim() || '',
    apellidoMaterno: document.getElementById(`${prefix}-apellido-materno`)?.value.trim() || ''
  };
}

function leerDatosDireccion(prefix) {
  return {
    calle: document.getElementById(`${prefix}-calle`)?.value.trim() || '',
    numeroExterior: document.getElementById(`${prefix}-numero-ext`)?.value.trim() || '',
    numeroInterior: document.getElementById(`${prefix}-numero-int`)?.value.trim() || '',
    colonia: document.getElementById(`${prefix}-colonia`)?.value.trim() || '',
    ciudad: document.getElementById(`${prefix}-ciudad`)?.value.trim() || '',
    estado: document.getElementById(`${prefix}-estado`)?.value.trim() || '',
    codigoPostal: document.getElementById(`${prefix}-cp`)?.value.trim() || '',
    pais: document.getElementById(`${prefix}-pais`)?.value.trim() || 'México'
  };
}

function nombreCompletoDesdeDatos(datos) {
  return [datos.nombre, datos.apellidoPaterno, datos.apellidoMaterno].filter(Boolean).join(' ');
}

async function solicitarDatosClienteVenta({ requerido }) {
  ensureModalRoot();
  const root = document.getElementById('global-modal-root');
  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="app-modal-overlay">
        <div class="app-modal-card" style="width:min(96vw, 720px); max-height:90vh; overflow:auto;">
          <div class="app-modal-title">${iconHTML('success', requerido ? 'Datos del cliente para autocobro' : 'Datos opcionales del cliente')}</div>
          <div class="app-modal-body">
            <p>${requerido ? 'Para pagar en autocobro se debe registrar nombre completo y género.' : 'Puedes registrar al cliente en caja de empleado, pero no es obligatorio.'}</p>
            ${crearCamposNombre('venta-cliente', {}, requerido)}
            <div class="form-grid-2">
              <div class="form-group">
                <label for="venta-cliente-genero">Género:</label>
                <select id="venta-cliente-genero" class="form-control" ${requerido ? 'required' : ''}>${opcionesGenero('')}</select>
              </div>
              <div class="form-group">
                <label for="venta-cliente-fecha">Fecha de nacimiento:</label>
                <input type="date" id="venta-cliente-fecha" class="form-control">
              </div>
            </div>
          </div>
          <div class="app-modal-actions">
            <button id="modal-skip" class="btn btn-secondary" ${requerido ? 'style="display:none;"' : ''}>Continuar sin cliente</button>
            <button id="modal-cancel" class="btn btn-danger">Cancelar pago</button>
            <button id="modal-confirm" class="btn btn-primary">Continuar</button>
          </div>
        </div>
      </div>`;

    document.getElementById('modal-skip')?.addEventListener('click', () => { root.innerHTML = ''; resolve(null); });
    document.getElementById('modal-cancel').addEventListener('click', () => { root.innerHTML = ''; resolve(false); });
    document.getElementById('modal-confirm').addEventListener('click', async () => {
      const datos = leerDatosNombre('venta-cliente');
      datos.genero = document.getElementById('venta-cliente-genero').value;
      datos.fechaNacimiento = document.getElementById('venta-cliente-fecha').value || null;
      const tieneNombre = Boolean(nombreCompletoDesdeDatos(datos));
      if (requerido && (!datos.nombre || !datos.apellidoPaterno || !datos.apellidoMaterno || !datos.genero)) {
        await showAlert('Nombre(s), apellido paterno, apellido materno y género son obligatorios para autocobro.', 'warning', 'Datos del cliente');
        return;
      }
      if (!requerido && !tieneNombre && !datos.genero) {
        root.innerHTML = '';
        resolve(null);
        return;
      }
      if (!datos.nombre || !datos.genero) {
        await showAlert('Si capturas cliente, escribe al menos nombre(s) y género.', 'warning', 'Datos del cliente');
        return;
      }
      root.innerHTML = '';
      resolve(datos);
    });
  });
}

// =============== REGISTRO USUARIO ==================
function showRegistrationForm() {
  usuarioActual.rol = 'Gerente'
  const opcionesRolRegistro = usuarioActual.Rol === 'Gerente'
    ? '<option value="Empleado">Empleado</option>'
    : '<option value="Cliente">Cliente</option><option value="Empleado">Empleado</option><option value="Gerente">Gerente</option><option value="Programador">Programador</option>';
  appContainer.innerHTML = `
    <div class="register-container card">
        <h2><i class="fas fa-user-plus icon"></i> Registrar Nuevo Usuario</h2>
        <form id="register-form">
            ${crearCamposNombre('reg')}
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="reg-genero">Género:</label>
                    <select id="reg-genero" class="form-control" required>${opcionesGenero('')}</select>
                </div>
                <div class="form-group">
                    <label for="reg-fecha-nacimiento">Fecha de nacimiento:</label>
                    <input type="date" id="reg-fecha-nacimiento" class="form-control">
                </div>
            </div>
            <h3>Dirección separada</h3>
            ${crearCamposDireccion('reg')}
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
                    ${opcionesRolRegistro}
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
    const nombres = leerDatosNombre('reg');
    const name = nombreCompletoDesdeDatos(nombres);
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
      ...nombres,
      ...leerDatosDireccion('reg'),
      name,
      username,
      password,
      genero: document.getElementById('reg-genero').value,
      fechaNacimiento: document.getElementById('reg-fecha-nacimiento').value || null,
      rol,
      puesto: rol === 'Cliente' ? 'Usuario' : puesto,
      turno: rol === 'Cliente' ? 'Any' : turno,
      salario: rol === 'Cliente' ? null : parseFloat(salario) || 0,
      usuarioEjecutaRol: usuarioActual.Rol
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
            <h3>Dirección separada</h3>
            ${crearCamposDireccion('prov')}
            <div class="form-group" id="puesto-group">
                <label for="reg-telefono">Telefono:</label>
                <input type="number" id="reg-telefono" class="form-control" required>
            </div>
            <div class="form-group" id="puesto-group">
                <label for="reg-mail">Correo:</label>
                <input type="enail" id="reg-mail" class="form-control" required>
            </div>
            <h3>Contacto separado</h3>
            ${crearCamposNombre('prov-contacto', {}, false)}
            <button type="submit" class="btn btn-primary">Registrar</button>
            <button type="button" id="cancel-btn" class="btn btn-secondary">Cancelar</button>
        </form>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const telefono = document.getElementById('reg-telefono').value;
    const mail = document.getElementById('reg-mail').value;
    const contactoDatos = leerDatosNombre('prov-contacto');
    const contacto = nombreCompletoDesdeDatos(contactoDatos);


    const userData = {
      name,
      ...leerDatosDireccion('prov'),
      telefono,
      mail,
      contacto,
      contactoNombre: contactoDatos.nombre,
      contactoApellidoPaterno: contactoDatos.apellidoPaterno,
      contactoApellidoMaterno: contactoDatos.apellidoMaterno
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
  const opcionesRolEdicion = usuarioActual.Rol === 'Gerente'
    ? '<option value="Empleado">Empleado</option>'
    : usuarioActual.Rol === 'Programador'
      ? '<option value="Empleado">Empleado</option><option value="Gerente">Gerente</option>'
      : '<option value="Cliente">Cliente</option><option value="Empleado">Empleado</option><option value="Gerente">Gerente</option><option value="Programador">Programador</option>';
  appContainer.innerHTML = `
    <div class="register-container card">
        <h2><i class="fas fa-user-plus icon"></i> Modificar Usuario</h2>
        <form id="register-form">
            ${crearCamposNombre('reg', usuarioAModificar.__raw || {})}
            <div class="form-grid-2">
                <div class="form-group">
                    <label for="reg-genero">Género:</label>
                    <select id="reg-genero" class="form-control" required>${opcionesGenero(usuarioAModificar.__raw?.Genero || '')}</select>
                </div>
                <div class="form-group">
                    <label for="reg-fecha-nacimiento">Fecha de nacimiento:</label>
                    <input type="date" id="reg-fecha-nacimiento" class="form-control" value="${usuarioAModificar.__raw?.FechaNacimiento ? String(usuarioAModificar.__raw.FechaNacimiento).slice(0,10) : ''}">
                </div>
            </div>
            <h3>Dirección separada</h3>
            ${crearCamposDireccion('reg', usuarioAModificar.__raw || {})}
            <div class="form-group">
                <label for="reg-username">Nombre de Usuario:</label>
                <input type="text" id="reg-username" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reg-role">Rol:</label>
                <select id="reg-role" class="form-control">
                    ${opcionesRolEdicion}
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
    const nombres = leerDatosNombre('reg');
    const name = nombreCompletoDesdeDatos(nombres);
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
      ...nombres,
      ...leerDatosDireccion('reg'),
      name,
      username,
      genero: document.getElementById('reg-genero').value,
      fechaNacimiento: document.getElementById('reg-fecha-nacimiento').value || null,
      rol,
      puesto: rol === 'Cliente' ? 'Usuario' : puesto,
      turno: rol === 'Cliente' ? 'Any' : turno,
      salario: rol === 'Cliente' ? null : parseFloat(salario) || 0,
      usuarioEjecutaRol: usuarioActual.Rol
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
  if (page === 'programador' && usuarioActual?.Rol === 'Programador') {
    page = 'programador-password';
  }
  guardarUltimaVista(page);
  const content = document.getElementById('content-area');
  document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
    const active = link.dataset.page === page;
    link.classList.toggle('active', active);
    link.setAttribute('aria-selected', String(active));
  });
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
          <td>${e.Nombre || 'No especificado'}</td>
          <td>${e.ApellidoPaterno || 'No especificado'}</td>
          <td>${e.ApellidoMaterno || 'No especificado'}</td>
          <td>${e.Genero || 'No especificado'}</td>
          <td>${e.FechaNacimiento ? String(e.FechaNacimiento).slice(0, 10) : 'No especificada'}</td>
          <td>${[e.Calle, e.NumeroExterior, e.Colonia, e.Ciudad].filter(Boolean).join(', ') || e.Direccion || 'No especificada'}</td>
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
                <th>Nombre(s)</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Género</th>
                <th>Fecha nacimiento</th>
                <th>Dirección</th>
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

      if (usuarioActual.Rol === 'Gerente' && modoActual === 'modificar' && empleado.Rol !== 'Empleado') {
        showAlert('El Gerente solo puede modificar empleados. Los gerentes se agregan desde Programador.', 'warning', 'Selección no válida');
        return;
      }

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
              usuarioAModificar = [
                empleado.IdEmpleado,
                empleado.NombreUsuario,
                empleado.NombreCompleto,
                empleado.Rol,
                empleado.Puesto,
                empleado.Turno,
                empleado.Salario
              ];
              usuarioAModificar.__raw = empleado;
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


  // =============== CLIENTES ==================
  if (page === 'clientes') {
    const clientes = await window.api.getClientes();
    const rows = clientes.map((c) => `
      <tr>
        <td>${c.IdCliente}</td>
        <td>${c.Nombre || 'No especificado'}</td>
        <td>${c.ApellidoPaterno || 'No especificado'}</td>
        <td>${c.ApellidoMaterno || 'No especificado'}</td>
        <td>${c.Genero || 'No especificado'}</td>
        <td>${c.FechaNacimiento ? String(c.FechaNacimiento).slice(0, 10) : 'No especificada'}</td>
        <td>${c.Ventas || 'Sin ventas'}</td>
        <td>${c.ProductosComprados || 'Sin productos comprados'}</td>
      </tr>
    `).join('') || '<tr><td colspan="8">No hay clientes registrados.</td></tr>';

    content.innerHTML = `
      <div class="card">
        <h2>Tabla de Clientes</h2>
        <p>Los clientes guardan nombre(s), apellido paterno, apellido materno, género, fecha de nacimiento y las ventas con sus productos comprados.</p>
        <table class="table" id="tablaClientes">
          <thead>
            <tr>
              <th>ID cliente</th>
              <th>Nombre(s)</th>
              <th>Apellido paterno</th>
              <th>Apellido materno</th>
              <th>Género</th>
              <th>Fecha nacimiento</th>
              <th>ID venta(s)</th>
              <th>Productos comprados</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // =============== PROGRAMADOR ==================
  if (['programador-password', 'programador-gerentes', 'programador-usuarios'].includes(page)) {
    const empleados = page === 'programador-usuarios' ? await window.api.getEmpleados() : [];
    const usuariosEditables = empleados.filter((empleado) => ['Empleado', 'Gerente'].includes(empleado.Rol));
    const totalGerentes = usuariosEditables.filter((empleado) => empleado.Rol === 'Gerente').length;
    const totalEmpleados = usuariosEditables.filter((empleado) => empleado.Rol === 'Empleado').length;

    const renderProgramadorHero = (titulo, descripcion, icono) => `
      <div class="programador-hero">
        <div class="programador-hero-icon"><i class="fas ${icono}"></i></div>
        <div>
          <p class="programador-eyebrow">Panel exclusivo</p>
          <h2>${titulo}</h2>
          <p>${descripcion}</p>
        </div>
      </div>`;

    if (page === 'programador-password') {
      content.innerHTML = `
        ${renderProgramadorHero('Cambiar contraseñas', 'Revalida las credenciales del programador y ejecuta el stored procedure para actualizar contraseñas de usuarios registrados.', 'fa-key')}
        <div class="programador-tool-card">
          <div class="programador-card-header">
            <div>
              <h3><i class="fas fa-database"></i> Stored procedure de seguridad</h3>
              <p>Ejecuta <code>sp_programador_cambiar_password</code> sin exponer esta acción a otros roles.</p>
            </div>
            <span class="programador-badge">Programador</span>
          </div>
          <form id="programador-password-form" class="programador-form">
            <div class="form-grid-2">
              <div class="form-group">
                <label for="prog-usuario">Usuario programador:</label>
                <input type="text" id="prog-usuario" class="form-control" value="${usuarioActual.NombreUsuario || ''}" required>
              </div>
              <div class="form-group">
                <label for="prog-password">Contraseña programador:</label>
                <input type="password" id="prog-password" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="target-usuario">Usuario registrado a modificar:</label>
                <input type="text" id="target-usuario" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="target-password">Nueva contraseña:</label>
                <input type="password" id="target-password" class="form-control" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary programador-submit"><i class="fas fa-key"></i> Cambiar contraseña con stored procedure</button>
          </form>
        </div>`;

      document.getElementById('programador-password-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const result = await window.api.programadorCambiarPassword({
            usernameProgramador: document.getElementById('prog-usuario').value.trim(),
            passwordProgramador: document.getElementById('prog-password').value,
            usuarioObjetivo: document.getElementById('target-usuario').value.trim(),
            passwordNuevo: document.getElementById('target-password').value
          });
          await showAlert(result.message, 'success', 'Stored procedure ejecutado');
          document.getElementById('prog-password').value = '';
          document.getElementById('target-password').value = '';
        } catch (error) {
          await showAlert(error.message, 'error', 'Error del stored procedure');
        }
      });
    }

    if (page === 'programador-gerentes') {
      content.innerHTML = `
        ${renderProgramadorHero('Agregar Gerentes', 'Crea gerentes desde una categoría separada, confirmando usuario y contraseña del programador antes del alta.', 'fa-user-tie')}
        <div class="programador-tool-card">
          <div class="programador-card-header">
            <div>
              <h3><i class="fas fa-user-plus"></i> Alta de gerente</h3>
              <p>No se captura nombre completo: se guardan nombre(s), apellido paterno y apellido materno por separado.</p>
            </div>
            <span class="programador-badge">Solo gerentes</span>
          </div>
          <form id="programador-gerente-form" class="programador-form">
            <div class="programador-section-title"><i class="fas fa-shield-halved"></i> Confirmación del programador</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="mgr-prog-usuario">Usuario programador:</label>
                <input type="text" id="mgr-prog-usuario" class="form-control" value="${usuarioActual.NombreUsuario || ''}" required>
              </div>
              <div class="form-group">
                <label for="mgr-prog-password">Contraseña programador:</label>
                <input type="password" id="mgr-prog-password" class="form-control" required>
              </div>
            </div>

            <div class="programador-section-title"><i class="fas fa-id-card"></i> Datos separados del gerente</div>
            ${crearCamposNombre('mgr', {}, true)}
            <div class="form-grid-2">
              <div class="form-group">
                <label for="mgr-genero">Género:</label>
                <select id="mgr-genero" class="form-control" required>${opcionesGenero('')}</select>
              </div>
              <div class="form-group">
                <label for="mgr-fecha-nacimiento">Fecha de nacimiento:</label>
                <input type="date" id="mgr-fecha-nacimiento" class="form-control">
              </div>
            </div>

            <div class="programador-section-title"><i class="fas fa-user-lock"></i> Cuenta y puesto</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="mgr-username">Usuario del gerente:</label>
                <input type="text" id="mgr-username" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="mgr-password">Contraseña del gerente:</label>
                <input type="password" id="mgr-password" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="mgr-confirm-password">Confirmar contraseña:</label>
                <input type="password" id="mgr-confirm-password" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="mgr-puesto">Puesto:</label>
                <input type="text" id="mgr-puesto" class="form-control" value="Gerente" required>
              </div>
              <div class="form-group">
                <label for="mgr-turno">Turno:</label>
                <select id="mgr-turno" class="form-control">
                  <option value="Any">Any</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Nocturno">Nocturno</option>
                </select>
              </div>
              <div class="form-group">
                <label for="mgr-salario">Salario:</label>
                <input type="number" id="mgr-salario" class="form-control" step="0.01" min="0" value="0">
              </div>
            </div>

            <div class="programador-section-title"><i class="fas fa-location-dot"></i> Dirección separada</div>
            ${crearCamposDireccion('mgr')}
            <button type="submit" class="btn btn-success programador-submit"><i class="fas fa-user-plus"></i> Agregar gerente con stored procedure</button>
          </form>
        </div>`;

      document.getElementById('programador-gerente-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const nombres = leerDatosNombre('mgr');
        const password = document.getElementById('mgr-password').value;
        const confirm = document.getElementById('mgr-confirm-password').value;

        if (password !== confirm) {
          await showAlert('Las contraseñas del gerente no coinciden.', 'warning', 'Validación');
          return;
        }

        if (!nombres.nombre || !nombres.apellidoPaterno) {
          await showAlert('Captura al menos nombre(s) y apellido paterno del gerente.', 'warning', 'Validación');
          return;
        }

        try {
          const result = await window.api.programadorAgregarGerente({
            usernameProgramador: document.getElementById('mgr-prog-usuario').value.trim(),
            passwordProgramador: document.getElementById('mgr-prog-password').value,
            username: document.getElementById('mgr-username').value.trim(),
            password,
            ...nombres,
            genero: document.getElementById('mgr-genero').value,
            fechaNacimiento: document.getElementById('mgr-fecha-nacimiento').value || null,
            puesto: document.getElementById('mgr-puesto').value.trim(),
            turno: document.getElementById('mgr-turno').value,
            salario: parseFloat(document.getElementById('mgr-salario').value) || 0,
            ...leerDatosDireccion('mgr')
          });
          await showAlert(result.message, 'success', 'Gerente agregado');
          renderPage('programador-gerentes');
        } catch (error) {
          await showAlert(error.message, 'error', 'Error al agregar gerente');
        }
      });
    }

    if (page === 'programador-usuarios') {
      const rows = usuariosEditables.map((empleado, index) => {
        const estaActivo = empleado.Activo !== undefined ? empleado.Activo : true;
        const claseFila = estaActivo ? '' : 'empleado-desactivado';
        const indicadorEstado = estaActivo ? iconHTML('success') : iconHTML('error');
        const direccion = [empleado.Calle, empleado.NumeroExterior, empleado.Colonia, empleado.Ciudad].filter(Boolean).join(', ') || empleado.Direccion || 'No especificada';
        return `
          <tr data-index="${index}" class="${claseFila}">
            <td>${empleado.IdEmpleado || 'N/A'}</td>
            <td>${indicadorEstado} ${empleado.NombreUsuario || 'No especificado'}</td>
            <td><span class="programador-role-pill ${empleado.Rol === 'Gerente' ? 'is-manager' : ''}">${empleado.Rol}</span></td>
            <td>${empleado.Nombre || 'No especificado'}</td>
            <td>${empleado.ApellidoPaterno || 'No especificado'}</td>
            <td>${empleado.ApellidoMaterno || 'No especificado'}</td>
            <td>${empleado.Genero || 'No especificado'}</td>
            <td>${direccion}</td>
            <td>${empleado.Puesto || 'No especificado'}</td>
            <td>${empleado.Turno || 'No especificado'}</td>
            <td>$${empleado.Salario ? parseFloat(empleado.Salario).toFixed(2) : '0.00'}</td>
          </tr>`;
      }).join('') || '<tr><td colspan="11">No hay empleados o gerentes registrados.</td></tr>';

      content.innerHTML = `
        ${renderProgramadorHero('Modificar usuarios', 'El programador puede modificar usuarios con rol Gerente o Empleado desde una categoría propia del sidebar.', 'fa-users-gear')}
        <div class="programador-stats-grid">
          <div class="programador-stat-card"><span>${usuariosEditables.length}</span><small>Usuarios editables</small></div>
          <div class="programador-stat-card"><span>${totalGerentes}</span><small>Gerentes</small></div>
          <div class="programador-stat-card"><span>${totalEmpleados}</span><small>Empleados</small></div>
        </div>
        <div class="programador-tool-card">
          <div class="programador-card-header">
            <div>
              <h3><i class="fas fa-pen-to-square"></i> Selecciona un usuario</h3>
              <p>Filtra la lista, selecciona un gerente o empleado y usa el botón para modificar sus datos separados.</p>
            </div>
            <button id="programador-modificar-usuario" class="btn btn-primary" disabled><i class="fas fa-pen"></i> Modificar seleccionado</button>
          </div>
          <div class="filter-toolbar">
            <input type="text" id="filtroProgramadorUsuarios" class="form-control" placeholder="Buscar por usuario, nombre, rol, puesto o turno...">
            <span id="resumenProgramadorUsuarios" class="filter-summary"></span>
          </div>
          <table class="table programador-users-table" id="tablaProgramadorUsuarios">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Nombre(s)</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Género</th>
                <th>Dirección</th>
                <th>Puesto</th>
                <th>Turno</th>
                <th>Salario</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

      const tabla = document.getElementById('tablaProgramadorUsuarios');
      const filtro = document.getElementById('filtroProgramadorUsuarios');
      const resumen = document.getElementById('resumenProgramadorUsuarios');
      const botonModificar = document.getElementById('programador-modificar-usuario');
      let seleccionado = null;

      function actualizarResumen() {
        const visibles = Array.from(tabla.querySelectorAll('tbody tr')).filter((fila) => fila.style.display !== 'none').length;
        resumen.textContent = `${visibles} de ${usuariosEditables.length} usuarios visibles`;
      }

      filtro.addEventListener('input', (event) => {
        const texto = event.target.value.trim().toLowerCase();
        tabla.querySelectorAll('tbody tr').forEach((fila) => {
          fila.style.display = fila.textContent.toLowerCase().includes(texto) ? '' : 'none';
        });
        actualizarResumen();
      });

      tabla.addEventListener('click', (event) => {
        const fila = event.target.closest('tr[data-index]');
        if (!fila) return;
        tabla.querySelectorAll('.fila-seleccionada').forEach((row) => row.classList.remove('fila-seleccionada'));
        fila.classList.add('fila-seleccionada');
        seleccionado = usuariosEditables[Number(fila.dataset.index)];
        botonModificar.disabled = false;
      });

      botonModificar.addEventListener('click', async () => {
        if (!seleccionado) {
          await showAlert('Selecciona un gerente o empleado para modificar.', 'warning', 'Modificar usuario');
          return;
        }
        const usuarioAModificar = [
          seleccionado.IdEmpleado,
          seleccionado.NombreUsuario,
          seleccionado.NombreCompleto,
          seleccionado.Rol,
          seleccionado.Puesto,
          seleccionado.Turno,
          seleccionado.Salario
        ];
        usuarioAModificar.__raw = seleccionado;
        showUpdateForm(usuarioAModificar);
      });

      actualizarResumen();
    }
  }

  // =============== PROVEEDORES ==================
  if (page === 'proveedores') {
    const [proveedores, productos, recepciones] = await Promise.all([
      window.api.getProveedores(),
      window.api.getProductos(),
      window.api.getRecepcionesProveedor()
    ]);

    let proveedorRows = proveedores.map((e) => {
      const estaActivo = e.Activo !== undefined ? e.Activo : true;
      const claseFila = estaActivo ? '' : 'empleado-desactivado';
      const indicadorEstado = estaActivo ? iconHTML('success') : iconHTML('error');

      return `
        <tr class="${claseFila}">
          <td>${e.IdProveedor || 'N/A'}</td>
          <td>${indicadorEstado} ${e.NombreEmpresa || e.Nombre || 'No especificado'}</td>
          <td>${[e.Calle, e.NumeroExterior, e.Colonia, e.Ciudad, e.Estado].filter(Boolean).join(', ') || e.Direccion || 'No especificado'}</td>
          <td>${e.Telefono || 'No especificado'}</td>
          <td>${e.Correo || 'No especificado'}</td>
          <td>${e.ContactoNombre || 'No especificado'}</td>
          <td>${e.ContactoApellidoPaterno || 'No especificado'}</td>
          <td>${e.ContactoApellidoMaterno || 'No especificado'}</td>
        </tr>
      `;
    }).join('');

    let recepcionRows = recepciones.map((recepcion, index) => `
      <tr data-index="${index}">
        <td>${recepcion.NumeroRecepcion}</td>
        <td>${recepcion.Folio}</td>
        <td>${formatearMoneda(recepcion.Total)}</td>
        <td>${recepcion.NombreProveedor}</td>
        <td>${recepcion.ProductosIngresados || 'Sin detalle'}</td>
        <td>${formatearFechaHora(recepcion.FechaRecepcion)}</td>
        <td>${recepcion.Estado}</td>
      </tr>
    `).join('') || '<tr><td colspan="7">No hay recepciones registradas.</td></tr>';

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
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Contacto nombre</th>
              <th>Contacto ap. paterno</th>
              <th>Contacto ap. materno</th>
            </tr>
          </thead>
          <tbody>${proveedorRows}</tbody>
        </table>
      </div>

      <div class="card">
        <div class="report-header-row">
          <div>
            <h2>Recepciones de proveedor</h2>
            <p>Consulta número de recepción, folio, total, proveedor, productos ingresados y cantidades. Las recepciones pueden modificarse dentro de 24 horas o devolverse si no hubo cambio físico.</p>
          </div>
        </div>
        <table class="table" id="tablaRecepcionesProveedor">
          <thead>
            <tr>
              <th>Núm. recepción</th>
              <th>Folio</th>
              <th>Total</th>
              <th>Proveedor</th>
              <th>Productos ingresados</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${recepcionRows}</tbody>
        </table>
      </div>

      <div class="botones-accion">
        <button id="registrarProveedor" class="btn btn-success"><i class="fas fa-user-plus"></i> Agregar Proveedor</button>
        <button id="registrarRecepcionProveedor" class="btn btn-primary"><i class="fas fa-truck-loading"></i> Registrar recepción</button>
        <button id="modificarRecepcionProveedor" class="btn btn-warning"><i class="fas fa-pen"></i> Modificar recepción</button>
        <button id="devolverRecepcionProveedor" class="btn btn-danger"><i class="fas fa-undo"></i> Devolución a proveedor</button>
      </div>
    `;

    let recepcionSeleccionada = null;
    const filasRecepcion = document.querySelectorAll('#tablaRecepcionesProveedor tbody tr[data-index]');
    filasRecepcion.forEach((fila) => {
      fila.addEventListener('click', () => {
        filasRecepcion.forEach((row) => row.classList.remove('fila-seleccionada'));
        fila.classList.add('fila-seleccionada');
        recepcionSeleccionada = recepciones[Number(fila.dataset.index)];
      });
    });

    document.getElementById('registrarProveedor').addEventListener('click', () => {
      showAddProveedor();
    });

    document.getElementById('registrarRecepcionProveedor').addEventListener('click', async () => {
      const payload = await solicitarRecepcionProveedor({ proveedores, productos });
      if (!payload) return;
      try {
        const res = await window.api.registrarRecepcionProveedor({
          ...payload,
          idEmpleado: usuarioActual.IdEmpleado || usuarioActual.idEmpleado || null
        });
        await showAlert(`Recepción ${res.numeroRecepcion} guardada correctamente.`, 'success', 'Recepción registrada');
        renderPage('proveedores');
      } catch (error) {
        await showAlert(error.message, 'error', 'Recepción rechazada');
      }
    });

    document.getElementById('modificarRecepcionProveedor').addEventListener('click', async () => {
      if (!recepcionSeleccionada) {
        await showAlert('Selecciona una recepción para modificarla.', 'warning', 'Recepción requerida');
        return;
      }
      try {
        const detalle = await window.api.getRecepcionProveedorDetalle(recepcionSeleccionada.IdRecepcion);
        const payload = await solicitarRecepcionProveedor({ proveedores, productos, recepcion: detalle });
        if (!payload) return;
        await window.api.modificarRecepcionProveedor({
          idRecepcion: recepcionSeleccionada.IdRecepcion,
          ...payload
        });
        await showAlert('Recepción modificada correctamente.', 'success', 'Recepción actualizada');
        renderPage('proveedores');
      } catch (error) {
        await showAlert(error.message, 'error', 'No fue posible modificar');
      }
    });

    document.getElementById('devolverRecepcionProveedor').addEventListener('click', async () => {
      if (!recepcionSeleccionada) {
        await showAlert('Selecciona una recepción para devolverla.', 'warning', 'Recepción requerida');
        return;
      }
      if (!await showConfirm('Se devolverá la recepción seleccionada al proveedor. La operación solo funciona si no hubo cambio físico de inventario. ¿Continuar?', 'Confirmar devolución')) return;
      try {
        await window.api.devolverRecepcionProveedor({ idRecepcion: recepcionSeleccionada.IdRecepcion });
        await showAlert('Recepción devuelta al proveedor correctamente.', 'success', 'Devolución registrada');
        renderPage('proveedores');
      } catch (error) {
        await showAlert(error.message, 'error', 'No fue posible devolver');
      }
    });
  }

  // =============== REPORTES ==================
  if (page === 'reportes') {
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const productosInventario = await window.api.getProductos();

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
          <select id="auxiliarDays" class="form-control" style="max-width:180px;">
            <option value="7">Auxiliar 7 días</option>
            <option value="15">Auxiliar 15 días</option>
            <option value="30">Auxiliar 30 días</option>
          </select>
          <select id="auxiliarProducto" class="form-control" style="max-width:240px;">
            <option value="">Todos los productos</option>
            ${productosInventario.map((producto) => `<option value="${producto.IdArticulo}">${producto.Nombre}</option>`).join('')}
          </select>
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
    const auxiliarDays = document.getElementById('auxiliarDays');
    const auxiliarProducto = document.getElementById('auxiliarProducto');
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
        const [reporte, auxiliar, devoluciones] = await Promise.all([
          window.api.getReportes(filtros),
          window.api.getAuxiliarMovimientos({
            days: Number(auxiliarDays.value || 7),
            idArticulo: auxiliarProducto.value ? Number(auxiliarProducto.value) : null
          }),
          window.api.getDevolucionesCliente()
        ]);
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

        const auxiliarRows = (auxiliar || []).map((item) => `
          <tr>
            <td>${formatearFechaHora(item.FechaMovimiento)}</td>
            <td>${item.Producto}</td>
            <td>${item.TipoMovimiento}</td>
            <td>${item.Cantidad}</td>
            <td>${item.Motivo || 'Sin motivo'}</td>
            <td>${item.NumeroRecepcion || item.IdVenta || item.Folio || 'N/A'}</td>
            <td>${item.Proveedor || item.TipoReferencia || 'N/A'}</td>
          </tr>
        `).join('') || '<tr><td colspan="7">Sin movimientos en el rango seleccionado.</td></tr>';

        const devolucionRows = (devoluciones || []).map((item) => `
          <tr>
            <td>${item.FolioDevolucion}</td>
            <td>${item.IdVenta}</td>
            <td>${formatearFechaHora(item.FechaDevolucion)}</td>
            <td>${formatearMoneda(item.TotalReintegrado)}</td>
            <td>${item.Productos || 'Sin detalle'}</td>
            <td>${item.Motivo || 'Sin motivo'}</td>
          </tr>
        `).join('') || '<tr><td colspan="6">No hay devoluciones registradas.</td></tr>';

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

          <div class="card nested-card">
            <h3>Auxiliar de movimientos</h3>
            <p class="helper-text">Consulta entradas y salidas de inventario, incluyendo compras, ventas y ajustes del periodo reciente.</p>
            <table class="table">
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Referencia</th><th>Origen</th></tr>
              </thead>
              <tbody>${auxiliarRows}</tbody>
            </table>
          </div>

          <div class="card nested-card">
            <h3>Devoluciones de clientes</h3>
            <table class="table">
              <thead>
                <tr><th>Folio</th><th>Venta</th><th>Fecha</th><th>Total reintegrado</th><th>Productos</th><th>Motivo</th></tr>
              </thead>
              <tbody>${devolucionRows}</tbody>
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
    auxiliarDays.addEventListener('change', cargarReporte);
    auxiliarProducto.addEventListener('change', cargarReporte);
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
    const [ventas, devoluciones] = await Promise.all([
      window.api.getVentas(),
      window.api.getDevolucionesCliente()
    ]);
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
        <button id="registrarDevolucionVenta" class="btn btn-warning" style="margin-top:15px;">
          <i class="fas fa-undo icon"></i> Registrar Devolución
        </button>
    </div>

    <div class="card">
      <h2>Historial de devoluciones</h2>
      <table class="table" id="tablaDevolucionesCliente">
        <thead>
          <tr>
            <th>Folio</th>
            <th>ID Venta</th>
            <th>Fecha</th>
            <th>Total reintegrado</th>
            <th>Productos</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          ${devoluciones.map((item) => `
            <tr>
              <td>${item.FolioDevolucion}</td>
              <td>${item.IdVenta}</td>
              <td>${formatearFechaHora(item.FechaDevolucion)}</td>
              <td>${formatearMoneda(item.TotalReintegrado)}</td>
              <td>${item.Productos || 'Sin detalle'}</td>
              <td>${item.Motivo || 'Sin motivo'}</td>
            </tr>
          `).join('') || '<tr><td colspan="6">No hay devoluciones registradas.</td></tr>'}
        </tbody>
      </table>
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
      </section>
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

    document.getElementById('registrarDevolucionVenta').addEventListener('click', async () => {
      if (seleccionVenta.size !== 1) {
        await showAlert('Selecciona una sola venta para registrar la devolución.', 'warning', 'Acción requerida');
        return;
      }

      const index = Array.from(seleccionVenta)[0];
      const venta = ventas[index];

      try {
        const detallesVenta = await window.api.getDetallesVenta(venta.IdVenta);
        const payload = await solicitarDevolucionCliente({ productos: detallesVenta?.Productos || [] });
        if (!payload || !payload.items.length) {
          await showAlert('Debes indicar al menos un producto con cantidad mayor a cero.', 'warning', 'Devolución incompleta');
          return;
        }

        const resultado = await window.api.registrarDevolucionCliente({
          idVenta: venta.IdVenta,
          idEmpleado: usuarioActual.IdEmpleado || usuarioActual.idEmpleado || null,
          motivo: payload.motivo,
          items: payload.items
        });

        await showAlert(`Devolución ${resultado.folioDevolucion} registrada correctamente por ${formatearMoneda(resultado.totalReintegrado)}.`, 'success', 'Devolución registrada');
        renderPage('registroVenta');
      } catch (error) {
        await showAlert(error.message, 'error', 'No fue posible registrar la devolución');
      }
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
    let procesandoPago = false;

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
    <div class="pos-layout">
      <section class="pos-panel productos-panel card">
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
      </section>

      <section class="pos-panel carrito-panel card">
        <h2>${esModoCompraCliente ? 'Tu compra' : 'Carrito de ventas'}</h2>
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
        <div class="carrito-footer">
          <div class="totales pos-totales">
            <div>Subtotal: $<span id="subtotal">0.00</span></div>
            <div>IVA (16%): $<span id="iva">0.00</span></div>
            <h3>Total: $<span id="total">0.00</span></h3>
          </div>
          <div class="acciones pos-acciones">
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
      </section>
    </div>
  `;

    const tablaProductosBody = document.querySelector('.productos-panel .table tbody');
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
      if (procesandoPago) return;
      if (carrito.length === 0) {
        mostrarAlerta('El carrito está vacío');
        return;
      }

      const datosClienteVenta = await solicitarDatosClienteVenta({ requerido: esModoCompraCliente });
      if (datosClienteVenta === false) {
        return;
      }

      procesandoPago = true;
      const btnPagar = document.getElementById('btnPagar');
      const textoOriginalBoton = btnPagar.innerHTML;
      btnPagar.disabled = true;
      btnPagar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${esModoCompraCliente ? 'Procesando compra...' : 'Procesando venta...'}`;

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

      if (hayProblemas) {
        procesandoPago = false;
        btnPagar.disabled = false;
        btnPagar.innerHTML = textoOriginalBoton;
        return;
      }

      const datosVenta = {
        idEmpleado: esModoCompraCliente ? null : (usuarioActual.idEmpleado || usuarioActual.IdEmpleado || null),
        idCliente: null,
        datosCliente: datosClienteVenta || null,
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
          mostrarTicketVenta({
            idVenta: res.idVenta,
            canal: res.canal,
            total: res.total,
            carritoItems: carrito,
            esModoCompraCliente
          });
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
      } finally {
        procesandoPago = false;
        btnPagar.disabled = false;
        btnPagar.innerHTML = textoOriginalBoton;
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
            <div class="cantidad-control">
              <button class="btn btn-sm btn-outline-secondary btn-restar" data-index="${index}">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" min="1" value="${item.cantidad}" 
                     class="cantidad-input" data-index="${index}">
              <button class="btn btn-sm btn-outline-secondary btn-sumar" data-index="${index}">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </td>
          <td><span class="precio-unitario-tag">$${item.precio.toFixed(2)}</span></td>
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
inicializarComprobacionActualizacion();
