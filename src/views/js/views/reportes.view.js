// Vista de Reportes Operativos, Kardex de Movimientos y Métricas
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Reportes = {
  currentFilterMode: 'weekly',
  reportData: null,
  auxiliarData: [],
  activeTab: 'resumen',

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.chart()} Reportes y Métricas Operativas</h1>
            <p class="view-page-sub">Analiza ventas por periodo, productos con mayor rotación, cortes y movimientos de inventario.</p>
          </div>

          <div class="view-actions-group">
            <button id="rep-btn-export-csv" class="btn btn-outline">
              ${window.App.Icons.download()}
              <span>Exportar Reporte CSV</span>
            </button>
          </div>
        </div>

        <!-- Filtros de Fecha -->
        <div class="card rep-filter-card">
          <div class="rep-filter-row">
            <div class="filter-period-buttons">
              <button class="btn btn-sm btn-period ${this.currentFilterMode === 'weekly' ? 'btn-primary' : 'btn-outline'}" data-mode="weekly">Esta Semana</button>
              <button class="btn btn-sm btn-period ${this.currentFilterMode === 'monthly' ? 'btn-primary' : 'btn-outline'}" data-mode="monthly">Este Mes</button>
              <button class="btn btn-sm btn-period ${this.currentFilterMode === 'custom' ? 'btn-primary' : 'btn-outline'}" data-mode="custom">Rango Personalizado</button>
            </div>

            <div class="filter-custom-dates" id="rep-custom-dates" style="${this.currentFilterMode === 'custom' ? 'display: flex;' : 'display: none;'}">
              <div class="date-input-group">
                <label>Desde:</label>
                <input type="date" id="rep-date-start" class="form-control form-control-sm">
              </div>
              <div class="date-input-group">
                <label>Hasta:</label>
                <input type="date" id="rep-date-end" class="form-control form-control-sm">
              </div>
              <button id="rep-btn-apply-dates" class="btn btn-primary btn-sm">Aplicar</button>
            </div>
          </div>
        </div>

        <!-- Subpestañas: Resumen General / Auxiliar Kardex -->
        <div class="tabs-nav-bar mt-3">
          <button class="tab-btn active" data-subtab="resumen">
            ${window.App.Icons.chart()}
            <span>Resumen Ejecutivo</span>
          </button>
          <button class="tab-btn" data-subtab="kardex">
            ${window.App.Icons.box()}
            <span>Auxiliar de Movimientos (Kardex)</span>
          </button>
        </div>

        <div id="rep-subtab-container" class="mt-4">
          <div class="loading-state"><span class="spinner"></span></div>
        </div>
      </div>
    `;

    // Filtros de periodo
    container.querySelectorAll('.btn-period').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.btn-period').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        this.currentFilterMode = btn.dataset.mode;

        const customDatesBox = document.getElementById('rep-custom-dates');
        if (this.currentFilterMode === 'custom') {
          customDatesBox.style.display = 'flex';
        } else {
          customDatesBox.style.display = 'none';
          this.loadReport();
        }
      });
    });

    document.getElementById('rep-btn-apply-dates').addEventListener('click', () => {
      this.loadReport();
    });

    // Subtabs
    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.subtab;
        this.renderSubtab();
      });
    });

    // Exportar CSV
    document.getElementById('rep-btn-export-csv').addEventListener('click', () => {
      this.exportReportCSV();
    });

    // Establecer fechas predeterminadas
    const today = new Date().toISOString().slice(0, 10);
    const startInput = document.getElementById('rep-date-start');
    const endInput = document.getElementById('rep-date-end');
    if (startInput) startInput.value = today;
    if (endInput) endInput.value = today;

    await this.loadReport();
  },

  async loadReport() {
    const container = document.getElementById('rep-subtab-container');
    if (container) container.innerHTML = `<div class="loading-state"><span class="spinner"></span><p>Generando estadísticas...</p></div>`;

    const filters = {
      mode: this.currentFilterMode
    };

    if (this.currentFilterMode === 'custom') {
      filters.startDate = document.getElementById('rep-date-start')?.value;
      filters.endDate = document.getElementById('rep-date-end')?.value;
    }

    try {
      this.reportData = await window.api.getReportes(filters);
      this.auxiliarData = await window.api.getAuxiliarMovimientos({ days: 15 });
      this.renderSubtab();
    } catch (err) {
      console.error('Error al generar reporte:', err);
      if (container) {
        container.innerHTML = `<div class="card empty-state text-danger"><p>Error al obtener reporte: ${err.message}</p></div>`;
      }
    }
  },

  renderSubtab() {
    const container = document.getElementById('rep-subtab-container');
    if (!container || !this.reportData) return;

    if (this.activeTab === 'resumen') {
      this.renderResumenEjecutivo(container);
    } else {
      this.renderKardex(container);
    }
  },

  renderResumenEjecutivo(container) {
    const { resumen, ventasPorDia, porCanal, productosMasVendidos, inventarioStockBajo } = this.reportData;

    container.innerHTML = `
      <!-- Tarjetas KPI -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-circle kpi-primary">
            ${window.App.Icons.cash()}
          </div>
          <div class="kpi-data">
            <span class="kpi-label">Ingresos Totales</span>
            <span class="kpi-value text-primary">${window.App.Utils.formatMoney(resumen.totalIngresos)}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle kpi-success">
            ${window.App.Icons.cart()}
          </div>
          <div class="kpi-data">
            <span class="kpi-label">Ventas Registradas</span>
            <span class="kpi-value">${resumen.ventas} transacciones</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle kpi-amber">
            ${window.App.Icons.bread()}
          </div>
          <div class="kpi-data">
            <span class="kpi-label">Piezas de Pan Vendidas</span>
            <span class="kpi-value">${resumen.articulosVendidos} pzs</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle kpi-danger">
            ${window.App.Icons.alert()}
          </div>
          <div class="kpi-data">
            <span class="kpi-label">Bolillo &amp; Stock Mínimo</span>
            <span class="kpi-value">${resumen.bolilloPiezas} bolillos (${resumen.bolilloKilosEstimados} kg)</span>
            <span class="text-xs ${resumen.productosStockBajo > 0 ? 'text-danger font-semibold' : 'text-muted'}">${resumen.productosStockBajo} productos con stock crítico</span>
          </div>
        </div>
      </div>

      <!-- Ventas por Canal y Días -->
      <div class="dashboard-columns mt-4">
        <div class="card">
          <h3 class="card-subtitle-bold">${window.App.Icons.pos()} Ventas por Canal</h3>
          <div class="channel-distribution-grid mt-3">
            ${porCanal.map(c => `
              <div class="channel-metric-box">
                <span class="channel-name">${c.canal === 'CajaEmpleado' ? 'Caja Empleado' : c.canal === 'Autocobro' ? 'Autocobro Cliente' : 'Sin Clasificar'}</span>
                <span class="channel-total">${window.App.Utils.formatMoney(c.total)}</span>
                <span class="channel-count">${c.ventas} tickets</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <h3 class="card-subtitle-bold">${window.App.Icons.bread()} Panes Más Vendidos</h3>
          <table class="data-table mt-2">
            <thead>
              <tr><th>Producto</th><th>Piezas</th><th>Total ($)</th></tr>
            </thead>
            <tbody>
              ${productosMasVendidos.slice(0, 6).map(p => `
                <tr>
                  <td class="font-semibold">${window.App.Utils.escapeHtml(p.producto)}</td>
                  <td><strong>${p.cantidadVendida}</strong> pzs</td>
                  <td class="font-mono">${window.App.Utils.formatMoney(p.importe)}</td>
                </tr>
              `).join('')}
              ${!productosMasVendidos.length ? '<tr><td colspan="3" class="text-center text-muted">Sin ventas registradas en el periodo</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla Diaria de Ventas -->
      <div class="card mt-4">
        <h3 class="card-subtitle-bold">${window.App.Icons.chart()} Desglose de Ventas por Día</h3>
        <div class="table-responsive mt-3">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Transacciones</th>
                <th>Venta Autocobro</th>
                <th>Venta Caja Mostrador</th>
                <th>Ingreso Total</th>
              </tr>
            </thead>
            <tbody>
              ${ventasPorDia.map(d => `
                <tr>
                  <td class="font-mono font-semibold">${d.fecha}</td>
                  <td>${d.ventas}</td>
                  <td>${window.App.Utils.formatMoney(d.autocobro)}</td>
                  <td>${window.App.Utils.formatMoney(d.cajaEmpleado)}</td>
                  <td class="font-bold text-success">${window.App.Utils.formatMoney(d.total)}</td>
                </tr>
              `).join('')}
              ${!ventasPorDia.length ? '<tr><td colspan="5" class="text-center text-muted">Sin datos diarios para este periodo</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderKardex(container) {
    container.innerHTML = `
      <div class="card">
        <h3 class="card-subtitle-bold">${window.App.Icons.box()} Auxiliar de Movimientos de Inventario (Últimos 15 días)</h3>
        <p class="text-secondary text-sm mb-3">Auditoría completa de todas las entradas por recepción de proveedores, salidas por ventas en caja y reintegros por devoluciones.</p>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              ${this.auxiliarData.map((m) => {
                const isEntrada = m.TipoMovimiento === 'Entrada';
                return `
                  <tr>
                    <td class="font-mono text-secondary text-xs">${window.App.Utils.formatDate(m.FechaMovimiento)}</td>
                    <td class="font-semibold">${window.App.Utils.escapeHtml(m.Producto)}</td>
                    <td>
                      <span class="badge ${isEntrada ? 'badge-success' : 'badge-danger'}">
                        ${isEntrada ? '+ Entrada' : '- Salida'}
                      </span>
                    </td>
                    <td class="font-mono font-bold ${isEntrada ? 'text-success' : 'text-danger'}">
                      ${isEntrada ? `+${m.Cantidad}` : `-${m.Cantidad}`}
                    </td>
                    <td>${window.App.Utils.escapeHtml(m.Motivo || '-')}</td>
                    <td class="text-xs font-mono">
                      ${m.NumeroRecepcion ? `Recepción ${m.NumeroRecepcion}` : m.IdVenta ? `Venta #${m.IdVenta}` : m.TipoReferencia || '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
              ${!this.auxiliarData.length ? '<tr><td colspan="6" class="text-center text-muted py-4">No hay movimientos registrados en el auxiliar.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportReportCSV() {
    if (!this.reportData) return;
    const { ventas, range } = this.reportData;

    const headers = ['ID Venta', 'Fecha', 'Canal', 'Empleado', 'Cliente', 'Subtotal', 'IVA', 'Total'];
    const rows = ventas.map(v => [
      v.IdVenta,
      v.FechaVenta,
      v.Canal,
      v.EmpleadoNombre || 'Autocobro',
      v.ClienteNombre || 'Público General',
      v.Subtotal,
      v.Iva,
      v.Total
    ]);

    const filename = `Reporte_DulceHorno_${range.start.slice(0, 10)}_al_${range.end.slice(0, 10)}.csv`;
    window.App.Utils.downloadCSV(filename, rows, headers);
    window.App.UI.showToast(`Reporte exportado como ${filename}`, 'success');
  }
};

