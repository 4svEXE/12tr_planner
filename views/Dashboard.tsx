
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, Project, TaskStatus, Priority } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';

const Dashboard: React.FC = () => {
  const { 
    tasks, projects, timeBlocks, toggleTaskStatus, toggleHabitStatus, 
    character, cycle, setActiveTab, setCalendarViewMode, aiEnabled, people 
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'tasks' | 'progress'>('tasks');
  const [progressPeriod, setProgressPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const { detailsWidth, startResizing, isResizing } = useResizer(400, 700);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const currentBlock = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    const hour = currentTime.getHours();
    return timeBlocks.find(b => b.dayOfWeek === dayOfWeek && hour >= b.startHour && hour < b.endHour);
  }, [timeBlocks, currentTime]);

  const randomInsight = useMemo(() => {
    const insightsFolder = projects.find(p => p.name === 'Інсайти');
    const insights = tasks.filter(t => 
      !t.isDeleted && 
      (t.tags.includes('insight') || (insightsFolder && t.projectId === insightsFolder.id))
    );
    if (insights.length === 0) return "Записуйте свої ідеї в папку 'Інсайти', щоб бачити їх тут.";
    const seed = currentTime.getHours() + currentTime.getDate(); // Simple stable daily/hourly seed
    return insights[seed % insights.length].title;
  }, [tasks, projects, currentTime]);

  const activeQuests = useMemo(() => {
    return tasks.filter(t => 
      !t.isDeleted && t.status !== TaskStatus.DONE && 
      (t.scheduledDate === todayTimestamp || t.status === TaskStatus.NEXT_ACTION) &&
      t.projectSection !== 'habits' && t.category !== 'note'
    ).sort((a, b) => {
        const pWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
        return (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp]);

  const dailyHabits = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );

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

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative text-slate-900">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-3 md:p-8 bg-white border-b border-slate-100 shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Typography variant="h1" className="text-xl md:text-3xl font-black">Сьогодні</Typography>
                <Badge variant="orange" className="text-[7px] px-1.5 py-0">W{cycle.currentWeek}</Badge>
              </div>
              <Typography variant="body" className="text-slate-400 font-bold text-[10px] md:text-sm">
                {currentTime.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Typography>
            </div>
            <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-xl md:rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto">
               <button onClick={() => setMainTab('tasks')} className={`flex-1 md:flex-none px-3 md:px-6 py-1 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'tasks' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Завдання</button>
               <button onClick={() => setMainTab('progress')} className={`flex-1 md:flex-none px-3 md:px-6 py-1 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'progress' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Прогрес</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 pb-32">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
              <Card padding="none" className="lg:col-span-7 bg-white border-slate-100 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm flex items-center gap-4 md:gap-5 group hover:border-orange-200 transition-all cursor-pointer" onClick={() => { setCalendarViewMode('day'); setActiveTab('calendar'); }}>
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-sm shrink-0 transition-colors ${currentBlock ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  <i className={`fa-solid ${currentBlock ? 'fa-hourglass-start animate-pulse' : 'fa-bed'}`}></i>
                </div>
                <div>
                  <Typography variant="tiny" className="text-orange-500 mb-0.5 font-black uppercase tracking-widest text-[7px] md:text-[9px]">Зараз за планом</Typography>
                  <Typography variant="h2" className="text-base md:text-2xl text-slate-800 leading-tight">{currentBlock?.title || 'Вільний час'}</Typography>
                  <span className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {currentBlock ? `${currentBlock.startHour}:00 — ${currentBlock.endHour}:00` : 'Спокій та відпочинок'}
                  </span>
                </div>
              </Card>

              <Card padding="sm" className="lg:col-span-5 bg-white border-slate-100 flex items-center gap-3 md:gap-4 group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                  <i className="fa-solid fa-lightbulb text-xs md:text-base"></i>
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] md:text-[11px] font-bold text-slate-600 leading-tight line-clamp-2 italic">"{randomInsight}"</p>
                </div>
              </Card>
            </div>

            {mainTab === 'tasks' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
                 <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    <section className="space-y-3">
                       <Typography variant="tiny" className="font-black uppercase text-[8px] md:text-[9px] px-1 tracking-widest text-slate-400">Активні квести</Typography>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {activeQuests.map(task => (
                            <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-3 p-3 md:p-4 bg-white border-slate-100 hover:border-orange-200 transition-all cursor-pointer shadow-sm rounded-xl md:rounded-2xl">
                              <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-4.5 h-4.5 md:w-5 md:h-5 rounded-md md:rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                                <i className="fa-solid fa-check text-[8px] md:text-[10px]"></i>
                              </button>
                              <div className="flex-1 min-w-0 text-left">
                                 <div className="text-[11px] md:text-xs font-bold text-slate-700 truncate">{task.title}</div>
                                 <div className="text-[6px] md:text-[7px] font-black uppercase text-slate-300 mt-0.5">{task.priority} • {projects.find(p => p.id === task.projectId)?.name || 'Вхідні'}</div>
                              </div>
                            </Card>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-3">
                       <Typography variant="tiny" className="font-black uppercase text-[8px] md:text-[9px] px-1 tracking-widest text-slate-400">Дисципліна</Typography>
                       <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {dailyHabits.slice(0, 9).map(habit => {
                             const isDone = habit.habitHistory?.[dateStr]?.status === 'completed';
                             return (
                               <button key={habit.id} onClick={() => toggleHabitStatus(habit.id, dateStr, isDone ? 'none' : 'completed')}
                                className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all flex flex-col items-center gap-1.5 md:gap-2 ${isDone ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                                 <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[10px] md:text-xs ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50'}`}>
                                    <i className={`fa-solid ${isDone ? 'fa-check' : 'fa-repeat'}`}></i>
                                 </div>
                                 <span className="text-[7px] md:text-[8px] font-black uppercase text-center leading-tight truncate w-full">{habit.title}</span>
                               </button>
                             );
                          })}
                       </div>
                    </section>
                 </div>

                 <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    <section className="space-y-3">
                       <Typography variant="tiny" className="font-black uppercase text-[8px] md:text-[9px] px-1 tracking-widest flex items-center gap-2 text-slate-400">
                          <i className="fa-solid fa-radar text-orange-500"></i> Радар (30д)
                       </Typography>
                       <div className="space-y-2">
                          {upcomingEvents.map(ev => (
                            <div key={ev.id} className="p-2.5 md:p-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl flex items-center gap-3 shadow-sm group hover:border-orange-200 transition-all text-left">
                               <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 ${ev.type === 'birthday' ? 'bg-amber-50 text-amber-500' : 'bg-pink-50 text-pink-500'}`}>
                                  <i className={`fa-solid ${ev.type === 'birthday' ? 'fa-cake-candles' : 'fa-calendar-star'} text-[9px] md:text-[10px]`}></i>
                               </div>
                               <div className="min-w-0">
                                  <div className="text-[9px] md:text-[10px] font-black text-slate-700 truncate">{ev.title}</div>
                                  <div className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase">{new Date(ev.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-3">
                       <Typography variant="tiny" className="font-black uppercase text-[8px] md:text-[9px] px-1 tracking-widest flex items-center gap-2 text-slate-400">
                          <i className="fa-solid fa-user-group text-indigo-500"></i> Соціалізація
                       </Typography>
                       <div className="grid grid-cols-2 gap-2">
                          {people.slice(0, 2).map(p => (
                            <Card key={p.id} padding="none" className="p-2 md:p-3 bg-white border-slate-100 rounded-xl md:rounded-2xl flex flex-col items-center text-center cursor-pointer" onClick={() => { setActiveTab('people'); }}>
                               <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-6 h-6 md:w-8 md:h-8 rounded-full mb-1.5 bg-slate-50" />
                               <span className="text-[7px] md:text-[8px] font-black text-slate-700 uppercase truncate w-full">{p.name}</span>
                               <span className="text-[5px] md:text-[6px] font-bold text-slate-300 uppercase">HP: {p.rating}</span>
                            </Card>
                          ))}
                       </div>
                    </section>
                 </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 space-y-6">
                 <div className="flex justify-between items-center px-1">
                   <Typography variant="tiny" className="font-black uppercase tracking-widest text-[8px]">Період</Typography>
                   <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                     {(['day', 'week', 'month'] as const).map(p => (
                       <button key={p} onClick={() => setProgressPeriod(p)}
                         className={`px-3 md:px-6 py-1 md:py-2 text-[8px] md:text-[9px] font-black uppercase rounded-md transition-all ${progressPeriod === p ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                         {p === 'day' ? 'Д' : p === 'week' ? 'Т' : 'М'}
                       </button>
                     ))}
                   </div>
                 </div>

                 <Card className="bg-white border-slate-100 p-4 md:p-8 shadow-sm rounded-2xl md:rounded-[2.5rem]">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
                     {spheres.map(sphere => {
                       const val = (character.stats as any)[sphere.key] || 0;
                       return (
                         <div key={sphere.key} className="space-y-2 md:space-y-4">
                           <div className="flex justify-between items-end">
                             <span className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{sphere.label}</span>
                             <span className="text-sm md:text-xl font-black text-slate-800">{val}%</span>
                           </div>
                           <div className="h-1 md:h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                             <div className={`h-full transition-all duration-1000 ${
                               sphere.color === 'rose' ? 'bg-rose-500' :
                               sphere.color === 'indigo' ? 'bg-indigo-500' :
                               sphere.color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'
                             }`} style={{ width: `${val}%` }}></div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   
                   <div className="mt-6 md:mt-12 pt-6 md:pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                         <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-lg font-black">{cycle.globalExecutionScore}%</div>
                         <div>
                            <Typography variant="tiny" className="text-slate-400 font-black text-[7px] md:text-[9px]">Глобальний KPI</Typography>
                         </div>
                      </div>
                      <button 
                        onClick={handleAiAnalysis}
                        disabled={isAiAnalyzing}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50"
                      >
                        {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-orange-400"></i>}
                        ШІ Аналіз {progressPeriod}
                      </button>
                   </div>
                 </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex h-full border-l border-slate-100 z-[110] bg-white shrink-0 transition-all duration-300 ${selectedTaskId ? 'translate-x-0' : 'translate-x-full absolute'}`} style={{ width: selectedTaskId ? detailsWidth : 0 }}>
        {selectedTaskId && (
          <>
            <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
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
