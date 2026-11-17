// Vista de Control de Inventario y Existencias
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Inventario = {
  products: [],
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.box()} Control de Inventario</h1>
            <p class="view-page-sub">Gestiona productos, existencias, precios de venta y umbrales mínimos de reorden.</p>
          </div>

          <div class="view-actions-group">
            <button id="inv-btn-add-stock" class="btn btn-outline">
              ${window.App.Icons.plus()}
              <span>Agregar Stock</span>
            </button>
            <button id="inv-btn-del-stock" class="btn btn-outline btn-danger-outline">
              ${window.App.Icons.minus()}
              <span>Retirar Stock</span>
            </button>
            <button id="inv-btn-new-product" class="btn btn-primary">
              ${window.App.Icons.plus()}
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        <div id="inv-alert-banner" class="inv-alert-banner" style="display: none;"></div>

        <div class="card inv-card">
          <div class="table-toolbar">
            <div class="search-box">
              <span class="search-icon">${window.App.Icons.search()}</span>
              <input type="text" id="inv-search-input" class="form-control" placeholder="Buscar por nombre o descripción...">
            </div>
            <div class="table-counts" id="inv-count-badge">Total: 0 artículos</div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Descripción</th>
                  <th>Stock Actual</th>
                  <th>Mínimo</th>
                  <th>P. Compra</th>
                  <th>P. Venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="inv-table-body">
                <tr><td colspan="8" class="text-center py-4">Cargando catálogo...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadData();

    document.getElementById('inv-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('inv-btn-new-product').addEventListener('click', () => {
      this.openNewProductModal();
    });

    document.getElementById('inv-btn-add-stock').addEventListener('click', () => {
      this.openAddStockModal();
    });

    document.getElementById('inv-btn-del-stock').addEventListener('click', () => {
      this.openDeductStockModal();
    });
  },

  async loadData() {
    try {
      this.products = await window.api.getProductos();
      this.renderTable();
      this.checkLowStockAlerts();
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      window.App.UI.showToast('Error al consultar inventario en MySQL', 'error');
    }
  },

  checkLowStockAlerts() {
    const lowStock = this.products.filter((p) => p.Activo && Number(p.Cantidad || 0) <= Number(p.Minimo || 5));
    const banner = document.getElementById('inv-alert-banner');
    if (!banner) return;

    if (lowStock.length > 0) {
      banner.style.display = 'flex';
      banner.innerHTML = `
        <div class="alert-banner-icon">${window.App.Icons.alert()}</div>
        <div class="alert-banner-content">
          <strong>¡Alerta de Reorden!</strong>
          <span>Hay <strong>${lowStock.length}</strong> producto(s) por debajo o al límite del stock mínimo (${lowStock.map(p => p.Nombre).slice(0, 4).join(', ')}${lowStock.length > 4 ? '...' : ''}).</span>
        </div>
      `;
    } else {
      banner.style.display = 'none';
    }
  },

  renderTable() {
    const tbody = document.getElementById('inv-table-body');
    const countBadge = document.getElementById('inv-count-badge');
    if (!tbody) return;

    const filtered = this.products.filter((p) => {
      if (!this.searchQuery) return true;
      return p.Nombre.toLowerCase().includes(this.searchQuery) ||
             (p.Descripcion && p.Descripcion.toLowerCase().includes(this.searchQuery));
    });

    countBadge.textContent = `${filtered.length} de ${this.products.length} productos`;

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-table-cell">No se encontraron productos en el inventario.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((prod) => {
      const stock = Number(prod.Cantidad || 0);
      const min = Number(prod.Minimo || 5);
      const isOutOfStock = stock <= 0;
      const isLowStock = stock > 0 && stock <= min;

      let statusBadge = `<span class="badge badge-success">Óptimo</span>`;
      if (isOutOfStock) {
        statusBadge = `<span class="badge badge-danger">Agotado</span>`;
      } else if (isLowStock) {
        statusBadge = `<span class="badge badge-warning">Reorden (${stock}/${min})</span>`;
      }

      return `
        <tr>
          <td class="font-mono text-muted">#${prod.IdArticulo}</td>
          <td class="font-semibold">${window.App.Utils.escapeHtml(prod.Nombre)}</td>
          <td class="text-secondary">${window.App.Utils.escapeHtml(prod.Descripcion || '-')}</td>
          <td><strong class="${isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-success'}">${stock}</strong></td>
          <td class="text-muted">${min}</td>
          <td>${window.App.Utils.formatMoney(prod.PrecioCompra || 0)}</td>
          <td class="font-semibold">${window.App.Utils.formatMoney(prod.PrecioVenta || 0)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  openNewProductModal() {
    const html = `
      <form id="form-new-product" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre del Pan / Producto:</label>
          <input type="text" id="new-prod-name" class="form-control" placeholder="Ej. Cuerno de Chocolate" required autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción:</label>
          <input type="text" id="new-prod-desc" class="form-control" placeholder="Ej. Hojaldre relleno de chocolate semi-amargo" required>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Cantidad Inicial:</label>
            <input type="number" id="new-prod-qty" class="form-control" min="0" value="20" required>
          </div>
          <div class="form-group">
            <label class="form-label">Stock Mínimo (Alerta):</label>
            <input type="number" id="new-prod-min" class="form-control" min="1" value="5" required>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Precio de Compra/Costo ($):</label>
            <input type="number" id="new-prod-cost" class="form-control" step="0.5" min="0" value="8.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Precio de Venta ($):</label>
            <input type="number" id="new-prod-price" class="form-control" step="0.5" min="0" value="18.00" required>
          </div>
        </div>
      </form>
    `;

    window.App.UI.showModal({
      title: 'Registrar Nuevo Producto',
      html,
      confirmText: 'Guardar Producto',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;

      const nombre = document.getElementById('new-prod-name')?.value.trim();
      const descripcion = document.getElementById('new-prod-desc')?.value.trim();
      const cantidad = parseInt(document.getElementById('new-prod-qty')?.value, 10);
      const minimo = parseInt(document.getElementById('new-prod-min')?.value, 10);
      const precioCompra = parseFloat(document.getElementById('new-prod-cost')?.value);
      const precioVenta = parseFloat(document.getElementById('new-prod-price')?.value);

      if (!nombre || !descripcion) {
        window.App.UI.showToast('Nombre y descripción son requeridos', 'warning');
        return;
      }

      try {
        await window.api.agregarProducto({
          nombre,
          descripcion,
          cantidad,
          minimo,
          precioCompra,
          precioVenta
        });
        window.App.UI.showToast(`Producto "${nombre}" registrado correctamente.`, 'success');
        this.loadData();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  openAddStockModal() {
    const options = this.products.map(p => `<option value="${p.IdArticulo}">${p.Nombre} (Actual: ${p.Cantidad})</option>`).join('');

    const html = `
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">Selecciona el Producto:</label>
          <select id="add-stock-id" class="form-control">${options}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Cantidad a Agregar:</label>
          <input type="number" id="add-stock-qty" class="form-control input-lg" min="1" value="10" autofocus>
        </div>
      </div>
    `;

    window.App.UI.showModal({
      title: 'Añadir Existencias a Inventario',
      html,
      confirmText: 'Añadir Unidades',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const id = parseInt(document.getElementById('add-stock-id')?.value, 10);
      const qty = parseInt(document.getElementById('add-stock-qty')?.value, 10);

      if (!id || !qty || qty <= 0) {
        window.App.UI.showToast('Ingresa una cantidad válida mayor a 0', 'warning');
        return;
      }

      try {
        const res = await window.api.agregarCantidadProducto(id, qty);
        window.App.UI.showToast(res.message, 'success');
        this.loadData();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  openDeductStockModal() {
    const options = this.products.map(p => `<option value="${p.IdArticulo}">${p.Nombre} (Actual: ${p.Cantidad})</option>`).join('');

    const html = `
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">Selecciona el Producto:</label>
          <select id="del-stock-id" class="form-control">${options}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Cantidad a Retirar / Descontar:</label>
          <input type="number" id="del-stock-qty" class="form-control input-lg" min="1" value="1" autofocus>
          <small class="text-muted">Úsalo para mermas, caducidades o ajustes de conteo físico.</small>
        </div>
      </div>
    `;

    window.App.UI.showModal({
      title: 'Retirar Stock (Merma / Ajuste)',
      html,
      type: 'warning',
      confirmText: 'Confirmar Retiro',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;
      const id = parseInt(document.getElementById('del-stock-id')?.value, 10);
      const qty = parseInt(document.getElementById('del-stock-qty')?.value, 10);

      if (!id || !qty || qty <= 0) {
        window.App.UI.showToast('Ingresa una cantidad válida mayor a 0', 'warning');
        return;
      }

      try {
        const res = await window.api.eliminarProducto(id, qty);
        window.App.UI.showToast(res.message, 'success');
        this.loadData();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  }
};

