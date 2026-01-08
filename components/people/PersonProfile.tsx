
import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Person, Memory, Task, TaskStatus, ImportantDate, Interaction, RelationshipLoop } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { analyzePersonPortrait, analyzeSocialPresence } from '../../services/geminiService';

interface PersonProfileProps {
  personId: string;
  onClose: () => void;
}

const QUESTION_POOL = [
  { id: 'q_hobby', label: 'Хобі', text: 'Чим ти зараз захоплюєшся у вільний час?', keywords: ['хобі', 'захоплення', 'інтерес', 'займається'] },
  { id: 'q_birth', label: 'ДН', text: 'Коли у тебе день народження? Хочу записати, щоб не проґавити.', keywords: ['день народження', 'народився', 'дн'] },
  { id: 'q_dream', label: 'Мрія', text: 'Яка твоя найбільша амбітна ціль на цей рік?', keywords: ['мрія', 'ціль', 'план', 'прагне'] },
  { id: 'q_child', label: 'Дитинство', text: 'Ким ти мріяв стати в дитинстві? Чи щось з цього справдилось?', keywords: ['дитинств', 'дитина', 'мріяв стати'] },
  { id: 'q_relax', label: 'Спокій', text: 'Що допомагає тобі максимально розслабитись після важкого дня?', keywords: ['відпочинок', 'релакс', 'розслаблення', 'спокій'] },
  { id: 'q_book', label: 'Книги', text: 'Яка книга або фільм змінили твій світогляд останнім часом?', keywords: ['книга', 'фільм', 'кіно', 'читав'] },
  { id: 'q_work', label: 'Професія', text: 'Як ти прийшов у свою професію? Це був випадковий вибір чи покликання?', keywords: ['професія', 'робота', 'кар’єра', 'фах'] },
  { id: 'q_travel', label: 'Подорожі', text: 'Яке місце на планеті справило на тебе найсильніше враження?', keywords: ['подорож', 'країна', 'місто', 'мандри'] },
  { id: 'q_value', label: 'Цінність', text: 'Яка риса в людях для тебе найважливіша?', keywords: ['цінність', 'якість', 'риси', 'важливо в людях'] },
  { id: 'q_morning', label: 'Ранок', text: 'Як виглядає твій ідеальний ранок?', keywords: ['ранок', 'рутина', 'сніданок'] },
];

