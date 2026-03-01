
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, Task, Priority } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';

const TodayView: React.FC = () => {
  const {
    tasks, projects, timeBlocks, toggleTaskStatus, toggleHabitStatus,
    character, cycle, people, setActiveTab
  } = useApp();
  // FIX: useResizer hook expects two arguments (minWidth, maxWidth).
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // Звичайні події з календаря
    tasks.forEach(t => {
      if (!t.isDeleted && t.isEvent && t.scheduledDate && t.scheduledDate > todayTimestamp && t.scheduledDate <= horizon) {
        events.push({ id: t.id, title: t.title, date: t.scheduledDate, type: 'task' });
      }
    });

    // Дні народження та дати людей
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
              <div className="hidden lg:flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl py-2 px-5 text-white shadow-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-sm shadow-sm">
                  <i className="fa-solid fa-hourglass-start animate-pulse"></i>
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase text-orange-400 tracking-widest leading-none mb-1">ЗАРАЗ:</div>
                  <div className="text-[11px] font-black uppercase truncate max-w-[120px]">{currentBlock.title}</div>
                </div>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <div className="text-[9px] font-bold opacity-60 tabular-nums">{currentBlock.startHour}:00 - {currentBlock.endHour}:00</div>
              </div>
            )}

            <div className="flex gap-3">
              {stats.map(s => (
                <Card key={s.label} padding="none" className="px-4 py-2 flex items-center gap-3 bg-white border-slate-100 shadow-sm">
                  <i className={`fa-solid ${s.icon} ${s.color} text-sm`}></i>
                  <div>
                    <div className="text-[7px] font-black uppercase text-slate-400 leading-none">{s.label}</div>
                    <div className="text-sm font-black text-slate-800">{s.value}</div>
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
                      <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-4 p-5 group cursor-pointer hover:border-orange-300 shadow-sm bg-white">
                        <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 hover:border-orange-500 text-transparent'}`}>
                          <i className="fa-solid fa-check text-[10px]"></i>
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] md:text-sm font-black text-slate-800 block truncate group-hover:text-orange-600 transition-colors">{task.title}</span>
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
                </div>
              </section>
            </div>

            {/* ПРАВА КОЛОНКА (РАДАР) */}
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

              {/* РАДАР ПОДІЙ НА 30 ДНІВ */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Радар (30 днів)</Typography>
                  <i className="fa-solid fa-radar text-orange-500 animate-pulse text-[10px]"></i>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => {
                    const dateObj = new Date(ev.date);
                    const diffDays = Math.ceil((ev.date - todayTimestamp) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={`${ev.id}-${i}`} className="p-4 bg-white border border-slate-50 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-orange-200 transition-all">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.type === 'birthday' ? 'bg-amber-50 text-amber-500' : ev.type === 'ally' ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'}`}>
                          <i className={`fa-solid ${ev.type === 'birthday' ? 'fa-cake-candles' : ev.type === 'ally' ? 'fa-bell' : 'fa-calendar-star'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-slate-800 uppercase truncate mb-0.5">{ev.title}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase">{dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} • Через {diffDays} дн.</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100 opacity-30">
                      <p className="text-[8px] font-black uppercase tracking-widest">Горизонт чистий</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Панель деталей */}
      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${window.innerWidth < 1024 ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isResizing && window.innerWidth >= 1024 && (
          <div onMouseDown={startResizing} className="w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] transition-colors"></div>
        )}
        <div style={{ width: window.innerWidth < 1024 ? '100vw' : detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col shadow-2xl">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-compass text-9xl mb-8"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Оберіть квест</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayView;
