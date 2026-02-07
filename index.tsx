import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pastikan splash screen hilang setelah React dimuat sepenuhnya
// Menggunakan setTimeout kecil untuk memastikan browser sudah merender frame pertama
setTimeout(() => {
  if ((window as any).hideSplash) {
    (window as any).hideSplash();
  }
}, 100);