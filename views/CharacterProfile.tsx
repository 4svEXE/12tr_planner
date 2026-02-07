
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskStatus, Character } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

type ProfileTab = 'status' | 'identity' | 'evolution';

const CharacterProfile: React.FC = () => {
  const { character, updateCharacter, tasks, cycle, diary, hobbies } = useApp();
  const { user, isGuest, setIsAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('status');

  const gtdStats = useMemo(() => ({
    done: tasks.filter(t => t.status === TaskStatus.DONE && !t.isDeleted).length
  }), [tasks]);

  const lifeSpheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse', color: '#f43f5e' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase', color: '#6366f1' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins', color: '#10b981' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader', color: '#f59e0b' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group', color: '#ec4899' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch', color: '#06b6d4' },
  ];

  const syncWithGoogle = () => {
    if (user) {
      updateCharacter({
        name: user.displayName || character.name,
        avatarUrl: user.photoURL || character.avatarUrl
      });
    }
  };

  const renderTabTrigger = (id: ProfileTab, label: string, icon: string) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
        activeTab === id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100'
      }`}
    >
      <i className={`fa-solid ${icon}`}></i>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-32">
      {/* HERO HEADER */}
      <div className="bg-white border-b border-slate-100 px-6 py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -z-0"></div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] bg-white p-1 shadow-2xl ring-4 ring-orange-50 relative overflow-hidden group">
            <img src={character.avatarUrl} alt="Hero" className="w-full h-full object-cover rounded-[2rem] bg-slate-50 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <i className="fa-solid fa-camera text-white"></i>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <Typography variant="h1" className="text-3xl">{character.name}</Typography>
              <Badge variant="orange">LVL {character.level}</Badge>
            </div>
            <Typography variant="tiny" className="text-slate-400 font-black tracking-widest uppercase">{character.role || character.archetype}</Typography>
            
            <div className="flex gap-4 mt-6 overflow-x-auto no-scrollbar pb-2">
              {renderTabTrigger('status', 'Стан', 'fa-bolt-lightning')}
              {renderTabTrigger('identity', 'Ідентичність', 'fa-user-gear')}
              {renderTabTrigger('evolution', 'Еволюція', 'fa-chart-line')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* CLOUD SYNC SECTION */}
        <section className="mb-10">
          {isGuest ? (
            <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-200 overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-all" onClick={() => setIsAuthModalOpen(true)}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10"></div>
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                       <i className="fa-solid fa-cloud-arrow-up animate-bounce"></i>
                    </div>
                    <div className="text-center md:text-left">
                       <Typography variant="h3" className="text-white text-lg mb-1">Збережіть свій прогрес</Typography>
                       <p className="text-xs text-white/70 font-medium">Увійдіть через Google, щоб синхронізувати квести та AI-профіль</p>
                    </div>
                  </div>
                  <Button variant="white" className="w-full md:w-auto px-8 py-4 rounded-2xl text-indigo-600 font-black shadow-lg">УВІЙТИ ЗАРАЗ</Button>
               </div>
            </Card>
          ) : (
            <Card padding="md" className="bg-emerald-50 border-emerald-100 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <img src={user?.photoURL || ''} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" />
                  <div>
                    <Typography variant="tiny" className="text-emerald-600 font-black uppercase text-[8px] tracking-widest">Хмарний зв'язок активний</Typography>
                    <div className="text-xs font-bold text-slate-700">{user?.email}</div>
                  </div>
               </div>
               <button onClick={syncWithGoogle} className="px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Оновити з Google</button>
            </Card>
          )}
        </section>

        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-300">
             <section className="space-y-6">
                <Typography variant="h2" className="text-xl font-black">Показники Героя</Typography>
                <div className="grid grid-cols-2 gap-4">
                   <Card padding="md" className="bg-rose-50/50 border-rose-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-rose-600">Енергія</span>
                        <span className="text-lg font-black text-rose-600">{character.energy}%</span>
                      </div>
                      <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${character.energy}%` }}></div>
                      </div>
                   </Card>
                   <Card padding="md" className="bg-indigo-50/50 border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600">Фокус</span>
                        <span className="text-lg font-black text-indigo-600">{character.focus}%</span>
                      </div>
                      <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${character.focus}%` }}></div>
                      </div>
                   </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {lifeSpheres.map(sphere => {
                      const val = (character.stats as any)[sphere.key] || 0;
                      return (
                        <Card key={sphere.key} padding="sm" className="border-slate-100 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: sphere.color }}>
                              <i className={`fa-solid ${sphere.icon} text-[10px]`}></i>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black text-slate-800 uppercase">{sphere.label}</span>
                                <span className="text-[8px] font-bold text-slate-400">LVL {Math.floor(val/10)}</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000" style={{ width: `${val}%`, backgroundColor: sphere.color }}></div>
                              </div>
                           </div>
                        </Card>
                      );
                   })}
                </div>
             </section>

             <section className="space-y-6">
                <Typography variant="h2" className="text-xl font-black">Дерево Навичок</Typography>
                <div className="space-y-3">
                   {character.skills.map(skill => (
                      <Card key={skill.name} padding="md" className="border-slate-100 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg"><i className={`fa-solid ${skill.icon}`}></i></div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-xs font-black uppercase text-slate-800">{skill.name}</span>
                               <span className="text-[9px] font-bold text-slate-400">LVL {skill.level}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-orange-500" style={{ width: `${skill.xp % 100}%` }}></div>
                            </div>
                         </div>
                      </Card>
                   ))}
                   {character.skills.length === 0 && (
                      <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl text-center opacity-30">
                        <i className="fa-solid fa-seedling text-3xl mb-2"></i>
                        <p className="text-[10px] font-black uppercase">Навички з'являться з досвідом</p>
                      </div>
                   )}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2">
                      <i className="fa-solid fa-scroll text-orange-500"></i> Bio & Візія
                   </Typography>
                   <Card padding="md" className="space-y-4">
                      <div>
                         <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Роль Героя</label>
                         <input value={character.role} onChange={e => updateCharacter({ role: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-orange-100 outline-none" />
                      </div>
                      <div>
                         <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Життєпис</label>
                         <textarea value={character.bio} onChange={e => updateCharacter({ bio: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-orange-100 outline-none min-h-[80px] resize-none" />
                      </div>
                      <div>
                         <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Глобальна Візія</label>
                         <textarea value={character.vision} onChange={e => updateCharacter({ vision: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-medium italic focus:ring-2 focus:ring-orange-100 outline-none min-h-[60px] resize-none border-l-2 border-orange-200" />
                      </div>
                   </Card>
                </div>

                <div className="space-y-4">
                   <Typography variant="tiny" className="text-slate-900 font-black uppercase flex items-center gap-2">
                      <i className="fa-solid fa-shield-heart text-indigo-500"></i> Кодекс & Переконання
                   </Typography>
                   <Card padding="md" className="space-y-4">
                      <div>
                         <label className="text-[8px] font-black uppercase text-slate-400 block mb-2">Цінності</label>
                         <div className="flex flex-wrap gap-2 mb-2">
                            {character.views.map((v, i) => <Badge key={i} variant="indigo" className="text-[8px] lowercase">{v}</Badge>)}
                         </div>
                         <button onClick={() => { const v = prompt('Нова цінність:'); if(v) updateCharacter({ views: [...character.views, v] }); }} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">+ Додати цінність</button>
                      </div>
                      <div>
                         <label className="text-[8px] font-black uppercase text-slate-400 block mb-2">Переконання (Beliefs)</label>
                         <div className="space-y-1.5">
                            {character.beliefs.map((b, i) => (
                               <div key={i} className="text-xs font-medium text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                  {b}
                               </div>
                            ))}
                         </div>
                         <button onClick={() => { const b = prompt('Нове переконання:'); if(b) updateCharacter({ beliefs: [...character.beliefs, b] }); }} className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">+ Додати переконання</button>
                      </div>
                   </Card>
                </div>
             </section>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 text-white p-8 border-none flex flex-col items-center justify-center text-center">
                   <div className="text-[10px] font-black text-orange-500 uppercase mb-2">Усього досвіду</div>
                   <div className="text-4xl font-black">{character.xp}</div>
                   <Typography variant="tiny" className="text-slate-500 mt-2">XP POINTS</Typography>
                </Card>
                <Card className="p-8 border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Тижнів у системі</div>
                   <div className="text-4xl font-black text-slate-900">{cycle.currentWeek}</div>
                   <Typography variant="tiny" className="text-slate-300 mt-2">12TR WEEK</Typography>
                </Card>
                <Card className="p-8 border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Квестів закрито</div>
                   <div className="text-4xl font-black text-emerald-600">{gtdStats.done}</div>
                   <Typography variant="tiny" className="text-slate-300 mt-2">COMPLETED QUESTS</Typography>
                </Card>
             </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterProfile;
