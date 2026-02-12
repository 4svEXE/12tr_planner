
import React from 'react';
import Typography from '../ui/Typography';
import { CalendarViewMode } from '../../types';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  onSetViewMode: (mode: CalendarViewMode) => void;
  onSetShowBacklog?: (show: boolean) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ currentDate, viewMode, onNavigate, onToday, onSetViewMode, onSetShowBacklog }) => {
  return (
    <header className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-20 shrink-0">
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <Typography variant="h3" className="text-[var(--text-main)] capitalize min-w-[140px] text-base">
          {viewMode === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
        </Typography>
        <div className="flex bg-[var(--bg-main)] rounded-xl p-0.5 border border-[var(--border-color)]">
          <button onClick={() => onNavigate(-1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
          <button onClick={() => onNavigate(1)} className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
        </div>
        {onSetShowBacklog && (
          <button
            onClick={() => onSetShowBacklog(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            title="Записник"
          >
            <i className="fa-solid fa-list-check text-[10px]"></i>
          </button>
        )}
      </div>
      <div className="flex bg-[var(--bg-main)] rounded-xl p-0.5 border border-[var(--border-color)] overflow-x-auto no-scrollbar w-full md:w-auto">
        <button
          onClick={onToday}
          className="px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-[var(--text-muted)] hover:text-[var(--text-main)] border-r border-[var(--border-color)]/30 mr-0.5"
        >
          Сьогодні
        </button>
        {(['day', 'week', 'month', 'year'] as CalendarViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => onSetViewMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === mode ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            {mode === 'day' ? 'День' : mode === 'week' ? 'Тиж' : mode === 'month' ? 'Міс' : 'Рік'}
          </button>
        ))}
      </div>
    </header>
  );
};

export default CalendarHeader;
