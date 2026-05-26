import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Database, 
  History, 
  Check, 
  Sparkles, 
  ShoppingCart, 
  RefreshCw,
  FolderPlus,
  AlertTriangle,
  FlameKindling
} from 'lucide-react';
import { Product, StockAdjustment } from '../types';
import LucideIcon from './LucideIcon';

interface InventoryManagerProps {
  products: Product[];
  adjustments: StockAdjustment[];
  onAddProduct: (product: Product) => void;
  onUpdatePricing: (id: string, price: number, cost: number) => void;
  onRegisterStockAddition: (productId: string, qty: number, type: 'compra' | 'ajuste', details?: string) => void;
  onDeleteProduct: (productId: string) => void;
  formatPrice: (amount: number) => string;
}

const ICON_PRESETS = [
  { name: 'Droplet', label: 'Líquidos / Agua' },
  { name: 'CupSoda', label: 'Gaseosas' },
  { name: 'Beer', label: 'Cerveza / Alcohol' },
  { name: 'Cookie', label: 'Snacks / Barras' },
  { name: 'Sparkles', label: 'Palas / Raquetas' },
  { name: 'Layers', label: 'Overgrips / Grips' },
  { name: 'CircleAlert', label: 'Pelotas / Tubos' },
  { name: 'Settings', label: 'Otros' }
];

