
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, Priority } from '../../types';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

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
  const isDone = task.status === TaskStatus.DONE;

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
    switch(p) {
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
    } catch(e) {
      return task.content.split('\n')[0];
    }
    return null;
  }, [task.content]);

  return (
    <>
      <Card
        padding="none"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => !isEditing && onSelect(task.id)}
        onContextMenu={handleContextMenu}
        className={`flex flex-col gap-0 px-3 py-1.5 hover:border-[var(--primary)]/30 transition-all cursor-pointer border rounded group bg-[var(--bg-card)] ${
          isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-inner' : 'border-[var(--border-color)]'
        }`}
      >
        <div className="flex items-center gap-3 w-full h-[26px]">
          {isNote ? (
            <div className="w-4 h-4 flex items-center justify-center shrink-0 text-indigo-400 opacity-60">
               <i className="fa-solid fa-note-sticky text-[10px]"></i>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] group-hover:border-[var(--primary)]'
              }`}
            >
              {isDone && <i className="fa-solid fa-check text-[8px]"></i>}
            </button>
          )}

          {isEditing ? (
            <input ref={inputRef} autoFocus value={inputValue} onChange={e => onInputChange(e.target.value)} onBlur={() => onFinishEdit(task)} onKeyDown={e => e.key === 'Enter' && onFinishEdit(task)} onClick={e => e.stopPropagation()} placeholder="Назва..." className="flex-1 bg-transparent border-none p-0 text-[12px] font-bold focus:ring-0 outline-none text-[var(--text-main)] h-full" />
          ) : (
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <i className={`fa-solid fa-flag text-[7px] shrink-0 ${getPriorityColor(task.priority)}`}></i>
              <span className={`text-[12px] font-bold truncate transition-all ${isDone ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'} ${isNote ? 'italic text-indigo-900/70' : ''}`}>
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

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.right - 180, y: rect.bottom });
                setShowMenu(!showMenu); 
              }} 
              className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)]"
            >
              <i className="fa-solid fa-ellipsis-vertical text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* DETAILS SECTION */}
        {showDetails && (
           <div className="pl-7 pr-2 pb-1 space-y-2 animate-in fade-in duration-300">
              {descriptionPreview && (
                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2 italic">
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
