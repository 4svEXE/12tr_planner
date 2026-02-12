import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';

const MiniCalendar: React.FC = () => {
  const { tasks, people, setActiveTab, setCalendarDate, setCalendarViewMode } = useApp();
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

  const getIndicators = (date: Date) => {
    const dY = date.getFullYear();
    const dM = String(date.getMonth() + 1).padStart(2, '0');
    const dD = String(date.getDate()).padStart(2, '0');
    const dateStr = `${dY}-${dM}-${dD}`;

    const m = date.getMonth();
    const d = date.getDate();
    const y = date.getFullYear();

    const indicators = {
      event: false, // Синя: Події (квести-події, ДН, дати союзників)
      quest: false  // Рожева: Звичайні квести з дедлайном
    };

    tasks.forEach(t => {
      if (t.isDeleted || t.showInCalendar === false) return;
      if (!t.scheduledDate) return;
      
      const taskDate = new Date(t.scheduledDate);
      const tY = taskDate.getFullYear();
      const tM = String(taskDate.getMonth() + 1).padStart(2, '0');
      const tD = String(taskDate.getDate()).padStart(2, '0');
      const tDateStr = `${tY}-${tM}-${tD}`;

      if (tDateStr === dateStr) {
        if (t.isEvent) indicators.event = true;
        else indicators.quest = true;
      }
    });

    const hasAllyEvent = people.some(p => {
      if (p.birthDate && p.birthDateShowInCalendar !== false) {
        const bd = new Date(p.birthDate);
        if (bd.getMonth() === m && bd.getDate() === d && (p.birthDateRepeatYearly !== false || bd.getFullYear() === y)) return true;
      }
      return p.importantDates?.some(idate => {
        if (!idate.showInCalendar) return false;
        const id = new Date(idate.date);
        return id.getMonth() === m && id.getDate() === d && (idate.repeatYearly || id.getFullYear() === y);
      });
    });

    if (hasAllyEvent) indicators.event = true;

    return indicators;
  };

  const handleDateClick = (date: Date) => {
    setCalendarDate(date.getTime());
    setCalendarViewMode('week');
    setActiveTab('calendar');
  };

  return (
    <div className="p-1 w-full bg-transparent">
      <div className="flex justify-between items-center gap-0.5">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const ind = getIndicators(d);
          return (
            <button 
              key={i} 
              onClick={() => handleDateClick(d)} 
              className="flex flex-col items-center gap-0.5 group flex-1 min-w-0 transition-transform active:scale-90"
            >
              <span className={`text-[5px] md:text-[6px] font-black uppercase leading-none transition-colors ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-sidebar)] opacity-50'}`}>
                {d.toLocaleString('uk-UA', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-[8px] md:text-[9px] font-black transition-all ${isToday ? 'bg-[var(--primary)] text-white shadow-lg ring-1 ring-[var(--primary)]/20' : 'text-[var(--text-sidebar)] hover:bg-black/5 hover:shadow-sm'}`}>
                {d.getDate()}
              </div>
              <div className="h-0.5 flex items-center justify-center gap-0.5">
                {ind.event && <div className="w-0.5 h-0.5 rounded-full bg-blue-400"></div>}
                {ind.quest && <div className="w-0.5 h-0.5 rounded-full bg-rose-400"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;