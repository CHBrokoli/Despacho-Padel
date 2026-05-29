import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Wine, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  DollarSign, 
  Plus, 
  UtensilsCrossed 
} from 'lucide-react';
import { Booking, Product, Sale } from '../types';
import LucideIcon from './LucideIcon';

interface DashboardProps {
  bookings: Booking[];
  products: Product[];
  sales: Sale[];
  courts: number;
  onNavigateToTab: (tab: string) => void;
  onQuickAddStock: (productId: string) => void;
  onCheckoutBooking: (bookingId: string) => void;
  onOpenQuickDrinkMenu: (bookingId: string) => void;
  formatPrice: (amount: number) => string;
}

export default function Dashboard({
  bookings,
  products,
  sales,
  onNavigateToTab,
  onQuickAddStock,
  onCheckoutBooking,
  onOpenQuickDrinkMenu,
  formatPrice
}: DashboardProps) {
  const currentDateStr = new Date().toISOString().split('T')[0];

  // Filters for today
  const todayBookings = bookings.filter(b => b.date === currentDateStr && b.status !== 'cancelado');
  const completedToday = bookings.filter(b => b.date === currentDateStr && b.status === 'completado');

  // Calculate earnings today
  // 1. Direct Sales today (sales that happened today and have no associated booking OR sales linked to court bookings)
  const todaySales = sales.filter(s => s.timestamp.startsWith(currentDateStr));
  const todayBarRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);

  // 2. Court reservation income today
  const todayCourtRevenue = todayBookings
    .filter(b => b.paid)
    .reduce((acc, b) => acc + b.courtPrice, 0);

  const totalEarningsToday = todayCourtRevenue + todaySales.reduce((acc, s) => {
    // If a sale is associated with a booking, it represents the court's bar order checkout.
    // However, in our system, bookings list courtPrice + barTab. 
    // To prevent double counting: we sum overall direct sales + paid bookings' court prices.
    return acc + s.total;
  }, 0);

  // Occupancy rate (e.g. 3 courts * 10 time slots possible = 30 max slots)
  // Let's assume there are 8 standard slots per court per day (08:00, 09:30, 11:00, 14:00, 15:30, 17:00, 18:30, 20:00, 21:30)
  const maxDailySlots = 3 * 8; 
  const occupancyPercentage = Math.round((todayBookings.length / maxDailySlots) * 100);

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Statistics for sales grouped by category
  const salesByCategory = todaySales.reduce((acc, s) => {
    s.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cat = prod?.category || 'otros';
      acc[cat] = (acc[cat] || 0) + (item.price * item.qty);
    });
    return acc;
  }, {} as Record<string, number>);

  // Next upcoming games today
  const upcomingBookings = todayBookings
    .filter(b => {
      if (b.status !== 'reservado') return false;
      const [hour, minute] = b.startTime.split(':').map(Number);
      const now = new Date();
      const matchTime = new Date();
      matchTime.setHours(hour, minute, 0, 0);
      return matchTime >= now || (now.getHours() - hour <= 1.5); // ongoing or future
    })
    .slice(0, 4);

  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 id="dashboard-title" className="text-3xl font-extrabold text-white tracking-tight">Panel Control General</h1>
          <p className="text-slate-400 mt-1">Monitoreo en tiempo real de canchas, facturación y stock del bar en formato bento grid.</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="nav-to-booking-btn"
            onClick={() => onNavigateToTab('calendar')}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg transition-all duration-150 cursor-pointer"
          >
            <Calendar size={18} />
            <span>Nueva Reserva</span>
          </button>
          <button 
            id="nav-to-pos-btn"
            onClick={() => onNavigateToTab('pos')}
            className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-white font-semibold px-5 py-3 rounded-2xl shadow-md transition-all duration-150 cursor-pointer"
          >
            <Wine size={18} />
            <span>Venta de Bar</span>
          </button>
        </div>
      </div>

      {/* KPIs Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div variants={itemVariants} className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-455 text-slate-400 text-xs font-bold uppercase tracking-widest">Facturación de Hoy</span>
            <h3 className="text-3xl font-black text-white font-mono">{formatPrice(totalEarningsToday)}</h3>
            <p className="text-xs text-lime-400 font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>Incluye bar + canchas</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-lime-400/10 border border-[#334155] rounded-2xl flex items-center justify-center text-lime-400">
            <DollarSign size={24} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ocupación Canchas</span>
            <h3 className="text-3xl font-black text-white font-mono">{occupancyPercentage}%</h3>
            <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-lime-400 h-full rounded-full" style={{ width: `${Math.min(occupancyPercentage, 100)}%` }} />
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-[#334155] rounded-2xl flex items-center justify-center text-blue-400">
            <Calendar size={24} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Consumos de Bar</span>
            <h3 className="text-3xl font-black text-white font-mono">{formatPrice(todayBarRevenue)}</h3>
            <p className="text-xs text-slate-400">
              {todaySales.length} transacciones
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-[#334155] rounded-2xl flex items-center justify-center text-amber-400">
            <Wine size={24} />
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className={`p-6 rounded-3xl border shadow-lg flex items-center justify-between transition-colors duration-150 ${
            lowStockProducts.length > 0 
              ? 'bg-[#1E293B] border-amber-500/50' 
              : 'bg-[#1E293B] border-[#334155]'
          }`}
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Alertas de Stock</span>
            <h3 className={`text-3xl font-black ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-white'} font-mono`}>
              {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Producto' : 'Productos'}
            </h3>
            <p className="text-xs text-slate-400">
              {lowStockProducts.length > 0 ? 'Requieren reposición' : 'Sin alertas de faltantes'}
            </p>
          </div>
          <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center ${
            lowStockProducts.length > 0 ? 'bg-amber-500/20 border-rose-500/40 text-amber-450 text-amber-400' : 'bg-slate-800/80 border-[#334155] text-slate-500'
          }`}>
            <AlertTriangle size={24} />
          </div>
        </motion.div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Row Left: Track Ongoing / Upcoming booked slots with easy interaction */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#1E293B] rounded-3xl border border-[#334155] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-6 bg-lime-400 rounded-full"></span>
              <h2 className="text-lg font-bold text-white">Reservas Activas / Próximas</h2>
            </div>
            <button 
              id="view-all-bookings-btn"
              onClick={() => onNavigateToTab('calendar')}
              className="text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer"
            >
              Ver Calendario Completo <ArrowUpRight size={14} />
            </button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-[#334155] rounded-3xl space-y-2 bg-[#0F172A]/40">
              <Calendar className="text-slate-600" size={32} />
              <p className="text-slate-400 font-medium text-sm">No hay reservas pendientes ni activas para hoy</p>
              <button 
                id="create-first-booking-btn"
                onClick={() => onNavigateToTab('calendar')}
                className="text-xs font-bold bg-lime-400 text-slate-950 rounded-xl px-4 py-2 hover:bg-lime-300 transition-all cursor-pointer"
              >
                Crear una Nueva Reserva
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => {
                const totalBarAmount = b.barTab.reduce((total, item) => total + (item.price * item.qty), 0);
                const grandTotal = b.courtPrice + totalBarAmount;

                return (
                  <div key={b.id} className="bg-[#0f172b] border border-[#334155]/60 hover:border-lime-400/30 transition-all p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 bg-lime-400 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                          {b.startTime} hs
                        </span>
                        <h4 className="text-sm font-semibold text-slate-150 text-slate-200">{b.clientName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                        {b.courtId === 'c1' ? 'Cancha 1 (Cristal)' : b.courtId === 'c2' ? 'Cancha 2 (Panorámica)' : 'Cancha 3 (Hormigón)'}
                        {b.clientPhone && ` • Tel: ${b.clientPhone}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="block text-xs font-medium text-slate-400">Monto Cuenta</span>
                        <span className="text-sm font-bold text-white font-mono">{formatPrice(grandTotal)}</span>
                        {totalBarAmount > 0 && (
                          <span className="block text-[10px] text-lime-400 font-medium font-mono">Consumos: {formatPrice(totalBarAmount)}</span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button 
                          id={`add-drink-booking-${b.id}`}
                          title="Cargar bebida/insumo"
                          onClick={() => onOpenQuickDrinkMenu(b.id)}
                          className="p-2 hover:bg-[#334155] text-amber-400 rounded-lg border border-[#334155] bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Wine size={16} />
                        </button>
                        <button 
                          id={`checkout-booking-${b.id}`}
                          onClick={() => onCheckoutBooking(b.id)}
                          className="px-3 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Cerrar Cuenta
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Row Right: Warning and Actions */}
        <div className="space-y-6">
          {/* Low Stock Alerts Pane */}
          <motion.div variants={itemVariants} className="bg-[#0f172b] rounded-3xl border border-[#334155] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              <h2 className="text-base font-bold text-white">Estadísticas de Stock Mínimo</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="bg-lime-400/10 border border-lime-500/20 rounded-xl p-4 flex gap-3 text-lime-400 text-xs">
                <div className="mt-0.5 font-bold">✓</div>
                <div><strong>¡Excelente!</strong> Todos los insumos y bebidas tienen niveles de stock saludables, por encima del mínimo requerido.</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-xl transition-colors border border-transparent hover:border-[#334155]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-[#334155] flex items-center justify-center text-rose-400 shrink-0">
                        <LucideIcon name={p.iconName} size={15} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{p.name}</h4>
                        <p className="text-[10px] text-slate-400">Stock actual: {p.stock} (Mín: {p.minStock})</p>
                      </div>
                    </div>
                    <button 
                      id={`buy-stock-btn-${p.id}`}
                      onClick={() => onQuickAddStock(p.id)}
                      className="text-[11px] font-bold text-lime-400 bg-lime-400/10 border border-[#334155] hover:bg-lime-400 hover:text-slate-900 transition-colors rounded-md px-2.5 py-1 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus size={11} /> Comprar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Rapid category summary */}
          <motion.div variants={itemVariants} className="bg-[#0f172b] rounded-3xl border border-[#334155] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-6 bg-lime-400 rounded-full"></span>
                <h2 className="text-base font-bold text-white">Consumo por Categorías</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">HOY</span>
            </div>
            
            <div className="space-y-3.5">
              {['bebidas', 'snacks', 'palas', 'accesorios'].map((cat) => {
                const val = salesByCategory[cat] || 0;
                const grandDirectSalesTotal = Object.values(salesByCategory).reduce((a, b) => a + b, 0) || 1;
                const percentage = Math.round((val / grandDirectSalesTotal) * 100) || 0;

                const colorClasses: Record<string, string> = {
                  bebidas: 'bg-lime-400',
                  snacks: 'bg-emerald-400',
                  palas: 'bg-blue-400',
                  accesorios: 'bg-purple-400'
                };

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-semibold text-slate-300">{cat}</span>
                      <span className="font-bold text-slate-100 font-mono">{formatPrice(val)} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorClasses[cat] || 'bg-slate-450'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
