
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus, ProjectSection, Priority, Attachment, RecurrenceType } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';

const WeeklyReviewModal: React.FC<{ projectId: string; onClose: () => void }> = ({ projectId, onClose }) => {
  const { projects, tasks, cycle, updateTask } = useApp();
  const project = projects.find(p => p.id === projectId);
  
  if (!project) return null;

  // Calculate the previous week's boundaries
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
    alert(`Перенесено ${pendingTasks.length} завдань на сьогодні!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 tiktok-blur animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      <Card className="w-full max-w-2xl relative z-10 shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Typography variant="h2" className="text-2xl mb-1 flex items-center gap-3">
                <i className="fa-solid fa-calendar-check text-orange-500"></i>
                Щотижневий Рев'ю
              </Typography>
              <Typography variant="caption" className="text-slate-400">Проєкт: {project.name} • Тиждень {prevWeekIndex}</Typography>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all border border-slate-100">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Виконано</div>
              <div className="text-2xl font-black text-emerald-600">{completedTasks.length}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Залишилось</div>
              <div className="text-2xl font-black text-orange-600">{pendingTasks.length}</div>
            </div>
            <div className="bg-orange-600 p-4 rounded-2xl text-center shadow-lg shadow-orange-100">
              <div className="text-[10px] font-black text-white/70 uppercase mb-1">Ефективність</div>
              <div className="text-2xl font-black text-white">{score}%</div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-8 space-y-4">
            {pendingTasks.length > 0 && (
              <div>
                <Typography variant="tiny" className="text-orange-500 mb-2 px-2">Незавершені квести (хвіст)</Typography>
                <div className="space-y-2">
                  {pendingTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                      <i className="fa-solid fa-triangle-exclamation text-orange-400 text-xs"></i>
                      <span className="text-xs font-bold text-slate-700">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {completedTasks.length > 0 && (
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-2 px-2">Перемоги минулого тижня</Typography>
                <div className="space-y-2">
                  {completedTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl opacity-60">
                      <i className="fa-solid fa-circle-check text-emerald-500 text-xs"></i>
                      <span className="text-xs font-bold text-slate-700 line-through">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weekTasks.length === 0 && (
              <div className="py-10 text-center opacity-30 italic text-sm">
                Минулого тижня не було запланованих завдань для цього проєкту.
              </div>
            )}
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
            </div>
            <div className="text-xs font-medium text-indigo-900 leading-relaxed">
              <strong>Порада:</strong> Перенесіть незавершені завдання на сьогодні, щоб не втрачати імпульс. В 12-тижневому році кожна година на вагу золота.
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="white" onClick={onClose} className="flex-1 rounded-2xl py-4">ПРОПУСТИТИ</Button>
            {pendingTasks.length > 0 && (
              <Button variant="primary" onClick={rollForwardAll} className="flex-[2] rounded-2xl py-4 shadow-orange-200 uppercase">
                Перенести хвости ({pendingTasks.length})
              </Button>
            )}
            {pendingTasks.length === 0 && weekTasks.length > 0 && (
              <Button variant="primary" onClick={onClose} className="flex-[2] rounded-2xl py-4 shadow-orange-200">ЗАВЕРШИТИ РЕВ'Ю</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const ProjectsView: React.FC = () => {
  const { 
    projects, tasks, cycle, setActiveTab, addProject, 
    moveTaskToProjectSection, setProjectParent, toggleTaskStatus,
    scheduleTask, updateTask, updateProject
  } = useApp();
  
  const colors = ['#f97316', '#10b981', '#6366f1', '#06b6d4', '#f43f5e', '#fbbf24', '#a855f7'];
  
  const [filter, setFilter] = useState<'all' | 'strategic'>('strategic');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [fullscreenProjectId, setFullscreenProjectId] = useState<string | null>(null);
  const [weeklyReviewProjectId, setWeeklyReviewProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<{ projectId: string, tab: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  
  const [filterAttachmentsMap, setFilterAttachmentsMap] = useState<Record<string, boolean>>({});
  const [isAddingBossMap, setIsAddingBossMap] = useState<Record<string, boolean>>({});
  const [newBossName, setNewBossName] = useState('');
  const [inlineAddValue, setInlineAddValue] = useState('');
  const [inlineAddType, setInlineAddType] = useState<'task' | 'boss'>('task');
  
  // Habits specific state
  const [newHabitRecurrence, setNewHabitRecurrence] = useState<RecurrenceType>('daily');

  const [plannerWeekOffset, setPlannerWeekOffset] = useState(0);
  const [plannerViewMode, setPlannerViewMode] = useState<'day' | 'week' | 'month' | 'agenda'>('week');

  const [newProject, setNewProject] = useState({
    name: '',
    color: '#f97316',
    isStrategic: true,
    kpiTitle: '',
    kpiTarget: 0,
    kpiUnit: '',
    description: ''
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

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    addProject({
      name: newProject.name,
      color: newProject.color,
      isStrategic: newProject.isStrategic,
      description: newProject.description,
      kpiTitle: newProject.isStrategic ? newProject.kpiTitle : undefined,
      kpiTarget: newProject.isStrategic ? Number(newProject.kpiTarget) : undefined,
      kpiCurrent: newProject.isStrategic ? 0 : undefined,
      kpiUnit: newProject.isStrategic ? newProject.kpiUnit : undefined,
    });

    setIsModalOpen(false);
    setNewProject({
      name: '', color: '#f97316', isStrategic: true, kpiTitle: '', kpiTarget: 0, kpiUnit: '', description: ''
    });
  };

  const handleInlineAdd = (projectId: string, section: ProjectSection) => {
    if (!inlineAddValue.trim()) return;
    
    if (inlineAddType === 'task') {
      const isHabit = section === 'habits';
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: inlineAddValue,
        status: TaskStatus.NEXT_ACTION,
        priority: Priority.NUI,
        difficulty: 1,
        xp: isHabit ? 25 : 100,
        tags: isHabit ? ['habit'] : [],
        projectId: projectId,
        projectSection: section,
        createdAt: Date.now(),
        category: 'task',
        recurrence: isHabit ? newHabitRecurrence : 'none',
        scheduledDate: isHabit ? new Date().setHours(0,0,0,0) : undefined
      };
      updateTask(newTask); 
    } else {
      addProject({
        name: inlineAddValue,
        color: projects.find(p => p.id === projectId)?.color || '#f97316',
        isStrategic: false,
        parentFolderId: projectId
      });
    }
    setInlineAddValue('');
  };

  const handleAddSubProject = (parentId: string) => {
    if (!newBossName.trim()) {
      setIsAddingBossMap({ ...isAddingBossMap, [parentId]: false });
      return;
    }
    
    addProject({
      name: newBossName,
      color: projects.find(p => p.id === parentId)?.color || '#f97316',
      isStrategic: false,
      parentFolderId: parentId,
      description: "Підпроєкт стратегічної цілі"
    });
    
    setNewBossName('');
    setIsAddingBossMap({ ...isAddingBossMap, [parentId]: false });
  };

  const handleAdjustProgress = (projectId: string, amount: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newProgress = Math.min(100, Math.max(0, project.progress + amount));
    updateProject({ ...project, progress: newProgress });
  };

  const handleTabChange = (projectId: string, tab: 'actions' | 'bosses' | 'goals' | 'habits' | 'planner') => {
    setActiveTabs(prev => ({ ...prev, [projectId]: tab }));
  };

  const onDragStart = (e: React.DragEvent, id: string, type: 'task' | 'project') => {
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, projectId: string, tab: string) => {
    e.preventDefault();
    setDragOverTab({ projectId, tab });
  };

  const onDrop = (e: React.DragEvent, projectId: string, tab: 'actions' | 'bosses' | 'goals' | 'habits' | 'planner') => {
    e.preventDefault();
    setDragOverTab(null);
    const id = e.dataTransfer.getData('id');
    const type = e.dataTransfer.getData('type');

    if (type === 'task') {
      if (tab === 'actions' || tab === 'goals' || tab === 'habits' || tab === 'planner') {
        moveTaskToProjectSection(id, tab as ProjectSection);
      }
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateTask({ ...task, projectId: projectId, projectSection: tab as ProjectSection });
      }
    } else if (type === 'project') {
      if (id !== projectId) {
        setProjectParent(id, projectId);
      }
    }
  };

  const handleDayDrop = (e: React.DragEvent, dayTimestamp: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const id = e.dataTransfer.getData('id');
    const type = e.dataTransfer.getData('type');
    if (type === 'task') {
      scheduleTask(id, dayTimestamp);
    }
  };

  const toggleAttachmentFilter = (projectId: string) => {
    setFilterAttachmentsMap(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const renderHabitTracker = (project: Project) => {
    const projectHabits = tasks.filter(t => t.projectId === project.id && t.projectSection === 'habits');
    
    // Generate last 14 days
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      d.setHours(0,0,0,0);
      return {
        label: d.toLocaleString('uk-UA', { weekday: 'short' }),
        date: d.getDate(),
        timestamp: d.getTime()
      };
    });

    return (
      <div className="space-y-6">
        {/* Habit Creation Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Typography variant="tiny" className="text-slate-400 mb-2 ml-2">Нова звичка</Typography>
            <input 
              value={inlineAddValue}
              onChange={(e) => setInlineAddValue(e.target.value)}
              placeholder="Напр: Читати 20 сторінок..."
              onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd(project.id, 'habits')}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all shadow-inner"
            />
          </div>
          <div className="w-full md:w-auto">
            <Typography variant="tiny" className="text-slate-400 mb-2 ml-2">Повторення</Typography>
            <select 
              value={newHabitRecurrence}
              onChange={(e) => setNewHabitRecurrence(e.target.value as RecurrenceType)}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
            >
              <option value="daily">Щодня</option>
              <option value="weekdays">Робочі дні</option>
              <option value="weekly">Щотижня</option>
              <option value="monthly">Щомісяця</option>
            </select>
          </div>
          <div className="pt-6 w-full md:w-auto">
            <Button onClick={() => handleInlineAdd(project.id, 'habits')} size="lg" icon="fa-plus" className="w-full whitespace-nowrap">
              СТВОРИТИ ЗВИЧКУ
            </Button>
          </div>
        </div>

        {/* Habits Grid */}
        <div className="overflow-x-auto no-scrollbar bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="min-w-[800px]">
            <div className="flex items-center mb-6 px-4">
              <div className="w-48"></div>
              <div className="flex-1 flex justify-between px-2">
                {days.map(d => (
                  <div key={d.timestamp} className="w-8 text-center">
                    <div className="text-[8px] font-black text-slate-300 uppercase mb-1">{d.label}</div>
                    <div className="text-[10px] font-bold text-slate-400">{d.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {projectHabits.map(habit => (
                <div key={habit.id} className="flex items-center group">
                  <div className="w-48 pr-4">
                    <div className="text-sm font-black text-slate-800 truncate leading-tight mb-1">{habit.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="orange" className="text-[8px] py-0">{habit.recurrence === 'daily' ? 'Щодня' : habit.recurrence}</Badge>
                      <span className="text-[9px] font-bold text-slate-400">🔥 0 днів</span>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-between px-2 items-center">
                    {days.map(d => {
                      const isToday = d.timestamp === new Date().setHours(0,0,0,0);
                      // In a real app we'd check a completion history array. 
                      // For this demo, we use the task status for "Today".
                      const isDoneToday = isToday && habit.status === TaskStatus.DONE;
                      
                      return (
                        <button 
                          key={d.timestamp}
                          onClick={() => isToday && toggleTaskStatus(habit)}
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                            isDoneToday 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' 
                              : isToday 
                                ? 'bg-white border-orange-200 hover:border-orange-400 text-transparent' 
                                : 'bg-slate-50 border-transparent text-transparent hover:bg-slate-100'
                          }`}
                        >
                          <i className="fa-solid fa-check text-[10px]"></i>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {projectHabits.length === 0 && (
                <div className="py-12 text-center">
                   <i className="fa-solid fa-seedling text-slate-100 text-5xl mb-4"></i>
                   <Typography variant="body" className="text-slate-300 italic">Жодних звичок ще не створено для цього проєкту.</Typography>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Motivation Card */}
        <Card blur className="bg-gradient-to-br from-orange-500 to-pink-500 !text-white border-none relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <Typography variant="h3" className="mb-2">Дисципліна — це магія успіху</Typography>
                <p className="text-white/80 text-xs font-bold leading-relaxed max-w-md">Звички в 12-тижневому циклі важать більше, ніж разові подвиги. Кожен клік сьогодні — це +25 XP у твій стратегічний розвиток.</p>
              </div>
              <Button variant="white" className="shadow-2xl">АНАЛІЗУВАТИ ПРОГРЕС <i className="fa-solid fa-chart-line ml-2"></i></Button>
           </div>
        </Card>
      </div>
    );
  };

  const renderProjectPlanner = (project: Project, isFullscreen: boolean = false) => {
    let projectTasks = tasks.filter(t => t.projectId === project.id).sort((a, b) => a.createdAt - b.createdAt);
    
    if (filterAttachmentsMap[project.id]) {
      projectTasks = projectTasks.filter(t => t.attachments && t.attachments.length > 0);
    }

    const now = new Date();
    const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    startOfCurrentWeek.setHours(0,0,0,0);
    const visibleStart = new Date(startOfCurrentWeek);
    visibleStart.setDate(startOfCurrentWeek.getDate() + (plannerWeekOffset * 7));
    const numDays = plannerViewMode === 'day' ? 1 : plannerViewMode === 'month' ? 31 : 7;

    const visibleDays = Array.from({ length: numDays }, (_, i) => {
      const d = new Date(visibleStart);
      d.setDate(visibleStart.getDate() + i);
      return {
        label: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()],
        timestamp: d.getTime(),
        date: d.getDate(),
        month: d.toLocaleString('uk-UA', { month: 'short' })
      };
    });

    const monthName = visibleStart.toLocaleString('uk-UA', { month: 'long', year: 'numeric' });

    return (
      <div className={`mt-6 animate-in slide-in-from-bottom-4 duration-500 ${isFullscreen ? 'max-w-none w-full' : ''}`}>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 bg-white/50 p-4 rounded-[2rem] border border-slate-100 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Typography variant="h3" className="text-slate-800 capitalize">{monthName}</Typography>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button onClick={() => setPlannerWeekOffset(prev => prev - 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
              <button onClick={() => setPlannerWeekOffset(0)} className="px-3 text-[10px] font-black uppercase text-slate-500 hover:text-orange-600 transition-colors">Сьогодні</button>
              <button onClick={() => setPlannerWeekOffset(prev => prev + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
            </div>
          </div>
          
          <div className="flex bg-slate-100 rounded-xl p-1">
            {[
              { id: 'day', label: 'День' },
              { id: 'week', label: 'Тиждень' },
              { id: 'month', label: 'Місяць' },
              { id: 'agenda', label: 'Список' }
            ].map(v => (
              <button 
                key={v.id}
                onClick={() => setPlannerViewMode(v.id as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${plannerViewMode === v.id ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isFullscreen ? 'xl:grid-cols-5' : 'lg:grid-cols-4'} gap-8`}>
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between px-2">
              <Typography variant="tiny" className="text-slate-400">Шлях виконання</Typography>
              <Badge variant="orange">{projectTasks.filter(t => t.status === TaskStatus.DONE).length}/{projectTasks.length}</Badge>
            </div>
            
            <div className="relative space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-3">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>
              {projectTasks.map((task, idx) => {
                const isDone = task.status === TaskStatus.DONE;
                const isCurrent = !isDone && (idx === 0 || projectTasks[idx-1].status === TaskStatus.DONE);
                
                return (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id, 'task')}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`relative z-10 flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-white border-orange-200 shadow-xl shadow-orange-100/50 scale-[1.02]' 
                        : isDone ? 'bg-slate-50 border-transparent opacity-40' : 'bg-white border-slate-100 hover:border-orange-100'
                    }`}
                  >
                    <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <i className="fa-solid fa-check"></i> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-bold leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${isFullscreen ? 'xl:col-span-4' : 'lg:col-span-3'} space-y-4`}>
            {plannerViewMode === 'agenda' ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-4 shadow-sm">
                <Typography variant="tiny" className="text-slate-400 border-b border-slate-50 pb-4">Найближчий розклад</Typography>
                {tasks.filter(t => t.projectId === project.id && t.scheduledDate && (!filterAttachmentsMap[project.id] || (t.attachments && t.attachments.length > 0))).sort((a,b) => (a.scheduledDate||0) - (b.scheduledDate||0)).map(task => (
                  <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-6 group cursor-pointer hover:bg-slate-50 p-4 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                    <div className="w-12 text-center">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(task.scheduledDate!).toLocaleString('uk-UA', { weekday: 'short' })}</div>
                       <div className="text-xl font-black text-slate-900">{new Date(task.scheduledDate!).getDate()}</div>
                    </div>
                    <div className="w-px h-10 bg-slate-100"></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-700">{task.title}</div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 group-hover:text-orange-400 translate-x-0 group-hover:translate-x-1 transition-all"></i>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 ${plannerViewMode === 'month' ? 'grid-cols-7' : plannerViewMode === 'day' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-7'}`}>
                {visibleDays.map(day => {
                  const plannedTasks = tasks.filter(t => t.projectId === project.id && t.scheduledDate === day.timestamp && (!filterAttachmentsMap[project.id] || (t.attachments && t.attachments.length > 0)));
                  const isToday = new Date().toDateString() === new Date(day.timestamp).toDateString();
                  const isOver = dragOverDay === day.timestamp;
                  
                  return (
                    <div 
                      key={day.timestamp}
                      onDragOver={(e) => { e.preventDefault(); setDragOverDay(day.timestamp); }}
                      onDragLeave={() => setDragOverDay(null)}
                      onDrop={(e) => handleDayDrop(e, day.timestamp)}
                      className={`min-h-[220px] rounded-[2rem] border flex flex-col transition-all overflow-hidden ${
                        isToday ? 'bg-orange-50/20 border-orange-200 shadow-2xl shadow-orange-100/20 ring-1 ring-orange-100' : isOver ? 'bg-orange-100 border-orange-400 scale-[1.03] z-10 shadow-xl' : 'bg-white border-slate-100 hover:shadow-lg hover:shadow-slate-100'
                      } ${isFullscreen ? 'min-w-[140px]' : ''}`}
                    >
                      <div className={`p-4 text-center border-b ${isToday ? 'bg-orange-100/50 border-orange-100' : 'bg-slate-50/50 border-slate-50'}`}>
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-orange-600' : 'text-slate-400'}`}>{day.label}</div>
                        <div className={`text-xl font-black leading-none flex items-center justify-center gap-1 ${isToday ? 'text-orange-700' : 'text-slate-900'}`}>
                          {day.date}
                        </div>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                        {plannedTasks.map(task => (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, task.id, 'task')}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`group relative p-3 rounded-2xl text-[10px] font-bold border transition-all cursor-pointer ${
                              task.status === TaskStatus.DONE 
                                ? 'bg-slate-50 border-transparent text-slate-300' 
                                : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200 shadow-sm hover:scale-[1.02]'
                            }`}
                          >
                            <div className="truncate pr-4">{task.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectTabs = (project: Project, isFullscreen: boolean = false) => {
    const currentTab = activeTabs[project.id] || 'actions';
    const subProjects = projects.filter(p => p.parentFolderId === project.id);
    
    let displayedTasks = tasks.filter(t => t.projectId === project.id && (t.projectSection === currentTab || (!t.projectSection && currentTab === 'actions')));
    if (filterAttachmentsMap[project.id]) {
      displayedTasks = displayedTasks.filter(t => t.attachments && t.attachments.length > 0);
    }

    const allProjectAttachments = tasks
      .filter(t => t.projectId === project.id)
      .flatMap(t => t.attachments || [])
      .filter((att, index, self) => self.findIndex(a => a.id === att.id) === index);

    const tabs = [
      { id: 'planner', label: 'Планувальник', icon: 'fa-calendar-week' },
      { id: 'actions', label: 'Наступні дії', icon: 'fa-forward-step' },
      { id: 'bosses', label: 'Підпроєкти', icon: 'fa-skull-crossbones' },
      { id: 'goals', label: 'Цілі тижня', icon: 'fa-trophy' },
      { id: 'habits', label: 'Звички', icon: 'fa-repeat' },
    ];

    return (
      <div className={`mt-6 border-t border-slate-100 pt-6 animate-in slide-in-from-top-4 duration-300 ${isFullscreen ? 'max-w-none' : ''}`}>
        <div className="flex gap-1 mb-8 overflow-x-auto no-scrollbar pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(project.id, tab.id as any)}
              onDragOver={(e) => onDragOver(e, project.id, tab.id)}
              onDrop={(e) => onDrop(e, project.id, tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                currentTab === tab.id 
                  ? 'bg-orange-600 text-white shadow-xl shadow-orange-100' 
                  : dragOverTab?.projectId === project.id && dragOverTab?.tab === tab.id
                    ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                    : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
              {tab.id === 'bosses' && subProjects.length > 0 && (
                <span className="bg-white/20 px-2 rounded-md ml-1">{subProjects.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[300px] space-y-4">
          {currentTab === 'habits' ? renderHabitTracker(project) : (
            <>
              {(currentTab === 'actions' || currentTab === 'goals') && (
                <div className="flex gap-3 mb-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 items-center">
                     <input 
                       value={inlineAddValue}
                       onChange={(e) => setInlineAddValue(e.target.value)}
                       placeholder={`Назва ${currentTab === 'actions' ? 'наступного кроку' : 'цілі тижня'}...`}
                       onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd(project.id, currentTab)}
                       className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all shadow-inner"
                     />
                     <Button onClick={() => handleInlineAdd(project.id, currentTab)} size="lg" icon="fa-plus">
                        ДОДАТИ
                     </Button>
                </div>
              )}

              {currentTab === 'bosses' && (
                <div className={`grid grid-cols-1 ${isFullscreen ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-2'} gap-6`}>
                  {subProjects.map(sub => (
                    <div 
                      key={sub.id} 
                      draggable
                      onDragStart={(e) => onDragStart(e, sub.id, 'project')}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-100/20 transition-all cursor-pointer group shadow-sm flex flex-col justify-between relative overflow-hidden"
                      onClick={(e) => { e.stopPropagation(); setExpandedProjectId(sub.id); }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:bg-orange-50 group-hover:opacity-100 transition-all"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl ring-4 ring-white" style={{ backgroundColor: sub.color }}>
                            <i className="fa-solid fa-skull"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-black text-slate-900 truncate uppercase tracking-widest leading-none mb-1.5">{sub.name}</div>
                            <Badge variant="slate" className="bg-slate-900 text-white border-none">LVL {Math.floor(sub.progress / 10) + 1} BOSS</Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                              <span>Загальний Прогрес</span>
                              <span className="text-orange-600">{sub.progress}%</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-1000" style={{ width: `${sub.progress}%` }}></div>
                           </div>
                           
                           <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-slate-50">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAdjustProgress(sub.id, -5); }}
                                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                              >
                                <i className="fa-solid fa-minus text-[10px]"></i>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAdjustProgress(sub.id, 5); }}
                                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                              >
                                <i className="fa-solid fa-plus text-[10px]"></i>
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="col-span-1">
                    {isAddingBossMap[project.id] ? (
                      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-orange-300 shadow-xl shadow-orange-100/50 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                        <Typography variant="tiny" className="text-orange-600 font-black">Назва підпроєкту</Typography>
                        <input 
                          autoFocus
                          value={newBossName}
                          onChange={(e) => setNewBossName(e.target.value)}
                          placeholder="Напр: Дизайн персонажів..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubProject(project.id)}
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-400"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddSubProject(project.id)} className="flex-1 bg-orange-600 text-white py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-orange-100">Створити</button>
                          <button onClick={() => setIsAddingBossMap({...isAddingBossMap, [project.id]: false})} className="flex-1 bg-slate-100 text-slate-500 py-2 rounded-xl text-[10px] font-black uppercase">Скасувати</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingBossMap({...isAddingBossMap, [project.id]: true})}
                        className="w-full h-full min-h-[220px] rounded-[2.5rem] border-4 border-dashed border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center gap-4 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-90 transition-all">
                          <i className="fa-solid fa-plus text-slate-300 group-hover:text-orange-500"></i>
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-orange-400">+ Підпроєкт</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {currentTab === 'planner' ? renderProjectPlanner(project, isFullscreen) : (
                <div className="space-y-3">
                  {displayedTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id, 'task')}
                      className={`group flex items-center gap-5 bg-white p-5 rounded-[2rem] border transition-all cursor-pointer ${
                        selectedTaskId === task.id ? 'border-orange-400 ring-8 ring-orange-50 shadow-2xl scale-[1.01]' : 'border-slate-100 hover:border-orange-200 hover:shadow-xl'
                      }`}
                      onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                          task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent hover:border-orange-400'
                        }`}
                      >
                        <i className="fa-solid fa-check text-[12px]"></i>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-black truncate tracking-wide ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </div>
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 opacity-40">
                             <i className="fa-solid fa-paperclip text-[9px]"></i>
                             <span className="text-[9px] font-bold">{task.attachments.length} files</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="slate" className="font-mono text-xs">{task.xp} XP</Badge>
                        <i className="fa-solid fa-grip-vertical text-slate-200 text-base"></i>
                      </div>
                    </div>
                  ))}
                  {displayedTasks.length === 0 && (
                    <div className="py-20 text-center">
                      <i className="fa-solid fa-wind text-slate-100 text-5xl mb-4"></i>
                      <p className="text-slate-300 italic text-sm">{filterAttachmentsMap[project.id] ? "No tasks with attachments found." : "This path is currently clear."}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {allProjectAttachments.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-100">
               <div className="flex items-center justify-between mb-6 px-4">
                  <div className="flex items-center gap-3">
                     <i className="fa-solid fa-folder-open text-orange-400"></i>
                     <Typography variant="tiny" className="text-slate-900 font-black">Ресурси та активи проєкту</Typography>
                  </div>
                  <Badge variant="slate" className="bg-slate-900 text-white border-none">{allProjectAttachments.length} FILES</Badge>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {allProjectAttachments.map(att => (
                    <button key={att.id} className="group p-4 bg-white rounded-3xl border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/20 transition-all text-center">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-50 transition-colors">
                          <i className={`fa-solid ${att.type.includes('image') ? 'fa-image' : 'fa-file-lines'} text-slate-300 group-hover:text-orange-500`}></i>
                       </div>
                       <div className="text-[10px] font-bold text-slate-700 truncate w-full">{att.name}</div>
                       <div className="text-[8px] font-black text-slate-300 uppercase mt-1">{(att.size / 1024).toFixed(0)} KB</div>
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FullscreenProject = ({ projectId, onClose }: { projectId: string, onClose: () => void }) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    const statusColor = project.isStrategic ? getStatusColor(project.executionScore || 0) : 'slate';

    return (
      <div className="fixed inset-0 z-[110] bg-slate-950 flex animate-in fade-in duration-300">
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center shadow-lg z-20">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-2xl" style={{ backgroundColor: project.color }}>
                <i className={`fa-solid ${project.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'}`}></i>
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <Typography variant="h1" className="text-slate-900 text-5xl">{project.name}</Typography>
                  {project.isStrategic && <Badge variant={statusColor as any} className="px-4 py-1.5 text-xs font-black ring-4 ring-slate-50">{project.executionScore || 0}% Execution</Badge>}
                </div>
                <Typography variant="body" className="text-slate-400 mt-2 font-bold text-base">{project.description || 'Стратегічний проєкт 12-тижневого циклу розвитку'}</Typography>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="white" size="lg" icon="fa-compress" onClick={onClose} className="px-8 py-4">ЗАКРИТИ ІМЕРСІЮ</Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-slate-50 to-slate-50">
            <div className="w-full max-w-[95vw] mx-auto">
              {renderProjectTabs(project, true)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-20">
          
          {/* Cycle Dashboard */}
          <Card blur className="mb-10 border-none bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 !text-white overflow-hidden relative shadow-2xl ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/10 blur-[120px] -mr-60 -mt-60"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="orange" icon="fa-calendar-check" className="bg-orange-600 border-none text-white px-3 py-1 text-[11px]">12 Week Cycle</Badge>
                  <div className="h-4 w-px bg-slate-700"></div>
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">Тиждень {cycle.currentWeek} з 12</span>
                </div>
                <Typography variant="h1" className="text-5xl mb-2">Стратегічний Горизонт</Typography>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">Ваш шлях до майстерності розділений на 12 етапів. Концентруйтеся на виконанні, а не на плануванні.</p>
              </div>
              <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
                <div className="text-center">
                  <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Cycle Score</div>
                  <div className="text-5xl font-black text-white">{cycle.globalExecutionScore}%</div>
                </div>
                <div className="w-px h-16 bg-slate-700"></div>
                <div className="flex -space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-orange-600 flex items-center justify-center text-sm font-black shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"><i className="fa-solid fa-bolt-lightning text-white"></i></div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-10">
            <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] backdrop-blur-sm border border-slate-200">
              <button onClick={() => setFilter('strategic')} className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${filter === 'strategic' ? 'bg-white shadow-2xl text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>12 тижнів</button>
              <button onClick={() => setFilter('all')} className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white shadow-2xl text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Усі проєкти</button>
            </div>
            <Button icon="fa-plus" size="lg" onClick={() => setIsModalOpen(true)} className="shadow-2xl shadow-orange-200 py-4 px-10 rounded-[1.5rem]">НОВИЙ ПРОЄКТ</Button>
          </div>

          <div className="space-y-8">
            {filteredProjects.map(project => {
              const isExpanded = expandedProjectId === project.id;
              const statusColor = project.isStrategic ? getStatusColor(project.executionScore || 0) : getStatusColor(project.progress || 0);
              const displayProgress = project.isStrategic && project.kpiTarget && project.kpiTarget > 0 
                ? Math.round((project.kpiCurrent! / project.kpiTarget!) * 100) 
                : project.progress;
              
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const totalAttachments = projectTasks.reduce((acc, t) => acc + (t.attachments?.length || 0), 0);

              const isFilteringAttachments = filterAttachmentsMap[project.id];

              return (
                <Card 
                  key={project.id} 
                  padding="none"
                  hover
                  className={`overflow-hidden border-slate-200 transition-all ${!project.isStrategic ? 'opacity-70' : 'ring-1 ring-slate-200 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]'}`}
                >
                  <div className="p-8 cursor-pointer flex flex-col md:flex-row md:items-center gap-8" onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}>
                    <div className="flex-1 flex items-center gap-6">
                      <div 
                        draggable 
                        onDragStart={(e) => onDragStart(e, project.id, 'project')}
                        className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl text-white shadow-2xl cursor-grab active:cursor-grabbing transform transition-all group-hover:scale-105 active:scale-95" 
                        style={{ backgroundColor: project.color }}
                      >
                        {project.isStrategic ? <i className="fa-solid fa-bolt-lightning"></i> : <i className="fa-solid fa-folder"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                          <Typography variant="h3" className="text-slate-900 text-2xl truncate">{project.name}</Typography>
                          {project.isStrategic && <Badge variant={statusColor as any} className="px-3 py-1">{project.executionScore || 0}% EX</Badge>}
                        </div>
                        <div className="flex items-center gap-6 text-[12px] font-bold text-slate-400">
                          <span className="flex items-center gap-2"><i className="fa-solid fa-map-signs text-slate-300"></i> {projectTasks.length} кроків шляху</span>
                          <span className="flex items-center gap-2"><i className="fa-solid fa-chess-rook text-slate-300"></i> {projects.filter(p => p.parentFolderId === project.id).length} підпроєктів</span>
                          
                          {totalAttachments > 0 && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!isExpanded) setExpandedProjectId(project.id);
                                toggleAttachmentFilter(project.id);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                                isFilteringAttachments 
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xl shadow-orange-200/50 scale-105' 
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50'
                              }`}
                            >
                              <i className={`fa-solid ${isFilteringAttachments ? 'fa-filter' : 'fa-paperclip'} text-[10px]`}></i>
                              <span className="font-black uppercase tracking-tighter">{totalAttachments} Вкладень</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 max-w-md space-y-3">
                       <div className="flex justify-between items-end">
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                           {project.isStrategic ? project.kpiTitle : 'Загальний прогрес'}
                         </span>
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-orange-600">{displayProgress}%</span>
                            {project.isStrategic && (
                              <span className="text-sm font-black text-slate-900">{project.kpiCurrent} / {project.kpiTarget} {project.kpiUnit}</span>
                            )}
                         </div>
                       </div>
                       <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-4 ring-slate-50">
                          <div className={`h-full transition-all duration-1000 bg-${statusColor === 'yellow' ? 'yellow-500' : statusColor === 'rose' ? 'rose-500' : 'emerald-500'}`} style={{ width: `${displayProgress}%` }}></div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {project.isStrategic && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setWeeklyReviewProjectId(project.id); }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600 bg-orange-50 hover:bg-orange-100 transition-all border border-orange-100 shadow-sm"
                          title="Щотижневий Рев'ю"
                        >
                          <i className="fa-solid fa-calendar-check text-sm"></i>
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFullscreenProjectId(project.id); }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all border border-slate-100 shadow-sm"
                        title="Відкрити імерсивний вид"
                      >
                        <i className="fa-solid fa-expand-arrows-alt text-sm"></i>
                      </button>
                      <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform p-3 ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-10 pb-10 bg-slate-50/50 border-t border-slate-50">
                      {isFilteringAttachments && (
                        <div className="flex items-center gap-3 mt-6 px-4 py-3 bg-orange-600 text-white rounded-2xl animate-in slide-in-from-top-2 shadow-lg shadow-orange-100">
                           <i className="fa-solid fa-filter text-xs"></i>
                           <span className="text-[11px] font-black uppercase tracking-widest">Відображаються лише завдання з вкладеннями</span>
                           <button onClick={() => toggleAttachmentFilter(project.id)} className="ml-auto text-[10px] font-black bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-all uppercase">Скинути</button>
                        </div>
                      )}
                      {renderProjectTabs(project)}
                      <div className="mt-12 flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                         <div className="flex gap-8">
                            <button className="text-[12px] font-black text-orange-600 hover:underline flex items-center gap-2.5"><i className="fa-solid fa-diagram-project"></i> Mental Map</button>
                            <button className="text-[12px] font-black text-slate-400 hover:text-slate-600 flex items-center gap-2.5"><i className="fa-solid fa-scroll"></i> Chronicle</button>
                         </div>
                         <Button size="md" variant="secondary" onClick={() => setActiveTab('inbox')} className="px-8 rounded-2xl">PROCESS INBOX</Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetails 
          task={tasks.find(t => t.id === selectedTaskId)!} 
          onClose={() => setSelectedTaskId(null)} 
        />
      )}

      {fullscreenProjectId && (
        <FullscreenProject 
          projectId={fullscreenProjectId} 
          onClose={() => setFullscreenProjectId(null)} 
        />
      )}

      {weeklyReviewProjectId && (
        <WeeklyReviewModal 
          projectId={weeklyReviewProjectId} 
          onClose={() => setWeeklyReviewProjectId(null)} 
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 tiktok-blur animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <Card className="w-full max-w-3xl relative z-10 shadow-[0_100px_150px_-50px_rgba(0,0,0,0.3)] border-none animate-in zoom-in-95 duration-200 overflow-hidden rounded-[3rem]">
            <div className="p-12">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <Typography variant="h2" className="text-4xl mb-2">Нова Стратегічна Ціль</Typography>
                  <Typography variant="body" className="text-slate-400 font-bold tracking-tight">Налаштуйте параметри свого наступного великого квесту.</Typography>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-3xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all border border-slate-100 shadow-sm"><i className="fa-solid fa-xmark text-lg"></i></button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-10">
                <div className="space-y-8">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 block">Назва кампанії</label>
                    <input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} placeholder="Наприклад: Підкорення Web3 горизонту..." className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 px-8 text-lg font-bold focus:ring-4 focus:ring-orange-100 focus:bg-white outline-none transition-all shadow-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 block">Масштаб</label>
                      <div className="flex p-2 bg-slate-100 rounded-[2rem] border border-slate-200 shadow-inner">
                        <button type="button" onClick={() => setNewProject({...newProject, isStrategic: true})} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${newProject.isStrategic ? 'bg-white shadow-2xl text-orange-600' : 'text-slate-400'}`}>12 Тижнів</button>
                        <button type="button" onClick={() => setNewProject({...newProject, isStrategic: false})} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${!newProject.isStrategic ? 'bg-white shadow-2xl text-slate-900' : 'text-slate-400'}`}>Звичайний</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3 block">Геральдика (Колір)</label>
                      <div className="flex flex-wrap gap-3 max-w-[220px]">
                        {colors.map(c => (
                          <button key={c} type="button" onClick={() => setNewProject({...newProject, color: c})} className={`w-11 h-11 rounded-2xl border-4 transition-all hover:scale-110 active:scale-90 shadow-lg ${newProject.color === c ? 'border-slate-900 ring-8 ring-slate-100' : 'border-transparent'}`} style={{ backgroundColor: c }}></button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 pt-10">
                  <Button variant="white" type="button" className="flex-1 py-5 rounded-[2rem] border-slate-200" onClick={() => setIsModalOpen(false)}>ВІДКЛАСТИ</Button>
                  <Button variant="primary" type="submit" className="flex-[2] py-5 rounded-[2rem] shadow-orange-300">РОЗПОЧАТИ КВЕСТ</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
