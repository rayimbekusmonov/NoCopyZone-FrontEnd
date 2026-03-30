import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { BookOpen, Users, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: number;
  name: string;
  description: string;
  teacherName: string;
  createdAt: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/my').then(res => {
      setCourses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Jami kurslar', value: courses.length, icon: BookOpen, color: 'indigo' },
    { label: 'Faol talabalar', value: '—', icon: Users, color: 'green' },
    { label: 'Shubhali harakatlar', value: '—', icon: AlertTriangle, color: 'red' },
    { label: 'O\'rtacha ball', value: '—', icon: TrendingUp, color: 'amber' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">
            Xush kelibsiz, <span className="text-indigo-400">{user?.fullName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Bugungi akademik nazorat holati</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                <stat.icon size={20} className={`text-${stat.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Mening kurslarim</h2>
            <button
              onClick={() => navigate('/teacher/courses')}
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
            >
              Barchasi <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
          ) : courses.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hali kurs yaratilmagan</p>
              <button
                onClick={() => navigate('/teacher/courses')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm transition"
              >
                Kurs yaratish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/teacher/monitoring/${course.id}`)}
                  className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                    <BookOpen size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{course.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-indigo-400 text-sm">
                    <span>Monitoringni ko'rish</span>
                    <ChevronRight size={14} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default TeacherDashboard;