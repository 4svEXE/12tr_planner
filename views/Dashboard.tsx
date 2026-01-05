
import React, { useState, useEffect, useMemo } from 'react';
import { getCharacterDailyBriefing } from '../services/geminiService';
import { Character, Task, Project } from '../types';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import BriefingCard from '../components/dashboard/BriefingCard';
import StatGrid from '../components/dashboard/StatGrid';
import RandomWisdom from '../components/dashboard/RandomWisdom';

const Dashboard: React.FC<{ character: Character; tasks: Task[]; projects: Project[] }> = ({ character, tasks, projects }) => {
  const { aiEnabled } = useApp();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(aiEnabled);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  useEffect(() => {
    if (!aiEnabled) { setLoading(false); return; }
    getCharacterDailyBriefing(character, tasks, projects)
      .then(setBriefing)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [aiEnabled]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-400 to-pink-500 p-1 rotate-3 shadow-lg">
          <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-2xl shadow-inner -rotate-3">
             <i className={`fa-solid ${character.race === 'Elf' ? 'fa-wand-magic-sparkles' : 'fa-user-ninja'} text-orange-600`}></i>
          </div>
        </div>
        <div>
          <Typography variant="h2" className="text-slate-900 leading-tight">Вітаємо, {character.name}.</Typography>
          <Typography variant="tiny" className="text-orange-500 font-bold lowercase tracking-wider">"{briefing?.greeting || "Твій шлях чекає."}"</Typography>
        </div>
      </header>

      <RandomWisdom tasks={tasks} projects={projects} />
      
      <BriefingCard aiEnabled={aiEnabled} briefing={briefing} loading={loading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Typography variant="caption" className="px-2">Мудрість дня</Typography>
          <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl min-h-[200px] flex flex-col justify-between italic text-sm leading-relaxed text-slate-300">
            {aiEnabled ? briefing?.article : "AI вимкнено. Увімкніть його в налаштуваннях для отримання глибоких інсайтів."}
          </div>
        </div>
        <StatGrid character={character} tasks={tasks} period={period} onPeriodChange={setPeriod} />
      </div>
    </div>
  );
};

export default Dashboard;
