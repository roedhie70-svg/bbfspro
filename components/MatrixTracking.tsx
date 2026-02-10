
import React, { useState, useMemo, useEffect } from 'react';
import { BBFSEntry } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const STORAGE_KEY = 'bebiaks_db_v15';
const timeSlots = ["JAM 01", "JAM 13", "JAM 15", "JAM 16", "JAM 19", "JAM 21", "JAM 22", "JAM 23"];

// PALET WARNA TAJAM (SHARP NEON)
// Index 0: Merah Tajam, 1: Orange Tua, 2: Kuning Terang, 3: Hijau Neon, 4: Cyan Elektrik, 5: Ungu Vivid, 6: Pink Hot
const posColors = [
  '#FF0000', // Merah Tajam (Pos 1 / As)
  '#FF6600', // Orange Tajam (Pos 2 / Kop)
  '#FFFF00', // Kuning Tajam (Pos 3 / Kepala 5D)
  '#00FF00', // Hijau Neon (Pos 4 / Kepala 4D)
  '#00FFFF', // Cyan Elektrik (Pos 5 / Ekor)
  '#BB00FF', // Ungu Vivid
  '#FF0099'  // Pink Hot
];

const formatSlotLabel = (slot: string) => {
  const s = slot.replace('JAM ', '');
  if (s === '15') return '15.15';
  if (s === '21') return '21.15';
  return s;
};

interface MatrixTrackingProps {
  mode: 'BBFS' | 'RESULT';
}

const MatrixTracking: React.FC<MatrixTrackingProps> = ({ mode }) => {
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(timeSlots);

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

  const themeColor = mode === 'BBFS' ? 'indigo' : 'rose';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 pb-24 px-1 md:px-4 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-2 mt-4 px-1">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-6 bg-${themeColor}-500 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]`}></div>
            <h2 className="text-[16px] md:text-[28px] font-black text-white uppercase italic tracking-tighter">
              ULTRA <span className={`text-${themeColor}-500`}>MATRIX {mode}</span>
            </h2>
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-white/50 uppercase italic tracking-widest">SHARP COLOR ENGINE</span>
            </div>
         </div>
         
         {/* Slot Filters */}
         <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {timeSlots.map(slot => (
              <button 
                key={slot} 
                onClick={() => setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])} 
                className={`px-3 md:px-6 py-2 rounded-xl text-[9px] md:text-[13px] font-black transition-all border shrink-0 shadow-2xl ${selectedSlots.includes(slot) ? `bg-${themeColor}-600 border-${themeColor}-400 text-white` : 'bg-black/40 border-white/5 text-white/20 hover:text-white/40'}`}
              >
                {formatSlotLabel(slot)}
              </button>
            ))}
         </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-[#0b1018] rounded-[1.5rem] md:rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="w-full overflow-hidden">
          <table className="w-full text-center border-collapse table-fixed">
            <thead>
              <tr className="bg-white/[0.02] text-[8px] md:text-[12px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/10 italic">
                <th className="py-3 w-[50px] md:w-[140px] border-r border-white/5 bg-black/40">{mode === 'BBFS' ? 'DIGITS' : 'RESULT'}</th>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<th key={num} className="py-3 border-r border-white/5">{num}</th>))}
                <th className="py-3 w-[45px] md:w-[130px] border-l border-white/5 bg-black/40">JAM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredEntries.map((entry, idx) => {
                // PENENTUAN SUMBER DATA: Mode RESULT menggunakan raw result, BBFS menggunakan sorted digits
                const targetStr = (mode === 'BBFS' ? entry.digits : entry.result) || '';
                
                return (
                  <tr key={entry.id || idx} className="hover:bg-white/[0.01] group transition-colors h-8 md:h-16">
                    {/* Data Source Column */}
                    <td className="py-1 border-r border-white/10 bg-black/20">
                      <span className={`font-mono font-black text-[9px] md:text-[20px] italic tracking-tighter ${mode === 'RESULT' ? 'text-amber-500' : 'text-cyan-500'} group-hover:scale-110 transition-transform block`}>
                        {targetStr || '----'}
                      </span>
                    </td>

                    {/* Matrix Columns 0-9 */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                      // Mencari posisi angka dalam string (0, 1, 2, 3...)
                      const digitIndex = targetStr.indexOf(num.toString());
                      
                      return (
                        <td key={num} className="p-[1px] md:p-1 border-r border-white/5">
                          {digitIndex !== -1 && (
                            <div 
                              style={{ 
                                backgroundColor: posColors[digitIndex] || '#FFFFFF',
                                boxShadow: `0 0 15px ${posColors[digitIndex]}44` 
                              }} 
                              className="w-full h-6 md:h-12 rounded-[3px] md:rounded-xl flex items-center justify-center font-black text-black text-[11px] md:text-[28px] animate-in zoom-in-75 duration-300"
                            >
                              <span className="leading-none drop-shadow-md">{num}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Time/Date Column */}
                    <td className="py-1 px-1 text-center border-l border-white/10 bg-black/20">
                       <span className={`text-[8px] md:text-[16px] font-black text-${themeColor}-500 italic leading-none block group-hover:translate-x-1 transition-transform`}>
                         {formatSlotLabel(entry.label)}
                       </span>
                       <span className="text-[5px] md:text-[9px] font-bold text-white/10 block mt-1 uppercase tracking-tighter">
                         {entry.date.split('-').slice(1).reverse().join('/')}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-center opacity-20 py-4">
         <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[1em]">BebiaksPro High-Sharp Matrix Engine</span>
      </div>
    </div>
  );
};

export default MatrixTracking;
