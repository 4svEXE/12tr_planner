
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
      <div key={m} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors cursor-pointer" onClick={() => { setCalendarDate(new Date(year, m, 1).getTime()); setCalendarViewMode('month'); }}>
        <Typography variant="tiny" className="text-slate-400 font-black mb-2 text-center uppercase tracking-widest">{monthName}</Typography>
        <div className="grid grid-cols-7 gap-0.5 text-[6px] font-black text-slate-200 mb-1 text-center">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} />;
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === m && new Date().getDate() === d;
            const dayTs = new Date(year, m, d).setHours(0,0,0,0);
            const hasTask = tasks.some(t => !t.isDeleted && (t.scheduledDate === dayTs || (t.isEvent && t.endDate && dayTs >= t.scheduledDate! && dayTs <= t.endDate)));
            return (
              <div key={i} className={`h-3 w-3 rounded-[2px] flex items-center justify-center text-[5px] font-bold ${isToday ? 'bg-orange-600 text-white' : hasTask ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
      {Array.from({ length: 12 }, (_, i) => renderYearMonth(i))}
    </div>
  );
};

export default YearView;
