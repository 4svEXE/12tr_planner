
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Person, Task, TaskStatus, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { analyzePersonPortrait } from '../../services/geminiService';

// Tabs
import DossierTab from './DossierTab';
import InfoTab from './InfoTab'; 
import DatesTab from './DatesTab'; 
import SocialsTab from './SocialsTab';
import TimelineTab from './TimelineTab';
import TasksTab from './TasksTab';
import AiStrategyTab from './AiStrategyTab';

interface PersonProfileProps {
  personId: string;
  onClose: () => void;
  initialTab?: 'dossier' | 'dates' | 'skills' | 'vcard' | 'timeline' | 'tasks' | 'ai';
}

const PersonProfile: React.FC<PersonProfileProps> = ({ personId, onClose, initialTab = 'dossier' }) => {
  const { 
    people, updatePerson, character, 
    aiEnabled, tasks, addTask, toggleTaskStatus,
    addInteraction, deleteInteraction, relationshipTypes, addRelationshipType, deletePerson
  } = useApp();
  
  const person = people.find(p => p.id === personId);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleFetchSocialAvatar = (handle?: string, provider?: string) => {
    let targetHandle = handle || prompt("Введіть нікнейм або email:");
    if (targetHandle) {
      const cleanHandle = targetHandle.replace('@', '').trim();
      const newAvatar = `https://unavatar.io/${cleanHandle}?fallback=https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}`;
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
    } catch (e) { 
      alert('Помилка ШІ аналізу.'); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleDelete = () => {
    if (confirm(`Видалити контакт ${person.name} назавжди?`)) {
      deletePerson(person.id);
      onClose();
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[580px] bg-[var(--bg-card)] border-l border-[var(--border-color)] z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
       <header className="p-4 md:p-8 border-b border-[var(--border-color)] flex justify-between items-start shrink-0 bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
             <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] bg-[var(--bg-main)] ring-2 md:ring-4 ring-[var(--primary)]/10 overflow-hidden shadow-lg shrink-0 group relative">
                <img 
                  src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
                <button onClick={() => handleFetchSocialAvatar()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-sync text-white text-xs"></i></button>
             </div>
             <div className="flex-1 min-w-0">
                <input className="text-base md:text-xl font-black text-[var(--text-main)] bg-transparent border-none p-0 focus:ring-0 w-full mb-0.5 md:mb-1 truncate uppercase tracking-tight" value={person.name} onChange={e => handleUpdate({ name: e.target.value })} />
                <div className="flex items-center gap-1 md:gap-2">
                   <Badge variant="orange" className="text-[6px] md:text-[8px] uppercase">{person.status}</Badge>
                   <Badge variant="yellow" className="text-[6px] md:text-[8px] uppercase">Karma {person.rating || 0}</Badge>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
             <button onClick={handleDelete} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all" title="Видалити союзника"><i className="fa-solid fa-trash-can text-xs"></i></button>
             <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all" title="Закрити"><i className="fa-solid fa-xmark text-xs md:text-sm"></i></button>
          </div>
       </header>

       <div className="flex border-b border-[var(--border-color)] px-1 md:px-4 shrink-0 overflow-x-auto no-scrollbar bg-[var(--bg-card)]/90 backdrop-blur sticky top-0 z-30">
          {(['dossier', 'dates', 'skills', 'vcard', 'timeline', 'tasks', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-none md:flex-1 min-w-[65px] md:min-w-[80px] px-3 py-3 md:py-4 text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
              {tab === 'dossier' ? 'Досьє' : tab === 'dates' ? 'Дати' : tab === 'skills' ? 'Деталі' : tab === 'vcard' ? 'Профілі' : tab === 'timeline' ? 'Лог' : tab === 'tasks' ? 'Квести' : 'ШІ'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)]"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-[var(--bg-card)]">
          {activeTab === 'dossier' && <DossierTab person={person} onUpdate={handleUpdate} onAddInteraction={handleAddKarmaLog} />}
          {activeTab === 'dates' && <DatesTab person={person} onUpdate={handleUpdate} />}
          {activeTab === 'skills' && <InfoTab person={person} onUpdate={handleUpdate} onAddHobby={h => handleUpdate({ hobbies: [...person.hobbies, h] })} onAddSkill={s => handleUpdate({ tags: [...person.tags, s] })} relationshipTypes={relationshipTypes} onAddRelType={addRelationshipType} />}
          {activeTab === 'vcard' && <SocialsTab person={person} onUpdate={handleUpdate} onFetchAvatar={handleFetchSocialAvatar} />}
          {activeTab === 'timeline' && <TimelineTab person={person} onAddInteraction={handleAddKarmaLog} onDeleteInteraction={id => deleteInteraction(person.id, id)} />}
          {activeTab === 'tasks' && <TasksTab person={person} tasks={tasks} onAddTask={(title, date) => addTask(title, 'tasks', undefined, 'actions', true, date, person.id, TaskStatus.NEXT_ACTION)} onToggleTask={toggleTaskStatus} />}
          {activeTab === 'ai' && <AiStrategyTab person={person} aiEnabled={aiEnabled} isAnalyzing={isAnalyzing} onAnalyze={handleGenerateAI} />}
       </div>

       <footer className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-main)]/50 backdrop-blur flex gap-3 md:gap-4 shrink-0 mb-safe">
          <Button variant="white" onClick={onClose} className="flex-1 rounded-xl md:rounded-2xl py-2.5 md:py-4 font-black uppercase text-[7px] md:text-[10px] tracking-widest shadow-sm">ЗАКРИТИ</Button>
       </footer>
    </div>
  );
};

export default PersonProfile;
