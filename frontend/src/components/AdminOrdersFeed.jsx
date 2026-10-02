import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import OrderStatusBadge from './OrderStatusBadge';
import { Package, RefreshCw, Search, Store, Clock, AlertCircle } from 'lucide-react';

export default function AdminOrdersFeed({ sharedOrderCounter }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableStores, setAvailableStores] = useState([]);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.orders || []);
        // Extract distinct stores across all items
        const storeSet = new Set();
        (res.orders || []).forEach(o => {
          (o.items || []).forEach(it => {
            if (it.store_name) storeSet.add(it.store_name);
          });
        });
        setAvailableStores(Array.from(storeSet).sort());
      } else {
        setError(res.error || 'Failed to fetch platform orders');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Non-aggressive 12-second live polling with strict unmount cleanup
    const interval = setInterval(() => {
      loadOrders(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [sharedOrderCounter]);

  // Mask phone number to avoid unnecessary private information exposure
  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    const clean = String(phone).trim();
    if (clean.length < 8) return '••••••••';
    return clean.slice(0, 8) + '•••••';
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && (order.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    // Store filter
    if (storeFilter !== 'all') {
      const participates = (order.items || []).some(it => it.store_name === storeFilter);
      if (!participates) return false;
    }
    // Search query (order ID or customer name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = String(order.id).includes(q);
      const matchCustomer = (order.customer_name || '').toLowerCase().includes(q);
      if (!matchId && !matchCustomer) return false;
    }
    return true;
  });

  // Calculate live summary stats
  const totalCount = orders.length;
  const inFlightCount = orders.filter(o => ['placed', 'preparing'].includes((o.status || '').toLowerCase())).length;
  const readyCount = orders.filter(o => (o.status || '').toLowerCase() === 'ready').length;
  const completedCount = orders.filter(o => (o.status || '').toLowerCase() === 'completed').length;
  const totalVolumeGmv = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Live Operational Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Feed Orders</div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">In-Flight Prep</div>
          <div className="text-xl font-black text-blue-800 mt-1">{inFlightCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/20 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Ready for Pickup</div>
          <div className="text-xl font-black text-purple-800 mt-1">{readyCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Delivered / Done</div>
          <div className="text-xl font-black text-emerald-800 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Platform GMV</div>
          <div className="text-xl font-black text-slate-900 mt-1">₹{totalVolumeGmv.toLocaleString()}</div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {['all', 'placed', 'preparing', 'ready', 'completed', 'cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Store Filter */}
          {availableStores.length > 0 && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Stores ({availableStores.length})</option>
              {availableStores.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={() => loadOrders(false)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Feed Listing */}
      {loading && orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading live platform orders feed...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-sm">No orders match current criteria</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || storeFilter !== 'all'
              ? 'Try resetting the search terms or status filters above.'
              : 'New orders placed from the Customer Portal will stream in here automatically.'}
          </p>
          {(statusFilter !== 'all' || storeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => { setStatusFilter('all'); setStoreFilter('all'); setSearchQuery(''); }}
              className="mt-3 px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            // Extract distinct participating stores for this order
            const participatingStores = Array.from(new Set((order.items || []).map(it => it.store_name).filter(Boolean)));

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors space-y-3"
              >
                {/* Header line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-xs">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          Order #{order.id}
                        </span>
                        {order.is_multi_store === 1 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            Multi-Store Clustered
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Direct Merchant
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Customer: <strong>{order.customer_name}</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">Phone: {maskPhone(order.customer_phone)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {order.created_at}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Paid</span>
                      <span className="font-black text-sm text-slate-900">₹{order.total_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Participating Stores tags */}
                {participatingStores.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Store className="w-3 h-3" />
                      Fulfilling Merchant{participatingStores.length > 1 ? 's' : ''}:
                    </span>
                    {participatingStores.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Line Items breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-1">
                  {(order.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50/70 border border-slate-200/60 text-[11px] flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold text-slate-800 block truncate">{it.product_name}</span>
                        <span className="text-[10px] text-slate-500">{it.store_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-700 block">Qty {it.quantity} • ₹{it.price}</span>
                        {it.status && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                            {it.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
