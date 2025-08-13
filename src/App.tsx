import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DividerDashboard } from './pages/DividerDashboard';
import { SaleAgentDashboard } from './pages/SaleAgentDashboard';
import { AgentTaskDetail } from './pages/AgentTaskDetail';
import { DispatcherDashboard } from './pages/DispatcherDashboard';

const AppContent = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth(); // <-- Get isLoading state

  // If we are still checking for the token, show a loading screen.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" />;
    }
    switch (user.role) {
      case Role.Admin:
        return <Navigate to="/admin" />;
      case Role.ProjectDivider:
        return <Navigate to="/divider" />;
      case Role.SaleAgent:
        return <Navigate to="/sale-agent" />;
      case Role.Dispatcher:
        return <Navigate to="/dispatcher" />;
      default:
        // If role is unknown, log out and redirect to login
        logout();
        return <Navigate to="/login" />;
    }
  };

  return (
    <Router>
        {isAuthenticated && (
            <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <div className="font-bold text-xl">The One Services & Solution | Trucking Portal</div>
                <div>
                    {/* This now correctly attempts to display the user's name. */}
                    <span className="mr-4">Welcome, {user?.name} ({user?.role})</span>
                    <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Logout
                    </button>
                </div>
            </nav>
        )}
        <main>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={renderDashboard()} />

                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={[Role.Admin, Role.Owner]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/divider" element={
                    <ProtectedRoute allowedRoles={[Role.ProjectDivider]}>
                        <DividerDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/sale-agent" element={
                    <ProtectedRoute allowedRoles={[Role.SaleAgent]}>
                        <SaleAgentDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/task/:id" element={
                    <ProtectedRoute allowedRoles={[Role.SaleAgent]}>
                        <AgentTaskDetail />
                    </ProtectedRoute>
                } />
                <Route path="/dispatcher" element={
                    <ProtectedRoute allowedRoles={[Role.Dispatcher]}>
                        <DispatcherDashboard />
                    </ProtectedRoute>
                } />
                
                {/* A catch-all for any other route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </main>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
