import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, ChevronRight, BookOpen, Check, Layers } from 'lucide-react';

interface Course { id: number; name: string; description: string; teacherName: string; }
interface Task { id: number; title: string; type: string; courseName: string; courseId: number; deadline: string; maxScore: number; }
interface Submission { id: number; taskId: number; taskTitle: string; status: string; integrityScore: number; score: number; }

const typeColors: Record<string, string> = {
  LAB: 'bg-blue-500/20 text-blue-400',
  CODE: 'bg-green-500/20 text-green-400',
  QUIZ: 'bg-amber-500/20 text-amber-400',
  ESSAY: 'bg-teal-500/20 text-teal-400',
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  SUBMITTED: 'bg-blue-500/20 text-blue-400',
  GRADED: 'bg-green-500/20 text-green-400',
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions' | 'courses'>('tasks');
  const [filterCourse, setFilterCourse] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [groupCoursesRes, subRes] = await Promise.all([
        api.get('/groups/my-courses').catch(() => ({ data: [] })),
        api.get('/submissions/my').catch(() => ({ data: [] })),
      ]);
      const myCourses: Course[] = groupCoursesRes.data;
      setCourses(myCourses);
      setSubmissions(subRes.data);

      const allTasks: Task[] = [];
      for (const course of myCourses) {
        try {
          const tasksRes = await api.get(`/tasks/course/${course.id}`);
          allTasks.push(...tasksRes.data.map((t: Task) => ({ ...t, courseId: course.id })));
        } catch {}
      }
      setTasks(allTasks);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getSub = (taskId: number) => submissions.find(s => s.taskId === taskId);
  const filteredTasks = filterCourse ? tasks.filter(t => t.courseId === filterCourse) : tasks;
  const completedCount = submissions.filter(s => s.status !== 'IN_PROGRESS').length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Salom, <span className="text-indigo-400">{user?.fullName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Kurslar va topshiriqlaringiz</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Kurslarim', value: courses.length, icon: BookOpen, color: 'indigo' },
            { label: 'Topshiriqlar', value: tasks.length, icon: ClipboardList, color: 'blue' },
            { label: 'Bajarilgan', value: completedCount, icon: Check, color: 'amber' },
            { label: 'Baholangan', value: gradedCount, icon: Layers, color: 'green' },
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

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {[
            { key: 'tasks', label: `Topshiriqlar (${tasks.length})` },
            { key: 'submissions', label: `Ishlarim (${submissions.length})` },
            { key: 'courses', label: `Kurslarim (${courses.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}

          {activeTab === 'tasks' && courses.length > 0 && (
            <div className="ml-auto flex gap-2 flex-wrap">
              <button onClick={() => setFilterCourse(null)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${!filterCourse ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                Hammasi
              </button>
              {courses.map(c => (
                <button key={c.id} onClick={() => setFilterCourse(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${filterCourse === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
        ) : activeTab === 'tasks' ? (
          filteredTasks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <ClipboardList size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {courses.length === 0
                  ? 'Guruhingizga hali kurs biriktirilmagan. Admin bilan bog\'laning.'
                  : 'Bu kursda hali topshiriq yo\'q'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task, i) => {
                const sub = getSub(task.id);
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/student/task/${task.id}`)}
                    className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                          <ClipboardList size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{task.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                            {sub && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 text-sm">{task.courseName}</span>
                            {task.deadline && (
                              <span className="flex items-center gap-1 text-slate-500 text-xs">
                                <Calendar size={11} /> {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {sub?.score != null && <span className="text-green-400 font-bold text-sm">{sub.score}/{task.maxScore}</span>}
                        <span className="text-slate-500 text-sm">{task.maxScore} ball</span>
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : activeTab === 'submissions' ? (
          submissions.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-slate-400">Hali topshiriq topshirilmagan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, i) => (
                <motion.div key={sub.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
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
        ) : (
          courses.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Guruhingizga hali kurs biriktirilmagan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/student/course/${course.id}`)}
                  className="glass rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 transition group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <BookOpen size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">{course.name}</h3>
                        <p className="text-slate-400 text-sm">{course.teacherName}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition" />
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;