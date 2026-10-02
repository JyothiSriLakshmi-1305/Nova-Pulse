import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import SupportPortal from './SupportPortal';
import AdminOrdersFeed from '../components/AdminOrdersFeed';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShieldAlert, Award, Sliders, CheckCircle2, AlertOctagon, Info, Calculator, ShieldCheck, Package } from 'lucide-react';

export default function ExecutiveDashboard({ sharedOrderCounter }) {
  const [adminTab, setAdminTab] = useState('roi'); // 'roi' | 'support'
  const [metricsData, setMetricsData] = useState(null);
  const [simRepeatRate, setSimRepeatRate] = useState(38);
  const [simCancelRate, setSimCancelRate] = useState(4.5);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await api.getRescueMetrics();
      if (res.success) {
        setMetricsData(res);
      }
    } catch (err) {
      console.error("Failed to load analytics metrics:", err);
    }
  };

  // Model Turnaround Calculations (Documented Assumptions)
  // Baseline orders: 38,500/mo. AOV: ₹486.
  const currentOrders = 38500;
  const aov = 486;
  const currentGrossCancelled = (currentOrders * (11 / 100)) * aov; // ~₹20.58 Lakh GMV cancelled at baseline 11%
  const simulatedGrossCancelled = (currentOrders * (simCancelRate / 100)) * aov;
  const recoveredGmvMonthly = Math.max(0, currentGrossCancelled - simulatedGrossCancelled);
  
  // Model assumes 18% average platform commission take-rate on recovered GMV
  const platformRecoveredTakeRate = recoveredGmvMonthly * 0.18;
  
  // Reallocating wasteful first-order promotional discount spend (saving 44% unredeemed coupon burn)
  const savedMarketingSpend = Math.max(0, (17.0 - 11.2) * 100000); // Projected ₹5.8 Lakh saved monthly
  const totalMonthlyImpact = platformRecoveredTakeRate + savedMarketingSpend;

  // Exact 5 Cancellation Categories from PDF Section 5
  const cancellationCategories = [
    { 
      reason: 'Product unavailable (Phantom Inventory)', 
      pct: 35, 
      causeGroup: 'Store Inventory Disconnect',
      color: 'bg-rose-500',
      solution: 'Solved by Stock Confidence Index (SCI) & 1-Tap Merchant Copilot'
    },
    { 
      reason: 'Customer cancelled because of delay', 
      pct: 27, 
      causeGroup: 'Delivery Logistics Friction',
      color: 'bg-amber-500',
      solution: 'Solved by Route Clustering & Multi-Store Neighborhood Bundling'
    },
    { 
      reason: 'Store rejected the order (busy walk-in rush)', 
      pct: 18, 
      causeGroup: 'Physical Store Capacity Constraints',
      color: 'bg-purple-500',
      solution: 'Solved by Rush Mode Throttling (+15 min prep buffer)'
    },
    { 
      reason: 'Delivery partner unavailable', 
      pct: 12, 
      causeGroup: 'Rider Fleet Allocation Bottlenecks',
      color: 'bg-blue-500',
      solution: 'Solved by Multi-Store Batched Cluster Dispatch'
    },
    { 
      reason: 'Other reasons', 
      pct: 8, 
      causeGroup: 'General Operational Variance',
      color: 'bg-slate-400',
      solution: 'Solved by Autonomous Support Desk with Instant Compensation'
    },
  ];

  const stakeholderAlignments = [
    {
      role: 'CEO',
      quote: 'We need to improve customer retention.',
      resolution: 'The 3-Order Retention Ladder guides patrons to the proven 72% following-month repeat probability cohort.',
      status: 'Solved'
    },
    {
      role: 'Marketing Head',
      quote: 'We need stronger acquisition and better promotions.',
      resolution: 'Replaces 44% unredeemed generic coupons with high-converting Multi-Store Neighborhood Bundles.',
      status: 'Solved'
    },
    {
      role: 'Operations Head',
      quote: 'Delivery reliability is damaging the experience.',
      resolution: 'Hyperlocal merchant clustering drops projected average delivery time from 37 mins down to 24 mins.',
      status: 'Solved'
    },
    {
      role: 'Partner Manager',
      quote: 'Inventory accuracy and store experience are the real bottlenecks.',
      resolution: '1-Tap Stock Copilot + AI Voice Sync gives merchants 98% Stock Confidence Index without complex ERP data entry.',
      status: 'Solved'
    },
    {
      role: 'Product Head',
      quote: 'Give customers a reason to choose local commerce over dark stores.',
      resolution: 'Dark stores carry standardized FMCG. NOVA PULSE unlocks 620 unique artisan bakeries and organic kirana catalogs.',
      status: 'Solved'
    },
    {
      role: 'Finance Head',
      quote: 'Our problem is the quality and cost of growth.',
      resolution: 'Models ₹8.4L/mo projected turnaround from saved marketing burn and prevented cancellations within the ₹25L cap.',
      status: 'Solved'
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Admin Console Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab('roi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
              adminTab === 'roi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive ROI & Turnaround Strategy</span>
          </button>

          <button
            onClick={() => setAdminTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
              adminTab === 'orders'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Platform Live Orders Feed</span>
          </button>

          <button
            onClick={() => setAdminTab('support')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
              adminTab === 'support'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Platform Operations & Support Desk</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold px-2">
          <span className="text-slate-500">Board Mandate:</span>
          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
            ₹25.0 Lakh Total Cap
          </span>
        </div>
      </div>

      {adminTab === 'orders' ? (
        <div className="animate-fadeIn">
          <AdminOrdersFeed sharedOrderCounter={sharedOrderCounter} />
        </div>
      ) : adminTab === 'support' ? (
        <div className="animate-fadeIn">
          <SupportPortal />
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
              Executive Turnaround Strategy
            </span>
            <span className="text-xs text-slate-500">Boardroom Presentation & Projections Model</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">NOVA CART Rescue Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modeling a projected recovery of ~₹8.4 Lakh/month within the strict ₹25 Lakh implementation cap.
          </p>
        </div>

        {/* Budget Guardrail Badge */}
        <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Budget Cap (6 Months)</div>
            <div className="text-base font-extrabold">₹14.8L Projected / ₹25L Cap</div>
          </div>
          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/40">
            Within Cap
          </span>
        </div>
      </div>

      {/* 6-Month Baseline vs Current vs NOVA PULSE Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Turnaround Scorecard: Ground Truth vs Projected Impact
            </h3>
            <p className="text-xs text-slate-500">Official Case Study Baseline compared with NOVA PULSE modeled turnaround</p>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Modeled Projections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Performance Metric</th>
                <th className="py-3 px-4">6 Months Ago</th>
                <th className="py-3 px-4 bg-rose-50 text-rose-800">Current (Crisis)</th>
                <th className="py-3 px-4 bg-emerald-50 text-emerald-900 font-extrabold">NOVA PULSE (Projected)</th>
                <th className="py-3 px-4">Intervention Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Blended Repeat Purchase Rate</td>
                <td className="py-3 px-4 text-slate-500">41%</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">27% (Plummeted)</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">42% (Projected Lift)</td>
                <td className="py-3 px-4 text-slate-500">3-Order Retention Ladder + Multi-Store Bundles</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Order Cancellation Rate</td>
                <td className="py-3 px-4 text-slate-500">6%</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">11% (Doubled)</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">3.8% (Projected Cut)</td>
                <td className="py-3 px-4 text-slate-500">Stock Confidence Index (SCI) heuristic</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Average Delivery Time</td>
                <td className="py-3 px-4 text-slate-500">29 min</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">37 min (+28% Delay)</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">24 min (Projected)</td>
                <td className="py-3 px-4 text-slate-500">Hyperlocal multi-merchant clustered dispatch</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Customer Support Tickets</td>
                <td className="py-3 px-4 text-slate-500">3,100 / mo</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">5,900 / mo (Overwhelmed)</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">1,200 / mo (Projected)</td>
                <td className="py-3 px-4 text-slate-500">Autonomous dispute triage & auto-resolution</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Monthly Promotional Spend</td>
                <td className="py-3 px-4 text-slate-500">₹9.5 Lakh</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">₹17.0 Lakh (65% of Rev)</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">₹11.2 Lakh (Saves ₹5.8L)</td>
                <td className="py-3 px-4 text-slate-500">Eliminates 44% unredeemed coupons, focuses on retention</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Monthly Revenue</td>
                <td className="py-3 px-4 text-slate-500">₹21.8 Lakh</td>
                <td className="py-3 px-4 bg-rose-50/50 text-rose-600 font-bold">₹26.1 Lakh</td>
                <td className="py-3 px-4 bg-emerald-50/50 text-emerald-700 font-black">₹34.8 Lakh (Projected)</td>
                <td className="py-3 px-4 text-slate-500">Recovered order volume + multi-store basket upsells</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Precision & PDF Telemetry Clarification */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start gap-3 text-xs text-slate-600">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p>
              <strong className="text-slate-900">Case Study Telemetry Rule:</strong> The <strong>72% repeat probability</strong> specifically applies to the high-retention cohort of customers who complete 3 orders (PDF Section 4). Blended platform-wide repeat rate is projected to recover from <strong>27% to 42%</strong> as users progress through the retention ladder.
            </p>
            <p className="text-[11px] text-slate-500">
              <strong className="text-slate-800">Budget Guardrail:</strong> Maximum ₹25.0 Lakh allowed over 6 months. Total NOVA PULSE allocation is <strong>₹14.8 Lakh</strong> (Software architecture, local edge sync, Gemini API tokens), strictly avoiding expensive physical dark stores or headcount bloat.
            </p>
          </div>
        </div>
      </div>

      {/* Disaggregated Cancellation Breakdown (Grounded in PDF Section 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Order Cancellation Breakdown: Disaggregated Telemetry (PDF Section 5)
          </h3>
          <p className="text-xs text-slate-500">
            Official case study telemetry disaggregates the 11% cancellation rate across 5 distinct operational friction points.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cancellationCategories.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} aria-hidden="true"></span>
                  <span className="text-base font-black text-slate-900">{item.pct}%</span>
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1 leading-snug">{item.reason}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{item.causeGroup}</div>
              </div>
              <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                {item.solution}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Turnaround Simulator & Transparent Methodology */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold">Interactive Turnaround Simulator (Projected Impact)</h3>
            </div>
            <p className="text-xs text-slate-300">
              Simulate how projected improvements in cancellation and retention translate into bottom-line recovery.
            </p>
          </div>

          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Total Projected Recovery</div>
              <div className="text-2xl font-black text-white">
                ₹{(totalMonthlyImpact / 100000).toFixed(2)} Lakh <span className="text-xs font-normal text-emerald-400">/ mo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Slider 1: Cancellation Rate */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                Target Order Cancellation Rate: <strong className="text-emerald-400">{simCancelRate}%</strong>
              </label>
              <span className="text-[11px] text-rose-400">Crisis Baseline: 11%</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="11.0"
              step="0.5"
              value={simCancelRate}
              onChange={(e) => setSimCancelRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>Best in class (2%)</span>
              <span>Projected (3.8%)</span>
              <span>Current (11%)</span>
            </div>
            <div className="mt-3 text-xs text-emerald-300 font-semibold">
              Recovers ₹{(recoveredGmvMonthly / 100000).toFixed(2)} Lakh GMV from prevented phantom inventory cancellations.
            </div>
          </div>

          {/* Slider 2: Repeat Retention Rate */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                Target Repeat Purchase Rate: <strong className="text-emerald-400">{simRepeatRate}%</strong>
              </label>
              <span className="text-[11px] text-rose-400">Crisis Baseline: 27%</span>
            </div>
            <input
              type="range"
              min="27"
              max="50"
              step="1"
              value={simRepeatRate}
              onChange={(e) => setSimRepeatRate(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>Current (27%)</span>
              <span>Target (38%)</span>
              <span>High Loyalty (50%)</span>
            </div>
            <div className="mt-3 text-xs text-emerald-300 font-semibold">
              Replaces ₹5.8 Lakh of wasteful first-order discounts with high-LTV 3-order ladder repeat retention.
            </div>
          </div>
        </div>

        {/* Calculation Methodology & Assumptions Drawer */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
            <Calculator className="w-3.5 h-3.5" />
            <span>Documented Calculation Methodology & Assumptions:</span>
          </div>
          <p>• <strong>Recovered GMV:</strong> 38,500 monthly orders × ₹486 AOV = ₹187.1 Lakh GMV. Dropping cancellations from 11% to 3.8% preserves ~₹13.4 Lakh GMV.</p>
          <p>• <strong>Net Platform Recovery:</strong> At an estimated 18% take-rate, preserved GMV produces ~₹2.41 Lakh net monthly revenue.</p>
          <p>• <strong>Marketing Optimization:</strong> Cutting wasteful acquisition spend (saving 44% unredeemed coupons) reduces promo spend from ₹17.0L to ₹11.2L, saving ₹5.8 Lakh/month.</p>
          <p>• <strong>Total Projected Recovery:</strong> ₹2.41L net commission + ₹5.8L saved burn = <strong>~₹8.2L - ₹8.4L / month</strong> (Modeled Projection).</p>
        </div>
      </div>

      {/* Leadership Consensus Alignment Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">Leadership Consensus Alignment Matrix</h3>
          <p className="text-xs text-slate-500">
            Resolving the internal management deadlock detailed in Section 12 of the official case brief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholderAlignments.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs text-indigo-700 uppercase tracking-wider">{item.role}</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>
                <div className="text-xs italic text-slate-500 mb-2">"{item.quote}"</div>
                <p className="text-xs text-slate-800 font-medium">{item.resolution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
      )}

    </div>
  );
}
