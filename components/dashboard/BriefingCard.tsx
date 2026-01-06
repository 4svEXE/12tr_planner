
import React from 'react';
import Card from '../ui/Card';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';

interface BriefingCardProps {
  aiEnabled: boolean;
  briefing: any;
  loading: boolean;
}

const BriefingCard: React.FC<BriefingCardProps> = ({ aiEnabled, briefing, loading }) => {
  if (loading) {
    return (
      <Card blur className="border-orange-100 min-h-[160px] flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-sparkles text-orange-400 mb-2"></i>
          <Typography variant="tiny" className="text-slate-400">Формування квесту...</Typography>
        </div>
      </Card>
    );
  }

  if (!aiEnabled) {
    return (
      <Card blur className="bg-slate-50 border-slate-100 border-dashed">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <Typography variant="h3" className="text-slate-400">AI Асистент вимкнено</Typography>
            <Typography variant="body" className="text-slate-300">Увімкніть ШІ в налаштуваннях для отримання брифінгів.</Typography>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card blur className="bg-gradient-to-br from-white to-orange-50/30 border-orange-100 shadow-xl shadow-orange-100/20 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16"></div>
      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="orange" icon="fa-bolt">Квест Дня</Badge>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Стратегічна пріоритетність</span>
          </div>
          <Typography variant="h2" className="text-2xl text-slate-900 leading-tight">
            {briefing?.questOfDay || "Завершити найважливішу справу з беклогу."}
          </Typography>
          <div className="flex items-center gap-3 text-emerald-600">
             <i className="fa-solid fa-circle-check text-xs"></i>
             <Typography variant="body" className="font-bold text-[13px]">Нагорода: +500 XP & 50 Золота</Typography>
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-4">
          <div className="p-4 bg-white/60 rounded-2xl border border-white shadow-sm">
             <Typography variant="tiny" className="text-slate-400 mb-2">Порада Майстра</Typography>
             <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
               "{briefing?.motivation || "Найскладніший крок — перший. Зроби його зараз."}"
             </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BriefingCard;
