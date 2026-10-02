import React from 'react';

export function getOrderStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'placed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preparing':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'ready':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export default function OrderStatusBadge({ status, className = '', showDot = true }) {
  const badgeClass = getOrderStatusBadgeClass(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border capitalize ${badgeClass} ${className}`}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
