
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Project, Priority } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import PlannerHeader from '../components/planner/PlannerHeader';
import WeeklyGrid from '../components/planner/WeeklyGrid';

const PlannerView: React.FC = () => {
  const { tasks, projects, cycle, updateCycle, updateTask, updateProject, toggleTaskStatus, deleteTask } = useApp();
  const [selectedWeek, setSelectedWeek] = useState(cycle.currentWeek);

  // Спеціальний проект-контейнер для стратегічних даних планувальника (Головна ціль місяця, KPI)
  const monthlyProject = useMemo(() => {
    let proj = projects.find(p => p.id === 'planner_strategic_config');
    if (!proj) {
      // Якщо проекту немає, використовуємо перший доступний як fallback, 
      // але в ідеалі він має бути створений при ініціалізації
      return projects[0]; 
    }
    return proj;
  }, [projects]);

  // Фільтруємо таски саме для планувальника та обраного тижня
  const plannerTasks = useMemo(() => 
    tasks.filter(t => !t.isDeleted && t.projectSection === 'planner' && t.plannerWeek === selectedWeek), 
  [tasks, selectedWeek]);

  const weeklyGoals = useMemo(() => 
    plannerTasks.filter(t => t.tags.includes('weekly-goal')).slice(0, 3),
  [plannerTasks]);

  const dailies = useMemo(() => 
    tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit'))),
  [tasks]);

  const weekExecutionStats = useMemo(() => {
    if (plannerTasks.length === 0) return { percent: 0, score: 0 };
    let total = plannerTasks.length;
    let done = plannerTasks.filter(t => t.status === TaskStatus.DONE).length;
    const percent = Math.round((done / total) * 100);
    const score = parseFloat((percent / 10).toFixed(1));
    return { percent, score };
  }, [plannerTasks]);

  const weekReview = useMemo(() => 
    cycle.weeklyScores?.[selectedWeek] || { score: 0, comment: '' }, 
  [cycle.weeklyScores, selectedWeek]);

  const handleUpdateWeekReview = (comment: string) => {
    const nextScores = { ...(cycle.weeklyScores || {}) };
    nextScores[selectedWeek] = { ...weekReview, comment };
    updateCycle({ weeklyScores: nextScores });
  };

  const handleAddWeeklyGoal = () => {
    if (weeklyGoals.length >= 3) return alert("Максимум 3 цілі на тиждень");
    const title = prompt('Головна ціль тижня:');
    if (title) {
      const id = `wg-${Math.random().toString(36).substr(2,9)}`;
      const newTask: Task = {
        id,
        title,
        status: TaskStatus.NEXT_ACTION,
        priority: Priority.UI,
        difficulty: 1,
        xp: 100,
        tags: ['weekly-goal'],
        createdAt: Date.now(),
        projectSection: 'planner',
        plannerWeek: selectedWeek
      };
      updateTask(newTask);
    }
  };

  const handleAddPlannerTask = (dayIndex: number, isFocus: boolean = false) => {
    const title = prompt(isFocus ? 'Ціль дня (Focus):' : 'Нове завдання:');
    if (title) {
      const id = `pt-${Math.random().toString(36).substr(2,9)}`;
      const newTask: Task = {
        id,
        title,
        status: TaskStatus.NEXT_ACTION,
        priority: isFocus ? Priority.UI : Priority.NUI,
        difficulty: 1,
        xp: 50,
        tags: isFocus ? ['daily-focus'] : [],
        createdAt: Date.now(),
        projectSection: 'planner',
        plannerWeek: selectedWeek,
        plannerDay: dayIndex
      };
      updateTask(newTask);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <PlannerHeader 
        monthlyProject={monthlyProject} 
        onUpdateProject={(u) => updateProject({ ...monthlyProject, ...u } as Project)}
        weekNum={selectedWeek}
        weekEfficiency={weekExecutionStats.percent}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
        <div className="max-w-[1400px] mx-auto space-y-4 pb-32">
          
          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
            <div className="bg-slate-900 px-6 py-3 rounded-2xl text-white shadow-xl flex items-center gap-6 shrink-0 border border-white/5">
               <div className="text-4xl font-black text-orange-500">{weekExecutionStats.score}</div>
               <div className="space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Week KPI</div>
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${weekExecutionStats.percent}%` }}></div>
                     </div>
                     <span className="text-[10px] font-black text-emerald-400">{weekExecutionStats.percent}%</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-1.5 flex items-center shadow-sm">
               <div className="grid grid-cols-6 md:grid-cols-12 gap-1 w-full">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                    <button 
                      key={w} 
                      onClick={() => setSelectedWeek(w)}
                      className={`h-9 rounded-xl text-[10px] font-black transition-all ${
                        selectedWeek === w ? 'bg-orange-600 text-white shadow-lg scale-105' : 
                        w === cycle.currentWeek ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      W{w}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <section className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100">
             <div className="flex justify-between items-center mb-3 px-1">
                <Typography variant="tiny" className="text-orange-600 font-black text-[9px] tracking-[0.2em] uppercase flex items-center gap-2">
                   <i className="fa-solid fa-crown text-[10px]"></i> Weekly Big 3 (Цілі тижня)
                </Typography>
                <button onClick={handleAddWeeklyGoal} className="text-[9px] font-black text-primary hover:text-orange-700 transition-colors uppercase tracking-widest">+ ДОДАТИ ЦІЛЬ</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {weeklyGoals.map(goal => (
                  <Card key={goal.id} padding="none" className="p-4 bg-white flex items-center gap-3 border-orange-100 shadow-sm group hover:border-orange-300 transition-all">
                     <button onClick={() => toggleTaskStatus(goal)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${goal.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white hover:border-orange-500'}`}>
                        {goal.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
                     </button>
                     <input 
                        value={goal.title} 
                        onChange={e => updateTask({...goal, title: e.target.value})}
                        className={`text-[12px] font-black uppercase bg-transparent border-none p-0 focus:ring-0 w-full outline-none ${goal.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-800'}`} 
                        placeholder="Назва цілі..."
                     />
                     <button onClick={() => deleteTask(goal.id, true)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1">
                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                     </button>
                  </Card>
                ))}
                {Array.from({ length: 3 - weeklyGoals.length }).map((_, i) => (
                  <button key={i} onClick={handleAddWeeklyGoal} className="h-14 border-2 border-dashed border-orange-100/50 rounded-2xl flex items-center justify-center text-orange-200 hover:text-orange-400 hover:bg-white transition-all">
                     <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                ))}
             </div>
          </section>

          <WeeklyGrid 
            weekNum={selectedWeek} 
            tasks={plannerTasks} 
            dailies={dailies}
            onToggleTask={toggleTaskStatus}
            onUpdateTask={updateTask}
            onAddTask={handleAddPlannerTask}
          />

          <Card padding="md" className="border-slate-100 rounded-3xl bg-white/50">
             <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-feather-pointed text-slate-400 text-xs"></i>
                <Typography variant="tiny" className="text-slate-500 font-black uppercase text-[8px] tracking-widest">Ретроспектива тижня {selectedWeek}</Typography>
             </div>
             <textarea 
               value={weekReview.comment}
               onChange={e => handleUpdateWeekReview(e.target.value)}
               placeholder="Які були головні перемоги та уроки цього тижня?"
               className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-100 min-h-[100px] resize-none shadow-inner text-slate-700"
             />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;
