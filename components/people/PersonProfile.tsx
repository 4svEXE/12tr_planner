
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
  }, [initialTab, personId]);

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
    let targetHandle = handle;
    if (!targetHandle) {
      const input = prompt("Введіть нікнейм або email (напр. user@gmail.com або @username):");
      if (!input) return;
      targetHandle = input;
    }

    const cleanHandle = targetHandle.replace('@', '').trim();
    // Використовуємо unavatar.io з підтримкою конкретних провайдерів для кращої точності
    const providerPath = provider ? `${provider}/` : '';
    const newAvatar = `https://unavatar.io/${providerPath}${cleanHandle}?fallback=https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanHandle}`;
    
    handleUpdate({ avatar: newAvatar });
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
    <div className="fixed top-0 right-0 h-full w-full md:w-[540px] bg-[var(--bg-card)] border-l border-[var(--border-color)] z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
       <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex justify-between items-start shrink-0 bg-[var(--bg-card)]">
          <div className="flex items-center gap-4 min-w-0">
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-[var(--bg-main)] ring-2 ring-[var(--primary)]/10 overflow-hidden shadow-md shrink-0 group relative">
                <img 
                  src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
                <button onClick={() => handleFetchSocialAvatar()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-camera text-white text-[10px]"></i></button>
             </div>
             <div className="flex-1 min-w-0">
                <input className="text-base font-black text-[var(--text-main)] bg-transparent border-none p-0 focus:ring-0 w-full mb-0.5 truncate uppercase tracking-tight" value={person.name} onChange={e => handleUpdate({ name: e.target.value })} />
                <div className="flex items-center gap-1.5">
                   <Badge variant="orange" className="text-[6px] uppercase">{person.status}</Badge>
                   <span className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">Karma {person.rating || 0}</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
             <button onClick={handleDelete} className="w-8 h-8 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
             <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
          </div>
       </header>

       <div className="flex border-b border-[var(--border-color)] px-2 shrink-0 overflow-x-auto no-scrollbar bg-[var(--bg-card)]/90 backdrop-blur sticky top-0 z-30">
          {(['dossier', 'dates', 'skills', 'vcard', 'timeline', 'tasks', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-none px-4 py-4 text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              {tab === 'dossier' ? 'Досьє' : tab === 'dates' ? 'Дати' : tab === 'skills' ? 'Деталі' : tab === 'vcard' ? 'Профілі' : tab === 'timeline' ? 'Лог' : tab === 'tasks' ? 'Квести' : 'ШІ'}
              {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[var(--primary)] rounded-full"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-[var(--bg-main)]/10">
          {activeTab === 'dossier' && <DossierTab person={person} onUpdate={handleUpdate} onAddInteraction={handleAddKarmaLog} />}
          {activeTab === 'dates' && <DatesTab person={person} onUpdate={handleUpdate} />}
          {activeTab === 'skills' && <InfoTab person={person} onUpdate={handleUpdate} onAddHobby={h => handleUpdate({ hobbies: [...person.hobbies, h] })} onAddSkill={s => handleUpdate({ tags: [...person.tags, s] })} relationshipTypes={relationshipTypes} onAddRelType={addRelationshipType} />}
          {activeTab === 'vcard' && <SocialsTab person={person} onUpdate={handleUpdate} onFetchAvatar={handleFetchSocialAvatar} />}
          {activeTab === 'timeline' && <TimelineTab person={person} onAddInteraction={handleAddKarmaLog} onDeleteInteraction={id => deleteInteraction(person.id, id)} />}
          {activeTab === 'tasks' && <TasksTab person={person} tasks={tasks} onAddTask={(title, date) => addTask(title, 'tasks', undefined, 'actions', true, date, person.id, TaskStatus.NEXT_ACTION)} onToggleTask={toggleTaskStatus} />}
          {activeTab === 'ai' && <AiStrategyTab person={person} aiEnabled={aiEnabled} isAnalyzing={isAnalyzing} onAnalyze={handleGenerateAI} />}
       </div>

       <footer className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex gap-3 shrink-0 mb-safe">
          <Button variant="white" onClick={onClose} className="flex-1 rounded-xl py-3 font-black uppercase text-[8px] tracking-widest">ЗАКРИТИ</Button>
       </footer>
    </div>
  );
};

export default PersonProfile;
