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
  const [filter, setFilter] = useState<'all' | 'habits' | 'hypotheses'>('all');
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const [activeCell, setActiveCell] = useState<{ habitId: string, dateStr: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const [showComment, setShowComment] = useState(false);
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
    tasks.filter(t => {
      const isDeleted = t.isDeleted;
      const isArchivedMatch = activeTab === 'archived' ? t.isArchived === true : !t.isArchived;
      const isHabit = t.projectSection === 'habits' || t.tags.includes('habit');
      if (isDeleted || !isArchivedMatch || !isHabit) return false;

      if (filter === 'habits') return !t.isHypothesis;
      if (filter === 'hypotheses') return t.isHypothesis;
      return true;
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks, activeTab, filter]);

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

  const habitsWithStreaks = useMemo(() => {
    return habits.map(habit => {
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
      return { ...habit, computedStreak: streak };
    });
  }, [habits]);

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
      <header className="z-40 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-0 md:px-5 py-0 md:py-3 flex items-center justify-between shadow-sm h-14 md:h-auto">
        <div className="flex items-center gap-1 md:gap-3 h-full px-4 md:px-0">
          <Typography variant="h2" className="text-sm md:text-lg font-bold">Звички</Typography>
          <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)] ml-1 md:ml-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-2 md:px-3 py-1 rounded-md text-[7px] md:text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Активні
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-2 md:px-3 py-1 rounded-md text-[7px] md:text-[8px] font-bold uppercase tracking-widest transition-all ${activeTab === 'archived' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
            >
              Архів
            </button>
          </div>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-2">
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
            <i className={`fa-solid ${isEditMode ? 'fa-check' : 'fa-arrow-up-down-paragraph-horizontal'} text-lg md:text-xs`}></i>
            <span className="hidden md:inline">{isEditMode ? 'ГОТОВО' : 'ПОРЯДОК'}</span>
          </button>
        </div>

        {/* Mobile Header Actions */}
        <div className="md:hidden flex h-full">
          <button
            onClick={() => setIsAdding(true)}
            className="w-14 h-14 flex items-center justify-center text-[var(--primary)] active:bg-black/5"
            aria-label="Add Habit"
          >
            <i className="fa-solid fa-plus text-[14px]"></i>
          </button>
          {/* Кнопка переміщення — окремо і завжди видима */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`w-14 h-14 flex items-center justify-center active:bg-black/5 transition-colors relative ${isEditMode ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}
            aria-label="Reorder Habits"
            title={isEditMode ? 'Готово' : 'Змінити порядок'}
          >
            <i className={`fa-solid ${isEditMode ? 'fa-check' : 'fa-grip-lines'} text-[16px]`}></i>
            {isEditMode && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setShowFilterPopup(true)}
            className={`w-14 h-14 flex items-center justify-center active:bg-black/5 ${filter !== 'all' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
            aria-label="Filter"
          >
            <i className="fa-solid fa-sliders text-[13px]"></i>
          </button>
        </div>

        {/* Mobile Filter Popup */}
        {showFilterPopup && (
          <>
            <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px]" onClick={() => setShowFilterPopup(false)} />
            <div className="fixed top-16 right-4 z-[101] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 min-w-[200px] animate-in zoom-in-95 duration-200">
              <div className="p-2 border-b border-[var(--border-color)] mb-2 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Налаштування</span>
                <button
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                    setShowFilterPopup(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase ${isEditMode ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}
                >
                  {isEditMode ? 'Готово' : 'Порядок'}
                </button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setFilter('all'); setShowFilterPopup(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${filter === 'all' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--bg-main)] text-[var(--text-main)]'}`}
                >
                  <i className="fa-solid fa-list-ul mr-3 opacity-60"></i> Показати усі
                </button>
                <button
                  onClick={() => { setFilter('habits'); setShowFilterPopup(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${filter === 'habits' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--bg-main)] text-[var(--text-main)]'}`}
                >
                  <i className="fa-solid fa-repeat mr-3 opacity-60"></i> Лише звички
                </button>
                <button
                  onClick={() => { setFilter('hypotheses'); setShowFilterPopup(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${filter === 'hypotheses' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-[var(--bg-main)] text-[var(--text-main)]'}`}
                >
                  <i className="fa-solid fa-flask mr-3 opacity-60"></i> Лише гіпотези
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar z-10 no-scrollbar">
        <div className="min-w-full inline-block align-middle p-0">
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <thead>
              <tr className="bg-[var(--bg-main)]">
                <th className="sticky left-0 z-30 bg-[var(--bg-card)] p-0 text-left w-[50vw] min-w-[50vw] max-w-[50vw] md:w-64 md:min-w-[16rem] md:max-w-[16rem] border-b border-[var(--border-color)] transition-all">
                  <div className="h-full w-full flex items-center px-4 md:px-3 py-2">
                    <span className={`text-[7px] font-bold uppercase text-[var(--text-muted)] tracking-[0.2em] transition-all ${isEditMode ? 'ml-14' : 'ml-8'}`}>Звичка</span>
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
              {habitsWithStreaks.map(habit => {
                const streak = habit.computedStreak;
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
                    <td className="sticky left-0 z-30 bg-[var(--bg-card)] p-0 shadow-[1px_0_0_var(--border-color),0_1px_0_0_var(--border-color)] w-[50vw] min-w-[50vw] max-w-[50vw] md:w-64 md:min-w-[16rem] md:max-w-[16rem]" onClick={() => setSelectedHabitId(habit.id)}>
                      <div className="flex items-center gap-2 md:gap-3 px-3 py-2 min-h-[3rem] w-full">
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditMode && (
                            <div className="w-4 flex justify-center text-[var(--primary)] cursor-grab active:cursor-grabbing transition-all scale-110">
                              <i className="fa-solid fa-grip-vertical text-[10px]"></i>
                            </div>
                          )}
                          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 32 32">
                              <circle cx="16" cy="16" r="14" fill="transparent" stroke="var(--border-color)" strokeWidth="2" />
                              <circle cx="16" cy="16" r="14" fill="transparent" stroke={color} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(streak, 30) / 30)} strokeLinecap="round" className="transition-all duration-700 ease-in-out" />
                            </svg>
                            <span className="absolute text-[7px] font-bold flex flex-col items-center leading-none" style={{ color }}>
                              {habit.isHypothesis ? <i className="fa-solid fa-flask text-[8px]"></i> : <span>{streak}</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] md:text-[13px] font-light text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors tracking-tight flex items-center flex-wrap gap-1 leading-tight py-1">
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
                          <button onClick={() => openPopover(habit.id, d.dateStr)} className={`w-full min-h-[3rem] h-full flex flex-col items-center justify-center transition-all group/btn`}>
                            <div className="relative transform transition-transform group-hover/btn:scale-110">
                              {status === 'completed' ? (
                                <i className="fa-solid fa-check text-lg" style={{ color }}></i>
                              ) : status === 'skipped' ? (
                                <i className="fa-solid fa-minus text-[var(--text-muted)] opacity-50 text-lg"></i>
                              ) : habit.habitHistory?.[d.dateStr] ? (
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
        <div className="fixed inset-0 z-[700] flex items-end md:items-center justify-center md:p-4 pb-20 md:pb-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveCell(null)}></div>
          <Card className="w-full md:max-w-sm relative z-10 shadow-2xl p-4 rounded-t-[2rem] md:rounded-[2rem] bg-[var(--bg-card)] border-theme pb-safe">
            <header className="flex justify-between items-start mb-3">
              <div className="flex flex-col flex-1 min-w-0 pr-2">
                <Typography variant="tiny" className="text-[var(--text-muted)] uppercase tracking-widest font-bold text-[8px] mb-1">
                  {days.find(d => d.dateStr === activeCell.dateStr)?.label}, {days.find(d => d.dateStr === activeCell.dateStr)?.date}
                </Typography>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: activeHabitForModal.color || 'var(--primary)' }}></div>
                  <Typography variant="h2" className="text-sm md:text-lg truncate leading-tight">{activeHabitForModal.title}</Typography>
                </div>
              </div>
              <button onClick={() => setActiveCell(null)} className="w-8 h-8 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </header>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetStatus('completed')}
                  className={`flex flex-col flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all group ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 shadow-sm scale-[1.02]'
                    : 'border-transparent hover:border-emerald-500/30 text-[var(--text-muted)]'
                    }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-check text-emerald-500"></i>
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-inherit">ВИКОНАНО</span>
                </button>

                <button
                  onClick={() => handleSetStatus('none')}
                  className={`flex flex-col flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all group ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'none'
                    ? 'border-rose-500 bg-rose-500/5 text-rose-500 shadow-sm scale-[1.02]'
                    : 'border-transparent hover:border-rose-500/30 text-[var(--text-muted)]'
                    }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-xmark text-rose-500"></i>
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-inherit leading-none text-center">НЕВИКОНАНО</span>
                </button>

                <button
                  onClick={() => handleSetStatus('skipped')}
                  className={`flex flex-col flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all group ${activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status === 'skipped'
                    ? 'border-slate-500 bg-slate-500/5 text-slate-500 shadow-sm scale-[1.02]'
                    : 'border-transparent hover:border-slate-500/30 text-[var(--text-muted)]'
                    }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-minus text-slate-500 opacity-60"></i>
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-inherit opacity-80">ПРОПУСК</span>
                </button>
              </div>

              {/* Коментар — прихований за замовчуванням */}
              <div>
                {showComment ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest ml-1">Коментар</label>
                      <button onClick={() => { setShowComment(false); setReportText(''); }} className="text-[8px] text-[var(--text-muted)] hover:text-rose-400 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <textarea
                      autoFocus
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Як це було сьогодні?.."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-3 text-xs font-medium outline-none h-20 resize-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all text-[var(--text-main)] shadow-inner"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowComment(true)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors px-1"
                  >
                    <i className="fa-solid fa-plus text-[8px]"></i>
                    Коментар
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setActiveCell(null); setShowComment(false); setReportText(''); }} className="flex-1 py-3 rounded-2xl font-bold uppercase tracking-widest text-[9px] text-[var(--text-muted)] hover:bg-black/5 transition-all">ЗАКРИТИ</button>
                <button
                  onClick={() => {
                    const currentStatus = activeHabitForModal.habitHistory?.[activeCell.dateStr]?.status;
                    toggleHabitStatus(activeCell.habitId, activeCell.dateStr, currentStatus, reportText);
                    setActiveCell(null);
                  }}
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
        <div className="fixed inset-0 z-[750] flex items-end justify-center p-4 pb-4 md:items-center md:pb-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-[2rem] border border-[var(--border-color)] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="mb-6 text-xl">Новий крок</Typography>
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Назва звички</label>
                <input autoFocus value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Напр: Медитація" autoComplete="off" autoCorrect="off" spellCheck="false" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-[var(--text-main)]" />
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
