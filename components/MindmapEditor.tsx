import React, { useState, useEffect, useRef } from 'react';
import { Task, MindmapNode, MindmapEdge } from '../types';
import { useApp } from '../contexts/AppContext';

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
    const [drawEdgeStart, setDrawEdgeStart] = useState<string | null>(null);
    const [drawEdgeCurrentEnd, setDrawEdgeCurrentEnd] = useState<{ x: number, y: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Save debouncer
    useEffect(() => {
        const handler = setTimeout(() => {
            updateTask({
                ...task,
                mindmapData: { nodes, edges, viewport }
            });
        }, 1000);
        return () => clearTimeout(handler);
    }, [nodes, edges, viewport]);

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
        if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'svg') return;

        if (e.button === 0 && !e.shiftKey) { // Left click on empty space = pan
            setIsPanning(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) {
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
        if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }

        // Finished drawing an edge to empty space -> create new node
        if (drawEdgeStart && drawEdgeCurrentEnd && (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg')) {
            const newNodeId = 'node_' + Math.random().toString(36).substring(2, 9);
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            const newNode: MindmapNode = {
                id: newNodeId,
                text: 'Новий вузол',
                x: canvasPos.x - 70, // center offset
                y: canvasPos.y - 30, // center offset
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

        setDrawEdgeStart(null);
        setDrawEdgeCurrentEnd(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const zoomDelta = -e.deltaY * zoomSensitivity;
            const newZoom = Math.max(0.2, Math.min(3, viewport.zoom * (1 + zoomDelta)));
            setViewport(v => ({ ...v, zoom: newZoom }));
        } else {
            // Regular scroll maps to pan when not holding ctrl
            setViewport(v => ({
                ...v,
                x: v.x - e.deltaX,
                y: v.y - e.deltaY
            }));
        }
    };

    // Node Handlers
    const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
        e.stopPropagation();
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

    // SVG Edge Rendering helper
    const renderEdge = (source: MindmapNode, target: { x: number, y: number, width?: number, height?: number }, key: string) => {
        const startX = source.x + source.width / 2;
        const startY = source.y + source.height / 2;
        const endX = target.width ? target.x + target.width / 2 : target.x;
        const endY = target.height ? target.y + target.height / 2 : target.y;

        // Bezier curve control points
        const cp1x = startX;
        const cp1y = startY + (endY - startY) / 2;
        const cp2x = endX;
        const cp2y = endY - (endY - startY) / 2;

        return (
            <path
                key={key}
                d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeOpacity="0.4"
                markerEnd="url(#arrowhead)"
            />
        );
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            className={`relative w-full h-full overflow-hidden bg-slate-50 border border-[var(--border-color)] rounded-xl shadow-inner ${isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }} // Crucial for preventing mobile scroll while dragging
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* SVG Layer for Edges */}
                <svg className="absolute overflow-visible w-full h-full">
                    <defs>
                        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="var(--primary)" opacity="0.6" />
                        </marker>
                    </defs>
                    {edges.map(e => {
                        const s = nodes.find(n => n.id === e.sourceId);
                        const t = nodes.find(n => n.id === e.targetId);
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
                <div className="absolute inset-0 pointer-events-auto">
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                            onPointerUp={(e) => handleNodePointerUp(e, node.id)}
                            className="absolute bg-white border-2 border-slate-200 rounded-xl shadow-md group transition-shadow hover:shadow-lg flex flex-col justify-center select-none"
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height,
                                cursor: dragNodeId === node.id ? 'grabbing' : 'grab',
                                borderColor: dragNodeId === node.id ? 'var(--primary)' : undefined,
                                boxShadow: dragNodeId === node.id ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : undefined,
                                zIndex: dragNodeId === node.id ? 10 : 1
                            }}
                        >
                            <textarea
                                value={node.text}
                                onChange={e => updateNodeText(node.id, e.target.value)}
                                onPointerDown={e => e.stopPropagation()} // Let user select text
                                className="w-full text-center text-[11px] font-black uppercase tracking-tight bg-transparent resize-none p-2 outline-none text-slate-700"
                                rows={2}
                                spellCheck="false"
                            />

                            {/* Delete Button */}
                            {nodes.length > 1 && (
                                <button
                                    onPointerDown={e => { e.stopPropagation(); deleteNode(node.id); }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}

                            {/* Edge Connection Dots */}
                            <div
                                className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md"
                                style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                                onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                            />
                            <div
                                className="absolute w-3 h-3 bg-indigo-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair hover:scale-150 shadow-md"
                                style={{ left: '50%', bottom: -6, transform: 'translateX(-50%)' }}
                                onPointerDown={(e) => handleDotPointerDown(e, node.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Toolbar / Tips */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-white/80 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm pointer-events-auto">
                    pan: пробіл/лкм • zoom: ctrl+wheel • add: подвійний клік
                </div>
                <button
                    onPointerDown={(e) => { e.stopPropagation(); setViewport(DEFAULT_VIEWPORT); }}
                    className="bg-white text-indigo-600 border border-indigo-100 w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-indigo-50 pointer-events-auto"
                    title="Скинути камеру"
                >
                    <i className="fa-solid fa-compress text-[11px]"></i>
                </button>
            </div>
        </div>
    );
};

export default MindmapEditor;
