
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus, ProjectSection } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';
import HabitStatsSidebar from '../components/HabitStatsSidebar';
import { useResizer } from '../hooks/useResizer';
import { PLANNING_TIPS, PlanningTip } from '../data/planningTips';
import StructureView from './StructureView';

// --- SUB-COMPONENT: Goal Modal (Create/Edit) ---
const GoalModal: React.FC<{ 
  onClose: () => void, 
  onSave: (data: any) => void,
  initialData?: Project
}> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#f97316');
  
  const colors = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#ef4444', '#facc15', '#a855f7', '#475569'];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}></div>
      <Card className="w-full max-w-md relative z-10 shadow-2xl p-8 rounded-[2.5rem] bg-white animate-in zoom-in-95 duration-200 border-none">
        <Typography variant="h2" className="mb-6 text-2xl">{initialData ? 'Редагувати Ціль' : 'Нова Стратегічна Ціль'}</Typography>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва цілі</label>
            <input 
              autoFocus 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Напр: Вивчити нову мову" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Опис місії</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Короткий опис або візія..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all h-24 resize-none" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Колір прапора</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button 
                  key={c} 
                  onClick={() => setColor(c)} 
                  className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-slate-200 scale-110 shadow-lg' : 'hover:scale-105'}`} 
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1 py-4 rounded-2xl" onClick={onClose}>СКАСУВАТИ</Button>
            <Button 
              disabled={!name.trim()}
              className="flex-[2] py-4 rounded-2xl shadow-xl shadow-orange-100" 
              onClick={() => onSave({ name, description, color })}
            >
              {initialData ? 'ЗБЕРЕГТИ' : 'ВСТАНОВИТИ ЦІЛЬ'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: Sub-Project Panel ---
const SubProjectPanel: React.FC<{ subProject: Project, onClose: () => void }> = ({ subProject, onClose }) => {
  const { tasks, toggleTaskStatus, updateProject, addTask, updateTask, deleteTask } = useApp();
  const [newAction, setNewAction] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const spTasks = tasks.filter(t => t.projectId === subProject.id && !t.isDeleted);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) updateTask({ ...task, projectId: subProject.id, projectSection: 'actions' });
    }
  };

  const progress = useMemo(() => {
    if (spTasks.length === 0) return 0;
    const done = spTasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / spTasks.length) * 100);
  }, [spTasks]);

  useEffect(() => {
    if (progress !== subProject.progress) {
      updateProject({ ...subProject, progress });
    }
  }, [progress, subProject.progress, updateProject]);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 ${dragOver ? 'ring-4 ring-inset ring-orange-100' : ''}`}
    >
      <header className="p-8 border-b border-slate-50 flex justify-between items-start">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-2xl shadow-xl" style={{ backgroundColor: subProject.color }}>
              <i className="fa-solid fa-layer-group"></i>
           </div>
           <div>
              <Typography variant="tiny" className="text-orange-500 font-black mb-1 uppercase">ПІДПРОЄКТ</Typography>
              <Typography variant="h2" className="text-xl">{subProject.name}</Typography>
           </div>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
         <section>
            <div className="flex justify-between items-center mb-4">
               <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest">Дії підпроєкту</Typography>
               <Badge variant="orange" className="text-[8px]">{progress}% HP</Badge>
            </div>
            <div className="space-y-2">
               {spTasks.map(t => (
                 <div 
                   key={t.id} 
                   draggable
                   onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                   className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-orange-200 transition-all cursor-grab active:cursor-grabbing"
                 >
                    <button onClick={() => toggleTaskStatus(t)} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                    <span className={`text-xs font-bold flex-1 ${t.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{t.title}</span>
                    <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                 </div>
               ))}
               <form onSubmit={e => { e.preventDefault(); if(newAction.trim()){ addTask(newAction.trim(), 'tasks', subProject.id, 'actions'); setNewAction(''); }}} className="pt-2">
                  <input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="+ Нова дія у підпроєкт..." className="w-full bg-transparent border-b border-dashed border-slate-200 py-2 text-xs font-bold outline-none focus:border-orange-300 transition-colors" />
               </form>
            </div>
         </section>
      </div>

      <footer className="p-8 border-t border-slate-50 bg-slate-50/50">
         <div className="text-[9px] font-black text-slate-400 uppercase mb-4 text-center">Перетягніть дії сюди</div>
         <Button variant="ghost" onClick={onClose} className="w-full text-[10px] font-black uppercase py-3 rounded-2xl">Закрити панель</Button>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENT: Goal Card ---
