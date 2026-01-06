
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, Task, Project } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import HabitStatsSidebar from '../components/HabitStatsSidebar';
import { useResizer } from '../hooks/useResizer';

const TreeNode: React.FC<{ 
  id: string; 
  label: string; 
  icon: string; 
  type: 'folder' | 'task' | 'note' | 'event' | 'system' | 'habit'; 
  level: number; 
  isOpen?: boolean; 
  count?: number;
  color?: string;
  onToggle?: () => void; 
  onAddAction?: (e: React.MouseEvent) => void; 
  onAddSub?: (e: React.MouseEvent) => void;
  onAddHabit?: (e: React.MouseEvent) => void;
  onClick?: () => void; 
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  isDraggable?: boolean; 
  onDragStart?: (e: React.DragEvent) => void; 
  isActive?: boolean;
  children?: React.ReactNode; 
}> = ({ label, icon, type, level, isOpen, count, color, onToggle, onAddAction, onAddSub, onAddHabit, onClick, onRename, onDelete, isDraggable, onDragStart, isActive, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editValue.trim() && editValue !== label) {
      onRename?.(editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col">
      <div 
        draggable={isDraggable} 
        onDragStart={onDragStart} 
        onClick={() => { if (!isEditing) (onClick || onToggle)?.(); }} 
        className={`group flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-slate-100 rounded-lg transition-all relative ${
          isActive ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' : 'text-slate-600'
        }`}
        style={{ marginLeft: `${level * 12}px` }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
           {(children || type === 'folder' || type === 'system') ? (
             <i className={`fa-solid fa-chevron-right text-[7px] w-3 text-center transition-transform ${isOpen ? 'rotate-90 text-orange-500' : 'text-slate-300'}`}></i>
           ) : (
             <div className="w-3"></div>
           )}
           <i className={`fa-solid ${icon} text-[11px] w-4 text-center ${
             type === 'event' ? 'text-pink-500' : 
             type === 'note' ? 'text-indigo-400' : 
             type === 'habit' ? 'text-emerald-500' :
             type === 'folder' ? (color ? '' : 'text-orange-400') : 'text-slate-400'
           }`} style={color ? { color } : {}}></i>
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleRename} onClick={e => e.stopPropagation()}>
              <input 
                autoFocus 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleRename}
                className="w-full bg-white border border-orange-200 rounded px-1 text-[12px] font-bold outline-none h-5"
              />
            </form>
          ) : (
            <span className={`text-[12px] truncate block tracking-tight ${
              type === 'folder' || type === 'system' ? 'font-black uppercase' : 'font-bold'
            }`}>
              {label}
            </span>
          )}
        </div>

        {count !== undefined && count > 0 && !isOpen && !isEditing && (
          <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100 group-hover:bg-white">{count}</span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all ml-auto shrink-0">
          {onAddSub && (
            <button onClick={(e) => { e.stopPropagation(); onAddSub(e); }} title="Новий підпроєкт" className="w-5 h-5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-500">
              <i className="fa-solid fa-folder-plus text-[9px]"></i>
            </button>
          )}
          {onAddAction && (
            <button onClick={(e) => { e.stopPropagation(); onAddAction(e); }} title="Нова дія" className="w-5 h-5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500">
              <i className="fa-solid fa-file-circle-plus text-[9px]"></i>
            </button>
          )}
          {onAddHabit && (
            <button onClick={(e) => { e.stopPropagation(); onAddHabit(e); }} title="Нова звичка" className="w-5 h-5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500">
              <i className="fa-solid fa-repeat text-[9px]"></i>
            </button>
          )}
          {onRename && !isEditing && (
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Перейменувати" className="w-5 h-5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-300 hover:text-slate-600">
              <i className="fa-solid fa-pencil text-[8px]"></i>
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); if(confirm(`Видалити ${label}?`)) onDelete(); }} title="Видалити" className="w-5 h-5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-300 hover:text-rose-500">
              <i className="fa-solid fa-trash-can text-[8px]"></i>
            </button>
          )}
        </div>
      </div>
      {isOpen && children && <div className="mt-0.5">{children}</div>}
    </div>
  );
};

