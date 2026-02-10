
import React, { useState } from 'react';
import BBFSCalculator from './components/BBFSCalculator';
import AIChatAssistant from './components/AIChatAssistant';
import TopMenu from './components/TopMenu';
import DataBBFS from './components/DataBBFS';
import HistoricalArchive from './components/HistoricalArchive';
import MatrixTracking from './components/MatrixTracking';
import ResultPrediction from './components/ResultPrediction';
import { ViewType } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('BBFS');

  const renderView = () => {
    switch (currentView) {
      case 'BBFS':
        return <BBFSCalculator />;
      case 'DATA':
        return <DataBBFS />;
      case 'ARCHIVE':
        return <HistoricalArchive />;
      case 'MATRIX_BBFS':
        return <MatrixTracking mode="BBFS" />;
      case 'MATRIX_RESULT':
        return <MatrixTracking mode="RESULT" />;
      case 'PREDICTION':
        return <ResultPrediction />;
      default:
        return <BBFSCalculator />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-4 md:py-8 px-2 md:px-4 bg-[#05070a] relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      <div className="fixed -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-900/10 blur-[180px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="fixed -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-900/10 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-[0.05]"></div>
      
      <TopMenu currentView={currentView} onNavigate={setCurrentView} />

      <main className="w-full max-w-[1600px] z-10 relative pt-16 md:pt-20">
        {renderView()}
      </main>

      <AIChatAssistant />

      <footer className="mt-auto py-8 flex flex-col items-center gap-2 z-0 select-none">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
            Data Tersimpan Lokal di Browser Anda • Private & Secure
          </span>
        </div>
        <div className="text-white text-[11px] text-center uppercase tracking-[0.6em] font-black opacity-[0.03] hidden md:block">
          BebiaksPro Integrated System • Professional Grade Logic • Offline Mode
        </div>
      </footer>
    </div>
  );
};

export default App;
