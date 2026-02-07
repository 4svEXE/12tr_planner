<<<<<<< HEAD
=======

>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
import React from 'react';
import { Project, Task, TaskStatus } from '../../types';
import Typography from '../ui/Typography';

interface ExplorerNodeProps {
  project: Project;
  level: number;
  expandedFolders: Set<string>;
  selectedProjectId: string | null;
  editingNodeId: string | null;
  inputValue: string;
  creatingIn: { parentId: string | undefined; type: 'folder' | 'list' } | null;
  dragOverNodeId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onStartCreation: (type: 'folder' | 'list', parentId: string) => void;
  onFinishCreation: () => void;
  onStartRename: (project: Project) => void;
  onDelete: (id: string) => void;
<<<<<<< HEAD
  onDeleteSection: (pId: string, sId: string) => void;
=======
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
  onMoveNode: (sourceId: string, targetId: string | undefined) => void;
  onUpdateTask: (task: any) => void;
  setInputValue: (val: string) => void;
  handleRenameNode: (project: Project) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  allTasks: Task[];
  allProjects: Project[];
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({
<<<<<<< HEAD
  // Add missing onDeleteSection to the destructured props
  project, level, expandedFolders, selectedProjectId, editingNodeId, inputValue,
  creatingIn, dragOverNodeId, onToggle, onSelect, onStartCreation, onFinishCreation, 
  onStartRename, onDelete, onDeleteSection, onMoveNode, onUpdateTask, setInputValue, 
=======
  project, level, expandedFolders, selectedProjectId, editingNodeId, inputValue,
  creatingIn, dragOverNodeId, onToggle, onSelect, onStartCreation, onFinishCreation, 
  onStartRename, onDelete, onMoveNode, onUpdateTask, setInputValue, 
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
  handleRenameNode, inputRef, allTasks, allProjects
}) => {
  const isFolder = project.type === 'folder';
  const isExpanded = expandedFolders.has(project.id);
  const isSelected = selectedProjectId === project.id;
  const isEditing = editingNodeId === project.id;
  const isDragOver = dragOverNodeId === project.id;

  const children = allProjects.filter(p => p.parentFolderId === project.id);

  return (
    <div className="flex flex-col">
      <div
        draggable={!isEditing}
        onDragStart={(e) => e.dataTransfer.setData('projectId', project.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const taskId = e.dataTransfer.getData('taskId');
          const sourceProjectId = e.dataTransfer.getData('projectId');

          if (taskId && !isFolder) {
            const t = allTasks.find(x => x.id === taskId);
            if (t) onUpdateTask({ ...t, projectId: project.id, projectSection: 'actions', isDeleted: false });
          } else if (sourceProjectId && isFolder) {
            onMoveNode(sourceProjectId, project.id);
          }
        }}
        onClick={() => isFolder ? onToggle(project.id) : onSelect(project.id)}
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer group transition-all border-l-2 ${
          isSelected
            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
            : isDragOver
              ? 'bg-[var(--primary)]/5 border-dashed border-[var(--primary)]/50 text-[var(--text-main)]'
              : 'border-transparent text-[var(--text-main)] hover:bg-black/5'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
<<<<<<< HEAD
        {isFolder && (
          <div className="w-4 flex justify-center shrink-0">
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px] opacity-60`}></i>
          </div>
        )}
=======
        <div className="w-4 flex justify-center shrink-0">
          {isFolder && (
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[8px] opacity-60`}></i>
          )}
        </div>
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
        <i className={`fa-solid ${isFolder ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-file-lines'} text-[11px] w-4 text-center ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] opacity-70'}`}></i>

        {isEditing ? (
          <input
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={() => handleRenameNode(project)}
            onKeyDown={e => e.key === 'Enter' && handleRenameNode(project)}
            className="flex-1 bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded px-1 text-[11px] font-bold h-6 outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`text-[11px] font-bold truncate flex-1 uppercase tracking-tight ${isFolder ? 'opacity-80' : ''}`}>{project.name}</span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFolder && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onStartCreation('folder', project.id); }} className="w-6 h-6 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
              <button onClick={(e) => { e.stopPropagation(); onStartCreation('list', project.id); }} className="w-6 h-6 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Новий список"><i className="fa-solid fa-plus"></i></button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); onStartRename(project); }} className="w-6 h-6 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Перейменувати"><i className="fa-solid fa-pencil"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="w-6 h-6 hover:bg-rose-500/10 hover:text-rose-500 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Видалити"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          {children.map(child => (
            <ExplorerNode
              key={child.id}
              project={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedProjectId={selectedProjectId}
              editingNodeId={editingNodeId}
              inputValue={inputValue}
              creatingIn={creatingIn}
              dragOverNodeId={dragOverNodeId}
              onToggle={onToggle}
              onSelect={onSelect}
              onStartCreation={onStartCreation}
              onFinishCreation={onFinishCreation}
              onStartRename={onStartRename}
              onDelete={onDelete}
<<<<<<< HEAD
              onDeleteSection={onDeleteSection}
=======
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
              onMoveNode={onMoveNode}
              onUpdateTask={onUpdateTask}
              setInputValue={setInputValue}
              handleRenameNode={handleRenameNode}
              inputRef={inputRef}
              allTasks={allTasks}
              allProjects={allProjects}
            />
          ))}
          {creatingIn && creatingIn.parentId === project.id && (
            <div className="flex items-center gap-2 py-2 px-3 border-l-2 border-[var(--primary)]/30 bg-[var(--primary)]/5" style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}>
<<<<<<< HEAD
=======
              <div className="w-4 shrink-0" />
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
              <i className={`fa-solid ${creatingIn.type === 'folder' ? 'fa-folder' : 'fa-file-lines'} text-[11px] w-4 text-center text-[var(--primary)]/50`}></i>
              <input
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={onFinishCreation}
                onKeyDown={e => e.key === 'Enter' && onFinishCreation()}
                placeholder="Назва..."
<<<<<<< HEAD
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded px-2 text-[11px] font-bold h-6 outline-none shadow-sm"
=======
                className="flex-1 bg-[var(--bg-main)] border border-[var(--primary)]/50 rounded px-2 text-[11px] font-bold h-6 outline-none shadow-sm"
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

<<<<<<< HEAD
export default ExplorerNode;
=======
export default ExplorerNode;
>>>>>>> 3f8a69718735605e887c800b35006f280deffd60
