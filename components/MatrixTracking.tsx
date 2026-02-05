
import React, { useState, useMemo, useEffect } from 'react';
import { BBFSEntry } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const STORAGE_KEY = 'bebiaks_db_v15';
const timeSlots = ["JAM 01", "JAM 13", "JAM 15", "JAM 16", "JAM 19", "JAM 21", "JAM 22", "JAM 23"];

const posColors = [
  '#ef4444', '#f59e0b', '#84cc16', '#34d399', '#22d3ee', '#6366f1', '#d946ef'
];

const formatSlotLabel = (slot: string) => {
  const s = slot.replace('JAM ', '');
  if (s === '15') return '15.15';
  if (s === '21') return '21.15';
  return s;
};

const MatrixTracking: React.FC = () => {
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(timeSlots);
  const [activeBbfsId, setActiveBbfsId] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => setDbRefreshTrigger(Date.now());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const entries = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const db = saved ? JSON.parse(saved) : [];
      const combined = [...(Array.isArray(db) ? db : []), ...SYSTEM_BASELINE];
      const uniqueMap = new Map();
      combined.forEach(item => {
        const key = `${item.date}-${item.label}`;
        if (!uniqueMap.has(key) || !item.id.toString().startsWith('h')) {
          uniqueMap.set(key, item);
        }
      });
      return Array.from(uniqueMap.values());
    } catch (e) { return SYSTEM_BASELINE; }
  }, [dbRefreshTrigger]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => selectedSlots.includes(e.label))
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return timeSlots.indexOf(b.label) - timeSlots.indexOf(a.label);
      }).slice(0, 100);
  }, [entries, selectedSlots]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 pb-24 px-1 md:px-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mt-4 px-1">
         <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
            <h2 className="text-[15px] md:text-[24px] font-black text-white uppercase italic tracking-tighter">
              FLUID <span className="text-indigo-400">MATRIX</span>
            </h2>
            <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[7px] font-black text-emerald-500 uppercase italic">Universal Sync Active</span>
            </div>
         </div>
         <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {timeSlots.map(slot => (
              <button key={slot} onClick={() => setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} className={`px-2 md:px-4 py-2 rounded-lg text-[8px] md:text-[12px] font-black transition-all border shrink-0 ${selectedSlots.includes(slot) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40'}`}>
                {formatSlotLabel(slot)}
              </button>
            ))}
         </div>
      </div>
      <div className="bg-[#0b1018] rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="w-full overflow-hidden">
          <table className="w-full text-center border-collapse table-fixed">
            <thead>
              <tr className="bg-white/5 text-[7px] md:text-[11px] font-black text-white/30 uppercase tracking-widest border-b border-white/10">
                <th className="py-2 w-[45px] md:w-[120px] border-r border-white/5 italic bg-black/20">BBFS</th>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<th key={num} className="py-2 border-r border-white/5">{num}</th>))}
                <th className="py-2 w-[40px] md:w-[120px] border-l border-white/5 italic bg-black/20 text-[6px] md:text-[11px]">JAM/TGL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredEntries.map((entry, idx) => (
                <tr key={entry.id || idx} className="hover:bg-white/[0.02] group transition-colors h-7 md:h-14">
                  <td className="py-0.5 border-r border-white/10 bg-black/10"><span className="font-mono font-black text-[8px] md:text-[18px] italic text-white/30 group-hover:text-white/70">{entry.digits}</span></td>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const digitIndex = entry.digits?.indexOf(num.toString()) ?? -1;
                    return (
                      <td key={num} className="p-[1px] md:p-1 border-r border-white/5">
                        {digitIndex !== -1 && (<div style={{ backgroundColor: posColors[digitIndex] || '#a855f7' }} className="w-full h-5 md:h-11 rounded-[2px] md:rounded-lg flex items-center justify-center font-black text-black text-[9px] md:text-[24px]"><span className="leading-none">{num}</span></div>)}
                      </td>
                    );
                  })}
                  <td className="py-0.5 px-0.5 text-center border-l border-white/10 bg-black/10">
                     <span className="text-[7px] md:text-[14px] font-black text-indigo-400 italic leading-none block">{formatSlotLabel(entry.label)}</span>
                     <span className="text-[5px] md:text-[8px] font-bold text-white/20 block mt-0.5 uppercase">{entry.date.split('-').slice(1).reverse().join('/')}</span>
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

export default MatrixTracking;
