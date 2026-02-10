
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PersonProfile from '../components/people/PersonProfile';
import { useResizer } from '../hooks/useResizer';

const PeopleView: React.FC = () => {
  const { people, addPerson, relationshipTypes, tasks, toggleTaskStatus, deletePerson } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string>('dossier');
  const [isAdding, setIsAdding] = useState<{ active: boolean; status: string }>({ active: false, status: 'acquaintance' });
  
  const { detailsWidth: sidebarWidth, startResizing, isResizing } = useResizer(240, 400);

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

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-4 md:p-6 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-users-between-lines"></i></div>
             <div>
                <Typography variant="h2" className="text-lg md:text-xl leading-none font-black uppercase tracking-tight">Мережа</Typography>
                <Typography variant="tiny" className="text-[var(--text-muted)] text-[8px]">Соціальні активи</Typography>
             </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Шукати союзників..." className="flex-1 md:w-56 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 px-4 text-[11px] font-bold outline-none" />
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
                             <Badge variant="slate" className="text-[6px] px-1.5 py-0">{person.status}</Badge>
                             <span className="text-[8px] font-black text-primary uppercase">Karma {person.rating || 0}</span>
                          </div>
                       </div>
                    </div>
                  </Card>
                );
              })}
              <button onClick={() => setIsAdding({ active: true, status: 'acquaintance' })} className="border-2 border-dashed border-theme rounded-2xl p-6 flex flex-col items-center justify-center text-muted hover:border-primary/50 hover:text-primary hover:bg-card transition-all min-h-[100px]">
                 <i className="fa-solid fa-user-plus text-xl mb-1"></i>
                 <span className="text-[8px] font-black uppercase tracking-widest">Додати контакт</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedPersonId && (
        <PersonProfile 
          personId={selectedPersonId} 
          onClose={() => setSelectedPersonId(null)} 
          initialTab={initialTab as any}
        />
      )}
    </div>
  );
};

export default PeopleView;
