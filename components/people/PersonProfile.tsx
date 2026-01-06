
import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Person, Memory, Task, TaskStatus, ImportantDate } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { analyzePersonPortrait, analyzeSocialPresence } from '../../services/geminiService';

interface PersonProfileProps {
  personId: string;
  onClose: () => void;
}

const PersonProfile: React.FC<PersonProfileProps> = ({ personId, onClose }) => {
  const { 
    people, updatePerson, addPersonMemory, addPersonNote, character, 
    aiEnabled, deletePerson, tasks, addTask, updateTask, toggleTaskStatus,
    hobbies: globalHobbies, addHobby, relationshipTypes, addRelationshipType 
  } = useApp();
  
  const person = people.find(p => p.id === personId);
  
  const [activeTab, setActiveTab] = useState<'info' | 'memories' | 'tasks' | 'notes' | 'ai'>('info');
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newQuickTask, setNewQuickTask] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [showCustomStatusInput, setShowCustomStatusInput] = useState(false);
  const [customStatus, setCustomStatus] = useState('');
  const [newHobbyInput, setNewHobbyInput] = useState('');
  
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDateValue, setNewDateValue] = useState('');

  const personTasks = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.personId === personId);
  }, [tasks, personId]);

  if (!person) return null;

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemory.trim()) {
      addPersonMemory(person.id, {
        event: newMemory.trim(),
        emotion: 'joy',
        date: new Date().toISOString().split('T')[0]
      });
      setNewMemory('');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addPersonNote(person.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuickTask.trim()) {
      addTask(newQuickTask.trim(), 'tasks', undefined, 'actions', false, undefined, person.id);
      setNewQuickTask('');
    }
  };

  const updateRating = (r: number) => {
    updatePerson({ ...person, rating: Math.max(1, Math.min(10, r)) });
  };

  const handleAddCustomStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStatus.trim()) {
      const newStatus = customStatus.trim().toLowerCase();
      addRelationshipType(newStatus);
      updatePerson({ ...person, status: newStatus });
      setCustomStatus('');
      setShowCustomStatusInput(false);
    }
  };

  const handleAddHobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHobbyInput.trim()) {
      const name = newHobbyInput.trim();
      if (!globalHobbies.some(h => h.name.toLowerCase() === name.toLowerCase())) {
        addHobby(name);
      }
      if (!person.hobbies.includes(name)) {
        updatePerson({ ...person, hobbies: [...person.hobbies, name] });
      }
      setNewHobbyInput('');
    }
  };

  const removeHobby = (hName: string) => {
    updatePerson({ ...person, hobbies: person.hobbies.filter(h => h !== hName) });
  };

  const handleAddImportantDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDateLabel.trim() && newDateValue) {
      const newDate: ImportantDate = {
        id: Math.random().toString(36).substr(2, 9),
        label: newDateLabel.trim(),
        date: newDateValue
      };
      updatePerson({ ...person, importantDates: [...(person.importantDates || []), newDate] });
      setNewDateLabel('');
      setNewDateValue('');
    }
  };

  const removeImportantDate = (id: string) => {
    updatePerson({ ...person, importantDates: person.importantDates.filter(d => d.id !== id) });
  };

  const handleSyncAvatar = (provider: string, username: string) => {
    if (!username) return;
    const cleanUsername = username.replace('@', '').trim();
    if (!cleanUsername) return;

    let avatarUrl = '';
    const providerMap: Record<string, string> = {
      telegram: 'telegram',
      instagram: 'instagram',
      threads: 'instagram',
      linkedin: 'linkedin',
      tiktok: 'tiktok'
    };

    const mappedProvider = providerMap[provider];
    if (mappedProvider) {
      avatarUrl = `https://unavatar.io/${mappedProvider}/${cleanUsername}`;
    } else {
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`;
    }

    updatePerson({ ...person, avatar: avatarUrl });
  };

  const handleSocialScan = async (provider: string, handle: string) => {
    if (!aiEnabled) return;
    const context = prompt(`Вставте текст останніх постів або БІО з ${provider} для глибшого аналізу:`);
    if (!context && !handle) return;
    
    setIsScanning(provider);
    try {
      const data = await analyzeSocialPresence(provider, handle, context || undefined);
      
      // Update hobbies
      const newHobbies = [...new Set([...person.hobbies, ...data.hobbies])];
      data.hobbies.forEach((h: string) => {
        if (!globalHobbies.some(gh => gh.name.toLowerCase() === h.toLowerCase())) addHobby(h);
      });

      // Add found notes
      const newNotes = data.notes.map((n: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: `[AI Scan ${provider}]: ${n}`,
        date: new Date().toISOString().split('T')[0]
      }));

      updatePerson({
        ...person,
        hobbies: newHobbies,
        notes: [...newNotes, ...person.notes],
        description: (person.description || '') + (data.summary ? `\n\n[AI Висновок]: ${data.summary}` : '')
      });

      alert('Аналіз завершено! Хобі та нотатки оновлено.');
    } catch (e) {
      console.error(e);
      alert('Помилка сканування.');
    } finally {
      setIsScanning(null);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiEnabled) return;
    setIsAnalyzing(true);
    try {
      const portrait = await analyzePersonPortrait(person, character);
      updatePerson({ 
        ...person, 
        aiPortrait: { ...portrait, updatedAt: Date.now() } 
      });
      setActiveTab('ai');
    } catch (e) {
      console.error(e);
      alert('Помилка аналізу ШІ. Спробуйте пізніше.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusTranslations: Record<string, string> = {
    'friend': 'Друг',
    'colleague': 'Колега',
    'family': 'Сім\'я',
    'mentor': 'Ментор',
    'acquaintance': 'Знайомий'
  };

  const getTranslatedStatus = (status: string) => statusTranslations[status] || status;

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[550px] bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col">
       <header className="p-8 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 ring-4 ring-orange-50 overflow-hidden shadow-2xl relative group">
                <img 
                  src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`; }} 
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { const url = prompt('Вставте URL аватара:'); if(url) updatePerson({...person, avatar: url}); }}>
                   <i className="fa-solid fa-camera text-white text-lg"></i>
                </div>
             </div>
             <div className="flex-1">
                <input 
                   className="text-2xl font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full mb-1"
                   value={person.name}
                   onChange={e => updatePerson({ ...person, name: e.target.value })}
                />
                <div className="flex items-center gap-2">
                   {!showCustomStatusInput ? (
                     <div className="flex items-center gap-1">
                        <select 
                          className="bg-slate-100 border-none text-[9px] font-black uppercase tracking-widest rounded-lg py-1 px-2 focus:ring-0 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                          value={person.status}
                          onChange={e => updatePerson({ ...person, status: e.target.value })}
                        >
                           {relationshipTypes.map(t => (
                             <option key={t} value={t}>{getTranslatedStatus(t)}</option>
                           ))}
                           {!relationshipTypes.includes(person.status) && (
                             <option value={person.status}>{person.status}</option>
                           )}
                        </select>
                        <button 
                          onClick={() => setShowCustomStatusInput(true)} 
                          className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                          title="Додати новий тип зв'язку"
                        >
                          <i className="fa-solid fa-plus text-[8px]"></i>
                        </button>
                     </div>
                   ) : (
                     <form onSubmit={handleAddCustomStatus} className="flex gap-1 animate-in zoom-in-95">
                        <input 
                          autoFocus
                          value={customStatus}
                          onChange={e => setCustomStatus(e.target.value)}
                          placeholder="Новий тип..."
                          className="bg-slate-50 border border-orange-100 rounded-lg py-1 px-2 text-[9px] font-black uppercase focus:ring-0 outline-none w-28 shadow-inner"
                        />
                        <button type="submit" className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700"><i className="fa-solid fa-check text-[8px]"></i></button>
                        <button type="button" onClick={() => setShowCustomStatusInput(false)} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:text-rose-500"><i className="fa-solid fa-xmark text-[8px]"></i></button>
                     </form>
                   )}
                   <div className="flex items-center gap-1 ml-2 text-orange-500 cursor-pointer group" onClick={() => setIsEditingRating(!isEditingRating)}>
                      <i className="fa-solid fa-star text-xs group-hover:scale-125 transition-transform"></i>
                      <span className="text-sm font-black">{person.rating}</span>
                   </div>
                </div>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if(confirm('Видалити цей контакт назавжди?')) { deletePerson(person.id); onClose(); } }} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all shrink-0"><i className="fa-solid fa-xmark text-sm"></i></button>
          </div>
       </header>

       {isEditingRating && (
         <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200 shrink-0">
            <Typography variant="tiny" className="text-orange-400 mr-2 uppercase">ОЦІНИТИ:</Typography>
            {[1,2,3,4,5,6,7,8,9,10].map(r => (
              <button 
                key={r} 
                onClick={() => { updateRating(r); setIsEditingRating(false); }}
                className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all ${person.rating === r ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-orange-400 hover:bg-orange-100'}`}
              >
                {r}
              </button>
            ))}
         </div>
       )}

       <div className="flex border-b border-slate-50 px-4 shrink-0">
          {(['info', 'memories', 'tasks', 'notes', 'ai'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'info' ? 'Профіль' : tab === 'memories' ? 'Спогади' : tab === 'tasks' ? 'Завдання' : tab === 'notes' ? 'Нотатки' : 'ШІ Портрет'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'info' && (
            <div className="space-y-10 animate-in fade-in duration-300">
               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2">
                     <i className="fa-solid fa-circle-info text-orange-500"></i> Короткий опис
                  </Typography>
                  <textarea 
                    placeholder="Хто ця людина? Чим вона особлива? Важливі контексти..."
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[140px] resize-none"
                    value={person.description || ''}
                    onChange={e => updatePerson({ ...person, description: e.target.value })}
                  />
               </section>

               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2">
                    <i className="fa-solid fa-calendar-star text-orange-500"></i> Важливі дати
                  </Typography>
                  <div className="space-y-3 mb-6">
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-32 shrink-0">День народження</span>
                        <input 
                           type="date"
                           className="bg-transparent border-none p-0 text-sm font-bold flex-1 focus:ring-0 outline-none"
                           value={person.birthDate || ''}
                           onChange={e => updatePerson({ ...person, birthDate: e.target.value })}
                        />
                     </div>
                     {person.importantDates?.map(d => (
                       <div key={d.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                          <span className="text-[10px] font-black text-slate-700 uppercase w-32 shrink-0 truncate">{d.label}</span>
                          <span className="text-sm font-bold flex-1">{new Date(d.date).toLocaleDateString('uk-UA')}</span>
                          <button onClick={() => removeImportantDate(d.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                             <i className="fa-solid fa-xmark"></i>
                          </button>
                       </div>
                     ))}
                  </div>
                  <form onSubmit={handleAddImportantDate} className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                     <input 
                        placeholder="Назва події..."
                        className="flex-1 bg-white border-none rounded-xl py-2 px-3 text-[10px] font-bold outline-none"
                        value={newDateLabel}
                        onChange={e => setNewDateLabel(e.target.value)}
                     />
                     <input 
                        type="date"
                        className="bg-white border-none rounded-xl py-2 px-3 text-[10px] font-bold outline-none"
                        value={newDateValue}
                        onChange={e => setNewDateValue(e.target.value)}
                     />
                     <button type="submit" className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all">
                        <i className="fa-solid fa-plus text-[10px]"></i>
                     </button>
                  </form>
               </section>

               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2">
                    <i className="fa-solid fa-share-nodes text-orange-500"></i> Соціальні мережі
                  </Typography>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { key: 'telegram', icon: 'fa-telegram', color: 'sky', label: 'Telegram' },
                       { key: 'instagram', icon: 'fa-instagram', color: 'pink', label: 'Instagram' },
                       { key: 'linkedin', icon: 'fa-linkedin', color: 'blue', label: 'LinkedIn' },
                       { key: 'threads', icon: 'fa-at', color: 'slate', label: 'Threads' },
                       { key: 'tiktok', icon: 'fa-tiktok', color: 'black', label: 'TikTok' },
                       { key: 'website', icon: 'fa-globe', color: 'indigo', label: 'Website' }
                     ].map(soc => (
                       <div key={soc.key} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md relative">
                          <i className={`fa-brands ${soc.icon === 'fa-at' ? 'fa-solid' : 'fa-brands'} ${soc.icon} text-${soc.color}-500 text-lg w-6 text-center`}></i>
                          <input 
                             placeholder={soc.label}
                             className="bg-transparent border-none p-0 text-[11px] font-bold w-full focus:ring-0 outline-none pr-12"
                             value={(person.socials as any)[soc.key] || ''}
                             onChange={e => updatePerson({ ...person, socials: { ...person.socials, [soc.key]: e.target.value } })}
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {(person.socials as any)[soc.key] && (
                                <>
                                  <button 
                                    onClick={() => handleSyncAvatar(soc.key, (person.socials as any)[soc.key])}
                                    className="w-5 h-5 rounded bg-white shadow-sm flex items-center justify-center text-slate-300 hover:text-orange-500"
                                    title="Підтягнути аватар"
                                  >
                                    <i className="fa-solid fa-rotate text-[7px]"></i>
                                  </button>
                                  {aiEnabled && (
                                    <button 
                                      onClick={() => handleSocialScan(soc.key, (person.socials as any)[soc.key])}
                                      disabled={isScanning === soc.key}
                                      className={`w-5 h-5 rounded bg-white shadow-sm flex items-center justify-center text-slate-300 hover:text-indigo-500 ${isScanning === soc.key ? 'animate-spin' : ''}`}
                                      title="AI Сканування інтересів"
                                    >
                                      <i className="fa-solid fa-sparkles text-[7px]"></i>
                                    </button>
                                  )}
                                </>
                             )}
                          </div>
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <div className="flex justify-between items-center mb-4">
                    <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2">
                       <i className="fa-solid fa-icons text-orange-500"></i> Інтереси та Хобі
                    </Typography>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                     {person.hobbies.map(h => (
                       <Badge key={h} variant="orange" className="py-1.5 px-4 lowercase text-[11px] rounded-xl shadow-sm border-orange-100 group/badge">
                         {h}
                         <i onClick={() => removeHobby(h)} className="fa-solid fa-xmark ml-2 text-[8px] cursor-pointer opacity-0 group-hover/badge:opacity-100 hover:text-rose-500"></i>
                       </Badge>
                     ))}
                     {person.hobbies.length === 0 && <span className="text-[10px] text-slate-300 italic">Ще не вказано...</span>}
                  </div>
                  <form onSubmit={handleAddHobby} className="flex gap-2">
                    <input 
                       value={newHobbyInput}
                       onChange={e => setNewHobbyInput(e.target.value)}
                       placeholder="Додати хобі..."
                       className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                    <button type="submit" className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all"><i className="fa-solid fa-plus"></i></button>
                  </form>
               </section>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <Card padding="md" className="bg-slate-900 shadow-xl shadow-slate-200 border-none">
                  <form onSubmit={handleAddMemory} className="relative">
                    <Typography variant="tiny" className="text-orange-500 mb-3 block uppercase">НОВИЙ СПОГАД</Typography>
                    <textarea 
                        value={newMemory}
                        onChange={e => setNewMemory(e.target.value)}
                        placeholder="Яка подія відбулася? (Зустріч, дзвінок, проєкт...)"
                        className="w-full bg-slate-800 text-white rounded-2xl py-4 px-5 text-sm font-bold outline-none border border-slate-700 focus:border-orange-500 transition-all min-h-[100px] resize-none mb-4"
                    />
                    <div className="flex justify-between items-center">
                       <div className="flex gap-2">
                          {['joy', 'insight', 'support', 'neutral', 'sad'].map(emo => (
                             <button type="button" key={emo} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs" title={emo}>
                                <i className={`fa-solid ${emo === 'joy' ? 'fa-face-laugh-beam' : emo === 'insight' ? 'fa-lightbulb' : emo === 'support' ? 'fa-hand-holding-heart' : emo === 'sad' ? 'fa-face-frown' : 'fa-face-meh'}`}></i>
                             </button>
                          ))}
                       </div>
                       <Button type="submit" size="sm" className="rounded-xl px-6">ЗБЕРЕГТИ</Button>
                    </div>
                  </form>
               </Card>

               <div className="space-y-4">
                  {person.memories.map(m => (
                    <Card key={m.id} padding="md" className="bg-white border-slate-100 hover:border-orange-200 transition-all relative overflow-hidden group shadow-sm">
                       <div className="flex items-start gap-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${m.emotion === 'joy' ? 'bg-orange-50 text-orange-600' : m.emotion === 'insight' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                             <i className={`fa-solid ${m.emotion === 'joy' ? 'fa-sun' : m.emotion === 'insight' ? 'fa-brain' : 'fa-camera-retro'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-[12px] font-bold text-slate-700 mb-1 leading-relaxed">{m.event}</div>
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(m.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                       </div>
                    </Card>
                  ))}
                  {person.memories.length === 0 && (
                     <div className="py-20 text-center opacity-10">
                        <i className="fa-solid fa-camera-retro text-6xl mb-4"></i>
                        <Typography variant="h3">Немає спогадів</Typography>
                     </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <form onSubmit={handleAddQuickTask} className="space-y-3">
                  <Typography variant="tiny" className="text-slate-400 font-black uppercase">Пов'язане завдання</Typography>
                  <div className="flex gap-2">
                    <input 
                       value={newQuickTask}
                       onChange={e => setNewQuickTask(e.target.value)}
                       placeholder="Що потрібно зробити разом або делегувати?"
                       className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                    <button type="submit" className="w-12 h-12 bg-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><i className="fa-solid fa-bolt"></i></button>
                  </div>
               </form>

               <div className="space-y-3">
                  {personTasks.map(task => (
                    <div key={task.id} className={`p-4 bg-white border rounded-[1.5rem] shadow-sm flex items-center gap-4 group transition-all ${task.status === TaskStatus.DONE ? 'opacity-50 grayscale border-slate-100' : 'border-slate-100 hover:border-orange-200'}`}>
                       <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}
                       >
                          <i className="fa-solid fa-check text-[10px]"></i>
                       </button>
                       <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-bold truncate ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
                          <span className="text-[7px] font-black uppercase text-slate-300">{new Date(task.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                  ))}
                  {personTasks.length === 0 && (
                     <div className="py-20 text-center opacity-10">
                        <i className="fa-solid fa-list-check text-6xl mb-4"></i>
                        <Typography variant="h3">Немає пов'язаних завдань</Typography>
                     </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <form onSubmit={handleAddNote} className="space-y-3">
                  <Typography variant="tiny" className="text-slate-400 font-black uppercase">Швидка нотатка</Typography>
                  <div className="flex gap-2">
                    <input 
                       value={newNote}
                       onChange={e => setNewNote(e.target.value)}
                       placeholder="Що ти хочеш запам'ятати про цю людину?"
                       className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                    <button type="submit" className="w-12 h-12 bg-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><i className="fa-solid fa-paper-plane"></i></button>
                  </div>
               </form>

               <div className="space-y-3">
                  {person.notes.map(note => (
                    <div key={note.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                       <p className="text-[12px] font-medium text-slate-600 mb-3 leading-relaxed">"{note.text}"</p>
                       <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(note.date).toLocaleDateString()}</span>
                          <button className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-[80px] -mr-24 -mt-24"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -ml-16 -mb-16"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                       <Typography variant="h2" className="text-xl flex items-center gap-3 font-black">
                          <i className="fa-solid fa-sparkles text-orange-500"></i> AI ПОРТРЕТ ОСОБИСТОСТІ
                       </Typography>
                       <button 
                        onClick={handleGenerateAI}
                        disabled={isAnalyzing || !aiEnabled}
                        className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 ${isAnalyzing ? 'animate-spin' : ''}`}
                       >
                         <i className="fa-solid fa-rotate text-xs"></i>
                       </button>
                    </div>
                    
                    {person.aiPortrait ? (
                       <div className="space-y-8">
                          <div className="space-y-2">
                             <Typography variant="tiny" className="text-orange-500 font-black uppercase">Резюме характеру</Typography>
                             <p className="text-sm font-medium leading-relaxed text-slate-300 italic">"{person.aiPortrait.summary}"</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-3">
                                <Typography variant="tiny" className="text-slate-400 uppercase">Інтереси та фокус</Typography>
                                <div className="flex flex-wrap gap-1.5">
                                   {person.aiPortrait.interests.map(i => (
                                      <span key={i} className="text-[9px] font-black uppercase tracking-tight bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{i}</span>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-3">
                                <Typography variant="tiny" className="text-slate-400 uppercase">Тон комунікації</Typography>
                                <div className="text-[11px] font-bold text-slate-300 leading-tight">
                                   {person.aiPortrait.tone}
                                </div>
                             </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 space-y-4">
                             <Typography variant="tiny" className="text-orange-500 font-black uppercase">Поради для розмови:</Typography>
                             <ul className="space-y-3">
                                {person.aiPortrait.topics.map((topic, idx) => (
                                   <li key={idx} className="flex items-center gap-3 text-[11px] font-bold bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] shrink-0"></div>
                                      {topic}
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                    ) : (
                       <div className="py-20 text-center space-y-6">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-3xl opacity-20">
                             <i className="fa-solid fa-robot"></i>
                          </div>
                          <div className="max-w-[280px] mx-auto">
                             <p className="text-sm font-bold text-slate-400 mb-8">Запустіть аналіз Gemini, щоб сформувати унікальний портрет союзника на основі вашої взаємодії.</p>
                             <Button 
                                variant="primary" 
                                className="w-full py-4 rounded-2xl shadow-xl shadow-orange-500/10 uppercase tracking-widest font-black text-[10px]" 
                                onClick={handleGenerateAI}
                                disabled={isAnalyzing || !aiEnabled}
                                loading={isAnalyzing}
                             >
                                СФОРМУВАТИ ПОРТРЕТ
                             </Button>
                          </div>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          )}
       </div>

       <footer className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0">
          <Button variant="white" onClick={onClose} className="flex-1 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest shadow-sm">ЗАКРИТИ ПАНЕЛЬ</Button>
       </footer>

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
       `}</style>
    </div>
  );
};

export default PersonProfile;
