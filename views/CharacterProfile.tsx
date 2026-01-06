
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, Priority } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const CharacterProfile: React.FC = () => {
  const { character, updateCharacter, tasks, cycle, diary, projects } = useApp();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [showVision, setShowVision] = useState(false);

  // Calculate dynamic level based on spheres
  const totalLevel = useMemo(() => {
    // Fixed: Cast stats values to number
    const sum = Object.values(character.stats).reduce((a, b) => (a as number) + (b as number), 0) as number;
    return Math.floor(sum / 10);
  }, [character.stats]);

  const gtdStats = useMemo(() => ({
    inbox: tasks.filter(t => t.status === TaskStatus.INBOX && !t.isDeleted).length,
    next: tasks.filter(t => t.status === TaskStatus.NEXT_ACTION && !t.isDeleted).length,
    waiting: tasks.filter(t => t.status === TaskStatus.WAITING && !t.isDeleted).length,
    someday: tasks.filter(t => t.projectId === 'someday' && !t.isDeleted).length
  }), [tasks]);

  const mainGoal = useMemo(() => {
    const strategic = projects.filter(p => p.isStrategic).sort((a, b) => (b.progress || 0) - (a.progress || 0));
    return strategic[0] || null;
  }, [projects]);

  const lifeSpheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse', color: 'rose' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase', color: 'indigo' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins', color: 'emerald' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader', color: 'amber' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group', color: 'pink' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch', color: 'cyan' },
  ];

  const updateStat = (key: string, val: number) => {
    updateCharacter({ stats: { ...character.stats, [key]: Math.min(100, Math.max(0, val)) } });
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Avatar & Core Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card blur padding="lg" className="text-center relative overflow-hidden group border-none shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-500 to-pink-500 opacity-10"></div>
            
            <div className="relative pt-6">
               <div className="w-40 h-40 mx-auto rounded-[3rem] bg-white p-1 shadow-2xl ring-4 ring-orange-50 relative">
                  <img 
                    src={character.avatarUrl} 
                    alt="Hero" 
                    className="w-full h-full rounded-[2.5rem] object-cover bg-slate-50"
                  />
                  <button 
                    onClick={() => {
                      const newName = prompt('Як звуть твого героя?', character.name);
                      if (newName) updateCharacter({ name: newName });
                    }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                  >
                    <i className="fa-solid fa-pen-nib text-xs"></i>
                  </button>
               </div>
               
               <div className="mt-8 space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <Typography variant="h1" className="text-3xl tracking-tight">{character.name}</Typography>
                    <Badge variant="orange" className="px-3 py-1 text-xs">LVL {totalLevel}</Badge>
                  </div>
                  <Typography variant="tiny" className="text-slate-400 font-black tracking-[0.2em]">{character.race} {character.archetype}</Typography>
               </div>

               <div className="mt-10 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Енергія</span>
                      <span className="text-[10px] font-black text-orange-600">{character.energy}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000" style={{ width: `${character.energy}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Фокус</span>
                      <span className="text-[10px] font-black text-indigo-600">{character.focus}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000" style={{ width: `${character.focus}%` }}></div>
                    </div>
                  </div>
               </div>
            </div>
          </Card>

          <Card padding="md" className="border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-4 right-4">
                <button onClick={() => setShowVision(!showVision)} className="text-orange-500 hover:text-orange-700">
                  <i className={`fa-solid ${showVision ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
             </div>
             <Typography variant="tiny" className="text-slate-400 mb-4 flex items-center gap-2">
               <i className="fa-solid fa-scroll"></i> Візія Героя
             </Typography>
             {showVision ? (
               <p className="text-sm font-medium leading-relaxed text-slate-700 animate-in fade-in">
                 {character.vision}
               </p>
             ) : (
               <div className="py-4 border-2 border-dashed border-slate-50 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Приховано для фокусу</span>
               </div>
             )}
          </Card>

          {/* GTD Status Counter Grid */}
          <div className="grid grid-cols-2 gap-4">
             {Object.entries(gtdStats).map(([key, count]) => (
               <Card key={key} padding="sm" className="bg-white border-slate-100 hover:border-orange-200 transition-all group">
                  <Typography variant="tiny" className="text-slate-400 mb-2 truncate capitalize">{key.replace('next', 'Next Actions')}</Typography>
                  <div className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">{count}</div>
               </Card>
             ))}
          </div>
        </div>

        {/* Middle & Right Column: Progress & Skills */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Dashboard Sphere Life */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <Typography variant="h2" className="text-xl">Дашборд Сфер Життя</Typography>
               <Badge variant="slate" icon="fa-scale-balanced">Збалансовано</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lifeSpheres.map(sphere => {
                const val = (character.stats as any)[sphere.key] || 0;
                return (
                  <Card key={sphere.key} padding="md" className="border-slate-100 hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg bg-${sphere.color}-500 group-hover:rotate-12 transition-transform`}>
                          <i className={`fa-solid ${sphere.icon} text-sm`}></i>
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{sphere.label}</span>
                            <span className="text-[10px] font-black text-slate-400">LVL {Math.floor(val / 10)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full bg-${sphere.color}-500 transition-all duration-1000`} style={{ width: `${val}%` }}></div>
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => updateStat(sphere.key, val - 5)} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><i className="fa-solid fa-minus text-[8px]"></i></button>
                       <button onClick={() => updateStat(sphere.key, val + 5)} className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-500 transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* 12-Week Cycle & Streak */}
          <Card padding="lg" className="bg-slate-900 border-none relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -mr-32 -mt-32"></div>
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                   <Badge variant="orange" className="bg-orange-500 border-none text-white px-3">12TR CYCLE</Badge>
                   <div className="text-center md:text-left">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Тиждень</div>
                      <div className="text-5xl font-black text-white">{cycle.currentWeek}<span className="text-lg text-slate-600">/12</span></div>
                   </div>
                </div>
                
                <div className="flex-1 space-y-4">
                   <div className="flex justify-between items-end">
                      <Typography variant="tiny" className="text-slate-400">Виконання циклу</Typography>
                      <span className="text-xl font-black text-emerald-400">{cycle.globalExecutionScore}%</span>
                   </div>
                   <div className="h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${cycle.globalExecutionScore}%` }}></div>
                   </div>
                   {mainGoal && (
                     <div className="flex items-center gap-2">
                        <i className="fa-solid fa-flag-checkered text-orange-500 text-[10px]"></i>
                        <span className="text-[11px] font-bold text-slate-400 truncate">{mainGoal.name}</span>
                     </div>
                   )}
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
                   <div className="text-orange-500 text-3xl mb-1">🔥 12</div>
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">Днів у потоці (STREAK)</div>
                </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Skill Tree */}
             <section className="space-y-4">
                <Typography variant="h3" className="px-2">Дерево Навичок</Typography>
                <div className="space-y-3">
                   {character.skills.map(skill => (
                     <Card key={skill.name} padding="sm" className="flex items-center gap-4 bg-white border-slate-50 shadow-sm hover:border-orange-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm">
                           <i className={`fa-solid ${skill.icon}`}></i>
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{skill.name}</span>
                              <span className="text-[10px] font-black text-orange-500">LVL {skill.level}</span>
                           </div>
                           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500" style={{ width: `${(skill.xp % 100)}%` }}></div>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
             </section>

             {/* Achievements */}
             <section className="space-y-4">
                <Typography variant="h3" className="px-2">Досягнення</Typography>
                <div className="grid grid-cols-3 gap-3">
                   {character.achievements.map(ach => (
                     <div key={ach.id} className={`p-4 rounded-3xl border text-center transition-all ${ach.unlockedAt ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-transparent opacity-40 filter grayscale'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ${ach.unlockedAt ? 'bg-white text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                           <i className={`fa-solid ${ach.icon} text-lg`}></i>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-tight text-slate-900 leading-tight">{ach.title}</div>
                     </div>
                   ))}
                </div>
             </section>
          </div>

          {/* Behavior Stats & Reflection */}
          <section className="space-y-6">
             <Typography variant="h2" className="text-xl">Рефлексія та Статистика</Typography>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="lg" className="border-slate-100">
                   <Typography variant="tiny" className="text-slate-400 mb-6 flex items-center gap-2">
                     <i className="fa-solid fa-chart-line text-indigo-500"></i> Продуктивність
                   </Typography>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center">
                            <span className="text-xs font-black text-indigo-600">10:00</span>
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-slate-800 uppercase">Пік енергії</div>
                            <div className="text-[10px] text-slate-400 font-bold">Найкращий час для складних квестів</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-rose-50 flex flex-col items-center justify-center">
                            <i className="fa-solid fa-mobile-screen-button text-rose-500 text-sm"></i>
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-slate-800 uppercase">Зривач фокусу</div>
                            <div className="text-[10px] text-slate-400 font-bold">Соціальні мережі (в середньому 2 год/день)</div>
                         </div>
                      </div>
                   </div>
                </Card>

                <Card padding="lg" className="border-slate-100 bg-slate-50/30">
                   <div className="flex items-center justify-between mb-6">
                      <Typography variant="tiny" className="text-slate-400 flex items-center gap-2">
                        <i className="fa-solid fa-book text-emerald-500"></i> Останні думки
                      </Typography>
                      <Badge variant="emerald" className="text-[8px]">ACTIVE DIARY</Badge>
                   </div>
                   <div className="space-y-4">
                      {diary.slice(0, 2).map(entry => (
                        <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                           <div className="text-[9px] font-black text-slate-300 uppercase mb-2">{new Date(entry.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</div>
                           <div className="text-[11px] font-medium text-slate-600 line-clamp-2 italic">
                              "{entry.content.replace(/[#*]/g, '').slice(0, 100)}..."
                           </div>
                        </div>
                      ))}
                      <Button variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest py-3">ПЕРЕГЛЯНУТИ ВЕСЬ ЖУРНАЛ <i className="fa-solid fa-arrow-right ml-2"></i></Button>
                   </div>
                </Card>
             </div>
          </section>

        </div>
      </div>
      
      <style>{`
        .bg-indigo-500 { background-color: #6366f1; }
        .bg-rose-500 { background-color: #f43f5e; }
        .bg-emerald-500 { background-color: #10b981; }
        .bg-amber-500 { background-color: #fbbf24; }
        .bg-pink-500 { background-color: #ec4899; }
        .bg-cyan-500 { background-color: #06b6d4; }
        
        .text-rose-500 { color: #f43f5e; }
        .text-emerald-400 { color: #34d399; }
      `}</style>
    </div>
  );
};

export default CharacterProfile;
