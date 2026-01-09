
import React, { useState, useMemo } from 'react';
import { Person, RelationshipLoop } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

const ALL_QUESTIONS = [
  { id: 'q1', text: 'Яку каву чи чай полюбляє?', icon: 'fa-mug-hot' },
  { id: 'q2', text: 'Куди мріє поїхати у відпустку?', icon: 'fa-plane-departure' },
  { id: 'q3', text: 'Яка остання книга чи фільм вразили?', icon: 'fa-book-open' },
  { id: 'q4', text: 'Чи є домашні улюбленці? Як звати?', icon: 'fa-dog' },
  { id: 'q5', text: 'Яку свою рису вважає "суперсилою"?', icon: 'fa-bolt' },
  { id: 'q6', text: 'Він/вона жайворонок чи сова?', icon: 'fa-moon' },
  { id: 'q7', text: 'Яку музику слухає для фокусу?', icon: 'fa-music' },
  { id: 'q8', text: 'Ким мріяв/ла стати в дитинстві?', icon: 'fa-rocket' },
  { id: 'q9', text: 'Що найбільше цінує в людях?', icon: 'fa-heart' },
  { id: 'q10', text: 'Чого найбільше боїться у професії?', icon: 'fa-ghost' },
  { id: 'q11', text: 'Інтроверт чи екстраверт?', icon: 'fa-user-group' },
  { id: 'q12', text: 'Улюблена кухня чи страва?', icon: 'fa-utensils' },
  { id: 'q13', text: 'Який прихований талант має?', icon: 'fa-star' }
];

const STATUS_LABELS: Record<string, string> = {
  friend: 'Друг',
  colleague: 'Колега',
  family: 'Сім\'я',
  mentor: 'Ментор',
  acquaintance: 'Знайомий'
};

interface InfoTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onAddHobby: (h: string) => void;
  onAddSkill: (s: string) => void;
  relationshipTypes: string[];
  onAddRelType: (t: string) => void;
}

const InfoTab: React.FC<InfoTabProps> = ({ person, onUpdate, relationshipTypes }) => {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');

  const availableQuestions = useMemo(() => {
    return ALL_QUESTIONS.filter(q => {
      const alreadyAnswered = person.notes?.some(n => n.text.includes(q.text));
      return !alreadyAnswered;
    });
  }, [person.notes]);

  const currentQuestions = useMemo(() => availableQuestions.slice(0, 3), [availableQuestions]);

  const handleSaveAnswer = (q: typeof ALL_QUESTIONS[0]) => {
    if (!inputValue.trim()) return;
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      text: `${q.text} Відповідь: ${inputValue.trim()}`,
      date: new Date().toISOString()
    };
    onUpdate({ ...person, notes: [newNote, ...(person.notes || [])] });
    setInputValue('');
    setActiveInputId(null);
  };

  const loops: { val: RelationshipLoop; label: string }[] = [
    { val: 'week', label: 'Тижд.' },
    { val: 'month', label: 'Міс.' },
    { val: 'quarter', label: 'Кв.' },
    { val: 'year', label: 'Рік' },
    { val: 'none', label: 'Off' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 flex items-center justify-between gap-3 group/select relative transition-all hover:bg-white hover:shadow-sm">
          <div className="min-w-0 flex-1">
             <Typography variant="tiny" className="text-slate-400 font-black uppercase text-[7px] mb-1.5 tracking-[0.2em]">Роль у системі</Typography>
             <div className="relative flex items-center">
                <select 
                  value={person.status} 
                  onChange={e => onUpdate({ ...person, status: e.target.value })} 
                  className="w-full bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase focus:ring-4 focus:ring-orange-100 py-2.5 px-3 outline-none cursor-pointer text-slate-900 appearance-none pr-10 transition-all shadow-sm"
                >
                  {relationshipTypes.map(t => <option key={t} value={t}>{STATUS_LABELS[t] || t}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 text-[8px] text-slate-300 pointer-events-none transition-transform group-hover/select:translate-y-0.5"></i>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 flex flex-col justify-center transition-all hover:bg-white hover:shadow-sm">
          <Typography variant="tiny" className="text-slate-400 font-black uppercase text-[7px] mb-2.5 tracking-[0.2em] text-center">Цикл зв'язку</Typography>
          <div className="flex justify-between gap-1">
            {loops.map(l => (
              <button 
                key={l.val} 
                onClick={() => onUpdate({ ...person, loop: l.val })} 
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${person.loop === l.val ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {currentQuestions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <Typography variant="tiny" className="text-orange-500 font-black uppercase tracking-widest flex items-center gap-2 text-[8px]">
              <i className="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Зближення
            </Typography>
            <span className="text-[7px] font-black text-slate-300 uppercase">Доступно {availableQuestions.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {currentQuestions.map(q => (
              <div key={q.id} className={`px-5 py-4 bg-orange-50/30 border rounded-[1.5rem] transition-all ${activeInputId === q.id ? 'border-orange-300 bg-white ring-4 ring-orange-50' : 'border-orange-100/30 hover:bg-white hover:border-orange-200 shadow-sm'}`}>
                <div 
                  onClick={() => { setActiveInputId(q.id); setInputValue(''); }}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-white text-orange-500 flex items-center justify-center text-xs shadow-sm shrink-0">
                    <i className={`fa-solid ${q.icon}`}></i>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 flex-1 leading-tight">{q.text}</span>
                </div>
                {activeInputId === q.id && (
                  <div className="mt-3 flex gap-2 animate-in slide-in-from-top-1">
                    <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveAnswer(q)} placeholder="Ваша відповідь..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200" />
                    <button onClick={() => handleSaveAnswer(q)} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-orange-100">ЗБЕРЕГТИ</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-2 text-[8px]">Журнал Фактів</Typography>
        <div className="space-y-2">
          {(person.notes || []).map(note => (
            <div key={note.id} className="group bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all hover:border-orange-200">
               {editingNoteId === note.id ? (
                 <div className="flex gap-2">
                    <input autoFocus value={editNoteValue} onChange={e => setEditNoteValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onUpdate({...person, notes: person.notes.map(n => n.id === note.id ? {...n, text: editNoteValue} : n)}), setEditingNoteId(null))} className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none" />
                    <button onClick={() => {onUpdate({...person, notes: person.notes.map(n => n.id === note.id ? {...n, text: editNoteValue} : n)}); setEditingNoteId(null);}} className="text-emerald-500 font-black text-[9px] uppercase">OK</button>
                 </div>
               ) : (
                 <div className="flex justify-between items-start gap-4">
                    <p className="text-[12px] font-bold text-slate-700 leading-relaxed flex-1">{note.text}</p>
                    <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => { setEditingNoteId(note.id); setEditNoteValue(note.text); }} className="text-slate-300 hover:text-orange-500"><i className="fa-solid fa-pen text-[9px]"></i></button>
                       <button onClick={() => onUpdate({...person, notes: person.notes.filter(n => n.id !== note.id)})} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                    </div>
                 </div>
               )}
            </div>
          ))}
          {(!person.notes || person.notes.length === 0) && (
            <div className="text-center py-8 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Фактів ще немає</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InfoTab;
