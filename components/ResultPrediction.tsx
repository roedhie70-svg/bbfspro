
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

const posColors = ['#ef4444', '#f59e0b', '#84cc16', '#34d399', '#22d3ee', '#6366f1', '#d946ef'];

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
    if (result.length === 5) {
        if (isMatch(result)) return 5;
        if (isMatch(result.slice(-4))) return 4;
        if (isMatch(result.slice(-3))) return 3;
        if (isMatch(result.slice(-2))) return 2;
    } else {
        if (isMatch(result)) return 4;
        if (isMatch(result.slice(-3))) return 3;
        if (isMatch(result.slice(-2))) return 2;
    }
    return 0;
};

const checkPoltarMatch = (poltar: string[][], result: string) => {
    if (!result || !poltar || result.length < 2) return 0;
    const is5D = result.length === 5;
    const len = result.length;
    const hitP5 = poltar[4]?.includes(result[len-1]);
    const hitP4 = poltar[3]?.includes(result[len-2]);
    const hitP3 = poltar[2]?.includes(result[len-3]);
    const hitP2 = poltar[1]?.includes(result[len-4]);
    const hitP1 = is5D && poltar[0]?.includes(result[len-5]);
    if (is5D && hitP1 && hitP2 && hitP3 && hitP4 && hitP5) return 5;
    if (hitP2 && hitP3 && hitP4 && hitP5) return 4;
    if (hitP3 && hitP4 && hitP5) return 3;
    if (hitP4 && hitP5) return 2;
    return 0;
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

    const lastRes = history[0]?.result || '0000';
    const prevRes = history[1]?.result || '0000';
    const trigger = INDEX_MAP[lastRes[lastRes.length-1]] || '0';
    
    // Consensus BBFS (Angka yang paling banyak muncul di model-model BBFS)
    const bbfsPool = (p.prime + p.momentum + p.shadow).replace(/[\s\+]/g, '');
    const bbfsConsensus: Record<string, number> = {};
    for(const d of bbfsPool) bbfsConsensus[d] = (bbfsConsensus[d] || 0) + 1;

    // ODX & QRX
    const recentODX = history.slice(0, 16);
    const countsODX: Record<string, number> = {};
    for(let i=0; i<10; i++) countsODX[i.toString()] = 0;
    for(const d of recentODX.map(e => e.result || '').join('')) countsODX[d] = (countsODX[d] || 0) + 1;
    const coldODX = Object.entries(countsODX).sort((a,b) => a[1] - b[1]).map(x => x[0]).slice(0, is5D ? 5 : 4);
    const odxBase = Array.from(new Set([...coldODX, trigger])).sort().slice(0, is5D ? 6 : 5).join('').padEnd(is5D ? 6 : 5, '0');

    const last3 = history.slice(0, 3).map(e => e.result || '0000');
    const qDigits = [];
    for(let i=0; i<Math.min(lastRes.length, 4); i++) {
        const sum = (parseInt(last3[0]?.[i] || '0') + parseInt(last3[1]?.[i] || '0') + parseInt(last3[2]?.[i] || '0')) % 10;
        qDigits.push(sum.toString());
    }
    const qBase = Array.from(new Set([...qDigits, TAY_MAP[qDigits[0]] || '5'])).sort().slice(0, is5D ? 6 : 5).join('').padEnd(is5D ? 6 : 5, '0');

    // Synthesis & Hybrid
    const sBase = Object.keys(bbfsConsensus).sort((a,b) => bbfsConsensus[b] - bbfsConsensus[a]).slice(0, is5D ? 6 : 5).sort().join('').padEnd(is5D ? 6 : 5, '0');
    const pD = p.prime.split('+')[0].trim();
    const mD = p.momentum.split('+')[0].trim();
    const sD = p.shadow.split('+')[0].trim();
    const hBase = Array.from(new Set([pD[0], pD[1], mD[0], mD[1], sD[0], sD[1]])).sort().join('').padEnd(is5D ? 6 : 5, "0").slice(0, is5D ? 6 : 5);

    // --- TRIPLE SYNERGY POLTAR (Result + BBFS + Logic) ---
    const poltar = Array.from({ length: 5 }).map((_, pos) => {
        const subHistory = history.slice(0, 500).reverse();
        // Memastikan P1 tetap terisi dengan benar untuk 4D/5D
        const targetIdx = is5D ? pos : pos - 1;
        
        const scoreMap: Record<string, number> = {};
        for(let i=0; i<10; i++) scoreMap[i.toString()] = 0;

        // JIKA targetIdx < 0 (P1 untuk 4D), gunakan logika jangkar 0/Index P2
        if (targetIdx < 0) {
            const p2Val = lastRes[0];
            scoreMap['0'] += 5;
            scoreMap[INDEX_MAP[p2Val] || '5'] += 3;
            scoreMap[TAY_MAP[p2Val] || '7'] += 2;
        } else {
            // A. RESULT TRANSITION (Weight 6.0)
            const currentDigit = lastRes[targetIdx];
            subHistory.forEach((entry, i) => {
                if (i < subHistory.length - 1) {
                    const thisRes = entry.result;
                    const nextRes = subHistory[i+1].result;
                    if (thisRes && nextRes && thisRes.length === lastRes.length && thisRes[targetIdx] === currentDigit) {
                        scoreMap[nextRes[targetIdx]] += 6;
                    }
                }
            });

            // B. BBFS SYNERGY (Weight 4.0)
            // Jika angka ada di BBFS Prime/Momentum, beri skor tambahan karena angka tsb sedang "On Fire"
            Object.keys(bbfsConsensus).forEach(digit => {
                scoreMap[digit] += (bbfsConsensus[digit] * 1.5);
            });

            // C. SKIP & MIRROR LOGIC (Weight 3.0)
            const skips: Record<string, number> = {};
            for(let i=0; i<10; i++) skips[i.toString()] = 0;
            for(let i=0; i<Math.min(subHistory.length, 60); i++) {
                const res = subHistory[subHistory.length - 1 - i].result;
                if (res && res.length === lastRes.length) {
                    const d = res[targetIdx];
                    if (skips[d] === 0) skips[d] = i; 
                }
            }
            Object.keys(skips).forEach(d => {
                if (skips[d] > 20) scoreMap[d] += 4; // Angka dingin yang siap meledak di posisi ini
            });

            // D. INDEKS/TAYSEN DARI RESULT TERAKHIR (Weight 2.0)
            scoreMap[INDEX_MAP[currentDigit]] += 2;
            scoreMap[TAY_MAP[currentDigit]] += 1;
        }

        return Object.keys(scoreMap).sort((a,b) => scoreMap[b] - scoreMap[a]).slice(0, 4);
    });

    return { ...p, synthesis: sBase + " + " + (bbfsPool[0] || "0"), hybrid: hBase + " + " + (pD[0] || "0"), odx: odxBase + " + " + trigger, qrx: qBase + " + " + qBase[0], poltar };
};

