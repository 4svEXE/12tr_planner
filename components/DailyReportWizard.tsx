import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { TaskStatus, Person, Task, AiSuggestion, ReportQuestion } from '../types';
import { analyzeDailyReport } from '../services/geminiService';
import DailyReportAiWizard from './DailyReportAiWizard';

interface DailyReportWizardProps {
  onClose: () => void;
}

const DailyReportWizard: React.FC<DailyReportWizardProps> = ({ onClose }) => {
  const { 
    people, tasks, character, updateCharacter, 
    addPerson, saveDiaryEntry, toggleHabitStatus, addInteraction, aiEnabled, reportTemplate = []
  } = useApp();

  const [stepIndex, setStepIndex] = useState(0);
  const [personSearch, setPersonSearch] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [showAiWizard, setShowAiWizard] = useState(false);
  
  const [localNewPeople, setLocalNewPeople] = useState<Person[]>([]);

  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentQuestion = reportTemplate[stepIndex];
  const isLastStep = stepIndex === reportTemplate.length;
  const progress = ((stepIndex) / (reportTemplate.length)) * 100;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const moodIcons = ['😫', '😐', '🙂', '😊', '🔥'];

  const allAvailablePeople = useMemo(() => {
    const existingIds = new Set(people.map(p => p.id));
    return [...people, ...localNewPeople.filter(p => !existingIds.has(p.id))];
  }, [people, localNewPeople]);

  const uncompletedHabits = useMemo(() => 
    tasks.filter(t => 
      !t.isDeleted && 
      !t.isArchived && 
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

  const generateReportContent = () => {
    let content = `### 🌟 Ретроспекція: ${new Date().toLocaleDateString('uk-UA')}\n\n`;
    
    reportTemplate.forEach(q => {
      const ans = answers[q.id];
      content += `#### ${q.text}\n`;
      
      if (!ans) {
        content += `_Без відповіді_\n\n`;
        return;
      }

      switch(q.type) {
        case 'mood':
          content += `Стан: ${moodIcons[(ans.mood || 3) - 1]} | Енергія: ${ans.energy || 80}%\n\n`;
          break;
        case 'gratitude_people':
          const selectedPeople = ans.selectedPeople || [];
          const peopleGratitude = ans.peopleGratitude || {};
          if (selectedPeople.length > 0) {
            selectedPeople.forEach((pid: string) => {
              const p = allAvailablePeople.find(x => x.id === pid);
              const reason = peopleGratitude[pid] || 'не вказано';
              if (p) content += `- **${p.name}**: ${reason}\n`;
            });
          } else content += `_Вдячний за спокій_\n`;
          content += '\n';
          break;
        case 'victory':
          const victoryTask = tasks.find(t => t.id === ans.mainVictoryId);
          content += `${victoryTask?.title || ans.mainVictoryId || '—'}\n\n`; 
          break;
        case 'habits':
          const hEntries = Object.entries(ans.habitReflections || {});
          if (hEntries.length > 0) {
            hEntries.forEach(([id, text]) => {
              const h = tasks.find(t => t.id === id);
              if (h) content += `- **${h.title}**: ${text}\n`;
            });
          } else content += `Все виконано або без зауважень\n`;
          content += '\n';
          break;
        default: 
          content += `${ans || '—'}\n\n`;
          break;
      }
    });

    return content;
  };

  const handleFinish = async (runAi: boolean = false) => {
    const answeredCount = Object.keys(answers).length;
    const xpReward = 100 + (answeredCount * 20);
    const moodQuestion = reportTemplate.find(q => q.type === 'mood');
    const moodData = moodQuestion ? answers[moodQuestion.id] : { energy: character.energy };
    
    updateCharacter({ 
      energy: moodData?.energy || character.energy, 
      xp: character.xp + xpReward 
    });

    reportTemplate.filter(q => q.type === 'gratitude_people').forEach(q => {
       const ans = answers[q.id];
       if (ans?.selectedPeople) {
         ans.selectedPeople.forEach((pid: string) => {
            addInteraction(pid, { summary: `[Вдячність] ${ans.peopleGratitude[pid] || 'Дякую'}`, type: 'other', date: Date.now(), emotion: 'joy' });
         });
       }
    });

    const content = generateReportContent();
    saveDiaryEntry(todayDateStr, content);

    if (runAi && aiEnabled) {
      setIsAiAnalyzing(true);
      try {
        const suggestions = await analyzeDailyReport(content, character);
        setAiSuggestions(suggestions);
        setShowAiWizard(true);
      } catch (e) {
        alert("Помилка AI. Звіт збережено.");
        onClose();
      } finally { setIsAiAnalyzing(false); }
    } else onClose();
  };

  const updateAnswer = (id: string, val: any) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const renderStep = () => {
    if (isLastStep) {
      const answered = Object.keys(answers).length;
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-5xl mb-2 shadow-xl ring-4 ring-primary/5 relative overflow-hidden">
              <i className="fa-solid fa-sparkles text-xl absolute top-3 right-3 opacity-40"></i>
              <i className="fa-solid fa-flag-checkered"></i>
           </div>
           <div>
              <Typography variant="h3" className="text-2xl font-black uppercase tracking-tight mb-2 text-main">Місія виконана</Typography>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest leading-loose">
                Ви закріпили досвід цього дня.<br/>
                <span className="text-primary">Нагорода: +{100 + (answered * 20)} XP</span>
              </p>
           </div>
           {aiEnabled && (
             <Card padding="md" className="border-theme bg-primary/5 w-full max-w-xs rounded-[2rem]">
                <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-4">Бажаєте ШІ-аналіз для планування наступного циклу?</p>
                <button 
                  onClick={() => handleFinish(true)} 
                  disabled={isAiAnalyzing} 
                  className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                   {isAiAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt"></i>} AI АНАЛІЗ
                </button>
             </Card>
           )}
        </div>
      );
    }

    const ans = answers[currentQuestion.id];

    switch(currentQuestion.type) {
      case 'mood':
        const moodVal = ans?.mood || 3;
        const energyVal = ans?.energy || 80;
        return (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-300 py-4">
             <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase text-muted tracking-widest">Рівень Енергії</label>
                   <span className="text-xl font-black text-primary">{energyVal}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={energyVal} 
                  onChange={e => updateAnswer(currentQuestion.id, { ...ans, energy: parseInt(e.target.value), mood: moodVal })} 
                  className="w-full h-2 rounded-full cursor-pointer accent-primary bg-input appearance-none" 
                />
             </div>
             <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-muted text-center block tracking-widest">Настрій дня</label>
                <div className="flex justify-between gap-3">
                   {[1,2,3,4,5].map(i => (
                     <button 
                        key={i} 
                        onClick={() => updateAnswer(currentQuestion.id, { ...ans, mood: i, energy: energyVal })} 
                        className={`flex-1 py-4 rounded-2xl border-2 transition-all text-2xl shadow-sm ${moodVal === i ? 'bg-primary border-primary text-white scale-110 shadow-lg' : 'bg-card border-theme grayscale opacity-40 hover:opacity-100'}`}
                      >
                        {moodIcons[i-1]}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        );
      case 'gratitude_people':
        const selPeople = ans?.selectedPeople || [];
        const peopleGrat = ans?.peopleGratitude || {};
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="relative">
               <input 
                  value={personSearch} 
                  onChange={e => setPersonSearch(e.target.value)} 
                  placeholder="Кому ви вдячні?.." 
                  className="w-full bg-input border-2 border-theme rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-primary/30 transition-all shadow-inner text-main" 
               />
               {personSearch && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-theme shadow-2xl rounded-[1.5rem] z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                    {filteredSearchPeople.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => {
                           const isSel = selPeople.includes(p.id);
                           const nextSel = isSel ? selPeople.filter((id: string) => id !== p.id) : [...selPeople, p.id];
                           const nextGrat = { ...peopleGrat };
                           if (!isSel) nextGrat[p.id] = ''; else delete nextGrat[p.id];
                           updateAnswer(currentQuestion.id, { selectedPeople: nextSel, peopleGratitude: nextGrat });
                           setPersonSearch('');
                        }} 
                        className="w-full px-5 py-3 flex items-center gap-4 hover:bg-black/5 transition-colors text-left border-b border-theme last:border-0"
                      >
                         <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-8 h-8 rounded-xl object-cover" />
                         <span className="text-[11px] font-black uppercase text-main">{p.name}</span>
                      </button>
                    ))}
                 </div>
               )}
             </div>
             <div className="space-y-3">
                {selPeople.map((pid: string) => {
                  const p = allAvailablePeople.find(x => x.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="p-4 bg-card rounded-3xl border-2 border-theme shadow-sm space-y-3 animate-in slide-in-from-bottom-2">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-6 h-6 rounded-lg" />
                             <span className="text-[10px] font-black uppercase text-main">{p.name}</span>
                          </div>
                          <button onClick={() => updateAnswer(currentQuestion.id, { selectedPeople: selPeople.filter((id: string) => id !== pid), peopleGratitude: { ...peopleGrat, [pid]: undefined } })} className="text-rose-500 hover:scale-110 transition-transform"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                       </div>
                       <input 
                        value={peopleGrat[pid] || ''} 
                        onChange={e => updateAnswer(currentQuestion.id, { selectedPeople: selPeople, peopleGratitude: { ...peopleGrat, [pid]: e.target.value } })} 
                        placeholder="За що саме?.." 
                        className="w-full bg-input border-none rounded-xl px-4 py-2 text-[11px] font-bold outline-none italic text-main" 
                       />
                    </div>
                  );
                })}
             </div>
          </div>
        );
      case 'victory':
        const vicId = ans?.mainVictoryId || '';
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
               {completedToday.map(t => (
                 <button 
                  key={t.id} 
                  onClick={() => updateAnswer(currentQuestion.id, { mainVictoryId: t.id })} 
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${vicId === t.id ? 'border-primary bg-primary/5 shadow-md' : 'bg-card border-theme hover:border-primary/20'}`}
                 >
                    <span className={`text-[11px] font-black uppercase leading-tight ${vicId === t.id ? 'text-primary' : 'text-main'}`}>{t.title}</span>
                    {vicId === t.id && <i className="fa-solid fa-check text-primary text-xs"></i>}
                 </button>
               ))}
             </div>
             <div className="space-y-2 pt-2">
                <Typography variant="tiny" className="text-muted font-black uppercase tracking-widest ml-1">Або впишіть власну</Typography>
                <input 
                  value={vicId.startsWith('custom-') ? vicId.replace('custom-', '') : ''} 
                  onChange={e => updateAnswer(currentQuestion.id, { mainVictoryId: `custom-${e.target.value}` })} 
                  placeholder="Головна подія..." 
                  className="w-full bg-input border-2 border-theme rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-primary/30 shadow-inner text-main" 
                />
             </div>
          </div>
        );
      case 'habits':
        const habitRefs = ans?.habitReflections || {};
        return (
          <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
             {uncompletedHabits.map(h => (
               <div key={h.id} className="p-4 bg-card rounded-3xl border-2 border-theme shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><i className="fa-solid fa-repeat text-[10px]"></i></div>
                     <span className="text-[10px] font-black uppercase text-main">{h.title}</span>
                  </div>
                  <input 
                    value={habitRefs[h.id] || ''} 
                    onChange={e => updateAnswer(currentQuestion.id, { habitReflections: { ...habitRefs, [h.id]: e.target.value } })} 
                    placeholder="Причина пропуску чи інсайт..." 
                    className="w-full bg-input border-none rounded-xl px-4 py-2 text-[10px] font-bold outline-none italic text-main" 
                  />
               </div>
             ))}
             {uncompletedHabits.length === 0 && (
               <div className="py-20 text-center opacity-10 grayscale flex flex-col items-center select-none">
                  <i className="fa-solid fa-circle-check text-6xl mb-4 text-main"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest text-main">Всі звички виконано ідеально!</p>
               </div>
             )}
          </div>
        );
      default:
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <textarea 
              autoFocus 
              value={ans || ''} 
              onChange={e => updateAnswer(currentQuestion.id, e.target.value)} 
              className="w-full bg-input border-2 border-theme rounded-[2rem] p-6 text-sm font-medium min-h-[220px] outline-none focus:border-primary/30 transition-all shadow-inner leading-relaxed text-main" 
              placeholder="Твій потік думок..."
            />
            <div className="flex justify-end px-2">
               <span className="text-[8px] font-black text-muted uppercase tracking-widest opacity-40">Focus Mode Active</span>
            </div>
          </div>
        );
    }
  };

  if (showAiWizard && aiSuggestions) return <DailyReportAiWizard suggestions={aiSuggestions} onClose={onClose} />;

  const canGoNext = !currentQuestion?.required || !!answers[currentQuestion.id];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-lg h-full md:h-auto md:max-h-[90vh] bg-card md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border border-theme">
        <div className="absolute top-0 left-0 w-full h-1 bg-input">
          <div className="h-full bg-primary shadow-[0_0_12px_var(--primary)] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        
        <header className="px-8 pt-10 pb-6 flex justify-between items-start shrink-0">
           <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                 <Badge variant="orange" className="px-2 py-0.5 rounded-lg text-[8px] font-black tracking-[0.2em]">{isLastStep ? 'FINAL' : `КРОК ${stepIndex + 1}`}</Badge>
                 <div className="h-px w-8 bg-theme"></div>
                 <span className="text-[8px] font-black text-muted uppercase tracking-widest">{reportTemplate.length} КРОКІВ</span>
              </div>
              <Typography variant="h2" className="text-2xl md:text-3xl leading-tight font-black uppercase tracking-tighter text-main truncate pr-6">
                {isLastStep ? 'Результати дня' : currentQuestion.text}
              </Typography>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-muted hover:text-rose-500 transition-all shrink-0"><i className="fa-solid fa-xmark text-lg"></i></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-2 mb-4">{renderStep()}</div>

        <footer className="p-8 pb-12 md:p-8 bg-black/5 border-t border-theme flex gap-4 shrink-0 no-print">
           {!isLastStep ? (
             <>
               <button 
                 onClick={() => stepIndex > 0 && setStepIndex(stepIndex - 1)} 
                 disabled={stepIndex === 0}
                 className="flex-1 h-14 rounded-2xl font-black uppercase text-muted text-[10px] tracking-[0.2em] hover:bg-black/5 transition-all disabled:opacity-0"
               >
                 Назад
               </button>
               <Button 
                variant="primary" 
                disabled={!canGoNext}
                className="flex-[2] h-14 shadow-xl uppercase font-black tracking-[0.2em] text-[10px] rounded-2xl group" 
                onClick={() => setStepIndex(stepIndex + 1)}
               >
                 Далі <i className="fa-solid fa-chevron-right ml-2 group-hover:translate-x-1 transition-transform"></i>
               </Button>
             </>
           ) : (
             <>
               <button onClick={() => setStepIndex(stepIndex - 1)} className="flex-1 h-14 rounded-2xl font-black uppercase text-muted text-[10px] tracking-[0.2em] hover:bg-black/5 transition-all">Назад</button>
               <Button variant="white" className="flex-1 h-14 border-2 border-primary text-primary hover:bg-primary hover:text-white uppercase font-black tracking-[0.2em] text-[10px] rounded-2xl shadow-lg" onClick={() => handleFinish(false)}>ЗБЕРЕГТИ</Button>
             </>
           )}
        </footer>
      </div>
    </div>
  );
};

export default DailyReportWizard;