import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useStore } from './hooks/useStore';
import Sidebar from './components/Sidebar';
import Ticker from './components/Ticker';
import SearchModal from './components/SearchModal';
import KeybindsModal from './components/KeybindsModal';
import LeadDetail from './components/LeadDetail';
import AIOverlay from './components/AIOverlay';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const TrendsPage = lazy(() => import('./pages/TrendsPage'));
const PlaysPage = lazy(() => import('./pages/PlaysPage'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const CasinoPage = lazy(() => import('./pages/CasinoPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        <span className="text-brand text-sm animate-pulse">Loading...</span>
      </div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export default function App() {
  const { page, setPage, sidebar, toggleSidebar, searchOpen, setSearchOpen, keybindsOpen, setKeybindsOpen, aiOpen, setAiOpen, selectedLead, detailOpen, setDetailOpen, setSelectedLead, setMobileMenu } = useStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setKeybindsOpen(false); setDetailOpen(false); setAiOpen(false); setMobileMenu(false); }
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleSidebar(); }
      if (e.key === '?') { e.preventDefault(); setKeybindsOpen(true); }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setAiOpen(!aiOpen); }
      const pages = ['home', 'dashboard', 'leads', 'trends', 'plays', 'market', 'casino', 'wallet'];
      if (e.key >= '1' && e.key <= '8' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setPage(pages[+e.key - 1]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiOpen]);

  const selectLead = (l) => { setSelectedLead(l); setDetailOpen(true); };

  const mainML = isMobile ? 0 : (sidebar ? 240 : 72);

  return (
    <div className="min-h-screen bg-surface-0 text-slate-100 font-sans">
      <Ticker />
      <Sidebar />
      <main
        className="transition-all duration-300 pt-0 sm:pt-9"
        style={{ marginLeft: mainML }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {page === 'home' && <HomePage />}
          {page === 'dashboard' && <DashboardPage onSelect={selectLead} />}
          {page === 'leads' && <LeadsPage onSelect={selectLead} />}
          {page === 'trends' && <TrendsPage />}
          {page === 'plays' && <PlaysPage />}
          {page === 'market' && <MarketPage />}
          {page === 'casino' && <CasinoPage />}
          {page === 'wallet' && <WalletPage />}
        </Suspense>
      </main>
      {searchOpen && <SearchModal />}
      {keybindsOpen && <KeybindsModal />}
      {detailOpen && selectedLead && <LeadDetail />}
      {aiOpen && <AIOverlay />}
    </div>
  );
}
