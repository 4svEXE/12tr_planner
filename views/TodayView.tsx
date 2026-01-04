
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, TimeBlock, Project } from '../types';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';
import Card from '../components/ui/Card';

const TodayView: React.FC = () => {
  const { tasks, projects, timeBlocks, toggleTaskStatus, toggleHabitStatus, detailsWidth, setDetailsWidth } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayTimestamp = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayOfWeek = (new Date().getDay() + 6) % 7;

  const currentBlock = useMemo(() => {
    const hour = currentTime.getHours();
    return timeBlocks.find(b => b.dayOfWeek === dayOfWeek && hour >= b.startHour && hour < b.endHour);
  }, [timeBlocks, dayOfWeek, currentTime]);

  const dateDisplay = useMemo(() => {
    return new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) setDetailsWidth(newWidth);
  }, [isResizing, setDetailsWidth]);

  useEffect(() => {
    if (isResizing) { window.addEventListener('mousemove', resize); window.addEventListener('mouseup', stopResizing); }
    else { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); }
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [isResizing, resize, stopResizing]);

  // Project Grouping Logic for "Next Actions"
  const projectGroups = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE);
    const actions = activeTasks.filter(t => t.projectId && t.projectSection === 'actions' && t.scheduledDate !== todayTimestamp);
    
    const groups: Record<string, { project: Project, tasks: Task[] }> = {};
    actions.forEach(t => {
      const p = projects.find(proj => proj.id === t.projectId);
      if (p) {
        if (!groups[p.id]) groups[p.id] = { project: p, tasks: [] };
        groups[p.id].tasks.push(t);
      }
    });
    return Object.values(groups);
  }, [tasks, projects, todayTimestamp]);

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const renderTask = (task: Task, hideProject: boolean = false) => {
    const project = projects.find(p => p.id === task.projectId);
    const isHabit = task.projectSection === 'habits' || task.tags.includes('habit');
    const habitData = isHabit ? task.habitHistory?.[todayStr] : null;
    const isCompletedHabit = habitData?.status === 'completed';
    const checklist = task.checklist || [];
    const progress = checklist.length > 0 ? (checklist.filter(i => i.completed).length / checklist.length) * 100 : 0;

    return (
      <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)} onClick={() => setSelectedTaskId(task.id)}
        className={`group flex flex-col p-4 bg-white rounded-3xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-orange-100/20 ${selectedTaskId === task.id ? 'border-orange-400' : 'border-slate-100 hover:border-orange-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); isHabit ? toggleHabitStatus(task.id, todayStr, isCompletedHabit ? 'none' : 'completed') : toggleTaskStatus(task); }}
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${ (isHabit ? isCompletedHabit : task.status === TaskStatus.DONE) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-transparent hover:border-orange-400'}`}>
            <i className="fa-solid fa-check text-xs"></i>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-slate-800 truncate">{task.title}</span>
              {task.isPinned && <i className="fa-solid fa-thumbtack text-[10px] text-orange-500"></i>}
            </div>
            <div className="flex items-center gap-3">
              {project && !hideProject && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }}></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider truncate max-w-[80px]">{project.name}</span>
                </div>
              )}
              {task.tags.slice(0, 2).map(tag => <span key={tag} className="text-[10px] font-bold text-slate-300">#{tag}</span>)}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Badge variant="orange">{task.xp} XP</Badge></div>
        </div>
        {checklist.length > 0 && <div className="mt-4 flex items-center gap-3 pl-12"><div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }}></div></div><span className="text-[9px] font-black text-slate-400 tabular-nums">{checklist.filter(i => i.completed).length}/{checklist.length}</span></div>}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="p-8 bg-white border-b border-slate-100 z-10">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <Typography variant="caption" className="text-orange-500 mb-1">{dateDisplay}</Typography>
                <Typography variant="h1" className="text-slate-900">Сьогодні</Typography>
              </div>
              
              {currentBlock && (
                <div className="flex-1 md:max-w-xs animate-in slide-in-from-right duration-500">
                   <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-3xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-100">
                         <i className="fa-solid fa-clock animate-pulse"></i>
                      </div>
                      <div className="min-w-0">
                         <div className="text-[9px] font-black uppercase text-orange-600 tracking-widest leading-none mb-1">Поточний блок:</div>
                         <div className="text-sm font-black text-slate-800 truncate">{currentBlock.title}</div>
                      </div>
                   </div>
                </div>
              )}

              <div className="flex gap-2 text-right">
                <Typography variant="tiny" className="text-slate-400 lowercase">Виконано</Typography>
                <div className="text-xl font-black text-slate-900">{tasks.filter(t => !t.isDeleted && t.status === TaskStatus.DONE && t.scheduledDate === todayTimestamp).length}</div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              
              {/* Scheduled Section */}
              {tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate === todayTimestamp && t.projectSection !== 'habits' && !t.tags.includes('habit')).length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 px-2">
                    <i className="fa-solid fa-calendar-day text-orange-500"></i>
                    <Typography variant="tiny" className="text-slate-400 font-black">Заплановано на сьогодні</Typography>
                    <div className="h-px flex-1 bg-slate-200/50"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate === todayTimestamp && t.projectSection !== 'habits' && !t.tags.includes('habit')).map(t => renderTask(t))}
                  </div>
                </div>
              )}

              {/* Grouped Projects Section (Next Actions) */}
              {projectGroups.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 px-2">
                    <i className="fa-solid fa-forward-step text-orange-500"></i>
                    <Typography variant="tiny" className="text-slate-400 font-black">Наступні кроки проєктів</Typography>
                    <div className="h-px flex-1 bg-slate-200/50"></div>
                  </div>
                  
                  <div className="space-y-8">
                    {projectGroups.map(group => {
                      const isCollapsed = collapsedProjects[group.project.id];
                      return (
                        <div key={group.project.id} className="space-y-3">
                          <div 
                            onClick={() => toggleProjectCollapse(group.project.id)}
                            className="flex items-center gap-3 group cursor-pointer hover:bg-slate-100/50 p-2 rounded-2xl transition-all"
                          >
                            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: group.project.color }}></div>
                            <Typography variant="h3" className="text-slate-800 text-sm uppercase tracking-wider">{group.project.name}</Typography>
                            <Badge variant="slate" className="text-[8px] font-black">{group.tasks.length}</Badge>
                            <i className={`fa-solid fa-chevron-right text-[10px] text-slate-300 transition-transform ml-auto ${isCollapsed ? '' : 'rotate-90'}`}></i>
                          </div>
                          
                          {!isCollapsed && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              {group.tasks.map(t => renderTask(t, true))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Habits Section */}
              {tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit')) && t.status !== TaskStatus.DONE).length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 px-2">
                    <i className="fa-solid fa-repeat text-orange-500"></i>
                    <Typography variant="tiny" className="text-slate-400 font-black">Щоденні звички</Typography>
                    <div className="h-px flex-1 bg-slate-200/50"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {tasks.filter(t => !t.isDeleted && (t.projectSection === 'habits' || t.tags.includes('habit')) && t.status !== TaskStatus.DONE).map(t => renderTask(t))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate === todayTimestamp || (t.projectId && t.projectSection === 'actions') || t.projectSection === 'habits' || t.tags.includes('habit'))).length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 text-3xl mb-6"><i className="fa-solid fa-mug-hot"></i></div>
                  <Typography variant="h3" className="text-slate-800 mb-2">На сьогодні все чисто!</Typography>
                  <Typography variant="body" className="text-slate-400 max-w-xs">Всі квести та звички завершені. Час відпочити.</Typography>
                </div>
              )}

            </div>
          </div>
        </div>

        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 transition-colors z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
            <div style={{ width: detailsWidth }} className="h-full bg-white relative">
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayView;
