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
    people = [], tasks, character, updateCharacter, 
    addPerson, saveDiaryEntry, toggleHabitStatus, addInteraction, aiEnabled, reportTemplate = []
  } = useApp();

  const [stepIndex, setStepIndex] = useState(0);
  const [personSearch, setPersonSearch] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [showAiWizard, setShowAiWizard] = useState(false);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentQuestion = reportTemplate[stepIndex];
  const isLastStep = stepIndex === reportTemplate.length;
  const progress = ((stepIndex) / (reportTemplate.length)) * 100;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const moodIcons = ['😫', '😐', '🙂', '😊', '🔥'];

  // Об'єднуємо людей з контексту
  const allAvailablePeople = useMemo(() => {
    return (people || []).filter(p => !p.isDeleted);
  }, [people]);

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

  // Фільтрація людей для пошуку
  const filteredSearchPeople = useMemo(() => {
    const search = personSearch.toLowerCase().trim();
    if (!search) return [];
    
    return allAvailablePeople.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.status.toLowerCase().includes(search)
    ).slice(0, 5);
  }, [allAvailablePeople, personSearch]);

  const handleCreateNewPerson = () => {
    const name = personSearch.trim();
    if (!name) return;
    
    // Створюємо нову людину та отримуємо її ID
    const newId = addPerson({ name, status: 'acquaintance' });
    
    // Отримуємо поточні відповіді для цього питання
    const currentAns = answers[currentQuestion.id] || { selectedPeople: [], peopleGratitude: {} };
    const selPeople = currentAns.selectedPeople || [];
    const peopleGrat = currentAns.peopleGratitude || {};

    // Одразу додаємо нову людину в обрані
    const nextAns = {
      selectedPeople: [...selPeople, newId],
      peopleGratitude: { ...peopleGrat, [newId]: '' }
    };
    
    updateAnswer(currentQuestion.id, nextAns);
    
    // Очищуємо пошук
    setPersonSearch('');
  };

  const generateReportContent = () => {
    let content = `### 🌟 Ретроспекція: ${new Date().toLocaleDateString('uk-UA')}\n\n`;
    
    reportTemplate.forEach(q => {
      const ans = answers[q.id];
      // Замінено #### на ** для питань
      content += `**${q.text}**\n`;
      
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
           <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] text-5xl mb-2 shadow-xl ring-4 ring-[var(--primary)]/5 relative overflow-hidden">
              <i className="fa-solid fa-sparkles text-xl absolute top-3 right-3 opacity-40"></i>
              <i className="fa-solid fa-flag-checkered"></i>
           </div>
           <div>
              <Typography variant="h3" className="text-2xl font-black uppercase tracking-tight mb-2 text-[var(--text-main)]">Місія виконана</Typography>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-loose">
                Ви закріпили досвід цього дня.<br/>
                <span className="text-[var(--primary)]">Нагорода: +{100 + (answered * 20)} XP</span>
              </p>
           </div>
           {aiEnabled && (
             <Card padding="md" className="border-[var(--border-color)] bg-[var(--primary)]/5 w-full max-w-xs rounded-[2.5rem]">
                <p className="text-[9px] text-[var(--primary)] font-black uppercase tracking-widest mb-4">Бажаєте ШІ-аналіз для планування наступного циклу?</p>
                <button 
                  onClick={() => handleFinish(true)} 
                  disabled={isAiAnalyzing} 
                  className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
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
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Рівень Енергії</label>
                   <span className="text-xl font-black text-[var(--primary)]">{energyVal}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={energyVal} 
                  onChange={e => updateAnswer(currentQuestion.id, { ...ans, energy: parseInt(e.target.value), mood: moodVal })} 
                  className="w-full h-2 rounded-full cursor-pointer accent-[var(--primary)] bg-[var(--bg-input)] appearance-none" 
                />
             </div>
             <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] text-center block tracking-widest">Настрій дня</label>
                <div className="flex justify-between gap-3">
                   {[1,2,3,4,5].map(i => (
                     <button 
                        key={i} 
                        onClick={() => updateAnswer(currentQuestion.id, { ...ans, mood: i, energy: energyVal })} 
                        className={`flex-1 py-4 rounded-2xl border-2 transition-all text-2xl shadow-sm ${moodVal === i ? 'bg-[var(--primary)] border-[var(--primary)] text-white scale-110 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] grayscale opacity-40 hover:opacity-100'}`}
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
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-30"><i className="fa-solid fa-magnifying-glass text-xs"></i></div>
               <input 
                  value={personSearch} 
                  onChange={e => setPersonSearch(e.target.value)} 
                  placeholder="Введіть ім'я..." 
                  className="w-full bg-[var(--bg-input)] border-2 border-[var(--border-color)] rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold outline-none focus:border-[var(--primary)]/30 transition-all shadow-inner text-[var(--text-main)]" 
               />
               {personSearch && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                    {filteredSearchPeople.map(p => {
                       const isSel = selPeople.includes(p.id);
                       return (
                        <button 
                          key={p.id} 
                          onClick={() => {
                             const nextSel = isSel ? selPeople.filter((id: string) => id !== p.id) : [...selPeople, p.id];
                             const nextGrat = { ...peopleGrat };
                             if (!isSel) nextGrat[p.id] = ''; else delete nextGrat[p.id];
                             updateAnswer(currentQuestion.id, { selectedPeople: nextSel, peopleGratitude: nextGrat });
                             setPersonSearch('');
                          }} 
                          className={`w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 transition-colors text-left border-b border-[var(--border-color)] last:border-0 ${isSel ? 'bg-[var(--primary)]/5' : ''}`}
                        >
                           <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-8 h-8 rounded-xl object-cover border border-[var(--border-color)]" />
                           <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-black uppercase text-[var(--text-main)]">{p.name}</div>
                              <div className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{p.status}</div>
                           </div>
                           {isSel && <i className="fa-solid fa-check text-[var(--primary)] text-xs"></i>}
                        </button>
                      );
                    })}
                    
                    {/* Кнопка створення нової людини */}
                    <button 
                      onClick={handleCreateNewPerson}
                      className="w-full px-5 py-4 flex items-center gap-4 bg-[var(--primary)]/5 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left border-t border-[var(--border-color)]"
                    >
                       <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-md"><i className="fa-solid fa-user-plus text-xs"></i></div>
                       <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black uppercase">Створити: "{personSearch}"</div>
                          <div className="text-[7px] font-bold uppercase tracking-widest opacity-60">Додати нового союзника в базу</div>
                       </div>
                    </button>
                 </div>
               )}
             </div>

             <div className="space-y-3">
                {selPeople.map((pid: string) => {
                  const p = allAvailablePeople.find(x => x.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="p-4 bg-[var(--bg-card)] rounded-[2rem] border-2 border-[var(--border-color)] shadow-sm space-y-3 animate-in slide-in-from-bottom-2">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-7 h-7 rounded-xl" />
                             <span className="text-[11px] font-black uppercase text-[var(--text-main)]">{p.name}</span>
                          </div>
                          <button onClick={() => updateAnswer(currentQuestion.id, { selectedPeople: selPeople.filter((id: string) => id !== pid), peopleGratitude: { ...peopleGrat, [pid]: undefined } })} className="text-rose-500 hover:scale-110 transition-transform p-1"><i className="fa-solid fa-xmark text-xs"></i></button>
                       </div>
                       <input 
                        value={peopleGrat[pid] || ''} 
                        onChange={e => updateAnswer(currentQuestion.id, { selectedPeople: selPeople, peopleGratitude: { ...peopleGrat, [pid]: e.target.value } })} 
                        placeholder="За що саме ви вдячні?.." 
                        className="w-full bg-[var(--bg-input)] border-none rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none italic text-[var(--text-main)]" 
                       />
                    </div>
                  );
                })}
                {selPeople.length === 0 && !personSearch && (
                  <div className="py-12 text-center opacity-20 flex flex-col items-center">
                    <i className="fa-solid fa-heart-pulse text-5xl mb-3"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Оберіть людей зі списку вище</p>
                  </div>
                )}
             </div>
          </div>
        );
      case 'victory':
        const vicId = ans?.mainVictoryId || '';
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
               {completedToday.length > 0 ? completedToday.map(t => (
                 <button 
                  key={t.id} 
                  onClick={() => updateAnswer(currentQuestion.id, { mainVictoryId: t.id })} 
                  className={`w-full p-5 rounded-[2rem] border-2 text-left flex items-center justify-between transition-all ${vicId === t.id ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/20'}`}
                 >
                    <span className={`text-[12px] font-black uppercase leading-tight ${vicId === t.id ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{t.title}</span>
                    {vicId === t.id && <i className="fa-solid fa-check text-[var(--primary)] text-xs"></i>}
                 </button>
               )) : (
                 <div className="py-8 text-center opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-widest">Немає закритих квестів сьогодні</p>
                 </div>
               )}
             </div>
             <div className="space-y-2 pt-2">
                <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest ml-1 text-[8px]">Або впишіть власну перемогу</Typography>
                <input 
                  value={vicId.startsWith('custom-') ? vicId.replace('custom-', '') : ''} 
                  onChange={e => updateAnswer(currentQuestion.id, { mainVictoryId: `custom-${e.target.value}` })} 
                  placeholder="Яке головне звершення?.." 
                  className="w-full bg-[var(--bg-input)] border-2 border-[var(--border-color)] rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-[var(--primary)]/30 shadow-inner text-[var(--text-main)]" 
                />
             </div>
          </div>
        );
      case 'habits':
        const habitRefs = ans?.habitReflections || {};
        return (
          <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
             {uncompletedHabits.length > 0 ? uncompletedHabits.map(h => (
               <div key={h.id} className="p-5 bg-[var(--bg-card)] rounded-[2rem] border-2 border-[var(--border-color)] shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center"><i className="fa-solid fa-repeat text-sm"></i></div>
                     <span className="text-[12px] font-black uppercase text-[var(--text-main)]">{h.title}</span>
                  </div>
                  <input 
                    value={habitRefs[h.id] || ''} 
                    onChange={e => updateAnswer(currentQuestion.id, { habitReflections: { ...habitRefs, [h.id]: e.target.value } })} 
                    placeholder="Причина пропуску чи інсайт..." 
                    className="w-full bg-[var(--bg-input)] border-none rounded-xl px-4 py-3 text-[11px] font-bold outline-none italic text-[var(--text-main)]" 
                  />
               </div>
             )) : (
               <div className="py-20 text-center opacity-10 grayscale flex flex-col items-center select-none">
                  <i className="fa-solid fa-circle-check text-6xl mb-4 text-[var(--text-main)]"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Всі звички виконано ідеально!</p>
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
              className="w-full bg-[var(--bg-input)] border-2 border-[var(--border-color)] rounded-[2.5rem] p-8 text-sm font-medium min-h-[250px] outline-none focus:border-[var(--primary)]/30 transition-all shadow-inner leading-relaxed text-[var(--text-main)]" 
              placeholder="Твій потік думок..." 
            />
          </div>
        );
    }
  };

  if (showAiWizard && aiSuggestions) return <DailyReportAiWizard suggestions={aiSuggestions} onClose={onClose} />;

  const canGoNext = !currentQuestion?.required || !!answers[currentQuestion.id];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-lg h-full md:h-auto md:max-h-[90vh] bg-[var(--bg-card)] md:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-[var(--border-color)]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--bg-input)]">
          <div className="h-full bg-[var(--primary)] shadow-[0_0_15px_var(--primary)] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        
        <header className="px-8 pt-10 pb-4 flex justify-between items-start shrink-0">
           <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                 <Badge variant="orange" className="px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-[0.2em]">{isLastStep ? 'FINAL' : `КРОК ${stepIndex + 1}`}</Badge>
                 <div className="h-px w-10 bg-[var(--border-color)]"></div>
                 <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{reportTemplate.length} КРОКІВ</span>
              </div>
              <Typography variant="h2" className="text-xl md:text-2xl leading-tight font-black uppercase tracking-tighter text-[var(--text-main)] truncate pr-6">
                {isLastStep ? 'Результати дня' : currentQuestion.text}
              </Typography>
           </div>
           <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all shrink-0"><i className="fa-solid fa-xmark text-xl"></i></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-2 mb-4 no-scrollbar">{renderStep()}</div>

        <footer className="p-8 pb-12 md:p-10 bg-black/5 border-t border-[var(--border-color)] flex gap-4 shrink-0 no-print">
           {!isLastStep ? (
             <>
               <button 
                 onClick={() => stepIndex > 0 && setStepIndex(stepIndex - 1)} 
                 disabled={stepIndex === 0}
                 className="flex-1 h-16 rounded-2xl font-black uppercase text-[var(--text-muted)] text-[11px] tracking-[0.2em] hover:bg-black/5 transition-all disabled:opacity-0"
               >
                 Назад
               </button>
               <Button 
                variant="primary" 
                disabled={!canGoNext}
                className="flex-[2] h-16 shadow-xl uppercase font-black tracking-[0.2em] text-[11px] rounded-2xl group" 
                onClick={() => setStepIndex(stepIndex + 1)}
               >
                 Далі <i className="fa-solid fa-chevron-right ml-2 group-hover:translate-x-1 transition-transform"></i>
               </Button>
             </>
           ) : (
             <>
               <button onClick={() => setStepIndex(stepIndex - 1)} className="flex-1 h-16 rounded-2xl font-black uppercase text-[var(--text-muted)] text-[11px] tracking-[0.2em] hover:bg-black/5 transition-all">Назад</button>
               <Button variant="white" className="flex-1 h-16 border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white uppercase font-black tracking-[0.2em] text-[11px] rounded-2xl shadow-lg" onClick={() => handleFinish(false)}>ЗБЕРЕГТИ</Button>
             </>
           )}
        </footer>
      </div>
    </div>
  );
};

export default DailyReportWizard;