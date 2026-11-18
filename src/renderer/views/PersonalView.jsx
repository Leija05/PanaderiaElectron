import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { UsersIcon, PlusIcon, UserIcon, TrashIcon, SearchIcon } from '../components/common/Icons';
import { formatMoney } from '../components/pos/ProductCard';

export const PersonalView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Formulario nuevo empleado
  const [empForm, setEmpForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    username: '',
    password: '',
    rol: 'Empleado',
    puesto: 'Cajero',
    turno: 'Any',
    salario: 8500
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.api.getEmpleados();
      setEmployees(data || []);
    } catch (err) {
      showToast('Error cargando lista de empleados', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees
      .filter((e) => ['Empleado', 'Gerente'].includes(e.Rol))
      .filter((e) => {
        if (!q) return true;
        const full = `${e.NombreCompleto || ''} ${e.NombreUsuario || ''} ${e.Puesto || ''}`.toLowerCase();
        return full.includes(q);
      });
  }, [employees, search]);

  const handleToggleStatus = async (emp) => {
    try {
      const res = await window.api.cambiarEstadoUsuario(emp.IdEmpleado, !emp.Activo);
      showToast(res.message, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (emp) => {
    if (
      !window.confirm(
        `¿Confirmas desactivar/eliminar a ${emp.NombreCompleto || emp.NombreUsuario}? Si cuenta con ventas u operaciones previas, se desactivará de forma segura.`
      )
    ) {
      return;
    }

    try {
      const res = await window.api.deleteUsuario(emp.IdEmpleado);
      showToast(res.message, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.nombre || !empForm.apellidoPaterno || !empForm.username || !empForm.password) {
      showToast('Completa los campos requeridos', 'warning');
      return;
    }

    try {
      await window.api.registrarUsuario({
        usuarioEjecutaRol: user?.Rol || 'Gerente',
        ...empForm
      });
      showToast(`Empleado ${empForm.nombre} registrado correctamente.`, 'success');
      setIsAddOpen(false);
      setEmpForm({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        username: '',
        password: '',
        rol: 'Empleado',
        puesto: 'Cajero',
        turno: 'Any',
        salario: 8500
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    try {
      await window.api.modificarUsuario({
        id: selectedEmp.IdEmpleado,
        usuarioEjecutaRol: user?.Rol || 'Gerente',
        nombre: selectedEmp.Nombre,
        apellidoPaterno: selectedEmp.ApellidoPaterno,
        apellidoMaterno: selectedEmp.ApellidoMaterno,
        username: selectedEmp.NombreUsuario,
        rol: selectedEmp.Rol,
        puesto: selectedEmp.Puesto,
        turno: selectedEmp.Turno,
        salario: selectedEmp.Salario
      });
      showToast('Datos de empleado actualizados.', 'success');
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <UsersIcon style={{ width: 26, height: 26 }} />
            <span>Directorio de Personal</span>
          </h1>
          <p className="view-page-sub">
            Gestiona permisos de gerentes, cajeros, turnos de panadería y estados de cuenta.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          <span>Registrar Empleado</span>
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">
              <SearchIcon style={{ width: 16, height: 16 }} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre, usuario o puesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-counts">{filtered.length} miembros del equipo</div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
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
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Cargando empleados...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-table-cell">
                    No se encontró personal registrado.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isActivo = Boolean(emp.Activo);
                  const roleBadges = {
                    Gerente: 'badge-primary',
                    Empleado: 'badge-secondary'
                  };

                  return (
                    <tr key={emp.IdEmpleado} className={!isActivo ? 'row-inactive' : ''}>
                      <td className="font-mono text-muted">#{emp.IdEmpleado}</td>
                      <td className="font-semibold">
                        {emp.NombreCompleto || emp.NombreUsuario}
                      </td>
                      <td className="font-mono text-secondary">{emp.NombreUsuario}</td>
                      <td>
                        <span className={`badge ${roleBadges[emp.Rol] || 'badge-secondary'}`}>
                          {emp.Rol}
                        </span>
                      </td>
                      <td>{emp.Puesto || '-'}</td>
                      <td>{emp.Turno || 'Any'}</td>
                      <td>{formatMoney(emp.Salario || 0)}</td>
                      <td>
                        <button
                          className={`status-toggle-btn ${
                            isActivo ? 'btn-active' : 'btn-inactive'
                          }`}
                          onClick={() => handleToggleStatus(emp)}
                        >
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="action-btn-group">
                          <button
                            className="btn btn-icon btn-sm"
                            onClick={() => {
                              setSelectedEmp(emp);
                              setIsEditOpen(true);
                            }}
                            title="Editar Empleado"
                          >
                            <UserIcon style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            className="btn btn-icon btn-sm text-danger"
                            onClick={() => handleDelete(emp)}
                            title="Desactivar/Eliminar"
                          >
                            <TrashIcon style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Empleado */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Registrar Nuevo Empleado"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCreateEmployee}>
              Registrar Empleado
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Nombre(s):</label>
              <input
                type="text"
                className="form-control"
                value={empForm.nombre}
                onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido Paterno:</label>
              <input
                type="text"
                className="form-control"
                value={empForm.apellidoPaterno}
                onChange={(e) => setEmpForm({ ...empForm, apellidoPaterno: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Apellido Materno:</label>
              <input
                type="text"
                className="form-control"
                value={empForm.apellidoMaterno}
                onChange={(e) => setEmpForm({ ...empForm, apellidoMaterno: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de Usuario:</label>
              <input
                type="text"
                className="form-control"
                value={empForm.username}
                onChange={(e) => setEmpForm({ ...empForm, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Contraseña Inicial:</label>
              <input
                type="password"
                className="form-control"
                value={empForm.password}
                onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rol:</label>
              <select
                className="form-control"
                value={empForm.rol}
                onChange={(e) => setEmpForm({ ...empForm, rol: e.target.value })}
              >
                <option value="Empleado">Empleado</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Puesto:</label>
              <input
                type="text"
                className="form-control"
                value={empForm.puesto}
                onChange={(e) => setEmpForm({ ...empForm, puesto: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Turno:</label>
              <select
                className="form-control"
                value={empForm.turno}
                onChange={(e) => setEmpForm({ ...empForm, turno: e.target.value })}
              >
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Nocturno">Nocturno</option>
                <option value="Any">Any</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Salario ($):</label>
              <input
                type="number"
                className="form-control"
                value={empForm.salario}
                onChange={(e) => setEmpForm({ ...empForm, salario: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Empleado */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Editar a ${selectedEmp?.NombreCompleto || selectedEmp?.NombreUsuario}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleEditEmployee}>
              Guardar Cambios
            </button>
          </>
        }
      >
        {selectedEmp && (
          <form onSubmit={handleEditEmployee} className="modal-form">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Nombre(s):</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedEmp.Nombre || ''}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, Nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido Paterno:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedEmp.ApellidoPaterno || ''}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, ApellidoPaterno: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Usuario:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedEmp.NombreUsuario || ''}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, NombreUsuario: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Puesto:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedEmp.Puesto || ''}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, Puesto: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Turno:</label>
                <select
                  className="form-control"
                  value={selectedEmp.Turno || 'Any'}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, Turno: e.target.value })}
                >
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Nocturno">Nocturno</option>
                  <option value="Any">Any</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Salario Mensual ($):</label>
                <input
                  type="number"
                  className="form-control"
                  value={selectedEmp.Salario || 0}
                  onChange={(e) => setSelectedEmp({ ...selectedEmp, Salario: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

