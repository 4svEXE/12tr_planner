
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
    addChecklistItem, toggleChecklistItem, removeChecklistItem 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist'>('notes');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [tempSelectedDate, setTempSelectedDate] = useState<number | undefined>(task.scheduledDate);
  const [tempEndDate, setTempEndDate] = useState<number | undefined>(task.endDate);
  const [isEvent, setIsEvent] = useState<boolean>(task.isEvent || false);

  const [localTitle, setLocalTitle] = useState(task.title);
  const [localContent, setLocalContent] = useState(task.content || "");
  const [isPreview, setIsPreview] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const linkedProject = projects.find(p => p.id === task.projectId);

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalContent(task.content || "");
    setTempSelectedDate(task.scheduledDate);
    setTempEndDate(task.endDate);
    setIsEvent(task.isEvent || false);
  }, [task.id]);

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

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      addChecklistItem(task.id, newChecklistItem.trim());
      setNewChecklistItem('');
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
            
            return (
              <button key={i} onClick={() => { 
                if (dateType === 'start') setTempSelectedDate(ts); 
                else setTempEndDate(ts);
              }} className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold ${isStart || isEnd ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>{d.getDate()}</button>
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
      <header className="flex items-center justify-between p-6 border-b border-slate-50 shrink-0">
        <div className="flex gap-3 relative">
            <div className="flex items-center bg-slate-50/80 rounded-2xl p-1 gap-1 border border-slate-100">
              <button onClick={() => { setDateType('start'); setShowDatePicker(true); }} className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tempSelectedDate ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <i className="fa-solid fa-calendar-day mr-2"></i>
                {tempSelectedDate ? new Date(tempSelectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) : 'Дату'}
              </button>
            </div>
          {showDatePicker && (
            <div ref={datePickerRef} className="absolute top-12 left-0 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 z-[100] p-5 animate-in fade-in zoom-in-95 duration-200 tiktok-blur">
              <Typography variant="tiny" className="mb-4 text-orange-500 font-black">Обрати дату</Typography>
              {renderCalendar()}
              <div className="mt-6 flex gap-2">
                 <button onClick={() => { if(dateType==='start') setTempSelectedDate(undefined); else setTempEndDate(undefined); setShowDatePicker(false); }} className="flex-1 py-3 text-[9px] font-black text-rose-500 uppercase hover:bg-rose-50 rounded-xl">Очистити</button>
                 <button onClick={() => setShowDatePicker(false)} className="flex-1 bg-slate-900 text-white rounded-xl py-3 text-[9px] font-black uppercase">Готoво</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsEvent(!isEvent)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEvent ? 'bg-pink-100 text-pink-600' : 'bg-slate-50 text-slate-300 hover:text-slate-600'}`} title="Подія">
             <i className="fa-solid fa-calendar-star"></i>
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-slate-100 text-slate-300 flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-8">
          {/* Title - Simple Input instead of Textarea */}
          <div className="flex flex-col">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Назва квесту..."
              className="w-full bg-transparent text-2xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-100 leading-tight mb-2"
            />
            <div className="flex flex-wrap gap-2 items-center mt-2">
              {linkedProject ? (
                <Badge variant="orange" className="px-3 py-1 rounded-xl bg-orange-50 border-orange-100">{linkedProject.name}</Badge>
              ) : (
                <button className="text-[10px] font-black text-slate-300 uppercase hover:text-orange-500 tracking-widest">+ Проєкт</button>
              )}
              {task.tags.map(tag => (
                <Badge key={tag} variant="slate" className="px-3 py-1 rounded-xl lowercase">#{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Checklist vs Notes Switcher */}
          <div className="flex gap-6 border-b border-slate-100">
            <button onClick={() => setActiveTab('notes')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'notes' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>Нотатки</button>
            <button onClick={() => setActiveTab('checklist')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'checklist' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>Чек-лист ({(task.checklist || []).length})</button>
          </div>

          <div className="min-h-[300px] animate-in fade-in duration-300">
            {activeTab === 'checklist' ? (
              <div className="space-y-4">
                <form onSubmit={handleAddSubtask} className="relative group">
                   <input 
                    value={newChecklistItem} 
                    onChange={e => setNewChecklistItem(e.target.value)} 
                    placeholder="+ Додати підпункт..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                   />
                </form>
                <div className="space-y-2 mt-6">
                   {(task.checklist || []).map(item => (
                     <div key={item.id} className="flex items-center gap-4 group/item py-2 px-1 hover:bg-slate-50 rounded-xl transition-all">
                        <button onClick={() => toggleChecklistItem(task.id, item.id)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent'}`}><i className="fa-solid fa-check text-[9px]"></i></button>
                        <span className={`text-sm flex-1 ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700 font-medium'}`}>{item.title}</span>
                        <button onClick={() => removeChecklistItem(task.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                     </div>
                   ))}
                   {(task.checklist || []).length === 0 && (
                     <div className="text-center py-12 text-slate-200 uppercase text-[10px] font-black tracking-widest">Немає підпунктів</div>
                   )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <Typography variant="tiny" className="text-slate-300">опис та контекст</Typography>
                   <button onClick={() => setIsPreview(!isPreview)} className="text-[10px] text-orange-500 font-black uppercase hover:underline">
                      {isPreview ? 'Редагувати' : 'Огляд'}
                   </button>
                </div>
                {isPreview ? (
                  <div 
                    className="prose prose-slate prose-sm max-w-none text-[14px] leading-relaxed text-slate-600"
                    dangerouslySetInnerHTML={renderMarkdown(localContent)}
                  />
                ) : (
                  <textarea
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-[14px] text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none min-h-[400px]"
                    placeholder="Додай деталі про цей квест..."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="p-8 bg-slate-50/50 border-t border-slate-100 shrink-0">
        <Button 
          variant="primary" 
          onClick={handleManualSaveAndClose} 
          className="w-full py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.25em] shadow-xl shadow-orange-200"
        >
          ЗБЕРЕГТИ ЗМІНИ
        </Button>
      </footer>
    </div>
  );
};

export default TaskDetails;
