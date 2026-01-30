
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Person, PersonStatus, RelationshipLoop, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import PersonProfile from '../components/people/PersonProfile';
import { useResizer } from '../hooks/useResizer';

const PeopleView: React.FC = () => {
  const { people, addPerson, relationshipTypes, addRelationshipType, tasks, toggleTaskStatus, deletePerson } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string>('dossier');
  const [isAdding, setIsAdding] = useState<{ active: boolean; status: string }>({ active: false, status: 'acquaintance' });
  const [newName, setNewName] = useState('');
  
  const { detailsWidth: sidebarWidth, startResizing, isResizing } = useResizer(240, 400);

  const activePeople = useMemo(() => (people || []).filter(p => !p.isDeleted), [people]);

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
    const counts: Record<string, number> = { all: activePeople.length };
    relationshipTypes.forEach(t => {
      counts[t] = activePeople.filter(p => p.status === t).length;
    });
    return counts;
  }, [activePeople, relationshipTypes]);

  const filteredPeople = useMemo(() => {
    return activePeople.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [activePeople, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const totalKarma = activePeople.reduce((acc, p) => acc + (p.rating || 0), 0);
    const urgentCount = activePeople.filter(p => getRelationshipHealth(p).urgent).length;
    const avgKarma = activePeople.length ? Math.round(totalKarma / activePeople.length) : 0;
    return { avgKarma, urgentCount };
  }, [activePeople]);

  const connectionQuests = useMemo(() => {
    return tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.personId).slice(0, 5);
  }, [tasks]);

  const handleOpenProfile = (id: string, tab: string) => {
    setInitialTab(tab);
    setSelectedPersonId(id);
  };

  const handleDeletePerson = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Перемістити контакт "${name}" у корзину?`)) {
      deletePerson(id);
      if (selectedPersonId === id) setSelectedPersonId(null);
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
            <div className="relative flex-1 md:w-56">
               <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]/50 text-[9px]"></i>
               <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Шукати..." className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2 pl-8 pr-3 text-[11px] font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none text-[var(--text-main)]" />
            </div>
            
            <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg shrink-0 border border-[var(--border-color)]">
               <button onClick={() => setViewMode('grid')} className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}><i className="fa-solid fa-grip text-[10px]"></i></button>
               <button onClick={() => setViewMode('list')} className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}><i className="fa-solid fa-list text-[10px]"></i></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-6 pb-1 -mx-3 px-3 md:mx-0 md:px-0">
               <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-1.5 ${activeFilter === 'all' ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'}`}>
                    УСІ <span className={`text-[7px] opacity-40 ${activeFilter === 'all' ? 'text-white' : 'text-[var(--text-muted)]'}`}>({rubricCounts.all})</span>
               </button>
               {relationshipTypes.map(s => (
                 <button key={s} onClick={() => setActiveFilter(s)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-1.5 ${activeFilter === s ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'}`}>
                    {getTranslatedStatus(s)} <span className={`text-[7px] opacity-40 ${activeFilter === s ? 'text-white' : 'text-[var(--text-muted)]'}`}>({rubricCounts[s] || 0})</span>
                 </button>
               ))}
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPeople.map(person => {
                  const health = getRelationshipHealth(person);
                  const karmaPercent = Math.min(100, Math.max(0, person.rating || 0));
                  return (
                    <Card key={person.id} padding="none" className="bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col w-full relative">
                      <button 
                        onClick={(e) => handleDeletePerson(e, person.id, person.name)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <i className="fa-solid fa-trash-can text-[8px]"></i>
                      </button>

                      <div onClick={() => handleOpenProfile(person.id, 'dossier')} className="p-4 flex gap-4 items-start cursor-pointer">
                         <div className="relative shrink-0">
                            <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] shadow-sm object-cover" />
                            {health.urgent && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-[var(--bg-card)] rounded-full animate-pulse"></div>}
                         </div>
                         <div className="flex-1 min-w-0 text-left">
                            <Typography variant="h3" className="text-[12px] font-black uppercase truncate text-[var(--text-main)] mb-1">{person.name}</Typography>
                            <div className="mb-2 pr-4">
                               <div className="h-1 bg-[var(--bg-main)] rounded-full overflow-hidden flex shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${karmaPercent > 70 ? 'bg-emerald-500' : karmaPercent > 30 ? 'bg-[var(--primary)]' : 'bg-rose-500'}`} style={{ width: `${karmaPercent}%` }}></div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <Badge variant="slate" className="text-[6px] px-1.5 py-0">{getTranslatedStatus(person.status)}</Badge>
                               <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{health.label}</span>
                            </div>
                         </div>
                      </div>
                      <div className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 p-1 grid grid-cols-4 gap-px text-center">
                         <button onClick={() => handleOpenProfile(person.id, 'dossier')} className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-[var(--bg-card)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-all">
                            <i className="fa-solid fa-id-card text-[9px] mb-0.5"></i>
                            <span className="text-[6px] font-black uppercase">Досьє</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'dates')} className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-[var(--bg-card)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-all">
                            <i className="fa-solid fa-calendar-day text-[9px] mb-0.5"></i>
                            <span className="text-[6px] font-black uppercase">Дати</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'timeline')} className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-[var(--bg-card)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-all">
                            <i className="fa-solid fa-clock-rotate-left text-[9px] mb-0.5"></i>
                            <span className="text-[6px] font-black uppercase">Лог</span>
                         </button>
                         <button onClick={() => handleOpenProfile(person.id, 'tasks')} className="flex flex-col items-center justify-center py-2 rounded-lg hover:bg-[var(--bg-card)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-all">
                            <i className="fa-solid fa-bolt text-[9px] mb-0.5"></i>
                            <span className="text-[6px] font-black uppercase">Квести</span>
                         </button>
                      </div>
                    </Card>
                  );
                })}
                <button onClick={() => setIsAdding({ active: true, status: activeFilter === 'all' ? 'acquaintance' : activeFilter })} className="group border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-[var(--bg-card)] transition-all min-h-[120px] w-full">
                   <i className="fa-solid fa-user-plus text-xl mb-2 group-hover:scale-110 transition-transform"></i>
                   <span className="text-[8px] font-black uppercase tracking-widest">Новий контакт</span>
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[300px]">
                      <tbody className="divide-y divide-[var(--border-color)]/30">
                        {filteredPeople.map(person => (
                          <tr key={person.id} onClick={() => handleOpenProfile(person.id, 'dossier')} className="group hover:bg-[var(--bg-main)]/30 transition-colors cursor-pointer">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-8 h-8 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)]" />
                                  <span className="text-[11px] font-black text-[var(--text-main)] truncate uppercase">{person.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant="slate" className="text-[6px] py-0">{getTranslatedStatus(person.status)}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <i className="fa-solid fa-chevron-right text-[8px] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all"></i>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT SOCIAL CAPITAL SIDEBAR */}
      <aside 
        style={{ width: window.innerWidth < 1024 ? '100%' : sidebarWidth }} 
        className={`${window.innerWidth < 1024 ? 'border-t md:border-t-0' : 'border-l'} bg-[var(--bg-sidebar)] border-[var(--border-color)] shrink-0 relative z-[35] flex flex-col h-full`}
      >
        {window.innerWidth >= 1024 && (
          <div 
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-[1.5px] cursor-col-resize hover:bg-[var(--primary)] transition-colors z-50 ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}
          ></div>
        )}

        <header className="p-4 md:p-5 border-b border-[var(--border-color)] shrink-0">
           <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest mb-1 text-[7px]">Аналітика Мережі</Typography>
           <Typography variant="h2" className="text-sm font-black uppercase tracking-tight">Social Capital</Typography>
        </header>

        {/* Додано pb-24 для запобігання перекриття нижнім меню на мобілці */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-5 pb-32 md:pb-6">
           <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="bg-[var(--primary)] p-3 md:p-4 text-white rounded-2xl shadow-lg relative overflow-hidden group">
                 <Typography variant="tiny" className="text-white opacity-60 font-black mb-1 uppercase text-[6px]">Середня Karma</Typography>
                 <div className="text-xl md:text-2xl font-black leading-none">{stats.avgKarma}</div>
                 <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${stats.avgKarma}%` }}></div>
                 </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 md:p-4 text-rose-500">
                 <Typography variant="tiny" className="text-rose-500 opacity-60 font-black mb-1 uppercase text-[6px]">Увага</Typography>
                 <div className="flex items-center justify-between">
                    <span className="text-xl md:text-2xl font-black leading-none">{stats.urgentCount}</span>
                    <i className="fa-solid fa-heart-pulse text-xs animate-pulse"></i>
                 </div>
              </div>
           </div>

           <section className="space-y-3">
              <Typography variant="tiny" className="text-[var(--text-main)] font-black uppercase tracking-widest flex items-center gap-2 text-[8px]">
                 <i className="fa-solid fa-bolt-lightning text-[var(--primary)]"></i> Завдання нетворкінгу
              </Typography>
              <div className="space-y-1.5">
                 {connectionQuests.map(task => {
                    const person = activePeople.find(p => p.id === task.personId);
                    return (
                       <div key={task.id} className="p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all group cursor-pointer shadow-sm">
                          <div className="flex items-start gap-2.5">
                             <button onClick={() => toggleTaskStatus(task)} className="w-4 h-4 rounded border-2 border-[var(--border-color)] mt-0.5 flex items-center justify-center bg-[var(--bg-sidebar)] group-hover:border-[var(--primary)]">
                                <i className="fa-solid fa-check text-[8px] text-transparent group-hover:text-[var(--primary)]"></i>
                             </button>
                             <div className="flex-1 min-w-0" onClick={() => person && handleOpenProfile(person.id, 'tasks')}>
                                <div className="text-[10px] font-bold text-[var(--text-main)] truncate leading-tight">{task.title}</div>
                                {person && <span className="text-[6px] font-black text-[var(--primary)] uppercase tracking-tight">з {person.name}</span>}
                             </div>
                          </div>
                       </div>
                    );
                 })}
                 {connectionQuests.length === 0 && (
                   <div className="p-6 text-center bg-black/5 rounded-2xl border border-dashed border-[var(--border-color)]">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase opacity-40">План порожній</p>
                   </div>
                 )}
              </div>
           </section>
        </div>
      </aside>

      {isAdding.active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 tiktok-blur">
           <div className="absolute inset-0 bg-black/40" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}></div>
           <Card className="w-full max-w-sm relative z-10 shadow-2xl p-8 rounded-[2.5rem] bg-[var(--bg-card)] border-[var(--border-color)]">
              <Typography variant="h2" className="mb-6 text-xl uppercase font-black">Новий контакт</Typography>
              <form onSubmit={handleQuickAdd} className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-2 block ml-1">Ім'я або Позивний</label>
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Введіть ім'я..." className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all text-[var(--text-main)]" />
                 </div>
                 <div className="flex gap-3">
                    <Button variant="white" className="flex-1 py-3" onClick={() => setIsAdding({ active: false, status: 'acquaintance' })}>ВІДМІНА</Button>
                    <Button type="submit" className="flex-[2] py-3 shadow-lg">СТВОРИТИ</Button>
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
