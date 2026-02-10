
import React, { useState, useMemo } from 'react';
import { Task, RecurrenceConfig } from '../types';
import Typography from './ui/Typography';

interface TaskDatePickerProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
}

const TaskDatePicker: React.FC<TaskDatePickerProps> = ({ task, onUpdate, onClose }) => {
  const [mode, setMode] = useState<'date' | 'duration'>('date');
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  const currentStartDate = useMemo(() => task.scheduledDate ? new Date(task.scheduledDate) : new Date(), [task.scheduledDate]);
  
  const handleQuickDate = (days: number) => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + days);
    onUpdate({ scheduledDate: d.getTime(), isAllDay: true });
  };

  const toggleDay = (day: number) => {
    const current = task.recurrenceConfig?.daysOfWeek || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort();
    onUpdate({ 
      recurrence: 'custom', 
      recurrenceConfig: { ...task.recurrenceConfig, type: 'custom', daysOfWeek: next } 
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

  return (
    <div className="absolute left-0 top-full mt-2 w-[320px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 rounded-[2rem] z-[500] flex flex-col overflow-hidden tiktok-blur animate-in zoom-in-95 duration-200">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button onClick={() => setMode('date')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'date' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>Дата</button>
        <button onClick={() => setMode('duration')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'duration' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>Тривалість</button>
      </div>

      <div className="p-5 space-y-5">
        {mode === 'date' ? (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex justify-between gap-1">
              <button onClick={() => handleQuickDate(0)} className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-orange-50 text-orange-500 transition-all flex items-center justify-center"><i className="fa-solid fa-sun text-sm"></i></button>
              <button onClick={() => handleQuickDate(1)} className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-500 transition-all flex items-center justify-center"><i className="fa-solid fa-cloud-sun text-sm"></i></button>
              <button onClick={() => handleQuickDate(7)} className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-500 transition-all flex items-center justify-center font-black text-[10px]">+7</button>
              <button onClick={() => onUpdate({ scheduledDate: undefined, endDate: undefined, reminders: [], recurrence: 'none' })} className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-calendar-xmark text-sm"></i></button>
            </div>

            {/* Calendar & Time Grid */}
            <div className="space-y-3">
               <input 
                 type="date" 
                 value={task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : ''}
                 onChange={(e) => onUpdate({ scheduledDate: new Date(e.target.value).getTime() })}
                 className="w-full text-xs font-bold p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100" 
               />
               <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                  <i className="fa-solid fa-clock text-slate-400 text-xs"></i>
                  <input 
                    type="time" 
                    className="flex-1 bg-transparent border-none p-0 text-xs font-black text-slate-700 focus:ring-0" 
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
             <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Початок</label>
                   <div className="flex gap-2">
                      <input type="date" className="flex-1 text-[10px] p-2.5 bg-slate-50 rounded-xl font-bold border-none" onChange={(e) => {
                         const d = new Date(e.target.value);
                         onUpdate({ scheduledDate: d.getTime() });
                      }} />
                      <input type="time" className="w-20 text-[10px] p-2.5 bg-slate-50 rounded-xl font-bold border-none" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Кінець</label>
                   <div className="flex gap-2">
                      <input type="date" className="flex-1 text-[10px] p-2.5 bg-slate-50 rounded-xl font-bold border-none" onChange={(e) => {
                         const d = new Date(e.target.value);
                         onUpdate({ endDate: d.getTime() });
                      }} />
                      <input type="time" className="w-20 text-[10px] p-2.5 bg-slate-50 rounded-xl font-bold border-none" />
                   </div>
                </div>
             </div>
             <button 
                onClick={() => onUpdate({ isAllDay: !task.isAllDay })}
                className={`w-full py-3 rounded-2xl border-2 flex items-center justify-between px-4 transition-all ${task.isAllDay ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}
             >
                <span className="text-[10px] font-black uppercase tracking-widest">Весь день</span>
                <div className={`w-8 h-4 rounded-full relative transition-all ${task.isAllDay ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${task.isAllDay ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
             </button>
          </div>
        )}

        {/* Recurrence & Reminders Mini-Menu */}
        <div className="space-y-2 border-t border-slate-50 pt-4">
           <button onClick={() => setShowRecurrence(!showRecurrence)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${task.recurrence !== 'none' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-500'}`}>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-arrows-rotate text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Повторення</span>
              </div>
              <i className={`fa-solid fa-chevron-right text-[8px] transition-transform ${showRecurrence ? 'rotate-90' : ''}`}></i>
           </button>
           
           {showRecurrence && (
              <div className="p-3 bg-slate-50 rounded-2xl animate-in slide-in-from-top-2">
                 <div className="flex gap-1 justify-between mb-3">
                    {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)} className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${task.recurrenceConfig?.daysOfWeek?.includes(i) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{d}</button>
                    ))}
                 </div>
                 <select 
                   className="w-full bg-white border-none rounded-xl text-[10px] font-black uppercase p-2 outline-none"
                   onChange={(e) => onUpdate({ recurrence: e.target.value as any })}
                   value={task.recurrence}
                 >
                    <option value="none">Не повторювати</option>
                    <option value="daily">Щодня</option>
                    <option value="weekly">Щотижня</option>
                    <option value="monthly">Щомісяця</option>
                 </select>
              </div>
           )}

           <button onClick={() => setShowReminders(!showReminders)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${task.reminders?.length ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-500'}`}>
              <div className="flex items-center gap-3">
                 <i className="fa-solid fa-bell text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Нагадування</span>
              </div>
              <i className={`fa-solid fa-chevron-right text-[8px] transition-transform ${showReminders ? 'rotate-90' : ''}`}></i>
           </button>

           {showReminders && (
              <div className="p-2 bg-slate-50 rounded-2xl grid grid-cols-1 gap-1 animate-in slide-in-from-top-2">
                 {REMINDER_OPTS.map(opt => (
                    <button key={opt.val} onClick={() => toggleReminder(opt.val)} className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-bold flex items-center justify-between transition-all ${task.reminders?.includes(opt.val) ? 'bg-amber-500 text-white' : 'hover:bg-white text-slate-600'}`}>
                       {opt.label}
                       {task.reminders?.includes(opt.val) && <i className="fa-solid fa-check text-[8px]"></i>}
                    </button>
                 ))}
              </div>
           )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => { onUpdate({ scheduledDate: undefined, endDate: undefined, reminders: [], recurrence: 'none' }); onClose(); }} className="flex-1 py-3 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">Очистити</button>
          <button onClick={onClose} className="flex-[2] py-3 text-[10px] font-black uppercase text-white bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">ГОТОВО</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDatePicker;
