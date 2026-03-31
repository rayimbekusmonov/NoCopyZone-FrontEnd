import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Calendar, ChevronRight, BookOpen, Plus, X, Check, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

interface Course { id: number; name: string; description: string; teacherName: string; }
interface Task { id: number; title: string; description: string; type: string; courseName: string; deadline: string; maxScore: number; }
interface Submission { id: number; taskId: number; taskTitle: string; status: string; integrityScore: number; score: number; }
interface Enrollment { id: number; courseId: number; courseName: string; teacherName: string; }

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400',
  EXAM: 'bg-red-500/20 text-red-400',
  CODE: 'bg-green-500/20 text-green-400',
  PRESENTATION: 'bg-purple-500/20 text-purple-400',
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  SUBMITTED: 'bg-blue-500/20 text-blue-400',
  GRADED: 'bg-green-500/20 text-green-400',
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [enrollRes, subRes] = await Promise.all([
        api.get('/enrollments/my'),
        api.get('/submissions/my'),
      ]);
      setEnrollments(enrollRes.data);
      setSubmissions(subRes.data);

      const allTasks: Task[] = [];
      for (const enrollment of enrollRes.data) {
        const tasksRes = await api.get(`/tasks/course/${enrollment.courseId}`);
        allTasks.push(...tasksRes.data);
      }
      setTasks(allTasks);
    } finally {
      setLoading(false);
    }
  };

  const openEnrollModal = async () => {
    const res = await api.get('/courses');
    setAllCourses(res.data);
    setShowEnrollModal(true);
  };

  const enroll = async (courseId: number) => {
    setEnrollLoading(courseId);
    try {
      await api.post(`/enrollments/enroll/${courseId}`);
      toast.success('Kursga muvaffaqiyatli yozildingiz!');
      setShowEnrollModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setEnrollLoading(null);
    }
  };

  const unenroll = async (courseId: number) => {
    try {
      await api.delete(`/enrollments/unenroll/${courseId}`);
      toast.success('Kursdan chiqildingiz');
      fetchAll();
    } catch { toast.error('Xato yuz berdi'); }
  };

  const getSubmission = (taskId: number) => submissions.find(s => s.taskId === taskId);
  const enrolledIds = enrollments.map(e => e.courseId);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Salom, <span className="text-indigo-400">{user?.fullName}</span> 👋</h1>
            <p className="text-slate-400 mt-1">Kurslar va topshiriqlaringiz</p>
          </div>
          <button onClick={openEnrollModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition font-medium">
            <Plus size={18} /> Kursga yozilish
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Kurslarim', value: enrollments.length, color: 'indigo', icon: BookOpen },
            { label: 'Topshiriqlar', value: tasks.length, color: 'green', icon: ClipboardList },
            { label: 'Bajarilgan', value: submissions.filter(s => s.status !== 'IN_PROGRESS').length, color: 'amber', icon: Check },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                <stat.icon size={20} className={`text-${stat.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Kurslarim */}
        {enrollments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Mening kurslarim</h2>
            <div className="flex flex-wrap gap-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
                  <BookOpen size={14} className="text-indigo-400" />
                  <span className="text-white text-sm">{e.courseName}</span>
                  <span className="text-slate-500 text-xs">{e.teacherName}</span>
                  <button onClick={() => unenroll(e.courseId)} className="text-slate-500 hover:text-red-400 transition ml-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['tasks', 'submissions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {tab === 'tasks' ? 'Topshiriqlar' : 'Mening ishlarim'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
        ) : activeTab === 'tasks' ? (
          tasks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Kursga yoziling va topshiriqlarni bajaring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => {
                const sub = getSubmission(task.id);
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/student/task/${task.id}`)}
                    className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                          <ClipboardList size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{task.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                            {sub && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 text-sm">{task.courseName}</span>
                            {task.deadline && (
                              <span className="flex items-center gap-1 text-slate-500 text-xs">
                                <Calendar size={11} /> {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub?.score != null && <span className="text-green-400 font-bold">{sub.score}/{task.maxScore}</span>}
                        <span className="text-slate-400 text-sm">{task.maxScore} ball</span>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          submissions.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-slate-400">Hali topshiriq topshirilmagan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, i) => (
                <motion.div key={sub.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{sub.taskTitle}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>
                        <span className="text-slate-400 text-xs">Halollik: {sub.integrityScore}%</span>
                      </div>
                    </div>
                    {sub.score != null && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{sub.score}</div>
                        <div className="text-slate-400 text-xs">ball</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Enroll Modal */}
        <AnimatePresence>
          {showEnrollModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Kursga yozilish</h3>
                  <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allCourses.map(course => {
                    const enrolled = enrolledIds.includes(course.id);
                    return (
                      <div key={course.id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
                        <div>
                          <div className="font-medium text-white">{course.name}</div>
                          <div className="text-slate-400 text-sm">{course.teacherName}</div>
                        </div>
                        <button
                          onClick={() => !enrolled && enroll(course.id)}
                          disabled={enrolled || enrollLoading === course.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                            enrolled ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}>
                          {enrollLoading === course.id ? <Loader size={14} className="animate-spin" /> : enrolled ? <><Check size={14} /> Yozilgan</> : '+ Yozilish'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentDashboard;