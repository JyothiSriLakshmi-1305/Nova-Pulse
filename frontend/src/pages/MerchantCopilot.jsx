import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StockConfidenceBadge from '../components/StockConfidenceBadge';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { 
  Store, Mic, Sparkles, Check, AlertCircle, RefreshCw, 
  Flame, CheckCircle2, XCircle, Package, ArrowRight, Clock,
  CheckCheck, ChefHat, Truck
} from 'lucide-react';

export default function MerchantCopilot({ sharedOrderCounter }) {
  const [merchantTab, setMerchantTab] = useState('orders'); // 'orders' | 'inventory'
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(1);
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [rushMode, setRushMode] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Incoming Store Orders state
  const [storeOrders, setStoreOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadStoreDetails(selectedStoreId);
      loadStoreOrders(selectedStoreId);

      // Clean 10s polling with cleanup on unmount or store switch
      const timer = setInterval(() => {
        loadStoreOrders(selectedStoreId);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [selectedStoreId, sharedOrderCounter]);

  const loadStores = async () => {
    try {
      const res = await api.getStores();
      if (res.success) {
        setStores(res.stores);
        if (res.stores.length > 0) {
          setSelectedStoreId(res.stores[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading stores:", err);
    }
  };

  const loadStoreDetails = async (storeId) => {
    try {
      const res = await api.getStoreProducts(storeId);
      if (res.success) {
        setStoreData(res.store);
        setProducts(res.products);
        setRushMode(Boolean(res.store.rush_mode));
      }
    } catch (err) {
      console.error("Error loading store details:", err);
    }
  };

  const loadStoreOrders = async (storeId) => {
    setIsLoadingOrders(true);
    try {
      const res = await api.getStoreOrders(storeId);
      if (res.success) {
        setStoreOrders(res.orders);
      }
    } catch (err) {
      console.error("Error loading store orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.updateOrderStatus(orderId, newStatus, selectedStoreId);
      if (res.success) {
        setStoreOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          status: newStatus, 
          store_status: newStatus,
          overall_status: res.order_status || o.overall_status 
        } : o));
        showToast(`Order #${orderId} marked as '${newStatus.toUpperCase()}'!`);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleToggleStock = async (product) => {
    const newStatus = !product.is_in_stock;
    try {
      const res = await api.toggleProductStock(
        selectedStoreId, 
        product.id, 
        newStatus, 
        newStatus ? 15 : 0
      );
      if (res.success) {
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, is_in_stock: newStatus ? 1 : 0, stock_quantity: newStatus ? 15 : 0 } : p
        ));
        showToast(`${product.name} marked as ${newStatus ? 'In Stock (15 units)' : 'Sold Out'}`);
        loadStoreDetails(selectedStoreId);
      }
    } catch (err) {
      console.error("Toggle stock failed:", err);
    }
  };

  const handleToggleRushMode = async () => {
    const newRush = !rushMode;
    try {
      const res = await api.toggleRushMode(selectedStoreId, newRush);
      if (res.success) {
        setRushMode(newRush);
        showToast(newRush 
          ? "Rush Mode ON: 15-min prep buffer added to prevent walk-in order rejections" 
          : "Rush Mode OFF: Standard express delivery active"
        );
      }
    } catch (err) {
      console.error("Rush mode toggle failed:", err);
    }
  };

  const handleAiSync = async () => {
    if (!voiceNote.trim()) return;
    setIsSyncingAI(true);
    setAiResult(null);

    try {
      const res = await api.aiVoiceSync(selectedStoreId, voiceNote);
      if (res.success) {
        setAiResult(res);
        showToast(`AI Copilot updated ${res.applied_count} catalog items successfully!`);
        loadStoreDetails(selectedStoreId);
        setVoiceNote('');
      }
    } catch (err) {
      console.error("AI Sync error:", err);
    } finally {
      setIsSyncingAI(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-slate-700 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Store Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Merchant Copilot
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {storeData?.name || "Merchant Store Console"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {storeData?.area}, {storeData?.city} • {storeData?.category} • Last verified: {storeData?.last_inventory_sync}
            </p>
          </div>

          {/* Partner Store Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div>
              <label htmlFor="store-select" className="block text-[11px] font-bold text-slate-500 mb-1">
                Active Merchant Profile:
              </label>
              <select
                id="store-select"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="self-end sm:self-center">
              <StockConfidenceBadge 
                score={storeData?.computed_sci || storeData?.stock_confidence_score || 95} 
              />
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setMerchantTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer ${
              merchantTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Incoming Store Orders</span>
            {storeOrders.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-xs font-black ${
                merchantTab === 'orders' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {storeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMerchantTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer ${
              merchantTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Inventory Management & AI Copilot</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INCOMING STORE ORDERS */}
      {merchantTab === 'orders' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Orders for {storeData?.name || "This Store"}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Multi-store orders are automatically split: you only see and fulfill items belonging to your inventory.
              </p>
            </div>
            <button
              onClick={() => loadStoreOrders(selectedStoreId)}
              disabled={isLoadingOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {isLoadingOrders && storeOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Loading store orders...</div>
          ) : storeOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-base">No incoming orders for {storeData?.name}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Switch to the <strong>Customer Portal</strong> to place an individual or multi-store bundle order, and watch it instantly appear here in real time!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-sm">
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            Order #{order.id}
                          </h4>
                          {order.is_multi_store === 1 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              Multi-Store Order (Your items isolated)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              Single Store Direct
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Customer: <strong>{order.customer_name}</strong> ({order.customer_phone}) • Placed: {order.created_at}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <OrderStatusBadge status={order.status} />
                        {order.is_multi_store === 1 && order.overall_status && (
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Order overall: <strong className="capitalize text-slate-700">{order.overall_status}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Your Store Portion</span>
                        <span className="font-black text-base text-slate-900">
                          ₹{order.store_subtotal}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Store-Specific Items List */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Fulfill These Items ({order.items.length} items from {storeData?.name}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900">{it.product_name}</span>
                            <span className="text-[11px] text-indigo-700 font-medium block">Store ID #{selectedStoreId}</span>
                          </div>
                          <span className="font-black text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200">
                            Qty: {it.quantity} × ₹{it.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Progression Controls */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Fulfillment Step:</span>
                      <strong className="text-slate-800 capitalize">{order.status}</strong>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'placed')}
                        disabled={updatingOrderId === order.id || order.status === 'placed'}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                          order.status === 'placed'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        1. Placed
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={updatingOrderId === order.id || order.status === 'preparing'}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                          order.status === 'preparing'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <ChefHat className="w-3 h-3" />
                        <span>2. Mark Preparing</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        disabled={updatingOrderId === order.id || order.status === 'ready'}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                          order.status === 'ready'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Truck className="w-3 h-3" />
                        <span>3. Mark Ready</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={updatingOrderId === order.id || order.status === 'completed'}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                          order.status === 'completed'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>4. Mark Completed</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INVENTORY MANAGEMENT & AI COPILOT */}
      {merchantTab === 'inventory' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Rush Mode Banner: Addressing the 18% Store Rejections from PDF */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            rushMode 
              ? 'bg-amber-500/10 border-amber-400/60 shadow-xs' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${rushMode ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Rush Mode Throttling (Mitigates 18% Store Rejections)
                  </h3>
                  {rushMode && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      Active Buffer
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When walk-in foot traffic surges, activate Rush Mode to insert a 15-minute preparation buffer. Prevents order rejections without delisting the store.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleRushMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                rushMode 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {rushMode ? "Disable Rush Mode" : "Activate Rush Mode (+15m)"}
            </button>
          </div>

          {/* AI Unstructured Note / Voice Copilot (Gemini Integration) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-400 border border-indigo-400/30">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span>Gemini AI Voice & Chat Sync</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                        Zero POS Hardware Required
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Merchants speak or type natural shopkeeper notes in Hindi/English; Gemini maps to catalog items.
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo voice note prompt pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Test Notes:</span>
                <button
                  type="button"
                  onClick={() => setVoiceNote("We received 20 fresh milk packets and avocados are completely sold out.")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                >
                  "20 fresh milk, avocados sold out"
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceNote("Restocked 10 sourdough bread and croissants have 5 units left")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                >
                  "Restocked sourdough & 5 croissants"
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceNote("Digene gel is out of stock and received 40 Electral packets")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                >
                  "Digene sold out, 40 Electral"
                </button>
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="e.g. 'Avocados are finished, restocked 25 packets of A2 milk'..."
                  className="flex-1 bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAiSync}
                  disabled={isSyncingAI || !voiceNote.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSyncingAI ? "Parsing..." : "Sync via Gemini"}</span>
                </button>
              </div>

              {/* AI Parser Feedback */}
              {aiResult && (
                <div className="p-3 rounded-xl bg-slate-800/90 border border-indigo-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gemini parsed {aiResult.applied_count} inventory updates:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {aiResult.extracted_updates.map((upd, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/80 rounded border border-slate-700 text-[11px]">
                        <span className="font-bold text-white">{upd.name_matched}</span>:{" "}
                        <span className={upd.is_in_stock ? "text-emerald-400" : "text-rose-400"}>
                          {upd.is_in_stock ? `In Stock (${upd.stock_quantity || 15} units)` : "Sold Out"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1-Tap Fast Stock Toggler */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">1-Tap Fast Stock Toggler</h3>
                <p className="text-xs text-slate-500">Tap any item to instantly toggle between In Stock and Sold Out</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{products.length} catalog items</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="Store inventory items">
              {products.map((prod) => {
                const inStock = Boolean(prod.is_in_stock);
                return (
                  <div 
                    key={prod.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={inStock}
                    aria-label={`Toggle stock for ${prod.name}. Currently ${inStock ? 'In Stock' : 'Sold Out'}`}
                    onClick={() => handleToggleStock(prod)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleStock(prod);
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      inStock 
                        ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400' 
                        : 'bg-rose-50/50 border-rose-300 hover:border-rose-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{prod.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{prod.unit} • ₹{prod.price}</span>
                      <div className="mt-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inStock ? `${prod.stock_quantity} in stock` : 'Sold Out'}
                        </span>
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                      inStock ? 'bg-emerald-600' : 'bg-rose-500'
                    }`} aria-hidden="true">
                      {inStock ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
