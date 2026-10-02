import React from 'react';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">NOVA PULSE</span>
          <span>•</span>
          <span>PromptWars 2026 Submission</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">Strict adherence to ₹25 Lakh Implementation Budget</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Zero Phantom Inventory
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            72% Repeat Ladder
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Instant Support Resolution
          </span>
        </div>

      </div>
    </footer>
  );
}
