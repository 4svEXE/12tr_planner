
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';

const HabitsView: React.FC = () => {
  const { 
    tasks, updateTask, toggleHabitStatus 
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  
  // State for the cell interaction popover
  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filtering only habit tasks - reactive based on tasks in context
  const habitTasks = useMemo(() => 
    tasks.filter(t => t.projectSection === 'habits' || t.tags.includes('habit'))
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

    const newHabit: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newHabitTitle,
      status: TaskStatus.INBOX,
      priority: Priority.UI,
      difficulty: 1,
      xp: 25,
      tags: ['habit'],
      projectSection: 'habits',
      createdAt: Date.now(),
      category: 'task',
      recurrence: 'daily',
      habitHistory: {}
    };

    updateTask(newHabit);
    setNewHabitTitle('');
    setIsAdding(false);
  };

  const calculateProgress = (habit: Task) => {
    const history = habit.habitHistory || {};
    const completedCount = Object.values(history).filter(v => v.status === 'completed').length;
    return Math.min(100, Math.round((completedCount / 14) * 100));
  };

  const getHabitColor = (habit: Task) => {
    if (habit.tags.includes('health')) return '#06b6d4'; // Cyan
    if (habit.tags.includes('study')) return '#6366f1'; // Indigo
    return '#f97316'; // Orange
  };

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCell(null);
      }
    };
    if (activeCell) {
      document.addEventListener('mousedown', handleClickOutside);
    }
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

  const saveReportOnly = () => {
    if (!activeCell) return;
    toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText);
    setActiveCell(null);
  };

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden relative">
      {/* Header Panel - Compact */}
      <header className="z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Typography variant="h2" className="text-slate-900 text-xl font-black">Звички</Typography>
          <div className="h-4 w-px bg-slate-200"></div>
          <Typography variant="tiny" className="text-slate-400 tracking-widest lowercase">дисципліна дня</Typography>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            icon="fa-plus" 
            onClick={() => setIsAdding(true)}
            className="rounded-lg px-4 py-2 text-[11px]"
          >
            ДОДАТИ
          </Button>
        </div>
      </header>

      {/* Main Grid Area - Compact Grid */}
      <div className="flex-1 overflow-x-auto no-scrollbar z-10">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="sticky left-0 z-30 bg-white p-3 text-left w-44 border-r border-slate-100 shadow-[2px_0_10px_-5px_rgba(0,0,0,0.05)]">
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
                    <td className="sticky left-0 z-30 bg-white p-3 flex items-center gap-3 border-r border-slate-100 shadow-[2px_0_10_rgba(0,0,0,0.05)]">
                      {/* Fixed Circular Progress */}
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="13" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                          <circle 
                            cx="16" cy="16" r="13" fill="transparent" stroke={color} strokeWidth="4" 
                            strokeDasharray={2 * Math.PI * 13}
                            strokeDashoffset={2 * Math.PI * 13 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <span className="absolute text-[7px] font-black" style={{ color }}>{progress}%</span>
                      </div>
                      
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTaskId(habit.id)}>
                        <div className="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover:text-orange-600 transition-colors">
                          {habit.title}
                        </div>
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
                        <td key={d.dateStr} className="p-0 text-center border-r border-slate-50 last:border-r-0 relative">
                          <button
                            onClick={() => openPopover(habit.id, d.dateStr)}
                            className={`w-full h-12 flex flex-col items-center justify-center transition-all group/btn ${
                              isToday ? 'bg-orange-50/10' : ''
                            } ${isActive ? 'bg-orange-50 ring-2 ring-inset ring-orange-100' : ''}`}
                          >
                            <div className="relative">
                              {status === 'completed' ? (
                                <i className="fa-solid fa-check text-sm animate-in zoom-in-50 duration-200" style={{ color }}></i>
                              ) : status === 'skipped' ? (
                                <i className="fa-solid fa-xmark text-sm text-rose-400"></i>
                              ) : (
                                <span className={`text-[10px] font-black transition-opacity ${isToday ? 'text-orange-400' : 'text-slate-200 opacity-40 group-hover/btn:opacity-100'}`}>
                                  ?
                                </span>
                              )}
                              
                              {/* Note Indicator */}
                              {hasNote && (
                                <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-400 rounded-full border border-white"></div>
                              )}
                            </div>
                          </button>

                          {/* Cell Popover Menu */}
                          {isActive && (
                            <div 
                              ref={popoverRef}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-slate-100 p-4 z-50 animate-in zoom-in-95 duration-200 tiktok-blur text-left"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{d.label}, {d.date}</span>
                                <button onClick={() => setActiveCell(null)} className="text-slate-300 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
                              </div>

                              <div className="flex gap-2 mb-4">
                                <button 
                                  onClick={() => handleSetStatus('completed')}
                                  className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                  title="Виконано"
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                                <button 
                                  onClick={() => handleSetStatus('skipped')}
                                  className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'skipped' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                                  title="Пропущено"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                                <button 
                                  onClick={() => handleSetStatus('none')}
                                  className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'none' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-600'}`}
                                  title="Очистити"
                                >
                                  <i className="fa-solid fa-trash-can text-xs"></i>
                                </button>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block ml-1">Як оптимізувати?</label>
                                <textarea
                                  value={reportText}
                                  onChange={(e) => setReportText(e.target.value)}
                                  placeholder="Твої ідеї для покращення..."
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none h-20"
                                />
                                <button 
                                  onClick={saveReportOnly}
                                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                >
                                  Зберегти
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {habitTasks.length === 0 && (
                <tr>
                  <td colSpan={days.length + 1} className="py-20 text-center text-slate-300">
                    <i className="fa-solid fa-seedling text-3xl mb-3 block opacity-20"></i>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Звички не знайдено</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Add Habit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-100 p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h3" className="mb-6">Нова звичка</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div>
                <input 
                  autoFocus
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  placeholder="Що будемо робити?"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" type="button" className="flex-1 text-[11px]" onClick={() => setIsAdding(false)}>Скасувати</Button>
                <Button type="submit" variant="primary" className="flex-1 text-[11px]">АКТИВУВАТИ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Side Panel */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={() => setSelectedTaskId(null)}></div>
          <TaskDetails 
            task={tasks.find(t => t.id === selectedTaskId)!} 
            onClose={() => setSelectedTaskId(null)} 
          />
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Compact Sticky shadow */
        th.sticky::after, td.sticky::after {
          content: '';
          position: absolute;
          top: 0;
          right: -8px;
          height: 100%;
          width: 8px;
          background: linear-gradient(to right, rgba(0,0,0,0.02), transparent);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default HabitsView;
