
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

type DatePickerView = 'main' | 'time' | 'reminder' | 'recurrence';

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const { updateTask, scheduleTask, tags, addTag, renameTag, deleteTag, projects } = useApp();
  const [activeTab, setActiveTab] = useState<'notes' | 'table'>('notes');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [datePickerView, setDatePickerView] = useState<DatePickerView>('main');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Temporary state for unsaved changes in the date picker
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempTime, setTempTime] = useState<string | undefined>(task.reminderTime || "10:00");
  const [tempReminderEnabled, setTempReminderEnabled] = useState<boolean>(task.reminderEnabled || false);
  const [tempRecurrence, setTempRecurrence] = useState<RecurrenceType>(task.recurrence || 'none');

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSelectingGoal, setIsSelectingGoal] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);

  const checklistItems = useMemo(() => {
    return [...(task.checklist || [])].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [task.checklist]);

  const isNote = task.category === 'note';

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempTime(task.reminderTime || "10:00");
    setTempReminderEnabled(task.reminderEnabled || false);
    setTempRecurrence(task.recurrence || 'none');
  }, [task.id, task.scheduledDate, task.reminderTime, task.reminderEnabled, task.recurrence]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        setDatePickerView('main');
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  const handleSave = () => {
    if (localTitle !== task.title || localContent !== task.content) {
      updateTask({ ...task, title: localTitle, content: localContent });
    }
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newChecklistItem.trim(),
      completed: false
    };
    updateTask({ ...task, checklist: [...(task.checklist || []), newItem] });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string) => {
    const newChecklist = (task.checklist || []).map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateTask({ ...task, checklist: newChecklist });
  };

  const deleteChecklistItem = (id: string) => {
    const newChecklist = (task.checklist || []).filter(item => item.id !== id);
    updateTask({ ...task, checklist: newChecklist });
  };

  const handleTagSelect = (tagName: string) => {
    const cleanTag = tagName.replace('#', '').trim().toLowerCase();
    if (cleanTag && !task.tags.includes(cleanTag)) {
      if (!tags.find(t => t.name === cleanTag)) addTag(cleanTag);
      updateTask({ ...task, tags: [...task.tags, cleanTag] });
    }
    setIsAddingTag(false);
  };

  const handleRemoveTagFromTask = (tagName: string) => {
    updateTask({ ...task, tags: task.tags.filter(t => t !== tagName) });
  };

  const handleDateSelectCommit = () => {
    updateTask({
      ...task,
      scheduledDate: tempSelectedDate,
      reminderTime: tempTime,
      reminderEnabled: tempReminderEnabled,
      recurrence: tempRecurrence
    });
    setShowDatePicker(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const calendarDays = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      calendarDays.push({ day: new Date(year, month, 0).getDate() - i, current: false, date: new Date(year, month, -i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="tiny" className="text-[10px] lowercase font-black">{currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</Typography>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left text-[8px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-right text-[8px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => <div key={w} className="text-[7px] font-black text-slate-200">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((d, i) => {
            const timestamp = d.date.setHours(0,0,0,0);
            const isSelected = tempSelectedDate === timestamp;
            return (
              <button key={i} onClick={() => setTempSelectedDate(timestamp)} className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${isSelected ? 'bg-orange-600 text-white' : !d.current ? 'text-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}>{d.day}</button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMarkdown = (content: string) => {
    const rawHtml = marked.parse(content || "_Тут ще немає записів..._");
    return { __html: rawHtml };
  };

  return (
    <div className="w-full flex flex-col h-full bg-white border-l border-slate-100 transition-none relative">
      <div className="flex items-center justify-between p-2 border-b border-slate-50 shrink-0">
        <div className="flex gap-1 relative">
          <button onClick={() => setShowDatePicker(!showDatePicker)} className={`h-7 px-2 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${task.scheduledDate ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
            <i className="fa-solid fa-calendar-day"></i>
            {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Дата'}
          </button>
          {showDatePicker && (
            <div ref={datePickerRef} className="absolute top-9 left-0 w-56 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[70] p-3 animate-in fade-in zoom-in-95 duration-200">
              {renderCalendar()}
              <div className="mt-3 flex gap-2">
                 <button onClick={() => { setTempSelectedDate(undefined); handleDateSelectCommit(); }} className="flex-1 py-1.5 text-[8px] font-black text-rose-500 uppercase">Очистити</button>
                 <button onClick={handleDateSelectCommit} className="flex-1 bg-orange-600 text-white rounded-lg py-1.5 text-[8px] font-black uppercase">ОК</button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 pb-2">
          <HashtagAutocomplete
            value={localTitle}
            onChange={setLocalTitle}
            onSelectTag={handleTagSelect}
            placeholder="Що зробити?"
            className="w-full bg-transparent text-lg font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-100 leading-tight"
          />
          <div className="mt-2 flex items-center gap-2">
            {linkedProject ? (
              <Badge variant="orange" className="text-[8px] px-2 py-0.5">{linkedProject.name}</Badge>
            ) : (
              <button onClick={() => setIsSelectingGoal(true)} className="text-[8px] font-black text-slate-300 uppercase">+ Прив'язати проєкт</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100 flex items-center gap-1">
                #{tag}
                <i onClick={() => handleRemoveTagFromTask(tag)} className="fa-solid fa-xmark cursor-pointer hover:text-rose-500"></i>
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 flex gap-4 border-b border-slate-50">
          <button onClick={() => setActiveTab('notes')} className={`py-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Опис</button>
          <button onClick={() => setActiveTab('table')} className={`py-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'table' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Чек-ліст</button>
        </div>

        <div className="p-4">
          {activeTab === 'notes' ? (
            <div className="relative group">
              <button onClick={() => { if (!isPreview) handleSave(); setIsPreview(!isPreview); }} className="absolute -top-1 right-0 text-[10px] text-orange-500 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                {isPreview ? 'Редагувати' : 'Зберегти'}
              </button>
              {isPreview ? (
                <div 
                  className="prose prose-slate prose-sm max-w-none text-[12px] leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={renderMarkdown(localContent)}
                />
              ) : (
                <textarea
                  ref={contentTextareaRef}
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleSave}
                  autoFocus
                  className="w-full bg-transparent text-[12px] text-slate-600 focus:ring-0 border-none p-0 resize-none min-h-[200px]"
                  placeholder="Додайте деталі..."
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 mb-4">
                <input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Додати пункт..." className="flex-1 bg-slate-50 border-none rounded-lg px-3 py-1.5 text-[11px] font-bold focus:ring-2 focus:ring-orange-100" />
                <button type="submit" className="w-7 h-7 bg-orange-600 text-white rounded-lg flex items-center justify-center"><i className="fa-solid fa-plus text-[10px]"></i></button>
              </form>
              <div className="space-y-1">
                {checklistItems.map(item => (
                  <div key={item.id} className="group flex items-center gap-2 py-1">
                    <button onClick={() => toggleChecklistItem(item.id)} className={`w-3.5 h-3.5 rounded border transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                      <i className="fa-solid fa-check text-[7px]"></i>
                    </button>
                    <span className={`flex-1 text-[11px] font-medium ${item.completed ? 'line-through text-slate-300' : 'text-slate-600'}`}>{item.title}</span>
                    <i onClick={() => deleteChecklistItem(item.id)} className="fa-solid fa-trash-can text-[8px] text-slate-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 cursor-pointer"></i>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-2 px-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-300 uppercase tracking-widest">
        <span>{task.xp} XP AWARD</span>
        <span>ID: {task.id.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default TaskDetails;
