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
    { id: 'people', icon: 'fa-users-between-lines', label: 'Люди' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
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
      <div key={item.id} onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(e) => handleGlobalDrop(e, item.id)} className={`relative group px-1 ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}>
        <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm' : dropTargetId === item.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50 flex items-center justify-around px-2">
         {[primaryItems[0], primaryItems[2], widgetItems[1], widgetItems[2], widgetItems[5]].map(item => (
           <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === item.id ? 'text-orange-600 bg-orange-50' : 'text-slate-400'}`}
           >
             <i className={`fa-solid ${item.icon} text-sm mb-0.5`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
         <button onClick={() => setShowSettings(true)} className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-400"><i className="fa-solid fa-ellipsis text-sm"></i><span className="text-[6px] font-black uppercase">Більше</span></button>
      </div>

      {showSettings && <SettingsModal 
        onHide={() => setShowSettings(false)} 
        allSections={[...primaryItems, ...widgetItems, ...bottomItems]}
      />}
    </>
  );
};

const SettingsModal: React.FC<{ onHide: () => void, allSections: any[] }> = ({ onHide, allSections }) => {
    const { theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, updateSidebarSetting } = useApp();
    const themes: {id: ThemeType, label: string, color: string}[] = [
      { id: 'classic', label: 'Classic', color: '#f97316' },
      { id: 'midnight', label: 'Midnight', color: '#10b981' },
      { id: 'nordic', label: 'Nordic', color: '#6366f1' },
      { id: 'sakura', label: 'Sakura', color: '#ec4899' },
      { id: 'forest', label: 'Forest', color: '#059669' },
      { id: 'amethyst', label: 'Amethyst', color: '#a855f7' },
      { id: 'volcano', label: 'Volcano', color: '#ef4444' },
      { id: 'slate', label: 'Slate', color: '#475569' },
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onHide}></div>
          <div className="bg-white w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <header className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div>
                  <Typography variant="h2" className="text-xl md:text-2xl mb-1">Налаштування</Typography>
                  <Typography variant="tiny" className="text-slate-300">Персоналізація простору</Typography>
               </div>
               <button onClick={onHide} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-10">
               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-6 flex items-center gap-2 uppercase text-[9px] tracking-widest">
                     <i className="fa-solid fa-palette text-orange-500"></i> Колірна схема
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {themes.map(t => (
                       <button 
                         key={t.id} 
                         onClick={() => setTheme(t.id)}
                         className={`p-3 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${theme === t.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-50 bg-slate-50 text-slate-500'}`}
                       >
                          <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                          <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                       </button>
                     ))}
                  </div>
               </section>

               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-6 flex items-center gap-2 uppercase text-[9px] tracking-widest">
                     <i className="fa-solid fa-screwdriver-wrench text-orange-500"></i> Видимість розділів
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100">
                     {allSections.map(item => (
                       <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                             <i className={`fa-solid ${item.icon} text-slate-300 text-[10px] w-4 text-center`}></i>
                             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                          </div>
                          <button 
                            onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                            className={`w-9 h-5 rounded-full transition-all relative ${sidebarSettings[item.id] !== false ? 'bg-orange-500' : 'bg-slate-200'}`}
                          >
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-1' : 'left-1'}`}></div>
                          </button>
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <div className="p-5 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-lg shadow-lg">
                           <i className="fa-solid fa-sparkles"></i>
                        </div>
                        <div>
                           <div className="text-[11px] font-black uppercase tracking-wider">ШІ-Стратег</div>
                           <div className="text-[8px] text-slate-400 font-bold uppercase">Аналіз квестів та спогадів</div>
                        </div>
                     </div>
                     <button 
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`w-14 h-7 rounded-full transition-all relative ${aiEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                     >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${aiEnabled ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
               </section>
            </div>

            <footer className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
               <Button onClick={onHide} variant="primary" className="w-full py-4 rounded-[1.5rem] text-[10px] tracking-[0.2em] font-black uppercase shadow-lg">ЗБЕРЕГТИ ВСЕ</Button>
            </footer>
          </div>
        </div>
    );
}

export default Sidebar;