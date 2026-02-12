import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const useResizer = (minWidth = 300, maxWidth = 1200) => {
  const { detailsWidth, setDetailsWidth } = useApp();
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
    
    const newWidth = window.innerWidth - e.clientX;
    const dynamicMax = window.innerWidth * 0.8; // Розширення до 80% екрану
    const dynamicMin = Math.max(minWidth, 200);

    if (newWidth >= dynamicMin && newWidth <= dynamicMax) {
      setDetailsWidth(newWidth);
    }
  }, [isResizing, setDetailsWidth, minWidth]);

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

  return { isResizing, startResizing, detailsWidth };
};