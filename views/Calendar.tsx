
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority, Project, InboxCategory } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

interface TreeNodeProps {
  id: string;
  label: string;
  icon: string;
  type: 'folder' | 'task';
  level: number;
  isOpen?: boolean;
  onToggle?: () => void;
  onAdd?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  children?: React.ReactNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  id, label, icon, type, level, isOpen, onToggle, onAdd, onEdit, onDelete, onClick, isDraggable, onDragStart, children 
}) => {
  return (
    <div className="flex flex-col">
      <div 
        draggable={isDraggable}
        onDragStart={onDragStart}
        onClick={type === 'folder' ? onToggle : onClick}
        className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors relative ${level > 0 ? 'ml-3' : ''}`}
      >
        <div className="flex items-center gap-1">
           {type === 'folder' && (
             <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>
           )}
           <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${type === 'folder' ? 'text-orange-400' : 'text-slate-400'}`}></i>
        </div>
        <span className={`text-[11px] font-medium truncate flex-1 ${type === 'folder' ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>
          {label}
        </span>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
           {onAdd && <i onClick={onAdd} className="fa-solid fa-plus text-[9px] text-slate-300 hover:text-orange-500 p-0.5"></i>}
           {onEdit && <i onClick={onEdit} className="fa-solid fa-pen text-[9px] text-slate-300 hover:text-blue-500 p-0.5"></i>}
           {onDelete && <i onClick={onDelete} className="fa-solid fa-trash text-[9px] text-slate-300 hover:text-rose-500 p-0.5"></i>}
        </div>
      </div>
      {isOpen && children && (
        <div className="border-l border-slate-100 ml-3.5 mt-0.5 pl-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

const Calendar: React.FC = () => {
  const { 
    tasks, projects, inboxCategories, scheduleTask, toggleTaskStatus, updateTask, deleteTask, addTask, addProject, updateProject, deleteProject, detailsWidth, setDetailsWidth 
  } = useApp();
  
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDayTimestamp, setSelectedDayTimestamp] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  // Tree state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root_inbox': true, 'root_next': true, 'root_projects': true });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleAddTaskToNode = (e: React.MouseEvent, categoryId?: string, projectId?: string) => {
    e.stopPropagation();
    const title = prompt('Назва завдання:');
    if (title) addTask(title, categoryId || 'unsorted', projectId);
  };

  const handleEditNode = (e: React.MouseEvent, type: 'task' | 'project', id: string) => {
    e.stopPropagation();
    if (type === 'task') {
      setSelectedTaskId(id);
    } else {
      const p = projects.find(proj => proj.id === id);
      const newName = prompt('Нова назва:', p?.name);
      if (newName && p) updateProject({ ...p, name: newName });
    }
  };

  const handleDeleteNode = (e: React.MouseEvent, type: 'task' | 'project', id: string) => {
    e.stopPropagation();
    if (confirm('Ви впевнені?')) {
      if (type === 'task') deleteTask(id);
      else deleteProject(id);
    }
  };

  // Helper to get start of day timestamp
  const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'year') next.setFullYear(currentDate.getFullYear() + direction);
    else if (viewMode === 'month') next.setMonth(currentDate.getMonth() + direction);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + (direction * 7));
    else next.setDate(currentDate.getDate() + direction);
    setCurrentDate(next);
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'year') setViewMode('month');
  };

  const scheduledTasks = useMemo(() => 
    tasks.filter(t => !t.isDeleted && t.scheduledDate),
  [tasks]);

  const dayTasks = useMemo(() => {
    if (selectedDayTimestamp === null) return [];
    return scheduledTasks.filter(t => t.scheduledDate === selectedDayTimestamp);
  }, [scheduledTasks, selectedDayTimestamp]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) setDetailsWidth(newWidth);
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

  const calendarData = useMemo(() => {
    const start = new Date(currentDate);
    if (viewMode === 'month') {
      start.setDate(1);
      const startDay = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - startDay);
      return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else if (viewMode === 'week') {
      const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - day);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else if (viewMode === 'day') {
      return [new Date(currentDate)];
    } else {
      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      });
    }
  }, [currentDate, viewMode]);

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDrop = (e: React.DragEvent, timestamp: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) scheduleTask(taskId, timestamp);
  };

  // Rendering Tree Sections
  const renderProjectTree = (parentId?: string, level = 0) => {
    const filteredProjects = projects.filter(p => p.parentFolderId === parentId);
    return filteredProjects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id && !t.scheduledDate && !t.isDeleted);
      const subNodes = projects.filter(sub => sub.parentFolderId === p.id);
      const nodeId = `proj_${p.id}`;
      const isOpen = expandedNodes[nodeId];

      return (
        <TreeNode
          key={p.id}
          id={p.id}
          label={p.name}
          icon={p.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'}
          type="folder"
          level={level}
          isOpen={isOpen}
          onToggle={() => toggleNode(nodeId)}
          onAdd={(e) => handleAddTaskToNode(e, undefined, p.id)}
          // Fix: Passing correctly identified project and type to edit/delete node handlers.
          onEdit={(e) => handleEditNode(e, 'project', p.id)}
          onDelete={(e) => handleDeleteNode(e, 'project', p.id)}
        >
          {renderProjectTree(p.id, level + 1)}
          {pTasks.map(t => (
            <TreeNode
              key={t.id}
              id={t.id}
              label={t.title}
              icon="fa-file-lines"
              type="task"
              level={level + 1}
              onClick={() => setSelectedTaskId(t.id)}
              isDraggable
              onDragStart={(e) => onDragStart(e, t.id)}
              onEdit={(e) => handleEditNode(e, 'task', t.id)}
              onDelete={(e) => handleDeleteNode(e, 'task', t.id)}
            />
          ))}
        </TreeNode>
      );
    });
  };

  const renderInboxTree = () => {
    return inboxCategories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat.id && !t.scheduledDate && !t.isDeleted && t.status !== TaskStatus.DONE);
      const nodeId = `cat_${cat.id}`;
      const isOpen = expandedNodes[nodeId];

      return (
        <TreeNode
          key={cat.id}
          id={cat.id}
          label={cat.title}
          icon={cat.icon}
          type="folder"
          level={0}
          isOpen={isOpen}
          onToggle={() => toggleNode(nodeId)}
          onAdd={(e) => handleAddTaskToNode(e, cat.id)}
        >
          {catTasks.map(t => (
            <TreeNode
              key={t.id}
              id={t.id}
              label={t.title}
              icon="fa-file-lines"
              type="task"
              level={1}
              onClick={() => setSelectedTaskId(t.id)}
              isDraggable
              onDragStart={(e) => onDragStart(e, t.id)}
              onEdit={(e) => handleEditNode(e, 'task', t.id)}
              onDelete={(e) => handleDeleteNode(e, 'task', t.id)}
            />
          ))}
        </TreeNode>
      );
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* VS Code Style Sidebar Backlog */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden lg:flex shrink-0 select-none">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
           <Typography variant="tiny" className="text-slate-400 font-black">СТРУКТУРА БЕКЛОГУ</Typography>
           <button onClick={() => {
             const name = prompt('Назва проєкту:');
             if(name) addProject({ name, color: '#f97316', isStrategic: false });
           }} className="text-[10px] text-slate-300 hover:text-orange-500"><i className="fa-solid fa-folder-plus"></i></button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           {/* Section: Inbox */}
           <TreeNode 
             id="root_inbox" label="ВХІДНІ" icon="fa-inbox" type="folder" level={-1} 
             isOpen={expandedNodes['root_inbox']} onToggle={() => toggleNode('root_inbox')}
           >
              {renderInboxTree()}
           </TreeNode>

           {/* Section: Next Actions */}
           <TreeNode 
             id="root_next" label="НАСТУПНІ ДІЇ" icon="fa-bolt" type="folder" level={-1} 
             isOpen={expandedNodes['root_next']} onToggle={() => toggleNode('root_next')}
             onAdd={(e) => {
               e.stopPropagation();
               const title = prompt('Назва дії:');
               /* Correctly use Priority enum */
               if (title) updateTask({ id: Math.random().toString(36).substr(2,9), title, status: TaskStatus.NEXT_ACTION, priority: Priority.NUI, difficulty: 1, xp: 50, tags: [], createdAt: Date.now(), habitHistory: {} } as Task);
             }}
           >
              {tasks.filter(t => t.status === TaskStatus.NEXT_ACTION && !t.scheduledDate && !t.isDeleted).map(t => (
                <TreeNode
                  key={t.id} id={t.id} label={t.title} icon="fa-file-bolt" type="task" level={0}
                  onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)}
                  onEdit={(e) => handleEditNode(e, 'task', t.id)} onDelete={(e) => handleDeleteNode(e, 'task', t.id)}
                />
              ))}
           </TreeNode>

           {/* Section: Projects */}
           <TreeNode 
             id="root_projects" label="ПРОЄКТИ" icon="fa-folder-tree" type="folder" level={-1} 
             isOpen={expandedNodes['root_projects']} onToggle={() => toggleNode('root_projects')}
           >
              {renderProjectTree(undefined)}
           </TreeNode>
        </div>
      </aside>

      {/* Main Calendar View */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Typography variant="h3" className="text-slate-900 capitalize min-w-[140px] text-base">
              {viewMode === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
              <button onClick={setToday} className="px-3 text-[9px] font-black uppercase text-slate-500 hover:text-orange-600 border-x border-slate-200">Сьогодні</button>
              <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {(['day', 'week', 'month', 'year', 'agenda'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>{mode[0].toUpperCase()}</button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
          <div className={`grid gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-xl border border-slate-200 ${viewMode === 'month' || viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
            {viewMode !== 'agenda' && viewMode !== 'day' && ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
              <div key={d} className="bg-slate-50 p-2 text-center text-[8px] font-black uppercase text-slate-400 border-b border-slate-200">{d}</div>
            ))}
            {calendarData.map((date, i) => {
              const ts = getStartOfDay(date);
              const isToday = ts === getStartOfDay(new Date());
              const dayTasksList = scheduledTasks.filter(t => t.scheduledDate === ts);
              return (
                <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => onDrop(e, ts)} onClick={() => setSelectedDayTimestamp(ts)}
                  className={`min-h-[100px] p-2 flex flex-col bg-white transition-all relative cursor-pointer ${dragOverDay === ts ? 'bg-orange-50 ring-2 ring-orange-200' : ''}`}>
                  <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg ${isToday ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400'}`}>{date.getDate()}</span>
                  <div className="flex-1 space-y-0.5 mt-1">
                    {dayTasksList.slice(0, 3).map(t => (
                      <div key={t.id} className="text-[9px] font-bold truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-600">{t.title}</div>
                    ))}
                    {dayTasksList.length > 3 && <div className="text-[7px] font-black text-orange-500 uppercase px-1">+{dayTasksList.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Side Panels Stack */}
      <div className="flex h-full transition-all duration-300">
        {selectedDayTimestamp && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-100 bg-white">
            <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 ${isResizing ? 'bg-orange-500' : 'bg-slate-50'}`}></div>
            <div style={{ width: detailsWidth }} className="flex flex-col">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                 <Typography variant="h3" className="text-sm">{new Date(selectedDayTimestamp).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</Typography>
                 <button onClick={() => setSelectedDayTimestamp(null)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {dayTasks.map(t => (
                   <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-orange-200 transition-all cursor-pointer">
                      <div className="text-[11px] font-bold text-slate-800">{t.title}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-100 bg-white z-[60]">
             <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 ${isResizing ? 'bg-orange-500' : 'bg-slate-50'}`}></div>
             <div style={{ width: detailsWidth }}>
                <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
             </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        ${isResizing ? 'body { cursor: col-resize !important; user-select: none !important; }' : ''}
      `}</style>
    </div>
  );
};

export default Calendar;
