import React, { useState, useCallback, useEffect } from 'react';

export const useSidebarResizer = (minWidth = 200, maxWidth = 600, storageKey = '12tr_sidebar_width') => {
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved, 10) : 256;
    });
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        // Sidebar resizes from left to right usually, so width is e.clientX
        let newWidth = e.clientX;
        const dynamicMax = Math.min(maxWidth, window.innerWidth * 0.5);
        const dynamicMin = Math.max(minWidth, 200);

        if (newWidth >= dynamicMin && newWidth <= dynamicMax) {
            setSidebarWidth(newWidth);
            localStorage.setItem(storageKey, newWidth.toString());
        }
    }, [isResizing, minWidth, maxWidth, storageKey]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return { isResizing, startResizing, sidebarWidth };
};
