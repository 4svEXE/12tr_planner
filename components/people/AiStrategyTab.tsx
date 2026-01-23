
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
        <Card className="bg-[var(--bg-main)] border-[var(--border-color)] p-8 text-center flex flex-col items-center">
           <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] text-[var(--primary)] flex items-center justify-center text-2xl mb-4 shadow-inner border border-[var(--border-color)]">
              <i className="fa-solid fa-lock"></i>
           </div>
           <Typography variant="h3" className="mb-2 text-[var(--text-main)]">ШІ-Стратег вимкнено</Typography>
           <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs opacity-70">
             Увімкніть ШІ в налаштуваннях системи, щоб Gemini проаналізувала історію ваших взаємодій.
           </p>
        </Card>
      ) : (
        <section className="bg-[var(--bg-main)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--border-color)] relative overflow-hidden shadow-xl">
          {/* Градієнтний фон, що адаптується під тему через прозорість */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 blur-[60px] -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -z-10"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
               <Typography variant="h2" className="text-xl flex items-center gap-3 font-black uppercase tracking-tight">
                  <i className="fa-solid fa-sparkles text-[var(--primary)]"></i> AI СТРАТЕГІЯ
               </Typography>
               <button 
                 onClick={onAnalyze} 
                 disabled={isAnalyzing} 
                 className={`w-10 h-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center transition-all hover:bg-[var(--bg-main)] text-[var(--text-main)] ${isAnalyzing ? 'animate-spin' : ''}`}
               >
                 <i className="fa-solid fa-rotate text-xs"></i>
               </button>
            </div>
            
            {person.aiPortrait ? (
               <div className="space-y-6">
                  <div className="p-5 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-sm">
                     <Typography variant="tiny" className="text-[var(--primary)] mb-3 block font-black uppercase tracking-widest text-[8px]">Психологічний Профіль</Typography>
                     <p className="text-sm font-medium leading-relaxed text-[var(--text-main)] italic">"{person.aiPortrait.summary}"</p>
                  </div>
                  <div className="space-y-4">
                     <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[8px]">Рекомендовані теми:</Typography>
                     <div className="space-y-2">
                        {person.aiPortrait.topics?.map((t: string, i: number) => (
                           <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[11px] font-bold text-[var(--text-main)] flex items-center gap-4 group/item hover:border-[var(--primary)]/30 transition-all shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] group-hover/item:scale-150 transition-transform"></div> {t}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="py-16 text-center space-y-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-4xl text-[var(--text-muted)] opacity-20"><i className="fa-solid fa-robot"></i></div>
                  <p className="text-sm font-bold text-[var(--text-muted)] max-w-xs leading-relaxed">ШІ проаналізує всі нотатки та історію взаємодій, щоб підказати точки впливу.</p>
                  <Button 
                    variant="primary" 
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[var(--primary)]/20" 
                    onClick={onAnalyze} 
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'АНАЛІЗУЮ...' : 'СФОРМУВАТИ ПОРТРЕТ'}
                  </Button>
               </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AiStrategyTab;
