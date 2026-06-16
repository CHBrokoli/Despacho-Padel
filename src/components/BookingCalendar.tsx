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
  onUpdateCourt?: (court: Court) => void;
  formatPrice: (amount: number) => string;
}

const TIME_SLOTS = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
  { start: '21:00', end: '22:00' },
  { start: '22:00', end: '23:00' }
];

const ALL_TIME_CHOICES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'
];

const timeToNumber = (t: string): number => {
  if (!t) return 0;
  const parts = t.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours + minutes / 60;
};

const formatTo12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = minutesStr || '00';
  return `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const calculatePrice = (pricePerHour: number, start: string, end: string): number => {
  if (!start || !end) return 0;
  
  const startNum = timeToNumber(start);
  const endNum = timeToNumber(end);
  
  if (endNum <= startNum) return 0;
  
  const durationHours = endNum - startNum;
  return Math.round(durationHours * pricePerHour);
};

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
  onUpdateCourt,
  formatPrice
}: BookingCalendarProps) {
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; startTime: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPricingPanelOpen, setIsPricingPanelOpen] = useState(false);

  // Form states for booking creation
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [formCourtId, setFormCourtId] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formCustomPrice, setFormCustomPrice] = useState<number>(0);

  const selectedCourtObj = courts.find(c => c.id === formCourtId);
  const hourlyRateVal = selectedCourtObj ? selectedCourtObj.pricePerHour : 0;
  const durationHoursVal = formStartTime && formEndTime ? (timeToNumber(formEndTime) - timeToNumber(formStartTime)) : 0;

  const handleStartTimeChange = (newStart: string) => {
    setFormStartTime(newStart);
    const startNum = timeToNumber(newStart);
    const currentEndNum = timeToNumber(formEndTime);
    
    let nextEnd = formEndTime;
    if (currentEndNum < startNum + 1.0) {
      const defaultEndNum = startNum + 1.0;
      const matchingEnd = ALL_TIME_CHOICES.find(t => timeToNumber(t) === defaultEndNum);
      nextEnd = matchingEnd || ALL_TIME_CHOICES.find(t => timeToNumber(t) >= startNum + 1.0) || '24:00';
      setFormEndTime(nextEnd);
    }
    
    const court = courts.find(c => c.id === formCourtId);
    if (court) {
      const calculated = calculatePrice(court.pricePerHour, newStart, nextEnd);
      setFormCustomPrice(calculated);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setFormEndTime(newEnd);
    const court = courts.find(c => c.id === formCourtId);
    if (court) {
      const calculated = calculatePrice(court.pricePerHour, formStartTime, newEnd);
      setFormCustomPrice(calculated);
    }
  };

  const handleFormCourtChange = (newCourtId: string) => {
    setFormCourtId(newCourtId);
    const court = courts.find(c => c.id === newCourtId);
    if (court) {
      const calculated = calculatePrice(court.pricePerHour, formStartTime, formEndTime);
      setFormCustomPrice(calculated);
    }
  };

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

  // Split general unassigned bar consumption tab equally among players
  const handleSplitGeneralBarTabEqually = () => {
    if (!selectedBooking || !selectedBooking.clients || selectedBooking.clients.length === 0 || selectedBooking.barTab.length === 0) return;
    
    const numClients = selectedBooking.clients.length;
    const generalTab = selectedBooking.barTab;
    
    // We will distribute each product in the general tab among the clients
    const updatedClients = selectedBooking.clients.map(c => {
      // Create a copy of the client's bar tab
      const clientTabCopy = [...c.barTab];
      
      generalTab.forEach(generalItem => {
        const shareQty = generalItem.qty / numClients;
        const existingIdx = clientTabCopy.findIndex(item => item.productId === generalItem.productId);
        
        if (existingIdx >= 0) {
          clientTabCopy[existingIdx] = {
            ...clientTabCopy[existingIdx],
            qty: clientTabCopy[existingIdx].qty + shareQty
          };
        } else {
          clientTabCopy.push({
            productId: generalItem.productId,
            name: generalItem.name,
            qty: shareQty,
            price: generalItem.price
          });
        }
      });
      
      return {
        ...c,
        barTab: clientTabCopy
      };
    });
    
    const updatedBooking = {
      ...selectedBooking,
      barTab: [], // General tab is now empty
      clients: updatedClients
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
    
    // Default duration is 1 hour
    const startNum = timeToNumber(startTime);
    const defaultEndNum = startNum + 1.0;
    const defaultEndTime = ALL_TIME_CHOICES.find(t => timeToNumber(t) === defaultEndNum) || '24:00';
    setFormEndTime(defaultEndTime);

    const initialPrice = court ? calculatePrice(court.pricePerHour, startTime, defaultEndTime) : 16000;
    setFormCustomPrice(initialPrice);
    
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
    if (!clientName.trim() || !formCourtId || !formStartTime || !formEndTime) return;

    const newBooking: Booking = {
      id: 'b_' + Date.now(),
      courtId: formCourtId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date: selectedDate,
      startTime: formStartTime,
      endTime: formEndTime,
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
            type="button"
            onClick={() => setIsPricingPanelOpen(!isPricingPanelOpen)}
            className={`text-xs font-bold px-4 py-2.5 border rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              isPricingPanelOpen 
                ? 'bg-lime-400 border-lime-400 text-slate-950 font-black' 
                : 'bg-slate-800 hover:bg-[#334155] border-[#334155] text-slate-200'
            }`}
          >
            <DollarSign size={14} className={isPricingPanelOpen ? "text-slate-950" : "text-[#9ae600]"} />
            <span>Tarifas / Hs</span>
          </button>
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
            className="text-xs font-bold px-4 py-2.5 border border-[#334155] focus:border-lime-400 focus:outline-hidden focus:ring-1 focus:ring-lime-400 rounded-xl cursor-pointer text-[#e2e8f0] bg-[#1e293b]"
          />
        </div>
      </div>

      {/* Pricing adjustment panel */}
      <AnimatePresence>
        {isPricingPanelOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#1E293B] p-5 rounded-3xl border border-[#334155] shadow-lg space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-white">Configuración de Precios por Hora</h3>
                <p className="text-[11px] text-slate-400">Establece el costo por hora personalizado para cada tipo de cancha.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courts.map(court => (
                  <div key={court.id} className="bg-slate-900/60 p-4 rounded-2xl border border-[#334155] space-y-2">
                    <div className="flex items-center gap-2 col-span-full">
                      <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
                      <span className="font-black text-xs text-white uppercase">{court.name}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-500 font-extrabold">Gs.</span>
                      <input 
                        type="number"
                        step="1000"
                        min="0"
                        value={court.pricePerHour}
                        onChange={(e) => {
                          if (onUpdateCourt) {
                            onUpdateCourt({
                              ...court,
                              pricePerHour: Number(e.target.value) || 0
                            });
                          }
                        }}
                        className="w-full pl-10 pr-4 py-1.5 border border-slate-700 focus:border-lime-400 focus:outline-hidden rounded-xl text-xs bg-slate-950 font-bold text-white/[0.9]"
                        placeholder="Precio por hora"
                      />
                    </div>
                    <div className="text-[10px] text-slate-450 text-slate-400">
                      Ref: Gs. {formatPrice(court.pricePerHour * 1.5)} por 90 min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <span className="text-[10px] text-slate-400 font-semibold lowercase">({court.type}) • {formatPrice(court.pricePerHour)} / hs</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {TIME_SLOTS.map(slot => {
                return (
                  <tr key={slot.start} className="hover:bg-slate-800/20 transition-all">
                    {/* Time cell */}
                    <td className="p-4 text-xs font-bold text-slate-355 text-slate-300 whitespace-nowrap align-middle border-r border-[#334155]/50 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-445 bg-lime-400" />
                        <span>{slot.start} - {slot.end}</span>
                      </div>
                    </td>

                    {/* Courts loop */}
                    {courts.map(court => {
                      // Find if there is any active booking covering this slot on this court
                      const activeBooking = bookings.find(
                        b => b.date === selectedDate && 
                             b.courtId === court.id && 
                             b.status !== 'cancelado' &&
                             timeToNumber(b.startTime) < timeToNumber(slot.end) &&
                             timeToNumber(b.endTime) > timeToNumber(slot.start)
                      );

                      if (activeBooking) {
                        // Check if this slot represents the starting block or close to it
                        const isStartSlot = timeToNumber(slot.start) <= timeToNumber(activeBooking.startTime) && 
                          timeToNumber(activeBooking.startTime) < timeToNumber(slot.end);

                        if (isStartSlot) {
                          const totalBarItems = activeBooking.barTab.reduce((acc, item) => acc + item.qty, 0);
                          const isPaid = activeBooking.paid;

                          return (
                            <td key={court.id} className="p-2.5 align-middle text-center">
                              <motion.button
                                id={`booking-card-${activeBooking.id}`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                  setSelectedBooking(activeBooking);
                                  setIsCheckingOut(false);
                                  setQuickOrderProductId('');
                                  setQuickOrderQty(1);
                                  setOrderError('');
                                }}
                                className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer shadow-md transition-all ${
                                  isPaid 
                                    ? 'bg-[#0F172A]/90 hover:bg-[#0F172A] border-[#334155] text-slate-400' 
                                    : activeBooking.status === 'completado'
                                      ? 'bg-slate-800 border-[#334155] text-slate-300'
                                      : 'bg-lime-400 hover:bg-lime-300 border-lime-400 text-slate-950 font-extrabold'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className={`text-xs font-black truncate max-w-[120px] ${isPaid ? 'text-slate-300' : 'text-slate-950'}`}>{activeBooking.clientName}</h4>
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                                    isPaid 
                                      ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                                      : 'bg-slate-950/20 text-slate-950'
                                  }`}>
                                    {isPaid ? 'PAGADO' : 'C/DEUDA'}
                                  </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p className={`text-[10px] font-mono flex items-center gap-1 ${isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                                    <span>{formatPrice(activeBooking.courtPrice)}</span>
                                  </p>
                                  {totalBarItems > 0 && (
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black rounded-lg px-2 py-0.5 ${
                                      isPaid 
                                        ? 'bg-slate-900 text-amber-500 border border-slate-800' 
                                        : 'bg-slate-950/80 text-lime-400 font-bold'
                                    }`}>
                                      🛒 Bar: {totalBarItems} art.
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            </td>
                          );
                        } else {
                          // Continuation Slot
                          return (
                            <td key={court.id} className="p-2.5 align-middle text-center">
                              <motion.button
                                id={`booking-card-cont-${activeBooking.id}-${slot.start}`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                  setSelectedBooking(activeBooking);
                                  setIsCheckingOut(false);
                                  setQuickOrderProductId('');
                                  setQuickOrderQty(1);
                                  setOrderError('');
                                }}
                                className="w-full p-2 rounded-2xl border border-dashed border-slate-700 max-w-[195px] text-left cursor-pointer transition-all bg-slate-900/40 text-slate-400 hover:bg-slate-850 hover:border-lime-400/40"
                              >
                                <div className="flex items-center justify-between px-1">
                                  <p className="text-[10px] font-bold truncate text-slate-400 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-slate-500 animate-pulse" />
                                    <span>{activeBooking.clientName}</span>
                                    <span className="text-[8.5px] font-medium text-slate-500 lowercase">(cont.)</span>
                                  </p>
                                </div>
                              </motion.button>
                            </td>
                          );
                        }
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

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto" style={{ backgroundColor: '#0f172b', width: '445px', height: '450px' }}>
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
                      className="w-full pl-10 pr-4 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600] bg-slate-950 text-white placeholder-slate-500 font-bold"
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
                      className="w-full pl-10 pr-4 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600] bg-slate-950 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cancha</label>
                    <select 
                      id="form-court-select"
                      value={formCourtId}
                      onChange={(e) => handleFormCourtChange(e.target.value)}
                      className="w-full px-3 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] bg-slate-950 text-white font-bold"
                    >
                      {courts.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Horario Inicio</label>
                      <select 
                        id="form-time-select"
                        value={formStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] bg-slate-950 text-white font-bold"
                      >
                        {ALL_TIME_CHOICES.filter(t => t !== '24:00').map(t => (
                          <option key={t} value={t} className="bg-slate-950 text-white">{t} hs ({formatTo12Hour(t)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Horario Fin</label>
                      <select 
                        id="form-time-end-select"
                        value={formEndTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] bg-slate-950 text-white font-bold"
                      >
                        {ALL_TIME_CHOICES.filter(time => timeToNumber(time) >= timeToNumber(formStartTime) + 1.0).map(t => (
                          <option key={t} value={t} className="bg-slate-950 text-white">{t} hs ({formatTo12Hour(t)})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cost Calculation Summary Card */}
                {formCourtId && formStartTime && formEndTime && (
                  <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700/60 space-y-2 mt-4 text-white">
                    <div className="text-xs font-black text-lime-400 uppercase tracking-wider">Costo por Hora de la Cancha</div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Costo por Hora:</span>
                      <span className="font-mono text-slate-200">
                        {selectedCourtObj ? `${formatPrice(selectedCourtObj.pricePerHour)} / hora` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Horas Seleccionadas:</span>
                      <span className="font-mono text-slate-200">
                        {durationHoursVal} hs ({formatTo12Hour(formStartTime)} a {formatTo12Hour(formEndTime)})
                      </span>
                    </div>
                    <div className="border-t border-slate-700 my-2"></div>
                    <div className="flex justify-between text-sm font-extrabold text-white">
                      <span>Costo Sugerido:</span>
                      <span className="text-lime-400 font-mono">
                        {formatPrice(calculatePrice(selectedCourtObj?.pricePerHour || 0, formStartTime, formEndTime))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Precio Seteado de la Cancha (Gs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-extrabold select-none">Gs.</span>
                    <input 
                      type="number" 
                      id="form-court-price"
                      value={formCustomPrice}
                      onChange={(e) => setFormCustomPrice(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2 border border-[#334155] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600] bg-slate-950 font-bold text-white"
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
              className="bg-[#0f172b] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#334155] max-h-[90vh] flex flex-col"
            >
              {/* Header details */}
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between shrink-0">
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
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#334155]/60 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
                
                {/* Panel canilla izquierda: consumos / bar list */}
                <div className="p-6 space-y-4 md:max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListOrdered size={16} className="text-[#9ae600]" />
                      <h4 className="font-bold text-slate-200 text-sm">Cuentas y Consumos</h4>
                    </div>
                    {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                      <span className="text-[10px] font-black uppercase bg-purple-950/40 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-sm">
                         👥 Cuenta Dividida ({selectedBooking.clients.length})
                      </span>
                    )}
                  </div>

                  {/* SECTION: Standard Court Price if no client splitting is activated */}
                  {!selectedBooking.clients || selectedBooking.clients.length === 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-[#334155] text-xs text-slate-200">
                          <span className="font-semibold text-slate-300">
                            Reserva de Cancha ({Math.round((timeToNumber(selectedBooking.endTime) - timeToNumber(selectedBooking.startTime)) * 60)} minutos)
                          </span>
                          <span className="font-bold text-slate-200">{formatPrice(selectedBooking.courtPrice)}</span>
                        </div>

                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">
                          🛒 Consumos Generales del Pitch
                        </div>

                        {selectedBooking.barTab.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-[#334155]/60 bg-slate-900/20 rounded-xl text-xs text-slate-400">
                            No hay bebidas o insumos cargados a esta cancha todavía.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedBooking.barTab.map(item => (
                              <div key={item.productId} className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-xl border border-[#334155]/60 bg-slate-900/40 transition-colors text-xs gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-slate-200 truncate">{item.name}</h5>
                                  <p className="text-[10px] text-slate-400">
                                    {item.qty} un. x {formatPrice(item.price)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-white">{formatPrice(item.price * item.qty)}</span>
                                  {!selectedBooking.paid && (
                                    <button 
                                      type="button"
                                      id={`remove-product-from-tab-${item.productId}`}
                                      onClick={() => handleRemoveProductFromTabId(item.productId)}
                                      className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-rose-955/40 rounded-md transition-colors"
                                      title="Eliminar consumo"
                                    >
                                      <Trash2 size={13} />
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
                        <div className="bg-slate-900/30 border border-dashed border-[#334155] p-4 rounded-2xl space-y-2 text-center">
                          <Users size={20} className="mx-auto text-slate-400" />
                          <h5 className="font-bold text-xs text-slate-300">¿Dividir cuenta entre jugadores?</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Carga a los clientes de este turno para dividir el importe total de la cancha y registrar los consumos individuales del bar para cada uno.
                          </p>
                          <button
                            type="button"
                            id="enable-splitting-btn"
                            onClick={handleInitializeMultiClients}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-[#334155] text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-sm"
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
                        <div className="bg-amber-955/20 border border-amber-900/40 p-3 rounded-2xl space-y-2">
                          <div className="text-[10.5px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-between">
                            <span>🍺 Consumos Generales sin registrar</span>
                            <span className="text-[9.5px] font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded">Común</span>
                          </div>
                          <div className="space-y-1.5">
                            {selectedBooking.barTab.map(item => (
                              <div key={item.productId} className="flex items-center justify-between text-xs gap-1">
                                <span className="text-slate-300 truncate max-w-[160px] font-medium">{item.name} ({item.qty} un.)</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{formatPrice(item.price * item.qty)}</span>
                                  {!selectedBooking.paid && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProductFromTabId(item.productId)}
                                      className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-rose-955/40"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {!selectedBooking.paid && selectedBooking.clients && selectedBooking.clients.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSplitGeneralBarTabEqually}
                              className="w-full mt-2 py-2 px-3 bg-[#9ae600] text-slate-950 hover:bg-[#82be00] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Users size={12} />
                              Dividir consumo entre jugadores ({selectedBooking.clients.length})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Render Clients cards list */}
                      <div className="space-y-3">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
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
                                  ? 'bg-slate-950 border-[#334155]/60' 
                                  : 'bg-slate-900/60 border-[#334155] shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-xs text-slate-200 truncate flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.paid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {c.name}
                                  </h5>
                                  {c.phone && <p className="text-[9px] text-slate-400 font-medium">Cel: {c.phone}</p>}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {c.paid ? (
                                    <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-sm">
                                      PAGADO ({c.paymentMethod})
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-955/40 border border-amber-800/60 px-1.5 py-0.5 rounded-sm">
                                        CON DEUDA
                                      </span>
                                      {!selectedBooking.paid && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteClient(c.id)}
                                          className="text-slate-400 hover:text-rose-450 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
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
                              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-[#334155]/55 space-y-2 text-xs">
                                {/* Court share input or text */}
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-medium">Aporte Cancha:</span>
                                  {c.paid || selectedBooking.paid ? (
                                    <span className="font-bold text-slate-200">{formatPrice(c.courtShare)}</span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500">Gs.</span>
                                      <input 
                                        type="number"
                                        value={c.courtShare}
                                        step="1000"
                                        onChange={(e) => handleUpdateClientShare(c.id, Number(e.target.value))}
                                        className="w-20 px-1.5 py-0.5 border border-[#334155] rounded text-center text-xs font-black bg-slate-900 text-white focus:outline-hidden focus:border-[#9ae600]"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Client's BarTab items */}
                                {c.barTab.length > 0 && (
                                  <div className="pt-1.5 border-t border-[#334155]/60 space-y-1.5">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🛒 Consumo Individual:</div>
                                    {c.barTab.map(item => (
                                      <div key={item.productId} className="flex items-center justify-between text-[11px] gap-2">
                                        <span className="text-slate-300 truncate max-w-[130px]">{item.name} (x{Number(item.qty.toFixed(2))})</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-white">{formatPrice(item.price * item.qty)}</span>
                                          {!c.paid && !selectedBooking.paid && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveProductFromTabId(item.productId, c.id)}
                                              className="text-slate-400 hover:text-rose-400 p-0.5 hover:bg-slate-800"
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
                                <div className="pt-2 border-t border-[#334155]/60 flex items-center justify-between text-slate-250 font-extrabold">
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
                                  className="w-full py-1.5 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-[10.5px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
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
                  <div className="pt-3 border-t border-[#334155]/60 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Cancha Base</span>
                      <span>{formatPrice(selectedBooking.courtPrice)}</span>
                    </div>
                    {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                      <>
                        {selectedBooking.barTab.length > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>Consumo Común / General</span>
                            <span>{formatPrice(selectedBooking.barTab.reduce((a,b) => a + (b.price * b.qty), 0))}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400">
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
                      <div className="flex justify-between text-slate-400">
                        <span>Bebidas / Insumos Bar</span>
                        <span>{formatPrice(selectedBooking.barTab.reduce((a, b) => a + (b.price * b.qty), 0))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-[#9ae600] pt-1.5 border-t border-[#334155]/60">
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
                <div className="p-6 space-y-5 md:max-h-[60vh] overflow-y-auto">
                  {/* Optional Alert of share discrepancy */}
                  {selectedBooking.clients && selectedBooking.clients.length > 0 && !selectedBooking.paid && (
                    <>
                      {/* Share Warning notice if sums do not match courtPrice */}
                      {(() => {
                        const totalSharesSum = selectedBooking.clients.reduce((sum, c) => sum + c.courtShare, 0);
                        const isShareMismatch = totalSharesSum !== selectedBooking.courtPrice;
                        if (isShareMismatch) {
                          return (
                            <div className="bg-amber-955/20 border border-amber-900/40 p-3 rounded-2xl flex flex-col gap-1.5 text-[10.5px] text-amber-300">
                              <div className="flex items-start gap-1.5 font-extrabold leading-tight text-amber-450 text-amber-400">
                                <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                                <span>La suma de aportes individuales ({formatPrice(totalSharesSum)}) difiere del valor real de cancha ({formatPrice(selectedBooking.courtPrice)}).</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleReSplitEqually}
                                className="font-extrabold text-amber-200 hover:text-amber-100 bg-amber-900/60 border border-amber-800/40 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer text-center"
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
                    <div className="bg-emerald-950/20 p-4 rounded-3xl border border-emerald-850/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-xs text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <DollarSign size={14} className="text-emerald-400 animate-pulse" />
                          Cobrar a: {selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.name}
                        </h5>
                        <button
                          type="button"
                          onClick={() => setCheckingOutClientId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex justify-between text-slate-400 font-medium">
                          <span>Aporte de Cancha:</span>
                          <span>{formatPrice(selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.courtShare || 0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-medium">
                          <span>Consumo Individual de Bar:</span>
                          <span>
                            {formatPrice(
                              selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.barTab.reduce((a, b) => a + (b.qty * b.price), 0) || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#334155]/60 animate-fade-in">
                          <span>Total de este Cliente:</span>
                          <span className="text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-800/40 px-2 rounded-md">
                            {formatPrice(
                              (selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.courtShare || 0) +
                              (selectedBooking.clients?.find(c => c.id === checkingOutClientId)?.barTab.reduce((a, b) => a + (b.qty * b.price), 0) || 0)
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Método de Pago para Caja</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['efectivo', 'transferencia', 'tarjeta'] as const).map(method => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setClientCheckoutMethod(method)}
                              className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all cursor-pointer ${
                                clientCheckoutMethod === method
                                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                                  : 'border-[#334155] bg-slate-900 text-slate-300 hover:bg-slate-850'
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
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md text-center"
                      >
                        Registrar Cobro Individual
                      </button>
                    </div>
                  ) : null}

                  {!selectedBooking.paid ? (
                    <>
                      {/* Multi client loader list form (only visible if multi-client is enabled) */}
                      {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                        <div className="bg-slate-900/60 p-4 rounded-3xl border border-[#334155]/60 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-[#9ae600]" />
                            <h5 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest">Cargar Otro Jugador / Cliente</h5>
                          </div>

                          <form onSubmit={handleAddClientToList} className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nombre completo"
                                required
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                className="px-3 py-1.5 border border-[#334155] rounded-lg text-xs bg-slate-950 text-white font-bold focus:outline-hidden focus:border-[#9ae600]"
                              />
                              <input
                                type="tel"
                                placeholder="Celular"
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                className="px-3 py-1.5 border border-[#334155] rounded-lg text-xs bg-slate-950 text-white font-bold focus:outline-hidden focus:border-[#9ae600]"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1 border border-[#334155]"
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
                            <PlusCircle className="text-[#9ae600]" size={16} />
                            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Cargar Bebida / Accesorio</h4>
                          </div>

                          <form onSubmit={handleAddProductToTabSubmit} className="space-y-3">
                            {/* Selector of client if any exist */}
                            {selectedBooking.clients && selectedBooking.clients.length > 0 && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">Asignar Consumo a:</label>
                                <select
                                  value={quickOrderClientId}
                                  onChange={(e) => setQuickOrderClientId(e.target.value)}
                                  className="w-full px-3 py-2 border border-[#334155] rounded-lg text-xs bg-slate-950 font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600]"
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
                              <label className="text-[10px] font-bold text-slate-400">Seleccionar Insumo del Bar</label>
                              <select 
                                id="quick-order-product-select"
                                value={quickOrderProductId}
                                onChange={(e) => {
                                  setQuickOrderProductId(e.target.value);
                                  setOrderError('');
                                }}
                                className="w-full px-3 py-2 border border-[#334155] rounded-lg text-xs bg-slate-950 text-white font-bold focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600]"
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
                                <label className="text-[10px] font-bold text-slate-400">Cant.</label>
                                <input 
                                  type="number" 
                                  id="quick-order-qty"
                                  min="1"
                                  value={quickOrderQty}
                                  onChange={(e) => setQuickOrderQty(Math.max(1, Number(e.target.value)))}
                                  className="w-full px-2.5 py-1.5 border border-[#334155] rounded-lg text-xs bg-slate-950 text-center font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-[#9ae600] focus:border-[#9ae600]"
                                />
                              </div>
                              <div className="w-2/3 flex items-end">
                                <button 
                                  type="submit" 
                                  id="add-item-to-tab-btn"
                                  disabled={!quickOrderProductId}
                                  className="w-full py-2 bg-[#9ae600] hover:bg-[#82be00] disabled:bg-slate-800 disabled:text-slate-650 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
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
                        <div className="pt-4 border-t border-[#334155]/60 flex flex-col gap-2">
                          <button
                            id="checkout-trigger-btn"
                            onClick={() => setIsCheckingOut(true)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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
                            className="w-full py-2 border border-[#334155] hover:bg-rose-955/20 text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center"
                          >
                            Cancelar Turno
                          </button>
                        </div>
                      ) : null}

                      {isCheckingOut && !checkingOutClientId ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="text-emerald-400" size={16} />
                            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Finalizar Pago Total</h4>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs text-slate-400">
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
                                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400' 
                                      : 'border-[#334155] hover:bg-slate-850/60 text-slate-300 bg-[#0f172b]/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 capitalize">
                                    <input 
                                      type="radio" 
                                      name="payMethod"
                                      id={`payment-radio-${method}`}
                                      checked={paymentMethod === method}
                                      onChange={() => setPaymentMethod(method as any)}
                                      className="text-emerald-5 w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-[#334155]" 
                                    />
                                    <span className="text-slate-200">{method}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium font-bold">Sin recargo</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#334155]/60 flex gap-2">
                            <button 
                              type="button"
                              id="back-from-checkout"
                              onClick={() => setIsCheckingOut(false)}
                              className="flex-1 py-2 text-xs font-bold text-slate-350 bg-slate-800 hover:bg-slate-700 border border-[#334155] rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Volver
                            </button>
                            <button 
                              type="button"
                              id="confirm-checkout-and-pay"
                              onClick={handleFinalizeCheckout}
                              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer text-center"
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
                      <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                        <Check size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Reserva Finalizada Correctamente</h4>
                        <p className="text-xs text-slate-400 mt-1">El cobro ha sido ingresado en caja mediante método: <strong className="capitalize text-[#9ae600]">{selectedBooking.paymentMethod}</strong>.</p>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-[#334155]/60 text-[10.5px] text-slate-300 font-mono w-full shadow-inner text-left space-y-0.5">
                        <div className="flex justify-between border-b border-[#334155]/40 pb-1 mb-1 text-slate-400">
                          <span>Comprobante de Caja</span>
                          <span>EFECTUADO</span>
                        </div>
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
    <div className="w-10 h-10 bg-[#9ae600]/10 border border-[#334155] rounded-xl flex items-center justify-center text-[#9ae600]">
      <Activity size={20} />
    </div>
  );
}
