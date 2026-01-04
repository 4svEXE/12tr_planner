
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';

const TodayView: React.FC = () => {
  const { tasks, projects, toggleTaskStatus, toggleHabitStatus, detailsWidth, setDetailsWidth } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const todayTimestamp = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const dateDisplay = useMemo(() => {
    return new Date().toLocaleDateString('uk-UA', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }, []);

  // Resizing logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) {
      setDetailsWidth(newWidth);
    }
  }, [isResizing, setDetailsWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const sections = useMemo(() => {
    const scheduled = tasks.filter(t => 
      t.status !== TaskStatus.DONE && 
      t.scheduledDate === todayTimestamp &&
      t.projectSection !== 'habits' &&
      !t.tags.includes('habit')
    );

    const projectActions = tasks.filter(t => 
      t.status !== TaskStatus.DONE && 
      t.projectId && 
      t.projectSection === 'actions' &&
      t.scheduledDate !== todayTimestamp 
    );

    const habits = tasks.filter(t => 
      (t.projectSection === 'habits' || t.tags.includes('habit')) &&
      t.status !== TaskStatus.DONE
    );

    return [
      { id: 'scheduled', title: 'Заплановано на сьогодні', icon: 'fa-calendar-day', tasks: scheduled },
      { id: 'actions', title: 'Наступні кроки проєктів', icon: 'fa-forward-step', tasks: projectActions },
      { id: 'habits', title: 'Щоденні звички', icon: 'fa-repeat', tasks: habits }
    ].filter(s => s.tasks.length > 0);
  }, [tasks, todayTimestamp]);

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const renderTask = (task: Task) => {
    const project = projects.find(p => p.id === task.projectId);
    const isHabit = task.projectSection === 'habits' || task.tags.includes('habit');
    const habitData = isHabit ? task.habitHistory?.[todayStr] : null;
    const isCompletedHabit = habitData?.status === 'completed';

    const checklist = task.checklist || [];
    const totalItems = checklist.length;
    const completedItems = checklist.filter(i => i.completed).length;
    const hasChecklist = totalItems > 0;
    const progress = hasChecklist ? (completedItems / totalItems) * 100 : 0;

    return (
      <div 
        key={task.id} 
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group flex flex-col p-4 bg-white rounded-3xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-orange-100/20 ${
          selectedTaskId === task.id ? 'border-orange-400' : 'border-slate-100 hover:border-orange-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (isHabit) {
                toggleHabitStatus(task.id, todayStr, isCompletedHabit ? 'none' : 'completed');
              } else {
                toggleTaskStatus(task);
              }
            }}
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
              (isHabit ? isCompletedHabit : task.status === TaskStatus.DONE)
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-slate-200 bg-slate-50 text-transparent hover:border-orange-400'
            }`}
          >
            <i className="fa-solid fa-check text-xs"></i>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-slate-800 truncate">{task.title}</span>
              {task.isPinned && <i className="fa-solid fa-thumbtack text-[10px] text-orange-500"></i>}
            </div>
            <div className="flex items-center gap-3">
              {project && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate max-w-[80px]">{project.name}</span>
                </div>
              )}
              {task.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] font-bold text-slate-300">#{tag}</span>
              ))}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="orange">{task.xp} XP</Badge>
          </div>
        </div>

        {hasChecklist && (
          <div className="mt-4 flex items-center gap-3 pl-12">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 tabular-nums">
              {completedItems}/{totalItems}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="p-8 bg-white border-b border-slate-100 z-10">
            <div className="max-w-4xl mx-auto flex justify-between items-end">
              <div>
                <Typography variant="caption" className="text-orange-500 mb-1">{dateDisplay}</Typography>
                <Typography variant="h1" className="text-slate-900">Сьогодні</Typography>
              </div>
              <div className="flex gap-2 text-right">
                <Typography variant="tiny" className="text-slate-400 lowercase">Виконано</Typography>
                <div className="text-xl font-black text-slate-900">
                  {tasks.filter(t => t.status === TaskStatus.DONE && t.scheduledDate === todayTimestamp).length}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              {sections.length > 0 ? sections.map(section => (
                <div key={section.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 px-2">
                    <i className={`fa-solid ${section.icon} text-orange-500`}></i>
                    <Typography variant="tiny" className="text-slate-400 font-black">{section.title}</Typography>
                    <div className="h-px flex-1 bg-slate-200/50"></div>
                    <Badge variant="slate">{section.tasks.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {section.tasks.map(renderTask)}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 text-3xl mb-6">
                    <i className="fa-solid fa-mug-hot"></i>
                  </div>
                  <Typography variant="h3" className="text-slate-800 mb-2">На сьогодні все чисто!</Typography>
                  <Typography variant="body" className="text-slate-400 max-w-xs">
                    Всі квести та звички завершені. Час відпочити або заглянути в Беклог.
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div 
              onMouseDown={startResizing}
              className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 transition-colors z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}
            ></div>
            <div style={{ width: detailsWidth }} className="h-full bg-white relative">
              <TaskDetails 
                task={tasks.find(t => t.id === selectedTaskId)!} 
                onClose={() => setSelectedTaskId(null)} 
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
        ${isResizing ? 'body { cursor: col-resize !important; user-select: none !important; }' : ''}
      `}</style>
    </div>
  );
};

export default TodayView;
