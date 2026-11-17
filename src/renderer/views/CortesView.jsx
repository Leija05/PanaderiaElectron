import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { CutIcon, PosIcon, CartIcon, LockIcon, KeyIcon, CheckIcon, PrinterIcon } from '../components/common/Icons';
import { formatMoney } from '../components/pos/ProductCard';

export const CortesView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [channel, setChannel] = useState('CajaEmpleado');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [managerUser, setManagerUser] = useState('');
  const [managerPass, setManagerPass] = useState('');
  const [corteResult, setCorteResult] = useState(null);

  const handleExecuteCorte = async (e) => {
    e.preventDefault();
    if (!managerUser || !managerPass) {
      showToast('Ingresa usuario y contraseña de gerente', 'warning');
      return;
    }

    const isSelfCheckout = channel === 'Autocobro';
    const payload = {
      channel,
      idEmpleado: isSelfCheckout ? null : user?.IdEmpleado || null,
      gerenteUsuario: managerUser,
      gerentePassword: managerPass
    };

    try {
      const res = await window.api.registrarCorteTurno(payload);
      if (res.success) {
        showToast(`Corte #${res.idCorte} registrado por ${res.autorizadoPor}`, 'success');
        setCorteResult(res);
        setIsAuthOpen(false);
        setManagerUser('');
        setManagerPass('');
      }
    } catch (err) {
      showToast(err.message || 'Error al ejecutar corte de turno', 'error');
    }
  };

  return (
    <div className="view-page animate-fade-in">
      <div className="view-header-bar">
        <div>
          <h1 className="view-page-title">
            <CutIcon style={{ width: 26, height: 26 }} />
            <span>Corte de Turno y Arqueo de Caja</span>
          </h1>
          <p className="view-page-sub">
            Cierre contable de caja con autorización de Gerencia para cuadre de ingresos.
          </p>
        </div>
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="corte-intro-box">
          <div className="corte-icon-banner">
            <CutIcon style={{ width: 36, height: 36 }} />
          </div>
          <h2 className="corte-box-title">Cierre Contable de Turno</h2>
          <p className="corte-box-desc">
            Calcula todas las ventas del canal seleccionado desde el último arqueo, totaliza el dinero en caja y emite el comprobante de turno.
          </p>
        </div>

        <div className="form-group mt-4">
          <label className="form-label font-bold">Selecciona el Canal para el Corte:</label>
          <div className="channel-radio-group">
            <label
              className={`channel-radio-card ${channel === 'CajaEmpleado' ? 'active' : ''}`}
              onClick={() => setChannel('CajaEmpleado')}
            >
              <input
                type="radio"
                name="channel"
                value="CajaEmpleado"
                checked={channel === 'CajaEmpleado'}
                onChange={() => setChannel('CajaEmpleado')}
              />
              <div className="channel-card-body">
                <span className="channel-icon">
                  <PosIcon style={{ width: 22, height: 22 }} />
                </span>
                <span className="channel-title">Caja Mostrador (Empleado)</span>
                <small className="text-secondary">Ventas cobradas por cajeros</small>
              </div>
            </label>

            <label
              className={`channel-radio-card ${channel === 'Autocobro' ? 'active' : ''}`}
              onClick={() => setChannel('Autocobro')}
            >
              <input
                type="radio"
                name="channel"
                value="Autocobro"
                checked={channel === 'Autocobro'}
                onChange={() => setChannel('Autocobro')}
              />
              <div className="channel-card-body">
                <span className="channel-icon">
                  <CartIcon style={{ width: 22, height: 22 }} />
                </span>
                <span className="channel-title">Terminal Autocobro</span>
                <small className="text-secondary">Ventas de autoservicio</small>
              </div>
            </label>
          </div>
        </div>

        <div className="corte-action-footer mt-5">
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => setIsAuthOpen(true)}
          >
            <LockIcon style={{ width: 18, height: 18 }} />
            <span>Solicitar Autorización de Gerente y Cortar</span>
          </button>
        </div>

        {corteResult && (
          <div className="corte-summary-card animate-pop-in mt-4">
            <div className="corte-summary-header">
              <div className="corte-check-icon">
                <CheckIcon style={{ width: 24, height: 24 }} />
              </div>
              <h3>Corte de Turno #{corteResult.idCorte} Realizado</h3>
              <p className="text-secondary text-sm">
                Autorizado por: <strong>{corteResult.autorizadoPor}</strong>
              </p>
            </div>

            <div className="corte-summary-metrics">
              <div className="summary-metric-item">
                <span className="metric-label">Periodo:</span>
                <span className="metric-val text-xs font-mono">
                  {corteResult.resumen.fechaInicio} &bull; {corteResult.resumen.fechaFin}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-label">Ventas Cobradas:</span>
                <span className="metric-val">{corteResult.resumen.totalVentas} tickets</span>
              </div>
              <div className="summary-metric-item highlight">
                <span className="metric-label">Importe Total en Caja:</span>
                <span className="metric-val font-bold text-success">
                  {formatMoney(corteResult.resumen.totalImporte)}
                </span>
              </div>
            </div>

            <div className="corte-actions mt-3">
              <button className="btn btn-outline btn-block" onClick={() => window.print()}>
                <PrinterIcon style={{ width: 16, height: 16 }} />
                <span>Imprimir Comprobante de Corte</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Autorización Gerente */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Autorización Gerencial Requerida"
        subtitle="Ingresa credenciales de un Gerente activo para validar el corte."
        type="warning"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAuthOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-warning" onClick={handleExecuteCorte}>
              <KeyIcon style={{ width: 16, height: 16 }} />
              <span>Autorizar y Procesar Corte</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleExecuteCorte} className="modal-form">
          <div className="form-group">
            <label className="form-label">Usuario Gerente:</label>
            <input
              type="text"
              className="form-control"
              placeholder="gerente_demo"
              value={managerUser}
              onChange={(e) => setManagerUser(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña:</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={managerPass}
              onChange={(e) => setManagerPass(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

