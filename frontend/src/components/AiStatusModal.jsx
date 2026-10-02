import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, X, Check, Key, Bot, ShieldCheck, Zap } from 'lucide-react';

export default function AiStatusModal({ isOpen, onClose }) {
  const [status, setStatus] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.getAiStatus();
      if (res.success) {
        setStatus(res);
      }
    } catch (err) {
      console.error("Failed to load AI status:", err);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsSaving(true);
    try {
      const res = await api.setGeminiKey(apiKeyInput.trim());
      if (res.success) {
        setFeedback("Gemini API Key activated successfully!");
        setApiKeyInput('');
        loadStatus();
      }
    } catch (err) {
      setFeedback("Failed to update API key.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestInference = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAiPrompt("Received 20 units of organic cow milk, but sourdough boule is sold out");
      if (res.success) {
        setTestResult(res);
      }
    } catch (err) {
      console.error("Test inference failed:", err);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ai-modal-title" className="font-extrabold text-base">Google Services & Gemini Engine</h3>
              <p className="text-[11px] text-slate-300">PromptWars Evaluation Console</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Active Status Badge */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Model</span>
              <div className="font-extrabold text-slate-800 text-sm">{status?.service || 'Google Gemini 1.5 Flash'}</div>
              <span className="text-[11px] text-slate-500">Key Status: {status?.masked_key || 'Active'}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operational</span>
            </span>
          </div>

          {/* Capabilities */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Integrated Google Services Tasks:
            </span>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirana merchant voice/text note extraction into catalog inventory</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smart out-of-stock substitution engine with confidence matching</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autonomous support dispute auto-triage and instant UPI apology compensation</span>
              </li>
            </ul>
          </div>

          {/* Key Configuration Form */}
          <form onSubmit={handleSaveKey} className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">
              Test with Your Own Gemini API Key (Optional):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || !apiKeyInput.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Apply Key"}
              </button>
            </div>
            {feedback && <p className="text-[11px] font-semibold text-emerald-600">{feedback}</p>}
          </form>

          {/* Test Live Inference */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700">Live AI Inference Test:</span>
              <button
                onClick={handleTestInference}
                disabled={isTesting}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isTesting ? "Testing..." : "Run Test Prompt"}</span>
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono space-y-1">
                <div className="text-emerald-400 font-sans font-bold">Mode: {testResult.mode}</div>
                <div>Extracted {testResult.extracted_updates?.length || 0} updates from input:</div>
                <div className="text-slate-400 italic">"{testResult.input_prompt}"</div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
