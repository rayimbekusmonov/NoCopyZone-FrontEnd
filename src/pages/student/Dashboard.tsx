import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, Calendar, ChevronRight,
  BookOpen, Check, Layers, Clock, Star
} from 'lucide-react';

interface Course {
  id: number; name: string; description: string; teacherName: string;
}
interface Task {
  id: number; title: string; type: string; courseName: string;
  courseId: number; deadline: string; maxScore: number;
}
interface Submission {
  id: number; taskId: number; taskTitle: string;
  status: string; integrityScore: number; score: number;
}

const typeColors: Record<string, string> = {
  LAB:   'bg-blue-500/20 text-blue-400',
  CODE:  'bg-green-500/20 text-green-400',
  QUIZ:  'bg-amber-500/20 text-amber-400',
  ESSAY: 'bg-teal-500/20 text-teal-400',
};

const typeIcons: Record<string, string> = {
  LAB: '🧪', CODE: '💻', QUIZ: '📝', ESSAY: '✍️',
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  SUBMITTED:   'bg-blue-500/20 text-blue-400',
  GRADED:      'bg-green-500/20 text-green-400',
};

const courseGradients = [
  'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
  'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'from-green-500/20 to-teal-500/20 border-green-500/30',
  'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  'from-violet-500/20 to-indigo-500/20 border-violet-500/30',
];

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');
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
          const res = await api.get(`/tasks/course/${course.id}`);
          allTasks.push(...res.data.map((t: Task) => ({ ...t, courseId: course.id })));
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

  // Har bir kurs uchun topshiriqlar soni va progress
  const getCourseStats = (courseId: number) => {
    const courseTasks = tasks.filter(t => t.courseId === courseId);
    const courseSubs = submissions.filter(s => courseTasks.some(t => t.id === s.taskId));
    const graded = courseSubs.filter(s => s.status === 'GRADED').length;
    const avgScore = graded > 0
      ? Math.round(courseSubs.filter(s => s.status === 'GRADED').reduce((a, b) => a + (b.score || 0), 0) / graded)
      : null;
    return { total: courseTasks.length, completed: courseSubs.length, graded, avgScore };
  };

  // Yaqin deadline topshiriqlar
  const upcomingTasks = tasks
    .filter(t => t.deadline && new Date(t.deadline) > new Date() && getSub(t.id)?.status !== 'SUBMITTED')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Salom, <span className="text-indigo-400">{user?.fullName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Bugungi holatni ko'ring</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Kurslarim', value: courses.length, icon: BookOpen, color: 'indigo' },
            { label: 'Topshiriqlar', value: tasks.length, icon: ClipboardList, color: 'blue' },
            { label: 'Bajarilgan', value: completedCount, icon: Check, color: 'amber' },
            { label: 'Baholangan', value: gradedCount, icon: Star, color: 'green' },
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

        {/* Courses grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Mening kurslarim</h2>
            {courses.length > 0 && (
              <span className="text-slate-400 text-sm">{courses.length} ta kurs</span>
            )}
          </div>

          {loading ? (
            <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
          ) : courses.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Guruhingizga hali kurs biriktirilmagan</p>
              <p className="text-slate-500 text-sm mt-2">Admin yoki o'qituvchi bilan bog'laning</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => {
                const stats = getCourseStats(course.id);
                const gradient = courseGradients[i % courseGradients.length];
                const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                return (
                  <motion.div key={course.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={() => navigate(`/student/course/${course.id}`)}
                    className={`relative bg-gradient-to-br ${gradient} border rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-all group overflow-hidden`}>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />

                    {/* Course name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                        📚
                      </div>
                      <ChevronRight size={18} className="text-white/40 group-hover:text-white/80 transition mt-1" />
                    </div>

                    <h3 className="font-bold text-white text-base mb-1 leading-tight">{course.name}</h3>
                    <p className="text-white/50 text-xs mb-4">{course.teacherName}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={11} /> {stats.total} topshiriq
                      </span>
                      <span className="flex items-center gap-1">
                        <Check size={11} /> {stats.completed} bajarilgan
                      </span>
                      {stats.avgScore != null && (
                        <span className="flex items-center gap-1">
                          <Star size={11} /> {stats.avgScore} ball
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-white/60 transition-all duration-700"
                        style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-white/40 text-xs">Progress</span>
                      <span className="text-white/60 text-xs font-medium">{progress}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        {upcomingTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-amber-400" /> Yaqin deadlinelar
            </h2>
            <div className="space-y-2">
              {upcomingTasks.map((task, i) => {
                const diff = new Date(task.deadline).getTime() - Date.now();
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                const timeLabel = days > 0 ? `${days} kun qoldi` : `${hours} soat qoldi`;
                const isUrgent = days === 0;

                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/student/task/${task.id}`)}
                    className={`flex items-center justify-between glass rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-500/40 transition group ${isUrgent ? 'border-red-500/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeIcons[task.type] || '📋'}</span>
                      <div>
                        <div className="text-white font-medium text-sm">{task.title}</div>
                        <div className="text-slate-400 text-xs">{task.courseName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-lg ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                      <span className={`text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                        {timeLabel}
                      </span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs: Tasks + Submissions */}
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {[
              { key: 'tasks', label: `Barcha topshiriqlar (${tasks.length})` },
              { key: 'submissions', label: `Ishlarim (${submissions.length})` },
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

          {activeTab === 'tasks' ? (
            filteredTasks.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">{courses.length === 0 ? 'Kursga yozilmagan' : 'Hali topshiriq yo\'q'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task, i) => {
                  const sub = getSub(task.id);
                  return (
                    <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/student/task/${task.id}`)}
                      className="glass rounded-2xl p-4 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{typeIcons[task.type] || '📋'}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white group-hover:text-indigo-400 transition text-sm">{task.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>{task.type}</span>
                              {sub && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-slate-400 text-xs">{task.courseName}</span>
                              {task.deadline && (
                                <span className="flex items-center gap-1 text-slate-500 text-xs">
                                  <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {sub?.score != null && <span className="text-green-400 font-bold text-sm">{sub.score}/{task.maxScore}</span>}
                          <span className="text-slate-500 text-xs">{task.maxScore} ball</span>
                          <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            submissions.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <Layers size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Hali topshiriq topshirilmagan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub, i) => (
                  <motion.div key={sub.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{sub.taskTitle}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>
                          <span className="text-slate-400 text-xs">Halollik: {sub.integrityScore}%</span>
                        </div>
                      </div>
                      {sub.score != null && (
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">{sub.score}</div>
                          <div className="text-slate-400 text-xs">ball</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;