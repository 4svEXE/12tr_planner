import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import HabitStatsSidebar from '../components/HabitStatsSidebar';
import Card from '../components/ui/Card';

const HABITS_TAB_KEY = '12tr_habits_active_tab';

const HabitsView: React.FC = () => {
  const { tasks, addTask, updateTask, toggleHabitStatus, reorderTasks } = useApp();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // Restore tab preference
  const [activeTab, setActiveTabState] = useState<'active' | 'archived'>(() =>
    (localStorage.getItem(HABITS_TAB_KEY) as any) || 'active'
  );

  const setActiveTab = (tab: 'active' | 'archived') => {
    setActiveTabState(tab);
    localStorage.setItem(HABITS_TAB_KEY, tab);
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [touchTargetId, setTouchTargetId] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

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
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks, activeTab]);

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return {
        label: d.toLocaleString('uk-UA', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        dateStr: d.toLocaleDateString('en-CA'),
        timestamp: d.getTime(),
        dayOfWeek: (d.getDay() + 6) % 7
      };
    });
  }, []);

  const calculateSmartStreak = (habit: Task) => {
    const history = habit.habitHistory || {};
    const scheduledDays = habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toLocaleDateString('en-CA');
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
  };

  const getHabitColor = (habit: Task) => habit.color || 'var(--primary)';

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

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('habitId', id);
    e.dataTransfer.effectAllowed = 'move';
    const row = e.currentTarget as HTMLElement;
    // Створюємо кастомний image для драгу (опціонально), або просто робимо оверлей
    setTimeout(() => {
      row.style.opacity = '0.2';
      row.style.background = 'var(--primary)';
    }, 0);
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setTouchTargetId(null);
    const row = e.currentTarget as HTMLElement;
    row.style.opacity = '1';
    row.style.background = '';
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== touchTargetId) setTouchTargetId(id);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('habitId');
    if (sourceId && sourceId !== targetId) {
      reorderTasks(sourceId, targetId);
    }
    setTouchTargetId(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedId) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = target?.closest('tr');
    if (row && row.getAttribute('data-id')) {
      const overId = row.getAttribute('data-id');
      if (overId !== touchTargetId) {
        setTouchTargetId(overId);
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedId && touchTargetId && draggedId !== touchTargetId) {
      reorderTasks(draggedId, touchTargetId);
      if (navigator.vibrate) navigator.vibrate([10, 30]);
    }
    setDraggedId(null);
    setTouchTargetId(null);
  };

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  const activeHabitForModal = useMemo(() => {
    if (!activeCell) return null;
    return tasks.find(h => h.id === activeCell.habitId);
  }, [tasks, activeCell]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden relative">
      <header className="z-20 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Typography variant="h2" className="text-lg font-bold">Звички</Typography>
          <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)] ml-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Активні
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'archived' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Архів
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] opacity-70 hover:opacity-100 transition-all group"
          >
            <i className="fa-solid fa-plus-circle text-xs transition-transform group-hover:rotate-90"></i>
            <span>Додати</span>
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${isEditMode ? 'text-emerald-500' : 'text-[var(--text-muted)] opacity-70 hover:opacity-100'}`}
          >
            <i className={`fa-solid ${isEditMode ? 'fa-check' : 'fa-arrow-up-down-paragraph-horizontal'} text-xs`}></i>
            <span>{isEditMode ? 'ГОТОВО' : 'ПОРЯДОК'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar z-10 no-scrollbar">
        <div className="min-w-full inline-block align-middle p-0">
          <table className="border-separate border-spacing-0 table-fixed">
            <thead>
              <tr className="bg-[var(--bg-main)]">
                <th className="sticky left-0 z-30 bg-[var(--bg-card)] p-0 text-left w-[50vw] min-w-[50vw] md:w-64 md:min-w-[16rem] border-b border-[var(--border-color)]">
                  <div className="h-full w-full flex items-center px-3 py-2">
                    <span className="text-[7px] font-bold uppercase text-[var(--text-muted)] tracking-[0.2em] ml-8">Звичка</span>
                  </div>
                </th>
                {days.map(d => {
                  const isToday = d.dateStr === new Date().toLocaleDateString('en-CA');
                  return (
                    <th key={d.dateStr} className={`p-1 w-16 min-w-[4rem] text-center border-b border-[var(--border-color)] ${isToday ? 'bg-[var(--primary)]/5' : ''}`}>
                      <div className={`text-[6px] font-bold uppercase leading-none mb-0.5 ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{isToday ? 'СЬОГ' : d.label}</div>
                      <div className={`text-[9px] font-bold leading-none ${isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{d.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {habits.map(habit => {
                const streak = calculateSmartStreak(habit);
                const color = getHabitColor(habit);
                const scheduledDays = habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
                const isItemDragged = draggedId === habit.id;
                const isTarget = touchTargetId === habit.id;

                return (
                  <tr
                    key={habit.id}
                    data-id={habit.id}
                    draggable={isEditMode}
                    onDragStart={(e) => isEditMode && onDragStart(e, habit.id)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => isEditMode && onDragOver(e, habit.id)}
                    onDrop={(e) => isEditMode && onDrop(e, habit.id)}
                    onTouchMove={isEditMode ? handleTouchMove : undefined}
                    onTouchEnd={isEditMode ? handleTouchEnd : undefined}
                    className={`group transition-all duration-200 ${isItemDragged ? 'z-50 bg-[var(--bg-card)] shadow-2xl scale-[1.01] opacity-40' :
                      isTarget ? 'border-t-[3px] border-t-indigo-500 bg-indigo-50/30' : 'hover:bg-[var(--bg-main)]/30'
                      }`}
                  >
                    <td className="sticky left-0 z-30 bg-[var(--bg-card)] h-9 p-0 shadow-[1px_0_0_var(--border-color),0_1px_0_0_var(--border-color)] w-[50vw] min-w-[50vw] md:w-64 md:min-w-[16rem]" onClick={() => setSelectedHabitId(habit.id)}>
                      <div className="flex items-center gap-2 md:gap-3 px-3 h-full w-full">
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`w-4 flex justify-center transition-all ${isEditMode ? 'cursor-grab active:cursor-grabbing text-[var(--primary)] scale-110' : 'text-slate-300 opacity-0 w-0 overflow-hidden'}`}>
                            <i className="fa-solid fa-grip-vertical text-[10px]"></i>
                          </div>
                          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="14" fill="transparent" stroke="var(--border-color)" strokeWidth="2" />
                              <circle cx="16" cy="16" r="14" fill="transparent" stroke={color} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(streak, 30) / 30)} strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
                            </svg>
                            <span className="absolute text-[7px] font-bold flex flex-col items-center leading-none" style={{ color }}>
                              <span>{streak}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] md:text-[13px] font-bold text-[var(--text-main)] truncate group-hover:text-[var(--primary)] transition-colors tracking-tight flex items-center gap-1">
                            {habit.title}
                            {streak >= 3 && <span className="text-[var(--primary)] text-[7px] animate-pulse">🔥</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    {days.map(d => {
                      const dayData = habit.habitHistory?.[d.dateStr] || { status: 'none' };
                      const status = dayData.status;
                      const hasNote = !!dayData.note;
                      const isToday = d.dateStr === new Date().toLocaleDateString('en-CA');
                      const isScheduled = scheduledDays.includes(d.dayOfWeek);

                      return (
                        <td key={d.dateStr} className={`p-0 text-center relative border-b border-solid border-[var(--border-color)] ${isToday ? 'bg-[var(--primary)]/5' : ''}`}>
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full h-9 flex flex-col items-center justify-center transition-all group/btn`}>
                            <div className="relative transform transition-transform group-hover/btn:scale-110">
                              {status === 'completed' ? (
                                <i className="fa-solid fa-check text-lg" style={{ color }}></i>
                              ) : status === 'skipped' ? (
                                <i className="fa-solid fa-xmark text-rose-400 text-lg"></i>
                              ) : (
                                <span className={`text-[11px] font-bold transition-opacity ${isScheduled ? 'opacity-20 text-[var(--text-muted)]' : 'opacity-5 text-[var(--text-muted)]'}`}>●</span>
                              )}
                              {hasNote && <div className="absolute -top-1.5 -right-1.5 w-1.5 h-1.5 bg-[var(--primary)] rounded-full border-2 border-white shadow-sm"></div>}
                            </div>
                          </button>
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

      {activeCell && activeHabitForModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveCell(null)}></div>
          <Card className="w-full max-w-sm relative z-10 shadow-2xl p-6 md:p-8 rounded-[2.5rem] bg-[var(--bg-card)] border-theme animate-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <Typography variant="tiny" className="text-[var(--text-muted)] uppercase tracking-widest font-bold text-[8px]">
                  {days.find(d => d.dateStr === activeCell.dateStr)?.label}, {days.find(d => d.dateStr === activeCell.dateStr)?.date}
                </Typography>
                <Typography variant="h2" className="text-lg">Відмітити звичку</Typography>
              </div>
              <button onClick={() => setActiveCell(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSetStatus('completed')}
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-3xl border-2 transition-all group ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl scale-105'
                    : 'bg-[var(--bg-main)] border-transparent hover:border-emerald-500/30 text-[var(--text-muted)]'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'completed' ? 'bg-white/20' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                    <i className="fa-solid fa-check text-emerald-500"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">ВИКОНАНО</span>
                </button>

                <button
                  onClick={() => handleSetStatus('skipped')}
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-3xl border-2 transition-all group ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'skipped'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xl scale-105'
                    : 'bg-[var(--bg-main)] border-transparent hover:border-slate-500/30 text-[var(--text-muted)]'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'skipped' ? 'bg-white/20' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                    <i className="fa-solid fa-xmark text-slate-500"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">ПРОПУЩЕНО</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest ml-1">Коментар / Інсайт</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Як це було сьогодні?.."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 text-xs font-medium outline-none h-24 resize-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all text-[var(--text-main)] shadow-inner"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setActiveCell(null)} className="flex-1 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[9px] text-[var(--text-muted)] hover:bg-black/5 transition-all">ЗАКРИТИ</button>
                <button
                  onClick={() => { toggleHabitStatus(activeCell.habitId, activeCell.dateStr, undefined, reportText); setActiveCell(null); }}
                  className="flex-[2] py-3.5 bg-[var(--primary)] text-white rounded-2xl font-bold uppercase tracking-widest text-[9px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  ЗБЕРЕГТИ ЗВІТ
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[750] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-[2rem] border border-[var(--border-color)] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="mb-6 text-xl">Новий крок</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Назва звички</label>
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
        <div className="fixed top-0 right-0 h-full w-full md:w-[340px] bg-[var(--bg-sidebar)] border-l border-[var(--border-color)] z-[800] shadow-[-10px_0_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-right duration-300">
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
