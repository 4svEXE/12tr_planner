
import React, { useState, useMemo } from 'react';
import { Task, HabitDayData, RecurrenceType } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';

interface HabitStatsSidebarProps {
  habit: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onToggleStatus: (id: string, date: string, status?: 'completed' | 'skipped' | 'none', note?: string) => void;
}

const HabitStatsSidebar: React.FC<HabitStatsSidebarProps> = ({ habit, onClose, onUpdate, onToggleStatus }) => {
  const [activeView, setActiveView] = useState<'week' | 'month' | 'year'>('month');
  const [editingTitle, setEditingTitle] = useState(habit.title);
  const [selectedColor, setSelectedColor] = useState(habit.color || '#f97316');

  const colorOptions = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#facc15', '#a855f7', '#475569'];
  const weekDaysShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const calculateSmartStreak = useMemo(() => {
    const history = habit.habitHistory || {};
    const scheduledDays = habit.daysOfWeek || [0,1,2,3,4,5,6];
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dow = (d.getDay() + 6) % 7;
      const status = history[ds]?.status || 'none';

      if (status === 'completed') {
        streak++;
      } else if (status === 'skipped') {
        continue;
      } else {
        if (scheduledDays.includes(dow)) {
          if (i === 0) continue; 
          break;
        } else {
          continue;
        }
      }
    }
    return streak;
  }, [habit.habitHistory, habit.daysOfWeek]);

  const periodStats = useMemo(() => {
    const history = habit.habitHistory || {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let daysToLookBack = 30;
    if (activeView === 'week') daysToLookBack = 7;
    if (activeView === 'year') daysToLookBack = 365;

    let completedInRange = 0;
    for (let i = 0; i < daysToLookBack; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (history[ds]?.status === 'completed') completedInRange++;
    }

    const allEntries = Object.entries(history) as [string, HabitDayData][];
    return {
      percent: Math.round((completedInRange / daysToLookBack) * 100),
      totalCompleted: completedInRange,
      totalDays: daysToLookBack,
      notes: allEntries.filter(([_, data]) => data.note).sort((a,b) => b[0].localeCompare(a[0]))
    };
  }, [habit.habitHistory, activeView]);

  const toggleDayOfWeek = (idx: number) => {
    const currentDays = habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    let nextDays: number[];
    if (currentDays.includes(idx)) {
      nextDays = currentDays.filter(d => d !== idx);
    } else {
      nextDays = [...currentDays, idx].sort();
    }
    
    let nextRecurrence: RecurrenceType = 'custom';
    if (nextDays.length === 7) nextRecurrence = 'daily';
    else if (nextDays.length === 5 && !nextDays.includes(5) && !nextDays.includes(6)) nextRecurrence = 'weekdays';

    onUpdate({ daysOfWeek: nextDays, recurrence: nextRecurrence });
  };

  const setRecurrencePreset = (type: RecurrenceType) => {
    let nextDays = [0, 1, 2, 3, 4, 5, 6];
    if (type === 'weekdays') nextDays = [0, 1, 2, 3, 4];
    onUpdate({ recurrence: type, daysOfWeek: nextDays });
  };

  const renderPeriodGrid = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayData = habit.habitHistory?.[ds];
      const status = dayData?.status || 'none';
      const weekday = d.toLocaleString('uk-UA', { weekday: 'short' }).toUpperCase();
      cells.push({ ds, status, weekday, dayNum: d.getDate() });
    }

    return (
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div 
              className={`w-full aspect-square rounded-md transition-all duration-300 flex items-center justify-center border ${
                cell.status === 'completed' ? 'shadow-sm' : ''
              }`} 
              style={{ 
                backgroundColor: cell.status === 'completed' ? selectedColor : 
                                 cell.status === 'skipped' ? 'var(--text-main)' : 
                                 'var(--bg-main)', 
                borderColor: cell.status === 'completed' ? selectedColor : 'var(--border-color)'
              }}
            >
               {cell.status === 'completed' && <i className="fa-solid fa-check text-[7px] text-white"></i>}
               {cell.status === 'skipped' && <i className="fa-solid fa-xmark text-[7px] text-[var(--bg-card)]"></i>}
            </div>
            <span className={`text-[5.5px] font-black uppercase tracking-tighter ${cell.ds === today.toISOString().split('T')[0] ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
              {cell.weekday}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderYearHeatmap = () => {
    const today = new Date();
    const rows = 7;
    const cols = 35; 
    const totalDots = rows * cols;
    
    const dots = [];
    for (let i = totalDots - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const status = habit.habitHistory?.[ds]?.status;
      dots.push({ ds, status });
    }

    return (
      <div className="flex flex-col gap-1 overflow-x-auto no-scrollbar pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-0.5 min-w-max">
          {dots.map((dot, idx) => (
            <div 
              key={idx} 
              className="w-1.5 h-1.5 rounded-[1px] transition-colors"
              style={{ 
                backgroundColor: dot.status === 'completed' ? selectedColor : 
                                 dot.status === 'skipped' ? 'var(--text-main)' : 
                                 'var(--border-color)'
              }}
              title={dot.ds}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] text-[var(--text-main)] transition-colors duration-300">
       <header className="p-5 border-b border-[var(--border-color)]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md shrink-0" style={{ backgroundColor: selectedColor }}>
                <i className="fa-solid fa-repeat"></i>
              </div>
              <div className="min-w-0 flex-1">
                 <input 
                   value={editingTitle} 
                   onChange={e => setEditingTitle(e.target.value)} 
                   onBlur={() => onUpdate({ title: editingTitle })}
                   className="text-sm font-black text-[var(--text-main)] bg-transparent border-none p-0 focus:ring-0 w-full uppercase tracking-tight"
                 />
                 <Typography variant="tiny" className="text-[var(--text-muted)] text-[8px] tracking-widest">Дисципліна та аналіз</Typography>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
               <button 
                 onClick={() => onUpdate({ isArchived: !habit.isArchived })}
                 className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${habit.isArchived ? 'bg-indigo-500 text-white shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-indigo-500'}`}
                 title={habit.isArchived ? "Розархівувати" : "Архівувати"}
               >
                 <i className={`fa-solid ${habit.isArchived ? 'fa-box-open' : 'fa-box-archive'} text-xs`}></i>
               </button>
               <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center transition-all"><i className="fa-solid fa-xmark text-xs"></i></button>
            </div>
          </div>

          <div className="flex gap-0.5 bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)]">
             {(['week', 'month', 'year'] as const).map(v => (
               <button key={v} onClick={() => setActiveView(v)} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{v === 'week' ? 'Тиж' : v === 'month' ? 'Міс' : 'Рік'}</button>
             ))}
          </div>
       </header>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* STREAK SECTION */}
          <section>
             <Card padding="md" className="bg-gradient-to-br from-orange-500 to-rose-500 text-white border-none shadow-xl flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                   <Typography variant="tiny" className="text-white/70 font-black uppercase text-[8px] tracking-widest mb-1">Поточна серія</Typography>
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black">{calculateSmartStreak}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Днів</span>
                   </div>
                </div>
                <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                   <i className="fa-solid fa-fire text-5xl animate-pulse text-white/90"></i>
                </div>
                {/* Background Decor */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
             </Card>
          </section>

          <section className="space-y-3">
             <Typography variant="tiny" className="text-[var(--text-main)] font-black uppercase text-[8px] px-1 opacity-60">Дні активності</Typography>
             <div className="bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-color)]">
                <div className="flex justify-between gap-1 mb-3">
                   {weekDaysShort.map((day, idx) => {
                     const isSelected = (habit.daysOfWeek || [0,1,2,3,4,5,6]).includes(idx);
                     return (
                       <button 
                        key={idx}
                        onClick={() => toggleDayOfWeek(idx)}
                        className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all border ${isSelected ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--primary)]/20'}`}
                       >
                         {day}
                       </button>
                     );
                   })}
                </div>
                <div className="flex gap-1.5">
                   <button onClick={() => setRecurrencePreset('daily')} className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase border transition-all ${habit.recurrence === 'daily' ? 'bg-[var(--text-main)] text-[var(--bg-card)] border-[var(--text-main)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'}`}>Щодня</button>
                   <button onClick={() => setRecurrencePreset('weekdays')} className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase border transition-all ${habit.recurrence === 'weekdays' ? 'bg-[var(--text-main)] text-[var(--bg-card)] border-[var(--text-main)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'}`}>Будні</button>
                </div>
             </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
             <Card padding="sm" className="bg-[var(--primary)]/5 border-[var(--primary)]/20 flex flex-col items-center justify-center text-center py-3">
                <div className="text-xl font-black text-[var(--primary)] leading-none mb-1">{periodStats.percent}%</div>
                <Typography variant="tiny" className="text-[var(--primary)] text-[7px] opacity-60 font-black">Ефективність</Typography>
             </Card>
             <Card padding="sm" className="bg-[var(--bg-main)] border-[var(--border-color)] flex flex-col items-center justify-center text-center py-3">
                <div className="text-xl font-black text-[var(--text-main)] leading-none mb-1">
                  {periodStats.totalCompleted}<span className="text-xs text-[var(--text-muted)]">/{periodStats.totalDays}</span>
                </div>
                <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] font-black uppercase">Виконано</Typography>
             </Card>
          </div>

          <section>
             <div className="flex items-center justify-between mb-2 px-1">
               <Typography variant="tiny" className="text-[var(--text-main)] font-black flex items-center gap-1.5 uppercase text-[8px] tracking-widest">
                  <i className="fa-solid fa-chart-simple text-[var(--primary)] text-[7px]"></i> {activeView === 'year' ? 'Теплова карта' : 'Останні 14 днів'}
               </Typography>
             </div>
             <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                {activeView === 'year' ? renderYearHeatmap() : renderPeriodGrid()}
             </div>
          </section>

          <section>
             <Typography variant="tiny" className="text-[var(--text-main)] font-black mb-2 uppercase text-[8px] px-1 opacity-60">Колір звички</Typography>
             <div className="flex flex-wrap gap-1.5 px-1">
                {colorOptions.map(c => (
                  <button 
                    key={c} 
                    onClick={() => { setSelectedColor(c); onUpdate({ color: c }); }}
                    className={`w-7 h-7 rounded-lg transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-[var(--primary)] scale-105 shadow-sm' : 'hover:scale-105 border border-[var(--border-color)]'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
          </section>
       </div>

       <footer className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 backdrop-blur-sm">
          <Button variant="white" onClick={onClose} className="w-full rounded-xl py-3 font-black uppercase text-[8px] tracking-widest shadow-sm">ЗАКРИТИ</Button>
       </footer>
    </div>
  );
};

export default HabitStatsSidebar;
