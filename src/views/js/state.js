// Estado reactivo y utilidades compartidas
window.App = window.App || {};

window.App.State = {
  user: null,
  cart: [],
  currentPage: 'login',
  theme: localStorage.getItem('panaderia-tema') || 'light',
  products: [],
  categories: [],
  updateStatus: null,
  listeners: [],

  BOLILLO_WEIGHT_KG: 0.065,

  initTheme() {
    if (this.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('panaderia-tema', this.theme);
    this.initTheme();
    this.notify();
    return this.theme;
  },

  setUser(user) {
    this.user = user;
    if (user) {
      sessionStorage.setItem('panaderia-user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('panaderia-user');
      this.cart = [];
    }
    this.notify();
  },

  loadStoredUser() {
    try {
      const stored = sessionStorage.getItem('panaderia-user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('No se pudo restaurar usuario de sesión:', e);
    }
    return this.user;
  },

  // Carrito de compras para el POS
  addToCart(product, quantity = 1) {
    const existing = this.cart.find((item) => item.id === product.IdArticulo);
    const maxAvailable = Number(product.Cantidad || 0);

    if (existing) {
      const nextQty = existing.cantidad + quantity;
      if (nextQty > maxAvailable) {
        throw new Error(`Existencia máxima alcanzada para ${product.Nombre} (${maxAvailable} disponibles).`);
      }
      existing.cantidad = nextQty;
    } else {
      if (quantity > maxAvailable) {
        throw new Error(`Solo hay ${maxAvailable} unidades disponibles de ${product.Nombre}.`);
      }
      this.cart.push({
        id: product.IdArticulo,
        nombre: product.Nombre,
        precio: Number(product.PrecioVenta || 0),
        cantidad: quantity,
        max: maxAvailable
      });
    }
    this.notify();
  },

  updateCartQuantity(productId, quantity) {
    const item = this.cart.find((i) => i.id === productId);
    if (!item) return;

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (quantity > item.max) {
      throw new Error(`Solo hay ${item.max} unidades disponibles.`);
    }

    item.cantidad = quantity;
    this.notify();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter((i) => i.id !== productId);
    this.notify();
  },

  clearCart() {
    this.cart = [];
    this.notify();
  },

  getCartTotals() {
    const subtotal = this.cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const count = this.cart.reduce((acc, item) => acc + item.cantidad, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      count
    };
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this);
      } catch (err) {
        console.error('Error en listener de estado:', err);
      }
    });
  }
};

window.App.Utils = {
  formatMoney(value) {
    const num = Number(value || 0);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  },

  formatDate(dateVal) {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatBytes(bytes = 0) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, idx);
    return `${val.toFixed(1)} ${units[idx]}`;
  },

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  downloadCSV(filename, rows, headers) {
    const escapeCsvCell = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
    };

    const headerLine = headers.map(escapeCsvCell).join(',');
    const dataLines = rows.map((r) => r.map(escapeCsvCell).join(',')).join('\n');
    const content = `\uFEFF${headerLine}\n${dataLines}`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

