
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskStatus } from '../../types';

interface MonthViewProps {
  currentDate: Date;
  dragOverDay: number | null;
  onDrop: (e: React.DragEvent, timestamp: number) => void;
  onDragOver: (e: React.DragEvent, timestamp: number) => void;
  onDragLeave: () => void;
  onSelectTask: (id: string) => void;
  onAddQuickEvent: (timestamp: number) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, dragOverDay, onDrop, onDragOver, onDragLeave, onSelectTask, onAddQuickEvent }) => {
  const { tasks, people } = useApp();
  
  const days = React.useMemo(() => {
    return Array.from({length: 42}, (_, i) => { 
      const s = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); 
      s.setDate(s.getDate() - (s.getDay()===0?6:s.getDay()-1) + i); 
      return s; 
    });
  }, [currentDate]);

  return (
    <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl border border-[var(--border-color)] h-full min-h-[500px]">
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
        <div key={d} className="bg-[var(--bg-card)] p-1.5 md:p-3 text-center text-[8px] md:text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest opacity-60">{d}</div>
      ))}
      {days.map((date, i) => {
        const ts = new Date(date).setHours(0,0,0,0);
        const isTodayCell = ts === new Date().setHours(0,0,0,0);
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        
        const m = date.getMonth();
        const d = date.getDate();
        const y = date.getFullYear();

        const dayTasksList = tasks.filter(t => {
          if (t.isDeleted) return false;
          const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
          const endTs = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : startTs;
          if (!startTs) return false;
          return ts >= startTs && ts <= (endTs || startTs);
        });

        const personEvents: any[] = [];
        people.forEach(p => {
          if (p.birthDate && p.birthDateShowInCalendar !== false) {
            const bd = new Date(p.birthDate);
            if (bd.getMonth() === m && bd.getDate() === d) personEvents.push({ id: `bd-${p.id}`, title: `🎂 ${p.name}`, type: 'birthday' });
          }
        });
        
        return (
          <div key={i} 
            onDragOver={(e) => onDragOver(e, ts)} 
            onDragLeave={onDragLeave} 
            onDrop={(e) => onDrop(e, ts)}
            onClick={() => window.innerWidth < 768 && onAddQuickEvent(ts)}
            className={`min-h-[75px] md:min-h-[120px] p-1 md:p-2 flex flex-col transition-all relative group ${isCurrentMonth ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-main)] opacity-40'} ${dragOverDay === ts ? 'ring-2 ring-inset ring-[var(--primary)]' : ''}`}>
            <div className="flex items-center justify-between mb-1 md:mb-2 px-1">
              <span className={`text-[10px] md:text-xs font-black w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-lg md:rounded-xl transition-all ${isTodayCell ? 'bg-[var(--primary)] text-white shadow-lg scale-110' : isCurrentMonth ? 'text-[var(--text-main)] group-hover:text-[var(--primary)]' : 'text-[var(--text-muted)] opacity-30'}`}>{date.getDate()}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onAddQuickEvent(ts); }} 
                className="hidden md:flex w-6 h-6 rounded-lg bg-[var(--primary)] text-white shadow-lg items-center justify-center transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <i className="fa-solid fa-plus text-[8px]"></i>
              </button>
            </div>
            <div className="flex-1 space-y-0.5 md:space-y-1 mt-0.5 overflow-hidden">
              {personEvents.map(pe => (
                <div key={pe.id} className="text-[7px] md:text-[8px] font-black truncate px-1 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">{pe.title}</div>
              ))}
              {dayTasksList.slice(0, window.innerWidth < 768 ? 2 : 4).map(t => (
                <div 
                  key={t.id} 
                  onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }} 
                  className={`text-[7px] md:text-[8px] font-black truncate px-1 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg border transition-all cursor-pointer ${t.isEvent ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary)]/50'}`}
                >
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
              {dayTasksList.length > (window.innerWidth < 768 ? 2 : 4) && (
                <div className="text-[6px] md:text-[7px] font-black text-[var(--text-muted)] uppercase text-center opacity-60">
                   + {dayTasksList.length - (window.innerWidth < 768 ? 2 : 4)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthView;
