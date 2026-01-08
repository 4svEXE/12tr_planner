
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Person, Task, TaskStatus, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { analyzePersonPortrait } from '../../services/geminiService';

// --- PROPS INTERFACE ---
interface PersonProfileProps {
  personId: string;
  onClose: () => void;
}

// --- CONSTANTS ---
const MISSING_INFO_QUESTIONS = [
  { id: 'birthDate', text: 'Коли у тебе день народження?', field: 'birthDate', icon: 'fa-cake-candles' },
  { id: 'hobby', text: 'Чим любиш займатись у вільний час?', field: 'hobbies', icon: 'fa-masks-theater' },
  { id: 'goal', text: 'Яка твоя головна мета на цей рік?', field: 'description', icon: 'fa-bullseye' },
  { id: 'location', text: 'Де ти зараз територіально?', field: 'location', icon: 'fa-map-pin' },
  { id: 'telegram', text: 'Який у тебе телеграм?', field: 'socials.telegram', icon: 'fa-paper-plane' },
  { id: 'work', text: 'Над чим зараз найбільше працюєш?', field: 'tags', icon: 'fa-briefcase' },
];

// --- SUB-COMPONENTS ---

const DossierTab: React.FC<{ 
  person: Person; 
  onUpdate: (p: Person) => void;
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void;
}> = ({ person, onUpdate, onAddInteraction }) => {
  const age = useMemo(() => {
    if (!person.birthDate) return null;
    const birthDate = new Date(person.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [person.birthDate]);

  // Missing Info Assistant Logic with rotation
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
      // Log the discovery in the timeline
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

      {/* Missing Info Assistant */}
      {pendingQuestions.length > 0 && (
        <section className="space-y-3">
          <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-orange-500"></i> Missing Info Assistant
          </Typography>
          <div className="grid grid-cols-1 gap-2">
            {pendingQuestions.map(q => (
              <button 
                key={q.id}
                onClick={() => handleAnswer(q)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-md transition-all text-left group"
              >
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

const InfoTab: React.FC<{ 
  person: Person, 
  onUpdate: (p: Person) => void,
  onAddHobby: (h: string) => void,
  onAddSkill: (s: string) => void,
  relationshipTypes: string[],
  onAddRelType: (t: string) => void
}> = ({ person, onUpdate, onAddHobby, onAddSkill, relationshipTypes, onAddRelType }) => {
  const [hobbyInput, setHobbyInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const handleAddNewStatus = () => {
    const newType = prompt('Введіть назву нового статусу:');
    if (newType) onAddRelType(newType);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
        <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2"><i className="fa-solid fa-user-tag text-orange-500"></i> Класифікація</Typography>
        <div className="flex items-center gap-3">
          <select 
            value={person.status} 
            onChange={e => onUpdate({ ...person, status: e.target.value })}
            className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-orange-200 outline-none"
          >
            {relationshipTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleAddNewStatus} className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"><i className="fa-solid fa-plus text-xs"></i></button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
          <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-cake-candles text-orange-500"></i> День народження</Typography>
          <input type="date" value={person.birthDate || ''} onChange={e => onUpdate({ ...person, birthDate: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold outline-none" />
        </div>
        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
          <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-masks-theater text-indigo-500"></i> Хобі</Typography>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {person.hobbies.map(h => (
              <span key={h} className="bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-600 flex items-center gap-1.5">
                {h} <i onClick={() => onUpdate({...person, hobbies: person.hobbies.filter(x => x !== h)})} className="fa-solid fa-xmark text-[7px] text-slate-300 hover:text-rose-500 cursor-pointer"></i>
              </span>
            ))}
          </div>
          <input value={hobbyInput} onChange={e => setHobbyInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && hobbyInput.trim()) { onAddHobby(hobbyInput); setHobbyInput(''); }}} placeholder="+ додати..." className="w-full bg-white border border-slate-100 rounded-xl py-1.5 px-3 text-[10px] font-bold outline-none" />
        </div>
      </section>

      <section className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100">
        <Typography variant="tiny" className="text-indigo-600 mb-4 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-brain"></i> Професійні Скіли</Typography>
        <div className="flex flex-wrap gap-2 mb-4">
           {person.tags.map(tag => (
             <Badge key={tag} variant="indigo" className="py-1 px-3">
               {tag} <i onClick={() => onUpdate({...person, tags: person.tags.filter(t => t !== tag)})} className="fa-solid fa-xmark ml-2 cursor-pointer hover:text-rose-500"></i>
             </Badge>
           ))}
        </div>
        <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && skillInput.trim()) { onAddSkill(skillInput); setSkillInput(''); }}} placeholder="Напишіть навичку..." className="w-full bg-white border border-indigo-100 rounded-xl py-3 px-4 text-xs font-bold outline-none" />
      </section>

      <section>
        <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-scroll text-orange-500"></i> Біографія & Контекст</Typography>
        <textarea placeholder="Хто ця людина?.." className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[120px] resize-none shadow-inner" value={person.description || ''} onChange={e => onUpdate({ ...person, description: e.target.value })} />
      </section>
    </div>
  );
};

const TimelineTab: React.FC<{ 
  person: Person,
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void,
  onDeleteInteraction: (id: string) => void
}> = ({ person, onAddInteraction, onDeleteInteraction }) => {
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<Interaction['type']>('chat');

  const interactionIcons: Record<string, string> = {
    chat: 'fa-message',
    call: 'fa-phone',
    meeting: 'fa-users',
    coffee: 'fa-coffee',
    walk: 'fa-person-walking',
    event: 'fa-calendar-star'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card padding="md" className="bg-slate-900 shadow-xl border-none p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="tiny" className="text-orange-500 font-black uppercase tracking-[0.1em]">Лог контакту</Typography>
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
               {Object.keys(interactionIcons).map(t => (
                 <button 
                  key={t} 
                  onClick={() => setType(t as any)} 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${type === t ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <i className={`fa-solid ${interactionIcons[t]} text-[10px]`}></i>
                 </button>
               ))}
            </div>
          </div>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Про що говорили?.." className="w-full bg-slate-800 text-white rounded-2xl p-4 text-sm font-bold outline-none border border-slate-700 focus:border-orange-500 transition-all min-h-[100px] resize-none shadow-inner" />
          {/* Swapped Negative/Positive buttons order */}
          <div className="flex gap-3">
             <button onClick={() => { onAddInteraction(summary, 5, type); setSummary(''); }} disabled={!summary.trim()} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
               <i className="fa-solid fa-plus-circle"></i> ПОЗИТИВ (+5)
             </button>
             <button onClick={() => { onAddInteraction(summary, -5, type); setSummary(''); }} disabled={!summary.trim()} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-900/20">
               <i className="fa-solid fa-minus-circle"></i> НЕГАТИВ (-5)
             </button>
          </div>
        </div>
      </Card>

      <div className="relative space-y-6 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
        {(person.interactions || []).map(i => (
          <div key={i.id} className="relative pl-12 group">
             <div className={`absolute left-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border-2 border-white ${i.summary.includes('[Рейтинг -') ? 'bg-rose-500' : i.summary.includes('[Рейтинг +') ? 'bg-emerald-500' : 'bg-slate-500'} text-white`}>
                <i className={`fa-solid ${interactionIcons[i.type] || 'fa-circle-dot'} text-[10px]`}></i>
             </div>
             <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm group-hover:border-orange-200 transition-all">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(i.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                   <button onClick={() => onDeleteInteraction(i.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
                <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{i.summary}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const PersonProfile: React.FC<PersonProfileProps> = ({ personId, onClose }) => {
  const { 
    people, updatePerson, character, 
    aiEnabled, tasks, addTask, toggleTaskStatus,
    addInteraction, deleteInteraction, relationshipTypes, addRelationshipType
  } = useApp();
  
  const person = people.find(p => p.id === personId);
  const [activeTab, setActiveTab] = useState<'dossier' | 'info' | 'vcard' | 'timeline' | 'tasks' | 'ai'>('dossier');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskDate, setTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!person) return null;

  const handleUpdate = (updates: Partial<Person>) => updatePerson({ ...person, ...updates });

  const handleAddKarmaLog = (summary: string, ratingImpact: number, type: Interaction['type']) => {
    addInteraction(person.id, {
      summary: `${summary} [Рейтинг ${ratingImpact > 0 ? '+' : ''}${ratingImpact}]`,
      type,
      date: Date.now(),
      emotion: ratingImpact > 0 ? 'joy' : 'neutral'
    });
    const currentRating = person.rating || 0;
    handleUpdate({ rating: Math.max(0, Math.min(100, currentRating + ratingImpact)) });
  };

  const handleFetchSocialAvatar = (handle?: string) => {
    if (!handle) {
      handle = prompt("Введіть нікнейм (напр. oleg_dev):");
    }
    if (handle) {
      // Use unavatar.io for fetching based on handle
      const newAvatar = `https://unavatar.io/${handle}`;
      handleUpdate({ avatar: newAvatar });
    }
  };

  const handleGenerateAI = async () => {
    if (!aiEnabled) return;
    setIsAnalyzing(true);
    try {
      const portrait = await analyzePersonPortrait(person, character);
      handleUpdate({ aiPortrait: { ...portrait, updatedAt: Date.now() } });
      setActiveTab('ai');
    } catch (e) { alert('Помилка ШІ аналізу.'); } finally { setIsAnalyzing(false); }
  };

  const smartSuggestions = [
    { title: 'Кава', icon: 'fa-coffee' },
    { title: 'Дзвінок', icon: 'fa-phone' },
    { title: 'Нетворкінг', icon: 'fa-handshake' },
    { title: 'Привітати', icon: 'fa-cake-candles' }
  ];

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[580px] bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
       <header className="p-5 md:p-8 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
             <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-slate-50 ring-4 ring-orange-50 overflow-hidden shadow-xl relative group shrink-0">
                <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleFetchSocialAvatar()}>
                   <i className="fa-solid fa-camera text-white text-base"></i>
                </div>
             </div>
             <div className="flex-1 min-w-0">
                <input className="text-lg md:text-xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full mb-1 truncate" value={person.name} onChange={e => handleUpdate({ name: e.target.value })} />
                <div className="flex items-center gap-2">
                   <Badge variant="orange" className="text-[8px] uppercase">{person.status}</Badge>
                   <Badge variant="yellow" className="text-[8px] uppercase">Karma {person.rating || 0}</Badge>
                   <button onClick={() => handleFetchSocialAvatar()} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:text-orange-600 transition-colors"><i className="fa-solid fa-at text-[8px]"></i></button>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all shrink-0"><i className="fa-solid fa-xmark"></i></button>
       </header>

       <div className="flex border-b border-slate-50 px-2 md:px-4 shrink-0 overflow-x-auto no-scrollbar bg-white sticky top-0 z-30">
          {(['dossier', 'info', 'vcard', 'timeline', 'tasks', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-orange-600' : 'text-slate-400'}`}>
              {tab === 'dossier' ? 'Досьє' : tab === 'info' ? 'Дані' : tab === 'vcard' ? 'Профілі' : tab === 'timeline' ? 'Лог' : tab === 'tasks' ? 'Справи' : 'ШІ'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
          {activeTab === 'dossier' && <DossierTab person={person} onUpdate={handleUpdate} onAddInteraction={handleAddKarmaLog} />}
          
          {activeTab === 'info' && (
            <InfoTab 
              person={person} 
              onUpdate={handleUpdate} 
              onAddHobby={h => handleUpdate({ hobbies: [...person.hobbies, h.trim()] })} 
              onAddSkill={s => handleUpdate({ tags: [...person.tags, s.trim()] })}
              relationshipTypes={relationshipTypes}
              onAddRelType={addRelationshipType}
            />
          )}

          {activeTab === 'vcard' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-address-card text-orange-500"></i> Соціальні профілі</Typography>
                {['telegram', 'instagram', 'linkedin', 'tiktok', 'website'].map(key => (
                  <div key={key} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-inner shrink-0"><i className={`fa-brands fa-${key === 'website' ? 'chrome' : key}`}></i></div>
                    <div className="flex-1 min-w-0">
                       <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5">{key}</span>
                       <div className="flex items-center gap-2">
                         <input 
                           value={(person.socials as any)[key] || ''} 
                           onChange={e => handleUpdate({ socials: { ...person.socials, [key]: e.target.value } })}
                           placeholder={`Нікнейм або лінк...`}
                           className="flex-1 bg-transparent border-none p-0 text-xs font-bold outline-none text-slate-700"
                         />
                         {/* Button to fetch social avatar next to handle input */}
                         {key !== 'website' && (person.socials as any)[key] && (
                           <button 
                             onClick={() => handleFetchSocialAvatar((person.socials as any)[key])}
                             className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors shadow-sm"
                             title="Підтягнути аватар"
                           >
                             <i className="fa-solid fa-rotate text-[10px]"></i>
                           </button>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          )}

          {activeTab === 'timeline' && <TimelineTab person={person} onAddInteraction={handleAddKarmaLog} onDeleteInteraction={id => deleteInteraction(person.id, id)} />}

          {activeTab === 'tasks' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className="space-y-4">
                 <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest">Запланувати квест</Typography>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {smartSuggestions.map(s => (
                       <button key={s.title} onClick={() => addTask(`${s.title} з ${person.name}`, 'tasks', undefined, 'actions', true, new Date(taskDate).getTime(), person.id, TaskStatus.NEXT_ACTION)} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all flex flex-col items-center gap-1">
                          <i className={`fa-solid ${s.icon} text-orange-500 text-xs`}></i>
                          <span className="text-[8px] font-black uppercase">{s.title}</span>
                       </button>
                    ))}
                 </div>
                 <div className="flex flex-col md:flex-row gap-2">
                    <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-100" />
                    <input onKeyDown={e => { if(e.key === 'Enter' && (e.target as any).value) { addTask((e.target as any).value, 'tasks', undefined, 'actions', false, new Date(taskDate).getTime(), person.id, TaskStatus.NEXT_ACTION); (e.target as any).value = ''; }}} placeholder="Власна задача..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none" />
                 </div>
              </section>

              <section className="space-y-2">
                <Typography variant="tiny" className="text-slate-400 font-black uppercase">Активні справи</Typography>
                {tasks.filter(t => t.personId === person.id && !t.isDeleted).map(t => (
                  <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm hover:border-orange-200 transition-all">
                    <button onClick={() => toggleTaskStatus(t)} className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-orange-400'}`}>
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
          )}

          {activeTab === 'ai' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              {!aiEnabled ? (
                <Card className="bg-orange-50 border-orange-200 p-8 text-center flex flex-col items-center">
                   <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-2xl mb-4 shadow-inner">
                      <i className="fa-solid fa-lock"></i>
                   </div>
                   <Typography variant="h3" className="mb-2 text-orange-900">ШІ-Стратег вимкнено</Typography>
                   <p className="text-xs text-orange-600/70 leading-relaxed max-w-xs">
                     Увімкніть ШІ в налаштуваннях системи, щоб Gemini проаналізувала історію ваших взаємодій.
                   </p>
                </Card>
              ) : (
                <section className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px]"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                       <Typography variant="h2" className="text-xl flex items-center gap-3 font-black uppercase text-white tracking-tight">
                          <i className="fa-solid fa-sparkles text-orange-500"></i> AI СТРАТЕГІЯ
                       </Typography>
                       <button onClick={handleGenerateAI} disabled={isAnalyzing} className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 ${isAnalyzing ? 'animate-spin' : ''}`}><i className="fa-solid fa-rotate text-xs"></i></button>
                    </div>
                    {person.aiPortrait ? (
                       <div className="space-y-6">
                          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                             <Typography variant="tiny" className="text-orange-500 mb-3 block font-black uppercase tracking-widest text-[8px]">Психологічний Профіль</Typography>
                             <p className="text-sm font-medium leading-relaxed text-slate-300 italic">"{person.aiPortrait.summary}"</p>
                          </div>
                          <div className="space-y-4">
                             <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Рекомендовані теми:</Typography>
                             <div className="space-y-2">
                                {person.aiPortrait.topics?.map((t: string, i: number) => (
                                   <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-bold text-slate-300 flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover/item:scale-150 transition-transform"></div> {t}
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="py-20 text-center space-y-6 flex flex-col items-center">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl opacity-20"><i className="fa-solid fa-robot"></i></div>
                          <p className="text-sm font-bold text-slate-400 max-w-xs">ШІ проаналізує всі нотатки та історію взаємодій, щоб підказати точки впливу.</p>
                          <Button variant="primary" className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20" onClick={handleGenerateAI} disabled={isAnalyzing}>СФОРМУВАТИ ПОРТРЕТ</Button>
                       </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
       </div>

       <footer className="p-5 md:p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0 mb-safe">
          <Button variant="white" onClick={onClose} className="flex-1 rounded-2xl py-3.5 font-black uppercase text-[10px] tracking-widest shadow-sm">ПОВЕРНУТИСЬ</Button>
       </footer>
    </div>
  );
};

export default PersonProfile;
