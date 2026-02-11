import React, { useState } from 'react';
import { Project } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';

interface ListEditModalProps {
  initialData?: Partial<Project>;
  parentId?: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

const EMOJIS = ['📁', '📂', '📝', '✅', '⭐', '🔥', '💡', '📅', '👤', '🏠', '💼', '🛒', '🎮', '🍎', '🚀', '🏖️', '🎨', '📚', '🛠️', '💊', '🧘', '🌍'];
const COLORS = ['var(--primary)', '#10b981', '#6366f1', '#ec4899', '#facc15', '#f43f5e', '#a855f7', '#64748b'];

const ListEditModal: React.FC<ListEditModalProps> = ({ initialData, parentId, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'folder' | 'list'>(
    initialData?.type === 'folder' ? 'folder' : 'list'
  );
  const [emoji, setEmoji] = useState(initialData?.description && initialData.description.startsWith('EMOJI:') ? initialData.description.replace('EMOJI:', '') : (initialData?.type === 'folder' ? '📁' : '📝'));
  const [color, setColor] = useState(initialData?.color || COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      color,
      description: `EMOJI:${emoji}`,
      parentFolderId: parentId || initialData?.parentFolderId,
      sections: type === 'list' && (!initialData?.sections || initialData.sections.length === 0) ? [{ id: 'actions', title: 'Завдання' }] : initialData?.sections || []
    });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Світліший Backdrop з м'яким розмиттям */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose}></div>
      
      <Card className="w-full max-w-sm relative z-10 shadow-2xl p-6 md:p-8 rounded-[2.5rem] bg-card border-theme animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center mb-6">
          <Typography variant="h2" className="text-xl font-black uppercase tracking-tight text-main">
            {initialData?.id ? 'Налаштування' : 'Новий елемент'}
          </Typography>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-muted transition-all">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </header>

        <div className="space-y-6">
          {/* Перемикач типу (Тематичний) */}
          <div className="flex bg-input p-1 rounded-xl border border-theme">
            <button 
              onClick={() => setType('list')}
              className={`flex-1 py-2 rounded-[0.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted opacity-60'}`}
            >
              Список
            </button>
            <button 
              onClick={() => setType('folder')}
              className={`flex-1 py-2 rounded-[0.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'folder' ? 'bg-card text-primary shadow-sm' : 'text-muted opacity-60'}`}
            >
              Папка
            </button>
          </div>

          {/* Основні дані: Емодзі та Назва */}
          <div className="flex gap-4 items-end">
             <div className="relative group shrink-0">
                <button className="w-12 h-12 rounded-2xl bg-input border-2 border-theme flex items-center justify-center text-2xl hover:border-primary transition-all shadow-inner">
                  {emoji}
                </button>
                <div className="absolute bottom-full left-0 mb-3 p-2 bg-card shadow-2xl border border-theme rounded-[1.5rem] z-20 grid grid-cols-6 gap-1 w-[220px] opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-all transform origin-bottom-left scale-90 group-focus-within:scale-100">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setEmoji(e)} className={`w-8 h-8 flex items-center justify-center rounded-xl hover:bg-input transition-all ${emoji === e ? 'bg-primary/10 ring-1 ring-primary/30 shadow-sm' : ''}`}>
                      {e}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex-1">
                <label className="text-[9px] font-black uppercase text-muted mb-1.5 block ml-0.5 tracking-[0.1em] opacity-60">Назва</label>
                <input 
                  autoFocus 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Введіть назву..." 
                  className="w-full h-10 bg-input border-2 border-theme rounded-2xl px-4 text-sm font-bold outline-none focus:border-primary transition-all text-main shadow-inner" 
                />
             </div>
          </div>

          {/* Вибір Кольору */}
          <div className="space-y-2.5">
            <label className="text-[9px] font-black uppercase text-muted mb-1 block ml-0.5 tracking-[0.1em] opacity-60">Колір акценту</label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  onClick={() => setColor(c)} 
                  className={`w-7 h-7 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`} 
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Дії */}
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted hover:bg-black/5 transition-all border border-theme">Скасувати</button>
            <button 
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {initialData?.id ? 'Зберегти зміни' : 'Створити'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ListEditModal;