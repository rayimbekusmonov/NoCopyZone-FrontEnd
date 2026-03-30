import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import IntegrityGauge from '../../components/IntegrityGauge';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield, Clock } from 'lucide-react';

interface SubmissionReport {
  submissionId: number;
  studentName: string;
  studentEmail: string;
  integrityScore: number;
  status: string;
  highRiskEvents: number;
  mediumRiskEvents: number;
  logs: {
    id: number;
    eventType: string;
    severity: string;
    details: string;
    occurredAt: string;
  }[];
}

interface Task { id: number; title: string; type: string; }

const TeacherMonitoring: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reports, setReports] = useState<SubmissionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SubmissionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get(`/tasks/course/${courseId}`).then(res => setTasks(res.data));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [courseId]);

  const loadReports = async (taskId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/proctor/task/${taskId}`);
      setReports(res.data);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  const selectTask = (task: Task) => {
    setSelectedTask(task);
    setSelectedReport(null);
    loadReports(task.id);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => loadReports(task.id), 10000);
  };

  const severityColor: Record<string, string> = {
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Orqaga
          </button>
          <h1 className="text-2xl font-bold text-white">Real-time Monitoring</h1>
          <p className="text-slate-400 mt-1">Topshiriq tanlang va talabalarni kuzating</p>
        </motion.div>

        {/* Task selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {tasks.map(task => (
            <button key={task.id} onClick={() => selectTask(task)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedTask?.id === task.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              {task.title}
            </button>
          ))}
        </div>

        {!selectedTask ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Shield size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Monitoring uchun topshiriq tanlang</p>
          </div>
        ) : loading ? (
          <div className="text-slate-400 text-center py-12">Yuklanmoqda...</div>
        ) : reports.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">Hali hech qanday submission yo'q</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Student cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report, i) => (
                <motion.div
                  key={report.submissionId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedReport(report)}
                  className={`glass rounded-2xl p-5 cursor-pointer transition ${
                    selectedReport?.submissionId === report.submissionId
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : report.integrityScore < 50
                      ? 'border-red-500/30 hover:border-red-500/50'
                      : 'hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{report.studentName}</div>
                      <div className="text-xs text-slate-400">{report.studentEmail}</div>
                    </div>
                    <IntegrityGauge score={report.integrityScore} size={56} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {report.highRiskEvents > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                        <AlertTriangle size={10} /> {report.highRiskEvents} HIGH
                      </span>
                    )}
                    {report.mediumRiskEvents > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                        {report.mediumRiskEvents} MEDIUM
                      </span>
                    )}
                    {report.highRiskEvents === 0 && report.mediumRiskEvents === 0 && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Xavfsiz</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Log panel */}
            <AnimatePresence>
              {selectedReport && (
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  className="w-80 glass rounded-2xl p-5 h-fit sticky top-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">{selectedReport.studentName}</h3>
                    <IntegrityGauge score={selectedReport.integrityScore} size={48} />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedReport.logs.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">Hech qanday shubhali harakat yo'q</p>
                    ) : (
                      selectedReport.logs.map(log => (
                        <div key={log.id} className={`border rounded-xl p-3 ${severityColor[log.severity]}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{log.eventType}</span>
                            <span className="text-xs opacity-70">{log.severity}</span>
                          </div>
                          <p className="text-xs opacity-80">{log.details}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-60">
                            <Clock size={10} />
                            {new Date(log.occurredAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherMonitoring;