
import React, { useState } from 'react';
import { Person, ImportantDate } from '../../types';
import Typography from '../ui/Typography';

interface DatesTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
}

const DatesTab: React.FC<DatesTabProps> = ({ person, onUpdate }) => {
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDateValue, setNewDateValue] = useState('');

  const handleAddImportantDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateLabel.trim() || !newDateValue) return;

    const newDate: ImportantDate = {
      id: Math.random().toString(36).substr(2, 9),
      label: newDateLabel.trim(),
      date: newDateValue,
      showInCalendar: true,
      repeatYearly: true
    };

    onUpdate({
      ...person,
      importantDates: [...(person.importantDates || []), newDate]
    });
    setNewDateLabel('');
    setNewDateValue('');
  };

  const updateDateSettings = (id: string, updates: Partial<ImportantDate>) => {
    onUpdate({
      ...person,
      importantDates: (person.importantDates || []).map(d => d.id === id ? { ...d, ...updates } : d)
    });
  };

  const removeImportantDate = (id: string) => {
    onUpdate({
      ...person,
      importantDates: (person.importantDates || []).filter(d => d.id !== id)
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] text-[var(--primary)] flex items-center justify-center text-xs border border-[var(--border-color)]">
            <i className="fa-solid fa-cake-candles"></i>
          </div>
          <Typography variant="tiny" className="text-[var(--text-main)] font-black uppercase tracking-tight">День народження</Typography>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="flex gap-1">
             <button 
               onClick={() => onUpdate({...person, birthDateShowInCalendar: !person.birthDateShowInCalendar})}
               className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${person.birthDateShowInCalendar !== false ? 'bg-orange-100 text-orange-600' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}
               title="Показувати в календарі"
             >
               <i className="fa-solid fa-calendar-check text-[10px]"></i>
             </button>
             <button 
               onClick={() => onUpdate({...person, birthDateRepeatYearly: !person.birthDateRepeatYearly})}
               className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${person.birthDateRepeatYearly !== false ? 'bg-indigo-100 text-indigo-600' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'}`}
               title="Повторювати щороку"
             >
               <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
             </button>
          </div>
          <input 
            type="date" 
            value={person.birthDate || ''} 
            onChange={e => onUpdate({ ...person, birthDate: e.target.value })} 
            className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all cursor-pointer w-32 text-[var(--text-main)]" 
          />
        </div>
      </section>

      <section className="space-y-4">
        <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest ml-1">Важливі дати та події</Typography>
        
        <form onSubmit={handleAddImportantDate} className="flex items-center gap-2 bg-[var(--bg-main)] p-2 rounded-2xl border border-[var(--border-color)] shadow-inner">
          <input 
            value={newDateLabel} 
            onChange={e => setNewDateLabel(e.target.value)}
            placeholder="Назва події..." 
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm text-[var(--text-main)]" 
          />
          <input 
            type="date" 
            value={newDateValue} 
            onChange={e => setNewDateValue(e.target.value)}
            className="w-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/20 shadow-sm cursor-pointer text-[var(--text-main)]" 
          />
          <button type="submit" className="w-10 h-9 bg-[var(--text-main)] text-[var(--bg-card)] rounded-xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-md shrink-0">
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </form>

        <div className="space-y-1.5">
           {(person.importantDates || []).sort((a,b) => a.date.localeCompare(b.date)).map(d => (
             <div key={d.id} className="group flex items-center justify-between bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-color)] shadow-sm hover:border-[var(--primary)]/30 transition-all">
               <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                     <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">{d.label}</span>
                     <span className="text-[10px] font-bold text-[var(--text-muted)] shrink-0">{new Date(d.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}</span>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <button 
                    onClick={() => updateDateSettings(d.id, { showInCalendar: !d.showInCalendar })}
                    className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${d.showInCalendar ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-30'}`}
                    title="В календар"
                  >
                    <i className="fa-solid fa-calendar-day text-[9px]"></i>
                  </button>
                  <button 
                    onClick={() => updateDateSettings(d.id, { repeatYearly: !d.repeatYearly })}
                    className={`w-6 h-6 rounded-md transition-all flex items-center justify-center ${d.repeatYearly ? 'text-indigo-500' : 'text-[var(--text-muted)] opacity-30'}`}
                    title="Щороку"
                  >
                    <i className="fa-solid fa-arrows-rotate text-[9px]"></i>
                  </button>
                  <button onClick={() => removeImportantDate(d.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 text-[var(--text-muted)] hover:text-rose-500 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
               </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default DatesTab;
