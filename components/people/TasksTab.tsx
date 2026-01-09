
import React, { useState } from 'react';
import { Person, Task, TaskStatus } from '../../types';
import Typography from '../ui/Typography';

interface TasksTabProps {
  person: Person;
  tasks: Task[];
  onAddTask: (title: string, date: number) => void;
  onToggleTask: (task: Task) => void;
}

const TasksTab: React.FC<TasksTabProps> = ({ person, tasks, onAddTask, onToggleTask }) => {
  const [taskDate, setTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const smartSuggestions = [
    { title: 'Кава', icon: 'fa-coffee' },
    { title: 'Дзвінок', icon: 'fa-phone' },
    { title: 'Нетворкінг', icon: 'fa-handshake' },
    { title: 'Привітати', icon: 'fa-cake-candles' }
  ];

  const personTasks = tasks.filter(t => t.personId === person.id && !t.isDeleted);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="space-y-4">
         <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Запланувати квест</Typography>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {smartSuggestions.map(s => (
               <button key={s.title} onClick={() => onAddTask(`${s.title} з ${person.name}`, new Date(taskDate).getTime())} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all flex flex-col items-center gap-1">
                  <i className={`fa-solid ${s.icon} text-orange-500 text-xs`}></i>
                  <span className="text-[8px] font-black uppercase">{s.title}</span>
               </button>
            ))}
         </div>
         <div className="flex flex-col md:flex-row gap-2">
            <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-100" />
            <input onKeyDown={e => { if(e.key === 'Enter' && (e.target as any).value) { onAddTask((e.target as any).value, new Date(taskDate).getTime()); (e.target as any).value = ''; }}} placeholder="Власна задача..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none" />
         </div>
      </section>

      <section className="space-y-2">
        <Typography variant="tiny" className="text-slate-400 font-black uppercase">Активні справи</Typography>
        {personTasks.map(t => (
          <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm hover:border-orange-200 transition-all">
            <button onClick={() => onToggleTask(t)} className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-orange-400'}`}>
               {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
            <div className="flex-1 min-w-0">
               <span className={`text-xs font-bold block truncate ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-700'}`}>{t.title}</span>
               {t.scheduledDate && <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">{new Date(t.scheduledDate).toLocaleDateString('uk-UA')}</span>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default TasksTab;
