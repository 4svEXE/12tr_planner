
import React, { useMemo } from 'react';
import { Task, Project } from '../../types';
import Typography from '../ui/Typography';

interface RandomWisdomProps {
  tasks: Task[];
  projects: Project[];
}

const RandomWisdom: React.FC<RandomWisdomProps> = ({ tasks, projects }) => {
  const wisdoms = [
    "Дисципліна — це вибір між тим, чого ви хочете зараз, і тим, чого ви хочете найбільше.",
    "Ваші проєкти — це ваша спадщина. Будуйте їх з розумом.",
    "Маленькі кроки кожного дня ведуть до великих звершень через 12 тижнів.",
    "Кожен завершений квест наближає вас до статусу Майстра Життя.",
    "Не бійтеся повільного прогресу, бійтеся повної зупинки."
  ];

  const randomWisdom = useMemo(() => {
    return wisdoms[Math.floor(Math.random() * wisdoms.length)];
  }, []);

  return (
    <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-orange-200 transition-all">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
        <i className="fa-solid fa-lightbulb"></i>
      </div>
      <div>
        <Typography variant="tiny" className="text-slate-300 mb-0.5">Мудрість дня</Typography>
        <p className="text-[12px] font-medium text-slate-600 leading-tight">
          {randomWisdom}
        </p>
      </div>
    </div>
  );
};

export default RandomWisdom;
