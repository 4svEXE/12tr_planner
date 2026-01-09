
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, TaskStatus, Tag, Project, Person, Hobby } from '../types';
import { useApp } from '../contexts/AppContext';
import HashtagAutocomplete from './HashtagAutocomplete';
import Typography from './ui/Typography';
import Badge from './ui/Badge';
import Button from './ui/Button';
import DiaryEditor from './DiaryEditor';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { 
    updateTask, scheduleTask, tags, addTag, projects, people, hobbies,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    toggleTaskStatus 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>('notes');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  
  const [localTitle, setLocalTitle] = useState(task.title);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.id, task.title]);

  const handleApplyDate = (timestamp?: number) => {
    updateTask({ ...task, scheduledDate: timestamp });
    setShowDatePicker(false);
  };

  const handleAddTag = (name: string) => {
    if (!task.tags.includes(name)) {
      updateTask({ ...task, tags: [...task.tags, name] });
    }
  };

  const removeTag = (name: string) => {
    updateTask({ ...task, tags: task.tags.filter(t => t !== name) });
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newChecklistItem.trim()) {
      addChecklistItem(task.id, newChecklistItem.trim());
      setNewChecklistItem('');
      setTimeout(() => checklistInputRef.current?.focus(), 0);
    }
  };

  const isDone = task.status === TaskStatus.DONE;
  const linkedProject = projects.find(p => p.id === task.projectId);

  return (
    <div className="w-full flex flex-col h-full bg-[var(--bg-card)] relative">
      {/* COMPACT HEADER */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-card)] sticky top-0 z-20">
        <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)} 
              className={`h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${task.scheduledDate ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-[var(--border-color)]'}`}
            >
              <i className="fa-solid fa-calendar-day text-[10px]"></i>
              {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'БЕЗ ДАТИ'}
            </button>

            <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)]">
               <button 
                  onClick={() => updateTask({...task, isEvent: false})}
                  className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${!task.isEvent ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}
               >
                  ЗАВДАННЯ
               </button>
               <button 
                  onClick={() => updateTask({...task, isEvent: true})}
                  className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${task.isEvent ? 'bg-pink-600 text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
               >
                  ПОДІЯ
               </button>
            </div>

            {showDatePicker && (
              <div ref={datePickerRef} className="absolute top-9 left-0 w-60 bg-[var(--bg-card)] shadow-2xl rounded-2xl border border-[var(--border-color)] z-[100] p-4 tiktok-blur animate-in fade-in zoom-in-95">
                <input 
                   type="date" 
                   className="w-full bg-[var(--bg-main)] p-2 rounded-xl border-none text-[11px] font-bold outline-none text-[var(--text-main)]" 
                   onChange={(e) => handleApplyDate(new Date(e.target.value).getTime())}
                />
                <button onClick={() => handleApplyDate(undefined)} className="w-full mt-2 py-1.5 text-[8px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-lg">Очистити</button>
              </div>
            )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center transition-all shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-card)]">
        <div className="p-4 md:p-5 space-y-5">
          {/* TITLE AREA */}
          <div className="flex items-start gap-3">
            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent hover:border-[var(--primary)]'}`}>
              <i className="fa-solid fa-check text-[10px]"></i>
            </button>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={localTitle} 
                onChange={(e) => setLocalTitle(e.target.value)} 
                onBlur={() => updateTask({...task, title: localTitle})} 
                placeholder="Назва нового квесту..." 
                className={`w-full bg-transparent text-xl font-black border-none focus:ring-0 p-0 placeholder:opacity-20 leading-tight mb-1 outline-none ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`} 
              />
              {linkedProject && (
                 <span className="text-[7px] font-black uppercase text-[var(--primary)] bg-[var(--primary)]/5 px-1.5 py-0.5 rounded"># {linkedProject.name}</span>
              )}
            </div>
          </div>

          {/* META ROW */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-main)]/50 p-1 rounded-xl border border-[var(--border-color)]">
             <div className="flex items-center gap-1.5 bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-color)] shadow-sm shrink-0 transition-all hover:border-[var(--primary)]/30">
                <i className="fa-solid fa-user-ninja text-indigo-400 text-[9px]"></i>
                <select 
                  value={task.personId || ''} 
                  onChange={e => updateTask({...task, personId: e.target.value || undefined})}
                  className="bg-transparent border-none text-[9px] font-black uppercase tracking-tight focus:ring-0 p-0 outline-none w-16 cursor-pointer text-[var(--text-main)]"
                >
                  <option value="">—</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>

             <div className="flex-1 min-w-0 bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-color)] shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)]/10 transition-all flex items-center gap-1.5">
                <i className="fa-solid fa-tag text-[var(--primary)] text-[9px] shrink-0"></i>
                <HashtagAutocomplete
                  value={newTagInput}
                  onChange={setNewTagInput}
                  onSelectTag={(name) => { handleAddTag(name); setNewTagInput(''); }}
                  className="w-full border-none text-[9px] font-black uppercase placeholder:text-[var(--text-muted)] p-0 bg-transparent text-[var(--text-main)]"
                  placeholder="ТЕГ..."
                />
             </div>
          </div>

          {/* TABS */}
          <div className="flex gap-4 border-b border-[var(--border-color)]">
            <button onClick={() => setActiveTab('notes')} className={`pb-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>Опис</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'checklist' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>Кроки ({(task.checklist || []).length})</button>
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'checklist' ? (
              <div className="space-y-4 animate-in fade-in">
                <input 
                  ref={checklistInputRef}
                  value={newChecklistItem} 
                  onChange={e => setNewChecklistItem(e.target.value)} 
                  onKeyDown={e => { if(e.key === 'Enter') handleAddSubtask(); }}
                  placeholder="+ Додати нову дію..." 
                  className="w-full bg-[var(--bg-main)] border-none rounded-xl py-3 px-4 text-[12px] font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-all shadow-inner text-[var(--text-main)]" 
                />
                <div className="space-y-1">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 py-2 px-3 hover:bg-[var(--bg-main)] rounded-xl group/item transition-colors">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent group-hover/item:border-[var(--primary)]'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                        <span className={`text-[12px] flex-1 truncate ${item.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)] font-bold'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-[var(--text-muted)] hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in h-full">
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
      <footer className="p-4 md:p-5 border-t border-[var(--border-color)] shrink-0 bg-[var(--bg-card)]">
        <Button onClick={() => { updateTask({...task, title: localTitle }); onClose(); }} className="w-full py-4 rounded-2xl shadow-xl font-black uppercase tracking-widest text-[10px]">ЗБЕРЕГТИ ТА ЗАКРИТИ</Button>
      </footer>
    </div>
  );
};

export default TaskDetails;
