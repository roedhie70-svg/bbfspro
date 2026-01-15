
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, SummaryRow, PriceConfig, DiscountConfig, DimensionDiscountConfig } from '../types';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];
const copyLimits = [25, 50, 100, 200, 400];

type HistoryFilterType = 'ALL' | 'IN_DB' | 'NOT_IN_DB';
const DB_STORAGE_KEY = 'bebiaks_db_v15';

const BBFSCalculator: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D', '5D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilterType>('ALL');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState(0);
  const [copyLimit, setCopyLimit] = useState(25);
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);

  const [singlePrices, setSinglePrices] = useState<PriceConfig>({ '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' });
  const [twinPrices, setTwinPrices] = useState<PriceConfig>({ '2D': '0.1', '3D': '0.1', '4D': '0.1', '5D': '0.1' });
  const [discounts, setDiscounts] = useState<DimensionDiscountConfig>({ 
    '2D': { diskon: '67', super: '34' }, '3D': { diskon: '67', super: '34' },
    '4D': { diskon: '67', super: '34' }, '5D': { diskon: '62', super: '0' } 
  });

  const getSig = (s: string) => s.split('').sort().join('');

  // SINKRONISASI DATABASE REAL-TIME
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DB_STORAGE_KEY) setDbRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const historySignatures = useMemo(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (!saved) return new Set<string>();
      const db = JSON.parse(saved);
      const sigs = new Set<string>();
      db.forEach((entry: any) => {
        if (entry.digits) sigs.add(getSig(entry.digits));
      });
      return sigs;
    } catch (e) { return new Set<string>(); }
  }, [dbRefreshTrigger, debouncedInput]);

  useEffect(() => {
    setIsCalculating(true);
    const handler = setTimeout(() => { setDebouncedInput(inputValue); setIsCalculating(false); }, 500);
    return () => clearTimeout(handler);
  }, [inputValue]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(() => setIsReady(true));
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  useEffect(() => { setCopiedIndex(0); }, [debouncedInput, selectedDims, showSingle, showTwin, historyFilter]);

  const toggleDim = (dim: Dimension) => {
    setSelectedDims(prev => prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]);
  };

  const handleClear = () => { setInputValue(''); setCopiedIndex(0); };

  const { uniqueDigits, repeatingDigits, counts } = useMemo(() => getDigitsData(debouncedInput), [debouncedInput]);

  const resultsByDim = useMemo(() => {
    const data: Record<Dimension, { single: string[], twin: string[] }> = {
      '2D': { single: [], twin: [] }, '3D': { single: [], twin: [] },
      '4D': { single: [], twin: [] }, '5D': { single: [], twin: [] },
    };
    dimensions.forEach(dim => {
      const k = parseInt(dim);
      data[dim].single = getSinglePermutations(uniqueDigits, k);
      data[dim].twin = getTwinPermutations(uniqueDigits, repeatingDigits, k, counts);
    });
    return data;
  }, [uniqueDigits, repeatingDigits, counts]);

  const applyHistoryFilter = useCallback((list: string[]) => {
    if (historyFilter === 'IN_DB') return list.filter(item => historySignatures.has(getSig(item)));
    if (historyFilter === 'NOT_IN_DB') return list.filter(item => !historySignatures.has(getSig(item)));
    return list;
  }, [historyFilter, historySignatures]);

  const summaryData: SummaryRow[] = useMemo(() => {
    return dimensions.map(dim => {
      const isDimSelected = selectedDims.includes(dim);
      const filteredSingle = applyHistoryFilter(resultsByDim[dim].single);
      const filteredTwin = applyHistoryFilter(resultsByDim[dim].twin);
      const singleCount = (isDimSelected && showSingle) ? filteredSingle.length : 0;
      const twinCount = (isDimSelected && showTwin) ? filteredTwin.length : 0;
      return { type: dim, single: singleCount, twin: twinCount, total: singleCount + twinCount };
    });
  }, [resultsByDim, selectedDims, showSingle, showTwin, applyHistoryFilter]);

  const resultList = useMemo(() => {
    let combined: string[] = [];
    selectedDims.forEach(dim => {
      if (showSingle) combined = [...combined, ...resultsByDim[dim].single];
      if (showTwin) combined = [...combined, ...resultsByDim[dim].twin];
    });
    return applyHistoryFilter(combined);
  }, [selectedDims, showSingle, showTwin, resultsByDim, applyHistoryFilter]);

  const handleCopyNext = useCallback(() => {
    if (resultList.length === 0 || copiedIndex >= resultList.length) return;
    const limit = copyLimit;
    const end = Math.min(copiedIndex + limit, resultList.length);
    const chunk = resultList.slice(copiedIndex, end);
    const textToCopy = chunk.join('*');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(end);
      setCopyFeedback(`COPY ${end}`);
      setTimeout(() => setCopyFeedback(null), 1500);
    });
  }, [resultList, copiedIndex, copyLimit]);

  const handleCopyAll = useCallback(() => {
    if (resultList.length === 0) return;
    const textToCopy = resultList.join('*');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(resultList.length);
      setCopyFeedback('COPIED ALL');
      setTimeout(() => setCopyFeedback(null), 1500);
    });
  }, [resultList]);

  const safeParse = (val: string | number): number => {
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(',', '.')) || 0;
  };

  const formatValue = (val: number) => new Intl.NumberFormat('id-ID').format(Math.round(val));

  const calculateBreakdown = (count: number, dim: Dimension, mode: 'single' | 'twin') => {
    const priceMap = mode === 'single' ? singlePrices : twinPrices;
    const priceNum = safeParse(priceMap[dim]);
    const base = count * priceNum * 1000;
    const dimDiscount = discounts[dim];
    const diskonVal = base * (safeParse(dimDiscount.diskon) / 100);
    const superVal = dim === '5D' ? 0 : base * (safeParse(dimDiscount.super) / 100);
    return { full: base, diskon: diskonVal, super: superVal, total: base + diskonVal + superVal };
  };

  const handleDiscountChange = (dim: Dimension, field: keyof DiscountConfig, value: string) => {
    setDiscounts(prev => ({ ...prev, [dim]: { ...prev[dim], [field]: value.replace(/[^0-9.,]/g, '') } }));
  };

  const BreakdownCard = ({ title, mode, prices, dotColor }: { title: string, mode: 'single' | 'twin', prices: PriceConfig, dotColor: string }) => (
    <div className="bg-[#0a0f18]/60 backdrop-blur-3xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-xl">
      <div className="px-4 py-3 border-b border-white/5 flex flex-col bg-white/[0.03] space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{title}</h4>
          <div className={`w-2 h-2 rounded-full ${dotColor} shadow-[0_0_10px_currentColor]`}></div>
        </div>
        <div className="space-y-3">
          {dimensions.map(dim => (
            <div key={`${mode}-row-${dim}`} className="grid grid-cols-4 gap-2 items-center">
              <span className="text-[9px] font-black text-white/30 text-center italic">{dim}</span>
              <input type="text" inputMode="decimal" value={prices[dim]} onChange={(e) => (mode === 'single' ? setSinglePrices : setTwinPrices)(prev => ({ ...prev, [dim]: e.target.value.replace(/[^0-9.,]/g, '') }))} className="w-full bg-[#05070a]/50 border border-white/10 rounded-lg py-1 text-center text-[10px] font-black text-white outline-none" />
              <input type="text" inputMode="decimal" value={discounts[dim].diskon} onChange={(e) => handleDiscountChange(dim, 'diskon', e.target.value)} className="w-full bg-blue-500/5 border border-blue-500/10 rounded-lg py-1 text-center text-[10px] font-black text-blue-400 outline-none" />
              <div className="min-h-[1.5rem]">{dim !== '5D' && <input type="text" inputMode="decimal" value={discounts[dim].super} onChange={(e) => handleDiscountChange(dim, 'super', e.target.value)} className="w-full bg-orange-500/5 border border-orange-500/10 rounded-lg py-1 text-center text-[10px] font-black text-orange-400 outline-none" />}</div>
            </div>
          ))}
        </div>
      </div>
      <table className="w-full text-[10px] text-center">
        <thead>
          <tr className="text-white/20 uppercase bg-black/10"><th className="py-2">Mode</th><th className="py-2">FULL</th><th className="py-2">DISK</th><th className="py-2">SUPR</th><th className="py-2">TOTAL</th></tr>
        </thead>
        <tbody>
          {dimensions.map(dim => {
            const rowData = summaryData.find(r => r.type === dim);
            const count = mode === 'single' ? (rowData?.single || 0) : (rowData?.twin || 0);
            if (!selectedDims.includes(dim) || (mode === 'single' ? !showSingle : !showTwin) || count === 0) return null;
            const b = calculateBreakdown(count, dim, mode);
            return (
              <tr key={dim} className="border-b border-white/[0.03]">
                <td className="py-2 font-black italic text-cyan-400">{dim}</td>
                <td>{formatValue(b.full)}</td><td>{formatValue(b.diskon)}</td><td>{dim === '5D' ? '-' : formatValue(b.super)}</td><td className="font-black">{formatValue(b.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full flex flex-col md:grid md:grid-cols-12 md:gap-8 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="md:col-span-4 flex flex-col space-y-4">
        <div className="flex justify-between items-center opacity-30 px-1">
          <div className="flex items-center gap-1">
            <div className={`w-1 h-1 rounded-full ${isReady ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[7px] font-black text-white/50 uppercase">Kernel: {isReady ? 'Active' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 py-4">
          <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-transparent rounded-xl rotate-45 border border-white/5 shadow-2xl">
            <svg viewBox="0 0 100 100" className="w-10 h-10 relative z-10 -rotate-45 overflow-visible">
              <path d="M12 22 V78 M12 22 Q44 22 44 38 Q44 50 24 50 M12 50 Q50 50 50 64 Q50 78 24 78" fill="none" stroke="white" strokeWidth="14" />
              <path d="M52 30 Q88 30 88 42 Q88 54 74 54 Q60 54 60 66 Q60 78 92 78" fill="none" stroke="#fbbf24" strokeWidth="14" />
            </svg>
          </div>
          <div className="flex flex-col"><h1 className="text-3xl font-black italic text-white leading-none">BeBiak’s<span className="text-amber-500 ml-1">Pro</span></h1><span className="text-[9px] text-white/40 tracking-[0.3em] uppercase italic">TLC Community</span></div>
        </div>
        <div className="bg-[#0a0f18]/80 backdrop-blur-3xl p-6 rounded-[1.5rem] border border-white/5 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.8em] italic">BBFS INPUT</span>
            <div className="relative">
              <input type="text" inputMode="numeric" value={inputValue} onChange={(e) => setInputValue(e.target.value.replace(/\D/g, '').slice(0, 15))} className="bg-transparent text-center text-3xl font-black outline-none text-white tracking-widest w-full placeholder-white/5" placeholder="0000" />
              {inputValue && <button onClick={handleClear} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg></button>}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {dimensions.map(dim => <button key={dim} onClick={() => toggleDim(dim)} className={`px-4 py-2 rounded-xl font-black text-[11px] border transition-all ${selectedDims.includes(dim) ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/5 text-white/40'}`}>{dim}</button>)}
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setShowSingle(!showSingle)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showSingle ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-white/5 text-white/20'}`}>Single</button>
              <button onClick={() => setShowTwin(!showTwin)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${showTwin ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-transparent border-white/5 text-white/20'}`}>Twin</button>
            </div>
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
              {['ALL', 'IN_DB', 'NOT_IN_DB'].map((f) => (
                <button key={f} onClick={() => setHistoryFilter(f as any)} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${historyFilter === f ? (f === 'IN_DB' ? 'bg-rose-500/20 text-rose-500 border-rose-500/40' : f === 'NOT_IN_DB' ? 'bg-cyan-500/20 text-cyan-500 border-cyan-500/40' : 'bg-white text-black border-white') : 'text-white/30 border-transparent hover:text-white/60'}`}>
                  {f === 'ALL' ? 'SEMUA' : f === 'IN_DB' ? 'DI DB' : 'FRESH'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="md:col-span-4 flex flex-col space-y-4">
        {/* RINGKASAN OUTPUT TABLE */}
        <div className="bg-[#0a0f18]/80 backdrop-blur-3xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl">
           <div className="p-3 bg-white/[0.03] border-b border-white/5 flex justify-between items-center">
             <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Ringkasan Output</h3>
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Live Analysis</span>
             </div>
           </div>
           <table className="w-full text-center">
             <thead>
               <tr className="text-[8px] text-white/20 uppercase bg-black/20 font-black">
                 <th className="py-3 px-2">Type</th>
                 <th className="py-3 px-2">Single</th>
                 <th className="py-3 px-2">Twin</th>
                 <th className="py-3 px-2 text-cyan-400">Total</th>
               </tr>
             </thead>
             <tbody className="text-[11px] font-black">
               {summaryData.map((row) => (
                 <tr key={row.type} className={`border-b border-white/[0.02] transition-colors ${row.total > 0 ? 'bg-white/[0.01]' : 'opacity-20'}`}>
                   <td className="py-3 text-white/40 italic">{row.type}</td>
                   <td className="py-3 text-white/80">{row.single}</td>
                   <td className="py-3 text-white/80">{row.twin}</td>
                   <td className="py-3 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{row.total}</td>
                 </tr>
               ))}
               <tr className="bg-cyan-500/5">
                 <td colSpan={3} className="py-4 text-[9px] text-white/30 uppercase text-right pr-4 tracking-widest font-black">Global Permutations:</td>
                 <td className="py-4 text-cyan-400 text-[14px] italic font-black">
                    {summaryData.reduce((acc, curr) => acc + curr.total, 0)}
                 </td>
               </tr>
             </tbody>
           </table>
        </div>

        <div className="bg-black/90 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/10 min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-hide shadow-2xl text-center relative flex flex-col items-center">
          <div className="sticky top-0 w-full flex justify-between items-center mb-4 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5 z-20">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Matrix Stream</span>
            <span className="text-[10px] font-black text-white/20">{copiedIndex} / {resultList.length}</span>
          </div>
          <div className="text-cyan-400 font-mono text-[12px] font-bold break-all leading-relaxed py-4 w-full">
            {resultList.length > 0 ? (
              resultList.slice(0, 1000).map((item, idx) => {
                const isHistoryMatch = historySignatures.has(getSig(item));
                return (
                  <React.Fragment key={idx}>
                    <span className={`${idx < copiedIndex ? "text-emerald-500/20 line-through" : ""} ${!(idx < copiedIndex) && isHistoryMatch ? "text-rose-500 drop-shadow-xl font-black scale-110 inline-block bg-rose-500/5 px-1 rounded" : "text-cyan-400/80"}`}>
                      {item}
                    </span>
                    {idx < resultList.length - 1 && <span className="text-white/5 px-0.5">•</span>}
                  </React.Fragment>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 italic uppercase tracking-widest font-black">Awaiting Input Pattern...</div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {copyLimits.map(l => <button key={l} onClick={() => setCopyLimit(l)} className={`flex-1 py-1.5 text-[9px] font-black rounded-lg border transition-all ${copyLimit === l ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg' : 'text-white/20 border-transparent'}`}>{l}</button>)}
          </div>
          <div className="flex gap-3">
            <button onClick={handleCopyNext} disabled={copiedIndex >= resultList.length || resultList.length === 0} className={`flex-[3] py-4 rounded-2xl font-black text-[12px] uppercase tracking-wider border transition-all active:scale-95 shadow-xl ${copiedIndex >= resultList.length && resultList.length > 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-cyan-600 text-white border-cyan-500'}`}>
              {copiedIndex >= resultList.length && resultList.length > 0 ? 'COMPLETE' : `COPY CHUNK ${copyLimit}`}
            </button>
            <button onClick={() => setCopiedIndex(0)} className="flex-1 py-4 rounded-2xl font-black text-[11px] border border-white/10 bg-white/5 text-white/40">RESET</button>
          </div>
          <button onClick={handleCopyAll} disabled={resultList.length === 0} className="w-full py-5 rounded-2xl font-black text-[14px] bg-gradient-to-r from-blue-700 to-indigo-900 text-white shadow-2xl uppercase tracking-widest italic">{copyFeedback === 'COPIED ALL' ? '✓ DONE' : 'COPY ALL MATRIX'}</button>
        </div>
      </div>
      <div className="md:col-span-4 flex flex-col space-y-4">
        <BreakdownCard title="SINGLE ANALYTICS" mode="single" prices={singlePrices} dotColor="bg-cyan-400" />
        <BreakdownCard title="TWIN ANALYTICS" mode="twin" prices={twinPrices} dotColor="bg-amber-500" />
      </div>
    </div>
  );
};

export default BBFSCalculator;
