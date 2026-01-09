
import React, { useState } from 'react';
import { Person } from '../../types';
import Typography from '../ui/Typography';
import { useApp } from '../../contexts/AppContext';
import { analyzeSocialPresence } from '../../services/geminiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface SocialsTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onFetchAvatar: (handle?: string, provider?: string) => void;
}

const SocialsTab: React.FC<SocialsTabProps> = ({ person, onUpdate, onFetchAvatar }) => {
  const { aiEnabled } = useApp();
  const [analyzingKey, setAnalyzingKey] = useState<string | null>(null);
  const [aiResultSummary, setAiResultSummary] = useState<any | null>(null);

  const handleSocialAction = (key: string, value: string) => {
    onUpdate({ ...person, socials: { ...person.socials, [key]: value } });
  };

  const getCleanHandle = (val: string) => {
    if (!val) return '';
    // Очищуємо від @, початкових пробілів та замикаючих слешів
    let clean = val.trim().replace(/^@/, '');
    // Якщо вставили повне посилання, витягуємо останню частину (нік)
    if (clean.includes('/')) {
      clean = clean.split('/').filter(Boolean).pop() || '';
    }
    return clean;
  };

  const getFullUrl = (key: string, value: string) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    
    const handle = getCleanHandle(value);
    if (!handle) return null;

    switch (key) {
      case 'telegram': return `https://t.me/${handle}`;
      case 'instagram': return `https://www.instagram.com/${handle}/`;
      case 'linkedin': return `https://www.linkedin.com/in/${handle}/`;
      case 'tiktok': return `https://www.tiktok.com/@${handle}`;
      case 'threads': return `https://www.threads.net/@${handle}`;
      case 'website': 
        return value.match(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/) ? `https://${value}` : value;
      default: return value;
    }
  };

  const handleAiAnalyze = async (key: string, handle: string) => {
    if (!aiEnabled || analyzingKey) return;
    
    setAnalyzingKey(key);
    try {
      const result = await analyzeSocialPresence(key, handle);
      
      const newNotes = (result.notes || []).map((text: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: `[AI ${key.toUpperCase()}] ${text}`,
        date: new Date().toISOString()
      }));

      const addedHobbies = (result.hobbies || []).filter((h: string) => !person.hobbies.includes(h));
      const newHobbies = [...new Set([...person.hobbies, ...addedHobbies])];
      
      const updates: Partial<Person> = {
        notes: [...newNotes, ...(person.notes || [])],
        hobbies: newHobbies,
      };

      if (!person.description && result.summary) updates.description = result.summary;
      if (!person.birthDate && result.birthDate) updates.birthDate = result.birthDate;

      onUpdate({ ...person, ...updates });
      
      setAiResultSummary({
        platform: key,
        addedNotes: newNotes.map((n: any) => n.text),
        addedHobbies: addedHobbies,
        summary: result.summary,
        birthDate: result.birthDate && !person.birthDate ? result.birthDate : null,
        newFieldCount: (updates.birthDate ? 1 : 0) + (updates.description ? 1 : 0) + addedHobbies.length + newNotes.length
      });

    } catch (e) {
      alert('Помилка аналізу профілю. Перевірте підключення до ШІ.');
    } finally {
      setAnalyzingKey(null);
    }
  };

  const socialPlatforms = [
    { key: 'telegram', icon: 'fa-telegram', placeholder: '@username' },
    { key: 'instagram', icon: 'fa-instagram', placeholder: 'username' },
    { key: 'linkedin', icon: 'fa-linkedin', placeholder: 'id-name' },
    { key: 'tiktok', icon: 'fa-tiktok', placeholder: 'username' },
    { key: 'threads', icon: 'fa-at', placeholder: 'username' },
    { key: 'website', icon: 'fa-chrome', placeholder: 'domain.com' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 mb-6">
        <Typography variant="tiny" className="text-orange-600 font-black mb-2 uppercase flex items-center gap-2">
           <i className="fa-solid fa-id-card-clip"></i> Система розвідки
        </Typography>
        <p className="text-[10px] text-orange-800/60 leading-relaxed font-bold">
           Введіть нікнейми союзників. Кнопка "стрілка" відкриє профіль у браузері, "магія" — запустить ШІ розвідку для досьє.
        </p>
      </div>

      <div className="space-y-3">
        {socialPlatforms.map(({ key, icon, placeholder }) => {
          const val = (person.socials as any)?.[key] || '';
          const cleanHandle = getCleanHandle(val);
          const isAnalyzing = analyzingKey === key;
          const fullUrl = getFullUrl(key, val);

          return (
            <div key={key} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-orange-500 transition-colors shrink-0 shadow-inner">
                <i className={`fa-brands ${icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                 <span className="text-[7px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">{key}</span>
                 <div className="flex items-center gap-2">
                   <input 
                     value={val} 
                     onChange={e => handleSocialAction(key, e.target.value)}
                     placeholder={placeholder}
                     className="flex-1 bg-transparent border-none p-0 text-xs font-bold outline-none text-slate-700 placeholder:text-slate-200"
                   />
                   
                   {cleanHandle && (
                     <div className="flex gap-1">
                       {fullUrl && (
                         <a 
                           href={fullUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
                           title="Відкрити профіль"
                         >
                           <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                         </a>
                       )}

                       {key !== 'website' && (
                         <>
                           <button 
                             onClick={() => handleAiAnalyze(key, cleanHandle)}
                             disabled={!aiEnabled || isAnalyzing}
                             className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border ${
                               !aiEnabled 
                                 ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-help' 
                                 : 'bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-600 hover:text-white'
                             }`}
                             title={!aiEnabled ? "Увімкніть ШІ для аналізу" : `Проаналізувати ${key} з ШІ`}
                           >
                             <i className={`fa-solid ${isAnalyzing ? 'fa-circle-notch animate-spin' : 'fa-wand-magic-sparkles'} text-[9px]`}></i>
                           </button>

                           <button 
                             onClick={() => onFetchAvatar(cleanHandle, key)}
                             className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100/50"
                             title={`Підтягнути фото з ${key}`}
                           >
                             <i className="fa-solid fa-arrows-rotate text-[9px]"></i>
                           </button>
                         </>
                       )}
                     </div>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {aiResultSummary && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 tiktok-blur animate-in fade-in">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setAiResultSummary(null)}></div>
          <Card className="w-full max-w-md bg-white border-none shadow-2xl p-8 rounded-[2.5rem] relative z-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-100">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <Typography variant="h2" className="text-xl">Звіт Розвідки</Typography>
                  <Typography variant="tiny" className="text-slate-400 uppercase tracking-widest">{aiResultSummary.platform}</Typography>
                </div>
              </div>
              <Badge variant="emerald" className="h-6 font-black">+{aiResultSummary.newFieldCount} INFO</Badge>
            </div>

            <div className="space-y-5 mb-8 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {aiResultSummary.birthDate && (
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm"><i className="fa-solid fa-cake-candles text-[10px]"></i></div>
                  <div>
                    <span className="text-[7px] font-black text-orange-400 uppercase block tracking-widest">Виявлено дату</span>
                    <span className="text-xs font-black text-orange-700">{aiResultSummary.birthDate}</span>
                  </div>
                </div>
              )}

              {aiResultSummary.addedHobbies.length > 0 && (
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">Нові інтереси</span>
                  <div className="flex flex-wrap gap-2">
                    {aiResultSummary.addedHobbies.map((h: string, i: number) => (
                      <Badge key={i} variant="indigo" className="text-[8px] lowercase font-bold">#{h}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {aiResultSummary.addedNotes.length > 0 && (
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">Знайдені факти</span>
                  <div className="space-y-2">
                    {aiResultSummary.addedNotes.map((note: string, i: number) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-100 leading-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1"></div>
                        {note.replace(`[AI ${aiResultSummary.platform.toUpperCase()}] `, '')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiResultSummary.summary && (
                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                  <span className="text-[7px] font-black text-indigo-400 uppercase block mb-1 tracking-widest">Профіль особистості</span>
                  <p className="text-[11px] font-medium text-indigo-900 leading-relaxed italic">"{aiResultSummary.summary}"</p>
                </div>
              )}
            </div>

            <Button variant="primary" className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100" onClick={() => setAiResultSummary(null)}>ПРИЙНЯТИ ДАНІ</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SocialsTab;
