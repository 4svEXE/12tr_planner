
import React, { useState } from 'react';
import { Person, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';

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
    event: 'fa-calendar-star'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card padding="md" className="bg-slate-900 shadow-xl border-none p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="tiny" className="text-orange-500 font-black uppercase tracking-[0.1em]">Лог контакту</Typography>
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
               {Object.keys(interactionIcons).map(t => (
                 <button 
                  key={t} 
                  onClick={() => setType(t as any)} 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${type === t ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <i className={`fa-solid ${interactionIcons[t]} text-[10px]`}></i>
                 </button>
               ))}
            </div>
          </div>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Про що говорили?.." className="w-full bg-slate-800 text-white rounded-2xl p-4 text-sm font-bold outline-none border border-slate-700 focus:border-orange-500 transition-all min-h-[100px] resize-none shadow-inner" />
          <div className="flex gap-3">
             <button onClick={() => { onAddInteraction(summary, 5, type); setSummary(''); }} disabled={!summary.trim()} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
               <i className="fa-solid fa-plus-circle"></i> ПОЗИТИВ (+5)
             </button>
             <button onClick={() => { onAddInteraction(summary, -5, type); setSummary(''); }} disabled={!summary.trim()} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-900/20">
               <i className="fa-solid fa-minus-circle"></i> НЕГАТИВ (-5)
             </button>
          </div>
        </div>
      </Card>

      <div className="relative space-y-6 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
        {(person.interactions || []).map(i => (
          <div key={i.id} className="relative pl-12 group">
             <div className={`absolute left-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-sm border-2 border-white ${i.summary.includes('[Рейтинг -') ? 'bg-rose-500' : i.summary.includes('[Рейтинг +') ? 'bg-emerald-500' : 'bg-slate-500'} text-white`}>
                <i className={`fa-solid ${interactionIcons[i.type] || 'fa-circle-dot'} text-[10px]`}></i>
             </div>
             <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm group-hover:border-orange-200 transition-all">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(i.date).toLocaleDateString('uk-UA', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                   <button onClick={() => onDeleteInteraction(i.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
                <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{i.summary}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineTab;
