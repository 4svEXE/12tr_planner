
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
  const { detailsWidth, startResizing, isResizing } = useResizer(400, 700);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const daySchedule = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    return timeBlocks
      .filter(b => b.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startHour - b.startHour);
  }, [timeBlocks, currentTime]);

  const currentBlock = useMemo(() => {
    const hour = currentTime.getHours();
    return daySchedule.find(b => hour >= b.startHour && hour < b.endHour);
  }, [daySchedule, currentTime]);

  const nextBlock = useMemo(() => {
    const hour = currentTime.getHours();
    return daySchedule.find(b => b.startHour > hour);
  }, [daySchedule, currentTime]);

  const randomInsight = useMemo(() => {
    const insightsFolder = projects.find(p => p.name === 'Інсайти');
    const insights = tasks.filter(t => 
      !t.isDeleted && 
      (t.tags.includes('insight') || (insightsFolder && t.projectId === insightsFolder.id))
    );
    if (insights.length === 0) return "Дисципліна — це свобода.";
    const seed = currentTime.getHours() + currentTime.getDate();
    return insights[seed % insights.length].title;
  }, [tasks, projects, currentTime]);

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
        // Якщо у вкладці календар, сортуємо за часом
        if (taskFilter === 'calendar') {
          return (a.scheduledDate || 0) - (b.scheduledDate || 0);
        }
        const pWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
        return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp, taskFilter]);

  const dailyHabits = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );

  const habitCompletionRate = useMemo(() => {
    if (dailyHabits.length === 0) return 0;
    const completedCount = dailyHabits.filter(h => h.habitHistory?.[dateStr]?.status === 'completed').length;
    return Math.round((completedCount / dailyHabits.length) * 100);
  }, [dailyHabits, dateStr]);

  const upcomingEvents = useMemo(() => {
    const horizon = todayTimestamp + (30 * 24 * 60 * 60 * 1000);
    const events: any[] = [];
    tasks.forEach(t => {
      if (!t.isDeleted && t.isEvent && t.scheduledDate && t.scheduledDate >= todayTimestamp && t.scheduledDate <= horizon) {
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
    });
    return events.sort((a, b) => a.date - b.date).slice(0, 5);
  }, [tasks, people, todayTimestamp]);

  const getTaskProjectHierarchy = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : null;
  };

  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse', color: 'rose' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase', color: 'indigo' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins', color: 'emerald' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch', color: 'cyan' },
  ];

  const handleAiAnalysis = async () => {
    if (!aiEnabled) return alert("Увімкніть ШІ в налаштуваннях");
    setIsAiAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    alert(`ШІ аналіз за ${progressPeriod} сформовано.`);
    setIsAiAnalyzing(false);
  };

  const formatTaskTime = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (date.getHours() === 0 && date.getMinutes() === 0) return null;
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)] transition-none">
      <div className="flex-1 flex flex-col min-w-0 h-full">
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
            
            {/* Mobile Calendar Integration */}
            <div className="md:hidden">
               <MiniCalendar />
            </div>

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
            
            <div className="grid grid-cols-1">
              <Card padding="none" className="bg-[var(--bg-card)] border-[var(--border-color)] p-2.5 rounded-xl shadow-sm flex items-center gap-3 relative group border-l-4 border-l-[var(--primary)] transition-none">
                <div className="min-w-0 flex-1 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--primary)]">ПОТОЧНИЙ БЛОК:</span>
                    <span className="text-[11px] font-black text-[var(--text-main)] truncate uppercase">{currentBlock?.title || 'Вільний час'}</span>
                  </div>
                  {nextBlock && (
                    <div className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-tighter mt-0.5 opacity-60">
                      НАСТУПНИЙ: {nextBlock.title} @ {nextBlock.startHour}:00
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { setCalendarViewMode('day'); setActiveTab('calendar'); }}
                  className="w-7 h-7 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center shrink-0 transition-none"
                >
                  <i className="fa-solid fa-calendar-day text-[10px]"></i>
                </button>
              </Card>
            </div>

            {mainTab === 'tasks' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start transition-none">
                 <div className="lg:col-span-8 space-y-6">
                    <section className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Активні квести</Typography>
                          <div className="flex bg-black/5 p-0.5 rounded-lg border border-theme">
                             <button onClick={() => setTaskFilter('all')} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-none ${taskFilter === 'all' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Усі</button>
                             <button onClick={() => setTaskFilter('projects')} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-none ${taskFilter === 'projects' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Проєкти</button>
                             <button onClick={() => setTaskFilter('calendar')} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-none ${taskFilter === 'calendar' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>Календар</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 gap-1">
                          {filteredQuests.map(task => {
                            const projectName = getTaskProjectHierarchy(task.projectId);
                            const taskTime = formatTaskTime(task.scheduledDate);
                            return (
                              <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-2.5 px-2.5 py-1.5 bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-none cursor-pointer shadow-sm rounded-lg group">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
                                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5 text-transparent group-hover:border-[var(--primary)]'}`}
                                >
                                  <i className="fa-solid fa-check text-[7px]"></i>
                                </button>
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                   <div className={`text-[11px] font-bold truncate leading-tight ${task.status === TaskStatus.DONE ? 'text-[var(--text-muted)] opacity-40 line-through' : 'text-[var(--text-main)]'}`}>
                                     {task.title}
                                   </div>
                                   <div className="flex items-center gap-2 shrink-0">
                                      {taskTime && (
                                        <span className="text-[7px] font-black text-[var(--primary)] bg-[var(--primary)]/5 px-1.5 py-0.5 rounded border border-[var(--primary)]/10">
                                          {taskTime}
                                        </span>
                                      )}
                                      {projectName && (
                                        <span className="text-[6px] font-black uppercase text-[var(--text-muted)] opacity-40 bg-black/5 px-1.5 py-0.5 rounded">
                                          {projectName}
                                        </span>
                                      )}
                                   </div>
                                </div>
                              </Card>
                            );
                          })}
                          {filteredQuests.length === 0 && (
                            <div className="py-12 text-center opacity-20 flex flex-col items-center">
                               <i className="fa-solid fa-mountain-sun text-2xl mb-2 text-[var(--text-muted)]"></i>
                               <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Квести не знайдено</p>
                            </div>
                          )}
                       </div>
                    </section>

                    <section className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2">
                            <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] text-[var(--text-muted)] opacity-70">Дисципліна</Typography>
                            <div className={`text-[7px] font-black py-0 px-1 rounded bg-[var(--primary)]/10 text-[var(--primary)]`}>{habitCompletionRate}%</div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('habits')}
                            className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest hover:bg-black/5 px-2 py-1 rounded transition-none"
                          >
                            Трекер <i className="fa-solid fa-arrow-right ml-1 text-[6px]"></i>
                          </button>
                       </div>
                       <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 snap-x -mx-3 px-3 md:mx-0 md:px-0">
                          {dailyHabits.map(habit => {
                             const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                             return (
                               <button key={habit.id} onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                                className={`shrink-0 w-24 p-2 rounded-xl border transition-none flex flex-col items-center gap-1.5 snap-start ${isDone ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-inner' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:border-[var(--primary)]/30'}`}>
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

                 <div className="lg:col-span-4 space-y-6 transition-none">
                    <section className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <Typography variant="tiny" className="font-black uppercase text-[8px] tracking-[0.2em] flex items-center gap-2 text-[var(--text-muted)] opacity-70">
                             <i className="fa-solid fa-radar text-[var(--primary)]"></i> Радар подій
                          </Typography>
                          <button onClick={() => setActiveTab('calendar')} className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest px-2 py-1 transition-none hover:bg-black/5 rounded">Календар</button>
                       </div>
                       <div className="space-y-1">
                          {upcomingEvents.map(ev => (
                            <div key={ev.id} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex items-center gap-2.5 shadow-sm transition-none text-left">
                               <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${ev.type === 'birthday' ? 'bg-amber-500/10 text-amber-500' : 'bg-pink-500/10 text-pink-500'}`}>
                                  <i className={`fa-solid ${ev.type === 'birthday' ? 'fa-cake-candles' : 'fa-calendar-star'} text-[8px]`}></i>
                               </div>
                               <div className="min-w-0 flex-1">
                                  <div className="text-[9px] font-black text-[var(--text-main)] truncate uppercase">{ev.title}</div>
                                  <div className="text-[7px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{new Date(ev.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <Typography variant="tiny" className="font-black uppercase text-[8px] px-1 tracking-[0.2em] flex items-center gap-2 text-[var(--text-muted)] opacity-70">
                             <i className="fa-solid fa-user-group text-indigo-500"></i> Союзники
                          </Typography>
                          <button onClick={() => setActiveTab('people')} className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest px-2 py-1 transition-none hover:bg-black/5 rounded">Люди</button>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          {people.slice(0, 4).map(p => (
                            <Card key={p.id} padding="none" className="p-2 bg-[var(--bg-card)] border-[var(--border-color)] rounded-xl flex flex-col items-center text-center cursor-pointer transition-none hover:border-[var(--primary)]/30" onClick={() => { setActiveTab('people'); }}>
                               <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-7 h-7 rounded-full mb-1.5 bg-black/5 border border-theme p-0.5" />
                               <span className="text-[7px] font-black text-[var(--text-main)] uppercase truncate w-full">{p.name}</span>
                            </Card>
                          ))}
                       </div>
                    </section>
                 </div>
              </div>
            ) : (
              <div className="space-y-4 transition-none">
                 <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-6 shadow-sm rounded-2xl transition-none">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {spheres.map(sphere => {
                       const val = (character.stats as any)[sphere.key] || 0;
                       return (
                         <div key={sphere.key} className="space-y-2">
                           <div className="flex justify-between items-end">
                             <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest opacity-60">{sphere.label}</span>
                             <span className="text-sm font-black text-[var(--text-main)]">{val}%</span>
                           </div>
                           <div className="h-1 bg-black/5 rounded-full overflow-hidden border border-theme">
                             <div className={`h-full ${
                               sphere.color === 'rose' ? 'bg-rose-500' :
                               sphere.color === 'indigo' ? 'bg-indigo-500' :
                               sphere.color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'
                             }`} style={{ width: `${val}%` }}></div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-theme flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-base font-black">{cycle.globalExecutionScore}%</div>
                         <Typography variant="tiny" className="text-[var(--text-muted)] font-black text-[8px] uppercase tracking-widest opacity-60">Глобальний KPI Циклу</Typography>
                      </div>
                      <button 
                        onClick={handleAiAnalysis}
                        disabled={isAiAnalyzing}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--bg-main)] px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-none shadow-lg disabled:opacity-50"
                        style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-main)' }}
                      >
                        {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-[var(--primary)]"></i>}
                        ШІ Аналіз Прогресу
                      </button>
                   </div>
                 </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-none ${selectedTaskId ? 'translate-x-0' : 'translate-x-full absolute'}`} style={{ width: selectedTaskId ? detailsWidth : 0 }}>
        {selectedTaskId && (
          <>
            <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] z-[100] transition-none ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
            <div className="h-full w-full">
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
