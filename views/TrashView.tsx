
import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const TrashView: React.FC = () => {
  const { tasks, restoreTask, deleteTask, people, restorePerson, deletePerson } = useApp();
  const [activeTab, setActiveTab] = useState<'tasks' | 'people'>('tasks');
  
  const deletedTasks = useMemo(() => 
    tasks.filter(t => t.isDeleted === true),
  [tasks]);

  const deletedPeople = useMemo(() => 
    (people || []).filter(p => p.isDeleted === true),
  [people]);

  const handleEmptyTrash = () => {
    if (confirm(`Ви дійсно хочете очистити ${activeTab === 'tasks' ? 'всі завдання' : 'всі контакти'} назавжди?`)) {
      if (activeTab === 'tasks') {
        deletedTasks.forEach(t => deleteTask(t.id, true));
      } else {
        deletedPeople.forEach(p => deletePerson(p.id, true));
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <header className="p-6 md:p-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div>
          <Typography variant="h1" className="text-2xl md:text-3xl font-black">Корзина</Typography>
          <Typography variant="tiny" className="text-[var(--text-muted)] mt-1 uppercase tracking-widest">Очищення простору та ресурсів</Typography>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
             <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
             >
                Квести ({deletedTasks.length})
             </button>
             <button 
                onClick={() => setActiveTab('people')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'people' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}
             >
                Люди ({deletedPeople.length})
             </button>
          </div>
          {(activeTab === 'tasks' ? deletedTasks.length : deletedPeople.length) > 0 && (
            <Button variant="danger" icon="fa-trash-arrow-up" size="sm" className="rounded-xl px-4 py-2 text-[9px]" onClick={handleEmptyTrash}>ОЧИСТИТИ ВСЕ</Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-3 pb-32">
          {activeTab === 'tasks' ? (
             deletedTasks.length > 0 ? deletedTasks.map(task => (
                <Card key={task.id} className="bg-[var(--bg-card)] border-[var(--border-color)] p-4 flex items-center justify-between group hover:shadow-md transition-all rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--bg-main)] rounded-xl flex items-center justify-center text-[var(--text-muted)] shadow-inner">
                      <i className="fa-solid fa-bolt text-sm"></i>
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{task.title}</div>
                      <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-60">
                        Видалено {new Date(task.createdAt).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => restoreTask(task.id)}
                      className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Відновити"
                    >
                      <i className="fa-solid fa-rotate-left"></i>
                    </button>
                    <button 
                      onClick={() => confirm('Видалити назавжди?') && deleteTask(task.id, true)}
                      className="w-9 h-9 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all"
                      title="Видалити назавжди"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </Card>
              )) : (
                <EmptyState icon="fa-bolt" title="Завдань немає" />
              )
          ) : (
             deletedPeople.length > 0 ? deletedPeople.map(person => (
                <Card key={person.id} className="bg-[var(--bg-card)] border-[var(--border-color)] p-4 flex items-center justify-between group hover:shadow-md transition-all rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--bg-main)] shadow-inner border border-[var(--border-color)]">
                      <img src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} className="w-full h-full object-cover grayscale opacity-60" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{person.name}</div>
                      <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-60">
                        {person.status} • HP {person.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => restorePerson(person.id)}
                      className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Відновити союзника"
                    >
                      <i className="fa-solid fa-user-plus text-xs"></i>
                    </button>
                    <button 
                      onClick={() => confirm(`Видалити ${person.name} назавжди? Дані про квести також зникнуть.`) && deletePerson(person.id, true)}
                      className="w-9 h-9 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all"
                      title="Видалити назавжди"
                    >
                      <i className="fa-solid fa-user-xmark text-xs"></i>
                    </button>
                  </div>
                </Card>
             )) : (
                <EmptyState icon="fa-user-ninja" title="Контактів немає" />
             )
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: string, title: string }> = ({ icon, title }) => (
    <div className="flex flex-col items-center justify-center py-32 text-center opacity-10 select-none pointer-events-none grayscale">
        <i className={`fa-solid ${icon} text-9xl mb-8`}></i>
        <Typography variant="h2" className="uppercase tracking-[0.2em]">{title}</Typography>
        <Typography variant="body" className="mt-2 text-xs font-bold uppercase">Ваш простір ідеально чистий</Typography>
    </div>
);

export default TrashView;
