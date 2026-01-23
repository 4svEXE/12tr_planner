
import React, { useState, useMemo, useRef } from 'react';
import { Person, Interaction } from '../../types';
import Typography from '../ui/Typography';

interface TimelineTabProps {
  person: Person;
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void;
  onDeleteInteraction: (id: string) => void;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ person, onAddInteraction, onDeleteInteraction }) => {
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<Interaction['type']>('chat');
  const [visibleCount, setVisibleCount] = useState(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const interactionIcons: Record<string, string> = {
    chat: 'fa-message',
    call: 'fa-phone',
    meeting: 'fa-users',
    coffee: 'fa-coffee',
    walk: 'fa-person-walking',
    event: 'fa-calendar-star',
    other: 'fa-circle-dot'
  };

  const sortedInteractions = useMemo(() => {
    const list = person.interactions || [];
    return [...list].sort((a, b) => (b.date || 0) - (a.date || 0));
  }, [person.interactions]);

  const visibleInteractions = useMemo(() => 
    sortedInteractions.slice(0, visibleCount),
  [sortedInteractions, visibleCount]);

  const handleAdd = (impact: number) => {
    if (!summary.trim()) return;
    onAddInteraction(summary.trim(), impact, type);
    setSummary('');
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(5);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden animate-in fade-in duration-300">
      <div className="bg-[var(--bg-main)] p-3 md:p-4 rounded-2xl border border-[var(--border-color)] mb-4 shrink-0 shadow-inner">
        <Typography variant="tiny" className="text-[var(--text-muted)] mb-2 block font-black uppercase text-[7px] tracking-widest opacity-60">Новий запис у лог</Typography>
        <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar pb-1">
           {Object.entries(interactionIcons).map(([t, icon]) => (
             <button 
              key={t} 
              onClick={() => setType(t as any)} 
              className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${type === t ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--primary)]/30 hover:text-[var(--primary)]'}`}
              title={t}
             >
               <i className={`fa-solid ${icon} text-[9px] md:text-[10px]`}></i>
             </button>
           ))}
        </div>
        
        <div className="flex gap-2">
          <input 
            value={summary} 
            onChange={e => setSummary(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="Опис події..." 
            className="flex-1 bg-[var(--bg-card)] text-[var(--text-main)] rounded-xl px-4 py-2 text-[11px] md:text-xs font-bold outline-none border border-[var(--border-color)] focus:border-[var(--primary)] shadow-sm" 
          />
          <div className="flex gap-1 shrink-0">
             <button 
              onClick={() => handleAdd(5)} 
              disabled={!summary.trim()} 
              className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-md disabled:opacity-30 transition-all hover:brightness-110 active:scale-95"
              title="Позитивний вплив (+5 Karma)"
             >
               <i className="fa-solid fa-plus text-xs"></i>
             </button>
             <button 
              onClick={() => handleAdd(-5)} 
              disabled={!summary.trim()} 
              className="w-8 h-8 md:w-10 md:h-10 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-md disabled:opacity-30 transition-all hover:brightness-110 active:scale-95"
              title="Негативний вплив (-5 Karma)"
             >
               <i className="fa-solid fa-minus text-xs"></i>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col">
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2"
          >
            {visibleInteractions.length > 0 ? visibleInteractions.map((i) => {
               const isPositive = i.summary.includes('[Рейтинг +');
               const isNegative = i.summary.includes('[Рейтинг -');
               const cleanSummary = i.summary.split(' [Рейтинг')[0];
               const date = new Date(i.date);
               
               return (
                <div key={i.id} className="group relative flex items-start gap-3 p-3 hover:bg-[var(--bg-main)] rounded-xl transition-all border border-transparent hover:border-[var(--border-color)] animate-in slide-in-from-top-1">
                   <div className="shrink-0 pt-0.5">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-sm border border-[var(--bg-card)] ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-[var(--text-muted)]'} text-white`}>
                         <i className={`fa-solid ${interactionIcons[i.type] || 'fa-circle-dot'} text-[9px] md:text-xs`}></i>
                      </div>
                   </div>

                   <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2 mb-1">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] md:text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight">
                               {date.toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}
                            </span>
                            <span className="text-[8px] md:text-[9px] font-black text-[var(--text-muted)] uppercase opacity-60">
                               {date.toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}
                            </span>
                         </div>
                         
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteInteraction(i.id); }} 
                            className="text-[var(--text-muted)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          >
                             <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                      </div>
                      <p className="text-[11px] md:text-xs font-bold text-[var(--text-main)] opacity-80 leading-snug">
                        {cleanSummary}
                      </p>
                      <div className="mt-1.5 flex gap-1">
                        {isPositive && <span className="text-[6px] md:text-[7px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">+ KARMA</span>}
                        {isNegative && <span className="text-[6px] md:text-[7px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">- KARMA</span>}
                      </div>
                   </div>
                </div>
               );
            }) : (
              <div className="py-20 text-center opacity-10 flex flex-col items-center select-none">
                 <i className="fa-solid fa-clock-rotate-left text-5xl mb-4 text-[var(--text-main)]"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Лог взаємодій порожній</span>
              </div>
            )}

            {visibleCount < sortedInteractions.length && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 30)}
                className="w-full py-4 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
              >
                Завантажити історію...
              </button>
            )}
          </div>
      </div>
    </div>
  );
};

export default TimelineTab;
