
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
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
       <div className="flex border-b border-slate-100 bg-slate-50/50">
          <div className="w-12 border-r border-slate-100"></div>
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="flex-1 p-2 text-center border-r border-slate-100 last:border-r-0">
                 <div className="text-[8px] font-black uppercase text-slate-400 mb-1">{d.toLocaleString('uk-UA', { weekday: 'short' })}</div>
                 <div className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${isToday ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-800'}`}>{d.getDate()}</div>
              </div>
            );
          })}
       </div>
       <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
             <div className="w-12 border-r border-slate-100 bg-slate-50/20 sticky left-0 z-20">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="h-[60px] text-[8px] font-black text-slate-300 text-right pr-2 pt-2 border-b border-slate-50">{i}:00</div>
                ))}
             </div>
             {weekDays.map((date, dayIdx) => {
               const dayTs = date.getTime();
               const m = date.getMonth();
               const d = date.getDate();

               const dayTasks = tasks.filter(t => {
                 if (t.isDeleted) return false;
                 const start = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
                 const end = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : start;
                 if (!start) return false;
                 return dayTs >= start && dayTs <= (end || start);
               });

               const personEvents = [];
               people.forEach(p => {
                 if (p.birthDate) {
                   const bd = new Date(p.birthDate);
                   if (bd.getMonth() === m && bd.getDate() === d) {
                     personEvents.push({ id: `bd-${p.id}`, title: `🎂 ДН: ${p.name}`, type: 'birthday' });
                   }
                 }
                 p.importantDates?.forEach(idate => {
                   const id = new Date(idate.date);
                   if (id.getMonth() === m && id.getDate() === d) {
                     personEvents.push({ id: `id-${idate.id}`, title: `🔔 ${idate.label}: ${p.name}`, type: 'important' });
                   }
                 });
               });

               return (
                 <div 
                   key={dayIdx} 
                   onDragOver={(e) => onDragOver(e, dayTs)}
                   onDragLeave={onDragLeave}
                   onDrop={(e) => onDrop(e, dayTs)}
                   onClick={() => onAddQuickEvent(dayTs)}
                   className={`flex-1 border-r border-slate-100 last:border-r-0 relative group cursor-pointer transition-colors ${dragOverDay === dayTs ? 'bg-orange-50/30 ring-inset ring-2 ring-orange-200' : 'hover:bg-slate-50/50'}`}
                 >
                    {Array.from({ length: 24 }, (_, i) => <div key={i} className="h-[60px] border-b border-slate-50/50"></div>)}
                    
                    <div className="absolute inset-0 p-1.5 space-y-1.5">
                       {/* Дати союзників зверху */}
                       {personEvents.map(pe => (
                          <div key={pe.id} className={`p-1.5 rounded-lg border text-[9px] font-black shadow-sm ${pe.type === 'birthday' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-indigo-100 border-indigo-200 text-indigo-800'}`}>
                             <div className="truncate">{pe.title}</div>
                          </div>
                       ))}

                       {dayTasks.map(t => (
                         <div 
                           key={t.id} 
                           draggable
                           onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                           onClick={(e) => { e.stopPropagation(); onSelectTask(t.id); }} 
                           className={`p-2 rounded-xl border text-[10px] font-bold shadow-sm transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing ${t.isEvent ? 'bg-pink-500 text-white border-pink-600' : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200'}`}
                         >
                            <div className="truncate mb-0.5">{t.title}</div>
                            <div className="flex justify-between items-center">
                              <span className="text-[7px] opacity-70 uppercase font-black">{t.isEvent ? 'Подія' : 'Завдання'}</span>
                              {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
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
  );
};

export default WeekView;
