import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';
import Typography from '../components/ui/Typography';

// Sub-components
import CalendarHeader from '../components/calendar/CalendarHeader';
import BacklogSidebar from '../components/calendar/BacklogSidebar';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import YearView from '../components/calendar/YearView';

const Calendar: React.FC = () => {
  const { 
    tasks, addTask, scheduleTask, 
    calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 800);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
    // МИТТЄВО СТВОРЮЄМО ПОРОЖНІЙ ТАСК І ВІДКРИВАЄМО ДЕТАЛІ
    const newId = addTask(
      "", // Пустий заголовок для заповнення користувачем
      'unsorted', 
      undefined, 
      'actions', 
      false, 
      timestamp
    );
    setSelectedTaskId(newId);
  };

  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id);
  };

  const renderMainView = () => {
    switch (calendarViewMode) {
      case 'day': return <DayView currentDate={currentDate} onSelectTask={handleSelectTask} onAddQuickEvent={handleCreateRequest} />;
      case 'week': return <WeekView currentDate={currentDate} dragOverDay={dragOverDay} onDragOver={(e, ts) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={onDrop} onSelectTask={handleSelectTask} onAddQuickEvent={handleCreateRequest} />;
      case 'month': return <MonthView currentDate={currentDate} dragOverDay={dragOverDay} onDragOver={(e, ts) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={onDrop} onSelectTask={handleSelectTask} onAddQuickEvent={handleCreateRequest} />;
      case 'year': return <YearView currentDate={currentDate} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      <BacklogSidebar onSelectTask={handleSelectTask} />

      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 bg-slate-50/30">
        <CalendarHeader 
          currentDate={currentDate} 
          viewMode={calendarViewMode} 
          onNavigate={handleNavigate} 
          onToday={handleToday} 
          onSetViewMode={setCalendarViewMode} 
        />

        <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
          {renderMainView()}
        </div>
      </main>

      {/* FIXED SIDEBAR CONTAINER FOR STABLE LAYOUT */}
      <div 
        className={`h-full border-l border-slate-100 bg-white transition-all duration-300 ease-in-out shrink-0 relative z-40 ${
          selectedTaskId ? 'translate-x-0' : 'translate-x-full hidden lg:block opacity-0'
        }`}
        style={{ width: selectedTaskId ? (window.innerWidth < 1024 ? '100vw' : detailsWidth) : 0 }}
      >
        {selectedTaskId && (
           <>
              <div 
                onMouseDown={startResizing} 
                className={`hidden lg:block absolute left-0 top-0 bottom-0 w-[1.5px] cursor-col-resize hover:bg-orange-500 z-[50] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-transparent'}`}
              ></div>
              <div className="h-full w-full overflow-hidden shadow-2xl lg:shadow-none">
                <TaskDetails 
                  task={tasks.find(t => t.id === selectedTaskId)!} 
                  onClose={() => setSelectedTaskId(null)} 
                />
              </div>
           </>
        )}
      </div>
    </div>
  );
};

export default Calendar;