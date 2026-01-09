
import React from 'react';
import { Person } from '../../types';
import Typography from '../ui/Typography';

interface SocialsTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onFetchAvatar: (handle?: string) => void;
}

const SocialsTab: React.FC<SocialsTabProps> = ({ person, onUpdate, onFetchAvatar }) => {
  const handleSocialAction = (key: string, value: string) => {
    onUpdate({ ...person, socials: { ...person.socials, [key]: value } });
  };

  const getCleanHandle = (val: string) => {
    if (!val) return '';
    return val.replace('@', '').split('/').pop() || '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 mb-6">
        <Typography variant="tiny" className="text-orange-600 font-black mb-2 uppercase flex items-center gap-2">
           <i className="fa-solid fa-id-card-clip"></i> Авто-ідентифікація
        </Typography>
        <p className="text-[10px] text-orange-800/60 leading-relaxed font-bold">
           Введіть нікнейм у будь-яку мережу та натисніть іконку оновлення, щоб миттєво підтягнути актуальне фото союзника.
        </p>
      </div>

      <div className="space-y-3">
        {['telegram', 'instagram', 'linkedin', 'tiktok', 'website'].map(key => {
          const val = (person.socials as any)?.[key] || '';
          const cleanHandle = getCleanHandle(val);

          return (
            <div key={key} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-orange-500 transition-colors shrink-0">
                <i className={`fa-brands fa-${key === 'website' ? 'chrome' : key}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                 <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5">{key}</span>
                 <div className="flex items-center gap-2">
                   <input 
                     value={val} 
                     onChange={e => handleSocialAction(key, e.target.value)}
                     placeholder={`Нікнейм або лінк...`}
                     className="flex-1 bg-transparent border-none p-0 text-xs font-bold outline-none text-slate-700 placeholder:text-slate-200"
                   />
                   {key !== 'website' && cleanHandle && (
                     <button 
                       onClick={() => onFetchAvatar(cleanHandle)}
                       className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                       title="Підтягнути аватар за цим ніком"
                     >
                       <i className="fa-solid fa-rotate text-[9px]"></i>
                     </button>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialsTab;
