
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
    
    const newId = `p-${Math.random().toString(36).substr(2,9)}`;
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
      updatedAt: Date.now()
    };
    
    setLocalNewPeople(prev => [...prev, newPerson]);
    addPerson(name, 'acquaintance'); 

    setReportData(prev => ({
      ...prev,
      selectedPeople: [...prev.selectedPeople, newId],
      peopleGratitude: { ...prev.peopleGratitude, [newId]: '' }
    }));
    
    setPersonSearch('');
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg h-full md:h-auto md:max-h-[90vh] bg-[var(--bg-card)] md:rounded shadow-2xl flex flex-col overflow-hidden relative border-theme">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-input)]">
           <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        <header className="p-6 flex justify-between items-center shrink-0 border-b border-theme mt-1.5">
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
           <button onClick={onClose} className="w-8 h-8 rounded bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all">
              <i className="fa-solid fa-xmark"></i>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
           {currentStep === 'mood' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center block">Енергія ({reportData.energy}%)</label>
                   <input type="range" min="0" max="100" value={reportData.energy} onChange={e => setReportData({...reportData, energy: parseInt(e.target.value)})} className="w-full h-2 rounded cursor-pointer accent-orange-500" />
                   <div className="flex justify-between px-1">
                      <i className="fa-solid fa-battery-empty text-[var(--text-muted)] opacity-30 text-xs"></i>
                      <i className="fa-solid fa-battery-full text-orange-500 text-xs"></i>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center block">Настрій</label>
                   <div className="flex justify-between gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setReportData({...reportData, mood: i})} className={`flex-1 py-3 rounded border transition-all text-xl ${reportData.mood === i ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105' : 'bg-[var(--bg-input)] border-transparent grayscale opacity-50'}`}>
                           {moodIcons[i-1]}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {currentStep === 'gratitude_people' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="relative flex items-center">
                  <div className="absolute left-2.5 z-10 text-[var(--text-muted)]"><i className="fa-solid fa-magnifying-glass text-[9px]"></i></div>
                  <input 
                    value={personSearch}
                    onChange={e => setPersonSearch(e.target.value)}
                    placeholder="Хто зробив твій день?" 
                    className="w-full h-6 pl-8 pr-4 outline-none"
                  />
                  {personSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl rounded z-[50] overflow-hidden">
                       {filteredSearchPeople.map(p => (
                         <button key={p.id} onClick={() => togglePerson(p.id)} className="w-full px-3 py-2 flex items-center gap-3 hover:bg-orange-500/10 transition-colors text-left border-b border-[var(--border-color)] last:border-0">
                            <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-5 h-5 rounded-full" />
                            <span className="text-[10px] font-black uppercase">{p.name}</span>
                         </button>
                       ))}
                       <button 
                         onClick={handleAddNewPerson}
                         className="w-full px-3 py-3 flex items-center gap-3 bg-orange-500/5 hover:bg-orange-500/10 transition-colors text-left text-orange-600"
                       >
                          <div className="w-5 h-5 rounded bg-[var(--bg-card)] flex items-center justify-center border border-orange-200"><i className="fa-solid fa-plus text-[9px]"></i></div>
                          <span className="text-[9px] font-black uppercase">Створити "{personSearch}"</span>
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                   {reportData.selectedPeople.length > 0 ? reportData.selectedPeople.map(pid => {
                     const p = allAvailablePeople.find(x => x.id === pid);
                     if (!p) return null;
                     return (
                       <div key={pid} className="p-3 bg-[var(--bg-input)] rounded border border-[var(--border-color)] space-y-2 animate-in zoom-in-95">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-4 h-4 rounded-full" />
                                <span className="text-[9px] font-black uppercase text-[var(--text-main)]">{p.name}</span>
                             </div>
                             <button onClick={() => togglePerson(pid)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                          </div>
                          <input 
                             value={reportData.peopleGratitude[pid] || ''}
                             onChange={e => setReportData({
                               ...reportData, 
                               peopleGratitude: { ...reportData.peopleGratitude, [pid]: e.target.value }
                             })}
                             placeholder="За що вдячний?"
                             className="w-full h-6 px-2 text-[10px] font-bold outline-none border border-[var(--border-color)]"
                          />
                       </div>
                     );
                   }) : (
                     <div className="w-full py-6 text-center border border-dashed border-[var(--border-color)] rounded text-[var(--text-muted)] italic text-[10px] font-medium bg-[var(--bg-input)] opacity-50">
                       Нікого не обрано
                     </div>
                   )}
                </div>
             </div>
           )}

           {currentStep === 'gratitude_self' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">За що ти вдячний собі сьогодні?</label>
                <textarea 
                  autoFocus
                  value={reportData.gratitudeSelf}
                  onChange={e => setReportData({...reportData, gratitudeSelf: e.target.value})}
                  placeholder="За дисципліну..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded p-4 text-xs font-medium focus:ring-4 focus:ring-orange-500/10 transition-all outline-none min-h-[160px] resize-none leading-relaxed text-[var(--text-main)]"
                />
             </div>
           )}

           {currentStep === 'positive_events' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Які яскраві моменти були?</label>
                <textarea 
                  autoFocus
                  value={reportData.positiveEvents}
                  onChange={e => setReportData({...reportData, positiveEvents: e.target.value})}
                  placeholder="Приємні події..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded p-4 text-xs font-medium focus:ring-4 focus:ring-orange-500/10 transition-all outline-none min-h-[160px] resize-none leading-relaxed text-[var(--text-main)]"
                />
             </div>
           )}

           {currentStep === 'habits' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                   {uncompletedHabits.map(h => (
                     <div key={h.id} className="p-3 bg-[var(--bg-input)] rounded border border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase text-[var(--text-main)]">{h.title}</span>
                           <button onClick={() => toggleHabitStatus(h.id, todayDateStr)} className="w-8 h-8 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-emerald-500 hover:text-white transition-all">
                              <i className="fa-solid fa-check text-xs"></i>
                           </button>
                        </div>
                        <input 
                           value={reportData.habitReflections[h.id] || ''} 
                           onChange={e => setReportData({...reportData, habitReflections: {...reportData.habitReflections, [h.id]: e.target.value}})}
                           placeholder="Чому не виконав?" 
                           className="w-full h-6 px-2 text-[9px] font-bold outline-none border border-[var(--border-color)]"
                        />
                     </div>
                   ))}
                   {uncompletedHabits.length === 0 && (
                      <div className="py-12 text-center flex flex-col items-center">
                         <Typography variant="h3" className="text-sm font-black uppercase tracking-widest text-emerald-500">Ідеально!</Typography>
                      </div>
                   )}
                </div>
             </div>
           )}

           {currentStep === 'victory' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <p className="text-xs text-[var(--text-muted)] font-medium italic">Головне досягнення дня:</p>
                <div className="space-y-1.5">
                   {completedToday.map(t => (
                     <button key={t.id} onClick={() => setReportData({...reportData, mainVictoryId: t.id})} className={`w-full h-8 px-3 rounded border transition-all text-left flex items-center justify-between ${reportData.mainVictoryId === t.id ? 'border-orange-500 bg-orange-500/10' : 'border-[var(--border-color)] bg-[var(--bg-input)]'}`}>
                        <span className="text-[10px] font-bold text-[var(--text-main)] uppercase">{t.title}</span>
                        {reportData.mainVictoryId === t.id && <i className="fa-solid fa-circle-check text-orange-500 text-[10px]"></i>}
                     </button>
                   ))}
                   <input 
                      value={reportData.mainVictoryId.startsWith('custom-') ? reportData.mainVictoryId.replace('custom-', '') : ''}
                      onChange={e => setReportData({...reportData, mainVictoryId: `custom-${e.target.value}`})}
                      placeholder="Власна перемога..." 
                      className="w-full h-8 px-3 text-[10px] font-bold outline-none" 
                   />
                </div>
             </div>
           )}

           {currentStep === 'ideas' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Ідеї на майбутнє?</label>
                <textarea 
                  autoFocus
                  value={reportData.ideas}
                  onChange={e => setReportData({...reportData, ideas: e.target.value})}
                  placeholder="Мрії, плани..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded p-4 text-xs font-medium focus:ring-4 focus:ring-orange-500/10 transition-all outline-none min-h-[160px] resize-none leading-relaxed text-[var(--text-main)]"
                />
             </div>
           )}
        </div>

        <footer className="p-6 pb-12 md:pb-6 border-t border-theme bg-[var(--bg-card)] flex gap-4 shrink-0">
           {currentStep !== 'mood' ? (
             <button onClick={() => {
                const idx = steps.indexOf(currentStep);
                setCurrentStep(steps[idx - 1]);
             }} className="flex-1 h-10 rounded font-black uppercase text-[var(--text-muted)] text-[9px] tracking-widest transition-colors">НАЗАД</button>
           ) : (
             <button onClick={onClose} className="flex-1 h-10 rounded font-black uppercase text-[var(--text-muted)] text-[9px] tracking-widest transition-colors">ВІДМІНА</button>
           )}
           
           {currentStep === 'ideas' ? (
             <Button variant="primary" className="flex-[2] h-10 shadow-xl uppercase font-black tracking-widest text-[9px]" onClick={handleFinish}>ЗАКРИТИ ДЕНЬ</Button>
           ) : (
             <Button variant="primary" className="flex-[2] h-10 shadow-xl uppercase font-black tracking-widest text-[9px]" onClick={() => {
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
