
import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TaskStatus, Task, Project, InboxCategory } from '../../types';
import Typography from '../ui/Typography';

const TreeNode: React.FC<{ 
  id: string; 
  label: string; 
  icon: string; 
  type: 'folder' | 'task' | 'note' | 'event' | 'system'; 
  level: number; 
  isOpen?: boolean; 
  count?: number;
  onToggle?: () => void; 
  onAdd?: (e: React.MouseEvent) => void; 
  onClick?: () => void; 
  isDraggable?: boolean; 
  onDragStart?: (e: React.DragEvent) => void; 
  children?: React.ReactNode; 
}> = ({ label, icon, type, level, isOpen, count, onToggle, onAdd, onClick, isDraggable, onDragStart, children }) => (
  <div className="flex flex-col">
    <div 
      draggable={isDraggable} 
      onDragStart={onDragStart} 
      onClick={onToggle || onClick} 
      className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-black/5 rounded-lg transition-colors relative ${level > 0 ? 'ml-2' : ''} ${isOpen && type === 'folder' ? 'bg-black/[0.02]' : ''}`}
    >
      <div className="flex items-center gap-1 shrink-0">
         {(type === 'folder' || type === 'system') && (
           <i className={`fa-solid fa-chevron-right text-[7px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>
         )}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${
           type === 'event' ? 'text-pink-500' : 
           type === 'note' ? 'text-indigo-400' : 
           type === 'folder' ? 'text-orange-400' : 'text-slate-400'
         }`}></i>
      </div>
      <span className={`text-[10px] truncate flex-1 uppercase tracking-tight ${
        type === 'folder' || type === 'system' ? 'font-black text-slate-700' : 'font-bold text-slate-500'
      }`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[7px] font-black text-slate-300 bg-slate-100 px-1.5 rounded-full group-hover:bg-white transition-colors">{count}</span>
      )}
      {onAdd && (
        <i onClick={onAdd} className="fa-solid fa-plus text-[8px] text-slate-200 hover:text-orange-500 opacity-0 group-hover:opacity-100 p-1" title="Додати"></i>
      )}
    </div>
    {isOpen && children && <div className="border-l border-slate-100 ml-3.5 mt-0.5 pl-1">{children}</div>}
  </div>
);

const BacklogSidebar: React.FC<{ onSelectTask: (id: string) => void }> = ({ onSelectTask }) => {
  const { tasks, projects, inboxCategories, addProject, addTask, deleteTask } = useApp();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 
    'root_planned': true,
    'root_inbox': true, 
    'root_projects': true 
  });
  
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  // Розподіл завдань
  const scheduledTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate), [tasks]);
  const unscheduledTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !t.scheduledDate), [tasks]);

  const renderTaskNode = (t: Task, level: number) => (
    <TreeNode 
      key={t.id} 
      id={t.id} 
      label={t.title} 
      icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-circle-dot'} 
      type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} 
      level={level} 
      onClick={() => onSelectTask(t.id)} 
      isDraggable 
      onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
    />
  );

  const renderProjectTree = (parentId?: string, level = 0) => {
    return projects
      .filter(p => p.parentFolderId === parentId && p.status === 'active')
      .map(p => {
        const nodeId = `proj_${p.id}`;
        const pScheduled = scheduledTasks.filter(t => t.projectId === p.id);
        const pUnscheduled = unscheduledTasks.filter(t => t.projectId === p.id);
        const subprojects = projects.filter(sp => sp.parentFolderId === p.id);

        return (
          <TreeNode 
            key={p.id} 
            id={p.id} 
            label={p.name} 
            icon={p.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'} 
            type="folder" 
            level={level} 
            isOpen={expandedNodes[nodeId]} 
            onToggle={() => toggleNode(nodeId)}
            onAdd={(e) => { e.stopPropagation(); const t = prompt('Нове завдання проєкті:'); if(t) addTask(t, 'tasks', p.id); }}
          >
            {/* Підпроєкти */}
            {renderProjectTree(p.id, level + 1)}

            {/* Події проєкту (Все що має дату) */}
            {pScheduled.length > 0 && (
              <TreeNode 
                id={`${nodeId}_events`} 
                label="Події" 
                icon="fa-calendar-check" 
                type="folder" 
                level={level + 1} 
                count={pScheduled.length}
                isOpen={expandedNodes[`${nodeId}_events`]} 
                onToggle={() => toggleNode(`${nodeId}_events`)}
              >
                {pScheduled.map(t => renderTaskNode(t, level + 2))}
              </TreeNode>
            )}

            {/* Беклог проєкту (Все без дати) */}
            {pUnscheduled.length > 0 && (
              <TreeNode 
                id={`${nodeId}_backlog`} 
                label="Беклог" 
                icon="fa-list-ul" 
                type="folder" 
                level={level + 1} 
                count={pUnscheduled.length}
                isOpen={expandedNodes[`${nodeId}_backlog`]} 
                onToggle={() => toggleNode(`${nodeId}_backlog`)}
              >
                {pUnscheduled.map(t => renderTaskNode(t, level + 2))}
              </TreeNode>
            )}
          </TreeNode>
        );
      });
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden lg:flex shrink-0 select-none shadow-sm h-full overflow-hidden">
      <header className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <Typography variant="tiny" className="text-slate-400 font-black tracking-widest">Навігатор</Typography>
        <div className="flex gap-1">
           <button onClick={() => { const n = prompt('Нова ціль:'); if(n) addProject({ name: n, color: '#f97316', isStrategic: true, type: 'goal' }); }} className="w-6 h-6 rounded-lg bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:text-orange-500 hover:shadow-sm transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        
        {/* ВСЕ ЩО МАЄ ДАТУ (ПОДІЇ) */}
        <section>
          <TreeNode 
            id="root_planned" 
            label="Заплановано" 
            icon="fa-calendar-days" 
            type="system" 
            level={-1} 
            count={scheduledTasks.length}
            isOpen={expandedNodes['root_planned']} 
            onToggle={() => toggleNode('root_planned')}
          >
            {scheduledTasks.length > 0 ? (
               scheduledTasks.sort((a,b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)).map(t => (
                 <div key={t.id} className="relative">
                    {renderTaskNode(t, 0)}
                    <div className="absolute left-6 bottom-0 text-[6px] font-black text-orange-500 uppercase opacity-50">
                       {new Date(t.scheduledDate!).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                    </div>
                 </div>
               ))
            ) : (
              <div className="px-6 py-2 text-[8px] text-slate-300 italic uppercase">Немає подій</div>
            )}
          </TreeNode>
        </section>

        {/* ВХІДНІ (КАТЕГОРІЇ) */}
        <section>
          <TreeNode 
            id="root_inbox" 
            label="Вхідні" 
            icon="fa-inbox" 
            type="system" 
            level={-1} 
            isOpen={expandedNodes['root_inbox']} 
            onToggle={() => toggleNode('root_inbox')}
          >
            {inboxCategories.map(cat => {
              const nodeId = `cat_${cat.id}`;
              const catTasks = unscheduledTasks.filter(t => {
                if (cat.isPinned) return t.isPinned;
                return t.category === cat.id && !t.isPinned && !t.projectId;
              });

              return (
                <TreeNode 
                  key={cat.id} 
                  id={cat.id} 
                  label={cat.title} 
                  icon={cat.icon} 
                  type="folder" 
                  level={0} 
                  count={catTasks.length}
                  isOpen={expandedNodes[nodeId]} 
                  onToggle={() => toggleNode(nodeId)} 
                  onAdd={(e) => { e.stopPropagation(); const t = prompt(`Додати у ${cat.title}:`); if(t) addTask(t, cat.id); }}
                >
                  {catTasks.map(t => renderTaskNode(t, 1))}
                </TreeNode>
              );
            })}
          </TreeNode>
        </section>

        {/* ПРОЄКТИ ТА ЦІЛІ */}
        <section>
          <TreeNode 
            id="root_projects" 
            label="Проєкти" 
            icon="fa-folder-tree" 
            type="system" 
            level={-1} 
            isOpen={expandedNodes['root_projects']} 
            onToggle={() => toggleNode('root_projects')}
          >
            {renderProjectTree(undefined)}
          </TreeNode>
        </section>
      </div>

      <footer className="p-3 bg-slate-50 border-t border-slate-100">
         <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
            <span>Активні квести</span>
            <span className="text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md">{tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE).length}</span>
         </div>
      </footer>
    </aside>
  );
};

export default BacklogSidebar;
