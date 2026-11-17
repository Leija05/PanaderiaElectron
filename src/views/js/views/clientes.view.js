// Vista de Directorio de Clientes e Historial de Compras
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Clientes = {
  clientes: [],
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.user()} Directorio de Clientes</h1>
            <p class="view-page-sub">Consulta historial de compras, frecuencia de consumo y pedidos de clientes registrados.</p>
          </div>
        </div>

        <div class="card">
          <div class="table-toolbar">
            <div class="search-box">
              <span class="search-icon">${window.App.Icons.search()}</span>
              <input type="text" id="cli-search-input" class="form-control" placeholder="Buscar cliente por nombre o productos...">
            </div>
            <div class="table-counts" id="cli-count-badge">Total: 0 clientes</div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Cliente</th>
                  <th>Género</th>
                  <th>Fecha de Registro</th>
                  <th>Compras / Folios</th>
                  <th>Productos Consumidos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="cli-table-body">
                <tr><td colspan="7" class="text-center py-4">Cargando clientes...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadData();

    document.getElementById('cli-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });
  },

  async loadData() {
    try {
      this.clientes = await window.api.getClientes();
      this.renderTable();
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      window.App.UI.showToast('Error al consultar lista de clientes', 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('cli-table-body');
    const countBadge = document.getElementById('cli-count-badge');
    if (!tbody) return;

    const filtered = this.clientes.filter((c) => {
      if (!this.searchQuery) return true;
      const full = `${c.NombreCompleto || ''} ${c.ProductosComprados || ''}`.toLowerCase();
      return full.includes(this.searchQuery);
    });

    countBadge.textContent = `${filtered.length} clientes`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-table-cell">No se encontraron clientes registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((c) => {
      return `
        <tr>
          <td class="font-mono text-muted">#${c.IdCliente}</td>
          <td class="font-semibold">${window.App.Utils.escapeHtml(c.NombreCompleto || c.Nombre || 'Cliente')}</td>
          <td>${window.App.Utils.escapeHtml(c.Genero || '-')}</td>
          <td class="text-secondary">${window.App.Utils.formatDate(c.FechaRegistro)}</td>
          <td class="font-mono text-xs">${window.App.Utils.escapeHtml(c.Ventas || 'Sin compras')}</td>
          <td class="text-xs text-secondary max-w-sm truncate" title="${window.App.Utils.escapeHtml(c.ProductosComprados || '')}">
            ${window.App.Utils.escapeHtml(c.ProductosComprados || 'Ninguno aún')}
          </td>
          <td>
            <span class="badge ${c.Activo ? 'badge-success' : 'badge-danger'}">
              ${c.Activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
};

