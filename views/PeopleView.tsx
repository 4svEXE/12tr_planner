
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, PersonStatus, RelationshipLoop } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PersonProfile from '../components/people/PersonProfile';

const PeopleView: React.FC = () => {
  const { people, addPerson, relationshipTypes } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const statusTranslations: Record<string, string> = {
    'friend': 'Друг',
    'colleague': 'Колега',
    'family': 'Сім\'я',
    'mentor': 'Ментор',
    'acquaintance': 'Знайомий'
  };

  const getTranslatedStatus = (status: string) => statusTranslations[status] || status;

  const allAvailableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    relationshipTypes.forEach(t => statuses.add(t));
    people.forEach(p => statuses.add(p.status));
    return Array.from(statuses);
  }, [people, relationshipTypes]);

  const getRelationshipHealth = (person: Person) => {
    if (person.loop === 'none' || !person.lastInteractionAt) return { label: 'Новий', color: 'slate', icon: 'fa-seedling' };
    
    const now = Date.now();
    const diff = now - person.lastInteractionAt;
    const days = diff / (1000 * 60 * 60 * 24);

    const thresholds: Record<RelationshipLoop, number> = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365,
      'none': 9999
    };

    const limit = thresholds[person.loop];
    if (days > limit * 1.5) return { label: 'Давно без контакту', color: 'rose', icon: 'fa-skull-crossbones', urgent: true };
    if (days > limit) return { label: 'Охолоджується', color: 'amber', icon: 'fa-wind', urgent: false };
    if (days < limit * 0.3) return { label: 'Теплий', color: 'emerald', icon: 'fa-fire', urgent: false };
    return { label: 'Стабільний', color: 'orange', icon: 'fa-handshake-angle', urgent: false };
  };

  const filteredPeople = useMemo(() => {
    let list = people.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });

    return list.sort((a, b) => {
      const healthA = getRelationshipHealth(a);
      const healthB = getRelationshipHealth(b);
      if (healthA.urgent && !healthB.urgent) return -1;
      if (!healthA.urgent && healthB.urgent) return 1;
      return (b.lastInteractionAt || 0) - (a.lastInteractionAt || 0);
    });
  }, [people, searchQuery, activeFilter]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const id = addPerson(newName.trim());
      setNewName('');
      setIsAdding(false);
      setSelectedPersonId(id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden relative">
      <header className="p-4 md:p-8 bg-white border-b border-slate-100 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shrink-0"><i className="fa-solid fa-users-between-lines"></i></div>
           <div>
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-xl md:text-2xl leading-none">Союзники</Typography>
                <Badge variant="orange" className="h-5 px-1.5 rounded-lg text-[10px] font-black">{people.length}</Badge>
              </div>
              <Typography variant="tiny" className="text-slate-400 uppercase tracking-[0.1em] hidden md:block">Мережа стратегічних зв'язків</Typography>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Пошук за ім'ям чи скілами..." 
                className="w-full bg-slate-50 border-none rounded-2xl py-2.5 md:py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
              />
           </div>
           <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setViewMode('grid')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-table-cells-large"></i></button>
              <button onClick={() => setViewMode('list')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-list-ul"></i></button>
           </div>
           <button 
             onClick={() => setIsAdding(true)} 
             className="w-10 h-10 md:w-auto md:px-6 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all"
           >
             <i className="fa-solid fa-plus"></i>
             <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">ДОДАТИ</span>
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20">
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             <button onClick={() => setActiveFilter('all')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFilter === 'all' ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200 shadow-sm'}`}>Усі</button>
             {allAvailableStatuses.map(s => (
               <button key={s} onClick={() => setActiveFilter(s)} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFilter === s ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200 shadow-sm'}`}>{getTranslatedStatus(s)}</button>
             ))}
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4" : "flex flex-col gap-2"}>
            {filteredPeople.map(person => {
              const health = getRelationshipHealth(person);
              const daysSince = person.lastInteractionAt ? Math.floor((Date.now() - person.lastInteractionAt) / (1000 * 60 * 60 * 24)) : null;

              return (
                <Card 
                  key={person.id} 
                  hover 
                  padding="none" 
                  onClick={() => setSelectedPersonId(person.id)}
                  className={`bg-white border-slate-100 overflow-hidden group cursor-pointer transition-all ${health.urgent ? 'ring-2 ring-rose-500 ring-offset-2' : 'shadow-sm'} ${viewMode === 'list' ? 'flex items-center gap-4 px-4 py-3' : ''}`}
                >
                  <div className={viewMode === 'grid' ? "p-5" : "flex items-center gap-4 flex-1 min-w-0"}>
                    <div className={`${viewMode === 'grid' ? 'flex flex-col items-center text-center mb-4' : 'flex items-center gap-4 min-w-0 flex-1'}`}>
                       <div className={`${viewMode === 'grid' ? 'w-20 h-20 rounded-[2.2rem] mb-4' : 'w-12 h-12 rounded-xl'} bg-slate-50 p-1 ring-2 ring-slate-50 shadow-inner shrink-0 overflow-hidden relative transition-transform group-hover:scale-105`}>
                          <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover rounded-[1.8rem]" />
                          {health.urgent && <div className="absolute top-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-rose-500 border-2 border-white rounded-full animate-pulse"></div>}
                       </div>
                       <div className="flex-1 min-w-0">
                          <Typography variant="h3" className={`${viewMode === 'grid' ? 'text-base' : 'text-sm'} truncate mb-0.5 group-hover:text-orange-600 transition-colors uppercase tracking-tight`}>{person.name}</Typography>
                          <div className={`flex items-center gap-1.5 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                             <Badge variant="slate" className="text-[7px] px-1 py-0">{getTranslatedStatus(person.status)}</Badge>
                             <div className={`flex items-center gap-1 text-${health.color}-500 font-black text-[7px] uppercase`}>
                                <i className={`fa-solid ${health.icon}`}></i>
                                <span className="hidden sm:inline">{health.label}</span>
                             </div>
                          </div>
                          {viewMode === 'grid' && person.description && (
                             <p className="mt-3 text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic">{person.description}</p>
                          )}
                       </div>
                    </div>

                    {viewMode === 'grid' && (
                       <div className="pt-4 border-t border-slate-50 space-y-3">
                          <div className="flex flex-wrap gap-1 justify-center">
                             {person.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[7px] font-black text-slate-300 uppercase tracking-widest">#{tag}</span>
                             ))}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-300">
                               <span>Останній контакт</span>
                               <span className={daysSince !== null && daysSince > 30 ? 'text-rose-500' : 'text-slate-500'}>
                                  {daysSince === null ? '—' : daysSince === 0 ? 'Сьогодні' : `${daysSince} дн.`}
                               </span>
                            </div>
                            <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                               <div className={`h-full bg-${health.color}-500 transition-all duration-1000 shadow-sm`} style={{ width: person.lastInteractionAt ? `${Math.max(10, 100 - (daysSince || 0) * 2)}%` : '0%' }}></div>
                            </div>
                          </div>
                       </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {filteredPeople.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-20">
                 <i className="fa-solid fa-users-slash text-6xl mb-4"></i>
                 <Typography variant="h3" className="uppercase tracking-widest">Нікого не знайдено</Typography>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           {/* Reduced blur from backdrop-blur-md to backdrop-blur-sm */}
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
           <Card className="w-full max-w-sm relative z-10 shadow-2xl p-8 md:p-10 rounded-[2.5rem] bg-white animate-in zoom-in-95 duration-200 border-none">
              <Typography variant="h2" className="mb-6 md:mb-8 text-xl md:text-2xl">Новий союзник</Typography>
              <form onSubmit={handleQuickAdd} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Ім'я або Позивний</label>
                    <input 
                      autoFocus 
                      type="text" 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                      placeholder="Напр: Арсеній" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all outline-none" 
                    />
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsAdding(false)}>ВІДМІНА</Button>
                    <Button type="submit" className="flex-[2] rounded-2xl py-3.5 shadow-lg shadow-orange-100 text-[10px] font-black uppercase tracking-widest">СТВОРИТИ</Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {selectedPersonId && (
        <PersonProfile personId={selectedPersonId} onClose={() => setSelectedPersonId(null)} />
      )}
    </div>
  );
};

export default PeopleView;
