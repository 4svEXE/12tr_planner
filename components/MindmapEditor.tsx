import React, { useState, useEffect, useRef } from 'react';
import { Task, MindmapNode, MindmapEdge } from '../types';
import { useApp } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';

const MINDMAP_THEMES = {
    default: { bg: 'bg-slate-50', nodeBg: 'bg-white', nodeBorder: 'border-slate-200', text: 'text-slate-700', stroke: '#94a3b8', toolbarBg: 'bg-white/90', toolbarBorder: 'border-slate-200', toolbarText: 'text-slate-700', grid: 'rgba(0,0,0,0.05)' },
    dark: { bg: 'bg-slate-900', nodeBg: 'bg-slate-800', nodeBorder: 'border-slate-700', text: 'text-slate-200', stroke: '#475569', toolbarBg: 'bg-slate-800/90', toolbarBorder: 'border-slate-700', toolbarText: 'text-slate-200', grid: 'rgba(255,255,255,0.05)' },
    ocean: { bg: 'bg-cyan-50', nodeBg: 'bg-white', nodeBorder: 'border-cyan-200', text: 'text-cyan-900', stroke: '#22d3ee', toolbarBg: 'bg-white/90', toolbarBorder: 'border-cyan-200', toolbarText: 'text-cyan-900', grid: 'rgba(34,211,238,0.08)' },
    sunset: { bg: 'bg-[#ffedda]', nodeBg: 'bg-white', nodeBorder: 'border-orange-200', text: 'text-orange-900', stroke: '#fb923c', toolbarBg: 'bg-white/90', toolbarBorder: 'border-orange-200', toolbarText: 'text-orange-900', grid: 'rgba(251, 146, 60, 0.08)' },
    forest: { bg: 'bg-[#f1f8f1]', nodeBg: 'bg-white', nodeBorder: 'border-emerald-200', text: 'text-emerald-900', stroke: '#34d399', toolbarBg: 'bg-white/90', toolbarBorder: 'border-emerald-200', toolbarText: 'text-emerald-900', grid: 'rgba(52, 211, 153, 0.08)' }
} as const;

