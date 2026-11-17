// Vista de Cortes de Turno y Arqueo de Caja
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Cortes = {
  selectedChannel: 'CajaEmpleado',

  async render(container) {
    const user = window.App.State.user;

    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.cut()} Corte de Turno y Arqueo de Caja</h1>
            <p class="view-page-sub">Calcula el total de ingresos y ventas acumuladas desde el último corte de turno registrado.</p>
          </div>
        </div>

        <div class="card max-w-2xl mx-auto">
          <div class="corte-intro-box">
            <div class="corte-icon-banner">${window.App.Icons.cut()}</div>
            <h2 class="corte-box-title">Realizar Cierre de Turno</h2>
            <p class="corte-box-desc">
              Esta operación calcula todas las ventas efectuadas en el canal seleccionado desde el último arqueo, totaliza el efectivo y registra el corte formal en el sistema bajo autorización gerencial.
            </p>
          </div>

          <div class="form-group mt-4">
            <label class="form-label font-bold">Selecciona el Canal de Venta para el Corte:</label>
            <div class="channel-radio-group">
              <label class="channel-radio-card active" id="radio-caja">
                <input type="radio" name="corte-channel" value="CajaEmpleado" checked>
                <div class="channel-card-body">
                  <span class="channel-icon">${window.App.Icons.pos()}</span>
                  <span class="channel-title">Caja Mostrador (Empleado)</span>
                  <small class="text-secondary">Ventas atendidas por cajeros en mostrador</small>
                </div>
              </label>

              <label class="channel-radio-card" id="radio-auto">
                <input type="radio" name="corte-channel" value="Autocobro">
                <div class="channel-card-body">
                  <span class="channel-icon">${window.App.Icons.cart()}</span>
                  <span class="channel-title">Estación Autocobro</span>
                  <small class="text-secondary">Terminales de autoservicio de clientes</small>
                </div>
              </label>
            </div>
          </div>

          <div class="corte-action-footer mt-5">
            <button id="btn-execute-corte" class="btn btn-primary btn-block btn-lg">
              ${window.App.Icons.lock()}
              <span>Solicitar Autorización de Gerente y Cortar</span>
            </button>
          </div>

          <div id="corte-result-container" class="mt-4" style="display: none;"></div>
        </div>
      </div>
    `;

    const radioCaja = document.getElementById('radio-caja');
    const radioAuto = document.getElementById('radio-auto');

    radioCaja.addEventListener('click', () => {
      radioCaja.classList.add('active');
      radioAuto.classList.remove('active');
      this.selectedChannel = 'CajaEmpleado';
    });

    radioAuto.addEventListener('click', () => {
      radioAuto.classList.add('active');
      radioCaja.classList.remove('active');
      this.selectedChannel = 'Autocobro';
    });

    document.getElementById('btn-execute-corte').addEventListener('click', () => {
      this.processCorte();
    });
  },

  async processCorte() {
    const user = window.App.State.user;
    const isSelfCheckout = this.selectedChannel === 'Autocobro';

    // 1. Solicitar credenciales de gerente
    const auth = await window.App.UI.showManagerAuthModal({
      title: 'Autorización Gerencial de Corte',
      reason: `El cierre de turno para ${isSelfCheckout ? 'Autocobro' : 'Caja Mostrador'} requiere validación de un Gerente.`
    });

    if (!auth) return;

    const payload = {
      channel: this.selectedChannel,
      idEmpleado: isSelfCheckout ? null : (user?.IdEmpleado || null),
      gerenteUsuario: auth.username,
      gerentePassword: auth.password
    };

    try {
      const res = await window.api.registrarCorteTurno(payload);

      if (res.success) {
        window.App.UI.showToast(`¡Corte #${res.idCorte} registrado por ${res.autorizadoPor}!`, 'success');
        this.renderCorteSummary(res);
      }
    } catch (err) {
      console.error('Error al registrar corte:', err);
      window.App.UI.showModal({
        title: 'Error en Corte de Turno',
        message: err.message || 'No fue posible registrar el corte en el sistema.',
        type: 'error'
      });
    }
  },

  renderCorteSummary(corteData) {
    const container = document.getElementById('corte-result-container');
    if (!container) return;

    const { resumen, idCorte, autorizadoPor } = corteData;

    container.style.display = 'block';
    container.innerHTML = `
      <div class="corte-summary-card animate-pop-in">
        <div class="corte-summary-header">
          <div class="corte-check-icon">${window.App.Icons.check()}</div>
          <h3>Corte de Turno #${idCorte} Completado</h3>
          <p class="text-secondary text-sm">Autorizado por: <strong>${window.App.Utils.escapeHtml(autorizadoPor)}</strong></p>
        </div>

        <div class="corte-summary-metrics">
          <div class="summary-metric-item">
            <span class="metric-label">Periodo Evaluado:</span>
            <span class="metric-val text-xs font-mono">${resumen.fechaInicio} &bull; ${resumen.fechaFin}</span>
          </div>
          <div class="summary-metric-item">
            <span class="metric-label">Ventas Cobradas:</span>
            <span class="metric-val">${resumen.totalVentas} tickets</span>
          </div>
          <div class="summary-metric-item highlight">
            <span class="metric-label">Importe Total en Caja:</span>
            <span class="metric-val font-bold text-success">${window.App.Utils.formatMoney(resumen.totalImporte)}</span>
          </div>
        </div>

        <div class="corte-actions mt-3">
          <button id="btn-print-corte" class="btn btn-outline btn-block">
            ${window.App.Icons.printer()}
            <span>Imprimir Resumen de Corte</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-print-corte').addEventListener('click', () => {
      window.print();
    });
  }
};

