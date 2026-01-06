
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import Typography from '../ui/Typography';

interface YearViewProps {
  currentDate: Date;
}

const YearView: React.FC<YearViewProps> = ({ currentDate }) => {
  const { tasks, setCalendarDate, setCalendarViewMode } = useApp();
  const year = currentDate.getFullYear();

  const renderYearMonth = (m: number) => {
    const monthName = new Date(year, m, 1).toLocaleString('uk-UA', { month: 'long' });
    const firstDay = (new Date(year, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div key={m} className="bg-white px-4 py-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-[var(--primary)]/30 transition-all cursor-pointer group hover:shadow-lg" onClick={() => { setCalendarDate(new Date(year, m, 1).getTime()); setCalendarViewMode('month'); }}>
        <Typography variant="tiny" className="text-slate-400 font-black mb-4 text-center uppercase tracking-[0.2em] group-hover:text-[var(--primary)] transition-colors">{monthName}</Typography>
        <div className="grid grid-cols-7 gap-1 text-[7px] font-black text-slate-200 mb-2 text-center">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-x-0.5 gap-y-1">
          {days.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} />;
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === m && new Date().getDate() === d;
            const dayTs = new Date(year, m, d).setHours(0,0,0,0);
            
            // Тільки події (isEvent) відображаються крапочками
            const hasEvent = tasks.some(t => !t.isDeleted && t.isEvent && (
              (t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === dayTs) || 
              (t.endDate && dayTs >= new Date(t.scheduledDate!).setHours(0,0,0,0) && dayTs <= new Date(t.endDate).setHours(0,0,0,0))
            ));
            
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 relative">
                <div className={`h-4 w-4 rounded-md flex items-center justify-center text-[8px] font-black transition-all ${isToday ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-slate-600'}`}>
                  {d}
                </div>
                <div className="h-1 w-full flex justify-center items-center">
                   {hasEvent && <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-[var(--primary)]'}`}></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
      {Array.from({ length: 12 }, (_, i) => renderYearMonth(i))}
    </div>
  );
};

export default YearView;
