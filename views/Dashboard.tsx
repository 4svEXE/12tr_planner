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
    character, cycle, setActiveTab, setCalendarViewMode, aiEnabled, diary, setIsReportWizardOpen 
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'tasks' | 'progress'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'projects' | 'calendar'>('all');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showInsight, setShowInsight] = useState(true);
  const [isBannerMinimized, setIsBannerMinimized] = useState(false);
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

  // Логіка показу банера підсумків
  const showReviewBanner = useMemo(() => {
    const hour = currentTime.getHours();
    // Показ з 21:00 до 05:00
    const isTime = hour >= 21 || hour < 5;
    if (!isTime) return false;

    // Визначаємо дату для перевірки: якщо зараз ніч (00-05), перевіряємо вчорашній запис
    const checkDate = hour < 5 
      ? new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
      : dateStr;

    const alreadyDone = (diary || []).some(e => e.date === checkDate);
    return !alreadyDone;
  }, [currentTime, diary, dateStr]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isDeleted && t.projectSection !== 'habits');
    const limit = new Date().setHours(0,0,0,0);
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
  }, [tasks, projects]);

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

  const handleAiAnalysis = async () => {
    if (!aiEnabled) return alert("Увімкніть ШІ в налаштуваннях");
    setIsAiAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    alert(`KPI: ${stats.kpi}%. Сфери: ${Object.entries(stats.spheres).sort((a: any, b: any) => b[1].total - a[1].total)[0][0]}.`);
    setIsAiAnalyzing(false);
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 transition-none">
          <div className="max-w-6xl mx-auto space-y-4 pb-32">
            
            {mainTab === 'tasks' ? (
              <>
                {showReviewBanner && (
                  isBannerMinimized ? (
                    <div className="flex justify-end px-2">
                       <button 
                        onClick={() => setIsBannerMinimized(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white transition-all animate-in fade-in slide-in-from-right-2"
                       >
                          <i className="fa-solid fa-moon text-[10px]"></i>
                          <span className="text-[9px] font-black uppercase tracking-widest pt-0.5">Підбити підсумки</span>
                       </button>
                    </div>
                  ) : (
                    <Card 
                      padding="none" 
                      className="bg-[var(--bg-card)] border border-[var(--primary)]/30 p-5 md:p-6 rounded-[2rem] shadow-xl shadow-[var(--primary)]/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <button 
                        onClick={() => setIsBannerMinimized(true)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] transition-colors z-20"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>

                      <div className="flex items-center gap-4 relative z-10 text-center md:text-left flex-col md:flex-row pr-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-2xl shrink-0 text-[var(--primary)]">
                          <i className="fa-solid fa-moon"></i>
                        </div>
                        <div>
                          <Typography variant="h2" className="text-[var(--primary)] text-lg md:text-xl !tracking-normal mb-0.5">Час підбити підсумки</Typography>
                          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">Заповніть щоденник, щоб зафіксувати прогрес та отримати XP</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setIsReportWizardOpen(true)}
                        className="relative z-10 px-8 py-3 bg-[var(--primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                      >
                        Заповнити щоденник
                      </button>
                    </Card>
                  )
                )}

                <Card 
                  padding="none" 
                  onClick={() => { setCalendarViewMode('day'); setActiveTab('calendar'); }}
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
                            {filteredQuests.map(task => {
                              const isCompleting = completingIds.has(task.id);
                              const isDone = task.status === TaskStatus.DONE;
                              const isSelected = selectedTaskId === task.id;
                              
                              return (
                                <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`flex items-center gap-2.5 px-2.5 py-1.5 transition-all cursor-pointer shadow-sm rounded border ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30'} ${isCompleting ? 'scale-[0.98]' : ''}`}>
                                  <button onClick={(e) => { e.stopPropagation(); handleToggleTaskWithDelay(task); }} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone || isCompleting ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5 text-transparent'}`}>
                                    {(isDone || isCompleting) && <i className="fa-solid fa-check text-[7px]"></i>}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                     <div className={`text-[11px] font-bold truncate leading-tight strike-anim ${isDone || isCompleting ? 'is-striking text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>{task.title}</div>
                                  </div>
                                </Card>
                              );
                            })}
                         </div>
                      </section>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                 {/* Progress view stuff */}
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 110 }}
      >
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-[var(--text-main)]"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-[var(--text-muted)]">Оберіть квест</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;