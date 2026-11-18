import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Modal } from '../components/common/Modal';
import { TruckIcon, BoxIcon, RefreshIcon, PlusIcon, TrashIcon } from '../components/common/Icons';
import { formatMoney } from '../components/pos/ProductCard';

export const ProveedoresView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState('proveedores');
  const [proveedores, setProveedores] = useState([]);
  const [recepciones, setRecepciones] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isAddProvOpen, setIsAddProvOpen] = useState(false);
  const [isAddRecOpen, setIsAddRecOpen] = useState(false);
  const [isAddDevOpen, setIsAddDevOpen] = useState(false);

  // Formularios
  const [newProv, setNewProv] = useState({
    name: '',
    contacto: '',
    telefono: '',
    mail: '',
    ciudad: ''
  });

  const [products, setProducts] = useState([]);
  const [recLines, setRecLines] = useState([]);
  const [recProvId, setRecProvId] = useState('');
  const [recLineForm, setRecLineForm] = useState({
    idArticulo: '',
    cantidad: 20,
    costoUnitario: 10
  });

  // Formulario devolución cliente
  const [ventas, setVentas] = useState([]);
  const [devVentaId, setDevVentaId] = useState('');
  const [devItems, setDevItems] = useState([]);
  const [devMotivo, setDevMotivo] = useState('Devolución en mostrador');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [provs, recs, devs, prods, vtas] = await Promise.all([
        window.api.getProveedores(),
        window.api.getRecepcionesProveedor(),
        window.api.getDevolucionesCliente(),
        window.api.getProductos(),
        window.api.getVentas()
      ]);

      setProveedores(provs || []);
      setRecepciones(recs || []);
      setDevoluciones(devs || []);
      setProducts(prods || []);
      setVentas(vtas || []);

      if (provs && provs.length > 0 && !recProvId) {
        setRecProvId(provs[0].IdProveedor);
      }
      if (prods && prods.length > 0 && !recLineForm.idArticulo) {
        setRecLineForm((prev) => ({ ...prev, idArticulo: prods[0].IdArticulo }));
      }
      if (vtas && vtas.length > 0 && !devVentaId) {
        setDevVentaId(vtas[0].IdVenta);
      }
    } catch (err) {
      showToast('Error cargando datos de proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, recProvId, recLineForm.idArticulo, devVentaId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleToggleProveedor = async (p) => {
    try {
      const nextStatus = p.Activo === 0 || p.Activo === false;
      const res = await window.api.cambiarEstadoProveedor(p.IdProveedor, nextStatus);
      showToast(res.message, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProveedor = async (e) => {
    e.preventDefault();
    if (!newProv.name.trim()) {
      showToast('Nombre de proveedor es requerido', 'warning');
      return;
    }
    try {
      await window.api.registrarProveedor(newProv);
      showToast(`Proveedor ${newProv.name} registrado con éxito.`, 'success');
      setIsAddProvOpen(false);
      setNewProv({ name: '', contacto: '', telefono: '', mail: '', ciudad: '' });
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddRecLine = () => {
    const id = parseInt(recLineForm.idArticulo, 10);
    const prodObj = products.find((p) => p.IdArticulo === id);
    const qty = parseInt(recLineForm.cantidad, 10);
    const cost = parseFloat(recLineForm.costoUnitario);

    if (!id || !qty || qty <= 0 || isNaN(cost)) {
      showToast('Ingresa cantidad y costo válidos', 'warning');
      return;
    }

    setRecLines((prev) => [
      ...prev,
      {
        idArticulo: id,
        nombre: prodObj?.Nombre || 'Artículo',
        cantidad: qty,
        costoUnitario: cost
      }
    ]);
  };

  const handleSaveReception = async () => {
    if (!recLines.length) {
      showToast('Agrega al menos un artículo a la recepción.', 'warning');
      return;
    }

    try {
      const res = await window.api.registrarRecepcionProveedor({
        idProveedor: parseInt(recProvId, 10),
        idEmpleado: user?.IdEmpleado || null,
        items: recLines
      });
      showToast(`Recepción #${res.numeroRecepcion} guardada con éxito ($${res.total}).`, 'success');
      setIsAddRecOpen(false);
      setRecLines([]);
      loadAllData();
      setActiveTab('recepciones');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReturnReception = async (rec) => {
    const ok = await confirm({
      title: 'Devolución de Recepción',
      subtitle: `Recepción #${rec.NumeroRecepcion || rec.IdRecepcion}`,
      message: '¿Confirmas devolver esta recepción? Se descontarán del inventario los productos que fueron ingresados en este movimiento.',
      confirmText: 'Sí, Devolver Recepción',
      cancelText: 'Cancelar',
      type: 'warning',
      confirmButtonClass: 'btn-danger'
    });

    if (!ok) {
      return;
    }

    try {
      await window.api.devolverRecepcionProveedor({
        idRecepcion: rec.IdRecepcion,
        motivo: 'Devolución manual por usuario'
      });
      showToast('Recepción devuelta e inventario revertido.', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Carga productos de la venta al abrir devolución
  useEffect(() => {
    if (!devVentaId) return;
    const fetchDetalles = async () => {
      try {
        const det = await window.api.getDetallesVenta(parseInt(devVentaId, 10));
        setDevItems(
          (det.Productos || []).map((p) => ({
            ...p,
            devolverQty: 0
          }))
        );
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetalles();
  }, [devVentaId]);

  const handleSaveDevolucion = async () => {
    const toReturn = devItems
      .filter((i) => i.devolverQty > 0)
      .map((i) => ({
        idArticulo: i.IdArticulo,
        cantidad: parseInt(i.devolverQty, 10)
      }));

    if (!toReturn.length) {
      showToast('Indica la cantidad a devolver en al menos un artículo.', 'warning');
      return;
    }

    try {
      const res = await window.api.registrarDevolucionCliente({
        idVenta: parseInt(devVentaId, 10),
        idEmpleado: user?.IdEmpleado || null,
        motivo: devMotivo,
        items: toReturn
      });
      showToast(`Devolución #${res.folioDevolucion} registrada con éxito ($${res.totalReintegrado}).`, 'success');
      setIsAddDevOpen(false);
      loadAllData();
      setActiveTab('devoluciones');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <TruckIcon style={{ width: 26, height: 26 }} />
            <span>Cadena de Suministro</span>
          </h1>
          <p className="view-page-sub">
            Gestión de proveedores, ingresos de materia prima/mercancía y devoluciones de clientes.
          </p>
        </div>

        <div className="view-actions-group">
          <button className="btn btn-outline" onClick={() => setIsAddProvOpen(true)}>
            <PlusIcon style={{ width: 16, height: 16 }} />
            <span>Nuevo Proveedor</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddRecOpen(true)}>
            <BoxIcon style={{ width: 16, height: 16 }} />
            <span>Recibir Mercancía</span>
          </button>
          <button
            className="btn btn-outline btn-warning-outline"
            onClick={() => setIsAddDevOpen(true)}
          >
            <RefreshIcon style={{ width: 16, height: 16 }} />
            <span>Devolución Cliente</span>
          </button>
        </div>
      </div>

      <div className="tabs-nav-bar">
        <button
          className={`tab-btn ${activeTab === 'proveedores' ? 'active' : ''}`}
          onClick={() => setActiveTab('proveedores')}
        >
          <TruckIcon style={{ width: 18, height: 18 }} />
          <span>Proveedores</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'recepciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('recepciones')}
        >
          <BoxIcon style={{ width: 18, height: 18 }} />
          <span>Recepciones de Mercancía</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'devoluciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('devoluciones')}
        >
          <RefreshIcon style={{ width: 18, height: 18 }} />
          <span>Devoluciones de Clientes</span>
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="loading-state">
            <span className="spinner"></span>
          </div>
        ) : activeTab === 'proveedores' ? (
          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proveedor / Empresa</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Ciudad</th>
                    <th>Estado</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => {
                    const isActivo = p.Activo !== 0 && p.Activo !== false;
                    return (
                      <tr key={p.IdProveedor} className={!isActivo ? 'row-inactive' : ''}>
                        <td className="font-mono text-muted">#{p.IdProveedor}</td>
                        <td className="font-semibold">{p.NombreEmpresa || p.Nombre}</td>
                        <td>{p.Contacto || p.ContactoNombre || '-'}</td>
                        <td className="font-mono">{p.Telefono || '-'}</td>
                        <td>{p.Correo || '-'}</td>
                        <td>{p.Ciudad || '-'}</td>
                        <td>
                          <span className={`badge ${isActivo ? 'badge-success' : 'badge-danger'}`}>
                            {isActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggleProveedor(p)}
                          >
                            {isActivo ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'recepciones' ? (
          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio / Recepción</th>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Productos Recibidos</th>
                    <th>Total ($)</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recepciones.map((r) => (
                    <tr key={r.IdRecepcion}>
                      <td>
                        <span className="font-mono font-semibold">{r.NumeroRecepcion}</span>
                        <div className="text-xs text-muted">{r.Folio}</div>
                      </td>
                      <td className="text-secondary text-xs">
                        {new Date(r.FechaRecepcion).toLocaleString('es-MX')}
                      </td>
                      <td className="font-semibold">{r.NombreProveedor}</td>
                      <td className="text-xs text-secondary max-w-sm truncate">
                        {r.ProductosIngresados || '-'}
                      </td>
                      <td className="font-bold text-success">{formatMoney(r.Total)}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.Estado === 'Recibida'
                              ? 'badge-success'
                              : r.Estado === 'Modificada'
                              ? 'badge-primary'
                              : 'badge-danger'
                          }`}
                        >
                          {r.Estado}
                        </span>
                      </td>
                      <td className="text-right">
                        {r.Estado !== 'Devuelta' ? (
                          <button
                            className="btn btn-outline btn-sm btn-danger-outline"
                            onClick={() => handleReturnReception(r)}
                          >
                            Devolver
                          </button>
                        ) : (
                          <span className="text-muted text-xs">Devuelto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio Devolución</th>
                    <th>Fecha</th>
                    <th>Venta Origen</th>
                    <th>Atendió</th>
                    <th>Productos Reintegrados</th>
                    <th>Monto Reintegrado</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {devoluciones.map((d) => (
                    <tr key={d.IdDevolucion}>
                      <td className="font-mono font-semibold">{d.FolioDevolucion}</td>
                      <td className="text-secondary text-xs">
                        {new Date(d.FechaDevolucion).toLocaleString('es-MX')}
                      </td>
                      <td className="font-mono font-bold">#{d.IdVenta}</td>
                      <td>{d.Empleado || 'Sistema'}</td>
                      <td className="text-xs text-secondary">{d.Productos || '-'}</td>
                      <td className="font-bold text-danger">{formatMoney(d.TotalReintegrado)}</td>
                      <td className="text-xs text-muted">{d.Motivo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar Proveedor */}
      <Modal
        isOpen={isAddProvOpen}
        onClose={() => setIsAddProvOpen(false)}
        title="Registrar Nuevo Proveedor"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddProvOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCreateProveedor}>
              Guardar Proveedor
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateProveedor} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nombre del Proveedor / Razón Social:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Harinas Elizondo S.A."
              value={newProv.name}
              onChange={(e) => setNewProv({ ...newProv, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Persona de Contacto:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Lic. Roberto Sánchez"
                value={newProv.contacto}
                onChange={(e) => setNewProv({ ...newProv, contacto: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono:</label>
              <input
                type="tel"
                className="form-control"
                placeholder="55 1234 5678"
                value={newProv.telefono}
                onChange={(e) => setNewProv({ ...newProv, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Correo Electrónico:</label>
              <input
                type="email"
                className="form-control"
                placeholder="ventas@proveedor.com"
                value={newProv.mail}
                onChange={(e) => setNewProv({ ...newProv, mail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad / Estado:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Monterrey, N.L."
                value={newProv.ciudad}
                onChange={(e) => setNewProv({ ...newProv, ciudad: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Recepción de Mercancía */}
      <Modal
        isOpen={isAddRecOpen}
        onClose={() => setIsAddRecOpen(false)}
        title="Recepción de Mercancía"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddRecOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveReception}>
              Registrar Ingreso de Stock
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Proveedor:</label>
            <select
              className="form-control"
              value={recProvId}
              onChange={(e) => setRecProvId(e.target.value)}
            >
              {proveedores
                .filter((p) => p.Activo !== 0 && p.Activo !== false)
                .map((p) => (
                  <option key={p.IdProveedor} value={p.IdProveedor}>
                    {p.NombreEmpresa || p.Nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="reception-items-header">
            <label className="form-label">Agregar Productos:</label>
            <div className="form-row-3">
              <select
                className="form-control"
                value={recLineForm.idArticulo}
                onChange={(e) => setRecLineForm({ ...recLineForm, idArticulo: e.target.value })}
              >
                {products.map((p) => (
                  <option key={p.IdArticulo} value={p.IdArticulo}>
                    {p.Nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-control"
                placeholder="Cant."
                min="1"
                value={recLineForm.cantidad}
                onChange={(e) => setRecLineForm({ ...recLineForm, cantidad: e.target.value })}
              />
              <input
                type="number"
                className="form-control"
                placeholder="Costo ($)"
                step="0.5"
                min="0"
                value={recLineForm.costoUnitario}
                onChange={(e) => setRecLineForm({ ...recLineForm, costoUnitario: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm mt-2"
              onClick={handleAddRecLine}
            >
              <PlusIcon style={{ width: 14, height: 14 }} /> Agregar a lista
            </button>
          </div>

          <div className="rec-lines-table-box mt-3">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant</th>
                  <th>Costo</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recLines.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-2">
                      Sin artículos agregados
                    </td>
                  </tr>
                ) : (
                  recLines.map((line, idx) => (
                    <tr key={idx}>
                      <td>{line.nombre}</td>
                      <td>{line.cantidad}</td>
                      <td>{formatMoney(line.costoUnitario)}</td>
                      <td>{formatMoney(line.cantidad * line.costoUnitario)}</td>
                      <td>
                        <button
                          className="btn-text-danger"
                          onClick={() => setRecLines(recLines.filter((_, i) => i !== idx))}
                        >
                          <TrashIcon style={{ width: 14, height: 14 }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="text-right font-bold mt-2">
              Total Recepción:{' '}
              {formatMoney(
                recLines.reduce((acc, l) => acc + l.cantidad * l.costoUnitario, 0)
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Devolución de Cliente */}
      <Modal
        isOpen={isAddDevOpen}
        onClose={() => setIsAddDevOpen(false)}
        title="Devolución de Cliente y Reintegro"
        type="warning"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddDevOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleSaveDevolucion}>
              Procesar Reintegro
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Selecciona Folio de Venta:</label>
            <select
              className="form-control"
              value={devVentaId}
              onChange={(e) => setDevVentaId(e.target.value)}
            >
              {ventas.slice(0, 30).map((v) => (
                <option key={v.IdVenta} value={v.IdVenta}>
                  Venta #{v.IdVenta} - Total: ${v.Total}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="form-label">Productos a Devolver:</label>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Comprado</th>
                  <th>Devolver</th>
                </tr>
              </thead>
              <tbody>
                {devItems.map((item, idx) => (
                  <tr key={item.IdArticulo}>
                    <td>{item.NombreProducto}</td>
                    <td>{item.Cantidad} pzs</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        max={item.Cantidad}
                        value={item.devolverQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setDevItems(
                            devItems.map((it, i) =>
                              i === idx ? { ...it, devolverQty: Math.min(it.Cantidad, val) } : it
                            )
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group mt-3">
            <label className="form-label">Motivo de Devolución:</label>
            <input
              type="text"
              className="form-control"
              value={devMotivo}
              onChange={(e) => setDevMotivo(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

