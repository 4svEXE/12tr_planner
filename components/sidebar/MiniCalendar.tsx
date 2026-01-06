
import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';

const MiniCalendar: React.FC = () => {
  const { tasks, setActiveTab, setCalendarDate, setCalendarViewMode } = useApp();
  const today = new Date();
  
  const weekDays = useMemo(() => {
    const start = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const hasEventOnDay = (date: Date) => {
    const ts = new Date(date).setHours(0,0,0,0);
    return tasks.some(t => {
      if (!t.isEvent || t.isDeleted) return false;
      const start = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
      const end = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : start;
      if (!start) return false;
      return ts >= start && ts <= (end || start);
    });
  };

  const handleDateClick = (date: Date) => {
    setCalendarDate(date.getTime());
    setCalendarViewMode('week');
    setActiveTab('calendar');
  };

  return (
    <div className="px-1 py-0.5 mb-0.5 mx-0.5">
      <div className="flex justify-between gap-0">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const hasEvent = hasEventOnDay(d);
          return (
            <button key={i} onClick={() => handleDateClick(d)} className="flex flex-col items-center gap-0 group shrink-0">
              <span className="text-[5px] font-black text-slate-300 uppercase leading-none group-hover:text-[var(--primary)] transition-colors">
                {d.toLocaleString('uk-UA', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div className={`w-[18px] h-[18px] rounded-md flex items-center justify-center text-[7px] font-black transition-all ${isToday ? 'bg-[var(--primary)] text-white shadow shadow-[var(--primary)]/30' : 'text-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover)]'}`}>
                {d.getDate()}
              </div>
              <div className="h-0.5 flex items-center justify-center">
                {hasEvent && <div className="w-0.5 h-0.5 rounded-full bg-pink-400"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
