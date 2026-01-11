import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, links?: {title: string, uri: string}[]}[]>([
    { role: 'ai', text: 'Sistem Online Aktif. Ada yang bisa saya bantu terkait BBFS atau hasil Live hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'Anda adalah asisten BebiaksPro, pakar statistik BBFS dan prediksi angka. Gunakan pencarian Google jika ditanya tentang hasil keluaran hari ini atau berita terbaru. Jawab dengan singkat, profesional, dan gunakan gaya bahasa teknis yang ramah.',
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "Maaf, sistem sedang mengalami gangguan koneksi.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const links = chunks?.map((c: any) => ({
        title: c.web?.title || "Sumber Data",
        uri: c.web?.uri
      })).filter((l: any) => l.uri);

      setMessages(prev => [...prev, { role: 'ai', text, links }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Gagal menghubungkan ke server AI. Pastikan Anda online." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)] flex items-center justify-center z-[100] hover:scale-110 active:scale-90 transition-all border border-cyan-400/50 animate-pulse"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-96 h-[500px] bg-[#0a0f18]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Bebiaks AI Online</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white/5 text-white/80 border border-white/5 rounded-tl-none'}`}>
                  {m.text}
                </div>
                {m.links && m.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.links.map((link, li) => (
                      <a key={li} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] bg-white/5 px-2 py-1 rounded border border-white/10 text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        🌐 {link.title.slice(0, 20)}...
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-500/50 italic text-[10px] animate-pulse">
                <span>AI sedang berpikir...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5">
            <div className="relative flex items-center">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tanya AI tentang hasil live..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-[12px] text-white outline-none focus:border-cyan-500/50 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="absolute right-2 p-2 text-cyan-500 hover:text-cyan-400 disabled:opacity-20"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;