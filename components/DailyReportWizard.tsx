
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { TaskStatus, Person, Task } from '../types';

interface DailyReportWizardProps {
  onClose: () => void;
}

type Step = 'mood' | 'gratitude_people' | 'gratitude_self' | 'positive_events' | 'habits' | 'victory' | 'ideas';

const DailyReportWizard: React.FC<DailyReportWizardProps> = ({ onClose }) => {
  const { 
    people, tasks, character, updateCharacter, 
    addPerson, saveDiaryEntry, toggleHabitStatus, addInteraction
  } = useApp();

  const [currentStep, setCurrentStep] = useState<Step>('mood');
  const [personSearch, setPersonSearch] = useState('');
  
  // Локальний кеш для нових людей, щоб вони не зникали до оновлення контексту
  const [localNewPeople, setLocalNewPeople] = useState<Person[]>([]);

  const [reportData, setReportData] = useState({
    mood: 3,
    energy: 80,
    selectedPeople: [] as string[],
    peopleGratitude: {} as Record<string, string>,
    gratitudeSelf: '',
    positiveEvents: '',
    habitReflections: {} as Record<string, string>,
    ideas: '',
    mainVictoryId: ''
  });

  const todayDateStr = new Date().toISOString().split('T')[0];
  const moodIcons = ['😫', '😐', '🙂', '😊', '🔥'];

  // Об'єднаний список людей (з контексту + щойно створені локально)
  const allAvailablePeople = useMemo(() => {
    const existingIds = new Set(people.map(p => p.id));
    return [...people, ...localNewPeople.filter(p => !existingIds.has(p.id))];
  }, [people, localNewPeople]);

  const uncompletedHabits = useMemo(() => 
    tasks.filter(t => 
      !t.isDeleted && 
      (t.projectSection === 'habits' || t.tags.includes('habit')) &&
      t.habitHistory?.[todayDateStr]?.status !== 'completed'
    ),
    [tasks, todayDateStr]
  );

  const completedToday = useMemo(() => 
    tasks.filter(t => !t.isDeleted && t.status === TaskStatus.DONE && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === todayDateStr),
    [tasks, todayDateStr]
  );

  const filteredSearchPeople = useMemo(() => {
    const search = personSearch.toLowerCase().trim();
    if (!search) return [];
    return allAvailablePeople.filter(p => !p.isDeleted && p.name.toLowerCase().includes(search)).slice(0, 5);
  }, [allAvailablePeople, personSearch]);

  const handleFinish = () => {
    updateCharacter({ 
      energy: reportData.energy,
      xp: character.xp + 150 
    });

    reportData.selectedPeople.forEach(pid => {
       const reason = reportData.peopleGratitude[pid] || 'Дякую за цей день';
       addInteraction(pid, {
         summary: `[Вдячність] ${reason}`,
         type: 'other',
         date: Date.now(),
         emotion: 'joy'
       });
    });

    const victoryTask = tasks.find(t => t.id === reportData.mainVictoryId);
    
    let content = `### 🌟 Ретроспекція: ${new Date().toLocaleDateString('uk-UA')}\n\n`;
    content += `**Стан:** ${moodIcons[reportData.mood - 1]} | **Енергія:** ${reportData.energy}%\n\n`;
    
    content += `#### 🤝 Вдячність союзникам:\n`;
    if (reportData.selectedPeople.length > 0) {
      reportData.selectedPeople.forEach(pid => {
        const p = allAvailablePeople.find(x => x.id === pid);
        const reason = reportData.peopleGratitude[pid] || 'не вказано';
        if (p) content += `- **${p.name}**: ${reason}\n`;
      });
    } else {
      content += `_Вдячний за внутрішній спокій_\n`;
    }
    content += `\n`;
    
    if (reportData.gratitudeSelf) content += `#### ✨ Вдячність собі:\n${reportData.gratitudeSelf}\n\n`;
    if (reportData.positiveEvents) content += `#### ✅ Позитив:\n${reportData.positiveEvents}\n\n`;
    
    const reflectionEntries = Object.entries(reportData.habitReflections);
    if (reflectionEntries.length > 0) {
      content += `#### 🛠 Дисципліна:\n`;
      reflectionEntries.forEach(([id, text]) => {
        const h = tasks.find(t => t.id === id);
        if (h && text) content += `- **${h.title}**: ${text}\n`;
      });
      content += `\n`;
    }

    if (victoryTask) content += `#### 🏆 Перемога дня:\n${victoryTask.title}\n\n`;
    if (reportData.ideas) content += `#### 💡 Ідеї:\n${reportData.ideas}\n`;

    saveDiaryEntry(todayDateStr, content);
    onClose();
  };

  const steps: Step[] = ['mood', 'gratitude_people', 'gratitude_self', 'positive_events', 'habits', 'victory', 'ideas'];
  const progress = ((steps.indexOf(currentStep) + 1) / steps.length) * 100;

  const togglePerson = (pid: string) => {
    const isAlreadySelected = reportData.selectedPeople.includes(pid);
    const next = isAlreadySelected 
      ? reportData.selectedPeople.filter(id => id !== pid)
      : [...reportData.selectedPeople, pid];
    
    const nextGratitude = { ...reportData.peopleGratitude };
    if (!isAlreadySelected) {
      nextGratitude[pid] = '';
    } else {
      delete nextGratitude[pid];
    }

    setReportData({ ...reportData, selectedPeople: next, peopleGratitude: nextGratitude });
    setPersonSearch('');
  };

  const handleAddNewPerson = () => {
    const name = personSearch.trim();
    if (!name) return;
    
    // Створюємо ID заздалегідь для синхронізації
    const newId = `p-${Math.random().toString(36).substr(2,9)}`;
    
    // Додаємо локально для миттєвого рендеру
    const newPerson: Person = {
      id: newId,
      name: name,
      status: 'acquaintance',
      rating: 5,
      tags: [],
      hobbies: [],
      socials: {},
      notes: [],
      memories: [],
      interactions: [],
      importantDates: [],
      loop: 'month',
      createdAt: Date.now(),
      // Fix: Added missing updatedAt property
      updatedAt: Date.now()
    };
    
    setLocalNewPeople(prev => [...prev, newPerson]);
    
    // Викликаємо функцію контексту
    addPerson(name, 'acquaintance'); 

    // Додаємо до вибраних
    setReportData(prev => ({
      ...prev,
      selectedPeople: [...prev.selectedPeople, newId],
      peopleGratitude: { ...prev.peopleGratitude, [newId]: '' }
    }));
    
    setPersonSearch('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg h-full md:h-auto md:max-h-[90vh] bg-[var(--bg-card)] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-theme">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
           <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <header className="p-6 md:p-8 flex justify-between items-center shrink-0 border-b border-theme mt-1.5">
           <div>
              <Typography variant="tiny" className="text-orange-500 font-black mb-1 uppercase">Daily Flow • Крок {steps.indexOf(currentStep) + 1}</Typography>
              <Typography variant="h2" className="text-xl">
                {currentStep === 'mood' && 'Твій стан'}
                {currentStep === 'gratitude_people' && 'Вдячність людям'}
                {currentStep === 'gratitude_self' && 'Вдячність собі'}
                {currentStep === 'positive_events' && 'Позитив дня'}
                {currentStep === 'habits' && 'Дисципліна'}
                {currentStep === 'victory' && 'Перемога дня'}
                {currentStep === 'ideas' && 'Ідеї'}
              </Typography>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
              <i className="fa-solid fa-xmark"></i>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           {currentStep === 'mood' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Енергія ({reportData.energy}%)</label>
                   <input type="range" min="0" max="100" value={reportData.energy} onChange={e => setReportData({...reportData, energy: parseInt(e.target.value)})} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                   <div className="flex justify-between px-1">
                      <i className="fa-solid fa-battery-empty text-slate-300 text-xs"></i>
                      <i className="fa-solid fa-battery-full text-orange-500 text-xs"></i>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Настрій</label>
                   <div className="flex justify-between gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setReportData({...reportData, mood: i})} className={`flex-1 py-4 rounded-2xl border-2 transition-all text-xl ${reportData.mood === i ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105' : 'bg-slate-50 border-transparent grayscale'}`}>
                           {moodIcons[i-1]}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {currentStep === 'gratitude_people' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-magnifying-glass text-xs"></i></div>
                  <input 
                    value={personSearch}
                    onChange={e => setPersonSearch(e.target.value)}
                    placeholder="Хто сьогодні зробив твій день кращим?" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  />
                  {personSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl z-[50] overflow-hidden">
                       {filteredSearchPeople.map(p => (
                         <button key={p.id} onClick={() => togglePerson(p.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left border-b border-slate-50 last:border-0">
                            <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-black uppercase">{p.name}</span>
                         </button>
                       ))}
                       <button 
                         onClick={handleAddNewPerson}
                         className="w-full px-4 py-4 flex items-center gap-3 bg-orange-50/50 hover:bg-orange-100 transition-colors text-left text-orange-600"
                       >
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-orange-200"><i className="fa-solid fa-plus text-[10px]"></i></div>
                          <span className="text-[10px] font-black uppercase">Створити союзника "{personSearch}"</span>
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <div className="space-y-3">
                      {reportData.selectedPeople.length > 0 ? reportData.selectedPeople.map(pid => {
                        const p = allAvailablePeople.find(x => x.id === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="p-4 bg-orange-50/50 rounded-3xl border border-orange-100 space-y-3 animate-in zoom-in-95">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-6 h-6 rounded-full" />
                                   <span className="text-[10px] font-black uppercase text-orange-800">{p.name}</span>
                                </div>
                                <button onClick={() => togglePerson(pid)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-100 text-orange-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-xmark text-xs"></i></button>
                             </div>
                             <div className="space-y-1">
                               <label className="text-[7px] font-black text-orange-400 uppercase ml-1">За що вдячний?</label>
                               <input 
                                  value={reportData.peopleGratitude[pid] || ''}
                                  onChange={e => setReportData({
                                    ...reportData, 
                                    peopleGratitude: { ...reportData.peopleGratitude, [pid]: e.target.value }
                                  })}
                                  placeholder="Напр: Допомога з квестом, гарна порада..."
                                  className="w-full bg-white border border-orange-100 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-200 text-main"
                               />
                             </div>
                          </div>
                        );
                      }) : (
                        <div className="w-full py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 italic text-xs font-medium bg-slate-50/30">
                          Нікого не обрано (вдячний за день загалом)
                        </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {currentStep === 'gratitude_self' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">За що ти вдячний собі сьогодні?</label>
                <textarea 
                  autoFocus
                  value={reportData.gratitudeSelf}
                  onChange={e => setReportData({...reportData, gratitudeSelf: e.target.value})}
                  placeholder="За те, що не здався, за дисципліну..."
                  className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[180px] resize-none leading-relaxed text-main"
                />
             </div>
           )}

           {currentStep === 'positive_events' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Які яскраві моменти були?</label>
                <textarea 
                  autoFocus
                  value={reportData.positiveEvents}
                  onChange={e => setReportData({...reportData, positiveEvents: e.target.value})}
                  placeholder="Приємна розмова, смачна їжа, сонце..."
                  className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[180px] resize-none leading-relaxed text-main"
                />
             </div>
           )}

           {currentStep === 'habits' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <p className="text-xs text-slate-500 font-medium italic">Дисципліна - це база:</p>
                <div className="space-y-4">
                   {uncompletedHabits.map(h => (
                     <div key={h.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-black uppercase text-slate-700">{h.title}</span>
                           <button onClick={() => toggleHabitStatus(h.id, todayDateStr)} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm">
                              <i className="fa-solid fa-check"></i>
                           </button>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Чому не виконав? План:</label>
                           <textarea 
                              value={reportData.habitReflections[h.id] || ''} 
                              onChange={e => setReportData({...reportData, habitReflections: {...reportData.habitReflections, [h.id]: e.target.value}})}
                              placeholder="Напр: Завтра зроблю це в першу чергу..." 
                              className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-100 min-h-[60px] resize-none text-main"
                           />
                        </div>
                     </div>
                   ))}
                   {uncompletedHabits.length === 0 && (
                      <div className="py-12 text-center flex flex-col items-center">
                         <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl mb-4 shadow-inner">
                            <i className="fa-solid fa-crown"></i>
                         </div>
                         <Typography variant="h3" className="text-sm font-black uppercase tracking-widest text-emerald-700">Ідеально!</Typography>
                         <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Всі звички на сьогодні закрито</p>
                      </div>
                   )}
                </div>
             </div>
           )}

           {currentStep === 'victory' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <p className="text-xs text-slate-500 font-medium italic">Головне досягнення дня:</p>
                <div className="space-y-2">
                   {completedToday.map(t => (
                     <button key={t.id} onClick={() => setReportData({...reportData, mainVictoryId: t.id})} className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${reportData.mainVictoryId === t.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white'}`}>
                        <span className="text-xs font-bold text-slate-700 uppercase">{t.title}</span>
                        {reportData.mainVictoryId === t.id && <i className="fa-solid fa-circle-check text-orange-500"></i>}
                     </button>
                   ))}
                   <input 
                      value={reportData.mainVictoryId.startsWith('custom-') ? reportData.mainVictoryId.replace('custom-', '') : ''}
                      onChange={e => setReportData({...reportData, mainVictoryId: `custom-${e.target.value}`})}
                      placeholder="Або впиши щось своє..." 
                      className="w-full bg-slate-100 border-none rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-200 text-main" 
                   />
                </div>
             </div>
           )}

           {currentStep === 'ideas' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Ідеї на майбутнє?</label>
                <textarea 
                  autoFocus
                  value={reportData.ideas}
                  onChange={e => setReportData({...reportData, ideas: e.target.value})}
                  placeholder="Нові проєкти, гіпотези, мрії..."
                  className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[180px] resize-none leading-relaxed text-main"
                />
             </div>
           )}
        </div>

        <footer className="p-6 md:p-8 border-t border-theme bg-slate-50 flex gap-4 shrink-0">
           {currentStep !== 'mood' ? (
             <button onClick={() => {
                const idx = steps.indexOf(currentStep);
                setCurrentStep(steps[idx - 1]);
             }} className="flex-1 py-4 rounded-2xl font-black uppercase text-slate-400 text-[10px] tracking-widest hover:text-slate-600 transition-colors">НАЗАД</button>
           ) : (
             <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black uppercase text-slate-400 text-[10px] tracking-widest transition-colors">СКАСУВАТИ</button>
           )}
           
           {currentStep === 'ideas' ? (
             <Button variant="primary" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-orange-200 uppercase font-black tracking-widest" onClick={handleFinish}>ЗАКРИТИ ДЕНЬ</Button>
           ) : (
             <Button variant="primary" className="flex-[2] py-4 rounded-2xl shadow-xl shadow-orange-200 uppercase font-black tracking-widest" onClick={() => {
                const idx = steps.indexOf(currentStep);
                setCurrentStep(steps[idx + 1]);
             }}>ДАЛІ</Button>
           )}
        </footer>
      </div>
    </div>
  );
};

export default DailyReportWizard;