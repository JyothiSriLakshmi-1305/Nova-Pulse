import React from 'react';
import { Package, Clock, Sparkles, Check, ArrowRight } from 'lucide-react';
import StockConfidenceBadge from './StockConfidenceBadge';

export default function BundleCard({ bundle, onOrder, isOrdering }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header Banner */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {bundle.badge}
            </span>
            <StockConfidenceBadge score={98} size="sm" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{bundle.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{bundle.tagline}</p>
        </div>

        {/* Participating Stores */}
        <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">Stores: <strong className="text-slate-800">{bundle.stores_involved}</strong></span>
          <div className="flex items-center gap-1 font-semibold text-emerald-700">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>~{bundle.est_delivery_min} min</span>
          </div>
        </div>

        {/* Item List */}
        <div className="p-5 space-y-2.5" role="list" aria-label={`Items in ${bundle.title}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included In This Basket</div>
          {bundle.items && bundle.items.map((item, idx) => (
            <div key={idx} role="listitem" className="flex items-start justify-between gap-2 text-xs py-1 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="block text-[11px] text-slate-400">from {item.store}</span>
              </div>
              <span className="font-bold text-slate-700">₹{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing & Checkout Footer */}
      <div className="p-5 bg-slate-50 border-t border-slate-100">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-2xl font-black text-slate-900">₹{bundle.bundle_price}</span>
            <span className="text-xs text-slate-400 line-through ml-2">₹{bundle.original_price}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Save ₹{bundle.savings}
          </span>
        </div>

        <button
          onClick={() => onOrder(bundle)}
          disabled={isOrdering}
          aria-label={`Order ${bundle.title} for rupees ${bundle.bundle_price}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          {isOrdering ? (
            <span>Processing Order...</span>
          ) : (
            <>
              <span>Order Multi-Store Bundle</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
