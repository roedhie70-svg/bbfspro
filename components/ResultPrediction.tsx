
import React, { useState, useMemo, useEffect } from 'react';
import { BBFSEntry } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const STORAGE_KEY = 'bebiaks_db_v15';
const timeSlots = ["01", "13", "15", "16", "19", "21", "22", "23"];

const INDEX_MAP: Record<string, string> = { '0':'5','5':'0','1':'6','6':'1','2':'7','7':'2','3':'8','8':'3','4':'9','9':'4' };
const TAY_MAP: Record<string, string> = { '1':'4','4':'1','2':'9','9':'2','3':'6','6':'3','5':'8','8':'5','0':'7','7':'0' };

const LABEL_COLORS: Record<string, string> = {
  'ODX': 'text-amber-400',
  'QRX': 'text-cyan-400',
  'PRIME': 'text-emerald-400',
  'MOMENTUM': 'text-sky-400',
  'SHADOW': 'text-violet-400',
  'CHAOS': 'text-rose-400',
  'HYBRID': 'text-lime-400',
  'SYNTHESIS': 'text-fuchsia-400',
  'POLTAR': 'text-orange-400'
};

const posColors = ['#FF0000', '#FF6600', '#FFFF00', '#00FF00', '#00FFFF', '#BB00FF', '#FF0099'];

const formatSlotLabel = (slot: string) => {
  const s = slot.replace('JAM ', '');
  if (s === '15') return '15.15';
  if (s === '21') return '21.15';
  return s;
};

const checkMatch = (bbfs: string, result: string) => {
    if (!result || !bbfs || result === '????') return 0;
    const combined = bbfs.replace(/[\s\+]/g, '');
    const bCounts: Record<string, number> = {};
    for (const d of combined) bCounts[d] = (bCounts[d] || 0) + 1;
    
    const isMatch = (segment: string) => {
        const sCounts: Record<string, number> = {};
        for (const d of segment) sCounts[d] = (sCounts[d] || 0) + 1;
        return Object.keys(sCounts).every(d => (bCounts[d] || 0) >= sCounts[d]);
    };

    const res = result.replace(/\D/g, '');
    if (res.length === 5) {
        if (isMatch(res)) return 5;
        if (isMatch(res.slice(-4))) return 4;
        if (isMatch(res.slice(-3))) return 3;
        if (isMatch(res.slice(-2))) return 2;
    } else {
        if (isMatch(res)) return 4;
        if (isMatch(res.slice(-3))) return 3;
        if (isMatch(res.slice(-2))) return 2;
    }
    return 0;
};

const checkPoltarMatch = (poltar: string[][], result: string, is5DSlot: boolean) => {
    if (!result || !poltar || result.length < 2) return 0;
    const res = result.replace(/\D/g, '');
    const len = res.length;
    let score = 0;
    if (poltar[4]?.includes(res[len - 1])) {
        score = 1;
        if (poltar[3]?.includes(res[len - 2])) {
            score = 2;
            if (poltar[2]?.includes(res[len - 3])) {
                score = 3;
                if (poltar[1]?.includes(res[len - 4])) {
                    score = 4;
                    if (len === 5 && poltar[0]?.includes(res[0])) score = 5;
                }
            }
        }
    }
    return score >= 2 ? score : 0;
};

const getModelBBFS = (history: BBFSEntry[], type: string, is5D: boolean, windowSize: number = 20) => {
    const recent = history.slice(0, windowSize);
    const allDigits = recent.map(e => e.result || '').join('');
    const counts: Record<string, number> = {};
    for(let i=0; i<10; i++) counts[i.toString()] = 0;
    for(const d of allDigits) counts[d] = (counts[d] || 0) + 1;
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).map(x => x[0]);
    let base = [];
    const countNeeded = is5D ? 6 : 5;
    if(type === 'PRIME') base = sorted.slice(0, countNeeded);
    else if(type === 'MOMENTUM') base = sorted.slice(1, countNeeded + 1);
    else if(type === 'SHADOW') base = Object.entries(counts).sort((a,b) => a[1] - b[1]).map(x => x[0]).slice(0, countNeeded);
    else if(type === 'CHAOS') {
        const seed = (parseInt(history[0]?.result || '0') + parseInt(history[1]?.result || '0')) || 42;
        const digits = [0,1,2,3,4,5,6,7,8,9];
        base = digits.sort((a,b) => ((seed * (a+1)) % 13) - ((seed * (b+1)) % 13)).slice(0, countNeeded);
    }
    else base = sorted.slice(2, countNeeded + 2);
    const resultStr = base.sort().join('');
    return resultStr.padEnd(countNeeded, "0").slice(0, countNeeded) + " + " + (resultStr[0] || "0");
};

