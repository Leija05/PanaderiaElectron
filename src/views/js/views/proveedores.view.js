// Vista de Proveedores, Recepciones de Mercancía y Devoluciones
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Proveedores = {
  currentTab: 'proveedores',
  proveedores: [],
  recepciones: [],
  devoluciones: [],

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.truck()} Cadena de Suministro</h1>
            <p class="view-page-sub">Gestiona proveedores, recepción de materia prima/mercancía y devoluciones de clientes.</p>
          </div>

          <div class="view-actions-group">
            <button id="prov-btn-new-prov" class="btn btn-outline">
              ${window.App.Icons.plus()}
              <span>Nuevo Proveedor</span>
            </button>
            <button id="prov-btn-new-rec" class="btn btn-primary">
              ${window.App.Icons.box()}
              <span>Recibir Mercancía</span>
            </button>
            <button id="prov-btn-new-dev" class="btn btn-outline btn-warning-outline">
              ${window.App.Icons.refresh()}
              <span>Devolución de Cliente</span>
            </button>
          </div>
        </div>

        <!-- Pestañas de Navegación de Suministro -->
        <div class="tabs-nav-bar">
          <button class="tab-btn active" data-tab="proveedores">
            ${window.App.Icons.truck()}
            <span>Proveedores</span>
          </button>
          <button class="tab-btn" data-tab="recepciones">
            ${window.App.Icons.box()}
            <span>Recepciones de Mercancía</span>
          </button>
          <button class="tab-btn" data-tab="devoluciones">
            ${window.App.Icons.refresh()}
            <span>Devoluciones de Clientes</span>
          </button>
        </div>

        <div id="prov-tab-content" class="tab-content-area">
          <div class="loading-state"><span class="spinner"></span></div>
        </div>
      </div>
    `;

    // Manejador de pestañas
    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.dataset.tab;
        this.renderCurrentTab();
      });
    });

    document.getElementById('prov-btn-new-prov').addEventListener('click', () => this.openAddSupplierModal());
    document.getElementById('prov-btn-new-rec').addEventListener('click', () => this.openAddReceptionModal());
    document.getElementById('prov-btn-new-dev').addEventListener('click', () => this.openAddCustomerReturnModal());

    await this.loadAllData();
    this.renderCurrentTab();
  },

  async loadAllData() {
    try {
      const [provs, recs, devs] = await Promise.all([
        window.api.getProveedores(),
        window.api.getRecepcionesProveedor(),
        window.api.getDevolucionesCliente()
      ]);
      this.proveedores = provs || [];
      this.recepciones = recs || [];
      this.devoluciones = devs || [];
    } catch (err) {
      console.error('Error al cargar datos de proveedores:', err);
      window.App.UI.showToast('Error al conectar con la base de datos de proveedores', 'error');
    }
  },

  renderCurrentTab() {
    const content = document.getElementById('prov-tab-content');
    if (!content) return;

    if (this.currentTab === 'proveedores') {
      this.renderProveedoresTab(content);
    } else if (this.currentTab === 'recepciones') {
      this.renderRecepcionesTab(content);
    } else if (this.currentTab === 'devoluciones') {
      this.renderDevolucionesTab(content);
    }
  },

  renderProveedoresTab(container) {
    if (!this.proveedores.length) {
      container.innerHTML = `
        <div class="card empty-state">
          ${window.App.Icons.truck()}
          <p>No hay proveedores registrados aún.</p>
          <button class="btn btn-primary btn-sm" onclick="window.App.Views.Proveedores.openAddSupplierModal()">Registrar Primer Proveedor</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Proveedor / Empresa</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${this.proveedores.map((p) => {
                const isActivo = p.Activo !== 0 && p.Activo !== false;
                return `
                  <tr class="${!isActivo ? 'row-inactive' : ''}">
                    <td class="font-mono text-muted">#${p.IdProveedor}</td>
                    <td class="font-semibold">${window.App.Utils.escapeHtml(p.NombreEmpresa || p.Nombre)}</td>
                    <td>${window.App.Utils.escapeHtml(p.Contacto || p.ContactoNombre || '-')}</td>
                    <td class="font-mono">${window.App.Utils.escapeHtml(p.Telefono || '-')}</td>
                    <td>${window.App.Utils.escapeHtml(p.Correo || '-')}</td>
                    <td class="text-secondary text-xs">${window.App.Utils.escapeHtml(p.Direccion || '-')}</td>
                    <td>
                      <span class="badge ${isActivo ? 'badge-success' : 'badge-danger'}">
                        ${isActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-outline btn-sm btn-prov-toggle" data-id="${p.IdProveedor}" data-status="${isActivo ? '1' : '0'}">
                        ${isActivo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-prov-toggle').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const nextStatus = btn.dataset.status !== '1';
        try {
          const res = await window.api.cambiarEstadoProveedor(id, nextStatus);
          window.App.UI.showToast(res.message, 'success');
          await this.loadAllData();
          this.renderCurrentTab();
        } catch (err) {
          window.App.UI.showToast(err.message, 'error');
        }
      });
    });
  },

  renderRecepcionesTab(container) {
    if (!this.recepciones.length) {
      container.innerHTML = `
        <div class="card empty-state">
          ${window.App.Icons.box()}
          <p>No se han registrado recepciones de mercancía.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Folio / Recepción</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Productos Recibidos</th>
                <th>Total ($)</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${this.recepciones.map((r) => {
                const canModify = r.Estado === 'Recibida' && new Date(r.PuedeModificarHasta).getTime() > Date.now();
                return `
                  <tr>
                    <td>
                      <span class="font-mono font-semibold">${window.App.Utils.escapeHtml(r.NumeroRecepcion)}</span>
                      <div class="text-xs text-muted">${window.App.Utils.escapeHtml(r.Folio)}</div>
                    </td>
                    <td class="text-secondary text-xs">${window.App.Utils.formatDate(r.FechaRecepcion)}</td>
                    <td class="font-semibold">${window.App.Utils.escapeHtml(r.NombreProveedor || '-')}</td>
                    <td class="text-xs text-secondary max-w-sm truncate" title="${window.App.Utils.escapeHtml(r.ProductosIngresados || '')}">
                      ${window.App.Utils.escapeHtml(r.ProductosIngresados || '-')}
                    </td>
                    <td class="font-bold text-success">${window.App.Utils.formatMoney(r.Total)}</td>
                    <td>
                      <span class="badge ${r.Estado === 'Recibida' ? 'badge-success' : r.Estado === 'Modificada' ? 'badge-primary' : 'badge-danger'}">
                        ${r.Estado}
                      </span>
                    </td>
                    <td class="text-right">
                      ${r.Estado !== 'Devuelta' ? `
                        <button class="btn btn-outline btn-sm btn-danger-outline btn-return-rec" data-id="${r.IdRecepcion}" title="Devolver recepción y descontar inventario">
                          Devolver
                        </button>
                      ` : '<span class="text-muted text-xs">Devuelto</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-return-rec').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const confirm = await window.App.UI.showModal({
          title: '¿Confirmar devolución al proveedor?',
          message: 'Se revertirá el ingreso de existencias en el inventario para todos los artículos de esta recepción.',
          type: 'warning',
          showCancel: true,
          confirmText: 'Sí, Devolver'
        });

        if (confirm) {
          try {
            await window.api.devolverRecepcionProveedor({ idRecepcion: id, motivo: 'Devolución manual por usuario' });
            window.App.UI.showToast('Recepción devuelta y existencias revertidas.', 'success');
            await this.loadAllData();
            this.renderCurrentTab();
          } catch (err) {
            window.App.UI.showToast(err.message, 'error');
          }
        }
      });
    });
  },

  renderDevolucionesTab(container) {
    if (!this.devoluciones.length) {
      container.innerHTML = `
        <div class="card empty-state">
          ${window.App.Icons.refresh()}
          <p>No se han registrado devoluciones de clientes.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Folio Devolución</th>
                <th>Fecha</th>
                <th>Venta Origen</th>
                <th>Atendió</th>
                <th>Productos Reintegrados</th>
                <th>Monto Reintegrado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${this.devoluciones.map((d) => `
                <tr>
                  <td class="font-mono font-semibold">${window.App.Utils.escapeHtml(d.FolioDevolucion)}</td>
                  <td class="text-secondary text-xs">${window.App.Utils.formatDate(d.FechaDevolucion)}</td>
                  <td class="font-mono font-bold">#${d.IdVenta}</td>
                  <td>${window.App.Utils.escapeHtml(d.Empleado || 'Sistema')}</td>
                  <td class="text-xs text-secondary">${window.App.Utils.escapeHtml(d.Productos || '-')}</td>
                  <td class="font-bold text-danger">${window.App.Utils.formatMoney(d.TotalReintegrado)}</td>
                  <td class="text-xs text-muted">${window.App.Utils.escapeHtml(d.Motivo || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddSupplierModal() {
    const html = `
      <form id="form-new-prov" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre del Proveedor / Razón Social:</label>
          <input type="text" id="prov-name" class="form-control" placeholder="Ej. Harinas Elizondo S.A. de C.V." required autofocus>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Persona de Contacto:</label>
            <input type="text" id="prov-contact" class="form-control" placeholder="Lic. Roberto Sánchez">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono:</label>
            <input type="tel" id="prov-tel" class="form-control" placeholder="55 1234 5678">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Correo Electrónico:</label>
            <input type="email" id="prov-mail" class="form-control" placeholder="ventas@proveedor.com">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad / Estado:</label>
            <input type="text" id="prov-city" class="form-control" placeholder="Monterrey, N.L.">
          </div>
        </div>
      </form>
    `;

    window.App.UI.showModal({
      title: 'Registrar Proveedor',
      html,
      confirmText: 'Guardar Proveedor',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const name = document.getElementById('prov-name')?.value.trim();
      const contacto = document.getElementById('prov-contact')?.value.trim();
      const telefono = document.getElementById('prov-tel')?.value.trim();
      const mail = document.getElementById('prov-mail')?.value.trim();
      const ciudad = document.getElementById('prov-city')?.value.trim();

      if (!name) {
        window.App.UI.showToast('El nombre del proveedor es requerido', 'warning');
        return;
      }

      try {
        await window.api.registrarProveedor({
          name,
          contacto,
          telefono,
          mail,
          ciudad
        });
        window.App.UI.showToast(`Proveedor ${name} registrado con éxito.`, 'success');
        await this.loadAllData();
        this.renderCurrentTab();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  async openAddReceptionModal() {
    const products = await window.api.getProductos();
    const activeProvs = this.proveedores.filter(p => p.Activo !== 0 && p.Activo !== false);

    if (!activeProvs.length) {
      window.App.UI.showToast('Registra o activa al menos un proveedor primero.', 'warning');
      return;
    }

    const provOptions = activeProvs.map(p => `<option value="${p.IdProveedor}">${p.NombreEmpresa || p.Nombre}</option>`).join('');
    const prodOptions = products.map(p => `<option value="${p.IdArticulo}">${p.Nombre} (Costo ref: ${p.PrecioCompra || 0})</option>`).join('');

    const html = `
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">Proveedor:</label>
          <select id="rec-prov-select" class="form-control">${provOptions}</select>
        </div>

        <div class="reception-items-header">
          <label class="form-label">Artículos a Ingresar:</label>
          <div class="form-row-3">
            <select id="rec-prod-select" class="form-control">${prodOptions}</select>
            <input type="number" id="rec-prod-qty" class="form-control" placeholder="Cantidad" min="1" value="20">
            <input type="number" id="rec-prod-cost" class="form-control" placeholder="Costo Unit. ($)" step="0.5" min="0" value="10">
          </div>
          <button type="button" id="rec-btn-add-line" class="btn btn-outline btn-sm mt-2">
            ${window.App.Icons.plus()} Agregar a la lista
          </button>
        </div>

        <div class="rec-lines-table-box mt-3">
          <table class="data-table">
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Costo</th><th>Subtotal</th><th></th></tr>
            </thead>
            <tbody id="rec-lines-tbody">
              <tr><td colspan="5" class="text-center text-muted py-2">Sin artículos agregados</td></tr>
            </tbody>
          </table>
          <div class="text-right font-bold mt-2" id="rec-total-display">Total Recepción: $0.00</div>
        </div>
      </div>
    `;

    const lines = [];

    window.App.UI.showModal({
      title: 'Recepción de Mercancía de Proveedor',
      html,
      confirmText: 'Registrar Ingreso de Stock',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;
      if (!lines.length) {
        window.App.UI.showToast('Debes agregar al menos un artículo a la recepción.', 'warning');
        return;
      }

      const idProveedor = parseInt(document.getElementById('rec-prov-select')?.value, 10);
      const user = window.App.State.user;

      try {
        const res = await window.api.registrarRecepcionProveedor({
          idProveedor,
          idEmpleado: user?.IdEmpleado || null,
          items: lines
        });
        window.App.UI.showToast(`Recepción #${res.numeroRecepcion} guardada con éxito ($${res.total}).`, 'success');
        await this.loadAllData();
        this.currentTab = 'recepciones';
        this.renderCurrentTab();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });

    setTimeout(() => {
      const btnAdd = document.getElementById('rec-btn-add-line');
      const tbody = document.getElementById('rec-lines-tbody');
      const totalDisplay = document.getElementById('rec-total-display');

      const refreshLines = () => {
        if (!lines.length) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-2">Sin artículos agregados</td></tr>`;
          totalDisplay.textContent = 'Total Recepción: $0.00';
          return;
        }

        let total = 0;
        tbody.innerHTML = lines.map((item, idx) => {
          const sub = item.cantidad * item.costoUnitario;
          total += sub;
          return `
            <tr>
              <td>${item.nombre}</td>
              <td>${item.cantidad}</td>
              <td>${window.App.Utils.formatMoney(item.costoUnitario)}</td>
              <td>${window.App.Utils.formatMoney(sub)}</td>
              <td><button class="btn-text-danger btn-del-line" data-idx="${idx}">&times;</button></td>
            </tr>
          `;
        }).join('');

        totalDisplay.textContent = `Total Recepción: ${window.App.Utils.formatMoney(total)}`;

        tbody.querySelectorAll('.btn-del-line').forEach((b) => {
          b.addEventListener('click', () => {
            lines.splice(parseInt(b.dataset.idx, 10), 1);
            refreshLines();
          });
        });
      };

      btnAdd.addEventListener('click', () => {
        const prodSelect = document.getElementById('rec-prod-select');
        const idArticulo = parseInt(prodSelect.value, 10);
        const prodObj = products.find(p => p.IdArticulo === idArticulo);
        const cantidad = parseInt(document.getElementById('rec-prod-qty').value, 10);
        const costoUnitario = parseFloat(document.getElementById('rec-prod-cost').value);

        if (!idArticulo || !cantidad || cantidad <= 0 || isNaN(costoUnitario)) {
          window.App.UI.showToast('Ingresa cantidad y costo válidos', 'warning');
          return;
        }

        lines.push({
          idArticulo,
          nombre: prodObj?.Nombre || 'Artículo',
          cantidad,
          costoUnitario
        });

        refreshLines();
      });
    }, 50);
  },

  async openAddCustomerReturnModal() {
    const ventas = await window.api.getVentas();
    if (!ventas.length) {
      window.App.UI.showToast('No hay ventas registradas para procesar devolución.', 'warning');
      return;
    }

    const ventasOptions = ventas.slice(0, 30).map(v => `<option value="${v.IdVenta}">Venta #${v.IdVenta} - Total: $${v.Total} (${window.App.Utils.formatDate(v.FechaVenta)})</option>`).join('');

    const html = `
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">Selecciona el Folio de Venta:</label>
          <select id="dev-venta-select" class="form-control">${ventasOptions}</select>
        </div>

        <div id="dev-items-container" class="mt-3">
          <p class="text-muted text-sm">Cargando productos de la venta...</p>
        </div>

        <div class="form-group mt-3">
          <label class="form-label">Motivo de la devolución:</label>
          <input type="text" id="dev-motivo" class="form-control" placeholder="Ej. Pan en mal estado, error en cobro" value="Devolución de cliente en mostrador">
        </div>
      </div>
    `;

    window.App.UI.showModal({
      title: 'Devolución de Cliente y Reintegro de Stock',
      html,
      type: 'warning',
      confirmText: 'Procesar Reintegro',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const idVenta = parseInt(document.getElementById('dev-venta-select')?.value, 10);
      const motivo = document.getElementById('dev-motivo')?.value.trim();
      const user = window.App.State.user;

      const itemsToReturn = [];
      document.querySelectorAll('.dev-item-row').forEach((row) => {
        const idArticulo = parseInt(row.dataset.id, 10);
        const qty = parseInt(row.querySelector('.dev-item-qty').value, 10) || 0;
        if (qty > 0) {
          itemsToReturn.push({ idArticulo, cantidad: qty });
        }
      });

      if (!itemsToReturn.length) {
        window.App.UI.showToast('Indica la cantidad a devolver en al menos un artículo.', 'warning');
        return;
      }

      try {
        const res = await window.api.registrarDevolucionCliente({
          idVenta,
          idEmpleado: user?.IdEmpleado || null,
          motivo,
          items: itemsToReturn
        });

        window.App.UI.showToast(`Devolución #${res.folioDevolucion} procesada. Reintegrado: $${res.totalReintegrado}.`, 'success');
        await this.loadAllData();
        this.currentTab = 'devoluciones';
        this.renderCurrentTab();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });

    setTimeout(async () => {
      const ventaSelect = document.getElementById('dev-venta-select');
      const itemsContainer = document.getElementById('dev-items-container');

      const loadVentaItems = async () => {
        const idVenta = parseInt(ventaSelect.value, 10);
        try {
          const detalle = await window.api.getDetallesVenta(idVenta);
          if (!detalle.Productos || !detalle.Productos.length) {
            itemsContainer.innerHTML = `<p class="text-muted">Esta venta no contiene artículos.</p>`;
            return;
          }

          itemsContainer.innerHTML = `
            <table class="data-table">
              <thead><tr><th>Producto</th><th>Comprado</th><th>Devolver</th></tr></thead>
              <tbody>
                ${detalle.Productos.map(p => `
                  <tr class="dev-item-row" data-id="${p.IdArticulo}">
                    <td>${window.App.Utils.escapeHtml(p.NombreProducto)}</td>
                    <td>${p.Cantidad} pzs</td>
                    <td>
                      <input type="number" class="form-control form-control-sm dev-item-qty" min="0" max="${p.Cantidad}" value="0">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } catch (e) {
          itemsContainer.innerHTML = `<p class="text-danger">Error cargando detalles de la venta: ${e.message}</p>`;
        }
      };

      ventaSelect.addEventListener('change', loadVentaItems);
      loadVentaItems();
    }, 50);
  }
};

