// Vista de Administración de Personal (Empleados y Gerentes)
window.App = window.App || {};
window.App.Views = window.App.Views || {};

window.App.Views.Personal = {
  employees: [],
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="view-page animate-fade-in">
        <div class="view-header-bar">
          <div>
            <h1 class="view-page-title">${window.App.Icons.users()} Directorio de Personal</h1>
            <p class="view-page-sub">Gestiona al personal operativo, cajeros, puestos, turnos y estados de cuenta.</p>
          </div>

          <button id="pers-btn-add" class="btn btn-primary">
            ${window.App.Icons.plus()}
            <span>Registrar Empleado</span>
          </button>
        </div>

        <div class="card">
          <div class="table-toolbar">
            <div class="search-box">
              <span class="search-icon">${window.App.Icons.search()}</span>
              <input type="text" id="pers-search-input" class="form-control" placeholder="Buscar por nombre, usuario o puesto...">
            </div>
            <div class="table-counts" id="pers-count-badge">Total: 0 empleados</div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Puesto</th>
                  <th>Turno</th>
                  <th>Salario</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="pers-table-body">
                <tr><td colspan="9" class="text-center py-4">Cargando personal...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadData();

    document.getElementById('pers-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('pers-btn-add').addEventListener('click', () => {
      this.openAddEmployeeModal();
    });
  },

  async loadData() {
    try {
      this.employees = await window.api.getEmpleados();
      this.renderTable();
    } catch (err) {
      console.error('Error al cargar empleados:', err);
      window.App.UI.showToast('Error al cargar lista de empleados', 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('pers-table-body');
    const countBadge = document.getElementById('pers-count-badge');
    if (!tbody) return;

    // Solo mostrar Empleados y Gerentes (excluyendo cuentas de clientes puros)
    const filtered = this.employees
      .filter((e) => ['Empleado', 'Gerente', 'Programador'].includes(e.Rol))
      .filter((e) => {
        if (!this.searchQuery) return true;
        const full = `${e.NombreCompleto || ''} ${e.NombreUsuario || ''} ${e.Puesto || ''}`.toLowerCase();
        return full.includes(this.searchQuery);
      });

    countBadge.textContent = `${filtered.length} miembros del equipo`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-table-cell">No se encontró personal registrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((emp) => {
      const isActivo = Boolean(emp.Activo);
      const roleBadges = {
        Gerente: 'badge-primary',
        Empleado: 'badge-secondary',
        Programador: 'badge-dark'
      };

      return `
        <tr class="${!isActivo ? 'row-inactive' : ''}">
          <td class="font-mono text-muted">#${emp.IdEmpleado}</td>
          <td class="font-semibold">${window.App.Utils.escapeHtml(emp.NombreCompleto || emp.NombreUsuario)}</td>
          <td class="font-mono text-secondary">${window.App.Utils.escapeHtml(emp.NombreUsuario)}</td>
          <td><span class="badge ${roleBadges[emp.Rol] || 'badge-secondary'}">${emp.Rol}</span></td>
          <td>${window.App.Utils.escapeHtml(emp.Puesto || '-')}</td>
          <td>${window.App.Utils.escapeHtml(emp.Turno || 'Any')}</td>
          <td>${window.App.Utils.formatMoney(emp.Salario || 0)}</td>
          <td>
            <button class="status-toggle-btn ${isActivo ? 'btn-active' : 'btn-inactive'}" data-id="${emp.IdEmpleado}" data-status="${isActivo ? '1' : '0'}">
              ${isActivo ? 'Activo' : 'Inactivo'}
            </button>
          </td>
          <td class="text-right">
            <div class="action-btn-group">
              <button class="btn btn-icon btn-sm btn-edit-emp" data-id="${emp.IdEmpleado}" title="Editar Empleado">
                ${window.App.Icons.user()}
              </button>
              <button class="btn btn-icon btn-sm btn-del-emp text-danger" data-id="${emp.IdEmpleado}" title="Desactivar/Eliminar">
                ${window.App.Icons.trash()}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Toggle de estado
    tbody.querySelectorAll('.status-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const currentActive = btn.dataset.status === '1';
        try {
          const res = await window.api.cambiarEstadoUsuario(id, !currentActive);
          window.App.UI.showToast(res.message, 'success');
          this.loadData();
        } catch (err) {
          window.App.UI.showToast(err.message, 'error');
        }
      });
    });

    // Editar
    tbody.querySelectorAll('.btn-edit-emp').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const emp = this.employees.find((e) => e.IdEmpleado === id);
        if (emp) this.openEditEmployeeModal(emp);
      });
    });

    // Eliminar / Desactivar
    tbody.querySelectorAll('.btn-del-emp').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const emp = this.employees.find((e) => e.IdEmpleado === id);
        const confirm = await window.App.UI.showModal({
          title: `¿Eliminar a ${emp.NombreCompleto || emp.NombreUsuario}?`,
          message: 'Si el usuario tiene ventas, compras o registros relacionados en el sistema, será desactivado de forma segura sin borrar su historial financiero.',
          type: 'warning',
          showCancel: true,
          confirmText: 'Confirmar'
        });

        if (confirm) {
          try {
            const res = await window.api.deleteUsuario(id);
            window.App.UI.showToast(res.message, 'success');
            this.loadData();
          } catch (err) {
            window.App.UI.showToast(err.message, 'error');
          }
        }
      });
    });
  },

  openAddEmployeeModal() {
    const currentUser = window.App.State.user;
    const isProgramador = currentUser?.Rol === 'Programador';

    const html = `
      <form id="form-new-emp" class="modal-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre(s):</label>
            <input type="text" id="add-emp-nombre" class="form-control" placeholder="Carlos" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Apellido Paterno:</label>
            <input type="text" id="add-emp-pat" class="form-control" placeholder="López" required>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Apellido Materno (Opcional):</label>
            <input type="text" id="add-emp-mat" class="form-control" placeholder="Ramírez">
          </div>
          <div class="form-group">
            <label class="form-label">Género:</label>
            <select id="add-emp-genero" class="form-control">
              <option value="Prefiero no decir">Prefiero no decir</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="No binario">No binario</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre de Usuario:</label>
            <input type="text" id="add-emp-user" class="form-control" placeholder="carlos_panadero" required>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña de Acceso:</label>
            <input type="password" id="add-emp-pass" class="form-control" placeholder="••••••••" required>
          </div>
        </div>

        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">Rol:</label>
            <select id="add-emp-rol" class="form-control">
              <option value="Empleado" selected>Empleado</option>
              ${isProgramador ? `<option value="Gerente">Gerente</option>` : ''}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Puesto:</label>
            <input type="text" id="add-emp-puesto" class="form-control" placeholder="Cajero / Panadero" value="Cajero">
          </div>
          <div class="form-group">
            <label class="form-label">Turno:</label>
            <select id="add-emp-turno" class="form-control">
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Nocturno">Nocturno</option>
              <option value="Any" selected>Any</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Salario Mensual ($):</label>
          <input type="number" id="add-emp-salario" class="form-control" step="100" min="0" value="8500">
        </div>
      </form>
    `;

    window.App.UI.showModal({
      title: 'Registrar Nuevo Empleado',
      html,
      confirmText: 'Registrar Empleado',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;

      const nombre = document.getElementById('add-emp-nombre')?.value.trim();
      const apellidoPaterno = document.getElementById('add-emp-pat')?.value.trim();
      const apellidoMaterno = document.getElementById('add-emp-mat')?.value.trim();
      const genero = document.getElementById('add-emp-genero')?.value;
      const username = document.getElementById('add-emp-user')?.value.trim();
      const password = document.getElementById('add-emp-pass')?.value;
      const rol = document.getElementById('add-emp-rol')?.value || 'Empleado';
      const puesto = document.getElementById('add-emp-puesto')?.value.trim() || 'Empleado';
      const turno = document.getElementById('add-emp-turno')?.value || 'Any';
      const salario = parseFloat(document.getElementById('add-emp-salario')?.value) || 0;

      if (!nombre || !apellidoPaterno || !username || !password) {
        window.App.UI.showToast('Por favor completa todos los campos requeridos', 'warning');
        return;
      }

      try {
        await window.api.registrarUsuario({
          usuarioEjecutaRol: currentUser?.Rol || 'Gerente',
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          genero,
          username,
          password,
          rol,
          puesto,
          turno,
          salario
        });

        window.App.UI.showToast(`Empleado ${nombre} ${apellidoPaterno} registrado exitosamente.`, 'success');
        this.loadData();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  },

  openEditEmployeeModal(emp) {
    const currentUser = window.App.State.user;

    const html = `
      <form id="form-edit-emp" class="modal-form">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nombre(s):</label>
            <input type="text" id="edit-emp-nombre" class="form-control" value="${emp.Nombre || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Apellido Paterno:</label>
            <input type="text" id="edit-emp-pat" class="form-control" value="${emp.ApellidoPaterno || ''}" required>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Apellido Materno:</label>
            <input type="text" id="edit-emp-mat" class="form-control" value="${emp.ApellidoMaterno || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de Usuario:</label>
            <input type="text" id="edit-emp-user" class="form-control" value="${emp.NombreUsuario || ''}" required>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Puesto:</label>
            <input type="text" id="edit-emp-puesto" class="form-control" value="${emp.Puesto || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Turno:</label>
            <select id="edit-emp-turno" class="form-control">
              <option value="Matutino" ${emp.Turno === 'Matutino' ? 'selected' : ''}>Matutino</option>
              <option value="Vespertino" ${emp.Turno === 'Vespertino' ? 'selected' : ''}>Vespertino</option>
              <option value="Nocturno" ${emp.Turno === 'Nocturno' ? 'selected' : ''}>Nocturno</option>
              <option value="Any" ${emp.Turno === 'Any' || !emp.Turno ? 'selected' : ''}>Any</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Salario Mensual ($):</label>
          <input type="number" id="edit-emp-salario" class="form-control" step="100" min="0" value="${emp.Salario || 0}">
        </div>
      </form>
    `;

    window.App.UI.showModal({
      title: `Editar a ${emp.NombreCompleto || emp.NombreUsuario}`,
      html,
      confirmText: 'Guardar Cambios',
      showCancel: true
    }).then(async (confirmed) => {
      if (!confirmed) return;

      const nombre = document.getElementById('edit-emp-nombre')?.value.trim();
      const apellidoPaterno = document.getElementById('edit-emp-pat')?.value.trim();
      const apellidoMaterno = document.getElementById('edit-emp-mat')?.value.trim();
      const username = document.getElementById('edit-emp-user')?.value.trim();
      const puesto = document.getElementById('edit-emp-puesto')?.value.trim();
      const turno = document.getElementById('edit-emp-turno')?.value;
      const salario = parseFloat(document.getElementById('edit-emp-salario')?.value) || 0;

      try {
        await window.api.modificarUsuario({
          id: emp.IdEmpleado,
          usuarioEjecutaRol: currentUser?.Rol || 'Gerente',
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          username,
          rol: emp.Rol,
          puesto,
          turno,
          salario
        });

        window.App.UI.showToast('Datos de empleado actualizados.', 'success');
        this.loadData();
      } catch (err) {
        window.App.UI.showToast(err.message, 'error');
      }
    });
  }
};

