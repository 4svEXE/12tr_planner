
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
  const { updateTask, toggleTaskStatus, deleteTask } = useApp();
  
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
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.id, task.title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowActionsMenu(false);
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) setShowPriorityMenu(false);
      if (tagRef.current && !tagRef.current.contains(event.target as Node)) setShowTagPopover(false);
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyUpdates = (updates: Partial<Task>) => {
    updateTask({ ...task, ...updates });
  };

  const addNewTag = (name: string) => {
    const cleanName = name.trim().replace(/^#/, '');
    if (cleanName && !task.tags.includes(cleanName)) {
      updateTask({ ...task, tags: [...task.tags, cleanName] });
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    updateTask({ ...task, tags: task.tags.filter(t => t !== tagToRemove) });
  };

  const isDone = task.status === TaskStatus.DONE;

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.UI: return 'text-rose-500';
      case Priority.UNI: return 'text-orange-500';
      case Priority.NUI: return 'text-indigo-500';
      default: return 'text-slate-400';
    }
  };

  const formattedDate = task.scheduledDate 
    ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
    : 'Дата';

  return (
    <div className="w-full flex flex-col h-full bg-white relative text-[var(--text-main)] border-none">
      <header className="flex items-center justify-between px-4 h-12 border-b border-slate-100 bg-transparent shrink-0 z-[100]">
        <div className="flex items-center gap-2 flex-1">
          {!isNote && (
            <button 
              onClick={() => toggleTaskStatus(task)} 
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400'}`}
            >
              {isDone && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
          )}

          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)} 
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 text-[11px] font-bold transition-all ${task.scheduledDate ? 'text-indigo-600' : 'text-slate-400'}`}
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
        </div>

        <div className="flex items-center gap-1">
          <div className="relative" ref={priorityRef}>
            <button onClick={() => setShowPriorityMenu(!showPriorityMenu)} className={`w-8 h-8 rounded flex items-center justify-center hover:bg-black/5 transition-all ${getPriorityColor(task.priority)}`}>
              <i className="fa-solid fa-flag text-[13px]"></i>
            </button>
            {showPriorityMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white shadow-xl border border-slate-200 rounded-xl z-[120] py-1 tiktok-blur animate-in zoom-in-95">
                {[
                  { p: Priority.UI, label: 'Найвищий', color: 'text-rose-500' },
                  { p: Priority.UNI, label: 'Високий', color: 'text-orange-500' },
                  { p: Priority.NUI, label: 'Звичайний', color: 'text-indigo-500' },
                  { p: Priority.NUNI, label: 'Низький', color: 'text-slate-400' },
                ].map(opt => (
                  <button key={opt.p} onClick={() => { updateTask({...task, priority: opt.p}); setShowPriorityMenu(false); }} className={`w-full text-left px-3 py-1.5 text-[11px] font-bold hover:bg-slate-50 flex items-center gap-2 ${task.priority === opt.p ? 'bg-slate-50' : ''}`}>
                    <i className={`fa-solid fa-flag ${opt.color}`}></i> {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowActionsMenu(!showActionsMenu)} className="w-8 h-8 rounded flex items-center justify-center hover:bg-black/5 text-slate-400">
              <i className="fa-solid fa-ellipsis"></i>
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-xl border border-slate-200 rounded-xl z-[120] py-1 tiktok-blur">
                <button onClick={() => { updateTask({...task, isPinned: !task.isPinned}); setShowActionsMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-slate-50 flex items-center gap-2">
                   <i className="fa-solid fa-thumbtack w-4 text-slate-400"></i> {task.isPinned ? 'Відкріпити' : 'Закріпити'}
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button onClick={() => { if(confirm('Видалити?')) { deleteTask(task.id); onClose(); } }} className="w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-rose-50 text-rose-500 flex items-center gap-2">
                   <i className="fa-solid fa-trash-can w-4"></i> Видалити
                </button>
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"><i className="fa-solid fa-xmark"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-5 md:p-6 max-w-2xl mx-auto space-y-4">
          <div className="space-y-1 relative">
            <textarea 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)} 
              onBlur={() => updateTask({...task, title: localTitle})} 
              rows={1}
              className={`w-full bg-transparent text-[20px] font-bold border-t-0 border-l-0 border-r-0 border-b border-slate-200 focus:border-primary/50 focus:ring-0 p-0 pb-1.5 placeholder:text-slate-200 resize-none leading-tight outline-none shadow-none ${isDone ? 'line-through text-slate-300' : 'text-slate-900'} overflow-hidden h-auto transition-all`} 
              placeholder={isNote ? "Текст нотатки..." : "Текст завдання..."}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          <div className="min-h-[400px] text-[13px]">
            <DiaryEditor 
              id={task.id} 
              date={new Date(task.createdAt).toISOString().split('T')[0]} 
              onClose={() => {}} 
              standaloneMode={true} 
              initialContent={task.content}
              onContentChange={(newContent) => updateTask({...task, content: newContent})}
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2 items-center">
             <i className="fa-solid fa-tag text-[10px] text-slate-300"></i>
             {task.tags.map(t => (
               <Badge key={t} variant="slate" className="text-[9px] font-bold bg-slate-100 border-none px-2 py-0.5 rounded group/tag lowercase">
                 #{t}
                 <button onClick={() => removeTag(t)} className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity text-rose-400 hover:text-rose-600"><i className="fa-solid fa-xmark"></i></button>
               </Badge>
             ))}
             <div className="relative" ref={tagRef}>
               <button onClick={() => setShowTagPopover(!showTagPopover)} className="text-[9px] font-bold text-indigo-500 hover:underline">+ тег</button>
               {showTagPopover && (
                 <div className="absolute bottom-full left-0 mb-2 w-48 bg-white shadow-xl border border-slate-200 rounded-lg p-2 z-[130] tiktok-blur">
                    <HashtagAutocomplete mode="tags" value={newTagInput} onChange={setNewTagInput} onSelectTag={addNewTag} onEnter={() => addNewTag(newTagInput)} placeholder="Тег..." className="w-full text-[11px] p-1 border-none focus:ring-0 bg-slate-50 rounded" />
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
