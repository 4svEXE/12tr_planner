import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, TaskStatus, Tag, Project, Person, Hobby } from '../types';
import { useApp } from '../contexts/AppContext';
import HashtagAutocomplete from './HashtagAutocomplete';
import Typography from './ui/Typography';
import Badge from './ui/Badge';
import Button from './ui/Button';

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
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isPreview, setIsPreview] = useState(true);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
  }, [task.id, task.title, task.content]);

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

  const renderMarkdown = (content: string) => {
    // @ts-ignore
    const rawHtml = window.marked ? window.marked.parse(content || "_Тут ще немає записів..._") : content;
    return { __html: rawHtml };
  };

  const isDone = task.status === TaskStatus.DONE;
  const linkedProject = projects.find(p => p.id === task.projectId);

  return (
    <div className="w-full flex flex-col h-full bg-white relative">
      {/* COMPACT HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-50 shrink-0 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)} 
              className={`h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${task.scheduledDate ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <i className="fa-solid fa-calendar-day text-[10px]"></i>
              {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'БЕЗ ДАТИ'}
            </button>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
               <button 
                  onClick={() => updateTask({...task, isEvent: false})}
                  className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${!task.isEvent ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
               >
                  ЗАВДАННЯ
               </button>
               <button 
                  onClick={() => updateTask({...task, isEvent: true})}
                  className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${task.isEvent ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400'}`}
               >
                  ПОДІЯ
               </button>
            </div>

            {showDatePicker && (
              <div ref={datePickerRef} className="absolute top-9 left-0 w-60 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[100] p-4 tiktok-blur animate-in fade-in zoom-in-95">
                <input 
                   type="date" 
                   className="w-full bg-slate-50 p-2 rounded-xl border-none text-[11px] font-bold outline-none" 
                   onChange={(e) => handleApplyDate(new Date(e.target.value).getTime())}
                />
                <button onClick={() => handleApplyDate(undefined)} className="w-full mt-2 py-1.5 text-[8px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-lg">Очистити</button>
              </div>
            )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-50 text-slate-300 flex items-center justify-center transition-all shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-5 space-y-5">
          {/* TITLE AREA */}
          <div className="flex items-start gap-3">
            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 bg-white text-transparent hover:border-orange-400'}`}>
              <i className="fa-solid fa-check text-[10px]"></i>
            </button>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={localTitle} 
                onChange={(e) => setLocalTitle(e.target.value)} 
                onBlur={() => updateTask({...task, title: localTitle})} 
                placeholder="Назва нового квесту..." 
                className={`w-full bg-transparent text-xl font-black border-none focus:ring-0 p-0 placeholder:opacity-20 leading-tight mb-1 outline-none ${isDone ? 'line-through text-slate-300' : 'text-slate-900'}`} 
              />
              {linkedProject && (
                 <span className="text-[7px] font-black uppercase text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded"># {linkedProject.name}</span>
              )}
            </div>
          </div>

          {/* ULTRA-COMPACT META ROW (All in one line) */}
          <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
             {/* Ally Select */}
             <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0 transition-all hover:border-orange-200">
                <i className="fa-solid fa-user-ninja text-indigo-400 text-[9px]"></i>
                <select 
                  value={task.personId || ''} 
                  onChange={e => updateTask({...task, personId: e.target.value || undefined})}
                  className="bg-transparent border-none text-[9px] font-black uppercase tracking-tight focus:ring-0 p-0 outline-none w-16 cursor-pointer"
                >
                  <option value="">—</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>

             {/* Hobby Select */}
             <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0 transition-all hover:border-orange-200">
                <i className="fa-solid fa-heart text-rose-400 text-[9px]"></i>
                <select 
                  value={task.tags.find(t => hobbies.some(h => h.name === t)) || ''}
                  onChange={e => {
                    const hName = e.target.value;
                    const newTags = task.tags.filter(t => !hobbies.some(h => h.name === t));
                    if (hName) newTags.push(hName);
                    updateTask({...task, tags: newTags});
                  }}
                  className="bg-transparent border-none text-[9px] font-black uppercase tracking-tight focus:ring-0 p-0 outline-none w-14 cursor-pointer"
                >
                  <option value="">—</option>
                  {hobbies.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
             </div>

             {/* Tag Autocomplete */}
             <div className="flex-1 min-w-0 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-orange-100 transition-all flex items-center gap-1.5">
                <i className="fa-solid fa-tag text-orange-400 text-[9px] shrink-0"></i>
                <HashtagAutocomplete
                  value={newTagInput}
                  onChange={setNewTagInput}
                  onSelectTag={(name) => { handleAddTag(name); setNewTagInput(''); }}
                  className="w-full border-none text-[9px] font-black uppercase placeholder:text-slate-300 p-0"
                  placeholder="ТЕГ..."
                />
             </div>
          </div>

          {/* ACTIVE TAGS */}
          {task.tags.length > 0 && (
             <div className="flex flex-wrap gap-1 px-1">
                {task.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-white border border-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500 shadow-sm flex items-center gap-1.5 hover:border-orange-200 transition-all">
                     #{t}
                     <i onClick={() => removeTag(t)} className="fa-solid fa-xmark text-[7px] text-slate-300 cursor-pointer hover:text-rose-500"></i>
                  </span>
                ))}
             </div>
          )}

          {/* TABS */}
          <div className="flex gap-4 border-b border-slate-50">
            <button onClick={() => setActiveTab('notes')} className={`pb-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>Опис</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'checklist' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>Кроки ({(task.checklist || []).length})</button>
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'checklist' ? (
              <div className="space-y-4 animate-in fade-in">
                <input 
                  ref={checklistInputRef}
                  value={newChecklistItem} 
                  onChange={e => setNewChecklistItem(e.target.value)} 
                  onKeyDown={e => { if(e.key === 'Enter') handleAddSubtask(); }}
                  placeholder="+ Додати нову дію..." 
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-100 transition-all shadow-inner" 
                />
                <div className="space-y-1">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 py-2 px-3 hover:bg-slate-50 rounded-xl group/item transition-colors">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent group-hover/item:border-orange-400'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                        <span className={`text-[12px] flex-1 truncate ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700 font-bold'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[7px] text-slate-300 font-black uppercase tracking-widest">Стратегія та контекст</span>
                  <button onClick={() => setIsPreview(!isPreview)} className="text-[7px] text-orange-600 font-black uppercase hover:underline decoration-2 underline-offset-4">{isPreview ? 'Редагувати' : 'Огляд'}</button>
                </div>
                {isPreview ? (
                  <div onClick={() => setIsPreview(false)} className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed cursor-text min-h-[200px] p-2 hover:bg-slate-50/30 rounded-xl transition-colors text-[12px]" dangerouslySetInnerHTML={renderMarkdown(localContent)} />
                ) : (
                  <textarea 
                    autoFocus
                    value={localContent} 
                    onChange={(e) => setLocalContent(e.target.value)} 
                    onBlur={() => { updateTask({...task, content: localContent}); setIsPreview(true); }} 
                    className="w-full bg-slate-50 border-none rounded-xl p-4 text-[12px] text-slate-700 focus:ring-2 focus:ring-orange-100 outline-none resize-none min-h-[300px] leading-relaxed font-medium" 
                    placeholder="Опис стратегії..." 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="p-5 border-t border-slate-50 shrink-0 bg-white">
        <button onClick={() => { updateTask({...task, title: localTitle, content: localContent }); onClose(); }} className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all">ЗБЕРЕГТИ ТА ЗАКРИТИ</button>
      </footer>
    </div>
  );
};

export default TaskDetails;