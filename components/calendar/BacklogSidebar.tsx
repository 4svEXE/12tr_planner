
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TaskStatus } from '../../types';
import Typography from '../ui/Typography';

const TreeNode: React.FC<{ 
  id: string; label: string; icon: string; type: 'folder' | 'task' | 'note' | 'event'; 
  level: number; isOpen?: boolean; onToggle?: () => void; onAdd?: (e: React.MouseEvent) => void; 
  onEdit?: (e: React.MouseEvent) => void; onDelete?: (e: React.MouseEvent) => void; 
  onClick?: () => void; isDraggable?: boolean; onDragStart?: (e: React.DragEvent) => void; 
  children?: React.ReactNode; 
}> = ({ id, label, icon, type, level, isOpen, onToggle, onAdd, onEdit, onDelete, onClick, isDraggable, onDragStart, children }) => (
  <div className="flex flex-col">
    <div draggable={isDraggable} onDragStart={onDragStart} onClick={type === 'folder' ? onToggle : onClick} className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors relative ${level > 0 ? 'ml-3' : ''}`}>
      <div className="flex items-center gap-1">
         {type === 'folder' && <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${type === 'folder' ? 'text-orange-400' : type === 'note' ? 'text-indigo-400' : type === 'event' ? 'text-pink-500' : 'text-slate-400'}`}></i>
      </div>
      <span className={`text-[11px] font-medium truncate flex-1 ${type === 'folder' ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>{label}</span>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
         {onAdd && <i onClick={onAdd} className="fa-solid fa-plus text-[9px] text-slate-300 hover:text-orange-500 p-0.5"></i>}
         {onEdit && <i onClick={onEdit} className="fa-solid fa-pen text-[9px] text-slate-300 hover:text-blue-500 p-0.5"></i>}
         {onDelete && <i onClick={onDelete} className="fa-solid fa-trash text-[9px] text-slate-300 hover:text-rose-500 p-0.5"></i>}
      </div>
    </div>
    {isOpen && children && <div className="border-l border-slate-100 ml-3.5 mt-0.5 pl-0.5">{children}</div>}
  </div>
);

const BacklogSidebar: React.FC<{ onSelectTask: (id: string) => void }> = ({ onSelectTask }) => {
  const { tasks, projects, inboxCategories, addProject, addTask, updateProject, deleteProject, deleteTask } = useApp();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root_inbox': true, 'root_next': true, 'root_projects': true, 'root_events': true });
  
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  const renderProjectTree = (parentId?: string, level = 0) => {
    return projects.filter(p => p.parentFolderId === parentId).map(p => (
      <TreeNode key={p.id} id={p.id} label={p.name} icon={p.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'} type="folder" level={level} isOpen={expandedNodes[`proj_${p.id}`]} onToggle={() => toggleNode(`proj_${p.id}`)}
        onAdd={(e) => { e.stopPropagation(); const t = prompt('Назва:'); if(t) addTask(t, 'unsorted', p.id); }}
        onEdit={(e) => { e.stopPropagation(); const n = prompt('Нова назва:', p.name); if(n) updateProject({...p, name: n}); }}
        onDelete={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteProject(p.id); }}>
        {renderProjectTree(p.id, level + 1)}
        {tasks.filter(t => t.projectId === p.id && !t.scheduledDate && !t.isDeleted).map(t => (
          <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={level + 1} onClick={() => onSelectTask(t.id)} isDraggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
            onEdit={(e) => { e.stopPropagation(); onSelectTask(t.id); }} onDelete={(e) => { e.stopPropagation(); deleteTask(t.id); }} />
        ))}
      </TreeNode>
    ));
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden lg:flex shrink-0 select-none shadow-sm h-full">
      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
        <Typography variant="tiny" className="text-slate-400 font-black">СТРУКТУРА БЕКЛОГУ</Typography>
        <button onClick={() => { const n = prompt('Назва:'); if(n) addProject({ name: n, color: '#f97316', isStrategic: false }); }} className="text-[10px] text-slate-300 hover:text-orange-500"><i className="fa-solid fa-folder-plus"></i></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <TreeNode id="root_inbox" label="ВХІДНІ" icon="fa-inbox" type="folder" level={-1} isOpen={expandedNodes['root_inbox']} onToggle={() => toggleNode('root_inbox')}>
          {inboxCategories.map(cat => (
            <TreeNode key={cat.id} id={cat.id} label={cat.title} icon={cat.icon} type="folder" level={0} isOpen={expandedNodes[`cat_${cat.id}`]} onToggle={() => toggleNode(`cat_${cat.id}`)} onAdd={(e) => { e.stopPropagation(); const t = prompt('Назва:'); if(t) addTask(t, cat.id); }}>
              {tasks.filter(t => (t.category === cat.id || (cat.id === 'notes' && t.category === 'note')) && !t.scheduledDate && !t.isDeleted && t.status !== TaskStatus.DONE).map(t => (
                <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={1} onClick={() => onSelectTask(t.id)} isDraggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)} onEdit={() => onSelectTask(t.id)} onDelete={() => deleteTask(t.id)} />
              ))}
            </TreeNode>
          ))}
        </TreeNode>
        <TreeNode id="root_events" label="ПОДІЇ" icon="fa-calendar-check" type="folder" level={-1} isOpen={expandedNodes['root_events']} onToggle={() => toggleNode('root_events')}>
          {tasks.filter(t => t.isEvent && !t.scheduledDate && !t.isDeleted).map(t => (
            <TreeNode key={t.id} id={t.id} label={t.title} icon="fa-calendar-star" type="event" level={0} onClick={() => onSelectTask(t.id)} isDraggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)} onEdit={() => onSelectTask(t.id)} onDelete={() => deleteTask(t.id)} />
          ))}
        </TreeNode>
        <TreeNode id="root_next" label="НАСТУПНІ ДІЇ" icon="fa-bolt" type="folder" level={-1} isOpen={expandedNodes['root_next']} onToggle={() => toggleNode('root_next')}>
          {tasks.filter(t => t.status === TaskStatus.NEXT_ACTION && !t.scheduledDate && !t.isDeleted).map(t => (
            <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-bolt'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={0} onClick={() => onSelectTask(t.id)} isDraggable onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)} onEdit={() => onSelectTask(t.id)} onDelete={() => deleteTask(t.id)} />
          ))}
        </TreeNode>
        <TreeNode id="root_projects" label="ПРОЄКТИ" icon="fa-folder-tree" type="folder" level={-1} isOpen={expandedNodes['root_projects']} onToggle={() => toggleNode('root_projects')}>
          {renderProjectTree(undefined)}
        </TreeNode>
      </div>
    </aside>
  );
};

export default BacklogSidebar;
