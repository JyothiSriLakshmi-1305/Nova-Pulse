import React from 'react';
import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

export default function StockConfidenceBadge({ score = 95, lastSync = 'Just now', size = 'md' }) {
  const isHigh = score >= 90;
  const isMedium = score >= 75 && score < 90;

  let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let badgeText = 'Guaranteed Live Stock';
  let Icon = ShieldCheck;

  if (isMedium) {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
    badgeText = 'Stock Verified Today';
    Icon = Clock;
  } else if (!isHigh && !isMedium) {
    bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
    badgeText = 'Needs Re-sync';
    Icon = AlertTriangle;
  }

  const isSmall = size === 'sm';

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${bgClass} font-semibold transition-all`}
      role="status"
      aria-label={`Stock Confidence Index ${score} percent (${badgeText}) - Designed Heuristic`}
      title={`Designed Algorithmic Heuristic: SCI (${score}%) is an engineered metric based on hours elapsed since last merchant stock verification. Not official challenge-provided data.`}
    >
      <Icon className={isSmall ? "w-3 h-3 text-current" : "w-3.5 h-3.5 text-current"} aria-hidden="true" />
      <span className={isSmall ? "text-[11px]" : "text-xs"}>
        {score}% SCI • {badgeText}
      </span>
    </div>
  );
}
