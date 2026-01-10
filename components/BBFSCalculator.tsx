
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];

const BBFSCalculator: React.FC = () => {
  const [inputValue, setInputValue] = useState('12345');
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setIsReady(true));
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const toggleDim = (dim: Dimension) => {
    setSelectedDims(prev => 
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    );
  };

  const handleClear = () => {
    setInputValue('');
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const { uniqueDigits, repeatingDigits, counts } = useMemo(() => getDigitsData(inputValue), [inputValue]);

  const resultsByDim = useMemo(() => {
    const data: Record<Dimension, { single: string[], twin: string[] }> = {
      '2D': { single: [], twin: [] },
      '3D': { single: [], twin: [] },
      '4D': { single: [], twin: [] },
      '5D': { single: [], twin: [] },
    };

    dimensions.forEach(dim => {
      const k = parseInt(dim);
      if (uniqueDigits.length >= k || (showTwin && repeatingDigits.length > 0)) {
        data[dim].single = getSinglePermutations(uniqueDigits, k);
        data[dim].twin = getTwinPermutations(uniqueDigits, repeatingDigits, k, counts);
      }
    });

    return data;
  }, [uniqueDigits, repeatingDigits, showTwin, counts]);

  const summaryData: SummaryRow[] = useMemo(() => {
    return dimensions.map(dim => {
      const isDimSelected = selectedDims.includes(dim);
      const singleCount = (isDimSelected && showSingle) ? resultsByDim[dim].single.length : 0;
      const twinCount = (isDimSelected && showTwin) ? resultsByDim[dim].twin.length : 0;
      return {
        type: dim,
        single: singleCount,
        twin: twinCount,
        total: singleCount + twinCount,
      };
    });
  }, [resultsByDim, selectedDims, showSingle, showTwin]);

  const grandTotal = useMemo(() => {
    return summaryData.reduce((acc, row) => acc + row.total, 0);
  }, [summaryData]);

  const resultString = useMemo(() => {
    let combined: string[] = [];
    selectedDims.forEach(dim => {
      if (showSingle) combined = [...combined, ...resultsByDim[dim].single];
      if (showTwin) combined = [...combined, ...resultsByDim[dim].twin];
    });
    return combined.join('*');
  }, [selectedDims, showSingle, showTwin, resultsByDim]);

  const handleCopy = useCallback(() => {
    if (!resultString) return;
    navigator.clipboard.writeText(resultString).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [resultString]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-2 space-y-3 pb-10 animate-in fade-in duration-700">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-1">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black border tracking-widest ${isReady ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
          <span className={`w-1 h-1 rounded-full ${isReady ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-amber-500'}`}></span>
          {isReady ? 'SYSTEM READY' : 'INIT...'}
        </div>
        {deferredPrompt && (
          <button onClick={handleInstallClick} className="text-[8px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase">Install App</button>
        )}
      </div>

      {/* NEW HEADER DESIGN */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <div className="flex items-center gap-3 mb-1 relative">
            
            {/* Top Icon: Electric BS Monogram */}
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl filter blur-md animate-pulse"></div>
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" fill="none">
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" /> 
                      <stop offset="40%" stopColor="#22d3ee" /> 
                      <stop offset="100%" stopColor="#2563eb" /> 
                    </linearGradient>
                  </defs>
                  {/* B shape with S lightning spine */}
                  <path 
                    d="M 30 10 L 60 10 C 80 10, 85 25, 65 35 L 55 38 L 65 42 C 85 50, 80 80, 50 80 L 20 80 L 35 55 L 15 45 L 30 10 Z" 
                    fill="url(#logoGrad)" 
                    stroke="white" 
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeOpacity="0.8"
                  />
                  <path d="M 40 25 L 55 25 C 65 25 65 30 55 32 L 48 34 L 58 38 C 65 42 60 65 45 65 L 35 65 L 42 52 L 30 45 L 40 25 Z" fill="#05070a" opacity="0.6" />
                </svg>
            </div>

            {/* Inline Text Logo */}
            <h1 className="flex items-end text-3xl font-black tracking-tighter text-white italic relative z-10">
                <span className="mb-1 drop-shadow-md">Bebiak</span>
                
                {/* DYNAMIC ELECTRIC S */}
                <div className="relative w-9 h-12 -mx-1.5 flex items-center justify-center transform scale-110 -translate-y-1">
                    {/* Plasma Background */}
                    <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white blur-md opacity-40"></div>

                    {/* The Lightning S */}
                    <svg viewBox="0 0 100 160" className="w-full h-full drop-shadow-[0_0_5px_rgba(255,255,255,0.9)] overflow-visible">
                        <defs>
                            <linearGradient id="electricGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" /> {/* Hot White Core */}
                                <stop offset="40%" stopColor="#a5f3fc" /> {/* Pale Cyan */}
                                <stop offset="100%" stopColor="#0891b2" /> {/* Deep Cyan */}
                            </linearGradient>
                        </defs>
                        {/* Sharp jagged S shape */}
                        <path 
                            d="M 70 5 L 25 5 L 35 55 L 5 55 L 85 155 L 60 85 L 95 85 L 70 5 Z" 
                            fill="url(#electricGrad)" 
                            stroke="white"
                            strokeWidth="4"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_0_10px_rgba(34,211,238,1)]"
                        />
                    </svg>
                </div>

                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1 ml-0.5 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">Pro</span>
            </h1>
        </div>
        
        {/* Decorative Energy Line */}
        <div className="flex items-center gap-2 w-full max-w-[220px] mt-1 mb-1 justify-center opacity-80">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>
        <p className="text-[8px] text-cyan-300/70 font-bold tracking-[0.4em] uppercase shadow-cyan-500/10">Electric Engine V3.2</p>
      </div>

      {/* Input Section - Compact */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
        <div className="relative bg-[#0a0f18] p-3 rounded-2xl border border-white/5 shadow-2xl">
          <label className="block text-center text-[8px] font-black text-cyan-500/50 uppercase tracking-[0.3em] mb-2">Input Angka (Max 10)</label>
          <div className="flex items-center justify-center relative h-12">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="bg-transparent text-center text-3xl font-black outline-none text-white tracking-[0.1em] w-full placeholder-white/5"
              placeholder="0123456789"
              maxLength={10}
            />
            {inputValue && (
              <button 
                onClick={handleClear}
                className="absolute right-0 p-1 text-gray-600 hover:text-red-500 active:scale-90 transition-all rounded-full hover:bg-red-500/10"
                title="Clear"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-4 gap-2">
        {dimensions.map(dim => (
          <button
            key={dim}
            onClick={() => toggleDim(dim)}
            className={`py-2 rounded-xl font-black text-xs transition-all border ${
              selectedDims.includes(dim) 
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
              : 'bg-[#111827]/50 border-white/5 text-gray-600'
            }`}
          >
            {dim}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setShowSingle(!showSingle)}
          className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
            showSingle ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5' : 'border-white/5 text-gray-700 bg-black/20'
          }`}
        >
          Single
        </button>
        <button
          onClick={() => setShowTwin(!showTwin)}
          className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
            showTwin ? 'border-blue-500/50 text-blue-400 bg-blue-500/5' : 'border-white/5 text-gray-700 bg-black/20'
          }`}
        >
          Twin
        </button>
      </div>

      {/* Execute/Copy Button */}
      <button
        onClick={handleCopy}
        disabled={!resultString}
        className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-lg ${
          copyFeedback 
          ? 'bg-white text-black' 
          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-900/20 disabled:opacity-20'
        }`}
      >
        {copyFeedback ? 'BERHASIL' : 'SALIN HASIL'}
      </button>

      {/* Result Stream Area */}
      <div className="bg-black/60 backdrop-blur-2xl p-3 rounded-xl border border-cyan-500/10 min-h-[60px] max-h-[120px] overflow-y-auto custom-scrollbar shadow-[inset_0_0_15px_rgba(34,211,238,0.03)]">
        <p className="text-cyan-400/90 font-mono text-center text-xs font-medium leading-relaxed break-all tracking-tight">
          {resultString || <span className="text-gray-800 italic text-[9px]">Menunggu input angka...</span>}
        </p>
      </div>

      {/* Summary Table - Compact */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0f18]/80 backdrop-blur-xl shadow-lg">
        <div className="px-4 py-2.5 flex justify-between items-center border-b border-white/5 bg-white/5">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Statistik</h3>
          <span className="text-[9px] font-black text-cyan-500 uppercase">Live</span>
        </div>
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
              <th className="py-2 border-b border-white/5">Mode</th>
              <th className="py-2 border-b border-white/5">SGL</th>
              <th className="py-2 border-b border-white/5">TWN</th>
              <th className="py-2 border-b border-white/5 text-cyan-500">Total</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {summaryData.map((row) => (
              <tr key={row.type} className={`${selectedDims.includes(row.type) ? 'bg-cyan-500/5' : 'opacity-10'}`}>
                <td className="py-1.5 font-black text-cyan-500">{row.type}</td>
                <td className="py-1.5 font-bold text-gray-400">{row.single}</td>
                <td className="py-1.5 font-bold text-gray-400">{row.twin}</td>
                <td className="py-1.5 font-black text-white">{row.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-cyan-600/10 border-t border-cyan-500/20">
              <td colSpan={3} className="py-2.5 text-left pl-4 font-black text-cyan-500 uppercase text-[9px] tracking-widest">Total</td>
              <td className="py-2.5 text-sm font-black text-white pr-4">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <footer className="text-center py-2">
        <p className="text-[8px] text-gray-800 font-black uppercase tracking-[0.3em]">
          BebiaksPro &bull; Offline
        </p>
      </footer>
    </div>
  );
};

export default BBFSCalculator;
