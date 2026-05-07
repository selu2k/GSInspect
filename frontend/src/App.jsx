import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import './index.css';
import LoginPage from './pages/LoginPage';
function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col p-6 overflow-hidden gap-4 min-w-0">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
