
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

  // 1. Вхідні для розбору
  const inboxCount = useMemo(() => 
    tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && !t.projectId && !t.scheduledDate && t.category !== 'note').length,
    [tasks]
  );

  // 2. Агрегація Квестів (Сьогодні + Next Actions з Проектів)
  const activeQuests = useMemo(() => {
    // Заплановані на сьогодні
    const scheduledToday = tasks.filter(t => 
      !t.isDeleted && 
      t.status !== TaskStatus.DONE && 
      t.scheduledDate === todayTimestamp && 
      t.projectSection !== 'habits'
    );

    // Наступні дії (Next Actions) з проектів, які ще не заплановані
    const projectNextActions = tasks.filter(t => 
      !t.isDeleted && 
      t.status === TaskStatus.NEXT_ACTION && 
      t.scheduledDate !== todayTimestamp && // уникаємо дублів
      t.projectSection !== 'habits'
    );

    // Сортування: спочатку події, потім за пріоритетом
    return [...scheduledToday, ...projectNextActions].sort((a, b) => {
      if (a.isEvent && !b.isEvent) return -1;
      if (!a.isEvent && b.isEvent) return 1;
      const priorityWeight = { [Priority.UI]: 4, [Priority.UNI]: 3, [Priority.NUI]: 2, [Priority.NUNI]: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });
  }, [tasks, todayTimestamp]);

  // 3. Звички
  const todayHabits = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );

  // 4. Поточний блок розпорядку
  const currentBlock = useMemo(() => {
    const dayOfWeek = currentTime.getDay();
    const hour = currentTime.getHours();
    return timeBlocks.find(b => b.dayOfWeek === dayOfWeek && hour >= b.startHour && hour < b.endHour);
  }, [timeBlocks, currentTime]);

  // 5. Радар подій (Події + ДН)
  const upcomingEvents = useMemo(() => {
    const events: any[] = [];
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // Завдання-події
    tasks.forEach(t => {
      if (!t.isDeleted && t.isEvent && t.scheduledDate && t.status !== TaskStatus.DONE) {
        const d = new Date(t.scheduledDate);
        if (d >= currentTime && d <= oneMonthLater) {
          events.push({ id: t.id, title: t.title, date: d, type: 'quest', icon: 'fa-calendar-star' });
        }
      }
    });

    // Люди
    people.forEach(p => {
      if (p.birthDate) {
        const bd = new Date(p.birthDate);
        const thisYearBd = new Date(currentTime.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYearBd >= currentTime && thisYearBd <= oneMonthLater) {
          events.push({ id: `bd-${p.id}`, title: `ДН: ${p.name}`, date: thisYearBd, type: 'birthday', icon: 'fa-cake-candles' });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [people, tasks, currentTime]);

  const stats = [
    { label: 'Золото', value: character.gold, icon: 'fa-coins', color: 'text-amber-500' },
    { label: 'XP', value: character.xp, icon: 'fa-bolt', color: 'text-orange-500' },
    { label: 'Цикл', value: `${cycle.currentWeek}/12`, icon: 'fa-calendar-week', color: 'text-indigo-500' },
    { label: 'KPI', value: `${cycle.globalExecutionScore}%`, icon: 'fa-chart-line', color: 'text-emerald-500' },
  ];

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="p-5 md:p-10 bg-white border-b border-slate-100 z-10 shrink-0">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Typography variant="h1" className="text-2xl md:text-4xl mb-0.5">Сьогодні</Typography>
              <Typography variant="caption" className="text-orange-500 font-black tracking-widest text-[8px] md:text-[10px]">
                {currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </div>
            
            <div className="flex gap-2 md:gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
              {stats.map(s => (
                <div key={s.label} className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 shrink-0">
                  <i className={`fa-solid ${s.icon} ${s.color} text-[10px]`}></i>
                  <div className="leading-tight">
                    <div className="text-[6px] font-black uppercase text-slate-400 leading-none">{s.label}</div>
                    <div className="text-[10px] font-black text-slate-800">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 bg-slate-50/50">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-32">
            
            {/* ЛІВА КОЛОНКА (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* ПОПЕРЕДЖЕННЯ ПРО ВХІДНІ */}
              {inboxCount > 0 && (
                <button onClick={() => setActiveTab('inbox')} className="w-full text-left animate-in fade-in slide-in-from-top-2 duration-500">
                  <Card className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 border-none shadow-lg shadow-orange-200 flex items-center justify-between group">
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
                  </Card>
                </button>
              )}

              {/* ПОТОЧНИЙ БЛОК РОЗПОРЯДКУ */}
              {currentBlock && (
                <section>
                  <Card className="bg-slate-900 text-white p-5 md:p-8 border-none shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-[60px] rounded-full"></div>
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-inner border border-white/10 shrink-0" style={{ backgroundColor: currentBlock.color || 'var(--primary)' }}>
                           <i className="fa-solid fa-hourglass-start animate-pulse"></i>
                        </div>
                        <div>
                           <Typography variant="tiny" className="text-orange-500 font-black mb-1 uppercase tracking-widest text-[8px]">Зараз у плані:</Typography>
                           <Typography variant="h2" className="text-lg md:text-2xl text-white leading-tight">{currentBlock.title}</Typography>
                           <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{currentBlock.startHour}:00 — {currentBlock.endHour}:00</div>
                        </div>
                     </div>
                  </Card>
                </section>
              )}

              {/* СПИСОК КВЕСТІВ (Агреговані) */}
              <section className="space-y-4">
                 <div className="flex justify-between items-end px-2">
                    <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest text-[9px]">Активні Квести та Дії</Typography>
                    <Badge variant="orange" className="text-[7px]">{activeQuests.length} У РОБОТІ</Badge>
                 </div>
                 <div className="space-y-2">
                    {activeQuests.length > 0 ? activeQuests.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        const isScheduled = task.scheduledDate === todayTimestamp;
                        
                        return (
                          <Card key={task.id} padding="none" onClick={() => setSelectedTaskId(task.id)} className={`bg-white border-slate-100 hover:border-orange-200 transition-all flex items-center gap-4 p-4 group cursor-pointer shadow-sm ${task.isEvent ? 'border-l-4 border-l-pink-500' : ''}`}>
                              <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 bg-slate-50 text-transparent hover:border-orange-400'}`}>
                                 <i className="fa-solid fa-check text-[10px]"></i>
                              </button>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                   <span className={`text-[13px] md:text-sm font-black truncate block ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{task.title}</span>
                                   {task.isEvent && <i className="fa-solid fa-calendar-star text-pink-500 text-[10px]"></i>}
                                 </div>
                                 <div className="flex items-center gap-2 flex-wrap">
                                    {project && <span className="text-[7px] font-black text-orange-500 uppercase tracking-tighter bg-orange-50 px-1 rounded"># {project.name}</span>}
                                    {!isScheduled && task.status === TaskStatus.NEXT_ACTION && <Badge variant="emerald" className="text-[6px] py-0">NEXT ACTION</Badge>}
                                    {task.priority === Priority.UI && <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>}
                                 </div>
                              </div>
                              <i className="fa-solid fa-chevron-right text-slate-200 text-[10px] group-hover:translate-x-1 transition-transform"></i>
                          </Card>
                        );
                    }) : (
                      <div className="py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-30">
                         <i className="fa-solid fa-mug-hot text-4xl mb-4"></i>
                         <p className="text-[10px] font-black uppercase">Всі квести закрито. Час для відпочинку</p>
                      </div>
                    )}
                 </div>
              </section>

              {/* ЗВИЧКИ */}
              <section className="space-y-4">
                 <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest px-2 text-[9px]">Дисципліна</Typography>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayHabits.map(habit => {
                      const isCompleted = habit.habitHistory?.[dateStr]?.status === 'completed';
                      return (
                        <Card key={habit.id} padding="none" className={`p-3.5 border transition-all flex items-center gap-4 ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                           <button 
                            onClick={() => toggleHabitStatus(habit.id, dateStr)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 ${isCompleted ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-orange-500'}`}
                           >
                             <i className={`fa-solid ${isCompleted ? 'fa-check' : 'fa-repeat'} text-[10px]`}></i>
                           </button>
                           <div className="flex-1 min-w-0">
                              <div className={`text-[11px] font-black uppercase tracking-tight truncate ${isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>{habit.title}</div>
                              <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Daily Routine</div>
                           </div>
                        </Card>
                      );
                    })}
                 </div>
              </section>
            </div>

            {/* ПРАВА КОЛОНКА (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* РАДАР ПОДІЙ */}
              <section className="space-y-4">
                <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest px-2 text-[9px]">Радар Подій (30 днів)</Typography>
                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 space-y-3 shadow-sm">
                   {upcomingEvents.length > 0 ? upcomingEvents.map(ev => {
                     const isToday = ev.date.toDateString() === currentTime.toDateString();
                     return (
                       <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${isToday ? 'bg-pink-50 border border-pink-100' : 'hover:bg-slate-50'}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${ev.type === 'birthday' ? 'bg-amber-500 text-white' : 'bg-pink-500 text-white'}`}>
                             <i className={`fa-solid ${ev.icon} text-[10px]`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-[10px] font-black text-slate-800 leading-tight mb-1 truncate">{ev.title}</div>
                             <div className="flex items-center justify-between">
                                <span className={`text-[7px] font-black uppercase ${isToday ? 'text-pink-600' : 'text-slate-400'}`}>
                                   {isToday ? 'СЬОГОДНІ' : ev.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                                </span>
                             </div>
                          </div>
                       </div>
                     );
                   }) : (
                     <p className="text-[9px] text-slate-300 italic text-center py-4 uppercase">Радар чистий</p>
                   )}
                </div>
              </section>

              {/* СТАТИСТИКА ГЕРОЯ */}
              <section className="space-y-4">
                <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest px-2 text-[9px]">Профіль</Typography>
                <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none p-6 shadow-xl relative overflow-hidden">
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
                            <div className="h-full bg-orange-500 shadow-[0_0_8px_#f97316]" style={{ width: `${character.energy}%` }}></div>
                         </div>
                      </div>
                      <div>
                         <div className="flex justify-between text-[7px] font-black uppercase mb-1 text-indigo-100"><span>Evolution</span><span>{character.xp % 1000}/1000</span></div>
                         <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${(character.xp % 1000) / 10}%` }}></div>
                         </div>
                      </div>
                   </div>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* ПАНЕЛЬ ДЕТАЛЕЙ */}
      <div className={`flex h-full border-l border-slate-100 z-[110] bg-white shrink-0 transition-all duration-300 ${window.innerWidth < 1024 ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isResizing && window.innerWidth >= 1024 && (
          <div onMouseDown={startResizing} className="w-[1px] h-full cursor-col-resize hover:bg-orange-500 transition-colors"></div>
        )}
        <div style={{ width: window.innerWidth < 1024 ? '100vw' : detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            !isResizing && window.innerWidth >= 1024 && (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none">
                 <i className="fa-solid fa-star text-8xl mb-8"></i>
                 <Typography variant="h2" className="text-xl font-black uppercase tracking-widest">Оберіть квест</Typography>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayView;
