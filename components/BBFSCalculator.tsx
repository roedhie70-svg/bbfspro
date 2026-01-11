import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow, PriceConfig, DiscountConfig, DimensionDiscountConfig } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];
const copyLimits = [25, 50, 100, 200, 400];

const BBFSCalculator: React.FC = () => {
  const [inputValue, setInputValue] = useState('11234');
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D', '5D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [copiedIndex, setCopiedIndex] = useState(0);
  const [copyLimit, setCopyLimit] = useState(25);

  // SEPARATE PRICING STATES
  const [singlePrices, setSinglePrices] = useState<PriceConfig>({ 
    '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' 
  });
  const [twinPrices, setTwinPrices] = useState<PriceConfig>({ 
    '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' 
  });

  // UPDATED DISCOUNT RULES PER DIMENSION
  const [discounts, setDiscounts] = useState<DimensionDiscountConfig>({ 
    '2D': { diskon: '67', super: '34' },
    '3D': { diskon: '67', super: '34' },
    '4D': { diskon: '67', super: '34' },
    '5D': { diskon: '62', super: '0' } 
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
    
    const limit = copyLimit;
    const end = Math.min(copiedIndex + limit, resultList.length);
    const chunk = resultList.slice(copiedIndex, end);
    const textToCopy = chunk.join('*');

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(end);
      setCopyFeedback(`COPY ${end}`);
      if (window.navigator.vibrate) window.navigator.vibrate(30);
      setTimeout(() => setCopyFeedback(null), 1500);
    });
  }, [resultList, copiedIndex, copyLimit]);

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

  const calculateBreakdown = (count: number, dim: Dimension, mode: 'single' | 'twin') => {
    const priceMap = mode === 'single' ? singlePrices : twinPrices;
    const priceNum = safeParse(priceMap[dim]);
    const base = count * priceNum * 1000;
    
    const dimDiscount = discounts[dim];
    // Full Rate diset 100% secara internal karena input UI dihapus
    const fullVal = base; 
    const diskonVal = base * (safeParse(dimDiscount.diskon) / 100);
    const superVal = dim === '5D' ? 0 : base * (safeParse(dimDiscount.super) / 100);
    
    return { full: fullVal, diskon: diskonVal, super: superVal, total: fullVal + diskonVal + superVal };
  };

  const handleDiscountChange = (dim: Dimension, field: keyof DiscountConfig, value: string) => {
    setDiscounts(prev => ({
      ...prev,
      [dim]: {
        ...prev[dim],
        [field]: value.replace(/[^0-9.,]/g, '')
      }
    }));
  };

  return (
    <div className="w-full flex flex-col md:grid md:grid-cols-12 md:gap-8 p-2 md:p-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* COLUMN 1: CONTROLS & INPUT */}
      <div className="md:col-span-4 flex flex-col space-y-4">
        
        {/* HUD HEADER */}
        <div className="flex justify-between items-center opacity-30 px-1">
          <div className="flex items-center gap-1">
            <div className="relative w-1 h-1">
              <div className={`absolute inset-0 rounded-full blur-[1px] ${isReady ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div className={`relative w-full h-full rounded-full border border-white/10 ${isReady ? 'bg-cyan-400' : 'bg-red-400'}`}></div>
            </div>
            <span className="text-[7px] font-black tracking-[0.1em] text-white/50 uppercase">Kernel: {isReady ? 'Active' : 'Offline'}</span>
          </div>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-[6px] font-black text-cyan-400">INSTALL APP</button>
          )}
        </div>

        {/* BRANDING */}
        <div className="flex items-center gap-4 py-2 md:py-6">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-1 rounded-xl border border-white/5 rotate-45 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[0_0_20px_rgba(0,0,0,0.8)]"></div>
            <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12 relative z-10 overflow-visible">
              <path d="M12 22 V78 M12 22 Q44 22 44 38 Q44 50 24 50 M12 50 Q50 50 50 64 Q50 78 24 78" fill="none" stroke="white" strokeWidth="14" strokeLinecap="round" />
              <path d="M52 30 Q88 30 88 42 Q88 54 74 54 Q60 54 60 66 Q60 78 92 78" fill="none" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-none">
            <h1 className="flex items-baseline mb-0.5">
              <span className="text-3xl md:text-4xl font-black tracking-tighter text-white italic">BeBiak’s</span>
              <span className="text-xl md:text-2xl font-black text-amber-500 italic ml-1">Pro</span>
            </h1>
            <span className="text-[9px] md:text-[11px] font-black text-white/40 tracking-[0.3em] uppercase italic">TLC Community</span>
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-4 md:p-6 rounded-[1.5rem] border border-white/5 shadow-2xl space-y-5">
          <div className="space-y-1 text-center">
            <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.8em] italic">BBFS</span>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 15))} 
                className="bg-transparent text-center text-xl md:text-3xl font-black outline-none text-white tracking-[0.1em] w-full placeholder-white/5" 
                placeholder="0123456789" 
              />
              {inputValue && <button onClick={handleClear} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {dimensions.map(dim => (
              <button key={dim} onClick={() => toggleDim(dim)} className={`px-4 py-2 rounded-xl font-black text-[11px] transition-all border ${selectedDims.includes(dim) ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/5 text-white/40'}`}>{dim}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSingle(!showSingle)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showSingle ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-white/5 text-white/20'}`}>Single Mode</button>
            <button onClick={() => setShowTwin(!showTwin)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showTwin ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-transparent border-white/5 text-white/20'}`}>Twin Mode</button>
          </div>
        </div>

        {/* ANALYTICS TABLE */}
        <div className="bg-[#0a0f18]/40 backdrop-blur-2xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Permutation Analytics</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[8px] font-black text-cyan-400 uppercase">Live</span>
            </div>
          </div>
          <table className="w-full text-center">
            <thead>
              <tr className="text-[9px] text-white/20 font-black uppercase border-b border-white/5 bg-black/20">
                <th className="py-3">Mode</th><th className="py-3">Single</th><th className="py-3">Twin</th><th className="py-3 text-cyan-500">Total</th>
              </tr>
            </thead>
            <tbody className="text-[11px] md:text-[12px]">
              {summaryData.map((row) => (
                <tr key={row.type} className={`transition-all border-b border-white/[0.02] ${selectedDims.includes(row.type) ? 'bg-white/[0.03]' : 'opacity-10 scale-95'}`}>
                  <td className="py-2.5 font-black text-white italic">{row.type}</td>
                  <td className="py-2.5 font-medium text-white/40">{row.single}</td>
                  <td className="py-2.5 font-medium text-white/40">{row.twin}</td>
                  <td className="py-2.5 font-black text-cyan-400">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.02] border-t border-white/5">
                <td colSpan={3} className="py-4 text-left pl-6 font-black text-white/30 uppercase text-[10px] tracking-widest">Global Aggregate</td>
                <td className="py-4 text-xl font-black text-white pr-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* COLUMN 2: RESULTS & ACTIONS */}
      <div className="md:col-span-4 flex flex-col space-y-4 mt-6 md:mt-0">
        
        {/* TERMINAL OUTPUT */}
        <div className="bg-black/90 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/10 min-h-[300px] md:min-h-[480px] max-h-[600px] overflow-y-auto custom-scrollbar shadow-2xl text-center relative flex flex-col items-center">
          <div className="sticky top-0 w-full flex justify-between items-center mb-4 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Matrix Output</span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{copiedIndex} / {resultList.length}</span>
          </div>
          
          <div className="text-cyan-400/90 font-mono text-[11px] md:text-[13px] font-bold break-all tracking-tight leading-relaxed py-4 w-full">
            {resultList.length > 0 ? (
              resultList.map((item, idx) => (
                <React.Fragment key={idx}>
                  <span className={idx < copiedIndex ? "text-emerald-500/30 line-through" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"}>{item}</span>
                  {idx < resultList.length - 1 && <span className="text-white/10 px-1 font-normal opacity-50">•</span>}
                </React.Fragment>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-20">
                <div className="w-12 h-12 border-2 border-dashed border-white rounded-full animate-spin"></div>
                <span className="text-[11px] uppercase font-black tracking-widest italic">Synchronizing Core...</span>
              </div>
            )}
          </div>
        </div>

        {/* COPY CONTROLS */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {/* COPY LIMIT SELECTOR */}
            <div className="flex gap-1 justify-center bg-white/5 p-1 rounded-xl border border-white/5">
              {copyLimits.map(limit => (
                <button 
                  key={limit} 
                  onClick={() => setCopyLimit(limit)}
                  className={`flex-1 py-1.5 text-[9px] font-black rounded-lg border transition-all ${copyLimit === limit ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-transparent border-transparent text-white/20 hover:text-white/40'}`}
                >
                  {limit}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleCopyNext} disabled={copiedIndex >= resultList.length || resultList.length === 0} className={`flex-[3] py-4 rounded-2xl font-black text-[11px] md:text-[12px] uppercase tracking-wider border transition-all transform active:scale-95 shadow-xl ${copiedIndex >= resultList.length && resultList.length > 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-500'}`}>
                {copiedIndex >= resultList.length && resultList.length > 0 ? '✓ SEQUENCE COMPLETE' : `COPY NEXT ${copyLimit} (${Math.min(copyLimit, resultList.length - copiedIndex)})`}
              </button>
              <button onClick={() => setCopiedIndex(0)} className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 active:scale-95 transition-all">RESET</button>
            </div>
          </div>
          <button onClick={handleCopyAll} disabled={resultList.length === 0} className="w-full py-5 rounded-2xl font-black text-[14px] md:text-[16px] tracking-[0.1em] transition-all bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-2xl active:scale-95 disabled:opacity-20 hover:brightness-110 flex items-center justify-center gap-2">
            {copyFeedback === 'COPIED ALL' ? '✓ All Copied to Clipboard' : 'Copy All'}
          </button>
        </div>
      </div>

      {/* COLUMN 3: BREAKDOWNS */}
      <div className="md:col-span-4 flex flex-col space-y-4 mt-6 md:mt-0">
        <div className="space-y-4">
          {/* SINGLE MODE BREAKDOWN */}
          <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-white/5 flex flex-col bg-white/[0.03] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Single Mode Breakdown</h4>
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
              </div>
              
              {/* PRICING & DISCOUNT PARAMETERS FOR SINGLE MODE */}
              <div className="space-y-3">
                {dimensions.map(dim => (
                  <div key={`s-row-${dim}`} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-[9px] font-black text-white/30 text-center italic">{dim} SGL</span>
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={singlePrices[dim]} onChange={(e) => setSinglePrices(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-[#05070a]/50 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-white outline-none focus:border-cyan-500/50" />
                      <span className="absolute -top-2 left-1 text-[7px] font-black text-white/20 uppercase">PRC</span>
                    </div>
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={discounts[dim].diskon} onChange={(e) => handleDiscountChange(dim, 'diskon', e.target.value)} className="w-full bg-blue-500/5 border border-blue-500/10 rounded-lg py-1 text-center text-[10px] font-black text-blue-400 outline-none focus:border-blue-500/50" />
                      <span className="absolute -top-2 left-1 text-[7px] font-black text-blue-500/40 uppercase">DSC%</span>
                    </div>
                    <div className="relative min-h-[1.5rem]">
                      {dim !== '5D' && (
                        <>
                          <input type="text" inputMode="decimal" value={discounts[dim].super} onChange={(e) => handleDiscountChange(dim, 'super', e.target.value)} className="w-full bg-orange-500/5 border border-orange-500/10 rounded-lg py-1 text-center text-[10px] font-black text-orange-400 outline-none focus:border-orange-500/50" />
                          <span className="absolute -top-2 left-1 text-[7px] font-black text-orange-400/40 uppercase">SPR%</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <table className="w-full text-[10px] md:text-[11px] text-center">
              <thead>
                <tr className="text-white/20 font-black uppercase border-b border-white/5 bg-black/10">
                  <th className="py-2">Mode</th>
                  <th className="py-2 text-red-500">FULL</th>
                  <th className="py-2 text-blue-500">DISK</th>
                  <th className="py-2 text-orange-500">SUPR</th>
                  <th className="py-2 text-white">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map(dim => {
                  const count = resultsByDim[dim].single.length;
                  if (!selectedDims.includes(dim) || !showSingle || count === 0) return null;
                  const b = calculateBreakdown(count, dim, 'single');
                  return (
                    <tr key={dim} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 font-black italic text-cyan-400">{dim}</td>
                      <td className="text-red-500/80 font-bold">{formatValue(b.full)}</td>
                      <td className="text-blue-500/80 font-bold">{formatValue(b.diskon)}</td>
                      <td className="text-orange-500/80 font-bold">{dim === '5D' ? '-' : formatValue(b.super)}</td>
                      <td className="font-black text-white">{formatValue(b.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* TWIN MODE BREAKDOWN */}
          <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-white/5 flex flex-col bg-white/[0.03] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Twin Mode Breakdown</h4>
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_orange]"></div>
              </div>

              {/* PRICING & DISCOUNT PARAMETERS FOR TWIN MODE */}
              <div className="space-y-3">
                {dimensions.map(dim => (
                  <div key={`t-row-${dim}`} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-[9px] font-black text-white/30 text-center italic">{dim} TWN</span>
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={twinPrices[dim]} onChange={(e) => setTwinPrices(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-[#05070a]/50 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-white outline-none focus:border-amber-500/50" />
                      <span className="absolute -top-2 left-1 text-[7px] font-black text-white/20 uppercase">PRC</span>
                    </div>
                    <div className="relative">
                      <input type="text" inputMode="decimal" value={discounts[dim].diskon} onChange={(e) => handleDiscountChange(dim, 'diskon', e.target.value)} className="w-full bg-blue-500/5 border border-blue-500/10 rounded-lg py-1 text-center text-[10px] font-black text-blue-400 outline-none focus:border-blue-500/50" />
                      <span className="absolute -top-2 left-1 text-[7px] font-black text-blue-500/40 uppercase">DSC%</span>
                    </div>
                    <div className="relative min-h-[1.5rem]">
                      {dim !== '5D' && (
                        <>
                          <input type="text" inputMode="decimal" value={discounts[dim].super} onChange={(e) => handleDiscountChange(dim, 'super', e.target.value)} className="w-full bg-orange-500/5 border border-orange-500/10 rounded-lg py-1 text-center text-[10px] font-black text-orange-400 outline-none focus:border-orange-500/50" />
                          <span className="absolute -top-2 left-1 text-[7px] font-black text-orange-400/40 uppercase">SPR%</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <table className="w-full text-[10px] md:text-[11px] text-center">
              <thead>
                <tr className="text-white/20 font-black uppercase border-b border-white/5 bg-black/10">
                  <th className="py-2">Mode</th>
                  <th className="py-2 text-red-500">FULL</th>
                  <th className="py-2 text-blue-500">DISK</th>
                  <th className="py-2 text-orange-500">SUPR</th>
                  <th className="py-2 text-white">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map(dim => {
                  const count = resultsByDim[dim].twin.length;
                  if (!selectedDims.includes(dim) || !showTwin || count === 0) return null;
                  const b = calculateBreakdown(count, dim, 'twin');
                  return (
                    <tr key={dim} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 font-black italic text-amber-400">{dim}</td>
                      <td className="text-red-500/80 font-bold">{formatValue(b.full)}</td>
                      <td className="text-blue-500/80 font-bold">{formatValue(b.diskon)}</td>
                      <td className="text-orange-500/80 font-bold">{dim === '5D' ? '-' : formatValue(b.super)}</td>
                      <td className="font-black text-white">{formatValue(b.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="md:hidden text-center pt-8 pb-4 opacity-10"><p className="text-[7px] text-white font-black uppercase tracking-[0.4em]">Integrated Logic Engine V10.0 (Global System)</p></footer>
    </div>
  );
};

export default BBFSCalculator;