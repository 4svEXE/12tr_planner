import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, ThemeType } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import MiniCalendar from './sidebar/MiniCalendar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings, updateSidebarSetting,
    theme, setTheme
  } = useApp();
  
  const [showSettings, setShowSettings] = useState(false);

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні дії', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта світу' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Глибокий фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Профіль героя' },
    { id: 'people', icon: 'fa-users-between-lines', label: 'Люди' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-clipboard-check', label: 'Завершено', acceptDrop: true },
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
      <div key={item.id} onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(e) => handleGlobalDrop(e, item.id)} className={`relative group mb-0.5 px-2 ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}>
        <button 
          onClick={() => setActiveTab(item.id)} 
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-600 font-black shadow-sm ring-1 ring-orange-100' : dropTargetId === item.id ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-[var(--sidebar-item-hover)] opacity-70 hover:opacity-100'}`}
        >
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-orange-600' : 'text-[var(--text-muted)]'}`}><i className={`fa-solid ${item.icon}`}></i></span>
          <span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
          {counts[item.id] > 0 && <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[7px] font-black px-1 bg-[var(--border-color)] text-slate-500">{counts[item.id]}</span>}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div 
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
        className="hidden md:flex w-64 border-r border-[var(--border-color)] flex-col h-screen sticky top-0 z-40 transition-all shadow-sm shrink-0"
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="text-xl font-black font-heading flex items-center gap-3 tracking-tighter text-[var(--text-main)]">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white text-sm shadow-lg shadow-orange-200">
               <i className="fa-solid fa-bolt-lightning"></i>
            </div>
            <span>12TR</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar no-scrollbar">
          {primaryItems.map(renderMenuItem)}
          <div className="my-4 mx-6 border-t border-[var(--border-color)] opacity-50"></div>
          <div className="px-6 mb-2"><span className="text-[8px] uppercase font-black tracking-[0.2em] text-[var(--text-muted)] opacity-40">Інструменти</span></div>
          {widgetItems.map(renderMenuItem)}
        </nav>

        <div className="py-4 border-t border-[var(--border-color)] opacity-80 shrink-0 bg-slate-50/30">
          <div className="px-4 mb-4">
             <MiniCalendar />
          </div>
          {bottomItems.map(renderMenuItem)}
          <div className="px-2 mt-2">
              <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-main)] hover:shadow-sm transition-all">
                  <span className="w-4 flex justify-center text-xs"><i className="fa-solid fa-gear"></i></span>
                  <span className="font-black text-[9px] tracking-widest uppercase">Налаштування</span>
              </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (TickTick style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50 flex items-center justify-around px-2 pb-safe">
         {[primaryItems[0], primaryItems[2], widgetItems[1], widgetItems[2]].map(item => (
           <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${activeTab === item.id ? 'text-orange-600 bg-orange-50 font-black' : 'text-slate-400'}`}
           >
             <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
             <span className="text-[7px] font-black uppercase tracking-tight">{item.label}</span>
           </button>
         ))}
         <button onClick={() => setShowSettings(true)} className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-slate-400">
           <i className="fa-solid fa-ellipsis text-lg mb-1"></i>
           <span className="text-[7px] font-black uppercase">Опції</span>
         </button>
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
    
    const themes: {id: ThemeType, label: string, color: string, isDark: boolean}[] = [
      { id: 'classic', label: 'Classic', color: '#f97316', isDark: false },
      { id: 'midnight', label: 'Midnight', color: '#10b981', isDark: true },
      { id: 'nordic', label: 'Nordic', color: '#6366f1', isDark: true },
      { id: 'sakura', label: 'Sakura', color: '#ec4899', isDark: false },
      { id: 'forest', label: 'Forest', color: '#059669', isDark: false },
      { id: 'amethyst', label: 'Amethyst', color: '#a855f7', isDark: false },
      { id: 'volcano', label: 'Volcano', color: '#ef4444', isDark: false },
      { id: 'slate', label: 'Slate', color: '#94a3b8', isDark: true },
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={onHide}></div>
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-100"><i className="fa-solid fa-palette"></i></div>
                  <div>
                    <Typography variant="h2" className="text-xl leading-none mb-1 text-slate-900">Налаштування</Typography>
                    <Typography variant="tiny" className="text-slate-400">Персоналізація двигуна 12TR</Typography>
                  </div>
               </div>
               <button onClick={onHide} className="w-10 h-10 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 flex items-center gap-2 uppercase text-[9px] tracking-[0.2em]">
                     Теми інтерфейсу
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {themes.map(t => (
                       <button 
                         key={t.id} 
                         onClick={() => setTheme(t.id)}
                         className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${theme === t.id ? 'border-orange-500 bg-orange-50/50 shadow-md scale-105' : 'border-slate-50 bg-slate-50 opacity-70 hover:opacity-100'}`}
                       >
                          <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">{t.label}</span>
                       </button>
                     ))}
                  </div>
               </section>

               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-4 flex items-center gap-2 uppercase text-[9px] tracking-[0.2em]">
                     Видимість меню
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                     {allSections.map(item => (
                       <div key={item.id} className="flex items-center justify-between py-2 border-b border-white last:border-0">
                          <div className="flex items-center gap-3">
                             <i className={`fa-solid ${item.icon} text-slate-300 text-xs w-4 text-center`}></i>
                             <span className="text-[10px] font-black text-slate-600 uppercase truncate">{item.label}</span>
                          </div>
                          <button 
                            onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                            className={`w-10 h-5 rounded-full relative transition-all ${sidebarSettings[item.id] !== false ? 'bg-orange-600' : 'bg-slate-300'}`}
                          >
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-1' : 'left-1'}`}></div>
                          </button>
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <div className="p-5 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                           <i className="fa-solid fa-sparkles"></i>
                        </div>
                        <div>
                           <div className="text-xs font-black uppercase tracking-wider">AI Стратег</div>
                           <div className="text-[8px] text-slate-400 font-bold uppercase">Автоматичний аналіз GTD</div>
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

            <footer className="p-6 border-t border-slate-100 bg-slate-50/50">
               <button onClick={onHide} className="w-full py-4 rounded-2xl bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all">ЗБЕРЕГТИ ВСЕ</button>
            </footer>
          </div>
        </div>
    );
}

export default Sidebar;