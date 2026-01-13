
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
import PlannerView from './PlannerView';
import GoalCard from '../components/projects/GoalCard';

const GoalModal: React.FC<{ 
  onClose: () => void, 
  onSave: (data: any, autoPlan: boolean) => void,
  initialData?: Project,
  aiEnabled: boolean
}> = ({ onClose, onSave, initialData, aiEnabled }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || 'var(--primary)');
  const [sphere, setSphere] = useState<Project['sphere']>(initialData?.sphere || 'career');
  const [autoPlan, setAutoPlan] = useState(false);
  
  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <Card className="w-full max-w-lg relative z-10 shadow-2xl p-5 md:p-6 rounded-[2rem] bg-card animate-in zoom-in-95 duration-200 border-theme overflow-y-auto max-h-[90vh]">
        <Typography variant="h2" className="mb-4 text-lg">
          {initialData ? 'Редагувати Ціль' : 'Нова Стратегічна Ціль'}
        </Typography>
        <div className="space-y-4">
          <div>
            <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Назва цілі</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Напр: Досягти фінансової свободи" className="w-full bg-main border border-theme rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Сфера життя</label>
            <div className="grid grid-cols-3 gap-1.5">
              {spheres.map(s => (
                <button key={s.key} onClick={() => setSphere(s.key as any)} className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${sphere === s.key ? 'border-primary bg-primary/10 text-primary' : 'border-theme bg-main text-muted hover:border-primary/30'}`}>
                  <i className={`fa-solid ${s.icon} text-[10px]`}></i>
                  <span className="text-[7px] font-black uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Візія</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опишіть бажаний результат..." className="w-full bg-main border border-theme rounded-xl p-3 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all h-20 resize-none" />
          </div>
          {aiEnabled && !initialData && (
             <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles text-xs"></i></div>
                   <div>
                      <div className="text-[9px] font-black uppercase text-primary leading-none">AI План</div>
                      <div className="text-[7px] font-bold text-muted mt-0.5">Декомпозиція</div>
                   </div>
                </div>
                <button onClick={() => setAutoPlan(!autoPlan)} className={`w-9 h-5 rounded-full transition-all relative ${autoPlan ? 'bg-primary' : 'bg-muted/20'}`}>
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPlan ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="white" className="flex-1 py-3 rounded-xl font-black text-[10px]" onClick={onClose}>ВІДМІНА</Button>
            <Button disabled={!name.trim()} className="flex-[2] py-3 rounded-xl shadow-xl font-black text-[10px]" onClick={() => onSave({ name, description, color, sphere }, autoPlan)}>
              {initialData ? 'ЗБЕРЕГТИ' : 'ВСТАНОВИТИ ЦІЛЬ'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const SubProjectPanel: React.FC<{ subProject: Project, onClose: () => void }> = ({ subProject, onClose }) => {
  const { tasks, toggleTaskStatus, updateProject, addTask, updateTask, deleteTask } = useApp();
  const [newAction, setNewAction] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const spTasks = tasks.filter(t => t.projectId === subProject.id && !t.isDeleted);
  const progress = useMemo(() => {
    if (spTasks.length === 0) return 0;
    const done = spTasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / spTasks.length) * 100);
  }, [spTasks]);

  useEffect(() => {
    if (progress !== subProject.progress) {
      updateProject({ ...subProject, progress });
    }
  }, [progress, subProject.progress]);

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => {
      e.preventDefault(); setDragOver(false);
      const tid = e.dataTransfer.getData('taskId');
      const t = tasks.find(x => x.id === tid);
      if (t) updateTask({ ...t, projectId: subProject.id, projectSection: 'actions', status: TaskStatus.DOING });
    }}
      className={`h-full flex flex-col bg-card animate-in slide-in-from-right duration-300 ${dragOver ? 'ring-4 ring-inset ring-primary/20' : ''}`}>
      <header className="p-4 border-b border-theme flex justify-between items-start">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-lg shadow-lg" style={{ backgroundColor: subProject.color || 'var(--primary)' }}><i className="fa-solid fa-layer-group"></i></div>
           <div>
              <Typography variant="tiny" className="text-primary font-black mb-0.5 uppercase tracking-widest text-[8px]">Етап проєкту</Typography>
              <Typography variant="h2" className="text-sm leading-tight uppercase font-black">{subProject.name}</Typography>
           </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-main flex items-center justify-center text-muted hover:text-primary transition-colors"><i className="fa-solid fa-xmark text-xs"></i></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
         <section>
            <div className="flex justify-between items-center mb-3">
               <Typography variant="tiny" className="text-main font-black uppercase tracking-widest text-[8px]">Квести етапу</Typography>
               <div className="text-[7px] font-black py-0.5 px-2 bg-primary/10 text-primary rounded-full">{progress}%</div>
            </div>
            <div className="space-y-1.5">
               {spTasks.map(t => (
                 <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                   className={`flex items-center gap-2.5 p-2.5 bg-main border border-theme rounded-xl group hover:border-primary/30 transition-all ${t.status === TaskStatus.DOING ? 'opacity-50 grayscale' : ''}`}>
                    <button onClick={() => toggleTaskStatus(t)} className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-card border-theme group-hover:border-primary'}`}>
                      {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                    </button>
                    <span className={`text-[12px] font-bold flex-1 truncate ${t.status === TaskStatus.DONE ? 'text-muted line-through opacity-50' : 'text-main'}`}>{t.title}</span>
                    <button onClick={() => deleteTask(t.id)} className="text-muted hover:text-rose-500 transition-all p-1 opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                 </div>
               ))}
               <form onSubmit={e => { e.preventDefault(); if(newAction.trim()){ addTask(newAction.trim(), 'tasks', subProject.id, 'actions'); setNewAction(''); }}} className="pt-1">
                  <input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="+ Нова дія..." className="w-full bg-main border border-theme rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-primary/50 transition-colors text-main" />
               </form>
            </div>
         </section>
      </div>
    </div>
  );
};

