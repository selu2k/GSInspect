import { createContext, useContext } from 'react';

export const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const TAILWIND_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-yellow-500',
  'bg-indigo-500', 'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500',
  'bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-sky-500'
];

export const HEX_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f43f5e', '#eab308',
  '#6366f1', '#06b6d4', '#84cc16', '#d946ef',
  '#ef4444', '#f97316', '#22c55e', '#0ea5e9'
];
