import React, { useState, useMemo, useEffect } from 'react';
import { Task, RecurrenceConfig, RecurrenceType } from '../types';
import Typography from './ui/Typography';

interface TaskDatePickerProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
}

const TaskDatePicker: React.FC<TaskDatePickerProps> = ({ task, onUpdate, onClose }) => {
  const [mode, setMode] = useState<'date' | 'duration'>('date');
  const [showRecurrence, setShowRecurrence] = useState(task.recurrence !== 'none');
  const [showReminders, setShowReminders] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleQuickDate = (days: number) => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + days);
    onUpdate({ scheduledDate: d.getTime(), isAllDay: true });
  };

  const toggleDay = (day: number) => {
    const current = task.daysOfWeek || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort();
    onUpdate({ 
      recurrence: 'custom', 
      daysOfWeek: next
    });
  };

  const REMINDER_OPTS = [
    { label: 'Вчасно', val: 0 },
    { label: '5 хв до', val: 5 },
    { label: '30 хв до', val: 30 },
    { label: '1 год до', val: 60 },
    { label: '1 день до', val: 1440 },
  ];

  const toggleReminder = (mins: number) => {
    const current = task.reminders || [];
    const next = current.includes(mins) ? current.filter(m => m !== mins) : [...current, mins];
    onUpdate({ reminders: next });
  };

  const content = (
    <div className={`bg-[var(--bg-card)] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-[var(--border-color)] overflow-hidden tiktok-blur animate-in zoom-in-95 duration-200 ${
      isMobile ? 'w-full max-w-[340px] rounded-[2.5rem]' : 'w-[320px] rounded-[2rem]'
    }`}>
      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--border-color)] bg-black/[0.02]">
        <button onClick={() => setMode('date')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'date' ? 'bg-[var(--bg-card)] text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>Дата</button>
        <button onClick={() => setMode('duration')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'duration' ? 'bg-[var(--bg-card)] text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>Тривалість</button>
      </div>

      <div className="p-6 space-y-6">
        {mode === 'date' ? (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex justify-between gap-1.5">
              <button onClick={() => handleQuickDate(0)} className="flex-1 h-10 rounded-xl bg-[var(--bg-main)] hover:bg-orange-50 text-orange-500 transition-all flex items-center justify-center border border-[var(--border-color)]"><i className="fa-solid fa-sun text-sm"></i></button>
              <button onClick={() => handleQuickDate(1)} className="flex-1 h-10 rounded-xl bg-[var(--bg-main)] hover:bg-blue-50 text-blue-500 transition-all flex items-center justify-center border border-[var(--border-color)]"><i className="fa-solid fa-cloud-sun text-sm"></i></button>
              <button onClick={() => handleQuickDate(7)} className="flex-1 h-10 rounded-xl bg-[var(--bg-main)] hover:bg-indigo-50 text-indigo-500 transition-all flex items-center justify-center font-black text-[10px] border border-[var(--border-color)]">+7</button>
              <button onClick={() => onUpdate({ scheduledDate: undefined, endDate: undefined, reminders: [], recurrence: 'none', daysOfWeek: [] })} className="flex-1 h-10 rounded-xl bg-[var(--bg-main)] hover:bg-rose-50 text-rose-500 transition-all flex items-center justify-center border border-[var(--border-color)]"><i className="fa-solid fa-calendar-xmark text-sm"></i></button>
            </div>

            {/* Calendar & Time Grid */}
            <div className="space-y-3">
               <input 
                 type="date" 
                 value={task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : ''}
                 onChange={(e) => onUpdate({ scheduledDate: new Date(e.target.value).getTime() })}
                 className="w-full text-xs font-bold p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/10 text-[var(--text-main)] outline-none" 
               />
               <div className="flex items-center gap-3 bg-[var(--bg-main)] p-3.5 rounded-2xl border border-[var(--border-color)]">
                  <i className="fa-solid fa-clock text-[var(--text-muted)] text-xs opacity-50"></i>
                  <input 
                    type="time" 
                    className="flex-1 bg-transparent border-none p-0 text-xs font-black text-[var(--text-main)] focus:ring-0" 
                    onChange={(e) => {
                       const [h, m] = e.target.value.split(':').map(Number);
                       const d = new Date(task.scheduledDate || Date.now());
                       d.setHours(h, m, 0, 0);
                       onUpdate({ scheduledDate: d.getTime(), isAllDay: false });
                    }}
                  />
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-widest">Початок</label>
                   <div className="flex gap-2">
                      <input type="date" className="flex-1 text-[11px] p-3 bg-[var(--bg-main)] rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-main)]" onChange={(e) => {
                         const d = new Date(e.target.value);
                         onUpdate({ scheduledDate: d.getTime() });
                      }} />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-widest">Кінець</label>
                   <div className="flex gap-2">
                      <input type="date" className="flex-1 text-[11px] p-3 bg-[var(--bg-main)] rounded-xl font-bold border border-[var(--border-color)] text-[var(--text-main)]" onChange={(e) => {
                         const d = new Date(e.target.value);
                         onUpdate({ endDate: d.getTime() });
                      }} />
                   </div>
                </div>
             </div>
             <button 
                onClick={() => onUpdate({ isAllDay: !task.isAllDay })}
                className={`w-full py-3.5 rounded-2xl border-2 flex items-center justify-between px-5 transition-all ${task.isAllDay ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-[var(--bg-main)] border-transparent text-[var(--text-muted)]'}`}
             >
                <span className="text-[10px] font-black uppercase tracking-widest">Весь день</span>
                <div className={`w-8 h-4 rounded-full relative transition-all ${task.isAllDay ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${task.isAllDay ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
             </button>
          </div>
        )}

        {/* Recurrence & Reminders Mini-Menu */}
        <div className="space-y-2 pt-2">
           <button onClick={() => setShowRecurrence(!showRecurrence)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${task.recurrence && task.recurrence !== 'none' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-arrows-rotate text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Повторення</span>
              </div>
              <i className={`fa-solid fa-chevron-right text-[8px] transition-transform ${showRecurrence ? 'rotate-90' : ''}`}></i>
           </button>
           
           {showRecurrence && (
              <div className="p-3 bg-black/5 rounded-2xl animate-in slide-in-from-top-2 space-y-3">
                 <select 
                   className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase p-2.5 outline-none focus:border-[var(--primary)] text-[var(--text-main)]"
                   onChange={(e) => {
                     const val = e.target.value as RecurrenceType;
                     const updates: Partial<Task> = { recurrence: val };
                     if (val === 'weekdays') updates.daysOfWeek = [0, 1, 2, 3, 4];
                     if (val === 'custom' && (!task.daysOfWeek || task.daysOfWeek.length === 0)) updates.daysOfWeek = [new Date(task.scheduledDate || Date.now()).getDay() - 1];
                     onUpdate(updates);
                   }}
                   value={task.recurrence || 'none'}
                 >
                    <option value="none">Не повторювати</option>
                    <option value="daily">Щодня</option>
                    <option value="weekdays">Робочі дні</option>
                    <option value="weekly">Щотижня</option>
                    <option value="monthly">Щомісяця</option>
                    <option value="custom">Обрати дні...</option>
                 </select>

                 {(task.recurrence === 'custom' || (task.daysOfWeek && task.daysOfWeek.length > 0)) && (
                   <div className="flex gap-1 justify-between animate-in fade-in zoom-in-95">
                      {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((d, i) => (
                        <button 
                          key={i} 
                          onClick={() => toggleDay(i)} 
                          className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${task.daysOfWeek?.includes(i) ? 'bg-indigo-600 text-white shadow-md' : 'bg-[var(--bg-card)] text-slate-400 border border-[var(--border-color)]'}`}
                        >
                          {d}
                        </button>
                      ))}
                   </div>
                 )}
              </div>
           )}

           <button onClick={() => setShowReminders(!showReminders)} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${task.reminders?.length ? 'bg-amber-50 text-amber-700' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-bell text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Нагадування</span>
              </div>
              <i className={`fa-solid fa-chevron-right text-[8px] transition-transform ${showReminders ? 'rotate-90' : ''}`}></i>
           </button>

           {showReminders && (
              <div className="p-2 bg-black/5 rounded-2xl grid grid-cols-1 gap-1 animate-in slide-in-from-top-2">
                 {REMINDER_OPTS.map(opt => (
                    <button key={opt.val} onClick={() => toggleReminder(opt.val)} className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-bold flex items-center justify-between transition-all ${task.reminders?.includes(opt.val) ? 'bg-amber-500 text-white' : 'hover:bg-[var(--bg-card)] text-slate-600'}`}>
                       {opt.label}
                       {task.reminders?.includes(opt.val) && <i className="fa-solid fa-check text-[8px]"></i>}
                    </button>
                 ))}
              </div>
           )}
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={() => { onUpdate({ scheduledDate: undefined, endDate: undefined, reminders: [], recurrence: 'none', daysOfWeek: [] }); onClose(); }} className="flex-1 py-4 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">Очистити</button>
          <button onClick={onClose} className="flex-[2] py-4 text-[10px] font-black uppercase text-white bg-[var(--primary)] rounded-2xl shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-all">ГОТОВО</button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
        <div className="relative z-10 w-full flex justify-center">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-full mt-2 z-[500] origin-top-left">
      {content}
    </div>
  );
};

export default TaskDatePicker;