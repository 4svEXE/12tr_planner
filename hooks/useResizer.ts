
import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const useResizer = (minWidth = 300, maxWidth = 800) => {
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
    
    // Розраховуємо ширину як відстань від правого краю вікна до курсора
    const newWidth = window.innerWidth - e.clientX;
    
    // Обмежуємо ширину в межах 20% - 70% екрана для кращого UX
    const dynamicMax = Math.min(maxWidth, window.innerWidth * 0.7);
    const dynamicMin = Math.max(minWidth, window.innerWidth * 0.2);

    if (newWidth >= dynamicMin && newWidth <= dynamicMax) {
      setDetailsWidth(newWidth);
    }
  }, [isResizing, setDetailsWidth, minWidth, maxWidth]);

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
