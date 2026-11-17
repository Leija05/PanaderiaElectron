// Vista de Herramientas de Programador (Stored Procedures)
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Programador = {
  activeTab: 'password',

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.code()} Panel de Mantenimiento (Programador)</h1>
            <p class="view-page-sub">Operaciones de soporte técnico y seguridad mediante Stored Procedures de MySQL.</p>
          </div>
        </div>

        <div class="tabs-nav-bar">
          <button class="tab-btn active" data-tab="password">
            ${window.App.Icons.key()}
            <span>Cambio de Contraseña (SP)</span>
          </button>
          <button class="tab-btn" data-tab="gerente">
            ${window.App.Icons.user()}
            <span>Alta de Gerente (SP)</span>
          </button>
          <button class="tab-btn" data-tab="usuarios">
            ${window.App.Icons.users()}
            <span>Auditoría de Cuentas</span>
          </button>
        </div>

        <div id="prog-tab-container" class="mt-4">
          <!-- Dinámico -->
        </div>
      </div>
    `;

    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.tab;
        this.renderSubtab();
      });
    });

    this.renderSubtab();
  },

  renderSubtab() {
    const container = document.getElementById('prog-tab-container');
    if (!container) return;

    if (this.activeTab === 'password') {
      this.renderPasswordSP(container);
    } else if (this.activeTab === 'gerente') {
      this.renderGerenteSP(container);
    } else {
      this.renderUsuariosAudit(container);
    }
  },

  renderPasswordSP(container) {
    container.innerHTML = `
      <div class="card max-w-xl mx-auto">
        <h3 class="card-subtitle-bold">${window.App.Icons.lock()} Procedimiento: sp_programador_cambiar_password</h3>
        <p class="text-secondary text-sm mb-3">Permite restablecer la contraseña de cualquier cuenta de usuario activo en caso de extravío.</p>

        <form id="form-prog-pass" class="modal-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Usuario Programador:</label>
              <input type="text" id="sp-prog-user" class="form-control" value="programador" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña Programador:</label>
              <input type="password" id="sp-prog-pass" class="form-control" placeholder="••••••••" required>
            </div>
          </div>

          <div class="form-group mt-2">
            <label class="form-label">Nombre de Usuario Objetivo a Modificar:</label>
            <input type="text" id="sp-target-user" class="form-control" placeholder="Ej. gerente_demo o empleado_demo_1" required>
          </div>

          <div class="form-group">
            <label class="form-label">Nueva Contraseña:</label>
            <input type="password" id="sp-new-pass" class="form-control" placeholder="••••••••" required>
          </div>

          <button type="submit" id="btn-sp-pass-submit" class="btn btn-primary btn-block mt-3">
            ${window.App.Icons.check()}
            <span>Ejecutar Procedimiento Almacenado</span>
          </button>
        </form>
      </div>
    `;

    document.getElementById('form-prog-pass').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        usernameProgramador: document.getElementById('sp-prog-user').value.trim(),
        passwordProgramador: document.getElementById('sp-prog-pass').value,
        usuarioObjetivo: document.getElementById('sp-target-user').value.trim(),
        passwordNuevo: document.getElementById('sp-new-pass').value
      };

      try {
        const res = await window.api.programadorCambiarPassword(payload);
        window.App.UI.showToast(res.message, 'success');
        document.getElementById('sp-target-user').value = '';
        document.getElementById('sp-new-pass').value = '';
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  renderGerenteSP(container) {
    container.innerHTML = `
      <div class="card max-w-2xl mx-auto">
        <h3 class="card-subtitle-bold">${window.App.Icons.user()} Procedimiento: AgregarEmpleadoPorProgramador</h3>
        <p class="text-secondary text-sm mb-3">Registra una nueva cuenta con rol Gerente dotada de privilegios administrativos completos.</p>

        <form id="form-prog-gerente" class="modal-form">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Usuario Programador:</label>
              <input type="text" id="sp-g-prog-user" class="form-control" value="programador" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña Programador:</label>
              <input type="password" id="sp-g-prog-pass" class="form-control" placeholder="••••••••" required>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nombre(s) del Gerente:</label>
              <input type="text" id="sp-g-nombre" class="form-control" placeholder="Alejandro" required>
            </div>
            <div class="form-group">
              <label class="form-label">Apellido Paterno:</label>
              <input type="text" id="sp-g-pat" class="form-control" placeholder="Morales" required>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Usuario para el Gerente:</label>
              <input type="text" id="sp-g-user" class="form-control" placeholder="gerente_alejandro" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña Inicial:</label>
              <input type="password" id="sp-g-pass" class="form-control" placeholder="••••••••" required>
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Puesto:</label>
              <input type="text" id="sp-g-puesto" class="form-control" value="Gerente General" required>
            </div>
            <div class="form-group">
              <label class="form-label">Género:</label>
              <select id="sp-g-genero" class="form-control">
                <option value="Prefiero no decir">Prefiero no decir</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Salario Mensual ($):</label>
              <input type="number" id="sp-g-salario" class="form-control" value="18000">
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block mt-3">
            ${window.App.Icons.check()}
            <span>Crear Gerente vía Stored Procedure</span>
          </button>
        </form>
      </div>
    `;

    document.getElementById('form-prog-gerente').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        usernameProgramador: document.getElementById('sp-g-prog-user').value.trim(),
        passwordProgramador: document.getElementById('sp-g-prog-pass').value,
        nombre: document.getElementById('sp-g-nombre').value.trim(),
        apellidoPaterno: document.getElementById('sp-g-pat').value.trim(),
        username: document.getElementById('sp-g-user').value.trim(),
        password: document.getElementById('sp-g-pass').value,
        puesto: document.getElementById('sp-g-puesto').value.trim(),
        genero: document.getElementById('sp-g-genero').value,
        salario: parseFloat(document.getElementById('sp-g-salario').value) || 0
      };

      try {
        const res = await window.api.programadorAgregarGerente(payload);
        window.App.UI.showToast(res.message, 'success');
        this.activeTab = 'usuarios';
        this.renderSubtab();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  async renderUsuariosAudit(container) {
    container.innerHTML = `<div class="loading-state"><span class="spinner"></span></div>`;
    try {
      const empleados = await window.api.getEmpleados();
      container.innerHTML = `
        <div class="card">
          <h3 class="card-subtitle-bold">${window.App.Icons.users()} Cuentas Registradas en la Base de Datos</h3>
          <div class="table-responsive mt-3">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>Rol</th>
                  <th>Puesto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${empleados.map(e => `
                  <tr>
                    <td class="font-mono text-muted">#${e.IdEmpleado}</td>
                    <td class="font-mono font-semibold">${window.App.Utils.escapeHtml(e.NombreUsuario)}</td>
                    <td>${window.App.Utils.escapeHtml(e.NombreCompleto || '-')}</td>
                    <td><span class="badge ${e.Rol === 'Gerente' ? 'badge-primary' : e.Rol === 'Programador' ? 'badge-dark' : 'badge-secondary'}">${e.Rol}</span></td>
                    <td>${window.App.Utils.escapeHtml(e.Puesto || '-')}</td>
                    <td><span class="badge ${e.Activo ? 'badge-success' : 'badge-danger'}">${e.Activo ? 'Activo' : 'Inactivo'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
    }
  }
};

