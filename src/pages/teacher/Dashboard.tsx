import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, Users, ChevronRight, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course { id: number; name: string; description: string; teacherName: string; }
interface Task { id: number; title: string; type: string; courseId: number; }
interface SubmissionReport { submissionId: number; studentName: string; integrityScore: number; status: string; highRiskEvents: number; }

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400',
  EXAM: 'bg-red-500/20 text-red-400',
  CODE: 'bg-green-500/20 text-green-400',
  QUIZ: 'bg-amber-500/20 text-amber-400',
  ESSAY: 'bg-teal-500/20 text-teal-400',
  PRESENTATION: 'bg-purple-500/20 text-purple-400',
  FILE: 'bg-slate-500/20 text-slate-400',
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentReports] = useState<SubmissionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const coursesRes = await api.get('/courses/my');
        setCourses(coursesRes.data);
        const allTasks: Task[] = [];
        for (const course of coursesRes.data) {
          const tasksRes = await api.get(`/tasks/course/${course.id}`);
          allTasks.push(...tasksRes.data.map((t: Task) => ({ ...t, courseId: course.id })));
        }
        setTasks(allTasks);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const suspiciousCount = recentReports.filter(r => r.highRiskEvents > 0).length;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Xush kelibsiz, <span className="text-indigo-400">{user?.fullName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Bugungi ko'rinish</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Kurslarim', value: courses.length, icon: BookOpen, color: 'indigo' },
            { label: 'Topshiriqlar', value: tasks.length, icon: ClipboardList, color: 'blue' },
            { label: 'Shubhali', value: suspiciousCount, icon: AlertTriangle, color: 'red' },
            { label: 'Monitoring', value: courses.length, icon: Shield, color: 'green' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center mb-3`}>
                <s.icon size={20} className={`text-${s.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Mening kurslarim</h2>
            <button onClick={() => navigate('/teacher/courses')} className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
              Barchasi <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="text-slate-400 text-center py-8">Yuklanmoqda...</div>
          ) : courses.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hali kurs yaratilmagan</p>
              <button onClick={() => navigate('/teacher/courses')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm transition">
                Kurs yaratish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => {
                const courseTasks = tasks.filter(t => t.courseId === course.id);
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition group">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <BookOpen size={20} className="text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition truncate">{course.name}</h3>
                        <p className="text-slate-400 text-sm line-clamp-1">{course.description}</p>
                      </div>
                    </div>

                    {/* Task types summary */}
                    {courseTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Array.from(new Set(courseTasks.map(t => t.type))).map(type => (
                          <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${typeColors[type] || 'bg-slate-700 text-slate-300'}`}>{type}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <ClipboardList size={12} /> {courseTasks.length} topshiriq
                      </span>
                      <div className="flex-1" />
                      <button onClick={() => navigate(`/teacher/monitoring/${course.id}`)}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400 px-3 py-1.5 rounded-lg transition">
                        <Users size={12} /> Monitoring
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;