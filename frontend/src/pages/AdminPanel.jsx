import React, { useState } from 'react';
import { Database, CheckSquare, UploadCloud, Menu, X } from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import ManageDataPanel from '../components/admin/ManageDataPanel';
import VettePublishPage from './VettePublishPage';
import CSVUploadPage from './CSVUploadPage';

export default function AdminPanel() {
  const [activePage, setActivePage] = useState('crud');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'crud', label: 'Manage Data (CRUD)', icon: Database },
    { id: 'vette', label: 'Vette & Publish', icon: CheckSquare },
    { id: 'upload', label: 'CSV Upload & Link', icon: UploadCloud },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Topbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} menuOpen={mobileMenuOpen} isAdminPage={true} />

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