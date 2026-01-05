
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import TaskDetails from '../components/TaskDetails';

const TreeItem: React.FC<{ 
  label: string; 
  icon: string; 
  iconColor: string; 
  level: number; 
  isExpanded?: boolean; 
  onToggle?: () => void; 
  onClick?: () => void; 
  children?: React.ReactNode;
  isActive?: boolean;
}> = ({ label, icon, iconColor, level, isExpanded, onToggle, onClick, children, isActive }) => {
  return (
    <div className="flex flex-col">
      <div 
        onClick={onClick || onToggle}
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50 group ${isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {children ? (
             <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle?.(); }}></i>
          ) : (
             <div className="w-3"></div>
          )}
          <i className={`fa-solid ${icon} text-[10px] w-4 text-center shrink-0`} style={{ color: iconColor }}></i>
          <span className={`text-[11px] truncate ${isActive ? 'font-black' : 'font-medium'}`}>{label}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
           <i className="fa-solid fa-ellipsis text-[10px] text-slate-300"></i>
        </div>
      </div>
      {isExpanded && children && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

const StructureView: React.FC = () => {
  const { projects, tasks, setActiveTab } = useApp();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderGoal = (goal: Project) => {
    const isExpanded = expandedNodes[goal.id];
    const subprojects = projects.filter(p => p.parentFolderId === goal.id);
    const goalHabits = tasks.filter(t => t.projectId === goal.id && t.projectSection === 'habits');
    const goalActions = tasks.filter(t => t.projectId === goal.id && (t.projectSection === 'actions' || !t.projectSection));

    return (
      <TreeItem 
        key={goal.id} 
        label={goal.name} 
        icon="fa-trophy" 
        iconColor={goal.color} 
        level={0}
        isExpanded={isExpanded}
        onToggle={() => toggleNode(goal.id)}
      >
        {/* Subprojects */}
        {subprojects.map(sub => (
          <TreeItem 
            key={sub.id} 
            label={sub.name} 
            icon="fa-skull-crossbones" 
            iconColor={sub.color} 
            level={1}
            isExpanded={expandedNodes[sub.id]}
            onToggle={() => toggleNode(sub.id)}
          >
             {tasks.filter(t => t.projectId === sub.id).map(task => (
               <TreeItem 
                 key={task.id} 
                 label={task.title} 
                 icon={task.status === TaskStatus.DONE ? "fa-circle-check" : "fa-file-lines"} 
                 iconColor={task.status === TaskStatus.DONE ? "#10b981" : "#94a3b8"} 
                 level={2}
                 onClick={() => setSelectedTaskId(task.id)}
                 isActive={selectedTaskId === task.id}
               />
             ))}
          </TreeItem>
        ))}

        {/* Habits */}
        {goalHabits.length > 0 && (
          <TreeItem label="Звички" icon="fa-repeat" iconColor="#f59e0b" level={1} isExpanded={expandedNodes[`${goal.id}_habits`]} onToggle={() => toggleNode(`${goal.id}_habits`)}>
             {goalHabits.map(h => (
                <TreeItem key={h.id} label={h.title} icon="fa-circle" iconColor="#f59e0b" level={2} onClick={() => setSelectedTaskId(h.id)} isActive={selectedTaskId === h.id} />
             ))}
          </TreeItem>
        )}

        {/* Top-level actions */}
        {goalActions.map(task => (
           <TreeItem 
             key={task.id} 
             label={task.title} 
             icon={task.status === TaskStatus.DONE ? "fa-circle-check" : "fa-file-lines"} 
             iconColor={task.status === TaskStatus.DONE ? "#10b981" : "#94a3b8"} 
             level={1}
             onClick={() => setSelectedTaskId(task.id)}
             isActive={selectedTaskId === task.id}
           />
        ))}
      </TreeItem>
    );
  };

  const standaloneProjects = projects.filter(p => p.type !== 'goal' && !p.parentFolderId);

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <header className="p-5 border-b border-slate-100 flex items-center justify-between">
           <Typography variant="tiny" className="text-slate-900 font-black">СТРУКТУРА</Typography>
           <div className="flex gap-2">
              <i className="fa-solid fa-folder-plus text-[10px] text-slate-300 hover:text-orange-500 cursor-pointer"></i>
              <i className="fa-solid fa-rotate text-[10px] text-slate-300 hover:text-orange-500 cursor-pointer"></i>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
           <div className="mb-4">
              <Typography variant="tiny" className="px-3 py-2 text-slate-300 text-[8px]">ГЛОБАЛЬНІ ЦІЛІ</Typography>
              {projects.filter(p => p.type === 'goal').map(renderGoal)}
           </div>
           <div>
              <Typography variant="tiny" className="px-3 py-2 text-slate-300 text-[8px]">ІНШІ ПРОЄКТИ</Typography>
              {standaloneProjects.map(p => (
                <TreeItem key={p.id} label={p.name} icon="fa-folder" iconColor={p.color} level={0} isExpanded={expandedNodes[p.id]} onToggle={() => toggleNode(p.id)}>
                   {tasks.filter(t => t.projectId === p.id).map(t => (
                      <TreeItem key={t.id} label={t.title} icon="fa-file-lines" iconColor="#94a3b8" level={1} onClick={() => setSelectedTaskId(t.id)} isActive={selectedTaskId === t.id} />
                   ))}
                </TreeItem>
              ))}
           </div>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 bg-white items-center justify-center p-12">
         {selectedTaskId ? (
           <div className="w-full max-w-2xl h-full border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in duration-300">
             <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
           </div>
         ) : (
           <div className="text-center space-y-4 opacity-20">
              <i className="fa-solid fa-file-code text-8xl"></i>
              <Typography variant="h2">Оберіть файл для перегляду</Typography>
              <Typography variant="body">Ваша база знань структурована за ієрархією Цілі -> Підпроєкти -> Дії</Typography>
           </div>
         )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default StructureView;
