
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskStatus, Priority, RecurrenceType } from '../../types';
import Card from '../ui/Card';
import Typography from '../ui/Typography';

interface WeeklyGridProps {
  weekNum: number;
  tasks: Task[];
  dailies: Task[];
  projectId?: string;
  onToggleTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onAddTask: (dayIndex: number, title: string, isFocus: boolean, recurrence: RecurrenceType) => void;
  onSelectHabit?: (id: string) => void;
}

const WeeklyGrid: React.FC<WeeklyGridProps> = ({ weekNum, tasks, dailies, projectId, onToggleTask, onUpdateTask, onAddTask, onSelectHabit }) => {
  const { toggleHabitStatus, deleteTask, cycle, projects } = useApp();
  const [activeInput, setActiveInput] = useState<{ day: number, type: 'focus' | 'quest' | 'recurrent' } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const activeProject = projectId ? projects.find(p => p.id === projectId) : null;
  const projectStartDate = activeProject?.startDate || cycle.startDate;

  /**
   * ТЕХНІЧНО ТОЧНИЙ РОЗРАХУНОК ДАТИ (ЛОКАЛЬНИЙ ЧАС)
   */
  const getDailyDateStr = (dayIndex: number) => {
    // Створюємо дату, встановлюємо 12:00 дня, щоб уникнути проблем з переходом на літній час
    const d = new Date(projectStartDate);
    d.setHours(12, 0, 0, 0);

    // Знаходимо Понеділок тижня, в якому знаходиться startDate
    const day = d.getDay(); // 0=Нд, 1=Пн...
    const offsetToMonday = (day === 0 ? 6 : day - 1);

    // Встановлюємо дату на Понеділок першого тижня
    d.setDate(d.getDate() - offsetToMonday);

    // Додаємо тижні та дні
    d.setDate(d.getDate() + ((weekNum - 1) * 7) + dayIndex);

    // Форматуємо YYYY-MM-DD БЕЗ конвертації в UTC (уникаємо зсуву годин)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayFocus = (dayIndex: number) =>
    tasks.find(t => t.plannerDay === dayIndex && t.tags.includes('daily-focus') && t.plannerWeek === weekNum);

  const getDayTasks = (dayIndex: number) =>
    tasks.filter(t =>
      t.plannerDay === dayIndex &&
      t.plannerWeek === weekNum &&
      !t.tags.includes('daily-focus') &&
      !t.tags.includes('weekly-goal') &&
      (!t.recurrence || t.recurrence === 'none')
    );

  const getDayRecurrent = (dayIndex: number) =>
    tasks.filter(t => {
      const isHabit = t.projectSection === 'habits' || (t.recurrence && t.recurrence !== 'none');
      if (!isHabit || t.isDeleted) return false;
      if (projectId && t.projectId !== projectId) return false;
      const scheduledDays = t.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
      return scheduledDays.includes(dayIndex);
    });

  const handleQuickSubmit = (dayIdx: number, type: 'focus' | 'quest' | 'recurrent') => {
    if (!inputValue.trim()) {
      setActiveInput(null);
      return;
    }
    onAddTask(dayIdx, inputValue.trim(), type === 'focus', type === 'recurrent' ? 'daily' : 'none');
    setInputValue('');
    setActiveInput(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onUpdateTask({ ...task, plannerDay: dayIndex, plannerWeek: weekNum });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-1.5 transition-none w-full overflow-x-auto no-scrollbar py-1">
      {shortDays.map((dayLabel, idx) => {
        const focusTask = getDayFocus(idx);
        const dayTasks = getDayTasks(idx);
        const recurrentTasks = getDayRecurrent(idx);
        const dateStr = getDailyDateStr(idx);

        // Перевірка "сьогодні" також за локальним часом
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = todayStr === dateStr;

        const isSunday = idx === 6;
        const projectColor = activeProject?.color || '#f97316';

        return (
          <div key={idx} onDragOver={(e) => { e.preventDefault(); setDragOverDay(idx); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => handleDrop(e, idx)} className={`flex flex-col gap-1 transition-all min-w-[140px] ${isToday ? 'z-10' : ''}`}>

            {/* DAY HEADER - ENLARGED FONT */}
            <div
              className={`rounded-lg py-1 px-4 text-center border transition-all flex items-center justify-between h-10 ${isToday ? 'text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-400'}`}
              style={isToday ? { backgroundColor: projectColor, borderColor: projectColor } : {}}
            >
              <div className={`text-[13px] font-black uppercase tracking-tight ${!isToday && isSunday ? 'text-rose-400/80' : ''}`}>{dayLabel}</div>
              <div className={`text-[13px] font-black ${isToday ? 'text-white' : isSunday ? 'text-rose-500' : 'text-slate-300'}`}>{dateStr.split('-')[2]}</div>
            </div>

            {/* FIX: Renamed dragOverNodeId to dragOverDay to match the defined state variable */}
            <Card padding="none" className={`flex-1 bg-card border-theme rounded-lg min-h-[480px] flex flex-col overflow-hidden shadow-sm transition-all ${isToday ? 'ring-2 ring-primary/20 border-primary/40' : ''} ${dragOverDay === idx ? 'bg-primary/5' : ''}`}>

              {/* FOCUS (TOP) - ENLARGED TEXT */}
              <div className="p-2 bg-black/[0.02] border-b border-theme/50 min-h-[60px]">
                <div className="flex items-center justify-between mb-2 px-1.5">
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Фокус</span>
                  {!focusTask && (
                    <button onClick={() => setActiveInput({ day: idx, type: 'focus' })} className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                      <i className="fa-solid fa-plus text-[8px]"></i>
                    </button>
                  )}
                </div>

                {activeInput?.day === idx && activeInput.type === 'focus' ? (
                  <div className="bg-white border border-orange-500 p-2 rounded shadow-xl">
                    <textarea autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickSubmit(idx, 'focus'))} onBlur={() => handleQuickSubmit(idx, 'focus')} placeholder="..." className="w-full bg-transparent border-none p-0 text-[10px] font-black uppercase focus:ring-0 resize-none outline-none text-slate-800" rows={2} />
                  </div>
                ) : focusTask ? (
                  <div draggable onDragStart={(e) => handleDragStart(e, focusTask.id)} className="bg-gradient-to-br from-orange-500 to-rose-500 p-2.5 rounded-lg shadow-md relative group/f overflow-hidden cursor-grab active:cursor-grabbing border border-white/10">
                    <div className="flex items-start gap-2.5 relative z-10">
                      <button onClick={() => onToggleTask(focusTask)} className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${focusTask.status === TaskStatus.DONE ? 'bg-white border-white text-orange-500' : 'bg-transparent border-white/40'}`}>
                        {focusTask.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => onSelectHabit?.(focusTask.id)}>
                        <div className={`text-[12px] font-black uppercase leading-[1.2] text-white line-clamp-2 ${focusTask.status === TaskStatus.DONE ? 'line-through opacity-60' : ''}`}>
                          {focusTask.title}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 flex items-center justify-center border border-dashed border-slate-100 rounded-md bg-slate-50/30 opacity-40 hover:opacity-100 transition-all cursor-pointer" onClick={() => setActiveInput({ day: idx, type: 'focus' })}>
                    <i className="fa-solid fa-bolt text-slate-300 text-[10px]"></i>
                  </div>
                )}
              </div>

              <div className="p-2 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {/* TASKS - ENLARGED TEXT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Завдання</span>
                    <button onClick={() => setActiveInput({ day: idx, type: 'quest' })} className="w-5 h-5 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><i className="fa-solid fa-plus text-[8px]"></i></button>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map(t => (
                      <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)} className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${t.status === TaskStatus.DONE ? 'bg-emerald-50/30 border-emerald-100 opacity-60' : 'bg-white border-slate-50 hover:border-primary/10 shadow-sm'}`}>
                        <button onClick={() => onToggleTask(t)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                          {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                        </button>
                        <span className={`flex-1 text-[12px] font-bold truncate leading-tight ${t.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RITUALS - ENLARGED TEXT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Ритуали</span>
                    <button onClick={() => setActiveInput({ day: idx, type: 'recurrent' })} className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-plus text-[8px]"></i></button>
                  </div>
                  <div className="space-y-1">
                    {recurrentTasks.map(t => {
                      const isDoneToday = t.habitHistory?.[dateStr]?.status === 'completed';
                      return (
                        <div key={t.id} className={`flex items-center gap-2.5 p-2 rounded-lg transition-all border ${isDoneToday ? 'bg-indigo-50/30 border-indigo-100 opacity-60' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`}>
                          <button onClick={(e) => { e.stopPropagation(); toggleHabitStatus(t.id, dateStr, isDoneToday ? 'none' : 'completed'); }} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${isDoneToday ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 bg-white'}`}>
                            {isDoneToday && <i className="fa-solid fa-check text-[7px]"></i>}
                          </button>
                          <span onClick={() => onSelectHabit?.(t.id)} className={`flex-1 text-[12px] font-bold truncate leading-tight cursor-pointer hover:text-indigo-600 ${isDoneToday ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {activeInput?.day === idx && (activeInput.type === 'quest' || activeInput.type === 'recurrent') && (
                  <div className="animate-in slide-in-from-top-1 duration-200">
                    <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickSubmit(idx, activeInput.type))} onBlur={() => handleQuickSubmit(idx, activeInput.type)} placeholder="+ ..." className={`w-full border rounded-md p-1.5 text-[10px] font-bold outline-none shadow-sm ${activeInput.type === 'recurrent' ? 'border-indigo-100 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 bg-slate-50/50 text-slate-700'}`} />
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
