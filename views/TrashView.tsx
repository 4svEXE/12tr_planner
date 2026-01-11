
import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const TrashView: React.FC = () => {
  const { tasks, restoreTask, deleteTask } = useApp();
  
  const deletedTasks = useMemo(() => 
    tasks.filter(t => t.isDeleted === true),
  [tasks]);

  const handleEmptyTrash = () => {
    if (confirm('Ви дійсно хочете очистити корзину назавжди?')) {
      deletedTasks.forEach(t => deleteTask(t.id, true));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-main overflow-hidden">
      <header className="p-6 md:p-10 bg-card border-b border-theme flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <Typography variant="h1" className="text-2xl md:text-3xl">Корзина</Typography>
          <Typography variant="tiny" className="text-muted mt-1">Очищення простору та ресурсів</Typography>
        </div>
        {deletedTasks.length > 0 && (
          <Button variant="danger" icon="fa-trash-arrow-up" size="sm" onClick={handleEmptyTrash}>ОЧИСТИТИ ВСЕ</Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-3 pb-32">
          {deletedTasks.length > 0 ? deletedTasks.map(task => (
            <Card key={task.id} className="bg-card border-theme p-4 flex items-center justify-between group hover:shadow-md transition-all rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-main rounded-xl flex items-center justify-center text-muted">
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-black text-main">{task.title}</div>
                  <div className="text-[9px] font-black text-muted uppercase tracking-widest mt-0.5 opacity-60">
                    Видалено {new Date(task.createdAt).toLocaleDateString('uk-UA')}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => restoreTask(task.id)}
                  className="w-9 h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Відновити"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
                <button 
                  onClick={() => confirm('Видалити назавжди?') && deleteTask(task.id, true)}
                  className="w-9 h-9 rounded-xl bg-main text-muted hover:text-rose-500 flex items-center justify-center transition-all"
                  title="Видалити назавжди"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-10">
               <i className="fa-solid fa-trash-can text-9xl mb-8"></i>
               <Typography variant="h2" className="uppercase tracking-[0.2em]">Порожньо</Typography>
               <Typography variant="body" className="mt-2 text-xs font-bold">Ваш простір ідеально чистий</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashView;
