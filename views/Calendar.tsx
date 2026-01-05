
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import HashtagAutocomplete from '../components/HashtagAutocomplete';
import Badge from '../components/ui/Badge';

// Sub-components
import CalendarHeader from '../components/calendar/CalendarHeader';
import BacklogSidebar from '../components/calendar/BacklogSidebar';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import YearView from '../components/calendar/YearView';

const CreationSidebar: React.FC<{ 
  onClose: () => void; 
  onSave: (data: { title: string, isEvent: boolean, projectId?: string }) => void;
  date: Date;
}> = ({ onClose, onSave, date }) => {
  const { projects } = useApp();
  const [title, setTitle] = useState('');
  const [isEvent, setIsEvent] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  return (
    <div className="w-80 h-full bg-white flex flex-col animate-in slide-in-from-right duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] border-l border-slate-100">
      <header className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
        <div>
          <Typography variant="h3" className="leading-none mb-1 text-slate-900">Новий квест</Typography>
          <Typography variant="tiny" className="text-orange-500 font-black">{date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</Typography>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-300 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Title Input with Hashtags */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Назва та Теги</label>
          <HashtagAutocomplete
            value={title}
            onChange={setTitle}
            onSelectTag={() => {}}
            placeholder="Напр: #робота Підготувати звіт..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
          />
        </div>

        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Тип запису</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setIsEvent(false)}
              className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 ${!isEvent ? 'border-orange-500 bg-orange-50/30' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-100'}`}
            >
              <i className="fa-solid fa-check-to-slot text-sm"></i>
              <span className="text-[10px] font-black uppercase">Завдання</span>
            </button>
            <button 
              onClick={() => setIsEvent(true)}
              className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 ${isEvent ? 'border-pink-500 bg-pink-50/30 text-pink-700' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-100'}`}
            >
              <i className="fa-solid fa-calendar-star text-sm"></i>
              <span className="text-[10px] font-black uppercase">Подія</span>
            </button>
          </div>
        </div>

        {/* Project Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Проєкт</label>
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
            <button 
              onClick={() => setProjectId(undefined)}
              className={`w-full p-3 rounded-xl border text-left text-[11px] font-bold transition-all flex items-center gap-3 ${!projectId ? 'border-orange-200 bg-orange-50/50' : 'border-slate-50 hover:border-slate-100'}`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              Без проєкту
            </button>
            {projects.filter(p => p.status === 'active').map(p => (
              <button 
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className={`w-full p-3 rounded-xl border text-left text-[11px] font-bold transition-all flex items-center gap-3 ${projectId === p.id ? 'border-orange-200 bg-orange-50/50' : 'border-slate-50 hover:border-slate-100'}`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
        <Button 
          disabled={!title.trim()}
          variant="primary" 
          className="w-full py-4 rounded-2xl shadow-xl shadow-orange-100 font-black tracking-widest uppercase text-xs"
          onClick={() => onSave({ title, isEvent, projectId })}
        >
          СТВОРИТИ {isEvent ? 'ПОДІЮ' : 'ЗАВДАННЯ'}
        </Button>
      </div>
    </div>
  );
};

const Calendar: React.FC = () => {
  const { 
    tasks, addTask, updateTask, scheduleTask, 
    calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const currentDate = useMemo(() => new Date(calendarDate), [calendarDate]);

  const handleNavigate = (direction: number) => {
    const next = new Date(currentDate);
    if (calendarViewMode === 'year') next.setFullYear(currentDate.getFullYear() + direction);
    else if (calendarViewMode === 'month') next.setMonth(currentDate.getMonth() + direction);
    else if (calendarViewMode === 'week') next.setDate(currentDate.getDate() + (direction * 7));
    else next.setDate(currentDate.getDate() + direction);
    setCalendarDate(next.getTime());
  };

  const handleToday = () => {
    setCalendarDate(Date.now());
    if (calendarViewMode === 'year') setCalendarViewMode('month');
  };

  const onDrop = (e: React.DragEvent, timestamp: number) => {
    e.preventDefault(); 
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) scheduleTask(taskId, timestamp);
  };

  const handleCreateRequest = (timestamp: number) => {
    setCreationDate(new Date(timestamp));
    setSelectedTaskId(null);
  };

  const handleFinalizeCreation = (data: { title: string, isEvent: boolean, projectId?: string }) => {
    if (!creationDate) return;
    
    // Using the improved addTask that handles all fields in one call
    const newId = addTask(
      data.title, 
      'tasks', 
      data.projectId, 
      'actions', 
      data.isEvent, 
      creationDate.getTime()
    );

    // Close creation sidebar and open task details
    setCreationDate(null);
    setSelectedTaskId(newId);
  };

  const renderMainView = () => {
    switch (calendarViewMode) {
      case 'day': return <DayView currentDate={currentDate} onSelectTask={setSelectedTaskId} onAddQuickEvent={handleCreateRequest} />;
      case 'week': return <WeekView currentDate={currentDate} dragOverDay={dragOverDay} onDragOver={(e, ts) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={onDrop} onSelectTask={setSelectedTaskId} onAddQuickEvent={handleCreateRequest} />;
      case 'month': return <MonthView currentDate={currentDate} dragOverDay={dragOverDay} onDragOver={(e, ts) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={onDrop} onSelectTask={setSelectedTaskId} onAddQuickEvent={handleCreateRequest} />;
      case 'year': return <YearView currentDate={currentDate} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <BacklogSidebar onSelectTask={(id) => { setSelectedTaskId(id); setCreationDate(null); }} />

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <CalendarHeader 
          currentDate={currentDate} 
          viewMode={calendarViewMode} 
          onNavigate={handleNavigate} 
          onToday={handleToday} 
          onSetViewMode={setCalendarViewMode} 
        />

        <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
          {renderMainView()}
        </div>
      </main>

      {creationDate && (
        <div className="flex h-full border-l border-slate-100 bg-white z-[60]">
           <CreationSidebar 
              date={creationDate} 
              onClose={() => setCreationDate(null)} 
              onSave={handleFinalizeCreation} 
           />
        </div>
      )}

      {selectedTaskId && (
        <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-100 bg-white z-[60]">
           <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 ${isResizing ? 'bg-orange-500' : 'bg-slate-50'}`}></div>
           <div style={{ width: detailsWidth }}>
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
