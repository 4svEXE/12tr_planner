import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, Project, TaskStatus, Priority } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';
import MiniCalendar from '../components/sidebar/MiniCalendar';

const Dashboard: React.FC = () => {
  const { 
    tasks, projects, timeBlocks, toggleTaskStatus, toggleHabitStatus, 
    character, cycle, setActiveTab, setCalendarViewMode, aiEnabled, people, diary, setIsReportWizardOpen 
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'tasks' | 'progress'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'projects' | 'calendar'>('all');
  const [progressPeriod, setProgressPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showInsight, setShowInsight] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  
  const { detailsWidth, startResizing, isResizing } = useResizer(350, 1000);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, []);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isEveningReviewTime = useMemo(() => currentTime.getHours() >= 21 || currentTime.getHours() < 5, [currentTime]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isDeleted && t.projectSection !== 'habits');
    const getPeriodLimit = () => {
      const now = new Date();
      if (progressPeriod === 'day') return new Date().setHours(0,0,0,0);
      if (progressPeriod === 'week') return now.setDate(now.getDate() - 7);
      return now.setMonth(now.getMonth() - 1);
    };
    const limit = getPeriodLimit();
    const periodTasks = activeTasks.filter(t => (t.completedAt || t.createdAt) >= limit);
    const doneTasks = periodTasks.filter(t => t.status === TaskStatus.DONE);
    const kpi = periodTasks.length > 0 ? Math.round((doneTasks.length / periodTasks.length) * 100) : 0;
    
    const spheres: Record<string, { done: number; total: number }> = { health: { done: 0, total: 0 }, career: { done: 0, total: 0 }, finance: { done: 0, total: 0 }, rest: { done: 0, total: 0 } };
    tasks.forEach(t => {
      if (t.isDeleted) return;
      const proj = projects.find(p => p.id === t.projectId);
      if (proj?.sphere && spheres[proj.sphere as keyof typeof spheres]) {
        spheres[proj.sphere as keyof typeof spheres].total++;
        if (t.status === TaskStatus.DONE) spheres[proj.sphere as keyof typeof spheres].done++;
      }
    });
    return { kpi, doneCount: doneTasks.length, totalCount: periodTasks.length, spheres };
  }, [tasks, projects, progressPeriod]);

  const habitTasks = useMemo(() => 
    tasks.filter(t => !t.isDeleted && !t.isArchived && (t.projectSection === 'habits' || t.tags.includes('habit'))),
  [tasks]);

  const habitCompletionRate = useMemo(() => {
    if (habitTasks.length === 0) return 0;
    const completedCount = habitTasks.filter(h => h.habitHistory?.[dateStr]?.status === 'completed').length;
    return Math.round((completedCount / habitTasks.length) * 100);
  }, [habitTasks, dateStr]);

  const filteredQuests = useMemo(() => {
    const active = tasks.filter(t => {
      if (t.isDeleted) return false;
      if (t.status === TaskStatus.DONE && !completingIds.has(t.id)) return false;
      if (t.projectSection === 'habits' || t.category === 'note') return false;
      const isScheduledForToday = t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === todayTimestamp;
      if (taskFilter === 'calendar') return isScheduledForToday;
      if (taskFilter === 'projects') return !!t.projectId;
      return isScheduledForToday || t.status === TaskStatus.NEXT_ACTION || (t.status === TaskStatus.INBOX && !t.scheduledDate && !t.projectId);
    });
    return active.sort((a, b) => {
        const pWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
        return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp, taskFilter, completingIds]);

  const urgentDeadlines = useMemo(() => {
    return tasks.filter(t => 
      !t.isDeleted && 
      t.status !== TaskStatus.DONE && 
      t.dueDate && 
      t.dueDate <= todayTimestamp + (7 * 24 * 60 * 60 * 1000)
    ).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0)).slice(0, 3);
  }, [tasks, todayTimestamp]);

  const upcomingRadarEvents = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.isEvent && t.scheduledDate && t.scheduledDate >= todayTimestamp).slice(0, 3);
  }, [tasks, todayTimestamp]);

  const handleToggleTaskWithDelay = (task: Task) => {
    if (task.status !== TaskStatus.DONE) {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.add(task.id);
        return next;
      });
      setTimeout(() => {
        toggleTaskStatus(task);
        setCompletingIds(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 700);
    } else {
      toggleTaskStatus(task);
    }
  };

  const randomInsight = useMemo(() => {
    const insights = tasks.filter(t => !t.isDeleted && t.tags.includes('insight'));
    if (insights.length === 0) return "Дисципліна — це свобода.";
    return insights[currentTime.getHours() % insights.length].title;
  }, [tasks, currentTime]);

  const handleAiAnalysis = async () => {
    if (!aiEnabled) return alert("Увімкніть ШІ в налаштуваннях");
    setIsAiAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    alert(`ШІ аналіз: Твій KPI складає ${stats.kpi}%. Найбільший фокус зараз на сфері ${Object.entries(stats.spheres).sort((a: any, b: any) => b[1].total - a[1].total)[0][0]}. Продовжуй в тому ж дусі!`);
    setIsAiAnalyzing(false);
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)] transition-none">
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${isMobile && selectedTaskId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="p-4 md:p-6 bg-[var(--bg-card)] border-b border-[var(--border-color)] shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-star"></i></div>
                <div>
                   <Typography variant="h1" className="text-xl font-black uppercase tracking-tight">Сьогодні</Typography>
                   <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">{currentTime.toLocaleDateString('uk-UA', { weekday: 'short' , day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
              <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)]">
                 <button onClick={() => setMainTab('tasks')} className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mainTab === 'tasks' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Завдання</button>
                 <button onClick={() => setMainTab('progress')} className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${mainTab === 'progress' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Прогрес</button>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] overflow-hidden">
               <i className="fa-solid fa-bolt-lightning text-amber-500 text-[10px]"></i>
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight truncate flex-1 italic">
                  {randomInsight}
               </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 transition-none">
          <div className="max-w-6xl mx-auto space-y-10 pb-32">
            {mainTab === 'tasks' ? (
              <>
                {isEveningReviewTime && (
                  <Card className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 overflow-hidden relative">
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-3xl bg-white/20 flex items-center justify-center text-3xl"><i className="fa-solid fa-moon"></i></div>
                      <div>
                        <Typography variant="h2" className="text-white text-xl">Час підсумків</Typography>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Отримайте XP за перемоги дня</p>
                      </div>
                    </div>
                    <button onClick={() => setIsReportWizardOpen(true)} className="relative z-10 px-8 h-12 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Заповнити звіт</button>
                  </Card>
                )}

                <Card padding="none" onClick={() => { setCalendarViewMode('day'); setActiveTab('calendar'); }} className="bg-[var(--bg-card)] border-l-4 border-l-[var(--primary)] border-[var(--border-color)] py-3 px-5 rounded-[1.5rem] shadow-sm flex items-center justify-between cursor-pointer hover:bg-[var(--bg-main)]/50 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">ЗАРАЗ:</span>
                    <span className="text-[12px] font-black text-[var(--text-main)] uppercase">
                      {timeBlocks?.find(b => b.dayOfWeek === currentTime.getDay() && currentTime.getHours() >= b.startHour && currentTime.getHours() < b.endHour)?.title || 'Вільний час'}
                    </span>
                  </div>
                  <i className="fa-solid fa-clock-rotate-left text-[10px] text-[var(--text-muted)]"></i>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                   <div className="lg:col-span-8 space-y-10">
                      <section className="space-y-4">
                         <div className="flex justify-between items-center px-2">
                            <Typography variant="tiny" className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">Квести</Typography>
                            <div className="flex bg-black/5 p-0.5 rounded-lg border border-[var(--border-color)]">
                               {(['all', 'projects', 'calendar'] as const).map(f => (
                                 <button key={f} onClick={() => setTaskFilter(f)} className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${taskFilter === f ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
                                   {f === 'all' ? 'Усі' : f === 'projects' ? 'Проєкти' : 'Час'}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="grid grid-cols-1 gap-2">
                            {filteredQuests.length > 0 ? filteredQuests.map(task => (
                              <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`flex items-center gap-4 px-6 py-3.5 transition-all cursor-pointer shadow-sm rounded-[1.8rem] border ${selectedTaskId === task.id ? 'bg-indigo-50/50 border-indigo-200' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30'}`}>
                                <button onClick={(e) => { e.stopPropagation(); handleToggleTaskWithDelay(task); }} className={`custom-checkbox border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE || completingIds.has(task.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5 text-transparent'}`}>
                                  <i className="fa-solid fa-check text-[9px]"></i>
                                </button>
                                <span className={`text-[14px] font-bold truncate flex-1 strike-anim ${task.status === TaskStatus.DONE || completingIds.has(task.id) ? 'is-striking text-[var(--text-muted)] opacity-60' : 'text-[var(--text-main)]'}`}>{task.title}</span>
                                {task.priority === Priority.UI && <i className="fa-solid fa-fire text-rose-500 text-xs"></i>}
                              </Card>
                            )) : (
                              <div className="py-16 bg-black/[0.02] border-2 border-dashed border-[var(--border-color)] rounded-[2.5rem] flex flex-col items-center justify-center opacity-30 grayscale select-none">
                                 <i className="fa-solid fa-mountain-sun text-5xl mb-4 text-[var(--text-muted)]"></i>
                                 <Typography variant="h3" className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Горизонт чистий</Typography>
                                 <p className="text-[9px] font-bold mt-2 uppercase tracking-tight">Додайте нові квести або відпочиньте</p>
                              </div>
                            )}
                         </div>
                      </section>

                      <section className="space-y-4">
                         <div className="flex justify-between items-center px-2">
                           <Typography variant="tiny" className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">Дисципліна ({habitCompletionRate}%)</Typography>
                           <button onClick={() => setActiveTab('habits')} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline">До налаштувань</button>
                         </div>
                         <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
                            {habitTasks.length > 0 ? habitTasks.map(habit => {
                               const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                               return (
                                 <button key={habit.id} onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                                  className={`shrink-0 w-32 p-4 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] shadow-sm hover:border-indigo-200'}`}>
                                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm ${isDone ? 'bg-emerald-500 text-white shadow-lg' : 'bg-black/5 border border-[var(--border-color)]'}`}>
                                      <i className={`fa-solid ${isDone ? 'fa-check' : 'fa-repeat'}`}></i>
                                   </div>
                                   <span className="text-[9px] font-black uppercase text-center leading-tight truncate w-full">{habit.title}</span>
                                 </button>
                               );
                            }) : (
                              <button 
                                onClick={() => setActiveTab('habits')}
                                className="w-full py-8 border-2 border-dashed border-[var(--border-color)] rounded-[2.5rem] bg-black/[0.02] flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-all group"
                              >
                                 <i className="fa-solid fa-plus text-xl mb-2 text-indigo-600 group-hover:scale-125 transition-transform"></i>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Створити перший ритуал</span>
                              </button>
                            )}
                         </div>
                      </section>
                   </div>

                   <div className="lg:col-span-4 space-y-10">
                      <section className="space-y-4">
                         <div className="flex justify-between items-center px-2">
                            <Typography variant="tiny" className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">Гарячі дедлайни</Typography>
                            <i className="fa-solid fa-bolt text-rose-500 text-[10px] animate-pulse"></i>
                         </div>
                         <div className="space-y-2">
                            {urgentDeadlines.length > 0 ? urgentDeadlines.map(ev => (
                              <Card key={ev.id} padding="none" onClick={() => setSelectedTaskId(ev.id)} className="p-4 bg-[var(--bg-card)] border-l-4 border-l-rose-500 border-[var(--border-color)] rounded-2xl flex items-center gap-3 shadow-sm cursor-pointer hover:bg-rose-50 transition-all">
                                 <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-black truncate uppercase text-[var(--text-main)]">{ev.title}</div>
                                    <div className="text-[8px] font-bold text-rose-600 uppercase mt-0.5">Термін: {new Date(ev.dueDate!).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</div>
                                 </div>
                              </Card>
                            )) : (
                              <div className="py-6 px-4 bg-black/[0.02] border border-dashed border-[var(--border-color)] rounded-2xl text-center">
                                 <p className="text-[8px] font-black uppercase text-[var(--text-muted)] opacity-50 tracking-widest">Жодних термінових справ</p>
                              </div>
                            )}
                         </div>
                      </section>

                      <section className="space-y-4">
                         <div className="flex justify-between items-center px-2">
                           <Typography variant="tiny" className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40">Радар подій</Typography>
                           <button onClick={() => { setCalendarViewMode('month'); setActiveTab('calendar'); }} className="text-indigo-600 hover:scale-110 transition-transform"><i className="fa-solid fa-calendar-days text-[10px]"></i></button>
                         </div>
                         <div className="space-y-2">
                            {upcomingRadarEvents.length > 0 ? upcomingRadarEvents.map(ev => (
                              <Card key={ev.id} padding="none" onClick={() => setSelectedTaskId(ev.id)} className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex items-center gap-3 shadow-sm cursor-pointer hover:border-[var(--primary)]/30 group">
                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ev.status === TaskStatus.DONE ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                                    <i className={`fa-solid ${ev.status === TaskStatus.DONE ? 'fa-check' : 'fa-calendar-day'} text-xs`}></i>
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className={`text-[10px] font-black truncate uppercase ${ev.status === TaskStatus.DONE ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>{ev.title}</div>
                                    <div className="text-[7px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{new Date(ev.scheduledDate!).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                                 </div>
                              </Card>
                            )) : (
                              <div className="py-6 px-4 bg-black/[0.02] border border-dashed border-[var(--border-color)] rounded-2xl text-center">
                                 <p className="text-[8px] font-black uppercase text-[var(--text-muted)] opacity-50 tracking-widest">Тиждень без великих подій</p>
                              </div>
                            )}
                         </div>
                      </section>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-500">
                 <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     {[
                       { key: 'health', label: 'Здоров\'я', color: 'rose' },
                       { key: 'career', label: 'Кар\'єра', color: 'indigo' },
                       { key: 'finance', label: 'Фінанси', color: 'emerald' },
                       { key: 'rest', label: 'Відпочинок', color: 'cyan' },
                     ].map(sphere => {
                       const data = stats.spheres[sphere.key as keyof typeof stats.spheres];
                       const percent = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                       return (
                         <div key={sphere.key} className="space-y-3">
                           <div className="flex justify-between items-end">
                             <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">{sphere.label}</span>
                             <span className="text-sm font-black text-[var(--text-main)]">{percent}%</span>
                           </div>
                           <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                             <div className={`h-full ${sphere.color === 'rose' ? 'bg-rose-500' : sphere.color === 'indigo' ? 'bg-indigo-500' : sphere.color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }}></div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-[2rem] bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-2xl font-black shadow-inner">{stats.kpi}%</div>
                         <div>
                            <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest">Ефективність</Typography>
                            <div className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Виконано {stats.doneCount} квестів</div>
                         </div>
                      </div>
                      <button onClick={handleAiAnalysis} disabled={isAiAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-3 bg-[var(--text-main)] text-[var(--bg-main)] px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                        {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-[var(--primary)]"></i>} ШІ Аналіз Циклу
                      </button>
                   </div>
                 </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 1100 }}
      >
        {!isMobile && <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-[var(--primary)]' : 'bg-transparent hover:bg-primary/20'}`} />}
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-ghost text-9xl mb-8"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Двигун у спокої</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;