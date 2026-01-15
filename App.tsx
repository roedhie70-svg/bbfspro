
import React, { useState } from 'react';
import BBFSCalculator from './components/BBFSCalculator';
import AIChatAssistant from './components/AIChatAssistant';
import TopMenu from './components/TopMenu';
import DataBBFS from './components/DataBBFS';
import { ViewType } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('BBFS');

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-4 md:py-12 px-2 md:px-8 bg-[#05070a] relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      
      {/* SOFT LIGHT LEAKS */}
      <div className="fixed -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-900/10 blur-[180px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="fixed -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-900/10 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* SCANLINE OVERLAY */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-[0.05]"></div>
      
      {/* TOP NAVIGATION MENU */}
      <TopMenu currentView={currentView} onNavigate={setCurrentView} />

      <main className="w-full max-w-7xl z-10 relative">
        {currentView === 'BBFS' ? <BBFSCalculator /> : <DataBBFS />}
      </main>

      <AIChatAssistant />

      <footer className="mt-auto py-8 text-white text-[11px] text-center uppercase tracking-[0.6em] font-black opacity-[0.03] z-0 select-none hidden md:block">
        BebiaksPro Integrated System • Professional Grade Logic • Offline Mode
      </footer>
    </div>
  );
};

export default App;
