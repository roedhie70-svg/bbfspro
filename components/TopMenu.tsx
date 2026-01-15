
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
        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center gap-1 transition-all border ${isOpen ? 'bg-cyan-600/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
      >
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
        <div className="w-1 h-1 rounded-full bg-white"></div>
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-56 bg-[#0a0f18]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              DATA BBFS
            </button>
          </div>
          <div className="p-3 border-t border-white/5 bg-black/40 flex items-center justify-center">
            <span className="text-[8px] font-black text-white/20 tracking-[0.3em] uppercase italic">System v2.5 Stable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopMenu;
