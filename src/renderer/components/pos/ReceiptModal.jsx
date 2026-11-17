import React, { useEffect } from 'react';
import { Modal } from '../common/Modal';
import { BakeryLogo, PrinterIcon } from '../common/Icons';
import { formatMoney } from './ProductCard';
import { useSettings } from '../../context/SettingsContext';

export const ReceiptModal = ({ isOpen, onClose, ticketData }) => {
  if (!isOpen || !ticketData) return null;

  const { globalSettings, userSettings } = useSettings() || {};
  const nombreTienda = globalSettings?.nombrePanaderia || 'DULCE HORNO';
  const rfcTienda = globalSettings?.rfcTienda || '';
  const contactoTienda = globalSettings?.contactoTicket || 'Panadería & Repostería Artesanal';
  const pieTicket = globalSettings?.pieTicket || '¡Gracias por su preferencia! Vuelva pronto.';

  const { idVenta, canal, total, items = [], isClient = false } = ticketData;
  const fecha = new Date().toLocaleString('es-MX');

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (isOpen && userSettings?.autoPrintReceipt) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, userSettings?.autoPrintReceipt]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ticket de Venta Generado"
      maxWidth="400px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <PrinterIcon style={{ width: 18, height: 18 }} />
            <span>Imprimir Ticket</span>
          </button>
        </>
      }
    >
      <div className="receipt-paper" id="printable-ticket">
        <div className="receipt-header">
          <div className="receipt-logo">
            <BakeryLogo size={48} />
          </div>
          <h2 className="receipt-store-name">{nombreTienda.toUpperCase()}</h2>
          {rfcTienda && <p className="receipt-meta-line" style={{ fontWeight: 700 }}>RFC: {rfcTienda}</p>}
          <p className="receipt-store-sub">{contactoTienda}</p>
          <div className="receipt-divider">--------------------------------</div>
          <p className="receipt-meta-line">
            <strong>{isClient ? 'TICKET DE COMPRA' : 'COMPROBANTE DE VENTA'}</strong>
          </p>
          <p className="receipt-meta-line">Folio: #{idVenta} &bull; Canal: {canal}</p>
          <p className="receipt-meta-line">{fecha}</p>
          <div className="receipt-divider">--------------------------------</div>
        </div>

        <table className="receipt-table">
          <thead>
            <tr>
              <th className="ticket-td-prod">Art.</th>
              <th className="ticket-td-center">Cant</th>
              <th className="ticket-td-right">P.U.</th>
              <th className="ticket-td-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="ticket-td-prod">{item.nombre}</td>
                <td className="ticket-td-center">{item.cantidad}</td>
                <td className="ticket-td-right">{formatMoney(item.precio)}</td>
                <td className="ticket-td-right font-semibold">
                  {formatMoney(item.cantidad * item.precio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider">--------------------------------</div>
        <div className="receipt-totals">
          <div className="receipt-total-row final-total">
            <span>TOTAL:</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
        <div className="receipt-divider">--------------------------------</div>

        <div className="receipt-footer">
          <p>{pieTicket}</p>
          <p>Conserve este comprobante para aclaraciones.</p>
        </div>
      </div>
    </Modal>
  );
};

