import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('p72-toast', {
      detail: { id: Date.now(), msg: 'UPDATE AVAILABLE — RELOAD', tone: 'info', ms: 4000 }
    }));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('p72-toast', {
      detail: { id: Date.now(), msg: 'OFFLINE READY', tone: 'ok', ms: 2000 }
    }));
  }
});
