
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
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > minWidth && newWidth < maxWidth) {
      setDetailsWidth(newWidth);
    }
  }, [isResizing, setDetailsWidth, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return { isResizing, startResizing, detailsWidth };
};
