import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  CheckCircle,
  Wine, 
  CreditCard, 
  Share2,
  AlertCircle
} from 'lucide-react';
import { Product, Booking, Sale, Court } from '../types';
import LucideIcon from './LucideIcon';

interface BarPOSProps {
  products: Product[];
  bookings: Booking[];
  courts: Court[];
  onRegisterSale: (items: { productId: string; qty: number }[], paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta', description?: string) => void;
  onAddProductToTab: (bookingId: string, productId: string, qty: number) => void;
  formatPrice: (amount: number) => string;
}

export default function BarPOS({
  products,
  bookings,
  courts,
  onRegisterSale,
  onAddProductToTab,
  formatPrice
}: BarPOSProps) {
  // POS Cart State
  const [cart, setCart] = useState<{ productId: string; qty: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<'todo' | 'bebidas' | 'snacks' | 'accesorios' | 'palas'>('todo');
  const [searchQuery, setSearchQuery] = useState('');

  // Target of finalization: 'direct' or 'court'
  const [checkoutTarget, setCheckoutTarget] = useState<'direct' | 'court'>('direct');
  const [directPaymentMethod, setDirectPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [selectedCourtBookingId, setSelectedCourtBookingId] = useState('');

  // Notifications
  const [successMessage, setSuccessMessage] = useState('');

  // Filter products by search & category
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'todo' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate cart metrics
  const cartDetailed = cart.map(item => {
    const product = products.find(p => p.id === item.productId)!;
    return {
      product,
      qty: item.qty,
      subtotal: product.price * item.qty
    };
  });

  const cartTotal = cartDetailed.reduce((sum, item) => sum + item.subtotal, 0);

  // Cart operations
  const handleAddToCart = (productId: string) => {
    const targetProduct = products.find(p => p.id === productId)!;
    const currentCartItem = cart.find(item => item.productId === productId);
    const currentQtyInCart = currentCartItem ? currentCartItem.qty : 0;

    if (targetProduct.stock <= currentQtyInCart) {
      alert(`Lo sentimos, no hay más stock disponible de este producto.`);
      return;
    }

    if (currentCartItem) {
      setCart(cart.map(item => 
        item.productId === productId ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { productId, qty: 1 }]);
    }
  };

  const handleUpdateQty = (productId: string, val: number) => {
    const targetProduct = products.find(p => p.id === productId)!;
    const item = cart.find(c => c.productId === productId);
    if (!item) return;

    const targetQty = item.qty + val;

    if (targetQty <= 0) {
      setCart(cart.filter(c => c.productId !== productId));
      return;
    }

    if (targetQty > targetProduct.stock) {
      alert(`Solo quedan ${targetProduct.stock} unidades de este producto en el inventario.`);
      return;
    }

    setCart(cart.map(c => 
      c.productId === productId ? { ...c, qty: targetQty } : c
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Process checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (checkoutTarget === 'direct') {
      // Direct POS sale
      onRegisterSale(cart, directPaymentMethod, 'Venta directa mostrador Bar');
      triggerSuccess('¡Venta registrada con éxito y stock descontado!');
    } else {
      // Court assignment sale
      if (!selectedCourtBookingId) {
        alert('Por favor selecciona una cancha / turno activo para asignar los consumos.');
        return;
      }

      // Add item by item to target reservation
      cart.forEach(item => {
        onAddProductToTab(selectedCourtBookingId, item.productId, item.qty);
      });

      const courtBooking = bookings.find(b => b.id === selectedCourtBookingId);
      triggerSuccess(`¡Insumos cargados al saldo de la cuenta de ${courtBooking?.clientName || 'la cancha'}!`);
    }

    setCart([]);
    setSelectedCourtBookingId('');
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Find active ongoing court bookings today to list in dropdown
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTodayBookings = bookings.filter(b => 
    b.date === todayStr && 
    b.status === 'reservado' && 
    !b.paid
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 id="bar-pos-title" className="text-3xl font-extrabold text-white tracking-tight">Pistacho Bar / POS</h1>
        <p className="text-slate-400 mt-1">Sencilla interfaz táctil para vender productos del mostrador o cargarlos a las canchas.</p>
      </div>

      {/* Alert bar */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL-1 & COL-2: PRODUCT CATALOG SELECTION */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar: Search & Categories */}
          <div className="bg-[#1E293B] p-4 rounded-3xl border border-[#334155] shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                id="pos-search-input"
                placeholder="Buscar bebida o accesorio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#334155] rounded-xl bg-slate-900 text-white focus:outline-hidden focus:ring-1 focus:ring-lime-400 focus:bg-slate-900"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {(['todo', 'bebidas', 'snacks', 'accesorios', 'palas'] as const).map(cat => (
                <button
                  key={cat}
                  id={`category-tab-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wide cursor-pointer transition-all ${
                    activeCategory === cat 
                      ? 'bg-lime-400 text-slate-950 shadow-md font-black' 
                      : 'bg-slate-800 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-[#334155]'
                  }`}
                >
                  {cat === 'todo' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Cards Catalog */}
          {filteredProducts.length === 0 ? (
            <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-lg text-center py-16 space-y-2">
              <Wine className="mx-auto text-slate-600" size={40} />
              <h3 className="font-bold text-white">No se encontraron productos</h3>
              <p className="text-xs text-slate-400">Intenta filtrando otra categoría o limpiando la barra de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const qtyAlreadyInCart = cart.find(c => c.productId === product.id)?.qty || 0;
                const finalStockFree = product.stock - qtyAlreadyInCart;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    id={`pos-product-card-${product.id}`}
                    className={`bg-[#0F172A] rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isOutOfStock 
                        ? 'border-[#334155]/60 opacity-50' 
                        : 'border-[#334155] hover:border-lime-400/60 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Icon header status */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] text-lime-400 font-extrabold uppercase tracking-wider">{product.category}</span>
                        {finalStockFree <= 0 ? (
                          <span className="text-[9px] font-bold bg-rose-500/25 text-rose-400 px-1.5 py-0.5 rounded-md">AGOTADO</span>
                        ) : product.stock <= product.minStock ? (
                          <span className="text-[9px] font-bold bg-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded-md">Poco Stock</span>
                        ) : null}
                      </div>

                      {/* Product details */}
                      <div className="mt-2.5 flex items-start gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isOutOfStock ? 'bg-slate-900 border-[#334155] text-slate-600' : 'bg-[#1E293B] border-[#334155] text-lime-404 text-lime-400'
                        }`}>
                          <LucideIcon name={product.iconName} size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{product.name}</h4>
                          <span className="block text-[10px] text-slate-400 mt-1">Disponibles: <strong className="text-slate-300">{product.stock} un.</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Footer add controller */}
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#334155]">
                      <span className="text-sm font-black text-white font-mono">{formatPrice(product.price)}</span>
                      <button
                        type="button"
                        id={`add-to-cart-btn-${product.id}`}
                        disabled={finalStockFree <= 0}
                        onClick={() => handleAddToCart(product.id)}
                        className="p-1.5 bg-lime-404 bg-lime-400 hover:bg-lime-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-sm"
                        title="Agregar al carrito"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* COL-3: CURRENT BASKET / CART */}
        <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-xl flex flex-col h-full max-h-[600px] overflow-hidden">
          {/* Header Cart */}
          <div className="p-4 bg-slate-900/50 border-b border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="text-lime-400" size={16} />
              <h3 className="font-extrabold text-white text-sm">Resumen de Venta</h3>
            </div>
            {cart.length > 0 && (
              <button 
                id="clear-cart-btn"
                onClick={handleClearCart}
                className="text-[10px] font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Cart detailed rows list */}
          <div className="p-4 flex-1 overflow-y-auto divide-y divide-[#334155]/60">
            {cart.length === 0 ? (
              <div className="text-center py-24 text-slate-400 space-y-2 flex flex-col items-center">
                <ShoppingBag className="text-slate-600" size={32} />
                <p className="text-xs font-bold text-slate-300">El carrito está vacío</p>
                <p className="text-[10px] text-slate-400">Presiona el botón "+" en los ítems de la izquierda</p>
              </div>
            ) : (
              cartDetailed.map(item => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-white truncate leading-tight">{item.product.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatPrice(item.product.price)} c/u</p>
                  </div>

                  {/* Quantity adjusting controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-[#334155]">
                      <button 
                        type="button"
                        id={`pos-cart-minus-${item.product.id}`}
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="p-1 hover:bg-slate-850 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center font-bold text-white font-mono text-xs">{item.qty}</span>
                      <button 
                        type="button"
                        id={`pos-cart-plus-${item.product.id}`}
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="p-1 hover:bg-slate-850 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Delete item click */}
                    <button 
                      type="button"
                      id={`pos-cart-trash-${item.product.id}`}
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="p-1 text-slate-500 hover:text-rose-455 hover:text-rose-400 rounded-md cursor-pointer hover:bg-rose-500/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout billing configuration */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-900/60 border-t border-[#334155] space-y-4">
              {/* Total Calculation display */}
              <div className="flex items-center justify-between text-white font-bold border-b border-dashed border-[#334155] pb-3">
                <span className="text-xs">Monto Total Insumos:</span>
                <span className="text-lg font-black text-lime-400 font-mono">{formatPrice(cartTotal)}</span>
              </div>

              {/* Checkout Target Selector tabs */}
              <div className="space-y-3">
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-[#334155] text-xs font-bold text-slate-400">
                  <button
                    type="button"
                    id="checkout-target-direct-btn"
                    onClick={() => setCheckoutTarget('direct')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                      checkoutTarget === 'direct' ? 'bg-lime-400 shadow-xs text-slate-950 font-black' : 'hover:text-white'
                    }`}
                  >
                    Venta Directa
                  </button>
                  <button
                    type="button"
                    disabled={activeTodayBookings.length === 0}
                    id="checkout-target-court-btn"
                    onClick={() => setCheckoutTarget('court')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:hover:text-slate-500 ${
                      checkoutTarget === 'court' ? 'bg-lime-400 shadow-xs text-slate-950 font-black' : 'hover:text-white'
                    }`}
                    title={activeTodayBookings.length === 0 ? 'No hay canchas con reservas abiertas hoy' : 'Cargar a la cuenta de una cancha'}
                  >
                    Cargar a Cancha
                  </button>
                </div>

                {/* Subform context dependent */}
                <form onSubmit={handleCheckout} className="space-y-3.5">
                  {checkoutTarget === 'direct' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Método de Cobro Pago</label>
                      <div className="grid grid-cols-3 gap-1.5 font-mono">
                        {(['efectivo', 'transferencia', 'tarjeta'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            id={`pos-payment-btn-${method}`}
                            onClick={() => setDirectPaymentMethod(method)}
                            className={`py-1.5 px-1 capitalize rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                              directPaymentMethod === method 
                                ? 'bg-lime-400 text-slate-950 shadow-md font-extrabold' 
                                : 'bg-slate-900 border border-[#334155] text-slate-350 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Seleccionar Turno / Cancha Abierta</label>
                      <select
                        id="pos-court-booking-select"
                        required
                        value={selectedCourtBookingId}
                        onChange={(e) => setSelectedCourtBookingId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#334155] rounded-xl text-xs bg-slate-900 text-white focus:border-lime-400"
                      >
                        <option value="">-- Selecciona el Cliente --</option>
                        {activeTodayBookings.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.clientName} ({b.startTime}hs) • {courts.find(c => c.id === b.courtId)?.name || `Cancha (${b.courtId})`}
                          </option>
                        ))}
                      </select>
                      {activeTodayBookings.length === 0 && (
                        <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle size={10} /> No hay canchas con turnos activos en juego en este momento.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    id="finalize-pos-sale-btn"
                    className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard size={15} />
                    <span>
                      {checkoutTarget === 'direct' 
                        ? `Registrar Cobro` 
                        : `Confirmar Carga a Cancha`
                      }
                    </span>
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
