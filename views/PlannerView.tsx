import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Project, Priority, RecurrenceType } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import PlannerHeader from '../components/planner/PlannerHeader';
import WeeklyGrid from '../components/planner/WeeklyGrid';

interface PlannerViewProps {
  projectId?: string;
  onExitProjectMode?: () => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ projectId, onExitProjectMode }) => {
  const { tasks, projects, cycle, updateCycle, updateTask, updateProject, addProject, toggleTaskStatus, deleteTask } = useApp();
  const [selectedWeek, setSelectedWeek] = useState(cycle.currentWeek);

  const activeProject = useMemo(() => 
    projectId ? projects.find(p => p.id === projectId) : null
  , [projects, projectId]);

  const strategicProject = useMemo(() => {
    if (projectId) return activeProject;
    return projects.find(p => p.id === 'planner_strategic_config');
  }, [projects, projectId, activeProject]);

  useEffect(() => {
    if (!strategicProject && !projectId) {
      addProject({
        id: 'planner_strategic_config',
        name: 'Planner Config',
        color: '#f97316',
        isStrategic: true,
        type: 'folder',
        description: 'SYSTEM_PLANNER_CONFIG'
      } as any);
    }
  }, [strategicProject, addProject, projectId]);

  // Завдання поточного тижня
  const plannerTasks = useMemo(() => 
    tasks.filter(t => 
      !t.isDeleted && 
      t.projectSection === 'planner' && 
      (!projectId || t.projectId === projectId)
    ), 
  [tasks, projectId]);

  // Цілі саме цього тижня
  const weeklyGoals = useMemo(() => 
    plannerTasks.filter(t => t.tags.includes('weekly-goal') && t.plannerWeek === selectedWeek).slice(0, 3),
  [plannerTasks, selectedWeek]);

  const dailies = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit')) && (!projectId || t.projectId === projectId)),
  [tasks, projectId]);

  const weekExecutionStats = useMemo(() => {
    const currentWeekTasks = plannerTasks.filter(t => t.plannerWeek === selectedWeek);
    if (currentWeekTasks.length === 0) return { percent: 0, score: 0 };
    let total = currentWeekTasks.length;
    let done = currentWeekTasks.filter(t => t.status === TaskStatus.DONE).length;
    const percent = Math.round((done / total) * 100);
    const score = parseFloat((percent / 10).toFixed(1));
    return { percent, score };
  }, [plannerTasks, selectedWeek]);

  const weekReview = useMemo(() => 
    cycle.weeklyScores?.[selectedWeek] || { score: 0, comment: '' }, 
  [cycle.weeklyScores, selectedWeek]);

  const handleUpdateWeekReview = (comment: string) => {
    const nextScores = { ...(cycle.weeklyScores || {}) };
    nextScores[selectedWeek] = { ...weekReview, comment };
    updateCycle({ weeklyScores: nextScores });
  };

  const handleUpdateWeeklyGoal = (index: number, title: string) => {
    const existing = weeklyGoals[index];
    if (existing) {
      if (!title.trim()) {
        deleteTask(existing.id, true);
      } else {
        updateTask({ ...existing, title });
      }
    } else if (title.trim()) {
      const id = `wg-${selectedWeek}-${index}-${Math.random().toString(36).substr(2,5)}`;
      updateTask({
        id,
        title,
        status: TaskStatus.NEXT_ACTION,
        priority: Priority.UI,
        difficulty: 1,
        xp: 100,
        tags: ['weekly-goal'],
        createdAt: Date.now(),
        projectSection: 'planner',
        plannerWeek: selectedWeek,
        projectId: projectId
      });
    }
  };

  // FIX: Added missing handleToggleTask function
  const handleToggleTask = (task: Task) => {
    toggleTaskStatus(task);
  };

  const handleAddPlannerTask = (dayIndex: number, title: string, isFocus: boolean, recurrence: RecurrenceType) => {
    const id = `pt-${Math.random().toString(36).substr(2,9)}`;
    const newTask: Task = {
      id,
      title,
      status: TaskStatus.NEXT_ACTION,
      priority: isFocus ? Priority.UI : Priority.NUI,
      difficulty: 1,
      xp: 50,
      tags: isFocus ? ['daily-focus'] : [],
      recurrence,
      createdAt: Date.now(),
      projectSection: 'planner',
      // Для повторюваних не прив'язуємось до тижня
      plannerWeek: recurrence === 'none' ? selectedWeek : undefined,
      plannerDay: dayIndex,
      projectId: projectId
    };
    updateTask(newTask);
  };

  const projectColor = strategicProject?.color || '#f97316';

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)] overflow-hidden transition-none">
      <div className="flex items-center bg-card border-b border-theme pr-4 shrink-0 transition-none">
        {projectId && (
          <button onClick={onExitProjectMode} className="p-4 hover:bg-slate-50 text-slate-400 hover:text-orange-600 border-r border-theme mr-2 transition-none">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        )}
        <div className="flex-1 transition-none">
          <PlannerHeader 
            monthlyProject={strategicProject} 
            onUpdateProject={(u) => strategicProject && updateProject({ ...strategicProject, ...u } as Project)}
            weekNum={selectedWeek}
            weekEfficiency={weekExecutionStats.percent}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 transition-none">
        <div className="max-w-[1400px] mx-auto space-y-4 pb-32 transition-none">
          
          <div className="flex flex-col lg:flex-row gap-3 items-stretch transition-none">
            <div className="bg-slate-900 px-6 py-3 rounded-2xl text-white shadow-xl flex items-center gap-6 shrink-0 border border-white/5 transition-none">
               <div className="text-4xl font-black text-orange-500" style={{ color: projectColor }}>{weekExecutionStats.score}</div>
               <div className="space-y-1 transition-none">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                    {projectId ? 'Project KPI' : 'Global KPI'}
                  </div>
                  <div className="flex items-center gap-2 transition-none">
                     <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden transition-none">
                        <div 
                          className="h-full transition-none" 
                          style={{ 
                            width: `${weekExecutionStats.percent}%`, 
                            backgroundColor: projectColor,
                            boxShadow: `0 0 8px ${projectColor}`
                          }}
                        ></div>
                     </div>
                     <span className="text-[10px] font-black text-emerald-400" style={{ color: projectColor }}>{weekExecutionStats.percent}%</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-1.5 flex items-center shadow-sm transition-none">
               <div className="grid grid-cols-6 md:grid-cols-12 gap-1 w-full transition-none">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                    <button 
                      key={w} 
                      onClick={() => setSelectedWeek(w)}
                      className={`h-9 rounded-xl text-[10px] font-black transition-none ${
                        selectedWeek === w ? 'bg-orange-600 text-white shadow-lg' : 
                        w === cycle.currentWeek ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                      style={selectedWeek === w ? { backgroundColor: projectColor } : {}}
                    >
                      W{w}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Weekly Goals Section - Inline Editable */}
          <section className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100 transition-none" style={{ backgroundColor: projectColor + '08', borderColor: projectColor + '20' }}>
             <div className="flex justify-between items-center mb-3 px-1 transition-none">
                <Typography variant="tiny" className="font-black text-[9px] tracking-[0.2em] uppercase flex items-center gap-2">
                   <i className="fa-solid fa-crown text-[10px]" style={{ color: projectColor }}></i> 
                   <span style={{ color: projectColor }}>Weekly Big 3 (Тиждень {selectedWeek})</span>
                </Typography>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3 transition-none">
                {[0, 1, 2].map(idx => {
                  const goal = weeklyGoals[idx];
                  return (
                    <Card key={idx} padding="none" className="p-4 bg-white flex items-center gap-3 border-orange-100 shadow-sm transition-none">
                       {goal && (
                         <button onClick={() => handleToggleTask(goal)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-none ${goal.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white hover:border-orange-500'}`} style={goal.status === TaskStatus.DONE ? { backgroundColor: projectColor, borderColor: projectColor } : {}}>
                            {goal.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
                         </button>
                       )}
                       <input 
                          value={goal?.title || ''} 
                          onChange={e => handleUpdateWeeklyGoal(idx, e.target.value)}
                          className={`text-[12px] font-black uppercase bg-transparent border-none p-0 focus:ring-0 w-full outline-none transition-none ${goal?.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-800'}`} 
                          placeholder={`Ціль #${idx + 1}...`}
                       />
                    </Card>
                  );
                })}
             </div>
          </section>

          <WeeklyGrid 
            weekNum={selectedWeek} 
            tasks={plannerTasks} 
            dailies={dailies}
            projectId={projectId}
            onToggleTask={handleToggleTask}
            onUpdateTask={updateTask}
            onAddTask={handleAddPlannerTask}
          />

          <Card padding="md" className="border-slate-100 rounded-3xl bg-white/50 transition-none">
             <div className="flex items-center gap-2 mb-3 transition-none">
                <i className="fa-solid fa-feather-pointed text-slate-400 text-xs"></i>
                <Typography variant="tiny" className="text-slate-500 font-black uppercase text-[8px] tracking-widest">Ретроспектива тижня {selectedWeek}</Typography>
             </div>
             <textarea 
               value={weekReview.comment}
               onChange={e => handleUpdateWeekReview(e.target.value)}
               placeholder="Які були головні перемоги та уроки цього тижня?"
               className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-100 min-h-[100px] resize-none shadow-inner text-slate-700 transition-none"
             />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;