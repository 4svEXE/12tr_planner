
import React, { useState } from 'react';
import { Person, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface TimelineTabProps {
  person: Person;
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void;
  onDeleteInteraction: (id: string) => void;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ person, onAddInteraction, onDeleteInteraction }) => {
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<Interaction['type']>('chat');

  const interactionIcons: Record<string, string> = {
    chat: 'fa-message',
    call: 'fa-phone',
    meeting: 'fa-users',
    coffee: 'fa-coffee',
    walk: 'fa-person-walking',
    event: 'fa-calendar-star',
    other: 'fa-circle-dot'
  };

  const sortedInteractions = [...(person.interactions || [])].sort((a, b) => b.date - a.date);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">
      <Card padding="md" className="bg-slate-50 border-slate-100 shadow-sm shrink-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="tiny" className="text-slate-900 font-black uppercase tracking-[0.1em]">Нова взаємодія</Typography>
            <div className="flex gap-1.5 p-1 bg-white rounded-xl shadow-inner overflow-x-auto no-scrollbar">
               {Object.keys(interactionIcons).map(t => (
                 <button 
                  key={t} 
                  onClick={() => setType(t as any)} 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${type === t ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  title={t}
                 >
                   <i className={`fa-solid ${interactionIcons[t]} text-[10px]`}></i>
                 </button>
               ))}
            </div>
          </div>
          <textarea 
            value={summary} 
            onChange={e => setSummary(e.target.value)} 
            placeholder="Що обговорювали?" 
            className="w-full bg-white text-slate-800 rounded-2xl p-4 text-sm font-medium outline-none border border-slate-100 focus:border-orange-500 transition-all min-h-[80px] resize-none shadow-sm" 
          />
          <div className="flex gap-3">
             <button 
              onClick={() => { onAddInteraction(summary, 5, type); setSummary(''); }} 
              disabled={!summary.trim()} 
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
             >
               <i className="fa-solid fa-circle-plus"></i> ПОЗИТИВ (+5)
             </button>
             <button 
              onClick={() => { onAddInteraction(summary, -5, type); setSummary(''); }} 
              disabled={!summary.trim()} 
              className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100"
             >
               <i className="fa-solid fa-circle-minus"></i> НЕГАТИВ (-5)
             </button>
          </div>
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-20 space-y-4">
        {sortedInteractions.map(i => {
           const isPositive = i.summary.includes('[Рейтинг +');
           const isNegative = i.summary.includes('[Рейтинг -');
           
           return (
            <div key={i.id} className="flex gap-4 group">
               <div className="flex flex-col items-center shrink-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border-2 border-white transition-transform group-hover:scale-110 ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-slate-500'} text-white`}>
                     <i className={`fa-solid ${interactionIcons[i.type] || 'fa-circle-dot'} text-[10px]`}></i>
                  </div>
                  <div className="flex-1 w-0.5 bg-slate-100 my-1"></div>
               </div>
               
               <div className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm group-hover:border-orange-200 transition-all">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(i.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                     </span>
                     <div className="flex items-center gap-2">
                        {isPositive && <Badge variant="emerald" className="text-[6px] py-0 px-1 font-black">+5 PT</Badge>}
                        {isNegative && <Badge variant="rose" className="text-[6px] py-0 px-1 font-black">-5 PT</Badge>}
                        <button onClick={() => onDeleteInteraction(i.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all p-1">
                           <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                     </div>
                  </div>
                  <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{i.summary.split(' [Рейтинг')[0]}</p>
               </div>
            </div>
           );
        })}
        {sortedInteractions.length === 0 && (
          <div className="py-12 text-center opacity-10">
             <i className="fa-solid fa-timeline text-5xl mb-4"></i>
             <Typography variant="h3" className="text-sm">Історія порожня</Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineTab;
