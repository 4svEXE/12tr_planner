
import React, { useState, useEffect, useMemo } from 'react';
import { getCharacterDailyBriefing } from '../services/geminiService';
import { Character, Task, Project, TaskStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface DashboardProps {
  character: Character;
  tasks: Task[];
  projects: Project[];
}

type Period = 'day' | 'week' | 'month' | 'year';

const Dashboard: React.FC<DashboardProps> = ({ character, tasks, projects }) => {
  const { aiEnabled } = useApp();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(aiEnabled);
  const [period, setPeriod] = useState<Period>('day');

  useEffect(() => {
    if (!aiEnabled) {
      setLoading(false);
      return;
    }
    const fetchBriefing = async () => {
      try {
        const data = await getCharacterDailyBriefing(character, tasks, projects);
        setBriefing(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, [aiEnabled]);

  // Random Inspiration: Dreams and Achievements
  const randomDream = useMemo(() => {
    const dreamNotes = tasks.filter(t => !t.isDeleted && t.category === 'note' && (t.projectId === 'dreams' || t.tags.includes('dream')));
    return dreamNotes.length > 0 ? dreamNotes[Math.floor(Math.random() * dreamNotes.length)] : null;
  }, [tasks]);

  const randomAchievement = useMemo(() => {
    const achievementNotes = tasks.filter(t => !t.isDeleted && t.category === 'note' && (t.projectId === 'achievements' || t.tags.includes('achievement')));
    return achievementNotes.length > 0 ? achievementNotes[Math.floor(Math.random() * achievementNotes.length)] : null;
  }, [tasks]);

  // Calculate Discipline based on habits and selected period
  const disciplineScore = useMemo(() => {
    const habits = tasks.filter(t => t.projectSection === 'habits' || t.tags.includes('habit'));
    if (habits.length === 0) return 0;

    const now = new Date();
    let daysToCheck = 1;
    if (period === 'week') daysToCheck = 7;
    if (period === 'month') daysToCheck = 30;
    if (period === 'year') daysToCheck = 84; // 12 weeks for 12TR cycle

    let totalPotential = habits.length * daysToCheck;
    let actualCompleted = 0;

    const dateStrings = Array.from({ length: daysToCheck }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    habits.forEach(habit => {
      const history = habit.habitHistory || {};
      dateStrings.forEach(dateStr => {
        if (history[dateStr]?.status === 'completed') {
          actualCompleted++;
        }
      });
    });

    return Math.round((actualCompleted / totalPotential) * 100);
  }, [tasks, period]);

  // Fix: Mapping character.stats properties correctly to match the type definition in types.ts
  const stats = useMemo(() => [
    { label: 'Дисципліна', val: disciplineScore, variant: 'orange', icon: 'fa-shield-halved', dynamic: true },
    { label: 'Здоров\'я', val: character.stats.health, variant: 'rose', icon: 'fa-heart' },
    { label: 'Багатство', val: character.stats.finance, variant: 'emerald', icon: 'fa-coins' },
    { label: 'Мудрість', val: character.stats.education, variant: 'indigo', icon: 'fa-brain' },
    { label: 'Соціум', val: character.stats.relationships, variant: 'yellow', icon: 'fa-users' },
  ], [disciplineScore, character.stats, period]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 p-1 rotate-3 shadow-lg">
            <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-2xl shadow-inner -rotate-3">
               <i className={`fa-solid ${character.race === 'Elf' ? 'fa-wand-magic-sparkles' : 'fa-user-ninja'} text-orange-600`}></i>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white font-black text-[8px] px-1.5 py-0.5 rounded border border-white shadow-xl">
            LVL {character.level}
          </div>
        </div>
        <div>
          <Typography variant="h2" className="text-slate-900 leading-tight">
            Герої не сплять, {character.name}.
          </Typography>
          <Typography variant="tiny" className="text-orange-500 font-bold lowercase tracking-wider">
            "{briefing?.greeting || "Твій шлях чекає на тебе."}"
          </Typography>
        </div>
      </div>

      {/* Random Dreams & Achievements Row - Moved up for prominence */}
      {(randomDream || randomAchievement) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {randomDream && (
            <Card padding="sm" className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border-blue-100 hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-900 text-6xl group-hover:scale-125 transition-transform duration-700">
                <i className="fa-solid fa-cloud-moon"></i>
              </div>
              <Typography variant="tiny" className="text-blue-500 mb-2 font-black flex items-center gap-2">
                <i className="fa-solid fa-sparkles"></i> Мрія кликне тебе
              </Typography>
              <Typography variant="body" className="text-slate-700 font-bold mb-1 leading-snug">
                Можливо сьогодні настав час щоб виконати цю мрію?
              </Typography>
              <div className="text-lg font-black text-blue-900 tracking-tight">
                {randomDream.title}
              </div>
            </Card>
          )}

          {randomAchievement && (
            <Card padding="sm" className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-100 hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -bottom-4 opacity-10 text-amber-900 text-6xl group-hover:scale-125 transition-transform duration-700">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <Typography variant="tiny" className="text-amber-600 mb-2 font-black flex items-center gap-2">
                <i className="fa-solid fa-medal"></i> Твоя наступна вершина
              </Typography>
              <Typography variant="body" className="text-slate-700 font-bold mb-1 leading-snug">
                Готовий здобути цю ачівку?
              </Typography>
              <div className="text-lg font-black text-amber-900 tracking-tight">
                {randomAchievement.title}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quest Card */}
      <Card blur padding="lg" className="relative overflow-hidden group border-none shadow-xl shadow-orange-100/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/40 blur-[80px] -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <Badge variant="orange">Квест Дня</Badge>
             <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-slate-100 rounded-xl w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded-xl w-1/2"></div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <Typography variant="h2" className="mb-2 leading-none text-2xl">
                  {aiEnabled ? briefing?.questOfDay : "AI Асистент вимкнено в налаштуваннях."}
                </Typography>
                {aiEnabled && (
                  <div className="flex gap-4">
                    <Badge variant="orange" icon="fa-bolt">500 XP</Badge>
                    <Badge variant="yellow" icon="fa-coins">12 GP</Badge>
                  </div>
                )}
              </div>
              {aiEnabled && (
                <Button icon="fa-fire-flame-curved" size="lg" className="rounded-2xl px-8 shadow-orange-200">
                  ПРИЙНЯТИ
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Oracle Card */}
        <div className="space-y-3">
          <Typography variant="caption" className="px-2">Мудрість дня</Typography>
          <Card blur className="bg-slate-900 !text-white border-none shadow-2xl min-h-[200px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h3" className="flex items-center gap-3 text-orange-400 text-sm">
                 <i className="fa-solid fa-microphone-lines animate-pulse"></i> Оракул {character.race}
              </Typography>
            </div>
            <Typography variant="body" className="text-slate-300 italic text-sm leading-relaxed">
              {aiEnabled ? (briefing?.article || "Збираю мудрість зірок для тебе...") : "Увімкніть AI асистента для отримання щоденних порад."}
            </Typography>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Поради для {character.views[0]}</span>
               <i className="fa-solid fa-arrow-right text-orange-400 text-xs"></i>
            </div>
          </Card>
        </div>

        {/* Stats Grid with Period Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <Typography variant="caption">Твій стан</Typography>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                    period === p ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {p === 'day' ? 'Д' : p === 'week' ? 'Т' : p === 'month' ? 'М' : 'Р'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(stat => (
              <Card 
                key={stat.label} 
                padding="sm" 
                hover 
                className={`!rounded-2xl border-slate-100 ${stat.dynamic ? 'col-span-2 bg-orange-50/20 border-orange-100 shadow-sm' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-${stat.variant === 'indigo' ? 'indigo-100' : stat.variant === 'rose' ? 'rose-100' : stat.variant === 'emerald' ? 'emerald-100' : 'orange-100'} text-${stat.variant === 'indigo' ? 'indigo-600' : stat.variant === 'rose' ? 'rose-600' : stat.variant === 'emerald' ? 'emerald-600' : 'orange-600'}`}>
                      <i className={`fa-solid ${stat.icon} text-[9px]`}></i>
                    </div>
                    <Typography variant="tiny" className="text-slate-500 text-[8px]">{stat.label}</Typography>
                  </div>
                  {stat.dynamic && <Badge variant="orange" className="text-[7px] py-0 px-1">{period.toUpperCase()}</Badge>}
                </div>
                <div className="flex items-end justify-between mb-1">
                  <Typography variant="h3" className="text-slate-900 leading-none text-base">{stat.val}%</Typography>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 bg-${stat.variant === 'indigo' ? 'indigo-600' : stat.variant === 'rose' ? 'rose-600' : stat.variant === 'emerald' ? 'emerald-600' : 'orange-600'}`} 
                    style={{ width: `${stat.val}%` }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
