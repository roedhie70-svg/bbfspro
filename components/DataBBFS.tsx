import React, { useState, useEffect, useMemo } from 'react';
import { 
  getDigitsData, 
  getSinglePermutations, 
  getTwinPermutations 
} from '../services/permutationEngine';

interface BBFSEntry {
  id: string;
  label: string; 
  digits: string;
  date: string; 
  isCustom?: boolean;
}

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY = 'bebiaks_db_v15';

const BBFS_TOP_RANKINGS = [
  "1259", "3458", "1128", "0234", "1456", "0278", "0578", "1289", "1236", "3689",
  "5679", "1569", "4679", "0129", "1267", "0238", "1347", "1469", "0589", "3679",
  "5689", "1688", "2347", "3557", "4579", "1589", "2589", "1579", "2358", "3456",
  "0135", "1357", "0379", "0678", "1389", "0269", "0367", "1227", "0568", "1235",
  "1369", "0189", "0124", "1258", "0358", "0389"
];

const DataBBFS: React.FC = () => {
  const [entries, setEntries] = useState<BBFSEntry[]>([]);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPeriode, setNewPeriode] = useState('JAM 13');
  const [newDigits, setNewDigits] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const initialData: BBFSEntry[] = [
    // 15 JAN
    { id: 'v15-15-1', date: '2026-01-15', label: 'JAM 01', digits: '3877' },
    // 14 JAN
    { id: 'v15-14-4', date: '2026-01-14', label: 'JAM 23', digits: '1031' },
    { id: 'v15-14-22', date: '2026-01-14', label: 'JAM 22', digits: '5639' },
    { id: 'v15-14-0', date: '2026-01-14', label: 'JAM 19', digits: '8484' },
    { id: 'v15-14-1', date: '2026-01-14', label: 'JAM 16', digits: '5038' },
    { id: 'v15-14-2', date: '2026-01-14', label: 'JAM 13', digits: '8402' },
    { id: 'v15-14-3', date: '2026-01-14', label: 'JAM 01', digits: '0991' },
    // 13 JAN
    { id: 'v15-13-1', date: '2026-01-13', label: 'JAM 23', digits: '9235' },
    { id: 'v15-13-2', date: '2026-01-13', label: 'JAM 22', digits: '4585' },
    { id: 'v15-13-3', date: '2026-01-13', label: 'JAM 19', digits: '2990' },
    { id: 'v15-13-4', date: '2026-01-13', label: 'JAM 16', digits: '0654' },
    { id: 'v15-13-5', date: '2026-01-13', label: 'JAM 13', digits: '0036' },
    { id: 'v15-13-6', date: '2026-01-13', label: 'JAM 01', digits: '8256' },
    // 12 JAN
    { id: 'v15-12-1', date: '2026-01-12', label: 'JAM 23', digits: '1327' },
    { id: 'v15-12-2', date: '2026-01-12', label: 'JAM 22', digits: '5710' },
    { id: 'v15-12-3', date: '2026-01-12', label: 'JAM 19', digits: '6350' },
    { id: 'v15-12-4', date: '2026-01-12', label: 'JAM 16', digits: '6972' },
    { id: 'v15-12-5', date: '2026-01-12', label: 'JAM 13', digits: '3744' },
    { id: 'v15-12-6', date: '2026-01-12', label: 'JAM 01', digits: '1035' },
    // 11 JAN
    { id: 'v15-11-1', date: '2026-01-11', label: 'JAM 23', digits: '0319' },
    { id: 'v15-11-2', date: '2026-01-11', label: 'JAM 22', digits: '0831' },
    { id: 'v15-11-3', date: '2026-01-11', label: 'JAM 19', digits: '0997' },
    { id: 'v15-11-4', date: '2026-01-11', label: 'JAM 16', digits: '4621' },
    { id: 'v15-11-5', date: '2026-01-11', label: 'JAM 13', digits: '3118' },
    { id: 'v15-11-6', date: '2026-01-11', label: 'JAM 01', digits: '0737' },
    // 10 JAN
    { id: 'v15-10-1', date: '2026-01-10', label: 'JAM 23', digits: '0248' },
    { id: 'v15-10-2', date: '2026-01-10', label: 'JAM 22', digits: '7759' },
    { id: 'v15-10-3', date: '2026-01-10', label: 'JAM 19', digits: '5820' },
    { id: 'v15-10-4', date: '2026-01-10', label: 'JAM 16', digits: '1827' },
    { id: 'v15-10-5', date: '2026-01-10', label: 'JAM 13', digits: '7798' },
    { id: 'v15-10-6', date: '2026-01-10', label: 'JAM 01', digits: '7026' },
    // 09 JAN
    { id: 'v15-09-1', date: '2026-01-09', label: 'JAM 23', digits: '2582' },
    { id: 'v15-09-2', date: '2026-01-09', label: 'JAM 22', digits: '2790' },
    { id: 'v15-09-3', date: '2026-01-09', label: 'JAM 19', digits: '6626' },
    { id: 'v15-09-4', date: '2026-01-09', label: 'JAM 16', digits: '5888' },
    { id: 'v15-09-5', date: '2026-01-09', label: 'JAM 13', digits: '2838' },
    { id: 'v15-09-6', date: '2026-01-09', label: 'JAM 01', digits: '8023' },
    // 08 JAN
    { id: 'v15-08-1', date: '2026-01-08', label: 'JAM 23', digits: '3561' },
    { id: 'v15-08-2', date: '2026-01-08', label: 'JAM 22', digits: '1496' },
    { id: 'v15-08-3', date: '2026-01-08', label: 'JAM 19', digits: '8395' },
    { id: 'v15-08-4', date: '2026-01-08', label: 'JAM 16', digits: '6032' },
    { id: 'v15-08-5', date: '2026-01-08', label: 'JAM 13', digits: '3032' },
    { id: 'v15-08-6', date: '2026-01-08', label: 'JAM 01', digits: '9163' },
    // 07 JAN
    { id: 'v15-07-1', date: '2026-01-07', label: 'JAM 23', digits: '6623' },
    { id: 'v15-07-2', date: '2026-01-07', label: 'JAM 22', digits: '8298' },
    { id: 'v15-07-3', date: '2026-01-07', label: 'JAM 19', digits: '3115' },
    { id: 'v15-07-4', date: '2026-01-07', label: 'JAM 16', digits: '5378' },
    { id: 'v15-07-5', date: '2026-01-07', label: 'JAM 13', digits: '2238' },
    { id: 'v15-07-6', date: '2026-01-07', label: 'JAM 01', digits: '8978' },
    // 06 JAN
    { id: 'v15-06-1', date: '2026-01-06', label: 'JAM 23', digits: '5788' },
    { id: 'v15-06-2', date: '2026-01-06', label: 'JAM 22', digits: '9185' },
    { id: 'v15-06-3', date: '2026-01-06', label: 'JAM 19', digits: '2378' },
    { id: 'v15-06-4', date: '2026-01-06', label: 'JAM 16', digits: '0579' },
    { id: 'v15-06-5', date: '2026-01-06', label: 'JAM 13', digits: '0776' },
    { id: 'v15-06-6', date: '2026-01-06', label: 'JAM 01', digits: '7312' },
    // 05 JAN
    { id: 'v15-05-1', date: '2026-01-05', label: 'JAM 23', digits: '2407' },
    { id: 'v15-05-2', date: '2026-01-05', label: 'JAM 22', digits: '1397' },
    { id: 'v15-05-3', date: '2026-01-05', label: 'JAM 19', digits: '8441' },
    { id: 'v15-05-4', date: '2026-01-05', label: 'JAM 16', digits: '2241' },
    { id: 'v15-05-5', date: '2026-01-05', label: 'JAM 13', digits: '8620' },
    { id: 'v15-05-6', date: '2026-01-05', label: 'JAM 01', digits: '2748' },
    // 04 JAN
    { id: 'v15-04-1', date: '2026-01-04', label: 'JAM 23', digits: '7499' },
    { id: 'v15-04-2', date: '2026-01-04', label: 'JAM 22', digits: '0076' },
    { id: 'v15-04-3', date: '2026-01-04', label: 'JAM 19', digits: '3925' },
    { id: 'v15-04-4', date: '2026-01-04', label: 'JAM 16', digits: '5961' },
    { id: 'v15-04-5', date: '2026-01-04', label: 'JAM 13', digits: '6783' },
    { id: 'v15-04-6', date: '2026-01-04', label: 'JAM 01', digits: '7008' },
    // 03 JAN
    { id: 'v15-03-1', date: '2026-01-03', label: 'JAM 23', digits: '1027' },
    { id: 'v15-03-2', date: '2026-01-03', label: 'JAM 22', digits: '9480' },
    { id: 'v15-03-3', date: '2026-01-03', label: 'JAM 19', digits: '2430' },
    { id: 'v15-03-4', date: '2026-01-03', label: 'JAM 16', digits: '2820' },
    { id: 'v15-03-5', date: '2026-01-03', label: 'JAM 13', digits: '5104' },
    { id: 'v15-03-6', date: '2026-01-03', label: 'JAM 01', digits: '9783' },
    // 02 JAN
    { id: 'v15-02-1', date: '2026-01-02', label: 'JAM 23', digits: '8825' },
    { id: 'v15-02-2', date: '2026-01-02', label: 'JAM 22', digits: '9403' },
    { id: 'v15-02-3', date: '2026-01-02', label: 'JAM 19', digits: '2938' },
    { id: 'v15-02-4', date: '2026-01-02', label: 'JAM 16', digits: '3929' },
    { id: 'v15-02-5', date: '2026-01-02', label: 'JAM 13', digits: '7857' },
    { id: 'v15-02-6', date: '2026-01-02', label: 'JAM 01', digits: '4798' },
    // 01 JAN
    { id: 'v15-01-1', date: '2026-01-01', label: 'JAM 23', digits: '1451' },
    { id: 'v15-01-2', date: '2026-01-01', label: 'JAM 22', digits: '8877' },
    { id: 'v15-01-3', date: '2026-01-01', label: 'JAM 19', digits: '5220' },
    { id: 'v15-01-4', date: '2026-01-01', label: 'JAM 16', digits: '6218' },
    { id: 'v15-01-5', date: '2026-01-01', label: 'JAM 13', digits: '2535' },
    { id: 'v15-01-6', date: '2026-01-01', label: 'JAM 01', digits: '6922' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
        } else {
          setEntries(initialData);
        }
      } catch (e) { setEntries(initialData); }
    } else {
      setEntries(initialData);
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDigits || !newDate) return;
    const digitsOnly = newDigits.replace(/\D/g, '').slice(0, 20);

    setEntries(prev => {
      if (editingId) {
        return prev.map(entry => 
          entry.id === editingId ? { ...entry, label: newPeriode, digits: digitsOnly, date: newDate } : entry
        );
      } else {
        const newEntry: BBFSEntry = {
          id: Date.now().toString(),
          label: newPeriode,
          digits: digitsOnly,
          date: newDate,
          isCustom: true
        };
        return [newEntry, ...prev];
      }
    });

    showToast(editingId ? "DATA UPDATED" : "DATA SAVED");
    setEditingId(null);
    setNewDigits('');
    setCurrentPage(1);
  };

  const deleteEntry = (id: string) => {
    if (!window.confirm('Hapus data?')) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    showToast("DATA DELETED");
  };

  const handleEditClick = (entry: BBFSEntry) => {
    setEditingId(entry.id);
    setNewDate(entry.date);
    setNewPeriode(entry.label);
    setNewDigits(entry.digits);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetToDefault = () => {
    if (!window.confirm('Reset database riwayat ke setelan baku (81 Data Spreadsheet)?')) return;
    setEntries(initialData);
    setCurrentPage(1);
    setSearchTerm('');
    showToast("DATABASE RESTORED");
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`;
    } catch { return dateStr; }
  };

  const getMatrixSignature = (digits: string) => {
    return digits.split('').sort().join('');
  };

  const checkMatrixMatch = (pattern: string, dbDigits: string) => {
    const pCounts: Record<string, number> = {};
    for (const d of pattern) pCounts[d] = (pCounts[d] || 0) + 1;
    const dbCounts: Record<string, number> = {};
    for (const d of dbDigits) dbCounts[d] = (dbCounts[d] || 0) + 1;
    return Object.keys(pCounts).every(d => (dbCounts[d] || 0) >= pCounts[d]);
  };

  const matrixStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(entry => {
      const sig = getMatrixSignature(entry.digits);
      stats[sig] = (stats[sig] || 0) + 1;
    });
    return stats;
  }, [entries]);

  const renderResultsWithHighlight = (digits: string) => {
    if (!digits) return null;
    const { uniqueDigits, repeatingDigits, counts } = getDigitsData(digits);
    const single = getSinglePermutations(uniqueDigits, 4);
    const twin = getTwinPermutations(uniqueDigits, repeatingDigits, 4, counts);
    const all = [...single, ...twin];
    
    return all.map((item, idx) => (
      <React.Fragment key={idx}>
        <span className={item === digits ? "text-white font-black bg-emerald-500 px-2 py-0.5 rounded shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-110 inline-block mx-1.5 border border-emerald-300/50" : ""}>
          {item}
        </span>
        {idx < all.length - 1 && <span className="text-white/5 mx-0.5 opacity-20">•</span>}
      </React.Fragment>
    ));
  };

  const topRankAnalytics = useMemo(() => {
    return BBFS_TOP_RANKINGS.map((pattern, index) => {
      const matchedEntry = [...entries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).find(e => checkMatrixMatch(pattern, e.digits));
      const isOut = !!matchedEntry;
      return { rank: index + 1, digits: pattern, isOut, matchedEntry };
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const search = searchTerm.trim().toLowerCase();
    
    return entries.filter(entry => {
      const { uniqueDigits, repeatingDigits, counts } = getDigitsData(entry.digits);
      const single = getSinglePermutations(uniqueDigits, 4);
      const twin = getTwinPermutations(uniqueDigits, repeatingDigits, 4, counts);
      const allMatrixOutput = [...single, ...twin];
      
      return (
        allMatrixOutput.some(m => m.includes(search)) ||
        entry.digits.includes(search) ||
        entry.date.toLowerCase().includes(search) ||
        entry.label.toLowerCase().includes(search)
      );
    });
  }, [entries, searchTerm]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.label.localeCompare(a.label);
    });
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEntries, currentPage]);

  const outCount = topRankAnalytics.filter(a => a.isOut).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-700 relative">
      
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full font-black text-[10px] tracking-widest z-[200] shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-bounce uppercase">
          {toast}
        </div>
      )}

      {/* TOP RANK TRACKER */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-[#0b1018]/95 border border-white/5 rounded-[1.5rem] p-4 md:p-6 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                 <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 10.63 21 8.55 21 8V7c0-1.1-.9-2-2-2z" />
                 </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[16px] font-black text-cyan-400 uppercase tracking-[0.1em] italic leading-tight">Top Rank Tracker</h4>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em] mt-0.5 italic">Real-time Performance Monitoring</p>
              </div>
            </div>
            
            <div className="bg-black/60 border border-white/5 p-1 rounded-xl flex items-center shadow-inner">
               <div className="px-4 py-2 text-center">
                  <div className="text-[20px] font-black text-white italic leading-none">{outCount}</div>
                  <div className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-1">Out</div>
               </div>
               <div className="w-px h-8 bg-white/5"></div>
               <div className="px-4 py-2 text-center">
                  <div className="text-[20px] font-black text-white/20 italic leading-none">{BBFS_TOP_RANKINGS.length - outCount}</div>
                  <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Wait</div>
               </div>
               <div className="w-px h-8 bg-white/5"></div>
               <div className="px-4 py-2 text-center">
                  <div className="text-[20px] font-black text-cyan-500 italic leading-none">{Math.round((outCount / BBFS_TOP_RANKINGS.length) * 100)}%</div>
                  <div className="text-[7px] font-black text-cyan-500 uppercase tracking-widest mt-1">Cov</div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {topRankAnalytics.map((item) => (
              <div 
                key={item.rank} 
                className={`relative flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-300 ${
                  item.isOut 
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-[#0f141d] border-white/5'
                }`}
              >
                <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black ${
                  item.isOut ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/10'
                }`}>
                  {item.rank}
                </div>
                <span className={`text-[13px] font-mono font-black tracking-tighter ${
                  item.isOut ? 'text-emerald-400' : 'text-white/15'
                }`}>
                  {item.digits}
                </span>
                {item.isOut && (
                  <div className="mt-1">
                    <span className="text-[6px] text-white/20 font-black uppercase tracking-tighter">{formatDateShort(item.matchedEntry?.date || '')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="max-w-lg mx-auto w-full px-4">
        <form onSubmit={handleSaveEntry} className="bg-[#0a0f18]/95 backdrop-blur-3xl p-5 rounded-[1.5rem] border border-white/5 shadow-2xl space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Tanggal</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] font-black text-amber-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Periode</label>
              <select value={newPeriode} onChange={(e) => setNewPeriode(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] font-black text-white outline-none uppercase">
                {["JAM 01", "JAM 13", "JAM 16", "JAM 19", "JAM 22", "JAM 23"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Hasil BBFS</label>
            <input type="text" inputMode="numeric" value={newDigits} onChange={(e) => setNewDigits(e.target.value.replace(/\D/g, ''))} placeholder="0000" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-[16px] font-mono font-black text-cyan-400 tracking-[0.2em] outline-none text-center" />
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl text-black bg-amber-600 hover:bg-amber-500 font-black text-[12px] uppercase tracking-[0.2em] transition-all italic active:scale-95 shadow-xl">
            {editingId ? 'UPDATE DATA' : 'SUBMIT DATABASE'}
          </button>
        </form>
      </div>

      {/* SEARCH BAR RED NEON */}
      <div className="max-w-7xl mx-auto px-4">
          <div className="relative group overflow-hidden rounded-full p-[2px] bg-red-600/30">
             <div className="absolute inset-0 bg-red-600 blur-[8px] opacity-0 group-focus-within:opacity-40 transition-opacity"></div>
             <div className="relative flex items-center bg-[#05070a] rounded-full px-6 py-2 border-[2.5px] border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <input 
                  type="text" 
                  placeholder="Pencarian Matrix Baku..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-white font-black text-[14px] uppercase tracking-widest placeholder-white/10 outline-none italic"
                />
                <div className="flex items-center gap-4">
                   {searchTerm && (
                     <button onClick={() => setSearchTerm('')} className="text-red-500/50 hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   )}
                   <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
             </div>
          </div>
      </div>

      {/* DATA TABLE RIWAYAT */}
      <div className="px-4 max-w-7xl mx-auto">
        <div className="bg-[#0a0f18]/90 backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-center min-w-[900px]">
              <thead>
                <tr className="text-[10px] text-white/40 font-black uppercase border-b border-white/5 bg-white/[0.02]">
                  <th className="py-6 w-[70px]">NO</th>
                  <th className="py-6 w-[140px]">TANGGAL</th>
                  <th className="py-6 w-[100px]">PERIODE</th>
                  <th className="py-6 w-[140px]">BBFS RESULT</th>
                  <th className="py-6 px-10 text-left">HASIL MATRIX (CLONE CHECKER)</th>
                  <th className="py-6 pr-8 text-right w-[140px]">OPSI</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {paginatedEntries.length > 0 ? (
                  paginatedEntries.map((set, index) => {
                    const signature = getMatrixSignature(set.digits);
                    const isClone = matrixStats[signature] > 1;
                    const globalIndex = sortedEntries.length - ((currentPage - 1) * ITEMS_PER_PAGE + index);
                    
                    return (
                      <tr key={set.id} className={`border-b border-white/[0.02] hover:bg-white/[0.04] transition-all group ${isClone ? 'bg-amber-500/[0.02]' : ''}`}>
                        <td className="py-6 text-white/10 font-black">{globalIndex}</td>
                        <td className="py-6 font-black text-white italic opacity-80">{formatDateShort(set.date)}</td>
                        <td className="py-6 text-white/30 font-black tracking-widest text-[11px]">{set.label}</td>
                        <td className="py-6">
                          <div className="flex flex-col items-center gap-1.5">
                              <div className={`relative px-4 py-2 rounded-xl border font-mono font-black text-[15px] tracking-[0.1em] transition-all overflow-hidden ${isClone ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-105' : 'bg-black/40 border-white/5 text-cyan-400'}`}>
                                <div className="absolute top-0 left-0 w-3 h-3 bg-emerald-600" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                                {set.digits}
                              </div>
                              {isClone && (
                                <div className="flex flex-col items-center leading-none">
                                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse">CLONE REPEAT</span>
                                  <span className="text-[6px] font-black text-white/20 uppercase tracking-tighter mt-1 italic">Matrix Pattern Match</span>
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="py-6 px-10 text-left">
                          <div className="bg-black/50 p-3 rounded-2xl border border-white/5 shadow-inner max-w-[550px]">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 italic">Matrix Analysis Output:</div>
                            <div className="text-cyan-400/70 font-mono text-[11px] leading-relaxed break-all font-bold tracking-tight">
                                {renderResultsWithHighlight(set.digits)}
                            </div>
                          </div>
                        </td>
                        <td className="py-6 pr-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleEditClick(set)} className="w-10 h-10 flex items-center justify-center text-amber-500 bg-amber-500/5 rounded-xl border border-amber-500/10 hover:bg-amber-500 hover:text-black transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => deleteEntry(set.id)} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-white/20 font-black uppercase tracking-widest italic text-center">Data Not Found in Matrix</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 hover:text-white disabled:opacity-20 transition-all uppercase">Prev</button>
              <span className="px-4 text-[10px] font-black text-white/60 uppercase">PAGE {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 hover:text-white disabled:opacity-20 transition-all uppercase">Next</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <button onClick={resetToDefault} className="px-6 py-3 bg-white/5 border border-white/5 text-white/20 text-[10px] font-black uppercase rounded-xl hover:text-rose-500 transition-all tracking-[0.2em] italic">RESTORE BAKU DATABASE</button>
      </div>
    </div>
  );
};

export default DataBBFS;
