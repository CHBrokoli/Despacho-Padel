import { Court, Product, Booking, Sale, StockAdjustment } from '../types';

export const INITIAL_COURTS: Court[] = [
  {
    id: 'c1',
    name: 'Cancha 1 (Cristal)',
    type: 'Cristal',
    color: 'emerald',
    price90Min: 24000
  },
  {
    id: 'c2',
    name: 'Cancha 2 (Panorámica)',
    type: 'Blindex',
    color: 'blue',
    price90Min: 28000
  },
  {
    id: 'c3',
    name: 'Cancha 3 (Hormigón)',
    type: 'Hormigón',
    color: 'amber',
    price90Min: 18000
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Gatorade 500ml (Manzana)',
    category: 'bebidas',
    price: 3200,
    cost: 1600,
    stock: 24,
    minStock: 8,
    iconName: 'Droplet'
  },
  {
    id: 'p2',
    name: 'Gatorade 500ml (Frutos Rojos)',
    category: 'bebidas',
    price: 3200,
    cost: 1600,
    stock: 18,
    minStock: 8,
    iconName: 'Droplet'
  },
  {
    id: 'p3',
    name: 'Agua Mineral Sin Gas 600ml',
    category: 'bebidas',
    price: 1800,
    cost: 700,
    stock: 45,
    minStock: 12,
    iconName: 'CupSoda'
  },
  {
    id: 'p4',
    name: 'Cerveza Corona Porrón 330ml',
    category: 'bebidas',
    price: 3500,
    cost: 1900,
    stock: 32,
    minStock: 10,
    iconName: 'Beer'
  },
  {
    id: 'p5',
    name: 'Coca-Cola Sabor Original 500ml',
    category: 'bebidas',
    price: 2200,
    cost: 1000,
    stock: 5, // LOW STOCK to demo alerts
    minStock: 10,
    iconName: 'CupSoda'
  },
  {
    id: 'p6',
    name: 'Tubo de Pelotas Head Pro S (x3)',
    category: 'accesorios',
    price: 12500,
    cost: 7500,
    stock: 12,
    minStock: 4,
    iconName: 'CircleAlert'
  },
  {
    id: 'p7',
    name: 'Overgrip Wilson Sabor Classic (x1)',
    category: 'accesorios',
    price: 1500,
    cost: 700,
    stock: 28,
    minStock: 6,
    iconName: 'Layers'
  },
  {
    id: 'p8',
    name: 'Alquiler Pala Bullpadel Vertex',
    category: 'palas',
    price: 3000,
    cost: 0, // No product unit cost
    stock: 6, // Total rental assets
    minStock: 2,
    iconName: 'Sparkles'
  },
  {
    id: 'p9',
    name: 'Barra de Proteína B-Power',
    category: 'snacks',
    price: 2400,
    cost: 1200,
    stock: 15,
    minStock: 5,
    iconName: 'Cookie'
  }
];

// Seed some bookings for today (to showcase calendar and on-court bar sales)
const todayStr = new Date().toISOString().split('T')[0];
// Also support yesterday for dashboard metrics
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    courtId: 'c1',
    clientName: 'Juan Carlos Pérez',
    clientPhone: '351423455',
    date: todayStr,
    startTime: '09:00',
    endTime: '10:30',
    status: 'completado',
    courtPrice: 24000,
    barTab: [
      { productId: 'p1', name: 'Gatorade 500ml (Manzana)', qty: 2, price: 3200 },
      { productId: 'p3', name: 'Agua Mineral Sin Gas 600ml', qty: 1, price: 1800 }
    ],
    paid: true,
    paymentMethod: 'efectivo'
  },
  {
    id: 'b2',
    courtId: 'c2',
    clientName: 'Amelia Ortiz',
    clientPhone: '351688741',
    date: todayStr,
    startTime: '10:30',
    endTime: '12:00',
    status: 'reservado',
    courtPrice: 28000,
    barTab: [
      { productId: 'p8', name: 'Alquiler Pala Bullpadel Vertex', qty: 2, price: 3000 }
    ],
    paid: false
  },
  {
    id: 'b3',
    courtId: 'c1',
    clientName: 'Seba sanz',
    clientPhone: '351989412',
    date: todayStr,
    startTime: '15:00',
    endTime: '16:30',
    status: 'reservado',
    courtPrice: 24000,
    barTab: [],
    paid: false
  },
  {
    id: 'b4',
    courtId: 'c3',
    clientName: 'Martín Rodríguez',
    clientPhone: '351336592',
    date: todayStr,
    startTime: '18:00',
    endTime: '19:30',
    status: 'reservado',
    courtPrice: 18000,
    barTab: [
      { productId: 'p4', name: 'Cerveza Corona Porrón 330ml', qty: 4, price: 3500 }
    ],
    paid: false
  },
  {
    id: 'b5',
    courtId: 'c2',
    clientName: 'Clara Domínguez',
    clientPhone: '261599874',
    date: yesterdayStr,
    startTime: '19:30',
    endTime: '21:00',
    status: 'completado',
    courtPrice: 28000,
    barTab: [
      { productId: 'p1', name: 'Gatorade 500ml (Manzana)', qty: 4, price: 3200 },
      { productId: 'p6', name: 'Tubo de Pelotas Head Pro S (x3)', qty: 1, price: 12500 }
    ],
    paid: true,
    paymentMethod: 'transferencia'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 's1',
    timestamp: `${yesterdayStr}T11:00:00.000Z`,
    items: [
      { productId: 'p1', name: 'Gatorade 500ml (Manzana)', qty: 2, price: 3200, cost: 1600 },
      { productId: 'p3', name: 'Agua Mineral Sin Gas 600ml', qty: 1, price: 1800, cost: 700 }
    ],
    total: 8200,
    paymentMethod: 'efectivo',
    associatedBookingId: 'b1'
  },
  {
    id: 's2',
    timestamp: `${yesterdayStr}T21:15:00.000Z`,
    items: [
      { productId: 'p1', name: 'Gatorade 500ml (Manzana)', qty: 4, price: 3200, cost: 1600 },
      { productId: 'p6', name: 'Tubo de Pelotas Head Pro S (x3)', qty: 1, price: 12500, cost: 7500 }
    ],
    total: 40800, // Includes court price 28000 inside the total if court checkouts count as overall sales
    paymentMethod: 'transferencia',
    associatedBookingId: 'b5',
    description: 'Cerrar cuenta Cancha 2 (Clara Domínguez) + Consumos'
  },
  {
    id: 's3',
    timestamp: `${todayStr}T10:15:00.000Z`,
    items: [
      { productId: 'p3', name: 'Agua Mineral Sin Gas 600ml', qty: 2, price: 1800, cost: 700 },
      { productId: 'p9', name: 'Barra de Proteína B-Power', qty: 2, price: 2400, cost: 1200 }
    ],
    total: 8400,
    paymentMethod: 'tarjeta',
    description: 'Venta rápida en mostrador de bar'
  }
];

export const INITIAL_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'a1',
    productId: 'p1',
    productName: 'Gatorade 500ml (Manzana)',
    qty: 24,
    type: 'compra',
    timestamp: `${yesterdayStr}T09:00:00.000Z`,
    cost: 1600,
    details: 'Ingreso inicial - Compra a distribuidor'
  },
  {
    id: 'a2',
    productId: 'p5',
    productName: 'Coca-Cola Sabor Original 500ml',
    qty: -2,
    type: 'ajuste',
    timestamp: `${todayStr}T08:30:00.000Z`,
    details: 'Pérdida de stock por vencimiento / rotura'
  }
];
