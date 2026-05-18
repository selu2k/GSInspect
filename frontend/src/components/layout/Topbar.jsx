import React, { useState } from 'react';
import { Activity, User, LogOut, LogIn, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContextCore';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { userRole, isAuthenticated, logout } = useAppContext();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">GSInspect</span>
        <span className="ml-4 text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">
          Ground Support Database
        </span>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          {isAuthenticated ? (
            <>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${userRole === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                {userRole === 'admin' ? 'AD' : 'US'}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {userRole === 'admin' ? 'Admin User' : 'Engineer'}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Sign In</span>
            </>
          )}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Admin Panel
                </button>
                {/* <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <User className="w-4 h-4" /> Profile
                </button> */}
                <div className="h-px bg-slate-200 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/admin/login'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Admin Login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
