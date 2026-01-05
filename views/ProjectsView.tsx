
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

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const weekEnd = new Date(now.setHours(0,0,0,0)).getTime();
  const weekStart = weekEnd - ONE_WEEK_MS;

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
              <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Виконано</div>
              <div className="text-lg font-black text-emerald-600">{completedTasks.length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Залишилось</div>
              <div className="text-lg font-black text-orange-600">{pendingTasks.length}</div>
            </div>
            <div className="bg-orange-600 p-3 rounded-xl text-center shadow-lg shadow-orange-100">
              <div className="text-[8px] font-black text-white/70 uppercase mb-0.5">Ефективність</div>
              <div className="text-lg font-black text-white">{score}%</div>
            </div>
          </div>

          <Typography variant="tiny" className="text-slate-400 mb-3 px-1 uppercase tracking-tighter font-black">Незавершені квести минулого тижня:</Typography>
          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-2">
            {pendingTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <i className="fa-solid fa-triangle-exclamation text-orange-400 text-[10px]"></i>
                <span className="text-[11px] font-bold text-slate-700">{t.title}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="white" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-widest">ЗАКРИТИ</Button>
            {pendingTasks.length > 0 && (
              <Button variant="primary" onClick={rollForwardAll} className="flex-[2] rounded-xl py-2.5 text-xs uppercase font-black tracking-widest">
                Перенести хвости ({pendingTasks.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Subproject Drawer Component with Integrated Add Task ---
const SubprojectDrawer: React.FC<{ 
  sub: Project, 
  tasks: Task[], 
  onClose: () => void, 
  onToggleStatus: (t: Task) => void, 
  onTaskClick: (tId: string) => void,
  onAddTask: (title: string) => void,
  selectedTaskId: string | null
}> = ({ sub, tasks, onClose, onToggleStatus, onTaskClick, onAddTask, selectedTaskId }) => {
  const [quickTitle, setQuickTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTitle.trim()) {
      onAddTask(quickTitle.trim());
      setQuickTitle('');
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col">
       <header className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-md" style={{ backgroundColor: sub.color }}>
                   <i className="fa-solid fa-skull-crossbones"></i>
                </div>
                <div>
                   <Typography variant="h3" className="text-sm truncate max-w-[140px] leading-none mb-1">{sub.name}</Typography>
                   <Typography variant="tiny" className="text-slate-400">Підпроєкт</Typography>
                </div>
             </div>
             <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-300 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <form onSubmit={handleAdd} className="relative group">
             <input 
               value={quickTitle}
               onChange={(e) => setQuickTitle(e.target.value)}
               placeholder="+ Додати квест..." 
               className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 text-[11px] font-bold focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-300"
             />
             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center hover:text-orange-500 transition-colors">
                <i className="fa-solid fa-plus text-[10px]"></i>
             </button>
          </form>
       </header>

       <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {tasks.map(t => {
            const isDone = t.status === TaskStatus.DONE;
            const isPromoted = t.status === TaskStatus.NEXT_ACTION;
            
            return (
              <div 
                key={t.id} 
                draggable 
                onDragStart={(e) => { e.dataTransfer.setData('taskId', t.id); }}
                className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedTaskId === t.id 
                    ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-50' 
                    : isDone 
                      ? 'bg-slate-50/30 border-slate-50 opacity-30 grayscale' 
                      : isPromoted 
                        ? 'bg-slate-100 border-slate-100 opacity-60' 
                        : 'bg-white border-slate-100 hover:border-orange-100 hover:shadow-sm'
                }`}
                onClick={() => onTaskClick(t.id)}
              >
                 <button onClick={(e) => { e.stopPropagation(); onToggleStatus(t); }} 
                   className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all ${
                     isDone 
                       ? 'bg-emerald-500 border-emerald-500 text-white' 
                       : 'border-slate-200 bg-slate-50 text-transparent hover:border-orange-400'
                   }`}>
                    <i className="fa-solid fa-check text-[8px]"></i>
                 </button>
                 <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {t.title}
                    </div>
                    {isPromoted && !isDone && (
                      <div className="text-[7px] font-black text-orange-500 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                        <i className="fa-solid fa-bolt"></i> В роботі
                      </div>
                    )}
                 </div>
                 <i className="fa-solid fa-grip-vertical text-[10px] text-slate-100 group-hover:text-slate-300"></i>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="py-20 text-center opacity-10 flex flex-col items-center gap-3">
               <i className="fa-solid fa-ghost text-4xl"></i>
               <span className="text-[9px] font-black uppercase">Порожньо</span>
            </div>
          )}
       </div>
       
       <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tasks.length} КВЕСТІВ</span>
          <div className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500" style={{ width: `${sub.progress}%` }}></div>
          </div>
       </div>
    </div>
  );
}

// --- Project Tabs Component (to avoid Hook errors inside loops) ---
const ProjectCardTabs: React.FC<{ 
  project: Project, 
  activeTabs: Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>,
  setActiveTabs: React.Dispatch<React.SetStateAction<Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>>>,
  onTaskClick: (tId: string) => void,
  onSubprojectClick: (sId: string) => void,
  selectedTaskId: string | null
}> = ({ project, activeTabs, setActiveTabs, onTaskClick, onSubprojectClick, selectedTaskId }) => {
  const { projects, tasks, addTask, updateTask, toggleTaskStatus } = useApp();
  const [inlineAddValue, setInlineAddValue] = useState('');

  const currentTab = activeTabs[project.id] || 'actions';
  const subProjects = projects.filter(p => p.parentFolderId === project.id);

  const displayedTasks = useMemo(() => {
    if (currentTab === 'actions') {
      const subProjectIds = subProjects.map(sp => sp.id);
      return tasks.filter(t => 
        !t.isDeleted && 
        ((t.projectId === project.id && (t.projectSection === 'actions' || !t.projectSection)) || 
         (subProjectIds.includes(t.projectId || '') && t.status === TaskStatus.NEXT_ACTION))
      );
    }
    return tasks.filter(t => !t.isDeleted && t.projectId === project.id && t.projectSection === currentTab);
  }, [tasks, project.id, currentTab, subProjects]);

  const onDropIntoActions = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTask({ ...task, status: TaskStatus.NEXT_ACTION, projectSection: 'actions' });
      }
    }
  };

  const tabs = [
    { id: 'actions', label: 'Дії', icon: 'fa-forward-step' },
    { id: 'bosses', label: 'Підпроєкти', icon: 'fa-skull-crossbones' },
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
        {currentTab === 'actions' ? (
          <div onDragOver={(e) => e.preventDefault()} onDrop={onDropIntoActions} className="min-h-[100px] space-y-2 rounded-2xl bg-slate-50/50 p-2">
            <div className="flex gap-2 mb-2">
              <input 
                value={inlineAddValue} 
                onChange={e => setInlineAddValue(e.target.value)} 
                placeholder="+ Додати дію..." 
                className="flex-1 bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-orange-100 outline-none" 
              />
              <button 
                onClick={() => { if(inlineAddValue) { addTask(inlineAddValue, 'tasks', project.id, 'actions'); setInlineAddValue(''); }}} 
                className="w-8 h-8 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-md hover:bg-orange-700 transition-colors"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
            {displayedTasks.map(task => {
              const isSubprojectTask = task.projectId !== project.id;
              const sourceSub = isSubprojectTask ? projects.find(p => p.id === task.projectId) : null;
              
              return (
                <div key={task.id} onClick={() => onTaskClick(task.id)} className={`flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer ${selectedTaskId === task.id ? 'ring-2 ring-orange-100 shadow-sm' : ''}`}>
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-bold truncate block ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</span>
                    {isSubprojectTask && (
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter flex items-center gap-1">
                        <i className="fa-solid fa-skull-crossbones text-[6px]"></i> {sourceSub?.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentTab === 'bosses' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div onClick={() => { const n = prompt('Назва підпроєкту:'); if(n) projects.length && addTask(n, 'tasks', project.id, 'bosses'); }}
              className="bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-orange-200 transition-all group min-h-[80px]">
               <i className="fa-solid fa-plus text-slate-300 group-hover:text-orange-500"></i>
               <span className="text-[9px] font-black uppercase text-slate-400">Додати підпроєкт</span>
            </div>
            {subProjects.map(sub => (
              <div key={sub.id} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer group shadow-sm flex flex-col gap-2"
                onClick={() => onSubprojectClick(sub.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md" style={{ backgroundColor: sub.color }}><i className="fa-solid fa-skull"></i></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight leading-none mb-1">{sub.name}</div>
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[8px] font-black text-slate-400">{tasks.filter(t => t.projectId === sub.id && !t.isDeleted).length} тасків</span>
                       <span className="text-[8px] font-black text-orange-500">{sub.progress}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${sub.progress}%` }}></div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentTab === 'habits' ? (
          <div className="space-y-2">
             <div onClick={() => { const h = prompt('Яку звичку впровадимо?'); if(h) addTask(h, 'tasks', project.id, 'habits'); }} className="p-3 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-orange-500 hover:border-orange-100 cursor-pointer">
                <i className="fa-solid fa-plus"></i><span className="text-[9px] font-black uppercase">Додати звичку</span>
             </div>
             {tasks.filter(t => !t.isDeleted && t.projectId === project.id && t.projectSection === 'habits').map(h => (
               <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold">{h.title}</span>
                  <Badge variant="orange" icon="fa-repeat">Daily</Badge>
               </div>
             ))}
          </div>
        ) : null}
      </div>
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
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  
  const [isPlanning, setIsPlanning] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '', color: '#f97316', isStrategic: true, description: '', type: 'goal' as any
  });

  const filteredProjects = useMemo(() => {
    if (filter === 'strategic') return projects.filter(p => p.type === 'goal' && !p.parentFolderId);
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
      addProject({
        name: newProject.name,
        color: newProject.color,
        isStrategic: newProject.isStrategic,
        description: newProject.description,
        type: newProject.type
      });
      setIsModalOpen(false);
      setNewProject({ name: '', color: '#f97316', isStrategic: true, description: '', type: 'goal' });
    } finally {
      setIsPlanning(false);
    }
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
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Цільова ієрархія</span>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Ефективність</div>
                  <div className="text-2xl font-black text-white">{cycle.globalExecutionScore}%</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-slate-200/40 p-1 rounded-xl">
              <button onClick={() => setFilter('strategic')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'strategic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Глобальні Цілі</button>
              <button onClick={() => setFilter('all')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Всі проєкти</button>
            </div>
            <Button icon="fa-plus" size="sm" onClick={() => setIsModalOpen(true)} className="px-6 py-2 rounded-xl">НОВА ЦІЛЬ</Button>
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
                        {project.type === 'goal' ? <i className="fa-solid fa-trophy"></i> : <i className="fa-solid fa-folder"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Typography variant="h3" className="text-base truncate">{project.name}</Typography>
                          {project.isStrategic && <Badge variant={statusColor as any} className="px-1.5 py-0 text-[8px]">{project.executionScore || 0}% EX</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                           <span className="flex items-center gap-1"><i className="fa-solid fa-skull-crossbones text-slate-200"></i> {projects.filter(p => p.parentFolderId === project.id).length} підпроєктів</span>
                           <span className="flex items-center gap-1"><i className="fa-solid fa-check-double text-slate-200"></i> {tasks.filter(t => t.projectId === project.id).length} дій</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {project.isStrategic && <button onClick={(e) => { e.stopPropagation(); setWeeklyReviewProjectId(project.id); }} className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-calendar-check"></i> Рев'ю</button>}
                      <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50/30 border-t border-slate-50">
                      <ProjectCardTabs 
                        project={project} 
                        activeTabs={activeTabs} 
                        setActiveTabs={setActiveTabs} 
                        onTaskClick={setSelectedTaskId}
                        onSubprojectClick={setActiveSubId}
                        selectedTaskId={selectedTaskId}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Double Sidebar Logic --- */}
      {activeSubId && (
        <SubprojectDrawer 
           sub={projects.find(p => p.id === activeSubId)!} 
           tasks={tasks.filter(t => t.projectId === activeSubId && !t.isDeleted)} 
           onClose={() => { setActiveSubId(null); setSelectedTaskId(null); }}
           onToggleStatus={toggleTaskStatus}
           onTaskClick={setSelectedTaskId}
           onAddTask={(title) => addTask(title, 'tasks', activeSubId, 'actions')}
           selectedTaskId={selectedTaskId}
        />
      )}

      {/* Narrow Task Details Sidebar when drawer is active */}
      {selectedTaskId && (
        <div className={`fixed top-0 h-full z-[115] bg-white border-l border-slate-100 shadow-2xl transition-all duration-300 ${activeSubId ? 'right-80 w-72' : 'right-0 w-[450px]'}`}>
           <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}

      {weeklyReviewProjectId && <WeeklyReviewModal projectId={weeklyReviewProjectId} onClose={() => setWeeklyReviewProjectId(null)} />}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => !isPlanning && setIsModalOpen(false)}></div>
          <Card className="w-full max-w-xl relative z-10 shadow-2xl border-none p-8 rounded-[2.5rem] bg-white overflow-hidden">
            <div className="flex justify-between items-center mb-8"><Typography variant="h2" className="text-2xl">Нова Глобальна Ціль</Typography><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button></div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва цілі</label><input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Напр: Створити капітал $10,000..." /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Чому це важливо?</label><textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none h-24" placeholder="Твоя мотивація для цієї цілі..." /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Колір</label><div className="flex flex-wrap gap-2">{colors.map(c => (<button key={c} type="button" onClick={() => setNewProject({...newProject, color: c})} className={`w-6 h-6 rounded-lg transition-all ${newProject.color === c ? 'ring-2 ring-slate-900 scale-110 shadow-lg' : 'hover:scale-105'}`} style={{ backgroundColor: c }}></button>))}</div></div></div>
              <div className="flex gap-4 pt-4"><Button variant="white" type="button" className="flex-1 rounded-2xl py-4" onClick={() => setIsModalOpen(false)}>СКАСУВАТИ</Button><Button variant="primary" type="submit" className="flex-[2] rounded-2xl py-4 shadow-orange-100 uppercase tracking-widest">АКТИВУВАТИ ЦІЛЬ</Button></div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
