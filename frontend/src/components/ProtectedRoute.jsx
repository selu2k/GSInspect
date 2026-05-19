import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
