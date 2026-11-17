// Vista de Inicio de Sesión
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Login = {
  render(container) {
    container.innerHTML = `
      <div class="login-wrapper animate-fade-in">
        <div class="login-card animate-pop-in">
          <div class="login-brand">
            <div class="login-logo-circle">
              ${window.App.Icons.logoSvg(64)}
            </div>
            <h1 class="login-title">Dulce Horno</h1>
            <p class="login-subtitle">Sistema Punto de Venta &amp; Gestión de Panadería</p>
          </div>

          <form id="login-form" class="login-form" autocomplete="off">
            <div class="form-group">
              <label class="form-label" for="login-username">Usuario</label>
              <div class="input-icon-wrapper">
                <span class="input-icon">${window.App.Icons.user()}</span>
                <input type="text" id="login-username" class="form-control" placeholder="Ingresa tu usuario" required autofocus>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Contraseña</label>
              <div class="input-icon-wrapper">
                <span class="input-icon">${window.App.Icons.lock()}</span>
                <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
              </div>
            </div>

            <div id="login-alert" class="login-error-alert" style="display: none;"></div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary btn-block btn-lg">
              <span>Iniciar Sesión</span>
              ${window.App.Icons.check()}
            </button>
          </form>

          <div class="login-demo-bar">
            <span class="demo-label">Acceso rápido de prueba:</span>
            <div class="demo-buttons-grid">
              <button class="demo-btn" data-user="gerente_demo" data-pass="demo123">Gerente</button>
              <button class="demo-btn" data-user="empleado_demo_1" data-pass="demo123">Cajero</button>
              <button class="demo-btn" data-user="cliente_demo_1" data-pass="demo123">Cliente</button>
              <button class="demo-btn" data-user="programador" data-pass="programador123">Programador</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const alertBox = document.getElementById('login-alert');
    const submitBtn = document.getElementById('login-submit-btn');

    // Botones rápidos para demo
    container.querySelectorAll('.demo-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        userInput.value = btn.dataset.user;
        passInput.value = btn.dataset.pass;
        form.requestSubmit();
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Validando...</span>`;

      const username = userInput.value.trim();
      const password = passInput.value;

      try {
        const response = await window.api.login(username, password);

        if (response.success && response.user) {
          window.App.State.setUser(response.user);
          window.App.UI.showToast(`¡Bienvenido, ${response.user.NombreCompleto || response.user.NombreUsuario}!`, 'success');

          // Redirigir a vista según rol
          if (response.user.Rol === 'Cliente') {
            window.App.Router.navigate('compras');
          } else if (response.user.Rol === 'Programador') {
            window.App.Router.navigate('programador');
          } else {
            window.App.Router.navigate('ventas');
          }
        } else {
          alertBox.textContent = response.message || 'Usuario o contraseña incorrectos.';
          alertBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Iniciar Sesión</span> ${window.App.Icons.check()}`;
        }
      } catch (error) {
        console.error('Error de login:', error);
        alertBox.textContent = error.message || 'Error al conectar con el servidor MySQL.';
        alertBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Iniciar Sesión</span> ${window.App.Icons.check()}`;
      }
    });
  }
};

