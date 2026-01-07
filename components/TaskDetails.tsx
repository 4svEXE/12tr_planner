
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Priority, TaskStatus, Tag, Attachment, Comment, Project, RecurrenceType, ChecklistItem } from '../types';
import { useApp } from '../contexts/AppContext';
import HashtagAutocomplete from './HashtagAutocomplete';
import { marked } from 'https://esm.sh/marked@12.0.0';
import Typography from './ui/Typography';
import Badge from './ui/Badge';
import Button from './ui/Button';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { 
    updateTask, scheduleTask, tags, addTag, projects, 
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    toggleTaskStatus 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>('notes');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newTagInput, setNewTagInput] = useState('');
  
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempEndDate, setTempEndDate] = useState<number | undefined>(task.endDate);
  const [isEvent, setIsEvent] = useState<boolean>(task.isEvent || false);

  const hasInitialTime = useMemo(() => {
    if (!task.scheduledDate) return false;
    const d = new Date(task.scheduledDate);
    return d.getHours() !== 0 || d.getMinutes() !== 0;
  }, [task.scheduledDate]);

  const [includeTime, setIncludeTime] = useState<boolean>(hasInitialTime);
  const [selectedHour, setSelectedHour] = useState<number>(tempSelectedDate ? new Date(tempSelectedDate).getHours() : 9);
  const [selectedMinute, setSelectedMinute] = useState<number>(tempSelectedDate ? new Date(tempSelectedDate).getMinutes() : 0);

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempEndDate(task.endDate);
    setIsEvent(task.isEvent || false);
    
    const d = task.scheduledDate ? new Date(task.scheduledDate) : null;
    const hasTime = d ? (d.getHours() !== 0 || d.getMinutes() !== 0) : false;
    setIncludeTime(hasTime);
    
    if (d) {
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    }
  }, [task.id, task.scheduledDate, task.endDate, task.isEvent, task.title, task.content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== task.title || localContent !== task.content || isEvent !== task.isEvent) {
        const tagMatches = localTitle.match(/#\w+/g);
        const extractedTags = tagMatches ? tagMatches.map(t => t.slice(1).toLowerCase()) : [];
        const cleanTitle = localTitle.replace(/#\w+/g, '').replace(/\s\s+/g, ' ').trim();
        const combinedTags = [...new Set([...task.tags, ...extractedTags])];
        extractedTags.forEach(tagName => {
           if (!tags.some(t => t.name === tagName)) addTag(tagName);
        });
        updateTask({ 
           ...task, 
           title: cleanTitle, 
           content: localContent, 
           isEvent, 
           tags: combinedTags 
        });
        if (tagMatches) setLocalTitle(cleanTitle);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localTitle, localContent, isEvent]);

  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isPreview]);

  const handleApplyDate = () => {
    let finalDate = tempSelectedDate;
    if (finalDate) {
      const d = new Date(finalDate);
      if (includeTime) {
        d.setHours(selectedHour, selectedMinute, 0, 0);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      finalDate = d.getTime();
    }
    updateTask({ 
      ...task, 
      scheduledDate: finalDate,
      endDate: tempEndDate
    });
    setShowDatePicker(false);
  };

  const removeTag = (tagName: string) => {
    updateTask({ ...task, tags: task.tags.filter(t => t !== tagName) });
  };

  const handleAddTagInput = () => {
    if (newTagInput.trim()) {
      const cleanInput = newTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!task.tags.includes(cleanInput)) {
        if (!tags.some(t => t.name === cleanInput)) addTag(cleanInput);
        updateTask({ ...task, tags: [...task.tags, cleanInput] });
      }
      setNewTagInput('');
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));
    const todayTs = new Date().setHours(0,0,0,0);

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="tiny" className="text-[10px] font-black text-[var(--text-main)]">{currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</Typography>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left text-[8px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-right text-[8px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => <div key={w} className="text-[7px] font-black text-slate-300 uppercase">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((d, i) => {
            if (!d) return <div key={i} />;
            const ts = d.setHours(0,0,0,0);
            const isSelected = tempSelectedDate && new Date(tempSelectedDate).setHours(0,0,0,0) === ts;
            const isEnd = tempEndDate && new Date(tempEndDate).setHours(0,0,0,0) === ts;
            const isToday = ts === todayTs;
            return (
              <button 
                key={i} 
                onClick={() => { if (dateType === 'start') setTempSelectedDate(ts); else setTempEndDate(ts); }} 
                className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold relative ${isSelected || isEnd ? 'bg-[var(--primary)] text-white' : isToday ? 'border border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-main)] hover:bg-[var(--sidebar-item-hover)]'}`}
              >
                {d.getDate()}
                {isToday && !isSelected && <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-pink-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      addChecklistItem(task.id, newChecklistItem.trim());
      setNewChecklistItem('');
    }
  };

  const renderMarkdown = (content: string) => {
    const rawHtml = marked.parse(content || "_Тут ще немає записів. Натисніть, щоб додати..._");
    return { __html: rawHtml };
  };

  const getFormattedDateTime = () => {
    if (!tempSelectedDate) return 'Обрати дату';
    const d = new Date(tempSelectedDate);
    const datePart = d.toLocaleString('uk-UA', { day: 'numeric', month: 'short' });
    if (!includeTime) return datePart;
    const timePart = d.toLocaleString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  };

  const isDone = task.status === TaskStatus.DONE;

  return (
    <div className="w-full flex flex-col h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] transition-none relative">
      <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0">
        <div className="flex gap-2 relative">
            <button 
              onClick={() => { setDateType('start'); setShowDatePicker(true); }} 
              className={`h-7 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${tempSelectedDate ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}
            >
              <i className="fa-solid fa-calendar-day"></i>
              {getFormattedDateTime()}
            </button>
          {showDatePicker && (
            <div ref={datePickerRef} className="absolute top-9 left-0 w-64 bg-[var(--bg-card)] shadow-2xl rounded-2xl border border-[var(--border-color)] z-[100] p-4 tiktok-blur">
              <Typography variant="tiny" className="mb-3 text-[var(--primary)] font-black text-[8px]">Планування</Typography>
              {renderCalendar()}
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <input type="checkbox" id="includeTime" checked={includeTime} onChange={e => setIncludeTime(e.target.checked)} className="w-3 h-3 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                     <label htmlFor="includeTime" className="text-[8px] font-black uppercase text-[var(--text-muted)] cursor-pointer">Вказати час</label>
                  </div>
                  {includeTime && (
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" max="23" value={selectedHour} onChange={e => setSelectedHour(parseInt(e.target.value) || 0)} className="w-8 bg-[var(--bg-main)] border-none rounded text-center text-[10px] font-bold p-1 focus:ring-1 focus:ring-[var(--primary)]" />
                      <span className="text-[10px] font-bold">:</span>
                      <input type="number" min="0" max="59" value={selectedMinute} onChange={e => setSelectedMinute(parseInt(e.target.value) || 0)} className="w-8 bg-[var(--bg-main)] border-none rounded text-center text-[10px] font-bold p-1 focus:ring-1 focus:ring-[var(--primary)]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                 <button onClick={() => { setTempSelectedDate(undefined); setTempEndDate(undefined); setShowDatePicker(false); updateTask({...task, scheduledDate: undefined}); }} className="flex-1 py-2 text-[8px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-lg">Очистити</button>
                 <button onClick={handleApplyDate} className="flex-1 bg-[var(--text-main)] text-[var(--bg-card)] rounded-lg py-2 text-[8px] font-black uppercase tracking-widest">Готoво</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEvent(!isEvent)} className={`h-8 px-3 rounded-lg flex items-center gap-2 transition-all ${isEvent ? 'bg-pink-500 text-white shadow-lg' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover)]'}`} title={isEvent ? "Це подія" : "Це квест"}>
             <i className={`fa-solid ${isEvent ? 'fa-calendar-check' : 'fa-shuttle-space'} text-[10px]`}></i>
             <span className="text-[9px] font-black uppercase tracking-widest">{isEvent ? 'Подія' : 'Квест'}</span>
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--sidebar-item-hover)] text-[var(--text-muted)] flex items-center justify-center"><i className="fa-solid fa-xmark text-xs"></i></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent hover:border-[var(--primary)]'}`}>
              <i className="fa-solid fa-check text-xs"></i>
            </button>
            <div className="flex-1 min-w-0">
              <input type="text" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} placeholder="Назва квесту..." className={`w-full bg-transparent text-[16px] font-black border-none focus:ring-0 p-0 placeholder:opacity-20 leading-tight mb-2 outline-none ${isDone ? 'line-through text-slate-400' : 'text-[var(--text-main)]'}`} />
              <div className="flex flex-wrap gap-2 items-center mt-1">
                {linkedProject ? (
                  <Badge variant="orange" className="px-2 py-0.5 rounded-lg text-[11px]">{linkedProject.name}</Badge>
                ) : (
                  <button className="text-[11px] font-black text-[var(--text-muted)] uppercase hover:text-[var(--primary)] tracking-widest">+ Проєкт</button>
                )}
                {task.tags.map(tagName => {
                  const tagObj = tags.find(t => t.name === tagName);
                  return (
                    <Badge key={tagName} className="px-2 py-0.5 rounded-lg lowercase text-[11px] font-bold group/tag cursor-default" style={tagObj ? { backgroundColor: `${tagObj.color}20`, color: tagObj.color, borderColor: `${tagObj.color}40` } : {}}>
                      #{tagName}
                      <i onClick={() => removeTag(tagName)} className="fa-solid fa-xmark text-[8px] ml-1 opacity-0 group-hover/tag:opacity-100 cursor-pointer hover:text-rose-500 transition-all"></i>
                    </Badge>
                  );
                })}
                <div className="relative flex items-center h-6">
                    <HashtagAutocomplete
                       value={newTagInput}
                       onChange={setNewTagInput}
                       onSelectTag={(name) => {
                          if (!task.tags.includes(name)) updateTask({ ...task, tags: [...task.tags, name] });
                          setNewTagInput('');
                       }}
                       onEnter={handleAddTagInput}
                       showSuggestionsOnFocus={true}
                       placeholder="+ тег"
                       className="w-20 bg-slate-50 border-none rounded-lg px-2 text-[10px] font-black h-6 outline-none focus:ring-1 focus:ring-orange-100"
                    />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 border-b border-[var(--border-color)]">
            <button onClick={() => setActiveTab('notes')} className={`pb-2 text-[11px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'notes' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)]'}`}>Нотатки</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-2 text-[11px] font-black uppercase tracking-widest border-b-2 ${activeTab === 'checklist' ? 'border-[var(--primary)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)]'}`}>Чек-лист ({(task.checklist || []).length})</button>
          </div>
          <div className="min-h-[200px]">
            {activeTab === 'checklist' ? (
              <div className="space-y-3">
                <form onSubmit={handleAddSubtask}><input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="+ Додати підпункт..." className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 px-4 text-[13px] font-bold focus:ring-0 outline-none" /></form>
                <div className="space-y-1 mt-4">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 hover:bg-black/5 rounded-lg group/item">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-4 h-4 rounded border flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent'}`}><i className="fa-solid fa-check text-[7px]"></i></button>
                        <span className={`text-[13px] flex-1 truncate ${item.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)] font-medium'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-[var(--text-muted)] hover:text-rose-500"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1"><Typography variant="tiny" className="text-[var(--text-muted)] text-[9px]">Контекст</Typography><button onClick={() => setIsPreview(!isPreview)} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline">{isPreview ? 'Редагувати' : 'Огляд'}</button></div>
                {isPreview ? (
                  <div onClick={() => setIsPreview(false)} className="prose prose-slate prose-sm max-w-none text-[13px] text-[var(--text-main)] leading-relaxed cursor-text min-h-[300px]" dangerouslySetInnerHTML={renderMarkdown(localContent)} />
                ) : (
                  <textarea ref={textareaRef} value={localContent} onChange={(e) => setLocalContent(e.target.value)} onBlur={() => setIsPreview(true)} className="w-full bg-transparent border-none p-0 text-[13px] text-[var(--text-main)] focus:ring-0 outline-none resize-none min-h-[400px] leading-relaxed" placeholder="Деталі..." />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="p-4 border-t border-[var(--border-color)] shrink-0">
        <button onClick={() => { updateTask({...task, title: localTitle, content: localContent, scheduledDate: tempSelectedDate, isEvent }); onClose(); }} className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20">ЗБЕРЕГТИ ТА ЗАКРИТИ</button>
      </footer>
    </div>
  );
};

export default TaskDetails;
