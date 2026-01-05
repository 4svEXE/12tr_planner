
import React from 'react';
import Typography from '../ui/Typography';
import { CalendarViewMode } from '../../contexts/AppContext';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  onSetViewMode: (mode: CalendarViewMode) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ currentDate, viewMode, onNavigate, onToday, onSetViewMode }) => {
  return (
    <header className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-20 shrink-0">
      <div className="flex items-center gap-4">
        <Typography variant="h3" className="text-slate-900 capitalize min-w-[140px] text-base">
          {viewMode === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
        </Typography>
        <div className="flex bg-slate-100 rounded-xl p-0.5">
          <button onClick={() => onNavigate(-1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
          <button onClick={onToday} className="px-3 text-[9px] font-black uppercase text-slate-500 hover:text-orange-600 border-x border-slate-200 transition-colors">Сьогодні</button>
          <button onClick={() => onNavigate(1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
        </div>
      </div>
      <div className="flex bg-slate-100 rounded-xl p-0.5">
        {(['day', 'week', 'month', 'year'] as CalendarViewMode[]).map(mode => (
          <button 
            key={mode} 
            onClick={() => onSetViewMode(mode)} 
            className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {mode === 'day' ? 'День' : mode === 'week' ? 'Тиж' : mode === 'month' ? 'Міс' : 'Рік'}
          </button>
        ))}
      </div>
    </header>
  );
};

export default CalendarHeader;
