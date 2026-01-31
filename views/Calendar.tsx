
import React, { useState, useMemo, useEffect } from 'react';
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
  const [showBacklogMobile, setShowBacklogMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const newId = addTask(
      "", 
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
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      {/* Backlog Sidebar - Adaptive */}
      <div className={`${isMobile ? (showBacklogMobile ? 'fixed inset-0 z-[150] w-full translate-x-0' : 'fixed inset-0 z-[150] w-full -translate-x-full') : 'relative'} transition-transform duration-300 h-full`}>
        <BacklogSidebar onSelectTask={handleSelectTask} />
        {isMobile && showBacklogMobile && (
          <button 
            onClick={() => setShowBacklogMobile(false)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[160]"
          >
            <i className="fa-solid fa-calendar-days text-xl"></i>
          </button>
        )}
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <CalendarHeader 
          currentDate={currentDate} 
          viewMode={calendarViewMode} 
          onNavigate={handleNavigate} 
          onToday={handleToday} 
          onSetViewMode={setCalendarViewMode} 
        />

        <div className="flex-1 overflow-auto p-2 md:p-6 custom-scrollbar bg-[var(--bg-main)]">
          {renderMainView()}
        </div>
      </main>

      {/* Task Details Panel */}
      <div 
        className={`h-full border-l border-[var(--border-color)] bg-[var(--bg-card)] transition-all duration-300 ease-in-out shrink-0 relative z-[200] ${
          selectedTaskId ? 'translate-x-0' : 'translate-x-full absolute'
        }`}
        style={{ width: selectedTaskId ? (isMobile ? '100vw' : detailsWidth) : 0 }}
      >
        {selectedTaskId && (
           <>
              {!isMobile && (
                <div 
                  onMouseDown={startResizing} 
                  className={`absolute left-0 top-0 bottom-0 w-[2px] cursor-col-resize hover:bg-[var(--primary)] z-[50] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-transparent'}`}
                ></div>
              )}
              <div className="h-full w-full overflow-hidden">
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
