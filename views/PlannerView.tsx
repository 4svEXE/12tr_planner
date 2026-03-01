import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Project, Priority, RecurrenceType } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import PlannerHeader from '../components/planner/PlannerHeader';
import WeeklyGrid from '../components/planner/WeeklyGrid';
import CycleMonthlyOverview from '../components/planner/CycleMonthlyOverview';
import DiaryEditor from '../components/DiaryEditor';
import HabitStatsSidebar from '../components/HabitStatsSidebar';
import Badge from '../components/ui/Badge';

interface PlannerViewProps {
  projectId?: string;
  onExitProjectMode?: () => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ projectId, onExitProjectMode }) => {
  const { tasks, projects, cycle, updateCycle, updateTask, updateProject, addProject, toggleTaskStatus, deleteTask, saveDiaryEntry, toggleHabitStatus, aiEnabled } = useApp();

  const activeProject = useMemo(() =>
    projectId ? projects.find(p => p.id === projectId) : null
    , [projects, projectId]);

  const strategicProject = useMemo(() => {
    if (projectId) return activeProject;
    return projects.find(p => p.id === 'planner_strategic_config');
  }, [projects, projectId, activeProject]);

  const plainVision = useMemo(() => {
    const desc = strategicProject?.description || '';
    if (!desc) return 'Ваша мета на цей цикл...';
    try {
      const parsed = JSON.parse(desc);
      if (Array.isArray(parsed)) {
        return parsed
          .map(block => block.content)
          .join(' ')
          .replace(/<[^>]*>?/gm, '')
          .slice(0, 100);
      }
    } catch (e) {
    }
    return desc.slice(0, 100);
  }, [strategicProject?.description]);

  const actualCurrentWeek = useMemo(() => {
    if (!strategicProject) return cycle.currentWeek;
    const start = strategicProject.startDate || cycle.startDate;
    const now = Date.now();
    const diff = now - start;
    const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, Math.min(12, week));
  }, [strategicProject, cycle.startDate, cycle.currentWeek]);

  const [selectedWeek, setSelectedWeek] = useState(actualCurrentWeek);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'vision'>('weekly');
  const [monthlyViewType, setMonthlyViewType] = useState<'grid' | 'list'>('grid');
  const [showNotes, setShowNotes] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [scratchpadInput, setScratchpadInput] = useState('');
  const [showBuffer, setShowBuffer] = useState(false);

  useEffect(() => {
    setSelectedWeek(actualCurrentWeek);
  }, [projectId, actualCurrentWeek]);

  const plannerTasks = useMemo(() =>
    tasks.filter(t =>
      !t.isDeleted &&
      t.projectSection === 'planner' &&
      (!projectId || t.projectId === projectId)
    ),
    [tasks, projectId]);

  const weeklyGoals = useMemo(() =>
    plannerTasks.filter(t => t.tags.includes('weekly-goal') && t.plannerWeek === selectedWeek).slice(0, 3),
    [plannerTasks, selectedWeek]);

  const scratchpadTasks = useMemo(() =>
    plannerTasks.filter(t => t.plannerWeek === selectedWeek && t.plannerDay === undefined && !t.tags.includes('weekly-goal')),
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

  const handleUpdateWeeklyGoal = (week: number, index: number, title: string) => {
    const existing = plannerTasks.filter(t => t.tags.includes('weekly-goal') && t.plannerWeek === week)[index];

    if (existing) {
      if (!title.trim()) {
        deleteTask(existing.id, true);
      } else {
        updateTask({ ...existing, title });
      }
    } else if (title.trim()) {
      const id = `wg-${week}-${index}-${Math.random().toString(36).substr(2, 5)}`;
      updateTask({
        id,
        title,
        status: TaskStatus.NEXT_ACTION,
        priority: Priority.UI,
        difficulty: 1,
        xp: 100,
        tags: ['weekly-goal'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        projectSection: 'planner',
        plannerWeek: week,
        projectId: projectId
      } as Task);
    }
  };

  const handleAddScratchpadTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchpadInput.trim()) return;
    const id = Math.random().toString(36).substr(2, 9);
    updateTask({
      id,
      title: scratchpadInput,
      status: TaskStatus.NEXT_ACTION,
      priority: Priority.NUI,
      difficulty: 1,
      xp: 50,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: 'tasks',
      projectId: projectId,
      projectSection: 'planner',
      plannerWeek: selectedWeek,
      plannerDay: undefined,
      recurrence: 'none'
    } as Task);
    setScratchpadInput('');
  };

  const handleAddPlannerTask = (dayIndex: number, title: string, isFocus: boolean, recurrence: RecurrenceType) => {
    const id = Math.random().toString(36).substr(2, 9);
    updateTask({
      id,
      title,
      status: TaskStatus.NEXT_ACTION,
      priority: isFocus ? Priority.UI : Priority.NUI,
      difficulty: 1,
      xp: isFocus ? 150 : 50,
      tags: isFocus ? ['daily-focus'] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: 'tasks',
      projectId: projectId,
      projectSection: recurrence !== 'none' || isFocus ? 'habits' : 'tasks',
      plannerWeek: recurrence === 'none' ? selectedWeek : undefined,
      plannerDay: recurrence === 'none' ? dayIndex : undefined,
      recurrence,
      daysOfWeek: recurrence !== 'none' ? [0, 1, 2, 3, 4, 5, 6] : undefined,
      habitHistory: (recurrence !== 'none' || isFocus) ? {} : undefined
    } as Task);
  };

  const projectColor = strategicProject?.color || '#f97316';
  const selectedHabit = useMemo(() => tasks.find(t => t.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="flex h-screen bg-main overflow-hidden w-full">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="flex items-center bg-card border-b border-theme pr-4 shrink-0 h-10 z-30">
          {projectId && (
            <button onClick={onExitProjectMode} className="h-full px-3 hover:bg-slate-50 text-slate-400 border-r border-theme mr-2">
              <i className="fa-solid fa-arrow-left text-xs"></i>
            </button>
          )}
          <div className="flex-1">
            <PlannerHeader
              monthlyProject={strategicProject}
              onUpdateProject={(u) => strategicProject && updateProject({ ...strategicProject, ...u } as Project)}
              weekNum={selectedWeek}
              weekEfficiency={weekExecutionStats.percent}
              onToggleNotes={() => setShowNotes(!showNotes)}
              isNotesOpen={showNotes}
            />
          </div>
          <div className="flex bg-main p-0.5 rounded-lg border border-theme ml-4">
            <button onClick={() => setViewMode('weekly')} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${viewMode === 'weekly' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>Тиждень</button>
            <button onClick={() => setViewMode('monthly')} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${viewMode === 'monthly' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>Цикл</button>
            <button onClick={() => setViewMode('vision')} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${viewMode === 'vision' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}>Візія</button>
          </div>
          <button
            onClick={() => setShowBuffer(!showBuffer)}
            className={`ml-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showBuffer ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-theme'}`}
            title="Тактичний буфер"
          >
            <i className="fa-solid fa-clipboard-list text-[10px]"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full space-y-2 pb-32">
            {viewMode === 'vision' ? (
              <div className="p-4 md:p-8 max-w-5xl mx-auto h-[calc(100vh-120px)]">
                <div className="bg-white rounded-3xl border border-theme shadow-2xl h-full overflow-hidden flex flex-col transition-all">
                  <header className="p-6 border-b border-theme bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg ring-4 ring-slate-900/10">
                        <i className="fa-solid fa-mountain-sun"></i>
                      </div>
                      <div>
                        <Typography variant="h2" className="text-sm font-black uppercase tracking-widest text-slate-800">Стратегічна Візія</Typography>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight opacity-70">Опишіть ваше ідеальне життя та цілі на роки вперед</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-white border border-theme rounded-full shadow-sm text-[10px] font-black uppercase text-slate-400">
                      Редагування фокусу
                    </div>
                  </header>
                  <div className="flex-1 overflow-hidden bg-white">
                    {strategicProject && (
                      <DiaryEditor
                        id={strategicProject.id}
                        date={new Date().toISOString().split('T')[0]}
                        onClose={() => setViewMode('weekly')}
                        standaloneMode={true}
                        initialContent={strategicProject.description}
                        onContentChange={(newContent) => updateProject({ ...strategicProject, description: newContent })}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : viewMode === 'monthly' ? (
              <div className="p-4 space-y-4">
                <div className="flex justify-end gap-2 px-2">
                  <div className="flex bg-main p-0.5 rounded-lg border border-theme">
                    <button onClick={() => setMonthlyViewType('grid')} className={`w-7 h-6 flex items-center justify-center rounded transition-all ${monthlyViewType === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}><i className="fa-solid fa-grip text-[10px]"></i></button>
                    <button onClick={() => setMonthlyViewType('list')} className={`w-7 h-6 flex items-center justify-center rounded transition-all ${monthlyViewType === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}><i className="fa-solid fa-list text-[10px]"></i></button>
                  </div>
                </div>
                <CycleMonthlyOverview
                  plannerTasks={plannerTasks}
                  currentWeek={actualCurrentWeek}
                  selectedWeek={selectedWeek}
                  projectColor={projectColor}
                  viewMode={monthlyViewType}
                  onSelectWeek={(w) => { setSelectedWeek(w); setViewMode('weekly'); }}
                  onUpdateGoal={handleUpdateWeeklyGoal}
                  onToggleTask={updateTask}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="bg-white border-b border-theme shadow-sm px-4 py-1.5 sticky top-0 z-20">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="hidden xl:flex items-center gap-3 border-r border-theme pr-4 max-w-xs overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shadow-lg shrink-0"><i className="fa-solid fa-mountain"></i></div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">БАЧЕННЯ 12TR</div>
                        <div className="text-[12px] font-bold text-slate-700 truncate italic">"{plainVision}"</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 md:border-r border-theme pr-4">
                      <i className="fa-solid fa-crown text-[10px]" style={{ color: projectColor }}></i>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ГОЛОВНА ТРІЙКА</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 w-full">
                      {[0, 1, 2].map(idx => {
                        const goal = weeklyGoals[idx];
                        return (
                          <div key={idx} className="flex items-center gap-2 px-3 py-0 bg-main border border-theme/40 rounded-lg group h-8 transition-all hover:border-primary/20">
                            <button onClick={() => goal && updateTask({ ...goal, status: goal.status === TaskStatus.DONE ? TaskStatus.NEXT_ACTION : TaskStatus.DONE })} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${goal?.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`} style={goal?.status === TaskStatus.DONE ? { backgroundColor: projectColor, borderColor: projectColor } : {}}>
                              {goal?.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                            </button>
                            <input value={goal?.title || ''} onChange={e => handleUpdateWeeklyGoal(selectedWeek, idx, e.target.value)} className={`text-[11px] font-bold uppercase bg-transparent border-none p-0 focus:ring-0 w-full outline-none ${goal?.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-700'}`} placeholder={`Ціль #${idx + 1}...`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white border-b border-theme px-4 py-1 flex flex-col md:flex-row items-center gap-4 z-10">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg text-white border border-white/5">
                      <div className="text-[14px] font-black leading-none" style={{ color: projectColor }}>{weekExecutionStats.score}</div>
                      <div className="flex flex-col">
                        <div className="flex justify-between w-16 text-[8px] font-black uppercase text-slate-500 leading-none mb-1">
                          <span>Ефективність</span>
                          <span>{weekExecutionStats.percent}%</span>
                        </div>
                        <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full" style={{ width: `${weekExecutionStats.percent}%`, backgroundColor: projectColor }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <i className="fa-solid fa-chart-line text-emerald-600 text-[10px]"></i>
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Lead-метрики: Оптимально</span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center bg-main p-0.5 rounded-lg border border-theme overflow-x-auto no-scrollbar">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                      <button key={w} onClick={() => setSelectedWeek(w)} className={`flex-1 h-7 min-w-[40px] rounded-md text-[10px] font-black transition-all ${selectedWeek === w ? 'bg-white text-primary shadow-sm border border-theme' : w === actualCurrentWeek ? 'text-orange-600' : 'text-slate-400 hover:bg-black/5'}`} style={selectedWeek === w ? { color: projectColor, borderColor: `${projectColor}30` } : {}}>
                        W{w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2">
                  <WeeklyGrid
                    weekNum={selectedWeek}
                    tasks={plannerTasks}
                    dailies={dailies}
                    projectId={projectId}
                    onToggleTask={updateTask}
                    onUpdateTask={updateTask}
                    onAddTask={handleAddPlannerTask}
                    onSelectHabit={setSelectedHabitId}
                  />
                </div>

                <div className="max-w-[1600px] mx-auto px-4 pb-20">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 border border-theme rounded-xl bg-card flex flex-col md:flex-row items-center gap-4 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 shrink-0 opacity-50">
                        <i className="fa-solid fa-feather-pointed text-[10px] text-primary" style={{ color: projectColor }}></i>
                        <span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Підсумок W{selectedWeek}</span>
                      </div>
                      <input value={weekReview.comment} onChange={e => handleUpdateWeekReview(e.target.value)} placeholder="Результати тижня..." className="flex-1 w-full bg-main border border-theme rounded-lg px-4 py-2.5 text-[12px] font-bold outline-none focus:ring-1 focus:ring-primary/20 text-slate-700 shadow-inner" />
                      <button onClick={() => {
                        const content = `### 📅 ТИЖНЕВИЙ ЗВІТ (W${selectedWeek})\n\n**Результат:** ${weekExecutionStats.percent}%\n\n#### 🎯 Weekly Big 3:\n` + weeklyGoals.map(g => `- [${g.status === TaskStatus.DONE ? 'x' : ' '}] ${g.title}`).join('\n') + `\n\n#### 📝 Підсумок:\n${weekReview.comment || 'Коментар не додано.'}`;
                        saveDiaryEntry(new Date().toISOString().split('T')[0], content);
                        alert('Звіт збережено!');
                      }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 shadow-lg transition-all hover:brightness-110 active:scale-95">Зберегти звіт</button>
                    </div>

                    <div className={`lg:col-span-4 border rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm transition-all ${aiEnabled ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${aiEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}><i className={`fa-solid ${aiEnabled ? 'fa-lightbulb' : 'fa-lock'} text-base`}></i></div>
                      <div className="min-w-0">
                        <div className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${aiEnabled ? 'text-indigo-400' : 'text-slate-400'}`}>AI-КОУЧ 12TR</div>
                        <p className={`text-[11px] font-bold leading-tight line-clamp-2 ${aiEnabled ? 'text-indigo-700' : 'text-slate-500'}`}>
                          {aiEnabled
                            ? (weekExecutionStats.percent < 50 ? 'Сфокусуйся на Lead-метриках для камбеку!' : 'Відмінний темп! Не збавляй обертів.')
                            : 'ШІ вимкнено в налаштуваннях'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panels - Push Content Mode */}
      <div
        className={`h-full bg-white border-l border-theme z-[100] shadow-xl transition-all duration-300 flex flex-col overflow-hidden shrink-0 ${showNotes ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: showNotes ? '450px' : '0px', marginLeft: showNotes ? '0px' : '-1px' }}
      >
        <header className="p-4 border-b border-theme flex justify-between items-center shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm shadow-md">
              <i className="fa-solid fa-box-archive"></i>
            </div>
            <Typography variant="h2" className="text-xs font-black uppercase tracking-tight">Беклог проєкту</Typography>
          </div>
          <button onClick={() => setShowNotes(false)} className="w-8 h-8 rounded-lg bg-white border border-theme text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          {strategicProject && (
            <DiaryEditor
              id={strategicProject.id}
              date={new Date().toISOString().split('T')[0]}
              onClose={() => setShowNotes(false)}
              standaloneMode={true}
              initialContent={strategicProject.description}
              onContentChange={(newContent) => updateProject({ ...strategicProject, description: newContent })}
            />
          )}
        </div>
      </div>

      <div
        className={`h-full bg-white border-l border-theme z-[105] shadow-xl transition-all duration-300 flex flex-col overflow-hidden shrink-0 ${showBuffer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: showBuffer ? '380px' : '0px', marginLeft: showBuffer ? '0px' : '-1px' }}
      >
        <header className="p-4 border-b border-theme flex justify-between items-center shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm shadow-md">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <Typography variant="h2" className="text-xs font-black uppercase tracking-tight">Тактичний буфер</Typography>
            <Badge variant="orange" className="text-[10px] ml-1">{scratchpadTasks.length}</Badge>
          </div>
          <button onClick={() => setShowBuffer(false)} className="w-8 h-8 rounded-lg bg-white border border-theme text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-100">
          <form onSubmit={handleAddScratchpadTask} className="mb-4 sticky top-0 z-10">
            <input
              autoComplete="off" autoCorrect="off" spellCheck="false" inputMode="text"
              value={scratchpadInput}
              onChange={e => setScratchpadInput(e.target.value)}
              placeholder="+ Додати в буфер тижня..."
              className="w-full h-11 bg-white border border-theme rounded-xl px-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-orange-500/10 shadow-sm transition-all"
            />
          </form>
          <div className="flex flex-col gap-2">
            {scratchpadTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                className="p-3.5 bg-white border border-theme rounded-xl hover:border-orange-500/30 transition-all cursor-grab group active:cursor-grabbing shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => updateTask({ ...task, status: task.status === TaskStatus.DONE ? TaskStatus.NEXT_ACTION : TaskStatus.DONE })} className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                    {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                  </button>
                  <span className={`text-[12px] font-bold leading-snug ${task.status === TaskStatus.DONE ? 'line-through text-muted/50' : 'text-main'}`}>{task.title}</span>
                </div>
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-2 border-t border-slate-50 pt-2">
                  <button onClick={() => deleteTask(task.id, true)} className="text-[10px] text-slate-300 hover:text-rose-500 flex items-center gap-1 transition-colors">
                    <i className="fa-solid fa-trash-can text-[9px]"></i> Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Stats Sidebar can remain fixed as it behaves like a detailed overlay */}
      <div className={`fixed top-0 right-0 h-full bg-white border-l border-theme z-[300] shadow-2xl transition-transform duration-500 flex flex-col ${selectedHabitId ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '400px', maxWidth: '100vw' }}>
        {selectedHabit && <HabitStatsSidebar habit={selectedHabit} onClose={() => setSelectedHabitId(null)} onUpdate={(u) => updateTask({ ...selectedHabit, ...u })} onToggleStatus={toggleHabitStatus} />}
      </div>
    </div>
  );
};

export default PlannerView;