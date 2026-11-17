// Vista Punto de Venta (POS) - Caja de Mostrador y Autocobro de Cliente
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.POS = {
  products: [],
  selectedCategory: 'all',
  searchQuery: '',

  async render(container, { isClient = false } = {}) {
    const user = window.App.State.user;
    const isSelfCheckout = isClient || user?.Rol === 'Cliente';

    container.innerHTML = `
      <div class="pos-layout animate-fade-in">
        <!-- Columna Izquierda: Catálogo de Productos -->
        <div class="pos-catalog-column">
          <!-- Barra de Búsqueda y Herramientas -->
          <div class="pos-toolbar">
            <div class="pos-search-wrapper">
              <span class="pos-search-icon">${window.App.Icons.search()}</span>
              <input type="text" id="pos-search-input" class="pos-search-input" placeholder="Buscar pan por nombre o código... (Ctrl+F)" autofocus>
              <button id="pos-search-clear" class="btn-clear-search" style="display: none;">&times;</button>
            </div>

            <!-- Calculadora rápida de bolillo por peso (si aplica) -->
            <button id="btn-bolillo-calc" class="btn btn-outline btn-sm tool-btn" title="Calcular piezas de bolillo por peso">
              ${window.App.Icons.scale()}
              <span>Báscula Bolillo</span>
            </button>
          </div>

          <!-- Filtros de Categoría -->
          <div class="pos-categories-scroll" id="pos-categories-container">
            <button class="pos-category-pill active" data-cat="all">Todos los Panes</button>
            <button class="pos-category-pill" data-cat="pan-dulce">Pan Dulce</button>
            <button class="pos-category-pill" data-cat="pan-blanco">Pan Blanco &amp; Bolillos</button>
            <button class="pos-category-pill" data-cat="reposteria">Repostería</button>
          </div>

          <!-- Cuadrícula de Productos -->
          <div class="pos-products-grid" id="pos-products-grid">
            <div class="loading-state">
              <span class="spinner"></span>
              <p>Cargando productos...</p>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Comanda / Ticket Activo -->
        <div class="pos-cart-column">
          <div class="pos-cart-header">
            <div class="cart-title-row">
              <h2 class="pos-cart-title">
                ${window.App.Icons.cart()}
                <span>${isSelfCheckout ? 'Tu Canasta' : 'Ticket de Venta'}</span>
              </h2>
              <button id="pos-clear-cart" class="btn-text-danger" title="Vaciar canasta">Vaciar</button>
            </div>
            <div class="cart-meta-info">
              <span class="cart-mode-badge ${isSelfCheckout ? 'badge-client' : 'badge-cashier'}">
                ${isSelfCheckout ? 'Modo Autocobro' : `Caja: ${user?.NombreCompleto || user?.NombreUsuario}`}
              </span>
            </div>
          </div>

          <!-- Lista de Items en Carrito -->
          <div class="pos-cart-items-container" id="pos-cart-items">
            <!-- Se llena dinámicamente -->
          </div>

          <!-- Resumen y Botón de Cobro -->
          <div class="pos-cart-footer">
            <div class="pos-summary-table">
              <div class="pos-summary-row">
                <span>Subtotal:</span>
                <span id="pos-subtotal">$0.00</span>
              </div>
              <div class="pos-summary-row">
                <span>IVA (16%):</span>
                <span id="pos-iva">$0.00</span>
              </div>
              <div class="pos-summary-row total-row">
                <span>TOTAL:</span>
                <span id="pos-total">$0.00</span>
              </div>
            </div>

            <button id="pos-btn-checkout" class="btn btn-success btn-block btn-checkout" disabled>
              <div class="checkout-content">
                <span class="checkout-label">COBRAR (F2)</span>
                <span class="checkout-total" id="pos-btn-checkout-total">$0.00</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;

    // Cargar productos desde base de datos
    await this.loadProducts();

    // Eventos de búsqueda y filtros
    const searchInput = document.getElementById('pos-search-input');
    const searchClear = document.getElementById('pos-search-clear');

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      searchClear.style.display = this.searchQuery ? 'block' : 'none';
      this.renderProductsGrid();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      searchClear.style.display = 'none';
      searchInput.focus();
      this.renderProductsGrid();
    });

    // Filtros de categoría
    container.querySelectorAll('.pos-category-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.pos-category-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCategory = pill.dataset.cat;
        this.renderProductsGrid();
      });
    });

    // Vaciar canasta
    document.getElementById('pos-clear-cart').addEventListener('click', () => {
      if (window.App.State.cart.length > 0) {
        window.App.State.clearCart();
        window.App.UI.showToast('Canasta vaciada.', 'info');
      }
    });

    // Báscula rápida de bolillo
    document.getElementById('btn-bolillo-calc').addEventListener('click', () => {
      this.openBolilloCalculatorModal();
    });

    // Botón de Cobro
    document.getElementById('pos-btn-checkout').addEventListener('click', () => {
      this.executeCheckout(isSelfCheckout);
    });

    // Atajos de teclado en el POS (F2 para cobrar, Escape para limpiar/cerrar)
    this.keyHandler = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const checkoutBtn = document.getElementById('pos-btn-checkout');
        if (checkoutBtn && !checkoutBtn.disabled) {
          this.executeCheckout(isSelfCheckout);
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    // Renderizar carrito inicial y suscribirse a cambios de estado
    this.renderCart();
    this.unsubscribe = window.App.State.subscribe(() => {
      this.renderCart();
    });
  },

  async loadProducts() {
    try {
      this.products = await window.api.getProductos();
      window.App.State.products = this.products;
      this.renderProductsGrid();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      const grid = document.getElementById('pos-products-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            ${window.App.Icons.alert()}
            <p>No fue posible cargar el catálogo de productos.</p>
            <button class="btn btn-primary btn-sm" onclick="window.App.Views.POS.loadProducts()">Reintentar</button>
          </div>
        `;
      }
    }
  },

  renderProductsGrid() {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    let filtered = this.products.filter((p) => {
      if (!p.Activo) return false;
      const matchesSearch = !this.searchQuery ||
        p.Nombre.toLowerCase().includes(this.searchQuery) ||
        (p.Descripcion && p.Descripcion.toLowerCase().includes(this.searchQuery));

      if (!matchesSearch) return false;

      if (this.selectedCategory === 'pan-blanco') {
        return /bolillo|telera|baguette|francés|virote/i.test(p.Nombre);
      }
      if (this.selectedCategory === 'pan-dulce') {
        return /concha|cuerno|dona|oreja|margarita|rebanada|choux/i.test(p.Nombre);
      }
      if (this.selectedCategory === 'reposteria') {
        return /pastel|muffin|panqué|tarta|cheesecake/i.test(p.Nombre);
      }
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          ${window.App.Icons.bread()}
          <p>No se encontraron productos que coincidan con la búsqueda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((prod) => {
      const stock = Number(prod.Cantidad || 0);
      const isOutOfStock = stock <= 0;
      const isLowStock = stock > 0 && stock <= Number(prod.Minimo || 5);

      return `
        <div class="pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${prod.IdArticulo}">
          <div class="pos-product-header">
            <span class="stock-pill ${isOutOfStock ? 'pill-danger' : isLowStock ? 'pill-warning' : 'pill-success'}">
              ${isOutOfStock ? 'Agotado' : `${stock} disponibles`}
            </span>
          </div>

          <div class="pos-product-body">
            <h3 class="pos-product-name">${window.App.Utils.escapeHtml(prod.Nombre)}</h3>
            ${prod.Descripcion ? `<p class="pos-product-desc">${window.App.Utils.escapeHtml(prod.Descripcion)}</p>` : ''}
          </div>

          <div class="pos-product-footer">
            <div class="pos-product-price">${window.App.Utils.formatMoney(prod.PrecioVenta)}</div>
            <button class="pos-add-btn ${isOutOfStock ? 'disabled' : ''}" ${isOutOfStock ? 'disabled' : ''} aria-label="Agregar">
              ${window.App.Icons.plus()}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Eventos de clic para agregar al carrito
    grid.querySelectorAll('.pos-product-card:not(.out-of-stock)').forEach((card) => {
      card.addEventListener('click', (e) => {
        const prodId = parseInt(card.dataset.id, 10);
        const prod = this.products.find((p) => p.IdArticulo === prodId);
        if (prod) {
          try {
            window.App.State.addToCart(prod, 1);
            // Efecto sutil de animación
            card.classList.add('card-pressed');
            setTimeout(() => card.classList.remove('card-pressed'), 150);
          } catch (err) {
            window.App.UI.showToast(err.message, 'warning');
          }
        }
      });
    });
  },

  renderCart() {
    const itemsContainer = document.getElementById('pos-cart-items');
    const subtotalEl = document.getElementById('pos-subtotal');
    const ivaEl = document.getElementById('pos-iva');
    const totalEl = document.getElementById('pos-total');
    const btnCheckout = document.getElementById('pos-btn-checkout');
    const btnTotal = document.getElementById('pos-btn-checkout-total');

    if (!itemsContainer) return;

    const cart = window.App.State.cart;
    const totals = window.App.State.getCartTotals();

    subtotalEl.textContent = window.App.Utils.formatMoney(totals.subtotal);
    ivaEl.textContent = window.App.Utils.formatMoney(totals.iva);
    totalEl.textContent = window.App.Utils.formatMoney(totals.total);
    btnTotal.textContent = window.App.Utils.formatMoney(totals.total);

    if (cart.length === 0) {
      btnCheckout.disabled = true;
      itemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">${window.App.Icons.cart()}</div>
          <p class="cart-empty-title">Canasta vacía</p>
          <p class="cart-empty-sub">Toca cualquier pan del catálogo para agregarlo a la orden.</p>
        </div>
      `;
      return;
    }

    btnCheckout.disabled = false;

    itemsContainer.innerHTML = cart.map((item) => {
      const itemTotal = item.precio * item.cantidad;
      return `
        <div class="pos-cart-item animate-slide-in" data-id="${item.id}">
          <div class="cart-item-info">
            <h4 class="cart-item-name">${window.App.Utils.escapeHtml(item.nombre)}</h4>
            <div class="cart-item-unit-price">${window.App.Utils.formatMoney(item.precio)} c/u</div>
          </div>

          <div class="cart-item-controls">
            <button class="cart-qty-btn btn-qty-minus" aria-label="Disminuir">-</button>
            <span class="cart-qty-number">${item.cantidad}</span>
            <button class="cart-qty-btn btn-qty-plus" aria-label="Aumentar">+</button>
          </div>

          <div class="cart-item-total">
            ${window.App.Utils.formatMoney(itemTotal)}
          </div>

          <button class="cart-item-delete" aria-label="Eliminar artículo">
            ${window.App.Icons.trash()}
          </button>
        </div>
      `;
    }).join('');

    // Listeners de controles del carrito
    itemsContainer.querySelectorAll('.pos-cart-item').forEach((itemEl) => {
      const id = parseInt(itemEl.dataset.id, 10);
      const item = cart.find((i) => i.id === id);

      itemEl.querySelector('.btn-qty-minus').addEventListener('click', () => {
        window.App.State.updateCartQuantity(id, item.cantidad - 1);
      });

      itemEl.querySelector('.btn-qty-plus').addEventListener('click', () => {
        try {
          window.App.State.updateCartQuantity(id, item.cantidad + 1);
        } catch (err) {
          window.App.UI.showToast(err.message, 'warning');
        }
      });

      itemEl.querySelector('.cart-item-delete').addEventListener('click', () => {
        window.App.State.removeFromCart(id);
      });
    });
  },

  async executeCheckout(isSelfCheckout) {
    const cart = window.App.State.cart;
    if (!cart.length) return;

    const totals = window.App.State.getCartTotals();

    // Abrir modal de cobro y calculadora
    const paymentResult = await window.App.UI.showPaymentModal({
      total: totals.total,
      isSelfCheckout
    });

    if (!paymentResult || !paymentResult.confirmed) {
      return;
    }

    const user = window.App.State.user;
    const isEmployee = user && user.Rol === 'Empleado';
    const isGerente = user && user.Rol === 'Gerente';
    const idEmpleado = (isEmployee || isGerente) ? user.IdEmpleado : null;
    const canal = idEmpleado ? 'CajaEmpleado' : 'Autocobro';

    const payload = {
      idEmpleado,
      idCliente: user?.Rol === 'Cliente' ? user.IdEmpleado : null,
      canal,
      carrito: cart,
      datosCliente: paymentResult.clientName ? { nombre: paymentResult.clientName, genero: 'Prefiero no decir' } : null
    };

    try {
      const response = await window.api.registrarVenta(payload);

      if (response.success) {
        window.App.UI.showToast(`¡Venta #${response.idVenta} completada exitosamente!`, 'success');

        // Mostrar ticket para imprimir
        window.App.UI.showTicketModal({
          idVenta: response.idVenta,
          canal: response.canal,
          total: response.total,
          items: [...cart],
          isClient: isSelfCheckout
        });

        // Limpiar canasta y recargar inventario local
        window.App.State.clearCart();
        this.loadProducts();
      }
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      window.App.UI.showModal({
        title: 'Error al Registrar Venta',
        message: error.message || 'No se pudo guardar la venta en la base de datos.',
        type: 'error'
      });
    }
  },

  // Modal para calcular piezas de bolillo automáticamente según el peso en kg
  openBolilloCalculatorModal() {
    const bolillo = this.products.find((p) => /bolillo/i.test(p.Nombre));
    if (!bolillo) {
      window.App.UI.showToast('No se encontró el producto Bolillo en el catálogo.', 'warning');
      return;
    }

    const html = `
      <div class="bolillo-calc-box">
        <p class="calc-hint">Calcula la cantidad de bolillos automáticamente a partir del peso de la báscula (peso promedio: <strong>${(window.App.State.BOLILLO_WEIGHT_KG * 1000).toFixed(0)}g</strong> por pieza).</p>
        <div class="form-group">
          <label class="form-label">Peso total registrado en báscula (Kilogramos):</label>
          <div class="input-with-symbol">
            <input type="number" id="calc-bolillo-kg" class="form-control input-lg" step="0.05" min="0.05" placeholder="Ej. 0.65 kg" autofocus>
            <span class="currency-symbol">kg</span>
          </div>
        </div>

        <div class="calc-result-badge" id="calc-bolillo-result">
          <span class="calc-pieces" id="calc-pieces-val">0</span>
          <span class="calc-label">piezas calculadas</span>
        </div>
      </div>
    `;

    window.App.UI.showModal({
      title: 'Báscula de Bolillo',
      html,
      confirmText: 'Agregar al Carrito',
      showCancel: true
    }).then((confirmed) => {
      if (confirmed) {
        const kgInput = document.getElementById('calc-bolillo-kg');
        const kg = parseFloat(kgInput?.value) || 0;
        const pieces = Math.round(kg / window.App.State.BOLILLO_WEIGHT_KG);

        if (pieces > 0) {
          try {
            window.App.State.addToCart(bolillo, pieces);
            window.App.UI.showToast(`Se agregaron ${pieces} bolillos (${kg} kg) a la canasta.`, 'success');
          } catch (err) {
            window.App.UI.showToast(err.message, 'warning');
          }
        }
      }
    });

    // Auto calcular mientras escribe
    setTimeout(() => {
      const kgInput = document.getElementById('calc-bolillo-kg');
      const piecesVal = document.getElementById('calc-pieces-val');
      if (kgInput) {
        kgInput.addEventListener('input', () => {
          const kg = parseFloat(kgInput.value) || 0;
          const pieces = Math.round(kg / window.App.State.BOLILLO_WEIGHT_KG);
          piecesVal.textContent = pieces;
        });
      }
    }, 50);
  },

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
};

