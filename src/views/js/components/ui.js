// Componentes UI reutilizables: Modales, Toasts, Cobro Rápido, Ticket y Autorización
window.App = window.App || {};

window.App.UI = {
  ensureContainers() {
    if (!document.getElementById('app-modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'app-modal-root';
      document.body.appendChild(modalRoot);
    }

    if (!document.getElementById('app-toast-container')) {
      const toastRoot = document.createElement('div');
      toastRoot.id = 'app-toast-container';
      document.body.appendChild(toastRoot);
    }
  },

  showToast(message, type = 'info', duration = 3500) {
    this.ensureContainers();
    const container = document.getElementById('app-toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
      success: window.App.Icons.check(),
      error: window.App.Icons.alert(),
      warning: window.App.Icons.alert(),
      info: window.App.Icons.bread()
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-message">${window.App.Utils.escapeHtml(message)}</div>
      <button class="toast-close" aria-label="Cerrar">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  },

  showModal({
    title = 'Atención',
    message = '',
    html = '',
    type = 'info',
    showCancel = false,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  }) {
    this.ensureContainers();
    const root = document.getElementById('app-modal-root');

    return new Promise((resolve) => {
      const typeIcons = {
        success: window.App.Icons.check(),
        error: window.App.Icons.x(),
        warning: window.App.Icons.alert(),
        info: window.App.Icons.bread()
      };

      root.innerHTML = `
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card modal-${type} animate-pop-in" role="dialog">
            <div class="modal-header">
              <div class="modal-icon-badge modal-badge-${type}">
                ${typeIcons[type] || typeIcons.info}
              </div>
              <h3 class="modal-title">${window.App.Utils.escapeHtml(title)}</h3>
              <button class="modal-close-btn" id="modal-btn-x">&times;</button>
            </div>
            <div class="modal-body">
              ${html ? html : `<p class="modal-text">${window.App.Utils.escapeHtml(message).replace(/\n/g, '<br>')}</p>`}
            </div>
            <div class="modal-footer">
              ${showCancel ? `<button id="modal-btn-cancel" class="btn btn-secondary">${window.App.Utils.escapeHtml(cancelText)}</button>` : ''}
              <button id="modal-btn-confirm" class="btn btn-primary btn-${type}">${window.App.Utils.escapeHtml(confirmText)}</button>
            </div>
          </div>
        </div>
      `;

      const cleanup = (result) => {
        root.innerHTML = '';
        resolve(result);
      };

      document.getElementById('modal-btn-confirm').addEventListener('click', () => cleanup(true));
      document.getElementById('modal-btn-x').addEventListener('click', () => cleanup(false));
      if (showCancel) {
        document.getElementById('modal-btn-cancel').addEventListener('click', () => cleanup(false));
      }
    });
  },

  // Modal moderno de cobro en caja con calculadora de cambio y billetes rápidos
  showPaymentModal({ total = 0, isSelfCheckout = false }) {
    this.ensureContainers();
    const root = document.getElementById('app-modal-root');

    return new Promise((resolve) => {
      const formattedTotal = window.App.Utils.formatMoney(total);

      root.innerHTML = `
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card payment-modal-card animate-pop-in" role="dialog">
            <div class="modal-header">
              <div class="modal-icon-badge modal-badge-success">
                ${window.App.Icons.cash()}
              </div>
              <div>
                <h3 class="modal-title">${isSelfCheckout ? 'Confirmar Compra' : 'Cobro de Venta'}</h3>
                <p class="modal-subtitle">Total a pagar: <strong class="highlight-total">${formattedTotal}</strong></p>
              </div>
              <button class="modal-close-btn" id="pay-btn-close">&times;</button>
            </div>

            <div class="modal-body payment-body">
              ${isSelfCheckout ? `
                <div class="self-checkout-info">
                  <p>Por favor, revisa tus productos antes de finalizar la transacción.</p>
                  <div class="customer-data-box">
                    <label class="form-label">Tu nombre (opcional para ticket):</label>
                    <input type="text" id="pay-client-name" class="form-control" placeholder="Ej. Juan Pérez">
                  </div>
                </div>
              ` : `
                <div class="cashier-payment-grid">
                  <div class="form-group">
                    <label class="form-label">Efectivo Recibido:</label>
                    <div class="input-with-symbol">
                      <span class="currency-symbol">$</span>
                      <input type="number" id="pay-amount-received" class="form-control input-lg" step="0.5" min="0" placeholder="0.00" autofocus>
                    </div>
                  </div>

                  <div class="quick-cash-buttons">
                    <button class="btn btn-outline quick-cash-btn" data-val="${Math.ceil(total)}">Exacto ($${Math.ceil(total)})</button>
                    <button class="btn btn-outline quick-cash-btn" data-val="50">$50</button>
                    <button class="btn btn-outline quick-cash-btn" data-val="100">$100</button>
                    <button class="btn btn-outline quick-cash-btn" data-val="200">$200</button>
                    <button class="btn btn-outline quick-cash-btn" data-val="500">$500</button>
                    <button class="btn btn-outline quick-cash-btn" data-val="1000">$1000</button>
                  </div>

                  <div class="change-display-box" id="pay-change-box">
                    <span class="change-label">Cambio:</span>
                    <span class="change-amount" id="pay-change-val">$0.00</span>
                  </div>
                </div>
              `}
            </div>

            <div class="modal-footer">
              <button id="pay-btn-cancel" class="btn btn-secondary">Cancelar</button>
              <button id="pay-btn-confirm" class="btn btn-success btn-lg">
                ${window.App.Icons.check()}
                <span>Finalizar y Cobrar</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const inputReceived = document.getElementById('pay-amount-received');
      const changeVal = document.getElementById('pay-change-val');
      const changeBox = document.getElementById('pay-change-box');
      const confirmBtn = document.getElementById('pay-btn-confirm');

      const updateChange = () => {
        if (!inputReceived) return;
        const received = parseFloat(inputReceived.value) || 0;
        const change = received - total;

        if (change >= 0) {
          changeVal.textContent = window.App.Utils.formatMoney(change);
          changeBox.classList.remove('insufficient-funds');
          changeBox.classList.add('sufficient-funds');
          confirmBtn.disabled = false;
        } else {
          changeVal.textContent = `Faltan ${window.App.Utils.formatMoney(Math.abs(change))}`;
          changeBox.classList.remove('sufficient-funds');
          changeBox.classList.add('insufficient-funds');
          confirmBtn.disabled = true;
        }
      };

      if (inputReceived) {
        inputReceived.addEventListener('input', updateChange);
        document.querySelectorAll('.quick-cash-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            inputReceived.value = btn.dataset.val;
            updateChange();
            inputReceived.focus();
          });
        });

        // Por defecto pre-cargar monto exacto
        inputReceived.value = total.toFixed(2);
        updateChange();
      }

      const cleanup = (result) => {
        root.innerHTML = '';
        resolve(result);
      };

      document.getElementById('pay-btn-close').addEventListener('click', () => cleanup(null));
      document.getElementById('pay-btn-cancel').addEventListener('click', () => cleanup(null));

      confirmBtn.addEventListener('click', () => {
        const received = inputReceived ? parseFloat(inputReceived.value) || total : total;
        const clientNameInput = document.getElementById('pay-client-name');
        const clientName = clientNameInput ? clientNameInput.value.trim() : null;

        cleanup({
          confirmed: true,
          received,
          change: Math.max(0, received - total),
          clientName
        });
      });
    });
  },

  // Ticket de compra moderno tipo térmico
  showTicketModal({ idVenta, canal, total, items = [], isClient = false }) {
    this.ensureContainers();
    const root = document.getElementById('app-modal-root');
    const fecha = new Date().toLocaleString('es-MX');

    const itemsRows = items.map((item) => `
      <tr>
        <td class="ticket-td-prod">${window.App.Utils.escapeHtml(item.nombre)}</td>
        <td class="ticket-td-center">${item.cantidad}</td>
        <td class="ticket-td-right">${window.App.Utils.formatMoney(item.precio)}</td>
        <td class="ticket-td-right font-semibold">${window.App.Utils.formatMoney(item.cantidad * item.precio)}</td>
      </tr>
    `).join('');

    root.innerHTML = `
      <div class="modal-backdrop animate-fade-in">
        <div class="modal-card ticket-card animate-pop-in">
          <div class="receipt-paper" id="printable-ticket">
            <div class="receipt-header">
              <div class="receipt-logo">${window.App.Icons.logoSvg(48)}</div>
              <h2 class="receipt-store-name">DULCE HORNO</h2>
              <p class="receipt-store-sub">Panadería &amp; Repostería Artesanal</p>
              <div class="receipt-divider">--------------------------------</div>
              <p class="receipt-meta-line"><strong>${isClient ? 'TICKET DE COMPRA' : 'COMPROBANTE DE VENTA'}</strong></p>
              <p class="receipt-meta-line">Folio: #${idVenta} &bull; Canal: ${canal}</p>
              <p class="receipt-meta-line">${fecha}</p>
              <div class="receipt-divider">--------------------------------</div>
            </div>

            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="ticket-td-prod">Art.</th>
                  <th class="ticket-td-center">Cant</th>
                  <th class="ticket-td-right">P.U.</th>
                  <th class="ticket-td-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="receipt-divider">--------------------------------</div>
            <div class="receipt-totals">
              <div class="receipt-total-row final-total">
                <span>TOTAL:</span>
                <span>${window.App.Utils.formatMoney(total)}</span>
              </div>
            </div>
            <div class="receipt-divider">--------------------------------</div>

            <div class="receipt-footer">
              <p>¡Gracias por elegir Dulce Horno!</p>
              <p>Conserve este ticket para devoluciones o aclaraciones.</p>
            </div>
          </div>

          <div class="ticket-actions">
            <button id="ticket-btn-close" class="btn btn-secondary">Cerrar</button>
            <button id="ticket-btn-print" class="btn btn-primary">
              ${window.App.Icons.printer()}
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ticket-btn-close').addEventListener('click', () => {
      root.innerHTML = '';
    });

    document.getElementById('ticket-btn-print').addEventListener('click', () => {
      window.print();
    });
  },

  // Modal de autorización de Gerente (para cortes de turno y operaciones críticas)
  showManagerAuthModal({ title = 'Autorización Requerida', reason = 'Esta operación requiere confirmación de un Gerente.' }) {
    this.ensureContainers();
    const root = document.getElementById('app-modal-root');

    return new Promise((resolve) => {
      root.innerHTML = `
        <div class="modal-backdrop animate-fade-in">
          <div class="modal-card auth-modal-card animate-pop-in">
            <div class="modal-header">
              <div class="modal-icon-badge modal-badge-warning">
                ${window.App.Icons.lock()}
              </div>
              <div>
                <h3 class="modal-title">${window.App.Utils.escapeHtml(title)}</h3>
                <p class="modal-subtitle">${window.App.Utils.escapeHtml(reason)}</p>
              </div>
              <button class="modal-close-btn" id="auth-btn-x">&times;</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Usuario Gerente:</label>
                <input type="text" id="auth-manager-user" class="form-control" placeholder="gerente_usuario" autocomplete="off" autofocus>
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña:</label>
                <input type="password" id="auth-manager-pass" class="form-control" placeholder="••••••••">
              </div>
              <div id="auth-error-msg" class="text-danger-msg" style="display: none;"></div>
            </div>

            <div class="modal-footer">
              <button id="auth-btn-cancel" class="btn btn-secondary">Cancelar</button>
              <button id="auth-btn-confirm" class="btn btn-primary btn-warning">
                ${window.App.Icons.key()}
                <span>Autorizar</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const cleanup = (res) => {
        root.innerHTML = '';
        resolve(res);
      };

      document.getElementById('auth-btn-x').addEventListener('click', () => cleanup(null));
      document.getElementById('auth-btn-cancel').addEventListener('click', () => cleanup(null));

      document.getElementById('auth-btn-confirm').addEventListener('click', () => {
        const username = document.getElementById('auth-manager-user').value.trim();
        const password = document.getElementById('auth-manager-pass').value;
        const errDiv = document.getElementById('auth-error-msg');

        if (!username || !password) {
          errDiv.textContent = 'Por favor ingresa usuario y contraseña.';
          errDiv.style.display = 'block';
          return;
        }

        cleanup({ username, password });
      });
    });
  }
};

