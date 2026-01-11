
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import HabitStatsSidebar from '../components/HabitStatsSidebar';

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

  const getHabitColor = (habit: Task) => habit.color || 'var(--primary)';

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
    <div className="h-screen flex flex-col bg-main text-[var(--text-main)] overflow-hidden relative">
      <header className="z-20 bg-sidebar/80 backdrop-blur-xl border-b border-theme px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Typography variant="h2" className="text-lg font-black">Звички</Typography>
          <div className="h-3 w-px bg-theme opacity-50"></div>
          <Typography variant="tiny" className="text-muted tracking-widest lowercase text-[8px]">дисципліна дня</Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon="fa-plus" onClick={() => setIsAdding(true)} className="rounded-lg px-3 py-1.5 text-[10px]">ДОДАТИ</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar z-10">
        <div className="min-w-full inline-block align-middle p-4">
          <table className="w-full border-separate border-spacing-x-0.5 table-fixed">
            <thead>
              <tr className="bg-main/30">
                <th className="sticky left-0 z-30 bg-sidebar p-2 text-left w-56 border-b border-theme">
                  <span className="text-[8px] font-black uppercase text-muted tracking-[0.2em]">Активність</span>
                </th>
                {days.map(d => {
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th key={d.dateStr} className={`p-1.5 w-10 text-center border-b border-theme rounded-t-lg ${isToday ? 'bg-primary/10' : ''}`}>
                      <div className={`text-[7px] font-black uppercase leading-none mb-0.5 ${isToday ? 'text-primary' : 'text-muted'}`}>{isToday ? 'СЬОГ' : d.label}</div>
                      <div className={`text-[10px] font-black leading-none ${isToday ? 'text-primary' : 'text-main'}`}>{d.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-theme/30">
              {habits.map(habit => {
                const streak = calculateStreak(habit);
                const color = getHabitColor(habit);
                return (
                  <tr key={habit.id} className="group hover:bg-main/20 transition-colors">
                    <td className="sticky left-0 z-30 bg-sidebar p-2 flex items-center gap-3 border-r border-theme cursor-pointer" onClick={() => setSelectedHabitId(habit.id)}>
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke="var(--border-color)" strokeWidth="3" />
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke={color} strokeWidth="3" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(streak, 30) / 30)} strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
                        </svg>
                        <span className="absolute text-[7px] font-black flex flex-col items-center leading-none" style={{ color }}>
                          <span>{streak}</span>
                          <span className="text-[4px] uppercase">дн</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black text-main truncate group-hover:text-primary transition-colors uppercase tracking-tight flex items-center gap-1.5">
                          {habit.title}
                          {streak >= 3 && <span className="text-primary text-[8px]">🔥</span>}
                        </div>
                        <div className="h-0.5 w-12 bg-theme/50 rounded-full overflow-hidden mt-1">
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
                        <td key={d.dateStr} className={`p-0 text-center relative border-b border-theme/50 ${isToday ? 'bg-primary/5' : ''}`}>
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full h-10 flex flex-col items-center justify-center transition-all group/btn ${isActive ? 'bg-sidebar shadow-inner ring-1 ring-primary/20' : ''}`}>
                            <div className="relative">
                              {status === 'completed' ? (
                                <div className="w-5 h-5 rounded-md flex items-center justify-center shadow-md transform group-hover/btn:scale-105 transition-transform" style={{ backgroundColor: color }}>
                                  <i className="fa-solid fa-check text-white text-[8px]"></i>
                                </div>
                              ) : status === 'skipped' ? (
                                <div className="w-5 h-5 rounded-md flex items-center justify-center bg-black/10">
                                  <i className="fa-solid fa-xmark text-muted text-[8px]"></i>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border border-dashed border-theme flex items-center justify-center group-hover/btn:border-primary/50 transition-colors">
                                   <div className="w-0.5 h-0.5 rounded-full bg-theme group-hover/btn:bg-primary/50"></div>
                                </div>
                              )}
                              {hasNote && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full border border-sidebar shadow-sm"></div>}
                            </div>
                          </button>
                          {isActive && (
                            <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-64 bg-card shadow-2xl rounded-2xl border border-theme p-4 z-[100] tiktok-blur text-left">
                              <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black uppercase text-muted tracking-widest">{d.label}, {d.date}</span><button onClick={() => setActiveCell(null)} className="text-muted hover:text-main transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button></div>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => handleSetStatus('completed')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'completed' ? 'bg-primary text-white shadow-lg' : 'bg-main text-muted hover:bg-primary/10 hover:text-primary'}`}>
                                  <i className="fa-solid fa-check text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">ТАК</span>
                                </button>
                                <button onClick={() => handleSetStatus('skipped')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'skipped' ? 'bg-main text-main' : 'bg-main text-muted hover:bg-black/10 hover:text-main'}`}>
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">НІ</span>
                                </button>
                              </div>
                              <Typography variant="tiny" className="text-muted mb-1.5 uppercase text-[7px]">Коментар</Typography>
                              <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Як пройшло?" className="w-full bg-main border border-theme rounded-xl p-2.5 text-[10px] font-medium outline-none h-16 resize-none focus:ring-1 focus:ring-primary/50 transition-all text-main" />
                              <button onClick={() => { toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText); setActiveCell(null); }} className="w-full mt-3 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">ЗБЕРЕГТИ</button>
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
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-card w-full max-w-xs rounded-[2rem] border border-theme p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="mb-6 text-xl">Новий крок</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-muted tracking-widest">Назва звички</label>
                 <input autoFocus value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Напр: Медитація" className="w-full bg-main border border-theme rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-main" />
              </div>
              <div className="flex gap-3">
                <Button variant="white" type="button" className="flex-1 rounded-xl text-[10px]" onClick={() => setIsAdding(false)}>ВІДМІНА</Button>
                <Button type="submit" variant="primary" className="flex-[2] rounded-xl shadow-lg text-[10px]">СТВОРИТИ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedHabit && (
        <div className="fixed top-0 right-0 h-full w-[340px] bg-sidebar border-l border-theme z-[110] shadow-[-10px_0_40px_rgba(0,0,0,0.05)]">
          <HabitStatsSidebar 
            habit={selectedHabit} 
            onClose={() => setSelectedHabitId(null)}
            onUpdate={(updates) => updateTask({ ...selectedHabit, ...updates })}
            onToggleStatus={toggleHabitStatus}
          />
        </div>
      )}
    </div>
  );
};

export default HabitsView;
