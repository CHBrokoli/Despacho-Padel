import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  User, 
  Phone, 
  Trash2, 
  Check, 
  X, 
  PlusCircle, 
  DollarSign, 
  ShoppingBag, 
  Activity, 
  FileCheck2,
  ListOrdered
} from 'lucide-react';
import { Booking, Court, Product } from '../types';

interface BookingCalendarProps {
  bookings: Booking[];
  courts: Court[];
  products: Product[];
  selectedDate: string;
  onSetSelectedDate: (date: string) => void;
  onAddBooking: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
  onAddProductToTab: (bookingId: string, productId: string, qty: number) => void;
  onRemoveProductFromTab: (bookingId: string, productId: string) => void;
  onCheckoutBooking: (bookingId: string, paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta') => void;
  formatPrice: (amount: number) => string;
}

const TIME_SLOTS = [
  { start: '08:00', end: '09:30' },
  { start: '09:30', end: '11:00' },
  { start: '11:00', end: '12:30' },
  { start: '12:30', max: '14:00', end: '14:00' },
  { start: '14:00', end: '15:30' },
  { start: '15:30', end: '17:00' },
  { start: '17:00', end: '18:30' },
  { start: '18:30', end: '20:00' },
  { start: '20:00', end: '21:30' },
  { start: '21:30', end: '23:00' }
];

export default function BookingCalendar({
  bookings,
  courts,
  products,
  selectedDate,
  onSetSelectedDate,
  onAddBooking,
  onCancelBooking,
  onAddProductToTab,
  onRemoveProductFromTab,
  onCheckoutBooking,
  formatPrice
}: BookingCalendarProps) {
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; startTime: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form states for booking creation
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [formCourtId, setFormCourtId] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formCustomPrice, setFormCustomPrice] = useState<number>(0);

  // Quick order addition for selected booking details view
  const [quickOrderProductId, setQuickOrderProductId] = useState('');
  const [quickOrderQty, setQuickOrderQty] = useState(1);
  const [orderError, setOrderError] = useState('');

  // Checkout process view state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');

  // Open creation modal
  const handleOpenCreate = (courtId: string, startTime: string) => {
    const court = courts.find(c => c.id === courtId);
    setSelectedSlot({ courtId, startTime });
    setFormCourtId(courtId);
    setFormStartTime(startTime);
    setFormCustomPrice(court ? court.price90Min : 24000);
    setClientName('');
    setClientPhone('');
    setIsCreateOpen(true);
  };

