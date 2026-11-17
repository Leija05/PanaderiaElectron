import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { soundFX } from '../utils/audio';
import { ProductCard } from '../components/pos/ProductCard';
import { CartTicket } from '../components/pos/CartTicket';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { Modal } from '../components/common/Modal';
import { SearchIcon, ScaleIcon, BreadIcon, CloseIcon } from '../components/common/Icons';

export const POSView = ({ isClientMode = false }) => {
  const { user } = useAuth();
  const { cart, addToCart, clearCart, totals, BOLILLO_WEIGHT_KG } = useCart();
  const { showToast } = useToast();
  const { userSettings } = useSettings() || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(() => {
    const defaultCat = userSettings?.defaultPOSCategory;
    if (defaultCat === 'Pan Dulce') return 'pan-dulce';
    if (defaultCat === 'Blanco & Bolillos') return 'pan-blanco';
    if (defaultCat === 'Repostería') return 'reposteria';
    return 'all';
  });

  // Modales
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);

  // Báscula bolillo
  const [scaleKg, setScaleKg] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.api.getProductos();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error cargando catálogo de panes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Atajos de teclado: F2 para cobrar, F4 para báscula de bolillo, Ctrl+F para buscar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsScaleOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (!p.Activo) return false;

      const matchesSearch =
        !q ||
        p.Nombre.toLowerCase().includes(q) ||
        (p.Descripcion && p.Descripcion.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (category === 'pan-blanco') {
        return /bolillo|telera|baguette|francés|virote/i.test(p.Nombre);
      }
      if (category === 'pan-dulce') {
        return /concha|cuerno|dona|oreja|margarita|rebanada|choux/i.test(p.Nombre);
      }
      if (category === 'reposteria') {
        return /pastel|muffin|panqué|tarta|cheesecake/i.test(p.Nombre);
      }
      return true;
    });
  }, [products, search, category]);

  const handleAddToCart = (product, qty = 1) => {
    try {
      addToCart(product, qty);
      if (userSettings?.soundEffects) {
        soundFX.playBeep();
      }
      if (userSettings?.autoClearSearch) {
        setSearch('');
      }
    } catch (err) {
      if (userSettings?.soundEffects) {
        soundFX.playAlert();
      }
      showToast(err.message, 'warning');
    }
  };

  const handleConfirmPayment = async ({ received, change, clientName }) => {
    const isEmployee = user && user.Rol === 'Empleado';
    const isGerente = user && user.Rol === 'Gerente';
    const idEmpleado = isEmployee || isGerente ? user.IdEmpleado : null;
    const canal = idEmpleado ? 'CajaEmpleado' : 'Autocobro';

    const payload = {
      idEmpleado,
      idCliente: user?.Rol === 'Cliente' ? user.IdEmpleado : null,
      canal,
      carrito: cart,
      datosCliente: clientName ? { nombre: clientName, genero: 'Prefiero no decir' } : null
    };

    try {
      const res = await window.api.registrarVenta(payload);
      if (res.success) {
        if (userSettings?.soundEffects) {
          soundFX.playSuccess();
        }
        showToast(`¡Venta #${res.idVenta} registrada correctamente!`, 'success');
        setIsPaymentOpen(false);

        setLastTicket({
          idVenta: res.idVenta,
          canal: res.canal,
          total: res.total,
          items: [...cart],
          isClient: isClientMode || user?.Rol === 'Cliente'
        });
        setIsReceiptOpen(true);

        clearCart();
        loadProducts();
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar la venta', 'error');
    }
  };

  // Báscula de bolillo
  const bolilloProduct = useMemo(
    () => products.find((p) => /bolillo/i.test(p.Nombre)),
    [products]
  );
  const calculatedBolilloPieces = useMemo(() => {
    const kg = parseFloat(scaleKg) || 0;
    return Math.round(kg / BOLILLO_WEIGHT_KG);
  }, [scaleKg, BOLILLO_WEIGHT_KG]);

  const handleAddBolilloFromScale = () => {
    if (!bolilloProduct) {
      showToast('No se encontró el bolillo en el catálogo', 'warning');
      return;
    }
    if (calculatedBolilloPieces <= 0) {
      showToast('Ingresa un peso válido en kilogramos', 'warning');
      return;
    }
    handleAddToCart(bolilloProduct, calculatedBolilloPieces);
    showToast(`Se agregaron ${calculatedBolilloPieces} bolillos a la canasta.`, 'success');
    setIsScaleOpen(false);
    setScaleKg('');
  };

  return (
    <div className="pos-layout animate-fade-in">
      <div className="pos-catalog-column">
        {/* Barra de Búsqueda y Báscula */}
        <div className="pos-toolbar">
          <div className="pos-search-wrapper">
            <span className="pos-search-icon">
              <SearchIcon style={{ width: 18, height: 18 }} />
            </span>
            <input
              id="pos-search-input"
              type="text"
              className="pos-search-input"
              placeholder="Buscar pan dulce, bolillos, pasteles... (Ctrl+F)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                className="btn-clear-search"
                onClick={() => setSearch('')}
                aria-label="Borrar búsqueda"
              >
                &times;
              </button>
            )}
          </div>

          <button
            className="btn btn-outline btn-sm tool-btn"
            onClick={() => setIsScaleOpen(true)}
            title="Calcular piezas de bolillo por peso (F4)"
          >
            <ScaleIcon style={{ width: 16, height: 16 }} />
            <span>Báscula Bolillo (F4)</span>
          </button>
        </div>

        {/* Categorías */}
        <div className="pos-categories-scroll">
          <button
            className={`pos-category-pill ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            Todos los Panes
          </button>
          <button
            className={`pos-category-pill ${category === 'pan-dulce' ? 'active' : ''}`}
            onClick={() => setCategory('pan-dulce')}
          >
            Pan Dulce
          </button>
          <button
            className={`pos-category-pill ${category === 'pan-blanco' ? 'active' : ''}`}
            onClick={() => setCategory('pan-blanco')}
          >
            Pan Blanco &amp; Bolillos
          </button>
          <button
            className={`pos-category-pill ${category === 'reposteria' ? 'active' : ''}`}
            onClick={() => setCategory('reposteria')}
          >
            Repostería
          </button>
        </div>

        {/* Cuadrícula de Panes */}
        {loading ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <BreadIcon style={{ width: 48, height: 48, opacity: 0.4 }} />
            <p>No se encontraron panes con ese nombre.</p>
          </div>
        ) : (
          <div className="pos-products-grid">
            {filteredProducts.map((p) => (
              <ProductCard key={p.IdArticulo} product={p} onAdd={handleAddToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Ticket Comanda Lateral */}
      <CartTicket
        onCheckout={() => setIsPaymentOpen(true)}
        isClientMode={isClientMode}
      />

      {/* Modal de Cobro */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={totals.total}
        onConfirm={handleConfirmPayment}
        isClientMode={isClientMode || user?.Rol === 'Cliente'}
      />

      {/* Modal de Ticket Térmico */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        ticketData={lastTicket}
      />

      {/* Modal de Báscula Bolillo */}
      <Modal
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        title="Báscula de Bolillo"
        subtitle="Calcula piezas automáticamente a partir del peso registrado."
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsScaleOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleAddBolilloFromScale}>
              Agregar al Carrito
            </button>
          </>
        }
      >
        <div className="bolillo-calc-box">
          <p className="calc-hint">
            Peso promedio estándar de referencia: <strong>65g</strong> por pieza.
          </p>
          <div className="form-group">
            <label className="form-label">Peso total registrado en la báscula (Kilogramos):</label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="form-control input-lg"
                step="0.05"
                min="0.05"
                placeholder="0.65"
                value={scaleKg}
                onChange={(e) => setScaleKg(e.target.value)}
                autoFocus
              />
              <span className="input-suffix-badge">kg</span>
            </div>
          </div>

          <div className="calc-result-badge">
            <span className="calc-pieces">{calculatedBolilloPieces}</span>
            <span className="calc-label">piezas calculadas</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

