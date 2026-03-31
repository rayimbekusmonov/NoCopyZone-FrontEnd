import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherCourses from './pages/teacher/Courses';
import CourseDetail from './pages/teacher/CourseDetail';
import TeacherMonitoring from './pages/teacher/Monitoring';
import TeacherStatistics from './pages/teacher/Statistics';

import StudentDashboard from './pages/student/Dashboard';
import CoursePage from './pages/student/CoursePage';
import TaskPage from './pages/student/TaskPage';
import Progress from './pages/student/Progress';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const getHome = () => {
    if (!user) return '/login';
    if (user.role === 'ROLE_ADMIN') return '/admin';
    if (user.role === 'ROLE_TEACHER') return '/teacher';
    return '/student';
  };

  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={getHome()} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={getHome()} />} />

      {/* Shared */}
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin"       element={<PrivateRoute roles={['ROLE_ADMIN']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['ROLE_ADMIN']}><AdminUsers /></PrivateRoute>} />

      {/* Teacher */}
      <Route path="/teacher"                    element={<PrivateRoute roles={['ROLE_TEACHER','ROLE_ADMIN']}><TeacherDashboard /></PrivateRoute>} />
      <Route path="/teacher/courses"            element={<PrivateRoute roles={['ROLE_TEACHER','ROLE_ADMIN']}><TeacherCourses /></PrivateRoute>} />
      <Route path="/teacher/courses/:courseId"  element={<PrivateRoute roles={['ROLE_TEACHER','ROLE_ADMIN']}><CourseDetail /></PrivateRoute>} />
      <Route path="/teacher/monitoring/:courseId" element={<PrivateRoute roles={['ROLE_TEACHER','ROLE_ADMIN']}><TeacherMonitoring /></PrivateRoute>} />
      <Route path="/teacher/statistics"         element={<PrivateRoute roles={['ROLE_TEACHER','ROLE_ADMIN']}><TeacherStatistics /></PrivateRoute>} />

      {/* Student */}
      <Route path="/student"                    element={<PrivateRoute roles={['ROLE_STUDENT']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/course/:courseId"   element={<PrivateRoute roles={['ROLE_STUDENT']}><CoursePage /></PrivateRoute>} />
      <Route path="/student/task/:taskId"       element={<PrivateRoute roles={['ROLE_STUDENT']}><TaskPage /></PrivateRoute>} />
      <Route path="/student/progress"           element={<PrivateRoute roles={['ROLE_STUDENT']}><Progress /></PrivateRoute>} />

      <Route path="/"  element={<Navigate to={getHome()} />} />
      <Route path="*"  element={<Navigate to={getHome()} />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" theme="dark" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;