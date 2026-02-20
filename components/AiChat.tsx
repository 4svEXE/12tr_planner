
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { GoogleGenAI } from "@google/genai";
import Typography from './ui/Typography';
import Button from './ui/Button';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiChat: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { tasks, projects, people, character, cycle, diary } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { label: "Проаналізуй мої вхідні", icon: "fa-inbox" },
    { label: "План на тиждень", icon: "fa-calendar-week" },
    { label: "Порада щодо союзників", icon: "fa-user-ninja" },
    { label: "Як підвищити XP?", icon: "fa-bolt" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      if (!apiKey) throw new Error('API Key missing');

      const ai = new GoogleGenAI({ apiKey });

      const systemContext = `
        Ти — Стратегічне Ядро системи 12TR. Твоя мета — допомагати Гравцю бути продуктивним через GTD та гейміфікацію.
        
        ПОТОЧНИЙ КОНТЕКСТ ГРАВЦЯ:
        - Герой: ${character.name} (LVL ${character.level} ${character.role}), Енергія: ${character.energy}%
        - Цілі: ${projects.filter(p => p.type === 'goal').map(p => p.name).join(', ')}
        - Активні квести: ${tasks.filter(t => !t.isDeleted && t.status !== 'DONE').map(t => t.title).join(', ')}
        - Союзники: ${people.map(p => `${p.name} (${p.status})`).join(', ')}
        - Тиждень циклу: ${cycle.currentWeek}/12
        - Останні нотатки: ${tasks.filter(t => t.category === 'note').slice(0, 5).map(t => t.title).join(', ')}

        Спілкуйся українською мовою. Будь лаконічним, використовуй термінологію RPG (квести, союзники, мана, XP).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemContext + "\n\nЗапит користувача: " + text }] }
        ]
      });

      const aiText = response.text || "Магічний зв'язок перервано. Спробуй ще раз.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Помилка зв'язку з Ядром. Перевірте API-ключ." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed top-0 right-0 h-screen bg-[var(--bg-card)]/95 border-l border-[var(--border-color)] flex flex-col backdrop-blur-2xl transition-all duration-500 z-[650] shadow-2xl w-full md:w-96`}>
      <header className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-white/50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-pink-500 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-sparkles"></i>
          </div>
          <div>
            <Typography variant="h3" className="text-sm">ШІ-Стратег</Typography>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Active Link</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 no-scrollbar">
        {messages.length === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--primary)]/5 p-5 rounded-3xl border border-[var(--primary)]/10 text-xs font-medium leading-relaxed italic text-slate-600">
              "Вітаю, {character.name}. Я твій цифровий наставник. Можу розібрати хаос у вхідних, скласти план прокачки або знайти важливі факти про твоїх союзників. Чим займемося?"
            </div>

            <div className="space-y-2">
              <Typography variant="tiny" className="text-slate-400 px-1">Пропозиції Ядра</Typography>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map(s => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.label)}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 hover:border-[var(--primary)]/40 hover:shadow-sm transition-all text-left"
                  >
                    <i className={`fa-solid ${s.icon} text-[var(--primary)] opacity-60`}></i>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed ${m.role === 'user'
              ? 'bg-[var(--primary)] text-white shadow-lg rounded-tr-none'
              : 'bg-white border border-slate-100 shadow-sm text-slate-800 rounded-tl-none font-medium'
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* pb-[84px] враховує висоту мобільного навбару */}
      <footer className="p-6 border-t border-[var(--border-color)] bg-white/50 pb-[84px] md:pb-6">
        <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-2 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Запитати Ядро..."
            className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 px-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-main"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg disabled:opacity-30 active:scale-90 transition-all"
          >
            <i className="fa-solid fa-arrow-up text-xs"></i>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default AiChat;
