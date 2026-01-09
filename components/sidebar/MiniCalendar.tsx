
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
    const ts = new Date(date).setHours(0,0,0,0);
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

    // 1. Перевірка завдань
    tasks.forEach(t => {
      if (t.isDeleted) return;
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

    // 2. Перевірка подій союзників (сині)
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
    <div className="bg-white/50 p-3 rounded-2xl border border-slate-100 shadow-inner">
      <div className="flex justify-between items-center gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const ind = getIndicators(d);
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
              <div className="h-1 flex items-center justify-center gap-0.5">
                {ind.event && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]"></div>}
                {ind.quest && <div className="w-1 h-1 rounded-full bg-pink-500"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
