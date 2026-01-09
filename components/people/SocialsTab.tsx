
import React from 'react';
import { Person } from '../../types';
import Typography from '../ui/Typography';

interface SocialsTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onFetchAvatar: (handle?: string) => void;
}

const SocialsTab: React.FC<SocialsTabProps> = ({ person, onUpdate, onFetchAvatar }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Typography variant="tiny" className="text-slate-900 font-black mb-4 uppercase flex items-center gap-2">
        <i className="fa-solid fa-address-card text-orange-500"></i> Соціальні профілі
      </Typography>
      {['telegram', 'instagram', 'linkedin', 'tiktok', 'website'].map(key => (
        <div key={key} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-inner shrink-0">
            <i className={`fa-brands fa-${key === 'website' ? 'chrome' : key}`}></i>
          </div>
          <div className="flex-1 min-w-0">
             <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5">{key}</span>
             <div className="flex items-center gap-2">
               <input 
                 value={(person.socials as any)[key] || ''} 
                 onChange={e => onUpdate({ ...person, socials: { ...person.socials, [key]: e.target.value } })}
                 placeholder={`Нікнейм або лінк...`}
                 className="flex-1 bg-transparent border-none p-0 text-xs font-bold outline-none text-slate-700"
               />
               {key !== 'website' && (person.socials as any)[key] && (
                 <button 
                   onClick={() => onFetchAvatar((person.socials as any)[key])}
                   className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors shadow-sm"
                   title="Підтягнути аватар"
                 >
                   <i className="fa-solid fa-rotate text-[10px]"></i>
                 </button>
               )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SocialsTab;
