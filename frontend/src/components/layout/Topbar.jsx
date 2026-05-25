import React, { useState } from 'react';
import { Activity, User, LogOut, LogIn, Settings, Menu, X } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuToggle, menuOpen = false }) {
  const { userRole, isAuthenticated, logout } = useAppContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-3 md:px-6 flex-shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex-shrink-0"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight block">GSInspect</span>
            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 inline-block">
              Ground Support
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-1 md:gap-2 hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          {isAuthenticated ? (
            <>
              <div className={`w-7 md:w-8 h-7 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0 ${userRole === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                {userRole === 'admin' ? 'AD' : 'US'}
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-700 hidden sm:inline whitespace-nowrap">
                {userRole === 'admin' ? 'Admin' : 'Eng'}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-4 md:w-5 h-4 md:h-5 text-slate-600" />
              <span className="text-xs md:text-sm font-medium text-slate-700 hidden sm:inline">Sign In</span>
            </>
          )}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-44 md:w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs md:text-sm">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                  className="w-full text-left px-3 md:px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 flex-shrink-0" /> Admin Panel
                </button>
                <div className="h-px bg-slate-200 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 md:px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" /> Log out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/admin/login'); }}
                  className="w-full text-left px-3 md:px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" /> Admin Login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
