
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, ThemeType } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings, updateSidebarSetting,
    aiEnabled, setAiEnabled, theme, setTheme
  } = useApp();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const allNavItems = useMemo(() => [...primaryItems, ...widgetItems, ...bottomItems], []);

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today': scheduleTask(taskId, new Date().setHours(0,0,0,0)); break;
      case 'inbox': updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false }); break;
      case 'next_actions': updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false }); break;
      case 'notes': updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false }); break;
      case 'completed': if (task.status !== TaskStatus.DONE) toggleTaskStatus(task); break;
      case 'trash': updateTask({ ...task, isDeleted: true }); break;
    }
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    
    return (
      <div key={item.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleGlobalDrop(e, item.id)} className="relative group px-1">
        <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-orange-600' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
              {counts[item.id] > 0 && <span className="h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 bg-slate-100 text-slate-500">{counts[item.id]}</span>}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-white border-r border-slate-100 flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && <div className="text-xl font-black font-heading text-orange-600 flex items-center gap-2 tracking-tighter leading-none"><span>12TR</span></div>}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
        </div>
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar no-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-slate-50"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-slate-300">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        <div className="px-1 py-4 border-t border-slate-50 space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
            <span className="w-4 flex justify-center text-[10px]"><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Опції</span>}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Restored Fixed Layout */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 flex items-center justify-around px-4 pb-safe">
         {[
           { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
           { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні' },
           { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні' },
           { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
           { id: 'menu', icon: 'fa-grid-2', label: 'Модулі', isMenuTrigger: true }
         ].map(item => (
           <button 
            key={item.id} 
            onClick={() => item.isMenuTrigger ? setShowMobileMenu(true) : setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${!item.isMenuTrigger && activeTab === item.id ? 'text-orange-600 bg-orange-50 shadow-inner' : 'text-slate-400'}`}
           >
             <i className={`fa-solid ${item.isMenuTrigger ? 'fa-table-cells-large' : item.icon} text-lg mb-0.5`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
      </div>

      {/* Mobile Full Screen Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[200] bg-white md:hidden animate-in fade-in slide-in-from-bottom duration-300 flex flex-col">
           <header className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-table-cells-large"></i></div>
                 <Typography variant="h2" className="text-xl">Системні Модулі</Typography>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <div className="grid grid-cols-3 gap-4 pb-20">
                 {allNavItems.map(item => {
                   if (sidebarSettings[item.id] === false) return null;
                   const isActive = activeTab === item.id;
                   // Не дублюємо те, що вже є в основному таббарі для чистоти меню
                   const isStatic = ['today', 'inbox', 'next_actions', 'calendar'].includes(item.id);
                   
                   return (
                     <button 
                      key={item.id} 
                      onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${isActive ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-100' : 'bg-white border-slate-100 text-slate-500 shadow-sm'} ${isStatic ? 'opacity-50' : ''}`}
                     >
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${isActive ? 'bg-white/10' : 'bg-slate-50'}`}>
                          <i className={`fa-solid ${item.icon} text-lg`}></i>
                       </div>
                       <span className="text-[8px] font-black uppercase text-center leading-tight">{item.label}</span>
                       {counts[item.id] > 0 && <span className={`mt-1 text-[7px] font-black ${isActive ? 'text-white/60' : 'text-slate-300'}`}>({counts[item.id]})</span>}
                     </button>
                   );
                 })}
                 
                 <button 
                  onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm"
                 >
                   <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 bg-white">
                      <i className="fa-solid fa-gear text-lg"></i>
                   </div>
                   <span className="text-[8px] font-black uppercase text-center leading-tight">Опції</span>
                 </button>
              </div>
           </div>
           
           <footer className="p-6 border-t border-slate-50 bg-slate-50/50 text-center">
              <Typography variant="tiny" className="text-slate-300 uppercase tracking-[0.2em] text-[8px]">12TR Life Engine Control Hub</Typography>
           </footer>
        </div>
      )}

      {showSettings && <SettingsModal 
        onHide={() => setShowSettings(false)} 
        allSections={allNavItems}
      />}
    </>
  );
};

const SettingsModal: React.FC<{ onHide: () => void, allSections: any[] }> = ({ onHide, allSections }) => {
    const { theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, updateSidebarSetting } = useApp();
    const [activeTab, setActiveTab] = useState<'main' | 'about'>('main');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
      'appearance': false,
      'visibility': true,
      'system': false
    });

    const themes: {id: ThemeType, label: string, color: string}[] = [
      { id: 'classic', label: 'Classic', color: '#f97316' },
      { id: 'midnight', label: 'Midnight', color: '#10b981' },
      { id: 'obsidian', label: 'Obsidian', color: '#8b5cf6' },
      { id: 'nordic-dark', label: 'Nordic', color: '#6366f1' },
      { id: 'sakura', label: 'Sakura', color: '#ec4899' },
      { id: 'forest', label: 'Forest', color: '#059669' },
      { id: 'lavender', label: 'Lavender', color: '#a855f7' },
      { id: 'mars', label: 'Volcano', color: '#ef4444' },
      { id: 'slate', label: 'Slate', color: '#475569' },
    ];

    const toggleSection = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

    const SettingRow = ({ label, icon, children, colorClass = "text-slate-300" }: any) => (
      <div className="flex items-center justify-between py-2.5 px-4 hover:bg-black/5 transition-colors border-b border-slate-50 last:border-0">
        <div className="flex items-center gap-3">
          <i className={`fa-solid ${icon} ${colorClass} text-[10px] w-4 text-center`}></i>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
        </div>
        <div>{children}</div>
      </div>
    );

    const CollapsibleSection = ({ id, title, icon, colorClass, children }: any) => {
      const isCol = collapsed[id];
      return (
        <div className={`flex flex-col border-b border-slate-100 transition-all ${isCol ? '' : 'bg-slate-50/30'}`}>
          <div 
            onClick={() => toggleSection(id)}
            className="flex items-center gap-3 py-3 px-5 hover:bg-black/5 cursor-pointer select-none"
          >
            <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${!isCol ? 'rotate-90' : ''}`}></i>
            <i className={`fa-solid ${icon} text-[10px] ${colorClass}`}></i>
            <Typography variant="tiny" className={`${colorClass} font-black uppercase tracking-widest text-[9px] flex-1`}>{title}</Typography>
          </div>
          {!isCol && <div className="flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
        </div>
      );
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 md:p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onHide}></div>
          <div className="bg-white w-full max-w-xl max-h-[95vh] md:max-h-[90vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <header className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-gear"></i></div>
                  <div>
                    <Typography variant="h2" className="text-xl leading-none mb-1">Опції Системи</Typography>
                    <Typography variant="tiny" className="text-slate-300 uppercase">Двигун 12TR v.2.5</Typography>
                  </div>
               </div>
               <button onClick={onHide} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </header>

            <div className="flex bg-slate-50/50 p-1 m-4 rounded-xl border border-slate-100 shrink-0">
               <button onClick={() => setActiveTab('main')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'main' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Налаштування</button>
               <button onClick={() => setActiveTab('about')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'about' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Про 12TR</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {activeTab === 'main' ? (
                 <div className="flex flex-col">
                    <CollapsibleSection id="appearance" title="Вигляд та Теми" icon="fa-palette" colorClass="text-orange-500">
                       <div className="p-4 grid grid-cols-4 gap-2">
                          {themes.map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => setTheme(t.id)}
                              className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center ${theme === t.id ? 'border-orange-500 ring-2 ring-orange-100' : 'border-white bg-white shadow-sm'}`}
                              title={t.label}
                            >
                               <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                            </button>
                          ))}
                       </div>
                       <SettingRow label="Компактний режим" icon="fa-compress">
                          <button className="w-9 h-5 rounded-full bg-slate-200 relative"><div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"></div></button>
                       </SettingRow>
                       <SettingRow label="Плавні анімації" icon="fa-wand-magic-sparkles">
                          <button className="w-9 h-5 rounded-full bg-emerald-500 relative shadow-inner"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full"></div></button>
                       </SettingRow>
                    </CollapsibleSection>

                    <CollapsibleSection id="visibility" title="Відображення розділів" icon="fa-eye" colorClass="text-indigo-500">
                       {allSections.map(item => (
                         <SettingRow key={item.id} label={item.label} icon={item.icon}>
                            <button 
                              onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                              className={`w-9 h-5 rounded-full transition-all relative ${sidebarSettings[item.id] !== false ? 'bg-orange-500 shadow-inner' : 'bg-slate-200'}`}
                            >
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-1' : 'left-1'}`}></div>
                            </button>
                         </SettingRow>
                       ))}
                    </CollapsibleSection>

                    <CollapsibleSection id="system" title="Гейміфікація та ШІ" icon="fa-gamepad" colorClass="text-rose-500">
                       <div className="p-4">
                          <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center"><i className="fa-solid fa-sparkles text-xs"></i></div>
                                <span className="text-[9px] font-black uppercase tracking-wider">ШІ-Стратег</span>
                             </div>
                             <button onClick={() => setAiEnabled(!aiEnabled)} className={`w-10 h-5 rounded-full relative transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${aiEnabled ? 'right-1' : 'left-1'}`}></div></button>
                          </div>
                       </div>
                    </CollapsibleSection>

                    <div className="p-8 mt-4 text-center">
                       <Typography variant="tiny" className="text-slate-200 mb-2">Небезпечна зона</Typography>
                       <button onClick={() => { if(confirm('Це видалить ВСІ ваші дані без можливості відновлення. Ви впевнені?')) { localStorage.clear(); window.location.reload(); } }} className="text-[8px] font-black text-rose-300 uppercase hover:text-rose-500 tracking-[0.2em] transition-colors">Скинути всю базу даних</button>
                    </div>
                 </div>
               ) : (
                 <div className="p-8 space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center text-center space-y-4">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-orange-400 to-rose-500 flex items-center justify-center text-white text-3xl shadow-2xl">
                          <i className="fa-solid fa-bolt-lightning"></i>
                       </div>
                       <div>
                          <Typography variant="h2" className="text-2xl font-black">12TR Engine</Typography>
                          <Typography variant="tiny" className="text-orange-500 font-bold uppercase tracking-[0.3em]">The Gamified Life OS</Typography>
                       </div>
                    </div>

                    <div className="space-y-4 text-[12px] font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                       <p><strong>12TR</strong> — це не просто таск-менеджер. Це ваша персональна стратегічна гра, де ви — головний герой. Ми поєднали три потужні концепції:</p>
                       <ul className="space-y-2 list-disc pl-4">
                          <li><span className="font-bold text-slate-800">GTD:</span> Технологія очищення розуму та фокусу на конкретних діях.</li>
                          <li><span className="font-bold text-slate-800">12 Тижнів:</span> Рік, стиснутий до кварталу для вибухової продуктивності.</li>
                          <li><span className="font-bold text-slate-800">RPG Гейміфікація:</span> Прогресія персонажа, XP за квести та мапа світу.</li>
                       </ul>
                       <p className="mt-4 italic">Перетворюйте хаос вхідних у чіткий план завоювання власного життя.</p>
                    </div>
                 </div>
               )}
            </div>

            <footer className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 shrink-0">
               <Button onClick={onHide} variant="primary" className="w-full py-4 rounded-[1.5rem] text-[10px] tracking-[0.2em] font-black uppercase shadow-lg">ГОТОВО</Button>
            </footer>
          </div>
        </div>
    );
}

export default Sidebar;