const generateAllPredictions = (history: BBFSEntry[], slot: string) => {
    const is5D = slot === '15' || slot === '21';
    const p = {
        prime: getModelBBFS(history, 'PRIME', is5D, 12),
        momentum: getModelBBFS(history, 'MOMENTUM', is5D, 12),
        shadow: getModelBBFS(history, 'SHADOW', is5D, 20),
        chaos: getModelBBFS(history, 'CHAOS', is5D, 8),
    };
    const lastRes = (history[0]?.result || '0000').replace(/\D/g, '');
    const trigger = INDEX_MAP[lastRes[lastRes.length-1]] || '0';
    const bbfsPool = (p.prime + p.momentum + p.shadow).replace(/[\s\+]/g, '');
    const bbfsConsensus: Record<string, number> = {};
    for(const d of bbfsPool) bbfsConsensus[d] = (bbfsConsensus[d] || 0) + 1;
    const recentODX = history.slice(0, 16);
    const countsODX: Record<string, number> = {};
    for(let i=0; i<10; i++) countsODX[i.toString()] = 0;
    for(const d of recentODX.map(e => e.result || '').join('')) countsODX[d] = (countsODX[d] || 0) + 1;
    const coldODX = Object.entries(countsODX).sort((a,b) => a[1] - b[1]).map(x => x[0]).slice(0, is5D ? 5 : 4);
    const odxBase = Array.from(new Set([...coldODX, trigger])).sort().slice(0, is5D ? 6 : 5).join('').padEnd(is5D ? 6 : 5, '0');
    const last3 = history.slice(0, 3).map(e => (e.result || '0000').replace(/\D/g, ''));
    const qDigits = [];
    for(let i=0; i<Math.min(lastRes.length, 4); i++) {
        const sum = (parseInt(last3[0]?.[i] || '0') + parseInt(last3[1]?.[i] || '0') + parseInt(last3[2]?.[i] || '0')) % 10;
        qDigits.push(sum.toString());
    }
    const qBase = Array.from(new Set([...qDigits, TAY_MAP[qDigits[0]] || '5'])).sort().slice(0, is5D ? 6 : 5).join('').padEnd(is5D ? 6 : 5, '0');
    const sBase = Object.keys(bbfsConsensus).sort((a,b) => bbfsConsensus[b] - bbfsConsensus[a]).slice(0, is5D ? 6 : 5).sort().join('').padEnd(is5D ? 6 : 5, '0');
    const pD = p.prime.split('+')[0].trim();
    const mD = p.momentum.split('+')[0].trim();
    const sD = p.shadow.split('+')[0].trim();
    const hBase = Array.from(new Set([pD[0], pD[1], mD[0], mD[1], sD[0], sD[1]])).sort().join('').padEnd(is5D ? 6 : 5, "0").slice(0, is5D ? 6 : 5);
    const poltar = Array.from({ length: 5 }).map((_, pos) => {
        const targetIdxInRes = is5D ? pos : pos - 1;
        if (targetIdxInRes < 0) return ['-','-','-','-'];
        const scoreMap: Record<string, number> = {};
        for(let i=0; i<10; i++) scoreMap[i.toString()] = 0;
        const currentDigit = lastRes[targetIdxInRes] || '0';
        history.slice(0, 400).forEach((entry, i) => {
            const hist = history.slice(0, 400).reverse();
            if (i < hist.length - 1) {
                const thisR = (hist[i].result || '').replace(/\D/g, '');
                const nextR = (hist[i+1].result || '').replace(/\D/g, '');
                if (thisR[targetIdxInRes] === currentDigit && nextR[targetIdxInRes]) scoreMap[nextR[targetIdxInRes]] += 10;
            }
        });
        history.slice(0, 50).forEach(e => {
            const res = (e.result || '').replace(/\D/g, '');
            if (res[targetIdxInRes]) scoreMap[res[targetIdxInRes]] += 2;
        });
        Object.keys(bbfsConsensus).forEach(d => scoreMap[d] += 1);
        scoreMap[INDEX_MAP[currentDigit]] += 4;
        scoreMap[TAY_MAP[currentDigit]] += 3;
        return Object.keys(scoreMap).sort((a,b) => scoreMap[b] - scoreMap[a]).slice(0, 4);
    });
    return { ...p, synthesis: sBase + " + " + (bbfsPool[0] || "0"), hybrid: hBase + " + " + (pD[0] || "0"), odx: odxBase + " + " + trigger, qrx: qBase + " + " + qBase[0], poltar };
};

