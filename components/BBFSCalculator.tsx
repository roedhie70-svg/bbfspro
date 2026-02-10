
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';
import { Dimension, PriceConfig, PriceDetail, BBFSEntry as BBFSEntryType } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const dimensions: Dimension[] = ['2D', '3D', '4D', '5D'];
type HistoryFilterType = 'ALL' | 'IN DB' | 'FRESH';
type CalcMode = 'BBFS' | 'POLTAR';

const DB_STORAGE_KEY = 'bebiaks_db_v15';

interface BBFSEntry extends BBFSEntryType {}

// Master Data Top Rankings (Reference)
const BBFS_TOP_RANKINGS_BASE = [
  { digits: "1259", qty: 11 }, { digits: "0269", qty: 10 }, { digits: "3458", qty: 10 }, { digits: "0234", qty: 9 },
  { digits: "0238", qty: 8 }, { digits: "0278", qty: 8 }, { digits: "0568", qty: 8 }, { digits: "1128", qty: 8 },
  { digits: "1236", qty: 8 }, { digits: "1289", qty: 8 }, { digits: "1456", qty: 8 }, { digits: "1569", qty: 8 },
  { digits: "1579", qty: 8 }, { digits: "3689", qty: 8 }, { digits: "4679", qty: 8 }, { digits: "5689", qty: 8 },
  { digits: "0129", qty: 7 }, { digits: "0135", qty: 7 }, { digits: "0147", qty: 7 }, { digits: "1235", qty: 7 },
  { digits: "1347", qty: 7 }, { digits: "1357", qty: 7 }, { digits: "1378", qty: 7 }, { digits: "2347", qty: 7 },
  { digits: "2579", qty: 7 }, { digits: "3557", qty: 7 }, { digits: "3678", qty: 7 }, { digits: "0134", qty: 6 },
  { digits: "0149", qty: 6 }, { digits: "0158", qty: 6 }, { digits: "0159", qty: 6 }, { digits: "0178", qty: 6 },
  { digits: "0189", qty: 6 }, { digits: "0239", qty: 6 }, { digits: "0359", qty: 6 }, { digits: "0379", qty: 6 },
  { digits: "0459", qty: 6 }, { digits: "0469", qty: 6 }, { digits: "0566", qty: 6 }, { digits: "0579", qty: 6 },
  { digits: "0678", qty: 6 }, { digits: "1267", qty: 6 }, { digits: "1349", qty: 6 }, { digits: "1379", qty: 6 },
  { digits: "1688", qty: 6 }, { digits: "2356", qty: 6 }, { digits: "3468", qty: 6 }, { digits: "3569", qty: 6 },
  { digits: "3679", qty: 6 }, { digits: "3789", qty: 6 }, { digits: "4579", qty: 6 }, { digits: "4589", qty: 6 },
  { digits: "4789", qty: 6 }, { digits: "0125", qty: 5 }, { digits: "0236", qty: 5 }, { digits: "0245", qty: 5 },
  { digits: "0256", qty: 5 }, { digits: "0258", qty: 5 }, { digits: "0345", qty: 5 }, { digits: "0349", qty: 5 },
  { digits: "0368", qty: 5 }, { digits: "1178", qty: 5 }, { digits: "1226", qty: 5 }, { digits: "1238", qty: 5 },
  { digits: "1246", qty: 5 }, { digits: "1256", qty: 5 }, { digits: "1345", qty: 5 }, { digits: "1348", qty: 5 },
  { digits: "1368", qty: 5 }, { digits: "1369", qty: 5 }, { digits: "1689", qty: 5 }, { digits: "2279", qty: 5 },
  { digits: "2299", qty: 5 }, { digits: "2379", qty: 5 }, { digits: "2457", qty: 5 }, { digits: "2468", qty: 5 },
  { digits: "2889", qty: 5 }, { digits: "3448", qty: 5 }, { digits: "3556", qty: 5 }, { digits: "3899", qty: 5 },
  { digits: "4568", qty: 5 }, { digits: "4667", qty: 5 }, { digits: "5568", qty: 5 }, { digits: "0027", qty: 4 },
  { digits: "0078", qty: 4 }, { digits: "0224", qty: 4 }, { digits: "0248", qty: 4 }, { digits: "0458", qty: 4 },
  { digits: "0468", qty: 4 }, { digits: "1346", qty: 4 }, { digits: "1377", qty: 4 }, { digits: "1457", qty: 4 },
  { digits: "2338", qty: 4 }, { digits: "2349", qty: 4 }, { digits: "2699", qty: 4 }, { digits: "3345", qty: 4 },
  { digits: "3457", qty: 4 }, { digits: "5788", qty: 4 }
];

