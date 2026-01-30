
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
    let clean = val.trim().replace(/^@/, '');
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
    { key: 'telegram', icon: 'fa-telegram', placeholder: '@username', provider: 'telegram' },
    { key: 'instagram', icon: 'fa-instagram', placeholder: 'username', provider: 'instagram' },
    { key: 'linkedin', icon: 'fa-linkedin', placeholder: 'id-name', provider: null },
    { key: 'tiktok', icon: 'fa-tiktok', placeholder: 'username', provider: 'tiktok' },
    { key: 'threads', icon: 'fa-at', placeholder: 'username', provider: null },
    { key: 'website', icon: 'fa-chrome', placeholder: 'domain.com', provider: null }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[var(--primary)]/5 p-5 rounded-[2rem] border border-[var(--primary)]/10 mb-6">
        <Typography variant="tiny" className="text-[var(--primary)] font-black mb-1.5 uppercase flex items-center gap-2 text-[8px]">
           <i className="fa-solid fa-id-card-clip"></i> Система розвідки
        </Typography>
        <p className="text-[9px] text-[var(--text-main)] opacity-60 leading-relaxed font-bold">
           Введіть нікнейми. Стрілка відкриє профіль, магія запустить ШІ розвідку, коло оновить фото.
        </p>
      </div>

      <div className="space-y-2">
        {socialPlatforms.map(({ key, icon, placeholder, provider }) => {
          const val = (person.socials as any)?.[key] || '';
          const cleanHandle = getCleanHandle(val);
          const isAnalyzing = analyzingKey === key;
          const fullUrl = getFullUrl(key, val);

          return (
            <div key={key} className="flex items-center gap-3 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] focus-within:border-[var(--primary)]/40 transition-all shadow-sm group">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors shrink-0">
                <i className={`fa-brands ${icon} text-xs`}></i>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                   <input 
                     value={val} 
                     onChange={e => handleSocialAction(key, e.target.value)}
                     placeholder={placeholder}
                     className="flex-1 bg-transparent border-none p-0 text-[11px] font-bold outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-30"
                   />
                   
                   {cleanHandle && (
                     <div className="flex gap-1 shrink-0">
                       {fullUrl && (
                         <a 
                           href={fullUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="w-7 h-7 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                           title="Відкрити профіль"
                         >
                           <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                         </a>
                       )}

                       {key !== 'website' && (
                         <>
                           <button 
                             onClick={() => handleAiAnalyze(key, cleanHandle)}
                             disabled={!aiEnabled || isAnalyzing}
                             className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                               !aiEnabled 
                                 ? 'bg-[var(--bg-main)] text-[var(--text-muted)] cursor-help opacity-40' 
                                 : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                             }`}
                             title={`Проаналізувати ${key} з ШІ`}
                           >
                             <i className={`fa-solid ${isAnalyzing ? 'fa-circle-notch animate-spin' : 'fa-wand-magic-sparkles'} text-[8px]`}></i>
                           </button>

                           <button 
                             onClick={() => onFetchAvatar(cleanHandle, provider || undefined)}
                             className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                             title="Оновити фото профілю"
                           >
                             <i className="fa-solid fa-arrows-rotate text-[8px]"></i>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setAiResultSummary(null)}></div>
          <Card className="w-full max-w-md bg-[var(--bg-card)] border-[var(--border-color)] shadow-2xl p-6 rounded-[2rem] relative z-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <Typography variant="h3" className="text-sm font-black uppercase">Звіт Розвідки</Typography>
                  <Typography variant="tiny" className="text-[var(--text-muted)] uppercase text-[7px]">{aiResultSummary.platform}</Typography>
                </div>
              </div>
              <Badge variant="emerald" className="h-5 font-black text-[7px]">+{aiResultSummary.newFieldCount} INFO</Badge>
            </div>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {aiResultSummary.birthDate && (
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                  <i className="fa-solid fa-cake-candles text-orange-500 text-xs"></i>
                  <div>
                    <span className="text-[7px] font-black text-orange-400 uppercase block">Виявлено дату</span>
                    <span className="text-[11px] font-black text-orange-700">{aiResultSummary.birthDate}</span>
                  </div>
                </div>
              )}

              {aiResultSummary.addedNotes.length > 0 && (
                <div className="space-y-1.5">
                    {aiResultSummary.addedNotes.map((note: string, i: number) => (
                      <div key={i} className="flex gap-2 p-2.5 bg-[var(--bg-main)] rounded-xl text-[10px] font-bold text-[var(--text-main)] border border-[var(--border-color)] leading-snug">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0 mt-1"></div>
                        {note.replace(`[AI ${aiResultSummary.platform.toUpperCase()}] `, '')}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <Button variant="primary" className="w-full py-3 rounded-xl font-black uppercase text-[8px] tracking-widest shadow-xl" onClick={() => setAiResultSummary(null)}>ПРИЙНЯТИ ДАНІ</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SocialsTab;
