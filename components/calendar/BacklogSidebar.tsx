
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
  color?: string;
  onToggle?: () => void; 
  onAdd?: (e: React.MouseEvent) => void; 
  onClick?: () => void; 
  isDraggable?: boolean; 
  onDragStart?: (e: React.DragEvent) => void; 
  children?: React.ReactNode; 
}> = ({ label, icon, type, level, isOpen, count, color, onToggle, onAdd, onClick, isDraggable, onDragStart, children }) => (
  <div className="flex flex-col">
    <div 
      draggable={isDraggable} 
      onDragStart={onDragStart} 
      onClick={onToggle || onClick} 
      className={`group flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-[var(--text-main)]/5 rounded-lg transition-colors relative ${level > 0 ? 'ml-2' : ''} ${isOpen && (type === 'folder' || type === 'system') ? 'bg-[var(--text-main)]/[0.03]' : ''}`}
    >
      <div className="flex items-center gap-1 shrink-0">
         {(type === 'folder' || type === 'system' || (children && React.Children.count(children) > 0)) ? (
           <i className={`fa-solid fa-chevron-right text-[7px] text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-90 text-[var(--primary)]' : ''}`}></i>
         ) : <div className="w-2.5"></div>}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${
           type === 'event' ? 'text-[var(--primary)]' : 
           type === 'note' ? 'text-[var(--primary)] opacity-60' : 
           type === 'folder' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
         }`} style={color ? { color } : {}}></i>
      </div>
      <span className={`text-[10px] truncate flex-1 uppercase tracking-tight ${
        type === 'folder' || type === 'system' ? 'font-black text-[var(--text-main)]' : 'font-bold text-[var(--text-muted)]'
      }`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[7px] font-black text-white bg-[var(--primary)] px-1.5 rounded-full shadow-sm">{count}</span>
      )}
    </div>
    {isOpen && children && <div className="border-l border-[var(--border-color)] ml-3.5 mt-0.5 pl-1">{children}</div>}
  </div>
);

const BacklogSidebar: React.FC<{ onSelectTask: (id: string) => void }> = ({ onSelectTask }) => {
  const { tasks, projects, inboxCategories } = useApp();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 
    'root_planned': true,
    'root_inbox': true, 
    'root_actions': true,
    'root_notes': false,
    'root_projects': true 
  });
  
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

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

  return (
    <aside className="w-64 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col hidden lg:flex shrink-0 select-none shadow-sm h-full overflow-hidden">
      <header className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]/20">
        <Typography variant="tiny" className="text-[var(--text-muted)] font-black tracking-widest opacity-60">Беклог Системи</Typography>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 bg-[var(--bg-main)]/10">
        <TreeNode id="root_inbox" label="Вхідні" icon="fa-inbox" type="system" level={-1} isOpen={expandedNodes['root_inbox']} onToggle={() => toggleNode('root_inbox')}>
            {inboxCategories.filter(c => c.scope === 'inbox' || c.id === 'unsorted').map(cat => (
                <TreeNode key={cat.id} id={cat.id} label={cat.title} icon={cat.icon} type="folder" level={0} count={unscheduledTasks.filter(t => t.category === cat.id && t.status === TaskStatus.INBOX).length} isOpen={expandedNodes[`cat_${cat.id}`]} onToggle={() => toggleNode(`cat_${cat.id}`)}>
                    {unscheduledTasks.filter(t => t.category === cat.id && t.status === TaskStatus.INBOX).map(t => renderTaskNode(t, 1))}
                </TreeNode>
            ))}
        </TreeNode>

        <TreeNode id="root_planned" label="Заплановано" icon="fa-calendar-check" type="system" level={-1} isOpen={expandedNodes['root_planned']} onToggle={() => toggleNode('root_planned')}>
            {scheduledTasks.sort((a,b) => (a.scheduledDate||0)-(b.scheduledDate||0)).slice(0,10).map(t => renderTaskNode(t, 0))}
        </TreeNode>

        <TreeNode id="root_projects" label="Проєкти" icon="fa-folder-tree" type="system" level={-1} isOpen={expandedNodes['root_projects']} onToggle={() => toggleNode('root_projects')}>
            {projects.filter(p => p.type === 'goal' && p.status === 'active').map(p => (
                <TreeNode key={p.id} id={p.id} label={p.name} icon="fa-flag-checkered" color={p.color} type="folder" level={0} isOpen={expandedNodes[`p_${p.id}`]} onToggle={() => toggleNode(`p_${p.id}`)}>
                    {tasks.filter(t => t.projectId === p.id && !t.isDeleted && t.status !== TaskStatus.DONE).map(t => renderTaskNode(t, 1))}
                </TreeNode>
            ))}
        </TreeNode>
      </div>

      <footer className="p-3 bg-[var(--bg-main)]/20 border-t border-[var(--border-color)]">
         <div className="flex items-center justify-between text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
            <span>Активні квести</span>
            <span className="text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-md">{tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE).length}</span>
         </div>
      </footer>
    </aside>
  );
};

export default BacklogSidebar;
