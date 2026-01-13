import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskStatus, Priority, RecurrenceType } from '../../types';
import Card from '../ui/Card';
import HabitStatsSidebar from '../HabitStatsSidebar';

interface WeeklyGridProps {
  weekNum: number;
  tasks: Task[];
  dailies: Task[];
  projectId?: string;
  onToggleTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onAddTask: (dayIndex: number, title: string, isFocus: boolean, recurrence: RecurrenceType) => void;
}

const WeeklyGrid: React.FC<WeeklyGridProps> = ({ weekNum, tasks, dailies, projectId, onToggleTask, onUpdateTask, onAddTask }) => {
  const { toggleHabitStatus, deleteTask, cycle, projects, updateTask } = useApp();
  const [activeInput, setActiveInput] = useState<{ day: number, type: 'focus' | 'quest' | 'recurrent' } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedRecurrentId, setSelectedRecurrentId] = useState<string | null>(null);
  
  const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const getDailyDateStr = (dayIndex: number) => {
    const startDate = new Date(cycle.startDate);
    const daysToAdd = ((weekNum - 1) * 7) + dayIndex;
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  };

  const getDayFocus = (dayIndex: number) => 
    tasks.find(t => t.plannerDay === dayIndex && t.tags.includes('daily-focus') && t.plannerWeek === weekNum);

  const getDayTasks = (dayIndex: number) => 
    tasks.filter(t => t.plannerDay === dayIndex && t.plannerWeek === weekNum && !t.tags.includes('daily-focus') && !t.tags.includes('weekly-goal') && (!t.recurrence || t.recurrence === 'none'));

  const getDayRecurrent = (dayIndex: number) =>
    tasks.filter(t => {
      if (!t.recurrence || t.recurrence === 'none' || t.isDeleted) return false;
      if (projectId && t.projectId !== projectId) return false;
      
      if (t.daysOfWeek && t.daysOfWeek.length > 0) {
        return t.daysOfWeek.includes(dayIndex);
      }
      
      if (t.recurrence === 'weekdays' && dayIndex > 4) return false;
      return true; 
    });

  const calculateDayEfficiency = (dayIdx: number) => {
    const focus = getDayFocus(dayIdx);
    const quests = getDayTasks(dayIdx);
    const recurrents = getDayRecurrent(dayIdx);
    const dateStr = getDailyDateStr(dayIdx);

    const allItems = [...quests];
    if (focus) allItems.push(focus);
    
    let totalPlanned = allItems.length + recurrents.length;
    if (totalPlanned === 0) return 0;

    let completedCount = allItems.filter(t => t.status === TaskStatus.DONE).length;
    completedCount += recurrents.filter(t => t.habitHistory?.[dateStr]?.status === 'completed').length;

    return Math.round((completedCount / totalPlanned) * 100);
  };

  const handleQuickSubmit = (dayIdx: number, type: 'focus' | 'quest' | 'recurrent') => {
    if (!inputValue.trim()) {
      setActiveInput(null);
      return;
    }
    onAddTask(dayIdx, inputValue.trim(), type === 'focus', type === 'recurrent' ? 'daily' : 'none');
    setInputValue('');
    setActiveInput(null);
  };

  const projectColor = projectId ? projects.find(p => p.id === projectId)?.color : 'var(--primary)';
  const selectedRecurrent = tasks.find(t => t.id === selectedRecurrentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-2 transition-none relative">
      {shortDays.map((dayLabel, idx) => {
        const focusTask = getDayFocus(idx);
        const dayTasks = getDayTasks(idx);
        const recurrentTasks = getDayRecurrent(idx);
        const dateStr = getDailyDateStr(idx);
        const efficiency = calculateDayEfficiency(idx);
        
        return (
          <div key={idx} className="flex flex-col gap-2 transition-none">
            <div className="bg-slate-900 rounded-xl py-2 px-1 text-center shadow-md border border-white/5 transition-none flex flex-col items-center">
               <div className="flex items-center justify-center gap-2 w-full px-2">
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{dayLabel}</span>
                 {efficiency > 0 && (
                   <span className="text-[7px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                     {efficiency}%
                   </span>
                 )}
               </div>
               <div className="text-[7px] font-bold text-slate-500 uppercase mt-0.5 opacity-60">{dateStr.split('-').slice(1).reverse().join('.')}</div>
            </div>

            <Card padding="none" className="flex-1 bg-white border-slate-100 rounded-2xl min-h-[620px] flex flex-col overflow-hidden shadow-sm transition-none">
              <div className="p-2 border-b border-slate-50 flex justify-center gap-1 bg-slate-50/50 transition-none">
                 <button 
                  onClick={() => { setActiveInput({ day: idx, type: 'focus' }); setInputValue(''); }}
                  className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-none" 
                  title="Ціль дня"
                  style={projectId ? { backgroundColor: projectColor } : {}}
                 >
                    <i className="fa-solid fa-bullseye text-[10px]"></i>
                 </button>
                 <button 
                  onClick={() => { setActiveInput({ day: idx, type: 'quest' }); setInputValue(''); }}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-primary hover:border-primary transition-none shadow-sm" 
                  title="Додати квест"
                 >
                    <i className="fa-solid fa-plus text-[10px]"></i>
                 </button>
                 <button 
                  onClick={() => { setActiveInput({ day: idx, type: 'recurrent' }); setInputValue(''); }}
                  className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm" 
                  title="Додати повторюване"
                 >
                    <i className="fa-solid fa-repeat text-[10px]"></i>
                 </button>
              </div>

              <div className="p-3 space-y-4 flex-1 overflow-y-auto no-scrollbar transition-none">
                <div className="min-h-[70px] transition-none">
                   {activeInput?.day === idx && activeInput.type === 'focus' ? (
                     <div className="bg-orange-50 border border-orange-200 p-2 rounded-xl transition-none" style={{ borderColor: projectColor + '40', backgroundColor: projectColor + '08' }}>
                        <textarea
                          autoFocus
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickSubmit(idx, 'focus'))}
                          onBlur={() => handleQuickSubmit(idx, 'focus')}
                          placeholder="Ціль дня..."
                          className="w-full bg-transparent border-none p-0 text-[11px] font-black uppercase focus:ring-0 resize-none outline-none text-slate-800 transition-none"
                          rows={2}
                        />
                     </div>
                   ) : focusTask ? (
                     <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl group/f relative transition-none" style={{ borderColor: projectColor + '20', backgroundColor: projectColor + '08' }}>
                        <div className="flex items-center gap-2.5 transition-none">
                           <button onClick={() => onToggleTask(focusTask)} className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-none ${focusTask.status === TaskStatus.DONE ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 hover:border-orange-500'}`} style={focusTask.status === TaskStatus.DONE ? { backgroundColor: projectColor, borderColor: projectColor } : {}}>
                             {focusTask.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[9px]"></i>}
                           </button>
                           <div className="flex-1 min-w-0 transition-none">
                              <input 
                                value={focusTask.title}
                                onChange={e => onUpdateTask({...focusTask, title: e.target.value})}
                                className={`w-full bg-transparent border-none p-0 text-[11px] font-black uppercase leading-tight focus:ring-0 outline-none transition-none ${focusTask.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-800'}`}
                              />
                           </div>
                           <button onClick={() => deleteTask(focusTask.id, true)} className="opacity-0 group-hover/f:opacity-100 text-slate-300 hover:text-rose-500 transition-none shrink-0">
                             <i className="fa-solid fa-xmark text-[10px]"></i>
                           </button>
                        </div>
                     </div>
                   ) : (
                     <button onClick={() => { setActiveInput({ day: idx, type: 'focus' }); setInputValue(''); }} className="w-full h-[70px] flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl text-slate-200 hover:text-orange-300 hover:border-orange-100 hover:bg-orange-50/10 transition-none group">
                        <i className="fa-solid fa-bullseye text-base mb-1 opacity-20"></i>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Set Focus</span>
                     </button>
                   )}
                </div>

                <div className="space-y-1.5 transition-none">
                   <div className="flex items-center justify-between px-1 transition-none">
                      <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest">Recurrent</span>
                      <div className="h-px flex-1 bg-indigo-50 ml-2"></div>
                   </div>
                   {recurrentTasks.map(t => {
                     const isDoneToday = t.habitHistory?.[dateStr]?.status === 'completed';
                     return (
                       <div key={t.id} className="flex items-center gap-2 group/t p-1.5 hover:bg-indigo-50/30 rounded-xl transition-none cursor-pointer" onClick={() => setSelectedRecurrentId(t.id)}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleHabitStatus(t.id, dateStr, isDoneToday ? 'none' : 'completed'); }} 
                            className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-none ${isDoneToday ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200'}`}
                          >
                             {isDoneToday && <i className="fa-solid fa-check text-[8px]"></i>}
                          </button>
                          <div className="flex-1 min-w-0 transition-none">
                             <span className={`block w-full text-[10px] font-bold truncate transition-none ${isDoneToday ? 'line-through text-slate-300' : 'text-slate-600'}`}>{t.title}</span>
                             <div className="flex gap-1 mt-0.5 opacity-60">
                                <span className="text-[5px] font-black px-1 rounded bg-indigo-100 text-indigo-600 uppercase">
                                  {t.recurrence === 'custom' && t.daysOfWeek ? t.daysOfWeek.map(d => shortDays[d]).join(',') : t.recurrence}
                                </span>
                             </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id, true); }} className="opacity-0 group-hover/t:opacity-100 text-slate-200 hover:text-rose-500 shrink-0">
                             <i className="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                       </div>
                     );
                   })}
                   {activeInput?.day === idx && activeInput.type === 'recurrent' && (
                      <input
                        autoFocus
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickSubmit(idx, 'recurrent'))}
                        onBlur={() => handleQuickSubmit(idx, 'recurrent')}
                        placeholder="Daily quest..."
                        className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-2 text-[10px] font-bold outline-none text-indigo-600 transition-none"
                      />
                   )}
                </div>

                <div className="space-y-1.5 transition-none">
                   <div className="flex items-center justify-between px-1 transition-none">
                      <span className="text-[7px] font-black uppercase text-slate-300 tracking-widest">Quests</span>
                      <div className="h-px flex-1 bg-slate-50 ml-2"></div>
                   </div>
                   {dayTasks.map(t => (
                     <div key={t.id} className="flex items-center gap-2 group/t p-1.5 hover:bg-slate-50 rounded-xl transition-none">
                        <button onClick={() => onToggleTask(t)} className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-none ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                           {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                        </button>
                        <input 
                           value={t.title}
                           onChange={e => onUpdateTask({...t, title: e.target.value})}
                           className={`flex-1 bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 outline-none transition-none ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-600'}`}
                        />
                        <button onClick={() => deleteTask(t.id, true)} className="opacity-0 group-hover/t:opacity-100 text-slate-200 hover:text-rose-500 shrink-0">
                           <i className="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                     </div>
                   ))}
                   
                   {activeInput?.day === idx && activeInput.type === 'quest' && (
                      <input
                        autoFocus
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickSubmit(idx, 'quest'))}
                        onBlur={() => handleQuickSubmit(idx, 'quest')}
                        placeholder="Quest title..."
                        className="w-full bg-slate-50 rounded-xl p-2 text-[10px] font-bold outline-none text-slate-600 transition-none"
                      />
                   )}
                </div>

                {dailies.length > 0 && (
                   <div className="pt-4 mt-auto border-t border-slate-50 space-y-2 transition-none">
                      <span className="text-[7px] font-black uppercase text-slate-300 tracking-[0.2em] px-1">Global Routine</span>
                      <div className="space-y-1 transition-none">
                        {dailies.map(h => {
                          const isDone = h.habitHistory?.[dateStr]?.status === 'completed';
                          const isDayActive = !h.daysOfWeek || h.daysOfWeek.length === 0 || h.daysOfWeek.includes(idx);
                          if (!isDayActive) return null;

                          return (
                            <div key={h.id} className="flex items-center gap-2 px-1 transition-none">
                               <button 
                                  onClick={() => toggleHabitStatus(h.id, dateStr)}
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-none ${isDone ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200'}`}
                                  style={isDone ? { backgroundColor: projectColor || '#6366f1', borderColor: projectColor || '#6366f1' } : {}}
                                >
                                  {isDone && <i className="fa-solid fa-check text-[7px]"></i>}
                                </button>
                               <span className={`text-[9px] font-bold truncate flex-1 uppercase tracking-tight transition-none ${isDone ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
                                  {h.title}
                               </span>
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

      {selectedRecurrent && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedRecurrentId(null)}></div>
          <div className="w-[340px] h-full bg-white shadow-2xl relative animate-in slide-in-from-right duration-300">
              <HabitStatsSidebar 
                habit={selectedRecurrent} 
                onClose={() => setSelectedRecurrentId(null)}
                onUpdate={(updates) => updateTask({ ...selectedRecurrent, ...updates })}
                onToggleStatus={toggleHabitStatus}
              />
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGrid;