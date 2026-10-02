import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AiStatusModal from './components/AiStatusModal';
import { api } from './services/api';

// Code splitting: lazy load major stakeholder role pages
const CustomerStoreView = lazy(() => import('./pages/CustomerStoreView'));
const MerchantCopilot = lazy(() => import('./pages/MerchantCopilot'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-slate-500">Loading portal...</span>
    </div>
  );
}

export default function App() {
  const [activeRole, setActiveRole] = useState('customer');
  const [retentionProfile, setRetentionProfile] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [sharedOrderCounter, setSharedOrderCounter] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getRetentionProfile('Kavita Iyer');
      if (res.success) {
        setRetentionProfile(res.profile);
      }
    } catch (err) {
      console.error("Failed to load retention profile:", err);
    }
  };

  const handleAdvanceProfile = async () => {
    try {
      const res = await api.advanceRetention('Kavita Iyer');
      if (res.success) {
        setRetentionProfile(res.profile);
      }
      setSharedOrderCounter(c => c + 1);
    } catch (err) {
      console.error("Failed to advance retention:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar 
        activeRole={activeRole} 
        setActiveRole={setActiveRole} 
        retentionProfile={retentionProfile} 
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <Suspense fallback={<PageLoadingFallback />}>
          {activeRole === 'customer' && (
            <CustomerStoreView 
              retentionProfile={retentionProfile} 
              onRefreshProfile={handleAdvanceProfile} 
              sharedOrderCounter={sharedOrderCounter}
            />
          )}
          {activeRole === 'merchant' && (
            <MerchantCopilot 
              sharedOrderCounter={sharedOrderCounter}
            />
          )}
          {activeRole === 'admin' && (
            <ExecutiveDashboard 
              sharedOrderCounter={sharedOrderCounter}
            />
          )}
        </Suspense>
      </main>

      <Footer />

      {/* Google Gemini AI Status & Test Modal */}
      <AiStatusModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
      />
    </div>
  );
}
