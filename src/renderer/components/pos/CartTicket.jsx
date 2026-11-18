import React from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useConfirm } from '../../context/ConfirmContext';
import { CartIcon, TrashIcon } from '../common/Icons';
import { formatMoney } from './ProductCard';

export const CartTicket = ({ onCheckout, isClientMode = false }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, totals } = useCart();
  const { user } = useAuth();
  const { userSettings } = useSettings() || {};
  const { confirm } = useConfirm();

  const isSelfCheckout = isClientMode || user?.Rol === 'Cliente';

  const handleClear = async () => {
    if (userSettings?.confirmClearCart) {
      const ok = await confirm({
        title: 'Vaciar Ticket de Venta',
        subtitle: 'Canasta de productos',
        message: '¿Estás seguro de vaciar todos los productos del ticket actual? Esta acción no se puede deshacer.',
        confirmText: 'Sí, Vaciar Todo',
        cancelText: 'Cancelar',
        type: 'warning',
        confirmButtonClass: 'btn-danger'
      });
      if (ok) {
        clearCart();
      }
    } else {
      clearCart();
    }
  };

  return (
    <div className="pos-cart-column">
      <div className="pos-cart-header">
        <div className="cart-title-row">
          <h2 className="pos-cart-title">
            <CartIcon style={{ width: 22, height: 22 }} />
            <span>{isSelfCheckout ? 'Tu Canasta' : 'Ticket de Venta'}</span>
          </h2>
          {cart.length > 0 && (
            <button className="btn-text-danger" onClick={handleClear} title="Vaciar canasta">
              Vaciar
            </button>
          )}
        </div>
        <div className="cart-meta-info">
          <span className={`cart-mode-badge ${isSelfCheckout ? 'badge-client' : 'badge-cashier'}`}>
            {isSelfCheckout
              ? 'Modo Autocobro'
              : `Cajero: ${user?.NombreCompleto || user?.NombreUsuario}`}
          </span>
        </div>
      </div>

      <div className="pos-cart-items-container">
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">
              <CartIcon style={{ width: 44, height: 44, opacity: 0.3 }} />
            </div>
            <p className="cart-empty-title">Canasta vacía</p>
            <p className="cart-empty-sub">Selecciona panes artesanales para agregarlos al pedido.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="pos-cart-item animate-slide-in">
              <div className="cart-item-info">
                <h4 className="cart-item-name">{item.nombre}</h4>
                <div className="cart-item-unit-price">{formatMoney(item.precio)} c/u</div>
              </div>

              <div className="cart-item-controls">
                <button
                  className="cart-qty-btn"
                  onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                  aria-label="Disminuir"
                >
                  -
                </button>
                <span className="cart-qty-number">{item.cantidad}</span>
                <button
                  className="cart-qty-btn"
                  onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">{formatMoney(item.precio * item.cantidad)}</div>

              <button
                className="cart-item-delete"
                onClick={() => removeFromCart(item.id)}
                aria-label="Eliminar"
              >
                <TrashIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pos-cart-footer">
        <div className="pos-summary-table">
          <div className="pos-summary-row">
            <span>Subtotal:</span>
            <span>{formatMoney(totals.subtotal)}</span>
          </div>
          <div className="pos-summary-row">
            <span>IVA (16%):</span>
            <span>{formatMoney(totals.iva)}</span>
          </div>
          <div className="pos-summary-row total-row">
            <span>TOTAL:</span>
            <span>{formatMoney(totals.total)}</span>
          </div>
        </div>

        <button
          className="btn btn-success btn-block btn-checkout"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          <div className="checkout-content">
            <span className="checkout-label">COBRAR (F2)</span>
            <span className="checkout-total">{formatMoney(totals.total)}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

