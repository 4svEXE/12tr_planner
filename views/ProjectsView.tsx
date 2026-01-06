
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus, ProjectSection, Priority } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';

// --- Tree Item Component for Structure View ---
const TreeItem: React.FC<{ 
  label: string; 
  icon: string; 
  iconColor: string; 
  level: number; 
  isExpanded?: boolean; 
  onToggle?: () => void; 
  onClick?: () => void; 
  children?: React.ReactNode;
  isActive?: boolean;
}> = ({ label, icon, iconColor, level, isExpanded, onToggle, onClick, children, isActive }) => {
  return (
    <div className="flex flex-col">
      <div 
        onClick={onClick || onToggle}
        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 group ${isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {children ? (
             <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle?.(); }}></i>
          ) : (
             <div className="w-3"></div>
          )}
          <i className={`fa-solid ${icon} text-[10px] w-4 text-center shrink-0`} style={{ color: iconColor }}></i>
          <span className={`text-[11px] truncate ${isActive ? 'font-black' : 'font-medium'}`}>{label}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
           <i className="fa-solid fa-ellipsis text-[10px] text-slate-300"></i>
        </div>
      </div>
      {isExpanded && children && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

const WeeklyReviewModal: React.FC<{ projectId: string; onClose: () => void }> = ({ projectId, onClose }) => {
  const { projects, tasks, updateTask } = useApp();
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-md" onClick={onClose}></div>
      <Card className="w-full max-w-xl relative z-10 shadow-2xl border-none overflow-hidden rounded-[2rem] bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Typography variant="h2" className="text-xl mb-0.5 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-orange-500"></i> Щотижневий Рев'ю
              </Typography>
              <Typography variant="tiny" className="text-slate-400">Ціль: {project.name}</Typography>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all"><i className="fa-solid fa-xmark text-xs"></i></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Виконано</div><div className="text-lg font-black text-emerald-600">{completedTasks.length}</div></div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"><div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Залишилось</div><div className="text-lg font-black text-orange-600">{pendingTasks.length}</div></div>
            <div className="bg-orange-600 p-3 rounded-xl text-center shadow-lg shadow-orange-100"><div className="text-[8px] font-black text-white/70 uppercase mb-0.5">Ефективність</div><div className="text-lg font-black text-white">{score}%</div></div>
          </div>
          <Typography variant="tiny" className="text-slate-400 mb-3 px-1 uppercase tracking-tighter font-black">Незавершені квести:</Typography>
          <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-2">
            {pendingTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <i className="fa-solid fa-triangle-exclamation text-orange-400 text-[10px]"></i>
                <span className="text-[11px] font-bold text-slate-700">{t.title}</span>
              </div>
            ))}
          </div>
          <Button variant="white" onClick={onClose} className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest">ЗАКРИТИ</Button>
        </div>
      </Card>
    </div>
  );
};

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
    if (quickTitle.trim()) { onAddTask(quickTitle.trim()); setQuickTitle(''); }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col">
       <header className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-md" style={{ backgroundColor: sub.color }}><i className="fa-solid fa-skull-crossbones"></i></div>
                <div>
                   <Typography variant="h3" className="text-sm truncate max-w-[140px] leading-none mb-1">{sub.name}</Typography>
                   <Typography variant="tiny" className="text-slate-400">Підпроєкт</Typography>
                </div>
             </div>
             <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-300 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <form onSubmit={handleAdd} className="relative group">
             <input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="+ Додати квест..." className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 text-[11px] font-bold focus:ring-2 focus:ring-orange-100 outline-none" />
             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center hover:text-orange-500"><i className="fa-solid fa-plus text-[10px]"></i></button>
          </form>
       </header>
       <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {tasks.map(t => {
            const isDone = t.status === TaskStatus.DONE;
            const isPromoted = t.status === TaskStatus.NEXT_ACTION;
            return (
              <div key={t.id} draggable onDragStart={(e) => { e.dataTransfer.setData('taskId', t.id); }} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selectedTaskId === t.id ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-50' : isDone ? 'opacity-30 grayscale' : isPromoted ? 'bg-slate-100 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-orange-100'}`} onClick={() => onTaskClick(t.id)}>
                 <button onClick={(e) => { e.stopPropagation(); onToggleStatus(t); }} className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                 <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</div>
                    {isPromoted && !isDone && <div className="text-[7px] font-black text-orange-500 uppercase tracking-tighter mt-0.5 flex items-center gap-1"><i className="fa-solid fa-bolt"></i> В роботі</div>}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
}

const ProjectCardTabs: React.FC<{ 
  project: Project, 
  activeTabs: Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>,
  setActiveTabs: React.Dispatch<React.SetStateAction<Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>>>,
  onTaskClick: (tId: string) => void,
  onSubprojectClick: (sId: string) => void,
  selectedTaskId: string | null
}> = ({ project, activeTabs, setActiveTabs, onTaskClick, onSubprojectClick, selectedTaskId }) => {
  const { projects, tasks, addTask, updateTask, toggleTaskStatus, addProject } = useApp();
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

  const tabs = [
    { id: 'actions', label: 'Дії', icon: 'fa-forward-step' },
    { id: 'bosses', label: 'Підпроєкти', icon: 'fa-skull-crossbones' },
    { id: 'habits', label: 'Звички', icon: 'fa-repeat' },
  ];

  const handleAddHabit = () => {
    const newHabitId = addTask('Нова звичка', 'tasks', project.id, 'habits');
    onTaskClick(newHabitId);
  };

  const handleAddSubproject = () => {
    const name = prompt('Назва підпроєкту (Boss):');
    if (name) {
      addProject({
        name,
        color: project.color,
        description: `Boss для цілі ${project.name}`,
        isStrategic: false,
        parentFolderId: project.id,
        type: 'subproject'
      });
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
      <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTabs({...activeTabs, [project.id]: tab.id as any})}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${currentTab === tab.id ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
            <i className={`fa-solid ${tab.icon} text-[8px]`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {currentTab === 'actions' ? (
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const tid = e.dataTransfer.getData('taskId'); if(tid) { const t = tasks.find(x => x.id === tid); if(t) updateTask({...t, status: TaskStatus.NEXT_ACTION, projectSection: 'actions', projectId: project.id}); } }} className="min-h-[100px] space-y-2 rounded-2xl bg-slate-50/50 p-2">
            <div className="flex gap-2 mb-2">
              <input value={inlineAddValue} onChange={e => setInlineAddValue(e.target.value)} placeholder="+ Додати дію..." className="flex-1 bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-bold" />
              <button onClick={() => { if(inlineAddValue) { addTask(inlineAddValue, 'tasks', project.id, 'actions'); setInlineAddValue(''); }}} className="w-8 h-8 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-md"><i className="fa-solid fa-plus text-[10px]"></i></button>
            </div>
            {displayedTasks.map(task => {
              const isSubTask = task.projectId !== project.id;
              return (
                <div key={task.id} onClick={() => onTaskClick(task.id)} className={`flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer ${selectedTaskId === task.id ? 'ring-2 ring-orange-100' : ''}`}>
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-bold truncate block ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</span>
                    {isSubTask && <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter flex items-center gap-1"><i className="fa-solid fa-skull-crossbones text-[6px]"></i> {projects.find(p => p.id === task.projectId)?.name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentTab === 'bosses' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div onClick={handleAddSubproject} className="bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white min-h-[100px] transition-all group">
               <i className="fa-solid fa-plus text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all"></i>
               <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-orange-600">Додати підпроєкт</span>
            </div>
            {subProjects.map(sub => (
              <div key={sub.id} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer shadow-sm flex flex-col gap-2 group" onClick={() => onSubprojectClick(sub.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg group-hover:scale-105 transition-transform" style={{ backgroundColor: sub.color }}><i className="fa-solid fa-skull"></i></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight leading-none mb-1">{sub.name}</div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${sub.progress}%` }}></div>
                    </div>
                    <div className="mt-1 text-[7px] font-black text-slate-300 uppercase">{tasks.filter(t => t.projectId === sub.id && !t.isDeleted).length} квестів</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentTab === 'habits' ? (
          <div className="space-y-2">
             <button 
               onClick={handleAddHabit} 
               className="w-full p-3 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50/10 hover:border-orange-200 transition-all cursor-pointer"
             >
                <i className="fa-solid fa-plus-circle"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Впровадити нову звичку</span>
             </button>
             {tasks.filter(t => !t.isDeleted && t.projectId === project.id && t.projectSection === 'habits').map(h => (
               <div key={h.id} onClick={() => onTaskClick(h.id)} className={`bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer hover:border-orange-200 transition-all group ${selectedTaskId === h.id ? 'ring-2 ring-orange-200 border-orange-300' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                     <div className="w-1.5 h-6 rounded-full bg-orange-100 group-hover:bg-orange-400 transition-colors"></div>
                     <span className="text-[11px] font-bold text-slate-700 truncate">{h.title}</span>
                  </div>
                  <Badge variant="orange" icon="fa-repeat" className="shrink-0">Daily</Badge>
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
    projects, tasks, cycle, addTask, addProject, 
    toggleTaskStatus, updateTask, updateProject, activeTab: contextActiveTab
  } = useApp();
  
  const colors = ['#f97316', '#10b981', '#6366f1', '#06b6d4', '#f43f5e', '#fbbf24', '#a855f7'];
  const [filter, setFilter] = useState<'all' | 'strategic' | 'structure'>('strategic');
  
  // Tree state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const toggleNode = (id: string) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [weeklyReviewProjectId, setWeeklyReviewProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, 'actions' | 'bosses' | 'goals' | 'habits' | 'planner'>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', color: '#f97316', isStrategic: true, description: '', type: 'goal' as any });

  // Handle external structure triggers from Sidebar
  useEffect(() => {
    if (contextActiveTab === 'structure') setFilter('structure');
    else if (contextActiveTab === 'projects') setFilter('strategic');
  }, [contextActiveTab]);

  const filteredProjects = useMemo(() => {
    if (filter === 'strategic') return projects.filter(p => p.type === 'goal' && !p.parentFolderId);
    if (filter === 'all') return projects.filter(p => !p.parentFolderId);
    return [];
  }, [projects, filter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    setIsPlanning(true);
    try {
      addProject(newProject);
      setIsModalOpen(false);
      setNewProject({ name: '', color: '#f97316', isStrategic: true, description: '', type: 'goal' });
    } finally { setIsPlanning(false); }
  };

  const renderGoalNode = (goal: Project) => {
    const isExpanded = expandedNodes[goal.id];
    const subprojects = projects.filter(p => p.parentFolderId === goal.id);
    const goalHabits = tasks.filter(t => t.projectId === goal.id && t.projectSection === 'habits' && !t.isDeleted);
    const goalActions = tasks.filter(t => t.projectId === goal.id && (t.projectSection === 'actions' || !t.projectSection) && !t.isDeleted);

    return (
      <TreeItem key={goal.id} label={goal.name} icon="fa-trophy" iconColor={goal.color} level={0} isExpanded={isExpanded} onToggle={() => toggleNode(goal.id)}>
        {subprojects.map(sub => (
          <TreeItem key={sub.id} label={sub.name} icon="fa-skull-crossbones" iconColor={sub.color} level={1} isExpanded={expandedNodes[sub.id]} onToggle={() => toggleNode(sub.id)}>
             {tasks.filter(t => t.projectId === sub.id && !t.isDeleted).map(task => (
               <TreeItem key={task.id} label={task.title} icon={task.status === TaskStatus.DONE ? "fa-circle-check" : "fa-file-lines"} iconColor={task.status === TaskStatus.DONE ? "#10b981" : "#94a3b8"} level={2} onClick={() => setSelectedTaskId(task.id)} isActive={selectedTaskId === task.id} />
             ))}
          </TreeItem>
        ))}
        {goalHabits.length > 0 && (
          <TreeItem label="Звички" icon="fa-repeat" iconColor="#f59e0b" level={1} isExpanded={expandedNodes[`${goal.id}_habits`]} onToggle={() => toggleNode(`${goal.id}_habits`)}>
             {goalHabits.map(h => <TreeItem key={h.id} label={h.title} icon="fa-circle" iconColor="#f59e0b" level={2} onClick={() => setSelectedTaskId(h.id)} isActive={selectedTaskId === h.id} />)}
          </TreeItem>
        )}
        {goalActions.map(task => <TreeItem key={task.id} label={task.title} icon={task.status === TaskStatus.DONE ? "fa-circle-check" : "fa-file-lines"} iconColor={task.status === TaskStatus.DONE ? "#10b981" : "#94a3b8"} level={1} onClick={() => setSelectedTaskId(task.id)} isActive={selectedTaskId === task.id} />)}
      </TreeItem>
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
                <div><Typography variant="h2" className="text-lg mb-0.5">Менеджмент Цілей</Typography><span className="text-[9px] font-black uppercase text-orange-400">Стратегічний горизонт</span></div>
              </div>
              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Ефективність</div>
                <div className="text-2xl font-black text-white">{cycle.globalExecutionScore}%</div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-slate-200/40 p-1 rounded-xl">
              <button onClick={() => setFilter('strategic')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'strategic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Глобальні Цілі</button>
              <button onClick={() => setFilter('all')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Всі проєкти</button>
              <button onClick={() => setFilter('structure')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'structure' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Дерево Структури</button>
            </div>
            <Button icon="fa-plus" size="sm" onClick={() => setIsModalOpen(true)} className="px-6 py-2 rounded-xl">НОВА ЦІЛЬ</Button>
          </div>

          <div className="space-y-3">
            {filter === 'structure' ? (
              <Card className="p-4 bg-white border-slate-100">
                <div className="space-y-1">{projects.filter(p => p.type === 'goal' && !p.parentFolderId).map(renderGoalNode)}</div>
              </Card>
            ) : (
              filteredProjects.map(project => {
                const isExpanded = expandedProjectId === project.id;
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
                            {project.isStrategic && <Badge variant="orange" className="px-1.5 py-0 text-[8px]">{project.executionScore || 0}% EX</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-1"><i className="fa-solid fa-skull-crossbones text-slate-200"></i> {projects.filter(p => p.parentFolderId === project.id).length} підпроєктів</span>
                             <span className="flex items-center gap-1"><i className="fa-solid fa-check-double text-slate-200"></i> {tasks.filter(t => t.projectId === project.id && !t.isDeleted).length} дій</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {project.isStrategic && <button onClick={(e) => { e.stopPropagation(); setWeeklyReviewProjectId(project.id); }} className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all text-[9px] font-black uppercase flex items-center gap-2"><i className="fa-solid fa-calendar-check"></i> Рев'ю</button>}
                        <i className={`fa-solid fa-chevron-down text-slate-300 text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-slate-50/30 border-t border-slate-50">
                        <ProjectCardTabs project={project} activeTabs={activeTabs} setActiveTabs={setActiveTabs} onTaskClick={setSelectedTaskId} onSubprojectClick={setActiveSubId} selectedTaskId={selectedTaskId} />
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {activeSubId && (
        <SubprojectDrawer sub={projects.find(p => p.id === activeSubId)!} tasks={tasks.filter(t => t.projectId === activeSubId && !t.isDeleted)} onClose={() => { setActiveSubId(null); setSelectedTaskId(null); }} onToggleStatus={toggleTaskStatus} onTaskClick={setSelectedTaskId} onAddTask={(title) => addTask(title, 'tasks', activeSubId, 'actions')} selectedTaskId={selectedTaskId} />
      )}

      {selectedTaskId && (
        <div className={`fixed top-0 h-full z-[115] bg-white border-l border-slate-100 shadow-2xl transition-all duration-300 ${activeSubId ? 'right-80 w-72' : 'right-0 w-[450px]'}`}>
           <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}

      {weeklyReviewProjectId && <WeeklyReviewModal projectId={weeklyReviewProjectId} onClose={() => setWeeklyReviewProjectId(null)} />}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <Card className="w-full max-w-xl relative z-10 shadow-2xl border-none p-8 rounded-[2.5rem] bg-white">
            <Typography variant="h2" className="mb-8">Нова Глобальна Ціль</Typography>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва цілі</label><input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Чому це важливо?</label><textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm h-24" /></div>
              <div className="flex gap-4 pt-4"><Button variant="white" type="button" className="flex-1 rounded-2xl" onClick={() => setIsModalOpen(false)}>СКАСУВАТИ</Button><Button variant="primary" type="submit" className="flex-[2] rounded-2xl">АКТИВУВАТИ</Button></div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
