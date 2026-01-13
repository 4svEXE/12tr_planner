
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA with correct scope handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Використовуємо ./sw.js для відносної реєстрації
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
