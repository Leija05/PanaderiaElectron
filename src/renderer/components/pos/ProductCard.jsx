import React from 'react';
import { PlusIcon } from '../common/Icons';

export const formatMoney = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number(val || 0));
};

export const ProductCard = ({ product, onAdd }) => {
  const stock = Number(product.Cantidad || 0);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= Number(product.Minimo || 5);

  return (
    <div
      className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={() => {
        if (!isOutOfStock) onAdd(product);
      }}
    >
      <div className="pos-product-header">
        <span
          className={`stock-pill ${
            isOutOfStock ? 'pill-danger' : isLowStock ? 'pill-warning' : 'pill-success'
          }`}
        >
          {isOutOfStock ? 'Agotado' : `${stock} disponibles`}
        </span>
      </div>

      <div className="pos-product-body">
        <h3 className="pos-product-name">{product.Nombre}</h3>
        {product.Descripcion && (
          <p className="pos-product-desc">{product.Descripcion}</p>
        )}
      </div>

      <div className="pos-product-footer">
        <div className="pos-product-price">{formatMoney(product.PrecioVenta)}</div>
        <button
          className={`pos-add-btn ${isOutOfStock ? 'disabled' : ''}`}
          disabled={isOutOfStock}
          aria-label={`Agregar ${product.Nombre}`}
        >
          <PlusIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
};

