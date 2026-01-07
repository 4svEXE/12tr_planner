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
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Хештеги' },
    { id: 'hobbies', icon: 'fa-icons', label: 'Хобі' },
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
          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all ${isActive ? 'sidebar-item-active font-bold' : dropTargetId === item.id ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-[var(--sidebar-item-hover)] opacity-70 hover:opacity-100'}`}
        >
          <span className={`w-4 flex justify-center text-xs ${isActive ? '' : 'text-[var(--text-muted)]'}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-medium text-[10px] tracking-tight truncate uppercase">{item.label}</span>
              {counts[item.id] > 0 && <span className="h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 bg-[var(--border-color)] opacity-70">{counts[item.id]}</span>}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <div 
      style={{ backgroundColor: 'var(--bg-sidebar)' }}
      className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} border-r border-[var(--border-color)] flex flex-col h-screen sticky top-0 z-40 transition-none shadow-sm`}
    >
      <div className="p-4 flex items-center justify-between shrink-0">
        {!isSidebarCollapsed && <div className="text-lg font-black font-heading flex items-center gap-2 tracking-tighter text-[var(--text-main)]"><i className="fa-solid fa-bolt-lightning text-[var(--primary)] text-sm"></i><span>12TR</span></div>}
        <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-6 h-6 rounded-lg hover:bg-[var(--sidebar-item-hover)] flex items-center justify-center text-[var(--text-muted)]"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'} text-[10px]`}></i></button>
      </div>
      
      <nav className="flex-1 space-y-0 py-2 overflow-y-auto custom-scrollbar no-scrollbar">
        {primaryItems.map(renderMenuItem)}
        <div className="my-2 mx-4 border-t border-[var(--border-color)] opacity-50"></div>
        {!isSidebarCollapsed && <div className="px-5 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-[var(--text-muted)] opacity-50">Інструменти</span></div>}
        {widgetItems.map(renderMenuItem)}
      </nav>

      <div className="py-2 border-t border-[var(--border-color)] opacity-80 shrink-0">
        {!isSidebarCollapsed && <MiniCalendar />}
        {bottomItems.map(renderMenuItem)}
        <div className="px-2 mt-1">
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-main)]">
                <span className="w-4 flex justify-center text-[10px]"><i className="fa-solid fa-gear"></i></span>
                {!isSidebarCollapsed && <span className="font-bold text-[9px] tracking-widest uppercase">Опції</span>}
            </button>
        </div>
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40">
          <div className="absolute inset-0" onClick={onHide}></div>
          <div className="bg-[var(--bg-card)] w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col relative">
            <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-10">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white text-xs"><i className="fa-solid fa-palette"></i></div>
                  <div>
                    <Typography variant="h3" className="text-sm leading-none mb-1 text-[var(--text-main)]">Налаштування</Typography>
                    <Typography variant="tiny" className="text-[var(--text-muted)] text-[8px]">Конфігурація двигуна</Typography>
                  </div>
               </div>
               <button onClick={onHide} className="w-8 h-8 rounded-lg hover:bg-[var(--sidebar-item-hover)] flex items-center justify-center text-[var(--text-muted)]"><i className="fa-solid fa-xmark"></i></button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
               <section>
                  <Typography variant="tiny" className="text-[var(--text-main)] font-black mb-3 flex items-center gap-2 uppercase text-[9px] tracking-widest">
                     Теми інтерфейсу
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {themes.map(t => (
                       <button 
                         key={t.id} 
                         onClick={() => setTheme(t.id)}
                         className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 ${theme === t.id ? 'border-[var(--primary)] bg-[var(--sidebar-item-active)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] opacity-70 hover:opacity-100'}`}
                       >
                          <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.color }}></div>
                          <span className="text-[8px] font-black uppercase tracking-tighter text-[var(--text-main)]">{t.label}</span>
                          {t.isDark && <span className="text-[6px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Dark</span>}
                       </button>
                     ))}
                  </div>
               </section>

               <section>
                  <Typography variant="tiny" className="text-[var(--text-main)] font-black mb-3 flex items-center gap-2 uppercase text-[9px] tracking-widest">
                     Конструктор меню
                  </Typography>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
                     {allSections.map(item => (
                       <div key={item.id} className="flex items-center justify-between py-1 border-b border-[var(--border-color)] last:border-0">
                          <div className="flex items-center gap-2 overflow-hidden">
                             <i className={`fa-solid ${item.icon} text-[var(--text-muted)] text-[8px] w-3`}></i>
                             <span className="text-[9px] font-bold text-[var(--text-main)] truncate">{item.label}</span>
                          </div>
                          <button 
                            onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                            className={`w-6 h-3 rounded-full relative ${sidebarSettings[item.id] !== false ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]/30'}`}
                          >
                             <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-0.5' : 'left-0.5'}`}></div>
                          </button>
                       </div>
                     ))}
                  </div>
               </section>

               <section>
                  <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <i className="fa-solid fa-sparkles text-[var(--primary)]"></i>
                        <div>
                           <div className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight">AI Асистент (Gemini)</div>
                           <div className="text-[8px] text-[var(--text-muted)] font-medium leading-tight">Автоматична стратегія та аналіз</div>
                        </div>
                     </div>
                     <button 
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`w-8 h-4 rounded-full relative ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-400/20'}`}
                     >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                     </button>
                  </div>
               </section>
            </div>

            <footer className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex gap-2">
               <button onClick={onHide} className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-widest shadow-lg">ЗБЕРЕГТИ</button>
            </footer>
          </div>
        </div>
    );
}

export default Sidebar;