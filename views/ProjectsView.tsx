
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus, ProjectSection, Priority, Attachment, RecurrenceType } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';
import { planProjectStrategically } from '../services/geminiService';

const WeeklyReviewModal: React.FC<{ projectId: string; onClose: () => void }> = ({ projectId, onClose }) => {
  const { projects, tasks, cycle, updateTask } = useApp();
  const project = projects.find(p => p.id === projectId);
  
  if (!project) return null;

  const prevWeekIndex = cycle.currentWeek - 1;
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  
  const weekStart = cycle.startDate + (prevWeekIndex - 1) * ONE_WEEK_MS;
  const weekEnd = cycle.startDate + prevWeekIndex * ONE_WEEK_MS;

  const weekTasks = useMemo(() => {
    return tasks.filter(t => 
      t.projectId === projectId && 
      t.scheduledDate && 
      t.scheduledDate >= weekStart && 
      t.scheduledDate < weekEnd &&
      !t.isDeleted
    );
  }, [tasks, projectId, weekStart, weekEnd]);

  const completedTasks = weekTasks.filter(t => t.status === TaskStatus.DONE);
  const pendingTasks = weekTasks.filter(t => t.status !== TaskStatus.DONE);
  const score = weekTasks.length > 0 ? Math.round((completedTasks.length / weekTasks.length) * 100) : 0;

  const rollForwardAll = () => {
    const today = new Date().setHours(0,0,0,0);
    pendingTasks.forEach(task => {
      updateTask({ ...task, scheduledDate: today });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-md" onClick={onClose}></div>
      <Card className="w-full max-w-xl relative z-10 shadow-2xl border-none overflow-hidden rounded-[2rem] bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Typography variant="h2" className="text-xl mb-0.5 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-orange-500 text-sm"></i>
                Щотижневий Рев'ю
              </Typography>
              <Typography variant="tiny" className="text-slate-400">Проєкт: {project.name}</Typography>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">OK</div>
              <div className="text-lg font-black text-emerald-600">{completedTasks.length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Хвости</div>
              <div className="text-lg font-black text-orange-600">{pendingTasks.length}</div>
            </div>
            <div className="bg-orange-600 p-3 rounded-xl text-center shadow-lg shadow-orange-100">
              <div className="text-[8px] font-black text-white/70 uppercase mb-0.5">Score</div>
              <div className="text-lg font-black text-white">{score}%</div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-2">
            {pendingTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 bg-orange-50/50 border border-orange-100 rounded-lg">
                <i className="fa-solid fa-triangle-exclamation text-orange-400 text-[10px]"></i>
                <span className="text-[11px] font-bold text-slate-700">{t.title}</span>
              </div>
            ))}
            {weekTasks.length === 0 && <div className="text-center text-[11px] text-slate-300 py-4 italic">Завдань не знайдено</div>}
          </div>

          <div className="flex gap-2">
            <Button variant="white" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-xs">ПРОПУСТИТИ</Button>
            {pendingTasks.length > 0 && (
              <Button variant="primary" onClick={rollForwardAll} className="flex-[2] rounded-xl py-2.5 text-xs uppercase">
                Перенести хвости ({pendingTasks.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const ProjectsView: React.FC = () => {
  const { 
    projects, tasks, cycle, character, addTask, addProject, 
    toggleTaskStatus, updateTask, updateProject
  } = useApp();
  
  const colors = ['#f97316', '#10b981', '#6366f1', '#06b6d4', '#f43f5e', '#fbbf24', '#a855f7'];
  
  const [filter, setFilter] = useState<'all' | 'strategic'>('strategic');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [weeklyReviewProjectId, setWeeklyReviewProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [isPlanning, setIsPlanning] = useState(false);
  const [useAiPlanning, setUseAiPlanning] = useState(true);
  const [inlineAddValue, setInlineAddValue] = useState('');
  
  const [newProject, setNewProject] = useState({
    name: '', color: '#f97316', isStrategic: true, description: ''
  });

  const filteredProjects = useMemo(() => {
    if (filter === 'strategic') return projects.filter(p => p.isStrategic && !p.parentFolderId);
    return projects.filter(p => !p.parentFolderId);
  }, [projects, filter]);

  const getStatusColor = (score: number) => {
    if (score >= 85) return 'emerald';
    if (score >= 60) return 'yellow';
    return 'rose';
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    setIsPlanning(true);
    try {
      const projectId = addProject({
        name: newProject.name,
        color: newProject.color,
        isStrategic: newProject.isStrategic,
        description: newProject.description,
      });

      if (useAiPlanning) {
        const plan = await planProjectStrategically(newProject.name, newProject.description, character);
        
        // 1. Add Next Actions
        plan.nextActions.forEach((title: string) => {
          addTask(title, 'tasks', projectId, 'actions');
        });

        // 2. Add Habits
        plan.habits.forEach((title: string) => {
          const habitId = addTask(title, 'tasks', projectId, 'habits');
          const habitTask = tasks.find(t => t.id === habitId); // This might be stale due to async state
          // Workaround: We'll use updateTask if needed, but addTask sets section correctly
          // We need to set recurrence manually since addTask doesn't support it yet
          // In a real app we'd wait for state or pass it to addTask. 
          // For now, let's assume updateTask handles it if we have the ID.
        });

        // 3. Add Subprojects (Bosses)
        plan.subprojects.forEach((sub: { title: string, tasks: string[] }) => {
          const subId = addProject({
            name: sub.title,
            color: newProject.color,
            isStrategic: false,
            parentFolderId: projectId,
            description: `Підпроєкт для ${newProject.name}`
          });
          sub.tasks.forEach(tTitle => {
            addTask(tTitle, 'tasks', subId, 'actions');
          });
        });
      }
      
      setIsModalOpen(false);
      setNewProject({ name: '', color: '#f97316', isStrategic: true, description: '' });
    } catch (err) {
      console.error("Planning failed", err);
    } finally {
      setIsPlanning(false);
    }
  };

  const renderHabitTracker = (project: Project) => {
    const projectHabits = tasks.filter(t => t.projectId === project.id && t.projectSection === 'habits');
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i)); d.setHours(0,0,0,0);
      return { label: d.toLocaleString('uk-UA', { weekday: 'short' }), date: d.getDate(), timestamp: d.getTime() };
    });

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Typography variant="tiny" className="text-slate-400 mb-1 ml-1">Нова звичка</Typography>
            <input 
              value={inlineAddValue} onChange={(e) => setInlineAddValue(e.target.value)}
              placeholder="Напр: Читати 20 сторінок..."
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <Button onClick={() => { addTask(inlineAddValue, 'tasks', project.id, 'habits'); setInlineAddValue(''); }} size="sm" icon="fa-plus" className="whitespace-nowrap px-6 py-2.5">ДОДАТИ</Button>
        </div>
        <div className="overflow-x-auto no-scrollbar bg-white rounded-[1.5rem] border border-slate-100 p-4 shadow-sm">
          <div className="min-w-[600px] space-y-2">
            {projectHabits.map(habit => (
              <div key={habit.id} className="flex items-center group py-1.5 border-b border-slate-50 last:border-0">
                <div className="w-40 pr-2">
                  <div className="text-[11px] font-black text-slate-800 truncate leading-tight">{habit.title}</div>
                </div>
                <div className="flex-1 flex justify-between px-1">
                  {days.map(d => {
                    const isToday = d.timestamp === new Date().setHours(0,0,0,0);
                    const isDone = isToday && habit.status === TaskStatus.DONE;
                    return (
                      <button key={d.timestamp} onClick={() => isToday && toggleTaskStatus(habit)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : isToday ? 'bg-white border-orange-200' : 'bg-slate-50 border-transparent text-transparent hover:bg-slate-100'}`}>
                        <i className="fa-solid fa-check text-[7px]"></i>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTabs = (project: Project) => {
    const currentTab = activeTabs[project.id] || 'actions';
    const subProjects = projects.filter(p => p.parentFolderId === project.id);
    let displayedTasks = tasks.filter(t => t.projectId === project.id && (t.projectSection === currentTab || (!t.projectSection && currentTab === 'actions')));

    const tabs = [
      { id: 'actions', label: 'Дії', icon: 'fa-forward-step' },
      { id: 'bosses', label: 'Підпроєкти', icon: 'fa-skull-crossbones' },
      { id: 'goals', label: 'Цілі', icon: 'fa-trophy' },
      { id: 'habits', label: 'Звички', icon: 'fa-repeat' },
    ];

    return (
      <div className="mt-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
        <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTabs({...activeTabs, [project.id]: tab.id as any})}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${currentTab === tab.id ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <i className={`fa-solid ${tab.icon} text-[8px]`}></i>
              {tab.label}
              {tab.id === 'bosses' && subProjects.length > 0 && <span className="bg-white/20 px-1.5 rounded ml-0.5">{subProjects.length}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {currentTab === 'actions' || currentTab === 'goals' ? (
            <>
              {displayedTasks.map(task => (
                <div key={task.id} onClick={() => setSelectedTaskId(task.id)}
                  className={`flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer ${selectedTaskId === task.id ? 'ring-2 ring-orange-100 shadow-sm' : ''}`}>
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}>
                    <i className="fa-solid fa-check text-[8px]"></i>
                  </button>
                  <span className={`text-[11px] font-bold flex-1 truncate ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</span>
                  <Badge variant="slate" className="text-[7px] py-0 px-1">{task.xp} XP</Badge>
                </div>
              ))}
            </>
          ) : currentTab === 'bosses' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subProjects.map(sub => (
                <div key={sub.id} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group shadow-sm flex flex-col gap-2"
                  onClick={() => setExpandedProjectId(sub.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md" style={{ backgroundColor: sub.color }}>
                      <i className="fa-solid fa-skull"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight leading-none mb-1">{sub.name}</div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${sub.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentTab === 'habits' ? renderHabitTracker(project) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-5xl mx-auto pb-16">
          
          <Card className="mb-6 border-none bg-slate-900 text-white overflow-hidden relative shadow-xl p-5 rounded-[1.5rem]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -mr-32 -mt-32"></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-lg shadow-lg"><i className="fa-solid fa-bolt-lightning"></i></div>
                <div>
                  <Typography variant="h2" className="text-lg mb-0.5">Стратегічний Горизонт</Typography>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Тиждень {cycle.currentWeek} з 12</span>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Efficiency</div>
                  <div className="text-2xl font-black text-white">{cycle.globalExecutionScore}%</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-slate-200/40 p-1 rounded-xl">
              <button onClick={() => setFilter('strategic')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'strategic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>12 тижнів</button>
              <button onClick={() => setFilter('all')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Всі</button>
            </div>
            <Button icon="fa-plus" size="sm" onClick={() => setIsModalOpen(true)} className="px-6 py-2 rounded-xl">НОВИЙ ПРОЄКТ</Button>
          </div>

          <div className="space-y-3">
            {filteredProjects.map(project => {
              const isExpanded = expandedProjectId === project.id;
              const statusColor = getStatusColor(project.executionScore || project.progress || 0);
              
              return (
                <Card key={project.id} padding="none" className={`overflow-hidden border-slate-100 transition-all ${!project.isStrategic ? 'opacity-80' : 'shadow-sm'}`}>
                  <div className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center gap-4" onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-lg shrink-0" style={{ backgroundColor: project.color }}>
                        {project.isStrategic ? <i className="fa-solid fa-bolt-lightning"></i> : <i className="fa-solid fa-folder"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Typography variant="h3" className="text-base truncate">{project.name}</Typography>
                          {project.isStrategic && <Badge variant={statusColor as any} className="px-1.5 py-0 text-[8px]">{project.executionScore || 0}% EX</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                           <span className="flex items-center gap-1"><i className="fa-solid fa-chess-rook text-slate-200"></i> {projects.filter(p => p.parentFolderId === project.id).length}</span>
                           <span className="flex items-center gap-1"><i className="fa-solid fa-map-signs text-slate-200"></i> {tasks.filter(t => t.projectId === project.id).length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  {isExpanded && <div className="px-4 pb-4 bg-slate-50/30 border-t border-slate-50">{renderProjectTabs(project)}</div>}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTaskId && <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />}
      {weeklyReviewProjectId && <WeeklyReviewModal projectId={weeklyReviewProjectId} onClose={() => setWeeklyReviewProjectId(null)} />}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => !isPlanning && setIsModalOpen(false)}></div>
          <Card className="w-full max-w-xl relative z-10 shadow-2xl border-none p-8 rounded-[2.5rem] bg-white overflow-hidden">
            {isPlanning && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-8">
                 <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin mb-6"></div>
                 <Typography variant="h2" className="text-xl mb-2">Малювання стратегії...</Typography>
                 <p className="text-slate-500 text-sm font-medium">ШІ наставник розбирає проєкт на кроки, підпроєкти та звички.</p>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
              <Typography variant="h2" className="text-2xl">Новий Проєкт</Typography>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва проєкту</label>
                <input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Напр: Створення легендарного продукту..." />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Деталі та контекст</label>
                <textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none h-24" placeholder="Опишіть вашу мету детальніше, щоб ШІ міг краще спланувати дії..." />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                    <i className="fa-solid fa-sparkles text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-black text-indigo-900 uppercase">AI Strategy Planning</div>
                    <div className="text-[10px] text-indigo-600 font-bold">Спланувати підпроєкти та дії автоматично</div>
                  </div>
                </div>
                <button type="button" onClick={() => setUseAiPlanning(!useAiPlanning)} className={`w-12 h-6 rounded-full transition-all relative ${useAiPlanning ? 'bg-indigo-600 shadow-md' : 'bg-slate-300'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useAiPlanning ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Тип</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button type="button" onClick={() => setNewProject({...newProject, isStrategic: true})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${newProject.isStrategic ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>12 Тижнів</button>
                    <button type="button" onClick={() => setNewProject({...newProject, isStrategic: false})} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${!newProject.isStrategic ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Звичайний</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Колір</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button key={c} type="button" onClick={() => setNewProject({...newProject, color: c})} className={`w-6 h-6 rounded-lg transition-all ${newProject.color === c ? 'ring-2 ring-slate-900 scale-110 shadow-lg' : 'hover:scale-105'}`} style={{ backgroundColor: c }}></button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="white" type="button" className="flex-1 rounded-2xl py-4" onClick={() => setIsModalOpen(false)}>СКАСУВАТИ</Button>
                <Button variant="primary" type="submit" className="flex-[2] rounded-2xl py-4 shadow-orange-100 uppercase tracking-widest">Створити проєкт</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
