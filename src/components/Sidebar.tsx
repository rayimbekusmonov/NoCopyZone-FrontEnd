import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, BookOpen,
  LogOut, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  const teacherLinks = [
    { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/teacher/courses', icon: BookOpen, label: 'Kurslar' },
  ];

  const studentLinks = [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield size={22} className="text-indigo-400" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">NoCopyZone</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {isTeacher ? 'O\'qituvchi' : 'Talaba'}
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
            {isTeacher
              ? <BookOpen size={16} className="text-indigo-400" />
              : <GraduationCap size={16} className="text-indigo-400" />
            }
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 mt-2">
        <div className="space-y-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition w-full text-sm font-medium"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;