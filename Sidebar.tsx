
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
    { id: 'finances', icon: 'fa-coins', label: 'Фінанси' },
    { id: 'contacts', icon: 'fa-users-between-lines', label: 'Нетворкінг' },
    { id: 'character', icon: 'fa-user-shield', label: 'Профіль героя' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-check-double', label: 'Завершено', acceptDrop: true },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Хештеги' },
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
      <div key={item.id} onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(e) => handleGlobalDrop(e, item.id)} className={`relative group ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}>
        <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm font-bold' : dropTargetId === item.id ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <span className={`w-5 flex justify-center text-sm ${isActive ? 'text-orange-600' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-medium text-[11px] tracking-tight truncate">{item.label}</span>
              {counts[item.id] > 0 && <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[9px] font-bold px-1 bg-slate-100 text-slate-500">{counts[item.id]}</span>}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={`${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out`}>
      <div className="p-4 flex items-center justify-between">
        {!isSidebarCollapsed && <div className="text-xl font-bold font-heading text-orange-600 flex items-center gap-2"><i className="fa-solid fa-bolt-lightning text-pink-500 text-base"></i><span>12TR</span></div>}
        <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
      </div>
      <nav className="flex-1 px-2 space-y-0.5 py-2 overflow-y-auto custom-scrollbar">
        {primaryItems.map(renderMenuItem)}
        <div className="my-4 mx-2 border-t border-slate-100"></div>
        {!isSidebarCollapsed && <div className="px-3 mb-2"><span className="text-[8px] uppercase font-black tracking-widest text-slate-300">Віджети</span></div>}
        {widgetItems.map(renderMenuItem)}
      </nav>
      <div className="px-2 py-4 border-t border-slate-100 space-y-0.5">
        {bottomItems.map(renderMenuItem)}
        <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
          <span className="w-5 flex justify-center text-sm"><i className="fa-solid fa-gear"></i></span>
          {!isSidebarCollapsed && <span className="font-medium text-[11px] tracking-tight">Налаштування</span>}
        </button>
      </div>
      {showSettings && <SettingsModal 
        onHide={() => setShowSettings(false)} 
        allSections={[...primaryItems, ...widgetItems, ...bottomItems]}
      />}
    </div>
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onHide}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                  <Typography variant="h2" className="text-2xl mb-1">Налаштування</Typography>
                  <Typography variant="tiny" className="text-slate-400">Персоналізація твого простору</Typography>
               </div>
               <button onClick={onHide} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
               {/* Themes Section */}
               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-6 flex items-center gap-2">
                     <i className="fa-solid fa-palette text-orange-500"></i> Колірна схема (Теми)
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {themes.map(t => (
                       <button 
                         key={t.id} 
                         onClick={() => setTheme(t.id)}
                         className={`p-4 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${theme === t.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                       >
                          <div className="w-8 h-8 rounded-xl shadow-inner" style={{ backgroundColor: t.color }}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                       </button>
                     ))}
                  </div>
               </section>

               {/* Sidebar Construction Section */}
               <section>
                  <Typography variant="tiny" className="text-slate-900 font-black mb-6 flex items-center gap-2">
                     <i className="fa-solid fa-screwdriver-wrench text-orange-500"></i> Конструктор меню (Видимість)
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                     {allSections.map(item => (
                       <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                             <i className={`fa-solid ${item.icon} text-slate-300 text-xs w-4 text-center`}></i>
                             <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
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

               {/* AI Assistant Section */}
               <section>
                  <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                           <i className="fa-solid fa-sparkles"></i>
                        </div>
                        <div>
                           <div className="text-sm font-black uppercase tracking-wider">ШІ-Стратег (Gemini)</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase">Автоматичний аналіз та квести</div>
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

            <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 sticky bottom-0 z-10">
               <Button onClick={onHide} variant="primary" className="flex-1 py-4 rounded-[1.5rem] text-xs tracking-[0.2em] font-black">ЗБЕРЕГТИ ВСЕ</Button>
            </footer>
          </div>
        </div>
    );
}

export default Sidebar;
