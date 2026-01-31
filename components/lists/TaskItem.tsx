
import React from 'react';
import { Task, TaskStatus } from '../../types';
import Card from '../ui/Card';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isEditing: boolean;
  inputValue: string;
  onSelect: (id: string) => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (id: string) => void;
  onInputChange: (val: string) => void;
  onFinishEdit: (task: Task) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task, isSelected, isEditing, inputValue, onSelect, onToggleStatus, onDelete, onInputChange, onFinishEdit, inputRef
}) => {
  const isDone = task.status === TaskStatus.DONE;

  return (
    <Card
      padding="none"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
      onClick={() => !isEditing && onSelect(task.id)}
      className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 hover:border-[var(--primary)]/30 transition-all cursor-pointer border rounded group shadow-sm bg-[var(--bg-card)] ${
        isSelected ? 'ring-2 ring-[var(--primary)]/20 border-[var(--primary)]' : 'border-[var(--border-color)]'
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] group-hover:border-[var(--primary)]'
        }`}
      >
        {isDone && <i className="fa-solid fa-check text-[8px]"></i>}
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          autoFocus
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onBlur={() => onFinishEdit(task)}
          onKeyDown={e => e.key === 'Enter' && onFinishEdit(task)}
          onClick={e => e.stopPropagation()}
          placeholder="Назва завдання..."
          className="flex-1 bg-transparent border-none p-0 text-[12px] md:text-[13px] font-bold focus:ring-0 outline-none text-[var(--text-main)]"
        />
      ) : (
        <span className={`text-[12px] md:text-[13px] font-bold flex-1 truncate ${isDone ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'}`}>
          {task.title}
        </span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-500 transition-all p-1"
      >
        <i className="fa-solid fa-trash-can text-[10px]"></i>
      </button>
    </Card>
  );
};

export default TaskItem;
