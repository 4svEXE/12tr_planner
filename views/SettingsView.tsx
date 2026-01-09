
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ThemeType, Character } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useResizer } from '../hooks/useResizer';

const SettingsView: React.FC = () => {
  const { 
    theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, 
    updateSidebarSetting, character, updateCharacter 
  } = useApp();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(isMobileInitially() ? null : 'profile');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  function isMobileInitially() {
    return window.innerWidth < 1024;
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    const savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    setApiKey(savedKey);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    alert('API Ключ збережено.');
  };

  const sections = [
    { id: 'profile', icon: 'fa-user-astronaut', label: 'Профіль Героя', color: 'text-orange-500', desc: 'Ідентичність у грі' },
    { id: 'appearance', icon: 'fa-palette', label: 'Теми & Стиль', color: 'text-indigo-500', desc: 'Візуальний двигун' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'Gemini AI', color: 'text-emerald-500', desc: 'Інтелект системи' },
    { id: 'sidebar', icon: 'fa-bars-staggered', label: 'Навігація', color: 'text-amber-500', desc: 'Бокова панель' },
    { id: 'data', icon: 'fa-database', label: 'Сховище', color: 'text-rose-500', desc: 'Резервні копії' },
  ];

  const themesData: {id: ThemeType, label: string, main: string, accent: string}[] = [
    { id: 'classic', label: 'Classic', main: '#ffffff', accent: '#f97316' },
    { id: 'midnight', label: 'Midnight', main: '#020617', accent: '#10b981' },
    { id: 'nordic', label: 'Nordic', main: '#f1f5f9', accent: '#6366f1' },
    { id: 'sakura', label: 'Sakura', main: '#fff1f2', accent: '#ec4899' },
    { id: 'forest', label: 'Forest', main: '#064e3b', accent: '#6ee7b7' },
    { id: 'amethyst', label: 'Amethyst', main: '#2e1065', accent: '#a855f7' },
    { id: 'volcano', label: 'Volcano', main: '#000000', accent: '#ef4444' },
    { id: 'slate', label: 'Industrial', main: '#f8fafc', accent: '#475569' },
  ];

  const renderContent = () => {
    switch (selectedSectionId) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white p-1 ring-4 ring-orange-500/10 relative group shadow-2xl">
                   <img src={character.avatarUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
                   <button onClick={() => {const url = prompt('Avatar URL:', character.avatarUrl); if(url) updateCharacter({avatarUrl: url})}} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.2rem] text-white text-[10px] font-black uppercase">Змінити</button>
                </div>
                <Typography variant="tiny" className="text-slate-400">ID: {character.name.toUpperCase().replace(/\s+/g, '_')}</Typography>
             </div>
             <div className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Псевдонім</label>
                   <input value={character.name} onChange={e => updateCharacter({name: e.target.value})} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Раса</label>
                      <select value={character.race} onChange={e => updateCharacter({race: e.target.value as any})} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-4 text-xs font-bold outline-none shadow-sm">
                         <option>Human</option><option>Elf</option><option>Dwarf</option><option>Gnome</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Архетип</label>
                      <select value={character.archetype} onChange={e => updateCharacter({archetype: e.target.value as any})} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-4 text-xs font-bold outline-none shadow-sm">
                         <option>Strategist</option><option>Builder</option><option>Monk</option><option>Explorer</option>
                      </select>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themesData.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setTheme(t.id)} 
                    className={`p-4 rounded-[1.8rem] border-2 text-left transition-all ${theme === t.id ? 'border-orange-500 bg-orange-50 shadow-lg scale-[1.02]' : 'border-white bg-white hover:border-slate-200'}`}
                  >
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }}></div>
                     </div>
                     <div className="h-8 w-full rounded-lg border border-slate-100 shadow-inner" style={{ backgroundColor: t.main }}></div>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="bg-slate-900 border-none p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 blur-[80px]"></div>
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles text-xl"></i></div>
                   <button onClick={() => setAiEnabled(!aiEnabled)} className={`w-14 h-7 rounded-full relative transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${aiEnabled ? 'right-1.5' : 'left-1.5'}`}></div></button>
                </div>
                <Typography variant="h2" className="text-white mb-2 text-2xl">Двигун Інтелекту</Typography>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-8 font-medium">Використовуйте потужність Gemini для автоматичного розбору вхідних, стратегічного планування та аналізу соціальних зв'язків.</p>
                
                <div className="space-y-3 bg-black/20 p-6 rounded-[1.8rem] border border-white/5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Gemini Cloud API Key</label>
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Введіть ключ..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-4 pr-10 text-[11px] font-mono outline-none focus:border-orange-500" />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"><i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                      </div>
                      <button onClick={handleSaveApiKey} className="bg-orange-600 hover:bg-orange-700 text-white px-6 rounded-xl text-[10px] font-black uppercase transition-colors">OK</button>
                   </div>
                </div>
             </Card>
          </div>
        );
      case 'sidebar':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-2 mb-2">Видимість модулів</Typography>
             <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                {['today', 'inbox', 'calendar', 'projects', 'diary', 'habits', 'people', 'shopping', 'map'].map((id) => (
                  <div key={id} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner"><i className={`fa-solid ${sections.find(s=>s.id===id)?.icon || 'fa-shapes'}`}></i></div>
                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{id}</span>
                     </div>
                     <button 
                        onClick={() => updateSidebarSetting(id, sidebarSettings[id] === false)}
                        className={`w-11 h-6 rounded-full transition-all relative ${sidebarSettings[id] !== false ? 'bg-orange-500' : 'bg-slate-200'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sidebarSettings[id] !== false ? 'right-1' : 'left-1'}`}></div>
                      </button>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-center opacity-30 flex flex-col items-center">
                <i className="fa-solid fa-cloud-arrow-up text-5xl mb-4 text-slate-300"></i>
                <Typography variant="h3" className="uppercase font-black tracking-widest text-sm">Синхронізація хмари</Typography>
                <p className="text-[10px] font-bold mt-2">Coming Soon in v.3.0</p>
             </div>
             <Card padding="lg" className="border-rose-100 bg-rose-50/20">
                <Typography variant="h2" className="text-rose-600 mb-2">Небезпечна зона</Typography>
                <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">Ця дія безповоротно видалить всі завдання, проєкти, записи в щоденнику та налаштування героя. Ви зможете почати гру з чистого листа.</p>
                <button onClick={() => {if(confirm('Видалити ВСІ дані без можливості відновлення?')) {localStorage.clear(); window.location.reload();}}} className="w-full py-5 rounded-[1.8rem] bg-white text-rose-500 border-2 border-rose-100 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm">ОЧИСТИТИ ВСЮ ЛОКАЛЬНУ ПАМ'ЯТЬ</button>
             </Card>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-slate-50">
      {/* ЛІВА ПАНЕЛЬ: СПИСОК СЕКЦІЙ */}
      <div className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isMobile && selectedSectionId ? '-translate-x-full lg:translate-x-0 absolute lg:relative' : 'translate-x-0 relative'}`}>
        <header className="px-6 py-8 md:px-10 md:py-10 bg-white border-b border-slate-100 sticky top-0 z-20 shrink-0">
          <Typography variant="h1" className="text-2xl md:text-3xl font-black tracking-tight">Налаштування</Typography>
          <Typography variant="tiny" className="text-slate-400 mt-1 uppercase tracking-[0.2em] text-[8px] md:text-[9px]">Ядро Системи 12TR</Typography>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-2 bg-slate-50/30">
           {sections.map(section => (
             <Card 
               key={section.id} 
               padding="none" 
               onClick={() => setSelectedSectionId(section.id)}
               className={`p-4 md:p-5 flex items-center justify-between group transition-all cursor-pointer border ${selectedSectionId === section.id ? 'bg-white border-orange-300 ring-4 ring-orange-50 shadow-xl' : 'bg-white border-slate-50 hover:border-orange-200 shadow-sm'}`}
             >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-slate-50 transition-all ${section.color}`}>
                     <i className={`fa-solid ${section.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                     <Typography variant="h3" className="text-[12px] md:text-[13px] font-black uppercase tracking-tight truncate group-hover:text-orange-600 transition-colors">{section.label}</Typography>
                     <p className="text-[9px] font-bold text-slate-300 uppercase truncate mt-0.5">{section.desc}</p>
                  </div>
               </div>
               <i className="fa-solid fa-chevron-right text-[10px] text-slate-100 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"></i>
             </Card>
           ))}
        </div>
        
        <footer className="p-8 border-t border-slate-100 bg-white text-center">
           <Typography variant="tiny" className="text-slate-200">12TR ENGINE v.2.9.8 PRO PREVIEW</Typography>
        </footer>
      </div>

      {/* ПРАВА ПАНЕЛЬ: ДЕТАЛІ (Імітує деталі Inbox) */}
      <div className={`flex h-full border-l border-slate-100 z-[110] bg-white shrink-0 transition-all duration-300 ${isMobile ? (selectedSectionId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && (
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[120] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col">
           {selectedSectionId ? (
             <div className="h-full flex flex-col">
                <header className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                   <div className="flex items-center gap-4">
                      {isMobile && (
                        <button onClick={() => setSelectedSectionId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                      )}
                      <div className={`w-10 md:w-11 h-10 md:h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${sections.find(s => s.id === selectedSectionId)?.color?.replace('text-', 'bg-') || 'bg-slate-900'}`}>
                        <i className={`fa-solid ${sections.find(s => s.id === selectedSectionId)?.icon}`}></i>
                      </div>
                      <Typography variant="h2" className="text-base md:text-lg font-black uppercase tracking-tight">{sections.find(s => s.id === selectedSectionId)?.label}</Typography>
                   </div>
                   {!isMobile && (
                     <button onClick={() => setSelectedSectionId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
                   )}
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-slate-50/20">
                   <div className="max-w-xl mx-auto">
                     {renderContent()}
                   </div>
                </div>
                <footer className="p-6 md:p-8 border-t border-slate-50 bg-white shrink-0">
                   <Button onClick={() => isMobile ? setSelectedSectionId(null) : null} className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-sm">ГОТОВО</Button>
                </footer>
             </div>
           ) : (
             !isMobile && (
               <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
                  <i className="fa-solid fa-gear text-9xl mb-8"></i>
                  <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Параметри Двигуна</Typography>
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
