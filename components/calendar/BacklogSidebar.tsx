import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TaskStatus, Task, Project } from '../../types';
import Typography from '../ui/Typography';

const TreeNode: React.FC<{
  id: string;
  label: string;
  icon: string;
  type: 'folder' | 'list' | 'task' | 'note' | 'system';
  level: number;
  isOpen?: boolean;
  count?: number;
  color?: string;
  isDone?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  children?: React.ReactNode;
}> = ({ label, icon, type, level, isOpen, count, color, isDone, onToggle, onClick, isDraggable, onDragStart, onDragOver, onDrop, children }) => {
  const isContent = type === 'task' || type === 'note';
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div className="flex flex-col">
      <div
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); onDragOver?.(e); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { setIsDragOver(false); onDrop?.(e); }}
        onClick={onToggle || onClick}
        className={`group flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-black/5 rounded-xl transition-all relative ${isContent ? 'mx-1' : ''
          } ${isOpen && !isContent ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'} ${isDragOver ? 'bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]/30' : ''}`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {(!isContent && (children || type === 'folder' || type === 'list' || type === 'system')) ? (
            <i className={`fa-solid fa-chevron-right text-[7px] w-3 text-center transition-transform ${isOpen ? 'rotate-90 text-[var(--primary)]' : 'text-slate-300'}`}></i>
          ) : (
            <div className="w-3"></div>
          )}
          <i className={`fa-solid ${icon} text-[11px] w-4 text-center ${type === 'note' ? 'text-indigo-500' :
            type === 'task' ? 'text-slate-400' :
              type === 'folder' ? 'text-amber-500' :
                type === 'list' ? 'text-indigo-500' :
                  label === 'Календар' ? 'text-rose-500' : 'text-blue-500'
            }`} style={color ? { color } : {}}></i>
        </div>

        <span className={`text-[12px] truncate flex-1 tracking-tight ${isContent
          ? `font-bold ${isDone ? 'line-through opacity-40' : 'text-slate-700'}`
          : 'font-bold'
          }`}>
          {label}
        </span>

        {count !== undefined && count > 0 && !isOpen && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${label === 'Календар' ? 'bg-rose-500/10 text-rose-500' : 'bg-black/5 text-slate-400'
            }`}>{count}</span>
        )}
      </div>
      {isOpen && children && <div className="mt-0.5">{children}</div>}
    </div>
  );
};

const BacklogSidebar: React.FC<{ onSelectTask: (id: string) => void }> = ({ onSelectTask }) => {
  const { tasks, projects, setActiveTab, updateTask, deleteTask, diary, saveDiaryEntry } = useApp();

  const getInitialExpandedState = () => {
    const saved = localStorage.getItem('backlog_expanded_nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved expanded state', e);
      }
    }
    return {
      'system_inbox': false,
      'system_calendar': true,
      'system_notes': false,
      'root_collections': true
    };
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(getInitialExpandedState());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = { ...prev, [nodeId]: !prev[nodeId] };
      localStorage.setItem('backlog_expanded_nodes', JSON.stringify(next));
      return next;
    });
  };

  // Фільтрація згідно з GTD-логікою Записника
  const inboxTasks = useMemo(() => tasks.filter(t =>
    !t.isDeleted &&
    t.status !== TaskStatus.DONE &&
    !t.projectId &&
    t.category !== 'note' &&
    !t.scheduledDate
  ), [tasks]);

  const scheduledTasks = useMemo(() =>
    tasks
      .filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (!!t.scheduledDate || !!t.dueDate))
      .sort((a, b) => (a.scheduledDate || a.dueDate || 0) - (b.scheduledDate || b.dueDate || 0)),
    [tasks]
  );
  const looseNotes = useMemo(() => tasks.filter(t => !t.projectId && t.category === 'note' && !t.isDeleted && !t.scheduledDate), [tasks]);
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId && !t.isDeleted && t.status !== TaskStatus.DONE), [tasks]);

  const handleDrop = (e: React.DragEvent, targetType: 'inbox' | 'note' | 'diary' | string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (targetType === 'inbox') {
      updateTask({ ...task, scheduledDate: undefined, projectId: undefined, category: 'tasks' });
    } else if (targetType === 'calendar') {
      updateTask({ ...task, showInCalendar: true, scheduledDate: task.scheduledDate || new Date().setHours(0, 0, 0, 0) });
    } else if (targetType === 'note') {
      updateTask({ ...task, scheduledDate: undefined, projectId: undefined, category: 'note' });
    } else if (targetType === 'diary') {
      // Move to diary logic
      const dateStr = task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
      const existingEntry = diary.find(d => d.date === dateStr);
      let newContent = '';
      const block = { id: Math.random().toString(36).substr(2, 9), type: 'bullet', content: task.title };

      if (existingEntry) {
        try {
          const blocks = JSON.parse(existingEntry.content);
          newContent = JSON.stringify([...blocks, block]);
        } catch (e) {
          newContent = JSON.stringify([{ id: 'b1', type: 'text', content: existingEntry.content }, block]);
        }
        saveDiaryEntry(dateStr, newContent, existingEntry.id);
      } else {
        newContent = JSON.stringify([block]);
        saveDiaryEntry(dateStr, newContent);
      }
      deleteTask(taskId, true);
    } else if (targetType.startsWith('project_')) {
      const pId = targetType.replace('project_', '');
      updateTask({ ...task, projectId: pId, scheduledDate: undefined });
    }
  };

  const renderTaskNode = (t: Task, level: number) => {
    const formattedDate = t.scheduledDate
      ? new Date(t.scheduledDate).toLocaleString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
      : '';

    const tagsStr = t.tags && t.tags.length > 0
      ? ' ' + t.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')
      : '';

    const labelWithDate = formattedDate
      ? `${t.title || "Без назви"} • ${formattedDate}${tagsStr}`
      : `${t.title || "Без назви"}${tagsStr}`;

    return (
      <TreeNode
        key={t.id}
        id={t.id}
        label={labelWithDate}
        icon={t.category === 'note' ? 'fa-note-sticky' : 'fa-circle-dot'}
        type={t.category === 'note' ? 'note' : 'task'}
        level={level}
        onClick={() => onSelectTask(t.id)}
        isDone={t.status === TaskStatus.DONE || (t.status as any) === 'DONE'}
        isDraggable
        onDragStart={(e) => {
          e.dataTransfer.setData('taskId', t.id);
          if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
        }}
      />
    );
  };

  const renderProjectTree = (parentId?: string, level = 0): React.ReactNode[] => {
    return projects
      .filter(p => p.parentFolderId === parentId && p.description !== 'SYSTEM_PLANNER_CONFIG')
      .map(p => {
        const nodeId = `node_${p.id}`;
        const isFolder = p.type === 'folder';
        const tasksInThisProject = projectTasks.filter(t => t.projectId === p.id);
        const isOpen = expandedNodes[nodeId];

        return (
          <TreeNode
            key={p.id}
            id={p.id}
            label={p.name}
            icon={isFolder ? (isOpen ? 'fa-folder-open' : 'fa-folder') : 'fa-list-ul'}
            type={isFolder ? 'folder' : 'list'}
            level={level}
            isOpen={isOpen}
            onToggle={() => toggleNode(nodeId)}
            onDrop={(e) => !isFolder && handleDrop(e, `project_${p.id}`)}
            color={p.color}
            count={tasksInThisProject.length}
          >
            {renderProjectTree(p.id, level + 1)}
            {!isFolder && tasksInThisProject.map(t => renderTaskNode(t, level + 1))}
          </TreeNode>
        );
      });
  };

  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shrink-0 select-none shadow-sm h-full overflow-hidden no-print">
      <header className="p-4 md:p-5 border-b border-[var(--border-color)] flex items-center bg-[var(--bg-card)] sticky top-0 z-10 shrink-0">
        <Typography variant="h2" className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">Записник</Typography>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2 space-y-6">

        {/* СИСТЕМНІ РОЗДІЛИ (ЯК У LISTS) */}
        <section className="space-y-0.5">
          <TreeNode
            id="system_inbox"
            label="Вхідні"
            icon="fa-inbox"
            type="system"
            level={0}
            isOpen={expandedNodes['system_inbox']}
            onToggle={() => toggleNode('system_inbox')}
            onDrop={(e) => handleDrop(e, 'inbox')}
            count={inboxTasks.length}
          >
            {inboxTasks.map(t => renderTaskNode(t, 1))}
          </TreeNode>

          <TreeNode
            id="system_calendar"
            label="Календар"
            icon="fa-calendar-day"
            type="system"
            level={0}
            isOpen={expandedNodes['system_calendar']}
            onToggle={() => toggleNode('system_calendar')}
            onDrop={(e) => handleDrop(e, 'calendar')}
            count={scheduledTasks.length}
          >
            {scheduledTasks.map(t => renderTaskNode(t, 1))}
          </TreeNode>

          <TreeNode
            id="system_notes"
            label="Нотатки"
            icon="fa-note-sticky"
            type="system"
            level={0}
            isOpen={expandedNodes['system_notes']}
            onToggle={() => toggleNode('system_notes')}
            onDrop={(e) => handleDrop(e, 'note')}
            count={looseNotes.length}
          >
            {looseNotes.map(t => renderTaskNode(t, 1))}
          </TreeNode>

          <TreeNode
            id="system_diary"
            label="Щоденник"
            icon="fa-book-open"
            type="system"
            level={0}
            isOpen={false}
            onDrop={(e) => handleDrop(e, 'diary')}
            color="#a855f7"
          />
        </section>

        {/* КОЛЕКЦІЇ */}
        <section className="space-y-1">
          <div
            onClick={() => toggleNode('root_collections')}
            className="flex items-center gap-2 py-1 px-3 cursor-pointer group hover:bg-black/5 rounded-xl transition-all"
          >
            <div className="flex items-center gap-1.5 shrink-0" style={{ paddingLeft: '12px' }}>
              <i className={`fa-solid fa-chevron-right text-[7px] w-3 text-center transition-transform ${expandedNodes['root_collections'] ? 'rotate-90' : 'text-slate-300'}`}></i>
              <div className="w-4"></div>
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">Списки</span>
          </div>

          {expandedNodes['root_collections'] && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              {renderProjectTree()}
            </div>
          )}
        </section>
      </div>

      {/* АРХІВ (ЯК У LISTS) */}
      <div className="mt-auto shrink-0 border-t border-[var(--border-color)] bg-black/[0.01] pt-2">
        <div className="space-y-1 pb-4">
          <div className="px-4 mb-1 flex items-center gap-2 opacity-30">
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Архів</span>
          </div>
          <div className="grid grid-cols-1 gap-0.5 px-2">
            {[
              { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги', color: 'text-amber-500' },
              { id: 'completed', icon: 'fa-check-double', label: 'Готово', color: 'text-emerald-500' },
              { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', color: 'text-rose-500' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight text-[var(--text-main)] hover:bg-black/5 transition-all"
              >
                <i className={`fa-solid ${item.icon} w-5 text-center ${item.color} text-[11px]`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default BacklogSidebar;