  // Close creation modal
  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setSelectedSlot(null);
  };

  // Submit booking creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !formCourtId || !formStartTime) return;

    const timeSlot = TIME_SLOTS.find(slot => slot.start === formStartTime);
    const endTime = timeSlot ? timeSlot.end : '10:00';

    const newBooking: Booking = {
      id: 'b_' + Date.now(),
      courtId: formCourtId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date: selectedDate,
      startTime: formStartTime,
      endTime,
      status: 'reservado',
      courtPrice: formCustomPrice,
      barTab: [],
      paid: false
    };

    onAddBooking(newBooking);
    handleCloseCreate();
  };

  // Submit product tab order Addition
  const handleAddProductToTabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !quickOrderProductId) return;

    const qty = Number(quickOrderQty);
    if (!qty || qty <= 0) return;

    const targetProduct = products.find(p => p.id === quickOrderProductId);
    if (!targetProduct) return;

    if (targetProduct.stock < qty) {
      setOrderError(`Stock insuficiente. Solo quedan ${targetProduct.stock} unidades.`);
      return;
    }

    onAddProductToTab(selectedBooking.id, quickOrderProductId, qty);
    
    // Update local selectedBooking object to reflect the changes immediately in UI
    const updatedTab = [...selectedBooking.barTab];
    const existingIndex = updatedTab.findIndex(item => item.productId === quickOrderProductId);
    if (existingIndex >= 0) {
      updatedTab[existingIndex].qty += qty;
    } else {
      updatedTab.push({
        productId: quickOrderProductId,
        name: targetProduct.name,
        qty: qty,
        price: targetProduct.price
      });
    }

    setSelectedBooking({
      ...selectedBooking,
      barTab: updatedTab
    });

    setQuickOrderProductId('');
    setQuickOrderQty(1);
    setOrderError('');
  };

  // Delete product row from active court reservation tab
  const handleRemoveProductFromTabId = (productId: string) => {
    if (!selectedBooking) return;
    onRemoveProductFromTab(selectedBooking.id, productId);

    const updatedTab = selectedBooking.barTab.filter(item => item.productId !== productId);
    setSelectedBooking({
      ...selectedBooking,
      barTab: updatedTab
    });
  };

  // Complete booking payment and register sale totals
  const handleFinalizeCheckout = () => {
    if (!selectedBooking) return;
    onCheckoutBooking(selectedBooking.id, paymentMethod);
    setSelectedBooking(null);
    setIsCheckingOut(false);
  };

  return (
    <div className="space-y-6">
      {/* Date Header Actions */}
      <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarHeaderIcon />
          <div>
            <h2 id="calendar-date-header" className="font-extrabold text-white text-lg">Cronograma de Reservas</h2>
            <p className="text-xs text-slate-400">Selecciona el día para ver y registrar turnos de juego.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            id="today-btn"
            onClick={() => onSetSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs font-bold px-4 py-2.5 bg-slate-800 hover:bg-[#334155] border border-[#334155] text-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Hoy
          </button>
          <input 
            type="date"
            id="calendar-date-input"
            value={selectedDate}
            onChange={(e) => onSetSelectedDate(e.target.value)}
            className="text-xs font-bold px-4 py-2.5 border border-[#334155] focus:border-lime-400 focus:outline-hidden focus:ring-1 focus:ring-lime-400 rounded-xl cursor-pointer text-white bg-slate-900"
          />
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-xl overflow-hidden">
        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[650px]">
            <thead>
              <tr className="bg-slate-900/50 border-b border-[#334155]">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest w-[125px]">Horario</th>
                {courts.map(court => (
                  <th key={court.id} className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center w-[205px]">
                    <span className="block font-black text-white text-sm">{court.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold lowercase">({court.type}) • {formatPrice(court.price90Min)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {TIME_SLOTS.map(slot => {
                return (
                  <tr key={slot.start} className="hover:bg-slate-800/20 transition-all">
                    {/* Time cell */}
                    <td className="p-4 text-xs font-bold text-slate-350 text-slate-300 whitespace-nowrap align-middle border-r border-[#334155]/50 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-450 bg-lime-400" />
                        <span>{slot.start} - {slot.end}</span>
                      </div>
                    </td>

                    {/* Courts loop */}
                    {courts.map(court => {
                      // Find booking starting at this specific slot and court
                      const booking = bookings.find(
                        b => b.date === selectedDate && 
                             b.courtId === court.id && 
                             b.startTime === slot.start && 
                             b.status !== 'cancelado'
                      );

                      if (booking) {
                        const totalBarItems = booking.barTab.reduce((acc, item) => acc + item.qty, 0);
                        const isPaid = booking.paid;

                        return (
                          <td key={court.id} className="p-2.5 align-middle text-center">
                            <motion.button
                              id={`booking-card-${booking.id}`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsCheckingOut(false);
                                setQuickOrderProductId('');
                                setQuickOrderQty(1);
                                setOrderError('');
                              }}
                              className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer shadow-md transition-all ${
                                isPaid 
                                  ? 'bg-[#0F172A]/90 hover:bg-[#0F172A] border-[#334155] text-slate-400' 
                                  : booking.status === 'completado'
                                    ? 'bg-slate-800 border-[#334155] text-slate-300'
                                    : 'bg-lime-400 hover:bg-lime-300 border-lime-400 text-slate-950 font-extrabold'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`text-xs font-black truncate max-w-[120px] ${isPaid ? 'text-slate-300' : 'text-slate-950'}`}>{booking.clientName}</h4>
                                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                                  isPaid 
                                    ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                                    : 'bg-slate-950/20 text-slate-950'
                                }`}>
                                  {isPaid ? 'PAGADO' : 'C/DEUDA'}
                                </span>
                              </div>
                              <div className="mt-2 space-y-1">
                                <p className={`text-[10px] font-mono flex items-center gap-1 ${isPaid ? 'text-slate-450 text-slate-400' : 'text-slate-900'}`}>
                                  <span>{formatPrice(booking.courtPrice)}</span>
                                </p>
                                {totalBarItems > 0 && (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black rounded-lg px-2 py-0.5 ${
                                    isPaid 
                                      ? 'bg-slate-850 bg-slate-900 text-amber-500 border border-slate-800' 
                                      : 'bg-slate-950/80 text-lime-400 font-bold'
                                  }`}>
                                    🛒 Bar: {totalBarItems} art.
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          </td>
                        );
                      }

                      // Empty Cell - Trigger Nueva Reserva
                      return (
                        <td key={court.id} className="p-2.5 text-center">
                          <button
                            id={`add-booking-slot-${court.id}-${slot.start}`}
                            onClick={() => handleOpenCreate(court.id, slot.start)}
                            className="w-full py-5 border border-dashed border-[#334155] hover:border-lime-400/60 text-slate-500 hover:text-lime-400 rounded-2xl flex items-center justify-center transition-all cursor-pointer hover:bg-slate-800/40"
                          >
                            <Plus size={16} />
                            <span className="text-[10px] font-bold ml-1 uppercase tracking-wider">Reservar</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Booking */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172b] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-[#334155]"
            >
              <div className="bg-slate-900/90 p-6 text-white flex items-center justify-between border-b border-[#334155]">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Nueva Reserva de Cancha</h3>
                  <p className="text-xs text-slate-400 mt-1">Ingresa los datos para registrar el turno.</p>
                </div>
                <button 
                  id="close-create-modal"
                  onClick={handleCloseCreate}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4" style={{ backgroundColor: '#0f172b' }}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nombre del Cliente *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      id="form-client-name"
                      required
                      placeholder="Ej. Juan de la Cruz"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-lime-400 focus:border-lime-400 bg-white placeholder-slate-400 font-bold"
                      style={{ color: '#000000' }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Teléfono de Contacto</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      type="tel" 
                      id="form-client-phone"
                      placeholder="Ej. +595 981 123456"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-lime-400 focus:border-lime-400 bg-white text-slate-900 placeholder-slate-400 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cancha</label>
                    <select 
                      id="form-court-select"
                      value={formCourtId}
                      onChange={(e) => {
                        setFormCourtId(e.target.value);
                        const court = courts.find(c => c.id === e.target.value);
                        if (court) setFormCustomPrice(court.price90Min);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-lime-400 bg-white text-slate-900 font-bold"
                    >
                      {courts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Horario Inicio</label>
                    <select 
                      id="form-time-select"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-lime-400 bg-white text-slate-900 font-bold"
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t.start} value={t.start}>{t.start} hs</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Precio de la Cancha (Gs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-extrabold select-none">Gs.</span>
                    <input 
                      type="number" 
                      id="form-court-price"
                      value={formCustomPrice}
                      onChange={(e) => setFormCustomPrice(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-lime-400 focus:border-lime-400 bg-white font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#334155]">
                  <button 
                    type="button" 
                    id="cancel-create-submit"
                    onClick={handleCloseCreate}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl"
                  >
                    Salir
                  </button>
                  <button 
                    type="submit" 
                    id="submit-create"
                    className="flex-1 py-2.5 text-xs font-extrabold text-slate-950 bg-lime-400 hover:bg-lime-300 transition-colors rounded-xl shadow-md"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Booking Details, Orders & Billing Checkout */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header details */}
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold bg-emerald-600 text-white rounded-md px-2.5 py-0.5 uppercase tracking-wide">
                      {selectedBooking.startTime} a {selectedBooking.endTime} hs
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      selectedBooking.paid ? 'bg-slate-700 text-slate-300' : 'bg-red-500 text-white'
                    }`}>
                      {selectedBooking.paid ? 'CUENTA LIQUIDADA' : 'CUENTA ABIERTA / CON DEUDA'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xl text-white mt-2">{selectedBooking.clientName}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>Cancha: {courts.find(c => c.id === selectedBooking.courtId)?.name}</span>
                    {selectedBooking.clientPhone && (
                      <>
                        <span>•</span>
                        <span>Teléfono: {selectedBooking.clientPhone}</span>
                      </>
                    )}
                  </p>
                </div>
                <button 
                  id="close-detail-modal"
                  onClick={() => {
                    setSelectedBooking(null);
                    setIsCheckingOut(false);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid content split: left side orders / right side operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* Panel canilla izquierda: consumos / bar list */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={16} className="text-slate-500" />
                    <h4 className="font-bold text-slate-800 text-sm">Resumen de Consumos</h4>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">Reserva de Cancha (90 minutos)</span>
                      <span className="font-bold text-slate-900">{formatPrice(selectedBooking.courtPrice)}</span>
                    </div>

                    {selectedBooking.barTab.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl text-xs text-slate-400">
                        No hay bebidas o insumos cargados a esta cancha todavía.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedBooking.barTab.map(item => (
                          <div key={item.productId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl border border-slate-50 transition-colors text-xs gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-slate-900 truncate">{item.name}</h5>
                              <p className="text-[10px] text-slate-400">
                                {item.qty} un. x {formatPrice(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-950">{formatPrice(item.price * item.qty)}</span>
                              {!selectedBooking.paid && (
                                <button 
                                  type="button"
                                  id={`remove-product-from-tab-${item.productId}`}
                                  onClick={() => handleRemoveProductFromTabId(item.productId)}
                                  className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                                  title="Eliminar consumo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Cancha</span>
                      <span>{formatPrice(selectedBooking.courtPrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Bebidas / Insumos Bar</span>
                      <span>{formatPrice(selectedBooking.barTab.reduce((a, b) => a + (b.price * b.qty), 0))}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-950 pt-1 border-t border-slate-50">
                      <span>Monto Total</span>
                      <span>
                        {formatPrice(
                          selectedBooking.courtPrice + 
                          selectedBooking.barTab.reduce((a, b) => a + (b.price * b.qty), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel canilla derecha: agregar orden o cobrar */}
                <div className="p-6 space-y-5">
                  {!selectedBooking.paid ? (
                    <>
                      {/* Sub-interface normal o checkout */}
                      {!isCheckingOut ? (
                        <>
                          {/* Agregar Consumos */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="text-amber-500" size={16} />
                              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cargar Bebida / Accesorio</h4>
                            </div>

                            <form onSubmit={handleAddProductToTabSubmit} className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Seleccionar Insumo del Bar</label>
                                <select 
                                  id="quick-order-product-select"
                                  value={quickOrderProductId}
                                  onChange={(e) => {
                                    setQuickOrderProductId(e.target.value);
                                    setOrderError('');
                                  }}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                                >
                                  <option value="">-- Elige un producto --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                      {p.name} (${p.price}) {p.stock <= 0 ? '[SIN STOCK]' : `[Disponibles: ${p.stock}]`}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex gap-2">
                                <div className="w-1/3 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Cant.</label>
                                  <input 
                                    type="number" 
                                    id="quick-order-qty"
                                    min="1"
                                    value={quickOrderQty}
                                    onChange={(e) => setQuickOrderQty(Math.max(1, Number(e.target.value)))}
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-center font-bold"
                                  />
                                </div>
                                <div className="w-2/3 flex items-end">
                                  <button 
                                    type="submit" 
                                    id="add-item-to-tab-btn"
                                    disabled={!quickOrderProductId}
                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <ShoppingBag size={14} /> Cargar a Cuenta
                                  </button>
                                </div>
                              </div>
                              {orderError && (
                                <p className="text-[10px] text-rose-500 font-semibold">{orderError}</p>
                              )}
                            </form>
                          </div>

                          {/* Quick Checkout Actions */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                            <button
                              id="checkout-trigger-btn"
                              onClick={() => setIsCheckingOut(true)}
                              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                            >
                              <FileCheck2 size={16} /> Cobrar y Cerrar Cuenta
                            </button>
                            
                            <button
                              type="button"
                              id="cancel-booking-btn"
                              onClick={() => {
                                if (confirm('¿Estás seguro de cancelar esta reserva?')) {
                                  onCancelBooking(selectedBooking.id);
                                  setSelectedBooking(null);
                                }
                              }}
                              className="w-full py-2 border border-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Cancelar Turno
                            </button>
                          </div>
                        </>
                      ) : (
                        /* COBRANDO METODO PAGO - PROCESO */
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="text-emerald-500" size={16} />
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Finalizar Pago</h4>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs text-slate-500">Selecciona el método de pago para registrar el cobro en las planillas de caja.</p>
                            
                            <div className="space-y-2">
                              {['efectivo', 'transferencia', 'tarjeta'].map(method => (
                                <label 
                                  key={method} 
                                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer text-xs font-bold transition-all ${
                                    paymentMethod === method 
                                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950' 
                                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 capitalize">
                                    <input 
                                      type="radio" 
                                      name="payMethod"
                                      id={`payment-radio-${method}`}
                                      checked={paymentMethod === method}
                                      onChange={() => setPaymentMethod(method as any)}
                                      className="text-emerald-600 focus:ring-emerald-500" 
                                    />
                                    <span>{method}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">Sin recargo</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex gap-2">
                            <button 
                              type="button"
                              id="back-from-checkout"
                              onClick={() => setIsCheckingOut(false)}
                              className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                            <button 
                              type="button"
                              id="confirm-checkout-and-pay"
                              onClick={handleFinalizeCheckout}
                              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                            >
                              Registrar Pago
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* CUENTA YA COBRADA / HISTORIAL COMPLETO */
                    <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Reserva Finalizada Correctamente</h4>
                        <p className="text-xs text-slate-500 mt-1">El cobro ha sido ingresado en caja mediante método: <strong className="capitalize text-emerald-600">{selectedBooking.paymentMethod}</strong>.</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-400 font-mono w-full">
                        Ticket UUID: rx_b{selectedBooking.id.substring(2)}<br />
                        Asociado: {selectedBooking.clientName}<br />
                        Fecha: {selectedBooking.date} • {selectedBooking.startTime} hs
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarHeaderIcon() {
  return (
    <div className="w-10 h-10 bg-lime-404 bg-lime-400/10 border border-[#334155] rounded-xl flex items-center justify-center text-lime-400">
      <Activity size={20} />
    </div>
  );
}
