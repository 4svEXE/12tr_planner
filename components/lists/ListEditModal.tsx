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

const ICONS = [
  'fa-folder', 'fa-folder-open', 'fa-folder-tree', 'fa-box-archive', 'fa-briefcase',
  'fa-list-ul', 'fa-list-check', 'fa-rectangle-list', 'fa-table-list', 'fa-clipboard-list',
  'fa-star', 'fa-fire', 'fa-lightbulb', 'fa-calendar-days', 'fa-layer-group',
  'fa-user', 'fa-house', 'fa-cart-shopping', 'fa-gamepad', 'fa-apple-whole',
  'fa-rocket', 'fa-umbrella-beach', 'fa-palette', 'fa-book', 'fa-wrench',
  'fa-capsules', 'fa-peace', 'fa-earth-americas', 'fa-medal', 'fa-gem'
];
const COLORS = ['var(--primary)', '#10b981', '#6366f1', '#ec4899', '#facc15', '#f43f5e', '#a855f7', '#64748b'];

const ListEditModal: React.FC<ListEditModalProps> = ({ initialData, parentId, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'folder' | 'list'>(
    initialData?.type === 'folder' ? 'folder' : 'list'
  );

  const [icon, setIcon] = useState(() => {
    if (initialData?.description?.startsWith('ICON:')) return initialData.description.replace('ICON:', '');
    if (initialData?.description?.startsWith('EMOJI:')) return 'fa-folder'; // Fallback for old ones
    return initialData?.type === 'folder' ? 'fa-folder' : 'fa-rectangle-list';
  });

  const [color, setColor] = useState(initialData?.color || COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      color,
      description: `ICON:${icon}`,
      parentFolderId: parentId || initialData?.parentFolderId,
      sections: type === 'list' && (!initialData?.sections || initialData.sections.length === 0) ? [{ id: 'actions', title: 'Завдання' }] : initialData?.sections || []
    });
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Світліший Backdrop з м'яким розмиттям */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" onClick={onClose}></div>

      <Card className="w-full max-w-sm relative z-10 shadow-2xl p-5 md:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-in zoom-in-95 duration-200">
        <header className="flex justify-between items-center mb-5">
          <Typography variant="h2" className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
            {initialData?.id ? 'Налаштування' : 'Новий елемент'}
          </Typography>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] transition-all">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </header>

        <div className="space-y-5">
          {/* Перемикач типу (Тематичний) */}
          <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setType('list')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'list' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)] opacity-60'}`}
            >
              Список
            </button>
            <button
              onClick={() => setType('folder')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'folder' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-muted)] opacity-60'}`}
            >
              Папка
            </button>
          </div>

          {/* Основні дані: Іконка та Назва */}
          <div className="flex gap-4 items-end">
            <div className="relative group shrink-0">
              <button className="w-11 h-11 rounded-xl bg-[var(--bg-main)] border-2 border-[var(--border-color)] flex items-center justify-center text-lg hover:border-[var(--primary)] transition-all shadow-inner text-[var(--text-main)]">
                <i className={`fa-solid ${icon}`}></i>
              </button>
              <div className="absolute bottom-full left-0 mb-3 p-2 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-2xl z-20 grid grid-cols-6 gap-1 w-[220px] opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-all transform origin-bottom-left scale-90 group-focus-within:scale-100">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-main)] transition-all ${icon === i ? 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30 shadow-sm text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                    <i className={`fa-solid ${i} text-xs`}></i>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block ml-0.5 tracking-[0.1em] opacity-60">Назва</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введіть назву..."
                className="w-full h-10 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl px-4 text-sm font-bold outline-none focus:border-[var(--primary)] transition-all text-[var(--text-main)] shadow-inner"
              />
            </div>
          </div>

          {/* Вибір Кольору */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block ml-0.5 tracking-[0.1em] opacity-60">Колір акценту</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[var(--primary)] scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Дії */}
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] text-[var(--text-muted)] hover:bg-black/5 transition-all border border-[var(--border-color)]">Скасувати</button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-[2] py-3 bg-[var(--primary)] text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-[var(--primary)]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {initialData?.id ? 'Зберегти' : 'Створити'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ListEditModal;