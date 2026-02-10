
import React from 'react';
import { Person } from '../../types';
import Typography from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface AiStrategyTabProps {
  person: Person;
  aiEnabled: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const AiStrategyTab: React.FC<AiStrategyTabProps> = ({ person, aiEnabled, isAnalyzing, onAnalyze }) => {
  const karma = person.rating || 0;
  const isAlly = karma >= 21;
  const isLegendary = karma >= 51;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {!aiEnabled ? (
        <Card className="bg-[var(--bg-main)] border-[var(--border-color)] p-8 text-center flex flex-col items-center">
           <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] text-[var(--primary)] flex items-center justify-center text-2xl mb-4 shadow-inner border border-[var(--border-color)]">
              <i className="fa-solid fa-lock"></i>
           </div>
           <Typography variant="h3" className="mb-2 text-[var(--text-main)]">ШІ-Стратег вимкнено</Typography>
        </Card>
      ) : (
        <section className="space-y-6">
          <header className="flex justify-between items-center bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <Typography variant="h2" className="text-xl font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-sparkles"></i> AI РЕЗОНАНС
               </Typography>
               <Typography variant="tiny" className="text-white/60">Аналіз точок впливу та зближення</Typography>
             </div>
             <button onClick={onAnalyze} disabled={isAnalyzing} className={`w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center transition-all hover:bg-white/30 ${isAnalyzing ? 'animate-spin' : ''}`}>
               <i className="fa-solid fa-rotate text-xs"></i>
             </button>
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          </header>
          
          {person.aiPortrait ? (
             <div className="space-y-5">
                <Card padding="md" className="border-indigo-100 bg-white shadow-sm">
                   <Badge variant="indigo" className="mb-3">Психологічне досьє</Badge>
                   <p className="text-sm font-medium leading-relaxed italic text-slate-700">"{person.aiPortrait.summary}"</p>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                   <section>
                      <Typography variant="tiny" className="text-slate-400 font-black uppercase mb-3 block px-1">Рекомендовані теми</Typography>
                      <div className="flex flex-wrap gap-2">
                        {person.aiPortrait.topics?.map((t: string, i: number) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-indigo-400"></div> {t}
                          </div>
                        ))}
                      </div>
                   </section>

                   <section className={`p-6 rounded-[2.5rem] border-2 transition-all ${isAlly ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${isAlly ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                               <i className="fa-solid fa-gift text-sm"></i>
                            </div>
                            <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Рівень: СОЮЗНИК</Typography>
                         </div>
                         {!isAlly && <div className="text-[7px] font-black text-slate-400 uppercase">Потрібно 21 Karma</div>}
                      </div>
                      <div className="space-y-2">
                        <Typography variant="tiny" className="text-emerald-700/60 font-black uppercase text-[8px]">Ідеї жестів та подарунків:</Typography>
                        <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
                           {isAlly ? person.aiPortrait.strategy?.split('. ')[0] : 'Підвищте довіру, щоб розблокувати поради щодо жестів та подарунків.'}
                        </p>
                      </div>
                   </section>

                   <section className={`p-6 rounded-[2.5rem] border-2 transition-all ${isLegendary ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${isLegendary ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                               <i className="fa-solid fa-handshake text-sm"></i>
                            </div>
                            <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Рівень: ЛЕГЕНДАРНИЙ</Typography>
                         </div>
                         {!isLegendary && <div className="text-[7px] font-black text-slate-400 uppercase">Потрібно 51 Karma</div>}
                      </div>
                      <div className="space-y-2">
                        <Typography variant="tiny" className="text-indigo-700/60 font-black uppercase text-[8px]">Спільна стратегія:</Typography>
                        <p className="text-[11px] font-bold text-indigo-900 leading-relaxed">
                           {isLegendary ? (person.aiPortrait.strategy?.split('. ')[1] || person.aiPortrait.strategy) : 'Найвищий рівень довіри розблокує ідеї для стратегічного партнерства та бізнесу.'}
                        </p>
                      </div>
                   </section>
                </div>
             </div>
          ) : (
             <div className="py-16 text-center space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 rounded-[2rem] bg-white border border-theme flex items-center justify-center text-4xl text-slate-200"><i className="fa-solid fa-brain"></i></div>
                <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed uppercase tracking-widest">Ядро очікує ініціації аналізу...</p>
                <Button variant="primary" className="w-full py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg" onClick={onAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? 'АНАЛІЗУЮ ТРАНЗАКЦІЇ...' : 'СФОРМУВАТИ СТРАТЕГІЮ'}
                </Button>
             </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AiStrategyTab;
