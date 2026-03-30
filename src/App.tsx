import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherMonitoring from './pages/teacher/Monitoring';
import TeacherCourses from './pages/teacher/Courses';
import StudentDashboard from './pages/student/Dashboard';
import TaskPage from './pages/student/TaskPage';

const PrivateRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'ROLE_TEACHER' ? '/teacher' : '/student'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'ROLE_TEACHER' ? '/teacher' : '/student'} />} />

      <Route path="/teacher" element={<PrivateRoute role="ROLE_TEACHER"><TeacherDashboard /></PrivateRoute>} />
      <Route path="/teacher/monitoring/:courseId" element={<PrivateRoute role="ROLE_TEACHER"><TeacherMonitoring /></PrivateRoute>} />
      <Route path="/teacher/courses" element={<PrivateRoute role="ROLE_TEACHER"><TeacherCourses /></PrivateRoute>} />

      <Route path="/student" element={<PrivateRoute role="ROLE_STUDENT"><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/task/:taskId" element={<PrivateRoute role="ROLE_STUDENT"><TaskPage /></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          theme="dark"
          autoClose={3000}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;