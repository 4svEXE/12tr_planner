
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

// --- SUB-COMPONENT: Goal Modal ---
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
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Напр: Досягти фінансової свободи" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Сфера життя</label>
            <div className="grid grid-cols-3 gap-2">
              {spheres.map(s => (
                <button key={s.key} onClick={() => setSphere(s.key as any)} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${sphere === s.key ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}>
                  <i className={`fa-solid ${s.icon} text-xs`}></i>
                  <span className="text-[8px] font-black uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Візія та опис</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опишіть бажаний результат..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all h-24 resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Колір прапора</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-slate-200 scale-110 shadow-lg' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {aiEnabled && !initialData && (
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-indigo-900 leading-none mb-1">AI Планування</div>
                      <div className="text-[8px] font-bold text-indigo-400">Створити план дій та звички</div>
                   </div>
                </div>
                <button onClick={() => setAutoPlan(!autoPlan)} className={`w-10 h-5 rounded-full transition-all relative ${autoPlan ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPlan ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          )}
          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1 py-4 rounded-2xl font-black" onClick={onClose}>СКАСУВАТИ</Button>
            <Button disabled={!name.trim()} className="flex-[2] py-4 rounded-2xl shadow-xl shadow-orange-100 font-black" onClick={() => onSave({ name, description, color, sphere }, autoPlan)}>
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
      if (task) updateTask({ ...task, projectId: subProject.id, projectSection: 'actions', status: TaskStatus.DOING });
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
    <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
      className={`h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 ${dragOver ? 'ring-4 ring-inset ring-orange-100' : ''}`}>
      <header className="p-6 border-b border-slate-50 flex justify-between items-start">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-2xl text-white flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: subProject.color }}><i className="fa-solid fa-layer-group"></i></div>
           <div>
              <Typography variant="tiny" className="text-orange-500 font-black mb-0.5 uppercase tracking-widest text-[8px]">Етап проєкту</Typography>
              <Typography variant="h2" className="text-lg leading-tight">{subProject.name}</Typography>
           </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark text-xs"></i></button>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
         <section>
            <div className="flex justify-between items-center mb-4">
               <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-widest text-[9px]">Завдання етапу</Typography>
               <Badge variant="orange" className="text-[7px]">{progress}% COMPLETE</Badge>
            </div>
            <div className="space-y-1">
               {spTasks.map(t => {
                 const isDoing = t.status === TaskStatus.DOING;
                 return (
                   <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                     className={`flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ${isDoing ? 'opacity-40 grayscale' : ''}`}>
                      <button onClick={() => toggleTaskStatus(t)} className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                        {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                      </button>
                      <span className={`text-[13px] font-bold flex-1 truncate ${t.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{t.title}</span>
                      <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                   </div>
                 );
               })}
               <form onSubmit={e => { e.preventDefault(); if(newAction.trim()){ addTask(newAction.trim(), 'tasks', subProject.id, 'actions'); setNewAction(''); }}} className="pt-2">
                  <input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="+ Нова дія..." className="w-full bg-transparent border-b border-dashed border-slate-200 py-1 text-[13px] font-bold outline-none focus:border-orange-300 transition-colors" />
               </form>
            </div>
         </section>
      </div>
      <footer className="p-6 border-t border-slate-50 bg-slate-50/30">
         <div className="text-[8px] font-black text-slate-400 uppercase mb-3 text-center tracking-widest">Перетягніть сюди, щоб взяти в роботу</div>
         <Button variant="white" onClick={onClose} className="w-full text-[9px] font-black uppercase py-3 rounded-xl tracking-widest shadow-sm">ЗАКРИТИ</Button>
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

  const visibleGoalActions = useMemo(() => {
    const directTasks = tasks.filter(t => 
      !t.isDeleted && 
      t.projectId === goal.id && 
      t.projectSection !== 'habits'
    );

    const subProjectNextActions = subProjects.map(sp => {
      const spTasks = tasks.filter(t => 
        !t.isDeleted && 
        t.status !== TaskStatus.DONE && 
        t.projectId === sp.id && 
        t.projectSection !== 'habits'
      ).sort((a, b) => a.createdAt - b.createdAt);
      
      return spTasks.length > 0 ? [spTasks[0]] : [];
    }).flat();

    return [...directTasks, ...subProjectNextActions];
  }, [tasks, goal.id, subProjects]);

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

  const sphereIcons: Record<string, string> = { health: 'fa-heart-pulse', career: 'fa-briefcase', finance: 'fa-coins', education: 'fa-book-open-reader', relationships: 'fa-people-group', rest: 'fa-couch' };

  return (
    <Card padding="none" className={`bg-white border-slate-100 shadow-sm overflow-hidden transition-all ${isExpanded ? 'shadow-xl ring-1 ring-orange-100 scale-[1.01]' : 'hover:border-orange-200'}`}>
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0 transition-all" style={{ backgroundColor: goal.color }}></div>
        <div onClick={onToggle} className="flex-1 p-3.5 cursor-pointer flex items-center gap-4 group">
          <div className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-105 relative" style={{ backgroundColor: goal.color }}>
             <i className="fa-solid fa-flag-checkered text-sm"></i>
             {goal.sphere && (
               <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-lg bg-white shadow-md flex items-center justify-center text-[8px] text-slate-900 border border-slate-50"><i className={`fa-solid ${sphereIcons[goal.sphere] || 'fa-mountain'}`}></i></div>
             )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
               <Typography variant="h3" className="text-[15px] font-black uppercase tracking-tight text-slate-800 truncate">{goal.name}</Typography>
               <Badge variant="orange" className="text-[7px] py-0 px-1">{executionScore}% XP</Badge>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{goal.sphere || 'Вільна сфера'}</span>
             </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
             <div className="h-6 w-px bg-slate-100"></div>
             <i className={`fa-solid fa-chevron-right text-[10px] text-slate-300 transition-transform ${isExpanded ? 'rotate-90 text-orange-500' : ''}`}></i>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 bg-slate-50/10 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
           <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-100">
                {[{ id: 'actions', label: 'Дії', icon: 'fa-bolt' }, { id: 'subprojects', label: 'Етапи', icon: 'fa-layer-group' }, { id: 'habits', label: 'Звички', icon: 'fa-repeat' }].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-1.5 ${activeTab === t.id ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <i className={`fa-solid ${t.icon} text-[9px]`}></i> {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                 <button onClick={() => onEdit(goal)} className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-gear text-xs"></i></button>
                 <button onClick={() => { if(confirm('Видалити ціль?')) deleteProject(goal.id); }} className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
              </div>
           </div>

           <div className="space-y-3">
              <form onSubmit={handleInlineSubmit} className="flex gap-2">
                 <input value={inlineInputValue} onChange={e => setInlineInputValue(e.target.value)} placeholder={activeTab === 'actions' ? "Додати тактичний крок..." : activeTab === 'subprojects' ? "Новий етап..." : "Звичка..."} className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-[13px] font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-inner" />
                 <button type="submit" disabled={!inlineInputValue.trim()} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-lg hover:bg-orange-600 transition-all"><i className="fa-solid fa-plus"></i></button>
              </form>

              <div className="flex flex-col gap-1">
                 {activeTab === 'actions' && visibleGoalActions.map(task => {
                   const tProject = projects.find(p => p.id === task.projectId);
                   const isDoing = task.status === TaskStatus.DOING;
                   const isSub = tProject?.type === 'subproject';
                   return (
                    <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} onClick={() => onTaskClick(task.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl bg-white border group transition-all cursor-pointer ${isDoing ? 'opacity-60 grayscale border-slate-100' : 'border-slate-50 hover:border-orange-200 hover:bg-slate-50 shadow-sm'} ${selectedTaskId === task.id ? 'ring-2 ring-orange-200' : ''}`}>
                       <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-orange-400'}`}>
                          {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[9px]"></i>}
                       </button>
                       <div className="flex-1 min-w-0">
                         <div className={`text-[13px] font-bold truncate ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</div>
                         <div className="flex items-center gap-2 mt-0.5">
                            {tProject && isSub && <span className="text-[7px] font-black uppercase text-orange-400 opacity-70 px-1 bg-orange-50 rounded"># {tProject.name}</span>}
                            {isDoing && <Badge variant="slate" className="text-[6px] py-0 px-1 opacity-50">В процесі</Badge>}
                         </div>
                       </div>
                       <i className="fa-solid fa-chevron-right text-[8px] text-slate-200 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all"></i>
                    </div>
                 )})}

                 {activeTab === 'subprojects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {subProjects.map(sp => (
                         <div key={sp.id} onClick={() => onSubProjectClick(sp.id)} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group flex flex-col justify-between h-24">
                            <div className="flex items-center justify-between">
                               <div className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform" style={{ backgroundColor: sp.color || goal.color }}><i className="fa-solid fa-layer-group text-xs"></i></div>
                               <Badge variant="orange" className="text-[6px]">{sp.progress}%</Badge>
                            </div>
                            <div>
                               <div className="text-[10px] font-black text-slate-800 uppercase truncate mb-1.5">{sp.name}</div>
                               <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${sp.progress}%` }}></div></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}

                 {activeTab === 'habits' && goalHabits.map(h => (
                   <div key={h.id} onClick={() => onHabitClick(h.id)} className={`p-3 bg-white border rounded-xl flex items-center justify-between shadow-sm group cursor-pointer transition-all ${selectedHabitId === h.id ? 'border-orange-400 ring-2 ring-orange-50' : 'border-slate-50 hover:border-orange-200'}`}>
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] shadow-sm"><i className="fa-solid fa-repeat"></i></div>
                         <span className="text-[13px] font-bold text-slate-700">{h.title}</span>
                      </div>
                      <Badge variant="emerald" className="text-[7px] py-0 px-1">DAILY</Badge>
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
  const { projects, tasks, cycle, addProject, updateProject, toggleHabitStatus, toggleTaskStatus, updateTask, updateCycle, character, addTask, aiEnabled } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  
  const [activeMode, setActiveMode] = useState<'strategy' | 'execution' | 'structure'>('strategy');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean, editing?: Project }>({ open: false });
  const [isPlanning, setIsPlanning] = useState(false);

  const filteredGoals = useMemo(() => projects.filter(p => p.type === 'goal' && p.status === 'active'), [projects]);

  const handleSaveGoal = async (data: any, autoPlan: boolean) => {
    let projectId = '';
    if (modalState.editing) { updateProject({ ...modalState.editing, ...data }); projectId = modalState.editing.id; }
    else { projectId = addProject({ ...data, isStrategic: true, type: 'goal' }); }
    setModalState({ open: false });
    if (autoPlan && aiEnabled) {
      setIsPlanning(true);
      try {
        const plan = await planProjectStrategically(data.name, data.description || '', character);
        plan.nextActions.forEach((title: string) => addTask(title, 'tasks', projectId, 'actions'));
        plan.habits.forEach((title: string) => addTask(title, 'tasks', projectId, 'habits'));
        for (const sp of plan.subprojects) {
          const spId = addProject({ name: sp.title, color: data.color, parentFolderId: projectId, isStrategic: false, type: 'subproject' });
          sp.tasks.forEach((t: string) => addTask(t, 'tasks', spId, 'actions'));
        }
        alert('План сформовано!');
      } catch (e) { alert('Помилка планування.'); } finally { setIsPlanning(false); }
    }
  };

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="px-5 py-4 border-b border-slate-100 bg-white flex flex-col gap-4 sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <Typography variant="h2" className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none">Двигун 12TR</Typography>
                <div className="flex items-center gap-2 mt-1.5">
                   <div className="px-1.5 py-0.5 bg-orange-600 text-white text-[7px] font-black rounded uppercase tracking-widest">Активний</div>
                   <Typography variant="tiny" className="text-slate-300 font-bold text-[7px]">Тиждень {cycle.currentWeek}/12</Typography>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-100 mx-1"></div>
              <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                {[{ id: 'strategy', label: 'Стратегія', icon: 'fa-chess-king' }, { id: 'execution', label: 'Виконання', icon: 'fa-bolt-lightning' }, { id: 'structure', label: 'Структура', icon: 'fa-sitemap' }].map(m => (
                  <button key={m.id} onClick={() => setActiveMode(m.id as any)} className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeMode === m.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    <i className={`fa-solid ${m.icon} text-[9px]`}></i> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <Button icon={isPlanning ? "fa-circle-notch animate-spin" : "fa-plus"} disabled={isPlanning} className="rounded-lg px-4 py-2 font-black text-[8px] uppercase tracking-widest shadow-lg shadow-orange-100" onClick={() => setModalState({ open: true })}>
               {isPlanning ? '...' : 'ЦІЛЬ'}
            </Button>
          </div>
          <div className="w-full space-y-1">
             <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-400 px-1">
                <span>Прогрес циклу</span>
                <span className="text-orange-600">{cycle.globalExecutionScore}% XP</span>
             </div>
             <div className="flex gap-0.5 h-0.5">
                {Array.from({length: 12}).map((_, i) => <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i + 1 < cycle.currentWeek ? 'bg-orange-600' : i + 1 === cycle.currentWeek ? 'bg-slate-900' : 'bg-slate-100'}`}></div>)}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {activeMode === 'structure' ? <StructureView /> : activeMode === 'execution' ? (
             <div className="p-5 max-w-3xl mx-auto space-y-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <Card className="bg-slate-900 text-white p-4 border-none shadow-xl overflow-hidden relative min-h-[100px] flex flex-col justify-center"><Typography variant="tiny" className="text-orange-500 mb-0.5 font-black uppercase text-[7px]">Поточний фокус</Typography><Typography variant="h2" className="text-2xl font-black">Тиждень {cycle.currentWeek}</Typography></Card>
                   <Card className="p-4 bg-white border-slate-100 text-center flex flex-col items-center justify-center"><div className="text-2xl font-black text-slate-900 mb-0.5">{cycle.globalExecutionScore}%</div><Typography variant="tiny" className="text-slate-400 font-black uppercase text-[7px]">Загальний KPI</Typography></Card>
                   <Card className="p-4 bg-white border-slate-100 flex flex-col justify-center"><div className="flex justify-between items-center mb-1"><Typography variant="tiny" className="text-slate-400 font-black text-[7px]">STREAK</Typography><span className="text-orange-500 font-black text-[11px]">🔥 12</span></div><div className="flex justify-between items-center"><Typography variant="tiny" className="text-slate-400 font-black text-[7px]">КВЕСТІВ</Typography><span className="text-indigo-600 font-black text-[11px]">84</span></div></Card>
                </div>
                
                <div className="space-y-4">
                   <Typography variant="h2" className="text-[10px] uppercase font-black tracking-widest px-1 text-slate-400">Наступні дії за проєктами</Typography>
                   {filteredGoals.map(goal => {
                     const goalSubProjects = projects.filter(p => p.parentFolderId === goal.id && p.status === 'active');
                     const directTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.projectId === goal.id && t.projectSection !== 'habits');
                     
                     const subProjectNextActions = goalSubProjects.map(sp => {
                       const spTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.projectId === sp.id && t.projectSection !== 'habits').sort((a, b) => a.createdAt - b.createdAt);
                       return spTasks.length > 0 ? [spTasks[0]] : [];
                     }).flat();

                     const allVisibleActions = [...directTasks, ...subProjectNextActions];
                     if (allVisibleActions.length === 0) return null;

                     return (
                        <div key={goal.id} className="space-y-1.5">
                           <div className="flex items-center gap-1.5 px-1 mt-2">
                              <div className="w-1 h-2 rounded-full" style={{ backgroundColor: goal.color }}></div>
                              <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">{goal.name}</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {allVisibleActions.map(t => {
                                const isSub = projects.find(p => p.id === t.projectId && p.type === 'subproject');
                                return (
                                 <Card key={t.id} padding="none" onClick={() => setSelectedTaskId(t.id)} className={`bg-white border-slate-100 hover:border-orange-200 transition-all flex items-center gap-2 p-2.5 group cursor-pointer ${t.status === TaskStatus.DOING ? 'opacity-60 grayscale border-slate-200 bg-slate-50 shadow-none' : 'shadow-sm'}`}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-orange-400'}`}>
                                       {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                       <span className={`text-[13px] font-bold truncate block ${t.status === TaskStatus.DONE ? 'line-through opacity-30' : 'text-slate-700'}`}>{t.title}</span>
                                       {isSub && <span className="text-[7px] font-black text-orange-400 uppercase truncate px-1 bg-orange-50 rounded"># {isSub.name}</span>}
                                    </div>
                                 </Card>
                              )})}
                           </div>
                        </div>
                     )
                   })}
                </div>
             </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 space-y-4 px-4 pb-32">
              <div className="flex items-center justify-between px-2 mb-1">
                 <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Стратегічні цілі циклу</Typography>
                 <Badge variant="orange" icon="fa-mountain-sun" className="text-[7px]">{filteredGoals.length} ЦІЛЕЙ</Badge>
              </div>
              {filteredGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} isExpanded={expandedId === goal.id} onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)} onTaskClick={(id) => { setSelectedTaskId(id); setSelectedHabitId(null); setSelectedSubProjectId(null); }} onHabitClick={(id) => { setSelectedHabitId(id); setSelectedTaskId(null); setSelectedSubProjectId(null); }} onSubProjectClick={(id) => { setSelectedSubProjectId(id); setSelectedTaskId(null); setSelectedHabitId(null); }} onEdit={(g) => setModalState({ open: true, editing: g })} selectedTaskId={selectedTaskId} selectedHabitId={selectedHabitId} />
              ))}
              {filteredGoals.length === 0 && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center">
                   <i className="fa-solid fa-mountain-sun text-5xl mb-4"></i>
                   <Typography variant="h2" className="text-lg font-black uppercase">Мапа стратегії порожня</Typography>
                   <button onClick={() => setModalState({ open: true })} className="mt-4 text-orange-600 font-black uppercase text-[9px] hover:underline decoration-2 underline-offset-4">+ Встановити ціль</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full border-l border-slate-100 z-40 bg-white shrink-0 overflow-hidden">
        <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
        <div style={{ width: detailsWidth }} className="h-full bg-white relative flex flex-col overflow-hidden">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : selectedSubProjectId ? (
            <SubProjectPanel subProject={projects.find(p => p.id === selectedSubProjectId)!} onClose={() => setSelectedSubProjectId(null)} />
          ) : selectedHabit ? (
            <div className="h-full animate-in slide-in-from-right duration-300">
               <HabitStatsSidebar habit={selectedHabit} onClose={() => setSelectedHabitId(null)} onUpdate={(updates) => updateTask({ ...selectedHabit, ...updates })} onToggleStatus={toggleHabitStatus} />
            </div>
          ) : (
            <div className="h-full flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
               <header className="p-6 border-b border-slate-100 bg-white flex justify-between items-end"><div><Typography variant="tiny" className="text-orange-500 mb-1 block font-black uppercase text-[9px]">Система 12TR</Typography><Typography variant="h2" className="text-base">Аналітика Року</Typography></div><Badge variant="emerald" className="text-[7px]">SYNCED</Badge></header>
               <div className="p-6 space-y-6">
                  <section className="space-y-3">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Глобальний фокус</Typography>
                     <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-xl space-y-3 relative overflow-hidden"><div className="absolute bottom-0 right-0 w-16 h-16 bg-orange-600/10 blur-2xl"></div><div className="flex justify-between items-end"><span className="text-3xl font-black">{cycle.globalExecutionScore}%</span><div className="text-right"><div className="text-[7px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Execution</div><div className="text-[9px] font-bold text-slate-400">Score</div></div></div><div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-orange-500 shadow-[0_0_10px_#f97316] transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div></div></div>
                  </section>
                  <section className="space-y-3">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Керування Фазою</Typography>
                     <Card padding="sm" className="space-y-3 bg-white border-slate-100 shadow-sm"><div className="space-y-1.5"><label className="text-[8px] font-black text-slate-900 uppercase flex items-center gap-1.5"><i className="fa-solid fa-calendar-week text-orange-500"></i> Поточний тиждень</label><div className="flex items-center gap-3"><input type="number" min="1" max="12" value={cycle.currentWeek} onChange={e => updateCycle({ currentWeek: parseInt(e.target.value) || 1 })} className="w-16 bg-slate-50 border border-slate-100 rounded-lg py-1 px-2 text-xs font-black outline-none" /><span className="text-[8px] text-slate-400 font-bold uppercase">W / 12</span></div></div><div className="space-y-1.5"><label className="text-[8px] font-black text-slate-900 uppercase flex items-center gap-1.5"><i className="fa-solid fa-clock text-indigo-500"></i> Початок циклу</label><input type="date" value={new Date(cycle.startDate).toISOString().split('T')[0]} onChange={e => updateCycle({ startDate: new Date(e.target.value).getTime() })} className="w-full bg-slate-50 border border-slate-100 rounded-lg py-1 px-2 text-[9px] font-black outline-none" /></div></Card>
                  </section>
               </div>
            </div>
          )}
        </div>
      </div>
      {modalState.open && <GoalModal onClose={() => setModalState({ open: false })} onSave={handleSaveGoal} initialData={modalState.editing} aiEnabled={aiEnabled} />}
    </div>
  );
};

export default ProjectsView;
