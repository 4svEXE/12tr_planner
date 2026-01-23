
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Inbox from './views/Inbox';
import Calendar from './views/Calendar';
import Hashtags from './views/Hashtags';
import HobbiesView from './views/HobbiesView';
import ProjectsView from './views/ProjectsView';
import HabitsView from './views/HabitsView';
import NotesView from './views/NotesView';
import DiaryView from './views/DiaryView';
import TrashView from './views/TrashView';
import PeopleView from './views/PeopleView';
import CharacterProfile from './views/CharacterProfile';
import SettingsView from './views/SettingsView';
import ShoppingView from './views/ShoppingView';
import PlannerView from './views/PlannerView';
import StrategyMap from './views/StrategyMap';
import DeepFocus from './views/DeepFocus';
import AiChat from './components/AiChat';
import AuthView from './views/AuthView';
import { TaskStatus } from './types';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, tasks, projects, aiEnabled, theme } = useApp();
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === todayTimestamp)).length,
    inbox: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && t.category !== 'note' && !t.projectId && !t.scheduledDate).length,
    next_actions: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.NEXT_ACTION).length,
    notes: tasks.filter(t => !t.isDeleted && t.category === 'note' && t.status !== TaskStatus.DONE).length,
    calendar: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate).length,
    planner: tasks.filter(t => !t.isDeleted && t.projectSection === 'planner' && t.status !== TaskStatus.DONE).length,
    projects: projects.filter(p => p.type === 'goal' && p.status === 'active').length,
    trash: tasks.filter(t => t.isDeleted).length
  }), [tasks, projects, todayTimestamp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': case 'today': return <Dashboard />;
      case 'planner': return <PlannerView />;
      case 'map': return <StrategyMap />;
      case 'inbox': return <Inbox />;
      case 'next_actions': return <Inbox showNextActions />;
      case 'diary': return <DiaryView />;
      case 'notes': return <NotesView />;
      case 'habits': return <HabitsView />;
      case 'people': return <PeopleView />;
      case 'hobbies': return <HobbiesView />;
      case 'shopping': return <ShoppingView />;
      case 'completed': return <Inbox showCompleted />;
      case 'calendar': return <Calendar />;
      case 'projects': return <ProjectsView />;
      case 'hashtags': return <Hashtags tasks={tasks.filter(t => !t.isDeleted)} />;
      case 'trash': return <TrashView />;
      case 'character': return <CharacterProfile />;
      case 'settings': return <SettingsView />;
      case 'focus': return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[var(--bg-main)]">
          <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center text-4xl mb-6"><i className="fa-solid fa-bullseye"></i></div>
          <h2 className="text-3xl font-black mb-4">Глибокий Фокус</h2>
          <button onClick={() => setShowFocusMode(true)} className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl">УВІЙТИ В ПОТІК</button>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}
        {showFocusMode && <DeepFocus taskTitle={tasks.find(t => !t.isDeleted)?.title || "Робота над проектом"} onExit={() => setShowFocusMode(false)} />}
        {aiEnabled && !isAiOpen && (
          <button onClick={() => setIsAiOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[150] hover:scale-110 active:scale-95 transition-all">
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </button>
        )}
      </main>
      <AiChat isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950">
       <i className="fa-solid fa-circle-notch animate-spin text-orange-500 text-2xl"></i>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <AppProvider userId={user.uid}>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
