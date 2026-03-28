import React, { useState } from 'react';
import { Shield, Database, CheckSquare, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VettePublishPage from './VettePublishPage';
import CSVUploadPage from './CSVUploadPage';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('vette');

  const navItems = [
    { id: 'crud', label: 'Manage Data (CRUD)', icon: Database },
    { id: 'vette', label: 'Vette & Publish', icon: CheckSquare },
    { id: 'upload', label: 'CSV Upload & Link', icon: UploadCloud },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            GSInspect <span className="text-indigo-600 font-normal">Admin</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Return to Dashboard
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 gap-1 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Admin Backend
          </p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activePage === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activePage === 'crud' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-lg">CRUD page coming soon...</p>
            </div>
          )}
          {activePage === 'vette' && <VettePublishPage />}
          {activePage === 'upload' && <CSVUploadPage />}
        </main>
      </div>
    </div>
  );
}