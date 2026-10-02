import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import RetentionLadderCard from '../components/RetentionLadderCard';
import BundleCard from '../components/BundleCard';
import StoreCard from '../components/StoreCard';
import StockConfidenceBadge from '../components/StockConfidenceBadge';
import { 
  ShoppingBag, Sparkles, CheckCircle2, Store, Clock, ArrowRight, 
  ShieldCheck, RefreshCw, ShoppingCart, Plus, Package, AlertCircle, 
  FileText, X, AlertTriangle, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CustomerStoreView({ retentionProfile, onRefreshProfile, sharedOrderCounter }) {
  // Navigation sub-tab: 'explore' | 'orders'
  const [customerTab, setCustomerTab] = useState('explore');

  // Explore state
  const [bundles, setBundles] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingBundleId, setOrderingBundleId] = useState(null);
  const [orderingProductId, setOrderingProductId] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // My Orders & Support state
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeOrderForIssue, setActiveOrderForIssue] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState('Missing/unavailable products');
  const [issueDescription, setIssueDescription] = useState('');
  const [isFilingIssue, setIsFilingIssue] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);

  const currentCustomerName = retentionProfile?.customer_name || 'Kavita Iyer';

  useEffect(() => {
    loadExploreData();
    loadCustomerOrders();
  }, []);

  useEffect(() => {
    loadCustomerOrders();
  }, [sharedOrderCounter, currentCustomerName]);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      const [bundlesRes, storesRes] = await Promise.all([
        api.getBundles(),
        api.getStores()
      ]);
      if (bundlesRes.success) setBundles(bundlesRes.bundles);
      if (storesRes.success) {
        setStores(storesRes.stores);
        if (storesRes.stores.length > 0) {
          handleSelectStore(storesRes.stores[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load store data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders(currentCustomerName);
      if (res.success) {
        setCustomerOrders(res.orders);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectStore = async (store) => {
    setSelectedStore(store);
    try {
      const res = await api.getStoreProducts(store.id);
      if (res.success) {
        setStoreProducts(res.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleOrderBundle = async (bundle) => {
    setOrderingBundleId(bundle.id);
    try {
      const itemsPayload = bundle.items.map((it, idx) => ({
        product_id: idx + 1,
        store_id: bundle.primary_store_id || 1,
        product_name: it.name,
        store_name: it.store,
        quantity: 1,
        price: it.price
      }));

      const res = await api.createOrder({
        customer_name: currentCustomerName,
        customer_phone: '+91 98450 12345',
        delivery_address: 'Flat 402, Palm Heights, 12th Main Indiranagar, Bengaluru',
        items: itemsPayload,
        is_multi_store: 1,
        discount_amount: bundle.savings || 40.0
      });

      if (res.success) {
        setOrderSuccess({
          orderId: res.order_id,
          title: bundle.title,
          amount: res.final_amount,
          estMin: res.est_delivery_min,
          newProbability: res.retention_profile.repeat_probability,
          unlockedPerk: res.retention_profile.unlocked_perk
        });

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        if (onRefreshProfile) onRefreshProfile();
        if (selectedStore) handleSelectStore(selectedStore);
        loadCustomerOrders();
      }
    } catch (err) {
      console.error("Failed to place bundle order:", err);
    } finally {
      setOrderingBundleId(null);
    }
  };

  const handleOrderProduct = async (product) => {
    if (!product.is_in_stock) return;
    setOrderingProductId(product.id);
    try {
      const res = await api.createOrder({
        customer_name: currentCustomerName,
        customer_phone: '+91 98450 12345',
        delivery_address: 'Flat 402, Palm Heights, 12th Main Indiranagar, Bengaluru',
        items: [{
          product_id: product.id,
          store_id: selectedStore?.id || 1,
          product_name: product.name,
          store_name: selectedStore?.name || 'Local Store',
          quantity: 1,
          price: product.price
        }],
        is_multi_store: 0,
        discount_amount: 0.0
      });

      if (res.success) {
        setOrderSuccess({
          orderId: res.order_id,
          title: `${product.name} (Direct from ${selectedStore?.name})`,
          amount: res.final_amount,
          estMin: res.est_delivery_min,
          newProbability: res.retention_profile.repeat_probability,
          unlockedPerk: res.retention_profile.unlocked_perk
        });

        try {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        if (onRefreshProfile) onRefreshProfile();
        if (selectedStore) handleSelectStore(selectedStore);
        loadCustomerOrders();
      }
    } catch (err) {
      console.error("Failed to place product order:", err);
    } finally {
      setOrderingProductId(null);
    }
  };

  const handleOpenIssueModal = (order) => {
    setActiveOrderForIssue(order);
    setIssueType('Missing/unavailable products');
    setIssueDescription(`Order #${order.id}: Product was missing or damaged upon fulfillment.`);
    setIssueModalOpen(true);
  };

  const handleFileIssueSubmit = async (e) => {
    e.preventDefault();
    if (!activeOrderForIssue) return;
    setIsFilingIssue(true);
    try {
      const res = await api.fileSupportTicket({
        order_id: activeOrderForIssue.id,
        customer_name: currentCustomerName,
        issue_type: issueType,
        description: issueDescription,
        refund_amount: activeOrderForIssue.total_amount
      });

      if (res.success) {
        setIssueModalOpen(false);
        setActiveOrderForIssue(null);
        await loadCustomerOrders();
      }
    } catch (err) {
      console.error("Failed to file issue:", err);
    } finally {
      setIsFilingIssue(false);
    }
  };

  const handleInstantRefundForTicket = async (ticket, order) => {
    setResolvingTicketId(ticket.id);
    try {
      const res = await api.instantResolve({
        ticket_id: ticket.id,
        issue_type: ticket.issue_type,
        order_amount: ticket.refund_amount || order.total_amount,
        description: ticket.resolution_notes || `Customer dispute for order #${order.id}`
      });
      if (res.success) {
        await loadCustomerOrders();
      }
    } catch (err) {
      console.error("Instant resolve error:", err);
    } finally {
      setResolvingTicketId(null);
    }
  };

  const getStatusColor = (status) => {
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
      
      {/* Sub-Navigation: Explore & Order vs My Orders & Support */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomerTab('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              customerTab === 'explore'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Explore & Order</span>
          </button>

          <button
            onClick={() => {
              setCustomerTab('orders');
              loadCustomerOrders();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              customerTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>My Orders & Support</span>
            {customerOrders.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-xs font-black ${
                customerTab === 'orders' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {customerOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
          <span>Active Shopper Account:</span>
          <strong className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {currentCustomerName}
          </strong>
        </div>
      </div>

      {/* Success Notification Banner */}
      {orderSuccess && (
        <div 
          role="status" 
          aria-live="polite"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start justify-between gap-4 shadow-sm animate-fadeIn"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="font-bold text-sm">Order #{orderSuccess.orderId} Placed! (~{orderSuccess.estMin} mins)</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Successfully dispatched: <strong>{orderSuccess.title}</strong> (₹{orderSuccess.amount}).
                Your repeat retention status updated to <strong>{orderSuccess.newProbability}% Repeat Probability</strong>!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded">
                  Unlocked Perk: {orderSuccess.unlockedPerk}
                </span>
                <button
                  onClick={() => {
                    setCustomerTab('orders');
                    setOrderSuccess(null);
                  }}
                  className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 flex items-center gap-1"
                >
                  Track in My Orders <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setOrderSuccess(null)}
            aria-label="Dismiss order confirmation notification"
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: EXPLORE & ORDER */}
      {customerTab === 'explore' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Retention Engine Section */}
          <RetentionLadderCard 
            profile={retentionProfile} 
            onAdvance={onRefreshProfile} 
          />

          {/* Curated Multi-Store Neighborhood Bundles */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <h2 className="text-xl font-extrabold text-slate-900">Curated Multi-Store Baskets</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unique neighborhood pairings solving single-store delivery limitations. Combined in 1 eco-friendly delivery.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium self-start sm:self-auto">
                Targeting the 3-Order 72% Loyalty Goal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  onOrder={handleOrderBundle}
                  isOrdering={orderingBundleId === bundle.id}
                />
              ))}
            </div>
          </div>

          {/* Individual Verified Local Merchant Explorer */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <span>Explore 620 Verified Local Merchants</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Stores maintain real-time inventory with our 1-Tap Copilot. The Stock Confidence Index (SCI) guarantees no post-order cancellations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StockConfidenceBadge score={96} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Stores List Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Local Stores in Bengaluru (Indiranagar Cluster)
                </div>
                {stores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    onSelect={handleSelectStore}
                    isSelected={selectedStore?.id === store.id}
                  />
                ))}
              </div>

              {/* Selected Store Catalog */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                {selectedStore ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {selectedStore.category}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">{selectedStore.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedStore.area}, {selectedStore.city} • Last stock sync: {selectedStore.last_inventory_sync}
                        </p>
                      </div>

                      <StockConfidenceBadge 
                        score={selectedStore.computed_sci || selectedStore.stock_confidence_score} 
                      />
                    </div>

                    {/* Product Catalog Grid */}
                    <div className="mt-5 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Live Verified Inventory ({storeProducts.length} Items) — Click to Order Directly
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Available store products">
                        {storeProducts.map((prod) => (
                          <div 
                            key={prod.id} 
                            role="listitem"
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                              prod.is_in_stock 
                                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300' 
                                : 'bg-rose-50/40 border-rose-200 opacity-60'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-800">{prod.name}</h4>
                                  <span className="text-xs text-slate-500">{prod.unit} • {prod.category}</span>
                                </div>
                                <span className="font-extrabold text-sm text-slate-900">₹{prod.price}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                              {prod.is_in_stock ? (
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>{prod.stock_quantity} left</span>
                                  </span>
                                  <button
                                    onClick={() => handleOrderProduct(prod)}
                                    disabled={orderingProductId === prod.id}
                                    aria-label={`Order ${prod.name} directly for rupees ${prod.price}`}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" aria-hidden="true" />
                                    <span>{orderingProductId === prod.id ? "Ordering..." : "Order"}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-rose-600 font-bold">Sold Out</span>
                              )}

                              <span className="text-[10px] text-slate-400">
                                Verified Today
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Select a store from the list to view live catalog
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: MY ORDERS & SUPPORT */}
      {customerTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <span>My Orders & Resolution Tracker</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Isolated order history for <strong>{currentCustomerName}</strong>. Real-time fulfillment updates from local merchant partners.
              </p>
            </div>
            <button
              onClick={loadCustomerOrders}
              disabled={isLoadingOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {isLoadingOrders && customerOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Loading your orders...</div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">No orders placed yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Explore our curated multi-store bundles or shop directly from verified neighborhood merchants to build your 3-order habit reward!
              </p>
              <button
                onClick={() => setCustomerTab('explore')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  {/* Order Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold text-sm">
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            Order #{order.id}
                          </h4>
                          {order.is_multi_store === 1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              Multi-Store Bundle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Placed on {order.created_at} • Delivery address: {order.delivery_address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border capitalize ${getStatusColor(order.status)}`}>
                        ● {order.status}
                      </span>
                      <span className="font-black text-base text-slate-900">
                        ₹{order.total_amount}
                      </span>
                    </div>
                  </div>

                  {/* Order Status Progression Visualizer */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Fulfillment Status (Live Merchant Sync)
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {['placed', 'preparing', 'ready', 'completed'].map((st, idx) => {
                        const stages = ['placed', 'preparing', 'ready', 'completed'];
                        const currentIdx = stages.indexOf(order.status?.toLowerCase() || 'placed');
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div 
                            key={st} 
                            className={`p-2 rounded-lg border font-semibold text-[11px] transition-all ${
                              isCurrent
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className="capitalize">{st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items Ordered List */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Items Ordered ({order.items?.length || 0}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{item.product_name}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5">({item.store_name})</span>
                          </div>
                          <span className="font-bold text-slate-700">Qty: {item.quantity} • ₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support & Dispute Section for this Order */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {order.support_tickets && order.support_tickets.length > 0 ? (
                      <div className="w-full space-y-2">
                        {order.support_tickets.map((t) => (
                          <div 
                            key={t.id}
                            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              t.status === 'resolved' 
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                                : 'bg-amber-50/70 border-amber-300 text-amber-900'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-bold">Support Ticket #{t.id}: {t.issue_type}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full ${
                                  t.status === 'resolved' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                                }`}>
                                  {t.status}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-600">
                                {t.resolution_notes || "Ticket is in automated review queue."}
                              </p>
                              {t.refund_amount > 0 && (
                                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                                  <span>Simulated UPI Refund: ₹{t.refund_amount} credited</span>
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">
                                    Simulated Gateway
                                  </span>
                                </div>
                              )}
                            </div>

                            {t.status !== 'resolved' && (
                              <button
                                onClick={() => handleInstantRefundForTicket(t, order)}
                                disabled={resolvingTicketId === t.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {resolvingTicketId === t.id ? "Processing UPI..." : "Instant AI Auto-Resolve"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-500">
                          Need help with this order? Report missing items, delivery delays, or store rejections.
                        </span>
                        <button
                          onClick={() => handleOpenIssueModal(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Report Issue / Refund</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Issue Modal */}
      {issueModalOpen && activeOrderForIssue && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Report Issue on Order #{activeOrderForIssue.id}
                </h3>
              </div>
              <button 
                onClick={() => setIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Category (Addressing Case Study Cancellation Drivers)
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Missing/unavailable products">35% Case Driver: Product unavailable after checkout</option>
                  <option value="Delayed delivery">27% Case Driver: Delivery delay beyond promise SLA</option>
                  <option value="Store rejected item">18% Case Driver: Merchant walk-in rush conflict</option>
                  <option value="Refund status">General: Instant UPI Refund Inquiry</option>
                  <option value="Incorrect orders">General: Incorrect or Damaged Item Received</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description of Issue
                </label>
                <textarea
                  rows="3"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what occurred with your delivery or item..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Customer:</span>
                  <strong className="text-slate-900">{currentCustomerName}</strong>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Eligible Compensation / Refund:</span>
                  <strong className="text-emerald-700">₹{activeOrderForIssue.total_amount} (Full Settlement)</strong>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Note: Automated UPI refund is simulated for hackathon demonstration.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFilingIssue}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isFilingIssue ? "Filing..." : "Submit to Autonomous Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
