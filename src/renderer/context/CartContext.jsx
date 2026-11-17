import React, { createContext, useContext, useState, useMemo } from 'react';
import { useSettings } from './SettingsContext';

const CartContext = createContext();

export const DEFAULT_BOLILLO_WEIGHT_KG = 0.065;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const settingsContext = useSettings();
  const globalSettings = settingsContext?.globalSettings;

  const ivaRate = (Number(globalSettings?.ivaPorcentaje ?? 16)) / 100;
  const bolilloWeight = Number(globalSettings?.pesoBolilloRefKg ?? DEFAULT_BOLILLO_WEIGHT_KG);

  const addToCart = (product, quantity = 1) => {
    const maxAvailable = Number(product.Cantidad || 0);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.IdArticulo);
      if (existing) {
        const nextQty = existing.cantidad + quantity;
        if (nextQty > maxAvailable) {
          throw new Error(`Existencia máxima alcanzada para ${product.Nombre} (${maxAvailable} disponibles).`);
        }
        return prevCart.map((item) =>
          item.id === product.IdArticulo ? { ...item, cantidad: nextQty } : item
        );
      } else {
        if (quantity > maxAvailable) {
          throw new Error(`Solo hay ${maxAvailable} unidades disponibles de ${product.Nombre}.`);
        }
        return [
          ...prevCart,
          {
            id: product.IdArticulo,
            nombre: product.Nombre,
            precio: Number(product.PrecioVenta || 0),
            cantidad: quantity,
            max: maxAvailable
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          if (quantity > item.max) {
            throw new Error(`Solo hay ${item.max} unidades disponibles.`);
          }
          return { ...item, cantidad: quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const iva = subtotal * ivaRate;
    const total = subtotal + iva;
    const count = cart.reduce((acc, item) => acc + item.cantidad, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      count
    };
  }, [cart, ivaRate]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totals,
        BOLILLO_WEIGHT_KG: bolilloWeight,
        ivaRate
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

