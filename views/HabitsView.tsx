
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
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  
  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // FIX: Added missing handleCreateHabit function
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      addTask(newHabitTitle.trim(), 'tasks', undefined, 'habits');
      setNewHabitTitle('');
      setIsAdding(false);
    }
  };

  const habits = useMemo(() => 
    tasks.filter(t => 
      !t.isDeleted && 
      (activeTab === 'archived' ? t.isArchived === true : !t.isArchived) &&
      (t.projectSection === 'habits' || t.tags.includes('habit'))
    ),
  [tasks, activeTab]);

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      return {
        label: d.toLocaleString('uk-UA', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        timestamp: d.getTime(),
        dayOfWeek: (d.getDay() + 6) % 7 // 0=Mon, 6=Sun
      };
    });
  }, []);

  const calculateSmartStreak = (habit: Task) => {
    const history = habit.habitHistory || {};
    const scheduledDays = habit.daysOfWeek || [0,1,2,3,4,5,6];
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    let current = new Date(today);
    // Якщо сьогодні не виконано, але це запланований день, страйк може бути від вчора
    // Перевіряємо задом наперед
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dow = (d.getDay() + 6) % 7;
      const status = history[ds]?.status || 'none';

      if (status === 'completed') {
        streak++;
      } else if (status === 'skipped') {
        // Пропускаємо (не збиває, але й не додає)
        continue;
      } else {
        // Якщо цей день був запланований
        if (scheduledDays.includes(dow)) {
          // Якщо це сьогодні і ще не вечір - не збиваємо
          if (i === 0) continue;
          break; // Страйк перервано
        } else {
          // Це вихідний - просто йдемо далі
          continue;
        }
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

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden relative">
      <header className="z-20 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Typography variant="h2" className="text-lg font-black">Звички</Typography>
          <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)] ml-2">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Активні
            </button>
            <button 
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'archived' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Архів
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon="fa-plus" onClick={() => setIsAdding(true)} className="rounded-lg px-3 py-1.5 text-[10px]">ДОДАТИ</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar z-10 no-scrollbar">
        <div className="min-w-full inline-block align-middle p-0">
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <thead>
              <tr className="bg-[var(--bg-main)]">
                <th className="sticky left-0 z-30 bg-[var(--bg-main)] p-2 text-left w-[40vw] min-w-[40vw] md:w-56 md:min-w-[14rem] border-b border-[var(--border-color)]">
                  <span className="text-[7px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] ml-2">Активність</span>
                </th>
                {days.map(d => {
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th key={d.dateStr} className={`p-1 w-12 text-center border-b border-[var(--border-color)] ${isToday ? 'bg-[var(--primary)]/5' : ''}`}>
                      <div className={`text-[6px] font-black uppercase leading-none mb-0.5 ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{isToday ? 'СЬОГ' : d.label}</div>
                      <div className={`text-[9px] font-black leading-none ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{d.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {habits.map(habit => {
                const streak = calculateSmartStreak(habit);
                const color = getHabitColor(habit);
                const scheduledDays = habit.daysOfWeek || [0,1,2,3,4,5,6];

                return (
                  <tr key={habit.id} className="group hover:bg-[var(--bg-main)]/10 transition-colors">
                    <td className="sticky left-0 z-30 bg-[var(--bg-main)] py-1.5 px-3 flex items-center gap-2 md:gap-3 border-r border-solid border-[var(--border-color)]/20 cursor-pointer w-[40vw] min-w-[40vw] md:w-56 md:min-w-[14rem]" onClick={() => setSelectedHabitId(habit.id)}>
                      <div className="relative w-6 h-6 md:w-7 md:h-7 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke="var(--border-color)" strokeWidth="2.5" />
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke={color} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(streak, 30) / 30)} strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
                        </svg>
                        <span className="absolute text-[6px] font-black flex flex-col items-center leading-none" style={{ color }}>
                          <span>{streak}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black text-[var(--text-main)] truncate group-hover:text-[var(--primary)] transition-colors uppercase tracking-tight flex items-center gap-1">
                          {habit.title}
                          {streak >= 3 && <span className="text-[var(--primary)] text-[7px]">🔥</span>}
                        </div>
                      </div>
                    </td>
                    {days.map(d => {
                      const dayData = habit.habitHistory?.[d.dateStr] || { status: 'none' };
                      const status = dayData.status;
                      const hasNote = !!dayData.note;
                      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                      const isActive = activeCell?.habitId === habit.id && activeCell?.dateStr === d.dateStr;
                      const isScheduled = scheduledDays.includes(d.dayOfWeek);
                      
                      return (
                        <td key={d.dateStr} className={`p-0 text-center relative border-b border-solid border-[var(--border-color)]/20 ${isToday ? 'bg-[var(--primary)]/5' : ''}`}>
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full h-10 flex flex-col items-center justify-center transition-all group/btn ${isActive ? 'bg-[var(--bg-card)] shadow-inner' : ''}`}>
                            <div className="relative">
                              {status === 'completed' ? (
                                <i className="fa-solid fa-check text-sm" style={{ color: color }}></i>
                              ) : status === 'skipped' ? (
                                <i className="fa-solid fa-xmark text-[var(--text-muted)] text-[8px] opacity-20"></i>
                              ) : (
                                <span className={`text-[8px] font-black ${isScheduled ? 'text-[var(--text-muted)]/20' : 'text-[var(--text-muted)]/5'}`}>?</span>
                              )}
                              {hasNote && <div className="absolute -top-1 -right-1 w-1 h-1 bg-[var(--primary)] rounded-full shadow-sm"></div>}
                            </div>
                          </button>
                          {isActive && (
                            <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-[var(--bg-card)] shadow-2xl rounded-2xl border border-[var(--border-color)] p-4 z-[100] tiktok-blur text-left">
                              <div className="flex justify-between items-center mb-3"><span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{d.label}, {d.date}</span><button onClick={() => setActiveCell(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><i className="fa-solid fa-xmark text-10px"></i></button></div>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => handleSetStatus('completed')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'completed' ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]'}`}>
                                  <i className="fa-solid fa-check text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">ТАК</span>
                                </button>
                                <button onClick={() => handleSetStatus('skipped')} className={`h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all ${status === 'skipped' ? 'bg-[var(--bg-main)] text-[var(--text-main)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-black/10 hover:text-[var(--text-main)]'}`}>
                                  <i className="fa-solid fa-xmark text-[10px]"></i>
                                  <span className="text-[9px] font-black uppercase">НІ</span>
                                </button>
                              </div>
                              <Typography variant="tiny" className="text-[var(--text-muted)] mb-1.5 uppercase text-[7px]">Коментар</Typography>
                              <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Як пройшло?" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-2.5 text-[10px] font-medium outline-none h-16 resize-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all text-[var(--text-main)]" />
                              <button onClick={() => { toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText); setActiveCell(null); }} className="w-full mt-3 py-2 bg-[var(--primary)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">ЗБЕРЕГТИ</button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-20 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale w-full">
                    <i className="fa-solid fa-box-open text-5xl mb-4"></i>
                    <Typography variant="h3" className="text-base uppercase tracking-[0.2em]">Тут порожньо</Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-[2rem] border border-[var(--border-color)] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="mb-6 text-xl">Новий крок</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Назва звички</label>
                 <input autoFocus value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Напр: Медитація" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-[var(--text-main)]" />
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
        <div className="fixed top-0 right-0 h-full w-[340px] max-w-full bg-[var(--bg-sidebar)] border-l border-[var(--border-color)] z-[110] shadow-[-10px_0_40px_rgba(0,0,0,0.05)]">
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
