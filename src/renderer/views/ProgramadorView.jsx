import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { CodeIcon, KeyIcon, UserIcon, UsersIcon, LockIcon, CheckIcon } from '../components/common/Icons';

export const ProgramadorView = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('password');

  // Formulario cambio password
  const [passForm, setPassForm] = useState({
    usernameProgramador: 'programador',
    passwordProgramador: '',
    usuarioObjetivo: '',
    passwordNuevo: ''
  });

  // Formulario alta gerente
  const [gerenteForm, setGerenteForm] = useState({
    usernameProgramador: 'programador',
    passwordProgramador: '',
    nombre: '',
    apellidoPaterno: '',
    username: '',
    password: '',
    puesto: 'Gerente General',
    genero: 'Prefiero no decir',
    salario: 18000
  });

  // Auditoría cuentas
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      const fetchAccounts = async () => {
        setLoadingAccounts(true);
        try {
          const data = await window.api.getEmpleados();
          setAccounts(data || []);
        } catch (e) {
          showToast(e.message, 'error');
        } finally {
          setLoadingAccounts(false);
        }
      };
      fetchAccounts();
    }
  }, [activeTab, showToast]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.programadorCambiarPassword(passForm);
      showToast(res.message, 'success');
      setPassForm({
        ...passForm,
        passwordProgramador: '',
        usuarioObjetivo: '',
        passwordNuevo: ''
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateGerente = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.programadorAgregarGerente(gerenteForm);
      showToast(res.message, 'success');
      setActiveTab('usuarios');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <CodeIcon style={{ width: 26, height: 26 }} />
            <span>Panel de Soporte y Stored Procedures (Programador)</span>
          </h1>
          <p className="view-page-sub">
            Herramientas técnicas de mantenimiento y seguridad mediante procedimientos almacenados en MySQL.
          </p>
        </div>
      </div>

      <div className="tabs-nav-bar">
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <KeyIcon style={{ width: 18, height: 18 }} />
          <span>Cambio de Contraseña (SP)</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'gerente' ? 'active' : ''}`}
          onClick={() => setActiveTab('gerente')}
        >
          <UserIcon style={{ width: 18, height: 18 }} />
          <span>Alta de Gerente (SP)</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <UsersIcon style={{ width: 18, height: 18 }} />
          <span>Auditoría de Cuentas</span>
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'password' ? (
          <div className="card max-w-xl mx-auto">
            <h3 className="card-subtitle-bold">
              <LockIcon style={{ width: 20, height: 20 }} />
              <span>Procedimiento: sp_programador_cambiar_password</span>
            </h3>
            <p className="text-secondary text-sm mb-3">
              Restablece la contraseña de cualquier cuenta de usuario activo mediante procedimiento almacenado.
            </p>

            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Usuario Programador:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={passForm.usernameProgramador}
                    onChange={(e) =>
                      setPassForm({ ...passForm, usernameProgramador: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña Programador:</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={passForm.passwordProgramador}
                    onChange={(e) =>
                      setPassForm({ ...passForm, passwordProgramador: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group mt-2">
                <label className="form-label">Usuario Objetivo a Modificar:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. gerente_demo o empleado_demo_1"
                  value={passForm.usuarioObjetivo}
                  onChange={(e) => setPassForm({ ...passForm, usuarioObjetivo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nueva Contraseña:</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={passForm.passwordNuevo}
                  onChange={(e) => setPassForm({ ...passForm, passwordNuevo: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block mt-3">
                <CheckIcon style={{ width: 18, height: 18 }} />
                <span>Ejecutar Procedimiento Almacenado</span>
              </button>
            </form>
          </div>
        ) : activeTab === 'gerente' ? (
          <div className="card max-w-2xl mx-auto">
            <h3 className="card-subtitle-bold">
              <UserIcon style={{ width: 20, height: 20 }} />
              <span>Procedimiento: AgregarEmpleadoPorProgramador</span>
            </h3>
            <p className="text-secondary text-sm mb-3">
              Registra una cuenta Gerencial con permisos administrativos en la panadería.
            </p>

            <form onSubmit={handleCreateGerente} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Usuario Programador:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={gerenteForm.usernameProgramador}
                    onChange={(e) =>
                      setGerenteForm({ ...gerenteForm, usernameProgramador: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña Programador:</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={gerenteForm.passwordProgramador}
                    onChange={(e) =>
                      setGerenteForm({ ...gerenteForm, passwordProgramador: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Nombre(s) del Gerente:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Alejandro"
                    value={gerenteForm.nombre}
                    onChange={(e) => setGerenteForm({ ...gerenteForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido Paterno:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Morales"
                    value={gerenteForm.apellidoPaterno}
                    onChange={(e) =>
                      setGerenteForm({ ...gerenteForm, apellidoPaterno: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Usuario Gerente:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="gerente_alejandro"
                    value={gerenteForm.username}
                    onChange={(e) => setGerenteForm({ ...gerenteForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña Inicial:</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={gerenteForm.password}
                    onChange={(e) => setGerenteForm({ ...gerenteForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Puesto:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={gerenteForm.puesto}
                    onChange={(e) => setGerenteForm({ ...gerenteForm, puesto: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Género:</label>
                  <select
                    className="form-control"
                    value={gerenteForm.genero}
                    onChange={(e) => setGerenteForm({ ...gerenteForm, genero: e.target.value })}
                  >
                    <option value="Prefiero no decir">Prefiero no decir</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Salario Mensual ($):</label>
                  <input
                    type="number"
                    className="form-control"
                    value={gerenteForm.salario}
                    onChange={(e) =>
                      setGerenteForm({
                        ...gerenteForm,
                        salario: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block mt-3">
                <CheckIcon style={{ width: 18, height: 18 }} />
                <span>Crear Gerente vía Stored Procedure</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <h3 className="card-subtitle-bold">
              <UsersIcon style={{ width: 20, height: 20 }} />
              <span>Cuentas Registradas en la Base de Datos</span>
            </h3>
            <div className="table-responsive mt-3">
              <table className="data-table">
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
                  {loadingAccounts ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Cargando cuentas...
                      </td>
                    </tr>
                  ) : (
                    accounts.map((e) => (
                      <tr key={e.IdEmpleado}>
                        <td className="font-mono text-muted">#{e.IdEmpleado}</td>
                        <td className="font-mono font-semibold">{e.NombreUsuario}</td>
                        <td>{e.NombreCompleto || '-'}</td>
                        <td>
                          <span
                            className={`badge ${
                              e.Rol === 'Gerente'
                                ? 'badge-primary'
                                : e.Rol === 'Programador'
                                ? 'badge-dark'
                                : 'badge-secondary'
                            }`}
                          >
                            {e.Rol}
                          </span>
                        </td>
                        <td>{e.Puesto || '-'}</td>
                        <td>
                          <span className={`badge ${e.Activo ? 'badge-success' : 'badge-danger'}`}>
                            {e.Activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

