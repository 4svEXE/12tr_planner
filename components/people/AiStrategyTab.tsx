
import React from 'react';
import { Person } from '../../types';
import Typography from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface AiStrategyTabProps {
  person: Person;
  aiEnabled: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const AiStrategyTab: React.FC<AiStrategyTabProps> = ({ person, aiEnabled, isAnalyzing, onAnalyze }) => {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {!aiEnabled ? (
        <Card className="bg-orange-50 border-orange-200 p-8 text-center flex flex-col items-center">
           <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-2xl mb-4 shadow-inner">
              <i className="fa-solid fa-lock"></i>
           </div>
           <Typography variant="h3" className="mb-2 text-orange-900">ШІ-Стратег вимкнено</Typography>
           <p className="text-xs text-orange-600/70 leading-relaxed max-w-xs">
             Увімкніть ШІ в налаштуваннях системи, щоб Gemini проаналізувала історію ваших взаємодій.
           </p>
        </Card>
      ) : (
        <section className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px]"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
               <Typography variant="h2" className="text-xl flex items-center gap-3 font-black uppercase text-white tracking-tight">
                  <i className="fa-solid fa-sparkles text-orange-500"></i> AI СТРАТЕГІЯ
               </Typography>
               <button onClick={onAnalyze} disabled={isAnalyzing} className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 ${isAnalyzing ? 'animate-spin' : ''}`}>
                 <i className="fa-solid fa-rotate text-xs"></i>
               </button>
            </div>
            {person.aiPortrait ? (
               <div className="space-y-6">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                     <Typography variant="tiny" className="text-orange-500 mb-3 block font-black uppercase tracking-widest text-[8px]">Психологічний Профіль</Typography>
                     <p className="text-sm font-medium leading-relaxed text-slate-300 italic">"{person.aiPortrait.summary}"</p>
                  </div>
                  <div className="space-y-4">
                     <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Рекомендовані теми:</Typography>
                     <div className="space-y-2">
                        {person.aiPortrait.topics?.map((t: string, i: number) => (
                           <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-bold text-slate-300 flex items-center gap-4 group/item hover:bg-white/10 transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover/item:scale-150 transition-transform"></div> {t}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="py-20 text-center space-y-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl opacity-20"><i className="fa-solid fa-robot"></i></div>
                  <p className="text-sm font-bold text-slate-400 max-w-xs">ШІ проаналізує всі нотатки та історію взаємодій, щоб підказати точки впливу.</p>
                  <Button variant="primary" className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20" onClick={onAnalyze} disabled={isAnalyzing}>СФОРМУВАТИ ПОРТРЕТ</Button>
               </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AiStrategyTab;
