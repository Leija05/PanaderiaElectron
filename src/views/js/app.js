// Controlador Principal, Router y Shell de Navegación
window.App = window.App || {};

window.App.Router = {
  currentPage: 'login',

  navigate(page, options = {}) {
    const user = window.App.State.user;
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Si no hay usuario y no es login, redirigir a login
    if (!user && page !== 'login') {
      this.navigate('login');
      return;
    }

    this.currentPage = page;
    window.App.State.currentPage = page;

    if (page === 'login') {
      appContainer.innerHTML = '';
      window.App.Views.Login.render(appContainer);
      return;
    }

    // Renderizar Shell con Navbar y Contenedor de Vista
    this.renderShell(appContainer);
    const viewContainer = document.getElementById('view-content-root');
    if (!viewContainer) return;

    // Renderizar vista correspondiente
    switch (page) {
      case 'ventas':
        window.App.Views.POS.render(viewContainer, { isClient: false });
        break;
      case 'compras':
        window.App.Views.POS.render(viewContainer, { isClient: true });
        break;
      case 'inventario':
        window.App.Views.Inventario.render(viewContainer);
        break;
      case 'personal':
        window.App.Views.Personal.render(viewContainer);
        break;
      case 'clientes':
        window.App.Views.Clientes.render(viewContainer);
        break;
      case 'proveedores':
        window.App.Views.Proveedores.render(viewContainer);
        break;
      case 'reportes':
        window.App.Views.Reportes.render(viewContainer);
        break;
      case 'cortes':
        window.App.Views.Cortes.render(viewContainer);
        break;
      case 'programador':
        window.App.Views.Programador.render(viewContainer);
        break;
      default:
        window.App.Views.POS.render(viewContainer, { isClient: user?.Rol === 'Cliente' });
    }
  },

  renderShell(container) {
    const user = window.App.State.user;
    const role = user?.Rol || 'Empleado';

    // Definición de enlaces de navegación según permisos de rol
    const navItems = [];

    if (role === 'Cliente') {
      navItems.push({ id: 'compras', label: 'Catálogo de Panes', icon: window.App.Icons.bread() });
      navItems.push({ id: 'clientes', label: 'Mis Compras', icon: window.App.Icons.user() });
    } else if (role === 'Empleado') {
      navItems.push({ id: 'ventas', label: 'Caja Mostrador', icon: window.App.Icons.pos() });
      navItems.push({ id: 'inventario', label: 'Inventario', icon: window.App.Icons.box() });
      navItems.push({ id: 'reportes', label: 'Reportes', icon: window.App.Icons.chart() });
      navItems.push({ id: 'clientes', label: 'Clientes', icon: window.App.Icons.user() });
      navItems.push({ id: 'cortes', label: 'Corte de Caja', icon: window.App.Icons.cut() });
    } else if (role === 'Gerente') {
      navItems.push({ id: 'ventas', label: 'Caja POS', icon: window.App.Icons.pos() });
      navItems.push({ id: 'inventario', label: 'Inventario', icon: window.App.Icons.box() });
      navItems.push({ id: 'reportes', label: 'Reportes', icon: window.App.Icons.chart() });
      navItems.push({ id: 'personal', label: 'Personal', icon: window.App.Icons.users() });
      navItems.push({ id: 'clientes', label: 'Clientes', icon: window.App.Icons.user() });
      navItems.push({ id: 'proveedores', label: 'Proveedores', icon: window.App.Icons.truck() });
      navItems.push({ id: 'cortes', label: 'Cortes', icon: window.App.Icons.cut() });
    } else if (role === 'Programador') {
      navItems.push({ id: 'programador', label: 'Herramientas SP', icon: window.App.Icons.code() });
      navItems.push({ id: 'ventas', label: 'Probar Caja', icon: window.App.Icons.pos() });
      navItems.push({ id: 'inventario', label: 'Inventario', icon: window.App.Icons.box() });
      navItems.push({ id: 'reportes', label: 'Reportes', icon: window.App.Icons.chart() });
      navItems.push({ id: 'personal', label: 'Personal', icon: window.App.Icons.users() });
    }

    const navLinksHtml = navItems.map((item) => {
      const isActive = this.currentPage === item.id;
      return `
        <button class="nav-item-btn ${isActive ? 'active' : ''}" data-nav="${item.id}">
          <span class="nav-btn-icon">${item.icon}</span>
          <span class="nav-btn-text">${item.label}</span>
        </button>
      `;
    }).join('');

    const currentTheme = window.App.State.theme;

    // Si ya existe el shell, solo actualizamos los botones activos
    const existingShell = document.getElementById('app-shell-navbar');
    if (existingShell) {
      existingShell.querySelectorAll('.nav-item-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.nav === this.currentPage);
      });
      return;
    }

    container.innerHTML = `
      <div class="app-layout">
        <!-- Barra de Navegación Superior -->
        <header class="app-navbar" id="app-shell-navbar">
          <div class="navbar-brand-section">
            <div class="navbar-brand-logo">
              ${window.App.Icons.logoSvg(38)}
            </div>
            <div>
              <h1 class="navbar-brand-title">Dulce Horno</h1>
              <span class="navbar-role-pill role-${role.toLowerCase()}">${role}</span>
            </div>
          </div>

          <!-- Enlaces Centrales -->
          <nav class="navbar-nav-links">
            ${navLinksHtml}
          </nav>

          <!-- Acciones de Usuario y Tema -->
          <div class="navbar-user-section">
            <button id="btn-toggle-theme" class="theme-toggle-btn" title="Alternar tema Claro / Oscuro">
              ${currentTheme === 'dark' ? window.App.Icons.sun() : window.App.Icons.moon()}
            </button>

            <div class="user-profile-badge">
              <span class="user-avatar-circle">${(user?.NombreCompleto || user?.NombreUsuario || 'U').charAt(0).toUpperCase()}</span>
              <span class="user-display-name">${window.App.Utils.escapeHtml(user?.NombreCompleto || user?.NombreUsuario)}</span>
            </div>

            <button id="btn-logout" class="btn-logout" title="Cerrar Sesión">
              ${window.App.Icons.logout()}
            </button>
          </div>
        </header>

        <!-- Banner de Actualización (si aplica) -->
        <div id="app-updater-banner" class="updater-banner" style="display: none;"></div>

        <!-- Contenedor Principal de Vistas -->
        <main class="app-main-viewport" id="view-content-root">
          <!-- Vista inyectada aquí -->
        </main>
      </div>
    `;

    // Listeners de la barra de navegación
    container.querySelectorAll('.nav-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        this.navigate(target);
      });
    });

    // Alternar tema
    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
      const nextTheme = window.App.State.toggleTheme();
      const themeBtn = document.getElementById('btn-toggle-theme');
      if (themeBtn) {
        themeBtn.innerHTML = nextTheme === 'dark' ? window.App.Icons.sun() : window.App.Icons.moon();
      }
    });

    // Cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', async () => {
      const confirm = await window.App.UI.showModal({
        title: 'Cerrar Sesión',
        message: '¿Estás seguro de que deseas salir del sistema?',
        showCancel: true,
        confirmText: 'Salir'
      });

      if (confirm) {
        window.App.State.setUser(null);
        this.navigate('login');
        window.App.UI.showToast('Sesión cerrada.', 'info');
      }
    });

    this.checkUpdaterBanner();
  },

  checkUpdaterBanner() {
    const banner = document.getElementById('app-updater-banner');
    if (!banner) return;

    if (window.api && typeof window.api.onUpdateStatus === 'function') {
      window.api.onUpdateStatus((status) => {
        window.App.State.updateStatus = status;
        if (status && status.status === 'downloading') {
          banner.style.display = 'flex';
          banner.innerHTML = `
            <span>Descargando actualización obligatoria: <strong>${status.progressPercent.toFixed(1)}%</strong></span>
          `;
        } else if (status && status.status === 'pending_install') {
          banner.style.display = 'flex';
          banner.innerHTML = `
            <span>Actualización ${status.version} lista para instalarse.</span>
            <button class="btn btn-sm btn-primary ml-3" onclick="window.api.installPendingUpdate()">Reiniciar ahora</button>
          `;
        } else {
          banner.style.display = 'none';
        }
      });
    }
  }
};

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.App.State.initTheme();
  window.App.UI.ensureContainers();

  const user = window.App.State.loadStoredUser();
  if (user) {
    if (user.Rol === 'Cliente') {
      window.App.Router.navigate('compras');
    } else if (user.Rol === 'Programador') {
      window.App.Router.navigate('programador');
    } else {
      window.App.Router.navigate('ventas');
    }
  } else {
    window.App.Router.navigate('login');
  }
});
