
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
  
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>('notes');
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

  const MenuSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="py-2 border-b border-slate-50 last:border-0">
      <div className="px-4 py-1.5 text-[9px] font-black text-slate-300 uppercase tracking-[0.15em]">{title}</div>
      {children}
    </div>
  );

  const MenuItem = ({ icon, label, onClick, danger = false }: { icon: string, label: string, onClick: () => void, danger?: boolean }) => (
    <button 
      onClick={() => { onClick(); setShowActionsMenu(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all hover:bg-slate-50 ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 font-medium'}`}
    >
      <i className={`fa-solid ${icon} w-4 text-center opacity-60 text-xs`}></i>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col h-full bg-white relative">
      {/* TASK HEADER PANEL */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4 flex-1 min-w-0">
            {task.category !== 'note' && (
              <button 
                onClick={() => toggleTaskStatus(task)} 
                className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-200 bg-white hover:border-blue-400'}`}
              >
                {isDone && <i className="fa-solid fa-check text-[10px]"></i>}
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)} 
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${task.scheduledDate ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <i className="fa-regular fa-calendar text-[15px]"></i>
                <span className="truncate">{task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Дата та нагадування'}</span>
              </button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white shadow-2xl rounded-[1.5rem] border border-slate-100 z-[100] p-5">
                  <input type="datetime-local" className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none" onChange={(e) => handleApplyDate(new Date(e.target.value).getTime())} />
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => handleApplyDate(Date.now())} className="py-2.5 text-[10px] font-black uppercase bg-slate-50 text-slate-600 rounded-xl">Сьогодні</button>
                    <button onClick={() => handleApplyDate(undefined)} className="py-2.5 text-[10px] font-black uppercase text-rose-500 rounded-xl">Очистити</button>
                  </div>
                </div>
              )}
            </div>
        </div>

        <div className="flex items-center gap-1">
          {task.category !== 'note' && (
            <button 
              title={task.isEvent ? "Зробити завданням" : "Зробити подією"} 
              onClick={() => updateTask({...task, isEvent: !task.isEvent})}
              className={`w-9 h-9 rounded-xl transition-all ${task.isEvent ? 'text-pink-500 bg-pink-50' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <i className={`fa-solid ${task.isEvent ? 'fa-calendar-star' : 'fa-flag'} text-xs`}></i>
            </button>
          )}
          
          <button title="Теги" className="w-9 h-9 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"><i className="fa-solid fa-tag text-xs"></i></button>
          
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowActionsMenu(!showActionsMenu)} className={`w-9 h-9 rounded-xl transition-all ${showActionsMenu ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <i className="fa-solid fa-ellipsis"></i>
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-100 rounded-[1.5rem] z-[100] overflow-hidden">
                <MenuSection title="Робота зі структурою">
                  <MenuItem icon="fa-plus" label="Додати підзавдання" onClick={() => setActiveTab('checklist')} />
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
                  <MenuItem icon="fa-file-lines" label="Конвертувати в нотатку" onClick={() => updateTask({...task, category: 'note'})} />
                  <MenuItem icon="fa-print" label="Друк" onClick={() => window.print()} />
                </MenuSection>
                <div className="p-1 bg-rose-50/30 border-t border-slate-50">
                  <MenuItem icon="fa-trash-can" label="Видалити" danger onClick={() => { if(confirm('Видалити?')) { deleteTask(task.id); onClose(); } }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-slate-100 mx-2"></div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
          {/* TITLE & PROJECT SELECTION */}
          <div className="space-y-4">
            <textarea 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)} 
              onBlur={() => updateTask({...task, title: localTitle})} 
              rows={1}
              className={`w-full bg-transparent text-3xl font-black border-none focus:ring-0 p-0 placeholder:text-slate-100 resize-none leading-[1.1] outline-none ${isDone ? 'line-through text-slate-200' : 'text-slate-900'}`} 
              placeholder="Назва завдання..."
            />
            
            <div className="flex items-center gap-3 flex-wrap">
               <div className="flex items-center gap-2">
                  <i className="fa-solid fa-folder-open text-[10px] text-slate-300"></i>
                  <select 
                    value={task.projectId || ''} 
                    onChange={e => updateTask({...task, projectId: e.target.value || undefined})}
                    className="bg-transparent border-none text-[11px] font-black uppercase text-blue-500 p-0 focus:ring-0 cursor-pointer hover:underline"
                  >
                    <option value="">Без папки</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               
               {task.tags.map(tag => (
                 <div key={tag} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">#{tag}</span>
                    <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                 </div>
               ))}
               
               <div className="flex-1 min-w-[120px]">
                  <HashtagAutocomplete 
                    value={newTagInput}
                    onChange={setNewTagInput}
                    placeholder="Додати тег..."
                    onSelectTag={(name) => { if (!task.tags.includes(name)) updateTask({...task, tags: [...task.tags, name]}); setNewTagInput(''); }}
                    className="text-[11px] font-black uppercase text-slate-300 w-full"
                  />
               </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-10 border-b border-slate-50">
            <button onClick={() => setActiveTab('notes')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'notes' ? 'border-blue-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-50'}`}>Опис</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'checklist' ? 'border-blue-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-50'}`}>Чек-лист ({(task.checklist || []).length})</button>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'checklist' ? (
              <div className="space-y-4">
                <form onSubmit={handleAddSubtask} className="flex gap-3 bg-slate-50/50 p-2 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                   <div className="w-5 h-5 rounded-[6px] border-2 border-slate-100 shrink-0 mt-0.5 flex items-center justify-center text-slate-100"><i className="fa-solid fa-plus text-[10px]"></i></div>
                   <input 
                    value={newChecklistItem} 
                    onChange={e => setNewChecklistItem(e.target.value)} 
                    placeholder="Додати підзавдання..." 
                    className="flex-1 bg-transparent border-none text-[13px] font-medium outline-none focus:ring-0 placeholder:text-slate-200" 
                  />
                </form>
                <div className="space-y-px">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 px-2 py-1.5 group/item hover:bg-slate-50 rounded-lg transition-all">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4 h-4 rounded-[6px] border-2 flex items-center justify-center transition-all shrink-0 ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-200 bg-white hover:border-blue-400'}`}>
                          {item.completed && <i className="fa-solid fa-check text-[8px]"></i>}
                        </button>
                        <span className={`text-[13px] font-medium flex-1 truncate ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-slate-200 hover:text-rose-500 p-1"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
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
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
