
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, Task, Priority } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';

const HOUR_HEIGHT = 44;

const TodayView: React.FC = () => {
  const {
    tasks, projects, timeBlocks, toggleTaskStatus, toggleHabitStatus,
    character, cycle, people, setActiveTab
  } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRoutineMobile, setShowRoutineMobile] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [isDisciplineExpanded, setIsDisciplineExpanded] = useState(() => {
    const saved = localStorage.getItem('12tr_today_discipline_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('12tr_today_discipline_expanded', JSON.stringify(isDisciplineExpanded));
  }, [isDisciplineExpanded]);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Квести на сьогодні
  const activeQuests = useMemo(() => {
    return tasks.filter(t =>
      !t.isDeleted &&
      t.status !== TaskStatus.DONE &&
      (t.scheduledDate === todayTimestamp || t.status === TaskStatus.NEXT_ACTION) &&
      t.projectSection !== 'habits' &&
      t.category !== 'note'
    ).sort((a, b) => {
      const pWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
      return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp]);

  // Звички на сьогодні
  const dailyHabits = useMemo(() =>
    tasks.filter(t => !t.isDeleted && !t.isArchived && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );

  // Радар подій (на 30 днів вперед)
  const upcomingEvents = useMemo(() => {
    const horizon = todayTimestamp + (30 * 24 * 60 * 60 * 1000);
    const events: any[] = [];

    tasks.forEach(t => {
      if (!t.isDeleted && t.isEvent && t.scheduledDate && t.scheduledDate > todayTimestamp && t.scheduledDate <= horizon) {
        events.push({ id: t.id, title: t.title, date: t.scheduledDate, type: 'task' });
      }
    });

    people.forEach(p => {
      if (p.birthDate) {
        const bd = new Date(p.birthDate);
        const thisYearBd = new Date(new Date().getFullYear(), bd.getMonth(), bd.getDate()).getTime();
        if (thisYearBd >= todayTimestamp && thisYearBd <= horizon) {
          events.push({ id: `bd-${p.id}`, title: `ДН: ${p.name}`, date: thisYearBd, type: 'birthday' });
        }
      }
      p.importantDates?.forEach(idate => {
        const d = new Date(idate.date);
        const thisYearD = new Date(new Date().getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (thisYearD >= todayTimestamp && thisYearD <= horizon) {
          events.push({ id: idate.id, title: `${idate.label}: ${p.name}`, date: thisYearD, type: 'ally' });
        }
      });
    });

    return events.sort((a, b) => a.date - b.date);
  }, [tasks, people, todayTimestamp]);

  // Поточний блок розпорядку
  const currentBlock = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    const hour = currentTime.getHours();
    return timeBlocks.find(b => b.dayOfWeek === dayOfWeek && hour >= b.startHour && hour < b.endHour);
  }, [timeBlocks, currentTime]);

  // Розпорядок на сьогодні (для правого сайдбару)
  const todaySchedule = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    return timeBlocks
      .filter(b => b.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startHour - b.startHour);
  }, [timeBlocks, currentTime]);

  // Поточна позиція часу (для лінії на розкладі)
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const habitProgress = useMemo(() => {
    if (dailyHabits.length === 0) return 0;
    const completed = dailyHabits.filter(h => h.habitHistory?.[dateStr]?.status === 'completed').length;
    return Math.round((completed / dailyHabits.length) * 100);
  }, [dailyHabits, dateStr]);

  const stats = [
    { label: 'Золото', value: character.gold, icon: 'fa-coins', color: 'text-amber-500' },
    { label: 'XP', value: character.xp, icon: 'fa-bolt', color: 'text-orange-500' },
    { label: 'KPI', value: `${cycle.globalExecutionScore}%`, icon: 'fa-chart-line', color: 'text-emerald-500' },
  ];

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-6 md:p-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] shrink-0 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Typography variant="h1" className="text-2xl md:text-4xl mb-1">Мій День</Typography>
              <div className="flex items-center gap-3">
                <Badge variant="orange" className="text-[8px]">{currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</Badge>
                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                <Typography variant="tiny" className="text-slate-400">Тиждень {cycle.currentWeek} Циклу</Typography>
              </div>
            </div>

            {/* СЕКЦІЯ ЗАРАЗ (Moved to Header) */}
            {currentBlock && (
              <div className="hidden lg:flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl py-2 px-5 text-[var(--text-main)] shadow-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-sm shadow-sm text-white">
                  <i className="fa-solid fa-hourglass-start animate-pulse"></i>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-orange-400 tracking-widest leading-none mb-1">ЗАРАЗ:</div>
                  <div className="text-[11px] font-black uppercase truncate max-w-[120px] text-[var(--text-main)]">{currentBlock.title}</div>
                </div>
                <div className="w-px h-6 bg-[var(--border-color)] mx-1"></div>
                <div className="text-[9px] font-bold opacity-60 tabular-nums">{currentBlock.startHour}:00 - {currentBlock.endHour}:00</div>
              </div>
            )}

            <div className="flex gap-2 items-center">
              {/* Mobile: кнопка-перемикач рутини */}
              <button
                onClick={() => setShowRoutineMobile(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
              >
                <i className="fa-solid fa-calendar-clock text-orange-400"></i>
                <span className="hidden xs:inline">Розпорядок</span>
              </button>
              {stats.map(s => (
                <Card key={s.label} padding="none" className="px-3 py-2 flex items-center gap-2 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
                  <i className={`fa-solid ${s.icon} ${s.color} text-xs`}></i>
                  <div>
                    <div className="text-[7px] font-black uppercase text-[var(--text-muted)] leading-none">{s.label}</div>
                    <div className="text-xs font-black text-[var(--text-main)]">{s.value}</div>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        </header>


        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">

            {/* ЛІВА КОЛОНКА (ОСНОВНЕ) */}
            <div className="lg:col-span-8 space-y-8">

              {/* ПОТОЧНИЙ БЛОК ТА РОЗКЛАД (Hidden if it's in header, or simplified) */}
              <section className="relative lg:hidden">
                <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${currentBlock ? 'bg-slate-900 text-white border-slate-800 shadow-2xl' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentBlock ? 'bg-orange-600' : 'bg-slate-100 text-slate-300'}`}>
                      <i className={`fa-solid ${currentBlock ? 'fa-hourglass-start animate-pulse' : 'fa-bed'}`}></i>
                    </div>
                    <div className="flex-1">
                      <Typography variant="tiny" className={currentBlock ? 'text-orange-400' : 'text-slate-400'}>
                        {currentBlock ? 'Зараз за планом:' : 'Вільний час або відпочинок'}
                      </Typography>
                      <Typography variant="h2" className={`text-xl md:text-2xl ${currentBlock ? 'text-white' : 'text-slate-400'}`}>
                        {currentBlock?.title || 'Відпочинок / Підзарядка'}
                      </Typography>
                      {currentBlock && <div className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">{currentBlock.startHour}:00 — {currentBlock.endHour}:00</div>}
                    </div>
                    <button onClick={() => setActiveTab('calendar')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                      <i className="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                </div>
              </section>

              {/* ЗВИЧКИ НА СЬОГОДНІ */}
              <section className="space-y-4">
                <div
                  className="flex justify-between items-center px-2 cursor-pointer group"
                  onClick={() => setIsDisciplineExpanded(!isDisciplineExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid fa-chevron-right text-[7px] transition-transform duration-200 ${isDisciplineExpanded ? 'rotate-90' : ''} text-slate-400`}></i>
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Дисципліна ({habitProgress}%)</Typography>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveTab('habits'); }}
                    className="text-[8px] font-black text-orange-600 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Усі звички
                  </button>
                </div>

                {isDisciplineExpanded && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {dailyHabits.map(habit => {
                      const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                      return (
                        <button
                          key={habit.id}
                          onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                          className={`flex-none w-32 p-4 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-orange-200 shadow-sm'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm transition-all ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                            <i className={`fa-solid ${isDone ? 'fa-check' : 'fa-repeat'}`}></i>
                          </div>
                          <span className={`text-[10px] font-black uppercase text-center leading-tight truncate w-full ${isDone ? 'text-emerald-700' : 'text-slate-600'}`}>{habit.title}</span>
                        </button>
                      );
                    })}
                    {dailyHabits.length === 0 && (
                      <div className="w-full py-6 text-center border-2 border-dashed border-slate-100 rounded-[2rem] opacity-30">
                        <Typography variant="tiny">Звичок не додано</Typography>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* АКТИВНІ КВЕСТИ */}
              <section className="space-y-4">
                <div className="flex justify-between items-end px-2">
                  <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Пріоритетні Квести</Typography>
                  <Badge variant="orange" className="text-[7px]">АКТИВНО: {activeQuests.length}</Badge>
                </div>
                <div className="space-y-3">
                  {activeQuests.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <Card
                        key={task.id}
                        padding="none"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('taskId', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="flex items-center gap-4 p-5 group cursor-pointer hover:border-orange-300 shadow-sm bg-[var(--bg-card)] border-[var(--border-color)]"
                      >
                        <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 hover:border-orange-500 text-transparent'}`}>
                          <i className="fa-solid fa-check text-[10px]"></i>
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] md:text-sm font-black text-[var(--text-main)] block truncate group-hover:text-orange-600 transition-colors">{task.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {project && <span className="text-[7px] font-black text-orange-500 uppercase bg-orange-50 px-1.5 py-0.5 rounded"># {project.name}</span>}
                            <span className="text-[7px] font-bold text-slate-300 uppercase">{task.priority}</span>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-200 text-[10px] group-hover:translate-x-1 transition-transform"></i>
                      </Card>
                    );
                  })}
                  {activeQuests.length === 0 && (
                    <div className="py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center grayscale opacity-30">
                      <i className="fa-solid fa-circle-check text-5xl mb-4"></i>
                      <p className="text-[10px] font-black uppercase">Всі квести на сьогодні закрито!</p>
                    </div>
                  )}
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className="w-full py-3.5 flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:bg-[var(--primary)]/20 hover:shadow-md transition-all"
                  >
                    <i className="fa-solid fa-plus text-[var(--primary)] text-sm"></i>
                    <span>Додати квест</span>
                  </button>
                </div>
              </section>
            </div>

            {/* ПРАВА КОЛОНКА */}
            <div className="lg:col-span-4 space-y-8">

              {/* ПРОФІЛЬ ГЕРОЯ СТИСЛО */}
              <section className="space-y-4">
                <Typography variant="tiny" className="font-black uppercase tracking-widest px-2 text-[9px]">Статус Героя</Typography>
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-2xl relative overflow-hidden border-none rounded-[2rem]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px]"></div>
                  <div className="flex items-center gap-4 mb-6">
                    <img src={character.avatarUrl} className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-white/10" />
                    <div>
                      <div className="text-xs font-black uppercase truncate">{character.name}</div>
                      <div className="text-[8px] font-black text-orange-500 uppercase tracking-widest">LVL {character.level} {character.role}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[8px] font-black uppercase mb-1.5 text-slate-400"><span>Енергія</span><span>{character.energy}%</span></div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-orange-500 shadow-[0_0_8px_#f97316]" style={{ width: `${character.energy}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] font-black uppercase mb-1.5 text-slate-400"><span>Досвід</span><span>{character.xp % 1000}/1000</span></div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${(character.xp % 1000) / 10}%` }}></div></div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* РОЗПОРЯДОК ДНЯ (Desktop only right sidebar) */}
              <section className="hidden lg:block space-y-4">
                <div className="flex justify-between items-center px-2">
                  <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Розпорядок Дня</Typography>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="text-[8px] font-black text-orange-600 uppercase hover:underline transition-opacity"
                  >
                    Редагувати
                  </button>
                </div>
                <div className="relative">
                  {todaySchedule.length > 0 ? (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                      {todaySchedule.map(block => {
                        const isCurrent = currentBlock?.id === block.id;
                        return (
                          <div
                            key={block.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                              isCurrent
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--text-main)] shadow-xl scale-[1.02]'
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm'
                            }`}
                          >
                            <div
                              className="w-2 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: block.color || 'var(--primary)' }}
                            ></div>
                            <div className="flex-1 min-w-0">
                            <div className={`text-[12px] md:text-[14px] font-black uppercase truncate ${isCurrent ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>
                              {isCurrent && <span className="text-orange-400 mr-2">▶</span>}
                              {block.title}
                            </div>
                            <div className={`text-[9px] md:text-[10px] font-black tabular-nums opacity-60 ${isCurrent ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                              {block.startHour}:00 — {block.endHour}:00
                            </div>
                            </div>
                            {isCurrent && (
                              <div className="shrink-0">
                                <i className="fa-solid fa-hourglass-half text-orange-400 animate-pulse text-[10px]"></i>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100 opacity-30">
                      <i className="fa-solid fa-calendar-days text-4xl mb-3 text-slate-400"></i>
                      <p className="text-[8px] font-black uppercase tracking-widest">Розклад не налаштовано</p>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="mt-3 text-[8px] font-black text-orange-600 uppercase hover:underline pointer-events-auto"
                      >
                        Налаштувати →
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* РАДАР ПОДІЙ НА 30 ДНІВ (зменшений, тільки якщо є події) */}
              {upcomingEvents.length > 0 && (
                <section className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Радар (30 днів)</Typography>
                    <i className="fa-solid fa-radar text-orange-500 animate-pulse text-[10px]"></i>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {upcomingEvents.slice(0, 5).map((ev, i) => {
                      const dateObj = new Date(ev.date);
                      const diffDays = Math.ceil((ev.date - todayTimestamp) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={`${ev.id}-${i}`} className="p-3 bg-white border border-slate-50 rounded-2xl shadow-sm flex items-center gap-3 group hover:border-orange-200 transition-all">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${ev.type === 'birthday' ? 'bg-amber-50 text-amber-500' : ev.type === 'ally' ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}>
                            <i className={`fa-solid ${ev.type === 'birthday' ? 'fa-cake-candles' : ev.type === 'ally' ? 'fa-bell' : 'fa-calendar-star'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black text-slate-800 uppercase truncate mb-0.5">{ev.title}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">{dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} • Через {diffDays} дн.</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Панель деталей */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 z-[110] lg:relative lg:inset-auto lg:h-full lg:flex lg:shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-card)]"
          style={{ ...(window.innerWidth >= 1024 ? { width: detailsWidth } : {}) }}
        >
          {!isResizing && window.innerWidth >= 1024 && (
            <div onMouseDown={startResizing} className="w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] transition-colors"></div>
          )}
          <div className="flex-1 h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          </div>
        </div>
      )}

      {/* Mobile: Модальний розклад дня */}
      {showRoutineMobile && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-slate-950 text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <div className="text-[9px] font-black uppercase text-orange-400 tracking-widest mb-1">Розпорядок дня</div>
              <div className="text-lg font-black uppercase">{currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
            <button
              onClick={() => setShowRoutineMobile(false)}
              className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {todaySchedule.length > 0 ? todaySchedule.map(block => {
              const isCurrent = currentBlock?.id === block.id;
              return (
                <div
                  key={block.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div
                    className="w-2 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: block.color || 'var(--primary)' }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-black uppercase truncate">
                      {isCurrent && <span className="text-orange-400 mr-1">▶</span>}
                      {block.title}
                    </div>
                    <div className={`text-[9px] font-bold tabular-nums ${isCurrent ? 'text-orange-400' : 'text-white/40'}`}>
                      {block.startHour}:00 — {block.endHour}:00
                    </div>
                  </div>
                  {isCurrent && (
                    <i className="fa-solid fa-hourglass-half text-orange-400 animate-pulse"></i>
                  )}
                </div>
              );
            }) : (
              <div className="py-20 text-center opacity-30">
                <i className="fa-solid fa-calendar-days text-5xl mb-4 block"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Розклад на сьогодні порожній</p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-white/10">
            <button
              onClick={() => { setShowRoutineMobile(false); setActiveTab('calendar'); }}
              className="w-full py-3.5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
            >
              <i className="fa-solid fa-pencil mr-2"></i>
              Редагувати розпорядок
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayView;
