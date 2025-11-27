import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';   // ← This must be App, not EATFORCE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);