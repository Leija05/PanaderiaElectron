import React, { useState, useMemo } from 'react';
import { formatMoney } from '../pos/ProductCard';
import {
  SearchIcon,
  DownloadIcon,
  PosIcon,
  CartIcon,
  CheckIcon,
  CashIcon,
  ChartIcon
} from '../common/Icons';

export const SpreadsheetViewer = ({
  reportData,
  ventas: rawVentas = [],
  summary: rawSummary = {},
  range: rawRange = {},
  onExportExcel,
  exportingExcel = false
}) => {
  const ventas = reportData?.ventas || rawVentas || [];
  const summary = reportData?.resumen || rawSummary || {};
  const range = reportData?.range || rawRange || {};

  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'CajaEmpleado' | 'Autocobro'
  const [sortBy, setSortBy] = useState('id-desc'); // 'id-desc' | 'id-asc' | 'total-desc' | 'fecha-desc'

  const filteredVentas = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = (ventas || []).filter((v) => {
      if (channelFilter !== 'all' && v.Canal !== channelFilter) return false;
      if (!q) return true;
      const haystack = `${v.IdVenta} ${v.EmpleadoNombre || ''} ${v.ClienteNombre || ''} ${v.Canal || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    result.sort((a, b) => {
      if (sortBy === 'id-desc') return Number(b.IdVenta) - Number(a.IdVenta);
      if (sortBy === 'id-asc') return Number(a.IdVenta) - Number(b.IdVenta);
      if (sortBy === 'total-desc') return Number(b.Total || 0) - Number(a.Total || 0);
      if (sortBy === 'fecha-desc') return new Date(b.FechaVenta) - new Date(a.FechaVenta);
      return 0;
    });

    return result;
  }, [ventas, search, channelFilter, sortBy]);

  const liveTotals = useMemo(() => {
    const subtotal = filteredVentas.reduce((acc, v) => acc + Number(v.Subtotal || 0), 0);
    const iva = filteredVentas.reduce((acc, v) => acc + Number(v.Iva || 0), 0);
    const total = filteredVentas.reduce((acc, v) => acc + Number(v.Total || 0), 0);
    const tickets = filteredVentas.length;
    const ticketPromedio = tickets > 0 ? (total / tickets) : 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      tickets,
      ticketPromedio: Number(ticketPromedio.toFixed(2))
    };
  }, [filteredVentas]);

  return (
    <div className="spreadsheet-view-container animate-fade-in">
      {/* Barra de Herramientas Estilo Hoja de Cálculo Ejecutiva */}
      <div className="spreadsheet-toolbar">
        <div className="toolbar-left">
          {/* Buscador en vivo */}
          <div className="spreadsheet-search-box">
            <span className="search-icon">
              <SearchIcon style={{ width: 15, height: 15 }} />
            </span>
            <input
              type="text"
              className="form-control spreadsheet-input"
              placeholder="Filtrar por # ticket, cajero o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn-clear-mini"
                onClick={() => setSearch('')}
                aria-label="Borrar filtro"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filtros rápidos por Canal */}
          <div className="spreadsheet-channel-pills">
            <button
              className={`pill-btn ${channelFilter === 'all' ? 'active' : ''}`}
              onClick={() => setChannelFilter('all')}
            >
              Todos ({ventas.length})
            </button>
            <button
              className={`pill-btn ${channelFilter === 'CajaEmpleado' ? 'active' : ''}`}
              onClick={() => setChannelFilter('CajaEmpleado')}
            >
              <PosIcon style={{ width: 13, height: 13 }} />
              <span>Caja Mostrador</span>
            </button>
            <button
              className={`pill-btn ${channelFilter === 'Autocobro' ? 'active' : ''}`}
              onClick={() => setChannelFilter('Autocobro')}
            >
              <CartIcon style={{ width: 13, height: 13 }} />
              <span>Autocobro</span>
            </button>
          </div>
        </div>

        {/* Acciones de Exportación */}
        <div className="toolbar-right">
          <button
            className="btn btn-sm btn-primary btn-excel"
            onClick={onExportExcel}
            disabled={exportingExcel}
            title="Generar Libro Excel Oficial (.xlsx) con Logo y Formato"
          >
            <DownloadIcon style={{ width: 15, height: 15 }} />
            <span>{exportingExcel ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}</span>
            <span className="excel-badge">Con Logo</span>
          </button>
        </div>
      </div>

      {/* Micro-tarjetas de métricas en vivo sincronizadas */}
      <div className="spreadsheet-kpi-bar">
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Ingresos Filtrados</span>
          <span className="kpi-mini-val text-primary-dark">{formatMoney(liveTotals.total)}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Tickets Mostrados</span>
          <span className="kpi-mini-val">{liveTotals.tickets} ventas</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Ticket Promedio</span>
          <span className="kpi-mini-val">{formatMoney(liveTotals.ticketPromedio)}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">IVA Recaudado</span>
          <span className="kpi-mini-val text-muted">{formatMoney(liveTotals.iva)}</span>
        </div>
      </div>

      {/* Tabla con Estética de Hoja de Cálculo Corporativa */}
      <div className="spreadsheet-grid-wrapper">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }} onClick={() => setSortBy(sortBy === 'id-desc' ? 'id-asc' : 'id-desc')}>
                <span># Ticket</span>
                <span className="sort-arrow">{sortBy.startsWith('id') ? (sortBy.endsWith('desc') ? '▼' : '▲') : '↕'}</span>
              </th>
              <th style={{ width: '150px' }}>Fecha y Hora</th>
              <th style={{ width: '150px' }}>Canal de Venta</th>
              <th style={{ width: '180px' }}>Cajero / Atendió</th>
              <th style={{ width: '180px' }}>Cliente</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Subtotal</th>
              <th style={{ width: '110px', textAlign: 'right' }}>IVA (16%)</th>
              <th style={{ width: '130px', textAlign: 'right' }} onClick={() => setSortBy(sortBy === 'total-desc' ? 'id-desc' : 'total-desc')}>
                <span>Total</span>
                <span className="sort-arrow">{sortBy.startsWith('total') ? '▼' : '↕'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredVentas.length === 0 ? (
              <tr>
                <td colSpan="8" className="spreadsheet-empty-cell">
                  <p>No se encontraron registros de ventas con el filtro aplicado.</p>
                </td>
              </tr>
            ) : (
              filteredVentas.map((v, idx) => (
                <tr key={v.IdVenta} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="font-mono text-center text-semibold text-primary">
                    #{v.IdVenta}
                  </td>
                  <td className="text-center text-secondary font-mono text-xs">
                    {v.FechaVenta ? new Date(v.FechaVenta).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="text-center">
                    <span className={`channel-badge ${v.Canal === 'Autocobro' ? 'badge-auto' : 'badge-cajero'}`}>
                      {v.Canal === 'Autocobro' ? (
                        <>
                          <CartIcon style={{ width: 11, height: 11 }} /> Autocobro
                        </>
                      ) : (
                        <>
                          <PosIcon style={{ width: 11, height: 11 }} /> Mostrador
                        </>
                      )}
                    </span>
                  </td>
                  <td className="text-secondary font-medium">
                    {v.EmpleadoNombre || (v.Canal === 'Autocobro' ? 'Terminal Autocobro' : 'Cajero')}
                  </td>
                  <td className="font-medium text-dark">
                    {v.ClienteNombre || 'Público General'}
                  </td>
                  <td className="text-right font-mono">
                    {formatMoney(v.Subtotal)}
                  </td>
                  <td className="text-right font-mono text-muted">
                    {formatMoney(v.Iva)}
                  </td>
                  <td className="text-right font-mono font-bold text-primary-dark">
                    {formatMoney(v.Total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="spreadsheet-total-row">
              <td colSpan="5" className="text-right font-bold text-uppercase">
                Totales Calculados ({filteredVentas.length} registros):
              </td>
              <td className="text-right font-mono font-bold">
                {formatMoney(liveTotals.subtotal)}
              </td>
              <td className="text-right font-mono font-bold">
                {formatMoney(liveTotals.iva)}
              </td>
              <td className="text-right font-mono font-bold text-primary total-highlight">
                {formatMoney(liveTotals.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
