
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Person, Task, TaskStatus, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { analyzePersonPortrait } from '../../services/geminiService';

// Tabs
import DossierTab from './DossierTab';
import InfoTab from './InfoTab'; // Тепер це вкладка Деталі (Скіли/Хобі/Біо)
import DatesTab from './DatesTab'; // Нова вкладка тільки для дат
import SocialsTab from './SocialsTab';
import TimelineTab from './TimelineTab';
import TasksTab from './TasksTab';
import AiStrategyTab from './AiStrategyTab';

interface PersonProfileProps {
  personId: string;
  onClose: () => void;
}

const PersonProfile: React.FC<PersonProfileProps> = ({ personId, onClose }) => {
  const { 
    people, updatePerson, character, 
    aiEnabled, tasks, addTask, toggleTaskStatus,
    addInteraction, deleteInteraction, relationshipTypes, addRelationshipType
  } = useApp();
  
  const person = people.find(p => p.id === personId);
  const [activeTab, setActiveTab] = useState<'dossier' | 'dates' | 'skills' | 'vcard' | 'timeline' | 'tasks' | 'ai'>('dossier');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    let targetHandle = handle;
    if (!targetHandle) {
      targetHandle = prompt("Введіть нікнейм (напр. oleg_dev):") || undefined;
    }
    if (targetHandle) {
      const newAvatar = `https://unavatar.io/${targetHandle}`;
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

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-[580px] bg-white border-l border-slate-100 z-[110] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
       <header className="p-5 md:p-8 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
             <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-slate-50 ring-4 ring-orange-50 overflow-hidden shadow-xl relative group shrink-0">
                <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover" alt={person.name} />
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
          {(['dossier', 'dates', 'skills', 'vcard', 'timeline', 'tasks', 'ai'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-orange-600' : 'text-slate-400'}`}>
              {tab === 'dossier' ? 'Досьє' : tab === 'dates' ? 'Дати' : tab === 'skills' ? 'Деталі' : tab === 'vcard' ? 'Профілі' : tab === 'timeline' ? 'Лог' : tab === 'tasks' ? 'Справи' : 'ШІ'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></div>}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
          {activeTab === 'dossier' && (
            <DossierTab person={person} onUpdate={handleUpdate} onAddInteraction={handleAddKarmaLog} />
          )}
          
          {activeTab === 'dates' && (
            <DatesTab person={person} onUpdate={handleUpdate} />
          )}

          {activeTab === 'skills' && (
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
            <SocialsTab person={person} onUpdate={handleUpdate} onFetchAvatar={handleFetchSocialAvatar} />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab person={person} onAddInteraction={handleAddKarmaLog} onDeleteInteraction={id => deleteInteraction(person.id, id)} />
          )}

          {activeTab === 'tasks' && (
            <TasksTab 
              person={person} 
              tasks={tasks} 
              onAddTask={(title, date) => addTask(title, 'tasks', undefined, 'actions', true, date, person.id, TaskStatus.NEXT_ACTION)} 
              onToggleTask={toggleTaskStatus} 
            />
          )}

          {activeTab === 'ai' && (
            <AiStrategyTab person={person} aiEnabled={aiEnabled} isAnalyzing={isAnalyzing} onAnalyze={handleGenerateAI} />
          )}
       </div>

       <footer className="p-5 md:p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 shrink-0 mb-safe">
          <Button variant="white" onClick={onClose} className="flex-1 rounded-2xl py-3.5 font-black uppercase text-[10px] tracking-widest shadow-sm">ПОВЕРНУТИСЬ</Button>
       </footer>
    </div>
  );
};

export default PersonProfile;
