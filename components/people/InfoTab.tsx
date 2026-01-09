
import React, { useState } from 'react';
import { Person, RelationshipLoop } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

interface InfoTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onAddHobby: (h: string) => void;
  onAddSkill: (s: string) => void;
  relationshipTypes: string[];
  onAddRelType: (t: string) => void;
}

const InfoTab: React.FC<InfoTabProps> = ({ person, onUpdate, onAddHobby, onAddSkill, relationshipTypes, onAddRelType }) => {
  const [hobbyInput, setHobbyInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const statusTranslations: Record<string, string> = {
    'friend': 'Друг',
    'colleague': 'Колега',
    'family': 'Сім\'я',
    'mentor': 'Ментор',
    'acquaintance': 'Знайомий'
  };

  const handleAddNewStatus = () => {
    const newType = prompt('Введіть назву нового статусу:');
    if (newType) onAddRelType(newType);
  };

  const loops: { val: RelationshipLoop; label: string }[] = [
    { val: 'week', label: 'Тиждень' },
    { val: 'month', label: 'Місяць' },
    { val: 'quarter', label: 'Квартал' },
    { val: 'year', label: 'Рік' },
    { val: 'none', label: 'Вимк.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* КЛАСИФІКАЦІЯ */}
      <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
        <div className="space-y-3">
          <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2">
            <i className="fa-solid fa-user-tag text-orange-500"></i> Класифікація
          </Typography>
          <div className="flex items-center gap-3">
            <select 
              value={person.status} 
              onChange={e => onUpdate({ ...person, status: e.target.value })}
              className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-orange-200 outline-none shadow-sm cursor-pointer"
            >
              {relationshipTypes.map(t => (
                <option key={t} value={t}>{statusTranslations[t] || t}</option>
              ))}
            </select>
            <button onClick={handleAddNewStatus} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-orange-600 transition-all shadow-sm">
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2">
            <i className="fa-solid fa-arrows-spin text-indigo-500"></i> Цикл зв'язку
          </Typography>
          <div className="flex flex-wrap gap-1.5">
            {loops.map(l => (
              <button
                key={l.val}
                onClick={() => onUpdate({ ...person, loop: l.val })}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight border transition-all ${
                  person.loop === l.val 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ХОБІ ТА СКІЛИ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
          <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black flex items-center gap-2">
            <i className="fa-solid fa-masks-theater text-indigo-500"></i> Хобі
          </Typography>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(person.hobbies || []).map(h => (
              <span key={h} className="bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-600 flex items-center gap-1.5">
                {h} <i onClick={() => onUpdate({...person, hobbies: person.hobbies.filter(x => x !== h)})} className="fa-solid fa-xmark text-[7px] text-slate-300 hover:text-rose-500 cursor-pointer"></i>
              </span>
            ))}
          </div>
          <input value={hobbyInput} onChange={e => setHobbyInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && hobbyInput.trim()) { onAddHobby(hobbyInput); setHobbyInput(''); }}} placeholder="+ додати..." className="w-full bg-white border border-slate-100 rounded-xl py-1.5 px-3 text-[10px] font-bold outline-none shadow-sm" />
        </div>

        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
          <Typography variant="tiny" className="text-indigo-600 mb-3 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-brain"></i> Професійні Скіли</Typography>
          <div className="flex flex-wrap gap-2 mb-4">
            {(person.tags || []).map(tag => (
              <Badge key={tag} variant="indigo" className="py-1 px-3">
                {tag} <i onClick={() => onUpdate({...person, tags: person.tags.filter(t => t !== tag)})} className="fa-solid fa-xmark ml-2 cursor-pointer hover:text-rose-500"></i>
              </Badge>
            ))}
          </div>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && skillInput.trim()) { onAddSkill(skillInput); setSkillInput(''); }}} placeholder="Напишіть навичку..." className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold outline-none shadow-sm" />
        </div>
      </section>

      {/* БІОГРАФІЯ */}
      <section>
        <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-scroll text-orange-500"></i> Біографія & Контекст</Typography>
        <textarea placeholder="Хто ця людина? Де познайомились?.." className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[120px] resize-none shadow-inner" value={person.description || ''} onChange={e => onUpdate({ ...person, description: e.target.value })} />
      </section>
    </div>
  );
};

export default InfoTab;
