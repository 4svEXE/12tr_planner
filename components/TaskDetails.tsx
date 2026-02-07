
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, TaskStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import HashtagAutocomplete from './HashtagAutocomplete';
import Typography from './ui/Typography';
import Button from './ui/Button';
import DiaryEditor from './DiaryEditor';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { 
    updateTask, projects, people, addTask,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    toggleTaskStatus, deleteTask
  } = useApp();
  
  const isNote = task.category === 'note';
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>(isNote ? 'notes' : 'notes');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [localTitle, setLocalTitle] = useState(task.title);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.id, task.title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyDate = (timestamp?: number) => {
    updateTask({ ...task, scheduledDate: timestamp });
    setShowDatePicker(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    addChecklistItem(task.id, newChecklistItem.trim());
    setNewChecklistItem('');
  };

  const handleDuplicate = () => {
    addTask(task.title + " (копія)", task.category, task.projectId, task.projectSection, task.isEvent, task.scheduledDate);
    setShowActionsMenu(false);
    alert("Копію створено у вхідних");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`;
    navigator.clipboard.writeText(url);
    alert("Посилання скопійовано");
  };

  const removeTag = (tagToRemove: string) => {
    updateTask({ ...task, tags: task.tags.filter(t => t !== tagToRemove) });
  };

  const isDone = task.status === TaskStatus.DONE;

  const MenuSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="py-2 border-b border-[var(--border-color)] last:border-0">
      <div className="px-4 py-1.5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] opacity-50">{title}</div>
      {children}
    </div>
  );

  const MenuItem = ({ icon, label, onClick, danger = false }: { icon: string, label: string, onClick: () => void, danger?: boolean }) => (
    <button 
      onClick={() => { onClick(); setShowActionsMenu(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all hover:bg-black/5 ${danger ? 'text-rose-500 hover:bg-rose-500/10' : 'text-[var(--text-main)] font-medium'}`}
    >
      <i className={`fa-solid ${icon} w-4 text-center opacity-60 text-xs`}></i>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col h-full bg-[var(--bg-card)] relative text-[var(--text-main)]">
      {/* TASK HEADER PANEL */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-card)] sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1 min-w-0">
            {isNote ? (
              <div className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)] opacity-50">
                <i className="fa-solid fa-note-sticky text-sm"></i>
              </div>
            ) : (
              <button 
                onClick={() => toggleTaskStatus(task)} 
                className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]'}`}
              >
                {isDone && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
            )}

            {!isNote && (
              <div className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)} 
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${task.scheduledDate ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                >
                  <i className="fa-regular fa-calendar text-[15px]"></i>
                  <span className="truncate">{task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Дата та нагадування'}</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--bg-card)] shadow-2xl rounded-[1.5rem] border border-[var(--border-color)] z-[100] p-5 tiktok-blur">
                    <input type="datetime-local" className="w-full bg-[var(--bg-main)] text-[var(--text-main)] p-4 rounded-2xl border-none outline-none" onChange={(e) => handleApplyDate(new Date(e.target.value).getTime())} />
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={() => handleApplyDate(Date.now())} className="py-2.5 text-[10px] font-black uppercase bg-black/5 text-[var(--text-main)] rounded-xl">Сьогодні</button>
                      <button onClick={() => handleApplyDate(undefined)} className="py-2.5 text-[10px] font-black uppercase text-rose-500 rounded-xl hover:bg-rose-500/10">Очистити</button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="flex items-center gap-1">
          {!isNote && (
            <button 
              title={task.isEvent ? "Зробити завданням" : "Зробити подією"} 
              onClick={() => updateTask({...task, isEvent: !task.isEvent})}
              className={`w-9 h-9 rounded-xl transition-all ${task.isEvent ? 'text-pink-500 bg-pink-500/10' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
            >
              <i className={`fa-solid ${task.isEvent ? 'fa-calendar-star' : 'fa-flag'} text-xs`}></i>
            </button>
          )}
          
          <button title="Теги" className="w-9 h-9 rounded-xl text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"><i className="fa-solid fa-tag text-xs"></i></button>
          
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowActionsMenu(!showActionsMenu)} className={`w-9 h-9 rounded-xl transition-all ${showActionsMenu ? 'bg-black/10 text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-black/5'}`}>
              <i className="fa-solid fa-ellipsis"></i>
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-card)] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-[var(--border-color)] rounded-[1.5rem] z-[100] overflow-hidden tiktok-blur">
                <MenuSection title="Робота зі структурою">
                  {!isNote && <MenuItem icon="fa-plus" label="Додати підзавдання" onClick={() => setActiveTab('checklist')} />}
                  <MenuItem icon="fa-link" label="Пов’язати батьківське" onClick={() => {}} />
                  <MenuItem icon="fa-thumbtack" label={task.isPinned ? "Відкріпити" : "Закріпити"} onClick={() => updateTask({...task, isPinned: !task.isPinned})} />
                </MenuSection>
                <MenuSection title="Управління статусом">
                  <MenuItem icon="fa-ban" label="Не зроблю" onClick={() => updateTask({...task, isDeleted: true})} />
                  <MenuItem icon="fa-tags" label="Мітки" onClick={() => {}} />
                </MenuSection>
                <MenuSection title="Експорт та копіювання">
                  <MenuItem icon="fa-paperclip" label="Завантажити додаток" onClick={() => {}} />
                  <MenuItem icon="fa-copy" label="Створити копію" onClick={handleDuplicate} />
                  <MenuItem icon="fa-share-nodes" label="Копіювати посилання" onClick={handleCopyLink} />
                </MenuSection>
                <MenuSection title="Перегляд та формат">
                  <MenuItem icon="fa-clock-rotate-left" label="Активність в завданні" onClick={() => {}} />
                  <MenuItem icon="fa-floppy-disk" label="Збережено як шаблон" onClick={() => {}} />
                  {!isNote && <MenuItem icon="fa-file-lines" label="Конвертувати в нотатку" onClick={() => updateTask({...task, category: 'note'})} />}
                  <MenuItem icon="fa-print" label="Друк" onClick={() => window.print()} />
                </MenuSection>
                <div className="p-1 bg-rose-500/5 border-t border-[var(--border-color)]">
                  <MenuItem icon="fa-trash-can" label="Видалити" danger onClick={() => { if(confirm('Видалити?')) { deleteTask(task.id); onClose(); } }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-[var(--border-color)] mx-2"></div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-card)]">
        <div className={`${isNote ? 'p-4 md:p-6' : 'p-6 md:p-10'} max-w-2xl mx-auto space-y-8`}>
          {/* TITLE */}
          <div className="space-y-4">
            <textarea 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)} 
              onBlur={() => updateTask({...task, title: localTitle})} 
              rows={1}
              className={`w-full bg-transparent text-3xl font-black border-none focus:ring-0 p-0 placeholder:text-[var(--text-muted)] placeholder:opacity-20 resize-none leading-[1.1] outline-none ${isDone ? 'line-through opacity-30' : 'text-[var(--text-main)]'}`} 
              placeholder={isNote ? "Заголовок нотатки..." : "Назва завдання..."}
            />
            
            {!isNote && (
              <div className="flex items-center gap-3 flex-wrap">
                 <div className="flex items-center gap-2">
                    <i className="fa-solid fa-folder-open text-[10px] text-[var(--text-muted)] opacity-50"></i>
                    <select 
                      value={task.projectId || ''} 
                      onChange={e => updateTask({...task, projectId: e.target.value || undefined})}
                      className="bg-transparent border-none text-[11px] font-black uppercase text-[var(--primary)] p-0 focus:ring-0 cursor-pointer hover:underline appearance-none"
                    >
                      <option value="">Без папки</option>
                      {projects.map(p => <option key={p.id} value={p.id} className="bg-[var(--bg-card)]">{p.name}</option>)}
                    </select>
                 </div>
                 
                 {task.tags.map(tag => (
                   <div key={tag} className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg border border-[var(--border-color)]">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">#{tag}</span>
                      <button onClick={() => removeTag(tag)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                   </div>
                 ))}
                 
                 <div className="flex-1 min-w-[120px]">
                    <HashtagAutocomplete 
                      value={newTagInput}
                      onChange={setNewTagInput}
                      placeholder="Додати тег..."
                      onSelectTag={(name) => { if (!task.tags.includes(name)) updateTask({...task, tags: [...task.tags, name]}); setNewTagInput(''); }}
                      className="text-[11px] font-black uppercase text-[var(--text-muted)] opacity-50 w-full"
                    />
                 </div>
              </div>
            )}
          </div>

          {/* TABS (ONLY FOR TASKS) */}
          {!isNote && (
            <div className="flex gap-10 border-b border-[var(--border-color)]">
              <button onClick={() => setActiveTab('notes')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'notes' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] opacity-50 hover:opacity-100'}`}>Опис</button>
              <button onClick={() => setActiveTab('checklist')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'checklist' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] opacity-50 hover:opacity-100'}`}>Чек-лист ({(task.checklist || []).length})</button>
            </div>
          )}

          <div className={`${isNote ? 'min-h-[200px]' : 'min-h-[400px]'}`}>
            {activeTab === 'checklist' && !isNote ? (
              <div className="space-y-4">
                <form onSubmit={handleAddSubtask} className="flex gap-3 bg-black/5 p-2 rounded-xl focus-within:bg-black/10 transition-all">
                   <div className="w-5 h-5 rounded-[6px] border-2 border-[var(--border-color)] shrink-0 mt-0.5 flex items-center justify-center text-[var(--text-muted)]"><i className="fa-solid fa-plus text-[10px]"></i></div>
                   <input 
                    value={newChecklistItem} 
                    onChange={e => setNewChecklistItem(e.target.value)} 
                    placeholder="Додати підзавдання..." 
                    className="flex-1 bg-transparent border-none text-[13px] font-medium outline-none focus:ring-0 placeholder:text-[var(--text-muted)] placeholder:opacity-30" 
                  />
                </form>
                <div className="space-y-px">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 px-2 py-1.5 group/item hover:bg-black/5 rounded-lg transition-all">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4 h-4 rounded-[6px] border-2 flex items-center justify-center transition-all shrink-0 ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]'}`}>
                          {item.completed && <i className="fa-solid fa-check text-[8px]"></i>}
                        </button>
                        <span className={`text-[13px] font-medium flex-1 truncate ${item.completed ? 'text-[var(--text-muted)] opacity-40 line-through' : 'text-[var(--text-main)]'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-[var(--text-muted)] hover:text-rose-500 p-1"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="h-full">
                <DiaryEditor 
                  id={task.id} 
                  date={new Date(task.createdAt).toISOString().split('T')[0]} 
                  onClose={() => {}} 
                  standaloneMode={true} 
                  initialContent={task.content}
                  onContentChange={(newContent) => updateTask({...task, content: newContent})}
                />
              </div>
            )}
          </div>

          {/* PROJECT & TAGS FOR NOTES (MOVED TO BOTTOM) */}
          {isNote && (
            <div className="pt-8 border-t border-[var(--border-color)] mt-8 space-y-4">
               <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-[var(--bg-main)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                    <i className="fa-solid fa-folder-open text-[10px] text-[var(--text-muted)] opacity-50"></i>
                    <select 
                      value={task.projectId || ''} 
                      onChange={e => updateTask({...task, projectId: e.target.value || undefined})}
                      className="bg-transparent border-none text-[10px] font-black uppercase text-[var(--primary)] p-0 focus:ring-0 cursor-pointer hover:underline appearance-none"
                    >
                      <option value="">Без папки</option>
                      {projects.map(p => <option key={p.id} value={p.id} className="bg-[var(--bg-card)]">{p.name}</option>)}
                    </select>
                  </div>
                  
                  {task.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg border border-[var(--border-color)]">
                       <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">#{tag}</span>
                       <button onClick={() => removeTag(tag)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                    </div>
                  ))}
                  
                  <div className="flex-1 min-w-[120px]">
                     <HashtagAutocomplete 
                       value={newTagInput}
                       onChange={setNewTagInput}
                       placeholder="# додати тег..."
                       onSelectTag={(name) => { if (!task.tags.includes(name)) updateTask({...task, tags: [...task.tags, name]}); setNewTagInput(''); }}
                       className="text-[11px] font-black uppercase text-[var(--text-muted)] opacity-50 w-full"
                     />
                  </div>
               </div>
               <div className="text-[8px] font-black uppercase text-[var(--text-muted)] opacity-30 tracking-widest text-right">
                 Створено: {new Date(task.createdAt).toLocaleString('uk-UA')}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
