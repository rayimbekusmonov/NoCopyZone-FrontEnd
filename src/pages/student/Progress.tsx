import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Award, ClipboardList, Target } from 'lucide-react';

interface Submission { id: number; taskId: number; taskTitle: string; status: string; score?: number; integrityScore: number; submittedAt?: string; }

const Progress: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await api.get('/submissions/my');
    setSubmissions(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const graded = submissions.filter(s => s.status === 'GRADED' && s.score != null);
  const submitted = submissions.filter(s => s.status === 'SUBMITTED');
  const inProgress = submissions.filter(s => s.status === 'IN_PROGRESS');
  const avgScore = graded.length > 0 ? Math.round(graded.reduce((a, b) => a + (b.score || 0), 0) / graded.length) : 0;
  const avgIntegrity = submissions.length > 0 ? Math.round(submissions.reduce((a, b) => a + b.integrityScore, 0) / submissions.length) : 100;

  const statusData = [
    { name: 'Baholangan', value: graded.length, fill: '#22c55e' },
    { name: 'Topshirilgan', value: submitted.length, fill: '#6366f1' },
    { name: 'Jarayonda', value: inProgress.length, fill: '#f59e0b' },
  ];

  const scoreData = graded.slice(-10).map(s => ({
    name: s.taskTitle.length > 12 ? s.taskTitle.substring(0, 12) + '...' : s.taskTitle,
    ball: s.score,
    halollik: s.integrityScore,
  }));

  const integrityColor = avgIntegrity >= 80 ? '#22c55e' : avgIntegrity >= 50 ? '#f59e0b' : '#ef4444';

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Yuklanmoqda...</div></div>;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mening progressim</h1>
          <p className="text-slate-400 mt-1">O'zlashtirish va faollik statistikasi</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Jami topshiriq', value: submissions.length, icon: ClipboardList, color: 'blue' },
            { label: 'Baholangan', value: graded.length, icon: Award, color: 'green' },
            { label: "O'rtacha ball", value: avgScore, icon: Target, color: 'indigo' },
            { label: 'Halollik', value: `${avgIntegrity}%`, icon: TrendingUp, color: 'amber' },
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

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Status chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Topshiriqlar holati</h3>
            {submissions.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500">Ma'lumot yo'q</div>
            ) : (
              <div className="space-y-3">
                {statusData.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{d.name}</span>
                      <span className="text-white font-medium">{d.value}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${submissions.length > 0 ? (d.value / submissions.length) * 100 : 0}%`, backgroundColor: d.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Integrity gauge */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">O'rtacha halollik bali</h3>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={integrityColor} strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 50 * avgIntegrity / 100} ${2 * Math.PI * 50}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{avgIntegrity}</span>
                  <span className="text-slate-400 text-sm">/ 100</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm mt-2" style={{ color: integrityColor }}>
              {avgIntegrity >= 80 ? '🟢 Ajoyib!' : avgIntegrity >= 50 ? '🟡 Qoniqarli' : '🔴 Diqqat!'}
            </p>
          </motion.div>
        </div>

        {/* Score chart */}
        {scoreData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">So'nggi topshiriqlar natijalari</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="ball" fill="#6366f1" radius={[6, 6, 0, 0]} name="Ball" />
                <Bar dataKey="halollik" fill="#22c55e" radius={[6, 6, 0, 0]} name="Halollik" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Progress;