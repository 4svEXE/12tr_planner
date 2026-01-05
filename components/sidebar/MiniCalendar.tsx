
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
    <div className="px-1 py-2 mb-4 mx-1">
      <div className="flex justify-between gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const hasEvent = hasEventOnDay(d);
          return (
            <button key={i} onClick={() => handleDateClick(d)} className="flex flex-col items-center gap-1 group">
              <span className="text-[7px] font-black text-slate-300 uppercase leading-none group-hover:text-orange-500 transition-colors">
                {d.toLocaleString('uk-UA', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${isToday ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                {d.getDate()}
              </div>
              <div className="h-0.5 flex items-center justify-center">
                {hasEvent && <div className="w-1 h-0.5 rounded-full bg-orange-400"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
