
import React, { useState } from 'react';
import { Project, Task } from '../../types';

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
  onSelect: (id: string | null) => void;
  onStartCreation: (type: 'folder' | 'list', parentId: string) => void;
  onFinishCreation: () => void;
  onStartRename: (project: Project) => void;
  onDelete: (id: string) => void;
  onDeleteSection: (pId: string, sId: string) => void;
  onMoveNode: (sourceId: string, targetId: string | undefined) => void;
  onUpdateTask: (task: any) => void;
  setInputValue: (val: string) => void;
  handleRenameNode: (project: Project) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  allTasks: Task[];
  allProjects: Project[];
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({
  project, level, expandedFolders, selectedProjectId, editingNodeId, inputValue,
  creatingIn, onToggle, onSelect, onStartCreation, onFinishCreation, 
  onStartRename, onDelete, onMoveNode, onUpdateTask, setInputValue, 
  handleRenameNode, inputRef, allTasks, allProjects
}) => {
  const isFolder = project.type === 'folder';
  const isExpanded = expandedFolders.has(project.id);
  const isSelected = selectedProjectId === project.id;
  const isEditing = editingNodeId === project.id;
  const [isLocalDragOver, setIsLocalDragOver] = useState(false);

  const children = allProjects.filter(p => p.parentFolderId === project.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder) setIsLocalDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLocalDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceProjectId = e.dataTransfer.getData('projectId');

    if (taskId && !isFolder) {
      const t = allTasks.find(x => x.id === taskId);
      if (t) onUpdateTask({ ...t, projectId: project.id, projectSection: 'actions', isDeleted: false });
    } else if (sourceProjectId && isFolder && sourceProjectId !== project.id) {
      onMoveNode(sourceProjectId, project.id);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          e.dataTransfer.setData('projectId', project.id);
          e.currentTarget.style.opacity = '0.4';
        }}
        onDragEnd={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsLocalDragOver(false)}
        onDrop={handleDrop}
        onClick={() => isFolder ? onToggle(project.id) : onSelect(project.id)}
        className={`flex items-center py-1.5 px-3 cursor-pointer group transition-all border-l-2 relative ${
          isSelected
            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
            : isLocalDragOver
              ? 'bg-[var(--primary)]/5 border-dashed border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
              : 'border-transparent text-[var(--text-main)] hover:bg-black/5'
        }`}
        style={{ paddingLeft: `${level * 10 + 4}px` }}
      >
        {isFolder ? (
          <div className="w-3 flex justify-center shrink-0 mr-1 transition-transform duration-200">
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[7px] opacity-40`}></i>
          </div>
        ) : (
          <div className="w-3 mr-1 shrink-0" />
        )}
        
        <i className={`fa-solid ${isFolder ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-file-lines'} text-[11px] w-4 text-center shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] opacity-60'} mr-1`}></i>

        {isEditing ? (
          <input
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={() => handleRenameNode(project)}
            onKeyDown={e => e.key === 'Enter' && handleRenameNode(project)}
            className="flex-1 bg-white border border-[var(--primary)]/30 rounded px-1 text-[11px] font-bold h-6 outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`text-[11px] font-bold truncate flex-1 tracking-tight ${isFolder ? 'opacity-80' : ''}`}>{project.name}</span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          {isFolder && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onStartCreation('folder', project.id); }} className="w-5 h-5 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
              <button onClick={(e) => { e.stopPropagation(); onStartCreation('list', project.id); }} className="w-5 h-5 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Новий список"><i className="fa-solid fa-plus"></i></button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); onStartRename(project); }} className="w-5 h-5 hover:bg-black/10 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Перейменувати"><i className="fa-solid fa-pencil"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="w-5 h-5 hover:bg-rose-500/10 hover:text-rose-500 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Видалити"><i className="fa-solid fa-trash-can"></i></button>
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
              dragOverNodeId={null}
              onToggle={onToggle}
              onSelect={onSelect}
              onStartCreation={onStartCreation}
              onFinishCreation={onFinishCreation}
              onStartRename={onStartRename}
              onDelete={onDelete}
              onDeleteSection={() => {}}
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
            <div className="flex items-center py-1 px-3 border-l-2 border-[var(--primary)]/30 bg-[var(--primary)]/5" style={{ paddingLeft: `${(level + 1) * 10 + 4}px` }}>
              <div className="w-3 mr-1" />
              <i className={`fa-solid ${creatingIn.type === 'folder' ? 'fa-folder' : 'fa-file-lines'} text-[11px] w-4 text-center text-[var(--primary)]/50 mr-1`}></i>
              <input
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={onFinishCreation}
                onKeyDown={e => e.key === 'Enter' && onFinishCreation()}
                placeholder="Назва..."
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded px-2 text-[11px] font-bold h-6 outline-none shadow-sm"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorerNode;
