import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Grades } from './pages/Grades';
import { Files } from './pages/Files';
import { FacultyUpload } from './pages/FacultyUpload';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAlerts } from './pages/AdminAlerts';
import { AdminLogs } from './pages/AdminLogs';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'faculty') {
    return <Navigate to="/upload-results" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student & Faculty Common Portal Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin']} />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/files" element={<Files />} />
              </Route>
            </Route>

            {/* Faculty & Admin Result Upload Route */}
            <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
              <Route element={<Layout />}>
                <Route path="/upload-results" element={<FacultyUpload />} />
              </Route>
            </Route>

            {/* Admin & IDS Security Operations Center Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/alerts" element={<AdminAlerts />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
              </Route>
            </Route>

            {/* Root & Catch-all Fallback */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
