import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CashIcon, CheckIcon } from '../common/Icons';
import { formatMoney } from './ProductCard';

export const PaymentModal = ({ isOpen, onClose, total, onConfirm, isClientMode }) => {
  const [received, setReceived] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReceived(total.toFixed(2));
      setClientName('');
    }
  }, [isOpen, total]);

  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - total;
  const isSufficient = change >= 0;

  const handleQuickCash = (val) => {
    setReceived(val.toString());
  };

  const handleFinalize = () => {
    if (!isSufficient && !isClientMode) return;
    onConfirm({
      received: receivedNum,
      change: Math.max(0, change),
      clientName: clientName.trim() || null
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isClientMode ? 'Confirmar Compra' : 'Cobro de Venta en Caja'}
      subtitle={`Total a pagar: ${formatMoney(total)}`}
      maxWidth="480px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-success btn-lg"
            disabled={!isSufficient && !isClientMode}
            onClick={handleFinalize}
          >
            <CheckIcon style={{ width: 18, height: 18 }} />
            <span>Finalizar y Cobrar</span>
          </button>
        </>
      }
    >
      {isClientMode ? (
        <div className="self-checkout-info">
          <p className="text-secondary text-sm mb-3">
            Revisa tus productos antes de finalizar la compra. Puedes agregar tu nombre para el ticket:
          </p>
          <div className="form-group">
            <label className="form-label">Nombre del Cliente (Opcional):</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Roberto Morales"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div className="cashier-payment-grid">
          <div className="form-group">
            <label className="form-label">Efectivo Recibido:</label>
            <div className="input-with-symbol">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                className="form-control input-lg"
                step="0.5"
                min="0"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="quick-cash-buttons">
            <button
              className="btn btn-outline quick-cash-btn"
              onClick={() => handleQuickCash(Math.ceil(total))}
            >
              Exacto (${Math.ceil(total)})
            </button>
            <button className="btn btn-outline quick-cash-btn" onClick={() => handleQuickCash(50)}>
              $50
            </button>
            <button className="btn btn-outline quick-cash-btn" onClick={() => handleQuickCash(100)}>
              $100
            </button>
            <button className="btn btn-outline quick-cash-btn" onClick={() => handleQuickCash(200)}>
              $200
            </button>
            <button className="btn btn-outline quick-cash-btn" onClick={() => handleQuickCash(500)}>
              $500
            </button>
            <button className="btn btn-outline quick-cash-btn" onClick={() => handleQuickCash(1000)}>
              $1000
            </button>
          </div>

          <div
            className={`change-display-box ${
              isSufficient ? 'sufficient-funds' : 'insufficient-funds'
            }`}
          >
            <span className="change-label">Cambio:</span>
            <span className="change-amount">
              {isSufficient
                ? formatMoney(change)
                : `Faltan ${formatMoney(Math.abs(change))}`}
            </span>
          </div>

          <div className="form-group mt-3">
            <label className="form-label">Nombre del Cliente (Opcional):</label>
            <input
              type="text"
              className="form-control"
              placeholder="Público en general"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

