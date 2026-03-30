import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, ChevronRight, BookOpen } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  courseName: string;
  deadline: string;
  maxScore: number;
}

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400',
  EXAM: 'bg-red-500/20 text-red-400',
  CODE: 'bg-green-500/20 text-green-400',
  PRESENTATION: 'bg-purple-500/20 text-purple-400',
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await api.get('/courses');
        setCourses(coursesRes.data);
        const allTasks: Task[] = [];
        for (const course of coursesRes.data) {
          const tasksRes = await api.get(`/tasks/course/${course.id}`);
          allTasks.push(...tasksRes.data);
        }
        setTasks(allTasks);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Salom, <span className="text-indigo-400">{user?.fullName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Topshiriqlaringiz va kurslaringiz</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
              <BookOpen size={20} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{courses.length}</div>
            <div className="text-slate-400 text-sm">Kurslar</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
              <ClipboardList size={20} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{tasks.length}</div>
            <div className="text-slate-400 text-sm">Topshiriqlar</div>
          </motion.div>
        </div>

        {/* Tasks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold text-white mb-4">Barcha topshiriqlar</h2>
          {loading ? (
            <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Hozircha topshiriqlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/student/task/${task.id}`)}
                  className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <ClipboardList size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{task.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-slate-400 text-sm">{task.courseName}</span>
                          {task.deadline && (
                            <span className="flex items-center gap-1 text-slate-500 text-xs">
                              <Calendar size={11} />
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">{task.maxScore} ball</span>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition" />
                    </div>
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

export default StudentDashboard;