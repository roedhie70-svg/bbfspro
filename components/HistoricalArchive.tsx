
import React, { useMemo, useState, useEffect } from 'react';
import { BBFSEntry } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const STORAGE_KEY = 'bebiaks_db_v15';
const timeSlots = ["JAM 01", "JAM 13", "JAM 15", "JAM 16", "JAM 19", "JAM 21", "JAM 22", "JAM 23"];

const BBFS_TOP_RANKINGS = [
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

// LOGIKA EXACT MATCH: Tidak menyortir, hanya membandingkan string langsung.
const checkStrictMatch = (pattern: string, dbDigits: string) => {
  if (!dbDigits || !pattern) return false;
  return pattern === dbDigits;
};

const HistoricalArchive: React.FC = () => {
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleStorage = () => setDbRefreshTrigger(Date.now());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const dbEntries = useMemo<BBFSEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const db = saved ? (JSON.parse(saved) as BBFSEntry[]) : [];
      const combined: BBFSEntry[] = [...(Array.isArray(db) ? db : []), ...SYSTEM_BASELINE];
      const uniqueMap = new Map<string, BBFSEntry>();
      combined.forEach((item) => {
        const key = `${item.date}-${item.label}`;
        if (!uniqueMap.has(key) || !item.id.toString().startsWith('h')) {
          uniqueMap.set(key, item);
        }
      });
      return Array.from(uniqueMap.values());
    } catch (e) { return SYSTEM_BASELINE; }
  }, [dbRefreshTrigger]);

  // THRESHOLD: Mulai 1 Februari 2026
  const febThreshold = useMemo(() => new Date('2026-02-01').getTime(), []);

  // Filter data histori khusus untuk penentuan status OUT Top Rank
  const febEntries = useMemo(() => {
    return dbEntries.filter(e => new Date(e.date).getTime() >= febThreshold);
  }, [dbEntries, febThreshold]);

  const duplicateTracking = useMemo(() => {
    const sigCounts: Record<string, { date: string, slot: string }[]> = {};
    dbEntries.forEach(e => {
      if (!e.digits) return;
      const sig = e.digits; // Gunakan literal digits untuk tracking duplikat strict
      if (!sigCounts[sig]) sigCounts[sig] = [];
      sigCounts[sig].push({ date: e.date, slot: e.label });
    });
    const result: Record<string, number> = {};
    Object.entries(sigCounts).forEach(([_, occurrences]) => {
      if (occurrences.length > 1) {
        const sortedOccurrences = [...occurrences].sort((a: any, b: any) => {
          const da = new Date(a.date as string).getTime();
          const db = new Date(b.date as string).getTime();
          if (da !== db) return da - db;
          return timeSlots.indexOf(a.slot) - timeSlots.indexOf(b.slot);
        });
        sortedOccurrences.forEach((occ, idx) => {
          result[`${occ.date}|${occ.slot}`] = idx + 1;
        });
      }
    });
    return result;
  }, [dbEntries]);

  // Analytics berdasarkan data sejak 1-Feb-2026
  const topRankAnalytics = useMemo(() => {
    return BBFS_TOP_RANKINGS.map((item, index) => {
      const matchedEntry = febEntries.find(e => checkStrictMatch(item.digits, e.digits));
      return { rank: index + 1, digits: item.digits, qty: item.qty, isOut: !!matchedEntry };
    });
  }, [febEntries]);

  // Menandai posisi di Grid Archive (tetap menunjukkan semua histori tapi menggunakan logic exact match)
  const topRankMatches = useMemo(() => {
    const matches: Record<string, number> = {};
    dbEntries.forEach(e => {
      if (!e.digits) return;
      const foundIdx = BBFS_TOP_RANKINGS.findIndex(rank => checkStrictMatch(rank.digits, e.digits));
      if (foundIdx !== -1) {
        // Hanya beri label merah jika tanggal >= 1 Feb 2026
        if (new Date(e.date).getTime() >= febThreshold) {
            matches[`${e.date}|${e.label}`] = foundIdx + 1;
        }
      }
    });
    return matches;
  }, [dbEntries, febThreshold]);

  const historyGridData = useMemo(() => {
    const dates = Array.from(new Set(dbEntries.map(e => e.date)))
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
    return dates.map(date => {
      const dayData: Record<string, string> = {};
      timeSlots.forEach(slot => {
        const entry = dbEntries.find(e => e.date === date && e.label === slot);
        dayData[slot] = entry ? entry.digits : '';
      });
      return { date, slots: dayData };
    });
  }, [dbEntries]);

  const outCount = topRankAnalytics.filter(a => a.isOut).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 px-2">
      <div className="bg-[#0b1018] border border-white/5 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h4 className="text-xl font-black text-white italic">TOP RANK <span className="text-cyan-400">STATUS (STRICT)</span></h4>
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">DATA MONITORING SINCE 01-FEB-2026</span>
          </div>
          <div className="flex gap-4">
             <div className="text-center"><div className="text-xl font-black text-rose-500">{outCount}</div><div className="text-[8px] opacity-40 uppercase font-black tracking-widest">OUT</div></div>
             <div className="text-center"><div className="text-xl font-black text-cyan-400">{BBFS_TOP_RANKINGS.length - outCount}</div><div className="text-[8px] opacity-40 uppercase font-black tracking-widest">WAIT</div></div>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2">
           {topRankAnalytics.map(item => (
             <div key={item.rank} className={`flex items-center justify-between p-1 rounded-lg border text-[10px] font-black transition-all duration-300 ${item.isOut ? 'border-rose-500/50 bg-rose-500/10 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-white/5 bg-white/5 text-cyan-400'}`}>
               <span className="opacity-40">{item.rank}</span>
               <span>{item.digits}</span>
             </div>
           ))}
        </div>
      </div>
      <div className="bg-[#0b1018] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
         <div className="p-4 bg-white/5 flex justify-between items-center">
           <h2 className="text-lg font-black text-white uppercase italic">Archive <span className="text-amber-500">Grid</span></h2>
           <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Feb-2026 Exact Match Active</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse table-fixed min-w-[1000px]">
               <thead>
                  <tr className="bg-black text-[10px] font-black text-white/30 uppercase">
                     <th className="py-4 border-r border-white/5">TANGGAL</th>
                     {timeSlots.map(s => <th key={s} className="border-r border-white/5">{s.replace('JAM ','')}</th>)}
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {historyGridData.map((day, di) => {
                    const isWithinFeb = new Date(day.date).getTime() >= febThreshold;
                    return (
                      <tr key={di} className={`hover:bg-white/[0.02] h-12 ${!isWithinFeb ? 'opacity-40' : ''}`}>
                        <td className="font-black text-white/40 italic border-r border-white/5">{day.date}</td>
                        {timeSlots.map(s => {
                          const cellId = `${day.date}|${s}`;
                          const trIdx = topRankMatches[cellId];
                          const dup = duplicateTracking[cellId];
                          const digits = day.slots[s];
                          return (
                            <td key={s} className="px-1 border-r border-white/5">
                              {digits ? (
                                <div className={`relative h-10 rounded-lg flex flex-col items-center justify-center border ${trIdx ? 'border-rose-500 bg-rose-950/40' : dup ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5 bg-white/5'}`}>
                                  {trIdx && <span className="absolute top-0 left-0 right-0 text-[8px] bg-rose-500 text-white font-black italic">#{trIdx}</span>}
                                  <span className={`text-[15px] font-mono font-black ${trIdx ? 'text-white' : dup ? 'text-amber-500' : 'text-cyan-400'}`}>{digits}</span>
                                  {dup && <span className="absolute bottom-0 right-0 text-[8px] font-black text-amber-500">!{dup}</span>}
                                </div>
                              ) : <span className="opacity-5">--</span>}
                            </td>
                          );
                        })}
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

export default HistoricalArchive;
