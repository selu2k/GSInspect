import React, { useState } from 'react';
import { Shield, Database, CheckSquare, UploadCloud, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManageDataPanel from '../components/admin/ManageDataPanel';
import VettePublishPage from './VettePublishPage';
import CSVUploadPage from './CSVUploadPage';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('crud');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'crud', label: 'Manage Data (CRUD)', icon: Database },
    { id: 'vette', label: 'Vette & Publish', icon: CheckSquare },
    { id: 'upload', label: 'CSV Upload & Link', icon: UploadCloud },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="bg-indigo-600 p-1.5 rounded-lg flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
            GSInspect <span className="text-indigo-600 font-normal">Admin</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs md:text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 px-2 md:px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Return
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible with menu toggle */}
        <aside className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col p-4 gap-1 flex-shrink-0 z-30 transition-transform duration-300 md:transition-none md:z-10`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Admin Backend
          </p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActivePage(id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activePage === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activePage === 'crud' && <ManageDataPanel />}
          {activePage === 'vette' && <VettePublishPage />}
          {activePage === 'upload' && <CSVUploadPage />}
        </main>
      </div>
    </div>
  );
}