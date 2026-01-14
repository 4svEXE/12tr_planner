
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
    character, cycle, setActiveTab, setCalendarViewMode, aiEnabled, people 
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'tasks' | 'progress'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'projects' | 'calendar'>('all');
  const [progressPeriod, setProgressPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showInsight, setShowInsight] = useState(true);
  
  // FIX: Provide both minWidth (300) and maxWidth (800) arguments to useResizer
  const { detailsWidth, startResizing, isResizing } = useResizer(300, 800);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toISOString().split('T')[0]);

  // --- ANALYTICS LOGIC ---
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
    
    const spheres = { health: { done: 0, total: 0 }, career: { done: 0, total: 0 }, finance: { done: 0, total: 0 }, rest: { done: 0, total: 0 } };
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

  const habitCompletionRate = useMemo(() => {
    const dailyHabits = tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit')));
    if (dailyHabits.length === 0) return 0;
    const completedCount = dailyHabits.filter(h => h.habitHistory?.[dateStr]?.status === 'completed').length;
    return Math.round((completedCount / dailyHabits.length) * 100);
  }, [tasks, dateStr]);

  const filteredQuests = useMemo(() => {
    const active = tasks.filter(t => {
      if (t.isDeleted || t.status === TaskStatus.DONE) return false;
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
  }, [tasks, todayTimestamp, taskFilter]);

  const randomInsight = useMemo(() => {
    const insights = tasks.filter(t => !t.isDeleted && t.tags.includes('insight'));
    if (insights.length === 0) return "Дисципліна — це свобода.";
    return insights[currentTime.getHours() % insights.length].title;
  }, [tasks, currentTime]);

  const handleAiAnalysis = async () => {
    if (!aiEnabled) return alert("Увімкніть ШІ в налаштуваннях");
    setIsAiAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    alert(`ШІ аналіз: Твій KPI складає ${stats.kpi}%. Найбільший фокус зараз на сфері ${Object.entries(stats.spheres).sort((a,b) => b[1].total - a[1].total)[0][0]}. Продовжуй в тому ж дусі!`);
    setIsAiAnalyzing(false);
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)] transition-none">
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${window.innerWidth < 1024 && selectedTaskId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="p-3 md:p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-xl font-black text-[var(--text-main)]">Сьогодні</Typography>
                <div className="text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-widest pt-1">{currentTime.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
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
                <Card padding="none" className="bg-[var(--bg-card)] border-[var(--border-color)] p-2.5 rounded-xl shadow-sm flex items-center gap-3 relative border-l-4 border-l-[var(--primary)] transition-none">
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">ЗАРАЗ:</span>
                      <span className="text-11px font-black text-[var(--text-main)] truncate uppercase">
                        {timeBlocks.find(b => b.dayOfWeek === currentTime.getDay() && currentTime.getHours() >= b.startHour && currentTime.getHours() < b.endHour)?.title || 'Вільний час'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('calendar')} className="w-7 h-7 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center shrink-0 transition-none">
                    <i className="fa-solid fa-clock-rotate-left text-[10px]"></i>
                  </button>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start transition-none">
                   <div className="lg:col-span-8 space-y-6">
                      <section className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Активні квести</Typography>
                            <div className="flex bg-black/5 p-0.5 rounded-lg border border-theme">
                               {(['all', 'projects', 'calendar'] as const).map(f => (
                                 <button key={f} onClick={() => setTaskFilter(f)} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-none ${taskFilter === f ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
                                   {f === 'all' ? 'Усі' : f === 'projects' ? 'Проєкти' : 'Час'}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="grid grid-cols-1 gap-1">
                            {filteredQuests.map(task => (
                              <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`flex items-center gap-2.5 px-2.5 py-1.5 transition-none cursor-pointer shadow-sm rounded-lg group border ${selectedTaskId === task.id ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30'}`}>
                                <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5 text-transparent'}`}>
                                  <i className="fa-solid fa-check text-[7px]"></i>
                                </button>
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                   <div className={`text-[11px] font-bold truncate leading-tight ${task.status === TaskStatus.DONE ? 'text-[var(--text-muted)] opacity-40 line-through' : 'text-[var(--text-main)]'}`}>{task.title}</div>
                                   {task.content && task.content !== '[]' && <i className="fa-regular fa-file-lines text-slate-300 text-[9px]"></i>}
                                </div>
                              </Card>
                            ))}
                         </div>
                      </section>

                      <section className="space-y-2">
                         <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70 px-1">Дисципліна ({habitCompletionRate}%)</Typography>
                         <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                            {tasks.filter(t => !t.isDeleted && t.projectSection === 'habits').map(habit => {
                               const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                               return (
                                 <button key={habit.id} onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                                  className={`shrink-0 w-24 p-2 rounded-xl border transition-none flex flex-col items-center gap-1.5 ${isDone ? 'bg-emerald-50/10 border-emerald-500/20 text-emerald-500 shadow-inner' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] opacity-60'}`}>
                                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-black/5 border border-theme'}`}>
                                      <i className={`fa-solid ${isDone ? 'fa-check' : 'fa-repeat'}`}></i>
                                   </div>
                                   <span className="text-[6px] font-black uppercase text-center leading-tight truncate w-full">{habit.title}</span>
                                 </button>
                               );
                            })}
                         </div>
                      </section>
                   </div>
                   <div className="lg:col-span-4 space-y-6">
                      <section className="space-y-2">
                         <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70 px-1">Радар подій</Typography>
                         <div className="space-y-1">
                            {tasks.filter(t => !t.isDeleted && t.isEvent && t.scheduledDate && t.scheduledDate >= todayTimestamp).slice(0, 3).map(ev => (
                              <div key={ev.id} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex items-center gap-2.5 shadow-sm">
                                 <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-pink-500/10 text-pink-500"><i className="fa-solid fa-calendar-star text-[8px]"></i></div>
                                 <div className="min-w-0 flex-1">
                                    <div className="text-[9px] font-black text-[var(--text-main)] truncate uppercase">{ev.title}</div>
                                    <div className="text-[7px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{new Date(ev.scheduledDate!).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </section>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-6 shadow-sm rounded-2xl">
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
                         <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-xl font-black shadow-inner">{stats.kpi}%</div>
                         <div>
                            <Typography variant="tiny" className="text-[var(--text-muted)] font-black text-[8px] uppercase tracking-widest opacity-60">Ефективність циклу</Typography>
                            <div className="text-10px font-black text-[var(--text-main)] uppercase">Виконано {stats.doneCount} квестів</div>
                         </div>
                      </div>
                      <button onClick={handleAiAnalysis} disabled={isAiAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--bg-main)] px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50">
                        {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-[var(--primary)]"></i>} ШІ Аналіз
                      </button>
                   </div>
                 </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${window.innerWidth < 1024 ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : (selectedTaskId ? 'translate-x-0' : 'translate-x-full absolute')}`} style={{ width: selectedTaskId ? (window.innerWidth < 1024 ? '100vw' : detailsWidth) : 0 }}>
        {selectedTaskId && (
          <div className="h-full w-full relative">
            {window.innerWidth >= 1024 && <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:bg-[var(--primary)] z-[100] ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>}
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
