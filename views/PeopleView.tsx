
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const [initialTab, setInitialTab] = useState<string>('dossier');
  const [isAdding, setIsAdding] = useState<{ active: boolean; status: string }>({ active: false, status: 'acquaintance' });
  const [newName, setNewName] = useState('');
  
  const [isAddingRubric, setIsAddingRubric] = useState(false);
  const [newRubricName, setNewRubricName] = useState('');
  const rubricInputRef = useRef<HTMLInputElement>(null);
  
  const { detailsWidth: sidebarWidth, startResizing, isResizing } = useResizer(280, 450);

  const getTranslatedStatus = (status: string) => {
    const map: any = { 
      friend: 'Друг', 
      colleague: 'Колега', 
      family: 'Сім\'я', 
      mentor: 'Ментор', 
      acquaintance: 'Знайомий' 
    };
    return map[status] || (status.charAt(0).toUpperCase() + status.slice(1));
  };

  const getRelationshipHealth = (person: Person) => {
    if (person.loop === 'none' || !person.lastInteractionAt) return { label: 'Новий', color: 'slate', icon: 'fa-seedling', urgent: false };
    const days = (Date.now() - person.lastInteractionAt) / (1000 * 60 * 60 * 24);
    const thresholds: any = { week: 7, month: 30, quarter: 90, year: 365, none: 9999 };
    const limit = thresholds[person.loop] || 30;
    if (days > limit * 1.5) return { label: 'Забуто', color: 'rose', icon: 'fa-skull-crossbones', urgent: true, level: 0 };
    if (days > limit) return { label: 'Охололо', color: 'amber', icon: 'fa-wind', urgent: true, level: 1 };
    return { label: 'Активно', color: 'emerald', icon: 'fa-fire', urgent: false, level: 2 };
  };

  const rubricCounts = useMemo(() => {
    const counts: Record<string, number> = { all: people.length };
    relationshipTypes.forEach(t => {
      counts[t] = people.filter(p => p.status === t).length;
    });
    return counts;
  }, [people, relationshipTypes]);

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [people, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const totalKarma = people.reduce((acc, p) => acc + (p.rating || 0), 0);
    const urgentCount = people.filter(p => getRelationshipHealth(p).urgent).length;
    const avgKarma = people.length ? Math.round(totalKarma / people.length) : 0;
    return { avgKarma, urgentCount };
  }, [people]);

  const connectionQuests = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.personId).slice(0, 5);
  }, [tasks]);

  const handleOpenProfile = (id: string, tab: string) => {
    setInitialTab(tab);
    setSelectedPersonId(id);
  };

  const handleAddRubricSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newRubricName.trim()) {
      const slug = newRubricName.trim().toLowerCase();
      addRelationshipType(slug);
      setActiveFilter(slug);
      setNewRubricName('');
      setIsAddingRubric(false);
    }
  };

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      const status = isAdding.status === 'all' ? 'acquaintance' : isAdding.status;
      const id = addPerson(newName.trim(), status);
      setNewName('');
      setIsAdding({ active: false, status: 'acquaintance' });
      setSelectedPersonId(id);
      setInitialTab('dossier');
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-main overflow-hidden relative text-main">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-4 md:p-8 bg-card border-b border-theme z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
             <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-users-between-lines text-xs md:text-base"></i></div>
             <div>
                <Typography variant="h1" className="text-lg md:text-2xl leading-none mb-0.5">Мережа</Typography>
                <Typography variant="tiny" className="text-muted uppercase tracking-widest text-[7px] md:text-[10px]">Соціальні активи</Typography>
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <i className="fa-solid fa-magnifying-glass absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted/50 text-[9px] md:text-[10px]"></i>
               <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Пошук..." className="w-full bg-main border border-theme rounded-xl py-2 md:py-3 pl-8 md:pl-10 pr-3 text-[11px] md:text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-main" />
            </div>
            
            <div className="flex bg-main p-0.5 md:p-1 rounded-lg md:rounded-xl shrink-0 border border-theme">
               <button onClick={() => setViewMode('grid')} className={`w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted'}`}><i className="fa-solid fa-grip text-[10px] md:text-xs"></i></button>
               <button onClick={() => setViewMode('list')} className={`w-7 h-7 md:w-10 md:h-10 rounded-md md:rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted'}`}><i className="fa-solid fa-list text-[10px] md:text-xs"></i></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6">
          <div className="max-w-6xl mx-auto pb-32">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-4 md:mb-8 pb-1 -mx-3 px-3 md:mx-0 md:px-0">
               <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-1.5 ${activeFilter === 'all' ? 'bg-primary text-white border-primary shadow-md' : 'bg-card text-muted border-theme'}`}>
                    УСІ <span className={`text-[7px] md:text-[8px] opacity-40 ${activeFilter === 'all' ? 'text-white' : 'text-muted'}`}>({rubricCounts.all})</span>
               </button>
               {relationshipTypes.map(s => (
                 <button key={s} onClick={() => setActiveFilter(s)} className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-1.5 ${activeFilter === s ? 'bg-primary text-white border-primary shadow-md' : 'bg-card text-muted border-theme'}`}>
                    {getTranslatedStatus(s)} <span className={`text-[7px] md:text-[8px] opacity-40 ${activeFilter === s ? 'text-white' : 'text-muted'}`}>({rubricCounts[s] || 0})</span>
                 </button>
               ))}
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
                {filteredPeople.map(person => {
                  const health = getRelationshipHealth(person);
                  const personTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.personId === person.id).length;
                  const karmaPercent = Math.min(100, Math.max(0, person.rating || 0));
                  return (
                    <Card key={person.id} padding="none" className="bg-card border-theme shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col w-full">
                      <div onClick={() => handleOpenProfile(person.id, 'dossier')} className="p-4 md:p-5 flex gap-3 md:gap-4 items-start cursor-pointer">
                         <div className="relative shrink-0">
                            <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-main border border-theme shadow-sm object-cover" />
                            {health.urgent && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 md:w-4 md:h-4 bg-rose-500 border-2 border-sidebar rounded-full animate-pulse"></div>}
                         </div>
                         <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-start mb-0.5 md:mb-1">
                               <Typography variant="h3" className="text-[12px] md:text-sm font-black uppercase truncate text-main leading-tight">{person.name}</Typography>
                               {personTasks > 0 && <Badge variant="indigo" className="text-[6px] md:text-[7px] py-0 px-1 shrink-0">Q x{personTasks}</Badge>}
                            </div>
                            <div className="mb-1 md:mb-2">
                               <div className="flex justify-between items-center mb-0.5">
                                  <span className="text-[6px] md:text-[7px] font-black uppercase text-muted tracking-tighter">Karma</span>
                                  <span className="text-[7px] md:text-[8px] font-black text-muted">{person.rating || 0}</span>
                               </div>
                               <div className="h-0.5 md:h-1.5 bg-main rounded-full overflow-hidden flex shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${karmaPercent > 70 ? 'bg-emerald-500' : karmaPercent > 30 ? 'bg-primary' : 'bg-rose-500'}`} style={{ width: `${karmaPercent}%` }}></div>
                               </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                               <Badge variant="slate" className="text-[6px] md:text-[7px] px-1 py-0">{getTranslatedStatus(person.status)}</Badge>
                               <span className="text-[7px] md:text-[8px] font-black text-muted uppercase tracking-tighter">{health.label}</span>
                            </div>
                         </div>
                      </div>
                      <div className="px-4 md:px-5 pb-2 md:pb-4 flex flex-wrap gap-1 md:gap-1.5 overflow-hidden h-4 md:h-6">
                         {person.hobbies.slice(0, 3).map(h => (
                           <span key={h} className="text-[7px] md:text-[8px] font-bold text-muted bg-main px-1.5 md:px-2 py-0.5 rounded-full border border-theme truncate max-w-[70px] md:max-w-[80px]">#{h}</span>
                         ))}
                      </div>
                      <div className="mt-auto border-t border-theme bg-main/30 p-1 md:p-2 grid grid-cols-4 gap-px text-center">
                         <button onClick={() => handleOpenProfile(person.id, 'dossier')} className="flex flex-col items-center justify-center py-1 md:py-2 rounded-lg hover:bg-card hover:text-primary text-muted transition-all">
                            <i className="fa-solid fa-id-card text-[10px] md:text-[11px] mb-0.5"></i>
                            <span className="text-[6px] md:text-[7px] font-black uppercase">Досьє</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'dates')} className="flex flex-col items-center justify-center py-1 md:py-2 rounded-lg hover:bg-card hover:text-primary text-muted transition-all">
                            <i className="fa-solid fa-calendar-day text-[10px] md:text-[11px] mb-0.5"></i>
                            <span className="text-[6px] md:text-[7px] font-black uppercase">Дати</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'timeline')} className="flex flex-col items-center justify-center py-1 md:py-2 rounded-lg hover:bg-card hover:text-primary text-muted transition-all">
                            <i className="fa-solid fa-clock-rotate-left text-[10px] md:text-[11px] mb-0.5"></i>
                            <span className="text-[6px] md:text-[7px] font-black uppercase">Лог</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'tasks')} className="flex flex-col items-center justify-center py-1 md:py-2 rounded-lg hover:bg-card hover:text-primary text-muted transition-all">
                            <i className="fa-solid fa-bolt text-[10px] md:text-[11px] mb-0.5"></i>
                            <span className="text-[6px] md:text-[7px] font-black uppercase">Квести</span>
                         </button>
                      </div>
                    </Card>
                  );
                })}
                <button onClick={() => setIsAdding({ active: true, status: activeFilter === 'all' ? 'acquaintance' : activeFilter })} className="group border-2 border-dashed border-theme rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-muted hover:border-primary/50 hover:text-primary hover:bg-card transition-all min-h-[120px] md:min-h-[160px] w-full">
                   <i className="fa-solid fa-user-plus text-xl md:text-2xl mb-2 md:mb-3 group-hover:scale-110 transition-transform"></i>
                   <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Новий контакт</span>
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-xl md:rounded-3xl border border-theme overflow-hidden shadow-sm">
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[320px]">
                      <thead>
                        <tr className="bg-main/50 border-b border-theme">
                            <th className="px-4 md:px-6 py-3 md:py-4 text-[8px] md:text-[9px] font-black uppercase text-muted tracking-widest">Союзник</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-[8px] md:text-[9px] font-black uppercase text-muted tracking-widest hidden sm:table-cell">HP</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 text-[8px] md:text-[9px] font-black uppercase text-muted tracking-widest">Статус</th>
                            <th className="px-4 md:px-6 py-3 md:py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme/30">
                        {filteredPeople.map(person => {
                            const karmaPercent = Math.min(100, Math.max(0, person.rating || 0));
                            return (
                              <tr key={person.id} onClick={() => handleOpenProfile(person.id, 'dossier')} className="group hover:bg-main/30 transition-colors cursor-pointer">
                                <td className="px-4 md:px-6 py-3 md:py-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-main border border-theme" />
                                      <span className="text-[11px] md:text-[13px] font-black text-main truncate max-w-[100px] md:max-w-none">{person.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 w-24 md:w-48 hidden sm:table-cell">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="flex-1 h-1 md:h-1.5 bg-main rounded-full overflow-hidden">
                                          <div className={`h-full ${karmaPercent > 70 ? 'bg-emerald-500' : karmaPercent > 30 ? 'bg-primary' : 'bg-rose-500'}`} style={{ width: `${karmaPercent}%` }}></div>
                                      </div>
                                      <span className="text-[9px] md:text-[10px] font-black text-muted">{person.rating || 0}</span>
                                    </div>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4">
                                    <Badge variant="slate" className="text-[6px] md:text-[8px] py-0">{getTranslatedStatus(person.status)}</Badge>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                    <div className="flex justify-end gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); handleOpenProfile(person.id, 'timeline'); }} className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-card border border-theme text-muted hover:text-primary flex items-center justify-center"><i className="fa-solid fa-clock-rotate-left text-[10px]"></i></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleOpenProfile(person.id, 'tasks'); }} className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-card border border-theme text-muted hover:text-primary flex items-center justify-center"><i className="fa-solid fa-bolt text-[10px]"></i></button>
                                    </div>
                                </td>
                              </tr>
                            );
                        })}
                      </tbody>
                    </table>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <aside 
        style={{ width: window.innerWidth < 1024 ? '100%' : sidebarWidth }} 
        className={`${window.innerWidth < 1024 ? 'border-t md:border-t-0' : 'border-l'} bg-sidebar border-theme shrink-0 relative z-30 flex flex-col`}
      >
        {window.innerWidth >= 1024 && (
          <div 
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-[1.5px] cursor-col-resize hover:bg-primary transition-colors z-50 ${isResizing ? 'bg-primary' : 'bg-theme'}`}
          ></div>
        )}

        <header className="p-5 md:p-6 border-b border-theme shrink-0">
           <Typography variant="tiny" className="text-muted font-black uppercase tracking-widest mb-1">Аналітика Мережі</Typography>
           <Typography variant="h2" className="text-base md:text-lg">Social Capital</Typography>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6 md:space-y-8">
           <section className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-primary p-4 md:p-5 text-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                 <Typography variant="tiny" className="text-white opacity-60 font-black mb-1 uppercase text-[7px]">Середня Karma</Typography>
                 <div className="text-2xl md:text-3xl font-black">{stats.avgKarma}</div>
                 <div className="mt-2 md:mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white shadow-[0_0_8px_white]" style={{ width: `${stats.avgKarma}%` }}></div>
                 </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 text-rose-500">
                 <Typography variant="tiny" className="text-rose-500 opacity-60 font-black mb-1 uppercase text-[7px]">Потребують уваги</Typography>
                 <div className="flex items-center justify-between">
                    <span className="text-2xl md:text-3xl font-black">{stats.urgentCount}</span>
                    <i className="fa-solid fa-heart-pulse text-rose-500 text-lg md:text-xl animate-pulse"></i>
                 </div>
              </div>
           </section>

           <section className="space-y-3 md:space-y-4">
              <Typography variant="tiny" className="text-main font-black uppercase tracking-widest flex items-center gap-2 text-[9px]">
                 <i className="fa-solid fa-bolt-lightning text-primary"></i> Зміцнення зв'язків
              </Typography>
              <div className="space-y-2">
                 {connectionQuests.map(task => {
                    const person = people.find(p => p.id === task.personId);
                    return (
                       <div key={task.id} className="p-3 bg-main border border-theme rounded-2xl hover:bg-card hover:border-primary transition-all group cursor-pointer shadow-sm">
                          <div className="flex items-start gap-3">
                             <button onClick={() => toggleTaskStatus(task)} className="w-5 h-5 rounded-lg border-2 border-theme mt-0.5 flex items-center justify-center bg-sidebar group-hover:border-primary">
                                <i className="fa-solid fa-check text-[9px] text-transparent group-hover:text-primary"></i>
                             </button>
                             <div className="flex-1 min-w-0" onClick={() => person && handleOpenProfile(person.id, 'tasks')}>
                                <div className="text-[10px] md:text-[11px] font-black text-main truncate mb-1">{task.title}</div>
                                {person && <span className="text-[7px] md:text-[8px] font-black text-primary uppercase">з {person.name}</span>}
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </section>
        </div>
      </aside>

      {isAdding.active && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 tiktok-blur">
           <div className="absolute inset-0 bg-black/40" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}></div>
           <Card className="w-full max-w-sm relative z-10 shadow-2xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-card border-theme">
              <Typography variant="h2" className="mb-4 md:mb-6 text-lg md:text-xl">Новий союзник</Typography>
              <form onSubmit={handleQuickAdd} className="space-y-4 md:space-y-6">
                 <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-muted tracking-widest mb-1.5 md:mb-2 block">Позивний / Ім'я</label>
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Арсеній..." className="w-full bg-main border border-theme rounded-xl py-3 md:py-4 px-4 md:px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all text-main" />
                 </div>
                 <div className="flex gap-3 md:gap-4">
                    <Button variant="white" className="flex-1 rounded-xl md:rounded-2xl py-3" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}>ВІДМІНА</Button>
                    <Button type="submit" className="flex-[2] rounded-xl md:rounded-2xl shadow-lg py-3">СТВОРИТИ</Button>
                 </div>
              </form>
           </Card>
        </div>
      )}

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
