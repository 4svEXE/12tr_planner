
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
      className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-black/5 rounded-lg transition-colors relative ${level > 0 ? 'ml-2' : ''} ${isOpen && (type === 'folder' || type === 'system') ? 'bg-black/[0.02]' : ''}`}
    >
      <div className="flex items-center gap-1 shrink-0">
         {(type === 'folder' || type === 'system' || (children && React.Children.count(children) > 0)) ? (
           <i className={`fa-solid fa-chevron-right text-[7px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>
         ) : <div className="w-2.5"></div>}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${
           type === 'event' ? 'text-pink-500' : 
           type === 'note' ? 'text-indigo-400' : 
           type === 'folder' ? 'text-orange-400' : 'text-slate-400'
         }`} style={color ? { color } : {}}></i>
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
    'root_actions': true,
    'root_notes': false,
    'root_projects': true 
  });
  
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  const scheduledTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate), [tasks]);
  const unscheduledTasks = useMemo(() => tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !t.scheduledDate), [tasks]);
  
  const allNotes = useMemo(() => tasks.filter(t => !t.isDeleted && t.category === 'note'), [tasks]);
  const noteFolders = useMemo(() => projects.filter(p => p.status === 'active' && p.description?.includes('FOLDER_NOTE')), [projects]);

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
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden lg:flex shrink-0 select-none shadow-sm h-full overflow-hidden">
      <header className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <Typography variant="tiny" className="text-slate-400 font-black tracking-widest">Двигун Навігації</Typography>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {/* ВХІДНІ (INBOX SCOPE) */}
        <section>
          <TreeNode 
            id="root_inbox" 
            label="Вхідні Думки" 
            icon="fa-inbox" 
            type="system" 
            level={-1} 
            isOpen={expandedNodes['root_inbox']} 
            onToggle={() => toggleNode('root_inbox')}
          >
            {inboxCategories.filter(c => c.scope === 'inbox' || c.id === 'unsorted' || c.id === 'pinned').map(cat => {
              const nodeId = `cat_inbox_${cat.id}`;
              const catTasks = unscheduledTasks.filter(t => t.category === cat.id && t.status === TaskStatus.INBOX);
              if (catTasks.length === 0 && cat.id !== 'unsorted') return null;
              
              return (
                <TreeNode key={cat.id} id={cat.id} label={cat.title} icon={cat.icon} type="folder" level={0} count={catTasks.length} isOpen={expandedNodes[nodeId]} onToggle={() => toggleNode(nodeId)}>
                  {catTasks.map(t => renderTaskNode(t, 1))}
                </TreeNode>
              );
            })}
          </TreeNode>
        </section>

        {/* ДІЇ (ACTIONS SCOPE) */}
        <section>
          <TreeNode 
            id="root_actions" 
            label="Наступні Дії" 
            icon="fa-bolt" 
            type="system" 
            level={-1} 
            isOpen={expandedNodes['root_actions']} 
            onToggle={() => toggleNode('root_actions')}
          >
            {inboxCategories.filter(c => c.scope === 'actions' || c.id === 'tasks').map(cat => {
              const nodeId = `cat_actions_${cat.id}`;
              const catTasks = unscheduledTasks.filter(t => t.category === cat.id && t.status === TaskStatus.NEXT_ACTION);
              if (catTasks.length === 0 && cat.id !== 'tasks') return null;

              return (
                <TreeNode key={cat.id} id={cat.id} label={cat.title} icon={cat.icon} type="folder" level={0} count={catTasks.length} isOpen={expandedNodes[nodeId]} onToggle={() => toggleNode(nodeId)}>
                  {catTasks.map(t => renderTaskNode(t, 1))}
                </TreeNode>
              );
            })}
          </TreeNode>
        </section>

        {/* НОТАТКИ / БАЗА ЗНАНЬ */}
        <section>
          <TreeNode 
            id="root_notes" 
            label="База Знань" 
            icon="fa-note-sticky" 
            type="system" 
            level={-1} 
            isOpen={expandedNodes['root_notes']} 
            onToggle={() => toggleNode('root_notes')}
          >
            {/* Папки нотаток */}
            {noteFolders.map(folder => {
              const nodeId = `folder_notes_${folder.id}`;
              const folderNotes = allNotes.filter(n => n.projectId === folder.id);
              return (
                <TreeNode key={folder.id} id={folder.id} label={folder.name} icon="fa-folder" type="folder" level={0} count={folderNotes.length} isOpen={expandedNodes[nodeId]} onToggle={() => toggleNode(nodeId)}>
                  {folderNotes.map(n => renderTaskNode(n, 1))}
                </TreeNode>
              );
            })}
            {/* Несортовані нотатки */}
            {allNotes.filter(n => !n.projectId).length > 0 && (
              <TreeNode id="unsorted_notes" label="Несортоване" icon="fa-file-lines" type="folder" level={0} count={allNotes.filter(n => !n.projectId).length} isOpen={expandedNodes['unsorted_notes']} onToggle={() => toggleNode('unsorted_notes')}>
                {allNotes.filter(n => !n.projectId).map(n => renderTaskNode(n, 1))}
              </TreeNode>
            )}
          </TreeNode>
        </section>

        {/* ЗАПЛАНОВАНО */}
        <section>
          <TreeNode id="root_planned" label="Календар" icon="fa-calendar-days" type="system" level={-1} isOpen={expandedNodes['root_planned']} onToggle={() => toggleNode('root_planned')}>
            {scheduledTasks.length > 0 ? scheduledTasks.sort((a,b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)).slice(0,10).map(t => renderTaskNode(t, 0)) : <div className="px-6 py-2 text-[8px] text-slate-300 italic uppercase">Порожньо</div>}
          </TreeNode>
        </section>
      </div>

      <footer className="p-3 bg-slate-50 border-t border-slate-100">
         <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
            <span>Активні справи</span>
            <span className="text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md">{tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE).length}</span>
         </div>
      </footer>
    </aside>
  );
};

export default BacklogSidebar;
