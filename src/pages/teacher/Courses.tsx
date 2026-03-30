import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, Loader, ClipboardList, Calendar } from 'lucide-react';

interface Course { id: number; name: string; description: string; createdAt: string; }
interface Task { id: number; title: string; type: string; deadline: string; maxScore: number; }

const TeacherCourses: React.FC = () => {
//   const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<{ [key: number]: Task[] }>({});
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  const [courseName, setCourseName] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState('LAB');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskScore, setTaskScore] = useState(100);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const res = await api.get('/courses/my');
    setCourses(res.data);
  };

  const fetchTasks = async (courseId: number) => {
    const res = await api.get(`/tasks/course/${courseId}`);
    setTasks(prev => ({ ...prev, [courseId]: res.data }));
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/courses', { name: courseName, description: courseDesc });
      toast.success('Kurs yaratildi!');
      setShowCourseModal(false);
      setCourseName(''); setCourseDesc('');
      fetchCourses();
    } catch { toast.error('Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setLoading(true);
    try {
      await api.post('/tasks', {
        title: taskTitle, description: taskDesc,
        type: taskType, courseId: selectedCourse.id,
        deadline: taskDeadline || null, maxScore: taskScore,
      });
      toast.success('Topshiriq yaratildi!');
      setShowTaskModal(false);
      fetchTasks(selectedCourse.id);
    } catch { toast.error('Xato yuz berdi'); }
    finally { setLoading(false); }
  };

  const typeColors: Record<string, string> = {
    LAB: 'bg-blue-500/20 text-blue-400',
    EXAM: 'bg-red-500/20 text-red-400',
    CODE: 'bg-green-500/20 text-green-400',
    PRESENTATION: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Kurslar va Topshiriqlar</h1>
            <p className="text-slate-400 mt-1">Kurslaringizni va topshiriqlarni boshqaring</p>
          </div>
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition font-medium"
          >
            <Plus size={18} /> Kurs yaratish
          </button>
        </motion.div>

        {courses.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Hali kurs yo'q. Birinchi kursni yarating!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <BookOpen size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{course.name}</h3>
                      <p className="text-slate-400 text-sm">{course.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedCourse(course); setShowTaskModal(true); fetchTasks(course.id); }}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-sm transition"
                  >
                    <Plus size={16} /> Topshiriq
                  </button>
                </div>

                {/* Tasks */}
                <div
                  onClick={() => fetchTasks(course.id)}
                  className="cursor-pointer"
                >
                  {tasks[course.id] ? (
                    tasks[course.id].length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">Topshiriqlar yo'q</p>
                    ) : (
                      <div className="space-y-2">
                        {tasks[course.id].map(task => (
                          <div key={task.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ClipboardList size={16} className="text-slate-400" />
                              <span className="text-white text-sm font-medium">{task.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 text-xs">
                              {task.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              )}
                              <span>{task.maxScore} ball</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-indigo-400 text-sm text-center py-2 hover:underline">Topshiriqlarni ko'rish uchun bosing</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Course Modal */}
        <AnimatePresence>
          {showCourseModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Yangi kurs</h3>
                  <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={createCourse} className="space-y-4">
                  <input value={courseName} onChange={e => setCourseName(e.target.value)} required placeholder="Kurs nomi" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Tavsif" rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none" />
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                    {loading ? <Loader size={18} className="animate-spin" /> : 'Yaratish'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Task Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Yangi topshiriq — {selectedCourse?.name}</h3>
                  <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={createTask} className="space-y-4">
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Topshiriq nomi" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
                  <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Topshiriq tavsifi" rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none" />
                  <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition">
                    <option value="LAB">Laboratoriya ishi</option>
                    <option value="EXAM">Nazorat ishi</option>
                    <option value="CODE">Dasturlash</option>
                    <option value="PRESENTATION">Prezentatsiya</option>
                  </select>
                  <input type="datetime-local" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                  <input type="number" value={taskScore} onChange={e => setTaskScore(+e.target.value)} min={10} max={100} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                    {loading ? <Loader size={18} className="animate-spin" /> : 'Topshiriq yaratish'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TeacherCourses;