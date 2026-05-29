export interface Court {
  id: string;
  name: string;
  type: 'Cristal' | 'Blindex' | 'Hormigón';
  color: string; // Tailwind color class for badges/borders
  price90Min: number; // Price for 90 minutes slot
}

export interface Product {
  id: string;
  name: string;
  category: 'bebidas' | 'snacks' | 'palas' | 'accesorios';
  price: number; // Sale price
  cost: number;  // Cost price (for utility analysis)
  stock: number;
  minStock: number;
  iconName: string; // Lucide icon reference
}

export interface BookingOrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface BookingClient {
  id: string;
  name: string;
  phone?: string;
  courtShare: number;
  barTab: BookingOrderItem[];
  paid: boolean;
  paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta';
}

export interface Booking {
  id: string;
  courtId: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "08:00", "09:30"
  endTime: string;   // e.g. "09:30", "11:00"
  status: 'reservado' | 'completado' | 'cancelado';
  courtPrice: number;
  barTab: BookingOrderItem[]; // Items ordered on this court during match (general/shared tab)
  paid: boolean;
  paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta';
  clients?: BookingClient[]; // Loaded individual clients for splitting
}

export interface Sale {
  id: string;
  timestamp: string; // ISO string
  items: {
    productId: string;
    name: string;
    qty: number;
    price: number;
    cost: number;
  }[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta';
  associatedBookingId?: string; // If was linked to a court
  description?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  qty: number; // positive for purchase/addition, negative for manual subtraction
  type: 'compra' | 'ajuste' | 'baja';
  timestamp: string;
  cost?: number; // optionally track purchased cost
  details?: string;
}