export default function InventoryManager({
  products,
  adjustments,
  onAddProduct,
  onUpdatePricing,
  onRegisterStockAddition,
  onDeleteProduct,
  formatPrice
}: InventoryManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'history'>('catalog');
  
  // Product creation form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<'bebidas' | 'snacks' | 'palas' | 'accesorios'>('bebidas');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCost, setNewCost] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(5);
  const [newIcon, setNewIcon] = useState('Droplet');

  // Purchase/restock state
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockComments, setRestockComments] = useState('');

  // Editing price/cost states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);

  // Submit product creation
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice <= 0) return;

    const newProd: Product = {
      id: 'p_' + Date.now(),
      name: newName.trim(),
      category: newCat,
      price: Number(newPrice),
      cost: Number(newCost),
      stock: Number(newStock),
      minStock: Number(newMinStock),
      iconName: newIcon
    };

    onAddProduct(newProd);

    // If initial stock was registered, also write an adjustment log
    if (newStock > 0) {
      onRegisterStockAddition(newProd.id, newStock, 'compra', 'Carga inicial de producto nuevo');
    }

    // Reset Form
    setNewName('');
    setNewPrice(0);
    setNewCost(0);
    setNewStock(0);
    setNewMinStock(5);
    setNewIcon('Droplet');
    setIsAddingNew(false);
  };

  // Submit restock
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductId || restockQty <= 0) return;

    onRegisterStockAddition(restockProductId, Number(restockQty), 'compra', restockComments.trim() || 'Reposición distribuidor');
    alert('Stock actualizado y compra guardada.');

    setRestockProductId('');
    setRestockQty(10);
    setRestockComments('');
  };

  // Trigger editing price
  const handleStartEditPricing = (p: Product) => {
    setEditingProductId(p.id);
    setEditPrice(p.price);
    setEditCost(p.cost);
  };

  // Submit edits
  const handleSavePricing = (id: string) => {
    onUpdatePricing(id, Number(editPrice), Number(editCost));
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 id="inventory-manager-title" className="text-3xl font-extrabold text-white tracking-tight">Stock & Inventario Bar</h1>
          <p className="text-slate-400 mt-1">Alta de insumos, auditoría de precios y registro rápido de reabastecimiento.</p>
        </div>

        {/* View toggle tabs */}
        <div className="flex gap-1 bg-[#1E293B] p-1 border border-[#334155] rounded-xl w-fit text-xs font-semibold self-start md:self-center">
          <button
            id="subtab-catalog-btn"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all ${
              activeSubTab === 'catalog' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Catálogo de Productos
          </button>
          <button
            id="subtab-history-btn"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all ${
              activeSubTab === 'history' ? 'bg-lime-400 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🕒 Historial de Movimientos
          </button>
        </div>
      </div>

      {activeSubTab === 'catalog' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SPREADSHEET TABLE CATALOG */}
          <div className="lg:col-span-2 bg-[#1E293B] rounded-3xl border border-[#334155] shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="text-lime-400" size={18} />
                <h3 className="font-extrabold text-white text-sm">Listado General</h3>
              </div>
              <button
                id="toggle-add-product-form"
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="text-xs font-black bg-lime-400 hover:bg-lime-300 text-slate-950 rounded-xl px-4 py-2 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} /> Creación Producto
              </button>
            </div>

            {/* Slide Down Create Form */}
            <AnimatePresence>
              {isAddingNew && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50/50 border-b border-slate-100 overflow-hidden"
                >
                  <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <FolderPlus size={14} /> Agregar Producto en Catálogo
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Comercial</label>
                        <input 
                          type="text" 
                          id="new-product-name"
                          required
                          placeholder="Ej. Grip Wilson blanco"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Categoría</label>
                        <select 
                          id="new-product-category"
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="bebidas">Bebidas</option>
                          <option value="snacks">Snacks</option>
                          <option value="palas">Palas / Alquileres</option>
                          <option value="accesorios">Accesorios</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Costo Unitario ($)</label>
                        <input 
                          type="number" 
                          id="new-product-cost"
                          min="0"
                          value={newCost}
                          onChange={(e) => setNewCost(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Venta ($)</label>
                        <input 
                          type="number" 
                          id="new-product-price"
                          min="0"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Inicial</label>
                        <input 
                          type="number" 
                          id="new-product-stock"
                          min="0"
                          value={newStock}
                          onChange={(e) => setNewStock(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Mín. (Alerta)</label>
                        <input 
                          type="number" 
                          id="new-product-minstock"
                          min="1"
                          value={newMinStock}
                          onChange={(e) => setNewMinStock(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Presets icons */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Icono Visual</label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {ICON_PRESETS.map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            id={`icon-preset-${preset.name}`}
                            onClick={() => setNewIcon(preset.name)}
                            className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                              newIcon === preset.name 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' 
                                : 'border-slate-200 hover:bg-white text-slate-500'
                            }`}
                          >
                            <LucideIcon name={preset.name} size={15} />
                            <span className="text-[9px] leading-none text-center truncate w-full">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        id="cancel-new-product"
                        onClick={() => setIsAddingNew(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        id="submit-new-product"
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                      >
                        Guardar Producto
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Catalog Grid spreadsheet table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-[#334155] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-3">Detalle</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Costo</th>
                    <th className="p-3">Precio Venta</th>
                    <th className="p-3">Margen (%)</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {products.map(product => {
                    const isEditing = editingProductId === product.id;
                    const isLowStock = product.stock <= product.minStock;
                    const marginValue = product.price - product.cost;
                    const marginPercent = product.price > 0 
                      ? Math.round((marginValue / product.price) * 100) 
                      : 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/40">
                        {/* Name and Icon */}
                        <td className="p-3 font-semibold text-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-[#334155] text-lime-400 flex items-center justify-center">
                              <LucideIcon name={product.iconName} size={14} />
                            </div>
                            <div>
                              <span className="block font-bold text-white">{product.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">Mín. Alarma: {product.minStock} un.</span>
                            </div>
                          </div>
                        </td>

                        {/* Category badge */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="capitalize text-[9px] bg-slate-905 bg-slate-900/80 border border-[#334155] text-lime-400 rounded-full px-2 py-0.5 font-black tracking-wide">
                            {product.category}
                          </span>
                        </td>

                        {/* Cost pricing row */}
                        <td className="p-3 font-mono text-slate-300">
                          {isEditing ? (
                            <input 
                              type="number"
                              id={`edit-cost-input-${product.id}`}
                              value={editCost}
                              onChange={(e) => setEditCost(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-900 border border-[#334155] rounded-xl text-xs font-bold text-white"
                            />
                          ) : (
                            formatPrice(product.cost)
                          )}
                        </td>

                        {/* Sale price row */}
                        <td className="p-3 font-mono font-black text-white">
                          {isEditing ? (
                            <input 
                              type="number"
                              id={`edit-price-input-${product.id}`}
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-900 border border-[#334155] rounded-xl text-xs font-bold text-lime-400"
                            />
                          ) : (
                            formatPrice(product.price)
                          )}
                        </td>

                        {/* Calculated Margin percentage */}
                        <td className="p-3">
                          <span className={`font-black font-mono ${marginPercent > 40 ? 'text-lime-400' : 'text-slate-400'}`}>
                            {marginPercent}%
                          </span>
                        </td>

                        {/* Stocks */}
                        <td className={`p-3 text-center whitespace-nowrap font-mono font-black ${
                          product.stock <= 0 
                            ? 'text-rose-400' 
                            : isLowStock 
                              ? 'text-amber-400' 
                              : 'text-white'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{product.stock} un.</span>
                            {isLowStock && (
                              <AlertTriangle size={12} className="text-amber-400 animate-pulse" title="Alerta: Reabastecer" />
                            )}
                          </div>
                        </td>

                        {/* Actions control */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                id={`save-price-btn-${product.id}`}
                                onClick={() => handleSavePricing(product.id)}
                                className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px]"
                                title="Guardar Cambios"
                              >
                                Guardar
                              </button>
                              <button 
                                id={`cancel-price-btn-${product.id}`}
                                onClick={() => setEditingProductId(null)}
                                className="p-1 px-2 text-slate-400 hover:text-slate-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                id={`edit-price-trigger-${product.id}`}
                                onClick={() => handleStartEditPricing(product)}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                                title="Editar Precios"
                              >
                                ✏️
                              </button>
                              <button
                                id={`delete-product-btn-${product.id}`}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${product.name}" del catálogo comercial?`)) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                title="Borrar Producto"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* SIDEBAR COMPRA / ADJUSTMENT FAST PANEL */}
          <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-xl p-6 space-y-5 h-fit">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-lime-400" size={18} />
              <h3 className="font-extrabold text-white text-base">Registrar Compra (Ingreso)</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ingresa los lotes recibidos por distribuidores para incrementar automáticamente el inventario del bar y registrar costes.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-455 text-slate-400 uppercase tracking-wide">Seleccionar Insumo del Bar</label>
                <select
                  id="restock-product-select"
                  required
                  value={restockProductId}
                  onChange={(e) => setRestockProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#334155] rounded-xl text-xs bg-slate-900 text-white focus:border-lime-404 focus:border-lime-400"
                >
                  <option value="">-- Elige un producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} (Stock actual: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-455 text-slate-400 uppercase tracking-wide">Cantidad Recibida</label>
                  <input
                    type="number"
                    id="restock-qty-input"
                    required
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-[#334155] rounded-xl text-xs bg-slate-900 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-455 text-slate-400 uppercase tracking-wide">Tipo Ingreso</label>
                  <select className="w-full px-3 py-2 border border-[#334155] rounded-xl text-xs bg-slate-900 text-white font-semibold">
                    <option value="compra" className="bg-slate-905 bg-slate-900 text-white">Lote Proveedor</option>
                    <option value="ajuste" className="bg-slate-905 bg-slate-900 text-white">Ajuste / Audito</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-455 text-slate-400 uppercase tracking-wide">Detalles o Factura</label>
                <textarea
                  id="restock-comments"
                  placeholder="Ej. Factura #3342, distribuidor Central"
                  value={restockComments}
                  rows={2}
                  onChange={(e) => setRestockComments(e.target.value)}
                  className="w-full px-3 py-2 border border-[#334155] rounded-xl text-xs bg-slate-900 text-white"
                />
              </div>

              <button
                type="submit"
                id="submit-restock-btn"
                disabled={!restockProductId}
                className="w-full py-2.5 bg-lime-400 hover:bg-lime-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Actualizar Stock Comercial
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* SPREADSHEET AUDIT LOG OF STOCK MOVEMENTS */
        <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="text-lime-400" size={18} />
              <h3 className="font-extrabold text-white text-base">Auditoría / Trazabilidad de Inventario</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Total Logs: {adjustments.length}</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            A continuación se detallan cronológicamente todas las compras de mercadería, amortizaciones o ajustes manuales realizados.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-900/40 border-b border-[#334155] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Tipo Movimiento</th>
                  <th className="p-3 text-center">Variación Cantidad</th>
                  <th className="p-3">Detalle / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {adjustments.slice().reverse().map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/40">
                      <td className="p-3 text-slate-400 whitespace-nowrap font-mono">
                        {new Date(log.timestamp).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} hs
                      </td>
                      <td className="p-3 font-bold text-white">{log.productName}</td>
                      <td className="p-3">
                        <span className={`capitalize text-[9px] font-black rounded-full px-2 py-0.5 border ${
                          log.type === 'compra' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                            : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                        }`}>
                          {log.type === 'compra' ? 'Ingreso Stock (Compra)' : 'Ajuste Stock'}
                        </span>
                      </td>
                      <td className={`p-3 text-center font-black font-mono ${log.qty > 0 ? 'text-lime-400' : 'text-rose-400'}`}>
                        {log.qty > 0 ? `+${log.qty}` : log.qty} un.
                      </td>
                      <td className="p-3 text-slate-400 max-w-[250px] truncate" title={log.details}>
                        {log.details || 'Reabastecimiento regular'}
                      </td>
                    </tr>
                  );
                })}
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      No se han registrado auditorías de stock todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
