
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, Task, TimeBlock, Priority } from '../types';
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
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const dateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const inboxCount = useMemo(() => 
    tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && !t.projectId && !t.scheduledDate && t.category !== 'note').length,
    [tasks]
  );

  const activeQuests = useMemo(() => {
    const scheduledToday = tasks.filter(t => 
      !t.isDeleted && 
      t.status !== TaskStatus.DONE && 
      t.scheduledDate === todayTimestamp && 
      t.projectSection !== 'habits'
    );

    const projectNextActions = tasks.filter(t => 
      !t.isDeleted && 
      t.status === TaskStatus.NEXT_ACTION && 
      t.scheduledDate !== todayTimestamp && 
      t.projectSection !== 'habits'
    );

    return [...scheduledToday, ...projectNextActions].sort((a, b) => {
      if (a.isEvent && !b.isEvent) return -1;
      if (!a.isEvent && b.isEvent) return 1;
      const priorityWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp]);

  const todayHabits = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );

  const currentBlock = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    const hour = currentTime.getHours();
    return timeBlocks.find(b => b.dayOfWeek === dayOfWeek && hour >= b.startHour && hour < b.endHour);
  }, [timeBlocks, currentTime]);

  const stats = [
    { label: 'Золото', value: character.gold, icon: 'fa-coins', color: 'text-amber-500' },
    { label: 'XP', value: character.xp, icon: 'fa-bolt', color: 'text-[var(--primary)]' },
    { label: 'Цикл', value: `${cycle.currentWeek}/12`, icon: 'fa-calendar-week', color: 'text-indigo-500' },
    { label: 'KPI', value: `${cycle.globalExecutionScore}%`, icon: 'fa-chart-line', color: 'text-emerald-500' },
  ];

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="p-5 md:p-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-10 shrink-0">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Typography variant="h1" className="text-2xl md:text-4xl mb-0.5">Сьогодні</Typography>
              <Typography variant="caption" className="text-[var(--primary)] font-black tracking-widest text-[8px] md:text-[10px]">
                {currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </div>
            
            <div className="flex gap-2 md:gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
              {stats.map(s => (
                <div key={s.label} className="bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] shadow-sm flex items-center gap-2 shrink-0">
                  <i className={`fa-solid ${s.icon} ${s.color} text-[10px]`}></i>
                  <div className="leading-tight">
                    <div className="text-[6px] font-black uppercase text-[var(--text-muted)] leading-none">{s.label}</div>
                    <div className="text-[10px] font-black text-[var(--text-main)]">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-32">
            
            <div className="lg:col-span-8 space-y-6">
              
              {inboxCount > 0 && (
                <button onClick={() => setActiveTab('inbox')} className="w-full text-left animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="bg-[var(--primary)] p-4 rounded-[var(--radius)] shadow-lg flex items-center justify-between group">
                    <div className="flex items-center gap-4 text-white">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                        <i className="fa-solid fa-inbox animate-bounce"></i>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Потрібна увага</div>
                        <div className="text-sm font-black">У вхідних накопичилось {inboxCount} квестів</div>
                      </div>
                    </div>
                    <i className="fa-solid fa-arrow-right text-white opacity-50 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </button>
              )}

              {currentBlock && (
                <section>
                  <div className="bg-[var(--bg-card)] border border-[var(--primary)]/30 p-5 md:p-8 rounded-[var(--radius)] shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-[60px] rounded-full"></div>
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-inner border border-white/10 shrink-0 text-white" style={{ backgroundColor: currentBlock.color || 'var(--primary)' }}>
                           <i className="fa-solid fa-hourglass-start animate-pulse"></i>
                        </div>
                        <div>
                           <Typography variant="tiny" className="text-[var(--primary)] font-black mb-1 uppercase tracking-widest text-[8px]">Зараз у плані:</Typography>
                           <Typography variant="h2" className="text-lg md:text-2xl leading-tight">{currentBlock.title}</Typography>
                           <div className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">{currentBlock.startHour}:00 — {currentBlock.endHour}:00</div>
                        </div>
                     </div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                 <div className="flex justify-between items-end px-2">
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-[9px]">Активні Квести та Дії</Typography>
                    <Badge variant="orange" className="text-[7px]">У РОБОТІ</Badge>
                 </div>
                 <div className="space-y-2">
                    {activeQuests.length > 0 ? activeQuests.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        return (
                          <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`flex items-center gap-4 p-4 group cursor-pointer hover:border-[var(--primary)]/50 ${task.isEvent ? 'border-l-4 border-l-pink-500' : ''}`}>
                              <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-transparent hover:border-[var(--primary)]'}`}>
                                 <i className="fa-solid fa-check text-[10px]"></i>
                              </button>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                   <span className={`text-[13px] md:text-sm font-black truncate block ${task.status === TaskStatus.DONE ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>{task.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2 flex-wrap">
                                    {project && <span className="text-[7px] font-black text-[var(--primary)] uppercase tracking-tighter bg-[var(--primary)]/5 px-1 rounded"># {project.name}</span>}
                                 </div>
                              </div>
                              <i className="fa-solid fa-chevron-right text-[var(--text-muted)] opacity-30 text-[10px] group-hover:translate-x-1 transition-transform"></i>
                          </Card>
                        );
                    }) : (
                      <div className="py-12 bg-[var(--bg-card)] rounded-[var(--radius)] border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center opacity-30">
                         <i className="fa-solid fa-mug-hot text-4xl mb-4"></i>
                         <p className="text-[10px] font-black uppercase">Всі квести закрито</p>
                      </div>
                    )}
                 </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <section className="space-y-4">
                <Typography variant="tiny" className="font-black uppercase tracking-widest px-2 text-[9px]">Профіль</Typography>
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[var(--radius)] p-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full"></div>
                   <div className="relative z-10 flex items-center gap-4 mb-6">
                      <img src={character.avatarUrl} className="w-10 h-10 rounded-xl bg-white/20 p-1 border border-white/20" />
                      <div>
                         <div className="text-xs font-black uppercase truncate max-w-[120px]">{character.name}</div>
                         <div className="text-[7px] font-black text-indigo-200 uppercase tracking-widest">LVL {character.level} {character.archetype}</div>
                      </div>
                   </div>
                   <div className="space-y-4 relative z-10">
                      <div>
                         <div className="flex justify-between text-[7px] font-black uppercase mb-1 text-indigo-100"><span>Energy</span><span>{character.energy}%</span></div>
                         <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${character.energy}%` }}></div>
                         </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${window.innerWidth < 1024 ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isResizing && window.innerWidth >= 1024 && (
          <div onMouseDown={startResizing} className="w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] transition-colors"></div>
        )}
        <div style={{ width: window.innerWidth < 1024 ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none">
               <i className="fa-solid fa-star text-8xl mb-8"></i>
               <Typography variant="h2" className="text-xl font-black uppercase tracking-widest">Оберіть квест</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayView;