const ProjectsView: React.FC = () => {
  const { projects, tasks, cycle, addProject, updateProject, toggleHabitStatus, toggleTaskStatus, updateTask, character, addTask, aiEnabled } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);
  
  const [activeMode, setActiveMode] = useState<'strategy' | 'execution' | 'structure' | 'project_planner'>('strategy');
  const [projectTab, setProjectTab] = useState<'focus' | 'all' | 'archived'>('focus');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState<string | null>(null);
  const [selectedProjectPlannerId, setSelectedProjectPlannerId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean, editing?: Project }>({ open: false });
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [collapsedSpheres, setCollapsedSpheres] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredGoals = useMemo(() => {
    let list = projects.filter(p => p.type === 'goal');
    if (projectTab === 'focus') return list.filter(p => p.status === 'active');
    if (projectTab === 'archived') return list.filter(p => p.status === 'archived');
    return list;
  }, [projects, projectTab]);

  const groupedBySphere = useMemo(() => {
    const spheres: Record<string, Project[]> = {
      health: [], career: [], finance: [], education: [], relationships: [], rest: [], general: []
    };
    filteredGoals.forEach(g => {
      const s = g.sphere || 'general';
      if (spheres[s]) spheres[s].push(g);
      else spheres.general.push(g);
    });
    return spheres;
  }, [filteredGoals]);

  const toggleSphere = (s: string) => {
    const next = new Set(collapsedSpheres);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setCollapsedSpheres(next);
  };

  const handleSaveGoal = async (data: any, autoPlan: boolean) => {
    let projectId = '';
    if (modalState.editing) { 
      updateProject({ ...modalState.editing, ...data }); 
      projectId = modalState.editing.id; 
    }
    else { 
      projectId = addProject({ ...data, isStrategic: true, type: 'goal' }); 
    }
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
      } catch (e) { alert('Помилка планування.'); } finally { setIsPlanning(false); }
    }
  };

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  if (activeMode === 'project_planner' && selectedProjectPlannerId) {
    return (
      <PlannerView 
        projectId={selectedProjectPlannerId} 
        onExitProjectMode={() => {
          setActiveMode('strategy');
          setSelectedProjectPlannerId(null);
        }} 
      />
    );
  }

  const spheresMetadata = [
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins' },
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch' },
    { key: 'general', label: 'Загальне', icon: 'fa-mountain' },
  ];

  return (
    <div className="h-screen flex bg-main overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="px-4 md:px-6 py-2 border-b border-theme bg-card flex flex-col gap-2 sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex flex-col shrink-0">
                <Typography variant="h2" className="text-xs md:text-sm font-black uppercase tracking-widest text-main">Projects</Typography>
                <div className="flex items-center gap-1.5">
                   <div className="px-1 py-0.5 bg-primary text-white text-[6px] font-black rounded uppercase">Live</div>
                   <Typography variant="tiny" className="text-muted font-bold text-[7px] uppercase tracking-tighter">Week {cycle.currentWeek}</Typography>
                </div>
              </div>
              <div className="h-5 w-px bg-theme shrink-0 mx-1"></div>
              <div className="flex bg-main p-0.5 rounded-lg border border-theme shrink-0">
                {[{ id: 'strategy', label: 'Стратегія', icon: 'fa-chess-king' }, { id: 'execution', label: 'Тактика', icon: 'fa-bolt-lightning' }, { id: 'structure', label: 'Дерево', icon: 'fa-sitemap' }].map(m => (
                  <button key={m.id} onClick={() => setActiveMode(m.id as any)} className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeMode === m.id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-main'}`}>
                    <i className={`fa-solid ${m.icon} text-[7px]`}></i> {!isMobile && m.label}
                  </button>
                ))}
              </div>
            </div>
            <Button icon={isPlanning ? "fa-circle-notch animate-spin" : "fa-plus"} disabled={isPlanning} className="rounded-lg h-7 px-3 py-0 font-black text-[7px] uppercase tracking-widest shadow-md" onClick={() => setModalState({ open: true })}>
               {isPlanning ? '...' : 'Нова Ціль'}
            </Button>
          </div>
          
          {activeMode === 'strategy' && (
            <div className="flex gap-4 border-t border-theme pt-2 mt-1">
               {(['focus', 'all', 'archived'] as const).map(tab => (
                 <button key={tab} onClick={() => setProjectTab(tab)} className={`pb-1 text-[8px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${projectTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted'}`}>
                   {tab === 'focus' ? 'Фокус' : tab === 'all' ? 'Всі цілі' : 'Архів'}
                 </button>
               ))}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5 pb-24 md:pb-32">
          {activeMode === 'structure' ? <StructureView /> : activeMode === 'execution' ? (
             <div className="max-w-3xl mx-auto space-y-4">
                <div className="grid grid-cols-3 gap-3">
                   <Card className="bg-slate-900 text-white p-3 border-none shadow-xl flex flex-col justify-center">
                      <Typography variant="tiny" className="text-orange-500 mb-0.5 uppercase text-[6px] font-black">Week Focus</Typography>
                      <Typography variant="h2" className="text-sm font-black text-white">Week {cycle.currentWeek}</Typography>
                   </Card>
                   <Card className="p-3 bg-card border-theme flex flex-col items-center justify-center">
                      <div className="text-sm font-black text-main">{cycle.globalExecutionScore}%</div>
                      <Typography variant="tiny" className="text-muted text-[6px] font-black uppercase">Overall KPI</Typography>
                   </Card>
                   <Card className="p-3 bg-card border-theme flex flex-col justify-center">
                      <div className="flex justify-between items-center"><Typography variant="tiny" className="text-muted text-[6px] font-black">STREAK</Typography><span className="text-primary font-black text-[10px]">12</span></div>
                      <div className="flex justify-between items-center"><Typography variant="tiny" className="text-muted text-[6px] font-black">TASKS</Typography><span className="text-indigo-600 font-black text-[10px]">84</span></div>
                   </Card>
                </div>
                
                <div className="space-y-3">
                   <Typography variant="h2" className="text-[8px] uppercase font-black tracking-widest text-muted px-1">Тактичні дії за проєктами</Typography>
                   {projects.filter(p => p.type === 'goal' && p.status === 'active').map(goal => {
                     const directTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.projectId === goal.id && t.projectSection !== 'habits');
                     const subProjectTasks = projects.filter(sp => sp.parentFolderId === goal.id).map(sp => {
                        const next = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.projectId === sp.id).sort((a,b) => a.createdAt-b.createdAt);
                        return next.length > 0 ? [next[0]] : [];
                     }).flat();
                     const allActions = [...directTasks, ...subProjectTasks];
                     if (allActions.length === 0) return null;

                     return (
                        <div key={goal.id} className="space-y-1">
                           <div className="flex items-center gap-1.5 px-1 mt-3">
                              <div className="w-1 h-3 rounded-full" style={{ backgroundColor: goal.color || 'var(--primary)' }}></div>
                              <span className="text-[9px] font-black uppercase text-muted truncate">{goal.name}</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {allActions.map(t => (
                                 <Card key={t.id} padding="none" onClick={() => setSelectedTaskId(t.id)} className={`bg-card border-theme hover:border-primary/30 transition-all flex items-center gap-3 p-3 group cursor-pointer ${t.status === TaskStatus.DOING ? 'opacity-50 grayscale' : 'shadow-sm'}`}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-card border-theme group-hover:border-primary'}`}>
                                       {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
                                    </button>
                                    <span className={`text-[11px] font-bold truncate block ${t.status === TaskStatus.DONE ? 'line-through opacity-30' : 'text-main'}`}>{t.title}</span>
                                 </Card>
                              ))}
                           </div>
                        </div>
                     )
                   })}
                </div>
             </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {projectTab === 'all' ? (
                spheresMetadata.map(sphere => {
                  const items = groupedBySphere[sphere.key];
                  if (items.length === 0) return null;
                  const isCol = collapsedSpheres.has(sphere.key);
                  return (
                    <div key={sphere.key} className="space-y-3">
                       <button onClick={() => toggleSphere(sphere.key)} className="flex items-center gap-3 w-full px-1 group">
                          <div className="w-6 h-6 rounded-lg bg-main border border-theme flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                             <i className={`fa-solid ${sphere.icon} text-[10px]`}></i>
                          </div>
                          <Typography variant="tiny" className="font-black uppercase tracking-[0.2em] text-main flex-1 text-left">{sphere.label}</Typography>
                          <i className={`fa-solid fa-chevron-right text-[8px] text-muted transition-transform ${!isCol ? 'rotate-90' : ''}`}></i>
                       </button>
                       {!isCol && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                           {items.map(goal => (
                             <GoalCard 
                               key={goal.id} 
                               goal={goal} 
                               isExpanded={expandedId === goal.id} 
                               onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)} 
                               onTaskClick={(id) => { setSelectedTaskId(id); setSelectedHabitId(null); setSelectedSubProjectId(null); }} 
                               onHabitClick={(id) => { setSelectedHabitId(id); setSelectedTaskId(null); setSelectedSubProjectId(null); }} 
                               onSubProjectClick={(id) => { setSelectedSubProjectId(id); setSelectedTaskId(null); setSelectedHabitId(null); }} 
                               onPlannerClick={(id) => { setSelectedProjectPlannerId(id); setActiveMode('project_planner'); }}
                               onEdit={(g) => setModalState({ open: true, editing: g })} 
                               selectedTaskId={selectedTaskId} 
                               selectedHabitId={selectedHabitId} 
                             />
                           ))}
                         </div>
                       )}
                    </div>
                  )
                })
              ) : (
                filteredGoals.map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    isExpanded={expandedId === goal.id} 
                    onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)} 
                    onTaskClick={(id) => { setSelectedTaskId(id); setSelectedHabitId(null); setSelectedSubProjectId(null); }} 
                    onHabitClick={(id) => { setSelectedHabitId(id); setSelectedTaskId(null); setSelectedSubProjectId(null); }} 
                    onSubProjectClick={(id) => { setSelectedSubProjectId(id); setSelectedTaskId(null); setSelectedHabitId(null); }} 
                    onPlannerClick={(id) => { setSelectedProjectPlannerId(id); setActiveMode('project_planner'); }}
                    onEdit={(g) => setModalState({ open: true, editing: g })} 
                    selectedTaskId={selectedTaskId} 
                    selectedHabitId={selectedHabitId} 
                  />
                ))
              )}
              
              {filteredGoals.length === 0 && (
                <div className="py-20 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale">
                   <i className="fa-solid fa-flag-checkered text-7xl mb-6"></i>
                   <Typography variant="h2" className="text-xl">Список порожній</Typography>
                   <Typography variant="body" className="mt-2 text-xs">Жодних активних цілей у цій вкладці</Typography>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex h-full border-l border-theme z-[110] bg-card shrink-0 transition-all duration-300 ${isMobile ? (selectedTaskId || selectedSubProjectId || selectedHabit ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-primary z-[100] transition-colors ${isResizing ? 'bg-primary' : 'bg-theme'}`}></div>}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-card relative flex flex-col overflow-hidden">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : selectedSubProjectId ? (
            <SubProjectPanel subProject={projects.find(p => p.id === selectedSubProjectId)!} onClose={() => setSelectedSubProjectId(null)} />
          ) : selectedHabit ? (
            <HabitStatsSidebar habit={selectedHabit} onClose={() => setSelectedHabitId(null)} onUpdate={(u) => updateTask({ ...selectedHabit, ...u })} onToggleStatus={toggleHabitStatus} />
          ) : !isMobile && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-10 pointer-events-none select-none">
              <i className="fa-solid fa-chess-king text-8xl mb-6"></i>
              <Typography variant="h2" className="text-xl font-black uppercase tracking-widest">Goal Engine</Typography>
            </div>
          )}
        </div>
      </div>
      {modalState.open && <GoalModal onClose={() => setModalState({ open: false })} onSave={handleSaveGoal} initialData={modalState.editing} aiEnabled={aiEnabled} />}
    </div>
  );
};

export default ProjectsView;