const StructureView: React.FC = () => {
  const { tasks, projects, inboxCategories, addProject, addTask, updateTask, updateProject, deleteProject, deleteTask, toggleHabitStatus } = useApp();
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 800);
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root_projects': true });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  const toggleNode = (nodeId: string, forceOpen?: boolean) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: forceOpen ?? !prev[nodeId] }));
  };

  const activeTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE), [tasks]);

  const renderTaskNode = (t: Task, level: number) => {
    const isHabit = t.projectSection === 'habits' || t.tags.includes('habit');
    return (
      <TreeNode 
        key={t.id} 
        id={t.id} 
        label={t.title} 
        icon={isHabit ? 'fa-repeat' : t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-circle-dot'} 
        type={isHabit ? 'habit' : t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} 
        level={level} 
        onClick={() => {
          if (isHabit) {
            setSelectedHabitId(t.id);
            setSelectedTaskId(null);
          } else {
            setSelectedTaskId(t.id);
            setSelectedHabitId(null);
          }
        }}
        isActive={selectedTaskId === t.id || selectedHabitId === t.id}
        onRename={(n) => updateTask({ ...t, title: n })}
        onDelete={() => deleteTask(t.id, true)}
        isDraggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
      />
    );
  };

  const renderProjectTree = (parentId?: string, level = 0) => {
    return projects
      .filter(p => p.parentFolderId === parentId && p.status === 'active')
      .map(p => {
        const nodeId = `proj_${p.id}`;
        const pTasks = activeTasks.filter(t => t.projectId === p.id);
        
        return (
          <TreeNode 
            key={p.id} 
            id={p.id} 
            label={p.name} 
            icon={p.isStrategic ? 'fa-flag-checkered' : 'fa-layer-group'} 
            color={p.color}
            type="folder" 
            level={level} 
            isOpen={expandedNodes[nodeId]} 
            onToggle={() => toggleNode(nodeId)}
            onAddAction={(e) => { 
              e.stopPropagation(); 
              const t = prompt('Назва дії:'); 
              if(t) {
                addTask(t, 'tasks', p.id, 'actions'); 
                toggleNode(nodeId, true);
              }
            }}
            onAddSub={(e) => { 
              e.stopPropagation(); 
              const n = prompt('Назва підпроєкту:'); 
              if(n) {
                addProject({ name: n, color: p.color, parentFolderId: p.id, isStrategic: false, type: 'subproject' }); 
                toggleNode(nodeId, true);
              }
            }}
            onAddHabit={(e) => { 
              e.stopPropagation(); 
              const t = prompt('Назва звички:'); 
              if(t) {
                addTask(t, 'tasks', p.id, 'habits'); 
                toggleNode(nodeId, true);
              }
            }}
            onRename={(n) => updateProject({ ...p, name: n })}
            onDelete={() => deleteProject(p.id)}
            count={pTasks.length}
          >
            {renderProjectTree(p.id, level + 1)}
            {pTasks.map(t => renderTaskNode(t, level + 1))}
          </TreeNode>
        );
      });
  };

  const selectedHabit = useMemo(() => tasks.find(h => h.id === selectedHabitId), [tasks, selectedHabitId]);

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100">
        <header className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-sitemap text-xs"></i></div>
              <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Навігатор структури</Typography>
           </div>
           <div className="flex gap-2">
              <button onClick={() => { const n = prompt('Назва нової цілі:'); if(n) addProject({ name: n, color: '#f97316', isStrategic: true, type: 'goal' }); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm">
                <i className="fa-solid fa-plus"></i> Ціль
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <section>
            <TreeNode 
              id="root_projects" 
              label="Проєкти та Цілі" 
              icon="fa-folder-tree" 
              type="system" 
              level={0} 
              isOpen={expandedNodes['root_projects']} 
              onToggle={() => toggleNode('root_projects')}
              onAddSub={(e) => { e.stopPropagation(); const n = prompt('Назва нової цілі:'); if(n) addProject({ name: n, color: '#f97316', isStrategic: true, type: 'goal' }); }}
            >
              {renderProjectTree(undefined, 1)}
            </TreeNode>
          </section>

          <section>
            <TreeNode 
              id="root_inbox" 
              label="Вхідні та Категорії" 
              icon="fa-inbox" 
              type="system" 
              level={0} 
              isOpen={expandedNodes['root_inbox']} 
              onToggle={() => toggleNode('root_inbox')}
            >
              {inboxCategories.map(cat => {
                const nodeId = `cat_${cat.id}`;
                const catTasks = activeTasks.filter(t => t.category === cat.id && !t.projectId);
                return (
                  <TreeNode 
                    key={cat.id} 
                    id={cat.id} 
                    label={cat.title} 
                    icon={cat.icon} 
                    type="folder" 
                    level={1} 
                    count={catTasks.length}
                    isOpen={expandedNodes[nodeId]} 
                    onToggle={() => toggleNode(nodeId)} 
                    onAddAction={(e) => { e.stopPropagation(); const t = prompt(`Додати у ${cat.title}:`); if(t) addTask(t, cat.id); }}
                  >
                    {catTasks.map(t => renderTaskNode(t, 2))}
                  </TreeNode>
                );
              })}
            </TreeNode>
          </section>
        </div>
      </div>

      {/* Area for Details / Habit Stats */}
      <div className="bg-slate-50/10 shrink-0 relative flex flex-col" style={{ width: detailsWidth }}>
         <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:bg-orange-500 transition-colors z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
         
         {selectedTaskId ? (
           <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
         ) : selectedHabit ? (
           <div className="h-full animate-in slide-in-from-right duration-300">
             <HabitStatsSidebar 
               habit={selectedHabit} 
               onClose={() => setSelectedHabitId(null)}
               onUpdate={(updates) => updateTask({ ...selectedHabit, ...updates })}
               onToggleStatus={toggleHabitStatus}
             />
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale p-10 text-center select-none pointer-events-none">
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center mb-8">
                <i className="fa-solid fa-mouse-pointer text-4xl"></i>
              </div>
              <Typography variant="h2" className="text-xl font-black uppercase tracking-widest">Оберіть елемент</Typography>
              <Typography variant="body" className="mt-4 text-xs font-bold leading-relaxed max-w-[200px]">
                Використовуйте кнопки + та олівець для керування ієрархією життя.
              </Typography>
           </div>
         )}
      </div>
    </div>
  );
};

export default StructureView;
