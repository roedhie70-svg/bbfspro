
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow, PriceConfig, DiscountConfig } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];

const BBFSCalculator: React.FC = () => {
  const [inputValue, setInputValue] = useState('11234');
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [copiedIndex, setCopiedIndex] = useState(0);

  const [prices, setPrices] = useState<PriceConfig>({ 
    '2D': '0.1', 
    '3D': '0.1', 
    '4D': '0.1', 
    '5D': '0.1' 
  });
  const [discounts, setDiscounts] = useState<DiscountConfig>({ 
    full: '100', 
    diskon: '64', 
    super: '34' 
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setIsReady(true));
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    setCopiedIndex(0);
  }, [inputValue, selectedDims, showSingle, showTwin]);

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
    setCopiedIndex(0);
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
      data[dim].single = getSinglePermutations(uniqueDigits, k);
      data[dim].twin = getTwinPermutations(uniqueDigits, repeatingDigits, k, counts);
    });

    return data;
  }, [uniqueDigits, repeatingDigits, counts]);

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

  const resultList = useMemo(() => {
    let combined: string[] = [];
    selectedDims.forEach(dim => {
      if (showSingle) combined = [...combined, ...resultsByDim[dim].single];
      if (showTwin) combined = [...combined, ...resultsByDim[dim].twin];
    });
    return combined;
  }, [selectedDims, showSingle, showTwin, resultsByDim]);

  const handleCopyNext = useCallback(() => {
    if (resultList.length === 0 || copiedIndex >= resultList.length) return;
    
    const limit = 25;
    const end = Math.min(copiedIndex + limit, resultList.length);
    const chunk = resultList.slice(copiedIndex, end);
    const textToCopy = chunk.join('*');

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(end);
      setCopyFeedback(`COPY ${end}`);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
      setTimeout(() => setCopyFeedback(null), 1500);
    });
  }, [resultList, copiedIndex]);

  const handleCopyAll = useCallback(() => {
    if (resultList.length === 0) return;
    const textToCopy = resultList.join('*');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(resultList.length);
      setCopyFeedback('COPIED ALL');
      if (window.navigator.vibrate) window.navigator.vibrate(60);
      setTimeout(() => setCopyFeedback(null), 1500);
    });
  }, [resultList]);

  const safeParse = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(',', '.')) || 0;
  };

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(val));
  };

  const calculateBreakdown = (count: number, dim: Dimension) => {
    const priceNum = safeParse(prices[dim]);
    const base = count * priceNum * 1000;
    const fullVal = base * (safeParse(discounts.full) / 100);
    const diskonVal = base * (safeParse(discounts.diskon) / 100);
    const superVal = base * (safeParse(discounts.super) / 100);
    return { full: fullVal, diskon: diskonVal, super: superVal, total: fullVal + diskonVal + superVal };
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
          <span className="text-[6px] font-black tracking-[0.1em] text-white/50 uppercase">Kernel: {isReady ? 'Active' : 'Offline'}</span>
        </div>
        {deferredPrompt && (
          <button onClick={handleInstallClick} className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-[6px] font-black text-cyan-400">INSTALL APP</button>
        )}
      </div>

      {/* BRANDING */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-1 rounded-xl border border-white/5 rotate-45 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[0_0_20px_rgba(0,0,0,0.8)]"></div>
          <svg viewBox="0 0 100 100" className="w-10 h-10 relative z-10 overflow-visible">
            <path d="M12 22 V78 M12 22 Q44 22 44 38 Q44 50 24 50 M12 50 Q50 50 50 64 Q50 78 24 78" fill="none" stroke="white" strokeWidth="14" strokeLinecap="round" />
            <path d="M52 30 Q88 30 88 42 Q88 54 74 54 Q60 54 60 66 Q60 78 92 78" fill="none" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col items-start leading-none">
          <h1 className="flex items-baseline mb-0.5">
            <span className="text-3xl font-black tracking-tighter text-white italic">BeBiak’s</span>
            <span className="text-xl font-black text-amber-500 italic ml-1">Pro</span>
          </h1>
          <span className="text-[9px] font-black text-white/40 tracking-[0.3em] uppercase italic">TLC Community</span>
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-3 rounded-[1.2rem] border border-white/5 shadow-xl space-y-3">
        <div className="space-y-0.5 text-center">
          <span className="text-[8px] font-black text-cyan-400/40 uppercase tracking-[0.6em] italic">CORE INPUT</span>
          <div className="relative">
            <input type="text" inputMode="numeric" value={inputValue} onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 10))} className="bg-transparent text-center text-3xl font-black outline-none text-white tracking-[0.1em] w-full placeholder-white/5" placeholder="01234" />
            {inputValue && <button onClick={handleClear} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" /></svg></button>}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {dimensions.map(dim => (
            <button key={dim} onClick={() => toggleDim(dim)} className={`px-3 py-1.5 rounded-lg font-black text-[9px] transition-all border ${selectedDims.includes(dim) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}>{dim}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowSingle(!showSingle)} className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase border transition-all ${showSingle ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-white/5 text-white/20'}`}>Single</button>
          <button onClick={() => setShowTwin(!showTwin)} className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase border transition-all ${showTwin ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-transparent border-white/5 text-white/20'}`}>Twin</button>
        </div>
      </div>

      {/* TERMINAL */}
      <div className="bg-black/80 backdrop-blur-3xl p-4 rounded-[1.2rem] border border-white/10 min-h-[120px] max-h-[180px] overflow-y-auto custom-scrollbar shadow-inner text-center relative">
        <div className="absolute top-2 right-4 text-[7px] font-black text-white/20 uppercase tracking-widest">{copiedIndex}/{resultList.length} items</div>
        <div className="text-cyan-400/80 font-mono text-[10px] font-bold break-all tracking-tight leading-relaxed pt-2">
          {resultList.length > 0 ? (
            resultList.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className={idx < copiedIndex ? "text-emerald-500/40 line-through" : "text-cyan-400"}>{item}</span>
                {idx < resultList.length - 1 && <span className="text-white/10 px-0.5">*</span>}
              </React.Fragment>
            ))
          ) : (<span className="text-white/10 italic text-[9px] uppercase">Waiting for core...</span>)}
        </div>
      </div>

      {/* COPY CONTROLS */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <button onClick={handleCopyNext} disabled={copiedIndex >= resultList.length || resultList.length === 0} className={`flex-[2] py-2.5 rounded-lg font-black text-[9px] uppercase tracking-wider border transition-all transform active:scale-95 shadow-lg ${copiedIndex >= resultList.length && resultList.length > 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500/60' : 'bg-cyan-600 text-white border-cyan-500'}`}>
            {copiedIndex >= resultList.length && resultList.length > 0 ? '✓ ALL COPIED' : `COPY NEXT 25 (${Math.min(25, resultList.length - copiedIndex)})`}
          </button>
          <button onClick={() => setCopiedIndex(0)} className="flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider border border-white/10 bg-white/5 text-white/40 active:scale-95">RESET</button>
        </div>
        <button onClick={handleCopyAll} disabled={resultList.length === 0} className="w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] transition-all bg-gradient-to-r from-blue-700 to-indigo-900 text-white shadow-xl active:scale-95 disabled:opacity-20">
          {copyFeedback === 'COPIED ALL' ? '✓ ALL COPIED' : 'COPY ALL'}
        </button>
      </div>

      {/* ANALYTICS */}
      <div className="bg-[#0a0f18]/40 backdrop-blur-2xl rounded-[1.2rem] border border-white/5 overflow-hidden shadow-lg">
        <div className="px-3 py-1.5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em]">System Analytics</h3>
          <span className="text-[6px] font-black text-cyan-400 uppercase">Live Engine</span>
        </div>
        <table className="w-full text-center">
          <thead>
            <tr className="text-[7px] text-white/20 font-black uppercase border-b border-white/5">
              <th className="py-1.5">Mode</th><th className="py-1.5">Single</th><th className="py-1.5">Twin</th><th className="py-1.5 text-cyan-500">Total</th>
            </tr>
          </thead>
          <tbody className="text-[9px]">
            {summaryData.map((row) => (
              <tr key={row.type} className={`transition-all ${selectedDims.includes(row.type) ? 'bg-white/5' : 'opacity-10 scale-95'}`}>
                <td className="py-1 font-black text-white italic">{row.type}</td>
                <td className="py-1 font-medium text-white/40">{row.single}</td>
                <td className="py-1 font-medium text-white/40">{row.twin}</td>
                <td className="py-1 font-black text-cyan-400">{row.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white/[0.01] border-t border-white/5">
              <td colSpan={3} className="py-2 text-left pl-4 font-black text-white/30 uppercase text-[7px]">Grand Total</td>
              <td className="py-2 text-base font-black text-white pr-4">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* FINANCIAL */}
      <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-4 rounded-[1.5rem] border border-white/5 shadow-xl space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">Pricing Table</h4>
            <span className="text-[8px] font-black text-cyan-500/80 uppercase">x 1.000</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {dimensions.map(dim => (
              <div key={dim} className="space-y-1">
                <label className="block text-[8px] font-black text-white/20 uppercase text-center">{dim}</label>
                <input type="text" inputMode="decimal" value={prices[dim]} onChange={(e) => setPrices(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-[#05070a]/50 border border-white/10 rounded-lg py-2 text-center text-[11px] font-black text-white outline-none focus:border-cyan-500/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{l:'Full',k:'full',c:'red'},{l:'Disk',k:'diskon',c:'blue'},{l:'Supr',k:'super',c:'orange'}].map(i => (
            <div key={i.k} className="relative group">
              <input type="text" inputMode="decimal" value={discounts[i.k as keyof DiscountConfig]} onChange={(e) => setDiscounts(prev => ({ ...prev, [i.k]: e.target.value.replace(/[^0-9.,]/g, '') }))} className={`w-full bg-${i.c}-500/5 border border-${i.c}-500/10 rounded-xl py-2.5 text-center text-[11px] font-black text-${i.c}-400 outline-none`} />
              <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 bg-[#0a0f18] text-[7px] font-black text-${i.c}-500 uppercase`}>{i.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BREAKDOWNS */}
      <div className="space-y-2">
        <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1.2rem] border border-white/5 overflow-hidden shadow-lg">
          <div className="px-3 py-1.5 border-b border-white/5 flex justify-between bg-white/[0.02]"><h4 className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Single Breakdown</h4><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]"></div></div>
          <table className="w-full text-[8px] text-center">
            <thead><tr className="text-white/20 font-black uppercase border-b border-white/5"><th className="py-2">Mode</th><th className="py-2">Full</th><th className="py-2">Disk</th><th className="py-2">Supr</th><th className="py-2">Total</th></tr></thead>
            <tbody>
              {dimensions.map(dim => {
                const count = resultsByDim[dim].single.length;
                if (!selectedDims.includes(dim) || !showSingle || count === 0) return null;
                const b = calculateBreakdown(count, dim);
                return (<tr key={dim} className="border-b border-white/5"><td className="py-1.5 font-black italic text-cyan-400">{dim}</td><td>{formatValue(b.full)}</td><td>{formatValue(b.diskon)}</td><td>{formatValue(b.super)}</td><td className="font-black text-white">{formatValue(b.total)}</td></tr>);
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1.2rem] border border-white/5 overflow-hidden shadow-lg">
          <div className="px-3 py-1.5 border-b border-white/5 flex justify-between bg-white/[0.02]"><h4 className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Twin Breakdown</h4><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_orange]"></div></div>
          <table className="w-full text-[8px] text-center">
            <thead><tr className="text-white/20 font-black uppercase border-b border-white/5"><th className="py-2">Mode</th><th className="py-2">Full</th><th className="py-2">Disk</th><th className="py-2">Supr</th><th className="py-2">Total</th></tr></thead>
            <tbody>
              {dimensions.map(dim => {
                const count = resultsByDim[dim].twin.length;
                if (!selectedDims.includes(dim) || !showTwin || count === 0) return null;
                const b = calculateBreakdown(count, dim);
                return (<tr key={dim} className="border-b border-white/5"><td className="py-1.5 font-black italic text-amber-400">{dim}</td><td>{formatValue(b.full)}</td><td>{formatValue(b.diskon)}</td><td>{formatValue(b.super)}</td><td className="font-black text-white">{formatValue(b.total)}</td></tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="text-center pt-4 opacity-10"><p className="text-[6px] text-white font-black uppercase tracking-[0.4em]">Integrated Logic Engine V7.0 (Final Android Build)</p></footer>
    </div>
  );
};

export default BBFSCalculator;
