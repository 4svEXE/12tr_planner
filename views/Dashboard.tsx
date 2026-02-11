import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
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
    character, cycle, setActiveTab, setCalendarViewMode, aiEnabled, people 
  } = useApp();
  const { isGuest, login } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'tasks' | 'progress'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'projects' | 'calendar'>('all');
  const [progressPeriod, setProgressPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showInsight, setShowInsight] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  
  const { detailsWidth, startResizing, isResizing } = useResizer(350, 900);

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

  const isEveningReviewTime = useMemo(() => currentTime.getHours() >= 21, [currentTime]);

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
        if (taskFilter === 'calendar') return (a.scheduledDate || 0) - (b.scheduledDate || 0);
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

  const handleOpenNowInCalendar = () => {
    setCalendarViewMode('day');
    setActiveTab('calendar');
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)] transition-none">
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${isMobile && selectedTaskId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="p-3 md:p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-xl font-black text-[var(--text-main)]">Сьогодні</Typography>
                <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest pt-1">{currentTime.toLocaleDateString('uk-UA', { weekday: 'short' , day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)]">
                 <button onClick={() => setMainTab('tasks')} className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${mainTab === 'tasks' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Завдання</button>
                 <button onClick={() => setMainTab('progress')} className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${mainTab === 'progress' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Прогрес</button>
              </div>
            </div>
            <div className="md:hidden"><MiniCalendar /></div>
            <div className="flex items-center gap-2 bg-black/5 px-2 py-1 rounded-lg border border-theme overflow-hidden">
               <button onClick={() => setShowInsight(!showInsight)} className={`shrink-0 text-[10px] ${showInsight ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                 <i className={`fa-solid ${showInsight ? 'fa-eye' : 'fa-eye-slash'}`}></i>
               </button>
               <div className="flex-1 overflow-hidden">
                 <p className={`text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight truncate ${showInsight ? '' : 'hidden'}`}>
                    <span className="text-[var(--primary)] mr-2">●</span> {randomInsight}
                 </p>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 transition-none">
          <div className="max-w-6xl mx-auto space-y-4 pb-32">
            
            {mainTab === 'tasks' ? (
              <>
                {isEveningReviewTime && (
                  <Card 
                    padding="none" 
                    className="bg-white border border-[var(--border-color)] p-5 md:p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 relative z-10 text-center md:text-left flex-col md:flex-row">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-2xl shrink-0 text-[var(--primary)]">
                        <i className="fa-solid fa-moon"></i>
                      </div>
                      <div>
                        <Typography variant="h2" className="text-[var(--primary)] text-lg md:text-xl !tracking-normal mb-0.5">Час підбити підсумки</Typography>
                        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">Заповніть щоденник, щоб зафіксувати прогрес та отримати XP</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('diary')}
                      className="relative z-10 px-8 py-3 bg-[var(--primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                      Заповнити щоденник
                    </button>
                  </Card>
                )}

                <Card 
                  padding="none" 
                  onClick={handleOpenNowInCalendar}
                  className="bg-[var(--bg-card)] border-[var(--border-color)] py-1.5 px-3 rounded shadow-sm flex items-center gap-3 relative border-l-4 border-l-[var(--primary)] transition-none cursor-pointer hover:bg-[var(--bg-main)]/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">ЗАРАЗ:</span>
                      <span className="text-[10px] font-black text-[var(--text-main)] truncate uppercase">
                        {timeBlocks.find(b => b.dayOfWeek === currentTime.getDay() && currentTime.getHours() >= b.startHour && currentTime.getHours() < b.endHour)?.title || 'Вільний час'}
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-clock-rotate-left text-[9px]"></i>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start transition-none">
                   <div className="lg:col-span-8 space-y-6">
                      <section className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Активні квести</Typography>
                            <div className="flex bg-black/5 p-0.5 rounded border border-theme">
                               {(['all', 'projects', 'calendar'] as const).map(f => (
                                 <button key={f} onClick={() => setTaskFilter(f)} className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest transition-none ${taskFilter === f ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
                                   {f === 'all' ? 'Усі' : f === 'projects' ? 'Проєкти' : 'Час'}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="grid grid-cols-1 gap-1">
                            {filteredQuests.length > 0 ? filteredQuests.map(task => {
                              const isCompleting = completingIds.has(task.id);
                              const isDone = task.status === TaskStatus.DONE;
                              const isSelected = selectedTaskId === task.id;
                              
                              return (
                                <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`flex items-center gap-2.5 px-2.5 py-1.5 transition-all cursor-pointer shadow-sm rounded border ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30'} ${isCompleting ? 'scale-[0.98]' : ''}`}>
                                  <button onClick={(e) => { e.stopPropagation(); handleToggleTaskWithDelay(task); }} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone || isCompleting ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5 text-transparent'}`}>
                                    {(isDone || isCompleting) && <i className="fa-solid fa-check text-[7px]"></i>}
                                  </button>
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                     <div className={`text-[11px] font-bold truncate leading-tight strike-anim ${isDone || isCompleting ? 'is-striking text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>{task.title}</div>
                                     {task.content && task.content !== '[]' && <i className="fa-regular fa-file-lines text-slate-300 text-[9px]"></i>}
                                  </div>
                                </Card>
                              );
                            }) : (
                              <div className="py-12 bg-black/[0.02] border-2 border-dashed border-theme rounded-2xl flex flex-col items-center justify-center opacity-40 grayscale select-none">
                                 <i className="fa-solid fa-mountain-sun text-4xl mb-3"></i>
                                 <Typography variant="tiny" className="font-black">Горизонт чистий</Typography>
                                 <p className="text-[9px] font-bold mt-1">Додайте нові квести у вхідні або перегляньте беклог.</p>
                              </div>
                            )}
                         </div>
                      </section>

                      <section className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                           <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Дисципліна ({habitCompletionRate}%)</Typography>
                           <button onClick={() => setActiveTab('habits')} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                              <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
                           </button>
                         </div>
                         <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                            {habitTasks.length > 0 ? habitTasks.map(habit => {
                               const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                               return (
                                 <button key={habit.id} onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                                  className={`shrink-0 w-24 p-2 rounded border transition-none flex flex-col items-center gap-1.5 ${isDone ? 'bg-emerald-50/10 border-emerald-500/20 text-emerald-500 shadow-inner' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] opacity-60'}`}>
                                   <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-black/5 border border-theme'}`}>
                                      <i className={`fa-solid ${isDone ? 'fa-check' : 'fa-repeat'}`}></i>
                                   </div>
                                   <span className="text-[6px] font-black uppercase text-center leading-tight truncate w-full">{habit.title}</span>
                                 </button>
                               );
                            }) : (
                              <button onClick={() => setActiveTab('habits')} className="flex-1 py-4 border-2 border-dashed border-theme rounded-2xl flex flex-col items-center justify-center opacity-30 group hover:opacity-100 hover:border-primary/50 transition-all">
                                 <i className="fa-solid fa-plus text-xs mb-1"></i>
                                 <span className="text-[7px] font-black uppercase tracking-widest">Створити ритуал</span>
                              </button>
                            )}
                         </div>
                      </section>
                   </div>
                   <div className="lg:col-span-4 space-y-6">
                      <section className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Гарячі дедлайни</Typography>
                            <i className="fa-solid fa-flag-checkered text-rose-500 text-[10px]"></i>
                         </div>
                         <div className="space-y-1">
                            {urgentDeadlines.length > 0 ? urgentDeadlines.map(ev => {
                              const isOverdue = ev.dueDate! < Date.now();
                              const isCritical = ev.dueDate! < Date.now() + 3 * 3600000;

                              return (
                                <Card 
                                  key={ev.id} 
                                  padding="none" 
                                  onClick={() => setSelectedTaskId(ev.id)} 
                                  className={`p-1.5 bg-[var(--bg-card)] border-l-4 border-theme rounded flex items-center gap-2.5 shadow-sm cursor-pointer transition-all group ${isOverdue ? 'border-l-rose-600 bg-rose-50/30' : 'border-l-rose-500 hover:bg-rose-50'}`}
                                >
                                   <div className="min-w-0 flex-1">
                                      <div className={`text-[10px] font-black truncate uppercase text-[var(--text-main)] flex items-center gap-2`}>
                                        {ev.title}
                                        {isCritical && <i className="fa-solid fa-triangle-exclamation text-rose-500 animate-pulse text-[8px]"></i>}
                                      </div>
                                      <div className={`text-[7px] font-bold uppercase ${isOverdue ? 'text-rose-700 animate-pulse' : 'text-rose-600'}`}>
                                        {isOverdue ? 'ПРОТЕРМІНОВАНО: ' : 'Термін: '} 
                                        {new Date(ev.dueDate!).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})} 
                                        {' '}
                                        {new Date(ev.dueDate!).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}
                                      </div>
                                   </div>
                                </Card>
                              );
                            }) : (
                              <div className="py-4 text-center opacity-20 italic text-[8px] font-black uppercase tracking-widest border border-dashed border-theme rounded-lg">
                                Жодних дедлайнів на горизонті
                              </div>
                            )}
                         </div>
                      </section>

                      <section className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Радар подій</Typography>
                            <button onClick={() => { setCalendarViewMode('month'); setActiveTab('calendar'); }} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                               <i className="fa-solid fa-calendar-days text-[10px]"></i>
                            </button>
                         </div>
                         <div className="space-y-1">
                            {upcomingRadarEvents.length > 0 ? upcomingRadarEvents.map(ev => (
                              <Card key={ev.id} padding="none" onClick={() => setSelectedTaskId(ev.id)} className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded flex items-center gap-2.5 shadow-sm cursor-pointer hover:border-[var(--primary)]/30 group">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(ev); }} 
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${ev.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 group-hover:border-[var(--primary)]/50'}`}
                                  >
                                    {ev.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                                 </button>
                                 <div className="min-w-0 flex-1">
                                    <div className={`text-[9px] font-black truncate uppercase ${ev.status === TaskStatus.DONE ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>{ev.title}</div>
                                    <div className="text-[7px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{new Date(ev.scheduledDate!).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                                 </div>
                              </Card>
                            )) : (
                              <div className="py-4 text-center opacity-20 italic text-[8px] font-black uppercase tracking-widest border border-dashed border-theme rounded-lg">
                                Тиждень без великих подій
                              </div>
                            )}
                         </div>
                      </section>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-6 shadow-sm rounded">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {[
                       { key: 'health', label: 'Здоров\'я', color: 'rose' },
                       { key: 'career', label: 'Кар\'єра', color: 'indigo' },
                       { key: 'finance', label: 'Фінанси', color: 'emerald' },
                       { key: 'rest', label: 'Відпочинок', color: 'cyan' },
                     ].map(sphere => {
                       const data = stats.spheres[sphere.key as keyof typeof stats.spheres];
                       const percent = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                       return (
                         <div key={sphere.key} className="space-y-2">
                           <div className="flex justify-between items-end">
                             <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest opacity-60">{sphere.label}</span>
                             <span className="text-sm font-black text-[var(--text-main)]">{percent}%</span>
                           </div>
                           <div className="h-1.5 bg-black/5 rounded-full overflow-hidden border border-theme">
                             <div className={`h-full ${sphere.color === 'rose' ? 'bg-rose-500' : sphere.color === 'indigo' ? 'bg-indigo-500' : sphere.color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }}></div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   <div className="mt-8 pt-6 border-t border-theme flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-xl font-black shadow-inner">{stats.kpi}%</div>
                         <div>
                            <Typography variant="tiny" className="text-[var(--text-muted)] font-black text-[8px] uppercase tracking-widest opacity-60">Ефективність циклу</Typography>
                            <div className="text-10px font-black text-[var(--text-main)] uppercase">Виконано {stats.doneCount} квестів</div>
                         </div>
                      </div>
                      <button onClick={handleAiAnalysis} disabled={isAiAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--bg-main)] px-8 py-3 rounded text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50">
                        {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-[var(--primary)]"></i>} ШІ Аналіз
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
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 110 }}
      >
        {!isMobile && (
          <div 
            onMouseDown={startResizing} 
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-[var(--primary)]' : 'bg-transparent hover:bg-[var(--primary)]/20'}`}
            title="Тягніть для зміни розміру"
          />
        )}
        
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-[var(--text-main)]"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-[var(--text-muted)]">Оберіть квест</Typography>
              <Typography variant="body" className="mt-4 text-xs font-bold text-[var(--text-muted)]">Деталі завдання з’являться тут</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;