
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskStatus } from '../../types';
import Card from '../ui/Card';

interface WeeklyGridProps {
  weekNum: number;
  tasks: Task[];
  dailies: Task[];
  onToggleTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onAddTask: (dayIndex: number, isFocus?: boolean) => void;
}

const WeeklyGrid: React.FC<WeeklyGridProps> = ({ weekNum, tasks, dailies, onToggleTask, onUpdateTask, onAddTask }) => {
  const { toggleHabitStatus, deleteTask, cycle } = useApp();
  const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const getDayFocus = (dayIndex: number) => 
    tasks.find(t => t.plannerDay === dayIndex && t.tags.includes('daily-focus'));

  const getDayTasks = (dayIndex: number) => 
    tasks.filter(t => t.plannerDay === dayIndex && !t.tags.includes('daily-focus') && !t.tags.includes('weekly-goal'));

  // Розраховуємо конкретну дату (ISO string) для кожного дня обраного тижня, 
  // щоб чекбокси рутини працювали незалежно для кожної дати
  const getDailyDateStr = (dayIndex: number) => {
    const startDate = new Date(cycle.startDate);
    const daysToAdd = ((weekNum - 1) * 7) + dayIndex;
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
      {shortDays.map((dayLabel, idx) => {
        const focusTask = getDayFocus(idx);
        const dayTasks = getDayTasks(idx);
        const dateStr = getDailyDateStr(idx);
        
        return (
          <div key={idx} className="flex flex-col gap-2">
            <div className="bg-slate-900 rounded-xl py-2 text-center shadow-md border border-white/5">
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{dayLabel}</span>
            </div>

            <Card padding="none" className="flex-1 bg-white border-slate-100 rounded-2xl min-h-[550px] flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-2 border-b border-slate-50 flex justify-center gap-1.5 bg-slate-50/50">
                 <button 
                  onClick={() => onAddTask(idx, true)} 
                  className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all" 
                  title="Встановити фокус дня"
                 >
                    <i className="fa-solid fa-bullseye text-[11px]"></i>
                 </button>
                 <button 
                  onClick={() => onAddTask(idx, false)} 
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-primary hover:border-primary transition-all active:scale-95" 
                  title="Додати квест"
                 >
                    <i className="fa-solid fa-plus text-[11px]"></i>
                 </button>
              </div>

              <div className="p-3 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {/* Focus Area */}
                <div className="min-h-[70px]">
                   {focusTask ? (
                     <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl group/f relative">
                        <div className="flex items-start gap-2.5">
                           <button onClick={() => onToggleTask(focusTask)} className={`w-5 h-5 rounded-lg border-2 mt-0.5 shrink-0 transition-all ${focusTask.status === TaskStatus.DONE ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-orange-200 hover:border-orange-500'}`}>
                             {focusTask.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[9px]"></i>}
                           </button>
                           <textarea 
                             value={focusTask.title}
                             onChange={e => onUpdateTask({...focusTask, title: e.target.value})}
                             className={`flex-1 bg-transparent border-none p-0 text-[11px] font-black uppercase leading-snug focus:ring-0 resize-none outline-none ${focusTask.status === TaskStatus.DONE ? 'line-through text-orange-200' : 'text-orange-900'}`}
                             rows={2}
                           />
                           <button onClick={() => deleteTask(focusTask.id, true)} className="opacity-0 group-hover/f:opacity-100 text-orange-200 hover:text-rose-500 transition-all absolute -top-2 -right-2 bg-white rounded-full shadow-sm w-5 h-5 flex items-center justify-center border border-orange-100">
                             <i className="fa-solid fa-xmark text-[10px]"></i>
                           </button>
                        </div>
                     </div>
                   ) : (
                     <button onClick={() => onAddTask(idx, true)} className="w-full h-[70px] flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl text-slate-200 hover:text-orange-300 hover:border-orange-100 hover:bg-orange-50/10 transition-all group">
                        <i className="fa-solid fa-bullseye text-base mb-1 opacity-20 group-hover:opacity-100"></i>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Set Focus</span>
                     </button>
                   )}
                </div>

                {/* Day Specific Quests */}
                <div className="space-y-2">
                   {dayTasks.map(t => (
                     <div key={t.id} className="flex items-start gap-2.5 group/t p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <button onClick={() => onToggleTask(t)} className={`w-4 h-4 rounded border-2 mt-0.5 shrink-0 transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-primary'}`}>
                           {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                        </button>
                        <input 
                           value={t.title}
                           onChange={e => onUpdateTask({...t, title: e.target.value})}
                           className={`flex-1 bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 outline-none transition-colors ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-600'}`}
                        />
                        <button onClick={() => deleteTask(t.id, true)} className="opacity-0 group-hover/t:opacity-100 text-slate-200 hover:text-rose-500 transition-all">
                           <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                     </div>
                   ))}
                </div>

                {/* Routine Section */}
                {dailies.length > 0 && (
                   <div className="pt-4 mt-auto border-t border-slate-100 space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em]">Routine</span>
                        <div className="h-0.5 w-8 bg-slate-50 rounded-full"></div>
                      </div>
                      <div className="space-y-1.5">
                        {dailies.map(h => {
                          const isDone = h.habitHistory?.[dateStr]?.status === 'completed';
                          return (
                            <div key={h.id} className="flex items-center gap-2.5 px-1 group/r">
                               <button 
                                  onClick={() => toggleHabitStatus(h.id, dateStr)}
                                  className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0 ${isDone ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}
                               >
                                  {isDone && <i className="fa-solid fa-check text-[8px]"></i>}
                               </button>
                               <span className={`text-[10px] font-bold truncate flex-1 uppercase tracking-tight transition-colors ${isDone ? 'text-slate-300 line-through' : 'text-slate-500 group-hover/r:text-indigo-600'}`}>
                                  {h.title}
                               </span>
                               <button onClick={() => { if(confirm('Вилучити з рутини?')) deleteTask(h.id, true); }} className="opacity-0 group-hover/r:opacity-100 text-slate-200 hover:text-rose-500 transition-all">
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                )}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyGrid;
