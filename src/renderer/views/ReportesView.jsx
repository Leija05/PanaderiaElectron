import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { ChartIcon, BoxIcon, CashIcon, CartIcon, BreadIcon, AlertIcon, DownloadIcon } from '../components/common/Icons';
import { formatMoney } from '../components/pos/ProductCard';

export const ReportesView = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState('weekly');
  const [activeSubtab, setActiveSubtab] = useState('resumen');
  const [reportData, setReportData] = useState(null);
  const [auxiliarData, setAuxiliarData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fechas personalizadas
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const filters = { mode };
      if (mode === 'custom') {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      const [data, aux] = await Promise.all([
        window.api.getReportes(filters),
        window.api.getAuxiliarMovimientos({ days: 15 })
      ]);
      setReportData(data);
      setAuxiliarData(aux || []);
    } catch (err) {
      showToast('Error generando estadísticas de reportes', 'error');
    } finally {
      setLoading(false);
    }
  }, [mode, startDate, endDate, showToast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.ventas) return;
    const { ventas, range } = reportData;

    const headers = ['ID Venta', 'Fecha', 'Canal', 'Empleado', 'Cliente', 'Subtotal', 'IVA', 'Total'];
    const rows = ventas.map((v) => [
      v.IdVenta,
      v.FechaVenta,
      v.Canal,
      v.EmpleadoNombre || 'Autocobro',
      v.ClienteNombre || 'Público General',
      v.Subtotal,
      v.Iva,
      v.Total
    ]);

    const escapeCell = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
    const content = `\uFEFF${headerLine}\n${dataLines}`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Panaderia_${range.start.slice(0, 10)}_al_${range.end.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reporte exportado como archivo CSV.', 'success');
  };

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <ChartIcon style={{ width: 26, height: 26 }} />
            <span>Reportes y Métricas Operativas</span>
          </h1>
          <p className="view-page-sub">
            Analiza ingresos por periodo, productos con mayor demanda y kardex de movimientos.
          </p>
        </div>

        <button className="btn btn-outline" onClick={handleExportCSV}>
          <DownloadIcon style={{ width: 16, height: 16 }} />
          <span>Exportar Reporte CSV</span>
        </button>
      </div>

      {/* Selector de Periodo */}
      <div className="card rep-filter-card">
        <div className="rep-filter-row">
          <div className="filter-period-buttons">
            <button
              className={`btn btn-sm ${mode === 'weekly' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMode('weekly')}
            >
              Esta Semana
            </button>
            <button
              className={`btn btn-sm ${mode === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMode('monthly')}
            >
              Este Mes
            </button>
            <button
              className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMode('custom')}
            >
              Rango Personalizado
            </button>
          </div>

          {mode === 'custom' && (
            <div className="filter-custom-dates">
              <div className="date-input-group">
                <label>Desde:</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>Hasta:</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={loadReport}>
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tabs-nav-bar mt-3">
        <button
          className={`tab-btn ${activeSubtab === 'resumen' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('resumen')}
        >
          <ChartIcon style={{ width: 18, height: 18 }} />
          <span>Resumen Ejecutivo</span>
        </button>
        <button
          className={`tab-btn ${activeSubtab === 'kardex' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('kardex')}
        >
          <BoxIcon style={{ width: 18, height: 18 }} />
          <span>Auxiliar Kardex (Movimientos)</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state mt-4">
          <span className="spinner"></span>
          <p>Generando estadísticas...</p>
        </div>
      ) : activeSubtab === 'resumen' && reportData ? (
        <div className="mt-4">
          {/* Tarjetas KPI */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-circle kpi-primary">
                <CashIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Ingresos Totales</span>
                <span className="kpi-value text-primary">
                  {formatMoney(reportData.resumen.totalIngresos)}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-circle kpi-success">
                <CartIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Ventas Cobradas</span>
                <span className="kpi-value">{reportData.resumen.ventas} tickets</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-circle kpi-amber">
                <BreadIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Piezas Vendidas</span>
                <span className="kpi-value">{reportData.resumen.articulosVendidos} pzs</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-circle kpi-danger">
                <AlertIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Bolillo &amp; Stock Mínimo</span>
                <span className="kpi-value">
                  {reportData.resumen.bolilloPiezas} pzs ({reportData.resumen.bolilloKilosEstimados} kg)
                </span>
                <span
                  className={`text-xs ${
                    reportData.resumen.productosStockBajo > 0
                      ? 'text-danger font-semibold'
                      : 'text-muted'
                  }`}
                >
                  {reportData.resumen.productosStockBajo} panes con stock crítico
                </span>
              </div>
            </div>
          </div>

          {/* Columnas: Canal de Venta y Más Vendidos */}
          <div className="dashboard-columns mt-4">
            <div className="card">
              <h3 className="card-subtitle-bold">
                <CashIcon style={{ width: 20, height: 20 }} />
                <span>Ventas por Canal</span>
              </h3>
              <div className="channel-distribution-grid mt-3">
                {reportData.porCanal.map((c) => (
                  <div key={c.canal} className="channel-metric-box">
                    <span className="channel-name">
                      {c.canal === 'CajaEmpleado'
                        ? 'Caja Mostrador'
                        : c.canal === 'Autocobro'
                        ? 'Autocobro'
                        : 'Sin Clasificar'}
                    </span>
                    <span className="channel-total">{formatMoney(c.total)}</span>
                    <span className="channel-count">{c.ventas} tickets</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-subtitle-bold">
                <BreadIcon style={{ width: 20, height: 20 }} />
                <span>Panes con Mayor Venta</span>
              </h3>
              <table className="data-table mt-2">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Piezas</th>
                    <th>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.productosMasVendidos.slice(0, 6).map((p) => (
                    <tr key={p.idArticulo}>
                      <td className="font-semibold">{p.producto}</td>
                      <td>
                        <strong>{p.cantidadVendida}</strong> pzs
                      </td>
                      <td className="font-mono">{formatMoney(p.importe)}</td>
                    </tr>
                  ))}
                  {reportData.productosMasVendidos.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">
                        Sin ventas registradas en el periodo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Ventas por Día */}
          <div className="card mt-4">
            <h3 className="card-subtitle-bold">
              <ChartIcon style={{ width: 20, height: 20 }} />
              <span>Desglose Diario de Ingresos</span>
            </h3>
            <div className="table-responsive mt-3">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tickets</th>
                    <th>Autocobro</th>
                    <th>Caja Mostrador</th>
                    <th>Total Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.ventasPorDia.map((d) => (
                    <tr key={d.fecha}>
                      <td className="font-mono font-semibold">{d.fecha}</td>
                      <td>{d.ventas}</td>
                      <td>{formatMoney(d.autocobro)}</td>
                      <td>{formatMoney(d.cajaEmpleado)}</td>
                      <td className="font-bold text-success">{formatMoney(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mt-4">
          <h3 className="card-subtitle-bold">
            <BoxIcon style={{ width: 20, height: 20 }} />
            <span>Kardex de Movimientos (Auditoría de Entradas y Salidas)</span>
          </h3>
          <p className="text-secondary text-sm mb-3">
            Historial de entradas por recepción a proveedores, salidas por ventas en caja y reintegros.
          </p>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {auxiliarData.map((m) => {
                  const isEntrada = m.TipoMovimiento === 'Entrada';
                  return (
                    <tr key={m.IdMovimiento}>
                      <td className="font-mono text-secondary text-xs">
                        {new Date(m.FechaMovimiento).toLocaleString('es-MX')}
                      </td>
                      <td className="font-semibold">{m.Producto}</td>
                      <td>
                        <span className={`badge ${isEntrada ? 'badge-success' : 'badge-danger'}`}>
                          {isEntrada ? '+ Entrada' : '- Salida'}
                        </span>
                      </td>
                      <td
                        className={`font-mono font-bold ${
                          isEntrada ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {isEntrada ? `+${m.Cantidad}` : `-${m.Cantidad}`}
                      </td>
                      <td>{m.Motivo || '-'}</td>
                      <td className="text-xs font-mono">
                        {m.NumeroRecepcion
                          ? `Recepción ${m.NumeroRecepcion}`
                          : m.IdVenta
                          ? `Venta #${m.IdVenta}`
                          : m.TipoReferencia || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

