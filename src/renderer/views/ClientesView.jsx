import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { UserIcon, SearchIcon } from '../components/common/Icons';

export const ClientesView = () => {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.api.getClientes();
      setClientes(data || []);
    } catch (err) {
      showToast('Error al consultar lista de clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clientes.filter((c) => {
      if (!q) return true;
      const full = `${c.NombreCompleto || ''} ${c.ProductosComprados || ''}`.toLowerCase();
      return full.includes(q);
    });
  }, [clientes, search]);

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <UserIcon style={{ width: 26, height: 26 }} />
            <span>Directorio de Clientes</span>
          </h1>
          <p className="view-page-sub">
            Consulta frecuencia de compra, productos preferidos e historial de clientes registrados.
          </p>
        </div>
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
              placeholder="Buscar por nombre o productos consumidos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-counts">{filtered.length} clientes registrados</div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Cliente</th>
                <th>Género</th>
                <th>Fecha de Registro</th>
                <th>Compras Realizadas</th>
                <th>Productos Consumidos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.IdCliente}>
                    <td className="font-mono text-muted">#{c.IdCliente}</td>
                    <td className="font-semibold">{c.NombreCompleto || c.Nombre || 'Cliente'}</td>
                    <td>{c.Genero || '-'}</td>
                    <td className="text-secondary">
                      {c.FechaRegistro ? new Date(c.FechaRegistro).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td className="font-mono text-xs">{c.Ventas || 'Sin compras'}</td>
                    <td className="text-xs text-secondary max-w-sm truncate" title={c.ProductosComprados || ''}>
                      {c.ProductosComprados || 'Ninguno aún'}
                    </td>
                    <td>
                      <span className={`badge ${c.Activo ? 'badge-success' : 'badge-danger'}`}>
                        {c.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

