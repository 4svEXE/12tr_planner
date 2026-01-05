
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

const MiniCalendar: React.FC = () => {
  const { tasks, setActiveTab, setCalendarDate, setCalendarViewMode } = useApp();
  const today = new Date();
  
  const weekDays = useMemo(() => {
    const start = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const hasEventOnDay = (date: Date) => {
    const ts = new Date(date).setHours(0,0,0,0);
    return tasks.some(t => {
      if (!t.isEvent || t.isDeleted) return false;
      const start = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
      const end = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : start;
      if (!start) return false;
      return ts >= start && ts <= (end || start);
    });
  };

  const handleDateClick = (date: Date) => {
    setCalendarDate(date.getTime());
    setCalendarViewMode('week');
    setActiveTab('calendar');
  };

  return (
    <div className="px-1 py-2 mb-4 mx-1">
      <div className="flex justify-between gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const hasEvent = hasEventOnDay(d);
          return (
            <button key={i} onClick={() => handleDateClick(d)} className="flex flex-col items-center gap-1 group">
              <span className="text-[7px] font-black text-slate-300 uppercase leading-none group-hover:text-orange-500 transition-colors">
                {d.toLocaleString('uk-UA', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${isToday ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                {d.getDate()}
              </div>
              <div className="h-0.5 flex items-center justify-center">
                {hasEvent && <div className="w-1 h-0.5 rounded-full bg-orange-400"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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

  const themes: { id: ThemeType; label: string; color: string; isDark?: boolean }[] = [
    { id: 'classic', label: 'Класика', color: '#f97316' },
    { id: 'midnight', label: 'Опівніч', color: '#10b981', isDark: true },
    { id: 'nordic', label: 'Північ', color: '#3b82f6' },
    { id: 'sakura', label: 'Сакура', color: '#ec4899' },
    { id: 'forest', label: 'Ліс', color: '#16a34a' },
    { id: 'amethyst', label: 'Аметист', color: '#8b5cf6' },
    { id: 'volcano', label: 'Вулкан', color: '#ef4444' },
    { id: 'slate', label: 'Графіт', color: '#334155', isDark: true },
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
      case 'today':
        scheduleTask(taskId, new Date().setHours(0,0,0,0));
        break;
      case 'inbox':
        updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false });
        break;
      case 'next_actions':
        updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false });
        break;
      case 'notes':
        updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false });
        break;
      case 'completed':
        if (task.status !== TaskStatus.DONE) toggleTaskStatus(task);
        break;
      case 'trash':
        updateTask({ ...task, isDeleted: true });
        break;
    }
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    
    return (
      <div
        key={item.id}
        onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(e) => handleGlobalDrop(e, item.id)}
        className={`relative group ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}
      >
        <button
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            isActive 
              ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm font-bold' 
              : dropTargetId === item.id
                ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className={`w-5 flex justify-center text-sm ${isActive ? 'text-orange-600' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </span>
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left font-medium text-[11px] tracking-tight truncate">{item.label}</span>
              {counts[item.id] > 0 && (
                <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[9px] font-bold px-1 bg-slate-100 text-slate-500">
                  {counts[item.id]}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={`${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out`}>
      <div className="p-4 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="text-xl font-bold font-heading text-orange-600 flex items-center gap-2">
            <i className="fa-solid fa-bolt-lightning text-pink-500 text-base"></i>
            <span>12TR</span>
          </div>
        )}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
        >
          <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i>
        </button>
      </div>
      
      <nav className="flex-1 px-2 space-y-0.5 py-2 overflow-y-auto custom-scrollbar">
        {primaryItems.map(renderMenuItem)}
        
        <div className="my-4 mx-2 border-t border-slate-100"></div>
        
        {!isSidebarCollapsed && (
          <div className="px-3 mb-2">
            <span className="text-[8px] uppercase font-black tracking-widest text-slate-300">Віджети</span>
          </div>
        )}
        {widgetItems.map(renderMenuItem)}
      </nav>

      <div className="px-2 py-4 border-t border-slate-100 space-y-0.5">
        {!isSidebarCollapsed && <MiniCalendar />}

        {!isSidebarCollapsed && (
          <div className="px-3 mb-2">
            <span className="text-[8px] uppercase font-black tracking-widest text-slate-300">Архів та мітки</span>
          </div>
        )}
        {bottomItems.map(renderMenuItem)}
        
        <button 
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <span className="w-5 flex justify-center text-sm"><i className="fa-solid fa-gear"></i></span>
          {!isSidebarCollapsed && <span className="font-medium text-[11px] tracking-tight">Налаштування</span>}
        </button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <Typography variant="h2" className="text-xl">Налаштування</Typography>
              <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Theme Selector */}
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-4 block">Оберіть тему оформлення</Typography>
                <div className="grid grid-cols-4 gap-3">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${
                        theme === t.id ? 'border-orange-500 bg-orange-50/50 scale-105 shadow-sm' : 'border-slate-50 hover:border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-full shadow-inner border border-white/20" 
                          style={{ backgroundColor: t.color }}
                        ></div>
                        {t.isDark && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] border border-white">
                            <i className="fa-solid fa-moon"></i>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-slate-900">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Toggle */}
              <div className="p-5 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                         <i className="fa-solid fa-sparkles"></i>
                       </div>
                       <div>
                          <div className="text-xs font-black text-slate-900 uppercase tracking-tight">AI Асистент</div>
                          <div className="text-[10px] text-orange-600 font-bold">Персоналізовані поради та брифінги</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${aiEnabled ? 'bg-orange-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${aiEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
              </div>

              {/* Section Visibility */}
              <div className="space-y-2">
                <Typography variant="tiny" className="text-slate-400 mb-2 block">Видимість розділів</Typography>
                {[...primaryItems, ...widgetItems, ...bottomItems].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400">
                        <i className={`fa-solid ${item.icon} text-xs`}></i>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <button 
                      onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] !== false ? false : true)}
                      className={`w-10 h-5 rounded-full transition-all relative ${sidebarSettings[item.id] !== false ? 'bg-slate-800' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => setShowSettings(false)} 
              className="w-full mt-10 py-4 rounded-3xl text-xs tracking-widest"
            >
              ЗБЕРЕГТИ ТА ЗАКРИТИ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
