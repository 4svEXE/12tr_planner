
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
  
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempTime, setTempTime] = useState<string | undefined>(task.reminderTime || "10:00");
  const [tempReminderEnabled, setTempReminderEnabled] = useState<boolean>(task.reminderEnabled || false);
  const [tempRecurrence, setTempRecurrence] = useState<RecurrenceType>(task.recurrence || 'none');
  const [tempRecurrenceDays, setTempRecurrenceDays] = useState<number[]>(task.recurrenceDays || [1, 2, 3, 4, 5, 6, 0]);

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSelectingGoal, setIsSelectingGoal] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);
  const isHabit = task.projectSection === 'habits' || task.tags.includes('habit');

  const checklistItems = useMemo(() => {
    return [...(task.checklist || [])].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [task.checklist]);

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempTime(task.reminderTime || "10:00");
    setTempReminderEnabled(task.reminderEnabled || false);
    setTempRecurrence(task.recurrence || 'none');
    setTempRecurrenceDays(task.recurrenceDays || [1, 2, 3, 4, 5, 6, 0]);
  }, [task.id]);

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

  // Auto-save logic for title and content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== task.title || localContent !== task.content) {
        updateTask({ ...task, title: localTitle, content: localContent });
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [localTitle, localContent, task.title, task.content, task, updateTask]);

  const handleManualSaveAndClose = () => {
    // Ensure last changes are committed
    updateTask({ ...task, title: localTitle, content: localContent });
    onClose();
  };

  const toggleDay = (day: number) => {
    const newDays = tempRecurrenceDays.includes(day)
      ? tempRecurrenceDays.filter(d => d !== day)
      : [...tempRecurrenceDays, day];
    
    setTempRecurrenceDays(newDays);
    updateTask({ ...task, recurrenceDays: newDays, recurrence: 'custom' });
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

  const weekDays = [
    { label: 'Пн', value: 1 },
    { label: 'Вт', value: 2 },
    { label: 'Ср', value: 3 },
    { label: 'Чт', value: 4 },
    { label: 'Пт', value: 5 },
    { label: 'Сб', value: 6 },
    { label: 'Нд', value: 0 },
  ];

  return (
    <div className="w-full flex flex-col h-full bg-white border-l border-slate-100 transition-none relative shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between p-3 border-b border-slate-50 shrink-0">
        <div className="flex gap-1 relative">
          {!isHabit && (
            <button onClick={() => setShowDatePicker(!showDatePicker)} className={`h-8 px-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${task.scheduledDate ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-100' : 'bg-slate-50 text-slate-400'}`}>
              <i className="fa-solid fa-calendar-day"></i>
              {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Запланувати'}
            </button>
          )}
          {isHabit && (
            <div className="h-8 px-3 rounded-xl bg-orange-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100">
               <i className="fa-solid fa-repeat"></i> Звичка
            </div>
          )}
          {showDatePicker && (
            <div ref={datePickerRef} className="absolute top-10 left-0 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[70] p-4 animate-in fade-in zoom-in-95 duration-200">
              {renderCalendar()}
              <div className="mt-4 flex gap-2">
                 <button onClick={() => { setTempSelectedDate(undefined); handleDateSelectCommit(); }} className="flex-1 py-2 text-[9px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-xl transition-all">Очистити</button>
                 <button onClick={handleDateSelectCommit} className="flex-1 bg-orange-600 text-white rounded-xl py-2 text-[9px] font-black uppercase shadow-lg shadow-orange-100">Зберегти</button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 pb-4">
          <HashtagAutocomplete
            value={localTitle}
            onChange={setLocalTitle}
            onSelectTag={handleTagSelect}
            placeholder="Назва завдання..."
            className="w-full bg-transparent text-xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-100 leading-tight mb-4"
          />
          
          {isHabit && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
               <Typography variant="tiny" className="text-slate-400 mb-3 block">Дні виконання</Typography>
               <div className="flex justify-between gap-1">
                  {weekDays.map(day => {
                    const isActive = tempRecurrenceDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                          isActive 
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-100' 
                            : 'bg-white text-slate-300 border border-slate-100 hover:border-orange-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
               </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {linkedProject ? (
              <Badge variant="orange" className="text-[9px] px-3 py-1 rounded-xl shadow-sm">{linkedProject.name}</Badge>
            ) : (
              <button onClick={() => setIsSelectingGoal(true)} className="text-[9px] font-black text-slate-300 uppercase hover:text-orange-500 transition-colors">+ ПРИВ'ЯЗАТИ ПРОЄКТ</button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-4">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-1 rounded-xl text-[9px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100 flex items-center gap-2 hover:border-orange-200 transition-all">
                #{tag}
                <i onClick={() => handleRemoveTagFromTask(tag)} className="fa-solid fa-xmark cursor-pointer hover:text-rose-500"></i>
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 flex gap-6 border-b border-slate-50">
          <button onClick={() => setActiveTab('notes')} className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Нотатки</button>
          {!isHabit && <button onClick={() => setActiveTab('table')} className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'table' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Етапи</button>}
        </div>

        <div className="p-6">
          {activeTab === 'notes' ? (
            <div className="relative group min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                 <Typography variant="tiny" className="text-slate-300 lowercase italic">короткі записи та інструкції</Typography>
                 <button onClick={() => { setIsPreview(!isPreview); }} className="text-[10px] text-orange-500 font-black uppercase hover:underline">
                    {isPreview ? 'Редагувати' : 'Попередній перегляд'}
                 </button>
              </div>
              {isPreview ? (
                <div 
                  className="prose prose-slate prose-sm max-w-none text-[13px] leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={renderMarkdown(localContent)}
                />
              ) : (
                <textarea
                  ref={contentTextareaRef}
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none min-h-[300px]"
                  placeholder="Опишіть правила або деталі..."
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Додати пункт..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[12px] font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
                <button type="submit" className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"><i className="fa-solid fa-plus text-xs"></i></button>
              </form>
              <div className="space-y-2">
                {checklistItems.map(item => (
                  <div key={item.id} className="group flex items-center gap-3 py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
                    <button onClick={() => toggleChecklistItem(item.id)} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-200 bg-white'}`}>
                      <i className="fa-solid fa-check text-[9px]"></i>
                    </button>
                    <span className={`flex-1 text-[12px] font-medium transition-all ${item.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{item.title}</span>
                    <button onClick={() => deleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4 shrink-0">
        <Button 
          variant="primary" 
          onClick={handleManualSaveAndClose} 
          className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-100"
        >
          ЗБЕРЕГТИ ТА ЗАКРИТИ
        </Button>
        <div className="flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
          <span className="flex items-center gap-2"><i className="fa-solid fa-bolt text-orange-400"></i> {task.xp} XP AWARD</span>
          <span>ID: {task.id.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
