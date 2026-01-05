
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
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempEndDate, setTempEndDate] = useState<number | undefined>(task.endDate);
  const [tempTime, setTempTime] = useState<string | undefined>(task.reminderTime || "10:00");
  const [tempReminderEnabled, setTempReminderEnabled] = useState<boolean>(task.reminderEnabled || false);
  const [tempRecurrence, setTempRecurrence] = useState<RecurrenceType>(task.recurrence || 'none');
  const [tempRecurrenceDays, setTempRecurrenceDays] = useState<number[]>(task.recurrenceDays || [1, 2, 3, 4, 5, 6, 0]);
  const [isEvent, setIsEvent] = useState<boolean>(task.isEvent || false);

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);
  const isHabit = task.projectSection === 'habits' || task.tags.includes('habit');

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempEndDate(task.endDate);
    setTempTime(task.reminderTime || "10:00");
    setTempReminderEnabled(task.reminderEnabled || false);
    setTempRecurrence(task.recurrence || 'none');
    setTempRecurrenceDays(task.recurrenceDays || [1, 2, 3, 4, 5, 6, 0]);
    setIsEvent(task.isEvent || false);
  }, [task.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== task.title || localContent !== task.content || isEvent !== task.isEvent) {
        updateTask({ ...task, title: localTitle, content: localContent, isEvent });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localTitle, localContent, isEvent]);

  const handleManualSaveAndClose = () => {
    updateTask({ 
      ...task, 
      title: localTitle, 
      content: localContent, 
      isEvent,
      scheduledDate: tempSelectedDate,
      endDate: tempEndDate
    });
    onClose();
  };

  const handleDateSelectCommit = () => {
    updateTask({
      ...task,
      scheduledDate: tempSelectedDate,
      endDate: tempEndDate,
      isEvent
    });
    setShowDatePicker(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

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
            if (!d) return <div key={i} />;
            const ts = d.setHours(0,0,0,0);
            const isStart = tempSelectedDate === ts;
            const isEnd = tempEndDate === ts;
            const inRange = tempSelectedDate && tempEndDate && ts > tempSelectedDate && ts < tempEndDate;
            
            return (
              <button key={i} onClick={() => { 
                if (dateType === 'start') setTempSelectedDate(ts); 
                else setTempEndDate(ts);
              }} className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${isStart || isEnd ? 'bg-orange-600 text-white shadow-sm' : inRange ? 'bg-orange-50 text-orange-400' : 'text-slate-600 hover:bg-slate-50'}`}>{d.getDate()}</button>
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
    <div className="w-full flex flex-col h-full bg-white border-l border-slate-100 transition-none relative shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between p-3 border-b border-slate-50 shrink-0">
        <div className="flex gap-1 relative">
          {!isHabit && (
            <div className="flex items-center bg-slate-50 rounded-xl p-1 gap-1">
              <button onClick={() => { setDateType('start'); setShowDatePicker(true); }} className={`h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tempSelectedDate ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                {tempSelectedDate ? new Date(tempSelectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Початок'}
              </button>
              {isEvent && (
                <button onClick={() => { setDateType('end'); setShowDatePicker(true); }} className={`h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tempEndDate ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                  {tempEndDate ? new Date(tempEndDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Кінець'}
                </button>
              )}
            </div>
          )}
          {showDatePicker && (
            <div ref={datePickerRef} className="absolute top-10 left-0 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[70] p-4 animate-in fade-in zoom-in-95 duration-200">
              <Typography variant="tiny" className="mb-2 text-orange-500 font-black">{dateType === 'start' ? 'Дата початку' : 'Дата завершення'}</Typography>
              {renderCalendar()}
              <div className="mt-4 flex gap-2">
                 <button onClick={() => { if(dateType==='start') setTempSelectedDate(undefined); else setTempEndDate(undefined); handleDateSelectCommit(); }} className="flex-1 py-2 text-[9px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-xl transition-all">Очистити</button>
                 <button onClick={handleDateSelectCommit} className="flex-1 bg-orange-600 text-white rounded-xl py-2 text-[9px] font-black uppercase shadow-lg shadow-orange-100">Зберегти</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEvent(!isEvent)} className={`h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isEvent ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-slate-200 text-slate-400'}`}>
             <i className="fa-solid fa-calendar-star mr-1"></i> Подія
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 pb-4">
          <HashtagAutocomplete
            value={localTitle}
            onChange={setLocalTitle}
            onSelectTag={() => {}}
            placeholder="Назва..."
            className="w-full bg-transparent text-xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-100 leading-tight mb-4"
          />
          
          <div className="flex items-center gap-2">
            {linkedProject ? (
              <Badge variant="orange" className="text-[9px] px-3 py-1 rounded-xl shadow-sm">{linkedProject.name}</Badge>
            ) : (
              <button className="text-[9px] font-black text-slate-300 uppercase hover:text-orange-500 transition-colors">+ ПРИВ'ЯЗАТИ ПРОЄКТ</button>
            )}
          </div>
        </div>

        <div className="px-6 flex gap-6 border-b border-slate-50">
          <button onClick={() => setActiveTab('notes')} className={`py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300'}`}>Нотатки</button>
        </div>

        <div className="p-6">
          <div className="relative group min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
               <Typography variant="tiny" className="text-slate-300 lowercase italic">опис події або завдання</Typography>
               <button onClick={() => setIsPreview(!isPreview)} className="text-[10px] text-orange-500 font-black uppercase hover:underline">
                  {isPreview ? 'Редагувати' : 'Огляд'}
               </button>
            </div>
            {isPreview ? (
              <div 
                className="prose prose-slate prose-sm max-w-none text-[13px] leading-relaxed text-slate-600"
                dangerouslySetInnerHTML={renderMarkdown(localContent)}
              />
            ) : (
              <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none min-h-[300px]"
                placeholder="Деталі..."
              />
            )}
          </div>
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
      </div>
    </div>
  );
};

export default TaskDetails;
