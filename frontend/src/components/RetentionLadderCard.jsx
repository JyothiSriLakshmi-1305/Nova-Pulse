import React from 'react';
import { Target, CheckCircle2, Award, Gift, ArrowUpRight, Info } from 'lucide-react';

export default function RetentionLadderCard({ profile, onAdvance }) {
  if (!profile) return null;

  const currentStep = profile.ladder_step || 1;

  // Exact telemetry milestones grounded in PDF Section 4
  const steps = [
    { 
      step: 1, 
      title: 'Order 1: Onboarded', 
      statLabel: '54% of new users complete first order', 
      perk: '₹40 off 2nd Neighborhood Basket', 
      desc: 'Acquisition baseline from case study' 
    },
    { 
      step: 2, 
      title: 'Order 2: 30-Day Bridge', 
      statLabel: 'Historical cliff: Only 31% reorder in 30 days', 
      perk: 'Free Priority Dispatch on Kirana/Bakery', 
      desc: 'Habit formation hurdle' 
    },
    { 
      step: 3, 
      title: 'Order 3: VIP Retention Club', 
      statLabel: '72% following-month repeat probability cohort', 
      perk: 'VIP Patronage (Zero Fees + Stock Priority)', 
      desc: 'Proven high-retention inflection point' 
    },
  ];

  return (
    <div 
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/80 relative overflow-hidden"
      role="region"
      aria-label="Customer Retention Progress Ladder"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              The 3-Order Retention Engine
            </span>
            <span className="text-xs text-slate-400">PDF Telemetry Grounded</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Retention Ladder: <span className="text-emerald-400">{profile.customer_name}</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            NOVA CART’s telemetry reveals customers completing 3 orders have a <strong>72% probability of ordering again the following month</strong>. This ladder guides patrons across the 30-day drop-off cliff.
          </p>
        </div>

        {/* Current Probability Pill */}
        <div 
          className="bg-slate-800/90 border border-slate-600/60 rounded-xl px-4 py-3 flex items-center gap-3 shrink-0"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400" aria-hidden="true">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cohort Reorder Rate</div>
            <div className="text-2xl font-black text-emerald-400">{profile.repeat_probability}%</div>
            <div className="text-[10px] text-slate-400">Step {currentStep} of 3</div>
          </div>
        </div>
      </div>

      {/* Visual Step Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4" role="list" aria-label="Retention Stages">
        {steps.map((st) => {
          const isDone = st.step <= currentStep;
          const isCurrent = st.step === currentStep;

          return (
            <div 
              key={st.step}
              role="listitem"
              className={`rounded-xl p-4 border transition-all ${
                isCurrent 
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-900/30 ring-1 ring-emerald-500/30' 
                  : isDone
                  ? 'bg-slate-800/40 border-slate-700 text-slate-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isCurrent ? 'bg-emerald-500 text-slate-950' : isDone ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  Milestone {st.step}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {st.step === 3 ? '72% Target' : st.step === 2 ? '30-Day Goal' : 'Onboarded'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mb-0.5">{st.title}</h4>
              <div className="text-[11px] text-amber-300/90 font-medium mb-1.5">{st.statLabel}</div>
              <p className="text-xs text-slate-300 mb-2">{st.perk}</p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                {isDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-300 font-medium">Cohort Reached</span>
                  </>
                ) : (
                  <span>Unlocks on order #{st.step}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Telemetry Disclaimer Box */}
      <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-start gap-2.5 text-[11px] text-slate-300 my-2">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-white">Telemetry Fidelity:</strong> 54% reflects initial first-order conversions; 31% reflects the 30-day second-order rate; 72% reflects the following-month repeat probability specifically for the 3-order customer cohort (PDF Section 4).
        </p>
      </div>

      {/* Next Step Action Callout */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Gift className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Next Milestone Target: <strong className="text-white">{profile.next_perk}</strong></span>
        </div>

        {currentStep < 3 && onAdvance && (
          <button
            onClick={onAdvance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors self-start sm:self-auto shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label="Simulate next order to advance retention tier"
          >
            <span>Simulate Order #{currentStep + 1}</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
