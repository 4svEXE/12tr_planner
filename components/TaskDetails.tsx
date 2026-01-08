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
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  const [newTagInput, setNewTagInput] = useState('');
  
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempEndDate, setTempEndDate] = useState<number | undefined>(task.endDate);
  const [isEvent, setIsEvent] = useState<boolean>(task.isEvent || false);

  const [includeTime, setIncludeTime] = useState<boolean>(!!task.scheduledDate && (new Date(task.scheduledDate).getHours() !== 0));
  const [selectedHour, setSelectedHour] = useState<number>(tempSelectedDate ? new Date(tempSelectedDate).getHours() : 9);
  const [selectedMinute, setSelectedMinute] = useState<number>(tempSelectedDate ? new Date(tempSelectedDate).getMinutes() : 0);

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);
  const linkedPerson = people.find(p => p.id === task.personId);

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempEndDate(task.endDate);
    setIsEvent(task.isEvent || false);
  }, [task.id]);

  const handleApplyDate = () => {
    let finalDate = tempSelectedDate;
    if (finalDate) {
      const d = new Date(finalDate);
      if (includeTime) d.setHours(selectedHour, selectedMinute, 0, 0);
      else d.setHours(0, 0, 0, 0);
      finalDate = d.getTime();
    }
    updateTask({ ...task, scheduledDate: finalDate, endDate: tempEndDate });
    setShowDatePicker(false);
  };

  const handleAddTag = (name: string) => {
    if (!task.tags.includes(name)) {
      updateTask({ ...task, tags: [...task.tags, name] });
    }
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newChecklistItem.trim()) {
      addChecklistItem(task.id, newChecklistItem.trim());
      setNewChecklistItem('');
      // Keep focus in the input for the next item
      setTimeout(() => checklistInputRef.current?.focus(), 0);
    }
  };

  const renderMarkdown = (content: string) => {
    // @ts-ignore
    const rawHtml = window.marked ? window.marked.parse(content || "_Тут ще немає записів..._") : content;
    return { __html: rawHtml };
  };

  const isDone = task.status === TaskStatus.DONE;

  return (
    <div className="w-full flex flex-col h-full bg-white relative">
      <header className="flex items-center justify-between p-4 border-b border-slate-50 shrink-0 bg-white sticky top-0 z-20">
        <div className="flex gap-2 relative">
            <button 
              onClick={() => { setDateType('start'); setShowDatePicker(true); }} 
              className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${tempSelectedDate ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
            >
              <i className="fa-solid fa-calendar-day"></i>
              {tempSelectedDate ? new Date(tempSelectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Дату квесту'}
            </button>
            {showDatePicker && (
              <div ref={datePickerRef} className="absolute top-9 left-0 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[100] p-4 tiktok-blur animate-in fade-in zoom-in-95">
                <Typography variant="tiny" className="mb-2 text-orange-500 font-black text-[8px]">Планування</Typography>
                <div className="mt-4 flex gap-2">
                   <button onClick={() => { setTempSelectedDate(undefined); setShowDatePicker(false); updateTask({...task, scheduledDate: undefined}); }} className="flex-1 py-2 text-[8px] font-black text-rose-500 uppercase">Очистити</button>
                   <button onClick={handleApplyDate} className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-[8px] font-black uppercase tracking-widest">Готовo</button>
                </div>
              </div>
            )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-300 flex items-center justify-center transition-all shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 bg-white text-transparent hover:border-orange-400'}`}>
              <i className="fa-solid fa-check text-xs"></i>
            </button>
            <div className="flex-1 min-w-0">
              <input type="text" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} onBlur={() => updateTask({...task, title: localTitle})} placeholder="Назва квесту..." className={`w-full bg-transparent text-[18px] font-black border-none focus:ring-0 p-0 placeholder:opacity-20 leading-tight mb-3 outline-none ${isDone ? 'line-through text-slate-300' : 'text-slate-900'}`} />
              
              <div className="flex flex-wrap gap-2 items-center mb-5">
                {linkedProject && <Badge variant="orange" className="text-[9px] py-1 px-2 lowercase shadow-sm">#{linkedProject.name}</Badge>}
                {linkedPerson && <Badge variant="indigo" className="text-[9px] py-1 px-2 shadow-sm" icon="fa-user">@{linkedPerson.name}</Badge>}
                {task.tags.map(t => (
                  <Badge key={t} className="text-[9px] py-1 px-2 lowercase shadow-sm bg-slate-50 text-slate-400 border-slate-100">#{t}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest">Союзник</span>
                   <select 
                     value={task.personId || ''} 
                     onChange={e => updateTask({...task, personId: e.target.value || undefined})}
                     className="w-full bg-slate-50 border-none rounded-lg p-2 text-[9px] font-bold outline-none focus:ring-0"
                   >
                     <option value="">Без когось</option>
                     {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest">Хобі</span>
                   <select 
                     value={task.tags.find(t => hobbies.some(h => h.name === t)) || ''}
                     onChange={e => {
                        const hName = e.target.value;
                        const newTags = task.tags.filter(t => !hobbies.some(h => h.name === t));
                        if (hName) newTags.push(hName);
                        updateTask({...task, tags: newTags});
                     }}
                     className="w-full bg-slate-50 border-none rounded-lg p-2 text-[9px] font-bold outline-none focus:ring-0"
                   >
                     <option value="">Без хобі</option>
                     {hobbies.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest">+ Тег</span>
                   <HashtagAutocomplete
                     value={newTagInput}
                     onChange={setNewTagInput}
                     onSelectTag={(name) => { handleAddTag(name); setNewTagInput(''); }}
                     className="w-full bg-slate-50 border-none rounded-lg p-2 text-[9px] font-bold outline-none focus:ring-0"
                     placeholder="#"
                   />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 border-b border-slate-50">
            <button onClick={() => setActiveTab('notes')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Нотатки</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'checklist' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Дії ({(task.checklist || []).length})</button>
          </div>

          <div className="min-h-[250px]">
            {activeTab === 'checklist' ? (
              <div className="space-y-4">
                <input 
                  ref={checklistInputRef}
                  value={newChecklistItem} 
                  onChange={e => setNewChecklistItem(e.target.value)} 
                  onKeyDown={e => { if(e.key === 'Enter') handleAddSubtask(); }}
                  placeholder="+ Додати нову дію (Enter)..." 
                  className="w-full bg-slate-50/50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-0" 
                />
                <div className="space-y-1">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 py-2 px-3 hover:bg-slate-50 rounded-xl group/item transition-colors">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent'}`}><i className="fa-solid fa-check text-[7px]"></i></button>
                        <span className={`text-[12px] flex-1 truncate ${item.completed ? 'text-slate-300 line-through' : 'text-slate-600 font-bold'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 px-1">
                  <Typography variant="tiny" className="text-slate-300 font-black">КОНТЕКСТ СТРАТЕГІЇ</Typography>
                  <button onClick={() => setIsPreview(!isPreview)} className="text-[8px] text-orange-600 font-black uppercase hover:underline">{isPreview ? 'Редагувати' : 'Огляд'}</button>
                </div>
                {isPreview ? (
                  <div onClick={() => setIsPreview(false)} className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed cursor-text min-h-[300px] p-1 animate-in fade-in" dangerouslySetInnerHTML={renderMarkdown(localContent)} />
                ) : (
                  <textarea 
                    ref={textareaRef} 
                    value={localContent} 
                    onChange={(e) => setLocalContent(e.target.value)} 
                    onBlur={() => { updateTask({...task, content: localContent}); setIsPreview(true); }} 
                    className="w-full bg-transparent border-none p-1 text-[13px] text-slate-700 focus:ring-0 outline-none resize-none min-h-[400px] leading-relaxed font-medium" 
                    placeholder="Додай опис стратегії або нотатки..." 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="p-6 border-t border-slate-50 shrink-0 bg-white">
        <button onClick={() => { updateTask({...task, title: localTitle, content: localContent, scheduledDate: tempSelectedDate, isEvent }); onClose(); }} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200/50 hover:bg-black active:scale-95 transition-all">ЗБЕРЕГТИ ТА ЗАКРИТИ</button>
      </footer>
    </div>
  );
};

export default TaskDetails;