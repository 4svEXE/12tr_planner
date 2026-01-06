
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, HabitDayData } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

// --- Habit Stats Sidebar Component ---
const HabitStatsSidebar: React.FC<{ 
  habit: Task, 
  onClose: () => void, 
  onUpdate: (updates: Partial<Task>) => void,
  onToggleStatus: (id: string, date: string, status?: 'completed' | 'skipped' | 'none', note?: string) => void
}> = ({ habit, onClose, onUpdate, onToggleStatus }) => {
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

    const allEntries = Object.entries(history);
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
        <div className="flex justify-between mt-1">
            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-slate-100"></div><span className="text-[5px] font-black text-slate-300 uppercase">Мін</span></div>
            <div className="flex items-center gap-0.5"><span className="text-[5px] font-black text-slate-300 uppercase">Макс</span><div className="w-1 h-1 rounded-full" style={{ backgroundColor: selectedColor }}></div></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[340px] bg-white border-l border-slate-100 z-[110] shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col">
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
             <Typography variant="tiny" className="text-slate-900 font-black mb-2 flex items-center gap-1.5 uppercase text-[8px] px-1">
                <i className="fa-solid fa-quote-left text-orange-500 text-[7px]"></i> Журнал
             </Typography>
             <div className="space-y-2">
                {periodStats.notes.length > 0 ? periodStats.notes.map(([date, data]) => (
                   <div key={date} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="text-[7px] font-black text-slate-300 uppercase mb-1">{new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}</div>
                      <p className="text-[10px] font-medium text-slate-600 italic leading-snug">"{data.note}"</p>
                   </div>
                )) : (
                   <div className="text-center py-4 opacity-20"><i className="fa-solid fa-note-sticky text-xl mb-1"></i><div className="text-[8px] font-black uppercase">Порожньо</div></div>
                )}
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

// --- Main Habits View Component ---
const HabitsView: React.FC = () => {
  const { tasks, addTask, updateTask, toggleHabitStatus } = useApp();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  
  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const habits = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
  [tasks]);

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      return {
        label: d.toLocaleString('uk-UA', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        timestamp: d.getTime()
      };
    });
  }, []);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addTask(newHabitTitle.trim(), 'tasks', undefined, 'habits');
    setNewHabitTitle('');
    setIsAdding(false);
  };

  const calculateStreak = (habit: Task) => {
    const history = habit.habitHistory || {};
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    let current = new Date(today);
    while (true) {
      const ds = current.toISOString().split('T')[0];
      if (history[ds]?.status === 'completed') {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        if (streak === 0 && ds === today.toISOString().split('T')[0]) {
           current.setDate(current.getDate() - 1);
           continue;
        }
        break;
      }
    }
    return streak;
  };

  const getHabitColor = (habit: Task) => habit.color || '#f97316';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCell(null);
      }
    };
    if (activeCell) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCell]);

  const openPopover = (habitId: string, dateStr: string) => {
    const habit = tasks.find(t => t.id === habitId);
    const existingNote = habit?.habitHistory?.[dateStr]?.note || '';
    setReportText(existingNote);
    setActiveCell({ habitId, dateStr });
  };

  const handleSetStatus = (status: 'completed' | 'skipped' | 'none') => {
    if (!activeCell) return;
    toggleHabitStatus(activeCell.habitId, activeCell.dateStr, status, reportText);
    setActiveCell(null);
  };

  const selectedHabit = useMemo(() => habits.find(h => h.id === selectedHabitId), [habits, selectedHabitId]);

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden relative">
      <header className="z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Typography variant="h2" className="text-slate-900 text-lg font-black">Звички</Typography>
          <div className="h-3 w-px bg-slate-200"></div>
          <Typography variant="tiny" className="text-slate-400 tracking-widest lowercase text-[8px]">дисципліна дня</Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon="fa-plus" onClick={() => setIsAdding(true)} className="rounded-lg px-3 py-1.5 text-[10px]">ДОДАТИ</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar z-10">
        <div className="min-w-full inline-block align-middle p-4">
          <table className="w-full border-separate border-spacing-x-0.5 table-fixed">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="sticky left-0 z-30 bg-white p-2 text-left w-56 border-b border-slate-100">
                  <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em]">Активність</span>
                </th>
                {days.map(d => {
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th key={d.dateStr} className={`p-1.5 w-10 text-center border-b border-slate-100 rounded-t-lg ${isToday ? 'bg-orange-50/30' : ''}`}>
                      <div className={`text-[7px] font-black uppercase leading-none mb-0.5 ${isToday ? 'text-orange-500' : 'text-slate-300'}`}>{isToday ? 'СЬОГ' : d.label}</div>
                      <div className={`text-[10px] font-black leading-none ${isToday ? 'text-orange-600' : 'text-slate-800'}`}>{d.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {habits.map(habit => {
                const streak = calculateStreak(habit);
                const color = getHabitColor(habit);
                return (
                  <tr key={habit.id} className="group hover:bg-slate-50/20 transition-colors">
                    <td className="sticky left-0 z-30 bg-white p-2 flex items-center gap-3 border-r border-slate-100 cursor-pointer" onClick={() => setSelectedHabitId(habit.id)}>
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke={color} strokeWidth="3" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(streak, 30) / 30)} strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
                        </svg>
                        <span className="absolute text-[7px] font-black flex flex-col items-center leading-none" style={{ color }}>
                          <span>{streak}</span>
                          <span className="text-[4px] uppercase">дн</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black text-slate-800 truncate group-hover:text-orange-600 transition-colors uppercase tracking-tight flex items-center gap-1.5">
                          {habit.title}
                          {streak >= 3 && <span className="text-orange-500 text-[8px]">🔥</span>}
                        </div>
                        <div className="h-0.5 w-12 bg-slate-100 rounded-full overflow-hidden mt-1">
                           <div className="h-full transition-all" style={{ width: `${Math.min(streak * 10, 100)}%`, backgroundColor: color }}></div>
                        </div>
                      </div>
                    </td>
                    {days.map(d => {
                      const dayData = habit.habitHistory?.[d.dateStr] || { status: 'none' };
                      const status = dayData.status;
                      const hasNote = !!dayData.note;
                      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                      const isActive = activeCell?.habitId === habit.id && activeCell?.dateStr === d.dateStr;
                      
                      return (
                        <td key={d.dateStr} className={`p-0 text-center relative border-b border-slate-50 ${isToday ? 'bg-orange-50/10' : ''}`}>
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full h-10 flex flex-col items-center justify-center transition-all group/btn ${isActive ? 'bg-white shadow-inner ring-1 ring-orange-50' : ''}`}>
                            <div className="relative">
                              {status === 'completed' ? (
                                <div className="w-5 h-5 rounded-md flex items-center justify-center shadow-md transform group-hover/btn:scale-105 transition-transform" style={{ backgroundColor: color }}>
                                  <i className="fa-solid fa-check text-white text-[8px]"></i>
                                </div>
                              ) : status === 'skipped' ? (
                                <div className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-100">
                                  <i className="fa-solid fa-xmark text-slate-300 text-[8px]"></i>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-dashed border-slate-100 flex items-center justify-center group-hover/btn:border-orange-200 transition-colors">
                                   <div className="w-0.5 h-0.5 rounded-full bg-slate-100 group-hover/btn:bg-orange-200"></div>
                                </div>
                              )}
                              {hasNote && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white shadow-sm"></div>}
                            </div>
                          </button>
                          {isActive && (
                            <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 p-4 z-[100] tiktok-blur text-left">
                              <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{d.label}, {d.date}</span><button onClick={() => setActiveCell(null)} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button></div>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => handleSetStatus('completed')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'completed' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600'}`}>
                                  <i className="fa-solid fa-check text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">ТАК</span>
                                </button>
                                <button onClick={() => handleSetStatus('skipped')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'skipped' ? 'bg-slate-200 text-slate-800' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}>
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">НІ</span>
                                </button>
                              </div>
                              <Typography variant="tiny" className="text-slate-400 mb-1.5 uppercase text-[7px]">Коментар</Typography>
                              <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Як пройшло?" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-medium outline-none h-16 resize-none focus:ring-1 focus:ring-orange-200 transition-all" />
                              <button onClick={() => { toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText); setActiveCell(null); }} className="w-full mt-3 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">ЗБЕРЕГТИ</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {habits.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-20">
               <i className="fa-solid fa-seedling text-6xl mb-4"></i>
               <Typography variant="h2" className="text-xl">Порожньо</Typography>
               <Typography variant="body" className="mt-1 text-xs">Додайте першу звичку.</Typography>
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-white w-full max-w-xs rounded-[2rem] border border-slate-100 p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="mb-6 text-xl">Новий крок</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Назва звички</label>
                 <input autoFocus value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Напр: Медитація" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" type="button" className="flex-1 rounded-xl text-[10px]" onClick={() => setIsAdding(false)}>ВІДМІНА</Button>
                <Button type="submit" variant="primary" className="flex-[2] rounded-xl shadow-lg text-[10px]">СТВОРИТИ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedHabit && (
        <HabitStatsSidebar 
          habit={selectedHabit} 
          onClose={() => setSelectedHabitId(null)}
          onUpdate={(updates) => updateTask({ ...selectedHabit, ...updates })}
          onToggleStatus={toggleHabitStatus}
        />
      )}
    </div>
  );
};

export default HabitsView;
