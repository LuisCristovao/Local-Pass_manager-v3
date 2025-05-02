// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter, Routes, Route } from 'react-router-dom'; // Add Routes and Route

import ManagePasswords from './assets/components/ManagePasswords.tsx'; // Import the new ManagePasswords component
import ImportEncrypted from './assets/components/ImportEncrypted.tsx'; // Import the new ImportEncrypted component
import ImportDecrypted from './assets/components/ImportDecrypted.tsx'; // Import the new ImportEncrypted component
import ExportDecrypted from './assets/components/exportDecrypt.tsx';


createRoot(document.getElementById('root')!).render(
  /*<StrictMode>*/
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/manage" element={<ManagePasswords />} />
        <Route path="/importE" element={<ImportEncrypted />} />
        <Route path="/importD" element={<ImportDecrypted />} />
        <Route path="/exportD" element={<ExportDecrypted />} />
      </Routes>
    </HashRouter>
  /*</StrictMode>,*/
);
