import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { Modal } from '../components/common/Modal';
import { BoxIcon, PlusIcon, MinusIcon, SearchIcon, AlertIcon } from '../components/common/Icons';
import { formatMoney } from '../components/pos/ProductCard';

export const InventarioView = () => {
  const { showToast } = useToast();
  const { globalSettings } = useSettings() || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isDeductStockOpen, setIsDeductStockOpen] = useState(false);

  // Formularios
  const [newProd, setNewProd] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 20,
    minimo: 5,
    precioCompra: 8.0,
    precioVenta: 18.0
  });

  const [stockOp, setStockOp] = useState({
    idArticulo: '',
    cantidad: 10
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.api.getProductos();
      setProducts(data || []);
      if (data && data.length > 0 && !stockOp.idArticulo) {
        setStockOp((prev) => ({ ...prev, idArticulo: data[0].IdArticulo }));
      }
    } catch (err) {
      showToast('Error cargando catálogo de inventario', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, stockOp.idArticulo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (!q) return true;
      return (
        p.Nombre.toLowerCase().includes(q) ||
        (p.Descripcion && p.Descripcion.toLowerCase().includes(q))
      );
    });
  }, [products, search]);

  const lowStockProducts = useMemo(() => {
    const threshold = Number(globalSettings?.stockMinimoAlerta || 5);
    return products.filter(
      (p) => p.Activo && Number(p.Cantidad || 0) <= Math.max(Number(p.Minimo || 0), threshold)
    );
  }, [products, globalSettings?.stockMinimoAlerta]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.nombre.trim() || !newProd.descripcion.trim()) {
      showToast('Nombre y descripción son requeridos', 'warning');
      return;
    }

    try {
      await window.api.agregarProducto({
        nombre: newProd.nombre.trim(),
        descripcion: newProd.descripcion.trim(),
        cantidad: parseInt(newProd.cantidad, 10),
        minimo: parseInt(newProd.minimo, 10),
        precioCompra: parseFloat(newProd.precioCompra),
        precioVenta: parseFloat(newProd.precioVenta)
      });
      showToast(`Producto "${newProd.nombre}" agregado al catálogo.`, 'success');
      setIsAddModalOpen(false);
      setNewProd({
        nombre: '',
        descripcion: '',
        cantidad: 20,
        minimo: 5,
        precioCompra: 8.0,
        precioVenta: 18.0
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddStock = async () => {
    const id = parseInt(stockOp.idArticulo, 10);
    const qty = parseInt(stockOp.cantidad, 10);
    if (!id || !qty || qty <= 0) {
      showToast('Ingresa una cantidad válida mayor a 0', 'warning');
      return;
    }

    try {
      const res = await window.api.agregarCantidadProducto(id, qty);
      showToast(res.message, 'success');
      setIsAddStockOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeductStock = async () => {
    const id = parseInt(stockOp.idArticulo, 10);
    const qty = parseInt(stockOp.cantidad, 10);
    if (!id || !qty || qty <= 0) {
      showToast('Ingresa una cantidad válida mayor a 0', 'warning');
      return;
    }

    try {
      const res = await window.api.eliminarProducto(id, qty);
      showToast(res.message, 'success');
      setIsDeductStockOpen(false);
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
            <BoxIcon style={{ width: 26, height: 26 }} />
            <span>Control de Inventario</span>
          </h1>
          <p className="view-page-sub">
            Administra piezas horneadas, existencias en vitrina, costos y alertas de reorden.
          </p>
        </div>

        <div className="view-actions-group">
          <button className="btn btn-outline" onClick={() => setIsAddStockOpen(true)}>
            <PlusIcon style={{ width: 16, height: 16 }} />
            <span>Agregar Stock</span>
          </button>
          <button
            className="btn btn-outline btn-danger-outline"
            onClick={() => setIsDeductStockOpen(true)}
          >
            <MinusIcon style={{ width: 16, height: 16 }} />
            <span>Retirar Stock</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <PlusIcon style={{ width: 16, height: 16 }} />
            <span>Nuevo Pan</span>
          </button>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="inv-alert-banner">
          <div className="alert-banner-icon">
            <AlertIcon style={{ width: 22, height: 22 }} />
          </div>
          <div className="alert-banner-content">
            <strong>¡Alerta de Reorden!</strong>
            <span>
              {' '}Hay <strong>{lowStockProducts.length}</strong> producto(s) por debajo o al límite del stock mínimo ({lowStockProducts.slice(0, 4).map((p) => p.Nombre).join(', ')}{lowStockProducts.length > 4 ? '...' : ''}).
            </span>
          </div>
        </div>
      )}

      <div className="card inv-card">
        <div className="table-toolbar">
          <div className="search-box">
            <span className="search-icon">
              <SearchIcon style={{ width: 16, height: 16 }} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-counts">
            {filtered.length} de {products.length} productos
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Stock Actual</th>
                <th>Mínimo</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const stock = Number(prod.Cantidad || 0);
                  const min = Number(prod.Minimo || 5);
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= min;

                  return (
                    <tr key={prod.IdArticulo}>
                      <td className="font-mono text-muted">#{prod.IdArticulo}</td>
                      <td className="font-semibold">{prod.Nombre}</td>
                      <td className="text-secondary">{prod.Descripcion || '-'}</td>
                      <td>
                        <strong
                          className={
                            isOutOfStock
                              ? 'text-danger'
                              : isLowStock
                              ? 'text-warning'
                              : 'text-success'
                          }
                        >
                          {stock}
                        </strong>
                      </td>
                      <td className="text-muted">{min}</td>
                      <td>{formatMoney(prod.PrecioCompra || 0)}</td>
                      <td className="font-semibold">{formatMoney(prod.PrecioVenta || 0)}</td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Agotado</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">
                            Reorden ({stock}/{min})
                          </span>
                        ) : (
                          <span className="badge badge-success">Óptimo</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Producto */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registrar Nuevo Producto"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCreateProduct}>
              Guardar Pan
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="modal-form">
          <div className="form-group">
            <label className="form-label">Nombre del Pan:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Cuerno de Mantequilla"
              value={newProd.nombre}
              onChange={(e) => setNewProd({ ...newProd, nombre: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Hojaldre esponjoso horneado diario"
              value={newProd.descripcion}
              onChange={(e) => setNewProd({ ...newProd, descripcion: e.target.value })}
              required
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Cantidad Inicial:</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={newProd.cantidad}
                onChange={(e) => setNewProd({ ...newProd, cantidad: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mínimo para Alerta:</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={newProd.minimo}
                onChange={(e) => setNewProd({ ...newProd, minimo: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Precio Compra/Costo ($):</label>
              <input
                type="number"
                className="form-control"
                step="0.5"
                min="0"
                value={newProd.precioCompra}
                onChange={(e) => setNewProd({ ...newProd, precioCompra: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio Venta ($):</label>
              <input
                type="number"
                className="form-control"
                step="0.5"
                min="0"
                value={newProd.precioVenta}
                onChange={(e) => setNewProd({ ...newProd, precioVenta: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Agregar Cantidad */}
      <Modal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        title="Añadir Existencias a Inventario"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddStockOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleAddStock}>
              Añadir Unidades
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Selecciona el Producto:</label>
            <select
              className="form-control"
              value={stockOp.idArticulo}
              onChange={(e) => setStockOp({ ...stockOp, idArticulo: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.IdArticulo} value={p.IdArticulo}>
                  {p.Nombre} (Stock actual: {p.Cantidad})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad a Añadir:</label>
            <input
              type="number"
              className="form-control input-lg"
              min="1"
              value={stockOp.cantidad}
              onChange={(e) => setStockOp({ ...stockOp, cantidad: e.target.value })}
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Retirar Cantidad */}
      <Modal
        isOpen={isDeductStockOpen}
        onClose={() => setIsDeductStockOpen(false)}
        title="Retirar Stock (Merma / Ajuste)"
        type="warning"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsDeductStockOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleDeductStock}>
              Confirmar Retiro
            </button>
          </>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Selecciona el Producto:</label>
            <select
              className="form-control"
              value={stockOp.idArticulo}
              onChange={(e) => setStockOp({ ...stockOp, idArticulo: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.IdArticulo} value={p.IdArticulo}>
                  {p.Nombre} (Stock actual: {p.Cantidad})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad a Descontar:</label>
            <input
              type="number"
              className="form-control input-lg"
              min="1"
              value={stockOp.cantidad}
              onChange={(e) => setStockOp({ ...stockOp, cantidad: e.target.value })}
              autoFocus
            />
            <small className="text-muted">Descuento físico por merma o error de conteo.</small>
          </div>
        </div>
      </Modal>
    </div>
  );
};

