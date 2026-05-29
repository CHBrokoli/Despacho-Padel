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
  ListOrdered,
  Users,
  AlertTriangle
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
  onAddProductToTab: (bookingId: string, productId: string, qty: number, clientId?: string) => void;
  onRemoveProductFromTab: (bookingId: string, productId: string, clientId?: string) => void;
  onCheckoutBooking: (bookingId: string, paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta') => void;
  onCheckoutClientShare: (bookingId: string, clientId: string, paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta') => void;
  onUpdateBooking: (booking: Booking) => void;
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
  onCheckoutClientShare,
  onUpdateBooking,
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
  const [quickOrderClientId, setQuickOrderClientId] = useState(''); // "" is Shared/General tab

  // Checkout process view state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');

  // Multi-client management state
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [checkingOutClientId, setCheckingOutClientId] = useState<string | null>(null);
  const [clientCheckoutMethod, setClientCheckoutMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');

  // Initialize multi-client list with primary customer
  const handleInitializeMultiClients = () => {
    if (!selectedBooking) return;
    const primaryPlayer = {
      id: 'c_main_' + Date.now(),
      name: selectedBooking.clientName,
      phone: selectedBooking.clientPhone || undefined,
      courtShare: selectedBooking.courtPrice,
      barTab: [],
      paid: false
    };

    const updatedBooking = {
      ...selectedBooking,
      clients: [primaryPlayer]
    };
    onUpdateBooking(updatedBooking);
    setSelectedBooking(updatedBooking);
  };

  // Add another client and automatically split the court price among them
  const handleAddClientToList = (e: React.FormEvent) => { e.preventDefault();
    if (!selectedBooking || !newClientName.trim()) return;

    const newPlayer = {
      id: 'c_sub_' + Date.now(),
      name: newClientName.trim(),
      phone: newClientPhone.trim() || undefined,
      courtShare: 0,
      barTab: [],
      paid: false
    };

    const currentClients = selectedBooking.clients ? [...selectedBooking.clients] : [];
    const updatedClients = [...currentClients, newPlayer];

    // Auto split equally
    const numClients = updatedClients.length;
    const share = Math.round(selectedBooking.courtPrice / numClients);
    const splitClients = updatedClients.map((c, idx) => {
      const clientShare = idx === 0 
        ? selectedBooking.courtPrice - (share * (numClients - 1))
        : share;
      return { ...c, courtShare: clientShare };
    });

    const updatedBooking = {
      ...selectedBooking,
      clients: splitClients
    };

    onUpdateBooking(updatedBooking);
    setSelectedBooking(updatedBooking);

    setNewClientName('');
    setNewClientPhone('');
  };

  // Delete a client from list and re-split equally
  const handleDeleteClient = (clientId: string) => {
    if (!selectedBooking || !selectedBooking.clients) return;
    const updatedClients = selectedBooking.clients.filter(c => c.id !== clientId);

    let updatedBooking: Booking;
    if (updatedClients.length === 0) {
      updatedBooking = {
        ...selectedBooking,
        clients: undefined
      };
    } else {
      const numClients = updatedClients.length;
      const share = Math.round(selectedBooking.courtPrice / numClients);
      const splitClients = updatedClients.map((c, idx) => {
        const clientShare = idx === 0 
          ? selectedBooking.courtPrice - (share * (numClients - 1))
          : share;
        return { ...c, courtShare: clientShare };
      });

      updatedBooking = {
        ...selectedBooking,
        clients: splitClients
      };
    }

    onUpdateBooking(updatedBooking);
    setSelectedBooking(updatedBooking);
  };

  // Split court share equally
  const handleReSplitEqually = () => {
    if (!selectedBooking || !selectedBooking.clients || selectedBooking.clients.length === 0) return;
    const numClients = selectedBooking.clients.length;
    const share = Math.round(selectedBooking.courtPrice / numClients);
    const splitClients = selectedBooking.clients.map((c, idx) => {
      const clientShare = idx === 0 
        ? selectedBooking.courtPrice - (share * (numClients - 1))
        : share;
      return { ...c, courtShare: clientShare };
    });

    const updatedBooking = {
      ...selectedBooking,
      clients: splitClients
    };

    onUpdateBooking(updatedBooking);
    setSelectedBooking(updatedBooking);
  };

  // Update client’s courtShare manually
  const handleUpdateClientShare = (clientId: string, shareValue: number) => {
    if (!selectedBooking || !selectedBooking.clients) return;
    const updatedClients = selectedBooking.clients.map(c => 
      c.id === clientId ? { ...c, courtShare: shareValue } : c
    );

    const updatedBooking = {
      ...selectedBooking,
      clients: updatedClients
    };

    onUpdateBooking(updatedBooking);
    setSelectedBooking(updatedBooking);
  };

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

    onAddProductToTab(selectedBooking.id, quickOrderProductId, qty, quickOrderClientId || undefined);
    
    // Update local selectedBooking object to reflect the changes immediately in UI
    if (quickOrderClientId && selectedBooking.clients) {
      const updatedClients = selectedBooking.clients.map(c => {
        if (c.id !== quickOrderClientId) return c;
        const updatedTab = [...c.barTab];
        const existingIdx = updatedTab.findIndex(item => item.productId === quickOrderProductId);
        if (existingIdx >= 0) {
          updatedTab[existingIdx].qty += qty;
        } else {
          updatedTab.push({
            productId: quickOrderProductId,
            name: targetProduct.name,
            qty: qty,
            price: targetProduct.price
          });
        }
        return { ...c, barTab: updatedTab };
      });
      setSelectedBooking({
        ...selectedBooking,
        clients: updatedClients
      });
    } else {
      const updatedTab = [...selectedBooking.barTab];
      const existingIndex = updatedTab.findIndex(item => item.productId === quickOrderProductId);
      if (existingIndex >= 0) {
        existingIndex >= 0 ? (updatedTab[existingIndex].qty += qty) : null;
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
    }

    setQuickOrderProductId('');
    setQuickOrderQty(1);
    setOrderError('');
  };

  // Delete product row from active court reservation tab
  const handleRemoveProductFromTabId = (productId: string, clientId?: string) => {
    if (!selectedBooking) return;
    onRemoveProductFromTab(selectedBooking.id, productId, clientId);

    if (clientId && selectedBooking.clients) {
      const updatedClients = selectedBooking.clients.map(c => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          barTab: c.barTab.filter(item => item.productId !== productId)
        };
      });
      setSelectedBooking({
        ...selectedBooking,
        clients: updatedClients
      });
    } else {
      const updatedTab = selectedBooking.barTab.filter(item => item.productId !== productId);
      setSelectedBooking({
        ...selectedBooking,
        barTab: updatedTab
      });
    }
  };

  // Complete booking payment and register sale totals
  const handleFinalizeCheckout = () => {
    if (!selectedBooking) return;
    onCheckoutBooking(selectedBooking.id, paymentMethod);
    setSelectedBooking(null);
    setIsCheckingOut(false);
  };

  // Complete individual client checkout payment
  const handleFinalizeClientCheckout = () => {
    if (!selectedBooking || !checkingOutClientId) return;
    onCheckoutClientShare(selectedBooking.id, checkingOutClientId, clientCheckoutMethod);
    
    // Update local state is checked out as green paid
    if (selectedBooking.clients) {
      const updatedClients = selectedBooking.clients.map(c => 
        c.id === checkingOutClientId ? { ...c, paid: true, paymentMethod: clientCheckoutMethod } : c
      );
      const allPaid = updatedClients.every(c => c.paid);
      setSelectedBooking({
        ...selectedBooking,
        clients: updatedClients,
        paid: allPaid,
        status: allPaid ? 'completado' : selectedBooking.status
      });
    }
    setCheckingOutClientId(null);
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
                <div className="p-6 space-y-4 max-h-[580px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListOrdered size={16} className="text-slate-500" />
                      <h4 className="font-bold text-slate-800 text-sm">Cuentas y Consumos</h4>
                    </div>
                    {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                      <span className="text-[10px] font-black uppercase bg-purple-100 text-[#5B21B6] border border-[#DDD6FE] px-2 py-0.5 rounded-sm">
                         👥 Cuenta Dividida ({selectedBooking.clients.length})
                      </span>
                    )}
                  </div>

                  {/* SECTION: Standard Court Price if no client splitting is activated */}
                  {!selectedBooking.clients || selectedBooking.clients.length === 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-900">
                          <span className="font-semibold text-slate-700">Reserva de Cancha (90 minutos)</span>
                          <span className="font-bold text-slate-900">{formatPrice(selectedBooking.courtPrice)}</span>
                        </div>

                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">
                          🛒 Consumos Generales del Pitch
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

                      {/* Prompts to enable multi-client split */}
                      {!selectedBooking.paid && (
                        <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-2xl space-y-2 text-center">
                          <Users size={20} className="mx-auto text-slate-400" />
                          <h5 className="font-bold text-xs text-slate-700">¿Dividir cuenta entre jugadores?</h5>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Carga a los clientes de este turno para dividir el importe total de la cancha y registrar los consumos individuales del bar para cada uno.
                          </p>
                          <button
                            type="button"
                            id="enable-splitting-btn"
                            onClick={handleInitializeMultiClients}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-sm"
                          >
                            Habilitar Carga de Clientes
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SECTION: Multi-clients layout splitting is ACTIVE */
                    <div className="space-y-4">
                      {/* General unassigned shared drinks bar tab */}
                      {selectedBooking.barTab.length > 0 && (
                        <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-2xl space-y-2">
                          <div className="text-[10.5px] font-extrabold text-amber-800 uppercase tracking-widest flex items-center justify-between">
                            <span>🍺 Consumos Generales sin registrar</span>
                            <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Común</span>
                          </div>
                          <div className="space-y-1.5">
                            {selectedBooking.barTab.map(item => (
                              <div key={item.productId} className="flex items-center justify-between text-xs gap-1">
                                <span className="text-slate-700 truncate max-w-[160px] font-medium">{item.name} ({item.qty} un.)</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-950">{formatPrice(item.price * item.qty)}</span>
                                  {!selectedBooking.paid && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProductFromTabId(item.productId)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Render Clients cards list */}
                      <div className="space-y-3">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                          Clientes en Cancha & Cuentas correspondientes
                        </div>

                        {selectedBooking.clients.map(c => {
                          const cBarTotal = c.barTab.reduce((acc, item) => acc + (item.price * item.qty), 0);
                          const cTotalDue = c.courtShare + cBarTotal;
                          
                          return (
                            <div 
                              key={c.id} 
                              className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                                c.paid 
                                  ? 'bg-slate-50 border-slate-200' 
                                  : 'bg-white border-slate-150 border-slate-200 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-xs text-slate-950 truncate flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.paid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {c.name}
                                  </h5>
                                  {c.phone && <p className="text-[9px] text-slate-400 font-medium">Cel: {c.phone}</p>}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {c.paid ? (
                                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                                      PAGADO ({c.paymentMethod})
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                                        CON DEUDA
                                      </span>
                                      {!selectedBooking.paid && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteClient(c.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                          title="Quitar cliente"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Divididos: Court and Bar info */}
                              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                                {/* Court share input or text */}
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">Aporte Cancha:</span>
                                  {c.paid || selectedBooking.paid ? (
                                    <span className="font-bold text-slate-900">{formatPrice(c.courtShare)}</span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400">Gs.</span>
                                      <input 
                                        type="number"
                                        value={c.courtShare}
                                        step="1000"
                                        onChange={(e) => handleUpdateClientShare(c.id, Number(e.target.value))}
                                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-black bg-white text-slate-950"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Client's BarTab items */}
                                {c.barTab.length > 0 && (
                                  <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🛒 Consumo Individual:</div>
                                    {c.barTab.map(item => (
                                      <div key={item.productId} className="flex items-center justify-between text-[11px] gap-2">
                                        <span className="text-slate-700 truncate max-w-[130px]">{item.name} (x{item.qty})</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-950">{formatPrice(item.price * item.qty)}</span>
                                          {!c.paid && !selectedBooking.paid && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveProductFromTabId(item.productId, c.id)}
                                              className="text-slate-400 hover:text-rose-650 p-0.5 hover:bg-slate-100"
                                              title="Quitar consumo"
                                            >
                                              <X size={10} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Sum / total breakdown per client */}
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-900 font-extrabold">
                                  <span>Total de {c.name}:</span>
                                  <span>{formatPrice(cTotalDue)}</span>
                                </div>
                              </div>

                              {/* Client Checkout Operation trigger */}
                              {!c.paid && !selectedBooking.paid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCheckingOutClientId(c.id);
                                    setClientCheckoutMethod('efectivo');
                                  }}
                                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10.5px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <DollarSign size={12} /> Cobrar Parte ({formatPrice(cTotalDue)})
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Calculations breakdown */}
                  <div className="pt-3 border-t border-slate-150 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Cancha Base</span>
                      <span>{formatPrice(selectedBooking.courtPrice)}</span>
                    </div>
                    {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                      <>
                        {selectedBooking.barTab.length > 0 && (
                          <div className="flex justify-between text-slate-500">
                            <span>Consumo Común / General</span>
                            <span>{formatPrice(selectedBooking.barTab.reduce((a,b) => a + (b.price * b.qty), 0))}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>Consumo Individual asignado</span>
                          <span>
                            {formatPrice(
                              selectedBooking.clients.reduce((total, c) => {
                                return total + c.barTab.reduce((sub, item) => sub + (item.price * item.qty), 0);
                              }, 0)
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    {(!selectedBooking.clients || selectedBooking.clients.length === 0) && (
                      <div className="flex justify-between text-slate-500">
                        <span>Bebidas / Insumos Bar</span>
                        <span>{formatPrice(selectedBooking.barTab.reduce((a, b) => a + (b.price * b.qty), 0))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-950 pt-1 border-t border-slate-100">
                      <span>Monto Total a Recaudar</span>
                      <span>
                        {formatPrice(
                          selectedBooking.courtPrice + 
                          selectedBooking.barTab.reduce((a, b) => a + (b.price * b.qty), 0) +
                          (selectedBooking.clients?.reduce((total, c) => {
                            return total + c.barTab.reduce((sub, item) => sub + (item.price * item.qty), 0);
                          }, 0) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel canilla derecha: agregar orden o cobrar */}
                <div className="p-6 space-y-5">
                  {/* Optional Alert of share discrepancy */}
                  {selectedBooking.clients && selectedBooking.clients.length > 0 && !selectedBooking.paid && (
                    <>
                      {/* Share Warning notice if sums do not match courtPrice */}
                      {(() => {
                        const totalSharesSum = selectedBooking.clients.reduce((sum, c) => sum + c.courtShare, 0);
                        const isShareMismatch = totalSharesSum !== selectedBooking.courtPrice;
                        if (isShareMismatch) {
                          return (
                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex flex-col gap-1.5 text-[10.5px] text-amber-850">
                              <div className="flex items-start gap-1.5 font-extrabold leading-tight text-amber-900">
                                <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                                <span>La suma de aportes individuales ({formatPrice(totalSharesSum)}) difiere del valor real de cancha ({formatPrice(selectedBooking.courtPrice)}).</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleReSplitEqually}
                                className="font-extrabold text-[#78350F] hover:text-[#451A03] bg-[#FEF3C7] border border-[#FDE68A] py-1 px-2.5 rounded-lg text-xs cursor-pointer text-center"
                              >
                                Dividir en Partes Iguales
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  {/* SECTION FOR SUB-CLIENT CHECKOUT FLOATING ACTION */}
                  {checkingOutClientId && !selectedBooking.paid ? (
                    <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-xs text-emerald-950 uppercase tracking-widest flex items-center gap-1.5">
                          <DollarSign size={14} className="text-emerald-600 animate-pulse" />
                          Cobrar a: {selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.name}
                        </h5>
                        <button
                          type="button"
                          onClick={() => setCheckingOutClientId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-650 font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-900">
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Aporte de Cancha:</span>
                          <span>{formatPrice(selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.courtShare || 0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Consumo Individual de Bar:</span>
                          <span>
                            {formatPrice(
                              selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.barTab.reduce((a, b) => a + (b.qty * b.price), 0) || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-[#0B1528] pt-2 border-t border-slate-200">
                          <span>Total de este Cliente:</span>
                          <span className="text-emerald-800 font-bold bg-emerald-100/50 px-2 rounded-md">
                            {formatPrice(
                              (selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.courtShare || 0) +
                              (selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.barTab.reduce((a, b) => a + (b.qty * b.price), 0) || 0)
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Método de Pago para Caja</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['efectivo', 'transferencia', 'tarjeta'] as const).map(method => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setClientCheckoutMethod(method)}
                              className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all cursor-pointer ${
                                clientCheckoutMethod === method
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleFinalizeClientCheckout}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md text-center"
                      >
                        Registrar Cobro Individual
                      </button>
                    </div>
                  ) : null}

                  {!selectedBooking.paid ? (
                    <>
                      {/* Multi client loader list form (only visible if multi-client is enabled) */}
                      {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                        <div className="bg-[#0F1729]/5 p-4 rounded-3xl border border-slate-100 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-slate-600" />
                            <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Cargar Otro Jugador / Cliente</h5>
                          </div>

                          <form onSubmit={handleAddClientToList} className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nombre completo"
                                required
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-950 font-bold"
                              />
                              <input
                                type="tel"
                                placeholder="Celular"
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-950 font-bold"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus size={14} /> Añadir a Cancha y Dividir
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Add consumptions to bar forms */}
                      {!isCheckingOut && !checkingOutClientId && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <PlusCircle className="text-amber-500" size={16} />
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cargar Bebida / Accesorio</h4>
                          </div>

                          <form onSubmit={handleAddProductToTabSubmit} className="space-y-3">
                            {/* Selector of client if any exist */}
                            {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Asignar Consumo a:</label>
                                <select
                                  value={quickOrderClientId}
                                  onChange={(e) => setQuickOrderClientId(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-900"
                                >
                                  <option value="">-- Consumo General / Común --</option>
                                  {selectedBooking.clients.map(c => (
                                    <option key={c.id} value={c.id} disabled={c.paid}>
                                      {c.name} {c.paid ? '[OBLIGACIÓN PAGADA]' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Seleccionar Insumo del Bar</label>
                              <select 
                                id="quick-order-product-select"
                                value={quickOrderProductId}
                                onChange={(e) => {
                                  setQuickOrderProductId(e.target.value);
                                  setOrderError('');
                                }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 font-bold"
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
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-center font-bold text-slate-900"
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
                      )}

                      {/* Standard whole account Checkouts */}
                      {!isCheckingOut && !checkingOutClientId ? (
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                          <button
                            id="checkout-trigger-btn"
                            onClick={() => setIsCheckingOut(true)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                          >
                            <FileCheck2 size={16} /> Cobrar y Cerrar Cuenta Completa
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
                            className="w-full py-2 border border-slate-100 hover:bg-rose-50 text-rose-500 hover:text-rose-700 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center"
                          >
                            Cancelar Turno
                          </button>
                        </div>
                      ) : null}

                      {isCheckingOut && !checkingOutClientId ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="text-emerald-500" size={16} />
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Finalizar Pago Total</h4>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                              {selectedBooking.clients && selectedBooking.clients.length > 0 
                                ? "Registrar el pago total de todas las cuentas restantes pendientes en el turno." 
                                : "Selecciona el método de pago para registrar el cobro en las planillas de caja."}
                            </p>
                            
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
                                      className="text-emerald-600 focus:ring-emerald-500 bg-white" 
                                    />
                                    <span className="text-slate-900">{method}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium font-bold">Sin recargo</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex gap-2">
                            <button 
                              type="button"
                              id="back-from-checkout"
                              onClick={() => setIsCheckingOut(false)}
                              className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Volver
                            </button>
                            <button 
                              type="button"
                              id="confirm-checkout-and-pay"
                              onClick={handleFinalizeCheckout}
                              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Registrar Pago Total
                            </button>
                          </div>
                        </div>
                      ) : null}
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
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-400 font-mono w-full text-slate-900">
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