const GoalCard: React.FC<{ 
  goal: Project, 
  isExpanded: boolean, 
  onToggle: () => void,
  onTaskClick: (id: string) => void,
  onHabitClick: (id: string) => void,
  onSubProjectClick: (id: string) => void,
  onEdit: (goal: Project) => void,
  selectedTaskId: string | null,
  selectedHabitId: string | null
}> = ({ goal, isExpanded, onToggle, onTaskClick, onHabitClick, onSubProjectClick, onEdit, selectedTaskId, selectedHabitId }) => {
  const { tasks, projects, addProject, addTask, updateTask, deleteProject } = useApp();
  const [activeTab, setActiveTab] = useState<'actions' | 'subprojects' | 'habits'>('actions');
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const [inlineInputValue, setInlineInputValue] = useState('');
  
  const subProjects = projects.filter(p => p.parentFolderId === goal.id && p.status === 'active');
  const goalTasks = tasks.filter(t => !t.isDeleted && (t.projectId === goal.id || subProjects.some(sp => sp.id === t.projectId)) && (t.projectSection === 'actions' || !t.projectSection));
  const goalHabits = tasks.filter(t => !t.isDeleted && t.projectId === goal.id && t.projectSection === 'habits');

  const handleTabDrop = (e: React.DragEvent, tab: any) => {
    e.preventDefault();
    setDragOverTab(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newStatus = tab === 'actions' ? TaskStatus.NEXT_ACTION : task.status;
      const newSection = tab === 'habits' ? 'habits' : 'actions';
      
      updateTask({ 
        ...task, 
        projectId: (tab === 'actions' && subProjects.some(sp => sp.id === task.projectId)) ? task.projectId : goal.id,
        projectSection: newSection,
        status: newStatus
      });
      setActiveTab(tab);
    }
  };

  const hpProgress = useMemo(() => {
    const allRelevantTasks = tasks.filter(t => (t.projectId === goal.id || subProjects.some(sp => sp.id === t.projectId)) && !t.isDeleted);
    const taskDone = allRelevantTasks.filter(t => t.status === TaskStatus.DONE).length;
    const taskTotal = allRelevantTasks.length || 1;
    const taskScore = (taskDone / taskTotal) * 100;
    
    const subAvg = subProjects.length > 0 
      ? subProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / subProjects.length 
      : 100;

    return Math.round((taskScore + subAvg) / 2);
  }, [subProjects, tasks, goal.id]);

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineInputValue.trim()) return;

    if (activeTab === 'actions') {
      addTask(inlineInputValue.trim(), 'tasks', goal.id, 'actions');
    } else if (activeTab === 'subprojects') {
      addProject({ name: inlineInputValue.trim(), color: goal.color, parentFolderId: goal.id, isStrategic: false, type: 'subproject' });
    } else if (activeTab === 'habits') {
      addTask(inlineInputValue.trim(), 'tasks', goal.id, 'habits');
    }
    setInlineInputValue('');
  };

  const handleQuickAddButton = () => {
    const promptLabel = activeTab === 'actions' ? 'Назва нової дії:' : activeTab === 'subprojects' ? 'Назва підпроєкту:' : 'Назва звички:';
    const n = prompt(promptLabel);
    if (n) {
      if (activeTab === 'actions') addTask(n, 'tasks', goal.id, 'actions');
      else if (activeTab === 'subprojects') addProject({ name: n, color: goal.color, parentFolderId: goal.id, isStrategic: false, type: 'subproject' });
      else if (activeTab === 'habits') addTask(n, 'tasks', goal.id, 'habits');
    }
  };

  return (
    <Card padding="none" className={`bg-white border-slate-100 shadow-sm overflow-hidden transition-all ${isExpanded ? 'shadow-xl ring-2 ring-orange-100 scale-[1.01]' : 'hover:border-orange-200'}`}>
      <div className="flex">
        <div onClick={onToggle} className="flex-1 p-6 cursor-pointer flex items-center gap-5 group">
          <i className={`fa-solid fa-chevron-right text-[10px] text-slate-300 transition-transform ${isExpanded ? 'rotate-90 text-orange-500' : ''}`}></i>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: goal.color }}>
             <i className="fa-solid fa-flag-checkered text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
             <Typography variant="h3" className="text-base font-black uppercase tracking-tight text-slate-800 truncate">{goal.name}</Typography>
             <div className="flex items-center gap-4 mt-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><i className="fa-solid fa-folder-tree text-orange-500"></i> {subProjects.length} ПІДПРОЄКТІВ</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><i className="fa-solid fa-check-double text-indigo-500"></i> {goalTasks.length} ДІЙ</span>
             </div>
          </div>
          <div className="shrink-0 text-right pr-4">
             <div className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Прогрес Цілі</div>
             <div className="text-sm font-black text-slate-800">{hpProgress}%</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pr-6 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => onEdit(goal)} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center"><i className="fa-solid fa-pencil text-[10px]"></i></button>
           <button onClick={() => { if(confirm('Видалити ціль?')) deleteProject(goal.id); }} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-10 pb-8 pt-2 bg-slate-50/20 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
           <div className="flex justify-between items-center mb-6 border-b border-slate-100">
              <div className="flex gap-6">
                {[
                  { id: 'actions', label: 'Дії', icon: 'fa-bolt' },
                  { id: 'subprojects', label: 'Підпроєкти', icon: 'fa-folder-tree' },
                  { id: 'habits', label: 'Звички', icon: 'fa-repeat' }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTab(t.id); }}
                    onDragLeave={() => setDragOverTab(null)}
                    onDrop={(e) => handleTabDrop(e, t.id)}
                    className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-2 ${activeTab === t.id ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'} ${dragOverTab === t.id ? 'scale-110 text-orange-600' : ''}`}
                  >
                    <i className={`fa-solid ${t.icon}`}></i> {t.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleQuickAddButton}
                className="mb-2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
           </div>

           <div className="min-h-[150px] space-y-4">
              <form onSubmit={handleInlineSubmit} className="flex gap-2">
                 <input 
                    value={inlineInputValue}
                    onChange={e => setInlineInputValue(e.target.value)}
                    placeholder={activeTab === 'actions' ? "+ Додати дію..." : activeTab === 'subprojects' ? "+ Новий підпроєкт..." : "+ Додати звичку..."}
                    className="flex-1 bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none shadow-sm"
                 />
                 <button type="submit" disabled={!inlineInputValue.trim()} className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:opacity-30">
                    <i className="fa-solid fa-arrow-up text-xs"></i>
                 </button>
              </form>

              {activeTab === 'actions' && (
                <div className="space-y-2">
                   {goalTasks.map(task => {
                     const sp = subProjects.find(p => p.id === task.projectId);
                     return (
                       <div 
                        key={task.id} 
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                        onClick={() => onTaskClick(task.id)} 
                        className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-orange-200 shadow-sm cursor-grab active:cursor-grabbing transition-all ${selectedTaskId === task.id ? 'ring-2 ring-orange-200' : ''}`}
                       >
                          <div className={`w-2 h-2 rounded-full ${task.status === TaskStatus.DONE ? 'bg-emerald-500' : task.status === TaskStatus.NEXT_ACTION ? 'bg-orange-500 animate-pulse' : 'bg-slate-300'}`}></div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold truncate block ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</span>
                            {sp && <span className="text-[7px] font-black uppercase text-orange-500 tracking-widest mt-0.5 block"><i className="fa-solid fa-layer-group text-[6px] mr-1"></i>{sp.name}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                             {task.status === TaskStatus.NEXT_ACTION && <Badge variant="orange" className="text-[6px] py-0">В процесі</Badge>}
                             <i className="fa-solid fa-chevron-right text-[8px] text-slate-200"></i>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}

              {activeTab === 'subprojects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {subProjects.map(sp => (
                     <div key={sp.id} onClick={() => onSubProjectClick(sp.id)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform" style={{ backgroundColor: sp.color || goal.color }}><i className="fa-solid fa-layer-group text-xs"></i></div>
                              <Typography variant="h3" className="text-xs font-black text-slate-800 uppercase truncate">{sp.name}</Typography>
                           </div>
                           <Badge variant="orange" className="text-[7px]">{sp.progress}% HP</Badge>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${sp.progress}%` }}></div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {activeTab === 'habits' && (
                <div className="space-y-3">
                   {goalHabits.map(h => (
                     <div 
                      key={h.id} 
                      onClick={() => onHabitClick(h.id)}
                      className={`p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm group cursor-pointer transition-all ${selectedHabitId === h.id ? 'border-orange-400 ring-2 ring-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs"><i className="fa-solid fa-repeat"></i></div>
                           <span className="text-xs font-bold text-slate-700">{h.title}</span>
                        </div>
                        <Badge variant="emerald" className="text-[7px]">Звичка</Badge>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}
    </Card>
  );
};

// --- MAIN VIEW ---
const ProjectsView: React.FC = () => {
  const { projects, tasks, cycle, addProject, updateProject, toggleHabitStatus, updateTask, updateCycle } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(380, 550);
  
  const [filter, setFilter] = useState<'active' | 'all' | 'structure'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean, editing?: Project }>({ open: false });
  const [showProgressSidebar, setShowProgressSidebar] = useState(false);
  
  const filteredGoals = useMemo(() => {
    if (filter === 'structure') return [];
    return projects.filter(p => p.type === 'goal' && (filter === 'all' || p.status === 'active'));
  }, [projects, filter]);

  const handleSaveGoal = (data: { name: string, description: string, color: string }) => {
    if (modalState.editing) {
      updateProject({ ...modalState.editing, ...data });
    } else {
      addProject({ 
        name: data.name, 
        description: data.description, 
        color: data.color, 
        isStrategic: true, 
        type: 'goal' 
      });
    }
    setModalState({ open: false });
  };

  const cycleEnd = new Date(cycle.startDate + (1000 * 60 * 60 * 24 * 84));
  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header - Clickable for Progress Sidebar */}
        <header className="px-8 py-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
          <div 
            className="flex items-center gap-10 cursor-pointer group/header"
            onClick={() => setShowProgressSidebar(true)}
          >
            <div>
              <Typography variant="h2" className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none group-hover/header:text-orange-600 transition-colors">
                Стратегія 12TR <i className="fa-solid fa-chevron-right text-[10px] ml-2 opacity-0 group-hover/header:opacity-100 transition-all"></i>
              </Typography>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <Typography variant="tiny" className="text-slate-400">Тиждень {cycle.currentWeek} Активний</Typography>
              </div>
            </div>
            
            <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
            
            <div className="hidden lg:flex items-center gap-8">
               <div className="space-y-1">
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Цикл</div>
                  <div className="text-[10px] font-bold text-slate-800">
                    {new Date(cycle.startDate).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})} — {cycleEnd.toLocaleDateString('uk-UA', {day:'numeric', month:'short', year:'numeric'})}
                  </div>
               </div>
               <div className="space-y-1 w-32">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase">
                     <span className="text-slate-300">ПРОГРЕС</span>
                     <span className="text-orange-600">{cycle.globalExecutionScore}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button onClick={() => setFilter('active')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Активні</button>
                <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Всі</button>
                <button onClick={() => setFilter('structure')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'structure' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Структура</button>
             </div>
             <Button 
               icon="fa-plus" 
               size="sm" 
               className="rounded-xl px-5 py-2.5 font-black text-[9px] uppercase tracking-widest shadow-xl shadow-orange-100" 
               onClick={() => setModalState({ open: true })}
             >
               ЦІЛЬ
             </Button>
          </div>
        </header>

        {/* Goal List / Structure View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 pb-24">
          {filter === 'structure' ? (
            <div className="h-full">
               <StructureView />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto py-8 space-y-6 px-4">
              {filteredGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  isExpanded={expandedId === goal.id} 
                  onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
                  onTaskClick={(id) => { setSelectedTaskId(id); setSelectedHabitId(null); setSelectedSubProjectId(null); }}
                  onHabitClick={(id) => { setSelectedHabitId(id); setSelectedTaskId(null); setSelectedSubProjectId(null); }}
                  onSubProjectClick={(id) => { setSelectedSubProjectId(id); setSelectedTaskId(null); setSelectedHabitId(null); }}
                  onEdit={(g) => setModalState({ open: true, editing: g })}
                  selectedTaskId={selectedTaskId}
                  selectedHabitId={selectedHabitId}
                />
              ))}
              
              {filteredGoals.length === 0 && (
                <div className="py-24 text-center opacity-20 flex flex-col items-center">
                   <i className="fa-solid fa-mountain-sun text-8xl mb-6"></i>
                   <Typography variant="h2" className="text-2xl">Мапа пуста</Typography>
                   <Typography variant="body" className="mt-2">Створіть свою першу велику ціль для циклу 12 тижнів.</Typography>
                   <button onClick={() => setModalState({ open: true })} className="mt-6 text-orange-600 font-black uppercase text-xs hover:underline">+ Додати ціль зараз</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Details/Context Sidebar */}
      <div className="flex h-full border-l border-slate-100 z-40 bg-white shrink-0">
        <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
        <div style={{ width: detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : selectedSubProjectId ? (
            <SubProjectPanel subProject={projects.find(p => p.id === selectedSubProjectId)!} onClose={() => setSelectedSubProjectId(null)} />
          ) : selectedHabit ? (
            <div className="h-full animate-in slide-in-from-right duration-300">
               <HabitStatsSidebar 
                 habit={selectedHabit} 
                 onClose={() => setSelectedHabitId(null)}
                 onUpdate={(updates) => updateTask({ ...selectedHabit, ...updates })}
                 onToggleStatus={toggleHabitStatus}
               />
            </div>
          ) : (
            <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
               <header className="p-8 border-b border-slate-100 bg-white">
                  <Typography variant="tiny" className="text-orange-500 mb-2 block font-black uppercase">Система 12TR</Typography>
                  <Typography variant="h2" className="text-lg">Статистика Року</Typography>
               </header>
               
               <div className="p-8 space-y-8">
                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase">Глобальний фокус</Typography>
                     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-end">
                           <span className="text-3xl font-black text-slate-900">{cycle.globalExecutionScore}%</span>
                           <Badge variant="emerald">ACTIVE</Badge>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase">Налаштування Циклу</Typography>
                     <Card padding="md" className="space-y-6">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase">Поточний тиждень</label>
                           <div className="flex items-center gap-4">
                              <input 
                                type="number" 
                                min="1" max="12" 
                                value={cycle.currentWeek} 
                                onChange={e => updateCycle({ currentWeek: parseInt(e.target.value) || 1 })}
                                className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-black focus:ring-2 focus:ring-orange-100 outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-bold italic">Змінити фазу року</span>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase">Початок циклу</label>
                           <input 
                              type="date"
                              value={new Date(cycle.startDate).toISOString().split('T')[0]}
                              onChange={e => updateCycle({ startDate: new Date(e.target.value).getTime() })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-black focus:ring-2 focus:ring-orange-100 outline-none"
                           />
                        </div>
                     </Card>
                  </section>

                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase">Результати по квестах</Typography>
                     <div className="space-y-2">
                        {Array.from({length: 12}, (_, i) => {
                           const w = i + 1;
                           const score = cycle.weeklyScores?.[w] || 0;
                           return (
                              <div key={w} className="flex items-center gap-3">
                                 <span className="w-8 text-[9px] font-black text-slate-300">W{w}</span>
                                 <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400" style={{ width: `${score}%` }}></div>
                                 </div>
                                 <span className="w-8 text-[9px] font-bold text-slate-500 text-right">{score}%</span>
                              </div>
                           );
                        })}
                     </div>
                  </section>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Sidebar (12TR Overview) */}
      {showProgressSidebar && (
        <div className="fixed inset-0 z-[200] flex justify-end">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowProgressSidebar(false)}></div>
           <div className="w-full max-w-md bg-white h-full relative z-10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                 <div>
                    <Typography variant="h2" className="text-xl">Огляд Циклу</Typography>
                    <Typography variant="tiny" className="text-slate-400">12-тижневий рік</Typography>
                 </div>
                 <button onClick={() => setShowProgressSidebar(false)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                 <section className="space-y-4">
                    <div className="flex justify-between items-end">
                       <Typography variant="tiny" className="text-slate-900 font-black">ГЛОБАЛЬНИЙ ПРОГРЕС</Typography>
                       <span className="text-3xl font-black text-orange-600">{cycle.globalExecutionScore}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div>
                    </div>
                 </section>

                 <section className="space-y-4">
                    <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Тижні (Квести)</Typography>
                    <div className="grid grid-cols-4 gap-2">
                       {Array.from({length: 12}, (_, i) => {
                          const w = i + 1;
                          const isPast = w < cycle.currentWeek;
                          const isCurrent = w === cycle.currentWeek;
                          return (
                            <div key={w} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${isCurrent ? 'border-orange-500 bg-orange-50 shadow-lg' : isPast ? 'border-slate-100 bg-slate-50' : 'border-slate-50 opacity-40'}`}>
                               <span className={`text-[8px] font-black ${isCurrent ? 'text-orange-500' : 'text-slate-400'}`}>ТИЖ</span>
                               <span className={`text-lg font-black ${isCurrent ? 'text-orange-600' : 'text-slate-700'}`}>{w}</span>
                            </div>
                          );
                       })}
                    </div>
                 </section>

                 <section className="space-y-4">
                    <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">KPI Стратегічних Цілей</Typography>
                    <div className="space-y-3">
                       {projects.filter(p => p.type === 'goal' && p.status === 'active').map(goal => (
                          <Card key={goal.id} padding="sm" className="bg-slate-50 border-slate-100">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase truncate pr-4">{goal.name}</span>
                                <Badge variant="orange" className="text-[7px]">{goal.progress}%</Badge>
                             </div>
                             <div className="h-1 bg-white rounded-full overflow-hidden">
                                <div className="h-full bg-orange-400" style={{ width: `${goal.progress}%` }}></div>
                             </div>
                          </Card>
                       ))}
                    </div>
                 </section>
              </div>
              <footer className="p-8 border-t border-slate-100 bg-slate-50/30">
                 <Button variant="white" className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => setShowProgressSidebar(false)}>ЗАКРИТИ ПАНЕЛЬ</Button>
              </footer>
           </div>
        </div>
      )}

      {modalState.open && (
        <GoalModal 
          onClose={() => setModalState({ open: false })} 
          onSave={handleSaveGoal} 
          initialData={modalState.editing}
        />
      )}
    </div>
  );
};

export default ProjectsView;