const ResultPrediction: React.FC = () => {
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [viewDate, setViewDate] = useState('2026-02-04');
  const [activeSlot, setActiveSlot] = useState('22');
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
    return [...db, ...SYSTEM_BASELINE].sort((a, b) => {
        const d = new Date(b.date).getTime() - new Date(a.date).getTime();
        return d !== 0 ? d : timeSlots.indexOf(b.label.replace('JAM ','')) - timeSlots.indexOf(a.label.replace('JAM ',''));
    });
  }, [dbRefreshTrigger]);

  const currentContextIdx = useMemo(() => entries.findIndex(e => e.date === viewDate && e.label.replace('JAM ','') === activeSlot), [entries, viewDate, activeSlot]);
  const currentHistory = useMemo(() => entries.slice(currentContextIdx === -1 ? 0 : currentContextIdx + 1), [entries, currentContextIdx]);
  const baselineEntry = useMemo(() => currentHistory[0], [currentHistory]);
  const predictions = useMemo(() => generateAllPredictions(currentHistory, activeSlot), [currentHistory, activeSlot]);
  const targetEntry = useMemo(() => entries.find(e => e.date === viewDate && e.label.replace('JAM ','') === activeSlot), [entries, viewDate, activeSlot]);
  
  const monthPerformance = useMemo(() => {
    const stats: Record<string, any> = {
        prime: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, momentum: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        shadow: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, chaos: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        hybrid: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, synthesis: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        odx: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, qrx: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 },
        poltar: { '5D': 0, '4D': 0, '3D': 0, '2D': 0 }, superHits: []
    };
    const janThreshold = new Date('2026-01-01').getTime();
    
    for (let i = 0; i < entries.length; i++) {
        const target = entries[i];
        if (!target.result || target.result === '????') continue;
        if (new Date(target.date).getTime() < janThreshold) continue;

        const hist = entries.slice(i + 1);
        if (hist.length < 10) continue;

        const preds = generateAllPredictions(hist, target.label.replace('JAM ',''));
        const res = target.result;
        let isSuper = false;
        
        ['prime', 'momentum', 'shadow', 'chaos', 'hybrid', 'synthesis', 'odx', 'qrx'].forEach(model => {
            const score = checkMatch((preds as any)[model], res);
            if (score >= 4) { stats[model]['4D']++; isSuper = true; if(score === 5) stats[model]['5D']++; }
            if (score === 3) stats[model]['3D']++;
            if (score === 2) stats[model]['2D']++;
        });
        const polMatch = checkPoltarMatch(preds.poltar, res);
        if (polMatch >= 4) { stats.poltar['4D']++; isSuper = true; if(polMatch === 5) stats.poltar['5D']++; }
        if (polMatch === 3) stats.poltar['3D']++;
        if (polMatch === 2) stats.poltar['2D']++;
        if (isSuper) stats.superHits.push({ date: target.date, slot: target.label, res: res });
    }
    return stats;
  }, [entries]);

  const dailyAudit = useMemo(() => {
    const dayEntries = timeSlots.map(slot => {
        const fullLabel = `JAM ${slot}`;
        const target = entries.find(e => e.date === viewDate && e.label === fullLabel);
        const cIdx = entries.findIndex(e => e.date === viewDate && e.label === fullLabel);
        const hist = entries.slice(cIdx + 1);
        if (!target || hist.length < 5) return { slot: fullLabel, result: '----', hits: [] };
        const preds = generateAllPredictions(hist, slot);
        const res = target.result || '';
        const hits: {model: string, score: number}[] = [];
        if (res && res !== '????') {
            ['hybrid','synthesis','prime','momentum','shadow','chaos','odx','qrx'].forEach(m => {
                const s = checkMatch((preds as any)[m], res);
                if(s >= 2) hits.push({ model: m.toUpperCase(), score: s });
            });
            const pm = checkPoltarMatch(preds.poltar, res);
            if(pm >= 2) hits.push({ model: 'POLTAR', score: pm });
        }
        return { slot: fullLabel, result: res || '----', hits };
    });
    return dayEntries;
  }, [viewDate, entries]);

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  const renderValWithHighlights = (valStr: string, target: string | undefined) => {
    if (!target || target === '????') return valStr;
    const [base, plus] = valStr.split(' + ');
    const highlight = (s: string) => s.split('').map((char, i) => (
      <span key={i} className={target.includes(char) ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" : ""}>
        {char}
      </span>
    ));
    return (
      <>
        {highlight(base)}
        <span className="text-amber-500/60 ml-4 text-[0.85em]">
          + {highlight(plus || '')}
        </span>
      </>
    );
  };

  const renderPredCard = (label: string, value: string) => {
      const rawLabel = label.split(' (')[0].split(' ')[0].toUpperCase();
      const statsLabel = rawLabel.toLowerCase();
      const stats = monthPerformance[statsLabel] || { '5D': 0, '4D': 0, '3D': 0, '2D': 0 };
      const score = targetEntry?.result ? checkMatch(value, targetEntry.result) : 0;
      const isHit = score >= 2;
      const labelColorClass = LABEL_COLORS[rawLabel] || 'text-white/90';
      let borderStyle = "border-white/5";
      let cardBg = "bg-[#0b1018]";
      let hitBadge = null;
      
      if (score >= 4) {
          borderStyle = "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
          cardBg = "bg-[#0f141d]";
          hitBadge = <div className="absolute top-0 right-0 text-[7px] font-black px-2 py-0.5 rounded-bl-xl bg-amber-500 text-black uppercase animate-pulse z-10">WIN {score}D</div>;
      } else if (score === 3) {
          borderStyle = "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
          cardBg = "bg-[#0f141d]";
          hitBadge = <div className="absolute top-0 right-0 text-[7px] font-black px-2 py-0.5 rounded-bl-xl bg-emerald-500 text-black uppercase z-10">WIN 3D</div>;
      }
      
      return (
          <div className={`p-3 md:p-4 rounded-[1.5rem] border relative overflow-hidden transition-all duration-300 ${cardBg} ${borderStyle}`}>
              {hitBadge}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-[10px] md:text-[11px] font-black uppercase italic tracking-widest ${labelColorClass}`}>{label}</span>
                <span className="text-[8px] font-bold text-white/40 uppercase font-mono tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">
                    4D:{formatNum(stats['4D'])} | 3D:{formatNum(stats['3D'])}
                </span>
              </div>
              <div className={`font-mono font-black tracking-[0.2em] flex items-center justify-center py-3 md:py-4 rounded-xl border bg-black/60 shadow-inner text-[16px] md:text-[20px] ${isHit ? 'border-white/20' : 'border-white/[0.03]'}`}>
                  <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                    {renderValWithHighlights(value, targetEntry?.result)}
                  </span>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-24 px-2">
      <div className="bg-[#0b1018] p-4 rounded-[1.5rem] border border-white/5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h1 className="text-sm font-black text-white italic tracking-tighter uppercase">SENTINEL <span className="text-cyan-400">LAB v9.9</span></h1>
            <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div></div>
        </div>
        <div className="flex items-center justify-center bg-black/40 p-1.5 rounded-xl border border-white/10 gap-4">
          <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-1); setViewDate(d.toISOString().split('T')[0]); }} className="text-cyan-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg></button>
          <span className="text-xs font-black text-white font-mono">{viewDate}</span>
          <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+1); setViewDate(d.toISOString().split('T')[0]); }} className="text-cyan-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg></button>
        </div>
        <div className="flex bg-black/60 rounded-xl p-0.5 border border-white/5 overflow-x-auto scrollbar-hide gap-0.5">
          {timeSlots.map(s => ( <button key={s} onClick={() => setActiveSlot(s)} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${activeSlot === s ? 'bg-cyan-600 text-white' : 'text-white/20'}`}>{s}</button> ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="bg-[#0b1018]/80 p-4 rounded-[1.2rem] border border-white/5 min-h-[80px] flex flex-col justify-center shadow-xl">
           <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest italic mb-1">BASELINE (LAST)</span>
           <div className="text-xl md:text-3xl font-mono font-black text-white tracking-[0.1em]">{baselineEntry?.result || '----'}</div>
        </div>
        <div className="bg-[#0b1018]/80 p-4 rounded-[1.2rem] border-2 border-rose-500/30 min-h-[80px] flex flex-col justify-center shadow-xl">
           <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest italic mb-1">TARGET</span>
           <div className="text-xl md:text-3xl font-mono font-black text-rose-500 tracking-[0.1em] animate-pulse">{targetEntry?.result || '????'}</div>
        </div>
      </div>

      <div className="bg-[#0b1018] p-3 md:p-4 rounded-[1.8rem] border border-white/5 shadow-2xl space-y-3 transition-all duration-500">
         <div className="flex justify-between items-center border-b border-white/5 pb-2 px-1">
            <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest">SENTINEL AUDIT LOG (SINCE 01-JAN-2026)</h3>
            <div className="flex gap-2">
               <button onClick={() => { setLogType('DAY'); setShowLog(true); }} className={`text-[9px] font-black px-3 py-1 rounded-md transition-all ${logType === 'DAY' && showLog ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/20 hover:text-white/40'}`}>TODAY</button>
               <button onClick={() => { setLogType('SUPER'); setShowLog(true); }} className={`text-[9px] font-black px-3 py-1 rounded-md transition-all ${logType === 'SUPER' && showLog ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-white/20 hover:text-white/40'}`}>SUPER HITS</button>
               <button onClick={() => setShowLog(!showLog)} className="text-[9px] font-black text-white/10 hover:text-white/40">{showLog ? '✕' : '👁'}</button>
            </div>
         </div>
         {showLog ? (
            <div className="bg-black/50 rounded-2xl p-3 max-h-[400px] overflow-y-auto scrollbar-hide space-y-2 border border-white/5 animate-in slide-in-from-top-4 duration-300">
                {(logType === 'DAY' ? dailyAudit : monthPerformance.superHits.slice(0, 30)).map((h: any, i: number) => (
                    <div key={i} className="flex flex-wrap justify-between items-center py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] px-2 rounded-xl transition-all">
                        <span className="text-white/20 font-black italic uppercase text-[9px] w-14">{h.slot?.replace('JAM ','') || h.slot}</span>
                        <span className="text-amber-500 font-mono font-black tracking-[0.2em] text-[14px] md:text-[18px]">{h.result || h.res}</span>
                        <div className="flex flex-wrap gap-1.5 justify-end flex-1 ml-4">
                           {h.hits?.length > 0 ? h.hits.map((hit: any, hi: number) => (
                               <span key={hi} className={`text-[8px] md:text-[10px] font-black uppercase italic ${LABEL_COLORS[hit.model] || 'text-emerald-500'}`}>
                                 {hit.model} {hit.score}D{hi < h.hits.length - 1 ? ',' : ''}
                               </span>
                           )) : (
                               <span className="text-white/5 text-[8px] uppercase font-black">NO HIT</span>
                           )}
                           {logType === 'SUPER' && <span className="text-emerald-500 font-black text-[10px]">4D-WIN</span>}
                        </div>
                    </div>
                ))}
            </div>
         ) : (
            <div className="grid grid-cols-3 gap-2 py-2 animate-in fade-in duration-300">
               <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <span className="text-xl md:text-2xl font-black text-emerald-400 block drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{formatNum(monthPerformance.poltar['4D'])}</span>
                  <span className="text-[7px] md:text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">POLTAR 4D</span>
               </div>
               <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <span className="text-xl md:text-2xl font-black text-cyan-400 block drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{formatNum(monthPerformance.hybrid['4D'])}</span>
                  <span className="text-[7px] md:text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">HYBRID 4D</span>
               </div>
               <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center">
                  <span className="text-xl md:text-2xl font-black text-amber-500 block drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">{formatNum(monthPerformance.odx['4D'])}</span>
                  <span className="text-[7px] md:text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">ODX 4D</span>
               </div>
            </div>
         )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {renderPredCard('ODX (ANTI-PATTERN)', predictions.odx)}
        {renderPredCard('QRX (QUANTUM GRID)', predictions.qrx)}
        {renderPredCard('PRIME', predictions.prime)}
        {renderPredCard('MOMENTUM', predictions.momentum)}
        {renderPredCard('SHADOW', predictions.shadow)}
        {renderPredCard('CHAOS', predictions.chaos)}
        {renderPredCard('HYBRID', predictions.hybrid)}
        {renderPredCard('SYNTHESIS', predictions.synthesis)}
      </div>

      <div className="bg-[#0b1018] p-3 md:p-4 rounded-[1.8rem] border border-white/5 space-y-3">
        <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
               <h3 className={`text-[9px] font-black uppercase italic tracking-widest ${LABEL_COLORS['POLTAR']}`}>Deep Positional Analysis (Triple Synergy)</h3>
            </div>
            <span className="text-[8px] font-black text-white/60 uppercase">Hit Rate 4D: {formatNum(monthPerformance.poltar['4D'])}</span>
        </div>
        <div className={`grid grid-cols-5 gap-1 md:gap-2`}>
           {['P1', 'P2', 'P3', 'P4', 'P5'].map((lbl, i) => {
             const res = targetEntry?.result;
             const targetDigit = res ? (res.length === 5 ? res[i] : (i > 0 ? res[i-1] : null)) : null;
             
             // Jangan sembunyikan P1 lagi, tetap tampilkan prediksi untuk antisipasi 5D
             return (
               <div key={lbl} className={`bg-black/40 rounded-xl border py-2 md:py-4 flex flex-col items-center gap-1 transition-all ${targetDigit && predictions.poltar[i]?.includes(targetDigit) ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/5'}`}>
                  <span className={`text-[7px] md:text-[9px] font-black uppercase ${targetDigit && predictions.poltar[i]?.includes(targetDigit) ? 'text-rose-400' : 'text-white/20'}`}>{lbl}</span>
                  {predictions.poltar[i]?.map(d => (
                        <span key={d} className={`text-[14px] md:text-lg font-mono font-black transition-all ${targetDigit === d ? 'text-rose-500 scale-125 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-white'}`}>{d}</span>
                  ))}
               </div>
             );
           })}
        </div>
      </div>

      <div className="bg-[#0b1018] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] animate-pulse"></div>
              <h3 className="text-[10px] font-black text-white/80 uppercase italic tracking-widest leading-none">FLUID MATRIX TRACKING (LAST 10)</h3>
           </div>
           <span className="text-[7px] font-black text-white/20 uppercase">Real-time Visualization</span>
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="w-full text-center border-collapse table-fixed min-w-[320px]">
            <thead>
              <tr className="bg-white/5 text-[7px] md:text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/10">
                <th className="py-2 w-[40px] md:w-[100px] border-r border-white/5 italic bg-black/20">BBFS</th>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<th key={num} className="py-2 border-r border-white/5">{num}</th>))}
                <th className="py-2 w-[40px] md:w-[100px] border-l border-white/5 italic bg-black/20 text-[6px] md:text-[9px]">JAM/TGL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {entries.slice(0, 10).map((entry, idx) => (
                <tr key={entry.id || idx} className="hover:bg-white/[0.02] group transition-colors h-7 md:h-12">
                  <td className="py-0.5 border-r border-white/10 bg-black/10">
                    <span className="font-mono font-black text-[8px] md:text-[16px] italic text-white/30 group-hover:text-white/70">
                      {entry.digits?.slice(0,6)}
                    </span>
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const digitIndex = entry.digits?.indexOf(num.toString()) ?? -1;
                    return (
                      <td key={num} className="p-[1px] md:p-1 border-r border-white/5">
                        {digitIndex !== -1 && (
                          <div style={{ backgroundColor: posColors[digitIndex] || '#a855f7' }} className="w-full h-5 md:h-9 rounded-[2px] md:rounded-lg flex items-center justify-center font-black text-black text-[9px] md:text-[20px]">
                            <span className="leading-none">{num}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-0.5 px-0.5 text-center border-l border-white/10 bg-black/10">
                     <span className="text-[7px] md:text-[12px] font-black text-indigo-400 italic leading-none block">{formatSlotLabel(entry.label)}</span>
                     <span className="text-[5px] md:text-[7px] font-bold text-white/20 block mt-0.5 uppercase">{entry.date.split('-').slice(1).reverse().join('/')}</span>
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
