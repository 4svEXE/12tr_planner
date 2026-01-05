
import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';

const TodayView: React.FC = () => {
  const { tasks, projects, timeBlocks, toggleTaskStatus } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const todayTimestamp = useMemo(() => new Date().setHours(0, 0, 0, 0), []);
  const todayTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate === todayTimestamp), [tasks, todayTimestamp]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="p-8 bg-white border-b border-slate-100 z-10">
            <Typography variant="h1" className="text-slate-900">Сьогодні</Typography>
            <Typography variant="caption" className="text-orange-500">{new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</Typography>
          </header>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {todayTasks.map(task => (
                        <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer">
                            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center ${task.status === TaskStatus.DONE ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-transparent'}`}><i className="fa-solid fa-check text-xs"></i></button>
                            <span className="text-sm font-black text-slate-800">{task.title}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
            <div style={{ width: detailsWidth }} className="h-full bg-white">
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            </div>
          </div>
        )}
    </div>
  );
};

export default TodayView;
