
import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="p-8 bg-white border-b border-slate-100 flex justify-between items-end">
        <div>
          <Typography variant="caption" className="text-rose-500 mb-1">Очищення простору</Typography>
          <Typography variant="h1" className="text-slate-900">Корзина</Typography>
        </div>
        {deletedTasks.length > 0 && (
          <Button variant="danger" icon="fa-trash-arrow-up" size="sm" onClick={handleEmptyTrash}>ОЧИСТИТИ ВСЕ</Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-4xl mx-auto space-y-4 pb-20">
          {deletedTasks.length > 0 ? deletedTasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800">{task.title}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Видалено {new Date(task.createdAt).toLocaleDateString('uk-UA')}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => restoreTask(task.id)}
                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all"
                  title="Відновити"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
                <button 
                  onClick={() => deleteTask(task.id, true)}
                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all"
                  title="Видалити назавжди"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
               <i className="fa-solid fa-trash-can text-8xl mb-8"></i>
               <Typography variant="h2">Корзина порожня</Typography>
               <Typography variant="body" className="mt-4">Ваш простір ідеально чистий.</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashView;
