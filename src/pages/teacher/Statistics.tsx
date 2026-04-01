import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Users, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';

interface Course { id: number; name: string; }
interface Task { id: number; title: string; type: string; courseId: number; }
interface SubmissionStat { submissionId: number; studentName: string; integrityScore: number; status: string; score?: number; highRiskEvents: number; }

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

const TeacherStatistics: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const coursesRes = await api.get('/courses/my');
      setCourses(coursesRes.data);
      const allTasks: Task[] = [];
      const allSubs: SubmissionStat[] = [];
      for (const course of coursesRes.data) {
        const tasksRes = await api.get(`/tasks/course/${course.id}`);
        const courseTasks = tasksRes.data.map((t: Task) => ({ ...t, courseId: course.id }));
        allTasks.push(...courseTasks);
        for (const task of courseTasks) {
          try {
            const subsRes = await api.get(`/proctor/task/${task.id}`);
            allSubs.push(...subsRes.data);
          } catch {}
        }
      }
      setTasks(allTasks);
      setAllSubmissions(allSubs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalStudents = new Set(allSubmissions.map(s => s.studentName)).size;
  const graded = allSubmissions.filter(s => s.status === 'GRADED');
  const submitted = allSubmissions.filter(s => s.status === 'SUBMITTED');
  const suspicious = allSubmissions.filter(s => s.highRiskEvents > 0);
  const avgScore = graded.length > 0 ? Math.round(graded.reduce((a, b) => a + (b.score || 0), 0) / graded.length) : 0;

  // Task type distribution
  const typeCount: Record<string, number> = {};
  tasks.forEach(t => { typeCount[t.type] = (typeCount[t.type] || 0) + 1; });
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Status distribution
  const statusData = [
    { name: 'Baholangan', value: graded.length },
    { name: 'Topshirilgan', value: submitted.length },
    { name: 'Jarayonda', value: allSubmissions.filter(s => s.status === 'IN_PROGRESS').length },
  ].filter(d => d.value > 0);

  // Course activity
  const courseActivity = courses.map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    topshiriqlar: tasks.filter(t => t.courseId === c.id).length,
  }));

  // Score distribution
  const scoreBuckets = [
    { name: '90-100', count: graded.filter(s => (s.score || 0) >= 90).length },
    { name: '75-89', count: graded.filter(s => (s.score || 0) >= 75 && (s.score || 0) < 90).length },
    { name: '60-74', count: graded.filter(s => (s.score || 0) >= 60 && (s.score || 0) < 75).length },
    { name: '0-59', count: graded.filter(s => (s.score || 0) < 60).length },
  ];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Yuklanmoqda...</div></div>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Statistika</h1>
          <p className="text-slate-400 mt-1">Kurslaringiz bo'yicha umumiy ko'rinish</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Kurslar', value: courses.length, icon: BookOpen, color: 'indigo' },
            { label: 'Talabalar', value: totalStudents, icon: Users, color: 'blue' },
            { label: 'Topshiriqlar', value: tasks.length, icon: ClipboardList, color: 'green' },
            { label: "O'rtacha ball", value: avgScore, icon: TrendingUp, color: 'amber' },
            { label: 'Shubhali', value: suspicious.length, icon: AlertTriangle, color: 'red' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center mb-3`}>
                <s.icon size={18} className={`text-${s.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Course activity */}
          {courseActivity.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Kurs faolligi</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={courseActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="topshiriqlar" fill="#6366f1" radius={[6, 6, 0, 0]} name="Topshiriqlar" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Type distribution */}
          {typeData.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Topshiriq turlari</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {typeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Status */}
          {statusData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Submission holati</h3>
              <div className="space-y-3">
                {statusData.map((d, i) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{d.name}</span>
                      <span className="text-white font-medium">{d.value}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${allSubmissions.length > 0 ? (d.value / allSubmissions.length) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Score distribution */}
          {graded.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ball taqsimoti</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={scoreBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} name="Talabalar soni" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherStatistics;