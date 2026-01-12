import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow, PriceConfig, DiscountConfig, DimensionDiscountConfig } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];
const copyLimits = [25, 50, 100, 200, 400];

type AppMode = 'SINGLE' | 'MULTI';

const BBFSCalculator: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>('SINGLE');
  const [inputValue, setInputValue] = useState('');
  const [pInputs, setPInputs] = useState(['', '', '', '', '']); // P1 to P5
  
  const [debouncedInput, setDebouncedInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D', '5D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [copiedIndex, setCopiedIndex] = useState(0);
  const [copyLimit, setCopyLimit] = useState(25);

  const [singlePrices, setSinglePrices] = useState<PriceConfig>({ 
    '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' 
  });
  const [twinPrices, setTwinPrices] = useState<PriceConfig>({ 
    '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' 
  });

  const [discounts, setDiscounts] = useState<DimensionDiscountConfig>({ 
    '2D': { diskon: '67', super: '34' },
    '3D': { diskon: '67', super: '34' },
    '4D': { diskon: '67', super: '34' },
    '5D': { diskon: '62', super: '0' } 
  });

  // Sinkronisasi input berdasarkan mode
  useEffect(() => {
    if (activeMode === 'MULTI') {
      setInputValue(pInputs.join(''));
    }
  }, [pInputs, activeMode]);

  useEffect(() => {
    setIsCalculating(true);
    const handler = setTimeout(() => {
      setDebouncedInput(inputValue);
      setIsCalculating(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [inputValue]);

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
  }, [debouncedInput, selectedDims, showSingle, showTwin, activeMode]);

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
    if (activeMode === 'SINGLE') {
      setInputValue('');
    } else {
      setPInputs(['', '', '', '', '']);
    }
    setCopiedIndex(0);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handlePInputChange = (index: number, value: string) => {
    const newVal = value.replace(/\D/g, '').slice(0, 10);
    const nextInputs = [...pInputs];
    nextInputs[index] = newVal;
    setPInputs(nextInputs);
  };

  const { uniqueDigits, repeatingDigits, counts } = useMemo(() => getDigitsData(debouncedInput), [debouncedInput]);

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

  const copyProgress = resultList.length > 0 ? (copiedIndex / resultList.length) * 100 : 0;

  return (
    <div className="w-full flex flex-col md:grid md:grid-cols-12 md:gap-8 p-2 md:p-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* COLUMN 1: INPUT & ANALYTICS */}
      <div className="md:col-span-4 flex flex-col space-y-4">
        
        <div className="flex justify-between items-center opacity-30 px-1">
          <div className="flex items-center gap-1">
            <div className="relative w-1.5 h-1.5">
              <div className={`absolute inset-0 rounded-full blur-[2px] ${isReady ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div className={`relative w-full h-full rounded-full ${isReady ? 'bg-cyan-400' : 'bg-red-400'}`}></div>
            </div>
            <span className="text-[8px] font-black tracking-widest text-white/50 uppercase">Bebiaks Core v12.1 • {isReady ? 'Ready' : 'Offline'}</span>
          </div>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[7px] font-black text-cyan-400">INSTALL</button>
          )}
        </div>

        {/* LOGO AREA */}
        <div className="flex items-center gap-4 py-2 md:py-6 group">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl border border-white/5 rotate-45 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[0_0_30px_rgba(0,0,0,0.5)]"></div>
            <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12 relative z-10 overflow-visible drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <path d="M12 22 V78 M12 22 Q44 22 44 38 Q44 50 24 50 M12 50 Q50 50 50 64 Q50 78 24 78" fill="none" stroke="white" strokeWidth="14" strokeLinecap="round" />
              <path d="M52 30 Q88 30 88 42 Q88 54 74 54 Q60 54 60 66 Q60 78 92 78" fill="none" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-none">
            <h1 className="flex items-baseline mb-0.5">
              <span className="text-3xl md:text-4xl font-black tracking-tighter text-white italic">BeBiak’s</span>
              <span className="text-xl md:text-2xl font-black text-amber-500 italic ml-1">Pro</span>
            </h1>
            <span className="text-[9px] md:text-[11px] font-black text-white/30 tracking-[0.4em] uppercase italic">TLC Community</span>
          </div>
        </div>

        {/* MODE NAVIGATOR (Updated Names) */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => { setActiveMode('SINGLE'); handleClear(); }}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeMode === 'SINGLE' ? 'bg-cyan-500 text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            BBFS
          </button>
          <button 
            onClick={() => { setActiveMode('MULTI'); handleClear(); }}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeMode === 'MULTI' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            POLTAR
          </button>
        </div>

        {/* INPUT BOX */}
        <div className="bg-[#0a0f18]/90 backdrop-blur-3xl p-5 md:p-7 rounded-[2rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            {activeMode === 'SINGLE' ? (
              <div className="text-center space-y-2">
                <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[1em] italic ml-4">INPUT BBFS</span>
                <div className="relative group">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 15))} 
                    className="bg-transparent text-center text-3xl md:text-4xl font-black outline-none text-white tracking-[0.15em] w-full placeholder-white/5 py-2" 
                    placeholder="DIGITS" 
                  />
                  {inputValue && <button onClick={handleClear} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-red-500 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] italic">POLTAR ENGINE</span>
                  <button onClick={handleClear} className="text-[8px] font-black text-red-500/50 hover:text-red-500">CLEAR ALL</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {pInputs.map((val, idx) => (
                    <div key={idx} className={`relative group ${idx === 4 ? 'col-span-2' : ''}`}>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={val}
                        onChange={(e) => handlePInputChange(idx, e.target.value)}
                        placeholder="0123456789"
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 pl-10 text-[14px] font-black text-white outline-none focus:border-amber-500/50 transition-all"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500/50">P{idx+1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {dimensions.map(dim => (
              <button key={dim} onClick={() => toggleDim(dim)} className={`py-2.5 rounded-xl font-black text-[11px] transition-all border ${selectedDims.includes(dim) ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}>{dim}</button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowSingle(!showSingle)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showSingle ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]' : 'bg-transparent border-white/5 text-white/20'}`}>Single</button>
            <button onClick={() => setShowTwin(!showTwin)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showTwin ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]' : 'bg-transparent border-white/5 text-white/20'}`}>Twin</button>
          </div>
        </div>

        {/* STATS TABLE */}
        <div className="bg-[#0a0f18]/50 backdrop-blur-2xl rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Matrix Analytics</h3>
            <span className="text-[10px] font-black text-cyan-500/50 uppercase tracking-widest">{inputValue.length} Digits Detected</span>
          </div>
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-[9px] text-white/20 font-black uppercase bg-black/40">
                <th className="py-4 pl-6 text-left">Mode</th><th className="py-4">Single</th><th className="py-4">Twin</th><th className="py-4 pr-6 text-right">Sum</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {summaryData.map((row) => (
                <tr key={row.type} className={`transition-all border-b border-white/[0.02] ${selectedDims.includes(row.type) ? 'bg-white/[0.02]' : 'opacity-10 scale-[0.98]'}`}>
                  <td className="py-3 pl-6 text-left font-black text-white italic">{row.type} Matrix</td>
                  <td className="py-3 font-medium text-white/50">{row.single}</td>
                  <td className="py-3 font-medium text-white/50">{row.twin}</td>
                  <td className="py-3 pr-6 text-right font-black text-cyan-400">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.04]">
                <td colSpan={3} className="py-5 text-left pl-6 font-black text-white/30 uppercase text-[10px] tracking-[0.3em]">Aggregate Output</td>
                <td className="py-5 text-2xl font-black text-white pr-6 text-right drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* COLUMN 2: TERMINAL & ACTIONS */}
      <div className="md:col-span-4 flex flex-col space-y-4 mt-6 md:mt-0">
        
        {/* TERMINAL BOX */}
        <div className="bg-black/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 min-h-[400px] md:min-h-[520px] max-h-[600px] shadow-2xl flex flex-col relative group overflow-hidden">
          <div className="sticky top-0 w-full flex justify-between items-center px-6 py-4 bg-black/60 backdrop-blur-md border-b border-white/5 z-20">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
              </div>
              <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.3em] italic ml-2">Console Output</span>
            </div>
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-black text-white/20 uppercase">{copiedIndex} / {resultList.length}</span>
              <div className="w-16 h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${copyProgress}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 text-center scroll-smooth">
            <div className="text-cyan-400/80 font-mono text-[13px] md:text-[14px] font-bold break-all tracking-wider leading-relaxed py-2 w-full">
              {resultList.length > 0 ? (
                <>
                  {resultList.slice(0, 1000).map((item, idx) => (
                    <React.Fragment key={idx}>
                      <span className={idx < copiedIndex ? "text-white/10 line-through" : "text-cyan-400 hover:text-white transition-colors cursor-default"}>{item}</span>
                      {idx < Math.min(resultList.length, 1000) - 1 && <span className="text-white/5 px-1.5 font-normal">•</span>}
                    </React.Fragment>
                  ))}
                  {resultList.length > 1000 && (
                    <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-white/20 font-black uppercase tracking-widest italic animate-pulse">
                      Matrix buffer full. {resultList.length - 1000} sequences pending...
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-20">
                  <div className="w-14 h-14 border-2 border-dashed border-white/40 rounded-full animate-spin"></div>
                  <span className="text-[11px] uppercase font-black tracking-[0.4em] italic">{isCalculating ? 'Computing Data...' : 'Kernel Idle'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COPY INTERFACE (Minimalist Update) */}
        <div className="space-y-2">
          <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
            {copyLimits.map(limit => (
              <button 
                key={limit} 
                onClick={() => setCopyLimit(limit)}
                className={`flex-1 py-1 text-[9px] font-black rounded-lg border transition-all ${copyLimit === limit ? 'bg-cyan-500 border-cyan-400 text-black shadow-md' : 'bg-transparent border-transparent text-white/20 hover:text-white/40'}`}
              >
                {limit}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCopyNext} 
              disabled={copiedIndex >= resultList.length || resultList.length === 0 || isCalculating} 
              className={`flex-[3] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest border transition-all transform active:scale-95 shadow-xl relative overflow-hidden ${copiedIndex >= resultList.length && resultList.length > 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-500 disabled:opacity-30'}`}
            >
              {copiedIndex >= resultList.length && resultList.length > 0 ? '✓ COMPLETED' : `Copy Next ${Math.min(copyLimit, resultList.length - copiedIndex)}`}
            </button>
            <button onClick={() => setCopiedIndex(0)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider border border-white/10 bg-white/5 text-white/30 hover:bg-white/10 active:scale-95 transition-all">Reset</button>
          </div>

          <button onClick={handleCopyAll} disabled={resultList.length === 0 || isCalculating} className="w-full py-4 rounded-xl font-black text-[14px] tracking-[0.2em] transition-all bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg active:scale-95 disabled:opacity-20 hover:brightness-110 flex items-center justify-center gap-3">
            {copyFeedback === 'COPIED ALL' ? '✓ ALL COPIED' : 'Copy All Matrix'}
          </button>
        </div>
      </div>

      {/* COLUMN 3: COST CALCULATION */}
      <div className="md:col-span-4 flex flex-col space-y-4 mt-6 md:mt-0">
        <div className="space-y-4">
          
          {/* SINGLE TABLE */}
          <div className="bg-[#0a0f18]/80 backdrop-blur-3xl rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-white/5 bg-cyan-500/[0.02] flex justify-between items-center">
              <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em]">Single Breakdown</h4>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_12px_cyan]"></div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2.5">
                {dimensions.map(dim => (
                  <div key={`s-inp-${dim}`} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-[9px] font-black text-white/30 text-center italic">{dim}</span>
                    <div className="relative"><input type="text" inputMode="decimal" value={singlePrices[dim]} onChange={(e) => setSinglePrices(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-white outline-none focus:border-cyan-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-white/20">PRC</span></div>
                    <div className="relative"><input type="text" inputMode="decimal" value={discounts[dim].diskon} onChange={(e) => handleDiscountChange(dim, 'diskon', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-blue-400 outline-none focus:border-blue-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-blue-500/40">DSC</span></div>
                    <div className="relative">{dim !== '5D' && <><input type="text" inputMode="decimal" value={discounts[dim].super} onChange={(e) => handleDiscountChange(dim, 'super', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-orange-400 outline-none focus:border-orange-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-orange-400/40">SPR</span></>}</div>
                  </div>
                ))}
              </div>

              <table className="w-full text-[11px] text-center mt-2">
                <thead>
                  <tr className="text-white/20 font-black uppercase border-b border-white/5 bg-black/20">
                    <th className="py-2.5">Mode</th><th className="py-2.5 text-red-500">Full</th><th className="py-2.5 text-blue-500">Disk</th><th className="py-2.5 text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map(dim => {
                    const count = resultsByDim[dim].single.length;
                    if (!selectedDims.includes(dim) || !showSingle || count === 0) return null;
                    const b = calculateBreakdown(count, dim, 'single');
                    return (
                      <tr key={dim} className="border-b border-white/[0.03] bg-white/[0.01]">
                        <td className="py-3 font-black italic text-cyan-400">{dim}</td>
                        <td className="text-red-500/80 font-bold">{formatValue(b.full)}</td>
                        <td className="text-blue-500/80 font-bold">{formatValue(b.diskon)}</td>
                        <td className="font-black text-white">{formatValue(b.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TWIN TABLE */}
          <div className="bg-[#0a0f18]/80 backdrop-blur-3xl rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-white/5 bg-amber-500/[0.02] flex justify-between items-center">
              <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em]">Twin Breakdown</h4>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_orange]"></div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2.5">
                {dimensions.map(dim => (
                  <div key={`t-inp-${dim}`} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-[9px] font-black text-white/30 text-center italic">{dim}</span>
                    <div className="relative"><input type="text" inputMode="decimal" value={twinPrices[dim]} onChange={(e) => setTwinPrices(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-white outline-none focus:border-amber-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-white/20">PRC</span></div>
                    <div className="relative"><input type="text" inputMode="decimal" value={discounts[dim].diskon} onChange={(e) => handleDiscountChange(dim, 'diskon', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-blue-400 outline-none focus:border-blue-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-blue-500/40">DSC</span></div>
                    <div className="relative">{dim !== '5D' && <><input type="text" inputMode="decimal" value={discounts[dim].super} onChange={(e) => handleDiscountChange(dim, 'super', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-orange-400 outline-none focus:border-orange-500/50" /><span className="absolute -top-1.5 left-1 text-[6px] font-black text-orange-400/40">SPR</span></>}</div>
                  </div>
                ))}
              </div>

              <table className="w-full text-[11px] text-center mt-2">
                <thead>
                  <tr className="text-white/20 font-black uppercase border-b border-white/5 bg-black/20">
                    <th className="py-2.5">Mode</th><th className="py-2.5 text-red-500">Full</th><th className="py-2.5 text-blue-500">Disk</th><th className="py-2.5 text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensions.map(dim => {
                    const count = resultsByDim[dim].twin.length;
                    if (!selectedDims.includes(dim) || !showTwin || count === 0) return null;
                    const b = calculateBreakdown(count, dim, 'twin');
                    return (
                      <tr key={dim} className="border-b border-white/[0.03] bg-white/[0.01]">
                        <td className="py-3 font-black italic text-amber-400">{dim}</td>
                        <td className="text-red-500/80 font-bold">{formatValue(b.full)}</td>
                        <td className="text-blue-500/80 font-bold">{formatValue(b.diskon)}</td>
                        <td className="font-black text-white">{formatValue(b.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer className="md:hidden text-center pt-10 pb-6 opacity-20"><p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">System Kernel v12.1 • Multi-Channel Logic</p></footer>
    </div>
  );
};

export default BBFSCalculator;