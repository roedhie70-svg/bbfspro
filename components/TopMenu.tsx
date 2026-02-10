
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

  const menuItems: { id: ViewType, label: string, color: string, icon: React.ReactNode }[] = [
    { 
      id: 'BBFS', 
      label: 'BBFS CALCULATOR', 
      color: 'bg-cyan-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    },
    { 
      id: 'DATA', 
      label: 'DATA DATABASE', 
      color: 'bg-amber-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M9 16h6M9 8h6" />
    },
    { 
      id: 'ARCHIVE', 
      label: 'HISTORICAL ARCHIVE', 
      color: 'bg-emerald-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    { 
      id: 'MATRIX_BBFS', 
      label: 'MATRIX TRACKING BBFS', 
      color: 'bg-indigo-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    },
    { 
      id: 'MATRIX_RESULT', 
      label: 'MATRIX TRACKING RESULT', 
      color: 'bg-rose-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    },
    { 
      id: 'PREDICTION', 
      label: 'PREDIKSI RESULT', 
      color: 'bg-fuchsia-500', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
    }
  ];

  const currentItem = menuItems.find(item => item.id === currentView);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 md:py-6 flex items-center justify-between" ref={menuRef}>
      {/* Active View Label (Mobile) */}
      <div className="flex items-center gap-3 bg-[#0a0f18]/80 backdrop-blur-xl border border-white/10 px-5 py-1.5 rounded-xl shadow-2xl">
        <div className={`w-2 h-2 rounded-full ${currentItem?.color || 'bg-white'} animate-pulse shadow-[0_0_8px]`}></div>
        <span className="text-[9px] md:text-[11px] font-black text-white italic tracking-widest uppercase">
          {currentItem?.label || 'SYSTEM MENU'}
        </span>
      </div>

      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 hover:bg-white/10"
      >
        <div className={`h-0.5 bg-white rounded-full transition-all ${isOpen ? 'w-5 rotate-45 translate-y-1.5' : 'w-5'}`}></div>
        <div className={`h-0.5 bg-white rounded-full transition-all ${isOpen ? 'opacity-0' : 'w-3'}`}></div>
        <div className={`h-0.5 bg-white rounded-full transition-all ${isOpen ? 'w-5 -rotate-45 -translate-y-1.5' : 'w-5'}`}></div>
      </button>

      {/* Dropdown Menu (Reduced Size) */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-60 bg-[#0a0f18]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-2xl p-2.5 overflow-hidden animate-in slide-in-from-top-3 fade-in duration-300">
           <div className="space-y-1">
             {menuItems.map((item) => (
               <button
                 key={item.id}
                 onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                 className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${currentView === item.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
               >
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${currentView === item.id ? item.color : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                 </div>
                 <span className={`text-[9px] font-black italic tracking-widest transition-all ${currentView === item.id ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>
                   {item.label}
                 </span>
               </button>
             ))}
           </div>
           
           <div className="mt-3 pt-3 border-t border-white/5 flex flex-col items-center gap-0.5 opacity-20">
              <span className="text-[7px] font-black tracking-[0.4em] uppercase">BebiaksPro Integrated</span>
              <span className="text-[6px] font-bold">Version 9.9.2 PRO</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default TopMenu;
