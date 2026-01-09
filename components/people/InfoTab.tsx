
import React, { useState, useMemo } from 'react';
import { Person, RelationshipLoop, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

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
  { id: 'q13', text: 'Який прихований талант має?', icon: 'fa-star' },
  { id: 'q14', text: 'Як знімає стрес після роботи?', icon: 'fa-spa' },
  { id: 'q15', text: 'Що було б ідеальним подарунком?', icon: 'fa-gift' },
  { id: 'q16', text: 'Які іноземні мови знає?', icon: 'fa-language' },
  { id: 'q17', text: 'Яким спортом займається?', icon: 'fa-baseball' },
  { id: 'q18', text: 'Яким девайсом захоплюється?', icon: 'fa-laptop-code' },
  { id: 'q19', text: 'Хто для цієї людини є авторитетом?', icon: 'fa-crown' },
  { id: 'q20', text: 'Чи має сім\'ю/дітей?', icon: 'fa-house-chimney-user' },
  { id: 'q21', text: 'Якої звички хоче позбутися?', icon: 'fa-ban' },
  { id: 'q22', text: 'Що означає успіх для неї/нього?', icon: 'fa-trophy' },
  { id: 'q23', text: 'Яке було перше враження?', icon: 'fa-eye' },
  { id: 'q24', text: 'Що у вас спільного найбільше?', icon: 'fa-handshake' },
  { id: 'q25', text: 'Яку найкращу пораду давала?', icon: 'fa-lightbulb' },
  { id: 'q26', text: 'Як зазвичай проводить вихідні?', icon: 'fa-calendar-day' },
  { id: 'q27', text: 'Що мотивує зранку?', icon: 'fa-fire' },
  { id: 'q28', text: 'Любить активний відпочинок?', icon: 'fa-suitcase' },
  { id: 'q29', text: 'В якому місті минуло дитинство?', icon: 'fa-city' },
  { id: 'q30', text: 'Яким брендом телефону користується?', icon: 'fa-mobile-screen' },
  { id: 'q31', text: 'Яке авто в гаражі чи в мріях?', icon: 'fa-car' },
  { id: 'q32', text: 'Який стиль гумору полюбляє?', icon: 'fa-face-laugh-beam' },
  { id: 'q33', text: 'Де вчився/вчилася?', icon: 'fa-graduation-cap' },
  { id: 'q34', text: 'Який колір улюблений?', icon: 'fa-palette' },
  { id: 'q35', text: 'Чи любить настільні ігри?', icon: 'fa-dice' },
  { id: 'q36', text: 'Який останній подкаст слухав/ла?', icon: 'fa-microphone' },
  { id: 'q37', text: 'Що викликає найбільше роздратування?', icon: 'fa-bolt-lightning' },
  { id: 'q38', text: 'Яке ставлення до ШІ та технологій?', icon: 'fa-robot' },
  { id: 'q39', text: 'Чи волонтерить або допомагає іншим?', icon: 'fa-hand-holding-heart' },
  { id: 'q40', text: 'Яка головна професійна перемога?', icon: 'fa-medal' },
  { id: 'q41', text: 'Чи любить готувати вдома?', icon: 'fa-fire-burner' },
  { id: 'q42', text: 'Яке улюблене місце в місті?', icon: 'fa-map-location' },
  { id: 'q43', text: 'Чи збирає якісь колекції?', icon: 'fa-boxes-stacked' },
  { id: 'q44', text: 'Який стиль одягу віддає перевагу?', icon: 'fa-shirt' },
  { id: 'q45', text: 'Чи вірить у гороскопи/таро?', icon: 'fa-crystal-ball' },
  { id: 'q46', text: 'Яку навичку хоче опанувати наступною?', icon: 'fa-graduation-cap' },
  { id: 'q47', text: 'Яке ставлення до грошей та заощаджень?', icon: 'fa-piggy-bank' },
  { id: 'q48', text: 'Чи любить публічні виступи?', icon: 'fa-bullhorn' },
  { id: 'q49', text: 'Який найкращий спосіб зв\'язку з нею?', icon: 'fa-paper-plane' },
  { id: 'q50', text: 'Яка найбільша мрія на 5 років?', icon: 'fa-mountain' }
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

const InfoTab: React.FC<InfoTabProps> = ({ person, onUpdate, relationshipTypes, onAddRelType }) => {
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
      {/* КЛАСИФІКАЦІЯ ТА ЦИКЛ (ВГОРІ) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex items-center justify-between gap-3 group/select relative">
          <div className="min-w-0 flex-1">
             <Typography variant="tiny" className="text-slate-400 font-black uppercase text-[7px] mb-1 tracking-widest">Роль у нетворкінгу</Typography>
             <div className="relative flex items-center">
                <select 
                  value={person.status} 
                  onChange={e => onUpdate({ ...person, status: e.target.value })} 
                  className="w-full bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase focus:ring-2 focus:ring-orange-200 py-1.5 px-2 outline-none cursor-pointer text-slate-900 appearance-none pr-8 transition-all shadow-sm"
                >
                  {relationshipTypes.map(t => <option key={t} value={t}>{STATUS_LABELS[t] || t}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 text-[8px] text-slate-300 pointer-events-none transition-transform group-hover/select:translate-y-0.5"></i>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col justify-center">
          <Typography variant="tiny" className="text-slate-400 font-black uppercase text-[7px] mb-2 tracking-widest text-center">Цикл зв'язку</Typography>
          <div className="flex justify-between gap-1">
            {loops.map(l => (
              <button 
                key={l.val} 
                onClick={() => onUpdate({ ...person, loop: l.val })} 
                className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase transition-none border ${person.loop === l.val ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ПИТАННЯ ДЛЯ ЗБЛИЖЕННЯ */}
      {currentQuestions.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Typography variant="tiny" className="text-orange-500 font-black uppercase tracking-widest flex items-center gap-2 text-[8px]">
              <i className="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Питання для зближення
            </Typography>
            <span className="text-[7px] font-black text-slate-300 uppercase">Доступно {availableQuestions.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {currentQuestions.map(q => (
              <div key={q.id} className={`px-4 py-3 bg-orange-50/40 border rounded-[1.2rem] transition-none ${activeInputId === q.id ? 'border-orange-300 bg-white ring-2 ring-orange-50' : 'border-orange-100/40'}`}>
                <div 
                  onClick={() => { setActiveInputId(q.id); setInputValue(''); }}
                  className="flex items-center gap-3 cursor-pointer transition-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-white text-orange-500 flex items-center justify-center text-[10px] shadow-sm shrink-0 transition-none">
                    <i className={`fa-solid ${q.icon}`}></i>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 flex-1 leading-tight">{q.text}</span>
                </div>
                {activeInputId === q.id && (
                  <div className="mt-2.5 flex gap-2 transition-none">
                    <input autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveAnswer(q)} placeholder="Відповідь..." className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-200 transition-none" />
                    <button onClick={() => handleSaveAnswer(q)} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase transition-none shadow-sm">OK</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ЖУРНАЛ ФАКТІВ */}
      <section className="space-y-2">
        <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-1 text-[8px]">Журнал Фактів</Typography>
        <div className="space-y-1.5">
          {(person.notes || []).map(note => (
            <div key={note.id} className="group bg-white p-3.5 rounded-[1.2rem] border border-slate-100 shadow-sm transition-none">
               {editingNoteId === note.id ? (
                 <div className="flex gap-2 transition-none">
                    <input autoFocus value={editNoteValue} onChange={e => setEditNoteValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (onUpdate({...person, notes: person.notes.map(n => n.id === note.id ? {...n, text: editNoteValue} : n)}), setEditingNoteId(null))} className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none transition-none" />
                    <button onClick={() => {onUpdate({...person, notes: person.notes.map(n => n.id === note.id ? {...n, text: editNoteValue} : n)}); setEditingNoteId(null);}} className="text-emerald-500 font-black text-[9px] uppercase transition-none">OK</button>
                 </div>
               ) : (
                 <div className="flex justify-between items-start gap-4 transition-none">
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed flex-1">{note.text}</p>
                    <div className="flex gap-1.5 shrink-0 transition-none opacity-0 group-hover:opacity-100">
                       <button onClick={() => { setEditingNoteId(note.id); setEditNoteValue(note.text); }} className="text-slate-300 hover:text-orange-500 transition-none"><i className="fa-solid fa-pen text-[9px]"></i></button>
                       <button onClick={() => onUpdate({...person, notes: person.notes.filter(n => n.id !== note.id)})} className="text-slate-300 hover:text-rose-500 transition-none"><i className="fa-solid fa-trash-can text-[9px]"></i></button>
                    </div>
                 </div>
               )}
            </div>
          ))}
          {(!person.notes || person.notes.length === 0) && (
            <div className="text-center py-6 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200 transition-none">
               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Фактів ще немає</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InfoTab;
