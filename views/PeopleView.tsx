import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PersonProfile from '../components/people/PersonProfile';
import { useResizer } from '../hooks/useResizer';

const PEOPLE_FILTER_KEY = '12tr_people_active_filter';

// Внутрішній компонент модалки додавання
const AddPersonModal: React.FC<{ 
  onClose: () => void, 
  onSave: (data: any) => void,
  relationshipTypes: string[] 
}> = ({ onClose, onSave, relationshipTypes }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('acquaintance');

  const statusLabels: Record<string, string> = {
    friend: 'Друг',
    colleague: 'Колега',
    family: 'Сім\'я',
    mentor: 'Ментор',
    acquaintance: 'Знайомий'
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), status });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose}></div>
      <Card className="w-full max-w-sm relative z-10 shadow-2xl p-6 md:p-8 rounded-[2.5rem] bg-card border-theme animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center mb-6">
          <Typography variant="h2" className="text-xl font-black uppercase tracking-tight text-main">Новий Союзник</Typography>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-muted transition-all">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </header>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted mb-1 block ml-0.5 tracking-[0.1em] opacity-60">Повне ім'я</label>
            <input 
              autoFocus 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Як звати героя?.." 
              className="w-full h-10 bg-input border-2 border-theme rounded-2xl px-4 text-sm font-bold outline-none focus:border-primary transition-all text-main shadow-inner" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted mb-1 block ml-0.5 tracking-[0.1em] opacity-60">Статус зв'язку</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="w-full h-10 bg-input border-2 border-theme rounded-2xl px-4 text-sm font-bold outline-none focus:border-primary transition-all text-main appearance-none cursor-pointer shadow-inner"
            >
              {relationshipTypes.map(t => (
                <option key={t} value={t}>{statusLabels[t] || t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted hover:bg-black/5 transition-all border border-theme">Скасувати</button>
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              Створити
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PeopleView: React.FC = () => {
  const { people, addPerson, relationshipTypes, tasks, toggleTaskStatus, deletePerson } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Restore filter preference
  const [activeFilter, setActiveFilterState] = useState<string | 'all'>(() => 
    localStorage.getItem(PEOPLE_FILTER_KEY) || 'all'
  );

  const setActiveFilter = (filter: string) => {
    setActiveFilterState(filter);
    localStorage.setItem(PEOPLE_FILTER_KEY, filter);
  };

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string>('dossier');
  const [isAdding, setIsAdding] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const statusLabels: Record<string, string> = {
    all: 'Всі',
    friend: 'Друзі',
    colleague: 'Колеги',
    family: 'Сім\'я',
    mentor: 'Ментори',
    acquaintance: 'Знайомі'
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePeople = useMemo(() => (people || []).filter(p => !p.isDeleted), [people]);

  const getRelationshipHealth = (person: Person) => {
    if (person.loop === 'none' || !person.lastInteractionAt) return { label: 'Новий', color: 'slate', icon: 'fa-seedling', urgent: false };
    const days = (Date.now() - person.lastInteractionAt) / (1000 * 60 * 60 * 24);
    const thresholds: any = { week: 7, month: 30, quarter: 90, year: 365, none: 9999 };
    const limit = thresholds[person.loop] || 30;
    if (days > limit * 1.5) return { label: 'Забуто', color: 'rose', icon: 'fa-skull-crossbones', urgent: true, level: 0 };
    if (days > limit) return { label: 'Охололо', color: 'amber', icon: 'fa-wind', urgent: true, level: 1 };
    return { label: 'Активно', color: 'emerald', icon: 'fa-fire', urgent: false, level: 2 };
  };

  const getTrustLabel = (rating: number) => {
    if (rating >= 51) return { label: 'Легендарний Партнер', color: 'text-indigo-600', icon: 'fa-crown', glowClass: 'animate-legendary-glow' };
    if (rating >= 21) return { label: 'Союзник', color: 'text-emerald-600', icon: 'fa-shield-halved', glowClass: '' };
    return { label: 'Знайомий', color: 'text-slate-500', icon: 'fa-user', glowClass: '' };
  };

  const filteredPeople = useMemo(() => {
    return activePeople.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [activePeople, searchQuery, activeFilter]);

  const handleSaveNewPerson = (data: any) => {
    addPerson(data);
    setIsAdding(false);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-main overflow-hidden relative text-main transition-none">
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${isMobile && selectedPersonId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="p-4 md:p-6 bg-card border-b border-theme z-20 flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-users-between-lines"></i></div>
               <div>
                  <Typography variant="h2" className="text-lg md:text-xl leading-none font-black uppercase tracking-tight">Мережа</Typography>
                  <Typography variant="tiny" className="text-muted text-[8px]">Соціальні активи</Typography>
               </div>
            </div>
            <div className="flex items-center gap-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Шукати союзників..." className="hidden md:block w-56 bg-main border border-theme rounded-xl py-2 px-4 text-[11px] font-bold outline-none text-main shadow-inner" />
              <Button onClick={() => setIsAdding(true)} icon="fa-plus" size="sm" className="rounded-xl px-4 text-[9px] font-black uppercase">ДОДАТИ</Button>
            </div>
          </div>

          {/* Панель табів фільтрації */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
             {['all', ...relationshipTypes].map(type => (
               <button 
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  activeFilter === type 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-main text-muted border-theme hover:bg-card'
                }`}
               >
                 {statusLabels[type] || type}
               </button>
             ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPeople.map(person => {
                const health = getRelationshipHealth(person);
                const trust = getTrustLabel(person.rating || 0);
                
                return (
                  <Card key={person.id} padding="none" onClick={() => { setSelectedPersonId(person.id); setInitialTab('dossier'); }} 
                    className={`bg-card border-theme shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col relative cursor-pointer ${health.urgent ? 'animate-cooling-glow' : trust.glowClass}`}>
                    <div className="p-5 flex gap-4 items-start">
                       <div className="relative shrink-0">
                          <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-16 h-16 rounded-[1.5rem] bg-main border-2 border-theme shadow-md object-cover" />
                          {health.urgent && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-wind text-[6px] text-white"></i>
                            </div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <Typography variant="h3" className="text-sm font-black uppercase truncate text-main mb-1">{person.name}</Typography>
                          <div className="flex items-center gap-1.5 mb-2">
                             <i className={`fa-solid ${trust.icon} ${trust.color} text-[8px]`}></i>
                             <span className={`text-[7px] font-black uppercase tracking-widest ${trust.color}`}>{trust.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant="slate" className="text-[6px] px-1.5 py-0">{statusLabels[person.status] || person.status}</Badge>
                             <span className="text-[8px] font-black text-primary uppercase">Karma {person.rating || 0}</span>
                          </div>
                       </div>
                    </div>
                  </Card>
                );
              })}
              
              {!isMobile && (
                <button onClick={() => setIsAdding(true)} className="border-2 border-dashed border-theme rounded-2xl p-6 flex flex-col items-center justify-center text-muted hover:border-primary/50 hover:text-primary hover:bg-card transition-all min-h-[100px] group">
                   <i className="fa-solid fa-user-plus text-xl mb-1 group-hover:scale-110 transition-transform"></i>
                   <span className="text-[8px] font-black uppercase tracking-widest">Додати союзника</span>
                </button>
              )}
            </div>

            {filteredPeople.length === 0 && searchQuery && (
              <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center select-none pointer-events-none">
                 <i className="fa-solid fa-user-secret text-7xl mb-6 text-main"></i>
                 <Typography variant="h2" className="text-xl text-main font-black uppercase tracking-widest">Нікого не знайдено</Typography>
              </div>
            )}
          </div>
        </div>

        {/* Мобільний FAB */}
        {isMobile && !selectedPersonId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all border-4 border-card"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>
        )}
      </div>

      {selectedPersonId && (
        <PersonProfile 
          personId={selectedPersonId} 
          onClose={() => setSelectedPersonId(null)} 
          initialTab={initialTab as any}
        />
      )}

      {isAdding && (
        <AddPersonModal 
          onClose={() => setIsAdding(false)} 
          onSave={handleSaveNewPerson} 
          relationshipTypes={relationshipTypes || ['friend', 'colleague', 'family', 'mentor', 'acquaintance']} 
        />
      )}
    </div>
  );
};

export default PeopleView;