const GRID_SIZE = 40;
const NODE_COLORS = [
    { id: 'default', color: '' },
    { id: 'rose', color: 'bg-rose-100 border-rose-300 text-rose-900' },
    { id: 'amber', color: 'bg-amber-100 border-amber-300 text-amber-900' },
    { id: 'emerald', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    { id: 'blue', color: 'bg-blue-100 border-blue-300 text-blue-900' },
    { id: 'purple', color: 'bg-purple-100 border-purple-300 text-purple-900' }
];

const NODE_SHAPES = {
    rectangle: 'rounded-xl',
    ellipse: 'rounded-full',
    diamond: 'rounded-none'
};

interface MindmapEditorProps {
    task: Task;
}

const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

const MindmapEditor: React.FC<MindmapEditorProps> = ({ task }) => {
    const { updateTask } = useApp();

    const [nodes, setNodes] = useState<MindmapNode[]>(task.mindmapData?.nodes || [
        { id: 'root', text: task.title, x: 200, y: 200, width: 140, height: 60 }
    ]);
    const [edges, setEdges] = useState<MindmapEdge[]>(task.mindmapData?.edges || []);
    const [viewport, setViewport] = useState(task.mindmapData?.viewport || DEFAULT_VIEWPORT);

    // Interaction States
    const [isPanning, setIsPanning] = useState(false);
    const [dragNodeId, setDragNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [theme, setTheme] = useState<'default' | 'dark' | 'ocean' | 'sunset' | 'forest'>(task.mindmapData?.theme || 'default');
    const [drawEdgeStart, setDrawEdgeStart] = useState<string | null>(null);
    const [drawEdgeCurrentEnd, setDrawEdgeCurrentEnd] = useState<{ x: number, y: number } | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId?: string, canvasX: number, canvasY: number } | null>(null);
    const [clipboardNode, setClipboardNode] = useState<MindmapNode | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const panDistance = useRef(0);

    // Save debouncer (Only save when not actively interacting)
    useEffect(() => {
        if (isPanning || dragNodeId || drawEdgeStart) return;
        const handler = setTimeout(() => {
            // Sync nodes to checklist as requested
            const newChecklist = nodes.map(n => {
                const existing = task.checklist?.find(c => c.id === n.id);
                return {
                    id: n.id,
                    title: n.text || 'Без назви',
                    completed: existing ? existing.completed : false
                };
            });

            updateTask({
                ...task,
                checklist: newChecklist,
                mindmapData: { nodes, edges, viewport, theme }
            });
        }, 1000);
        return () => clearTimeout(handler);
    }, [nodes, edges, viewport, theme, isPanning, dragNodeId, drawEdgeStart]);

    // Track fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Transform screen coordinates to canvas coordinates
    const screenToCanvas = (clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - viewport.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.y) / viewport.zoom
        };
    };

    // Mouse Handlers for Container
    const handlePointerDown = (e: React.PointerEvent) => {
        // Clear selection and menu on background click
        setSelectedNodeId(null);
        setContextMenu(null);

        if (e.button === 0 && !e.shiftKey) { // LMB = Pan
            setIsPanning(true);
            panDistance.current = 0;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } else if (e.button === 2) { // RMB
            // Clearing already handled by clear above
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
            panDistance.current += Math.abs(e.movementX) + Math.abs(e.movementY);
            setViewport(v => ({ ...v, x: v.x + e.movementX, y: v.y + e.movementY }));
        } else if (dragNodeId) {
            const zoom = viewport.zoom;
            setNodes(ns => ns.map(n =>
                n.id === dragNodeId
                    ? { ...n, x: n.x + e.movementX / zoom, y: n.y + e.movementY / zoom }
                    : n
            ));
        } else if (drawEdgeStart) {
            setDrawEdgeCurrentEnd(screenToCanvas(e.clientX, e.clientY));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPanning(false);
        setDragNodeId(null);

        if (e.currentTarget instanceof HTMLElement && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        // Handle edge connection
        if (drawEdgeStart && drawEdgeCurrentEnd) {
            // Find if mouse is over another node
            const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
            const targetNodeElement = elementsUnderMouse.find(el => el.hasAttribute('data-node-id'));
            const targetNodeId = targetNodeElement?.getAttribute('data-node-id');

            if (targetNodeId && targetNodeId !== drawEdgeStart) {
                // Connect to existing node
                setEdges(es => [...es, {
                    id: 'edge_' + Math.random().toString(36).substring(2, 9),
                    sourceId: drawEdgeStart,
                    targetId: targetNodeId
                }]);
            } else if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
                // Connect to new node
                const newNodeId = 'node_' + Math.random().toString(36).substring(2, 9);
                const canvasPos = screenToCanvas(e.clientX, e.clientY);
                const newNode: MindmapNode = {
                    id: newNodeId,
                    text: 'Новий вузол',
                    x: canvasPos.x - 70,
                    y: canvasPos.y - 30,
                    width: 140,
                    height: 60
                };

                setNodes(ns => [...ns, newNode]);
                setEdges(es => [...es, {
                    id: 'edge_' + Math.random().toString(36).substring(2, 9),
                    sourceId: drawEdgeStart,
                    targetId: newNodeId
                }]);
            }
        }

        setDrawEdgeStart(null);
        setDrawEdgeCurrentEnd(null);
    };

    const handlePointerCancel = () => {
        setIsPanning(false);
        setDragNodeId(null);
        setDrawEdgeStart(null);
        setDrawEdgeCurrentEnd(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const zoomDelta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.max(0.2, Math.min(3, viewport.zoom * (1 + zoomDelta)));
        setViewport(v => ({ ...v, zoom: newZoom }));
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedNodeId) return;
            // Prevent if editing text
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteNode(selectedNodeId);
                setSelectedNodeId(null);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                quickAddChild(selectedNodeId);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                copyNode(selectedNodeId);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                const rect = containerRef.current?.getBoundingClientRect();
                const centerX = rect ? (rect.width / 2 - viewport.x) / viewport.zoom : 200;
                const centerY = rect ? (rect.height / 2 - viewport.y) / viewport.zoom : 200;
                pasteNode(centerX, centerY);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, nodes, edges, clipboardNode, viewport, containerRef]);

    // Node Handlers
    const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation();
        if (e.button === 2) { // Right Click
            setContextMenu(null);
            setSelectedNodeId(null);
            return;
        }
        setContextMenu(null);
        setSelectedNodeId(nodeId);
        if (e.button === 0) setDragNodeId(nodeId);
    };

    const handleDotPointerDown = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation();
        setDrawEdgeStart(nodeId);
        setDrawEdgeCurrentEnd(screenToCanvas(e.clientX, e.clientY));
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleNodePointerUp = (e: React.PointerEvent, targetNodeId: string) => {
        if (drawEdgeStart && drawEdgeStart !== targetNodeId) {
            // Connect to existing node
            setEdges(es => [...es, {
                id: 'edge_' + Math.random().toString(36).substring(2, 9),
                sourceId: drawEdgeStart,
                targetId: targetNodeId
            }]);
        }
    };

    const updateNodeText = (id: string, text: string) => {
        setNodes(ns => ns.map(n => n.id === id ? { ...n, text } : n));
    };

    const deleteNode = (id: string) => {
        setNodes(ns => ns.filter(n => n.id !== id));
        setEdges(es => es.filter(e => e.sourceId !== id && e.targetId !== id));
    };

    // Double click canvas to add node
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'svg') return;
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const newNodeId = 'node_' + Math.random().toString(36).substring(2, 9);
        setNodes(ns => [...ns, {
            id: newNodeId,
            text: 'Нова ідея',
            x: canvasPos.x - 70,
            y: canvasPos.y - 30,
            width: 140,
            height: 60
        }]);
    };

    const autoLayout = () => {
        const inDegrees: Record<string, number> = {};
        nodes.forEach(n => inDegrees[n.id] = 0);
        edges.forEach(e => {
            if (inDegrees[e.targetId] !== undefined) inDegrees[e.targetId]++;
        });

        const roots = nodes.filter(n => inDegrees[n.id] === 0);
        if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

        let currentY = 100;
        const newNodes = [...nodes];

        const layoutNode = (nodeId: string, depth: number) => {
            const nodeIdx = newNodes.findIndex(n => n.id === nodeId);
            if (nodeIdx === -1) return;

            newNodes[nodeIdx] = { ...newNodes[nodeIdx], x: depth * 220 + 200, y: currentY };

            const children = edges.filter(e => e.sourceId === nodeId).map(e => e.targetId);
            if (children.length > 0) {
                children.forEach(childId => {
                    layoutNode(childId, depth + 1);
                    currentY += 100;
                });
                const childNodes = children.map(cId => newNodes.find(n => n.id === cId)).filter(Boolean) as MindmapNode[];
                if (childNodes.length > 0) {
                    const minY = Math.min(...childNodes.map(c => c.y));
                    const maxY = Math.max(...childNodes.map(c => c.y));
                    newNodes[nodeIdx] = { ...newNodes[nodeIdx], y: (minY + maxY) / 2 };
                }
            } else {
                currentY += 100;
            }
        };

        roots.forEach(root => {
            layoutNode(root.id, 0);
            currentY += 50;
        });

        // Add history/animation delay
        setNodes(newNodes);
        setViewport({ x: 0, y: Math.min(0, -(roots[0]?.y || 0) + 200), zoom: 0.8 });
    };

    const updateSelectedNodeStyle = (updates: Partial<MindmapNode>) => {
        if (!selectedNodeId) return;
        setNodes(ns => ns.map(n => n.id === selectedNodeId ? { ...n, ...updates } : n));
    };

    const handleContextMenu = (e: React.MouseEvent, nodeId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (nodeId) {
            setSelectedNodeId(null); // Hide toolbar when RMB menu shows
        }

        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            nodeId,
            canvasX: canvasPos.x,
            canvasY: canvasPos.y
        });
    };

    const copyNode = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) setClipboardNode(node);
        setContextMenu(null);
    };

    const pasteNode = (canvasX: number, canvasY: number) => {
        if (!clipboardNode) {
            setContextMenu(null);
            return;
        }
        const newNodeId = 'node_' + Math.random().toString(36).substring(2, 9);
        setNodes(ns => [...ns, {
            ...clipboardNode,
            id: newNodeId,
            x: canvasX - clipboardNode.width / 2,
            y: canvasY - clipboardNode.height / 2
        }]);
        setContextMenu(null);
    };

    const quickAddChild = (parentId: string) => {
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;

        const newNodeId = 'node_' + Math.random().toString(36).substring(2, 9);
        const newNode: MindmapNode = {
            id: newNodeId,
            text: 'Нова ідея',
            x: parent.x + parent.width + 50,
            y: parent.y + parent.height / 2 - 30,
            width: 140,
            height: 60,
            color: parent.color,
            shape: parent.shape
        };

        setNodes(ns => [...ns, newNode]);
        setEdges(es => [...es, {
            id: 'edge_' + Math.random().toString(36).substring(2, 9),
            sourceId: parent.id,
            targetId: newNodeId
        }]);
        setSelectedNodeId(newNodeId);
        setContextMenu(null);
    };

    const toggleCollapse = (nodeId: string) => {
        setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, isCollapsed: !n.isCollapsed } : n));
    };

    const exportToPNG = async () => {
        if (!containerRef.current) return;
        try {
            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: currentTheme.bg,
                scale: 2
            });
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${task.title || 'mindmap'}.png`;
            link.href = url;
            link.click();
        } catch (e) {
            console.error("Export failed", e);
            alert("Помилка експорту");
        }
    };

    // SVG Edge Rendering helper
    const renderEdge = (source: MindmapNode, target: { x: number, y: number, width?: number, height?: number }, key: string) => {
        const startX = source.x + source.width / 2;
        const startY = source.y + source.height / 2;

        // Target can be either a node (with width/height) or mouse coordinates (just x,y)
        const tWidth = target.width || 0;
        const tHeight = target.height || 0;
        const targetX = target.width ? target.x + target.width / 2 : target.x;
        const targetY = target.height ? target.y + target.height / 2 : target.y;

        // Determine edge docking points to make lines connect to the closest bounding box side
        const dx = targetX - startX;
        const dy = targetY - startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        let finalStartX = startX;
        let finalStartY = startY;
        let finalEndX = targetX;
        let finalEndY = targetY;

        // More precise docking for rectangles
        if (absDx * source.height > absDy * source.width) {
            finalStartX = dx > 0 ? startX + source.width / 2 : startX - source.width / 2;
        } else {
            finalStartY = dy > 0 ? startY + source.height / 2 : startY - source.height / 2;
        }

        if (target.width && target.height) {
            if (absDx * target.height > absDy * target.width) {
                finalEndX = dx > 0 ? targetX - target.width / 2 : targetX + target.width / 2;
            } else {
                finalEndY = dy > 0 ? targetY - target.height / 2 : targetY + target.height / 2;
            }
        } else {
            finalEndX = target.x;
            finalEndY = target.y;
        }

        // If target has no width (mouse drawing), just use mouse pos
        if (!target.width) {
            finalEndX = target.x;
            finalEndY = target.y;
        }

        // Bezier curve control points
        const cp1x = absDx > absDy ? finalStartX + dx / 3 : finalStartX;
        const cp1y = absDx > absDy ? finalStartY : finalStartY + dy / 3;
        const cp2x = absDx > absDy ? finalEndX - dx / 3 : finalEndX;
        const cp2y = absDx > absDy ? finalEndY : finalEndY - dy / 3;

        return (
            <path
                key={key}
                d={`M ${finalStartX} ${finalStartY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${finalEndX} ${finalEndY}`}
                fill="none"
                stroke={MINDMAP_THEMES[theme].stroke}
                strokeWidth="3"
                strokeOpacity="0.4"
                markerEnd="url(#arrowhead)"
            />
        );
    };

    const currentTheme = MINDMAP_THEMES[theme];

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full flex flex-col items-stretch ${currentTheme.bg}`}
        >
            {/* Top Toolbar */}
            <div className={`flex items-center gap-4 px-4 py-2 border-b ${currentTheme.toolbarBg} ${currentTheme.toolbarBorder} shadow-sm z-20`}>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.toolbarText} mr-2`}>Тема:</span>
                    {(Object.keys(MINDMAP_THEMES) as Array<keyof typeof MINDMAP_THEMES>).map(t => (
                        <button key={t} onClick={() => setTheme(t)} className={`w-5 h-5 rounded-full border-2 ${theme === t ? 'border-primary' : 'border-transparent text-transparent hover:border-slate-300'} font-black flex items-center justify-center text-[10px] shadow-sm transition-all`} style={{ backgroundColor: t === 'dark' ? '#1e293b' : t === 'ocean' ? '#cffafe' : t === 'sunset' ? '#ffedd5' : t === 'forest' ? '#d1fae5' : '#f8fafc' }}>
                            {theme === t && <i className={`fa-solid fa-check ${t === 'dark' ? 'text-white' : 'text-slate-800'}`}></i>}
                        </button>
                    ))}
                </div>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700"></div>
                <button onClick={autoLayout} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black/5 flex items-center gap-2 transition-colors ${currentTheme.toolbarText}`}>
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Форматування
                </button>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700"></div>
                <button onClick={exportToPNG} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black/5 flex items-center gap-2 transition-colors ${currentTheme.toolbarText}`}>
                    <i className="fa-solid fa-download"></i> Експорт (PNG)
                </button>
                <div className="flex-1"></div>
                {selectedNodeId && !contextMenu && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.toolbarText} opacity-50`}>Стиль вузла:</span>
                        <div className="flex items-center gap-1">
                            {['rectangle', 'ellipse', 'diamond'].map(shape => (
                                <button key={shape} onClick={() => updateSelectedNodeStyle({ shape: shape as any })} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${nodes.find(n => n.id === selectedNodeId)?.shape === shape || (!nodes.find(n => n.id === selectedNodeId)?.shape && shape === 'rectangle') ? 'bg-primary/20 text-primary' : `${currentTheme.toolbarText} opacity-50 hover:bg-black/5 hover:opacity-100`}`}>
                                    <i className={`fa-solid ${shape === 'rectangle' ? 'fa-square' : shape === 'ellipse' ? 'fa-circle' : 'fa-play rotate-[-90deg]'}`}></i>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            {NODE_COLORS.map(colorOption => {
                                const isSelected = nodes.find(n => n.id === selectedNodeId)?.color === colorOption.color || (!nodes.find(n => n.id === selectedNodeId)?.color && colorOption.id === 'default');
                                return (
                                    <button key={colorOption.id} onClick={() => updateSelectedNodeStyle({ color: colorOption.color })} className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'border-primary' : 'border-slate-200'} flex items-center justify-center shadow-sm text-[8px] transition-all`} style={{ backgroundColor: colorOption.id === 'default' ? '#fff' : `var(--${colorOption.id}-100)` }}>
                                        {isSelected && <i className={`fa-solid fa-check text-opacity-80`}></i>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
                onContextMenu={(e) => handleContextMenu(e)}
                className={`relative flex-1 w-full overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
                style={{
                    touchAction: 'none',
                    backgroundImage: currentTheme.grid ? `radial-gradient(${currentTheme.grid} 2px, transparent 0)` : 'radial-gradient(rgba(0,0,0,0.1) 2px, transparent 0)',
                    backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                        transformOrigin: '0 0'
                    }}
                >
                    {(() => {
                        const getHiddenNodeIds = () => {
                            const hidden = new Set<string>();
                            const collapsedNodes = nodes.filter(n => n.isCollapsed).map(n => n.id);

                            const hideDescendants = (parentId: string) => {
                                const children = edges.filter(e => e.sourceId === parentId).map(e => e.targetId);
                                children.forEach(childId => {
                                    if (!hidden.has(childId)) {
                                        hidden.add(childId);
                                        hideDescendants(childId);
                                    }
                                });
                            };

                            collapsedNodes.forEach(hideDescendants);
                            return hidden;
                        };
                        const hiddenNodeIds = getHiddenNodeIds();
                        const visibleNodes = nodes.filter(n => !hiddenNodeIds.has(n.id));
                        const visibleEdges = edges.filter(e => !hiddenNodeIds.has(e.sourceId) && !hiddenNodeIds.has(e.targetId));

                        return (
                            <>
                                <svg className="absolute overflow-visible w-full h-full">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                            <polygon points="0 0, 6 3, 0 6" fill={currentTheme.stroke} opacity="0.6" />
                                        </marker>
                                    </defs>
                                    {visibleEdges.map(e => {
                                        const s = visibleNodes.find(n => n.id === e.sourceId);
                                        const t = visibleNodes.find(n => n.id === e.targetId);
                                        if (!s || !t) return null;
                                        return renderEdge(s, t, e.id);
                                    })}

                                    {drawEdgeStart && drawEdgeCurrentEnd && (() => {
                                        const s = nodes.find(n => n.id === drawEdgeStart);
                                        if (!s) return null;
                                        return renderEdge(s, drawEdgeCurrentEnd, 'drawing');
                                    })()}
                                </svg>

                                {/* HTML Layer for Nodes */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {visibleNodes.map(node => {
                                        const isSelected = selectedNodeId === node.id;
                                        const hasChildren = edges.some(e => e.sourceId === node.id);
                                        const childrenCount = edges.filter(e => e.sourceId === node.id).length;

                                        const defaultClasses = `${currentTheme.nodeBg} ${currentTheme.nodeBorder} ${currentTheme.text}`;
                                        const dynamicClasses = node.color ? node.color : defaultClasses;
                                        const shapeClasses = NODE_SHAPES[node.shape || 'rectangle'];

                                        return (
                                            <div
                                                key={node.id}
                                                data-node-id={node.id}
                                                onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                                                onPointerUp={(e) => handleNodePointerUp(e, node.id)}
                                                onContextMenu={(e) => handleContextMenu(e, node.id)}
                                                className={`absolute border-2 shadow-md group transition-shadow flex flex-col justify-center select-none pointer-events-auto ${dynamicClasses} ${shapeClasses} ${isSelected ? 'shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent' : 'hover:shadow-lg'}`}
                                                style={{
                                                    left: node.x,
                                                    top: node.y,
                                                    width: node.width,
                                                    height: node.height,
                                                    cursor: dragNodeId === node.id ? 'grabbing' : 'grab',
                                                    borderColor: dragNodeId === node.id ? 'var(--primary)' : undefined,
                                                    boxShadow: dragNodeId === node.id ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : undefined,
                                                    zIndex: isSelected || dragNodeId === node.id ? 10 : 1
                                                }}
                                            >
                                                <textarea
                                                    value={node.text}
                                                    onChange={e => updateNodeText(node.id, e.target.value)}
                                                    onPointerDown={e => e.stopPropagation()}
                                                    className={`w-full text-center text-[11px] font-black uppercase tracking-tight bg-transparent resize-none px-4 py-2 outline-none ${node.color ? 'text-inherit placeholder-black/30' : currentTheme.text}`}
                                                    placeholder="Введіть текст"
                                                    rows={2}
                                                    spellCheck="false"
                                                />

                                                {/* Delete Button */}
                                                {nodes.length > 1 && (
                                                    <button
                                                        onPointerDown={e => { e.stopPropagation(); deleteNode(node.id); }}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] z-30"
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                )}

                                                {/* Collapse Button */}
                                                {hasChildren && (
                                                    <button
                                                        onPointerDown={e => { e.stopPropagation(); toggleCollapse(node.id); }}
                                                        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 border-2 border-slate-200 rounded-full flex items-center justify-center transition-opacity text-[10px] font-black z-30 shadow-sm ${node.isCollapsed ? 'bg-indigo-500 text-white border-white opacity-100' : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600'}`}
                                                        title={node.isCollapsed ? `Розгорнути (${childrenCount})` : "Згорнути"}
                                                    >
                                                        {node.isCollapsed ? childrenCount : <i className="fa-solid fa-minus"></i>}
                                                    </button>
                                                )}

                                                {/* Quick Add Child Button (Floating) */}
                                                {isSelected && !node.isCollapsed && !contextMenu && (
                                                    <button
                                                        onPointerDown={e => { e.stopPropagation(); quickAddChild(node.id); }}
                                                        className="absolute -right-10 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 text-indigo-600 rounded-full shadow-md hover:bg-indigo-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        title="Додати пов'язаний блок (Tab)"
                                                    >
                                                        <i className="fa-solid fa-plus text-[10px]"></i>
                                                    </button>
                                                )}

                                                {/* 4-Sided Edge Connection Dots */}
                                                <div
                                                    className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md z-20"
                                                    style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
                                                    onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md z-20"
                                                    style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                                                    onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md z-20"
                                                    style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
                                                    onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md z-20"
                                                    style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                                                    onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Floating Toolbar / Tips */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                    <div className={`${currentTheme.toolbarBg} backdrop-blur border ${currentTheme.toolbarBorder} px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${currentTheme.toolbarText} shadow-sm pointer-events-auto`}>
                        1лкм: pan • 2лкм: new node • wheel: zoom
                    </div>
                    <div className="flex flex-col gap-2 pointer-events-auto">
                        <button onClick={() => setViewport(v => ({ ...v, zoom: v.zoom * 1.2 }))} className={`${currentTheme.toolbarBg} ${currentTheme.toolbarText} border ${currentTheme.toolbarBorder} w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-black/5`}>
                            <i className="fa-solid fa-plus text-[11px]"></i>
                        </button>
                        <button onClick={() => setViewport(v => ({ ...v, zoom: v.zoom / 1.2 }))} className={`${currentTheme.toolbarBg} ${currentTheme.toolbarText} border ${currentTheme.toolbarBorder} w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-black/5`}>
                            <i className="fa-solid fa-minus text-[11px]"></i>
                        </button>
                        <button
                            onPointerDown={(e) => { e.stopPropagation(); setViewport(DEFAULT_VIEWPORT); }}
                            className={`bg-primary text-white border-transparent w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-primary/90 mt-2`}
                            title="Скинути камеру"
                        >
                            <i className="fa-solid fa-crosshairs text-[11px]"></i>
                        </button>
                        <button
                            onPointerDown={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                            className={`${currentTheme.toolbarBg} ${currentTheme.toolbarText} border ${currentTheme.toolbarBorder} w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-black/5 mt-1`}
                            title={isFullscreen ? "Вийти з повноекранного режиму" : "На весь екран"}
                        >
                            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-[11px]`}></i>
                        </button>
                    </div>
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 w-48 text-[11px] font-bold text-slate-700 dark:text-slate-200 animate-in zoom-in-95 duration-200"
                        style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
                        onPointerDown={e => e.stopPropagation()}
                        onContextMenu={e => e.preventDefault()}
                    >
                        {contextMenu.nodeId ? (
                            <>
                                <button onClick={() => quickAddChild(contextMenu.nodeId!)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
                                    <i className="fa-solid fa-code-branch text-indigo-500 w-4 font-normal text-center"></i> Додати підвузол
                                </button>
                                <button onClick={() => copyNode(contextMenu.nodeId!)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
                                    <i className="fa-regular fa-copy opacity-60 w-4 font-normal text-center"></i> Копіювати
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                <button onClick={() => { deleteNode(contextMenu.nodeId!); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 flex items-center gap-3">
                                    <i className="fa-solid fa-trash-can w-4 font-normal text-center"></i> Видалити
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { handleDoubleClick({ clientX: contextMenu.x, clientY: contextMenu.y, target: containerRef.current } as any); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
                                    <i className="fa-solid fa-plus text-emerald-500 w-4 font-normal text-center"></i> Додати вузол тут
                                </button>
                                {clipboardNode && (
                                    <button onClick={() => pasteNode(contextMenu.canvasX, contextMenu.canvasY)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
                                        <i className="fa-regular fa-clipboard opacity-60 w-4 font-normal text-center"></i> Вставити ({clipboardNode.text.substring(0, 10)}...)
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MindmapEditor;
