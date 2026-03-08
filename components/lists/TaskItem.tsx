
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, Priority } from '../../types';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isEditing: boolean;
  inputValue: string;
  onSelect: (id: string | null) => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: string) => void;
  onInputChange: (val: string) => void;
  onFinishEdit: (task: Task) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showDetails?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task, isSelected, isEditing, inputValue, onSelect, onToggleStatus, onDelete, onInputChange, onFinishEdit, inputRef, showDetails = false
}) => {
  const { updateTask, addTask } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const isNote = task.category === 'note';
  const isMindmap = task.category === 'mindmap';
  const isDone = task.status === TaskStatus.DONE;
  const [isMindmapExpanded, setIsMindmapExpanded] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const toggleType = () => {
    updateTask({ ...task, category: isNote ? 'tasks' : 'note' });
    setShowMenu(false);
  };

  const togglePin = () => {
    updateTask({ ...task, isPinned: !task.isPinned });
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    addTask(task.title + " (копія)", task.category, task.projectId, task.projectSection, task.isEvent, task.scheduledDate);
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
    alert("Посилання скопійовано");
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.UI: return 'text-rose-500';
      case Priority.UNI: return 'text-orange-500';
      case Priority.NUI: return 'text-indigo-500';
      default: return 'text-slate-300';
    }
  };

  const MenuSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="py-1 border-b border-[var(--border-color)]/30 last:border-0">
      <div className="px-3 py-1 text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">{title}</div>
      {children}
    </div>
  );

  const MenuItem = ({ icon, label, onClick, danger = false }: { icon: string, label: string, onClick: () => void, danger?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[10px] font-bold transition-all hover:bg-black/5 ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-[var(--text-main)]'}`}
    >
      <i className={`fa-solid ${icon} w-3 text-center opacity-60 text-[9px]`}></i>
      <span className="truncate">{label}</span>
    </button>
  );

  // Опис може бути JSON (з DiaryEditor). Потрібно витягнути текст для прев'ю.
  const descriptionPreview = React.useMemo(() => {
    if (!task.content || task.content === '[]') return null;
    try {
      const blocks = JSON.parse(task.content);
      if (Array.isArray(blocks)) {
        return blocks.find(b => b.content && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '');
      }
    } catch (e) {
      return task.content.split('\n')[0];
    }
    return null;
  }, [task.content]);

  return (
    <>
      <Card
        padding="none"
        border={false}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => !isEditing && onSelect(task.id)}
        onContextMenu={handleContextMenu}
        className={`flex flex-col gap-0 px-3 py-1.5 hover:bg-black/5 transition-all cursor-pointer group relative ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}
      >
        <div className="flex items-center gap-3 w-full h-[26px]">
          <div className="w-4 h-4 flex items-center justify-center shrink-0 text-indigo-400 opacity-60">
            {isNote && (
              <i className="fa-solid fa-note-sticky text-[10px]"></i>
            )}
            {task.category === 'table' && (
              <i className="fa-solid fa-table text-[10px]"></i>
            )}
            {task.category === 'mindmap' && (
              <i className="fa-solid fa-diagram-project text-[10px]"></i>
            )}
            {!isNote && task.category !== 'table' && task.category !== 'mindmap' && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] group-hover:border-[var(--primary)]'
                  }`}
              >
                {isDone && <i className="fa-solid fa-check text-[8px]"></i>}
              </button>
            )}
          </div>

          {isEditing ? (
            <Input
              variant="ghost"
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              onBlur={() => onFinishEdit(task)}
              onKeyDown={e => e.key === 'Enter' && onFinishEdit(task)}
              onClick={e => e.stopPropagation()}
              placeholder="Назва..."
              className="flex-1 text-[13px] font-semibold h-full"
            />
          ) : (
            <div className="flex-1 min-w-0 flex items-center gap-2 mr-2">
              <i className={`fa-solid fa-flag text-[7px] shrink-0 ${getPriorityColor(task.priority)}`}></i>
              <span className={`text-[13px] font-semibold truncate transition-all ${isDone ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'} ${isNote ? 'italic text-indigo-900/70' : ''}`}>
                {task.title || "Без назви"}
              </span>
              {task.isPinned && <i className="fa-solid fa-thumbtack text-[8px] text-[var(--primary)] rotate-45 opacity-60"></i>}
              {task.showInCalendar && !isDone && (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0" title="В календарі">
                  <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 transition-all shrink-0">
            {isMindmap && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMindmapExpanded(!isMindmapExpanded); }}
                className={`w-6 h-6 rounded hover:bg-black/10 flex items-center justify-center transition-transform ${isMindmapExpanded ? 'rotate-90' : ''}`}
                title="Розгорнути структуру"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.right - 180, y: rect.bottom });
                setShowMenu(!showMenu);
              }}
              className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="fa-solid fa-ellipsis-vertical text-[10px]"></i>
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="pl-7 pr-2 pb-1 space-y-2 animate-in fade-in duration-300">
            {descriptionPreview && (
              <p className="text-[10px] text-slate-500 font-normal leading-tight line-clamp-2 italic">
                {descriptionPreview}
              </p>
            )}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="slate" className="text-[7px] py-0 px-1 bg-slate-100 border-none font-bold lowercase opacity-70">#{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {isMindmap && isMindmapExpanded && task.mindmapData && (
          <div className="pl-7 pr-2 pb-2 space-y-0.5 border-t border-[var(--border-color)]/20 pt-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {(() => {
              const nodes = task.mindmapData.nodes || [];
              const edges = task.mindmapData.edges || [];
              const targets = new Set(edges.map(e => e.targetId));
              const roots = nodes.filter(n => !targets.has(n.id) || n.id === 'root');

              const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
                e.stopPropagation();
                setExpandedNodes(prev => {
                  const next = new Set(prev);
                  if (next.has(nodeId)) next.delete(nodeId);
                  else next.add(nodeId);
                  return next;
                });
              };

              const updateMindmap = (newNodes: any[], newEdges: any[]) => {
                updateTask({
                  ...task,
                  mindmapData: { nodes: newNodes, edges: newEdges }
                });
              };

              const toggleNodeStatus = (nodeId: string) => {
                const newNodes = nodes.map(n => n.id === nodeId ? { ...n, completed: !n.completed } : n);
                updateMindmap(newNodes, edges);
              };

              const deleteNode = (nodeId: string) => {
                if (nodeId === 'root') return;
                const nodesToDelete = new Set([nodeId]);
                const findChildren = (pid: string) => {
                  edges.filter(e => e.sourceId === pid).forEach(e => {
                    nodesToDelete.add(e.targetId);
                    findChildren(e.targetId);
                  });
                };
                findChildren(nodeId);
                const newNodes = nodes.filter(n => !nodesToDelete.has(n.id));
                const newEdges = edges.filter(e => !nodesToDelete.has(e.sourceId) && !nodesToDelete.has(e.targetId));
                updateMindmap(newNodes, newEdges);
              };

              const addNewNode = (parentId: string, type: 'task' | 'note') => {
                const newNode = {
                  id: Math.random().toString(36).substr(2, 9),
                  text: type === 'task' ? 'Нове завдання' : 'Нова секція',
                  type,
                  completed: false,
                  x: 0, y: 0
                };
                const newEdge = { id: `e-${newNode.id}`, sourceId: parentId, targetId: newNode.id };
                updateMindmap([...nodes, newNode], [...edges, newEdge]);
              };

              const renderMindmapNode = (node: any, depth = 0) => {
                const children = edges
                  .filter(e => e.sourceId === node.id)
                  .map(e => nodes.find(n => n.id === e.targetId))
                  .filter(Boolean);

                const isExpanded = expandedNodes.has(node.id);

                return (
                  <div key={node.id} className="space-y-0" onClick={e => e.stopPropagation()}>
                    <div
                      className="flex items-center py-1 px-3 cursor-pointer group/m-node transition-all relative rounded-xl mx-0.5 h-7 hover:bg-black/5"
                      style={{ marginLeft: depth * 12 }}
                    >
                      <button
                        onClick={(e) => toggleExpand(node.id, e)}
                        className="w-4 flex items-center justify-center shrink-0 transition-transform duration-200"
                      >
                        {children.length > 0 ? (
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[7px] text-slate-400`}></i>
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-slate-300/30" />
                        )}
                      </button>

                      <div className="w-5 flex justify-center shrink-0 text-[var(--text-muted)] group-hover/m-node:text-[var(--primary)] transition-colors">
                        {node.type === 'task' ? (
                          <button
                            onClick={() => toggleNodeStatus(node.id)}
                            className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${node.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}
                          >
                            {node.completed && <i className="fa-solid fa-check text-[7px]"></i>}
                          </button>
                        ) : (
                          <i className="fa-solid fa-rectangle-list text-[11px] opacity-70"></i>
                        )}
                      </div>

                      <Input
                        variant="ghost"
                        value={node.text || ''}
                        onChange={(e) => {
                          const newNodes = nodes.map(n => n.id === node.id ? { ...n, text: e.target.value } : n);
                          updateMindmap(newNodes, edges);
                        }}
                        className={`text-[12px] font-normal tracking-tight flex-1 truncate ${node.completed ? 'line-through opacity-30 text-[var(--text-muted)]' : 'text-[var(--text-main)] opacity-90'}`}
                      />

                      <div className="flex items-center gap-1 opacity-0 group-hover/m-node:opacity-100 transition-opacity ml-1">
                        <button onClick={() => addNewNode(node.id, 'task')} className="w-6 h-6 rounded-lg hover:bg-emerald-50 text-emerald-500/50 hover:text-emerald-600 flex items-center justify-center transition-all">
                          <i className="fa-solid fa-plus text-[9px]"></i>
                        </button>
                        {node.id !== 'root' && (
                          <button onClick={() => deleteNode(node.id)} className="w-6 h-6 rounded-lg hover:bg-rose-50 text-rose-500/50 hover:text-rose-600 flex items-center justify-center transition-all">
                            <i className="fa-solid fa-trash-can text-[9px]"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    {isExpanded && children.map(child => renderMindmapNode(child, depth + 1))}
                  </div>
                );
              };

              return roots.length > 0 ? (
                <div className="space-y-0 pb-1">
                  {roots.map(root => renderMindmapNode(root))}
                  <button
                    onClick={() => addNewNode('root', 'task')}
                    className="flex items-center gap-1.5 py-0.5 px-2 mt-1 rounded-lg text-slate-400/60 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all text-[8px] font-bold"
                  >
                    <i className="fa-solid fa-plus text-[7px]"></i> Додати квест...
                  </button>
                </div>
              ) : (
                <div className="py-1 text-center">
                  <button onClick={() => updateMindmap([{ id: 'root', text: 'Центральна тема', type: 'note', x: 0, y: 0 }], [])} className="text-[7px] font-black text-primary uppercase tracking-widest border border-dashed border-primary/20 px-2 py-0.5 rounded-md hover:bg-primary/5">Створити структуру</button>
                </div>
              );
            })()}
          </div>
        )}
      </Card>

      {showMenu && (
        <div
          ref={menuRef}
          className="fixed w-48 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-xl py-1 z-[1000] tiktok-blur animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: Math.min(menuPos.y, window.innerHeight - 250),
            left: Math.min(menuPos.x, window.innerWidth - 200)
          }}
          onClick={e => e.stopPropagation()}
        >
          <MenuSection title="Дії">
            <MenuItem
              icon={isNote ? "fa-bolt" : "fa-note-sticky"}
              label={isNote ? "Зробити завданням" : "Зробити нотаткою"}
              onClick={toggleType}
            />
            <MenuItem
              icon="fa-thumbtack"
              label={task.isPinned ? "Відкріпити" : "Закріпити"}
              onClick={togglePin}
            />
          </MenuSection>

          <MenuSection title="Організація">
            <MenuItem icon="fa-copy" label="Дублювати" onClick={handleDuplicate} />
            <MenuItem icon="fa-link" label="Копіювати посилання" onClick={handleCopyLink} />
          </MenuSection>

          <MenuSection title="Небезпечна зона">
            <MenuItem
              icon="fa-trash-can"
              label="Видалити"
              danger
              onClick={() => { onDelete(task.id); setShowMenu(false); }}
            />
          </MenuSection>
        </div>
      )}
    </>
  );
};

export default TaskItem;
