
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow, PriceConfig, DiscountConfig } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];

const BBFSCalculator: React.FC = () => {
  const [inputValue, setInputValue] = useState('12345');
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Financial Config States
  const [prices, setPrices] = useState<PriceConfig>({ '2D': 0.1, '3D': 0.1, '4D': 0.1, '5D': 0.1 });
  const [discounts, setDiscounts] = useState<DiscountConfig>({ full: 100, diskon: 64, super: 34 });

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

  // Financial Formatting & Calculation
  const formatValue = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(val));
  };

  const calculateBreakdown = (count: number, dim: Dimension) => {
    const base = count * prices[dim] * 1000;
    const fullVal = base * (discounts.full / 100);
    const diskonVal = base * (discounts.diskon / 100);
    const superVal = base * (discounts.super / 100);
    return {
      full: fullVal,
      diskon: diskonVal,
      super: superVal,
      total: fullVal + diskonVal + superVal
    };
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-2 space-y-2 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* HUD HEADER */}
      <div className="flex justify-between items-center opacity-30 px-1">
        <div className="flex items-center gap-1">
          <div className="relative w-1 h-1">
            <div className={`absolute inset-0 rounded-full blur-[1px] ${isReady ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div className={`relative w-full h-full rounded-full border border-white/10 ${isReady ? 'bg-cyan-400' : 'bg-red-400'}`}></div>
          </div>
          <span className="text-[6px] font-black tracking-[0.1em] text-white/50 uppercase">Core: {isReady ? 'Online' : 'Offline'}</span>
        </div>
        {deferredPrompt && (
          <button onClick={handleInstallClick} className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[6px] font-black text-cyan-400">
            INSTALL
          </button>
        )}
      </div>

      {/* BRANDING SECTION */}
      <div className="flex items-center justify-center gap-2 py-0.5">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg border border-white/5 rotate-45"></div>
          <svg viewBox="0 0 100 100" className="w-4 h-4 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
            <defs>
              <linearGradient id="bbsLiquidX" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <g stroke="url(#bbsLiquidX)" strokeWidth="15" fill="none" strokeLinecap="round">
              <path d="M 50 25 L 50 75 M 35 50 H 65" />
            </g>
          </svg>
        </div>
        <h1 className="flex items-baseline leading-none">
          <span className="text-xl font-black tracking-tighter text-white italic">BeBiak</span>
          <span className="text-sm font-black text-cyan-500 italic ml-0.5">’s</span>
          <div className="ml-1.5 px-1 py-0.5 rounded-md bg-gradient-to-br from-blue-600 to-indigo-800 border border-white/10">
            <span className="text-[7px] font-black text-white italic tracking-tighter uppercase">PRO</span>
          </div>
        </h1>
      </div>

      {/* BENTO INPUT CARD (UPDATED BBFS LABEL) */}
      <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-3 rounded-[1.2rem] border border-white/5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="space-y-0.5">
          {/* BBFS KREASI MENARIK */}
          <div className="flex items-center justify-center gap-3">
             <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-500/20"></div>
             <span className="text-[8px] font-[1000] text-transparent bg-clip-text bg-gradient-to-r from-white/20 via-cyan-400 to-white/20 uppercase tracking-[0.6em] italic">BBFS</span>
             <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-500/20"></div>
          </div>
          
          <div className="relative flex items-center justify-center">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="bg-transparent text-center text-2xl font-black outline-none text-white tracking-[0.05em] w-full placeholder-white/5"
              placeholder="01234"
              maxLength={10}
            />
            {inputValue && (
              <button onClick={handleClear} className="absolute right-0 text-white/10 hover:text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {dimensions.map(dim => (
            <button
              key={dim}
              onClick={() => toggleDim(dim)}
              className={`px-2.5 py-1 rounded-md font-black text-[8px] transition-all border transform active:scale-95 ${
                selectedDims.includes(dim) 
                ? 'bg-white text-black border-white shadow-md' 
                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowSingle(!showSingle)}
            className={`flex-1 py-1.5 rounded-md font-black text-[7.5px] uppercase tracking-wider border transition-all ${
              showSingle ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-white/5 text-white/20'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setShowTwin(!showTwin)}
            className={`flex-1 py-1.5 rounded-md font-black text-[7.5px] uppercase tracking-wider border transition-all ${
              showTwin ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-transparent border-white/5 text-white/20'
            }`}
          >
            Twin
          </button>
        </div>
      </div>

      {/* ACTION: COPY BUTTON */}
      <button
        onClick={handleCopy}
        disabled={!resultString}
        className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-lg relative overflow-hidden group ${
          copyFeedback 
          ? 'bg-emerald-500 text-white' 
          : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-800 text-white disabled:opacity-20'
        }`}
      >
        {copyFeedback ? 'COPIED' : 'COPY'}
      </button>

      {/* BENTO: OUTPUT TERMINAL */}
      <div className="bg-black/60 backdrop-blur-3xl p-2.5 rounded-[0.8rem] border border-white/5 min-h-[40px] max-h-[80px] overflow-y-auto custom-scrollbar shadow-inner text-center">
        <p className="text-cyan-400/80 font-mono text-[8.5px] font-bold break-all tracking-tight leading-snug">
          {resultString || <span className="text-white/10 italic text-[7.5px] uppercase">Awaiting input...</span>}
        </p>
      </div>

      {/* BENTO: DATA ANALYTICS */}
      <div className="bg-[#0a0f18]/40 backdrop-blur-2xl rounded-[1rem] border border-white/5 overflow-hidden shadow-lg">
        <div className="px-3 py-1 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-[6.5px] font-black text-white/20 uppercase tracking-[0.3em]">Analytics</h3>
          <div className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
             <span className="text-[5.5px] font-black text-cyan-400 uppercase">Live</span>
          </div>
        </div>
        <div className="p-0.5">
          <table className="w-full text-center">
            <thead>
              <tr className="text-[6.5px] text-white/20 font-black uppercase tracking-widest">
                <th className="py-1">Mode</th>
                <th className="py-1">Single</th>
                <th className="py-1">TWN</th>
                <th className="py-1 text-cyan-500">Total</th>
              </tr>
            </thead>
            <tbody className="text-[8px]">
              {summaryData.map((row) => (
                <tr key={row.type} className={`transition-all duration-300 ${selectedDims.includes(row.type) ? 'bg-white/5' : 'opacity-10 scale-95'}`}>
                  <td className="py-0.5 font-black text-white italic">{row.type}</td>
                  <td className="py-0.5 font-medium text-white/40">{row.single}</td>
                  <td className="py-0.5 font-medium text-white/40">{row.twin}</td>
                  <td className="py-0.5 font-black text-cyan-400">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.01] border-t border-white/5">
                <td colSpan={3} className="py-1 text-left pl-4 font-black text-white/30 uppercase text-[6.5px]">Total Processed</td>
                <td className="py-1 text-sm font-black text-white pr-4">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* FINANCIAL SECTION */}
      <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-3 rounded-[1.2rem] border border-white/5 shadow-xl space-y-2.5">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <h4 className="text-[7.5px] font-black text-white/40 uppercase tracking-[0.1em]">Pricing</h4>
            <span className="text-[6.5px] font-black text-cyan-400 uppercase">X 1000</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {dimensions.map(dim => (
              <div key={dim} className="space-y-0.5 text-center">
                <span className="text-[7.5px] font-black text-white/20 uppercase">{dim}</span>
                <input
                  type="number"
                  step="0.01"
                  value={prices[dim]}
                  onChange={(e) => setPrices({...prices, [dim]: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[#111621] border border-white/10 rounded-md py-0.5 text-center text-[9px] font-black text-white outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <div className="relative">
            <input
              type="number"
              value={discounts.full}
              onChange={(e) => setDiscounts({...discounts, full: parseFloat(e.target.value) || 0})}
              className="w-full bg-red-500/5 border border-red-500/20 rounded-md py-0.5 text-center text-[9px] font-black text-red-400 outline-none"
            />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-0.5 bg-[#0a0f18] text-[5px] font-black text-red-500 uppercase">Full</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={discounts.diskon}
              onChange={(e) => setDiscounts({...discounts, diskon: parseFloat(e.target.value) || 0})}
              className="w-full bg-blue-500/5 border border-blue-500/20 rounded-md py-0.5 text-center text-[9px] font-black text-blue-400 outline-none"
            />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-0.5 bg-[#0a0f18] text-[5px] font-black text-blue-500 uppercase">Disk</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={discounts.super}
              onChange={(e) => setDiscounts({...discounts, super: parseFloat(e.target.value) || 0})}
              className="w-full bg-orange-500/5 border border-orange-500/20 rounded-md py-0.5 text-center text-[9px] font-black text-orange-400 outline-none"
            />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-0.5 bg-[#0a0f18] text-[5px] font-black text-orange-500 uppercase">Supr</span>
          </div>
        </div>
      </div>

      {/* BREAKDOWN TABLES */}
      <div className="space-y-2">
        {/* SINGLE MODE BREAKDOWN */}
        <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1rem] border border-white/5 overflow-hidden shadow-lg">
          <div className="px-3 py-1 border-b border-white/5 bg-white/[0.02]">
            <h4 className="text-[7.5px] font-black text-white/50 uppercase tracking-[0.2em]">Single Breakdown</h4>
          </div>
          <table className="w-full text-[7.5px] text-center">
            <thead>
              <tr className="text-white/20 font-black uppercase border-b border-white/5">
                <th className="py-1">Mode</th>
                <th className="py-1 text-red-500/50">Full</th>
                <th className="py-1 text-blue-500/50">Disk</th>
                <th className="py-1 text-orange-500/50">Supr</th>
                <th className="py-1 text-white/30">Total</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map(dim => {
                const count = resultsByDim[dim].single.length;
                const breakdown = calculateBreakdown(count, dim);
                const isSelected = selectedDims.includes(dim) && showSingle;
                return (
                  <tr key={`s-break-${dim}`} className={`border-b border-white/5 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'hidden'}`}>
                    <td className="py-0.5 font-black italic text-cyan-400 text-[8px]">{dim}</td>
                    <td className="py-0.5 text-red-400/70">{formatValue(breakdown.full)}</td>
                    <td className="py-0.5 text-blue-400/70">{formatValue(breakdown.diskon)}</td>
                    <td className="py-0.5 text-orange-400/70">{formatValue(breakdown.super)}</td>
                    <td className="py-0.5 font-black text-white">{formatValue(breakdown.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TWIN MODE BREAKDOWN */}
        <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1rem] border border-white/5 overflow-hidden shadow-lg">
          <div className="px-3 py-1 border-b border-white/5 bg-white/[0.02]">
            <h4 className="text-[7.5px] font-black text-white/50 uppercase tracking-[0.2em]">Twin Breakdown</h4>
          </div>
          <table className="w-full text-[7.5px] text-center">
            <thead>
              <tr className="text-white/20 font-black uppercase border-b border-white/5">
                <th className="py-1">Mode</th>
                <th className="py-1 text-red-500/50">Full</th>
                <th className="py-1 text-blue-500/50">Disk</th>
                <th className="py-1 text-orange-500/50">Supr</th>
                <th className="py-1 text-white/30">Total</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map(dim => {
                const count = resultsByDim[dim].twin.length;
                const breakdown = calculateBreakdown(count, dim);
                const isSelected = selectedDims.includes(dim) && showTwin;
                return (
                  <tr key={`t-break-${dim}`} className={`border-b border-white/5 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'hidden'}`}>
                    <td className="py-0.5 font-black italic text-blue-400 text-[8px]">{dim}</td>
                    <td className="py-0.5 text-red-400/70">{formatValue(breakdown.full)}</td>
                    <td className="py-0.5 text-blue-400/70">{formatValue(breakdown.diskon)}</td>
                    <td className="py-0.5 text-orange-400/70">{formatValue(breakdown.super)}</td>
                    <td className="py-0.5 font-black text-white">{formatValue(breakdown.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="text-center pt-2 opacity-10">
        <p className="text-[5px] text-white font-black uppercase tracking-[0.3em]">Kernel V5.1 Integrated</p>
      </footer>
    </div>
  );
};

export default BBFSCalculator;
