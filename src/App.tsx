import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  Wine, 
  Database, 
  Users, 
  Settings, 
  Flame, 
  AlertTriangle,
  Info
} from 'lucide-react';

import { Court, Product, Booking, Sale, StockAdjustment } from './types';
import { 
  INITIAL_COURTS, 
  INITIAL_PRODUCTS, 
  INITIAL_BOOKINGS, 
  INITIAL_SALES, 
  INITIAL_ADJUSTMENTS 
} from './data/initialData';

import Dashboard from './components/Dashboard';
import BookingCalendar from './components/BookingCalendar';
import BarPOS from './components/BarPOS';
import InventoryManager from './components/InventoryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State handles
  const [courts, setCourts] = useState<Court[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  const formatPrice = (amount: number) => {
    return `Gs. ${Math.round(amount).toLocaleString('es-PY')}`;
  };

  // LocalStorage Loading Hook
  useEffect(() => {
    const cachedCourts = localStorage.getItem('padel_courts');
    const cachedProducts = localStorage.getItem('padel_products');
    const cachedBookings = localStorage.getItem('padel_bookings');
    const cachedSales = localStorage.getItem('padel_sales');
    const cachedAdjustments = localStorage.getItem('padel_adjustments');

    if (cachedCourts) setCourts(JSON.parse(cachedCourts));
    else {
      setCourts(INITIAL_COURTS);
      localStorage.setItem('padel_courts', JSON.stringify(INITIAL_COURTS));
    }

    if (cachedProducts) setProducts(JSON.parse(cachedProducts));
    else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('padel_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (cachedBookings) setBookings(JSON.parse(cachedBookings));
    else {
      setBookings(INITIAL_BOOKINGS);
      localStorage.setItem('padel_bookings', JSON.stringify(INITIAL_BOOKINGS));
    }

    if (cachedSales) setSales(JSON.parse(cachedSales));
    else {
      setSales(INITIAL_SALES);
      localStorage.setItem('padel_sales', JSON.stringify(INITIAL_SALES));
    }

    if (cachedAdjustments) setAdjustments(JSON.parse(cachedAdjustments));
    else {
      setAdjustments(INITIAL_ADJUSTMENTS);
      localStorage.setItem('padel_adjustments', JSON.stringify(INITIAL_ADJUSTMENTS));
    }
  }, []);

  // Save changes helper
  const saveState = (
    updatedCourts?: Court[],
    updatedProducts?: Product[],
    updatedBookings?: Booking[],
    updatedSales?: Sale[],
    updatedAdjustments?: StockAdjustment[]
  ) => {
    if (updatedCourts) {
      setCourts(updatedCourts);
      localStorage.setItem('padel_courts', JSON.stringify(updatedCourts));
    }
    if (updatedProducts) {
      setProducts(updatedProducts);
      localStorage.setItem('padel_products', JSON.stringify(updatedProducts));
    }
    if (updatedBookings) {
      setBookings(updatedBookings);
      localStorage.setItem('padel_bookings', JSON.stringify(updatedBookings));
    }
    if (updatedSales) {
      setSales(updatedSales);
      localStorage.setItem('padel_sales', JSON.stringify(updatedSales));
    }
    if (updatedAdjustments) {
      setAdjustments(updatedAdjustments);
      localStorage.setItem('padel_adjustments', JSON.stringify(updatedAdjustments));
    }
  };

  // UPDATE COURT
  const handleUpdateCourt = (updatedCourt: Court) => {
    const updated = courts.map(c => c.id === updatedCourt.id ? updatedCourt : c);
    saveState(updated);
  };

  // ADD COURT
  const handleAddCourt = (newCourt: Court) => {
    const updated = [...courts, newCourt];
    saveState(updated);
  };

  // DELETE COURT
  const handleDeleteCourt = (courtId: string) => {
    const updated = courts.filter(c => c.id !== courtId);
    saveState(updated);
  };

  // 1. ADD NEW BOOKING
  const handleAddBooking = (newBooking: Booking) => {
    const updated = [...bookings, newBooking];
    saveState(undefined, undefined, updated);
  };

  // 2. CANCEL BOOKING
  const handleCancelBooking = (bookingId: string) => {
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return;

    // Return any consumed bar items in their tab back to product stock!
    let updatedProducts = [...products];
    if (targetBooking.barTab.length > 0) {
      updatedProducts = products.map(p => {
        const orderItem = targetBooking.barTab.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: p.stock + orderItem.qty };
        }
        return p;
      });
    }

    const updatedBookings = bookings.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelado' as const } : b
    );

    saveState(undefined, updatedProducts, updatedBookings);
  };

  // 3. ADD PRODUCT TO COURT TAB (DEDUCTING STOCK AUTOMATICALLY)
  const handleAddProductToTab = (bookingId: string, productId: string, qty: number, clientId?: string) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct || targetProduct.stock < qty) return;

    // Decrease product stock directly
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock - qty } : p
    );

    // Add to booking tab
    const updatedBookings = bookings.map(b => {
      if (b.id !== bookingId) return b;
      
      if (clientId && b.clients) {
        const updatedClients = b.clients.map(c => {
          if (c.id !== clientId) return c;
          const tabCopy = [...c.barTab];
          const existingIdx = tabCopy.findIndex(item => item.productId === productId);
          
          if (existingIdx >= 0) {
            tabCopy[existingIdx] = {
              ...tabCopy[existingIdx],
              qty: tabCopy[existingIdx].qty + qty
            };
          } else {
            tabCopy.push({
              productId,
              name: targetProduct.name,
              qty,
              price: targetProduct.price
            });
          }
          return { ...c, barTab: tabCopy };
        });
        return { ...b, clients: updatedClients };
      } else {
        const tabCopy = [...b.barTab];
        const existingIdx = tabCopy.findIndex(item => item.productId === productId);
        
        if (existingIdx >= 0) {
          tabCopy[existingIdx] = {
            ...tabCopy[existingIdx],
            qty: tabCopy[existingIdx].qty + qty
          };
        } else {
          tabCopy.push({
            productId,
            name: targetProduct.name,
            qty,
            price: targetProduct.price
          });
        }
        return { ...b, barTab: tabCopy };
      }
    });

    // Write a minor debug log
    const newLog: StockAdjustment = {
      id: 'log_' + Date.now(),
      productId,
      productName: targetProduct.name,
      qty: -qty,
      type: 'ajuste',
      timestamp: new Date().toISOString(),
      details: 'Carga automática a cuenta de cancha.'
    };
    const updatedLogs = [...adjustments, newLog];

    saveState(undefined, updatedProducts, updatedBookings, undefined, updatedLogs);
  };

  // 4. REMOVE PRODUCT FROM TAB (RETURNING STOCK AUTOMATICALLY)
  const handleRemoveProductFromTab = (bookingId: string, productId: string, clientId?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    let returnQty = 0;
    if (clientId && booking.clients) {
      const client = booking.clients.find(c => c.id === clientId);
      const ordItem = client?.barTab.find(item => item.productId === productId);
      if (ordItem) returnQty = ordItem.qty;
    } else {
      const ordItem = booking.barTab.find(item => item.productId === productId);
      if (ordItem) returnQty = ordItem.qty;
    }

    if (returnQty === 0) return;

    // Increase product stock back
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock + returnQty } : p
    );

    // Remove from tab copy
    const updatedBookings = bookings.map(b => {
      if (b.id !== bookingId) return b;
      
      if (clientId && b.clients) {
        const updatedClients = b.clients.map(c => {
          if (c.id !== clientId) return c;
          return {
            ...c,
            barTab: c.barTab.filter(item => item.productId !== productId)
          };
        });
        return { ...b, clients: updatedClients };
      } else {
        return {
          ...b,
          barTab: b.barTab.filter(item => item.productId !== productId)
        };
      }
    });

    // Logging stock adjustment
    const newLog: StockAdjustment = {
      id: 'log_' + Date.now(),
      productId,
      productName: products.find(p => p.id === productId)?.name || 'Producto',
      qty: returnQty,
      type: 'ajuste',
      timestamp: new Date().toISOString(),
      details: 'Devolución de artículo de cancha a stock.'
    };
    const updatedLogs = [...adjustments, newLog];

    saveState(undefined, updatedProducts, updatedBookings, undefined, updatedLogs);
  };

  // 5. COBRAR / CHECKOUT COURT BOOKING (CLOSES ACCOUNT & STORES REVENUES)
  const handleCheckoutBooking = (bookingId: string, paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (booking.clients && booking.clients.length > 0) {
      // Find unpaid clients
      const unpaidClients = booking.clients.filter(c => !c.paid);
      let newSalesList = [...sales];

      const updatedClients = booking.clients.map(c => {
        if (c.paid) return c;
        const clientSubtotal = c.courtShare + c.barTab.reduce((a, b) => a + (b.price * b.qty), 0);
        
        const newSale: Sale = {
          id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString(),
          items: c.barTab.map(item => {
            const prod = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              name: item.name,
              qty: item.qty,
              price: item.price,
              cost: prod ? prod.cost : 0
            };
          }),
          total: clientSubtotal,
          paymentMethod,
          associatedBookingId: bookingId,
          description: `Cierre cuenta de ${c.name} (Turno de ${booking.clientName} a las ${booking.startTime}hs) - Cancha + Consumos`
        };
        newSalesList.push(newSale);
        return { ...c, paid: true, paymentMethod };
      });

      // General shared tab order
      if (booking.barTab.length > 0) {
        const generalBarSubtotal = booking.barTab.reduce((a, b) => a + (b.price * b.qty), 0);
        const newSale: Sale = {
          id: 'sale_' + Date.now() + '_gen',
          timestamp: new Date().toISOString(),
          items: booking.barTab.map(item => {
            const prod = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              name: item.name,
              qty: item.qty,
              price: item.price,
              cost: prod ? prod.cost : 0
            };
          }),
          total: generalBarSubtotal,
          paymentMethod,
          associatedBookingId: bookingId,
          description: `Consumo general sin asignar de cancha - Turno ${booking.clientName} (${booking.startTime}hs)`
        };
        newSalesList.push(newSale);
      }

      const updatedBookings = bookings.map(b => 
        b.id === bookingId 
          ? { ...b, paid: true, status: 'completado' as const, paymentMethod, clients: updatedClients, barTab: [] } 
          : b
      );

      saveState(undefined, undefined, updatedBookings, newSalesList);
    } else {
      // Calculate invoice totals
      const barSubtotal = booking.barTab.reduce((a, b) => a + (b.price * b.qty), 0);
      const totalDue = booking.courtPrice + barSubtotal;

      // Mark booking completed & paid
      const updatedBookings = bookings.map(b => 
        b.id === bookingId 
          ? { ...b, paid: true, status: 'completado' as const, paymentMethod } 
          : b
      );

      // Append to total sales (this includes Court fee + any beverages)
      const newSale: Sale = {
        id: 'sale_' + Date.now(),
        timestamp: new Date().toISOString(),
        items: booking.barTab.map(item => {
          const prod = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            price: item.price,
            cost: prod ? prod.cost : 0
          };
        }),
        total: totalDue,
        paymentMethod,
        associatedBookingId: bookingId,
        description: `Cierre cuenta Turno de ${booking.clientName} (${booking.startTime}hs) + Cancha`
      };

      const updatedSales = [...sales, newSale];
      saveState(undefined, undefined, updatedBookings, updatedSales);
    }
  };

  // 5.5 COBRAR CLIENTE INDIVIDUAL (CUENTA DIVIDIDA)
  const handleCheckoutClientShare = (
    bookingId: string,
    clientId: string,
    paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta'
  ) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !booking.clients) return;

    const client = booking.clients.find(c => c.id === clientId);
    if (!client || client.paid) return;

    const clientSubtotal = client.courtShare + client.barTab.reduce((a, b) => a + (b.price * b.qty), 0);

    // Create a sale for this client
    const newSale: Sale = {
      id: 'sale_' + Date.now() + '_' + clientId.substring(2, 6),
      timestamp: new Date().toISOString(),
      items: client.barTab.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          price: item.price,
          cost: prod ? prod.cost : 0
        };
      }),
      total: clientSubtotal,
      paymentMethod,
      associatedBookingId: bookingId,
      description: `Cierre parcial de ${client.name} (Turno de ${booking.clientName} a las ${booking.startTime}hs) - Cancha + Consumos`
    };

    const updatedSales = [...sales, newSale];

    // Mark that specific client as paid
    const updatedClients = booking.clients.map(c => 
      c.id === clientId ? { ...c, paid: true, paymentMethod } : c
    );

    // Check if ALL clients are now paid
    const allPaid = updatedClients.every(c => c.paid);

    const updatedBookings = bookings.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        clients: updatedClients,
        paid: allPaid,
        status: allPaid ? ('completado' as const) : b.status,
        paymentMethod: allPaid ? paymentMethod : b.paymentMethod
      };
    });

    saveState(undefined, undefined, updatedBookings, updatedSales);
  };

  // 5.8 UPDATE BOOKING GENERICALLY
  const handleUpdateBooking = (updatedBooking: Booking) => {
    const updated = bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b);
    saveState(undefined, undefined, updated);
  };

  // 6. PROCESS POS BAR STANDALONE DIRECT SALES (DECREASES STOCK DIRECTLY)
  const handleRegisterDirectSale = (
    cartItems: { productId: string; qty: number }[],
    paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta',
    description?: string
  ) => {
    // 1. Decrement stock
    const updatedProducts = products.map(p => {
      const match = cartItems.find(item => item.productId === p.id);
      if (match) {
        return { ...p, stock: Math.max(0, p.stock - match.qty) };
      }
      return p;
    });

    // 2. Prepare transaction log & sales logs
    const itemsTransformed = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        name: prod.name,
        qty: item.qty,
        price: prod.price,
        cost: prod.cost
      };
    });

    const basketTotal = itemsTransformed.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const newSale: Sale = {
      id: 'sale_' + Date.now(),
      timestamp: new Date().toISOString(),
      items: itemsTransformed,
      total: basketTotal,
      paymentMethod,
      description: description || 'Venta rápida bar registrada en mostrador'
    };

    const updatedSales = [...sales, newSale];

    // Logging adjustments for history audit too
    const newLogs: StockAdjustment[] = cartItems.map((item, idx) => {
      const prod = products.find(p => p.id === item.productId)!;
      return {
        id: `adjust_${Date.now()}_${idx}`,
        productId: item.productId,
        productName: prod.name,
        qty: -item.qty,
        type: 'ajuste',
        timestamp: new Date().toISOString(),
        details: 'Venta directa Bar mostrador'
      };
    });

    const updatedAdjustments = [...adjustments, ...newLogs];

    saveState(undefined, updatedProducts, undefined, updatedSales, updatedAdjustments);
  };

  // 7. INVENTORY: RESTOCK / PRODUCT BUY (INCREASE UNIT COUNTS FROM DISTRIBUTOR)
  const handleRegisterStockAddition = (
    productId: string, 
    qty: number, 
    type: 'compra' | 'ajuste', 
    details?: string
  ) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock + qty } : p
    );

    const newLog: StockAdjustment = {
      id: 'log_restock_' + Date.now(),
      productId,
      productName: prod.name,
      qty: qty,
      type: type,
      timestamp: new Date().toISOString(),
      details: details || 'Ingreso manual por reabastecimiento'
    };

    const updatedLogs = [...adjustments, newLog];
    saveState(undefined, updatedProducts, undefined, undefined, updatedLogs);
  };

  // 8. INVENTORY: ADD COMNPLETELY NEW CATALOG CUSTOM PRODUCT
  const handleAddProduct = (newProduct: Product) => {
    const updated = [...products, newProduct];
    saveState(undefined, updated);
  };

  // 9. INVENTORY: DELETE PRODUCT
  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    saveState(undefined, updated);
  };

  // 10. INVENTORY: UPDATE PRICE & COST AUDIT
  const handleUpdatePricing = (id: string, price: number, cost: number) => {
    const updated = products.map(p => 
      p.id === id ? { ...p, price, cost } : p
    );
    saveState(undefined, updated);
  };

  // Support helper to trigger rapid restock menu direct link click from dashboard card
  const handleQuickAddStockLink = (productId: string) => {
    setActiveTab('inventory');
    // The target InventoryManager component will handle inputs or display appropriately 
  };

  const handleOpenQuickDrinkMenu = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setActiveTab('calendar');
      // Already forces focus on scheduling grid
    }
  };

  // Low stock check alerts for top floating warning indicator
  const lowStockCounter = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      
      {/* LEFT STATIC RETINA SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#1E293B]/90 text-white shrink-0 flex flex-col border-r border-[#334155]/80 shadow-2xl z-20">
        
        {/* Brand identity */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-400 text-slate-900 flex items-center justify-center font-black text-sm shadow-inner">
              P
            </div>
            <div>
              <h2 className="font-extrabold text-sm leading-tight tracking-tight uppercase text-white">Pistacho Pádel</h2>
              <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest">Gestión Sencilla</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-sm text-[10px] font-bold text-slate-300">
            <span className="w-1.5 h-1.5 bg-lime-400 rounded-full inline-block animate-pulse"></span>
            <span>Establecimiento</span>
          </div>
        </div>

        {/* User context info banner */}
        <div className="px-5 py-4 bg-slate-900/50 border-b border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-xs uppercase text-lime-405 text-lime-400 shadow-sm">
            QA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight truncate text-slate-200">Administrador</p>
            <p className="text-[10px] text-[#0e162c] truncate mt-0.5">quimikall51@gmail.com</p>
          </div>
        </div>

        {/* Dynamic Nav Menus */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-lime-400 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            id="tab-calendar-btn"
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calendar' 
                ? 'bg-lime-400 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar size={15} />
            <span>Turnos Canchas</span>
          </button>

          <button
            id="tab-pos-btn"
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'pos' 
                ? 'bg-lime-400 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wine size={15} />
            <span>Pistacho Bar / POS</span>
          </button>

          <button
            id="tab-inventory-btn"
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'inventory' 
                ? 'bg-lime-400 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database size={15} />
            <span>Inventarios / Stock</span>
          </button>
        </nav>

        {/* Global info footer warnings inside desktop navigation */}
        <div className="p-4 border-t border-slate-700 bg-slate-950/20 text-[11px] text-slate-400 font-medium space-y-2">
          {lowStockCounter > 0 && (
            <div className="bg-rose-950/50 border border-rose-900 rounded-lg p-2.5 flex gap-2 text-rose-300 text-[10px]">
              <AlertTriangle size={13} className="text-rose-500 shrink-0" />
              <div>Hay <strong>{lowStockCounter} productos</strong> con nivel de stock críticamente bajo.</div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Info size={11} className="text-lime-400" />
            <span>Carga local segura (Offline)</span>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN VIEWING SPACE */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS BAR ACCENTS */}
        <header className="bg-[#1E293B]/80 backdrop-blur-md border-b border-[#334155]/80 px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:h-16 z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>PISTACHO SYSTEM</span>
            <span>/</span>
            <span className="text-lime-400 uppercase tracking-widest">{activeTab}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            
            <div className="text-right">
              <span className="block text-[11px] font-black text-slate-200">Fecha Servidor</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(selectedDate).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="h-6 w-px bg-slate-705 bg-[#334155] hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-1 text-slate-300 text-xs">
              <span className="font-semibold text-slate-455 text-slate-405 text-slate-400">Reservadas hoy:</span>
              <strong className="text-lime-400">{bookings.filter(b => b.date === selectedDate && b.status !== 'cancelado').length} canchas</strong>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT CONTAINER */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  bookings={bookings}
                  products={products}
                  sales={sales}
                  courts={courts}
                  onNavigateToTab={setActiveTab}
                  onQuickAddStock={handleQuickAddStockLink}
                  onCheckoutBooking={(id) => {
                    setActiveTab('calendar');
                    // Automatically click the card by setting state will be handled by detail render
                  }}
                  onOpenQuickDrinkMenu={handleOpenQuickDrinkMenu}
                  formatPrice={formatPrice}
                />
              )}

              {activeTab === 'calendar' && (
                <BookingCalendar 
                  bookings={bookings}
                  courts={courts}
                  products={products}
                  selectedDate={selectedDate}
                  onSetSelectedDate={setSelectedDate}
                  onAddBooking={handleAddBooking}
                  onCancelBooking={handleCancelBooking}
                  onAddProductToTab={handleAddProductToTab}
                  onRemoveProductFromTab={handleRemoveProductFromTab}
                  onCheckoutBooking={handleCheckoutBooking}
                  onCheckoutClientShare={handleCheckoutClientShare}
                  onUpdateBooking={handleUpdateBooking}
                  onUpdateCourt={handleUpdateCourt}
                  onAddCourt={handleAddCourt}
                  onDeleteCourt={handleDeleteCourt}
                  formatPrice={formatPrice}
                />
              )}

              {activeTab === 'pos' && (
                <BarPOS 
                  products={products}
                  bookings={bookings}
                  courts={courts}
                  onRegisterSale={handleRegisterDirectSale}
                  onAddProductToTab={handleAddProductToTab}
                  formatPrice={formatPrice}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManager 
                  products={products}
                  adjustments={adjustments}
                  onAddProduct={handleAddProduct}
                  onUpdatePricing={handleUpdatePricing}
                  onRegisterStockAddition={handleRegisterStockAddition}
                  onDeleteProduct={handleDeleteProduct}
                  formatPrice={formatPrice}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
