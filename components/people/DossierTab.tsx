
import React, { useMemo } from 'react';
import { Person, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const MISSING_INFO_QUESTIONS = [
  { id: 'birthDate', text: 'Коли у тебе день народження?', field: 'birthDate', icon: 'fa-cake-candles' },
  { id: 'hobby', text: 'Чим любиш займатись у вільний час?', field: 'hobbies', icon: 'fa-masks-theater' },
  { id: 'goal', text: 'Яка твоя головна мета на цей рік?', field: 'description', icon: 'fa-bullseye' },
  { id: 'location', text: 'Де ти зараз територіально?', field: 'location', icon: 'fa-map-pin' },
  { id: 'telegram', text: 'Який у тебе телеграм?', field: 'socials.telegram', icon: 'fa-paper-plane' },
  { id: 'work', text: 'Над чим зараз найбільше працюєш?', field: 'tags', icon: 'fa-briefcase' },
];

interface DossierTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void;
}

const DossierTab: React.FC<DossierTabProps> = ({ person, onUpdate, onAddInteraction }) => {
  const age = useMemo(() => {
    if (!person.birthDate) return null;
    const birthDate = new Date(person.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [person.birthDate]);

  const pendingQuestions = useMemo(() => {
    return MISSING_INFO_QUESTIONS.filter(q => {
      if (q.field === 'socials.telegram') return !person.socials.telegram;
      if (q.field === 'hobbies') return person.hobbies.length === 0;
      if (q.field === 'tags') return person.tags.length === 0;
      const fieldParts = q.field.split('.');
      if (fieldParts.length > 1) {
          const val = (person as any)[fieldParts[0]]?.[fieldParts[1]];
          return !val;
      }
      const val = (person as any)[q.field];
      return !val || (Array.isArray(val) && val.length === 0);
    }).slice(0, 3);
  }, [person]);

  const handleAnswer = (q: typeof MISSING_INFO_QUESTIONS[0]) => {
    const val = prompt(q.text);
    if (val && val.trim()) {
      const answer = val.trim();
      let updates: Partial<Person> = {};
      if (q.field === 'socials.telegram') {
        updates.socials = { ...person.socials, telegram: answer };
      } else if (q.field === 'hobbies') {
        updates.hobbies = [...person.hobbies, answer];
      } else if (q.field === 'tags') {
        updates.tags = [...person.tags, answer];
      } else {
        (updates as any)[q.field] = answer;
      }
      onUpdate({ ...person, ...updates });
      onAddInteraction(`Дізнався інформацію (${q.id}): ${answer}`, 2, 'chat');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px]"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Typography variant="tiny" className="text-orange-500 mb-2 block font-black uppercase tracking-[0.2em]">Оперативне Досьє</Typography>
              <p className="text-sm md:text-base font-bold text-slate-100 leading-relaxed italic">
                {person.description || "Контекст знайомства не зафіксовано."}
              </p>
            </div>
            <div className="text-right shrink-0">
               <div className="text-[28px] font-black leading-none text-orange-500">{person.rating || 0}</div>
               <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Rating</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Вік / Характеристика</span>
              <span className="text-xs font-black text-white">{age ? `${age} років` : 'Вік не вказано'}</span>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Статус зв'язку</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{person.status}</span>
            </div>
          </div>
        </div>
      </section>

      {pendingQuestions.length > 0 && (
        <section className="space-y-3">
          <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-orange-500"></i> Missing Info Assistant
          </Typography>
          <div className="grid grid-cols-1 gap-2">
            {pendingQuestions.map(q => (
              <button key={q.id} onClick={() => handleAnswer(q)} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-md transition-all text-left group">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                  <i className={`fa-solid ${q.icon}`}></i>
                </div>
                <span className="text-xs font-bold text-slate-700 flex-1">{q.text}</span>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 ml-auto"></i>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md" className="bg-white border-slate-100 shadow-sm">
          <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black">Спеціалізація (Скіли)</Typography>
          <div className="flex flex-wrap gap-1.5">
            {person.tags?.length > 0 ? person.tags.map(t => (
              <Badge key={t} variant="indigo" className="text-[8px]">{t}</Badge>
            )) : <span className="text-[10px] text-slate-300 italic">Навички не вказані</span>}
          </div>
        </Card>
        <Card padding="md" className="bg-white border-slate-100 shadow-sm">
          <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black">Захоплення</Typography>
          <div className="flex flex-wrap gap-1.5">
            {person.hobbies.length > 0 ? person.hobbies.map(h => (
              <Badge key={h} variant="orange" className="text-[8px]">{h}</Badge>
            )) : <span className="text-[10px] text-slate-300 italic">Дані відсутні</span>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DossierTab;