const PersonProfile: React.FC<PersonProfileProps> = ({ personId, onClose }) => {
  const { 
    people, updatePerson, addPersonNote, character, 
    aiEnabled, tasks, addTask, toggleTaskStatus,
    hobbies: globalHobbies, relationshipTypes,
    addInteraction, deleteInteraction
  } = useApp();
  
  const person = people.find(p => p.id === personId);
  
  const [activeTab, setActiveTab] = useState<'dossier' | 'info' | 'vcard' | 'timeline' | 'tasks' | 'ai'>('dossier');
  const [newInteraction, setNewInteraction] = useState('');
  const [interactionType, setInteractionType] = useState<Interaction['type']>('chat');
  const [interactionEmotion, setInteractionEmotion] = useState<Interaction['emotion']>('neutral');
  
  const [newQuickTask, setNewQuickTask] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerValue, setAnswerValue] = useState('');
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDateValue, setNewDateValue] = useState('');
  const [newHobbyInput, setNewHobbyInput] = useState('');

  const personTasks = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.personId === personId);
  }, [tasks, personId]);

  if (!person) return null;

  const missingInfoQuestions = useMemo(() => {
    const allNotesText = (person.notes?.map(n => n.text).join(' ') || '') + 
                         (person.description || '') + 
                         (person.interactions?.map(i => i.summary).join(' ') || '');
    
    const available = QUESTION_POOL.filter(q => {
      if (q.id === 'q_birth' && person.birthDate) return false;
      if (q.id === 'q_hobby' && person.hobbies.length > 0) return false;
      const hasInfo = q.keywords.some(word => allNotesText.toLowerCase().includes(word.toLowerCase()));
      return !hasInfo;
    });

    return available.slice(0, 3);
  }, [person.notes, person.description, person.interactions, person.birthDate, person.hobbies]);

  const handleSaveAnswer = (q: typeof QUESTION_POOL[0]) => {
    if (!answerValue.trim()) {
      setAnsweringId(null);
      return;
    }
    const formattedNote = `[${q.label}] Питання: ${q.text}\nВідповідь: ${answerValue.trim()}`;
    addPersonNote(person.id, formattedNote);
    setAnswerValue('');
    setAnsweringId(null);
  };

  const handleAddHobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHobbyInput.trim() && !person.hobbies.includes(newHobbyInput.trim())) {
      updatePerson({ ...person, hobbies: [...person.hobbies, newHobbyInput.trim()] });
      setNewHobbyInput('');
    }
  };

  const removeHobby = (h: string) => {
    updatePerson({ ...person, hobbies: person.hobbies.filter(x => x !== h) });
  };

  const handleAddImportantDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDateLabel.trim() && newDateValue) {
      const newDates = [...(person.importantDates || []), { 
        id: Math.random().toString(36).substr(2, 9), 
        label: newDateLabel.trim(), 
        date: newDateValue 
      }];
      updatePerson({ ...person, importantDates: newDates });
      setNewDateLabel('');
      setNewDateValue('');
    }
  };

  const removeImportantDate = (id: string) => {
    updatePerson({ ...person, importantDates: person.importantDates.filter(d => d.id !== id) });
  };

  const syncAvatarFromSocial = (type: 'tg' | 'url') => {
    if (type === 'tg' && person.socials.telegram) {
      const username = person.socials.telegram.replace('@', '').replace('https://t.me/', '');
      updatePerson({ ...person, avatar: `https://t.me/i/userpic/320/${username}.jpg` });
    } else {
      const url = prompt('Вставте URL зображення:');
      if (url) updatePerson({ ...person, avatar: url });
    }
  };

  const planQuickEvent = (type: string, title: string) => {
    addTask(`${title}: ${person.name}`, 'tasks', undefined, 'actions', true, Date.now() + (1000 * 60 * 60 * 24), person.id, TaskStatus.NEXT_ACTION);
    alert(`Подію "${title}" заплановано на завтра!`);
  };

  const handleSocialChange = (key: keyof Person['socials'], value: string) => {
    updatePerson({
      ...person,
      socials: { ...person.socials, [key]: value }
    });
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteraction.trim()) return;
    addInteraction(person.id, {
      type: interactionType,
      date: Date.now(),
      summary: newInteraction.trim(),
      emotion: interactionEmotion
    });
    setNewInteraction('');
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickTask.trim()) return;
    addTask(newQuickTask.trim(), 'tasks', undefined, 'actions', false, undefined, person.id, TaskStatus.NEXT_ACTION);
    setNewQuickTask('');
  };

  const handleGenerateAI = async () => {
    if (!aiEnabled) return;
    setIsAnalyzing(true);
    try {
      const portrait = await analyzePersonPortrait(person, character);
      updatePerson({ ...person, aiPortrait: { ...portrait, updatedAt: Date.now() } });
      setActiveTab('ai');
    } catch (e) { alert('Помилка ШІ аналізу.'); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[580px] bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col">
       <header className="p-5 md:p-8 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 md:gap-5">
             <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-slate-50 ring-4 ring-orange-50 overflow-hidden shadow-xl relative group shrink-0">
                <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => syncAvatarFromSocial('url')}>
                   <i className="fa-solid fa-camera text-white text-base"></i>
                </div>
             </div>
             <div className="flex-1 min-w-0">
                <input className="text-lg md:text-xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full mb-1 truncate" value={person.name} onChange={e => updatePerson({ ...person, name: e.target.value })} />
                <div className="flex items-center gap-2 md:gap-3">
                   <select className="bg-slate-100 border-none text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg py-1 px-1.5 md:px-2 focus:ring-0 outline-none" value={person.status} onChange={e => updatePerson({ ...person, status: e.target.value })}>
                      {relationshipTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <select className="bg-orange-50 text-orange-600 border-none text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg py-1 px-1.5 md:px-2 focus:ring-0 outline-none" value={person.loop} onChange={e => updatePerson({ ...person, loop: e.target.value as any })}>
                      <option value="none">Без циклу</option>
                      <option value="week">Тиждень</option>
                      <option value="month">Місяць</option>
                      <option value="quarter">Квартал</option>
                      <option value="year">Рік</option>
                   </select>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all shrink-0"><i className="fa-solid fa-xmark"></i></button>
       </header>

       <div className="flex border-b border-slate-50 px-2 md:px-4 shrink-0 overflow-x-auto no-scrollbar bg-white sticky top-0 z-30">
          {(['dossier', 'info', 'vcard', 'timeline', 'tasks', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-orange-600' : 'text-slate-400'}`}>
              {tab === 'dossier' ? 'Досьє' : tab === 'info' ? 'Дані' : tab === 'vcard' ? 'Візитка' : tab === 'timeline' ? 'Таймлайн' : tab === 'tasks' ? 'Справи' : 'ШІ'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 space-y-6 md:space-y-8">
          {activeTab === 'dossier' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <section className="bg-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px]"></div>
                   <div className="relative z-10 space-y-6">
                      <div>
                         <Typography variant="tiny" className="text-orange-500 mb-2 block font-black uppercase tracking-[0.2em]">Профайл союзника</Typography>
                         <p className="text-sm md:text-base font-bold text-slate-100 leading-relaxed italic">
                           {person.description || "Інформація про контекст знайомства та роль людини в системі поки не заповнена."}
                         </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Останній контакт</span>
                            <span className="text-xs font-black text-white">{person.lastInteractionAt ? new Date(person.lastInteractionAt).toLocaleDateString('uk-UA') : '—'}</span>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Статус зв'язку</span>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{person.loop !== 'none' ? person.loop : 'Вільний'}</span>
                         </div>
                      </div>
                   </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Card padding="md" className="bg-white border-slate-100 shadow-sm">
                      <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black">Хобі та інтереси</Typography>
                      <div className="flex flex-wrap gap-1.5">
                         {person.hobbies.length > 0 ? person.hobbies.map(h => (
                           <Badge key={h} variant="orange" className="text-[8px]">{h}</Badge>
                         )) : <span className="text-[10px] text-slate-300 italic">Не вказано</span>}
                      </div>
                   </Card>
                   <Card padding="md" className="bg-white border-slate-100 shadow-sm">
                      <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black">Цифрові канали</Typography>
                      <div className="flex gap-2">
                         {Object.entries(person.socials).map(([key, val]) => val && (
                           <div key={key} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><i className={`fa-brands fa-${key === 'website' ? 'chrome' : key}`}></i></div>
                         ))}
                         {Object.values(person.socials).every(v => !v) && <span className="text-[10px] text-slate-300 italic">Порожньо</span>}
                      </div>
                   </Card>
                </div>

                <section>
                   <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black">Свіжі нотатки</Typography>
                   <div className="space-y-2">
                      {person.notes?.slice(0, 3).map(n => (
                        <div key={n.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                           <div className="text-[7px] font-black text-slate-300 uppercase mb-1">{new Date(n.date).toLocaleDateString('uk-UA')}</div>
                           <p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-relaxed">{n.text}</p>
                        </div>
                      ))}
                      {(!person.notes || person.notes.length === 0) && (
                        <div className="text-center py-6 text-[10px] text-slate-300 italic">Дані відсутні</div>
                      )}
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                     <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-cake-candles text-orange-500"></i> День народження</Typography>
                     <input type="date" value={person.birthDate || ''} onChange={e => updatePerson({ ...person, birthDate: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-100" />
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                     <Typography variant="tiny" className="text-slate-400 mb-3 uppercase font-black flex items-center gap-2"><i className="fa-solid fa-masks-theater text-indigo-500"></i> Хобі</Typography>
                     <div className="flex flex-wrap gap-1.5 mb-3">
                        {person.hobbies.map(h => (
                          <span key={h} className="bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-600 flex items-center gap-1.5 shadow-sm group/h">
                            {h}
                            <i onClick={() => removeHobby(h)} className="fa-solid fa-xmark text-[7px] text-slate-300 hover:text-rose-500 cursor-pointer"></i>
                          </span>
                        ))}
                     </div>
                     <form onSubmit={handleAddHobby}>
                        <input value={newHobbyInput} onChange={e => setNewHobbyInput(e.target.value)} placeholder="+ додати..." className="w-full bg-white border border-slate-100 rounded-xl py-1.5 px-3 text-[10px] font-bold outline-none" />
                     </form>
                  </div>
               </section>

               <section className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl rotate-12"><i className="fa-solid fa-wand-magic-sparkles text-orange-400"></i></div>
                  <Typography variant="tiny" className="text-orange-600 mb-4 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <i className="fa-solid fa-circle-nodes"></i> Квести знайомства
                  </Typography>
                  <div className="space-y-3">
                     {missingInfoQuestions.map((q) => (
                       <div key={q.id} className="bg-white/80 p-4 rounded-2xl border border-orange-50 shadow-sm hover:shadow-md transition-all group/q">
                          <div className="flex items-start justify-between gap-3 mb-2">
                             <div className="flex-1">
                                <span className="text-orange-600 uppercase text-[8px] font-black block mb-1 tracking-widest">[{q.label}]</span>
                                <p className="text-[11px] font-bold text-slate-700 leading-snug">"{q.text}"</p>
                             </div>
                             <button onClick={() => setAnsweringId(answeringId === q.id ? null : q.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${answeringId === q.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-orange-100 text-orange-500 hover:bg-orange-200'}`}>
                                <i className={`fa-solid ${answeringId === q.id ? 'fa-pen-nib' : 'fa-reply-all'} text-[10px]`}></i>
                             </button>
                          </div>
                          {answeringId === q.id && (
                             <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                                <textarea autoFocus value={answerValue} onChange={e => setAnswerValue(e.target.value)} placeholder="Запишіть відповідь..." className="w-full bg-slate-50 border border-orange-100 rounded-xl p-3 text-[11px] font-medium focus:ring-2 focus:ring-orange-300 outline-none min-h-[60px] resize-none" />
                                <div className="flex gap-2">
                                   <button onClick={() => handleSaveAnswer(q)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">ЗБЕРЕГТИ</button>
                                   <button onClick={() => setAnsweringId(null)} className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase">ВІДМІНА</button>
                                </div>
                             </div>
                          )}
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-scroll text-orange-500"></i> Біографія та Контекст</Typography>
                  <textarea placeholder="Хто ця людина? Чим вона особлива?.." className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[120px] resize-none shadow-inner" value={person.description || ''} onChange={e => updatePerson({ ...person, description: e.target.value })} />
               </section>
            </div>
          )}

          {activeTab === 'vcard' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <section className="space-y-4">
                   <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-address-card text-orange-500"></i> Соціальні мережі</Typography>
                   <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'telegram', icon: 'fa-brands fa-telegram', label: 'Telegram', placeholder: '@username', color: 'sky' },
                        { key: 'instagram', icon: 'fa-brands fa-instagram', label: 'Instagram', placeholder: 'username', color: 'pink' },
                        { key: 'linkedin', icon: 'fa-brands fa-linkedin', label: 'LinkedIn', placeholder: 'url/in/name', color: 'blue' },
                        { key: 'threads', icon: 'fa-brands fa-threads', label: 'Threads', placeholder: '@name', color: 'slate' },
                        { key: 'tiktok', icon: 'fa-brands fa-tiktok', label: 'TikTok', placeholder: '@name', color: 'slate' },
                        { key: 'website', icon: 'fa-solid fa-globe', label: 'Сайт', placeholder: 'https://...', color: 'emerald' }
                      ].map(social => (
                        <div key={social.key} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 group transition-all focus-within:ring-2 focus-within:ring-orange-100 focus-within:bg-white shadow-sm">
                           <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-${social.color}-500 shadow-sm`}><i className={social.icon}></i></div>
                           <div className="flex-1">
                              <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5">{social.label}</span>
                              <input 
                                value={(person.socials as any)[social.key] || ''} 
                                onChange={e => handleSocialChange(social.key as any, e.target.value)}
                                placeholder={social.placeholder}
                                className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 outline-none text-slate-800"
                              />
                           </div>
                           {social.key === 'telegram' && (person.socials as any)[social.key] && (
                             <button onClick={() => syncAvatarFromSocial('tg')} className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                               <i className="fa-solid fa-sync text-[10px]"></i>
                             </button>
                           )}
                        </div>
                      ))}
                   </div>
                </section>
             </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <Card padding="md" className="bg-slate-900 shadow-xl border-none p-6 md:p-8">
                  <form onSubmit={handleAddInteractionLog} className="space-y-4">
                    <Typography variant="tiny" className="text-orange-500 font-black uppercase">Записати контакт</Typography>
                    <textarea value={newInteraction} onChange={e => setNewInteraction(e.target.value)} placeholder="Про що говорили?.." className="w-full bg-slate-800 text-white rounded-2xl p-4 text-sm font-bold outline-none border border-slate-700 focus:border-orange-500 transition-all min-h-[100px] resize-none shadow-inner" />
                    <div className="flex flex-wrap justify-between items-center gap-4">
                       <div className="flex gap-1.5 p-1 bg-slate-800 rounded-xl">
                          {(['chat', 'call', 'meeting', 'coffee'] as const).map(type => (
                            <button type="button" key={type} onClick={() => setInteractionType(type)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${interactionType === type ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                               <i className={`fa-solid ${type === 'call' ? 'fa-phone' : type === 'meeting' ? 'fa-users' : type === 'chat' ? 'fa-message' : 'fa-coffee'} text-[10px]`}></i>
                            </button>
                          ))}
                       </div>
                       <Button type="submit" size="sm" className="rounded-xl px-6 font-black uppercase text-[9px] tracking-widest h-10">ЗБЕРЕГТИ</Button>
                    </div>
                  </form>
               </Card>

               <div className="relative space-y-6 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
                  {(person.interactions || []).map(i => (
                    <div key={i.id} className="relative pl-12 group">
                       <div className={`absolute left-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border-2 border-white bg-slate-500 text-white`}>
                          <i className={`fa-solid ${i.type === 'call' ? 'fa-phone' : i.type === 'meeting' ? 'fa-users' : i.type === 'chat' ? 'fa-message' : 'fa-coffee'} text-[10px]`}></i>
                       </div>
                       <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm group-hover:border-orange-200 transition-all">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(i.date).toLocaleDateString('uk-UA')}</span>
                             <button onClick={() => deleteInteraction(person.id, i.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                          </div>
                          <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{i.summary}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
               <form onSubmit={handleAddQuickTask} className="space-y-3">
                  <Typography variant="tiny" className="text-slate-400 font-black uppercase">Запланувати справу</Typography>
                  <div className="flex gap-2">
                    <input value={newQuickTask} onChange={e => setNewQuickTask(e.target.value)} placeholder="Написати, привітати..." className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none shadow-inner" />
                    <button type="submit" className="w-12 h-12 bg-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0"><i className="fa-solid fa-bolt"></i></button>
                  </div>
               </form>
               <div className="space-y-2">
                  {personTasks.map(task => (
                    <div key={task.id} className={`p-4 bg-white border rounded-2xl flex items-center gap-4 transition-all shadow-sm ${task.status === TaskStatus.DONE ? 'opacity-40 grayscale' : 'hover:border-orange-200'}`}>
                       <button onClick={() => toggleTaskStatus(task)} className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white'}`}>
                          {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
                       </button>
                       <span className={`text-[12px] font-bold flex-1 truncate ${task.status === TaskStatus.DONE ? 'line-through' : 'text-slate-700'}`}>{task.title}</span>
                    </div>
                  ))}
               </div>
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
