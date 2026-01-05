
import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import StrategyMap from './views/StrategyMap';
import Inbox from './views/Inbox';
import Calendar from './views/Calendar';
import Hashtags from './views/Hashtags';
import DeepFocus from './views/DeepFocus';
import ProjectsView from './views/ProjectsView';
import StructureView from './views/StructureView';
import HabitsView from './views/HabitsView';
import TodayView from './views/TodayView';
import NotesView from './views/NotesView';
import DiaryView from './views/DiaryView';
import TrashView from './views/TrashView';
import CharacterProfile from './views/CharacterProfile';
import { TaskStatus } from './types';

const MainLayout: React.FC = () => {
  const { 
    activeTab, setActiveTab, tasks, pendingUndo, undoLastAction, character, projects, diary,
    aiEnabled
  } = useApp();
  
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => 
      !t.isDeleted &&
      t.status !== TaskStatus.DONE && 
      (t.scheduledDate === todayTimestamp || (t.projectId && t.projectSection === 'actions'))
    ).length,
    inbox: tasks.filter(t => {
      const isHabit = t.projectSection === 'habits' || t.tags.includes('habit');
      return !t.isDeleted && t.status === TaskStatus.INBOX && t.category !== 'note' && !isHabit && !t.projectId && !t.scheduledDate;
    }).length,
    next_actions: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.NEXT_ACTION).length,
    notes: tasks.filter(t => !t.isDeleted && t.category === 'note' && t.status !== TaskStatus.DONE).length,
    calendar: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate).length,
    trash: tasks.filter(t => t.isDeleted).length
  }), [tasks, todayTimestamp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayView />;
      case 'dashboard': return <Dashboard character={character} tasks={tasks.filter(t => !t.isDeleted)} projects={projects} />;
      case 'map': return <StrategyMap />;
      case 'inbox': return <Inbox />;
      case 'next_actions': return <Inbox showNextActions />;
      case 'diary': return <DiaryView />;
      case 'notes': return <NotesView />;
      case 'habits': return <HabitsView />;
      case 'completed': return <Inbox showCompleted />;
      case 'calendar': return <Calendar />;
      case 'projects': return <ProjectsView />;
      case 'structure': return <StructureView />;
      case 'hashtags': return <Hashtags tasks={tasks.filter(t => !t.isDeleted)} />;
      case 'trash': return <TrashView />;
      case 'character': return <CharacterProfile />;
      case 'focus': return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl mb-6">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <h2 className="text-3xl font-black mb-4">Глибокий Фокус</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Обери завдання для занурення. Жодних сповіщень, тільки ти і твоя мета.</p>
          <button 
            onClick={() => setShowFocusMode(true)}
            className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:bg-orange-700 transition-all"
          >
            УВІЙТИ В ПОТІК
          </button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-none selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      
      <main className="flex-1 overflow-y-auto relative transition-all duration-300 ease-in-out">
        {renderContent()}

        {showFocusMode && (
          <DeepFocus 
            taskTitle={tasks.find(t => !t.isDeleted)?.title || "Робота над проектом"} 
            onExit={() => setShowFocusMode(false)} 
          />
        )}

        {pendingUndo && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between overflow-hidden relative border border-white/10">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                <span className="text-sm font-bold">Завдання завершене!</span>
              </div>
              <button 
                onClick={undoLastAction}
                className="text-xs font-black uppercase text-orange-400 hover:text-white"
              >
                Відмінити
              </button>
              <div className="absolute bottom-0 left-0 h-1 bg-orange-500 w-full animate-progress-fast"></div>
            </div>
          </div>
        )}

        {aiEnabled && !isAiOpen && (
          <button 
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white shadow-2xl shadow-orange-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group z-40"
          >
            <div className="absolute inset-0 rounded-2xl bg-orange-400 animate-ping opacity-20 pointer-events-none"></div>
            <i className="fa-solid fa-sparkles text-xl group-hover:rotate-12 transition-transform"></i>
          </button>
        )}
      </main>

      <div 
        className={`fixed top-0 right-0 h-screen bg-white/80 border-l border-slate-100 flex flex-col tiktok-blur shadow-[-20px_0_50px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out z-[100] ${
          isAiOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full invisible pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-heading font-black text-lg flex items-center gap-3 text-slate-900 whitespace-nowrap">
            <i className="fa-solid fa-sparkles text-orange-500"></i> Асистент
          </h3>
          <button 
            onClick={() => setIsAiOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="bg-orange-50 p-4 rounded-2xl rounded-tl-none border border-orange-100 text-sm font-medium leading-relaxed text-orange-800 shadow-sm animate-in slide-in-from-right-4">
            Привіт! Я твій стратегічний асистент. Увімкнути чи налаштувати мої функції можна в меню налаштувань. Чим можу допомогти зараз?
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Спитай що завгодно..." 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-5 pr-12 text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium"
            />
            <button className="absolute right-2 top-2 w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-fast { from { width: 100%; } to { width: 0%; } }
        .animate-progress-fast { animation: progress-fast 5s linear forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <MainLayout />
  </AppProvider>
);

export default App;
