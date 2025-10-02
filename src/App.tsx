import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { BrandDashboard } from './components/Brand/BrandDashboard';
import { OperatorDashboard } from './components/Operator/OperatorDashboard';

function AppContent() {
  const { user, loading, isAdmin, isBrand, isOperator } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isBrand) {
    return <BrandDashboard />;
  }

  if (isOperator) {
    return <OperatorDashboard />;
  }

  return <div>Unauthorized</div>;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;