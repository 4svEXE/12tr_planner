
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

const Calendar: React.FC = () => {
  const { tasks, scheduleTask, toggleTaskStatus } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // Helper to get start of day timestamp
  const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Navigation handlers
  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'year') next.setFullYear(currentDate.getFullYear() + direction);
    else if (viewMode === 'month') next.setMonth(currentDate.getMonth() + direction);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + (direction * 7));
    else next.setDate(currentDate.getDate() + direction);
    setCurrentDate(next);
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'year') setViewMode('month');
  };

  // Task filtering
  const unscheduledTasks = useMemo(() => 
    tasks.filter(t => t.status !== TaskStatus.DONE && !t.scheduledDate),
  [tasks]);

  const scheduledTasks = useMemo(() => 
    tasks.filter(t => t.scheduledDate),
  [tasks]);

  // Calendar Data Generation
  const calendarData = useMemo(() => {
    const start = new Date(currentDate);
    
    if (viewMode === 'month') {
      start.setDate(1);
      const startDay = start.getDay() === 0 ? 6 : start.getDay() - 1; // Adjust for Monday start
      start.setDate(start.getDate() - startDay);
      return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else if (viewMode === 'week') {
      const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - day);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else if (viewMode === 'day') {
      return [new Date(currentDate)];
    } else {
      // Agenda: Next 14 days
      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      });
    }
  }, [currentDate, viewMode]);

  // Drag and Drop
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDrop = (e: React.DragEvent, timestamp: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      scheduleTask(taskId, timestamp);
    }
  };

  const renderTask = (task: Task, isSmall = false) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
      className={`group flex items-center gap-2 p-2 mb-1 rounded-xl border border-transparent transition-all cursor-pointer ${
        task.status === TaskStatus.DONE 
          ? 'bg-slate-50 opacity-50' 
          : 'bg-white shadow-sm hover:shadow-md hover:border-orange-100 hover:scale-[1.02]'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.isPinned ? 'bg-pink-500' : 'bg-orange-500'}`}></div>
      <span className={`text-[10px] font-bold truncate ${isSmall ? 'max-w-[80px]' : ''} ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-700'}`}>
        {task.title}
      </span>
    </div>
  );

  const renderMiniMonth = (monthIndex: number) => {
    const year = currentDate.getFullYear();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    for (let i = 0; i < startDayOffset; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

    const monthTitle = new Date(year, monthIndex).toLocaleString('uk-UA', { month: 'long' });

    return (
      <Card 
        key={monthIndex} 
        padding="sm" 
        hover 
        className="bg-white/50 backdrop-blur-sm group/month border-slate-100"
        onClick={() => {
          const newDate = new Date(currentDate);
          newDate.setMonth(monthIndex);
          setCurrentDate(newDate);
          setViewMode('month');
        }}
      >
        <Typography variant="tiny" className="text-slate-900 mb-3 group-hover/month:text-orange-600 transition-colors capitalize">
          {monthTitle}
        </Typography>
        <div className="grid grid-cols-7 gap-1">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((d, idx) => (
            <div key={idx} className="text-[7px] font-black text-slate-300 text-center">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            
            const timestamp = getStartOfDay(new Date(year, monthIndex, day));
            const hasTasks = scheduledTasks.some(t => t.scheduledDate === timestamp);
            const isToday = timestamp === getStartOfDay(new Date());

            return (
              <div 
                key={idx} 
                className={`aspect-square flex items-center justify-center text-[8px] font-bold rounded-full relative ${
                  isToday ? 'bg-orange-600 text-white' : 'text-slate-500'
                }`}
              >
                {day}
                {hasTasks && !isToday && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const headerTitle = viewMode === 'year' 
    ? currentDate.getFullYear().toString() 
    : currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar: Backlog */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 hidden lg:flex">
        <div className="mb-6">
          <Typography variant="h3" className="mb-1">Беклог</Typography>
          <Typography variant="caption">Нерозподілені квести</Typography>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {unscheduledTasks.length > 0 ? (
            unscheduledTasks.map(t => renderTask(t))
          ) : (
            <div className="text-center py-10 px-4 border-2 border-dashed border-slate-100 rounded-3xl">
              <i className="fa-solid fa-calendar-check text-slate-100 text-3xl mb-3"></i>
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-relaxed">
                Всі квести заплановано або виконано
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50">
          <Card blur padding="sm" className="bg-orange-50/50 border-orange-100">
             <Typography variant="tiny" className="text-orange-600 mb-2">Гейміфікація</Typography>
             <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
               Перетягніть завдання на календар, щоб отримати <span className="text-orange-600">+10 XP</span> за стратегічне планування.
             </p>
          </Card>
        </div>
      </aside>

      {/* Main Calendar View */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Typography variant="h2" className="text-slate-900 capitalize min-w-[180px]">
              {headerTitle}
            </Typography>
            <div className="flex bg-slate-100 rounded-2xl p-1">
              <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <button onClick={setToday} className="px-4 text-[10px] font-black uppercase text-slate-500 hover:text-orange-600 transition-colors border-x border-slate-200">Сьогодні</button>
              <button onClick={() => navigate(1)} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>

          <div className="flex bg-slate-100 rounded-2xl p-1">
            {(['day', 'week', 'month', 'year', 'agenda'] as ViewMode[]).map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode 
                    ? 'bg-white shadow-sm text-orange-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {mode === 'day' ? 'День' : mode === 'week' ? 'Тиждень' : mode === 'month' ? 'Місяць' : mode === 'year' ? 'Рік' : 'Розклад'}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {viewMode === 'year' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {Array.from({ length: 12 }, (_, i) => renderMiniMonth(i))}
            </div>
          ) : (
            <div className={`grid gap-px bg-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 ${
              viewMode === 'month' ? 'grid-cols-7' : 
              viewMode === 'week' ? 'grid-cols-7' : 
              viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              
              {/* Header for Day Names */}
              {viewMode !== 'agenda' && viewMode !== 'day' && ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                <div key={d} className="bg-slate-50 p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200">
                  {d}
                </div>
              ))}

              {/* Calendar Cells */}
              {calendarData.map((date, i) => {
                const timestamp = getStartOfDay(date);
                const isToday = timestamp === getStartOfDay(new Date());
                const isOtherMonth = date.getMonth() !== currentDate.getMonth();
                const dayTasks = scheduledTasks.filter(t => t.scheduledDate === timestamp);
                const isOver = dragOverDay === timestamp;

                return (
                  <div 
                    key={i}
                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(timestamp); }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(e) => onDrop(e, timestamp)}
                    className={`min-h-[140px] p-3 flex flex-col bg-white transition-all relative group ${
                      isOtherMonth && viewMode === 'month' ? 'opacity-30' : ''
                    } ${isOver ? 'bg-orange-50/50 ring-2 ring-inset ring-orange-200 z-10' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                        isToday ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-400'
                      }`}>
                        {date.getDate()}
                      </span>
                      {viewMode === 'agenda' && (
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          {date.toLocaleString('uk-UA', { weekday: 'short' })}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      {dayTasks.map(t => renderTask(t, viewMode === 'month'))}
                      {dayTasks.length === 0 && !isOver && (
                        <div className="hidden group-hover:flex h-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <i className="fa-solid fa-plus text-slate-100 text-2xl"></i>
                        </div>
                      )}
                    </div>

                    {isToday && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedTaskId && (
        <div className="fixed inset-0 z-[100] flex justify-end tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setSelectedTaskId(null)}></div>
          <TaskDetails 
            task={tasks.find(t => t.id === selectedTaskId)!} 
            onClose={() => setSelectedTaskId(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default Calendar;
