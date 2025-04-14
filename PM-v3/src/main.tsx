import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter, Routes, Route } from 'react-router-dom'; // Add Routes and Route

import ManagePasswords from './assets/components/ManagePasswords.tsx'; // Import the new ManagePasswords component


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/manage" element={<ManagePasswords />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
