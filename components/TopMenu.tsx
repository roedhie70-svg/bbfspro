import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../types';

interface TopMenuProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const TopMenu: React.FC<TopMenuProps> = ({ currentView, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-6 left-6 z-[110]" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${isOpen ? 'bg-cyan-600/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black/40 border-white/10 hover:bg-white/20'}`}
      >
        <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-64 bg-[#0a0f18]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-2 space-y-1">
            <button 
              onClick={() => { onNavigate('BBFS'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black transition-all ${currentView === 'BBFS' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              BBFS CALCULATOR
            </button>
            <button 
              onClick={() => { onNavigate('DATA'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black transition-all ${currentView === 'DATA' ? 'bg-amber-500 text-black' : 'text-white/60 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M9 16h6M9 8h6" />
              </svg>
              DATA DATABASE
            </button>
            <button 
              onClick={() => { onNavigate('ARCHIVE'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black transition-all ${currentView === 'ARCHIVE' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              HISTORICAL ARCHIVE
            </button>
            <button 
              onClick={() => { onNavigate('MATRIX'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black transition-all ${currentView === 'MATRIX' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              MATRIKS TRACKING
            </button>
            <button 
              onClick={() => { onNavigate('PREDICTION'); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black transition-all ${currentView === 'PREDICTION' ? 'bg-rose-500 text-white' : 'text-white/60 hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              PREDIKSI RESULT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopMenu;