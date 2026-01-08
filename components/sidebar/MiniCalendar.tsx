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
    <div className="bg-white/50 p-3 rounded-2xl border border-slate-100 shadow-inner">
      <div className="flex justify-between items-center gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const hasEvent = hasEventOnDay(d);
          return (
            <button 
              key={i} 
              onClick={() => handleDateClick(d)} 
              className="flex flex-col items-center gap-1 group shrink-0 transition-transform active:scale-90"
            >
              <span className={`text-[6px] font-black uppercase leading-none transition-colors ${isToday ? 'text-orange-600' : 'text-slate-300'}`}>
                {d.toLocaleString('uk-UA', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${isToday ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 ring-2 ring-orange-50' : 'text-slate-700 hover:bg-white hover:shadow-sm hover:text-orange-600'}`}>
                {d.getDate()}
              </div>
              <div className="h-1 flex items-center justify-center">
                {hasEvent && <div className="w-1 h-1 rounded-full bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,0.5)] animate-pulse"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;