import React from 'react';
import { ShoppingBag, Store, BarChart3, Zap, Sparkles, Bot, Layers } from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, retentionProfile, onOpenAiModal }) {
  const roles = [
    { 
      id: 'customer', 
      label: 'Customer Portal', 
      sublabel: 'Shop, Bundles & Orders',
      icon: ShoppingBag, 
      activeClass: 'bg-white text-emerald-800 shadow-sm border-slate-300 ring-1 ring-emerald-500/20' 
    },
    { 
      id: 'merchant', 
      label: 'Merchant Copilot', 
      sublabel: 'Stock Sync & Orders',
      icon: Store, 
      activeClass: 'bg-white text-indigo-800 shadow-sm border-slate-300 ring-1 ring-indigo-500/20' 
    },
    { 
      id: 'admin', 
      label: 'Admin Console', 
      sublabel: 'ROI & Operations Desk',
      icon: BarChart3, 
      activeClass: 'bg-white text-purple-800 shadow-sm border-slate-300 ring-1 ring-purple-500/20' 
    },
  ];

  return (
    <header className="sticky top-0 z-40 glassmorphism border-b border-slate-200" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <button 
            className="flex items-center gap-3 cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl p-1"
            onClick={() => setActiveRole('customer')}
            aria-label="NOVA PULSE Home, switch to Customer Portal"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20" aria-hidden="true">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  NOVA<span className="text-emerald-600">PULSE</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  PROMPTWARS '26
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Local Commerce Rescue & Retention Engine</p>
            </div>
          </button>

          {/* Role-Based Demo Navigation Selector */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" aria-hidden="true" />
              Demo Role Switcher • Live Shared State
            </span>
            <nav className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200" aria-label="Stakeholder Role Navigation">
              {roles.map((item) => {
                const Icon = item.icon;
                const isActive = activeRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveRole(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border ${
                      isActive
                        ? `${item.activeClass} border-slate-300`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Cluster: Gemini Status + Role Context Pill */}
          <div className="flex items-center gap-2.5">
            {/* Google Gemini AI Status Button */}
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              aria-label="View Google Gemini Service & API Key Status"
              aria-haspopup="dialog"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              <span className="hidden sm:inline">Google Gemini</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            </button>

            {/* Contextual Role Pill */}
            {activeRole === 'customer' && retentionProfile && (
              <div 
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full"
                aria-label={`Demo Customer ${retentionProfile.customer_name}, Repeat Probability ${retentionProfile.repeat_probability}%`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-xs text-slate-700 font-medium">
                  Patron: <strong className="text-emerald-800">{retentionProfile.customer_name}</strong>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-600 text-white shadow-xs">
                  {retentionProfile.repeat_probability}%
                </span>
              </div>
            )}

            {activeRole === 'merchant' && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-800">
                <Store className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Merchant Mode: Live Stock & Orders</span>
              </div>
            )}

            {activeRole === 'admin' && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-purple-800">
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                <span>Executive: ₹25L Budget Mode</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Role Selector */}
      <div className="md:hidden flex flex-col p-2 bg-slate-100 border-t border-slate-200 text-xs" aria-label="Mobile Navigation">
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">
          Demo Role Switcher (No Auth Required)
        </span>
        <div className="flex gap-1 overflow-x-auto">
          {roles.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveRole(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md font-bold focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeRole === item.id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

