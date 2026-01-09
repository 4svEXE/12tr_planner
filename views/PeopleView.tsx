
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, PersonStatus, RelationshipLoop, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PersonProfile from '../components/people/PersonProfile';
import { useResizer } from '../hooks/useResizer';

const PeopleView: React.FC = () => {
  const { people, addPerson, relationshipTypes, addRelationshipType, tasks, toggleTaskStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<{ active: boolean; status: string }>({ active: false, status: 'acquaintance' });
  const [newName, setNewName] = useState('');
  
  const { isResizing, startResizing, detailsWidth: sidebarWidth } = useResizer(320, 500);

  const statusTranslations: Record<string, string> = {
    'all': 'Усі',
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
    if (person.loop === 'none' || !person.lastInteractionAt) return { label: 'Новий', color: 'slate', icon: 'fa-seedling', urgent: false };
    
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

    const limit = thresholds[person.loop] || 30;
    if (days > limit * 1.5) return { label: 'Забуто', color: 'rose', icon: 'fa-skull-crossbones', urgent: true };
    if (days > limit) return { label: 'Охололо', color: 'amber', icon: 'fa-wind', urgent: true };
    if (days < limit * 0.3) return { label: 'Активно', color: 'emerald', icon: 'fa-fire', urgent: false };
    return { label: 'Норма', color: 'orange', icon: 'fa-handshake-angle', urgent: false };
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

  const stats = useMemo(() => {
    const urgentList = people.filter(p => getRelationshipHealth(p).urgent);
    const personTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.personId);
    const activeCount = people.filter(p => {
        const h = getRelationshipHealth(p);
        return h.color === 'emerald' || h.color === 'orange';
    }).length;

    return { 
        urgent: urgentList.length, 
        urgentList,
        personTasks,
        activeCount,
        total: people.length,
        healthScore: people.length > 0 ? Math.round((activeCount / people.length) * 100) : 0
    };
  }, [people, tasks]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const status = isAdding.status === 'all' ? 'acquaintance' : isAdding.status;
      const id = addPerson(newName.trim(), status);
      setNewName('');
      setIsAdding({ active: false, status: 'acquaintance' });
      setSelectedPersonId(id);
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-4 md:p-8 bg-white border-b border-slate-100 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shrink-0"><i className="fa-solid fa-users-between-lines"></i></div>
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
                  placeholder="Пошук..." 
                  className="w-full bg-slate-50 border-none rounded-2xl py-2.5 md:py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-100 transition-all outline-none" 
                />
             </div>
             <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setViewMode('grid')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-table-cells-large"></i></button>
                <button onClick={() => setViewMode('list')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><i className="fa-solid fa-list-ul"></i></button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-50/20">
          <div className="max-w-5xl mx-auto space-y-6 pb-32">
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
               <button onClick={() => setActiveFilter('all')} className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeFilter === 'all' ? 'bg-slate-900 text-white shadow-lg border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}>
                  <span>Усі</span>
                  <Badge variant={activeFilter === 'all' ? 'orange' : 'slate'} className="text-[8px] px-1 py-0">{people.length}</Badge>
                  {activeFilter === 'all' && <i onClick={(e) => { e.stopPropagation(); setIsAdding({ active: true, status: 'acquaintance' }); }} className="fa-solid fa-plus-circle text-orange-500 hover:scale-110"></i>}
               </button>
               {allAvailableStatuses.map(s => {
                 const count = people.filter(p => p.status === s).length;
                 return (
                   <button key={s} onClick={() => setActiveFilter(s)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeFilter === s ? 'bg-orange-600 text-white shadow-lg border-orange-600' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}>
                      <span>{getTranslatedStatus(s)}</span>
                      {/* Fixed: Changed 'white' variant to 'slate' to match types defined in Badge.tsx */}
                      <Badge variant={activeFilter === s ? 'slate' : 'slate'} className="text-[8px] px-1 py-0">{count}</Badge>
                      {activeFilter === s && <i onClick={(e) => { e.stopPropagation(); setIsAdding({ active: true, status: s }); }} className="fa-solid fa-plus-circle text-white hover:scale-110"></i>}
                   </button>
                 );
               })}
               <button 
                onClick={() => { const t = prompt('Назва нового типу зв\'язку:'); if(t) addRelationshipType(t); }} 
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-orange-500 hover:border-orange-200 transition-all shrink-0 shadow-sm"
                title="Додати категорію"
               >
                 <i className="fa-solid fa-folder-plus text-sm"></i>
               </button>
            </div>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
              {filteredPeople.map(person => {
                const health = getRelationshipHealth(person);
                return (
                  <Card 
                    key={person.id} 
                    hover 
                    padding="none" 
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`bg-white border-slate-100 overflow-hidden group cursor-pointer transition-all ${health.urgent ? 'ring-2 ring-rose-100' : 'shadow-sm'} ${viewMode === 'list' ? 'flex items-center gap-4 px-4 py-3' : ''}`}
                  >
                    <div className={viewMode === 'grid' ? "p-5" : "flex items-center gap-4 flex-1 min-w-0"}>
                       <div className={`${viewMode === 'grid' ? 'flex flex-col items-center text-center mb-4' : 'flex items-center gap-4 min-w-0 flex-1'}`}>
                          <div className={`${viewMode === 'grid' ? 'w-20 h-20 rounded-[2.2rem] mb-4' : 'w-12 h-12 rounded-xl'} bg-slate-50 p-1 ring-2 ring-slate-50 shadow-inner shrink-0 overflow-hidden relative transition-transform group-hover:scale-105`}>
                             <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover rounded-[1.8rem]" />
                             {health.urgent && <div className="absolute top-1 right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <Typography variant="h3" className={`${viewMode === 'grid' ? 'text-base' : 'text-sm'} truncate mb-0.5 group-hover:text-orange-600 transition-colors uppercase tracking-tight`}>{person.name}</Typography>
                             <div className={`flex items-center gap-1.5 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                                <Badge variant="slate" className="text-[7px] px-1 py-0">{getTranslatedStatus(person.status)}</Badge>
                                <div className={`flex items-center gap-1 text-${health.color}-500 font-black text-[7px] uppercase`}>
                                   <i className={`fa-solid ${health.icon}`}></i>
                                   <span>{health.label}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       {viewMode === 'grid' && person.description && (
                         <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic text-center mb-4 px-2">{person.description}</p>
                       )}
                    </div>
                  </Card>
                );
              })}
              
              <button 
                onClick={() => setIsAdding({ active: true, status: activeFilter === 'all' ? 'acquaintance' : activeFilter })}
                className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-300 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all min-h-[160px]"
              >
                 <i className="fa-solid fa-user-plus text-2xl mb-3"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Додати контакт</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside style={{ width: sidebarWidth }} className="border-l border-slate-100 bg-white hidden xl:flex flex-col h-full shrink-0 relative">
         <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-transparent'}`}></div>
         
         <header className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div>
               <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest mb-1">Network Intelligence</Typography>
               <Typography variant="h2" className="text-lg">Аналітика зв'язків</Typography>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center"><i className="fa-solid fa-chart-pie"></i></div>
         </header>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/10">
            <section className="space-y-4">
               <Typography variant="tiny" className="text-slate-900 font-black uppercase text-[9px]">Стан мережі (Health Index)</Typography>
               <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 blur-3xl"></div>
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        <div className="text-3xl font-black">{stats.healthScore}%</div>
                        <div className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Global Health</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400">{stats.activeCount} / {stats.total}</div>
                        <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Active Contacts</div>
                     </div>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]" style={{ width: `${stats.healthScore}%` }}></div>
                  </div>
               </div>
            </section>

            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <Typography variant="tiny" className="text-slate-900 font-black uppercase text-[9px] flex items-center gap-2">
                    <i className="fa-solid fa-bolt-lightning text-orange-500"></i> План посилення зв'язку
                  </Typography>
               </div>
               <div className="space-y-2">
                  {stats.urgentList.length > 0 ? stats.urgentList.slice(0, 4).map(p => (
                    <div key={p.id} onClick={() => setSelectedPersonId(p.id)} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-orange-200 group">
                       <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-9 h-9 rounded-xl object-cover" />
                       <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-slate-800 truncate group-hover:text-orange-600">{p.name}</div>
                          <div className="text-[7px] font-bold text-rose-400 uppercase tracking-tighter">Мав бути contact {getTranslatedStatus(p.loop)} назад</div>
                       </div>
                       <button className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center opacity-0 group-hover:opacity-100"><i className="fa-solid fa-paper-plane text-[9px]"></i></button>
                    </div>
                  )) : (
                    <div className="py-8 text-center bg-emerald-50/30 rounded-[2rem] border border-dashed border-emerald-100">
                       <i className="fa-solid fa-circle-check text-emerald-500 mb-2"></i>
                       <p className="text-[9px] font-black text-emerald-600 uppercase">Усі зв'язки в нормі</p>
                    </div>
                  )}
               </div>
            </section>

            <section className="bg-indigo-600 rounded-[2rem] p-5 text-white shadow-lg space-y-3">
               <div className="flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-indigo-200"></i>
                  <Typography variant="tiny" className="font-black text-[9px]">AI СТРАТЕГІЯ МЕРЕЖІ</Typography>
               </div>
               <p className="text-[11px] font-medium leading-relaxed opacity-90">
                  {stats.healthScore < 50 
                    ? "Ваша мережа 'холоне'. AI рекомендує 3 короткі дзвінки союзникам у статусі 'Ментор' цього тижня." 
                    : "Чудова динаміка! Час залучити 'Колег' до нових спільних квестів для підвищення XP."}
               </p>
            </section>

            <section className="space-y-3">
               <Typography variant="tiny" className="text-slate-900 font-black uppercase text-[9px]">Розподіл союзників</Typography>
               <div className="grid grid-cols-2 gap-2">
                  {relationshipTypes.slice(0, 4).map(type => {
                     const count = people.filter(p => p.status === type).length;
                     return (
                        <div key={type} className="p-3 bg-white border border-slate-50 rounded-xl flex items-center justify-between">
                           <span className="text-[8px] font-black uppercase text-slate-400">{getTranslatedStatus(type)}</span>
                           <span className="text-[10px] font-black text-slate-800">{count}</span>
                        </div>
                     );
                  })}
               </div>
            </section>
         </div>
      </aside>

      {isAdding.active && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 tiktok-blur">
           <div className="absolute inset-0 bg-slate-950/40" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}></div>
           <Card className="w-full max-w-sm relative z-10 shadow-2xl p-8 md:p-10 rounded-[2.5rem] bg-white border-none">
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
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                    />
                    <div className="mt-4">
                       <span className="text-[9px] font-black uppercase text-slate-300 block mb-2">Категорія: {getTranslatedStatus(isAdding.status === 'all' ? 'acquaintance' : isAdding.status)}</span>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}>ВІДМІНА</Button>
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
