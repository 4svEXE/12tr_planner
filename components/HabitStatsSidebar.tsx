
import React, { useState, useMemo } from 'react';
import { Task, HabitDayData } from '../types';
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
                                 cell.status === 'skipped' ? '#0f172a' : 
                                 '#e2e8f0', 
                borderColor: cell.status === 'completed' ? selectedColor : 'transparent'
              }}
            >
               {cell.status === 'completed' && <i className="fa-solid fa-check text-[7px] text-white"></i>}
               {cell.status === 'skipped' && <i className="fa-solid fa-xmark text-[7px] text-slate-400"></i>}
            </div>
            <span className={`text-[5.5px] font-black uppercase tracking-tighter ${cell.ds === today.toISOString().split('T')[0] ? 'text-orange-500' : 'text-slate-400'}`}>
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
              className="w-1 h-1 rounded-[1px] transition-colors"
              style={{ 
                backgroundColor: dot.status === 'completed' ? selectedColor : 
                                 dot.status === 'skipped' ? '#0f172a' : 
                                 '#f1f5f9'
              }}
              title={dot.ds}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
       <header className="p-5 border-b border-slate-50">
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
                   className="text-sm font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full"
                 />
                 <Typography variant="tiny" className="text-slate-400 text-[8px]">Аналітика дисципліни</Typography>
              </div>
            </div>
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-300 flex items-center justify-center transition-all shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
          </div>

          <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
             {(['week', 'month', 'year'] as const).map(v => (
               <button key={v} onClick={() => setActiveView(v)} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>{v === 'week' ? 'Тиж' : v === 'month' ? 'Міс' : 'Рік'}</button>
             ))}
          </div>
       </header>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          <div className="grid grid-cols-2 gap-3">
             <Card padding="sm" className="bg-orange-50/50 border-orange-100 flex flex-col items-center justify-center text-center py-3">
                <div className="text-xl font-black text-orange-600 leading-none mb-1">{periodStats.percent}%</div>
                <Typography variant="tiny" className="text-orange-400 text-[7px]">Ефективність</Typography>
             </Card>
             <Card padding="sm" className="bg-slate-50 border-slate-100 flex flex-col items-center justify-center text-center py-3">
                <div className="text-xl font-black text-slate-800 leading-none mb-1">
                  {periodStats.totalCompleted}<span className="text-xs text-slate-300">/{periodStats.totalDays}</span>
                </div>
                <Typography variant="tiny" className="text-slate-400 text-[7px]">Виконано днів</Typography>
             </Card>
          </div>

          <section>
             <div className="flex items-center justify-between mb-2 px-1">
               <Typography variant="tiny" className="text-slate-900 font-black flex items-center gap-1.5 uppercase text-[8px]">
                  <i className="fa-solid fa-chart-simple text-orange-500 text-[7px]"></i> {activeView === 'year' ? 'Теплова карта' : 'Активність за 14 днів'}
               </Typography>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                {activeView === 'year' ? renderYearHeatmap() : renderPeriodGrid()}
             </div>
          </section>

          <section>
             <Typography variant="tiny" className="text-slate-900 font-black mb-2 uppercase text-[8px] px-1">Колір звички</Typography>
             <div className="flex flex-wrap gap-1.5 px-1">
                {colorOptions.map(c => (
                  <button 
                    key={c} 
                    onClick={() => { setSelectedColor(c); onUpdate({ color: c }); }}
                    className={`w-6 h-6 rounded-lg transition-all ${selectedColor === c ? 'ring-2 ring-offset-1 ring-slate-200 scale-105 shadow-sm' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
          </section>
       </div>

       <footer className="p-5 border-t border-slate-50 bg-slate-50/30">
          <Button variant="white" onClick={onClose} className="w-full rounded-xl py-3 font-black uppercase text-[8px] tracking-widest">ЗАКРИТИ</Button>
       </footer>
    </div>
  );
};

export default HabitStatsSidebar;
