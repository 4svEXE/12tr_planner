
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskStatus } from '../../types';

interface WeekViewProps {
  currentDate: Date;
  dragOverDay: number | null;
  onDrop: (e: React.DragEvent, timestamp: number) => void;
  onDragOver: (e: React.DragEvent, timestamp: number) => void;
  onDragLeave: () => void;
  onSelectTask: (id: string) => void;
  onAddQuickEvent: (timestamp: number) => void;
}

const HOUR_HEIGHT = 60;
const HOUR_COLUMN_WIDTH = 56; // 3.5rem (w-14)

const WeekView: React.FC<WeekViewProps> = ({ currentDate, dragOverDay, onDrop, onDragOver, onDragLeave, onSelectTask, onAddQuickEvent }) => {
  const { tasks, people } = useApp();
  
  const weekDays = React.useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] rounded-xl md:rounded-3xl overflow-hidden shadow-xl border border-[var(--border-color)]">
      {/* 
          Головний контейнер горизонтального скролу. 
          Всередині нього і хедер, і контент будуть рухатись синхронно.
      */}
      <div className="flex-1 overflow-x-auto custom-scrollbar relative flex flex-col">
        
        {/* Внутрішня обгортка, що визначає загальну ширину (годинна колонка + 7 днів) */}
        <div className="min-w-max flex flex-col flex-1">
          
          {/* HEADER ROW - Sticky to top */}
          <div className="flex sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
            <div 
              style={{ width: HOUR_COLUMN_WIDTH }} 
              className="sticky left-0 z-50 bg-[var(--bg-card)] border-r border-[var(--border-color)] shrink-0"
            />
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div 
                  key={i} 
                  style={{ width: `calc((100vw - ${HOUR_COLUMN_WIDTH}px - 48px) / 3)` }}
                  className="min-w-[100px] md:min-w-[140px] p-2 md:p-3 text-center border-r border-[var(--border-color)] last:border-r-0 shrink-0"
                >
                  <div className="text-[7px] md:text-[9px] font-black uppercase text-[var(--text-muted)] mb-0.5 md:mb-1">
                    {d.toLocaleString('uk-UA', { weekday: 'short' })}
                  </div>
                  <div className={`mx-auto w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[9px] md:text-[12px] font-black ${isToday ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-main)]'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CONTENT AREA - Vertical Scrollable inside the horizontal one */}
          <div className="flex flex-1 relative overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            
            {/* TIME LABELS - Sticky to left */}
            <div 
              style={{ width: HOUR_COLUMN_WIDTH }} 
              className="sticky left-0 z-30 bg-[var(--bg-card)] border-r border-[var(--border-color)] shrink-0"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-[60px] text-[7px] md:text-[9px] font-black text-[var(--text-muted)] text-right pr-2 md:pr-4 pt-1 border-b border-[var(--border-color)]/20 opacity-50 tabular-nums">
                  {i}:00
                </div>
              ))}
            </div>

            {/* DAYS GRID */}
            {weekDays.map((date, dayIdx) => {
              const dayTs = date.getTime();
              const m = date.getMonth();
              const d = date.getDate();
              const y = date.getFullYear();

              const dayTasks = tasks.filter(t => {
                if (t.isDeleted) return false;
                const start = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
                const end = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : start;
                if (!start) return false;
                return dayTs >= start && dayTs <= (end || start);
              });

              const personEvents: any[] = [];
              people.forEach(p => {
                if (p.birthDate && p.birthDateShowInCalendar !== false) {
                  const bd = new Date(p.birthDate);
                  const matchesMD = bd.getMonth() === m && bd.getDate() === d;
                  if (matchesMD && (p.birthDateRepeatYearly !== false || bd.getFullYear() === y)) {
                    personEvents.push({ id: `bd-${p.id}`, title: `🎂 ${p.name}`, type: 'birthday' });
                  }
                }
              });

              return (
                <div 
                  key={dayIdx} 
                  style={{ width: `calc((100vw - ${HOUR_COLUMN_WIDTH}px - 48px) / 3)` }}
                  onDragOver={(e) => onDragOver(e, dayTs)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, dayTs)}
                  onClick={() => onAddQuickEvent(dayTs)}
                  className={`flex-1 min-w-[100px] md:min-w-[140px] border-r border-[var(--border-color)] last:border-r-0 relative group cursor-pointer transition-colors shrink-0 ${dragOverDay === dayTs ? 'bg-[var(--primary)]/5 ring-inset ring-2 ring-[var(--primary)]/20' : 'hover:bg-[var(--bg-main)]/10'}`}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="h-[60px] border-b border-[var(--border-color)]/20"></div>
                  ))}
                  
                  <div className="absolute inset-0 p-1 md:p-2 space-y-1">
                    {personEvents.map(pe => (
                      <div key={pe.id} className="p-1 rounded-md border text-[7px] md:text-[9px] font-black shadow-sm bg-amber-500/10 border-amber-500/20 text-amber-600 truncate">
                        {pe.title}
                      </div>
                    ))}

                    {dayTasks.map(t => (
                      <div 
                        key={t.id} 
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                        onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }} 
                        className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border text-[8px] md:text-[10px] font-bold shadow-sm transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing ${t.isEvent ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary)]/50'}`}
                      >
                        <div className="truncate mb-0.5">{t.title}</div>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-[6px] md:text-[7px] uppercase font-black">{t.isEvent ? 'E' : 'Q'}</span>
                          {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[6px] md:text-[8px]"></i>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
