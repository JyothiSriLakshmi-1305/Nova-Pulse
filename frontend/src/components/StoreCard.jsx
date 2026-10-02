import React from 'react';
import { Store, Star, MapPin, Zap, AlertCircle } from 'lucide-react';
import StockConfidenceBadge from './StockConfidenceBadge';

export default function StoreCard({ store, onSelect, isSelected }) {
  return (
    <div 
      onClick={() => onSelect(store)}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {store.category}
          </span>
          <h4 className="font-bold text-slate-900 text-sm">{store.name}</h4>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-800 text-xs font-bold border border-amber-200">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span>{store.rating}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
        <MapPin className="w-3 h-3 text-slate-400" />
        <span>{store.area}, {store.city}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <StockConfidenceBadge score={store.computed_sci || store.stock_confidence_score} size="sm" />
        
        {store.rush_mode ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Rush Protected
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            {store.total_orders_today} orders today
          </span>
        )}
      </div>
    </div>
  );
}
