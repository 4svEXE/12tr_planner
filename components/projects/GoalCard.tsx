
import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project, Task, TaskStatus } from '../../types';
import Card from '../ui/Card';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

interface GoalCardProps {
  goal: Project;
  isExpanded: boolean;
  onToggle: () => void;
  onTaskClick: (id: string) => void;
  onHabitClick: (id: string) => void;
  onSubProjectClick: (id: string) => void;
  onPlannerClick: (id: string) => void;
  onEdit: (goal: Project) => void;
  selectedTaskId: string | null;
  selectedHabitId: string | null;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  isExpanded, 
  onToggle, 
  onTaskClick, 
  onHabitClick, 
  onSubProjectClick, 
  onPlannerClick, 
  onEdit, 
  selectedTaskId, 
  selectedHabitId 
}) => {
  const { tasks, projects, addProject, addTask, deleteProject, toggleTaskStatus, updateProject } = useApp();
  const [activeTab, setActiveTab] = useState<'actions' | 'subprojects' | 'habits'>('actions');
  const [inlineInputValue, setInlineInputValue] = useState('');
  
  // Animation handling
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  
  const subProjects = projects.filter(p => p.parentFolderId === goal.id && p.status === 'active');
  
  const visibleGoalActions = useMemo(() => {
    const directTasks = tasks.filter(t => !t.isDeleted && t.projectId === goal.id && t.projectSection !== 'habits' && (!t.recurrence || t.recurrence === 'none'));
    const subProjectNextActions = subProjects.map(sp => {
      const spTasks = tasks.filter(t => !t.isDeleted && t.projectId === sp.id && t.projectSection !== 'habits').sort((a, b) => a.createdAt - b.createdAt);
      const relevant = spTasks.filter(t => t.status !== TaskStatus.DONE || completingIds.has(t.id));
      return relevant.length > 0 ? [relevant[0]] : [];
    }).flat();
    
    return [...directTasks, ...subProjectNextActions].filter(t => t.status !== TaskStatus.DONE || completingIds.has(t.id));
  }, [tasks, goal.id, subProjects, completingIds]);

  const goalHabits = useMemo(() => {
    return tasks.filter(t => 
      !t.isDeleted && 
      t.projectId === goal.id && 
      (t.projectSection === 'habits' || (t.recurrence && t.recurrence !== 'none'))
    );
  }, [tasks, goal.id]);

  const plannerEfficiency = useMemo(() => {
    const plannerItems = tasks.filter(t => !t.isDeleted && t.projectId === goal.id && t.projectSection === 'planner');
    if (plannerItems.length === 0) return goal.progress || 0;
    const done = plannerItems.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / plannerItems.length) * 100);
  }, [tasks, goal.id, goal.progress]);

  const handleToggleTaskWithDelay = (task: Task) => {
    if (task.status !== TaskStatus.DONE) {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.add(task.id);
        return next;
      });
      setTimeout(() => {
        toggleTaskStatus(task);
        setCompletingIds(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 700);
    } else {
      toggleTaskStatus(task);
    }
  };

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
    <Card padding="none" className={`bg-card border-theme shadow-sm overflow-hidden transition-all ${isExpanded ? 'shadow-lg ring-2 ring-primary/10' : 'hover:border-primary/30'}`}>
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0 transition-all" style={{ backgroundColor: goal.color || 'var(--primary)' }}></div>
        <div onClick={onToggle} className="flex-1 p-3 md:p-4 cursor-pointer flex items-center gap-3 md:gap-4 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-105 relative" style={{ backgroundColor: goal.color || 'var(--primary)' }}>
             <i className="fa-solid fa-flag-checkered text-xs md:text-sm"></i>
             {goal.sphere && (
               <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-white shadow-md flex items-center justify-center text-[7px] text-slate-900 border border-slate-50"><i className={`fa-solid ${sphereIcons[goal.sphere] || 'fa-mountain'}`}></i></div>
             )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
               <Typography variant="h3" className="text-xs md:text-[14px] font-black uppercase tracking-tight truncate leading-none">{goal.name}</Typography>
               <div className="text-[7px] font-black py-0 px-1.5 rounded-full bg-primary/10 text-primary" title="Tactic KPI">{plannerEfficiency}%</div>
             </div>
             <div className="flex gap-2 items-center">
                <div className="text-[7px] font-black text-muted uppercase tracking-widest">{goal.sphere || 'General'}</div>
                {goal.lagMeasure && (
                  <div className="flex items-center gap-1 text-[7px] font-black text-rose-500 uppercase">
                    <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                    Lag: {goal.lagMeasure}
                  </div>
                )}
             </div>
          </div>
          <div className="flex gap-2">
            {goal.status === 'active' ? (
               <button onClick={(e) => { e.stopPropagation(); updateProject({...goal, status: 'archived'}); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all" title="В архів">
                <i className="fa-solid fa-box-archive text-[11px]"></i>
               </button>
            ) : (
               <button onClick={(e) => { e.stopPropagation(); updateProject({...goal, status: 'active'}); }} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all" title="Активувати">
                <i className="fa-solid fa-play text-[11px]"></i>
               </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onPlannerClick(goal.id); }} className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Планувальник проєкту">
              <i className="fa-solid fa-calendar-check text-[11px]"></i>
            </button>
            <i className={`fa-solid fa-chevron-right text-[8px] text-muted transition-transform self-center ${isExpanded ? 'rotate-90 text-primary' : ''}`}></i>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 md:px-4 pb-4 pt-1 bg-black/5 border-t border-theme animate-in slide-in-from-top-2 duration-300">
           
           {/* 12TR METRICS AREA */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-3">
              <div className="bg-white/60 p-2 rounded-xl border border-emerald-100 flex items-center gap-3">
                 <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[8px] shadow-sm"><i className="fa-solid fa-forward"></i></div>
                 <div>
                    <div className="text-[6px] font-black text-emerald-600 uppercase">Lead Measure (Дія)</div>
                    <div className="text-[9px] font-bold text-slate-700 leading-tight">{goal.leadMeasure || 'Не вказано'}</div>
                 </div>
              </div>
              <div className="bg-white/60 p-2 rounded-xl border border-rose-100 flex items-center gap-3">
                 <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center text-[8px] shadow-sm"><i className="fa-solid fa-bullseye"></i></div>
                 <div>
                    <div className="text-[6px] font-black text-rose-600 uppercase">Lag Measure (Результат)</div>
                    <div className="text-[9px] font-bold text-slate-700 leading-tight">{goal.lagMeasure || 'Не вказано'}</div>
                 </div>
              </div>
           </div>

           <div className="flex justify-between items-center mb-3 overflow-x-auto no-scrollbar pb-1 pt-2">
              <div className="flex gap-1 bg-main p-1 rounded-xl border border-theme shrink-0">
                {[{ id: 'actions', label: 'Дії', icon: 'fa-bolt' }, { id: 'subprojects', label: 'Етапи', icon: 'fa-layer-group' }, { id: 'habits', label: 'Звички', icon: 'fa-repeat' }].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-2.5 md:px-3 py-1.5 text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-1 md:gap-1.5 ${activeTab === t.id ? 'bg-card shadow-sm text-primary' : 'text-muted hover:text-main'}`}>
                    <i className={`fa-solid ${t.icon} text-[8px] md:text-[9px]`}></i> {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 shrink-0 ml-4">
                 <button onClick={() => onEdit(goal)} className="w-7 h-7 rounded-xl bg-card border border-theme text-muted hover:text-primary transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-pencil text-[9px]"></i></button>
                 <button onClick={() => { if(confirm('Видалити ціль?')) deleteProject(goal.id); }} className="w-7 h-7 rounded-xl bg-card border border-theme text-muted hover:text-rose-500 transition-all flex items-center justify-center shadow-sm"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
              </div>
           </div>

           <div className="space-y-3">
              <form onSubmit={handleInlineSubmit} className="flex gap-2">
                 <input value={inlineInputValue} onChange={e => setInlineInputValue(e.target.value)} placeholder={activeTab === 'actions' ? "Наступний крок..." : activeTab === 'subprojects' ? "Новий етап..." : "Звичка або повторюване..."} className="flex-1 bg-card border border-theme rounded-xl py-2 px-3 text-[11px] font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner text-main" />
                 <button type="submit" disabled={!inlineInputValue.trim()} className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-lg active:scale-95 transition-all shrink-0"><i className="fa-solid fa-plus text-xs"></i></button>
              </form>

              <div className="flex flex-col gap-1">
                 {activeTab === 'actions' && visibleGoalActions.map(task => {
                   const tProject = projects.find(p => p.id === task.projectId);
                   const isCompleting = completingIds.has(task.id);
                   const isDone = task.status === TaskStatus.DONE;
                   
                   return (
                    <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} onClick={() => onTaskClick(task.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-theme group transition-all cursor-pointer ${isDone ? 'opacity-50 grayscale' : 'hover:border-primary/30'} ${isCompleting ? 'scale-[0.98]' : ''}`}>
                       <button onClick={(e) => { e.stopPropagation(); handleToggleTaskWithDelay(task); }} className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isDone || isCompleting ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-card border-theme group-hover:border-primary'}`}>
                          {(isDone || isCompleting) && <i className="fa-solid fa-check text-[7px]"></i>}
                       </button>
                       <div className="flex-1 min-w-0">
                         <div className={`text-[12px] font-bold truncate strike-anim ${isDone || isCompleting ? 'is-striking text-muted line-through opacity-50' : 'text-main'}`}>{task.title}</div>
                         {tProject && tProject.type === 'subproject' && <span className="text-[7px] font-black uppercase text-primary opacity-60"># {tProject.name}</span>}
                       </div>
                    </div>
                 )})}

                 {activeTab === 'subprojects' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {subProjects.map(sp => (
                         <div key={sp.id} onClick={() => onSubProjectClick(sp.id)} className="bg-card p-3 rounded-2xl border border-theme shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between h-16">
                            <div className="flex items-center justify-between">
                               <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center shadow-lg" style={{ backgroundColor: sp.color || goal.color || 'var(--primary)' }}><i className="fa-solid fa-layer-group text-[8px]"></i></div>
                               <span className="text-[9px] font-black text-main uppercase truncate max-w-[70%]">{sp.name}</span>
                               <span className="text-[7px] font-black text-primary">{sp.progress}%</span>
                            </div>
                            <div className="h-1 bg-muted/10 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${sp.progress}%` }}></div></div>
                         </div>
                       ))}
                    </div>
                 )}

                 {activeTab === 'habits' && goalHabits.map(h => (
                   <div key={h.id} onClick={() => onHabitClick(h.id)} className="p-2.5 bg-card border border-theme rounded-xl flex items-center justify-between shadow-sm group cursor-pointer hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-2.5">
                         <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px]"><i className={`fa-solid ${h.recurrence && h.recurrence !== 'none' ? 'fa-calendar-day' : 'fa-repeat'}`}></i></div>
                         <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-main leading-none mb-1">{h.title}</span>
                         </div>
                      </div>
                      <Badge variant={h.recurrence && h.recurrence !== 'none' ? 'indigo' : 'emerald'} className="text-[7px] py-0 px-1">{h.recurrence && h.recurrence !== 'none' ? 'PLANNER' : 'DAILY'}</Badge>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </Card>
  );
};

export default GoalCard;
