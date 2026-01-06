
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, PersonStatus } from '../types';
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

  // Список стандартних статусів для перекладу
  const statusTranslations: Record<string, string> = {
    'friend': 'Друг',
    'colleague': 'Колега',
    'family': 'Сім\'я',
    'mentor': 'Ментор',
    'acquaintance': 'Знайомий'
  };

  const getTranslatedStatus = (status: string) => statusTranslations[status] || status;

  // Динамічне отримання всіх існуючих статусів серед людей та глобального списку
  const allAvailableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    relationshipTypes.forEach(t => statuses.add(t));
    people.forEach(p => statuses.add(p.status));
    return Array.from(statuses);
  }, [people, relationshipTypes]);

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [people, searchQuery, activeFilter]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      const id = addPerson(newName.trim());
      setNewName('');
      setIsAdding(false);
      setSelectedPersonId(id);
    }
  };

  const getRelationshipLevel = (person: Person) => {
    const daysSince = person.lastInteractionAt ? (Date.now() - person.lastInteractionAt) / (1000 * 60 * 60 * 24) : 99;
    if (daysSince > 30) return { label: 'Згасає', color: 'rose', icon: 'fa-wind' };
    if (person.rating >= 8) return { label: 'Міцний', color: 'emerald', icon: 'fa-handshake-angle' };
    if (daysSince < 7) return { label: 'Стабільний', color: 'orange', icon: 'fa-shield-heart' };
    return { label: 'Новий', color: 'slate', icon: 'fa-seedling' };
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden relative">
      <header className="p-6 md:p-8 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-users-between-lines"></i></div>
           <div>
              <Typography variant="h1" className="text-2xl leading-none mb-1">Союзники</Typography>
              <Typography variant="tiny" className="text-slate-400 uppercase tracking-[0.1em]">Твоя соціальна стратегія</Typography>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Пошук людей чи тегів..." 
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
              />
           </div>
           <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setViewMode('grid')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-table-cells-large"></i></button>
              <button onClick={() => setViewMode('list')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-list-ul"></i></button>
           </div>
           <Button icon="fa-plus" onClick={() => setIsAdding(true)} className="rounded-2xl px-6 shadow-orange-100 bg-slate-900 text-white hover:bg-slate-800">НОВИЙ СОЮЗНИК</Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-slate-50/30">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
             <button 
               onClick={() => setActiveFilter('all')}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFilter === 'all' ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'}`}
             >
               Усі
             </button>
             {allAvailableStatuses.map(s => (
               <button 
                 key={s} 
                 onClick={() => setActiveFilter(s)}
                 className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFilter === s ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'}`}
               >
                 {getTranslatedStatus(s)}
               </button>
             ))}
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24" : "flex flex-col gap-2 pb-24"}>
            {filteredPeople.map(person => {
              const level = getRelationshipLevel(person);
              return (
                <Card 
                  key={person.id} 
                  hover 
                  padding="none" 
                  onClick={() => setSelectedPersonId(person.id)}
                  className={`bg-white border-slate-100 overflow-hidden group cursor-pointer ${viewMode === 'list' ? 'flex items-center gap-4 px-4 py-3' : ''}`}
                >
                  <div className={viewMode === 'grid' ? "p-6" : "flex items-center gap-4 flex-1 min-w-0"}>
                    <div className={`${viewMode === 'grid' ? 'flex items-center gap-4 mb-5' : 'flex items-center gap-3 min-w-0 flex-1'}`}>
                       <div className={`${viewMode === 'grid' ? 'w-16 h-16 rounded-[2rem]' : 'w-10 h-10 rounded-xl'} bg-slate-50 p-1 ring-2 ring-slate-100 shadow-inner shrink-0 overflow-hidden`}>
                          <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`; }} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <Typography variant="h3" className={`${viewMode === 'grid' ? 'text-sm' : 'text-xs'} truncate mb-0.5 group-hover:text-orange-600 transition-colors`}>{person.name}</Typography>
                          <div className="flex items-center gap-1.5">
                             <Badge variant="slate" className="text-[7px] px-1 py-0">{getTranslatedStatus(person.status)}</Badge>
                             {viewMode === 'grid' && (
                               <div className="flex items-center text-orange-400 gap-0.5 ml-1">
                                  <i className="fa-solid fa-star text-[8px]"></i>
                                  <span className="text-[9px] font-black">{person.rating}</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Зв'язок: {level.label}</span>
                            <span className={`text-${level.color}-500`}><i className={`fa-solid ${level.icon} mr-1`}></i> {Math.round(person.rating * 10)}%</span>
                         </div>
                         <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                            <div className={`h-full bg-${level.color}-500 transition-all duration-1000`} style={{ width: `${person.rating * 10}%` }}></div>
                         </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-6 shrink-0 pr-4">
                         <div className="flex items-center text-orange-400 gap-1 min-w-[32px]">
                            <i className="fa-solid fa-star text-[9px]"></i>
                            <span className="text-[10px] font-black">{person.rating}</span>
                         </div>
                         <span className={`text-[8px] font-black uppercase text-${level.color}-500 min-w-[60px]`}><i className={`fa-solid ${level.icon} mr-1.5`}></i>{level.label}</span>
                         <span className="text-[9px] font-bold text-slate-300 w-24 text-right">
                           {person.lastInteractionAt ? `${new Date(person.lastInteractionAt).toLocaleDateString()}` : '—'}
                         </span>
                      </div>
                    )}
                  </div>
                  
                  {viewMode === 'grid' && (
                    <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                       <div className="flex gap-2">
                          {person.socials.telegram && <i className="fa-brands fa-telegram text-slate-300 hover:text-sky-500 transition-colors"></i>}
                          {person.memories.length > 0 && <i className="fa-solid fa-camera-retro text-slate-300"></i>}
                          {person.notes.length > 0 && <i className="fa-solid fa-note-sticky text-slate-300"></i>}
                       </div>
                       <span className="text-[8px] font-bold text-slate-300 uppercase italic">
                         {person.lastInteractionAt ? `Контакт: ${new Date(person.lastInteractionAt).toLocaleDateString()}` : 'Без контактів'}
                       </span>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredPeople.length === 0 && (
               <div className="col-span-full py-20 text-center opacity-20">
                  <i className="fa-solid fa-users-slash text-6xl mb-4"></i>
                  <Typography variant="h2">Нікого не знайдено</Typography>
                  <Typography variant="body" className="mt-2">Спробуй змінити фільтри чи пошуковий запит.</Typography>
               </div>
            )}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
           <Card className="w-full max-w-sm relative z-10 shadow-2xl p-10 rounded-[2.5rem] bg-white animate-in zoom-in-95 duration-200">
              <Typography variant="h2" className="mb-8">Новий союзник</Typography>
              <form onSubmit={handleQuickAdd} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Повне ім'я / Нік</label>
                    <input 
                      autoFocus 
                      type="text"
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      placeholder="Напр: Ілон Маск" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 transition-all outline-none" 
                    />
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 rounded-2xl" onClick={() => setIsAdding(false)}>ВІДМІНА</Button>
                    <Button type="submit" className="flex-[2] rounded-2xl shadow-lg shadow-orange-100">ДОДАТИ</Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {selectedPersonId && (
        <PersonProfile 
          personId={selectedPersonId} 
          onClose={() => setSelectedPersonId(null)} 
        />
      )}

      {/* Floating Action Button for Mobile or quick access */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-orange-600 text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-40 md:hidden"
      >
        <i className="fa-solid fa-user-plus"></i>
      </button>

      <style>{`
        .bg-emerald-500 { background-color: #10b981; }
        .text-emerald-500 { color: #10b981; }
        .bg-rose-500 { background-color: #f43f5e; }
        .text-rose-500 { color: #f43f5e; }
      `}</style>
    </div>
  );
};

export default PeopleView;
