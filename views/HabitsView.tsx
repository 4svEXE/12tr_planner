
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';

const HabitsView: React.FC = () => {
  const { 
    tasks, addTask, updateTask, toggleHabitStatus 
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  
  // State for the cell interaction popover
  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filtering only habit tasks
  const habitTasks = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit')))
  , [tasks]);

  // Generate last 14 days for the grid
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
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

    // Simplified as context now handles defaults correctly for 'habits'
    addTask(newHabitTitle.trim(), 'tasks', undefined, 'habits');

    setNewHabitTitle('');
    setIsAdding(false);
  };

  const calculateProgress = (habit: Task) => {
    const history = habit.habitHistory || {};
    const completedCount = Object.values(history).filter(v => v.status === 'completed').length;
    return Math.min(100, Math.round((completedCount / 14) * 100));
  };

  const getHabitColor = (habit: Task) => {
    if (habit.tags.includes('health')) return '#06b6d4';
    if (habit.tags.includes('study')) return '#6366f1';
    return '#f97316';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCell(null);
      }
    };
    if (activeCell) { document.addEventListener('mousedown', handleClickOutside); }
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

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden relative">
      <header className="z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Typography variant="h2" className="text-slate-900 text-xl font-black">Звички</Typography>
          <div className="h-4 w-px bg-slate-200"></div>
          <Typography variant="tiny" className="text-slate-400 tracking-widest lowercase">дисципліна дня</Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon="fa-plus" onClick={() => setIsAdding(true)} className="rounded-lg px-4 py-2 text-[11px]">ДОДАТИ</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto no-scrollbar z-10">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="sticky left-0 z-30 bg-white p-3 text-left w-44 border-r border-slate-100">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Активність</span>
                </th>
                {days.map(d => (
                  <th key={d.dateStr} className="p-2 w-12 text-center border-r border-slate-50 last:border-r-0">
                    <div className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">{d.label}</div>
                    <div className="text-xs font-black text-slate-800 leading-none">{d.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white/50">
              {habitTasks.map(habit => {
                const progress = calculateProgress(habit);
                const color = getHabitColor(habit);
                return (
                  <tr key={habit.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="sticky left-0 z-30 bg-white p-3 flex items-center gap-3 border-r border-slate-100 cursor-pointer" onClick={() => setSelectedTaskId(habit.id)}>
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="13" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                          <circle cx="16" cy="16" r="13" fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={2 * Math.PI * 13} strokeDashoffset={2 * Math.PI * 13 * (1 - progress / 100)} strokeLinecap="round" className="transition-all duration-700 ease-out" />
                        </svg>
                        <span className="absolute text-[7px] font-black" style={{ color }}>{progress}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{habit.title}</div>
                        <div className="text-[7px] font-black text-slate-300 uppercase tracking-tighter mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Натисніть для деталей</div>
                      </div>
                    </td>
                    {days.map(d => {
                      const history = habit.habitHistory || {};
                      const dayData = history[d.dateStr] || { status: 'none' };
                      const status = dayData.status;
                      const hasNote = !!dayData.note && dayData.note.trim().length > 0;
                      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                      const isActive = activeCell?.habitId === habit.id && activeCell?.dateStr === d.dateStr;
                      return (
                        <td key={d.dateStr} className="p-0 text-center border-r border-slate-50 relative">
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full h-12 flex flex-col items-center justify-center transition-all ${isToday ? 'bg-orange-50/10' : ''} ${isActive ? 'bg-orange-50 ring-2 ring-inset ring-orange-100' : ''}`}>
                            <div className="relative">
                              {status === 'completed' ? <i className="fa-solid fa-check text-sm" style={{ color }}></i> : status === 'skipped' ? <i className="fa-solid fa-xmark text-sm text-rose-400"></i> : <span className="text-[10px] font-black text-slate-200">?</span>}
                              {hasNote && <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-400 rounded-full border border-white"></div>}
                            </div>
                          </button>
                          {isActive && (
                            <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 p-4 z-50 animate-in zoom-in-95 duration-200 tiktok-blur text-left">
                              <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black uppercase text-slate-400">{d.label}, {d.date}</span><button onClick={() => setActiveCell(null)} className="text-slate-300"><i className="fa-solid fa-xmark"></i></button></div>
                              <div className="flex gap-2 mb-4">
                                <button onClick={() => handleSetStatus('completed')} className={`flex-1 h-10 rounded-xl flex items-center justify-center ${status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}><i className="fa-solid fa-check"></i></button>
                                <button onClick={() => handleSetStatus('skipped')} className={`flex-1 h-10 rounded-xl flex items-center justify-center ${status === 'skipped' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}><i className="fa-solid fa-xmark"></i></button>
                              </div>
                              <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Нотатка..." className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs outline-none h-20 resize-none" />
                              <button onClick={() => { toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText); setActiveCell(null); }} className="w-full mt-2 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Зберегти</button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-100 p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h3" className="mb-6">Нова звичка</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <input autoFocus value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Що будемо робити?" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-200 outline-none" />
              <div className="flex gap-2">
                <Button variant="ghost" type="button" className="flex-1" onClick={() => setIsAdding(false)}>Скасувати</Button>
                <Button type="submit" variant="primary" className="flex-1">АКТИВУВАТИ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskId && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={() => setSelectedTaskId(null)}></div>
          <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}
    </div>
  );
};

export default HabitsView;