const BBFSCalculator: React.FC = () => {
  const [calcMode, setCalcMode] = useState<CalcMode>('BBFS');
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(0);
  const [copyLimit, setCopyLimit] = useState(25);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilterType>('ALL');
  
  const [showSmall, setShowSmall] = useState(true);
  const [showMix, setShowMix] = useState(true);
  const [showLarge, setShowLarge] = useState(true);

  const [selectedDims, setSelectedDims] = useState<Dimension[]>(['2D', '3D', '4D', '5D']);
  const [showSingle, setShowSingle] = useState(true);
  const [showTwin, setShowTwin] = useState(true);
  const [showTwinPlus, setShowTwinPlus] = useState(true);

  const [inputValue, setInputValue] = useState('');
  const [calculatedDigits, setCalculatedDigits] = useState('');

  const [poltarInputs, setPoltarInputs] = useState({ p1: '', p2: '', p3: '', p4: '', p5: '' });
  const [activePoltar, setActivePoltar] = useState({ p1: '', p2: '', p3: '', p4: '', p5: '' });

  const initialPriceDetail: PriceDetail = { full: '0.1', diskon: '0.1', super: '0.1' };
  const [singlePrices, setSinglePrices] = useState<PriceConfig>({
    '2D': { ...initialPriceDetail }, '3D': { ...initialPriceDetail },
    '4D': { ...initialPriceDetail }, '5D': { ...initialPriceDetail }
  });
  const [twinPrices, setTwinPrices] = useState<PriceConfig>({
    '2D': { ...initialPriceDetail }, '3D': { ...initialPriceDetail },
    '4D': { ...initialPriceDetail }, '5D': { ...initialPriceDetail }
  });
  const [twinPlusPrices, setTwinPlusPrices] = useState<PriceConfig>({
    '2D': { ...initialPriceDetail }, '3D': { ...initialPriceDetail },
    '4D': { ...initialPriceDetail }, '5D': { ...initialPriceDetail }
  });

  const discounts = useMemo(() => ({ 
    '2D': { full: 1.00, diskon: 0.67, super: 0.34 }, 
    '3D': { full: 1.00, diskon: 0.67, super: 0.34 },
    '4D': { full: 1.00, diskon: 0.67, super: 0.34 }, 
    '5D': { full: 1.00, diskon: 0.62, super: 0.34 } 
  }), []);

  const getSig = useCallback((s: string) => s.split('').sort().join(''), []);

  useEffect(() => {
    const handleStorageChange = () => setDbRefreshTrigger(Date.now());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const historyEntries = useMemo<BBFSEntry[]>(() => {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      const local = saved ? JSON.parse(saved) : [];
      return [...(Array.isArray(local) ? local : []), ...SYSTEM_BASELINE];
    } catch { return SYSTEM_BASELINE; }
  }, [dbRefreshTrigger]);

  // THRESHOLD FILTER: Hanya data sejak 1 Februari 2026
  const febThreshold = useMemo(() => new Date('2026-02-01').getTime(), []);

  // Signatures for FILTER & COLORING (Start from Feb 2026)
  const historySignatures = useMemo<Set<string>>(() => {
    const sigs = new Set<string>();
    historyEntries.forEach((entry: BBFSEntry) => {
      const entryTime = new Date(entry.date).getTime();
      if (entryTime >= febThreshold && entry.result) {
        const res = entry.result;
        // Collect signatures for all dimension layers of the result (2D, 3D, 4D, 5D)
        for (let len = 2; len <= res.length; len++) {
          sigs.add(getSig(res.slice(-len)));
        }
      }
    });
    return sigs;
  }, [historyEntries, febThreshold, getSig]);

  const handleGenerateBBFS = () => {
    setCalculatedDigits(inputValue);
    setCalcMode('BBFS');
    setCopiedIndex(0);
  };

  const handleGeneratePoltar = () => {
    setActivePoltar({ ...poltarInputs });
    setCalcMode('POLTAR');
    setCopiedIndex(0);
  };

  const { uniqueDigits, repeatingDigits, counts } = useMemo(() => getDigitsData(calculatedDigits), [calculatedDigits]);

  const bbfsResultsByDim = useMemo(() => {
    const data: Record<Dimension, { single: string[], twin: string[], twinPlus: string[] }> = {
      '2D': { single: [], twin: [], twinPlus: [] }, '3D': { single: [], twin: [], twinPlus: [] },
      '4D': { single: [], twin: [], twinPlus: [] }, '5D': { single: [], twin: [], twinPlus: [] },
    };
    if (calculatedDigits.length < 2) return data;
    dimensions.forEach(dim => {
      const k = parseInt(dim);
      data[dim].single = getSinglePermutations(uniqueDigits, k);
      const allRepeats = getTwinPermutations(uniqueDigits, repeatingDigits, k, counts);
      
      allRepeats.forEach(res => {
        const setSize = new Set(res.split('')).size;
        if (setSize === k - 1) data[dim].twin.push(res);
        else if (setSize < k - 1) data[dim].twinPlus.push(res);
      });
    });
    return data;
  }, [uniqueDigits, repeatingDigits, counts, calculatedDigits]);

  const poltarResultsByDim = useMemo(() => {
    const data: Record<Dimension, string[]> = { '2D': [], '3D': [], '4D': [], '5D': [] };
    const p1 = activePoltar.p1.split('');
    const p2 = activePoltar.p2.split('');
    const p3 = activePoltar.p3.split('');
    const p4 = activePoltar.p4.split('');
    const p5 = activePoltar.p5.split('');
    if (p1.length && p2.length && p3.length && p4.length && p5.length) {
      for (const v1 of p1) for (const v2 of p2) for (const v3 of p3) for (const v4 of p4) for (const v5 of p5)
        data['5D'].push(v1 + v2 + v3 + v4 + v5);
    }
    if (p2.length && p3.length && p4.length && p5.length) {
      for (const v2 of p2) for (const v3 of p3) for (const v4 of p4) for (const v5 of p5)
        data['4D'].push(v2 + v3 + v4 + v5);
    }
    if (p3.length && p4.length && p5.length) {
      for (const v3 of p3) for (const v4 of p4) for (const v5 of p5)
        data['3D'].push(v3 + v4 + v5);
    }
    if (p4.length && p5.length) {
      for (const v4 of p4) for (const v5 of p5)
        data['2D'].push(v4 + v5);
    }
    return data;
  }, [activePoltar]);

  const analyzedResults = useMemo(() => {
    if (calcMode === 'BBFS') return bbfsResultsByDim;
    const data: Record<Dimension, { single: string[], twin: string[], twinPlus: string[] }> = {
      '2D': { single: [], twin: [], twinPlus: [] }, '3D': { single: [], twin: [], twinPlus: [] },
      '4D': { single: [], twin: [], twinPlus: [] }, '5D': { single: [], twin: [], twinPlus: [] },
    };
    dimensions.forEach(dim => {
      const k = parseInt(dim);
      (poltarResultsByDim[dim] || []).forEach(res => {
        const setSize = new Set(res.split('')).size;
        if (setSize === k) data[dim].single.push(res);
        else if (setSize === k - 1) data[dim].twin.push(res);
        else if (setSize < k - 1) data[dim].twinPlus.push(res);
      });
    });
    return data;
  }, [calcMode, bbfsResultsByDim, poltarResultsByDim]);

  const applyUniversalFilter = useCallback((list: string[]) => {
    return list.filter(item => {
      const setSize = new Set(item.split('')).size;
      const k = item.length;
      const isSingle = setSize === k;
      const isTwin = setSize === k - 1;
      const isTwinPlus = setSize < k - 1;

      let typeMatch = false;
      if (showSingle && isSingle) typeMatch = true;
      if (showTwin && isTwin) typeMatch = true;
      if (showTwinPlus && isTwinPlus) typeMatch = true;
      if (!typeMatch) return false;

      const digits = item.split('').map(Number);
      const allSmall = digits.every(d => d >= 0 && d <= 4);
      const allLarge = digits.every(d => d >= 5 && d <= 9);
      const isMix = !allSmall && !allLarge;

      let sizeMatch = false;
      if (showSmall && allSmall) sizeMatch = true;
      if (showMix && isMix) sizeMatch = true;
      if (showLarge && allLarge) sizeMatch = true;
      if (!sizeMatch) return false;

      const sig = getSig(item);
      if (historyFilter === 'IN DB') {
        if (!historySignatures.has(sig)) return false;
      } else if (historyFilter === 'FRESH') {
        if (historySignatures.has(sig)) return false;
      }
      return true;
    });
  }, [showSingle, showTwin, showTwinPlus, showSmall, showMix, showLarge, historyFilter, historySignatures, getSig]);

  const filteredResultsByDim = useMemo(() => {
    const data: Record<Dimension, { single: string[], twin: string[], twinPlus: string[] }> = {
      '2D': { single: [], twin: [], twinPlus: [] },
      '3D': { single: [], twin: [], twinPlus: [] },
      '4D': { single: [], twin: [], twinPlus: [] },
      '5D': { single: [], twin: [], twinPlus: [] },
    };
    dimensions.forEach(dim => {
      data[dim].single = applyUniversalFilter(analyzedResults[dim].single);
      data[dim].twin = applyUniversalFilter(analyzedResults[dim].twin);
      data[dim].twinPlus = applyUniversalFilter(analyzedResults[dim].twinPlus);
    });
    return data;
  }, [analyzedResults, applyUniversalFilter]);

  const resultList = useMemo(() => {
    let combined: string[] = [];
    dimensions.forEach(dim => {
      if (selectedDims.includes(dim)) {
        combined = combined.concat(filteredResultsByDim[dim].single);
        combined = combined.concat(filteredResultsByDim[dim].twin);
        combined = combined.concat(filteredResultsByDim[dim].twinPlus);
      }
    });
    return combined;
  }, [filteredResultsByDim, selectedDims]);

  const handleCopy = (amt: number) => {
    if (resultList.length === 0) return;
    const end = Math.min(copiedIndex + amt, resultList.length);
    const chunk = resultList.slice(copiedIndex, end);
    navigator.clipboard.writeText(chunk.join('*')).then(() => setCopiedIndex(end));
  };

  const handleCopyAll = () => {
    if (resultList.length === 0) return;
    navigator.clipboard.writeText(resultList.join('*')).then(() => setCopiedIndex(resultList.length));
  };

  const getCost = (dim: Dimension, mode: 'SGL' | 'TWN' | 'TWN+', type: keyof PriceDetail) => {
    // FIX: Hanya hitung jika dimensi dipilih di selectedDims
    if (!selectedDims.includes(dim)) return "0.000";

    const qty = mode === 'SGL' ? filteredResultsByDim[dim].single.length 
              : mode === 'TWN' ? filteredResultsByDim[dim].twin.length 
              : filteredResultsByDim[dim].twinPlus.length;
    const priceStr = mode === 'SGL' ? singlePrices[dim][type] 
                   : mode === 'TWN' ? twinPrices[dim][type]
                   : twinPlusPrices[dim][type];
    const price = parseFloat(priceStr.toString()) || 0;
    const disc = (discounts as any)[dim][type] || 1;
    return (qty * price * disc).toFixed(3);
  };

  const updatePrice = (dim: Dimension, mode: 'SGL' | 'TWN' | 'TWN+', type: keyof PriceDetail, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    if (mode === 'SGL') setSinglePrices(prev => ({ ...prev, [dim]: { ...prev[dim], [type]: cleaned } }));
    else if (mode === 'TWN') setTwinPrices(prev => ({ ...prev, [dim]: { ...prev[dim], [type]: cleaned } }));
    else setTwinPlusPrices(prev => ({ ...prev, [dim]: { ...prev[dim], [type]: cleaned } }));
  };

  const toggleDim = (dim: Dimension) => {
    setSelectedDims(prev => prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col space-y-4 animate-in fade-in duration-500 pb-20 px-2">
      
      {/* INPUT PANEL */}
      <div className="bg-[#0b1018]/60 p-5 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
             <span className="text-white font-black text-lg italic">B2</span>
           </div>
           <div>
             <h1 className="text-lg font-black italic text-white leading-none">BeBiak’s<span className="text-orange-500 ml-1">Pro</span></h1>
             <span className="text-[7px] text-white/30 tracking-[0.4em] uppercase font-bold">TLC COMMUNITY</span>
           </div>
        </div>
        <div className="text-center">
           <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.5em] italic opacity-60">BBFS INPUT</span>
           <div className="relative mt-1">
             <input type="text" inputMode="numeric" value={inputValue} placeholder="INPUT ANGKA..." onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))} className="bg-transparent text-center text-2xl font-black text-white w-full outline-none tracking-widest placeholder:text-white/5" />
             <button onClick={() => setInputValue('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-all">✕</button>
           </div>
        </div>
        <button onClick={handleGenerateBBFS} className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.4em] border transition-all italic active:scale-95 ${calcMode === 'BBFS' ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'}`}>GENERATE BBFS</button>
      </div>

      {/* POLTAR PANEL */}
      <div className="bg-[#0b1018]/80 p-5 rounded-[2rem] border border-white/10 space-y-4 shadow-xl">
         <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] italic opacity-60">POLTAR 5-POS</span>
            <button onClick={() => setPoltarInputs({ p1: '', p2: '', p3: '', p4: '', p5: '' })} className="text-[7px] font-black text-white/20 hover:text-white/60 uppercase">Reset</button>
         </div>
         <div className="flex flex-col gap-1.5">
            {['p1', 'p2', 'p3', 'p4', 'p5'].map((pos) => (
              <div key={pos} className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-1.5 group focus-within:border-indigo-500/30 transition-all">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest w-6 group-focus-within:text-indigo-400">{pos}</span>
                <input type="text" inputMode="numeric" placeholder="INPUT ANGKA..." value={(poltarInputs as any)[pos]} onChange={(e) => setPoltarInputs(p => ({ ...p, [pos]: e.target.value.replace(/\D/g, '') }))} className="flex-1 bg-transparent py-1 text-left text-[14px] font-black text-indigo-400 outline-none transition-all tracking-[0.3em] placeholder:text-white/5 placeholder:tracking-normal placeholder:text-[9px]" />
              </div>
            ))}
         </div>
         <button onClick={handleGeneratePoltar} className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.4em] border transition-all italic active:scale-95 ${calcMode === 'POLTAR' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'}`}>GENERATE POLTAR</button>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-[#0b1018]/90 p-5 rounded-[2rem] border border-white/10 space-y-3 shadow-xl">
         <div className="grid grid-cols-4 gap-2">
           {dimensions.map(dim => (
             <button key={dim} onClick={() => toggleDim(dim)} className={`py-2.5 rounded-xl font-black text-[11px] border transition-all ${selectedDims.includes(dim) ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/5 text-white/20'}`}>{dim}</button>
           ))}
         </div>
         
         <div className="flex gap-2">
           <button onClick={() => setShowSingle(!showSingle)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showSingle ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-transparent border-white/5 text-white/10'}`}>SINGLE</button>
           <button onClick={() => setShowTwin(!showTwin)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showTwin ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-transparent border-white/5 text-white/10'}`}>TWIN</button>
           <button onClick={() => setShowTwinPlus(!showTwinPlus)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showTwinPlus ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'bg-transparent border-white/5 text-white/10'}`}>TWIN+</button>
         </div>

         <div className="flex gap-2 border-t border-white/5 pt-3">
           <button onClick={() => setShowSmall(!showSmall)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showSmall ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-transparent border-white/5 text-white/10'}`}>SMALL</button>
           <button onClick={() => setShowMix(!showMix)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showMix ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-transparent border-white/5 text-white/10'}`}>MIX</button>
           <button onClick={() => setShowLarge(!showLarge)} className={`flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase border transition-all ${showLarge ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-transparent border-white/5 text-white/10'}`}>LARGE</button>
         </div>

         <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mt-2">
           {['ALL', 'IN DB', 'FRESH'].map((lbl) => (
             <button key={lbl} onClick={() => setHistoryFilter(lbl as HistoryFilterType)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === lbl ? 'bg-white text-black shadow-md' : 'text-white/20 hover:text-white/40'}`}>{lbl}</button>
           ))}
         </div>
      </div>

      {/* MATRIX STREAM PANEL */}
      <div className="bg-[#05080d] p-5 rounded-[2.5rem] border border-white/10 h-[400px] flex flex-col shadow-2xl relative">
         <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${calcMode === 'BBFS' ? 'bg-cyan-400 shadow-cyan-400' : 'bg-indigo-400 shadow-indigo-400'}`}></div>
              <h3 className={`text-[11px] font-black uppercase italic tracking-widest ${calcMode === 'BBFS' ? 'text-cyan-400' : 'text-indigo-400'}`}>MATRIX STREAM</h3>
            </div>
            <div className={`px-4 py-1 rounded-lg border font-mono font-black text-[14px] shadow-inner transition-all flex items-center gap-2 ${calcMode === 'BBFS' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
               <span>{copiedIndex}</span>
               <span className="opacity-20 text-[10px]">/</span>
               <span className="opacity-60">{resultList.length}</span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto scrollbar-hide">
           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-2 gap-y-4 px-2">
             {resultList.length > 0 ? (
               resultList.map((item, idx) => {
                 // LOGIC: Use signature matching for IN DB identification (Red color)
                 const isInBuffer = historySignatures.has(getSig(item));
                 const isCopied = idx < copiedIndex;
                 const setSize = new Set(item.split('')).size;
                 const isTwinPlus = setSize < item.length - 1;
                 
                 const matchedRank = BBFS_TOP_RANKINGS_BASE.find(rank => rank.digits === item);
                 const isTopRank = !!matchedRank;
                 const rankNumber = isTopRank ? BBFS_TOP_RANKINGS_BASE.indexOf(matchedRank!) + 1 : 0;

                 return (
                   <div key={idx} className="flex justify-center items-center h-7 md:h-9">
                     <div className={`flex items-stretch w-full h-full rounded-lg border transition-all duration-500 overflow-hidden
                       ${isTopRank ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : isInBuffer ? 'border-red-500/40 bg-red-950/20' : 'border-white/5 bg-white/5'}
                     `}>
                        {isTopRank && (
                          <div className="w-3 md:w-5 flex items-center justify-center font-black text-[8px] md:text-[10px] italic border-r shadow-[inset_-2px_0_5px_rgba(0,0,0,0.2)] bg-cyan-500 text-black border-cyan-400">
                            {rankNumber}
                          </div>
                        )}
                        <div className="flex-1 flex items-center justify-center relative">
                           {isInBuffer && (
                             <span className="absolute -top-1 left-0 text-[5px] md:text-[6px] font-black text-red-500 uppercase tracking-tighter opacity-80">DB</span>
                           )}
                           <span className={`font-mono text-[10px] md:text-[14px] font-black tracking-tight ${isCopied ? 'opacity-20 line-through' : isInBuffer ? 'text-red-500' : isTopRank ? 'text-white' : isTwinPlus ? 'text-rose-400' : 'text-cyan-400'}`}>
                              {item}
                           </span>
                        </div>
                     </div>
                   </div>
                 );
               })
             ) : (
               <div className="col-span-full flex flex-col items-center justify-center h-40 opacity-10">
                 <span className="text-[9px] uppercase tracking-[0.6em] font-black italic">Waiting Generation...</span>
               </div>
             )}
           </div>
         </div>
      </div>

      {/* COPY ACTIONS */}
      <div className="flex flex-col gap-3">
         <div className="bg-[#0b1018] border border-white/5 p-1 rounded-2xl flex items-center overflow-x-auto scrollbar-hide">
           {[25, 60, 120, 250, 360].map(amt => (
             <button key={amt} onClick={() => setCopyLimit(amt)} className={`flex-1 min-w-[50px] py-2.5 text-[11px] font-black transition-all rounded-xl ${copyLimit === amt ? 'bg-white text-black shadow-lg' : 'text-white/10 hover:text-white/20'}`}>{amt}</button>
           ))}
         </div>
         <div className="flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-2">
               <button onClick={() => handleCopy(copyLimit)} disabled={resultList.length === 0} className={`col-span-8 py-3 rounded-2xl font-black text-[12px] uppercase italic tracking-wider transition-all disabled:opacity-20 ${calcMode === 'BBFS' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}>COPY NEXT {copyLimit}</button>
               <button onClick={() => setCopiedIndex(0)} className="col-span-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white/30 font-black text-[11px] uppercase active:scale-95 transition-all">CLR</button>
            </div>
            <button onClick={handleCopyAll} disabled={resultList.length === 0} className="w-full py-3 rounded-2xl font-black text-[13px] uppercase italic tracking-[0.2em] bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-20">COPY ALL ({resultList.length})</button>
         </div>
      </div>

      {/* COST ANALYSIS MATRIX */}
      <div className="bg-[#0b1018]/95 p-5 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse"></div>
          <h3 className="text-[10px] font-black text-white/80 uppercase italic tracking-widest leading-none">COST ANALYSIS MATRIX</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-center text-[10px] font-mono border-collapse border border-white/5">
            <thead>
              <tr className="bg-black/40 text-white/30 uppercase text-[8px] font-black tracking-widest border-b border-white/5">
                <th className="py-3 px-2 border-r border-white/5">ID</th>
                <th className="py-3 px-2 border-r border-white/5">MODE</th>
                <th className="py-3 px-2 border-r border-white/5">FULL</th>
                <th className="py-3 px-2 border-r border-white/5">DIS</th>
                <th className="py-3 px-2 border-r border-white/5">SPR</th>
                <th className="py-3 px-2">SUM</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map(dim => {
                const sF = getCost(dim, 'SGL', 'full');
                const sD = getCost(dim, 'SGL', 'diskon');
                const sS = getCost(dim, 'SGL', 'super');
                const sSum = (parseFloat(sF) + parseFloat(sD) + parseFloat(sS)).toFixed(3);

                const tF = getCost(dim, 'TWN', 'full');
                const tD = getCost(dim, 'TWN', 'diskon');
                const tS = getCost(dim, 'TWN', 'super');
                const tSum = (parseFloat(tF) + parseFloat(tD) + parseFloat(tS)).toFixed(3);

                const tpF = getCost(dim, 'TWN+', 'full');
                const tpD = getCost(dim, 'TWN+', 'diskon');
                const tpS = getCost(dim, 'TWN+', 'super');
                const tpSum = (parseFloat(tpF) + parseFloat(tpD) + parseFloat(tpS)).toFixed(3);

                const totF = (parseFloat(sF) + parseFloat(tF) + parseFloat(tpF)).toFixed(3);
                const totD = (parseFloat(sD) + parseFloat(tD) + parseFloat(tpD)).toFixed(3);
                const totS = (parseFloat(sS) + parseFloat(tS) + parseFloat(tpS)).toFixed(3);
                const totSum = (parseFloat(sSum) + parseFloat(tSum) + parseFloat(tpSum)).toFixed(3);

                // FIX: Sembunyikan dimensi yang tidak dipilih agar tidak membingungkan
                if (!selectedDims.includes(dim)) return null;

                return (
                  <React.Fragment key={dim}>
                    <tr className="border-b border-white/[0.03] group">
                      <td rowSpan={4} className="py-4 border-r border-white/5 text-[14px] font-black italic text-white/80 align-middle">{dim}</td>
                      <td className="py-2 border-r border-white/5 text-[9px] italic text-white/40">SGL</td>
                      <td className="py-2 border-r border-white/5 text-white">{sF}</td>
                      <td className="py-2 border-r border-white/5 text-white">{sD}</td>
                      <td className="py-2 border-r border-white/5 text-white">{sS}</td>
                      <td className="py-2 text-white/80">{sSum}</td>
                    </tr>
                    <tr className="border-b border-white/[0.03]">
                      <td className="py-2 border-r border-white/5 text-[9px] italic text-white/40">TWN</td>
                      <td className="py-2 border-r border-white/5 text-white">{tF}</td>
                      <td className="py-2 border-r border-white/5 text-white">{tD}</td>
                      <td className="py-2 border-r border-white/5 text-white">{tS}</td>
                      <td className="py-2 text-white/80">{tSum}</td>
                    </tr>
                    <tr className="border-b border-white/[0.03]">
                      <td className="py-2 border-r border-white/5 text-[9px] font-black italic text-rose-500/80">TWN+</td>
                      <td className="py-2 border-r border-white/5 text-rose-500/60">{tpF}</td>
                      <td className="py-2 border-r border-white/5 text-rose-500/60">{tpD}</td>
                      <td className="py-2 border-r border-white/5 text-rose-500/60">{tpS}</td>
                      <td className="py-2 text-rose-500/80">{tpSum}</td>
                    </tr>
                    <tr className="bg-emerald-500/10 border-b border-white/5">
                      <td className="py-2 border-r border-white/5 text-[9px] font-black italic text-emerald-400">TOT</td>
                      <td className="py-2 border-r border-white/5 text-emerald-400/80 font-black">{totF}</td>
                      <td className="py-2 border-r border-white/5 text-emerald-400/80 font-black">{totD}</td>
                      <td className="py-2 border-r border-white/5 text-emerald-400/80 font-black">{totS}</td>
                      <td className="py-2 text-emerald-400 font-black">{totSum}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRICING MATRIX x 1000 */}
      <div className="bg-[#0b1018]/95 p-5 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,1)]"></div>
          <h3 className="text-[10px] font-black text-white/80 uppercase italic tracking-widest leading-none">PRICING MATRIX x 1000</h3>
        </div>
        <div className="space-y-6">
          {/* FIX: Tampilkan input harga hanya untuk dimensi yang dipilih */}
          {dimensions.filter(d => selectedDims.includes(d)).map(dim => (
            <div key={dim} className="space-y-2">
              <div className="grid grid-cols-12 items-center gap-3">
                 <div className="col-span-1 text-[16px] font-black italic text-white/20">{dim}</div>
                 <div className="col-span-11 space-y-1.5">
                   <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/[0.02]">
                     <span className="text-[9px] font-black italic text-rose-500 w-10">TWN+</span>
                     <div className="flex-1 grid grid-cols-3 gap-4">
                       <input type="text" value={twinPlusPrices[dim].full} onChange={(e) => updatePrice(dim, 'TWN+', 'full', e.target.value)} className="bg-transparent text-center font-mono font-black text-rose-500/60 outline-none text-[13px]" />
                       <input type="text" value={twinPlusPrices[dim].diskon} onChange={(e) => updatePrice(dim, 'TWN+', 'diskon', e.target.value)} className="bg-transparent text-center font-mono font-black text-rose-500/60 outline-none text-[13px]" />
                       <input type="text" value={twinPlusPrices[dim].super} onChange={(e) => updatePrice(dim, 'TWN+', 'super', e.target.value)} className="bg-transparent text-center font-mono font-black text-rose-500/60 outline-none text-[13px]" />
                     </div>
                   </div>
                   <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/[0.02]">
                     <span className="text-[9px] font-black italic text-white/80 w-10">SGL</span>
                     <div className="flex-1 grid grid-cols-3 gap-4">
                       <input type="text" value={singlePrices[dim].full} onChange={(e) => updatePrice(dim, 'SGL', 'full', e.target.value)} className="bg-transparent text-center font-mono font-black text-white outline-none text-[13px]" />
                       <input type="text" value={singlePrices[dim].diskon} onChange={(e) => updatePrice(dim, 'SGL', 'diskon', e.target.value)} className="bg-transparent text-center font-mono font-black text-white outline-none text-[13px]" />
                       <input type="text" value={singlePrices[dim].super} onChange={(e) => updatePrice(dim, 'SGL', 'super', e.target.value)} className="bg-transparent text-center font-mono font-black text-white outline-none text-[13px]" />
                     </div>
                   </div>
                   <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/[0.02]">
                     <span className="text-[9px] font-black italic text-cyan-400 w-10">TWN</span>
                     <div className="flex-1 grid grid-cols-3 gap-4">
                       <input type="text" value={twinPrices[dim].full} onChange={(e) => updatePrice(dim, 'TWN', 'full', e.target.value)} className="bg-transparent text-center font-mono font-black text-cyan-400 outline-none text-[13px]" />
                       <input type="text" value={twinPrices[dim].diskon} onChange={(e) => updatePrice(dim, 'TWN', 'diskon', e.target.value)} className="bg-transparent text-center font-mono font-black text-cyan-400 outline-none text-[13px]" />
                       <input type="text" value={twinPrices[dim].super} onChange={(e) => updatePrice(dim, 'TWN', 'super', e.target.value)} className="bg-transparent text-center font-mono font-black text-cyan-400 outline-none text-[13px]" />
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          ))}
          {selectedDims.length === 0 && (
             <div className="text-center py-4 text-white/10 text-[10px] uppercase font-black tracking-widest italic">Pilih Dimensi untuk Input Harga</div>
          )}
        </div>
      </div>

      {/* PERMUTATION SUMMARY */}
      <div className="bg-[#0b1018]/90 p-5 rounded-[2rem] border border-white/5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
          <h3 className="text-[11px] font-black text-orange-500 uppercase italic tracking-widest">PERMUTATION SUMMARY</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="text-[9px] font-black text-white/30 uppercase border-b border-white/5">
                <th className="py-3">DIM</th>
                <th className="py-3">SGL</th>
                <th className="py-3">TWN</th>
                <th className="py-3 text-rose-400">TWN+</th>
                <th className="py-3">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map(dim => {
                if (!selectedDims.includes(dim)) return null;
                const s = filteredResultsByDim[dim].single.length;
                const t = filteredResultsByDim[dim].twin.length;
                const tp = filteredResultsByDim[dim].twinPlus.length;
                return (
                  <tr key={dim} className="border-b border-white/[0.02]">
                    <td className="py-4 text-[14px] font-black italic text-white/60">{dim}</td>
                    <td className="py-4 text-[14px] font-black text-white">{s}</td>
                    <td className="py-4 text-[14px] font-black text-white">{t}</td>
                    <td className="py-4 text-[14px] font-black text-rose-400">{tp}</td>
                    <td className="py-4 text-[14px] font-black text-cyan-400">{s + t + tp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BBFSCalculator;