const WinBadge: React.FC<{ score: number; model?: string }> = ({ score, model }) => {
    if (score < 2) return null;
    
    const configs: Record<number, string> = {
        5: 'bg-[#f59e0b] border-[#f59e0b]/40 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        4: 'bg-[#00df9a] border-[#00df9a]/40 shadow-[0_0_8px_rgba(0,223,154,0.4)]',
        3: 'bg-[#0ea5e9] border-[#0ea5e9]/40 shadow-[0_0_8px_rgba(14,165,233,0.4)]',
        2: 'bg-[#94a3b8] border-[#94a3b8]/40 shadow-[0_0_8px_rgba(148,163,184,0.3)]',
    };

    const configClass = configs[score] || configs[2];

    return (
        <div className={`inline-flex items-center rounded-full px-1.5 py-0.5 border leading-none ${configClass} transition-all gap-1`}>
            <span className="text-[9px] font-black italic text-black uppercase tracking-tighter">{score}D</span>
            {/* FIX: Meningkatkan visibilitas teks model di dalam badge */}
            <span className="text-[9px] font-black italic text-black uppercase tracking-tighter">{model}</span>
        </div>
    );
};

const ResultPrediction: React.FC = () => {
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeSlot, setActiveSlot] = useState(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const nextSlot = timeSlots.find(slot => currentHour < parseInt(slot));
    return nextSlot || timeSlots[timeSlots.length - 1];
  });
  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState<'DAY' | 'SUPER'>('DAY');

  useEffect(() => {
    const handleStorage = () => setDbRefreshTrigger(Date.now());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const entries = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const db = saved ? JSON.parse(saved) : [];
    return [...(Array.isArray(db) ? db : []), ...SYSTEM_BASELINE].sort((a, b) => {
        const d = new Date(b.date).getTime() - new Date(a.date).getTime();
        return d !== 0 ? d : timeSlots.indexOf(b.label.replace('JAM ','')) - timeSlots.indexOf(a.label.replace('JAM ',''));
    });
  }, [dbRefreshTrigger]);

  const currentContextIdx = useMemo(() => entries.findIndex(e => e.date === viewDate && e.label.replace('JAM ','') === activeSlot), [entries, viewDate, activeSlot]);
  const currentHistory = useMemo(() => entries.slice(currentContextIdx === -1 ? 0 : currentContextIdx + 1), [entries, currentContextIdx]);
  const baselineEntry = useMemo(() => currentHistory[0], [currentHistory]);
  const predictions = useMemo(() => generateAllPredictions(currentHistory, activeSlot), [currentHistory, activeSlot]);
  const targetEntry = useMemo(() => entries.find(e => e.date === viewDate && e.label.replace('JAM ','') === activeSlot), [entries, viewDate, activeSlot]);
  
  const digitRankings = useMemo(() => {
    const recent = currentHistory.slice(0, 12);
    const allDigits = recent.map(e => e.result || '').join('');
    const counts: Record<string, number> = {};
    for(let i=0; i<10; i++) counts[i.toString()] = 0;
    for(const d of allDigits) counts[d] = (counts[d] || 0) + 1;
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const max = sorted[0][1] || 1;
    return sorted.map(([digit, count], i) => ({ digit, count, power: (count/max)*100, rank: i+1 }));
  }, [currentHistory]);

  const todayDigitsAppearance = useMemo(() => {
    const todayEntries = entries.filter(e => e.date === viewDate && e.result && e.result !== '????');
    const seen: Record<string, boolean> = {};
    for(let i=0; i<10; i++) seen[i.toString()] = false;
    todayEntries.forEach(e => {
        const res = (e.result || '').replace(/\D/g, '');
        for(const d of res) seen[d] = true;
    });
    return seen;
  }, [entries, viewDate]);

  const monthPerformance = useMemo(() => {
    const stats: Record<string, any> = {
        prime: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, momentum: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        shadow: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, chaos: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        hybrid: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, synthesis: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        odx: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, qrx: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        poltar: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, superHits: []
    };
    const janThreshold = new Date('2026-01-01').getTime();
    for (let i = 0; i < Math.min(entries.length, 500); i++) {
        const target = entries[i];
        if (!target.result || target.result === '????') continue;
        if (new Date(target.date).getTime() < janThreshold) continue;
        const hist = entries.slice(i + 1);
        if (hist.length < 5) continue;
        const slotLabel = target.label.replace('JAM ','');
        const preds = generateAllPredictions(hist, slotLabel);
        const res = target.result.replace(/\D/g, '');
        let isSuper = false;
        const superHitEntries: any[] = [];
        ['prime', 'momentum', 'shadow', 'chaos', 'hybrid', 'synthesis', 'odx', 'qrx'].forEach(model => {
            const score = checkMatch((preds as any)[model], res);
            if (score >= 4) { 
                stats[model]['4D']++; isSuper = true; 
                superHitEntries.push({ model: model.toUpperCase(), score });
                if(score === 5) stats[model]['5D']++; 
            }
            if (score === 3) stats[model]['3D']++;
            if (score === 2) stats[model]['2D']++;
        });
        const polMatch = checkPoltarMatch(preds.poltar, res, slotLabel === '15' || slotLabel === '21');
        if (polMatch >= 4) { 
            stats.poltar['4D']++; isSuper = true; 
            superHitEntries.push({ model: 'POLTAR', score: polMatch });
            if(polMatch === 5) stats.poltar['5D']++; 
        }
        if (polMatch === 3) stats.poltar['3D']++;
        if (polMatch === 2) stats.poltar['2D']++;
        if (isSuper) stats.superHits.push({ date: target.date, slot: target.label, res: res, hits: superHitEntries });
    }
    return stats;
  }, [entries]);

  const dailyAudit = useMemo(() => {
    return timeSlots.map(slot => {
        const fullLabel = `JAM ${slot}`;
        const target = entries.find(e => e.date === viewDate && e.label === fullLabel);
        const cIdx = entries.findIndex(e => e.date === viewDate && e.label === fullLabel);
        const hist = entries.slice(cIdx + 1);
        if (!target || hist.length < 5) return { slot: fullLabel, result: '----', hits: [] };
        const preds = generateAllPredictions(hist, slot);
        const res = (target.result || '').replace(/\D/g, '');
        const hits: any[] = [];
        if (res && res !== '????') {
            ['hybrid','synthesis','prime','momentum','shadow','chaos','odx','qrx'].forEach(m => {
                const s = checkMatch((preds as any)[m], res);
                if(s >= 2) hits.push({ model: m.toUpperCase(), score: s });
            });
            const pm = checkPoltarMatch(preds.poltar, res, slot === '15' || slot === '21');
            if(pm >= 2) hits.push({ model: 'POLTAR', score: pm });
        }
        return { slot: fullLabel, result: res || '----', hits };
    });
  }, [viewDate, entries]);

  const renderValWithHighlights = (valStr: string, target: string | undefined) => {
    if (!target || target === '????') return valStr;
    const res = target.replace(/\D/g, '');
    const score = checkMatch(valStr, res);
    const winDigits = score > 0 ? res.slice(-score) : "";
    const [base, plus] = valStr.split(' + ');
    const highlight = (s: string) => s.split('').map((char, i) => (
      <span key={i} className={winDigits.includes(char) ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" : ""}>{char}</span>
    ));
    return (<>{highlight(base)}<span className="text-amber-500/60 ml-3 text-[0.8em]">+{highlight(plus || '')}</span></>);
  };

  const renderPredCard = (label: string, value: string) => {
      const raw = label.split(' ')[0].toUpperCase();
      const score = targetEntry?.result ? checkMatch(value, targetEntry.result) : 0;
      const labelColor = LABEL_COLORS[raw] || 'text-white/90';
      const stats = monthPerformance[raw.toLowerCase()] || { '4D': 0, '3D': 0 };

      return (
          <div className={`p-4 rounded-3xl border transition-all duration-500 bg-[#0b1018] relative overflow-hidden ${score >= 4 ? 'border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-amber-500/5' : score === 3 ? 'border-emerald-500/30' : 'border-white/5'}`}>
              {score >= 4 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)] animate-pulse"></div>}
              
              <div className="flex flex-col mb-3 px-1 relative z-10">
                <div className="flex justify-between items-start w-full">
                    <span className={`text-[10px] font-black uppercase italic tracking-widest ${labelColor}`}>{label}</span>
                    {/* FIX: Meningkatkan opasitas statistik 4D:xx 3D:xx agar lebih terang */}
                    <span className="text-[7px] font-black text-white/70 uppercase font-mono bg-white/10 px-1.5 py-0.5 rounded">
                        4D:{stats['4D']} 3D:{stats['3D']}
                    </span>
                </div>
                {score >= 2 && (
                    <div className="mt-2">
                        <WinBadge score={score} model={raw} />
                    </div>
                )}
              </div>
              <div className={`font-mono font-black tracking-widest flex items-center justify-center py-4 rounded-2xl bg-black/60 border border-white/[0.03] text-xl relative z-10 ${score >= 4 ? 'text-amber-500' : 'text-white'}`}>
                  <span>{renderValWithHighlights(value, targetEntry?.result)}</span>
              </div>
          </div>
      );
  };

  const toggleLog = (type: 'DAY' | 'SUPER') => {
    if (showLog && logType === type) {
      setShowLog(false);
    } else {
      setLogType(type);
      setShowLog(true);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-24 px-2 font-sans selection:bg-cyan-500">
      <div className="bg-[#0b1018] p-5 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none uppercase font-black text-6xl italic -rotate-12">SENTINEL</div>
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_cyan]"></div>
                </div>
                <div>
                    <h1 className="text-lg font-black text-white italic tracking-tighter uppercase">SENTINEL LAB <span className="text-cyan-400">v9.9.2</span></h1>
                    <span className="text-[7px] text-white/30 uppercase tracking-[0.5em] font-bold">Predictive Intelligence Unit</span>
                </div>
            </div>
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 gap-3">
              <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg></button>
              <span className="text-[11px] font-black text-white font-mono tracking-widest px-2">{viewDate}</span>
              <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg></button>
            </div>
        </div>
        <div className="grid grid-cols-8 bg-black/60 rounded-xl p-0.5 border border-white/5 gap-0.5">
          {timeSlots.map(s => ( 
            <button 
              key={s} 
              onClick={() => setActiveSlot(s)} 
              className={`py-2.5 rounded-lg text-[10px] font-black transition-all text-center ${activeSlot === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.3)]' : 'text-white/20 hover:text-white/40'}`}
            >
              {s}
            </button> 
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-2 gap-2 md:gap-4">
            <div className="bg-[#0b1018] p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col justify-center gap-0.5 md:gap-1">
               <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest italic opacity-60">BASELINE</span>
               <div className="text-xl md:text-4xl font-mono font-black text-white tracking-widest truncate">{baselineEntry?.result || '----'}</div>
               <span className="text-[6px] md:text-[7px] text-white/20 uppercase font-bold italic truncate">{baselineEntry?.label} @ {baselineEntry?.date.split('-').slice(1).join('/')}</span>
            </div>
            <div className="bg-[#0b1018] p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-rose-500/20 shadow-2xl flex flex-col justify-center gap-0.5 md:gap-1 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full"></div>
               <span className="text-[8px] md:text-[9px] font-black text-rose-500 uppercase tracking-widest italic">TARGET</span>
               <div className="text-xl md:text-4xl font-mono font-black text-rose-500 tracking-widest drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse truncate">{targetEntry?.result || '????'}</div>
               <span className="text-[6px] md:text-[7px] text-rose-400/40 uppercase font-bold italic truncate">JAM {activeSlot}</span>
            </div>
        </div>
        <div className="lg:col-span-1 bg-[#0b1018] p-6 rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col justify-center">
            <h4 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3 italic">DIGIT POWER</h4>
            <div className="grid grid-cols-5 gap-1.5">
               {digitRankings.slice(0, 10).map((r, i) => (
                 <div key={r.digit} className="flex flex-col items-center group">
                    {/* FIX: Meningkatkan kecerahan angka power indikator */}
                    <span className={`text-[11px] font-black font-mono transition-all ${r.rank <= 5 ? 'text-cyan-400' : 'text-white/40'}`}>{r.digit}</span>
                    <div className="w-1 h-8 bg-black/40 rounded-full overflow-hidden flex flex-col-reverse mt-0.5">
                        <div className={`w-full transition-all duration-1000 ${r.rank <= 5 ? 'bg-cyan-500 shadow-[0_0_5px_cyan]' : 'bg-white/10'}`} style={{ height: `${r.power}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
        </div>
      </div>

      <div className="bg-[#0b1018] p-5 rounded-[3rem] border border-white/5 shadow-2xl space-y-4">
         <div className="flex justify-between items-center border-b border-white/5 pb-4 px-2">
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" /></svg>
                <h3 className="text-[11px] font-black text-white uppercase italic tracking-widest">SENTINEL AUDIT LOG</h3>
            </div>
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
               <button onClick={() => toggleLog('DAY')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${logType === 'DAY' && showLog ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}>DAILY</button>
               <button onClick={() => toggleLog('SUPER')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${logType === 'SUPER' && showLog ? 'bg-amber-500 text-black' : 'text-white/30 hover:text-white/60'}`}>SUPER HITS</button>
            </div>
         </div>
         {showLog && (
            <div className="bg-black/40 rounded-3xl p-4 max-h-[350px] overflow-y-auto scrollbar-hide space-y-2 border border-white/[0.02] animate-in slide-in-from-top-4 duration-500">
                {(logType === 'DAY' ? dailyAudit : monthPerformance.superHits).slice(0, 50).map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-3.5 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01] px-4 rounded-2xl transition-all group">
                        <div className="flex flex-col w-20">
                            <span className="text-cyan-400 font-black italic uppercase text-[11px]">{h.slot?.replace('JAM ','') || h.slot}</span>
                            {/* FIX: Meningkatkan visibilitas tanggal dari 10% menjadi 50% */}
                            <span className="text-white/50 font-bold text-[8px]">{(h.date || viewDate).split('-').reverse().join('/')}</span>
                        </div>
                        <span className="text-amber-500 font-mono font-black tracking-widest text-2xl flex-1 ml-4 group-hover:scale-110 transition-transform origin-left">{h.result || h.res}</span>
                        <div className="flex flex-wrap gap-1 justify-end items-center flex-1">
                           {h.hits?.length > 0 ? h.hits.map((hit: any, hi: number) => (
                               <WinBadge key={hi} score={hit.score} model={hit.model} />
                           )) : (<span className="text-white/5 text-[8px] uppercase font-black">---</span>)}
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {renderPredCard('PRIME', predictions.prime)}
        {renderPredCard('MOMENTUM', predictions.momentum)}
        {renderPredCard('HYBRID', predictions.hybrid)}
        {renderPredCard('SYNTHESIS', predictions.synthesis)}
        {renderPredCard('SHADOW', predictions.shadow)}
        {renderPredCard('CHAOS', predictions.chaos)}
        {renderPredCard('ODX', predictions.odx)}
        {renderPredCard('QRX', predictions.qrx)}
      </div>

      <div className="bg-[#0b1018] p-5 rounded-[3rem] border border-white/5 space-y-4 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10 px-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_12px_orange] animate-pulse"></div>
               <h3 className="text-[11px] font-black uppercase italic tracking-widest text-orange-400">Positional Neural Patterns</h3>
            </div>
            <div className="hidden md:flex gap-3 text-[9px] font-black uppercase">
               <span className="text-white/40">Efficiency Rating:</span>
               <span className="text-cyan-400">5D:{monthPerformance.poltar['5D']}</span>
               <span className="text-emerald-400">4D:{monthPerformance.poltar['4D']}</span>
            </div>
        </div>
        <div className="grid grid-cols-5 gap-2 relative z-10">
           {['P1', 'P2', 'P3', 'P4', 'P5'].map((lbl, i) => {
             const rawRes = (targetEntry?.result || '').replace(/\D/g, '');
             const is5D = activeSlot === '15' || activeSlot === '21';
             let targetDigit = null;
             if (rawRes && rawRes !== '????') {
                 if (is5D && rawRes.length === 5) targetDigit = rawRes[i];
                 else if (!is5D && rawRes.length === 4 && i > 0) targetDigit = rawRes[i-1];
             }
             const isHit = targetDigit !== null && predictions.poltar[i]?.includes(targetDigit);

             return (
               <div key={lbl} className={`bg-black/60 rounded-[1.5rem] border py-4 flex flex-col items-center gap-1.5 transition-all duration-700 ${isHit ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] bg-orange-500/10' : 'border-white/[0.03]'}`}>
                  <span className={`text-[8px] font-black uppercase ${isHit ? 'text-orange-400' : 'text-white/20'}`}>{lbl}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    {predictions.poltar[i]?.map((d, di) => (
                        <span key={di} className={`text-xl font-mono font-black transition-all duration-500 ${targetDigit === d && isHit ? 'text-orange-500 scale-125 drop-shadow-[0_0_15px_rgba(249,115,22,1)]' : (d === '-' ? 'text-white/5' : 'text-white/80')}`}>
                            {d}
                        </span>
                    ))}
                  </div>
                  {isHit && <div className="mt-1 px-1.5 py-0.5 bg-orange-500 text-black text-[7px] font-black rounded-full uppercase">MATCH</div>}
               </div>
             );
           })}
        </div>
      </div>

      <div className="bg-[#0b1018] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_indigo] animate-pulse"></div>
              <h3 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-none">Fluid Matrix Stream</h3>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#00FF00]"></div>
                  <span className="text-[8px] font-black text-white/40 uppercase">Appearance</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#FF0000]"></div>
                  <span className="text-[8px] font-black text-white/40 uppercase">Waiting</span>
              </div>
           </div>
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="w-full text-center border-collapse table-fixed min-w-[350px]">
            <thead>
              <tr className="bg-black/60 text-[10px] font-black text-white/20 uppercase border-b border-white/10">
                <th className="py-3 w-[60px] md:w-[120px] italic border-r border-white/5">ARCHIVE</th>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <th key={num} style={{ color: todayDigitsAppearance[num.toString()] ? '#00FF00' : '#FF0000' }} className="py-3 border-r border-white/5 transition-all">
                        {num}
                    </th>
                ))}
                <th className="py-3 w-[60px] md:w-[120px] border-l border-white/5 italic">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {entries.slice(currentContextIdx === -1 ? 0 : currentContextIdx, (currentContextIdx === -1 ? 0 : currentContextIdx) + 12).map((entry, idx) => (
                <tr key={entry.id || idx} className={`hover:bg-white/[0.02] group transition-all h-10 md:h-16 ${idx === 0 ? 'bg-cyan-500/[0.03]' : ''}`}>
                  <td className="py-1 border-r border-white/10 bg-black/20 font-mono font-black italic text-[9px] md:text-xl text-white/30 group-hover:text-white/60">{entry.digits?.slice(0,6)}</td>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const digitIndex = entry.digits?.indexOf(num.toString()) ?? -1;
                    return (
                        <td key={num} className="p-0.5 border-r border-white/5">
                            {digitIndex !== -1 && (
                                <div style={{ backgroundColor: posColors[digitIndex] || '#FFFFFF', boxShadow: `0 0 15px ${posColors[digitIndex]}55` }} className="w-full h-8 md:h-12 rounded-lg flex items-center justify-center font-black text-black text-[12px] md:text-3xl animate-in zoom-in-50 duration-500">
                                    <span className="drop-shadow-md">{num}</span>
                                </div>
                            )}
                        </td>
                    );
                  })}
                  <td className="py-1 px-1 text-center border-l border-white/10 bg-black/20">
                     <span className={`text-[9px] md:text-xl font-black italic leading-none block ${idx === 0 ? 'text-cyan-400' : 'text-indigo-400'}`}>{formatSlotLabel(entry.label)}</span>
                     <span className="text-[6px] md:text-[10px] font-bold text-white/10 block mt-1 uppercase">{entry.date.split('-').slice(1).reverse().join('/')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultPrediction;
