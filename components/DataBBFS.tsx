
import React, { useState, useEffect, useMemo } from 'react';
import { BBFSEntry } from '../types';
import { SYSTEM_BASELINE } from '../baseline';

const STORAGE_KEY = 'bebiaks_db_v15';
const timeSlots = ["JAM 01", "JAM 13", "JAM 15", "JAM 16", "JAM 19", "JAM 21", "JAM 22", "JAM 23"];

const DataBBFS: React.FC = () => {
  const [entries, setEntries] = useState<BBFSEntry[]>([]);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPeriode, setNewPeriode] = useState('JAM 01');
  const [newResult, setNewResult] = useState('');
  const [newBBFS, setNewBBFS] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setEntries(parsed);
        else setEntries([]);
      } catch (e) { setEntries([]); }
    }
  }, []);

  // Efek otomatis mengisi BBFS jika Result diisi
  useEffect(() => {
    if (newResult.length >= 4) {
      const sorted = newResult.replace(/\D/g, '').split('').sort().join('');
      setNewBBFS(sorted);
    }
  }, [newResult]);

  const combinedEntries = useMemo(() => {
    const uniqueMap = new Map();
    [...entries, ...SYSTEM_BASELINE].forEach(item => {
      const key = `${item.date}-${item.label}`;
      if (!uniqueMap.has(key) || !item.id.toString().startsWith('h')) {
        uniqueMap.set(key, item);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const da = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (da !== 0) return da;
      return timeSlots.indexOf(b.label) - timeSlots.indexOf(a.label);
    });
  }, [entries]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBBFS || !newDate) return;
    const newEntry: BBFSEntry = {
      id: Date.now().toString(),
      label: newPeriode,
      result: newResult.replace(/\D/g, ''),
      digits: newBBFS.replace(/\D/g, ''),
      date: newDate,
      isCustom: true
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setToast("DATABASE UPDATED");
    setTimeout(() => setToast(null), 2000);
    setNewResult(''); setNewBBFS('');
  };

  const deleteEntry = (id: string) => {
    if (id.toString().startsWith('h')) return;
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const wipeAllData = () => {
    if (window.confirm("Hapus SEMUA data custom? (Data baseline system akan tetap ada)")) {
      localStorage.removeItem(STORAGE_KEY);
      setEntries([]);
      window.dispatchEvent(new Event('storage'));
      setToast("DATABASE RESET SUCCESS");
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6 pb-24">
      {toast && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-2 rounded-full z-[100] font-black text-xs uppercase tracking-widest">{toast}</div>}
      
      <div className="bg-[#0b1018]/60 border border-cyan-500/20 rounded-[2rem] p-6 font-mono shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
              <h3 className="text-[12px] font-black text-cyan-500 uppercase italic tracking-[0.4em]">STATUS DATABASE : AKTIF</h3>
           </div>
           <button onClick={wipeAllData} className="text-[9px] font-black text-rose-500 uppercase bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20 tracking-widest hover:bg-rose-500 hover:text-white transition-all">
             WIPE ALL CUSTOM DATA
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] md:text-sm">
           <div className="space-y-1.5 border-l-2 border-cyan-500/30 pl-4 py-1">
              <p className="font-black text-white text-[13px] mb-2">Sync Terakhir: 04-Feb-2026</p>
              <p className="text-white/40 italic">Data histori sistem sinkron dengan database global BebiaksPro.</p>
           </div>
           <div className="flex items-center justify-end">
              <span className="text-[32px] font-black text-white/5 uppercase tracking-tighter">TOTAL: {combinedEntries.length}</span>
           </div>
        </div>
      </div>

      <div className="bg-[#0b1018] p-6 rounded-3xl border border-white/5 shadow-2xl">
        <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 italic">INPUT DATA BARU</h3>
        <form onSubmit={handleSaveEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none" />
          <select value={newPeriode} onChange={e => setNewPeriode(e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none">
             {timeSlots.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="text" placeholder="RESULT" value={newResult} onChange={e => setNewResult(e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none font-mono" />
          <input type="text" placeholder="BBFS" value={newBBFS} onChange={e => setNewBBFS(e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none font-mono" />
          <button type="submit" className="md:col-span-4 bg-cyan-600 py-4 rounded-xl font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-cyan-500">TAMBAHKAN KE DATABASE</button>
        </form>
      </div>

      <div className="bg-[#0b1018] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
           <input type="text" placeholder="Cari di database..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg text-sm text-white outline-none w-full md:w-96 font-mono" />
           <span className="text-[10px] font-black text-white/20 ml-4 italic uppercase">Entri Aktif: {combinedEntries.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] italic">
              <tr><th className="p-4">TANGGAL</th><th className="p-4">PERIODE</th><th className="p-4">RESULT</th><th className="p-4">BBFS</th><th className="p-4">X</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {combinedEntries.filter(e => e.date.includes(searchTerm) || (e.digits && e.digits.includes(searchTerm)) || (e.result && e.result.includes(searchTerm))).slice(0, 100).map(e => (
                <tr key={e.id} className="text-white/80 hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-xs font-mono">{e.date}</td>
                  <td className="p-4 text-xs font-black italic text-cyan-500">{e.label}</td>
                  <td className="p-4 text-[14px] font-mono text-amber-500 font-black tracking-widest">{e.result || '----'}</td>
                  <td className="p-4 text-xs font-mono text-white/40 tracking-tighter">{e.digits}</td>
                  <td className="p-4">
                    {!e.id.toString().startsWith('h') ? (
                      <button onClick={() => deleteEntry(e.id)} className="text-rose-500 font-black hover:scale-125 transition-all">✕</button>
                    ) : (
                      <span className="text-white/5 text-[8px] font-black uppercase">BASE</span>
                    )}
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

export default DataBBFS;
