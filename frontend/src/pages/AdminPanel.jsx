import React, { useState } from 'react';
import { Shield, Database, CheckSquare, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ManageDataPanel from '../components/admin/ManageDataPanel';
import UploadPanel from '../components/admin/UploadPanel';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage');

  const navItems = [
    { id: 'manage', label: 'Manage Data (CRUD)', icon: Database },
    { id: 'vette', label: 'Vette & Publish', icon: CheckSquare },
    { id: 'upload', label: 'CSV Upload & Link', icon: UploadCloud },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-400 font-bold">GS</span>Inspect Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                activeTab === id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={() => navigate('/dashboard')}
            className="w-full text-sm text-slate-400 hover:text-white transition-colors text-left px-2">
            ← Return to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'manage' && <ManageDataPanel />}
        {activeTab === 'vette' && <UploadPanel />}
        {activeTab === 'upload' && <UploadPanel />}
      </div>
    </div>
  );
}