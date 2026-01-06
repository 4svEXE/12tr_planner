
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
import { planProjectStrategically } from '../services/geminiService';
import StructureView from './StructureView';

// --- SUB-COMPONENT: Goal Modal (Create/Edit) ---
const GoalModal: React.FC<{ 
  onClose: () => void, 
  onSave: (data: any, autoPlan: boolean) => void,
  initialData?: Project,
  aiEnabled: boolean
}> = ({ onClose, onSave, initialData, aiEnabled }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#f97316');
  const [sphere, setSphere] = useState<Project['sphere']>(initialData?.sphere || 'career');
  const [autoPlan, setAutoPlan] = useState(false);
  
  const colors = ['#f97316', '#10b981', '#6366f1', '#ec4899', '#ef4444', '#facc15', '#a855f7', '#475569'];
  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}></div>
      <Card className="w-full max-w-lg relative z-10 shadow-2xl p-8 rounded-[2.5rem] bg-white animate-in zoom-in-95 duration-200 border-none overflow-y-auto max-h-[90vh]">
        <Typography variant="h2" className="mb-6 text-2xl">{initialData ? 'Редагувати Ціль' : 'Нова Стратегічна Ціль'}</Typography>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва цілі</label>
            <input 
              autoFocus 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Напр: Досягти фінансової свободи" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
            />
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Сфера життя</label>
            <div className="grid grid-cols-3 gap-2">
              {spheres.map(s => (
                <button 
                  key={s.key} 
                  onClick={() => setSphere(s.key as any)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${sphere === s.key ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}
                >
                  <i className={`fa-solid ${s.icon} text-xs`}></i>
                  <span className="text-[8px] font-black uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Візія та опис</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Опишіть бажаний результат..." 
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

          {aiEnabled && !initialData && (
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-indigo-900 leading-none mb-1">AI Планування</div>
                      <div className="text-[8px] font-bold text-indigo-400">Створити план дій та звички</div>
                   </div>
                </div>
                <button 
                  onClick={() => setAutoPlan(!autoPlan)}
                  className={`w-10 h-5 rounded-full transition-all relative ${autoPlan ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPlan ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1 py-4 rounded-2xl font-black" onClick={onClose}>СКАСУВАТИ</Button>
            <Button 
              disabled={!name.trim()}
              className="flex-[2] py-4 rounded-2xl shadow-xl shadow-orange-100 font-black" 
              onClick={() => onSave({ name, description, color, sphere }, autoPlan)}
            >
              {initialData ? 'ЗБЕРЕГТИ' : 'ВСТАНОВИТИ ЦІЛЬ'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT: Sub-Project Panel (RESTORED) ---
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
              <Typography variant="tiny" className="text-orange-500 font-black mb-1 uppercase tracking-widest">Етап проєкту</Typography>
              <Typography variant="h2" className="text-xl">{subProject.name}</Typography>
           </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
         <section>
            <div className="flex justify-between items-center mb-6">
               <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest">Завдання етапу</Typography>
               <Badge variant="orange" className="text-[8px]">{progress}% COMPLETE</Badge>
            </div>
            <div className="space-y-3">
               {spTasks.map(t => (
                 <div 
                   key={t.id} 
                   draggable
                   onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                   className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                 >
                    <button onClick={() => toggleTaskStatus(t)} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}><i className="fa-solid fa-check text-[10px]"></i></button>
                    <span className={`text-[13px] font-bold flex-1 ${t.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{t.title}</span>
                    <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                 </div>
               ))}
               <form onSubmit={e => { e.preventDefault(); if(newAction.trim()){ addTask(newAction.trim(), 'tasks', subProject.id, 'actions'); setNewAction(''); }}} className="pt-4">
                  <input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="+ Додати крок до етапу..." className="w-full bg-transparent border-b border-dashed border-slate-200 py-3 text-sm font-bold outline-none focus:border-orange-300 transition-colors" />
               </form>
            </div>
         </section>
      </div>

      <footer className="p-8 border-t border-slate-50 bg-slate-50/30">
         <div className="text-[9px] font-black text-slate-400 uppercase mb-4 text-center tracking-widest">Перетягніть завдання сюди</div>
         <Button variant="white" onClick={onClose} className="w-full text-[10px] font-black uppercase py-4 rounded-2xl tracking-widest shadow-sm">ЗАКРИТИ ПАНЕЛЬ</Button>
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
  const { tasks, projects, addProject, addTask, updateTask, deleteProject, toggleTaskStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'actions' | 'subprojects' | 'habits'>('actions');
  const [inlineInputValue, setInlineInputValue] = useState('');
  
  const subProjects = projects.filter(p => p.parentFolderId === goal.id && p.status === 'active');
  const goalTasks = tasks.filter(t => !t.isDeleted && (t.projectId === goal.id || subProjects.some(sp => sp.id === t.projectId)) && (t.projectSection === 'actions' || !t.projectSection));
  const goalHabits = tasks.filter(t => !t.isDeleted && t.projectId === goal.id && t.projectSection === 'habits');

  const executionScore = useMemo(() => {
    const all = tasks.filter(t => (t.projectId === goal.id || subProjects.some(sp => sp.id === t.projectId)) && !t.isDeleted);
    if (all.length === 0) return 0;
    const done = all.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / all.length) * 100);
  }, [subProjects, tasks, goal.id]);

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineInputValue.trim()) return;
    if (activeTab === 'actions') addTask(inlineInputValue.trim(), 'tasks', goal.id, 'actions');
    else if (activeTab === 'subprojects') addProject({ name: inlineInputValue.trim(), color: goal.color, parentFolderId: goal.id, isStrategic: false, type: 'subproject' });
    else if (activeTab === 'habits') addTask(inlineInputValue.trim(), 'tasks', goal.id, 'habits');
    setInlineInputValue('');
  };

  const sphereIcons: Record<string, string> = {
    health: 'fa-heart-pulse',
    career: 'fa-briefcase',
    finance: 'fa-coins',
    education: 'fa-book-open-reader',
    relationships: 'fa-people-group',
    rest: 'fa-couch'
  };

  return (
    <Card padding="none" className={`bg-white border-slate-100 shadow-sm overflow-hidden transition-all ${isExpanded ? 'shadow-2xl ring-1 ring-orange-100 scale-[1.01]' : 'hover:border-orange-200'}`}>
      <div className="flex items-stretch">
        <div 
          className="w-2 shrink-0 transition-all" 
          style={{ backgroundColor: goal.color }}
        ></div>
        <div onClick={onToggle} className="flex-1 p-6 cursor-pointer flex items-center gap-5 group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 transition-transform group-hover:scale-110 relative" style={{ backgroundColor: goal.color }}>
             <i className="fa-solid fa-flag-checkered text-lg"></i>
             {goal.sphere && (
               <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-lg flex items-center justify-center text-[10px] text-slate-900 border border-slate-50">
                  <i className={`fa-solid ${sphereIcons[goal.sphere] || 'fa-mountain'}`}></i>
               </div>
             )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-1">
               <Typography variant="h3" className="text-lg font-black uppercase tracking-tight text-slate-800 truncate">{goal.name}</Typography>
               <Badge variant="orange" className="text-[7px] py-0.5">{executionScore}% XP</Badge>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                   {subProjects.slice(0,3).map(sp => (
                     <div key={sp.id} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-slate-100 text-[6px] font-black" style={{ backgroundColor: sp.color }}></div>
                   ))}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{goal.sphere || 'Без категорії'}</span>
             </div>
          </div>
          <div className="shrink-0 flex items-center gap-4">
             <div className="h-10 w-px bg-slate-100"></div>
             <i className={`fa-solid fa-chevron-right text-xs text-slate-300 transition-transform ${isExpanded ? 'rotate-90 text-orange-500' : ''}`}></i>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-8 pt-4 bg-slate-50/10 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
           <div className="flex justify-between items-center mb-6">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'actions', label: 'Дії', icon: 'fa-bolt' },
                  { id: 'subprojects', label: 'Етапи', icon: 'fa-layer-group' },
                  { id: 'habits', label: 'Звички', icon: 'fa-repeat' }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${activeTab === t.id ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <i className={`fa-solid ${t.icon} text-[10px]`}></i> {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                 <button onClick={() => onEdit(goal)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-gear text-sm"></i></button>
                 <button onClick={() => { if(confirm('Видалити ціль?')) deleteProject(goal.id); }} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-sm"></i></button>
              </div>
           </div>

           <div className="space-y-4">
              <form onSubmit={handleInlineSubmit} className="flex gap-2">
                 <input 
                    value={inlineInputValue}
                    onChange={e => setInlineInputValue(e.target.value)}
                    placeholder={activeTab === 'actions' ? "Додати тактичний крок..." : activeTab === 'subprojects' ? "Створити новий етап..." : "Впровадити звичку..."}
                    className="flex-1 bg-white border border-slate-200 rounded-[1.5rem] py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-inner"
                 />
                 <button type="submit" disabled={!inlineInputValue.trim()} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-lg hover:bg-orange-600 transition-all">
                    <i className="fa-solid fa-plus"></i>
                 </button>
              </form>

              <div className="grid gap-2">
                 {activeTab === 'actions' && goalTasks.map(task => (
                   <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    onClick={() => onTaskClick(task.id)} 
                    className={`flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 group hover:border-orange-200 hover:bg-slate-50 transition-all cursor-pointer ${selectedTaskId === task.id ? 'ring-2 ring-orange-200' : ''}`}
                   >
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}
                      >
                         <i className="fa-solid fa-check text-[10px]"></i>
                      </button>
                      <span className={`flex-1 text-[13px] font-bold ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through font-medium' : 'text-slate-700'}`}>{task.title}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                         <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
                      </div>
                   </div>
                 ))}

                 {activeTab === 'subprojects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {subProjects.map(sp => (
                         <div key={sp.id} onClick={() => onSubProjectClick(sp.id)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group flex flex-col justify-between h-32">
                            <div className="flex items-center justify-between">
                               <div className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform" style={{ backgroundColor: sp.color || goal.color }}><i className="fa-solid fa-layer-group"></i></div>
                               <Badge variant="orange" className="text-[7px]">{sp.progress}%</Badge>
                            </div>
                            <div>
                               <div className="text-[11px] font-black text-slate-800 uppercase truncate mb-2">{sp.name}</div>
                               <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${sp.progress}%` }}></div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}

                 {activeTab === 'habits' && goalHabits.map(h => (
                   <div 
                    key={h.id} 
                    onClick={() => onHabitClick(h.id)}
                    className={`p-4 bg-white border rounded-2xl flex items-center justify-between shadow-sm group cursor-pointer transition-all ${selectedHabitId === h.id ? 'border-orange-400 ring-2 ring-orange-50' : 'border-slate-100 hover:border-orange-200'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs shadow-sm"><i className="fa-solid fa-repeat"></i></div>
                         <span className="text-[12px] font-bold text-slate-700">{h.title}</span>
                      </div>
                      <Badge variant="emerald" className="text-[8px] py-0.5">DAILY</Badge>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </Card>
  );
};

// --- MAIN VIEW ---
const ProjectsView: React.FC = () => {
  const { projects, tasks, cycle, addProject, updateProject, toggleHabitStatus, updateTask, updateCycle, character, addTask, aiEnabled } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  
  const [activeMode, setActiveMode] = useState<'strategy' | 'execution' | 'structure'>('strategy');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean, editing?: Project }>({ open: false });
  const [isPlanning, setIsPlanning] = useState(false);

  const filteredGoals = useMemo(() => {
    return projects.filter(p => p.type === 'goal' && p.status === 'active');
  }, [projects]);

  const handleSaveGoal = async (data: any, autoPlan: boolean) => {
    let projectId = '';
    if (modalState.editing) {
      updateProject({ ...modalState.editing, ...data });
      projectId = modalState.editing.id;
    } else {
      projectId = addProject({ ...data, isStrategic: true, type: 'goal' });
    }
    
    setModalState({ open: false });

    if (autoPlan && aiEnabled) {
      setIsPlanning(true);
      try {
        const plan = await planProjectStrategically(data.name, data.description || '', character);
        
        // Add Next Actions
        plan.nextActions.forEach((title: string) => {
          addTask(title, 'tasks', projectId, 'actions');
        });

        // Add Habits
        plan.habits.forEach((title: string) => {
          addTask(title, 'tasks', projectId, 'habits');
        });

        // Add Subprojects and their tasks
        for (const sp of plan.subprojects) {
          const spId = addProject({
            name: sp.title,
            color: data.color,
            parentFolderId: projectId,
            isStrategic: false,
            type: 'subproject'
          });
          sp.tasks.forEach((t: string) => {
             addTask(t, 'tasks', spId, 'actions');
          });
        }
        alert('Стратегічний план успішно сформовано!');
      } catch (e) {
        console.error(e);
        alert('Не вдалося сформувати авто-план. Спробуйте вручну.');
      } finally {
        setIsPlanning(false);
      }
    }
  };

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Advanced 12TR Header */}
        <header className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col gap-6 sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <Typography variant="h2" className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
                  Двигун 12TR
                </Typography>
                <div className="flex items-center gap-2 mt-2">
                   <div className="px-2 py-0.5 bg-orange-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Цикл активний</div>
                   <Typography variant="tiny" className="text-slate-300 font-bold">Тиждень {cycle.currentWeek} з 12</Typography>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-100"></div>
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                {[
                  { id: 'strategy', label: 'Стратегія', icon: 'fa-chess-king' },
                  { id: 'execution', label: 'Виконання', icon: 'fa-bolt-lightning' },
                  { id: 'structure', label: 'Структура', icon: 'fa-sitemap' }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setActiveMode(m.id as any)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeMode === m.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <i className={`fa-solid ${m.icon} text-[10px]`}></i> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Button 
               icon={isPlanning ? "fa-circle-notch animate-spin" : "fa-plus"}
               disabled={isPlanning}
               className="rounded-2xl px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-orange-200" 
               onClick={() => setModalState({ open: true })}
            >
               {isPlanning ? 'ПЛАНУЮ...' : 'ЦІЛЬ'}
            </Button>
          </div>

          <div className="w-full space-y-2">
             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span>Прогрес циклу (12 тижнів)</span>
                <span className="text-orange-600">{cycle.globalExecutionScore}% COMPLETED</span>
             </div>
             <div className="flex gap-1.5 h-1.5">
                {Array.from({length: 12}).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-500 ${i + 1 < cycle.currentWeek ? 'bg-orange-600 shadow-[0_0_8px_#f97316]' : i + 1 === cycle.currentWeek ? 'bg-slate-900 animate-pulse' : 'bg-slate-100'}`}
                  ></div>
                ))}
             </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {activeMode === 'structure' ? (
             <StructureView />
          ) : activeMode === 'execution' ? (
             <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="bg-slate-900 text-white p-8 flex flex-col justify-between border-none shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-[60px]"></div>
                      <Typography variant="tiny" className="text-orange-500 mb-2 font-black uppercase">Поточний фокус</Typography>
                      <Typography variant="h2" className="text-4xl font-black mb-4">Тиждень {cycle.currentWeek}</Typography>
                      <p className="text-xs text-slate-400 leading-relaxed font-bold italic">"Залишайтеся вірними процесу, результати прийдуть з дисципліною."</p>
                   </Card>
                   
                   <Card className="p-8 bg-white border-slate-100 text-center flex flex-col items-center justify-center">
                      <div className="text-4xl font-black text-slate-900 mb-1">{cycle.globalExecutionScore}%</div>
                      <Typography variant="tiny" className="text-slate-400 font-black uppercase">Загальний KPI</Typography>
                      <div className="w-24 h-1 bg-orange-500 rounded-full mt-4"></div>
                   </Card>

                   <Card className="p-8 bg-white border-slate-100 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-4">
                         <Typography variant="tiny" className="text-slate-400 font-black">STREAK</Typography>
                         <span className="text-orange-500 font-black">🔥 12</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <Typography variant="tiny" className="text-slate-400 font-black">КВЕСТІВ</Typography>
                         <span className="text-indigo-600 font-black">84</span>
                      </div>
                   </Card>
                </div>

                <div className="space-y-4">
                   <Typography variant="h2" className="text-lg uppercase font-black tracking-widest px-2">Щоденна тактика</Typography>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tasks.filter(t => t.scheduledDate === new Date().setHours(0,0,0,0) && !t.isDeleted).map(t => (
                        <Card key={t.id} padding="sm" className="bg-white hover:border-orange-300 transition-all flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedTaskId(t.id)}>
                           <div className="w-3 h-3 rounded-full bg-slate-200 group-hover:bg-orange-500 transition-colors"></div>
                           <span className="text-[13px] font-bold text-slate-700 truncate">{t.title}</span>
                        </Card>
                      ))}
                   </div>
                </div>
             </div>
          ) : (
            <div className="max-w-4xl mx-auto py-10 space-y-6 px-4 pb-32">
              <div className="flex items-center justify-between px-2">
                 <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-[0.2em]">Стратегічні цілі циклу</Typography>
                 <Badge variant="orange" icon="fa-mountain-sun">{filteredGoals.length} ЦІЛЕЙ</Badge>
              </div>
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
                   <i className="fa-solid fa-mountain-sun text-8xl mb-8"></i>
                   <Typography variant="h2" className="text-2xl">Мапа стратегії порожня</Typography>
                   <Typography variant="body" className="mt-4">Створіть свою першу велику ціль для циклу 12 тижнів.</Typography>
                   <button onClick={() => setModalState({ open: true })} className="mt-8 text-orange-600 font-black uppercase text-xs hover:underline decoration-2 underline-offset-4">+ Встановити ціль зараз</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Intelligence Sidebar */}
      <div className="flex h-full border-l border-slate-100 z-40 bg-white shrink-0 overflow-hidden">
        <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
        <div style={{ width: detailsWidth }} className="h-full bg-white relative flex flex-col overflow-hidden">
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
               <header className="p-8 border-b border-slate-100 bg-white flex justify-between items-end">
                  <div>
                    <Typography variant="tiny" className="text-orange-500 mb-2 block font-black uppercase">Система 12TR</Typography>
                    <Typography variant="h2" className="text-lg">Аналітика Року</Typography>
                  </div>
                  <Badge variant="emerald">SYNCED</Badge>
               </header>
               
               <div className="p-8 space-y-10">
                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Глобальний фокус</Typography>
                     <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-600/10 blur-3xl"></div>
                        <div className="flex justify-between items-end">
                           <span className="text-5xl font-black">{cycle.globalExecutionScore}%</span>
                           <div className="text-right">
                              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Execution</div>
                              <div className="text-xs font-bold text-slate-400">Score</div>
                           </div>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500 shadow-[0_0_15px_#f97316] transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Керування Фазою</Typography>
                     <Card padding="md" className="space-y-6 bg-white border-slate-100 shadow-sm">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2">
                              <i className="fa-solid fa-calendar-week text-orange-500"></i> Поточний тиждень
                           </label>
                           <div className="flex items-center gap-4">
                              <input 
                                type="number" 
                                min="1" max="12" 
                                value={cycle.currentWeek} 
                                onChange={e => updateCycle({ currentWeek: parseInt(e.target.value) || 1 })}
                                className="w-20 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-black focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">Зміна фази 12-тижневого циклу</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2">
                              <i className="fa-solid fa-clock text-indigo-500"></i> Початок циклу
                           </label>
                           <input 
                              type="date"
                              value={new Date(cycle.startDate).toISOString().split('T')[0]}
                              onChange={e => updateCycle({ startDate: new Date(e.target.value).getTime() })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-black focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                           />
                        </div>
                     </Card>
                  </section>

                  <section className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Архів результатів</Typography>
                     <div className="grid grid-cols-3 gap-2">
                        {Array.from({length: 12}, (_, i) => {
                           const w = i + 1;
                           const score = cycle.weeklyScores?.[w] || 0;
                           const isFuture = w > cycle.currentWeek;
                           return (
                              <div key={w} className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center ${isFuture ? 'bg-slate-50 border-transparent opacity-40' : 'bg-white border-slate-100 shadow-sm'}`}>
                                 <span className="text-[8px] font-black text-slate-400 uppercase mb-1">W{w}</span>
                                 <span className={`text-sm font-black ${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-orange-500' : 'text-slate-300'}`}>{score}%</span>
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

      {modalState.open && (
        <GoalModal 
          onClose={() => setModalState({ open: false })} 
          onSave={handleSaveGoal} 
          initialData={modalState.editing}
          aiEnabled={aiEnabled}
        />
      )}
    </div>
  );
};

export default ProjectsView;
