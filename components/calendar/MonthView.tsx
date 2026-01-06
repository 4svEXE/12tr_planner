
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task } from '../../types';

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
    <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 h-full">
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
        <div key={d} className="bg-slate-50 p-3 text-center text-[9px] font-black uppercase text-slate-400 border-b border-slate-200 tracking-widest">{d}</div>
      ))}
      {days.map((date, i) => {
        const ts = new Date(date).setHours(0,0,0,0);
        const isTodayCell = ts === new Date().setHours(0,0,0,0);
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        
        const m = date.getMonth();
        const d = date.getDate();

        const dayTasksList = tasks.filter(t => {
          if (t.isDeleted) return false;
          const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
          const endTs = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : startTs;
          if (!startTs) return false;
          return ts >= startTs && ts <= (endTs || startTs);
        });

        // Знаходимо події людей
        const personEvents = [];
        people.forEach(p => {
          if (p.birthDate) {
            const bd = new Date(p.birthDate);
            if (bd.getMonth() === m && bd.getDate() === d) {
              personEvents.push({ id: `bd-${p.id}`, title: `ДН: ${p.name}`, type: 'birthday' });
            }
          }
          p.importantDates?.forEach(idate => {
            const id = new Date(idate.date);
            if (id.getMonth() === m && id.getDate() === d) {
              personEvents.push({ id: `id-${idate.id}`, title: `${idate.label}: ${p.name}`, type: 'important' });
            }
          });
        });
        
        return (
          <div key={i} onDragOver={(e) => onDragOver(e, ts)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, ts)}
            className={`min-h-[120px] p-2 flex flex-col transition-all relative group ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'} ${dragOverDay === ts ? 'bg-[var(--primary)]/10 ring-2 ring-[var(--primary)] z-10' : ''}`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all ${isTodayCell ? 'bg-orange-600 text-white shadow-xl shadow-orange-100 scale-110' : isCurrentMonth ? 'text-slate-900 group-hover:text-orange-600' : 'text-slate-300'}`}>{date.getDate()}</span>
              <button onClick={(e) => { e.stopPropagation(); onAddQuickEvent(ts); }} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-xl bg-slate-900 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"><i className="fa-solid fa-plus text-[10px]"></i></button>
            </div>
            <div className="flex-1 space-y-1 mt-1 overflow-hidden">
              {/* Події людей */}
              {personEvents.map(pe => (
                <div key={pe.id} className={`text-[9px] font-black truncate px-2 py-1 rounded-lg border flex items-center gap-1.5 ${pe.type === 'birthday' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                   <i className={`fa-solid ${pe.type === 'birthday' ? 'fa-cake-candles' : 'fa-bell'} text-[7px]`}></i>
                   <span className="truncate">{pe.title}</span>
                </div>
              ))}
              
              {dayTasksList.slice(0, 5).map(t => (
                <div 
                  key={t.id} 
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('taskId', t.id); }}
                  onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }} 
                  className={`text-[9px] font-black truncate px-2 py-1.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${t.isEvent ? 'bg-pink-600 text-white border-pink-700 shadow-sm hover:brightness-110' : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200 hover:bg-orange-50/20'}`}
                >
                  <div className="flex items-center gap-1.5">
                    {t.isEvent ? <i className="fa-solid fa-calendar-star text-[7px] animate-pulse"></i> : <div className="w-1 h-1 rounded-full bg-orange-400"></div>}
                    <span className="truncate">{t.title}</span>
                  </div>
                </div>
              ))}
              {(dayTasksList.length + personEvents.length) > 5 && <div className="text-[8px] font-black text-orange-500 uppercase px-2 py-1 bg-orange-50 rounded-lg inline-block">+ {dayTasksList.length + personEvents.length - 5} ще</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthView;
