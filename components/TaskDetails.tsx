import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, TaskStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import HashtagAutocomplete from './HashtagAutocomplete';
import DiaryEditor from './DiaryEditor';
import Badge from './ui/Badge';
import TaskDatePicker from './TaskDatePicker';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { updateTask, toggleTaskStatus, deleteTask, addTask, people = [], projects = [] } = useApp();

  const isNote = task.category === 'note';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [localTitle, setLocalTitle] = useState(task.title);

  const menuRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.id, task.title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowActionsMenu(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setShowPriorityMenu(false);
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) setShowTagPopover(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyUpdates = (updates: Partial<Task>) => {
    updateTask({ ...task, ...updates });
  };

  const addNewTag = (name: string, personId?: string) => {
    const cleanName = name.trim().replace(/^#/, '');
    if (cleanName && !task.tags.includes(cleanName)) {
      const updates: any = { tags: [...task.tags, cleanName] };
      if (personId) updates.personId = personId;
      updateTask({ ...task, ...updates });
    }
    setNewTagInput('');
    setShowTagPopover(false);
  };

  const removeTag = (tagToRemove: string) => {
    const isPerson = people.some(p => p.name.trim().replace(/\s+/g, '_') === tagToRemove);
    const updates: any = { tags: task.tags.filter(t => t !== tagToRemove) };
    if (isPerson) updates.personId = undefined;
    updateTask({ ...task, ...updates });
  };

  const isDone = task.status === TaskStatus.DONE;

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.UI: return 'text-rose-500';
      case Priority.UNI: return 'text-orange-500';
      case Priority.NUI: return 'text-indigo-500';
      default: return 'text-slate-400';
    }
  };

  const toggleType = () => {
    updateTask({ ...task, category: isNote ? 'tasks' : 'note' });
    setShowActionsMenu(false);
  };

  const handleDuplicate = () => {
    addTask(task.title + " (копія)", task.category, task.projectId, task.projectSection, task.isEvent, task.scheduledDate);
    setShowActionsMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
    navigator.clipboard.writeText(url);
    setShowActionsMenu(false);
    alert("Посилання скопійовано");
  };

  const formattedDate = task.scheduledDate
    ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
    : 'Дата';

  const MenuSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="py-1 border-b border-[var(--border-color)] last:border-0">
      <div className="px-3 py-1 text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">{title}</div>
      {children}
    </div>
  );

  const MenuItem = ({ icon, label, onClick, danger = false }: { icon: string, label: string, onClick: () => void, danger?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 text-[10px] font-bold transition-all hover:bg-black/5 ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-[var(--text-main)]'}`}
    >
      <i className={`fa-solid ${icon} w-4 text-center opacity-60 text-[10px]`}></i>
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col h-full bg-[var(--bg-card)] relative text-[var(--text-main)] border-none overflow-hidden">
      <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border-color)] bg-transparent shrink-0 z-[100]">
        <div className="flex items-center gap-2 flex-1">
          {!isNote && (
            <button
              onClick={() => toggleTaskStatus(task)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-emerald-400'}`}
            >
              {isDone && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 text-[11px] font-bold transition-all ${task.scheduledDate ? 'text-indigo-600' : 'text-[var(--text-muted)]'}`}
            >
              <i className="fa-regular fa-calendar text-[12px]"></i>
              <span>{formattedDate}</span>
              {task.recurrence !== 'none' && <i className="fa-solid fa-arrows-rotate text-[8px] opacity-40 ml-1"></i>}
            </button>

            {showDatePicker && (
              <TaskDatePicker
                task={task}
                onUpdate={handleApplyUpdates}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>

          <button
            onClick={() => updateTask({ ...task, showInCalendar: !task.showInCalendar })}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${task.showInCalendar ? 'text-indigo-600 bg-indigo-50/50' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            title={task.showInCalendar ? "Відображається в календарі" : "Приховано з календаря"}
          >
            <i className={`fa-solid ${task.showInCalendar ? 'fa-calendar-check' : 'fa-calendar-minus'} text-[13px]`}></i>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative" ref={priorityRef}>
            <button onClick={() => setShowPriorityMenu(!showPriorityMenu)} className={`w-8 h-8 rounded flex items-center justify-center hover:bg-black/5 transition-all ${getPriorityColor(task.priority)}`}>
              <i className="fa-solid fa-flag text-[13px]"></i>
            </button>
            {showPriorityMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-card)] shadow-xl border border-[var(--border-color)] rounded-xl z-[120] py-1 tiktok-blur animate-in zoom-in-95">
                {[
                  { p: Priority.UI, label: 'Найвищий', color: 'text-rose-500' },
                  { p: Priority.UNI, label: 'Високий', color: 'text-orange-500' },
                  { p: Priority.NUI, label: 'Звичайний', color: 'text-indigo-500' },
                  { p: Priority.NUNI, label: 'Низький', color: 'text-slate-400' },
                ].map(opt => (
                  <button key={opt.p} onClick={() => { updateTask({ ...task, priority: opt.p }); setShowPriorityMenu(false); }} className={`w-full text-left px-3 py-1.5 text-[11px] font-bold hover:bg-black/5 flex items-center gap-2 ${task.priority === opt.p ? 'bg-black/5' : ''}`}>
                    <i className={`fa-solid ${opt.color}`}></i> {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowActionsMenu(!showActionsMenu)} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${showActionsMenu ? 'bg-black/10 text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-black/5'}`}>
              <i className="fa-solid fa-ellipsis"></i>
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--bg-card)] shadow-xl border border-[var(--border-color)] rounded-xl z-[120] py-1 tiktok-blur animate-in zoom-in-95">
                <MenuSection title="Дії">
                  <MenuItem icon={isNote ? "fa-bolt" : "fa-note-sticky"} label={isNote ? "Зробити завданням" : "Зробити нотаткою"} onClick={toggleType} />
                  <MenuItem icon="fa-thumbtack" label={task.isPinned ? "Відкріпити" : "Закріпити"} onClick={() => { updateTask({ ...task, isPinned: !task.isPinned }); setShowActionsMenu(false); }} />
                </MenuSection>
                <MenuSection title="Організація">
                  <MenuItem icon="fa-copy" label="Дублювати" onClick={handleDuplicate} />
                  <MenuItem icon="fa-link" label="Копіювати посилання" onClick={handleCopyLink} />
                </MenuSection>
                <MenuSection title="Небезпечна зона">
                  <MenuItem icon="fa-trash-can" label="Видалити" danger onClick={() => { if (confirm('Видалити?')) { deleteTask(task.id); onClose(); } }} />
                </MenuSection>
              </div>
            )}
          </div>

          <button
            onClick={() => updateTask({ ...task, title: localTitle })}
            className="w-8 h-8 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all"
            title="Зберегти"
          >
            <i className="fa-solid fa-floppy-disk text-[13px]"></i>
          </button>

          <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center hover:bg-rose text-[var(--text-muted)] hover:text-rose-500 transition-all"><i className="fa-solid fa-xmark"></i></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <div className="p-2 md:p-2 pb-2 shrink-0 border-b border-[var(--border-color)]/30 mx-2">
          <textarea
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => updateTask({ ...task, title: localTitle })}
            rows={1}
            className={`w-full bg-transparent text-[22px] font-black border-none focus:ring-0 p-0 placeholder:text-[var(--text-muted)] placeholder:opacity-20 resize-none leading-tight outline-none shadow-none ${isDone ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'} overflow-hidden h-auto transition-all`}
            placeholder={isNote ? "Текст нотатки..." : "Текст завдання..."}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <DiaryEditor
            id={task.id}
            date={new Date(task.createdAt).toISOString().split('T')[0]}
            onClose={() => { }}
            standaloneMode={true}
            initialContent={task.content}
            onContentChange={(newContent) => updateTask({ ...task, content: newContent })}
          />
        </div>
      </div>

      <footer className="shrink-0 p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--bg-input)] rounded-lg px-2 py-1 border border-[var(--border-color)]">
            <i className="fa-solid fa-layer-group text-[10px] text-[var(--text-muted)]"></i>
            <select
              value={task.projectId || ''}
              onChange={(e) => updateTask({ ...task, projectId: e.target.value || undefined, projectSection: undefined })}
              className="bg-transparent text-[10px] font-black uppercase tracking-tight border-none focus:ring-0 p-0 h-auto min-h-0 appearance-none pr-4 cursor-pointer max-w-[120px]"
            >
              <option value="">Без списку</option>
              {projects.filter(p => (p.type === 'folder' || p.type === 'list' || !p.type) && p.description !== 'SYSTEM_PLANNER_CONFIG').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {task.projectId && projects.find(p => p.id === task.projectId)?.sections && projects.find(p => p.id === task.projectId)!.sections!.length > 0 && (
            <div className="flex items-center gap-2 bg-[var(--bg-input)] rounded-lg px-2 py-1.5 border border-[var(--border-color)]">
              <i className="fa-solid fa-layer-group text-[10px] text-[var(--text-muted)]"></i>
              <select
                value={task.projectSection || ''}
                onChange={(e) => updateTask({ ...task, projectSection: e.target.value as any })}
                className="bg-transparent text-[10px] font-black uppercase tracking-tight border-none focus:ring-0 p-0 h-auto min-h-0 appearance-none pr-4 cursor-pointer"
              >
                <option value="">Головна</option>
                {projects.find(p => p.id === task.projectId)?.sections?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 items-center flex-1">
            {task.tags.map(t => {
              const isPerson = people.some(p => p.name.trim().replace(/\s+/g, '_') === t);
              return (
                <Badge key={t} variant={isPerson ? "orange" : "slate"} className="text-[8px] font-bold bg-[var(--bg-input)] border-none px-2 py-0.5 rounded group/tag lowercase text-[var(--text-main)]">
                  {isPerson && <i className="fa-solid fa-user-ninja mr-1 opacity-50"></i>}
                  #{t}
                  <button onClick={() => removeTag(t)} className="ml-1 opacity-40 hover:opacity-100 transition-opacity text-rose-400"><i className="fa-solid fa-xmark"></i></button>
                </Badge>
              );
            })}

            <div className="relative" ref={tagRef}>
              <button onClick={() => setShowTagPopover(!showTagPopover)} className="w-6 h-6 rounded-lg bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
              {showTagPopover && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-xl p-2 z-[200] tiktok-blur animate-in slide-in-from-bottom-2 duration-200">
                  <HashtagAutocomplete mode="tags" value={newTagInput} onChange={setNewTagInput} onSelectTag={addNewTag} placeholder="Додати тег..." className="w-full text-[11px] p-2 border-none focus:ring-0 bg-[var(--bg-input)] rounded-lg text-[var(--text-main)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TaskDetails;